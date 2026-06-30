import { InventoryEntryType, type InventoryStatus, type Item } from '../../../shared/types';
import { getLocalReadModel, getLocalReadModelMeta, setLocalReadModel } from '../../services/localReadModelService';
import { localFirstStorage } from '../../services/localFirstStorageService';
import { localFirstSyncService } from '../../services/localFirstSyncService';
import { getNativeOnlineLoginSnapshot, isNativeSnapshotValid } from '../../services/nativeAuthSnapshotService';
import { isDesktopApp } from '../../services/desktopBridgeService';
import type {
  NativeInventoryCacheKey,
  NativeInventoryEntryInput,
  NativeInventoryEntryResult,
  NativeInventoryItem,
  NativeInventorySnapshot
} from './nativeInventoryTypes';

const REQUIRED_KEYS: NativeInventoryCacheKey[] = ['inventory.items', 'inventory.current'];

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeItems(items: Item[] | null, currentInventory: InventoryStatus[] | null): NativeInventoryItem[] {
  const currentByItemId = new Map((currentInventory || []).map((status) => [status.itemId, status]));

  return (items || [])
    .filter((item) => item.isActive !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
    .map((item) => {
      const status = currentByItemId.get(item.id);
      return {
        id: item.id,
        name: item.name,
        category: item.category || status?.category || 'بدون دسته‌بندی',
        unit: item.unit || status?.unit || 'واحد',
        minStock: item.minStock,
        current: parseNumber(status?.current)
      };
    });
}

async function getMissingKeys(): Promise<NativeInventoryCacheKey[]> {
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

async function getPendingInventoryCount(): Promise<number> {
  const operations = await localFirstStorage.getPendingOperations();
  return operations.filter((operation) => operation.operationType === 'inventory.entry.create').length;
}

export async function loadNativeInventorySnapshot(): Promise<NativeInventorySnapshot> {
  const syncIssues = await localFirstSyncService.getIssueSummary();

  if (!isDesktopApp()) {
    return {
      readiness: {
        kind: 'not-native',
        message: 'این صفحه فقط در نسخه دسکتاپ بومی فعال است.'
      },
      items: [],
      pendingInventoryCount: 0,
      syncIssues
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
      items: [],
      pendingInventoryCount: 0,
      syncIssues
    };
  }

  const missing = await getMissingKeys();
  if (missing.length > 0) {
    return {
      readiness: {
        kind: 'missing-cache',
        missing,
        message: 'برای شروع کار آفلاین انبار، همگام‌سازی اولیه لازم است.'
      },
      items: [],
      pendingInventoryCount: 0,
      syncIssues
    };
  }

  const [itemsModel, currentModel, updatedAt, pendingInventoryCount] = await Promise.all([
    getLocalReadModel<Item[]>('inventory.items'),
    getLocalReadModel<InventoryStatus[]>('inventory.current'),
    getOldestUpdatedAt(),
    getPendingInventoryCount()
  ]);

  return {
    readiness: {
      kind: 'ready',
      updatedAt: updatedAt || new Date().toISOString(),
      stale: false
    },
    items: normalizeItems(itemsModel?.value || [], currentModel?.value || []),
    pendingInventoryCount,
    syncIssues
  };
}

export async function submitNativeInventoryEntry(input: NativeInventoryEntryInput): Promise<NativeInventoryEntryResult> {
  if (input.type !== 'IN' && input.type !== 'OUT') {
    throw new Error('در نسخه فعلی فقط ورود و خروج کالا پشتیبانی می‌شود.');
  }

  if (!input.itemId) {
    throw new Error('یک کالا انتخاب کنید.');
  }

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('مقدار باید بزرگ‌تر از صفر باشد.');
  }

  const [itemsModel, currentModel] = await Promise.all([
    getLocalReadModel<Item[]>('inventory.items'),
    getLocalReadModel<InventoryStatus[]>('inventory.current')
  ]);

  const item = (itemsModel?.value || []).find((candidate) => candidate.id === input.itemId && candidate.isActive !== false);
  if (!item) {
    throw new Error('کالای انتخاب‌شده در کش بومی پیدا نشد.');
  }

  const currentInventory = currentModel?.value || [];
  const existingStatus = currentInventory.find((status) => status.itemId === item.id);
  const previousStock = parseNumber(existingStatus?.current);
  const nextStock = input.type === 'IN' ? previousStock + input.quantity : previousStock - input.quantity;

  const operation = await localFirstSyncService.enqueueInventoryEntry({
    itemId: item.id,
    quantity: input.quantity,
    type: input.type === 'IN' ? InventoryEntryType.IN : InventoryEntryType.OUT,
    note: input.note?.trim() || undefined
  });

  await updateEstimatedCurrentInventory(currentInventory, item, input.type, input.quantity, nextStock);

  return {
    operation,
    localNumber: operation.localNumber,
    itemName: item.name,
    type: input.type,
    quantity: input.quantity,
    unit: item.unit,
    estimatedStock: nextStock,
    message: 'سند انبار در صف همگام‌سازی ثبت شد.'
  };
}

async function updateEstimatedCurrentInventory(
  currentInventory: InventoryStatus[],
  item: Item,
  type: 'IN' | 'OUT',
  quantity: number,
  nextStock: number
): Promise<void> {
  const deltaIn = type === 'IN' ? quantity : 0;
  const deltaOut = type === 'OUT' ? quantity : 0;
  const existingIndex = currentInventory.findIndex((status) => status.itemId === item.id);
  const nextInventory = [...currentInventory];

  if (existingIndex >= 0) {
    const existing = nextInventory[existingIndex];
    nextInventory[existingIndex] = {
      ...existing,
      totalIn: parseNumber(existing.totalIn) + deltaIn,
      totalOut: parseNumber(existing.totalOut) + deltaOut,
      current: nextStock
    };
  } else {
    nextInventory.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'بدون دسته‌بندی',
      unit: item.unit || 'واحد',
      totalIn: deltaIn,
      totalOut: deltaOut,
      current: nextStock
    });
  }

  await setLocalReadModel('inventory.current', nextInventory);
}
