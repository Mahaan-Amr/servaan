import { apiClient } from '../lib/apiClient';
import { Item as SharedItem } from '../../shared/types';

// Use the shared Item type for consistency
export type Item = SharedItem;

export interface CreateItemData {
  name: string;
  category: string;
  unit: string;
  minStock?: number;
  description?: string;
  barcode?: string;
  image?: string;
  isActive?: boolean;
}

// Get all items
export const getItems = async (): Promise<Item[]> => {
  try {
    return await apiClient.get<Item[]>('/items');
  } catch (error) {
    throw new Error('خطا در دریافت لیست کالاها');
  }
};

// Get all items with suppliers included
export const getItemsWithSuppliers = async (): Promise<Item[]> => {
  try {
    return await apiClient.get<Item[]>('/items', { includeSuppliers: true });
  } catch (error) {
    throw new Error('خطا در دریافت لیست کالاها');
  }
};

// Get a single item by ID
export const getItemById = async (id: string): Promise<Item> => {
  try {
    return await apiClient.get<Item>(`/items/${id}`);
  } catch (error) {
    throw new Error('خطا در دریافت اطلاعات کالا');
  }
};

// Create a new item
export const createItem = async (itemData: CreateItemData): Promise<Item> => {
  try {
    return await apiClient.post<Item>('/items', itemData);
  } catch (error) {
    throw new Error('خطا در ایجاد کالای جدید');
  }
};

// Update an existing item
export const updateItem = async (id: string, itemData: Partial<CreateItemData>): Promise<Item> => {
  try {
    return await apiClient.put<Item>(`/items/${id}`, itemData);
  } catch (error) {
    throw new Error('خطا در به‌روزرسانی کالا');
  }
};

// Delete an item
export const deleteItem = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/items/${id}`);
  } catch (error) {
    throw new Error('خطا در حذف کالا');
  }
}; 