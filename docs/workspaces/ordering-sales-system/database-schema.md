# Database Schema - Ordering & Sales System
## طرحواره پایگاه داده - سیستم سفارش‌گیری و فروش

### 📋 Overview | نمای کلی

This document outlines the database schema changes required for the Ordering & Sales System workspace. The schema follows existing patterns in the Servaan platform and ensures seamless integration with inventory, accounting, and CRM systems.

---

## 🗃️ New Models Required | مدل‌های جدید مورد نیاز

### 1. Order Management | مدیریت سفارشات

```prisma
// Order Status Enum
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
}

// Order Type Enum
enum OrderType {
  DINE_IN      // صرف در محل
  TAKEAWAY     // بیرون بر
  DELIVERY     // تحویل
  ONLINE       // آنلاین (اسنپ فود و...)
}

// Payment Status Enum
enum PaymentStatus {
  PENDING      // در انتظار
  PARTIAL      // جزئی
  PAID         // پرداخت شده
  REFUNDED     // مرجوع شده
  FAILED       // ناموفق
}

// Table Status Enum
enum TableStatus {
  AVAILABLE    // آزاد
  OCCUPIED     // اشغال
  RESERVED     // رزرو شده
  CLEANING     // در حال تمیزکاری
  OUT_OF_ORDER // خارج از سرویس
}

// Main Order Model
model Order {
  id              String      @id @default(uuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Order Information
  orderNumber     String      @unique @db.VarChar(50) // شماره سفارش
  orderType       OrderType   @default(DINE_IN)
  status          OrderStatus @default(DRAFT)
  priority        Int         @default(0) // اولویت سفارش
  
  // Customer Information
  customerId      String?
  customer        Customer?   @relation(fields: [customerId], references: [id])
  customerName    String?     @db.VarChar(100)
  customerPhone   String?     @db.VarChar(20)
  
  // Table Information (for dine-in orders)
  tableId         String?
  table           Table?      @relation(fields: [tableId], references: [id])
  guestCount      Int?        // تعداد مهمان
  
  // Financial Information
  subtotal        Decimal     @db.Decimal(12, 2) // مجموع بدون تخفیف
  discountAmount  Decimal     @default(0) @db.Decimal(12, 2) // مبلغ تخفیف
  taxAmount       Decimal     @default(0) @db.Decimal(12, 2) // مالیات
  serviceCharge   Decimal     @default(0) @db.Decimal(12, 2) // عوارض خدمات
  totalAmount     Decimal     @db.Decimal(12, 2) // مجموع نهایی
  
  // Payment Information
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod?
  paidAmount      Decimal     @default(0) @db.Decimal(12, 2)
  changeAmount    Decimal     @default(0) @db.Decimal(12, 2)
  
  // Timing Information
  orderDate       DateTime    @default(now())
  estimatedTime   Int?        // زمان تخمینی آماده‌سازی (دقیقه)
  startedAt       DateTime?   // شروع آماده‌سازی
  readyAt         DateTime?   // آماده شده
  servedAt        DateTime?   // سرو شده
  completedAt     DateTime?   // تکمیل شده
  
  // System Information
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String
  createdByUser   User        @relation("OrderCreatedBy", fields: [createdBy], references: [id])
  servedBy        String?
  servedByUser    User?       @relation("OrderServedBy", fields: [servedBy], references: [id])
  
  // Relations
  items           OrderItem[]
  payments        Payment[]
  kitchenDisplays KitchenDisplay[]
  
  // Notes and Special Instructions
  notes           String?     @db.Text
  kitchenNotes    String?     @db.Text
  allergyInfo     String?     @db.Text
  
  @@index([tenantId])
  @@index([orderNumber])
  @@index([status])
  @@index([orderType])
  @@index([orderDate])
  @@index([customerId])
  @@index([tableId])
  @@map("orders")
}

// Order Items Model
model OrderItem {
  id              String    @id @default(uuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Item Information
  itemId          String
  item            Item      @relation(fields: [itemId], references: [id])
  itemName        String    @db.VarChar(200) // نام محصول در زمان سفارش
  itemCode        String?   @db.VarChar(50)  // کد محصول
  
  // Quantity and Pricing
  quantity        Int       @default(1)
  unitPrice       Decimal   @db.Decimal(10, 2) // قیمت واحد در زمان سفارش
  totalPrice      Decimal   @db.Decimal(12, 2) // مجموع قیمت
  
  // Customizations
  modifiers       Json      @default("[]") // تغییرات و اضافات
  specialRequest  String?   @db.Text       // درخواست ویژه
  
  // Kitchen Information
  prepStatus      OrderStatus @default(PENDING)
  prepStartedAt   DateTime?
  prepCompletedAt DateTime?
  
  // System Information
  createdAt       DateTime  @default(now())
  lineNumber      Int       // شماره ردیف در سفارش
  
  @@index([orderId])
  @@index([itemId])
  @@index([prepStatus])
  @@map("order_items")
}
```

### 2. Table Management | مدیریت میزها

```prisma
// Table Model
model Table {
  id            String      @id @default(uuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Table Information
  tableNumber   String      @db.VarChar(10) // شماره میز
  tableName     String?     @db.VarChar(50) // نام میز
  capacity      Int         @default(4)     // ظرفیت میز
  status        TableStatus @default(AVAILABLE)
  
  // Location Information
  section       String?     @db.VarChar(50) // بخش (سالن اصلی، تراس و...)
  floor         Int         @default(1)     // طبقه
  positionX     Float?      // موقعیت X در نقشه
  positionY     Float?      // موقعیت Y در نقشه
  
  // System Information
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relations
  orders        Order[]
  reservations  TableReservation[]
  
  @@unique([tenantId, tableNumber])
  @@index([tenantId])
  @@index([status])
  @@map("tables")
}

// Table Reservation Model
model TableReservation {
  id            String    @id @default(uuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Reservation Information
  tableId       String
  table         Table     @relation(fields: [tableId], references: [id], onDelete: Cascade)
  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  
  // Reservation Details
  customerName  String    @db.VarChar(100)
  customerPhone String    @db.VarChar(20)
  guestCount    Int       @default(2)
  reservationDate DateTime
  duration      Int       @default(120) // مدت رزرو (دقیقه)
  
  // Status
  status        String    @default("CONFIRMED") // CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
  notes         String?   @db.Text
  
  // System Information
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdBy     String
  createdByUser User      @relation("ReservationCreatedBy", fields: [createdBy], references: [id])
  
  @@index([tenantId])
  @@index([tableId])
  @@index([reservationDate])
  @@map("table_reservations")
}
```

### 3. Payment Processing | پردازش پرداخت

```prisma
// Payment Model
model Payment {
  id              String        @id @default(uuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Payment Information
  paymentNumber   String        @unique @db.VarChar(50)
  orderId         String
  order           Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Payment Details
  amount          Decimal       @db.Decimal(12, 2)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  
  // Payment Gateway Information (for card payments)
  gatewayId       String?       @db.VarChar(100)
  transactionId   String?       @db.VarChar(100)
  referenceNumber String?       @db.VarChar(100)
  terminalId      String?       @db.VarChar(50)
  
  // Card Information (if applicable)
  cardMask        String?       @db.VarChar(20) // ****1234
  cardType        String?       @db.VarChar(20) // VISA, MASTERCARD
  
  // Timing Information
  paymentDate     DateTime      @default(now())
  processedAt     DateTime?
  
  // System Information
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  processedBy     String
  processedByUser User          @relation("PaymentProcessedBy", fields: [processedBy], references: [id])
  
  // Failure Information
  failureReason   String?       @db.Text
  retryCount      Int           @default(0)
  
  @@index([tenantId])
  @@index([orderId])
  @@index([paymentStatus])
  @@index([paymentDate])
  @@map("payments")
}
```

### 4. Kitchen Display System | سیستم نمایشگر آشپزخانه

```prisma
// Kitchen Display Model
model KitchenDisplay {
  id            String      @id @default(uuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Display Information
  orderId       String
  order         Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  displayName   String      @db.VarChar(50) // نام نمایشگر (آشپزخانه اصلی، بار و...)
  station       String      @db.VarChar(50) // ایستگاه کاری
  
  // Status
  status        OrderStatus @default(PENDING)
  priority      Int         @default(0)
  
  // Timing
  displayedAt   DateTime    @default(now())
  startedAt     DateTime?
  completedAt   DateTime?
  estimatedTime Int?        // تخمین زمان (دقیقه)
  
  // System Information
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([tenantId])
  @@index([orderId])
  @@index([status])
  @@index([displayName])
  @@map("kitchen_displays")
}
```

### 5. Menu Management | مدیریت منو

```prisma
// Menu Category Model (extends existing Item categories)
model MenuCategory {
  id            String    @id @default(uuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Category Information
  name          String    @db.VarChar(100)
  nameEn        String?   @db.VarChar(100)
  description   String?   @db.Text
  
  // Display Settings
  displayOrder  Int       @default(0)
  isActive      Boolean   @default(true)
  color         String?   @db.VarChar(20)
  icon          String?   @db.VarChar(100)
  
  // Availability
  availableFrom String?   @db.Time // از ساعت
  availableTo   String?   @db.Time // تا ساعت
  availableDays Json      @default("[]") // روزهای هفته
  
  // System Information
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  items         MenuItem[]
  
  @@index([tenantId])
  @@index([displayOrder])
  @@map("menu_categories")
}

// Menu Item Model (links to existing Item model)
model MenuItem {
  id            String       @id @default(uuid())
  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Item Reference
  itemId        String
  item          Item         @relation(fields: [itemId], references: [id], onDelete: Cascade)
  categoryId    String
  category      MenuCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  // Menu-specific Information
  displayName   String       @db.VarChar(200)
  displayNameEn String?      @db.VarChar(200)
  description   String?      @db.Text
  shortDesc     String?      @db.VarChar(100)
  
  // Pricing
  menuPrice     Decimal      @db.Decimal(10, 2)
  originalPrice Decimal?     @db.Decimal(10, 2) // قیمت اصلی (برای تخفیف)
  
  // Display Settings
  displayOrder  Int          @default(0)
  isActive      Boolean      @default(true)
  isFeatured    Boolean      @default(false) // آیتم ویژه
  isSpicy       Boolean      @default(false)
  isVegetarian  Boolean      @default(false)
  isNew         Boolean      @default(false)
  
  // Images and Media
  imageUrl      String?      @db.VarChar(500)
  thumbnailUrl  String?      @db.VarChar(500)
  
  // Preparation Information
  prepTime      Int?         // زمان آماده‌سازی (دقیقه)
  cookingNotes  String?      @db.Text
  
  // Availability
  isAvailable   Boolean      @default(true)
  availableFrom String?      @db.Time
  availableTo   String?      @db.Time
  maxOrderQty   Int?         // حداکثر تعداد سفارش
  
  // Nutritional Information
  calories      Int?
  allergens     String[]     @default([])
  
  // System Information
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  // Relations
  orderItems    OrderItem[]
  modifiers     MenuItemModifier[]
  
  @@unique([tenantId, itemId])
  @@index([tenantId])
  @@index([categoryId])
  @@index([isActive])
  @@index([displayOrder])
  @@map("menu_items")
}

// Menu Item Modifiers (add-ons, variants)
model MenuItemModifier {
  id          String    @id @default(uuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Modifier Information
  menuItemId  String
  menuItem    MenuItem  @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  name        String    @db.VarChar(100)
  nameEn      String?   @db.VarChar(100)
  
  // Pricing
  additionalPrice Decimal @default(0) @db.Decimal(8, 2)
  
  // Settings
  isRequired  Boolean   @default(false)
  maxQuantity Int       @default(1)
  displayOrder Int      @default(0)
  isActive    Boolean   @default(true)
  
  // System Information
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([tenantId])
  @@index([menuItemId])
  @@map("menu_item_modifiers")
}
```

---

## 🔄 Integration Points | نقاط ادغام

### 1. Inventory Integration | ادغام انبار
- Order completion triggers inventory deduction
- Real-time stock checking during order creation
- Automatic low-stock alerts when items are ordered

### 2. Accounting Integration | ادغام حسابداری
- Automatic journal entry generation for sales
- Tax calculation and recording
- Cost of goods sold (COGS) tracking

### 3. CRM Integration | ادغام مدیریت ارتباط با مشتری
- Customer visit tracking from orders
- Loyalty points calculation and redemption
- Customer behavior analysis

### 4. SMS Integration | ادغام پیامک
- Order confirmation SMS
- Ready for pickup notifications
- Promotional messages for frequent customers

---

## 📊 Database Indexes | ایندکس‌های پایگاه داده

### Performance Indexes
```sql
-- Order performance indexes
CREATE INDEX idx_orders_tenant_date ON orders(tenant_id, order_date);
CREATE INDEX idx_orders_status_type ON orders(status, order_type);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Order items performance
CREATE INDEX idx_order_items_prep_status ON order_items(prep_status);
CREATE INDEX idx_order_items_item_date ON order_items(item_id, created_at);

-- Payment indexes
CREATE INDEX idx_payments_date_method ON payments(payment_date, payment_method);
CREATE INDEX idx_payments_gateway ON payments(gateway_id, transaction_id);

-- Table management indexes
CREATE INDEX idx_tables_status_section ON tables(status, section);
CREATE INDEX idx_reservations_date_table ON table_reservations(reservation_date, table_id);
```

---

## 🔐 Data Security | امنیت داده

### Row Level Security (RLS)
```sql
-- Enable RLS for all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id'));
```

### Sensitive Data Handling
- Card information is masked in storage
- Payment gateway tokens are encrypted
- Customer phone numbers are hashed for privacy
- Audit trail for all financial transactions

---

## 📈 Analytics Views | نماهای تحلیلی

### Sales Analytics Views
```sql
-- Daily sales summary
CREATE VIEW daily_sales_summary AS
SELECT 
    tenant_id,
    DATE(order_date) as sale_date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders 
WHERE status = 'COMPLETED'
GROUP BY tenant_id, DATE(order_date);

-- Popular items view
CREATE VIEW popular_items AS
SELECT 
    oi.tenant_id,
    oi.item_id,
    i.name as item_name,
    COUNT(*) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN items i ON oi.item_id = i.id
WHERE o.status = 'COMPLETED'
GROUP BY oi.tenant_id, oi.item_id, i.name;
```

---

## 🚀 Migration Strategy | استراتژی مهاجرت

### Phase 1: Core Models
1. Create enums and basic models
2. Add foreign key relationships
3. Create basic indexes

### Phase 2: Advanced Features
1. Add menu management models
2. Implement kitchen display system
3. Add analytics views

### Phase 3: Integration
1. Connect to existing models
2. Add cross-workspace relationships
3. Implement data synchronization

---

*Last Updated: [Current Date]*
*Version: 1.0* 