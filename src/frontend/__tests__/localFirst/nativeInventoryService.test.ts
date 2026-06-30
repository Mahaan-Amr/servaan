const isDesktopApp = jest.fn();
const getLocalReadModel = jest.fn();
const getLocalReadModelMeta = jest.fn();
const setLocalReadModel = jest.fn();
const getNativeOnlineLoginSnapshot = jest.fn();
const isNativeSnapshotValid = jest.fn();
const enqueueInventoryEntry = jest.fn();
const getIssueSummary = jest.fn();
const getPendingOperations = jest.fn();

jest.mock('../../services/desktopBridgeService', () => ({
  isDesktopApp
}));

jest.mock('../../services/localReadModelService', () => ({
  getLocalReadModel,
  getLocalReadModelMeta,
  setLocalReadModel
}));

jest.mock('../../services/nativeAuthSnapshotService', () => ({
  getNativeOnlineLoginSnapshot,
  isNativeSnapshotValid
}));

jest.mock('../../services/localFirstStorageService', () => ({
  localFirstStorage: {
    getPendingOperations
  }
}));

jest.mock('../../services/localFirstSyncService', () => ({
  localFirstSyncService: {
    enqueueInventoryEntry,
    getIssueSummary
  }
}));

const issueSummary = {
  pendingCount: 0,
  failedCount: 0,
  conflictedCount: 0,
  waitingForDependencyCount: 0
};

const cachedItems = [
  {
    id: 'item-1',
    name: 'برنج',
    category: 'خشکبار',
    unit: 'کیلوگرم',
    minStock: 5,
    isActive: true,
    createdAt: '2026-06-30T08:00:00.000Z',
    updatedAt: '2026-06-30T08:00:00.000Z'
  },
  {
    id: 'item-disabled',
    name: 'کالای غیرفعال',
    category: 'خشکبار',
    unit: 'عدد',
    isActive: false,
    createdAt: '2026-06-30T08:00:00.000Z',
    updatedAt: '2026-06-30T08:00:00.000Z'
  }
];

const cachedCurrent = [
  {
    itemId: 'item-1',
    itemName: 'برنج',
    category: 'خشکبار',
    unit: 'کیلوگرم',
    totalIn: 10,
    totalOut: 3,
    current: 7
  }
];

function mockReadModels() {
  getLocalReadModel.mockImplementation((key: string) => {
    if (key === 'inventory.items') {
      return Promise.resolve({ key, updatedAt: '2026-06-30T08:00:00.000Z', value: cachedItems });
    }

    if (key === 'inventory.current') {
      return Promise.resolve({ key, updatedAt: '2026-06-30T08:01:00.000Z', value: cachedCurrent });
    }

    return Promise.resolve(null);
  });

  getLocalReadModelMeta.mockImplementation((key: string) =>
    Promise.resolve({
      key,
      updatedAt: key === 'inventory.items' ? '2026-06-30T08:00:00.000Z' : '2026-06-30T08:01:00.000Z'
    })
  );
}

describe('native inventory service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    isDesktopApp.mockReturnValue(true);
    getNativeOnlineLoginSnapshot.mockResolvedValue({
      offlineAuthExpiresAt: '2026-07-07T08:00:00.000Z'
    });
    isNativeSnapshotValid.mockReturnValue(true);
    getIssueSummary.mockResolvedValue(issueSummary);
    getPendingOperations.mockResolvedValue([]);
    enqueueInventoryEntry.mockResolvedValue({
      localOperationId: 'local-op-1',
      localNumber: 'سند آفلاین-۱',
      actorUserId: 'user-1',
      tenantId: 'tenant-1',
      createdOfflineAt: '2026-06-30T08:10:00.000Z'
    });
    mockReadModels();
  });

  it('reports missing cache before exposing inventory data', async () => {
    getLocalReadModel.mockImplementation((key: string) => {
      if (key === 'inventory.items') return Promise.resolve(null);
      return Promise.resolve({ key, updatedAt: '2026-06-30T08:00:00.000Z', value: [] });
    });

    const { loadNativeInventorySnapshot } = await import('../../features/native-inventory/nativeInventoryService');
    const snapshot = await loadNativeInventorySnapshot();

    expect(snapshot.readiness).toMatchObject({
      kind: 'missing-cache',
      missing: ['inventory.items']
    });
    expect(snapshot.items).toEqual([]);
  });

  it('blocks native inventory when offline auth is expired', async () => {
    isNativeSnapshotValid.mockReturnValue(false);
    getNativeOnlineLoginSnapshot.mockResolvedValue({
      offlineAuthExpiresAt: '2026-06-01T08:00:00.000Z'
    });

    const { loadNativeInventorySnapshot } = await import('../../features/native-inventory/nativeInventoryService');
    const snapshot = await loadNativeInventorySnapshot();

    expect(snapshot.readiness).toMatchObject({
      kind: 'offline-auth-expired',
      expiresAt: '2026-06-01T08:00:00.000Z'
    });
    expect(getLocalReadModel).not.toHaveBeenCalledWith('inventory.items');
  });

  it('normalizes active cached items with estimated stock and pending inventory count', async () => {
    getPendingOperations.mockResolvedValue([
      { operationType: 'inventory.entry.create', status: 'pending' },
      { operationType: 'sales.order.create', status: 'pending' }
    ]);

    const { loadNativeInventorySnapshot } = await import('../../features/native-inventory/nativeInventoryService');
    const snapshot = await loadNativeInventorySnapshot();

    expect(snapshot.readiness).toMatchObject({
      kind: 'ready',
      updatedAt: '2026-06-30T08:00:00.000Z'
    });
    expect(snapshot.items).toEqual([
      {
        id: 'item-1',
        name: 'برنج',
        category: 'خشکبار',
        unit: 'کیلوگرم',
        minStock: 5,
        current: 7
      }
    ]);
    expect(snapshot.pendingInventoryCount).toBe(1);
  });

  it('queues one stock IN entry and updates estimated local stock immediately', async () => {
    const { submitNativeInventoryEntry } = await import('../../features/native-inventory/nativeInventoryService');
    const result = await submitNativeInventoryEntry({
      itemId: 'item-1',
      type: 'IN',
      quantity: 2.5,
      note: 'خرید'
    });

    expect(enqueueInventoryEntry).toHaveBeenCalledWith({
      itemId: 'item-1',
      type: 'IN',
      quantity: 2.5,
      note: 'خرید'
    });
    expect(setLocalReadModel).toHaveBeenCalledWith('inventory.current', [
      {
        ...cachedCurrent[0],
        totalIn: 12.5,
        totalOut: 3,
        current: 9.5
      }
    ]);
    expect(result).toMatchObject({
      itemName: 'برنج',
      type: 'IN',
      quantity: 2.5,
      unit: 'کیلوگرم',
      estimatedStock: 9.5,
      localNumber: 'سند آفلاین-۱'
    });
  });

  it('allows stock OUT to make estimated local stock negative', async () => {
    const { submitNativeInventoryEntry } = await import('../../features/native-inventory/nativeInventoryService');
    const result = await submitNativeInventoryEntry({
      itemId: 'item-1',
      type: 'OUT',
      quantity: 9
    });

    expect(enqueueInventoryEntry).toHaveBeenCalledWith({
      itemId: 'item-1',
      type: 'OUT',
      quantity: 9,
      note: undefined
    });
    expect(setLocalReadModel).toHaveBeenCalledWith('inventory.current', [
      {
        ...cachedCurrent[0],
        totalIn: 10,
        totalOut: 12,
        current: -2
      }
    ]);
    expect(result.estimatedStock).toBe(-2);
  });

  it('rejects invalid movement input', async () => {
    const { submitNativeInventoryEntry } = await import('../../features/native-inventory/nativeInventoryService');

    await expect(
      submitNativeInventoryEntry({
        itemId: 'item-1',
        type: 'IN',
        quantity: 0
      })
    ).rejects.toThrow('مقدار باید بزرگ‌تر از صفر باشد.');

    await expect(
      submitNativeInventoryEntry({
        itemId: 'item-disabled',
        type: 'IN',
        quantity: 1
      })
    ).rejects.toThrow('کالای انتخاب‌شده در کش بومی پیدا نشد.');
  });
});
