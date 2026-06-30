import {
  applyEntityMappings,
  createOfflineInventoryDocumentNumber,
  createOfflineNumber,
  createOfflineReceiptNumber,
  getReadyOperations,
  LocalOperation,
  markDependencyWaits,
  summarizeSyncIssues,
  toPersianDigits
} from '../../../shared/localFirst';

function operation(overrides: Partial<LocalOperation>): LocalOperation {
  return {
    localOperationId: overrides.localOperationId || 'op_1',
    deviceId: 'device_1',
    tenantId: 'tenant_1',
    workspaceId: 'inventory-management',
    entityType: 'inventoryEntry',
    operationType: 'inventory.entry.create',
    payload: {},
    dependsOn: [],
    status: 'pending',
    retryCount: 0,
    createdOfflineAt: '2026-06-10T08:00:00.000Z',
    actorUserId: 'user_1',
    ...overrides
  };
}

describe('local-first queue helpers', () => {
  it('uploads operations in dependency order and waits for parents', () => {
    const parent = operation({
      localOperationId: 'local_order_1',
      workspaceId: 'ordering-sales-system',
      entityType: 'order',
      operationType: 'sales.order.create',
      createdOfflineAt: '2026-06-10T08:00:00.000Z'
    });
    const child = operation({
      localOperationId: 'local_payment_1',
      workspaceId: 'ordering-sales-system',
      entityType: 'payment',
      operationType: 'sales.payment.record_offline',
      dependsOn: ['local_order_1'],
      createdOfflineAt: '2026-06-10T08:01:00.000Z'
    });

    expect(getReadyOperations([child, parent]).map((item) => item.localOperationId)).toEqual(['local_order_1']);
    expect(markDependencyWaits([child, parent]).find((item) => item.localOperationId === 'local_payment_1')?.status).toBe(
      'waiting_for_dependency'
    );
  });

  it('applies entity mappings into dependent payloads', () => {
    const mapped = applyEntityMappings(
      [
        operation({
          localOperationId: 'local_payment_1',
          entityType: 'payment',
          payload: { orderId: 'local_order_1' }
        })
      ],
      [{ entityType: 'order', localId: 'local_order_1', serverId: 'server_order_99' }]
    );

    expect(mapped[0].payload).toEqual({ orderId: 'server_order_99' });
  });

  it('retries operations that were left syncing after a failed network call', () => {
    const stuck = operation({
      localOperationId: 'local_order_1',
      status: 'syncing',
      workspaceId: 'ordering-sales-system',
      entityType: 'order',
      operationType: 'sales.order.create'
    });

    expect(getReadyOperations([stuck]).map((item) => item.localOperationId)).toEqual(['local_order_1']);
    expect(markDependencyWaits([stuck])[0].status).toBe('pending');
  });

  it('unblocks waiting child operations after the parent is synced', () => {
    const syncedParent = operation({
      localOperationId: 'local_order_1',
      entityLocalId: 'local_order_1',
      entityServerId: 'server_order_1',
      status: 'synced',
      workspaceId: 'ordering-sales-system',
      entityType: 'order',
      operationType: 'sales.order.create'
    });
    const waitingPayment = operation({
      localOperationId: 'local_payment_1',
      status: 'waiting_for_dependency',
      workspaceId: 'ordering-sales-system',
      entityType: 'payment',
      operationType: 'sales.payment.record_offline',
      payload: { orderId: 'server_order_1' },
      dependsOn: ['local_order_1']
    });

    expect(getReadyOperations([syncedParent, waitingPayment]).map((item) => item.localOperationId)).toEqual([
      'local_payment_1'
    ]);
    expect(markDependencyWaits([syncedParent, waitingPayment])[1].status).toBe('pending');
  });

  it('summarizes sync issue counts', () => {
    expect(
      summarizeSyncIssues([
        operation({ localOperationId: 'a', status: 'pending' }),
        operation({ localOperationId: 'b', status: 'failed' }),
        operation({ localOperationId: 'c', status: 'conflicted' }),
        operation({ localOperationId: 'd', status: 'waiting_for_dependency' })
      ])
    ).toEqual({
      pendingCount: 1,
      failedCount: 1,
      conflictedCount: 1,
      waitingForDependencyCount: 1
    });
  });
});

describe('offline Persian numbering', () => {
  it('formats temporary offline numbers with Persian digits', () => {
    expect(toPersianDigits(123)).toBe('۱۲۳');
    expect(createOfflineNumber(123)).toBe('آفلاین-۱۲۳');
    expect(createOfflineReceiptNumber(123)).toBe('رسید آفلاین-۱۲۳');
    expect(createOfflineInventoryDocumentNumber(123)).toBe('سند آفلاین-۱۲۳');
  });
});
