// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Item types
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
  suppliers?: ItemSupplier[];
}

// Inventory types
export enum InventoryEntryType {
  IN = 'IN',
  OUT = 'OUT'
}

export interface InventoryEntry {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  type: InventoryEntryType;
  note?: string;
  createdAt: string;
  updatedAt: string;
  item?: Item;
  user?: User;
  unitPrice?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface InventoryStatus {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  totalIn: number;
  totalOut: number;
  current: number;
}

// Supplier types
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

export interface ItemSupplier {
  itemId: string;
  supplierId: string;
  item?: Item;
  supplier?: Supplier;
  preferredSupplier: boolean;
  unitPrice?: number;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  STOCK_DEFICIT = 'STOCK_DEFICIT', // New type for negative stock
  INVENTORY_UPDATE = 'INVENTORY_UPDATE',
  NEW_USER = 'NEW_USER',
  ITEM_CREATED = 'ITEM_CREATED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  SUPPLIER_CREATED = 'SUPPLIER_CREATED',
  SUPPLIER_UPDATED = 'SUPPLIER_UPDATED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
  WARNING = 'WARNING',
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
  CAMPAIGN_SENT = 'CAMPAIGN_SENT',
  CAMPAIGN_COMPLETED = 'CAMPAIGN_COMPLETED',
  CAMPAIGN_FAILED = 'CAMPAIGN_FAILED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Notification {
  id: string;
  userId?: string; // If null, it's a broadcast notification
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any; // Additional data related to the notification
  read: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // Optional expiration date
}

// Real-time event types for WebSocket
export interface SocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

// Specific notification event types
export interface LowStockNotificationData {
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

export interface InventoryUpdateNotificationData {
  itemId: string;
  itemName: string;
  previousStock: number;
  newStock: number;
  changeAmount: number;
  type: InventoryEntryType;
  unit: string;
  userId: string;
  userName: string;
}

export interface StockDeficitNotificationData {
  itemId: string;
  itemName: string;
  previousStock: number;
  newStock: number;
  deficitAmount: number;
  unit: string;
  userId: string;
  userName: string;
}

export interface UserActivityNotificationData {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
} 