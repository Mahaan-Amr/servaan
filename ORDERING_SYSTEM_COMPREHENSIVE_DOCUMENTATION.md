# Ordering & Sales System Workspace - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Core Features](#core-features)
7. [Integration Features](#integration-features)
8. [User Roles and Permissions](#user-roles-and-permissions)
9. [API Endpoints](#api-endpoints)
10. [Business Logic](#business-logic)
11. [Testing](#testing)

---

## Overview

The Ordering & Sales System workspace is a comprehensive Point of Sale (POS) and order management system designed for restaurants, cafes, and food service businesses. It provides end-to-end order processing from menu selection to payment, kitchen management, table management, and comprehensive analytics.

### Key Capabilities

1. **Point of Sale (POS) System**
   - Real-time order creation and processing
   - Multiple order types (Dine-in, Takeaway, Delivery, Online)
   - Flexible payment options (Immediate, Pay After Service, Partial)
   - Multiple payment methods (Cash, Card, Mixed)
   - Stock validation and warnings
   - Receipt printing

2. **Menu Management**
   - Category-based menu organization
   - Menu item management with pricing
   - Modifiers and customization options
   - Recipe-based ingredient tracking
   - Availability management

3. **Order Management**
   - Order lifecycle tracking (Draft → Submitted → Confirmed → Preparing → Ready → Served → Completed)
   - Order modifications and cancellations
   - Bulk order operations
   - Order history and search

4. **Kitchen Display System (KDS)**
   - Real-time order display for kitchen staff
   - Station-based order routing
   - Priority management
   - Prep time tracking
   - Order status updates

5. **Table Management**
   - Table layout visualization
   - Table status tracking (Available, Occupied, Reserved, Cleaning, Out of Order)
   - Reservation management
   - QR code table ordering
   - Table analytics and performance metrics

6. **Payment Processing**
   - Multiple payment methods
   - Split payments
   - Partial payments
   - Refund management
   - Payment gateway integration (Iranian gateways: Mellat, Saman, Parsian, Zarinpal)

7. **Analytics & Reporting**
   - Sales analytics
   - Customer analytics
   - Kitchen performance metrics
   - Table utilization analytics
   - Revenue reports
   - Top-selling items

8. **Integrations**
   - Inventory system integration (recipe-based stock deduction)
   - Accounting system integration (journal entries, COGS calculation)
   - Stock validation and override tracking

### Technical Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Frontend**: Next.js, React, TypeScript
- **Database**: PostgreSQL
- **Real-time**: Socket.io for live updates
- **Authentication**: JWT-based authentication
- **Multi-tenancy**: Tenant-based data isolation

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   POS    │  │  Kitchen │  │  Tables  │  │ Analytics │   │
│  │  Page    │  │  Display │  │  Page    │  │   Page    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Ordering Service (Frontend)                   │   │
│  │  - OrderService, PaymentService, MenuService, etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ Socket.io (Real-time)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Routes     │  │  Controllers  │  │   Services    │    │
│  │              │  │               │  │               │    │
│  │ orderingRoutes│ │ OrderController│ │ OrderService  │    │
│  │ menuRoutes   │  │ MenuController │ │ MenuService   │    │
│  │ paymentRoutes│  │ PaymentController│ PaymentService│    │
│  │ tableRoutes  │  │ TableController│ │ TableService  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Integration Services                          │   │
│  │  - OrderInventoryIntegrationService                   │   │
│  │  - OrderAccountingIntegrationService                  │   │
│  │  - OrderingAnalyticsService                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Orders  │  │  Menu    │  │  Tables  │  │ Payments │   │
│  │ OrderItems│ │ MenuItems│ │ Reservations│ │ Kitchen  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Layers

1. **Presentation Layer (Frontend)**
   - React components for UI
   - Next.js pages for routing
   - Context API for state management
   - Service layer for API communication

2. **Application Layer (Backend)**
   - Express routes for API endpoints
   - Controllers for request handling
   - Services for business logic
   - Integration services for cross-system communication

3. **Data Layer**
   - Prisma ORM for database access
   - PostgreSQL for data persistence
   - Database transactions for data consistency

4. **Integration Layer**
   - Inventory system integration
   - Accounting system integration
   - Real-time updates via Socket.io

---

## Database Schema

The Ordering & Sales System uses PostgreSQL with Prisma ORM. All models are tenant-scoped for multi-tenancy support.

### Core Enums

```prisma
enum OrderStatus {
  DRAFT        // پیش‌نویس
  PENDING      // در انتظار
  CONFIRMED    // تأیید شده
  PREPARING    // در حال آماده‌سازی
  READY        // آماده
  SERVED       // سرو شده
  COMPLETED    // تکمیل شده
  CANCELLED    // لغو شده
  REFUNDED     // مرجوع شده
  SUBMITTED    // ارسال شده
  MODIFIED     // تغییر یافته
  PARTIALLY_PAID // پرداخت جزئی
}

enum OrderType {
  DINE_IN      // صرف در محل
  TAKEAWAY     // بیرون بر
  DELIVERY     // تحویل
  ONLINE       // آنلاین
}

enum PaymentStatus {
  PENDING      // در انتظار
  PARTIAL      // جزئی
  PAID         // پرداخت شده
  REFUNDED     // مرجوع شده
  FAILED       // ناموفق
}

enum PaymentMethod {
  CASH         // نقدی
  CARD         // کارت
  ONLINE       // آنلاین
  MIXED        // ترکیبی
  POINTS       // امتیاز
}

enum TableStatus {
  AVAILABLE    // آزاد
  OCCUPIED     // اشغال
  RESERVED     // رزرو شده
  CLEANING     // در حال تمیزکاری
  OUT_OF_ORDER // خارج از سرویس
}
```

### Core Models

#### Order Model

The main order entity that tracks all order information.

```prisma
model Order {
  id              String              @id @default(uuid())
  tenantId        String
  orderNumber     String              @unique @db.VarChar(50)
  orderType       OrderType           @default(DINE_IN)
  status          OrderStatus         @default(DRAFT)
  priority        Int                 @default(0)
  
  // Customer Information
  customerId      String?
  customerName    String?             @db.VarChar(100)
  customerPhone   String?             @db.VarChar(20)
  
  // Table Information
  tableId         String?
  guestCount      Int?
  
  // Financial Information
  subtotal        Decimal             @db.Decimal(12, 2)
  discountAmount  Decimal             @default(0) @db.Decimal(12, 2)
  taxAmount       Decimal             @default(0) @db.Decimal(12, 2)
  serviceCharge   Decimal             @default(0) @db.Decimal(12, 2)
  totalAmount     Decimal             @db.Decimal(12, 2)
  
  // Payment Information
  paymentStatus   PaymentStatus       @default(PENDING)
  paymentMethod   PaymentMethod?
  paidAmount      Decimal             @default(0) @db.Decimal(12, 2)
  changeAmount    Decimal             @default(0) @db.Decimal(12, 2)
  remainingAmount Decimal             @default(0) @db.Decimal(12, 2)
  paymentType     String?             @db.VarChar(50)
  lastPaymentAt   DateTime?
  paymentNotes    String?
  
  // Timing Information
  orderDate       DateTime            @default(now())
  estimatedTime   Int?
  startedAt       DateTime?
  readyAt         DateTime?
  servedAt         DateTime?
  completedAt     DateTime?
  
  // System Information
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  createdBy       String
  servedBy        String?
  
  // Notes
  notes           String?
  kitchenNotes    String?
  allergyInfo     String?
  
  // Relations
  items           OrderItem[]
  payments        OrderPayment[]
  modifications   OrderModification[]
  kitchenDisplays KitchenDisplay[]
  orderOptions    OrderOptions?
  stockOverrides  StockOverride[]
  createdByUser   User                @relation("OrderCreatedBy", fields: [createdBy], references: [id])
  servedByUser    User?               @relation("OrderServedBy", fields: [servedBy], references: [id])
  customer        Customer?           @relation(fields: [customerId], references: [id])
  table           Table?              @relation(fields: [tableId], references: [id])
  tenant          Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([orderNumber])
  @@index([status])
  @@index([orderType])
  @@index([orderDate])
  @@index([customerId])
  @@index([tableId])
  @@map("orders")
}
```

**Key Features:**
- Unique order number per tenant
- Flexible payment tracking (partial payments supported)
- Complete order lifecycle timestamps
- Support for multiple order types
- Integration with inventory (via stockOverrides)

#### OrderItem Model

Represents individual items within an order.

```prisma
model OrderItem {
  id              String      @id @default(uuid())
  orderId         String
  itemId          String?     // Optional: linked inventory item
  menuItemId      String?     // Direct reference to menu item
  itemName        String      @db.VarChar(200)
  itemCode        String?     @db.VarChar(50)
  quantity        Int         @default(1)
  unitPrice       Decimal     @db.Decimal(10, 2)
  totalPrice      Decimal     @db.Decimal(12, 2)
  modifiers       Json        @default("[]")
  specialRequest  String?
  prepStatus      OrderStatus @default(DRAFT)
  prepStartedAt   DateTime?
  prepCompletedAt DateTime?
  lineNumber      Int
  tenantId        String
  createdAt       DateTime    @default(now())
  
  // Relations
  item            Item?       @relation(fields: [itemId], references: [id])
  menuItem        MenuItem?   @relation(fields: [menuItemId], references: [id])
  order           Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  tenant          Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([orderId])
  @@index([itemId])
  @@index([menuItemId])
  @@index([prepStatus])
  @@map("order_items")
}
```

**Key Features:**
- Supports both inventory-linked items and standalone menu items
- Modifiers stored as JSON for flexibility
- Individual prep status tracking per item
- Line numbers for order sequencing

#### MenuCategory Model

Organizes menu items into categories.

```prisma
model MenuCategory {
  id            String     @id @default(uuid())
  tenantId      String
  name          String     @db.VarChar(100)
  nameEn        String?    @db.VarChar(100)
  description   String?
  displayOrder  Int        @default(0)
  isActive      Boolean    @default(true)
  color         String?    @db.VarChar(20)
  icon          String?    @db.VarChar(100)
  availableFrom String?
  availableTo   String?
  availableDays Json       @default("[]")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  tenant        Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  items         MenuItem[]

  @@index([tenantId])
  @@index([displayOrder])
  @@map("menu_categories")
}
```

**Key Features:**
- Time-based availability (availableFrom, availableTo)
- Day-based availability (availableDays JSON array)
- Display ordering for custom menu layouts
- Bilingual support (name, nameEn)

#### MenuItem Model

Represents individual menu items with pricing and details.

```prisma
model MenuItem {
  id            String             @id @default(uuid())
  tenantId      String
  itemId        String?            // Optional: linked inventory item
  categoryId    String
  displayName   String             @db.VarChar(200)
  displayNameEn String?           @db.VarChar(200)
  description   String?
  shortDesc     String?           @db.VarChar(100)
  menuPrice     Decimal            @db.Decimal(10, 2)
  originalPrice Decimal?          @db.Decimal(10, 2)
  displayOrder  Int                @default(0)
  isActive      Boolean            @default(true)
  isAvailable   Boolean            @default(true)
  isFeatured    Boolean            @default(false)
  isSpicy       Boolean            @default(false)
  isVegetarian  Boolean            @default(false)
  isNew         Boolean            @default(false)
  imageUrl      String?            @db.VarChar(500)
  thumbnailUrl  String?            @db.VarChar(500)
  prepTime      Int?
  cookingNotes  String?
  availableFrom String?
  availableTo   String?
  maxOrderQty   Int?
  calories      Int?
  allergens     String[]           @default([])
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  
  // Relations
  modifiers     MenuItemModifier[]
  orderItems    OrderItem[]
  category      MenuCategory       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  item          Item?              @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tenant        Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  recipe        Recipe?

  @@unique([tenantId, itemId])
  @@index([tenantId])
  @@index([categoryId])
  @@index([isActive])
  @@index([displayOrder])
  @@map("menu_items")
}
```

**Key Features:**
- Optional inventory item linkage for recipe-based stock management
- Rich metadata (allergens, calories, prep time)
- Availability flags and time-based availability
- Image support for visual menus

#### Recipe & RecipeIngredient Models

Link menu items to inventory items for cost calculation and stock deduction.

```prisma
model Recipe {
  id             String             @id @default(uuid())
  tenantId       String
  menuItemId     String             @unique
  name           String             @db.VarChar(200)
  description    String?
  instructions   String?
  yield          Int                @default(1)
  prepTime       Int?
  totalCost      Decimal            @default(0) @db.Decimal(10, 2)
  costPerServing Decimal            @default(0) @db.Decimal(10, 2)
  isActive       Boolean            @default(true)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  ingredients    RecipeIngredient[]
  menuItem       MenuItem           @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  tenant         Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([menuItemId])
  @@map("recipes")
}

model RecipeIngredient {
  id         String   @id @default(uuid())
  tenantId   String
  recipeId   String
  itemId     String
  quantity   Decimal  @db.Decimal(10, 3)
  unit       String   @db.VarChar(20)
  unitCost   Decimal  @db.Decimal(10, 2)
  totalCost  Decimal  @db.Decimal(12, 2)
  isOptional Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  item       Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  recipe     Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([recipeId])
  @@index([itemId])
  @@map("recipe_ingredients")
}
```

**Key Features:**
- One recipe per menu item (1:1 relationship)
- Ingredient quantities with units
- Cost tracking at ingredient and recipe level
- Optional ingredients support

#### Table Model

Manages restaurant table information and status.

```prisma
model Table {
  id           String             @id @default(uuid())
  tenantId     String
  tableNumber  String             @db.VarChar(10)
  tableName    String?            @db.VarChar(50)
  capacity     Int                @default(4)
  status       TableStatus        @default(AVAILABLE)
  section      String?            @db.VarChar(50)
  floor        Int                @default(1)
  positionX    Float?
  positionY    Float?
  isActive     Boolean            @default(true)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  orders       Order[]
  reservations TableReservation[]
  statusLogs   TableStatusLog[]
  tenant       Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, tableNumber])
  @@index([tenantId])
  @@index([status])
  @@map("tables")
}
```

**Key Features:**
- Position coordinates for visual layout
- Status tracking with history (via TableStatusLog)
- Section and floor organization
- Capacity management

#### TableReservation Model

Tracks table reservations.

```prisma
model TableReservation {
  id              String    @id @default(uuid())
  tenantId        String
  tableId         String
  customerId      String?
  customerName    String    @db.VarChar(100)
  customerPhone   String    @db.VarChar(20)
  guestCount      Int       @default(2)
  reservationDate DateTime
  duration        Int       @default(120)
  status          String    @default("CONFIRMED")
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String
  createdByUser   User      @relation("ReservationCreatedBy", fields: [createdBy], references: [id])
  customer        Customer? @relation(fields: [customerId], references: [id])
  table           Table     @relation(fields: [tableId], references: [id], onDelete: Cascade)
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([tableId])
  @@index([reservationDate])
  @@map("table_reservations")
}
```

#### OrderPayment Model

Tracks individual payment transactions for orders.

```prisma
model OrderPayment {
  id              String        @id @default(uuid())
  tenantId        String
  paymentNumber   String        @unique @db.VarChar(50)
  orderId         String
  amount          Decimal       @db.Decimal(12, 2)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  gatewayId       String?       @db.VarChar(100)
  transactionId   String?       @db.VarChar(100)
  referenceNumber String?       @db.VarChar(100)
  terminalId      String?       @db.VarChar(50)
  cardMask        String?       @db.VarChar(20)
  cardType        String?       @db.VarChar(20)
  paymentDate     DateTime      @default(now())
  processedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  processedBy     String
  failureReason   String?
  retryCount      Int           @default(0)
  order           Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  processedByUser User          @relation("PaymentProcessedBy", fields: [processedBy], references: [id])
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([orderId])
  @@index([paymentStatus])
  @@index([paymentDate])
  @@map("order_payments")
}
```

**Key Features:**
- Multiple payments per order (partial payments)
- Payment gateway integration fields
- Retry mechanism for failed payments
- Card information masking for security

#### KitchenDisplay Model

Manages kitchen display system entries for order tracking.

```prisma
model KitchenDisplay {
  id            String      @id @default(uuid())
  tenantId      String
  orderId       String
  displayName   String      @db.VarChar(50)
  station       String      @db.VarChar(50)
  status        OrderStatus @default(DRAFT)
  priority      Int         @default(0)
  displayedAt   DateTime    @default(now())
  startedAt     DateTime?
  completedAt   DateTime?
  estimatedTime Int?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  order         Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([orderId])
  @@index([status])
  @@index([displayName])
  @@map("kitchen_displays")
}
```

**Key Features:**
- Multiple displays per order (different stations)
- Priority-based ordering
- Prep time tracking
- Status synchronization with order

#### OrderOptions Model

Stores order-level options like discounts, taxes, and service charges.

```prisma
model OrderOptions {
  id                String   @id @default(uuid())
  tenantId          String
  orderId           String   @unique
  discountEnabled   Boolean  @default(false)
  discountType      String   @db.VarChar(20)
  discountValue     Decimal  @default(0) @db.Decimal(12, 2)
  taxEnabled        Boolean  @default(true)
  taxPercentage     Decimal  @default(9.00) @db.Decimal(5, 2)
  serviceEnabled    Boolean  @default(true)
  servicePercentage Decimal  @default(10.00) @db.Decimal(5, 2)
  courierEnabled    Boolean  @default(false)
  courierAmount     Decimal  @default(0) @db.Decimal(12, 2)
  courierNotes      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  order             Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([orderId])
  @@map("order_options")
}
```

**Key Features:**
- Configurable tax and service charge percentages
- Discount support (percentage or fixed amount)
- Courier fee for delivery orders
- One-to-one relationship with Order

#### OrderModification Model

Tracks all modifications made to orders for audit purposes.

```prisma
model OrderModification {
  id               String   @id @default(uuid())
  tenantId         String
  orderId          String
  modificationType String   @db.VarChar(50)
  description      String
  previousData     Json?
  newData          Json?
  amountChange     Decimal  @default(0) @db.Decimal(12, 2)
  previousTotal    Decimal  @db.Decimal(12, 2)
  newTotal         Decimal  @db.Decimal(12, 2)
  createdAt        DateTime @default(now())
  modifiedBy       String
  modifiedByUser   User     @relation("OrderModifiedBy", fields: [modifiedBy], references: [id])
  order            Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  tenant           Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([orderId])
  @@index([modificationType])
  @@index([createdAt])
  @@map("order_modifications")
}
```

**Key Features:**
- Complete audit trail of order changes
- Before/after data capture
- Amount change tracking
- Modification type categorization

#### MenuItemModifier Model

Defines customization options for menu items.

```prisma
model MenuItemModifier {
  id              String   @id @default(uuid())
  tenantId        String
  menuItemId      String
  name            String   @db.VarChar(100)
  nameEn          String?  @db.VarChar(100)
  additionalPrice Decimal  @default(0) @db.Decimal(8, 2)
  isRequired      Boolean  @default(false)
  maxQuantity     Int      @default(1)
  displayOrder    Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  menuItem        MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([menuItemId])
  @@map("menu_item_modifiers")
}
```

**Key Features:**
- Optional and required modifiers
- Additional pricing support
- Quantity limits
- Bilingual support

---

## Backend Implementation

The backend is built with Express.js, TypeScript, and Prisma ORM. It follows a layered architecture with routes, controllers, and services.

### Route Structure

All routes are defined in `src/backend/src/routes/orderingRoutes.ts`:

```
/api/ordering/
├── /orders                    # Order CRUD operations
├── /orders/:id                # Single order operations
├── /orders/:id/status         # Status updates
├── /orders/:id/cancel         # Order cancellation
├── /orders/:id/complete       # Order completion
├── /orders/:id/add-items      # Add items to order
├── /orders/bulk/status         # Bulk status updates
├── /orders/today/summary      # Today's summary
├── /orders/active              # Active orders
├── /menu                       # Menu management
├── /menu/categories             # Category operations
├── /menu/items                 # Menu item operations
├── /menu/items/:id/modifiers   # Modifier operations
├── /payments                   # Payment processing
├── /payments/:id/refund        # Refund processing
├── /tables                     # Table management
├── /tables/:id/status          # Table status updates
├── /tables/:id/reservations    # Reservation operations
├── /kitchen                    # Kitchen display
├── /kitchen/:displayName        # Display-specific orders
├── /analytics                  # Analytics endpoints
└── /recipes                    # Recipe management
```

### Core Services

#### OrderService (`src/backend/src/services/orderService.ts`)

Main service for order management operations.

**Key Methods:**

1. **`createOrder(data: CreateOrderData)`**
   - Creates a new order with transaction support
   - Generates unique order number
   - Creates kitchen display entries
   - Links menu items to inventory items
   - Handles table status updates
   - Returns complete order with items

2. **`createOrderWithTableUpdate(data: CreateOrderData)`**
   - Wrapper around `createOrder` that also updates table status
   - Sets table to OCCUPIED if dine-in order
   - Handles table assignment

3. **`updateOrder(orderId: string, data: UpdateOrderData)`**
   - Updates order details
   - Recalculates totals if items change
   - Records modifications for audit trail
   - Updates kitchen display if needed

4. **`updateOrderStatus(orderId: string, status: OrderStatus, userId: string)`**
   - Updates order status
   - Updates timestamps (startedAt, readyAt, servedAt, completedAt)
   - Updates kitchen display status
   - Handles table status on completion

5. **`cancelOrder(orderId: string, reason: string, userId: string)`**
   - Cancels an order
   - Records cancellation reason
   - Updates table status if applicable
   - Handles refunds if payment was made

6. **`generateOrderNumberInTransaction(tx, tenantId: string)`**
   - Generates unique order number within transaction
   - Format: `YYYYMMDD-XXXXX` (date + sequential number)
   - Prevents race conditions

**Order Number Generation:**
```typescript
async generateOrderNumberInTransaction(tx, tenantId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  // Get today's last order number
  const lastOrder = await tx.order.findFirst({
    where: {
      tenantId,
      orderNumber: { startsWith: dateStr }
    },
    orderBy: { orderNumber: 'desc' }
  });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-')[1] || '0');
    sequence = lastSeq + 1;
  }
  
  return `${dateStr}-${sequence.toString().padStart(5, '0')}`;
}
```

#### MenuService (`src/backend/src/services/menuService.ts`)

Manages menu categories and items.

**Key Methods:**

1. **`createCategory(tenantId: string, categoryData: CreateCategoryData)`**
   - Creates menu category
   - Validates name uniqueness
   - Auto-assigns display order if not provided

2. **`getCategories(tenantId: string, includeInactive: boolean)`**
   - Fetches categories with item counts
   - Checks time-based availability
   - Returns preview items

3. **`createMenuItem(tenantId: string, itemData: CreateMenuItemData)`**
   - Creates menu item
   - Links to inventory item if provided
   - Validates category exists

4. **`getMenuItems(tenantId: string, options: MenuFilterOptions)`**
   - Fetches menu items with filtering
   - Supports category, price range, search filters
   - Checks availability based on time and stock

5. **`updateMenuItemAvailability(tenantId: string)`**
   - Updates menu item availability based on ingredient stock
   - Called when inventory changes

#### PaymentService (`src/backend/src/services/paymentService.ts`)

Handles payment processing and refunds.

**Key Methods:**

1. **`processPayment(tenantId: string, paymentData: ProcessPaymentData, processedBy: string)`**
   - Processes payment for an order
   - Validates payment amount
   - Handles single and split payments
   - Updates order payment status
   - Records payment transaction
   - Calculates change for cash payments

2. **`processSinglePayment(...)`**
   - Processes single payment method
   - Supports CASH, CARD, ONLINE, POINTS
   - Integrates with payment gateways

3. **`processSplitPayment(...)`**
   - Processes multiple payment methods
   - Validates total equals order amount
   - Creates multiple payment records

4. **`refundPayment(tenantId: string, refundData: RefundPaymentData, processedBy: string)`**
   - Processes refunds
   - Validates refund amount
   - Creates refund payment record
   - Updates order status

**Payment Validation:**
```typescript
// Calculate remaining amount from payments table
const totalPaidFromPayments = order.payments.reduce(
  (sum, payment) => sum + Number(payment.amount), 
  0
);
const remainingAmount = Number(order.totalAmount) - totalPaidFromPayments;

// Validate payment doesn't exceed remaining
if (paymentData.amount > remainingAmount) {
  throw new AppError('Payment amount exceeds remaining balance', 400);
}
```

#### TableService (`src/backend/src/services/tableService.ts`)

Manages table operations and reservations.

**Key Methods:**

1. **`createTable(tenantId: string, tableData: CreateTableData)`**
   - Creates new table
   - Validates table number uniqueness
   - Validates capacity (1-20)

2. **`getTables(tenantId: string, options: TableFilterOptions)`**
   - Fetches tables with caching
   - Supports filtering by section, floor, status
   - Includes current orders and reservations

3. **`updateTableStatus(tenantId: string, tableId: string, status: TableStatus, userId: string)`**
   - Updates table status
   - Records status change in TableStatusLog
   - Invalidates cache

4. **`createReservation(tenantId: string, reservationData: CreateReservationData, userId: string)`**
   - Creates table reservation
   - Validates table availability
   - Checks for conflicts

5. **`getTableById(tenantId: string, tableId: string)`**
   - Fetches table with related data
   - Includes active orders
   - Includes upcoming reservations

**Caching Strategy:**
- Uses `tableCacheService` for performance
- Cache keys: `tables:${tenantId}`, `table_stats:${tenantId}`
- Cache invalidation on create/update/delete

#### KitchenDisplayService (`src/backend/src/services/kitchenDisplayService.ts`)

Manages kitchen display system.

**Key Methods:**

1. **`getKitchenDisplayOrders(tenantId: string, displayName: string, options: KitchenDisplayFilterOptions)`**
   - Fetches orders for specific kitchen display
   - Filters by station, status, priority
   - Calculates elapsed time
   - Transforms to kitchen display format

2. **`createKitchenDisplayEntry(tenantId: string, data: CreateKitchenDisplayData)`**
   - Creates kitchen display entry
   - Links to order
   - Sets default priority and estimated time

3. **`updateKitchenDisplayStatus(tenantId: string, displayId: string, status: OrderStatus)`**
   - Updates display status
   - Updates timestamps (startedAt, completedAt)
   - Syncs with order status

**Kitchen Display Format:**
```typescript
interface KitchenDisplayOrder {
  orderId: string;
  orderNumber: string;
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    modifiers: string[];
    specialRequest?: string;
    prepStatus: OrderStatus;
  }>;
  priority: number;
  estimatedTime: number;
  elapsedTime: number;
  status: OrderStatus;
  notes?: string;
  allergyInfo?: string;
}
```

#### RecipeService (`src/backend/src/services/recipeService.ts`)

Manages recipes and ingredients.

**Key Methods:**

1. **`createRecipe(tenantId: string, recipeData: CreateRecipeData)`**
   - Creates recipe for menu item
   - Validates menu item exists
   - Ensures one recipe per menu item

2. **`getRecipeByMenuItem(tenantId: string, menuItemId: string)`**
   - Fetches recipe with ingredients
   - Includes item details and costs

3. **`addIngredient(tenantId: string, ingredientData: CreateRecipeIngredientData)`**
   - Adds ingredient to recipe
   - Calculates total cost
   - Updates recipe cost per serving

4. **`updateRecipeCosts(tenantId: string)`**
   - Recalculates all recipe costs
   - Updates ingredient costs from inventory
   - Updates cost per serving

**Cost Calculation:**
```typescript
// Calculate ingredient cost
const unitCost = await getInventoryPrice(itemId, tenantId);
const totalCost = quantity * unitCost;

// Update recipe total cost
const recipeTotalCost = recipe.ingredients.reduce(
  (sum, ing) => sum + Number(ing.totalCost), 
  0
);
const costPerServing = recipeTotalCost / recipe.yield;
```

### Integration Services

#### OrderInventoryIntegrationService (`src/backend/src/services/orderInventoryIntegrationService.ts`)

Handles integration between ordering system and inventory management.

**Key Methods:**

1. **`validateFlexibleStockAvailability(tenantId: string, menuItemId: string, orderQuantity: number)`**
   - Validates stock availability with flexible rules
   - Returns warnings (low, critical, out of stock)
   - Provides suggested actions
   - Allows override capability
   - Does NOT block order creation

2. **`processRecipeStockDeduction(tenantId: string, orderId: string, userId: string)`**
   - Deducts inventory for recipe ingredients when order is completed
   - Creates OUT inventory entries for each ingredient
   - Uses recipe quantities multiplied by order quantity
   - Handles optional ingredients

3. **`calculateOrderCOGS(tenantId: string, orderItems: OrderItemWithRecipe[])`**
   - Calculates Cost of Goods Sold for order items
   - Uses recipe ingredient costs
   - Returns detailed breakdown per item

4. **`updateMenuItemAvailability(tenantId: string)`**
   - Updates menu item availability based on ingredient stock
   - Sets `isAvailable = false` if any required ingredient is out of stock
   - Called when inventory changes

5. **`getRecipeIngredientLowStockAlerts(tenantId: string)`**
   - Returns low stock alerts for recipe ingredients
   - Prioritized by usage frequency
   - Groups by menu item

**Stock Validation Response:**
```typescript
interface FlexibleStockValidationResult {
  menuItemId: string;
  menuItemName: string;
  isAvailable: boolean;
  warnings: Array<{
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    status: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
    message: string;
  }>;
  criticalWarnings: number;
  suggestedActions: string[];
  overrideRequired: boolean;
}
```

#### OrderAccountingIntegrationService (`src/backend/src/services/orderAccountingIntegrationService.ts`)

Handles integration with accounting system for journal entries and COGS.

**Key Methods:**

1. **`generateRecipeOrderJournalEntry(tenantId: string, orderData: RecipeOrderJournalEntry, createdBy: string)`**
   - Creates comprehensive journal entry for order
   - Multi-line entry with detailed breakdown
   - Debits: Cash/Bank/AR, COGS
   - Credits: Sales Revenue, Tax Payable, Service Charge Payable
   - Uses recipe-based COGS calculation

2. **`calculateIranianTax(subtotal: number, vatRate: number, incomeTaxRate: number, municipalTaxRate: number)`**
   - Calculates Iranian tax components
   - VAT (9% default)
   - Income tax
   - Municipal tax
   - Returns breakdown

3. **`generateRefundJournalEntry(tenantId: string, refundData: RecipeRefundJournalEntry, createdBy: string)`**
   - Creates journal entry for refunds
   - Reverses original entry
   - Handles COGS reversal

**Journal Entry Structure:**
```typescript
// Debit Side
- Cash/Bank/Accounts Receivable (totalAmount)
- COGS (totalCOGS)

// Credit Side
- Sales Revenue (subtotal)
- Tax Payable (taxAmount)
- Service Charge Payable (serviceCharge)
```

#### OrderingAnalyticsService (`src/backend/src/services/orderingAnalyticsService.ts`)

Provides comprehensive analytics for the ordering system.

**Key Methods:**

1. **`getSalesSummary(tenantId: string, startDate: Date, endDate: Date)`**
   - Total revenue and orders
   - Average order value
   - Revenue and order growth (vs previous period)
   - Top selling items
   - Hourly breakdown
   - Daily revenue
   - Payment methods distribution

2. **`getCustomerAnalytics(tenantId: string, startDate: Date, endDate: Date)`**
   - Total customers
   - New vs repeat customers
   - Average order value
   - Customer growth
   - Top customers
   - Customer segments

3. **`getKitchenPerformance(tenantId: string, startDate: Date, endDate: Date)`**
   - Average prep time
   - On-time delivery percentage
   - Efficiency metrics
   - Top items by order count
   - Performance by hour

4. **`getTableUtilization(tenantId: string, startDate: Date, endDate: Date)`**
   - Average utilization
   - Peak hours
   - Top performing tables
   - Capacity optimization recommendations

**Analytics Data Structure:**
```typescript
interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;  // Percentage
  orderGrowth: number;     // Percentage
  topSellingItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}
```

### Controllers

Controllers act as intermediaries between routes and services, handling HTTP request/response.

#### OrderController (`src/backend/src/controllers/orderController.ts`)

**Key Endpoints:**

1. **`POST /api/ordering/orders`** - `createOrder`
   - Validates request
   - Performs stock validation
   - Creates order via OrderService
   - Records stock overrides if needed
   - Returns order with stock validation results

2. **`GET /api/ordering/orders`** - `getOrders`
   - Fetches orders with filtering
   - Supports pagination
   - Returns formatted order list

3. **`PUT /api/ordering/orders/:id`** - `updateOrder`
   - Updates order details
   - Validates permissions
   - Records modifications

4. **`PATCH /api/ordering/orders/:id/status`** - `updateOrderStatus`
   - Updates order status
   - Validates status transitions
   - Updates related entities

5. **`POST /api/ordering/orders/:id/cancel`** - `cancelOrder`
   - Cancels order
   - Validates cancellation rules
   - Handles refunds

#### PaymentController (`src/backend/src/controllers/paymentController.ts`)

**Key Endpoints:**

1. **`POST /api/ordering/payments`** - `processPayment`
   - Processes payment
   - Validates amount
   - Updates order status
   - Returns payment details

2. **`POST /api/ordering/payments/:id/refund`** - `refundPayment`
   - Processes refund
   - Validates refund amount
   - Updates order status

#### MenuController (`src/backend/src/controllers/menuController.ts`)

**Key Endpoints:**

1. **`GET /api/ordering/menu/categories`** - `getCategories`
   - Returns categories with item counts
   - Checks availability

2. **`POST /api/ordering/menu/categories`** - `createCategory`
   - Creates new category
   - Validates uniqueness

3. **`GET /api/ordering/menu/items`** - `getMenuItems`
   - Returns menu items with filtering
   - Checks availability

4. **`POST /api/ordering/menu/items`** - `createMenuItem`
   - Creates menu item
   - Links to inventory if provided

---

## Frontend Implementation

The frontend is built with Next.js, React, and TypeScript. It uses a service layer for API communication and context API for state management.

### Page Structure

```
/workspaces/ordering-sales-system/
├── page.tsx                    # Dashboard
├── layout.tsx                   # Workspace layout with sidebar
├── pos/
│   └── page.tsx                # Point of Sale interface
├── menu/
│   └── page.tsx                # Menu management
├── orders/
│   └── page.tsx                # Order management
├── kitchen/
│   └── page.tsx                # Kitchen display
├── tables/
│   └── page.tsx                # Table management
├── payments/
│   └── page.tsx                # Payment management
└── analytics/
    └── page.tsx                # Analytics dashboard
```

### Main Pages

#### Dashboard (`page.tsx`)

Main dashboard showing key statistics and quick actions.

**Features:**
- Today's revenue and orders
- Active orders count
- Low stock alerts (from inventory integration)
- Quick action cards:
  - New Order (POS)
  - Menu Management
  - Kitchen Display
  - Reports
- Recent orders list

**Key Components:**
- Stats cards for revenue, orders, active orders
- Low stock alerts component
- Quick action navigation cards

#### POS Page (`pos/page.tsx`)

Main Point of Sale interface for order creation and payment.

**Features:**
- Category-based menu display
- Item selection with modifiers
- Order cart management
- Customer information input
- Table selection (for dine-in)
- Order type selection (Dine-in, Takeaway, Delivery, Online)
- Stock validation warnings
- Payment processing
- Receipt printing
- Flexible payment options (Pay After Service, Partial)

**Key Components:**
- `OrderSummary` - Displays current order items and totals
- `PaymentModal` - Payment processing interface
- `FlexiblePaymentModal` - Pay after service option
- `AddItemsModal` - Add items to existing order
- `StockWarningModal` - Displays stock validation warnings
- `ReceiptTemplate` - Receipt preview and printing
- `OrderOptions` - Discount, tax, service charge configuration
- `PrinterSettingsModal` - Printer configuration

**State Management:**
```typescript
const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
const [customer, setCustomer] = useState<Customer>({});
const [selectedTable, setSelectedTable] = useState<Table | null>(null);
const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
const [showPayment, setShowPayment] = useState(false);
const [showStockWarning, setShowStockWarning] = useState(false);
const [stockWarnings, setStockWarnings] = useState<StockWarning[]>([]);
```

**Order Creation Flow:**
1. Select items from menu
2. Add modifiers if needed
3. Select order type and table (if dine-in)
4. Configure order options (discount, tax, service charge)
5. Review order summary
6. Validate stock (shows warnings if needed)
7. Process payment or create flexible order
8. Print receipt

**Stock Validation Integration:**
- Validates stock before order creation
- Shows warnings for low/critical/out of stock items
- Allows override with reason
- Records overrides for analytics

#### Menu Page (`menu/page.tsx`)

Menu management interface for categories and items.

**Features:**
- Category list with item counts
- Menu item grid/list view
- Create/edit/delete categories
- Create/edit/delete menu items
- Link menu items to inventory items
- Modifier management
- Recipe management
- Availability management
- Image upload for items

**Key Operations:**
- Category CRUD
- Menu item CRUD
- Modifier CRUD
- Recipe creation and ingredient management
- Availability toggle
- Price management

#### Orders Page (`orders/page.tsx`)

Order management and history interface.

**Features:**
- Order list with filtering
- Status filtering (All, Active, Completed, Cancelled)
- Order type filtering
- Date range filtering
- Search by order number, customer name
- Order details view
- Order editing
- Order cancellation
- Bulk status updates
- Order modification history

**Key Operations:**
- View order details
- Edit order items
- Update order status
- Cancel orders
- View payment history
- View modification history

#### Kitchen Display Page (`kitchen/page.tsx`)

Kitchen display system for order preparation.

**Features:**
- Real-time order display
- Station-based filtering
- Priority-based ordering
- Order status updates
- Prep time tracking
- Elapsed time display
- Item-level prep status
- Special requests and allergy info display
- Auto-refresh via polling or WebSocket

**Key Features:**
- Multiple display support (Main Kitchen, Bar, etc.)
- Station filtering
- Status filtering (All, Preparing, Ready)
- Time range filtering
- Priority indicators
- Color-coded status
- Sound notifications for new orders

**Display Format:**
- Order number and type
- Table number (if dine-in)
- Customer name
- Items with quantities
- Modifiers and special requests
- Allergy information
- Kitchen notes
- Estimated time and elapsed time
- Priority badge

#### Tables Page (`tables/page.tsx`)

Table management and visualization interface.

**Features:**
- Table layout visualization
- Table status indicators
- Table details view
- Create/edit/delete tables
- Table status updates
- Reservation management
- QR code generation for tables
- Table analytics
- Bulk operations

**Key Components:**
- `TableLayoutDesigner` - Visual table layout editor
- `TableStatusManager` - Status update interface
- `ReservationManager` - Reservation CRUD
- `ReservationCalendar` - Calendar view for reservations
- `TableQRManager` - QR code generation
- `TableAnalyticsDashboard` - Table performance metrics
- `BulkOperationsManager` - Bulk table operations
- `AdvancedAnalyticsDashboard` - Advanced analytics

**Table Status:**
- Available (green)
- Occupied (red)
- Reserved (yellow)
- Cleaning (blue)
- Out of Order (gray)

#### Payments Page (`payments/page.tsx`)

Payment management and history interface.

**Features:**
- Payment list with filtering
- Payment details view
- Refund processing
- Payment method filtering
- Date range filtering
- Search functionality
- Payment statistics

**Key Operations:**
- View payment details
- Process refunds
- Filter by payment method
- View payment history per order

#### Analytics Page (`analytics/page.tsx`)

Comprehensive analytics dashboard.

**Features:**
- Sales analytics
  - Revenue trends
  - Order trends
  - Top selling items
  - Hourly breakdown
  - Payment method distribution
- Customer analytics
  - Customer segments
  - Top customers
  - Customer growth
- Kitchen performance
  - Prep time metrics
  - On-time delivery
  - Efficiency metrics
- Table utilization
  - Utilization rates
  - Peak hours
  - Top performing tables

**Visualizations:**
- Line charts for revenue/orders over time
- Bar charts for top items
- Pie charts for payment methods
- Heat maps for hourly patterns
- Tables for detailed data

### Frontend Services

#### OrderingService (`src/frontend/services/orderingService.ts`)

Main service for API communication.

**Key Services:**

1. **OrderService**
   - `createOrder(orderData)` - Create new order
   - `getOrders(options)` - Fetch orders with filtering
   - `getOrderById(orderId)` - Get single order
   - `updateOrder(orderId, updateData)` - Update order
   - `updateOrderStatus(orderId, status)` - Update status
   - `cancelOrder(orderId, reason)` - Cancel order
   - `getActiveOrders()` - Get active orders
   - `getTodaysSummary()` - Get today's summary

2. **PaymentService**
   - `processPayment(paymentData)` - Process payment
   - `getPayments(options)` - Fetch payments
   - `refundPayment(paymentId, refundData)` - Refund payment

3. **MenuService**
   - `getCategories()` - Get menu categories
   - `createCategory(categoryData)` - Create category
   - `getMenuItems(options)` - Get menu items
   - `createMenuItem(itemData)` - Create menu item
   - `getModifiers(menuItemId)` - Get item modifiers

4. **TableService**
   - `getTables(options)` - Get tables
   - `createTable(tableData)` - Create table
   - `updateTableStatus(tableId, status)` - Update status
   - `getReservations(options)` - Get reservations
   - `createReservation(reservationData)` - Create reservation

5. **KitchenService**
   - `getKitchenOrders(displayName, options)` - Get kitchen orders
   - `updateKitchenStatus(displayId, status)` - Update status

6. **AnalyticsService**
   - `getSalesAnalytics(startDate, endDate)` - Get sales analytics
   - `getCustomerAnalytics(startDate, endDate)` - Get customer analytics
   - `getKitchenPerformance(startDate, endDate)` - Get kitchen metrics
   - `getTableUtilization(startDate, endDate)` - Get table metrics

7. **InventoryIntegrationService**
   - `validateStock(menuItemId, quantity)` - Validate stock
   - `validateOrderStock(orderItems)` - Validate order stock
   - `recordStockOverride(overrideData)` - Record override

**API Request Utility:**
```typescript
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${ORDERING_API_BASE}${endpoint}`;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Tenant-Subdomain': extractSubdomain(window.location.hostname)
  };
  
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
    cache: 'no-store'
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || data;
}
```

### Layout Component

#### Workspace Layout (`layout.tsx`)

Provides sidebar navigation and workspace structure.

**Features:**
- Collapsible sidebar
- Navigation items:
  - Dashboard
  - POS
  - Menu
  - Orders
  - Kitchen Display
  - Tables
  - Payments
  - Analytics
- Active route highlighting
- User information display
- Workspace protection (role-based access)

**Navigation Structure:**
```typescript
const navItems = [
  { href: '/workspaces/ordering-sales-system', label: 'Dashboard', icon: FaHome },
  { href: '/workspaces/ordering-sales-system/pos', label: 'POS', icon: FaCashRegister },
  { href: '/workspaces/ordering-sales-system/menu', label: 'Menu', icon: FaUtensils },
  { href: '/workspaces/ordering-sales-system/orders', label: 'Orders', icon: FaList },
  { href: '/workspaces/ordering-sales-system/kitchen', label: 'Kitchen', icon: FaFire },
  { href: '/workspaces/ordering-sales-system/tables', label: 'Tables', icon: FaTable },
  { href: '/workspaces/ordering-sales-system/payments', label: 'Payments', icon: FaCreditCard },
  { href: '/workspaces/ordering-sales-system/analytics', label: 'Analytics', icon: FaChartBar }
];
```

---

## Core Features

### 1. Order Management

#### Order Lifecycle

Orders progress through the following statuses:

1. **DRAFT** - Order being created
2. **SUBMITTED** - Order submitted (initial status after creation)
3. **CONFIRMED** - Order confirmed by staff
4. **PREPARING** - Order being prepared in kitchen
5. **READY** - Order ready for service
6. **SERVED** - Order served to customer
7. **COMPLETED** - Order completed and paid
8. **CANCELLED** - Order cancelled
9. **REFUNDED** - Order refunded

#### Order Types

- **DINE_IN** - Customer dining in restaurant
- **TAKEAWAY** - Customer taking order to go
- **DELIVERY** - Order delivered to customer
- **ONLINE** - Order from online platform (SnapFood, etc.)

#### Order Number Generation

- Format: `YYYYMMDD-XXXXX`
- Example: `20240115-00001`
- Sequential per day
- Unique per tenant
- Generated within transaction to prevent duplicates

#### Order Modifications

All order changes are tracked in `OrderModification` table:
- Modification type (ITEM_ADDED, ITEM_REMOVED, PRICE_CHANGED, etc.)
- Previous and new data (JSON)
- Amount change
- Modified by user
- Timestamp

### 2. Payment Processing

#### Payment Methods

- **CASH** - Cash payment
- **CARD** - Card payment (terminal)
- **ONLINE** - Online payment gateway
- **MIXED** - Multiple payment methods
- **POINTS** - Loyalty points

#### Payment Types

- **IMMEDIATE** - Payment at order creation
- **PAY_AFTER_SERVICE** - Payment after service
- **PARTIAL** - Partial payment

#### Payment Flow

1. Order created with payment type
2. If IMMEDIATE: Payment processed immediately
3. If PAY_AFTER_SERVICE: Order created, payment processed later
4. If PARTIAL: Partial payment processed, remaining tracked
5. Multiple payments can be made per order
6. Order payment status updated based on total paid

#### Payment Validation

- Validates payment amount doesn't exceed remaining balance
- Calculates remaining from payments table (not order.paidAmount)
- Supports partial payments
- Calculates change for cash payments

#### Refunds

- Full or partial refunds
- Refund payment record created
- Order status updated to REFUNDED
- Journal entry created for accounting

### 3. Menu Management

#### Categories

- Hierarchical organization
- Display order for custom layouts
- Time-based availability (availableFrom, availableTo)
- Day-based availability (availableDays array)
- Color and icon customization

#### Menu Items

- Link to inventory items (optional)
- Pricing (menuPrice, originalPrice for discounts)
- Rich metadata (allergens, calories, prep time)
- Availability flags (isAvailable, isActive)
- Time-based availability
- Image support
- Modifiers support

#### Modifiers

- Optional and required modifiers
- Additional pricing
- Quantity limits
- Display ordering

### 4. Kitchen Display System

#### Features

- Real-time order display
- Multiple displays (Main Kitchen, Bar, etc.)
- Station-based filtering
- Priority-based ordering
- Prep time tracking
- Elapsed time display
- Item-level prep status
- Special requests and allergy info

#### Status Updates

- Kitchen staff can update order status
- Updates sync with main order
- Timestamps tracked (startedAt, completedAt)
- Priority can be adjusted

### 5. Table Management

#### Table Status

- **AVAILABLE** - Table is free
- **OCCUPIED** - Table has active order
- **RESERVED** - Table is reserved
- **CLEANING** - Table being cleaned
- **OUT_OF_ORDER** - Table unavailable

#### Table Operations

- Create/edit/delete tables
- Visual layout designer
- Position tracking (X, Y coordinates)
- Section and floor organization
- Capacity management

#### Reservations

- Create reservations with date/time
- Guest count tracking
- Customer information
- Duration management
- Conflict detection
- Calendar view

#### QR Code Ordering

- Generate QR codes for tables
- Customers scan to view menu and order
- Orders linked to table automatically

### 6. Recipe Management

#### Recipe Structure

- One recipe per menu item
- Ingredients with quantities and units
- Cost tracking (unit cost, total cost)
- Cost per serving calculation
- Optional ingredients support

#### Cost Calculation

- Ingredient costs from inventory (WAC)
- Recipe total cost = sum of ingredient costs
- Cost per serving = total cost / yield
- Auto-updates when inventory prices change

#### Stock Integration

- Recipes link menu items to inventory items
- Stock validation before order creation
- Stock deduction when order completed
- Menu availability based on ingredient stock

### 7. Analytics & Reporting

#### Sales Analytics

- Total revenue and orders
- Average order value
- Growth metrics (vs previous period)
- Top selling items
- Hourly breakdown
- Daily revenue trends
- Payment method distribution

#### Customer Analytics

- Total customers
- New vs repeat customers
- Customer growth
- Top customers
- Customer segments
- Average order value per customer

#### Kitchen Performance

- Average prep time
- On-time delivery percentage
- Efficiency metrics
- Top items by order count
- Performance by hour

#### Table Utilization

- Average utilization rate
- Peak hours identification
- Top performing tables
- Capacity optimization recommendations

---

## Integration Features

### 1. Inventory System Integration

#### Stock Validation

Before order creation, the system validates stock availability for recipe ingredients:

1. **Flexible Stock Validation**
   - Checks ingredient stock levels
   - Returns warnings (LOW, CRITICAL, OUT_OF_STOCK)
   - Does NOT block order creation
   - Allows staff override with reason

2. **Stock Warnings**
   - **LOW**: Stock below threshold but available
   - **CRITICAL**: Stock very low
   - **OUT_OF_STOCK**: No stock available

3. **Override Mechanism**
   - Staff can override warnings
   - Records override reason and type
   - Types: STAFF_DECISION, EMERGENCY_PURCHASE, SUBSTITUTE_INGREDIENT, VIP_CUSTOMER
   - Stored in `StockOverride` table for analytics

#### Stock Deduction

When order is completed:
1. System retrieves recipe for each menu item
2. For each ingredient in recipe:
   - Calculates required quantity = recipe quantity × order quantity
   - Creates OUT inventory entry
   - Deducts from stock
   - Uses current WAC for cost calculation

#### Menu Availability

Menu item availability automatically updates based on ingredient stock:
- If any required ingredient is out of stock → `isAvailable = false`
- If all required ingredients in stock → `isAvailable = true`
- Optional ingredients don't affect availability

#### Low Stock Alerts

- Retrieves low stock alerts for recipe ingredients
- Prioritized by usage frequency
- Grouped by menu item
- Displayed on dashboard

### 2. Accounting System Integration

#### Journal Entries

When order is completed and paid, system creates journal entry:

**Debit Side:**
- Cash/Bank/Accounts Receivable (totalAmount)
- COGS (totalCOGS from recipe)

**Credit Side:**
- Sales Revenue (subtotal)
- Tax Payable (taxAmount)
- Service Charge Payable (serviceCharge)

#### COGS Calculation

- Uses recipe ingredient costs
- Calculates total COGS per order item
- Uses current inventory WAC for ingredient costs
- Detailed breakdown per ingredient

#### Refund Handling

When order is refunded:
- Creates reverse journal entry
- Reverses COGS
- Reverses revenue
- Updates accounting records

#### Iranian Tax Calculation

Supports Iranian tax structure:
- VAT (9% default)
- Income tax
- Municipal tax
- Calculates total tax amount

### 3. Real-time Updates

#### Socket.io Integration

- Real-time order status updates
- Kitchen display updates
- Table status updates
- Payment notifications

#### Events

- `order:created` - New order created
- `order:status:updated` - Order status changed
- `table:status:updated` - Table status changed
- `payment:processed` - Payment completed
- `kitchen:order:updated` - Kitchen order updated

---

## API Endpoints

### Order Endpoints

#### Create Order
```
POST /api/ordering/orders
Body: {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE',
  customerId?: string,
  customerName?: string,
  customerPhone?: string,
  tableId?: string,
  guestCount?: number,
  items: Array<{
    itemId: string,
    quantity: number,
    modifiers?: Array<{ modifierId: string, quantity: number }>,
    specialRequest?: string
  }>,
  notes?: string,
  kitchenNotes?: string,
  allergyInfo?: string,
  paymentType?: 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL',
  paymentMethod?: 'CASH' | 'CARD',
  paidAmount?: number,
  stockOverrides?: Array<{...}>
}
Response: {
  success: true,
  data: {
    order: Order,
    stockValidation: {
      hasWarnings: boolean,
      warnings: Array<...>,
      criticalWarnings: number
    }
  }
}
```

#### Get Orders
```
GET /api/ordering/orders?status[]=ACTIVE&orderType[]=DINE_IN&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20
Response: {
  data: Order[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

#### Update Order Status
```
PATCH /api/ordering/orders/:id/status
Body: {
  status: OrderStatus,
  reason?: string
}
```

#### Cancel Order
```
POST /api/ordering/orders/:id/cancel
Body: {
  reason: string,
  refundAmount?: number
}
```

### Payment Endpoints

#### Process Payment
```
POST /api/ordering/payments
Body: {
  orderId: string,
  amount: number,
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE' | 'MIXED',
  cashReceived?: number,
  cardInfo?: {
    terminalId: string,
    transactionRef?: string
  },
  splitPayments?: Array<{
    method: PaymentMethod,
    amount: number
  }>
}
```

#### Refund Payment
```
POST /api/ordering/payments/:id/refund
Body: {
  refundAmount: number,
  reason: string,
  refundMethod?: PaymentMethod
}
```

### Menu Endpoints

#### Get Categories
```
GET /api/ordering/menu/categories?includeInactive=false
Response: Array<MenuCategory>
```

#### Create Category
```
POST /api/ordering/menu/categories
Body: {
  name: string,
  nameEn?: string,
  description?: string,
  displayOrder?: number,
  color?: string,
  icon?: string,
  availableFrom?: string,
  availableTo?: string,
  availableDays?: string[]
}
```

#### Get Menu Items
```
GET /api/ordering/menu/items?categoryId=xxx&isAvailable=true&search=pizza
Response: Array<MenuItem>
```

### Table Endpoints

#### Get Tables
```
GET /api/ordering/tables?section=Main&status[]=AVAILABLE&status[]=OCCUPIED
Response: Array<Table>
```

#### Update Table Status
```
PATCH /api/ordering/tables/:id/status
Body: {
  status: TableStatus,
  reason?: string
}
```

#### Create Reservation
```
POST /api/ordering/tables/:id/reservations
Body: {
  customerId?: string,
  customerName: string,
  customerPhone: string,
  guestCount: number,
  reservationDate: string,
  duration?: number,
  notes?: string
}
```

### Kitchen Display Endpoints

#### Get Kitchen Orders
```
GET /api/ordering/kitchen/:displayName?station=Main Kitchen&status[]=PREPARING
Response: Array<KitchenDisplayOrder>
```

#### Update Kitchen Status
```
PATCH /api/ordering/kitchen/:id/status
Body: {
  status: OrderStatus,
  priority?: number
}
```

### Analytics Endpoints

#### Get Sales Analytics
```
GET /api/ordering/analytics/sales?startDate=2024-01-01&endDate=2024-01-31
Response: SalesAnalytics
```

#### Get Customer Analytics
```
GET /api/ordering/analytics/customers?startDate=2024-01-01&endDate=2024-01-31
Response: CustomerAnalytics
```

#### Get Kitchen Performance
```
GET /api/ordering/analytics/kitchen?startDate=2024-01-01&endDate=2024-01-31
Response: KitchenPerformance
```

---

## Business Logic

### Order Calculation

#### Subtotal Calculation
```
subtotal = sum(item.unitPrice × item.quantity) + sum(modifier.additionalPrice)
```

#### Tax Calculation
```
taxAmount = subtotal × (taxPercentage / 100)
```

#### Service Charge Calculation
```
serviceCharge = subtotal × (servicePercentage / 100)
```

#### Total Calculation
```
totalAmount = subtotal - discountAmount + taxAmount + serviceCharge + courierAmount
```

### Stock Validation Logic

1. For each menu item in order:
   - Get recipe
   - For each ingredient:
     - Calculate required quantity = recipe.quantity × order.quantity
     - Get current stock
     - Compare and determine status:
       - If stock < required: OUT_OF_STOCK
       - If stock < required × 1.5: CRITICAL
       - If stock < required × 2: LOW
       - Else: OK

2. Aggregate warnings:
   - If any OUT_OF_STOCK: overrideRequired = true
   - Count critical and low warnings
   - Generate suggested actions

### Payment Processing Logic

1. Calculate remaining amount:
   ```
   remainingAmount = order.totalAmount - sum(payments.amount)
   ```

2. Validate payment:
   ```
   if paymentAmount > remainingAmount:
     throw error
   ```

3. Update order:
   ```
   newPaidAmount = currentPaidAmount + paymentAmount
   if newPaidAmount >= order.totalAmount:
     paymentStatus = PAID
   else if newPaidAmount > 0:
     paymentStatus = PARTIAL
   else:
     paymentStatus = PENDING
   ```

### Order Status Transitions

Valid status transitions:
- DRAFT → SUBMITTED (on order creation)
- SUBMITTED → CONFIRMED (staff confirmation)
- CONFIRMED → PREPARING (kitchen starts)
- PREPARING → READY (kitchen completes)
- READY → SERVED (served to customer)
- SERVED → COMPLETED (payment completed)
- Any → CANCELLED (with reason)
- Any → REFUNDED (after refund)

### Table Status Logic

When order created for table:
- Table status → OCCUPIED
- TableStatusLog entry created

When order completed:
- If no other active orders for table:
  - Table status → AVAILABLE (or CLEANING if needed)
- TableStatusLog entry created

---

## Testing

### Unit Tests

Test files located in `src/backend/tests/unit/`:
- `orderService.test.ts` - Order service logic
- `paymentService.test.ts` - Payment processing
- `menuService.test.ts` - Menu operations
- `tableService.test.ts` - Table management

### Integration Tests

Test files located in `src/backend/tests/integration/`:
- `ordering.routes.test.ts` - API endpoint testing
- `payment.routes.test.ts` - Payment endpoints
- `menu.routes.test.ts` - Menu endpoints

### Test Coverage

Key areas covered:
- Order creation and updates
- Payment processing and validation
- Stock validation logic
- Table status management
- Recipe cost calculations
- Journal entry generation

---

## Summary

The Ordering & Sales System workspace provides a comprehensive solution for restaurant order management, from POS to kitchen display, table management, and analytics. It integrates seamlessly with inventory and accounting systems, providing real-time stock validation, recipe-based cost tracking, and automated journal entries. The system supports multiple order types, flexible payment options, and provides detailed analytics for business insights.

**Key Strengths:**
- Flexible stock validation with override capability
- Recipe-based inventory integration
- Comprehensive analytics and reporting
- Real-time kitchen display system
- Multi-payment method support
- Complete audit trail
- Multi-tenancy support

This documentation serves as a complete reference for understanding, maintaining, and extending the Ordering & Sales System workspace.

