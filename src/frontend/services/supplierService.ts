import { apiClient } from '../lib/apiClient';
import { Supplier } from '../../shared/types';

export interface CreateSupplierData {
  name: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export type UpdateSupplierData = Partial<CreateSupplierData>;

export interface AddItemToSupplierData {
  itemId: string;
  preferredSupplier?: boolean;
  unitPrice?: number;
}

export interface ItemSupplierRelation {
  itemId: string;
  supplierId: string;
  preferredSupplier: boolean;
  unitPrice?: number;
  createdAt: string;
  updatedAt: string;
}

// Get all suppliers
export const getSuppliers = async (activeOnly?: boolean): Promise<Supplier[]> => {
  try {
    const params: Record<string, string | boolean> = {};
    if (activeOnly) {
      params.active = true;
    }
    return await apiClient.get<Supplier[]>('/suppliers', params);
  } catch {
    throw new Error('خطا در دریافت لیست تأمین‌کنندگان');
  }
};

// Get a single supplier by ID
export const getSupplierById = async (id: string): Promise<Supplier> => {
  try {
    return await apiClient.get<Supplier>(`/suppliers/${id}`);
  } catch {
    throw new Error('خطا در دریافت اطلاعات تأمین‌کننده');
  }
};

// Create a new supplier
export const createSupplier = async (supplierData: CreateSupplierData): Promise<Supplier> => {
  try {
    return await apiClient.post<Supplier>('/suppliers', supplierData);
  } catch {
    throw new Error('خطا در ایجاد تأمین‌کننده جدید');
  }
};

// Update an existing supplier
export const updateSupplier = async (id: string, supplierData: UpdateSupplierData): Promise<Supplier> => {
  try {
    return await apiClient.put<Supplier>(`/suppliers/${id}`, supplierData);
  } catch {
    throw new Error('خطا در ویرایش تأمین‌کننده');
  }
};

// Delete a supplier
export const deleteSupplier = async (id: string): Promise<{ message: string }> => {
  try {
    return await apiClient.delete<{ message: string }>(`/suppliers/${id}`);
  } catch {
    throw new Error('خطا در حذف تأمین‌کننده');
  }
};

// Add item to supplier
export const addItemToSupplier = async (supplierId: string, data: AddItemToSupplierData): Promise<ItemSupplierRelation> => {
  try {
    return await apiClient.post<ItemSupplierRelation>(`/suppliers/${supplierId}/items`, data);
  } catch {
    throw new Error('خطا در اضافه کردن کالا');
  }
};

// Remove item from supplier
export const removeItemFromSupplier = async (supplierId: string, itemId: string): Promise<{ message: string }> => {
  try {
    return await apiClient.delete<{ message: string }>(`/suppliers/${supplierId}/items/${itemId}`);
  } catch {
    throw new Error('خطا در حذف کالا');
  }
};

export interface SupplierTransactionHistoryParams {
  page?: number;
  limit?: number;
  type?: 'IN' | 'OUT';
  startDate?: string;
  endDate?: string;
}

export interface SupplierTransactionHistoryResponse {
  transactions: Array<{
    id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    note?: string;
    createdAt: string;
    updatedAt: string;
    item: {
      id: string;
      name: string;
      category: string;
      unit: string;
    };
    user: {
      id: string;
      name: string;
    };
  }>;
  summary: {
    totalTransactions: number;
    totalIn: number;
    totalOut: number;
    inTransactions: number;
    outTransactions: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getSupplierTransactionHistory = async (
  supplierId: string, 
  params: SupplierTransactionHistoryParams = {}
): Promise<SupplierTransactionHistoryResponse> => {
  try {
    const queryParams: Record<string, string | number> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.type) queryParams.type = params.type;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    return await apiClient.get<SupplierTransactionHistoryResponse>(`/suppliers/${supplierId}/transactions`, queryParams);
  } catch {
    throw new Error('خطا در دریافت تاریخچه تراکنش‌ها');
  }
}; 