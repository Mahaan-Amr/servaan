# Business Intelligence System Workspace - Comprehensive Documentation
## Part 5: Core Features

## Table of Contents
1. [ABC Analysis](#abc-analysis)
2. [Profit Analysis](#profit-analysis)
3. [Trend Analysis](#trend-analysis)
4. [Custom Reports](#custom-reports)
5. [KPI Calculations](#kpi-calculations)
6. [Executive Dashboard](#executive-dashboard)

---

## ABC Analysis

### Overview

ABC Analysis is a categorization technique that classifies products based on their sales value using the Pareto principle (80/20 rule). This helps businesses focus on high-value products that generate most revenue.

### Algorithm

**Location:** `src/backend/src/services/biService.ts` - `performABCAnalysis()`

**Steps:**

1. **Data Collection:**
   - Fetch all active items for the tenant
   - Include inventory entries of type `OUT` within the specified period
   - Filter by `tenantId` for multi-tenancy

2. **Sales Calculation:**
   ```typescript
   totalSales = sum(entry.quantity * entry.unitPrice)
   totalQuantity = sum(entry.quantity)
   ```

3. **Sorting:**
   - Sort products by `totalSales` in descending order

4. **Cumulative Percentage Calculation:**
   ```typescript
   cumulativeSales += product.totalSales
   percentage = (product.totalSales / totalSales) * 100
   cumulativePercentage = (cumulativeSales / totalSales) * 100
   ```

5. **Categorization:**
   - **Category A:** `cumulativePercentage <= 80%` (Top 80% of sales)
   - **Category B:** `80% < cumulativePercentage <= 95%` (Next 15% of sales)
   - **Category C:** `cumulativePercentage > 95%` (Remaining 5% of sales)

### Data Structure

**Input:**
- `period: DateRange` - Start and end dates
- `tenantId: string` - Tenant identifier

**Output:**
```typescript
interface ABCAnalysis {
  period: DateRange;
  totalProducts: number;
  totalSales: number;
  products: ABCProduct[];
  summary: {
    categoryA: {
      count: number;
      salesPercentage: 80;
      products: ABCProduct[];
    };
    categoryB: {
      count: number;
      salesPercentage: 15;
      products: ABCProduct[];
    };
    categoryC: {
      count: number;
      salesPercentage: 5;
      products: ABCProduct[];
    };
  };
}

interface ABCProduct {
  id: string;
  name: string;
  category: string;
  totalSales: number;
  totalQuantity: number;
  percentage: number;
  cumulativePercentage: number;
  abcCategory: 'A' | 'B' | 'C';
}
```

### Business Logic

**Category A Products:**
- Generate 80% of total sales
- Require tight inventory control
- High priority for stock management
- Focus on availability and fast restocking

**Category B Products:**
- Generate 15% of total sales
- Moderate inventory control
- Regular monitoring
- Balanced stock levels

**Category C Products:**
- Generate 5% of total sales
- Minimal inventory control
- Periodic review
- Can use simple reorder points

### Use Cases

1. **Inventory Management:**
   - Prioritize stock management for Category A items
   - Optimize warehouse space allocation
   - Set reorder points based on category

2. **Purchasing Strategy:**
   - Negotiate better prices for Category A items
   - Bulk purchasing for high-value items
   - Just-in-time ordering for Category C

3. **Sales Focus:**
   - Marketing emphasis on Category A products
   - Cross-selling opportunities
   - Product mix optimization

### API Endpoint

**GET** `/api/bi/analytics/abc-analysis`

**Query Parameters:**
- `period`: `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `startDate`: ISO8601 date (optional)
- `endDate`: ISO8601 date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "..." },
    "totalProducts": 150,
    "totalSales": 50000000,
    "products": [...],
    "summary": {
      "categoryA": { "count": 30, "salesPercentage": 80, "products": [...] },
      "categoryB": { "count": 45, "salesPercentage": 15, "products": [...] },
      "categoryC": { "count": 75, "salesPercentage": 5, "products": [...] }
    }
  }
}
```

---

## Profit Analysis

### Overview

Profit Analysis calculates revenue, cost, profit, and profit margin for products or categories. It helps identify most profitable items and optimize pricing strategies.

### Algorithm

**Location:** `src/backend/src/services/biService.ts` - `performProfitAnalysis()`

**Steps:**

1. **Data Collection:**
   - Query inventory entries of type `OUT` within the period
   - Group by item or category based on `groupBy` parameter
   - Filter by `tenantId` for multi-tenancy

2. **Revenue Calculation:**
   ```sql
   total_revenue = SUM(quantity * unitPrice)
   ```

3. **Cost Calculation:**
   - Uses weighted average cost method
   - For each OUT entry, finds average IN entry price before that date
   - Fallback: `unitPrice * 0.7` (assumes 30% margin) if no IN entries found
   ```sql
   total_cost = SUM(quantity * COALESCE(
     (SELECT AVG(ie_in.unitPrice) 
      FROM InventoryEntry ie_in 
      WHERE ie_in.itemId = i.id 
        AND ie_in.type = 'IN' 
        AND ie_in.createdAt <= ie_out.createdAt), 
     ie_out.unitPrice * 0.7
   ))
   ```

4. **Profit Calculation:**
   ```sql
   total_profit = total_revenue - total_cost
   ```

5. **Profit Margin Calculation:**
   ```typescript
   profitMargin = (totalProfit / totalRevenue) * 100
   ```

6. **Grouping:**
   - **By Item:** Individual product analysis
   - **By Category:** Category-level aggregation

### Data Structure

**Input:**
- `period: DateRange` - Start and end dates
- `groupBy: 'item' | 'category'` - Grouping method
- `tenantId: string` - Tenant identifier

**Output:**
```typescript
interface ProfitAnalysis {
  period: DateRange;
  groupBy: 'item' | 'category';
  items: ProfitItem[];
  summary: {
    totalItems: number;
    totalRevenue: number;
    totalProfit: number;
    overallMargin: number;
    bestPerformer: ProfitItem | null;
    worstPerformer: ProfitItem | null;
  };
}

interface ProfitItem {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}
```

### Business Logic

**Revenue Sources:**
- Sales from inventory entries (type `OUT`)
- Based on actual selling price (`unitPrice`)

**Cost Calculation Methods:**
1. **Weighted Average Cost (Preferred):**
   - Average of all IN entries before the OUT entry date
   - More accurate for inventory valuation
   - Accounts for price fluctuations

2. **Fallback Method:**
   - Uses 70% of selling price if no IN entries exist
   - Assumes 30% profit margin
   - Used for items without purchase history

**Profit Margin Interpretation:**
- **High Margin (≥ 20%):** Highly profitable, consider increasing stock
- **Medium Margin (10-20%):** Good profitability, maintain current levels
- **Low Margin (0-10%):** Low profitability, review pricing or costs
- **Negative Margin (< 0%):** Loss-making, urgent review required

### Visualizations

**1. Top Profitable Products Chart:**
- Bar chart showing top N products by profit
- Displays revenue, cost, and profit bars
- Color-coded by ABC category

**2. Revenue vs Profit Scatter Chart:**
- X-axis: Revenue
- Y-axis: Profit
- Bubble size: Profit margin
- Identifies high-revenue, low-profit items

**3. Profit Margin Distribution:**
- Donut chart showing distribution across margin ranges
- Categories: High (≥20%), Medium (10-20%), Low (0-10%), Negative (<0%)

**4. Cost vs Revenue Comparison:**
- Side-by-side bar chart
- Shows cost and revenue for top products
- Highlights profit potential

**5. Profit Performance Matrix:**
- Matrix chart with revenue vs profit
- Quadrants:
  - High Revenue, High Profit (Stars)
  - High Revenue, Low Profit (Question Marks)
  - Low Revenue, High Profit (Cash Cows)
  - Low Revenue, Low Profit (Dogs)

### Use Cases

1. **Pricing Optimization:**
   - Identify items with low margins
   - Adjust prices for better profitability
   - Competitive pricing analysis

2. **Product Portfolio Management:**
   - Focus on high-margin products
   - Discontinue loss-making items
   - Optimize product mix

3. **Cost Management:**
   - Identify cost reduction opportunities
   - Negotiate better supplier prices
   - Optimize inventory costs

4. **Category Analysis:**
   - Compare profitability across categories
   - Allocate resources to profitable categories
   - Strategic category planning

### API Endpoint

**GET** `/api/bi/analytics/profit-analysis`

**Query Parameters:**
- `period`: `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `groupBy`: `item` | `category` (default: `item`)
- `startDate`: ISO8601 date (optional)
- `endDate`: ISO8601 date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "..." },
    "groupBy": "item",
    "items": [
      {
        "id": "...",
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
      "bestPerformer": {...},
      "worstPerformer": {...}
    }
  }
}
```

---

## Trend Analysis

### Overview

Trend Analysis tracks metrics over time, identifies patterns, detects seasonality, and generates forecasts. It helps predict future performance and make data-driven decisions.

### Algorithm

**Location:** `src/backend/src/services/biService.ts` - `performTrendAnalysis()`

**Steps:**

1. **Data Collection:**
   - Query data based on selected metric
   - Group by time period (daily, weekly, monthly)
   - Filter by `tenantId` for multi-tenancy

2. **Metric Calculation:**
   
   **Revenue:**
   ```sql
   SELECT 
     TO_CHAR(createdAt, dateFormat) as period,
     SUM(quantity * unitPrice) as value
   FROM InventoryEntry
   WHERE type = 'OUT' AND tenantId = $3
   GROUP BY period
   ```

   **Profit:**
   ```sql
   SELECT 
     TO_CHAR(createdAt, dateFormat) as period,
     SUM(quantity * (unitPrice - COALESCE(supplierPrice, 0))) as value
   FROM InventoryEntry
   WHERE type = 'OUT' AND tenantId = $3
   GROUP BY period
   ```

   **Sales Volume:**
   ```sql
   SELECT 
     TO_CHAR(createdAt, dateFormat) as period,
     SUM(quantity) as value
   FROM InventoryEntry
   WHERE type = 'OUT' AND tenantId = $3
   GROUP BY period
   ```

   **Customers:**
   ```sql
   SELECT 
     TO_CHAR(createdAt, dateFormat) as period,
     COUNT(DISTINCT DATE_TRUNC('hour', createdAt)) as value
   FROM InventoryEntry
   WHERE type = 'OUT' AND tenantId = $3
   GROUP BY period
   ```

3. **Trend Calculation (Linear Regression):**
   ```typescript
   // Calculate slope using least squares method
   slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
   intercept = (sumY - slope * sumX) / n
   
   // Calculate R-squared (coefficient of determination)
   rSquared = 1 - (ssRes / ssTot)
   ```

4. **Seasonality Detection:**
   - Currently simplified (returns no seasonality)
   - Future enhancement: FFT or autocorrelation analysis

5. **Forecast Generation:**
   ```typescript
   // Simple linear forecast
   for (let i = 1; i <= periods; i++) {
     forecastValue = lastValue + (slope * i)
     confidence = max(0.1, rSquared - (i * 0.1))
   }
   ```

### Data Structure

**Input:**
- `metric: 'revenue' | 'profit' | 'sales_volume' | 'customers'`
- `period: DateRange` - Start and end dates
- `granularity: 'daily' | 'weekly' | 'monthly'`
- `tenantId: string` - Tenant identifier

**Output:**
```typescript
interface TrendAnalysis {
  metric: string;
  period: DateRange;
  granularity: string;
  dataPoints: TrendDataPoint[];
  trend: {
    direction: 'UP' | 'DOWN' | 'STABLE';
    strength: number;
    confidence: number; // R-squared value
    description: string;
  };
  seasonality: {
    hasSeasonality: boolean;
    period: string | null;
    strength: number;
  };
  forecast: TrendDataPoint[];
  insights: string[];
}

interface TrendDataPoint {
  period: string;
  value: number;
  date: Date;
}
```

### Business Logic

**Trend Direction:**
- **UP:** `slope > 0` - Growing trend
- **DOWN:** `slope < 0` - Declining trend
- **STABLE:** `slope ≈ 0` - No significant change

**Trend Strength:**
- **Strong:** `rSquared > 0.8` - High confidence in trend
- **Medium:** `0.5 < rSquared ≤ 0.8` - Moderate confidence
- **Weak:** `rSquared ≤ 0.5` - Low confidence, high variability

**Forecast Confidence:**
- Decreases with forecast distance
- Formula: `confidence = rSquared - (period * 0.1)`
- Minimum confidence: 0.1 (10%)

**Granularity Selection:**
- **Daily:** Short-term analysis, high detail
- **Weekly:** Medium-term trends, balanced view
- **Monthly:** Long-term patterns, strategic planning

### Visualizations

**1. Trend Line Chart:**
- X-axis: Time period
- Y-axis: Metric value
- Shows actual data points and trend line
- Includes forecasted values with confidence intervals

**2. Forecast Chart:**
- Historical data (solid line)
- Forecasted data (dashed line)
- Confidence bands (shaded area)

**3. Multi-Metric Comparison:**
- Multiple metrics on same chart
- Different Y-axes for different scales
- Correlation analysis

**4. Insights Card:**
- Key findings
- Trend description
- Recommendations
- Risk factors

**5. Scorecard:**
- Summary statistics
- Growth percentage
- Trend accuracy
- Average value

### Use Cases

1. **Sales Forecasting:**
   - Predict future sales volumes
   - Plan inventory levels
   - Set sales targets

2. **Revenue Planning:**
   - Budget forecasting
   - Growth projections
   - Financial planning

3. **Performance Monitoring:**
   - Track KPIs over time
   - Identify improvement areas
   - Measure campaign effectiveness

4. **Seasonal Planning:**
   - Identify seasonal patterns
   - Plan for peak seasons
   - Optimize staffing

### API Endpoint

**GET** `/api/bi/analytics/trends`

**Query Parameters:**
- `metric`: `revenue` | `profit` | `sales_volume` | `customers`
- `period`: `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `granularity`: `daily` | `weekly` | `monthly` (default: `daily`)
- `startDate`: ISO8601 date (optional)
- `endDate`: ISO8601 date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "revenue",
    "period": { "start": "...", "end": "..." },
    "granularity": "daily",
    "dataPoints": [
      { "period": "2025-01-01", "value": 1000000, "date": "..." }
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
      { "period": "forecast_1", "value": 1050000, "confidence": 0.82 }
    ],
    "insights": [
      "روند رشد با قدرت 0.85 مشاهده می‌شود"
    ]
  }
}
```

---

## Custom Reports

### Overview

Custom Reports allow users to create, save, and execute personalized reports with custom fields, filters, sorting, and visualizations. Reports can be tabular, chart-based, dashboard-style, or pivot tables.

### Report Types

**1. TABULAR:**
- Standard table format
- Columns and rows
- Exportable to Excel, CSV, PDF

**2. CHART:**
- Visual representation
- Bar, line, pie, scatter charts
- Interactive drill-down

**3. DASHBOARD:**
- Multiple visualizations
- KPI cards
- Summary statistics

**4. PIVOT:**
- Cross-tabulation
- Row and column grouping
- Aggregation functions

### Data Structure

**Report Model:**
```typescript
interface CustomReport {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  dataSources: DataSourceConfig[];
  columnsConfig: ReportField[];
  filtersConfig?: ReportFilter[];
  sortingConfig?: ReportSorting[];
  chartConfig?: ChartConfig;
  layoutConfig?: LayoutConfig;
  isPublic: boolean;
  createdBy: string;
  sharedWith?: string[];
  tags: string[];
  executionCount: number;
  lastRunAt?: Date;
  avgExecutionTime?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Report Field:**
```typescript
interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  table: string;
  label: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}
```

**Report Filter:**
```typescript
interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | boolean | string[] | number[];
  label: string;
}
```

**Report Sorting:**
```typescript
interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
}
```

### Available Fields

**Item Information:**
- Item ID, Name, Category, Unit, Description, Status

**Inventory Information:**
- Current Stock, Total In, Total Out, Last Transaction Date, Average Price, Total Value

**User Information:**
- User ID, Name, Email

**Supplier Information:**
- Supplier ID, Name, Contact

### Report Builder Flow

1. **Select Report Type:**
   - Choose TABULAR, CHART, DASHBOARD, or PIVOT

2. **Choose Data Sources:**
   - Select tables/entities to include

3. **Select Fields:**
   - Choose columns to display
   - Set aggregation functions
   - Customize labels

4. **Configure Filters:**
   - Add filter conditions
   - Set operators and values
   - Combine with AND/OR logic

5. **Set Sorting:**
   - Choose sort fields
   - Set sort direction
   - Multiple sort levels

6. **Configure Visualization (for CHART/DASHBOARD):**
   - Select chart type
   - Set X and Y axes
   - Configure colors and styles

7. **Preview Report:**
   - Execute temporary report
   - Review results
   - Adjust configuration

8. **Save Report:**
   - Set name and description
   - Add tags
   - Set visibility (public/private)
   - Share with users

### Report Execution

**Execution Model:**
```typescript
interface ReportExecution {
  id: string;
  tenantId: string;
  reportId: string;
  executedBy: string;
  executionTime: number; // milliseconds
  resultCount?: number;
  parameters?: Record<string, unknown>;
  exportFormat: 'VIEW' | 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  errorMessage?: string;
  executedAt: Date;
}
```

**Execution Process:**
1. Validate report configuration
2. Build query from fields, filters, sorting
3. Execute query against database
4. Transform results based on report type
5. Generate visualization (if applicable)
6. Return results or export file
7. Log execution details

### Export Formats

**VIEW:**
- Display in browser
- Interactive visualization
- No file download

**PDF:**
- Formatted PDF document
- Includes charts and tables
- Print-ready

**EXCEL:**
- Excel file (.xlsx)
- Multiple sheets
- Formatted cells

**CSV:**
- Comma-separated values
- Raw data export
- Importable to other systems

**JSON:**
- Structured data format
- API consumption
- Data integration

### Report Templates

**Pre-defined Templates:**
1. **Inventory Items Report:**
   - All items with current stock
   - Category breakdown
   - Low stock alerts

2. **Inventory Transactions Report:**
   - All IN/OUT transactions
   - Date range filtering
   - User tracking

3. **Low Stock Items Report:**
   - Items below threshold
   - Reorder recommendations
   - Supplier information

### API Endpoints

**Create Report:**
**POST** `/api/bi/reports`
```json
{
  "name": "Monthly Sales Report",
  "description": "Sales by category",
  "reportType": "CHART",
  "dataSources": [...],
  "columnsConfig": [...],
  "filtersConfig": [...],
  "sortingConfig": [...],
  "isPublic": false,
  "tags": ["sales", "monthly"]
}
```

**Get Reports:**
**GET** `/api/bi/reports`
- Query parameters: `reportType`, `search`, `tags`, `page`, `limit`

**Execute Report:**
**POST** `/api/bi/reports/:id/execute`
```json
{
  "parameters": { "startDate": "...", "endDate": "..." },
  "exportFormat": "PDF"
}
```

**Get Execution History:**
**GET** `/api/bi/reports/:id/executions`

---

## KPI Calculations

### Overview

Key Performance Indicators (KPIs) provide quick insights into business health. The BI system calculates 6 main KPIs with trend analysis and status indicators.

### KPI List

**1. Total Revenue (درآمد کل):**
- Sum of all sales revenue
- Period comparison
- Growth percentage

**2. Net Profit (سود خالص):**
- Revenue minus total costs
- Period comparison
- Growth percentage

**3. Profit Margin (حاشیه سود):**
- (Net Profit / Total Revenue) * 100
- Percentage indicator
- Target: > 20%

**4. Inventory Turnover (گردش موجودی):**
- Cost of Goods Sold / Average Inventory Value
- Frequency indicator
- Target: > 4 times per period

**5. Average Order Value (میانگین ارزش سفارش):**
- Total Revenue / Number of Orders
- Currency indicator
- Growth target: +5%

**6. Stockout Rate (نرخ کمبود موجودی):**
- (Stockout Events / Total Demand) * 100
- Percentage indicator
- Target: < 5%

### KPI Data Structure

```typescript
interface KPIMetric {
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  unit: string;
  description: string;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  target?: number;
}
```

### Status Determination

**By Growth:**
- **GOOD:** `changePercent >= goodThreshold` (e.g., 5%)
- **WARNING:** `warningThreshold <= changePercent < goodThreshold` (e.g., 0-5%)
- **CRITICAL:** `changePercent < warningThreshold` (e.g., < 0%)

**By Value:**
- **GOOD:** `current >= goodThreshold`
- **WARNING:** `warningThreshold <= current < goodThreshold`
- **CRITICAL:** `current < warningThreshold`

### API Endpoint

**GET** `/api/bi/kpis`

**Query Parameters:**
- `period`: `7d` | `30d` | `90d` | `1y` (default: `30d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "financial": {
      "totalRevenue": {
        "value": 50000000,
        "previousValue": 45000000,
        "change": 5000000,
        "changePercent": 11.11,
        "trend": "UP",
        "unit": "تومان",
        "status": "GOOD"
      },
      "netProfit": {...},
      "profitMargin": {...}
    },
    "operational": {
      "inventoryTurnover": {...},
      "averageOrderValue": {...},
      "stockoutRate": {...}
    }
  }
}
```

---

## Executive Dashboard

### Overview

The Executive Dashboard provides a comprehensive view of business performance with KPIs, charts, and alerts. It's the main entry point for business intelligence.

### Components

**1. KPI Cards:**
- 6 main KPIs displayed as cards
- Color-coded by status
- Trend indicators
- Period comparison

**2. Revenue Chart:**
- Daily revenue, cost, and profit
- Line or bar chart
- Time series visualization

**3. Top Products Chart:**
- Best-selling products
- Revenue or quantity based
- Category breakdown

**4. Category Breakdown:**
- Sales by category
- Pie or donut chart
- Percentage distribution

**5. Alerts:**
- Low stock warnings
- Performance alerts
- Action items

### Data Structure

```typescript
interface ExecutiveDashboard {
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

### API Endpoint

**GET** `/api/bi/dashboard`

**Query Parameters:**
- `period`: `7d` | `30d` | `90d` | `1y` (default: `30d`)
- `startDate`: ISO8601 date (optional)
- `endDate`: ISO8601 date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "..." },
    "kpis": {...},
    "charts": {...},
    "alerts": [...],
    "generatedAt": "...",
    "generatedBy": "..."
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Previous Part:** [Part 4: Frontend Implementation](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART4.md)  
**Next Part:** [Part 6: Integration Features](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART6.md)

