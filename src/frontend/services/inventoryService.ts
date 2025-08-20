import { apiClient } from '../lib/apiClient';
import { InventoryEntry, InventoryEntryType, InventoryStatus } from '../../shared/types';

// Get inventory entries
export const getInventoryEntries = async (): Promise<InventoryEntry[]> => {
  try {
    return await apiClient.get<InventoryEntry[]>('/inventory');
  } catch (error) {
    throw error;
  }
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
    return await apiClient.post<InventoryEntry>('/inventory', data);
  } catch (error) {
    throw error;
  }
};

// Update inventory entry
export const updateInventoryEntry = async (id: string, data: CreateInventoryEntryData): Promise<InventoryEntry> => {
  try {
    return await apiClient.put<InventoryEntry>(`/inventory/${id}`, data);
  } catch (error) {
    throw error;
  }
};

// Delete inventory entry
export const deleteInventoryEntry = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<void>(`/inventory/${id}`);
  } catch (error) {
    throw error;
  }
};

// Get current inventory status
export const getCurrentInventory = async (): Promise<InventoryStatus[]> => {
  try {
    return await apiClient.get<InventoryStatus[]>('/inventory/current');
  } catch (error) {
    throw error;
  }
};

// Get low stock items
export const getLowStockItems = async (): Promise<InventoryStatus[]> => {
  try {
    return await apiClient.get<InventoryStatus[]>('/inventory/low-stock');
  } catch (error) {
    throw error;
  }
};

// Get total inventory quantity
export const getTotalInventoryQuantity = async (): Promise<{ totalQuantity: number; itemCount: number }> => {
  try {
    const response = await apiClient.get<{ data: { totalQuantity: number; itemCount: number } }>('/inventory/total-quantity');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get inventory dashboard stats
export const getInventoryStats = async (): Promise<{
  totalItems: number;
  lowStockCount: number;
  recentTransactions: number;
  totalInventoryValue: number;
}> => {
  try {
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
  } catch (error) {
    throw error;
  }
};

// Get recent inventory activities
export const getRecentActivities = async (): Promise<InventoryEntry[]> => {
  try {
    return await apiClient.get<InventoryEntry[]>('/inventory', { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
  } catch (error) {
    throw error;
  }
}; 