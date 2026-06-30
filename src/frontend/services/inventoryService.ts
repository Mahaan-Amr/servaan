import { apiClient } from '../lib/apiClient';
import { InventoryEntry, InventoryEntryType, InventoryStatus } from '../../shared/types';
import { localFirstSyncService } from './localFirstSyncService';
import { readLocalFirst, setLocalReadModel, type ReadLocalFirstOptions } from './localReadModelService';

function isOfflineOrNetworkFailure(error?: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  return (
    lowered.includes('failed to fetch') ||
    lowered.includes('networkerror') ||
    lowered.includes('network request failed') ||
    lowered.includes('load failed') ||
    lowered.includes('timeout') ||
    lowered.includes('aborted')
  );
}

function onlineOnlyError(): Error {
  return new Error('این عملیات در نسخه آفلاین این مرحله فقط با اتصال آنلاین انجام می‌شود.');
}

// Get inventory entries
export const getInventoryEntries = async (options?: ReadLocalFirstOptions): Promise<InventoryEntry[]> => {
  return readLocalFirst('inventory.entries', () => apiClient.get<InventoryEntry[]>('/inventory'), options);
};

// Get single inventory entry
export const getInventoryEntry = async (id: string): Promise<InventoryEntry> => {
  try {
    return await apiClient.get<InventoryEntry>(`/inventory/${id}`);
  } catch (error) {
    throw error;
  }
};

// Create inventory entry
export interface CreateInventoryEntryData {
  itemId: string;
  quantity: number;
  type: InventoryEntryType;
  note?: string;
  unitPrice?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export const createInventoryEntry = async (data: CreateInventoryEntryData): Promise<InventoryEntry> => {
  try {
    const entry = await apiClient.post<InventoryEntry>('/inventory', data);
    await refreshInventoryReadModelsAfterMutation(entry).catch(() => undefined);
    return entry;
  } catch (error) {
    if (isOfflineOrNetworkFailure(error)) {
      const operation = await localFirstSyncService.enqueueInventoryEntry(data);
      const entry = {
        id: operation.localOperationId,
        ...data,
        quantity: data.type === 'OUT' ? -data.quantity : data.quantity,
        createdAt: operation.createdOfflineAt,
        updatedAt: operation.createdOfflineAt,
        userId: operation.actorUserId,
        tenantId: operation.tenantId,
        note: data.note || operation.localNumber
      } as InventoryEntry;
      await refreshInventoryReadModelsAfterMutation(entry).catch(() => undefined);
      return entry;
    }
    throw error;
  }
};

// Bulk create inventory entries
export interface BulkCreateInventoryEntryData {
  entries: CreateInventoryEntryData[];
}

export interface BulkCreateInventoryEntryResponse {
  success: boolean;
  message: string;
  created: InventoryEntry[];
  errors?: Array<{
    index: number;
    itemId: string;
    error: string;
  }>;
}

export const bulkCreateInventoryEntries = async (data: BulkCreateInventoryEntryData): Promise<BulkCreateInventoryEntryResponse> => {
  try {
    const response = await apiClient.post<BulkCreateInventoryEntryResponse>('/inventory/bulk', data);
    await Promise.all((response.created || []).map((entry) => refreshInventoryReadModelsAfterMutation(entry))).catch(() => undefined);
    return response;
  } catch (error) {
    if (isOfflineOrNetworkFailure(error)) {
      const operations = await Promise.all(data.entries.map((entry) => localFirstSyncService.enqueueInventoryEntry(entry)));
      const created = operations.map((operation, index) => ({
        id: operation.localOperationId,
        ...data.entries[index],
        quantity: data.entries[index].type === 'OUT' ? -data.entries[index].quantity : data.entries[index].quantity,
        createdAt: operation.createdOfflineAt,
        updatedAt: operation.createdOfflineAt,
        userId: operation.actorUserId,
        tenantId: operation.tenantId
      })) as InventoryEntry[];
      await Promise.all(created.map((entry) => refreshInventoryReadModelsAfterMutation(entry))).catch(() => undefined);
      return {
        success: true,
        message: 'Inventory entries were queued for synchronization.',
        created
      };
    }
    throw error;
  }
};

// Update inventory entry
export const updateInventoryEntry = async (id: string, data: CreateInventoryEntryData): Promise<InventoryEntry> => {
  try {
    return await apiClient.put<InventoryEntry>(`/inventory/${id}`, data);
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw onlineOnlyError();
    }
    throw error;
  }
};

// Delete inventory entry
export const deleteInventoryEntry = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<void>(`/inventory/${id}`);
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw onlineOnlyError();
    }
    throw error;
  }
};

// Get current inventory status
export const getCurrentInventory = async (options?: ReadLocalFirstOptions): Promise<InventoryStatus[]> => {
  return readLocalFirst('inventory.current', () => apiClient.get<InventoryStatus[]>('/inventory/current'), options);
};

// Get low stock items
export const getLowStockItems = async (options?: ReadLocalFirstOptions): Promise<InventoryStatus[]> => {
  return readLocalFirst('inventory.lowStock', () => apiClient.get<InventoryStatus[]>('/inventory/low-stock'), options);
};

// Get total inventory quantity
export const getTotalInventoryQuantity = async (options?: ReadLocalFirstOptions): Promise<{ totalQuantity: number; itemCount: number }> => {
  return readLocalFirst('inventory.totalQuantity', async () => {
    const response = await apiClient.get<{ data: { totalQuantity: number; itemCount: number } }>('/inventory/total-quantity');
    return response.data;
  }, options);
};

// Get inventory dashboard stats
export const getInventoryStats = async (options?: ReadLocalFirstOptions): Promise<{
  totalItems: number;
  lowStockCount: number;
  recentTransactions: number;
  totalInventoryValue: number;
}> => {
  return readLocalFirst('inventory.stats', async () => {
    const [itemsRes, lowStockRes, transactionsRes, valueRes] = await Promise.all([
      apiClient.get<{ data: { count: number } }>('/items/count'),
      apiClient.get<{ data: { count: number } }>('/inventory/low-stock/count'),
      apiClient.get<{ data: { count: number } }>('/inventory/today/count'),
      apiClient.get<{ totalInventoryValue: number }>('/analytics/summary').catch(() => ({ totalInventoryValue: 0 }))
    ]);

    return {
      totalItems: itemsRes.data?.count || 0,
      lowStockCount: lowStockRes.data?.count || 0,
      recentTransactions: transactionsRes.data?.count || 0,
      totalInventoryValue: valueRes.totalInventoryValue || 0
    };
  }, options);
};

// Get recent inventory activities
export const getRecentActivities = async (options?: ReadLocalFirstOptions): Promise<InventoryEntry[]> => {
  return readLocalFirst('inventory.entries', () =>
    apiClient.get<InventoryEntry[]>('/inventory', { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
  , options);
};

// Reset item stock to zero
export interface ResetStockResponse {
  success: boolean;
  message: string;
  adjustment: InventoryEntry;
}

export const resetItemStock = async (itemId: string): Promise<ResetStockResponse> => {
  try {
    return await apiClient.post<ResetStockResponse>(`/inventory/reset/${itemId}`);
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw onlineOnlyError();
    }
    throw error;
  }
};

// Inventory Settings
export interface InventorySettings {
  id: string;
  tenantId: string;
  allowNegativeStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getInventorySettings = async (): Promise<InventorySettings> => {
  return readLocalFirst('inventory.settings', () => apiClient.get<InventorySettings>('/inventory/settings'));
};

export const updateInventorySettings = async (settings: { allowNegativeStock: boolean }): Promise<{ message: string; settings: InventorySettings }> => {
  try {
    return await apiClient.put<{ message: string; settings: InventorySettings }>('/inventory/settings', settings);
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw onlineOnlyError();
    }
    throw error;
  }
};

async function refreshInventoryReadModelsAfterMutation(entry: InventoryEntry): Promise<void> {
  const current = await readLocalFirst<InventoryStatus[]>('inventory.current', async () => []);
  const entries = await readLocalFirst<InventoryEntry[]>('inventory.entries', async () => []);
  await setLocalReadModel('inventory.entries', [entry, ...entries.filter((existing) => existing.id !== entry.id)]);

  const existingStatus = current.find((status) => status.itemId === entry.itemId);
  if (!existingStatus) return;

  await setLocalReadModel(
    'inventory.current',
    current.map((status) =>
      status.itemId === entry.itemId
        ? {
            ...status,
            current: status.current + entry.quantity,
            lastUpdated: entry.createdAt
          }
        : status
    )
  );
}
