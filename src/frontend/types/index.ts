// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  active?: boolean;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // Tenant information for universal login
  tenantId?: string;
  tenantSubdomain?: string;
  tenantName?: string;
}

// Item type
export interface Item {
  id: string;
  name: string;
  category: string;
  unit: string; 
  minStock?: number;
  description?: string;
  barcode?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inventory Entry type
export interface InventoryEntry {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  type: 'IN' | 'OUT';
  note?: string;
  unitPrice?: number;
  batchNumber?: string;
  expiryDate?: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

// Supplier type
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: ItemSupplier[];
}

// ItemSupplier type
export interface ItemSupplier {
  itemId: string;
  item: Item;
  supplierId: string;
  supplier: Supplier;
  preferredSupplier: boolean;
  unitPrice?: number;
  createdAt: string;
  updatedAt: string;
}

// Inventory Current Stock type
export interface CurrentStock {
  itemId: string;
  item: Item;
  inStock: number;
  lastUpdated: string;
}

// Low Stock Item type
export interface LowStockItem {
  itemId: string;
  item: Item;
  currentStock: number;
  minStock: number;
}

// Export workspace types
export * from './workspace';

// Export CRM types
export * from './crm';

// Export new type definitions
export * from './charts';
export * from './forms';
export * from './api';
export * from './reports'; 