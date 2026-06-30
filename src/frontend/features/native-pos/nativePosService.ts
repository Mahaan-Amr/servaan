import { getLocalReadModel, getLocalReadModelMeta } from '../../services/localReadModelService';
import { localFirstSyncService } from '../../services/localFirstSyncService';
import { getNativeOnlineLoginSnapshot, isNativeSnapshotValid } from '../../services/nativeAuthSnapshotService';
import { isDesktopApp } from '../../services/desktopBridgeService';
import type { CreateOrderRequest, OrderingSettings, ProcessPaymentRequest } from '../../services/orderingService';
import { OrderType, PaymentMethod, type MenuCategory, type MenuItem, type Table } from '../../types/ordering';
import type { NativePosCacheKey, NativePosMenuCategory, NativePosPaidOrderInput, NativePosPaidOrderResult, NativePosSnapshot, NativePosTable } from './nativePosTypes';

const REQUIRED_KEYS: NativePosCacheKey[] = ['sales.menu', 'sales.tables', 'sales.settings'];

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getItemName(item: MenuItem): string {
  return item.displayName || item.item?.name || 'آیتم بدون نام';
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
      label: table.tableName || `میز ${table.tableNumber}`,
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
        message: 'این صفحه فقط در نسخه دسکتاپ بومی فعال است.'
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
        message: 'اعتبار ورود آفلاین تمام شده است. لطفاً آنلاین وارد شوید.'
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
        message: 'برای شروع فروش، همگام‌سازی اولیه لازم است.'
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
    throw new Error('در نسخه فعلی فقط سفارش حضوری و بیرون‌بر پشتیبانی می‌شود.');
  }

  if (input.items.length === 0) {
    throw new Error('سبد سفارش خالی است.');
  }

  if (input.payment.method !== 'cash' && input.payment.method !== 'manual-card') {
    throw new Error('در نسخه فعلی فقط پرداخت نقدی و کارت دستی پشتیبانی می‌شود.');
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
    throw new Error('شناسه محلی سفارش ساخته نشد.');
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
    throw new Error('شناسه محلی پرداخت ساخته نشد.');
  }

  return {
    orderOperation,
    paymentOperation,
    orderLocalId,
    paymentLocalId,
    orderNumber: orderOperation.localNumber,
    paymentNumber: paymentOperation.localNumber,
    message: 'سفارش و پرداخت در صف همگام‌سازی ثبت شد.'
  };
}
