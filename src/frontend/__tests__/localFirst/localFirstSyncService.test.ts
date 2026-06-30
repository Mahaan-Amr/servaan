const getPendingOperations = jest.fn();
const updateOperations = jest.fn();
const saveEntityMappings = jest.fn();
const markSynced = jest.fn();
const markFailed = jest.fn();
const markConflicted = jest.fn();
const getDefaultDevice = jest.fn();
const saveDevice = jest.fn();
const apiPost = jest.fn();

jest.mock('../../services/localFirstStorageService', () => ({
  localFirstStorage: {
    getDefaultDevice,
    saveDevice,
    getPendingOperations,
    updateOperations,
    saveEntityMappings,
    markSynced,
    markFailed,
    markConflicted,
    getIssueSummary: jest.fn()
  }
}));

jest.mock('../../lib/apiClient', () => ({
  apiClient: {
    post: apiPost
  }
}));

jest.mock('../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ id: 'user_1', tenantId: 'tenant_1' }))
}));

jest.mock('../../services/desktopBridgeService', () => ({
  isDesktopApp: jest.fn(() => false)
}));

jest.mock('../../services/nativeAuthSnapshotService', () => ({
  getNativeOnlineLoginSnapshot: jest.fn(),
  isNativeSnapshotValid: jest.fn(() => true)
}));

function operation(overrides: Record<string, unknown>) {
  return {
    localOperationId: 'op_1',
    deviceId: 'device_1',
    tenantId: 'tenant_1',
    workspaceId: 'ordering-sales-system',
    entityType: 'order',
    operationType: 'sales.order.create',
    payload: {},
    dependsOn: [],
    status: 'pending',
    retryCount: 0,
    createdOfflineAt: '2026-06-27T12:00:00.000Z',
    actorUserId: 'user_1',
    ...overrides
  };
}

describe('local-first sync service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true
    });
    getDefaultDevice.mockResolvedValue({
      deviceId: 'device_1',
      tenantId: 'tenant_1',
      name: 'Register',
      platform: 'web',
      syncProtocolVersion: 1,
      localSchemaVersion: 1,
      mode: 'personal'
    });
  });

  it('drains newly-ready dependent operations in one sync call', async () => {
    const order = operation({
      localOperationId: 'local_order_1',
      entityLocalId: 'local_order_1',
      entityType: 'order',
      operationType: 'sales.order.create'
    });
    const blockedPayment = operation({
      localOperationId: 'local_payment_1',
      entityLocalId: 'local_payment_1',
      entityType: 'payment',
      operationType: 'sales.payment.record_offline',
      payload: { orderId: 'local_order_1' },
      dependsOn: ['local_order_1'],
      createdOfflineAt: '2026-06-27T12:01:00.000Z'
    });
    const mappedPayment = {
      ...blockedPayment,
      payload: { orderId: 'server_order_1' },
      dependsOn: ['local_order_1']
    };

    getPendingOperations
      .mockResolvedValueOnce([order, blockedPayment])
      .mockResolvedValueOnce([mappedPayment])
      .mockResolvedValueOnce([]);

    apiPost
      .mockResolvedValueOnce({
        accepted: [{ localOperationId: 'local_order_1', entityServerId: 'server_order_1' }],
        rejected: [],
        conflicted: [],
        entityMappings: [{ entityType: 'order', localId: 'local_order_1', serverId: 'server_order_1' }],
        newCursor: 'cursor_1'
      })
      .mockResolvedValueOnce({
        accepted: [{ localOperationId: 'local_payment_1', entityServerId: 'server_payment_1' }],
        rejected: [],
        conflicted: [],
        entityMappings: [],
        newCursor: 'cursor_2'
      });

    const { localFirstSyncService } = await import('../../services/localFirstSyncService');
    const result = await localFirstSyncService.syncNow();

    expect(apiPost).toHaveBeenCalledTimes(2);
    expect(apiPost.mock.calls[0][1].operations).toEqual([order]);
    expect(apiPost.mock.calls[1][1].operations).toEqual([mappedPayment]);
    expect(result?.accepted).toHaveLength(2);
    expect(markSynced).toHaveBeenCalledWith('local_order_1', 'server_order_1');
    expect(markSynced).toHaveBeenCalledWith('local_payment_1', 'server_payment_1');
  });
});
