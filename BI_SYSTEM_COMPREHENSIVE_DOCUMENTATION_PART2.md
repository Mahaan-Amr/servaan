# Business Intelligence System Workspace - Comprehensive Documentation
## Part 2: Database Schema and Data Models

## Table of Contents
1. [Core Models](#core-models)
2. [Enums](#enums)
3. [Data Relationships](#data-relationships)
4. [Database Indexes](#database-indexes)
5. [Data Aggregation Patterns](#data-aggregation-patterns)

---

## Core Models

### CustomReport Model

The `CustomReport` model stores user-defined report configurations.

```prisma
model CustomReport {
  id               String            @id @default(uuid())
  tenantId         String
  tenant           Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name             String
  description      String?
  reportType       ReportType        @default(TABULAR)
  dataSources      Json              // Array of data source configurations
  columnsConfig    Json              // Column definitions and configurations
  filtersConfig    Json?             // Filter configurations
  sortingConfig    Json?             // Sorting configurations
  chartConfig      Json?             // Chart-specific configurations
  layoutConfig     Json?             // Layout and display configurations
  isPublic         Boolean           @default(false)
  createdBy        String
  sharedWith       Json?             // Array of user IDs who have access
  tags             String[]          // Tags for categorization
  executionCount   Int               @default(0)
  lastRunAt        DateTime?
  avgExecutionTime Int?              // Average execution time in milliseconds
  isActive         Boolean           @default(true)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  // Relations
  creator          User              @relation(fields: [createdBy], references: [id])
  executions       ReportExecution[]

  @@index([createdBy])
  @@index([isPublic])
  @@index([reportType])
  @@index([createdAt])
  @@index([lastRunAt])
  @@index([tenantId])
  @@map("custom_reports")
}
```

**Key Features:**
- **Multi-tenant**: Isolated per tenant
- **Flexible Configuration**: JSON fields for dynamic report structure
- **Sharing**: Public reports and user-specific sharing
- **Performance Tracking**: Execution count and average execution time
- **Tags**: Categorization for easy discovery

**JSON Field Structures:**

**dataSources:**
```typescript
[
  {
    id: 'inventory',
    name: 'Inventory',
    type: 'database',
    connection: { table: 'inventory_entries' }
  },
  {
    id: 'orders',
    name: 'Orders',
    type: 'database',
    connection: { table: 'orders' }
  }
]
```

**columnsConfig:**
```typescript
[
  {
    id: 'item_name',
    name: 'item_name',
    type: 'text',
    table: 'items',
    label: 'نام کالا',
    aggregation: 'none'
  },
  {
    id: 'total_value',
    name: 'total_value',
    type: 'currency',
    table: 'inventory_entries',
    label: 'ارزش کل',
    aggregation: 'sum'
  }
]
```

**filtersConfig:**
```typescript
[
  {
    field: 'entry_date',
    operator: 'gte',
    value: '2024-01-01',
    type: 'date'
  },
  {
    field: 'entry_type',
    operator: 'equals',
    value: 'OUT',
    type: 'text'
  }
]
```

**sortingConfig:**
```typescript
[
  {
    field: 'total_value',
    direction: 'desc'
  }
]
```

### ReportExecution Model

The `ReportExecution` model tracks report execution history for auditing and performance monitoring.

```prisma
model ReportExecution {
  id            String       @id @default(uuid())
  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  reportId      String
  executedBy    String
  executionTime Int          // Execution time in milliseconds
  resultCount   Int?         // Number of rows returned
  parameters    Json?        // Runtime parameters used
  exportFormat  ExportFormat @default(VIEW)
  status        ReportStatus
  errorMessage  String?
  executedAt    DateTime     @default(now())
  
  // Relations
  executor      User         @relation(fields: [executedBy], references: [id])
  report        CustomReport @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId, executedAt])
  @@index([executedBy])
  @@index([status])
  @@index([executedAt])
  @@index([tenantId])
  @@map("report_executions")
}
```

**Key Features:**
- **Audit Trail**: Complete execution history
- **Performance Monitoring**: Execution time tracking
- **Error Tracking**: Error messages for failed executions
- **Parameter Logging**: Runtime parameters used
- **Export Tracking**: Format used for export

### Related Models (From Other Workspaces)

The BI workspace aggregates data from these models:

#### Order Model (Ordering Workspace)
```prisma
model Order {
  id              String       @id @default(uuid())
  tenantId        String
  orderNumber     String       @unique
  orderType       OrderType
  status          OrderStatus
  subtotal        Decimal
  taxAmount       Decimal
  totalAmount     Decimal
  paymentStatus   PaymentStatus
  orderDate       DateTime
  completedAt     DateTime?
  // ... other fields
}
```

**Used For:**
- Revenue calculations
- Sales volume analysis
- Order trends
- ABC analysis (sales value)

#### OrderItem Model (Ordering Workspace)
```prisma
model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  menuItemId      String?
  itemId          String?
  itemName        String
  quantity        Int
  unitPrice       Decimal
  totalPrice      Decimal
  // ... other fields
}
```

**Used For:**
- Product sales analysis
- Revenue per item
- Quantity sold
- Profit analysis (with recipe costs)

#### InventoryEntry Model (Inventory Workspace)
```prisma
model InventoryEntry {
  id            String           @id @default(uuid())
  tenantId      String
  itemId        String
  type          InventoryEntryType  // IN, OUT, ADJUSTMENT
  quantity      Decimal
  unitPrice     Decimal
  totalValue    Decimal
  orderId       String?          // Link to order
  orderItemId   String?          // Link to order item
  createdAt     DateTime
  // ... other fields
}
```

**Used For:**
- Stock movement analysis
- Inventory valuation
- Stock turnover calculations
- Category consumption

#### JournalEntry Model (Accounting Workspace)
```prisma
model JournalEntry {
  id             String      @id @default(cuid())
  tenantId       String
  entryNumber    String      @unique
  entryDate      DateTime
  totalDebit     Decimal
  totalCredit    Decimal
  status         JournalStatus
  sourceType     SourceType?  // POS, INVENTORY, etc.
  sourceId       String?
  // ... other fields
}
```

**Used For:**
- Financial KPIs
- Revenue recognition
- COGS tracking
- Profit calculations

---

## Enums

### ReportType

```prisma
enum ReportType {
  TABULAR    // جدولی - Table format
  CHART      // نموداری - Chart visualization
  DASHBOARD  // داشبورد - Dashboard layout
  PIVOT      // محوری - Pivot table
}
```

**Usage:**
- **TABULAR**: Standard table reports with rows and columns
- **CHART**: Visual reports with bar, line, pie charts
- **DASHBOARD**: Multi-widget dashboard layouts
- **PIVOT**: Pivot table for data analysis

### ReportStatus

```prisma
enum ReportStatus {
  SUCCESS   // موفق - Report executed successfully
  ERROR     // خطا - Report execution failed
  TIMEOUT   // زمان‌بر - Report execution timed out
  RUNNING   // در حال اجرا - Report currently executing
}
```

**Usage:**
- **SUCCESS**: Report completed successfully
- **ERROR**: Execution failed with error message
- **TIMEOUT**: Execution exceeded time limit
- **RUNNING**: Currently executing (for async reports)

### ExportFormat

```prisma
enum ExportFormat {
  VIEW   // نمایش - View in browser
  PDF    // PDF - Portable Document Format
  EXCEL  // Excel - Microsoft Excel format
  CSV    // CSV - Comma-separated values
  JSON   // JSON - JavaScript Object Notation
}
```

**Usage:**
- **VIEW**: Display results in browser
- **PDF**: Generate PDF document
- **EXCEL**: Export to Excel file
- **CSV**: Export to CSV file
- **JSON**: Export as JSON data

---

## Data Relationships

### CustomReport Relationships

```
CustomReport
  ├─→ Tenant (Many-to-One)
  ├─→ User (creator) (Many-to-One)
  └─→ ReportExecution[] (One-to-Many)
```

**Relationship Details:**
- Each report belongs to one tenant
- Each report has one creator (user)
- Each report can have multiple executions
- Reports can be shared with multiple users (via `sharedWith` JSON array)

### ReportExecution Relationships

```
ReportExecution
  ├─→ Tenant (Many-to-One)
  ├─→ CustomReport (Many-to-One)
  └─→ User (executor) (Many-to-One)
```

**Relationship Details:**
- Each execution belongs to one tenant
- Each execution is for one report
- Each execution is performed by one user
- Cascade delete: If report is deleted, executions are deleted

### Cross-Workspace Data Relationships

```
BI Workspace
  │
  ├─→ Order (Ordering Workspace)
  │   ├─→ OrderItem[]
  │   └─→ OrderPayment[]
  │
  ├─→ InventoryEntry (Inventory Workspace)
  │   ├─→ Item
  │   └─→ Order (via orderId)
  │
  └─→ JournalEntry (Accounting Workspace)
      ├─→ JournalEntryLine[]
      └─→ ChartOfAccount[]
```

**Data Flow:**
1. **Sales Data**: Order → OrderItem → MenuItem/Item
2. **Stock Data**: InventoryEntry → Item → Category
3. **Financial Data**: JournalEntry → JournalEntryLine → ChartOfAccount
4. **Cost Data**: Recipe → RecipeIngredient → Item (WAC)

---

## Database Indexes

### CustomReport Indexes

```sql
-- User's reports
CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by);

-- Public reports
CREATE INDEX idx_custom_reports_is_public ON custom_reports(is_public);

-- Report type filtering
CREATE INDEX idx_custom_reports_report_type ON custom_reports(report_type);

-- Date sorting
CREATE INDEX idx_custom_reports_created_at ON custom_reports(created_at);

-- Last execution sorting
CREATE INDEX idx_custom_reports_last_run_at ON custom_reports(last_run_at);

-- Tenant isolation
CREATE INDEX idx_custom_reports_tenant_id ON custom_reports(tenant_id);
```

### ReportExecution Indexes

```sql
-- Report execution history
CREATE INDEX idx_report_executions_report_executed ON report_executions(report_id, executed_at);

-- User's executions
CREATE INDEX idx_report_executions_executed_by ON report_executions(executed_by);

-- Status filtering
CREATE INDEX idx_report_executions_status ON report_executions(status);

-- Date filtering
CREATE INDEX idx_report_executions_executed_at ON report_executions(executed_at);

-- Tenant isolation
CREATE INDEX idx_report_executions_tenant_id ON report_executions(tenant_id);
```

### Cross-Workspace Indexes (Used by BI)

```sql
-- Order analysis
CREATE INDEX idx_orders_tenant_date ON orders(tenant_id, order_date);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);

-- Order item analysis
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);

-- Inventory analysis
CREATE INDEX idx_inventory_entries_tenant_item ON inventory_entries(tenant_id, item_id);
CREATE INDEX idx_inventory_entries_tenant_date ON inventory_entries(tenant_id, created_at);
CREATE INDEX idx_inventory_entries_order_id ON inventory_entries(order_id);

-- Journal entry analysis
CREATE INDEX idx_journal_entries_tenant_date ON journal_entries(tenant_id, entry_date);
CREATE INDEX idx_journal_entries_source ON journal_entries(source_type, source_id);
```

---

## Data Aggregation Patterns

### Revenue Aggregation

**Pattern**: Sum of order totals for completed orders

```sql
SELECT 
  DATE_TRUNC('day', o.completed_at) as date,
  SUM(o.total_amount) as revenue
FROM orders o
WHERE o.tenant_id = $1
  AND o.status = 'COMPLETED'
  AND o.completed_at >= $2
  AND o.completed_at <= $3
GROUP BY DATE_TRUNC('day', o.completed_at)
ORDER BY date;
```

**Use Cases:**
- Revenue trends
- Daily/weekly/monthly revenue
- Revenue growth calculations

### Sales Volume Aggregation

**Pattern**: Count and sum of order items

```sql
SELECT 
  oi.menu_item_id,
  mi.display_name,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.tenant_id = $1
  AND o.status = 'COMPLETED'
  AND o.completed_at >= $2
  AND o.completed_at <= $3
GROUP BY oi.menu_item_id, mi.display_name
ORDER BY total_revenue DESC;
```

**Use Cases:**
- Top-selling items
- ABC analysis
- Product performance

### Profit Aggregation

**Pattern**: Revenue minus COGS (from recipes)

```sql
SELECT 
  oi.menu_item_id,
  mi.display_name,
  SUM(oi.total_price) as revenue,
  SUM(r.total_cost * oi.quantity) as cost,
  SUM(oi.total_price) - SUM(r.total_cost * oi.quantity) as profit
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN recipes r ON mi.id = r.menu_item_id
WHERE o.tenant_id = $1
  AND o.status = 'COMPLETED'
  AND o.completed_at >= $2
  AND o.completed_at <= $3
GROUP BY oi.menu_item_id, mi.display_name
ORDER BY profit DESC;
```

**Use Cases:**
- Profit analysis
- Profit margin calculations
- Cost analysis

### Inventory Turnover Aggregation

**Pattern**: COGS divided by average inventory value

```sql
WITH period_cogs AS (
  SELECT 
    SUM(ie.total_value) as cogs
  FROM inventory_entries ie
  WHERE ie.tenant_id = $1
    AND ie.type = 'OUT'
    AND ie.created_at >= $2
    AND ie.created_at <= $3
),
avg_inventory AS (
  SELECT 
    AVG(ie.total_value) as avg_value
  FROM inventory_entries ie
  WHERE ie.tenant_id = $1
    AND ie.created_at >= $2
    AND ie.created_at <= $3
)
SELECT 
  pc.cogs / NULLIF(ai.avg_value, 0) as turnover
FROM period_cogs pc, avg_inventory ai;
```

**Use Cases:**
- Inventory efficiency
- Stock turnover rate
- Operational KPIs

### ABC Classification Aggregation

**Pattern**: Cumulative percentage calculation

```sql
WITH product_sales AS (
  SELECT 
    oi.menu_item_id,
    mi.display_name,
    SUM(oi.total_price) as total_sales,
    SUM(oi.quantity) as total_quantity
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE o.tenant_id = $1
    AND o.status = 'COMPLETED'
    AND o.completed_at >= $2
    AND o.completed_at <= $3
  GROUP BY oi.menu_item_id, mi.display_name
),
ranked_products AS (
  SELECT 
    *,
    SUM(total_sales) OVER (ORDER BY total_sales DESC) as cumulative_sales,
    SUM(total_sales) OVER () as grand_total
  FROM product_sales
)
SELECT 
  *,
  (total_sales / grand_total * 100) as percentage,
  (cumulative_sales / grand_total * 100) as cumulative_percentage,
  CASE
    WHEN (cumulative_sales / grand_total * 100) <= 80 THEN 'A'
    WHEN (cumulative_sales / grand_total * 100) <= 95 THEN 'B'
    ELSE 'C'
  END as abc_category
FROM ranked_products
ORDER BY total_sales DESC;
```

**Use Cases:**
- ABC analysis
- Product prioritization
- Inventory management

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Previous Part:** [Part 1: Overview and System Architecture](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART1.md)  
**Next Part:** [Part 3: Backend Implementation](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART3.md)

