# API Specification - Ordering & Sales System
## مشخصات API - سیستم سفارش‌گیری و فروش

### 📋 Overview | نمای کلی

This document defines the RESTful API endpoints for the Ordering & Sales System workspace. All endpoints follow the existing Servaan API patterns with proper authentication, authorization, and multi-tenant data isolation.

---

## 🔐 Authentication & Authorization | احراز هویت و مجوز

### Headers Required
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Tenant-ID: <tenant_id>
```

### Role-Based Access
- **ADMIN**: Full access to all endpoints
- **MANAGER**: Access to all except system configuration
- **STAFF**: Limited to order creation and status updates

---

## 📋 Order Management API | API مدیریت سفارشات

### 1. Get Orders | دریافت سفارشات

```http
GET /api/orders
```

**Query Parameters:**
```typescript
interface GetOrdersQuery {
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  status?: OrderStatus[];  // Filter by status
  orderType?: OrderType[]; // Filter by type
  tableId?: string;        // Filter by table
  customerId?: string;     // Filter by customer
  startDate?: string;      // ISO date
  endDate?: string;        // ISO date
  search?: string;         // Search in order number, customer name
  sortBy?: 'orderDate' | 'orderNumber' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface GetOrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
    summary: {
      totalRevenue: number;
      completedOrders: number;
      pendingOrders: number;
      averageOrderValue: number;
    };
  };
}
```

### 2. Get Order by ID | دریافت سفارش با شناسه

```http
GET /api/orders/:orderId
```

**Response:**
```typescript
interface GetOrderResponse {
  success: boolean;
  data: {
    order: Order;
    items: OrderItem[];
    payments: Payment[];
    customer?: Customer;
    table?: Table;
    timeline: OrderTimeline[];
  };
}

interface OrderTimeline {
  timestamp: string;
  status: OrderStatus;
  note?: string;
  userId: string;
  userName: string;
}
```

### 3. Create Order | ایجاد سفارش

```http
POST /api/orders
```

**Request Body:**
```typescript
interface CreateOrderRequest {
  orderType: OrderType;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  tableId?: string;
  guestCount?: number;
  items: {
    itemId: string;
    quantity: number;
    modifiers?: OrderItemModifier[];
    specialRequest?: string;
  }[];
  notes?: string;
  kitchenNotes?: string;
  allergyInfo?: string;
}

interface OrderItemModifier {
  modifierId: string;
  quantity: number;
}
```

**Response:**
```typescript
interface CreateOrderResponse {
  success: boolean;
  data: {
    order: Order;
    orderNumber: string;
    estimatedTime: number;
  };
}
```

### 4. Update Order | به‌روزرسانی سفارش

```http
PUT /api/orders/:orderId
```

**Request Body:**
```typescript
interface UpdateOrderRequest {
  status?: OrderStatus;
  priority?: number;
  estimatedTime?: number;
  notes?: string;
  kitchenNotes?: string;
  items?: {
    action: 'ADD' | 'UPDATE' | 'REMOVE';
    orderItemId?: string; // For UPDATE/REMOVE
    itemId?: string;      // For ADD
    quantity?: number;
    modifiers?: OrderItemModifier[];
    specialRequest?: string;
  }[];
}
```

### 5. Cancel Order | لغو سفارش

```http
DELETE /api/orders/:orderId
```

**Request Body:**
```typescript
interface CancelOrderRequest {
  reason: string;
  refundAmount?: number;
}
```

---

## 🍽️ Point of Sale (POS) API | API سیستم فروش

### 1. Get POS Session | دریافت جلسه فروش

```http
GET /api/pos/session
```

**Response:**
```typescript
interface POSSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    cashierId: string;
    openedAt: string;
    initialCash: number;
    currentCash: number;
    totalSales: number;
    orderCount: number;
    lastActivity: string;
  };
}
```

### 2. Open POS Session | باز کردن جلسه فروش

```http
POST /api/pos/session/open
```

**Request Body:**
```typescript
interface OpenSessionRequest {
  initialCash: number;
  notes?: string;
}
```

### 3. Close POS Session | بستن جلسه فروش

```http
POST /api/pos/session/close
```

**Request Body:**
```typescript
interface CloseSessionRequest {
  finalCash: number;
  notes?: string;
}
```

### 4. Quick Sale | فروش سریع

```http
POST /api/pos/quick-sale
```

**Request Body:**
```typescript
interface QuickSaleRequest {
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  discountAmount?: number;
  notes?: string;
}
```

---

## 🪑 Table Management API | API مدیریت میزها

### 1. Get Tables | دریافت میزها

```http
GET /api/tables
```

**Query Parameters:**
```typescript
interface GetTablesQuery {
  section?: string;
  floor?: number;
  status?: TableStatus[];
  includeOrders?: boolean;
}
```

**Response:**
```typescript
interface GetTablesResponse {
  success: boolean;
  data: {
    tables: Table[];
    layout?: {
      sections: string[];
      floors: number[];
    };
  };
}
```

### 2. Update Table Status | به‌روزرسانی وضعیت میز

```http
PUT /api/tables/:tableId/status
```

**Request Body:**
```typescript
interface UpdateTableStatusRequest {
  status: TableStatus;
  notes?: string;
}
```

### 3. Transfer Order | انتقال سفارش

```http
POST /api/tables/:tableId/transfer
```

**Request Body:**
```typescript
interface TransferOrderRequest {
  fromTableId: string;
  orderId: string;
  reason?: string;
}
```

### 4. Merge Tables | ادغام میزها

```http
POST /api/tables/merge
```

**Request Body:**
```typescript
interface MergeTablesRequest {
  tableIds: string[];
  primaryTableId: string;
  reason?: string;
}
```

---

## 💳 Payment Processing API | API پردازش پرداخت

### 1. Process Payment | پردازش پرداخت

```http
POST /api/payments/process
```

**Request Body:**
```typescript
interface ProcessPaymentRequest {
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
```

**Response:**
```typescript
interface ProcessPaymentResponse {
  success: boolean;
  data: {
    payment: Payment;
    changeAmount?: number;
    pointsEarned?: number;
    receiptData: {
      paymentNumber: string;
      timestamp: string;
      items: OrderItem[];
      totals: {
        subtotal: number;
        discount: number;
        tax: number;
        total: number;
        paid: number;
        change: number;
      };
    };
  };
}
```

### 2. Refund Payment | برگشت پرداخت

```http
POST /api/payments/:paymentId/refund
```

**Request Body:**
```typescript
interface RefundPaymentRequest {
  amount: number;
  reason: string;
  refundMethod?: PaymentMethod;
}
```

### 3. Split Payment | تقسیم پرداخت

```http
POST /api/payments/split
```

**Request Body:**
```typescript
interface SplitPaymentRequest {
  orderId: string;
  splits: {
    amount: number;
    paymentMethod: PaymentMethod;
    customerName?: string;
  }[];
}
```

---

## 🏷️ Menu Management API | API مدیریت منو

### 1. Get Menu | دریافت منو

```http
GET /api/menu
```

**Query Parameters:**
```typescript
interface GetMenuQuery {
  categoryId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  includeModifiers?: boolean;
  language?: 'fa' | 'en';
}
```

**Response:**
```typescript
interface GetMenuResponse {
  success: boolean;
  data: {
    categories: MenuCategory[];
    items: MenuItem[];
    modifiers: MenuItemModifier[];
  };
}
```

### 2. Update Item Availability | به‌روزرسانی موجودی آیتم

```http
PUT /api/menu/items/:itemId/availability
```

**Request Body:**
```typescript
interface UpdateAvailabilityRequest {
  isAvailable: boolean;
  reason?: string;
  estimatedRestockTime?: string;
}
```

### 3. Bulk Update Prices | به‌روزرسانی گروهی قیمت‌ها

```http
PUT /api/menu/bulk-update-prices
```

**Request Body:**
```typescript
interface BulkUpdatePricesRequest {
  updates: {
    itemId: string;
    newPrice: number;
  }[];
  effectiveDate?: string;
  reason?: string;
}
```

---

## 👨‍🍳 Kitchen Display API | API نمایشگر آشپزخانه

### 1. Get Kitchen Orders | دریافت سفارشات آشپزخانه

```http
GET /api/kitchen/orders
```

**Query Parameters:**
```typescript
interface GetKitchenOrdersQuery {
  station?: string;
  status?: OrderStatus[];
  priority?: number;
  limit?: number;
}
```

**Response:**
```typescript
interface GetKitchenOrdersResponse {
  success: boolean;
  data: {
    orders: KitchenDisplayOrder[];
    stations: string[];
    statistics: {
      pending: number;
      preparing: number;
      ready: number;
      averagePrepTime: number;
    };
  };
}

interface KitchenDisplayOrder {
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
```

### 2. Update Kitchen Order Status | به‌روزرسانی وضعیت سفارش آشپزخانه

```http
PUT /api/kitchen/orders/:orderId/status
```

**Request Body:**
```typescript
interface UpdateKitchenStatusRequest {
  status: OrderStatus;
  itemId?: string; // For individual item status
  estimatedTime?: number;
  notes?: string;
}
```

### 3. Mark Item Ready | علامت‌گذاری آیتم آماده

```http
PUT /api/kitchen/orders/:orderId/items/:itemId/ready
```

**Request Body:**
```typescript
interface MarkItemReadyRequest {
  actualPrepTime?: number;
  qualityNotes?: string;
}
```

---

## 📊 Analytics & Reports API | API تحلیل‌ها و گزارشات

### 1. Sales Summary | خلاصه فروش

```http
GET /api/analytics/sales-summary
```

**Query Parameters:**
```typescript
interface SalesSummaryQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  compareWith?: 'previous-period' | 'last-year';
}
```

**Response:**
```typescript
interface SalesSummaryResponse {
  success: boolean;
  data: {
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
  };
}
```

### 2. Table Performance | عملکرد میزها

```http
GET /api/analytics/table-performance
```

**Response:**
```typescript
interface TablePerformanceResponse {
  success: boolean;
  data: {
    tables: {
      tableId: string;
      tableNumber: string;
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      occupancyRate: number;
      turnoverRate: number;
    }[];
    overallMetrics: {
      averageOccupancyRate: number;
      averageTurnoverRate: number;
      peakHours: number[];
    };
  };
}
```

### 3. Staff Performance | عملکرد کارکنان

```http
GET /api/analytics/staff-performance
```

**Response:**
```typescript
interface StaffPerformanceResponse {
  success: boolean;
  data: {
    staff: {
      userId: string;
      userName: string;
      ordersProcessed: number;
      totalRevenue: number;
      averageOrderValue: number;
      averageServiceTime: number;
      customerRating?: number;
    }[];
  };
}
```

---

## 🔄 Integration Endpoints | نقاط پایانی ادغام

### 1. Sync with Inventory | همگام‌سازی با انبار

```http
POST /api/integration/inventory/sync
```

**Request Body:**
```typescript
interface InventorySyncRequest {
  orderId: string;
  items: {
    itemId: string;
    quantityUsed: number;
  }[];
}
```

### 2. Generate Accounting Entry | تولید سند حسابداری

```http
POST /api/integration/accounting/generate-entry
```

**Request Body:**
```typescript
interface GenerateAccountingEntryRequest {
  orderId: string;
  paymentId: string;
  entryType: 'SALE' | 'REFUND' | 'DISCOUNT';
}
```

### 3. Update Customer Visit | به‌روزرسانی بازدید مشتری

```http
POST /api/integration/crm/update-visit
```

**Request Body:**
```typescript
interface UpdateCustomerVisitRequest {
  orderId: string;
  customerId?: string;
  visitData: {
    totalAmount: number;
    itemsOrdered: string[];
    serviceRating?: number;
    feedbackComment?: string;
  };
}
```

---

## 🚨 Real-time Events | رویدادهای بلادرنگ

### WebSocket Connection
```
ws://api.servaan.com/ws/ordering
```

### Event Types
```typescript
interface OrderStatusUpdate {
  type: 'ORDER_STATUS_UPDATE';
  orderId: string;
  status: OrderStatus;
  timestamp: string;
}

interface NewOrderAlert {
  type: 'NEW_ORDER';
  order: Order;
  station: string;
}

interface PaymentCompleted {
  type: 'PAYMENT_COMPLETED';
  orderId: string;
  paymentId: string;
  amount: number;
}

interface TableStatusUpdate {
  type: 'TABLE_STATUS_UPDATE';
  tableId: string;
  status: TableStatus;
}
```

---

## 📝 Error Handling | مدیریت خطا

### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string; // For validation errors
  };
  timestamp: string;
  requestId: string;
}
```

### Common Error Codes
```typescript
const ErrorCodes = {
  // Order Errors
  'ORDER_NOT_FOUND': 'سفارش یافت نشد',
  'ORDER_ALREADY_COMPLETED': 'سفارش قبلاً تکمیل شده است',
  'ORDER_CANNOT_BE_MODIFIED': 'سفارش قابل تغییر نیست',
  'INSUFFICIENT_STOCK': 'موجودی کافی نیست',
  
  // Payment Errors
  'PAYMENT_FAILED': 'پرداخت ناموفق بود',
  'INSUFFICIENT_AMOUNT': 'مبلغ کافی نیست',
  'PAYMENT_ALREADY_PROCESSED': 'پرداخت قبلاً انجام شده است',
  
  // Table Errors
  'TABLE_NOT_AVAILABLE': 'میز در دسترس نیست',
  'TABLE_ALREADY_OCCUPIED': 'میز قبلاً اشغال شده است',
  
  // Authorization Errors
  'INSUFFICIENT_PERMISSIONS': 'دسترسی کافی ندارید',
  'TENANT_MISMATCH': 'عدم تطابق مستأجر',
  
  // Validation Errors
  'INVALID_INPUT': 'ورودی نامعتبر',
  'REQUIRED_FIELD_MISSING': 'فیلد اجباری وارد نشده است'
};
```

---

## 🔐 Rate Limiting | محدودیت نرخ

```typescript
const RateLimits = {
  // Per user per minute
  'GET /api/orders': 100,
  'POST /api/orders': 30,
  'POST /api/payments/process': 20,
  
  // Per tenant per minute
  'GET /api/analytics/*': 50,
  'POST /api/integration/*': 100
};
```

---

*Last Updated: [Current Date]*
*Version: 1.0* 