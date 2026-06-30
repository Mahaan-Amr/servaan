import { LocalFirstSyncService } from '../../src/services/localFirstSyncService';
import { LocalOperation } from '../../../shared/localFirst';
import { prisma } from '../../src/services/dbService';

jest.mock('../../src/services/dbService', () => ({
  prisma: {
    offlineDevice: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    syncOperation: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    syncConflict: {
      create: jest.fn()
    },
    inventoryEntry: {
      create: jest.fn()
    }
  }
}));

jest.mock('../../src/services/orderService', () => ({
  OrderService: {
    createOrder: jest.fn(),
    generatePaymentNumber: jest.fn()
  }
}));

const prismaMock = prisma as any;

function operation(overrides: Partial<LocalOperation> = {}): LocalOperation {
  return {
    localOperationId: 'local_op_1',
    deviceId: 'device_1',
    tenantId: 'tenant_1',
    workspaceId: 'inventory-management',
    entityType: 'inventoryEntry',
    operationType: 'inventory.entry.create',
    payload: {
      itemId: 'item_1',
      quantity: 3,
      type: 'OUT',
      note: 'offline removal'
    },
    dependsOn: [],
    status: 'pending',
    retryCount: 0,
    createdOfflineAt: '2026-06-27T12:00:00.000Z',
    actorUserId: 'user_1',
    localNumber: 'سند آفلاین-۱',
    ...overrides
  };
}

describe('LocalFirstSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.offlineDevice.findUnique.mockResolvedValue({
      id: 'offline_device_1',
      tenantId: 'tenant_1',
      deviceId: 'device_1',
      name: 'Desktop',
      platform: 'windows',
      appVersion: null,
      syncProtocolVersion: 1,
      localSchemaVersion: 1,
      mode: 'personal',
      assignedUserId: 'user_1',
      lastOnlineAt: new Date(),
      lastSyncAt: null,
      offlineAuthExpiresAt: new Date(Date.now() + 86400000),
      isActive: true,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    prismaMock.syncOperation.findUnique.mockResolvedValue(null);
    prismaMock.offlineDevice.update.mockResolvedValue({} as any);
  });

  it('syncs offline inventory OUT as a negative append-only entry with source metadata', async () => {
    prismaMock.inventoryEntry.create.mockResolvedValue({ id: 'entry_1' } as any);
    prismaMock.syncOperation.create.mockResolvedValue({} as any);

    const result = await LocalFirstSyncService.pushOperations({
      tenantId: 'tenant_1',
      actorUserId: 'user_1',
      deviceId: 'device_1',
      operations: [operation()]
    });

    expect(result.accepted).toEqual([
      {
        localOperationId: 'local_op_1',
        entityType: 'inventoryEntry',
        entityLocalId: undefined,
        entityServerId: 'entry_1'
      }
    ]);
    expect(prismaMock.inventoryEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant_1',
        itemId: 'item_1',
        quantity: -3,
        type: 'OUT',
        userId: 'user_1',
        sourceDeviceId: 'device_1',
        sourceLocalOperationId: 'local_op_1',
        sourceLocalNumber: 'سند آفلاین-۱'
      })
    });
  });

  it('rejects invalid inventory operations and records the failure', async () => {
    prismaMock.syncOperation.create.mockResolvedValue({} as any);

    const result = await LocalFirstSyncService.pushOperations({
      tenantId: 'tenant_1',
      actorUserId: 'user_1',
      deviceId: 'device_1',
      operations: [
        operation({
          payload: {
            itemId: 'item_1',
            quantity: 0,
            type: 'OUT'
          }
        })
      ]
    });

    expect(result.rejected).toEqual([
      {
        localOperationId: 'local_op_1',
        errorCode: 'INVALID_INVENTORY_ENTRY',
        errorMessage: 'Inventory entry payload is invalid.'
      }
    ]);
    expect(prismaMock.inventoryEntry.create).not.toHaveBeenCalled();
    expect(prismaMock.syncOperation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'rejected',
        errorCode: 'INVALID_INVENTORY_ENTRY'
      })
    });
  });
});
