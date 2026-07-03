import { getLocalReadModel, getLocalReadModelMeta } from '../../services/localReadModelService';
import { localFirstSyncService } from '../../services/localFirstSyncService';
import { getNativeOnlineLoginSnapshot, isNativeSnapshotValid } from '../../services/nativeAuthSnapshotService';
import { isDesktopApp, printDesktopReceiptText } from '../../services/desktopBridgeService';
import type { CreateOrderRequest, OrderingSettings, ProcessPaymentRequest } from '../../services/orderingService';
import { OrderType, PaymentMethod, type MenuCategory, type MenuItem, type Table } from '../../types/ordering';
import type {
  NativePosCacheKey,
  NativePosMenuCategory,
  NativePosPaidOrderInput,
  NativePosPaidOrderResult,
  NativePosSnapshot,
  NativePosTable
} from './nativePosTypes';

const REQUIRED_KEYS: NativePosCacheKey[] = ['sales.menu', 'sales.tables', 'sales.settings'];
const RECEIPT_WIDTH = 42;

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getItemName(item: MenuItem): string {
  return item.displayName || item.item?.name || 'Unnamed item';
}

function normalizeMenu(categories: MenuCategory[] | null): NativePosMenuCategory[] {
  return (categories || [])
    .filter((category) => category.isActive !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: (category.items || [])
        .filter((item) => item.isActive !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((item) => ({
          id: item.id,
          name: getItemName(item),
          price: parsePrice(item.menuPrice),
          categoryId: category.id,
          description: item.description || item.shortDesc || undefined,
          available: item.isAvailable !== false && item.isActive !== false
        }))
    }));
}

function normalizeTables(tables: Table[] | null): NativePosTable[] {
  return (tables || [])
    .filter((table) => table.isActive !== false)
    .map((table) => ({
      id: table.id,
      label: table.tableName || `Table ${table.tableNumber}`,
      status: table.status
    }));
}

async function getMissingKeys(): Promise<NativePosCacheKey[]> {
  const checks = await Promise.all(
    REQUIRED_KEYS.map(async (key) => ({
      key,
      exists: Boolean(await getLocalReadModel(key))
    }))
  );
  return checks.filter((check) => !check.exists).map((check) => check.key);
}

async function getOldestUpdatedAt(): Promise<string | null> {
  const metas = await Promise.all(REQUIRED_KEYS.map((key) => getLocalReadModelMeta(key)));
  const timestamps = metas
    .map((meta) => meta?.updatedAt)
    .filter((updatedAt): updatedAt is string => Boolean(updatedAt))
    .sort();
  return timestamps[0] || null;
}

export async function loadNativePosSnapshot(): Promise<NativePosSnapshot> {
  if (!isDesktopApp()) {
    return {
      readiness: {
        kind: 'not-native',
        message: 'Native POS is available only in the desktop app.'
      },
      categories: [],
      tables: [],
      settings: null,
      syncIssues: await localFirstSyncService.getIssueSummary()
    };
  }

  const snapshot = await getNativeOnlineLoginSnapshot();
  if (!isNativeSnapshotValid(snapshot)) {
    return {
      readiness: {
        kind: 'offline-auth-expired',
        expiresAt: snapshot?.offlineAuthExpiresAt,
        message: 'Offline login has expired. Reconnect and sign in again.'
      },
      categories: [],
      tables: [],
      settings: null,
      syncIssues: await localFirstSyncService.getIssueSummary()
    };
  }

  const missing = await getMissingKeys();
  if (missing.length > 0) {
    return {
      readiness: {
        kind: 'missing-cache',
        missing,
        message: 'Initial sync is required before native POS can start.'
      },
      categories: [],
      tables: [],
      settings: null,
      syncIssues: await localFirstSyncService.getIssueSummary()
    };
  }

  const [menuModel, tablesModel, settingsModel, updatedAt, syncIssues] = await Promise.all([
    getLocalReadModel<MenuCategory[]>('sales.menu'),
    getLocalReadModel<Table[]>('sales.tables'),
    getLocalReadModel<OrderingSettings>('sales.settings'),
    getOldestUpdatedAt(),
    localFirstSyncService.getIssueSummary()
  ]);

  return {
    readiness: {
      kind: 'ready',
      updatedAt: updatedAt || new Date().toISOString(),
      stale: false
    },
    categories: normalizeMenu(menuModel?.value || []),
    tables: normalizeTables(tablesModel?.value || []),
    settings: settingsModel?.value || null,
    syncIssues
  };
}

export async function submitNativePosPaidOrder(input: NativePosPaidOrderInput): Promise<NativePosPaidOrderResult> {
  if (input.orderType !== 'DINE_IN' && input.orderType !== 'TAKEAWAY') {
    throw new Error('Native POS V1 supports only dine-in and takeaway orders.');
  }

  if (input.items.length === 0) {
    throw new Error('Order cart is empty.');
  }

  if (input.payment.method !== 'cash' && input.payment.method !== 'manual-card') {
    throw new Error('Native POS V1 supports only cash and manual-card payments.');
  }

  const orderData: CreateOrderRequest = {
    orderType: input.orderType === 'DINE_IN' ? OrderType.DINE_IN : OrderType.TAKEAWAY,
    tableId: input.orderType === 'DINE_IN' ? input.tableId : undefined,
    guestCount: input.orderType === 'DINE_IN' ? input.guestCount : undefined,
    customerName: input.customerName || undefined,
    customerPhone: input.customerPhone || undefined,
    notes: input.notes || undefined,
    items: input.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      specialRequest: item.specialRequest
    }))
  };

  const orderOperation = await localFirstSyncService.enqueueSalesOrder(orderData);
  const orderLocalId = orderOperation.entityLocalId;
  if (!orderLocalId) {
    throw new Error('Order local id was not created.');
  }

  const paymentData: ProcessPaymentRequest = {
    orderId: orderLocalId,
    amount: input.payment.amount,
    paymentMethod: input.payment.method === 'cash' ? PaymentMethod.CASH : PaymentMethod.CARD,
    cashReceived: input.payment.method === 'cash' ? input.payment.cashReceived || input.payment.amount : undefined,
    cardInfo:
      input.payment.method === 'manual-card'
        ? {
            terminalId: input.payment.manualCard?.terminalId || 'manual-card',
            transactionRef: input.payment.manualCard?.transactionRef,
            cardMask: input.payment.manualCard?.cardMask
          }
        : undefined
  };

  const paymentOperation = await localFirstSyncService.enqueueOfflinePayment(paymentData);
  const paymentLocalId = paymentOperation.entityLocalId;
  if (!paymentLocalId) {
    throw new Error('Payment local id was not created.');
  }

  const result: NativePosPaidOrderResult = {
    orderOperation,
    paymentOperation,
    orderLocalId,
    paymentLocalId,
    orderNumber: orderOperation.localNumber,
    paymentNumber: paymentOperation.localNumber,
    receipt: {
      status: 'not_configured',
      printerName: input.receipt?.printerName?.trim() || undefined,
      receiptText: buildNativePosReceiptText(input, {
        orderLocalId,
        paymentLocalId,
        orderNumber: orderOperation.localNumber,
        paymentNumber: paymentOperation.localNumber,
        businessName: input.receipt?.businessName,
        printedAt: input.receipt?.printedAt
      })
    },
    message: 'Sale and payment were queued for sync.'
  };

  if (!input.receipt?.printerName?.trim()) {
    return result;
  }

  return printNativePosQueuedReceipt(result, input.receipt.printerName);
}

export async function printNativePosQueuedReceipt(
  result: NativePosPaidOrderResult,
  printerName?: string
): Promise<NativePosPaidOrderResult> {
  const resolvedPrinterName = printerName?.trim() || result.receipt.printerName?.trim();

  if (!resolvedPrinterName) {
    return {
      ...result,
      receipt: {
        ...result.receipt,
        status: 'not_configured',
        printerName: undefined,
        errorMessage: undefined
      }
    };
  }

  try {
    await printDesktopReceiptText(result.receipt.receiptText, resolvedPrinterName);
    const printedAt = new Date().toISOString();
    const auditOperation = await localFirstSyncService.enqueueOfflineReceiptPrinted(result.orderLocalId, new Date(printedAt));

    return {
      ...result,
      receipt: {
        ...result.receipt,
        status: 'printed',
        printerName: resolvedPrinterName,
        printedAt,
        auditOperation,
        errorMessage: undefined
      }
    };
  } catch (error) {
    return {
      ...result,
      receipt: {
        ...result.receipt,
        status: 'failed',
        printerName: resolvedPrinterName,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export function buildNativePosReceiptText(
  input: NativePosPaidOrderInput,
  numbers: {
    orderLocalId: string;
    paymentLocalId: string;
    orderNumber?: string;
    paymentNumber?: string;
    businessName?: string;
    printedAt?: string;
  }
): string {
  const printedAt = numbers.printedAt || new Date().toISOString();
  const orderType = input.orderType === 'DINE_IN' ? 'DINE IN' : 'TAKEAWAY';
  const paymentMethod = input.payment.method === 'cash' ? 'Cash' : 'Manual card';
  const total = input.items.reduce((sum, item) => sum + item.total, 0);
  const lines = [
    center(numbers.businessName?.trim() || 'Servaan POS'),
    center('Pending Sync'),
    repeat('-', RECEIPT_WIDTH),
    `Order: ${numbers.orderNumber || numbers.orderLocalId}`,
    `Payment: ${numbers.paymentNumber || numbers.paymentLocalId}`,
    `Type: ${orderType}`,
    input.tableId ? `Table: ${input.tableId}` : undefined,
    input.customerName ? `Customer: ${input.customerName}` : undefined,
    `Printed: ${printedAt}`,
    repeat('-', RECEIPT_WIDTH),
    ...input.items.flatMap((item) => formatReceiptItem(item.itemName, item.quantity, item.total)),
    repeat('-', RECEIPT_WIDTH),
    rightLabel('Total', formatMoney(total)),
    rightLabel('Paid', formatMoney(input.payment.amount)),
    `Method: ${paymentMethod}`,
    input.payment.method === 'manual-card' && input.payment.manualCard?.transactionRef
      ? `Card ref: ${input.payment.manualCard.transactionRef}`
      : undefined,
    input.notes ? `Notes: ${input.notes}` : undefined,
    repeat('-', RECEIPT_WIDTH),
    'Local receipt. Reprint canonical receipt after sync.',
    ''
  ].filter((line): line is string => Boolean(line));

  return `${lines.join('\n')}\n`;
}

function formatReceiptItem(name: string, quantity: number, total: number): string[] {
  return [
    trimToWidth(name),
    rightLabel(`x${quantity}`, formatMoney(total))
  ];
}

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} Toman`;
}

function rightLabel(label: string, value: string): string {
  const gap = RECEIPT_WIDTH - label.length - value.length;
  return `${label}${repeat(' ', Math.max(1, gap))}${value}`;
}

function center(value: string): string {
  const trimmed = trimToWidth(value);
  const left = Math.floor((RECEIPT_WIDTH - trimmed.length) / 2);
  return `${repeat(' ', left)}${trimmed}`;
}

function trimToWidth(value: string): string {
  return value.length <= RECEIPT_WIDTH ? value : value.slice(0, Math.max(0, RECEIPT_WIDTH - 1));
}

function repeat(value: string, count: number): string {
  return value.repeat(count);
}
