# Business Intelligence System Workspace - Comprehensive Documentation
## Part 3: Backend Implementation

## Table of Contents
1. [Route Structure](#route-structure)
2. [Service Layer](#service-layer)
3. [Data Connector Framework](#data-connector-framework)
4. [Data Aggregator Service](#data-aggregator-service)
5. [Controller Layer](#controller-layer)
6. [Query Builder](#query-builder)
7. [Report Service](#report-service)
8. [Validation and Error Handling](#validation-and-error-handling)

---

## Route Structure

**File:** `src/backend/src/routes/biRoutes.ts`

All BI routes are prefixed with `/api/bi` and require authentication via JWT middleware.

### Route Categories

#### 1. Dashboard and KPI Routes

```
GET /api/bi/dashboard
GET /api/bi/kpis
```

**Purpose:** Real-time dashboard data and KPI calculations

#### 2. Analytics Routes

```
GET /api/bi/analytics/summary
GET /api/bi/analytics/abc-analysis
GET /api/bi/analytics/profit-analysis
GET /api/bi/analytics/trends
```

**Purpose:** Advanced analytics and data analysis

#### 3. Custom Reports Routes

```
POST   /api/bi/reports                    # Create report
GET    /api/bi/reports                    # List reports
GET    /api/bi/reports/:id                # Get report by ID
PUT    /api/bi/reports/:id                # Update report
DELETE /api/bi/reports/:id                # Delete report
POST   /api/bi/reports/:id/execute        # Execute report
GET    /api/bi/reports/:id/executions     # Execution history
POST   /api/bi/reports/:id/share          # Share report
GET    /api/bi/reports/count              # Reports count
GET    /api/bi/reports/exports/today/count # Today's exports count
GET    /api/bi/reports/fields/available   # Available fields
GET    /api/bi/reports/popular/list       # Popular reports
POST   /api/bi/reports/preview/execute    # Preview temporary report
POST   /api/bi/reports/search/advanced    # Advanced search
```

**Purpose:** Custom report management and execution

#### 4. Insights Routes

```
GET /api/bi/insights
```

**Purpose:** AI-powered business insights

#### 5. Export Routes

```
GET /api/bi/export/:reportId
```

**Purpose:** Report export functionality

### Route Ordering

**IMPORTANT:** Specific routes must come BEFORE parametric routes to avoid route conflicts:

```typescript
// ✅ CORRECT ORDER
router.get('/reports/count', ...);           // Specific
router.get('/reports/fields/available', ...); // Specific
router.get('/reports/:id', ...);            // Parametric (comes last)

// ❌ WRONG ORDER (would cause conflicts)
router.get('/reports/:id', ...);            // Parametric
router.get('/reports/count', ...);          // Specific (would never match)
```

---

## Service Layer

### BiService (`src/backend/src/services/biService.ts`)

The main service for BI calculations and analytics.

#### KPI Calculation Methods

##### 1. `calculateTotalRevenue(period: DateRange, tenantId: string): Promise<KPIMetric>`

**Purpose:** Calculate total revenue for a period

**Process:**
1. Fetch all OUT inventory entries in period
2. Sum: `quantity × unitPrice` for each entry
3. Compare with previous period
4. Calculate change percentage and trend

**Returns:**
```typescript
{
  value: number;              // Current period revenue
  previousValue: number;      // Previous period revenue
  change: number;             // Absolute change
  changePercent: number;      // Percentage change
  trend: 'UP' | 'DOWN' | 'STABLE';
  unit: 'تومان';
  description: 'مجموع درآمد از فروش';
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  target: number;             // Growth target (5% above previous)
}
```

##### 2. `calculateNetProfit(period: DateRange, tenantId: string): Promise<KPIMetric>`

**Purpose:** Calculate net profit (Revenue - Costs)

**Process:**
1. Get revenue from inventory OUT entries
2. Get costs from supplier prices or WAC
3. Calculate: `netProfit = revenue - costs`
4. Compare with previous period

**Cost Calculation:**
- Uses supplier unit prices for OUT entries
- Falls back to WAC (Weighted Average Cost) if supplier price unavailable
- Estimates cost as 70% of sale price if no cost data

##### 3. `calculateProfitMargin(period: DateRange, tenantId: string): Promise<KPIMetric>`

**Purpose:** Calculate profit margin percentage

**Formula:**
```typescript
profitMargin = (netProfit / revenue) × 100
```

**Target:** 15% margin (configurable)

**Status Thresholds:**
- `GOOD`: ≥ 15%
- `WARNING`: ≥ 10% and < 15%
- `CRITICAL`: < 10%

##### 4. `calculateInventoryTurnover(period: DateRange, tenantId: string): Promise<KPIMetric>`

**Purpose:** Calculate inventory turnover rate

**Formula:**
```typescript
turnover = COGS / AverageInventoryValue
```

**Process:**
1. Calculate COGS for period
2. Calculate average inventory value (start + end) / 2
3. Divide COGS by average inventory

**Target:** 12 times per year (monthly turnover)

##### 5. `calculateAverageOrderValue(period: DateRange, tenantId: string): Promise<KPIMetric>`

**Purpose:** Calculate average transaction value

**Formula:**
```typescript
AOV = TotalRevenue / NumberOfTransactions
```

**Target:** 50,000 Toman per transaction

##### 6. `calculateStockoutRate(period: DateRange, tenantId: string): Promise<KPIMetric>`

**Purpose:** Calculate percentage of items that went out of stock

**Formula:**
```typescript
stockoutRate = (ItemsWithZeroStock / TotalItems) × 100
```

**Target:** ≤ 5% (maximum acceptable)

**Process:**
1. Get all active items
2. Calculate current stock from inventory entries
3. Count items with stock ≤ 0
4. Calculate percentage

#### Analytics Methods

##### 1. `getAnalyticsSummary(tenantId: string): Promise<AnalyticsSummary>`

**Purpose:** Get summary statistics for analytics dashboard

**Returns:**
```typescript
{
  totalItems: number;              // Total active items
  lowStockCount: number;           // Items below minimum stock
  recentTransactions: number;     // Transactions in last 7 days
  totalInventoryValue: number;     // Total inventory valuation
}
```

**Process:**
1. Count active items
2. Calculate current stock for each item
3. Count items below minimum stock threshold
4. Count inventory entries in last 7 days
5. Calculate total inventory value (stock × unit price)

##### 2. `performABCAnalysis(period: DateRange, tenantId: string): Promise<ABCAnalysis>`

**Purpose:** Classify products into A, B, C categories based on sales value

**Algorithm:**
1. Fetch all active items with OUT entries in period
2. Calculate total sales per product: `sum(quantity × unitPrice)`
3. Sort products by sales value (descending)
4. Calculate cumulative percentage
5. Classify:
   - **Category A**: Cumulative ≤ 80% (top 20% of products, 80% of sales)
   - **Category B**: Cumulative ≤ 95% (next 15% of products, 15% of sales)
   - **Category C**: Cumulative > 95% (remaining products, 5% of sales)

**Returns:**
```typescript
{
  period: DateRange;
  totalProducts: number;
  totalSales: number;
  products: ABCProduct[];
  summary: {
    categoryA: { count: number; salesPercentage: number; products: ABCProduct[] };
    categoryB: { count: number; salesPercentage: number; products: ABCProduct[] };
    categoryC: { count: number; salesPercentage: number; products: ABCProduct[] };
  };
}
```

##### 3. `performProfitAnalysis(period: DateRange, groupBy: 'item' | 'category', tenantId: string): Promise<ProfitAnalysis>`

**Purpose:** Analyze profit by item or category

**Process:**
1. Execute SQL query to aggregate sales data
2. Calculate revenue: `sum(quantity × unitPrice)`
3. Calculate cost: `sum(quantity × costPrice)`
   - Uses WAC from IN entries before OUT date
   - Falls back to 70% of sale price if no cost data
4. Calculate profit: `revenue - cost`
5. Calculate profit margin: `(profit / revenue) × 100`
6. Group by item or category based on `groupBy` parameter

**SQL Query Structure:**
```sql
SELECT 
  i.id,
  i.name,
  i.category,
  SUM(ie_out.quantity) as total_sold,
  SUM(ie_out.quantity * ie_out."unitPrice") as total_revenue,
  SUM(ie_out.quantity * COALESCE(
    (SELECT AVG(ie_in."unitPrice") FROM "InventoryEntry" ie_in 
     WHERE ie_in."itemId" = i.id AND ie_in.type = 'IN' 
     AND ie_in."createdAt" <= ie_out."createdAt"), 
    ie_out."unitPrice" * 0.7
  )) as total_cost,
  SUM(ie_out.quantity * ie_out."unitPrice") - SUM(...) as total_profit
FROM "Item" i
LEFT JOIN "InventoryEntry" ie_out ON i.id = ie_out."itemId" 
  AND ie_out.type = 'OUT' 
  AND ie_out."createdAt" >= $1 
  AND ie_out."createdAt" <= $2
WHERE i."isActive" = true AND i."tenantId" = $3
GROUP BY i.id, i.name, i.category
HAVING SUM(ie_out.quantity) > 0
ORDER BY total_profit DESC
```

**Returns:**
```typescript
{
  period: DateRange;
  groupBy: 'item' | 'category';
  items: Array<{
    id: string;
    name: string;
    category: string;
    totalSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  }>;
  summary: {
    totalItems: number;
    totalRevenue: number;
    totalProfit: number;
    overallMargin: number;
    bestPerformer: ProfitItem | null;
    worstPerformer: ProfitItem | null;
  };
}
```

##### 4. `performTrendAnalysis(metric: string, period: DateRange, granularity: string, tenantId: string): Promise<TrendAnalysis>`

**Purpose:** Analyze trends over time with forecasting

**Supported Metrics:**
- `revenue`: Total revenue per period
- `profit`: Net profit per period
- `sales_volume`: Quantity sold per period
- `customers`: Estimated customer count per period

**Granularity Options:**
- `daily`: Day-by-day analysis
- `weekly`: Week-by-week analysis
- `monthly`: Month-by-month analysis

**Process:**
1. Execute SQL query with date grouping
2. Aggregate data by period (day/week/month)
3. Calculate trend using linear regression:
   - Slope: Direction and strength of trend
   - R-squared: Confidence in trend
4. Detect seasonality (if applicable)
5. Generate forecast for next 5 periods
6. Generate insights based on trend

**Trend Calculation:**
```typescript
// Linear regression
slope = (n × ΣXY - ΣX × ΣY) / (n × ΣX² - (ΣX)²)
rSquared = 1 - (SSres / SStot)

// Trend direction
direction = slope > 0.1 ? 'UP' : slope < -0.1 ? 'DOWN' : 'STABLE'
```

**Forecast Generation:**
```typescript
forecast[i] = lastValue + (slope × i)
confidence[i] = max(0.1, rSquared - (i × 0.1))
```

**Returns:**
```typescript
{
  metric: string;
  period: DateRange;
  granularity: string;
  dataPoints: Array<{
    period: string;
    value: number;
    date: Date;
  }>;
  trend: {
    direction: 'UP' | 'DOWN' | 'STABLE';
    strength: number;
    confidence: number;  // R-squared
    description: string;
  };
  seasonality: {
    hasSeasonality: boolean;
    period: string | null;
    strength: number;
  };
  forecast: Array<{
    period: string;
    value: number;
    confidence: number;
  }>;
  insights: string[];
}
```

#### Dashboard Methods

##### 1. `buildExecutiveDashboard(period: DateRange, userId: string, tenantId: string): Promise<ExecutiveDashboard>`

**Purpose:** Build complete executive dashboard with KPIs and charts

**Process:**
1. Calculate all KPIs in parallel:
   - Total Revenue
   - Net Profit
   - Profit Margin
   - Inventory Turnover
   - Average Order Value
   - Stockout Rate
   - Active Products Count
2. Generate charts:
   - Revenue Chart (time series)
   - Top Products Chart (bar chart)
   - Category Breakdown Chart (pie chart)
3. Get active alerts
4. Combine into dashboard object

**Returns:**
```typescript
{
  period: DateRange;
  kpis: {
    totalRevenue: KPIMetric;
    netProfit: KPIMetric;
    profitMargin: KPIMetric;
    inventoryTurnover: KPIMetric;
    averageOrderValue: KPIMetric;
    stockoutRate: KPIMetric;
    activeProductsCount: number;
  };
  charts: {
    revenueChart: ChartData;
    topProductsChart: ChartData;
    categoryChart: ChartData;
  };
  alerts: Alert[];
  generatedAt: Date;
  generatedBy: string;
}
```

#### Helper Methods

##### 1. `getRevenueForPeriod(period: DateRange, tenantId: string): Promise<number>`

**Purpose:** Get total revenue from inventory OUT entries

**Query:**
```typescript
SELECT SUM(quantity × unitPrice)
FROM inventory_entries
WHERE type = 'OUT'
  AND created_at BETWEEN period.start AND period.end
  AND item.tenant_id = tenantId
```

##### 2. `getTotalCostsForPeriod(period: DateRange, tenantId: string): Promise<number>`

**Purpose:** Get total costs (COGS) for period

**Process:**
1. Get all OUT entries in period
2. For each entry, get cost price:
   - Preferred supplier price (if available)
   - WAC from IN entries (if available)
   - Estimate: 70% of sale price (fallback)
3. Sum: `quantity × costPrice`

##### 3. `getAverageInventoryValue(period: DateRange, tenantId: string): Promise<number>`

**Purpose:** Calculate average inventory value for period

**Formula:**
```typescript
avgValue = (inventoryValueAtStart + inventoryValueAtEnd) / 2
```

##### 4. `calculateTrend(values: number[]): { slope: number; rSquared: number }`

**Purpose:** Calculate linear trend using least squares method

**Algorithm:**
- Linear regression: `y = slope × x + intercept`
- R-squared: Measure of fit quality (0 to 1)

##### 5. `generateForecast(dataPoints: TrendDataPoint[], periods: number): ForecastPoint[]`

**Purpose:** Generate future predictions based on trend

**Method:**
- Extrapolates linear trend forward
- Confidence decreases with distance from last data point

---

## Controller Layer

### biController (`src/backend/src/controllers/biController.ts`)

Handles HTTP requests and delegates to service layer.

#### Controller Methods

##### 1. `getDashboard(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/dashboard`

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `startDate` (optional): ISO8601 date
- `endDate` (optional): ISO8601 date

**Process:**
1. Extract period or date range from query
2. Validate tenant context
3. Call `BiService.buildExecutiveDashboard()`
4. Return dashboard data

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "..." },
    "kpis": { ... },
    "charts": { ... },
    "alerts": [ ... ],
    "generatedAt": "...",
    "generatedBy": "..."
  },
  "message": "داشبورد با موفقیت بارگذاری شد"
}
```

##### 2. `getKPIs(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/kpis`

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Process:**
1. Calculate all KPIs in parallel
2. Return structured KPI data

**Response:**
```json
{
  "success": true,
  "data": {
    "financial": {
      "totalRevenue": { ... },
      "netProfit": { ... },
      "profitMargin": { ... }
    },
    "operational": {
      "inventoryTurnover": { ... },
      "averageOrderValue": { ... },
      "stockoutRate": { ... }
    }
  }
}
```

##### 3. `getAnalyticsSummary(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/analytics/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 150,
    "lowStockCount": 12,
    "recentTransactions": 245,
    "totalInventoryValue": 5000000
  }
}
```

##### 4. `getABCAnalysis(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/analytics/abc-analysis`

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d` (default: `30d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { ... },
    "totalProducts": 150,
    "totalSales": 10000000,
    "products": [ ... ],
    "summary": {
      "categoryA": { ... },
      "categoryB": { ... },
      "categoryC": { ... }
    }
  }
}
```

##### 5. `getProfitAnalysis(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/analytics/profit-analysis`

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `groupBy` (optional): `item` or `category` (default: `item`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { ... },
    "groupBy": "item",
    "items": [ ... ],
    "summary": {
      "totalItems": 50,
      "totalRevenue": 10000000,
      "totalProfit": 3000000,
      "overallMargin": 30.0,
      "bestPerformer": { ... },
      "worstPerformer": { ... }
    }
  }
}
```

##### 6. `getTrends(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/analytics/trends`

**Query Parameters:**
- `metric` (required): `revenue`, `profit`, `sales_volume`, `customers`
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `granularity` (optional): `daily`, `weekly`, `monthly` (default: `daily`)

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "revenue",
    "period": { ... },
    "granularity": "daily",
    "dataPoints": [ ... ],
    "trend": {
      "direction": "UP",
      "strength": 0.85,
      "confidence": 0.92,
      "description": "روند صعودی با قدرت قوی"
    },
    "forecast": [ ... ],
    "insights": [ ... ]
  }
}
```

##### 7. `createCustomReport(req: Request, res: Response)`

**Endpoint:** `POST /api/bi/reports`

**Request Body:**
```json
{
  "name": "گزارش موجودی کالاها",
  "description": "نمایش موجودی فعلی همه کالاها",
  "reportType": "TABULAR",
  "dataSources": [
    {
      "id": "inventory",
      "name": "Inventory",
      "type": "database",
      "connection": { "table": "inventory_entries" }
    }
  ],
  "columnsConfig": [
    {
      "id": "item_name",
      "name": "item_name",
      "type": "text",
      "table": "items",
      "label": "نام کالا",
      "aggregation": "none"
    }
  ],
  "filtersConfig": [ ... ],
  "sortingConfig": [ ... ],
  "isPublic": false,
  "tags": ["inventory", "stock"]
}
```

**Process:**
1. Validate request body
2. Check tenant context
3. Call `ReportService.createReport()`
4. Return created report

##### 8. `getCustomReports(req: Request, res: Response)`

**Endpoint:** `GET /api/bi/reports`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `reportType` (optional): Filter by type
- `tags` (optional): Filter by tags

**Process:**
1. Get user ID from request
2. Call `ReportService.getReports()` with filters
3. Return paginated results

##### 9. `executeReport(req: Request, res: Response)`

**Endpoint:** `POST /api/bi/reports/:id/execute`

**Request Body:**
```json
{
  "parameters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "exportFormat": "VIEW"
}
```

**Process:**
1. Validate report ID and user access
2. Call `ReportService.executeReport()`
3. Track execution in `ReportExecution` table
4. Return results

##### 10. `executeTemporaryReport(req: Request, res: Response)`

**Endpoint:** `POST /api/bi/reports/preview/execute`

**Purpose:** Execute report without saving (preview mode)

**Request Body:**
```json
{
  "reportConfig": { ... },
  "parameters": { ... }
}
```

**Process:**
1. Validate report configuration
2. Call `ReportService.executeTemporaryReport()`
3. Return results (not saved to database)

---

## Query Builder

### QueryBuilder (`src/backend/src/services/queryBuilder.ts`)

**Purpose:** Build dynamic SQL queries from report configurations

**Key Methods:**

##### 1. `buildQuery(reportConfig: CustomReportConfig, tenantId: string): string`

**Process:**
1. Parse `dataSources` to determine tables
2. Parse `columnsConfig` to build SELECT clause
3. Parse `filtersConfig` to build WHERE clause
4. Parse `sortingConfig` to build ORDER BY clause
5. Add tenant filtering
6. Combine into SQL query

**Example Output:**
```sql
SELECT 
  i.name as item_name,
  SUM(ie.quantity) as total_quantity,
  SUM(ie.total_value) as total_value
FROM items i
LEFT JOIN inventory_entries ie ON i.id = ie.item_id
WHERE i.tenant_id = $1
  AND ie.created_at >= $2
  AND ie.created_at <= $3
GROUP BY i.name
ORDER BY total_value DESC
```

##### 2. `getAvailableFields(): ReportField[]`

**Returns:** List of available fields for report building

**Field Categories:**
- **Item Information**: name, category, unit, description, barcode, minStock
- **Inventory Information**: currentStock, quantity, unitPrice, totalValue, entryType, entryDate
- **User Information**: userName, userEmail, userRole
- **Supplier Information**: supplierName, supplierContactName, supplierPhone

---

## Report Service

### ReportService (`src/backend/src/services/reportService.ts`)

**Purpose:** Manage custom reports and execution

**Key Methods:**

##### 1. `createReport(config: CustomReportConfig, userId: string, tenantId: string): Promise<CustomReport>`

**Process:**
1. Validate report configuration
2. Create `CustomReport` record in database
3. Set creator and tenant
4. Return created report

##### 2. `executeReport(reportId: string, userId: string, parameters: object, exportFormat: string, tenantId: string): Promise<ReportExecutionResult>`

**Process:**
1. Load report configuration
2. Validate user access
3. Build SQL query using QueryBuilder
4. Execute query with parameters
5. Format results
6. Create `ReportExecution` record
7. Update report execution count and average time
8. Return results

##### 3. `executeTemporaryReport(config: CustomReportConfig, userId: string, tenantId: string, parameters: object): Promise<ReportExecutionResult>`

**Process:**
1. Build query from temporary config
2. Execute query
3. Return results (not saved)

##### 4. `getReports(userId: string, page: number, limit: number, search?: string, reportType?: string, tags?: string[]): Promise<PaginatedReports>`

**Process:**
1. Build query with filters:
   - User's reports OR public reports OR shared reports
   - Search term (name, description)
   - Report type filter
   - Tags filter
2. Apply pagination
3. Return results

---

## Validation and Error Handling

### Input Validation

**Tenant Context Validation:**
```typescript
if (!req.tenant?.id) {
  return res.status(400).json({
    success: false,
    message: 'نیاز به شناسایی مجموعه',
    error: 'Tenant context required'
  });
}
```

**User Authentication:**
```typescript
if (!req.user?.id) {
  return res.status(401).json({
    success: false,
    message: 'کاربر احراز هویت نشده است'
  });
}
```

**Report Configuration Validation:**
```typescript
if (!reportConfig.name || !reportConfig.columnsConfig || !Array.isArray(reportConfig.columnsConfig)) {
  return res.status(400).json({
    success: false,
    message: 'اطلاعات گزارش ناقص است'
  });
}
```

### Error Handling

**Standard Error Response:**
```json
{
  "success": false,
  "message": "خطا در انجام عملیات",
  "error": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

### Multi-Tenant Isolation

**All queries include tenant filtering:**
```typescript
where: {
  tenantId: req.tenant.id,
  // ... other filters
}
```

**Critical:** All database queries must filter by `tenantId` to ensure data isolation.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Previous Part:** [Part 2: Database Schema and Data Models](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART2.md)  
**Next Part:** [Part 4: Frontend Implementation](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART4.md)

