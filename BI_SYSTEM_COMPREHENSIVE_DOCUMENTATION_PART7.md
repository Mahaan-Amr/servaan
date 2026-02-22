# Business Intelligence System Workspace - Comprehensive Documentation
## Part 7: API Endpoints and Business Logic

## Table of Contents
1. [API Endpoints Overview](#api-endpoints-overview)
2. [Dashboard & KPI Endpoints](#dashboard--kpi-endpoints)
3. [Analytics Endpoints](#analytics-endpoints)
4. [Custom Reports Endpoints](#custom-reports-endpoints)
5. [Export Endpoints](#export-endpoints)
6. [Insights Endpoints](#insights-endpoints)
7. [Business Logic Rules](#business-logic-rules)
8. [Error Handling](#error-handling)
9. [Authentication & Authorization](#authentication--authorization)

---

## API Endpoints Overview

### Base URL

All BI endpoints are prefixed with `/api/bi`

### Authentication

**All endpoints require authentication:**
- JWT token in `Authorization` header
- Format: `Bearer <token>`
- Token validation via `authenticate` middleware

### Tenant Context

**All endpoints require tenant context:**
- Tenant ID from `X-Tenant-Subdomain` header or JWT token
- Tenant validation in controllers
- Data isolation per tenant

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message in Persian"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message in Persian",
  "error": "Technical error details (optional)"
}
```

---

## Dashboard & KPI Endpoints

### GET /api/bi/dashboard

**Purpose:** Get main executive dashboard with KPIs and charts

**Query Parameters:**
- `period` (optional): `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `startDate` (optional): ISO8601 date string
- `endDate` (optional): ISO8601 date string

**Request Example:**
```http
GET /api/bi/dashboard?period=30d
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-01-31T23:59:59.999Z"
    },
    "kpis": {
      "totalRevenue": {
        "value": 50000000,
        "previousValue": 45000000,
        "change": 5000000,
        "changePercent": 11.11,
        "trend": "UP",
        "unit": "تومان",
        "status": "GOOD"
      },
      "netProfit": { ... },
      "profitMargin": { ... },
      "inventoryTurnover": { ... },
      "averageOrderValue": { ... },
      "stockoutRate": { ... },
      "activeProductsCount": 150
    },
    "charts": {
      "revenueChart": { ... },
      "topProductsChart": { ... },
      "categoryChart": { ... }
    },
    "alerts": [ ... ],
    "generatedAt": "2025-01-27T10:00:00.000Z",
    "generatedBy": "user-id"
  },
  "message": "داشبورد با موفقیت بارگذاری شد"
}
```

**Business Logic:**
1. Validate user authentication
2. Validate tenant context
3. Parse period or date range
4. Call `BiService.buildExecutiveDashboard()`
5. Return dashboard data

**Error Cases:**
- 401: Unauthenticated user
- 400: Missing tenant context
- 500: Server error

---

### GET /api/bi/kpis

**Purpose:** Get all KPIs for a period

**Query Parameters:**
- `period` (optional): `7d` | `30d` | `90d` | `1y` (default: `30d`)

**Request Example:**
```http
GET /api/bi/kpis?period=30d
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

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
  },
  "message": "KPI ها با موفقیت محاسبه شدند"
}
```

**Business Logic:**
1. Validate tenant context
2. Parse period
3. Calculate all KPIs in parallel:
   - `calculateTotalRevenue()`
   - `calculateNetProfit()`
   - `calculateProfitMargin()`
   - `calculateInventoryTurnover()`
   - `calculateAverageOrderValue()`
   - `calculateStockoutRate()`
4. Return grouped KPIs

**Error Cases:**
- 400: Missing tenant context
- 500: Calculation error

---

## Analytics Endpoints

### GET /api/bi/analytics/summary

**Purpose:** Get analytics summary statistics

**Request Example:**
```http
GET /api/bi/analytics/summary
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 150,
    "lowStockCount": 12,
    "recentTransactions": 450,
    "totalInventoryValue": 25000000
  },
  "message": "خلاصه آمار تحلیلی با موفقیت بارگذاری شد"
}
```

**Business Logic:**
1. Validate tenant context
2. Count active items
3. Count low stock items
4. Count recent transactions (last 7 days)
5. Calculate total inventory value
6. Return summary

---

### GET /api/bi/analytics/abc-analysis

**Purpose:** Perform ABC analysis on products

**Query Parameters:**
- `period` (optional): `7d` | `30d` | `90d` (default: `30d`)

**Request Example:**
```http
GET /api/bi/analytics/abc-analysis?period=30d
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "..." },
    "totalProducts": 150,
    "totalSales": 50000000,
    "products": [
      {
        "id": "item-1",
        "name": "Product A",
        "category": "Category 1",
        "totalSales": 20000000,
        "totalQuantity": 1000,
        "percentage": 40,
        "cumulativePercentage": 40,
        "abcCategory": "A"
      }
    ],
    "summary": {
      "categoryA": {
        "count": 30,
        "salesPercentage": 80,
        "products": [ ... ]
      },
      "categoryB": { ... },
      "categoryC": { ... }
    }
  },
  "message": "تحلیل ABC با موفقیت انجام شد"
}
```

**Business Logic:**
1. Validate tenant context
2. Parse period
3. Fetch active items with OUT entries
4. Calculate sales per product
5. Sort by sales (descending)
6. Calculate cumulative percentages
7. Categorize into A, B, C
8. Return analysis

---

### GET /api/bi/analytics/profit-analysis

**Purpose:** Perform profit analysis by item or category

**Query Parameters:**
- `period` (optional): `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `groupBy` (optional): `item` | `category` (default: `item`)

**Request Example:**
```http
GET /api/bi/analytics/profit-analysis?period=30d&groupBy=item
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "..." },
    "groupBy": "item",
    "items": [
      {
        "id": "item-1",
        "name": "Product A",
        "category": "Category 1",
        "totalSold": 100,
        "totalRevenue": 1000000,
        "totalCost": 700000,
        "totalProfit": 300000,
        "profitMargin": 30
      }
    ],
    "summary": {
      "totalItems": 50,
      "totalRevenue": 50000000,
      "totalProfit": 15000000,
      "overallMargin": 30,
      "bestPerformer": { ... },
      "worstPerformer": { ... }
    }
  },
  "message": "تحلیل سودآوری با موفقیت انجام شد"
}
```

**Business Logic:**
1. Validate tenant context
2. Parse period and groupBy
3. Build SQL query based on groupBy:
   - **By Item:** Group by `i.id, i.name, i.category`
   - **By Category:** Group by `i.category`
4. Calculate revenue, cost, profit, margin
5. Return analysis

---

### GET /api/bi/analytics/trends

**Purpose:** Perform trend analysis for a metric

**Query Parameters:**
- `metric` (required): `revenue` | `profit` | `sales_volume` | `customers`
- `period` (optional): `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `granularity` (optional): `daily` | `weekly` | `monthly` (default: `daily`)

**Request Example:**
```http
GET /api/bi/analytics/trends?metric=revenue&period=30d&granularity=daily
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "revenue",
    "period": { "start": "...", "end": "..." },
    "granularity": "daily",
    "dataPoints": [
      {
        "period": "2025-01-01",
        "value": 1000000,
        "date": "2025-01-01T00:00:00.000Z"
      }
    ],
    "trend": {
      "direction": "UP",
      "strength": 0.85,
      "confidence": 0.92,
      "description": "روند صعودی با قدرت قوی"
    },
    "seasonality": {
      "hasSeasonality": false,
      "period": null,
      "strength": 0
    },
    "forecast": [
      {
        "period": "forecast_1",
        "value": 1050000,
        "confidence": 0.82
      }
    ],
    "insights": [
      "روند رشد با قدرت 0.85 مشاهده می‌شود"
    ]
  },
  "message": "تحلیل روند با موفقیت انجام شد"
}
```

**Business Logic:**
1. Validate tenant context
2. Parse metric, period, granularity
3. Build SQL query based on metric and granularity
4. Execute query and get data points
5. Calculate trend (linear regression)
6. Detect seasonality (simplified)
7. Generate forecast
8. Generate insights
9. Return analysis

---

## Custom Reports Endpoints

### GET /api/bi/reports

**Purpose:** Get list of custom reports

**Query Parameters:**
- `reportType` (optional): `TABULAR` | `CHART` | `DASHBOARD` | `PIVOT`
- `search` (optional): Search term
- `tags` (optional): Comma-separated tags
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Request Example:**
```http
GET /api/bi/reports?reportType=CHART&page=1&limit=20
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-1",
        "name": "Monthly Sales Report",
        "description": "Sales by category",
        "reportType": "CHART",
        "isPublic": false,
        "tags": ["sales", "monthly"],
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-27T00:00:00.000Z",
        "executionCount": 15,
        "lastRunAt": "2025-01-26T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  },
  "message": "گزارش‌ها با موفقیت بارگذاری شدند"
}
```

**Business Logic:**
1. Validate user authentication
2. Validate tenant context
3. Build filter query:
   - User's reports OR public reports OR shared reports
   - Filter by reportType, search, tags
   - Filter by tenant
4. Apply pagination
5. Return reports with pagination info

---

### POST /api/bi/reports

**Purpose:** Create a new custom report

**Request Body:**
```json
{
  "name": "Monthly Sales Report",
  "description": "Sales by category",
  "reportType": "CHART",
  "dataSources": [
    {
      "table": "Item",
      "alias": "items"
    }
  ],
  "columnsConfig": [
    {
      "id": "field-1",
      "name": "name",
      "type": "text",
      "table": "Item",
      "label": "Item Name",
      "aggregation": "none"
    }
  ],
  "filtersConfig": [
    {
      "id": "filter-1",
      "field": "category",
      "operator": "equals",
      "value": "Category 1",
      "label": "Category = Category 1"
    }
  ],
  "sortingConfig": [
    {
      "field": "name",
      "direction": "asc"
    }
  ],
  "isPublic": false,
  "tags": ["sales", "monthly"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-1",
    "name": "Monthly Sales Report",
    ...
  },
  "message": "گزارش با موفقیت ایجاد شد"
}
```

**Business Logic:**
1. Validate user authentication
2. Validate tenant context
3. Validate report configuration
4. Create report in database
5. Return created report

---

### GET /api/bi/reports/:id

**Purpose:** Get report by ID

**Request Example:**
```http
GET /api/bi/reports/report-1
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-1",
    "name": "Monthly Sales Report",
    "description": "Sales by category",
    "reportType": "CHART",
    "dataSources": [ ... ],
    "columnsConfig": [ ... ],
    "filtersConfig": [ ... ],
    "sortingConfig": [ ... ],
    "chartConfig": { ... },
    "isPublic": false,
    "tags": ["sales", "monthly"],
    "createdBy": "user-id",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-27T00:00:00.000Z"
  },
  "message": "گزارش با موفقیت بارگذاری شد"
}
```

**Business Logic:**
1. Validate user authentication
2. Validate tenant context
3. Check access:
   - Report creator OR
   - Public report OR
   - Shared with user
4. Fetch report from database
5. Return report

---

### POST /api/bi/reports/:id/execute

**Purpose:** Execute a saved report

**Request Body:**
```json
{
  "parameters": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "exportFormat": "VIEW"
}
```

**Query Parameters:**
- `exportFormat` (optional): `VIEW` | `PDF` | `EXCEL` | `CSV` | `JSON` (default: `VIEW`)

**Response (VIEW format):**
```json
{
  "success": true,
  "data": {
    "reportId": "report-1",
    "executedAt": "2025-01-27T10:00:00.000Z",
    "executedBy": "user-id",
    "executionTime": 250,
    "resultCount": 100,
    "data": [ ... ],
    "format": "VIEW",
    "status": "SUCCESS"
  },
  "message": "گزارش با موفقیت اجرا شد"
}
```

**Response (PDF/EXCEL/CSV format):**
```json
{
  "success": true,
  "data": {
    "reportId": "report-1",
    "executedAt": "2025-01-27T10:00:00.000Z",
    "executedBy": "user-id",
    "executionTime": 500,
    "resultCount": 100,
    "exportUrl": "/api/bi/export/report-1/execution-1.pdf",
    "format": "PDF",
    "status": "SUCCESS"
  },
  "message": "گزارش با موفقیت اجرا و خروجی گرفته شد"
}
```

**Business Logic:**
1. Validate user authentication
2. Validate tenant context
3. Check report access
4. Build query from report configuration
5. Apply filters and parameters
6. Execute query
7. Transform results based on report type
8. Generate export file (if needed)
9. Log execution
10. Update report statistics
11. Return results or export URL

---

### GET /api/bi/reports/:id/executions

**Purpose:** Get execution history for a report

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "execution-1",
        "executedAt": "2025-01-27T10:00:00.000Z",
        "executedBy": "user-id",
        "executionTime": 250,
        "resultCount": 100,
        "exportFormat": "VIEW",
        "status": "SUCCESS"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  },
  "message": "تاریخچه اجرا با موفقیت بارگذاری شد"
}
```

---

### GET /api/bi/reports/fields/available

**Purpose:** Get available fields for report building

**Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "id": "field-1",
        "name": "name",
        "type": "text",
        "table": "Item",
        "label": "Item Name",
        "aggregation": "none"
      }
    ]
  },
  "message": "فیلدهای موجود با موفقیت بارگذاری شدند"
}
```

---

### POST /api/bi/reports/preview/execute

**Purpose:** Execute a temporary report (preview without saving)

**Request Body:**
```json
{
  "reportType": "CHART",
  "dataSources": [ ... ],
  "columnsConfig": [ ... ],
  "filtersConfig": [ ... ],
  "sortingConfig": [ ... ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionTime": 250,
    "resultCount": 100,
    "data": [ ... ]
  },
  "message": "پیش‌نمایش گزارش با موفقیت اجرا شد"
}
```

---

## Export Endpoints

### GET /api/bi/export/:reportId

**Purpose:** Download exported report file

**Query Parameters:**
- `executionId` (required): Execution ID
- `format` (optional): `PDF` | `EXCEL` | `CSV` | `JSON`

**Request Example:**
```http
GET /api/bi/export/report-1?executionId=execution-1&format=PDF
Authorization: Bearer <token>
X-Tenant-Subdomain: tenant1
```

**Response:**
- File download (PDF, Excel, CSV, or JSON)
- Content-Type based on format
- Content-Disposition: attachment

**Business Logic:**
1. Validate user authentication
2. Validate tenant context
3. Fetch execution record
4. Check access to report
5. Generate file if not exists
6. Return file download

---

## Insights Endpoints

### GET /api/bi/insights

**Purpose:** Get AI-powered business insights

**Query Parameters:**
- `period` (optional): `7d` | `30d` | `90d` | `1y` (default: `30d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "WARNING",
        "title": "Low Stock Alert",
        "description": "12 items are below reorder point",
        "priority": "HIGH",
        "actionItems": [
          "Review inventory levels",
          "Place purchase orders"
        ]
      }
    ],
    "recommendations": [
      {
        "category": "INVENTORY",
        "title": "Optimize Stock Levels",
        "description": "Consider reducing stock for slow-moving items",
        "impact": "MEDIUM"
      }
    ]
  },
  "message": "بینش‌های هوشمند با موفقیت بارگذاری شدند"
}
```

**Business Logic:**
1. Validate tenant context
2. Analyze KPIs and trends
3. Identify anomalies
4. Generate insights
5. Provide recommendations
6. Return insights

---

## Business Logic Rules

### 1. Tenant Isolation

**Rule:** All data queries must include `tenantId` filter

**Implementation:**
- Controllers check `req.tenant.id`
- Services receive `tenantId` parameter
- Database queries filter by `tenantId`
- No cross-tenant data access

**Example:**
```typescript
const items = await prisma.item.findMany({
  where: {
    tenantId: tenantId, // CRITICAL
    isActive: true
  }
});
```

### 2. Period Calculation

**Rule:** Period strings are converted to date ranges

**Implementation:**
- `7d`: Last 7 days
- `30d`: Last 30 days
- `90d`: Last 90 days
- `1y`: Last 1 year
- Custom: `startDate` and `endDate` parameters

**Example:**
```typescript
const endTime = new Date();
const startTime = new Date();
startTime.setDate(endTime.getDate() - 30); // 30d
```

### 3. KPI Status Determination

**Rule:** KPIs have status based on thresholds

**Financial KPIs:**
- **GOOD:** Meets or exceeds target
- **WARNING:** Below target but above critical threshold
- **CRITICAL:** Below critical threshold

**Operational KPIs:**
- **GOOD:** Optimal performance
- **WARNING:** Needs attention
- **CRITICAL:** Urgent action required

### 4. Report Access Control

**Rule:** Users can access:
- Reports they created
- Public reports
- Reports shared with them

**Implementation:**
```typescript
const reports = await prisma.customReport.findMany({
  where: {
    tenantId: tenantId,
    OR: [
      { createdBy: userId },
      { isPublic: true },
      { sharedWith: { array_contains: userId } }
    ]
  }
});
```

### 5. Data Aggregation

**Rule:** Aggregations respect tenant and period filters

**Implementation:**
- All aggregations include `tenantId` filter
- Date filters applied to time-based queries
- Grouping preserves tenant isolation

### 6. Cost Calculation

**Rule:** COGS uses weighted average cost (WAC)

**Implementation:**
- For each OUT entry, find average IN entry price before that date
- Fallback: `unitPrice * 0.7` if no IN entries
- Multiply by quantity for total cost

### 7. Trend Calculation

**Rule:** Trends use linear regression

**Implementation:**
- Calculate slope using least squares method
- Calculate R-squared for confidence
- Direction: UP (slope > 0), DOWN (slope < 0), STABLE (slope ≈ 0)

---

## Error Handling

### Error Types

**1. Authentication Errors (401):**
```json
{
  "success": false,
  "message": "کاربر احراز هویت نشده است"
}
```

**2. Authorization Errors (403):**
```json
{
  "success": false,
  "message": "شما دسترسی به این گزارش ندارید"
}
```

**3. Validation Errors (400):**
```json
{
  "success": false,
  "message": "نیاز به شناسایی مجموعه",
  "error": "Tenant context required"
}
```

**4. Not Found Errors (404):**
```json
{
  "success": false,
  "message": "گزارش یافت نشد"
}
```

**5. Server Errors (500):**
```json
{
  "success": false,
  "message": "خطا در محاسبه KPI ها",
  "error": "Technical error details"
}
```

### Error Handling Strategy

1. **Try-Catch Blocks:** All controller methods wrapped in try-catch
2. **Error Logging:** Errors logged to console with details
3. **User-Friendly Messages:** Persian error messages for users
4. **Technical Details:** Error details in `error` field for debugging
5. **Graceful Degradation:** Partial data returned when possible

---

## Authentication & Authorization

### Authentication

**Middleware:** `authenticate` from `authMiddleware`

**Process:**
1. Extract JWT token from `Authorization` header
2. Verify token signature
3. Check token expiration
4. Attach user to `req.user`
5. Continue to next middleware

**Failure:**
- Returns 401 Unauthorized
- Error message in Persian

### Authorization

**Tenant Context:**
- Extracted from `X-Tenant-Subdomain` header or JWT token
- Validated in controllers
- Required for all endpoints

**Report Access:**
- Users can access their own reports
- Users can access public reports
- Users can access shared reports
- Other reports are inaccessible

**Data Access:**
- All data filtered by `tenantId`
- No cross-tenant data access
- Tenant validation in all queries

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Previous Part:** [Part 6: Integration Features](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART6.md)  
**Next Part:** [Part 8: User Roles, Testing, and Conclusion](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART8.md)

