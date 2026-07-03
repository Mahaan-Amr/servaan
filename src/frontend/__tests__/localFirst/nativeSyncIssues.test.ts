import {
  createRedactedMessagePreview,
  getNativeSyncOperationTypeLabel,
  getNativeSyncStatusLabel,
  summarizeNativeSyncOperation
} from '../../features/native-sync/nativeSyncIssues';
import type { LocalOperation } from '../../../shared/localFirst';

function operation(overrides: Partial<LocalOperation> = {}): LocalOperation {
  return {
    localOperationId: 'local_op_1',
    deviceId: 'device_1',
    tenantId: 'tenant_1',
    workspaceId: 'inventory-management',
    entityType: 'inventoryEntry',
    operationType: 'inventory.entry.create',
    payload: {},
    dependsOn: [],
    status: 'pending',
    retryCount: 0,
    createdOfflineAt: '2026-07-01T08:30:00.000Z',
    actorUserId: 'user_1',
    localNumber: 'INV-OFF-1',
    ...overrides
  };
}

describe('native sync issue summaries', () => {
  it('labels operation statuses in Persian', () => {
    expect(getNativeSyncStatusLabel('pending')).toBe('در انتظار همگام‌سازی');
    expect(getNativeSyncStatusLabel('failed')).toBe('ناموفق');
    expect(getNativeSyncStatusLabel('conflicted')).toBe('دارای تعارض');
    expect(getNativeSyncStatusLabel('waiting_for_dependency')).toBe('منتظر عملیات وابسته');
  });

  it('labels known operation types in Persian', () => {
    expect(getNativeSyncOperationTypeLabel('inventory.entry.create')).toBe('سند انبار');
    expect(getNativeSyncOperationTypeLabel('sales.order.create')).toBe('سفارش فروش');
    expect(getNativeSyncOperationTypeLabel('sales.payment.record_offline')).toBe('پرداخت آفلاین');
  });

  it('summarizes inventory IN and OUT rows with item name, movement, quantity, unit, and local number', () => {
    const inventoryItemsById = new Map([
      [
        'item_1',
        {
          name: 'برنج',
          unit: 'کیلوگرم'
        }
      ]
    ]);

    const row = summarizeNativeSyncOperation(
      operation({
        payload: {
          itemId: 'item_1',
          type: 'OUT',
          quantity: 2.5
        }
      }),
      { inventoryItemsById }
    );

    expect(row.group).toBe('pending');
    expect(row.primaryText).toBe('خروج برنج');
    expect(row.secondaryText).toContain('۲٫۵ کیلوگرم');
    expect(row.secondaryText).toContain('INV-OFF-1');
  });

  it('summarizes POS orders with order type, item count, total amount, and local number', () => {
    const row = summarizeNativeSyncOperation(
      operation({
        workspaceId: 'ordering-sales-system',
        entityType: 'order',
        entityLocalId: 'local_order_1',
        operationType: 'sales.order.create',
        localNumber: 'ORD-OFF-1',
        payload: {
          orderType: 'TAKEAWAY',
          items: [
            { itemId: 'menu_1', quantity: 2 },
            { itemId: 'menu_2', quantity: 1 }
          ]
        }
      }),
      {
        paymentAmountByOrderId: new Map([['local_order_1', 450000]])
      }
    );

    expect(row.primaryText).toBe('سفارش بیرون‌بر');
    expect(row.secondaryText).toContain('۳ قلم');
    expect(row.secondaryText).toContain('۴۵۰٬۰۰۰ تومان');
    expect(row.secondaryText).toContain('ORD-OFF-1');
  });

  it('summarizes offline payments with method, amount, and linked order id', () => {
    const row = summarizeNativeSyncOperation(
      operation({
        workspaceId: 'ordering-sales-system',
        entityType: 'payment',
        operationType: 'sales.payment.record_offline',
        localNumber: 'PAY-OFF-1',
        payload: {
          orderId: 'local_order_1',
          paymentMethod: 'CARD',
          amount: 120000
        }
      })
    );

    expect(row.primaryText).toBe('پرداخت کارت دستی');
    expect(row.secondaryText).toContain('۱۲۰٬۰۰۰ تومان');
    expect(row.secondaryText).toContain('local_order_1');
    expect(row.secondaryText).toContain('PAY-OFF-1');
  });

  it('puts failed, conflicted, and dependency-wait rows in the attention group with helper text', () => {
    const failed = summarizeNativeSyncOperation(
      operation({
        status: 'failed',
        errorCode: 'NETWORK',
        errorMessage: 'اتصال برقرار نشد'
      })
    );
    const conflicted = summarizeNativeSyncOperation(operation({ status: 'conflicted' }));
    const waiting = summarizeNativeSyncOperation(operation({ status: 'waiting_for_dependency' }));

    expect(failed.group).toBe('attention');
    expect(failed.errorText).toBe('NETWORK: اتصال برقرار نشد');
    expect(failed.helperText).toContain('تلاش دوباره');
    expect(conflicted.group).toBe('attention');
    expect(conflicted.helperText).toContain('مدیر');
    expect(waiting.group).toBe('attention');
    expect(waiting.helperText).toContain('عملیات والد');
  });

  it('includes dependency metadata without parent ids', () => {
    const row = summarizeNativeSyncOperation(
      operation({
        status: 'waiting_for_dependency',
        dependsOn: ['local_order_sensitive_parent']
      })
    );

    expect(row.dependencyCount).toBe(1);
    expect(row.dependencyState).toBe('waiting_for_parent');
    expect(JSON.stringify(row)).not.toContain('local_order_sensitive_parent');
  });

  it('redacts and truncates error message previews', () => {
    const preview = createRedactedMessagePreview(
      `Request failed Bearer abc.def.ghi token=secret123 ${'x'.repeat(260)}\n    at doWork(file.ts:1)`
    );

    expect(preview).toContain('Bearer [redacted]');
    expect(preview).toContain('token=[redacted]');
    expect(preview).not.toContain('abc.def.ghi');
    expect(preview).not.toContain('secret123');
    expect(preview).not.toContain('doWork');
    expect(preview?.length).toBeLessThanOrEqual(240);
  });

  it('summarizes unknown operations without exposing raw payloads', () => {
    const row = summarizeNativeSyncOperation(
      operation({
        operationType: 'custom.operation',
        entityLocalId: 'local_custom_1',
        payload: {
          secret: 'hidden'
        }
      })
    );

    expect(row.typeLabel).toBe('custom.operation');
    expect(row.primaryText).toBe('custom.operation');
    expect(row.secondaryText).toContain('local_custom_1');
    expect(row.secondaryText).not.toContain('hidden');
  });
});
