import { getLocalReadModel } from '../../services/localReadModelService';
import { localFirstSyncService } from '../../services/localFirstSyncService';
import type { InventoryStatus, Item } from '../../../shared/types';
import type { LocalOperation, LocalOperationStatus } from '../../../shared/localFirst';

export type NativeSyncIssueGroupKey = 'attention' | 'pending' | 'syncing';

export interface NativeSyncIssueRow {
  id: string;
  group: NativeSyncIssueGroupKey;
  operationType: string;
  status: LocalOperationStatus;
  typeLabel: string;
  statusLabel: string;
  localNumber: string;
  createdAt: string;
  primaryText: string;
  secondaryText: string;
  dependencyCount: number;
  dependencyState: 'none' | 'waiting_for_parent' | 'ready';
  error?: NativeSyncIssueError;
  errorText?: string;
  helperText?: string;
}

export interface NativeSyncIssueError {
  code?: string;
  messagePreview?: string;
  hasFullMessage: boolean;
}

export interface NativeSyncIssueGroup {
  key: NativeSyncIssueGroupKey;
  title: string;
  description: string;
  rows: NativeSyncIssueRow[];
}

interface InventoryLookupItem {
  name: string;
  unit: string;
}

interface NativeSyncIssueContext {
  inventoryItemsById?: Map<string, InventoryLookupItem>;
  paymentAmountByOrderId?: Map<string, number>;
}

const ATTENTION_STATUSES = new Set<LocalOperationStatus>(['failed', 'conflicted', 'waiting_for_dependency']);

export function getNativeSyncStatusLabel(status: LocalOperationStatus): string {
  const labels: Record<LocalOperationStatus, string> = {
    pending: 'در انتظار همگام‌سازی',
    syncing: 'در حال همگام‌سازی',
    synced: 'همگام‌شده',
    failed: 'ناموفق',
    conflicted: 'دارای تعارض',
    waiting_for_dependency: 'منتظر عملیات وابسته'
  };

  return labels[status] || status;
}

export function getNativeSyncOperationTypeLabel(operationType: string): string {
  const labels: Record<string, string> = {
    'inventory.entry.create': 'سند انبار',
    'sales.order.create': 'سفارش فروش',
    'sales.payment.record_offline': 'پرداخت آفلاین',
    'sales.receipt.mark_printed_offline': 'چاپ رسید آفلاین',
    'master_data.upsert_draft': 'پیش‌نویس داده اصلی',
    'dangerous.action.request_approval': 'درخواست تایید'
  };

  return labels[operationType] || operationType;
}

export function summarizeNativeSyncOperation(
  operation: LocalOperation,
  context: NativeSyncIssueContext = {}
): NativeSyncIssueRow {
  const group = getNativeSyncGroup(operation.status);
  const base = {
    id: operation.localOperationId,
    group,
    operationType: operation.operationType,
    status: operation.status,
    typeLabel: getNativeSyncOperationTypeLabel(operation.operationType),
    statusLabel: getNativeSyncStatusLabel(operation.status),
    localNumber: operation.localNumber || operation.entityLocalId || operation.localOperationId,
    createdAt: operation.createdOfflineAt,
    dependencyCount: operation.dependsOn.length,
    dependencyState: getDependencyState(operation),
    error: getOperationError(operation),
    errorText: getOperationErrorText(operation),
    helperText: getOperationHelperText(operation)
  };

  if (operation.operationType === 'inventory.entry.create') {
    return {
      ...base,
      ...summarizeInventoryOperation(operation, context.inventoryItemsById)
    };
  }

  if (operation.operationType === 'sales.order.create') {
    return {
      ...base,
      ...summarizeSalesOrderOperation(operation, context.paymentAmountByOrderId)
    };
  }

  if (operation.operationType === 'sales.payment.record_offline') {
    return {
      ...base,
      ...summarizeOfflinePaymentOperation(operation)
    };
  }

  return {
    ...base,
    primaryText: getNativeSyncOperationTypeLabel(operation.operationType),
    secondaryText: `شناسه محلی: ${operation.entityLocalId || operation.localOperationId}`
  };
}

export async function loadNativeSyncIssueGroups(): Promise<NativeSyncIssueGroup[]> {
  const [operations, inventoryItemsById] = await Promise.all([
    localFirstSyncService.getUnsyncedOperations(),
    loadInventoryItemsById()
  ]);
  const paymentAmountByOrderId = getPaymentAmountByOrderId(operations);
  const rows = operations
    .map((operation) =>
      summarizeNativeSyncOperation(operation, {
        inventoryItemsById,
        paymentAmountByOrderId
      })
    )
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  return [
    {
      key: 'attention',
      title: 'نیازمند توجه',
      description: 'ناموفق، دارای تعارض یا منتظر عملیات وابسته',
      rows: rows.filter((row) => row.group === 'attention')
    },
    {
      key: 'pending',
      title: 'در انتظار همگام‌سازی',
      description: 'هنوز فقط روی این دستگاه ثبت شده است',
      rows: rows.filter((row) => row.group === 'pending')
    },
    {
      key: 'syncing',
      title: 'در حال همگام‌سازی',
      description: 'در تلاش جاری برای ارسال به سرور',
      rows: rows.filter((row) => row.group === 'syncing')
    }
  ];
}

function getNativeSyncGroup(status: LocalOperationStatus): NativeSyncIssueGroupKey {
  if (ATTENTION_STATUSES.has(status)) return 'attention';
  if (status === 'syncing') return 'syncing';
  return 'pending';
}

function getDependencyState(operation: LocalOperation): NativeSyncIssueRow['dependencyState'] {
  if (operation.dependsOn.length === 0) return 'none';
  if (operation.status === 'waiting_for_dependency') return 'waiting_for_parent';
  return 'ready';
}

function summarizeInventoryOperation(
  operation: LocalOperation,
  inventoryItemsById?: Map<string, InventoryLookupItem>
): Pick<NativeSyncIssueRow, 'primaryText' | 'secondaryText'> {
  const payload = asRecord(operation.payload);
  const itemId = stringValue(payload.itemId);
  const item = itemId ? inventoryItemsById?.get(itemId) : undefined;
  const movementType = payload.type === 'OUT' ? 'خروج' : 'ورود';
  const quantity = numberValue(payload.quantity);
  const unit = item?.unit || 'واحد';
  const itemName = item?.name || 'کالای ثبت‌شده';

  return {
    primaryText: `${movementType} ${itemName}`,
    secondaryText: `${formatNumber(quantity)} ${unit}، شماره سند ${operation.localNumber || operation.localOperationId}`
  };
}

function summarizeSalesOrderOperation(
  operation: LocalOperation,
  paymentAmountByOrderId?: Map<string, number>
): Pick<NativeSyncIssueRow, 'primaryText' | 'secondaryText'> {
  const payload = asRecord(operation.payload);
  const orderType = payload.orderType === 'TAKEAWAY' ? 'بیرون‌بر' : 'حضوری';
  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemCount = items.reduce((total, item) => total + numberValue(asRecord(item).quantity, 1), 0);
  const totalAmount = operation.entityLocalId ? paymentAmountByOrderId?.get(operation.entityLocalId) : undefined;
  const totalText = typeof totalAmount === 'number' ? `، مبلغ ${formatMoney(totalAmount)}` : '';

  return {
    primaryText: `سفارش ${orderType}`,
    secondaryText: `${formatNumber(itemCount)} قلم${totalText}، شماره ${operation.localNumber || operation.localOperationId}`
  };
}

function summarizeOfflinePaymentOperation(
  operation: LocalOperation
): Pick<NativeSyncIssueRow, 'primaryText' | 'secondaryText'> {
  const payload = asRecord(operation.payload);
  const method = payload.paymentMethod === 'CARD' ? 'کارت دستی' : 'نقدی';
  const amount = numberValue(payload.amount);
  const orderId = stringValue(payload.orderId) || operation.dependsOn[0] || 'نامشخص';

  return {
    primaryText: `پرداخت ${method}`,
    secondaryText: `${formatMoney(amount)}، برای سفارش ${orderId}، شماره ${operation.localNumber || operation.localOperationId}`
  };
}

function getOperationErrorText(operation: LocalOperation): string | undefined {
  if (operation.status !== 'failed' && operation.status !== 'conflicted') return undefined;
  const message = operation.errorMessage || operation.errorCode;
  if (!message) return operation.status === 'conflicted' ? 'نیازمند بررسی مدیر' : 'علت ناموفق بودن ثبت نشده است';
  return operation.errorCode ? `${operation.errorCode}: ${message}` : message;
}

function getOperationError(operation: LocalOperation): NativeSyncIssueError | undefined {
  if (operation.status !== 'failed' && operation.status !== 'conflicted') return undefined;

  return {
    code: operation.errorCode,
    messagePreview: createRedactedMessagePreview(operation.errorMessage),
    hasFullMessage: Boolean(operation.errorMessage && createRedactedMessagePreview(operation.errorMessage) !== operation.errorMessage)
  };
}

export function createRedactedMessagePreview(message?: string, maxLength = 240): string | undefined {
  if (!message) return undefined;

  const withoutStack = message
    .split(/\r?\n/)
    .filter((line) => !/^\s*at\s+/.test(line) && !/^\s*stack:/i.test(line))
    .join(' ')
    .trim();
  const redacted = withoutStack
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-token]')
    .replace(/\b(token|authorization|password|pin|secret)=([^&\s]+)/gi, '$1=[redacted]')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[redacted-value]');

  if (redacted.length <= maxLength) return redacted;
  return `${redacted.slice(0, maxLength - 1)}…`;
}

function getOperationHelperText(operation: LocalOperation): string | undefined {
  if (operation.status === 'failed') return 'با تلاش دوباره، همگام‌سازی این عملیات دوباره بررسی می‌شود.';
  if (operation.status === 'conflicted') return 'حل این تعارض نیازمند بررسی مدیر است.';
  if (operation.status === 'waiting_for_dependency') return 'پس از همگام‌شدن عملیات والد، این مورد دوباره بررسی می‌شود.';
  return undefined;
}

async function loadInventoryItemsById(): Promise<Map<string, InventoryLookupItem>> {
  const [itemsModel, currentModel] = await Promise.all([
    getLocalReadModel<Item[]>('inventory.items').catch(() => null),
    getLocalReadModel<InventoryStatus[]>('inventory.current').catch(() => null)
  ]);
  const currentByItemId = new Map((currentModel?.value || []).map((status) => [status.itemId, status]));

  return new Map(
    (itemsModel?.value || []).map((item) => {
      const status = currentByItemId.get(item.id);
      return [
        item.id,
        {
          name: item.name,
          unit: item.unit || status?.unit || 'واحد'
        }
      ];
    })
  );
}

function getPaymentAmountByOrderId(operations: LocalOperation[]): Map<string, number> {
  const payments = operations.filter((operation) => operation.operationType === 'sales.payment.record_offline');

  return new Map(
    payments
      .map((operation) => {
        const payload = asRecord(operation.payload);
        const orderId = stringValue(payload.orderId);
        if (!orderId) return null;
        return [orderId, numberValue(payload.amount)] as const;
      })
      .filter((entry): entry is readonly [string, number] => Boolean(entry))
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function formatNumber(value: number): string {
  return value.toLocaleString('fa-IR', {
    maximumFractionDigits: 3
  });
}

function formatMoney(value: number): string {
  return `${formatNumber(value)} تومان`;
}
