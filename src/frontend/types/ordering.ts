// Ordering & Sales System Types for Servaan Business Management System
// تایپ‌های سیستم سفارش‌گیری و فروش برای سیستم مدیریت کسب‌وکار سِروان

import { Customer } from './crm';
import { Item } from './index';

// ===== CORE ENUMS =====

/**
 * Order Status - وضعیت سفارش
 */
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

/**
 * Order Type - نوع سفارش
 */
export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
  ONLINE = 'ONLINE'
}

/**
 * Payment Status - وضعیت پرداخت
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

/**
 * Payment Method - روش پرداخت
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  POINTS = 'POINTS',
  MIXED = 'MIXED'
}

/**
 * Table Status - وضعیت میز
 */
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
  OUT_OF_ORDER = 'OUT_OF_ORDER'
}

// ===== CORE INTERFACES =====

/**
 * Order Interface - رابط سفارش
 */
export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  priority: number;
  
  // Customer Information
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  
  // Table Information
  tableId?: string;
  guestCount?: number;
  
  // Financial Information
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  
  // Payment Information
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  
  // Timing Information
  orderDate: Date;
  estimatedTime?: number;
  startedAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  servedBy?: string;
  
  // Notes
  notes?: string;
  kitchenNotes?: string;
  allergyInfo?: string;
  
  // Relations
  items?: OrderItem[];
  payments?: Payment[];
  customer?: Customer;
  table?: Table;
}

/**
 * Order Item Interface - رابط آیتم سفارش
 */
export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  itemCode?: string;
  
  // Quantity and Pricing
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Customizations
  modifiers: OrderItemModifier[];
  specialRequest?: string;
  
  // Kitchen Information
  prepStatus: OrderStatus;
  prepStartedAt?: Date;
  prepCompletedAt?: Date;
  
  // System Information
  createdAt: Date;
  lineNumber: number;
}

/**
 * Order Item Modifier - تغییرات آیتم سفارش
 */
export interface OrderItemModifier {
  modifierId: string;
  name: string;
  quantity: number;
  additionalPrice: number;
}

/**
 * Table Interface - رابط میز
 */
export interface Table {
  id: string;
  tenantId: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  status: TableStatus;
  
  // Location Information
  section?: string;
  floor: number;
  positionX?: number;
  positionY?: number;
  
  // System Information
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Current Order
  currentOrder?: Order;
}

/**
 * Table Reservation Interface - رابط رزرو میز
 */
export interface TableReservation {
  id: string;
  tenantId: string;
  tableId: string;
  customerId?: string;
  
  // Reservation Details
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: Date;
  duration: number;
  
  // Status
  status: string;
  notes?: string;
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Payment Interface - رابط پرداخت
 */
export interface Payment {
  id: string;
  tenantId: string;
  paymentNumber: string;
  orderId: string;
  
  // Payment Details
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Gateway Information
  gatewayId?: string;
  transactionId?: string;
  referenceNumber?: string;
  terminalId?: string;
  
  // Card Information
  cardMask?: string;
  cardType?: string;
  
  // Timing Information
  paymentDate: Date;
  processedAt?: Date;
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  processedBy: string;
  
  // Failure Information
  failureReason?: string;
  retryCount: number;
}

/**
 * Kitchen Display Interface - رابط نمایشگر آشپزخانه
 */
export interface KitchenDisplay {
  id: string;
  tenantId: string;
  orderId: string;
  displayName: string;
  station: string;
  
  // Status
  status: OrderStatus;
  priority: number;
  
  // Timing
  displayedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number;
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  order?: Order;
}

/**
 * Menu Category Interface - رابط دسته‌بندی منو
 */
export interface MenuCategory {
  id: string;
  tenantId: string;
  name: string;
  nameEn?: string;
  description?: string;
  
  // Display Settings
  displayOrder: number;
  isActive: boolean;
  color?: string;
  icon?: string;
  
  // Availability
  availableFrom?: string;
  availableTo?: string;
  availableDays: string[];
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  items?: MenuItem[];
}

/**
 * Menu Item Interface - رابط آیتم منو
 */
export interface MenuItem {
  id: string;
  tenantId: string;
  itemId: string;
  categoryId: string;
  
  // Menu-specific Information
  displayName: string;
  displayNameEn?: string;
  description?: string;
  shortDesc?: string;
  
  // Pricing
  menuPrice: number;
  originalPrice?: number;
  
  // Display Settings
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  isNew: boolean;
  
  // Images and Media
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // Preparation Information
  prepTime?: number;
  cookingNotes?: string;
  
  // Availability
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
  maxOrderQty?: number;
  
  // Nutritional Information
  calories?: number;
  allergens: string[];
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  modifiers?: MenuItemModifier[];
  item?: Item;
}

/**
 * Menu Item Modifier Interface - رابط تغییرات آیتم منو
 */
export interface MenuItemModifier {
  id: string;
  tenantId: string;
  menuItemId: string;
  name: string;
  nameEn?: string;
  
  // Pricing
  additionalPrice: number;
  
  // Settings
  isRequired: boolean;
  maxQuantity: number;
  displayOrder: number;
  isActive: boolean;
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
}

// ===== REQUEST/RESPONSE TYPES =====

/**
 * Create Order Request - درخواست ایجاد سفارش
 */
export interface CreateOrderRequest {
  orderType: OrderType;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  tableId?: string;
  guestCount?: number;
  items: {
    itemId: string;
    quantity: number;
    modifiers?: {
      modifierId: string;
      quantity: number;
    }[];
    specialRequest?: string;
  }[];
  notes?: string;
  kitchenNotes?: string;
  allergyInfo?: string;
}

/**
 * Update Order Request - درخواست به‌روزرسانی سفارش
 */
export interface UpdateOrderRequest {
  status?: OrderStatus;
  priority?: number;
  estimatedTime?: number;
  notes?: string;
  kitchenNotes?: string;
  items?: {
    action: 'ADD' | 'UPDATE' | 'REMOVE';
    orderItemId?: string;
    itemId?: string;
    quantity?: number;
    modifiers?: {
      modifierId: string;
      quantity: number;
    }[];
    specialRequest?: string;
  }[];
}

/**
 * Process Payment Request - درخواست پردازش پرداخت
 */
export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  
  // For card payments
  cardInfo?: {
    terminalId: string;
    transactionRef: string;
  };
  
  // For cash payments
  cashReceived?: number;
  
  // For loyalty points
  pointsUsed?: number;
  
  // For mixed payments
  splitPayments?: {
    method: PaymentMethod;
    amount: number;
  }[];
}

/**
 * Order Timeline Event - رویداد خط زمانی سفارش
 */
export interface OrderTimeline {
  timestamp: Date;
  status: OrderStatus;
  note?: string;
  userId: string;
  userName: string;
}

/**
 * POS Session Interface - رابط جلسه فروش
 */
export interface POSSession {
  sessionId: string;
  cashierId: string;
  openedAt: Date;
  closedAt?: Date;
  initialCash: number;
  finalCash?: number;
  totalSales: number;
  orderCount: number;
  isActive: boolean;
}

/**
 * Sales Analytics Interface - رابط تحلیل فروش
 */
export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }[];
  hourlyBreakdown: {
    hour: number;
    orders: number;
    revenue: number;
  }[];
  comparison?: {
    revenueGrowth: number;
    orderGrowth: number;
    averageOrderValueGrowth: number;
  };
}

// ===== UTILITY TYPES =====

/**
 * Order Filter Options - گزینه‌های فیلتر سفارش
 */
export interface OrderFilterOptions {
  status?: OrderStatus[];
  orderType?: OrderType[];
  tableId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Order Sort Options - گزینه‌های مرتب‌سازی سفارش
 */
export type OrderSortBy = 'orderDate' | 'orderNumber' | 'totalAmount' | 'status';
export type OrderSortOrder = 'asc' | 'desc';

/**
 * Kitchen Display Order - سفارش نمایشگر آشپزخانه
 */
export interface KitchenDisplayOrder {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: {
    itemName: string;
    quantity: number;
    modifiers: string[];
    specialRequest?: string;
    prepStatus: OrderStatus;
  }[];
  priority: number;
  estimatedTime: number;
  elapsedTime: number;
  status: OrderStatus;
  notes?: string;
  allergyInfo?: string;
}

// ===== STATUS LABELS =====

/**
 * Order Status Labels in Persian - برچسب‌های وضعیت سفارش به فارسی
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'پیش‌نویس',
  [OrderStatus.PENDING]: 'در انتظار',
  [OrderStatus.SUBMITTED]: 'ثبت شده',
  [OrderStatus.CONFIRMED]: 'تأیید شده',
  [OrderStatus.PREPARING]: 'در حال آماده‌سازی',
  [OrderStatus.READY]: 'آماده',
  [OrderStatus.SERVED]: 'سرو شده',
  [OrderStatus.COMPLETED]: 'تکمیل شده',
  [OrderStatus.CANCELLED]: 'لغو شده',
  [OrderStatus.REFUNDED]: 'مرجوع شده'
};

/**
 * Order Type Labels in Persian - برچسب‌های نوع سفارش به فارسی
 */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'صرف در محل',
  [OrderType.TAKEAWAY]: 'بیرون بر',
  [OrderType.DELIVERY]: 'تحویل',
  [OrderType.ONLINE]: 'آنلاین'
};

/**
 * Payment Method Labels in Persian - برچسب‌های روش پرداخت به فارسی
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'نقدی',
  [PaymentMethod.CARD]: 'کارتی',
  [PaymentMethod.ONLINE]: 'آنلاین',
  [PaymentMethod.POINTS]: 'امتیاز',
  [PaymentMethod.MIXED]: 'ترکیبی'
};

/**
 * Table Status Labels in Persian - برچسب‌های وضعیت میز به فارسی
 */
export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  [TableStatus.AVAILABLE]: 'آزاد',
  [TableStatus.OCCUPIED]: 'اشغال',
  [TableStatus.RESERVED]: 'رزرو شده',
  [TableStatus.CLEANING]: 'در حال تمیزکاری',
  [TableStatus.OUT_OF_ORDER]: 'خارج از سرویس'
};

// ===== RECIPE SYSTEM TYPES =====

/**
 * Recipe - دستور پخت
 */
export interface Recipe {
  id: string;
  tenantId: string;
  menuItemId: string;
  name: string;
  description?: string;
  instructions?: string;
  yield: number; // Number of servings
  prepTime?: number; // Preparation time in minutes
  totalCost: number; // Total cost calculated from ingredients
  costPerServing: number; // Cost per serving
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  menuItem?: {
    id: string;
    displayName: string;
    menuPrice: number;
    category: {
      id: string;
      name: string;
    };
  };
  ingredients?: RecipeIngredient[];
  _count?: {
    ingredients: number;
  };
}

/**
 * Recipe Ingredient - مواد اولیه دستور پخت
 */
export interface RecipeIngredient {
  id: string;
  tenantId: string;
  recipeId: string;
  itemId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  isOptional: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  recipe?: {
    id: string;
    name: string;
  };
  item?: {
    id: string;
    name: string;
    unit: string;
    category: string;
  };
}

/**
 * Recipe Cost Analysis - تجزیه و تحلیل هزینه دستور پخت
 */
export interface RecipeCostAnalysis {
  totalCost: number;
  costPerServing: number;
  ingredients: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    percentage: number; // Percentage of total cost
  }>;
}

// ===== RECIPE REQUESTS =====

/**
 * Create Recipe Request - درخواست ایجاد دستور پخت
 */
export interface CreateRecipeRequest {
  menuItemId: string;
  name: string;
  description?: string;
  instructions?: string;
  yield?: number;
  prepTime?: number;
}

/**
 * Update Recipe Request - درخواست به‌روزرسانی دستور پخت
 */
export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  instructions?: string;
  yield?: number;
  prepTime?: number;
  isActive?: boolean;
}

/**
 * Create Recipe Ingredient Request - درخواست ایجاد مواد اولیه
 */
export interface CreateRecipeIngredientRequest {
  itemId: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  isOptional?: boolean;
  displayOrder?: number;
}

/**
 * Update Recipe Ingredient Request - درخواست به‌روزرسانی مواد اولیه
 */
export interface UpdateRecipeIngredientRequest {
  quantity?: number;
  unit?: string;
  unitCost?: number;
  isOptional?: boolean;
  displayOrder?: number;
} 