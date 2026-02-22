# Business Intelligence System Workspace - Comprehensive Documentation
## Part 4: Frontend Implementation

## Table of Contents
1. [Page Structure](#page-structure)
2. [Service Layer](#service-layer)
3. [Chart Components](#chart-components)
4. [Data Transformation](#data-transformation)
5. [State Management](#state-management)
6. [UI Components](#ui-components)

---

## Page Structure

All BI pages are located under `src/frontend/app/workspaces/business-intelligence/`:

```
business-intelligence/
├── layout.tsx                    # Workspace layout with sidebar
├── page.tsx                      # Main Dashboard
├── abc-analysis/
│   └── page.tsx                  # ABC Analysis page
├── profit-analysis/
│   └── page.tsx                  # Profit Analysis page
├── trend-analysis/
│   └── page.tsx                  # Trend Analysis page
├── analytics/
│   └── page.tsx                  # Analytics Reports page
└── custom-reports/
    └── page.tsx                  # Custom Report Builder
```

### Layout Component

**File:** `src/frontend/app/workspaces/business-intelligence/layout.tsx`

**Features:**
- Sidebar navigation with icons
- Workspace branding
- User context display
- Responsive sidebar (expandable/collapsible)
- Active route highlighting

**Navigation Items:**
1. Dashboard (داشبورد هوش تجاری)
2. Advanced Analytics (تحلیل‌های پیشرفته)
3. Custom Reports (گزارش‌ساز سفارشی)
4. Trend Analysis (تحلیل روند)
5. ABC Analysis (تحلیل ABC)
6. Profit Analysis (تحلیل سودآوری)

---

## Service Layer

### BiService (`src/frontend/services/biService.ts`)

Main service for BI API communication.

**Key Methods:**

#### 1. `getDashboard(period: string, startDate?: string, endDate?: string): Promise<BIDashboard>`

**Purpose:** Fetch main dashboard data

**Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `startDate`: Optional ISO8601 date
- `endDate`: Optional ISO8601 date

**Returns:** Complete dashboard with KPIs and charts

**Usage:**
```typescript
const dashboard = await biService.getDashboard('30d');
```

#### 2. `getKPIs(period: string): Promise<KPIData>`

**Purpose:** Fetch KPI data

**Returns:**
```typescript
{
  financial: {
    totalRevenue: KPIValue;
    netProfit: KPIValue;
    profitMargin: KPIValue;
  };
  operational: {
    inventoryTurnover: KPIValue;
    averageOrderValue: KPIValue;
    stockoutRate: KPIValue;
  };
}
```

#### 3. `getABCAnalysis(period: string): Promise<ABCAnalysisData>`

**Purpose:** Fetch ABC analysis data

**Returns:** Products categorized into A, B, C with sales data

#### 4. `getProfitAnalysis(period: string, groupBy: 'item' | 'category'): Promise<ProfitAnalysisResponse>`

**Purpose:** Fetch profit analysis data

**Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y`
- `groupBy`: `item` or `category`

**Returns:** Profit breakdown by item or category

#### 5. `getTrendAnalysis(metric: string, period: string, granularity: 'day' | 'week' | 'month'): Promise<TrendAnalysisData>`

**Purpose:** Fetch trend analysis data

**Parameters:**
- `metric`: `revenue`, `profit`, `sales_volume`, `customers`
- `period`: `7d`, `30d`, `90d`, `1y`
- `granularity`: `day`, `week`, `month`

**Returns:** Time-series data with trend and forecast

#### 6. `getAnalyticsSummary(): Promise<AnalyticsSummary>`

**Purpose:** Fetch analytics summary statistics

**Returns:**
```typescript
{
  totalItems: number;
  lowStockCount: number;
  recentTransactions: number;
  totalInventoryValue: number;
}
```

#### 7. `createCustomReport(reportConfig: unknown): Promise<unknown>`

**Purpose:** Create new custom report

**Request:**
```typescript
{
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  dataSources: DataSourceConfig[];
  columnsConfig: ReportField[];
  filtersConfig?: ReportFilter[];
  sortingConfig?: ReportSorting[];
  isPublic: boolean;
  tags: string[];
}
```

#### 8. `executeReport(reportId: string, parameters?: unknown, exportFormat: string): Promise<unknown>`

**Purpose:** Execute saved report

**Parameters:**
- `reportId`: Report ID
- `parameters`: Runtime parameters
- `exportFormat`: `VIEW`, `PDF`, `EXCEL`, `CSV`, `JSON`

**Returns:** Report execution results

#### 9. `executeTemporaryReport(reportConfig: unknown): Promise<unknown>`

**Purpose:** Execute report without saving (preview)

**Use Case:** Preview report before saving

### ReportService (`src/frontend/services/reportService.ts`)

Service for custom report management.

**Key Methods:**

#### 1. `getReports(filters?: ReportFilters, pagination?: PaginationOptions): Promise<PaginatedReports>`

**Purpose:** Get list of reports with filtering and pagination

**Filters:**
```typescript
{
  reportType?: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  search?: string;
  tags?: string[];
}
```

**Pagination:**
```typescript
{
  page: number;
  limit: number;
}
```

#### 2. `getReportById(reportId: string): Promise<Report>`

**Purpose:** Get full report details including configurations

#### 3. `createReport(reportConfig: CreateReportConfig): Promise<Report>`

**Purpose:** Create new report

#### 4. `updateReport(reportId: string, reportConfig: UpdateReportConfig): Promise<Report>`

**Purpose:** Update existing report

#### 5. `deleteReport(reportId: string): Promise<void>`

**Purpose:** Delete report

#### 6. `executeReport(reportId: string, parameters?: object, exportFormat?: string): Promise<ReportExecutionResult>`

**Purpose:** Execute report and get results

**Returns:**
```typescript
{
  data: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
  exportUrl?: string;  // If exportFormat is PDF/EXCEL/CSV
}
```

---

## Chart Components

### Chart Component Library

**Location:** `src/frontend/components/charts/`

#### 1. CustomBarChart

**File:** `src/frontend/components/charts/BarChart.tsx`

**Purpose:** Bar chart visualization

**Props:**
```typescript
interface BarChartProps {
  data: Array<{ name: string; [key: string]: number }>;
  bars: Array<{
    dataKey: string;
    name: string;
    fill: string;
  }>;
  title?: string;
  xAxisKey?: string;
  height?: number;
  className?: string;
}
```

**Usage:**
```tsx
<CustomBarChart
  data={profitData.analysis}
  bars={[
    { dataKey: 'revenue', name: 'درآمد', fill: '#10B981' },
    { dataKey: 'cost', name: 'هزینه', fill: '#EF4444' }
  ]}
  title="مقایسه هزینه و درآمد"
  xAxisKey="name"
  height={300}
/>
```

#### 2. CustomScatterChart

**File:** `src/frontend/components/charts/ScatterChart.tsx`

**Purpose:** Scatter plot for correlation analysis

**Props:**
```typescript
interface ScatterChartProps {
  data: Array<{
    name: string;
    revenue: number;
    profit: number;
    profitMargin: number;
  }>;
  title?: string;
  height?: number;
}
```

**Usage:**
```tsx
<CustomScatterChart
  data={revenueVsProfitData}
  title="رابطه درآمد و سودآوری"
  height={300}
/>
```

#### 3. CustomDonutChart

**File:** `src/frontend/components/charts/DonutChart.tsx`

**Purpose:** Donut chart for distribution visualization

**Props:**
```typescript
interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
    percentage: number;
  }>;
  title?: string;
}
```

**Usage:**
```tsx
<CustomDonutChart
  data={profitMarginDistribution}
  title="توزیع حاشیه سود"
/>
```

#### 4. CustomMatrixChart

**File:** `src/frontend/components/charts/MatrixChart.tsx`

**Purpose:** Matrix chart for performance analysis

**Props:**
```typescript
interface MatrixChartProps {
  data: Array<{
    name: string;
    revenue: number;
    profit: number;
    profitMargin: number;
    quantity: number;
    category: string;
  }>;
  title?: string;
  height?: number;
}
```

**Usage:**
```tsx
<CustomMatrixChart
  data={profitPerformanceMatrix}
  title="ماتریس عملکرد سودآوری"
  height={300}
/>
```

#### 5. CustomTopProductsChart

**File:** `src/frontend/components/charts/TopProductsChart.tsx`

**Purpose:** Specialized chart for top products display

**Props:**
```typescript
interface TopProductsChartProps {
  data: Array<{
    name: string;
    fullName: string;
    revenue: number;
    quantity: number;
    profit: number;
    profitMargin: number;
    abcCategory: 'A' | 'B' | 'C';
    percentage: number;
  }>;
  title?: string;
  height?: number;
  maxProducts?: number;
}
```

**Usage:**
```tsx
<CustomTopProductsChart
  data={topProfitableProducts}
  title="محصولات پرسودترین"
  height={320}
  maxProducts={10}
/>
```

#### 6. CustomLineChart

**File:** `src/frontend/components/charts/LineChart.tsx`

**Purpose:** Line chart for time-series data

**Props:**
```typescript
interface LineChartProps {
  data: Array<{ date: string; [key: string]: number }>;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
  }>;
  title?: string;
  height?: number;
}
```

#### 7. CustomPieChart

**File:** `src/frontend/components/charts/PieChart.tsx`

**Purpose:** Pie chart for category breakdown

**Props:**
```typescript
interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title?: string;
  height?: number;
  showLegend?: boolean;
}
```

#### 8. CustomAreaChart

**File:** `src/frontend/components/charts/AreaChart.tsx`

**Purpose:** Area chart for trend visualization

#### 9. CustomForecastChart

**File:** `src/frontend/components/charts/ForecastChart.tsx`

**Purpose:** Forecast visualization with confidence intervals

#### 10. CustomParetoChart

**File:** `src/frontend/components/charts/ParetoChart.tsx`

**Purpose:** Pareto chart for ABC analysis

#### 11. CustomMultiMetricChart

**File:** `src/frontend/components/charts/MultiMetricChart.tsx`

**Purpose:** Multi-metric comparison chart

#### 12. CustomKPIScorecard

**File:** `src/frontend/components/charts/KPIScorecard.tsx`

**Purpose:** KPI scorecard display

#### 13. CustomInsightsCard

**File:** `src/frontend/components/charts/InsightsCard.tsx`

**Purpose:** Insights and recommendations display

---

## Data Transformation

### ChartDataTransformer (`src/frontend/services/chartDataTransformer.ts`)

**Purpose:** Transform backend data to chart-ready format

**Key Methods:**

#### 1. `transformTopProfitableProducts(profitData: ProfitData, limit: number): TopProfitableProductsData[]`

**Purpose:** Transform profit data to top products chart format

**Process:**
1. Sort by profit (descending)
2. Take top N products
3. Calculate percentages
4. Assign ABC categories
5. Format for chart display

#### 2. `transformRevenueVsProfitScatter(profitData: ProfitData): RevenueVsProfitScatterData[]`

**Purpose:** Transform to scatter chart format

**Process:**
1. Extract revenue and profit per item
2. Calculate profit margin
3. Format for scatter plot

#### 3. `transformProfitMarginDistribution(profitData: ProfitData): ProfitMarginDistributionData[]`

**Purpose:** Group products by profit margin ranges

**Ranges:**
- High (≥ 20%)
- Medium (10-20%)
- Low (0-10%)
- Negative (< 0%)

#### 4. `transformCostVsRevenueComparison(profitData: ProfitData, limit: number): CostVsRevenueComparisonData[]`

**Purpose:** Transform for cost vs revenue comparison chart

#### 5. `transformProfitPerformanceMatrix(profitData: ProfitData): ProfitPerformanceMatrixData[]`

**Purpose:** Transform for matrix chart (revenue vs profit)

**Matrix Quadrants:**
- High Revenue, High Profit (Stars)
- High Revenue, Low Profit (Question Marks)
- Low Revenue, High Profit (Cash Cows)
- Low Revenue, Low Profit (Dogs)

#### 6. `validateProfitData(data: unknown): data is ProfitData`

**Purpose:** Type guard for profit data validation

---

## State Management

### Dashboard Page State

**File:** `src/frontend/app/workspaces/business-intelligence/page.tsx`

```typescript
const [stats, setStats] = useState<BIStats>({
  totalSales: 0,
  totalProfit: 0,
  profitMargin: 0,
  activeProducts: 0,
  lowStockItems: 0,
  monthlyGrowth: 0,
  inventoryTurnover: 0,
  averageOrderValue: 0,
  stockoutRate: 0
});

const [reports, setReports] = useState<QuickReport[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Data Fetching:**
```typescript
const fetchBIData = useCallback(async () => {
  try {
    setLoading(true);
    const [dashboardResponse, kpisResponse] = await Promise.all([
      biService.getDashboard('30d'),
      biService.getKPIs('30d')
    ]);
    
    // Extract and transform data
    // Update state
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}, []);
```

### ABC Analysis Page State

**File:** `src/frontend/app/workspaces/business-intelligence/abc-analysis/page.tsx`

```typescript
const [abcData, setAbcData] = useState<ABCAnalysisData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [period, setPeriod] = useState('30d');
```

**Data Loading:**
```typescript
const loadABCAnalysis = useCallback(async () => {
  try {
    setLoading(true);
    const response = await biService.getABCAnalysis(period);
    
    // Handle wrapped response format
    let abcData: ABCAnalysisData;
    if (response.success && response.data) {
      abcData = response.data;
    } else {
      abcData = response as ABCAnalysisData;
    }
    
    setAbcData(abcData);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}, [period]);
```

### Profit Analysis Page State

**File:** `src/frontend/app/workspaces/business-intelligence/profit-analysis/page.tsx`

```typescript
const [profitData, setProfitData] = useState<ProfitData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [period, setPeriod] = useState('30d');
const [groupBy, setGroupBy] = useState<'item' | 'category'>('item');
```

**Data Transformation:**
```typescript
// Transform backend response to frontend format
const profitData: ProfitData = {
  totalRevenue: backendData.summary.totalRevenue,
  totalCost: backendData.summary.totalRevenue - backendData.summary.totalProfit,
  totalProfit: backendData.summary.totalProfit,
  overallMargin: backendData.summary.overallMargin,
  analysis: backendData.items.map(item => ({
    id: item.id || item.name,
    name: item.name,
    category: item.category,
    revenue: item.totalRevenue,
    cost: item.totalCost,
    profit: item.totalProfit,
    profitMargin: item.profitMargin,
    quantity: item.totalSold
  }))
};
```

### Custom Reports Page State

**File:** `src/frontend/app/workspaces/business-intelligence/custom-reports/page.tsx`

```typescript
const [reports, setReports] = useState<Report[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [selectedType, setSelectedType] = useState('ALL');
const [showCreateForm, setShowCreateForm] = useState(false);
const [showEditForm, setShowEditForm] = useState(false);
const [editingReport, setEditingReport] = useState<Report | null>(null);
const [showResultsModal, setShowResultsModal] = useState(false);
const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null);

// Create report form state
const [newReport, setNewReport] = useState({
  name: '',
  description: '',
  reportType: 'TABULAR' as 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT',
  tags: [] as string[],
  isPublic: false,
  selectedFields: [] as string[],
  filters: [] as ReportFilter[],
  sorting: [] as ReportSorting[]
});
```

---

## UI Components

### Common UI Patterns

#### 1. Loading States

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
```

#### 2. Error States

```tsx
if (error) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <div className="bg-red-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={retryFunction} className="bg-purple-600 text-white px-4 py-2 rounded-lg">
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
```

#### 3. Empty States

```tsx
if (!data || data.length === 0) {
  return (
    <div className="text-center py-12">
      <div className="bg-blue-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">داده‌ای موجود نیست</h3>
      <p className="text-gray-600 dark:text-gray-400">برای دوره انتخاب شده داده‌ای موجود نیست</p>
    </div>
  );
}
```

#### 4. Stats Cards

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
  <div className="flex items-center">
    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
    <div className="mr-4">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل فروش</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSales)}</p>
      <p className="text-xs text-green-600 dark:text-green-400">+{stats.monthlyGrowth}% این ماه</p>
    </div>
  </div>
</div>
```

#### 5. Period Selector

```tsx
<select
  value={period}
  onChange={(e) => setPeriod(e.target.value)}
  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
>
  <option value="7d">۷ روز گذشته</option>
  <option value="30d">۳۰ روز گذشته</option>
  <option value="90d">۹۰ روز گذشته</option>
  <option value="1y">یک سال گذشته</option>
</select>
```

#### 6. Trend Indicators

```tsx
{trend === 'up' && (
  <div className="flex items-center text-green-600">
    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
    <span>+{changePercent.toFixed(1)}%</span>
  </div>
)}
```

### Responsive Design

**Breakpoints:**
- Mobile: `< 640px` (sm)
- Tablet: `640px - 1024px` (md, lg)
- Desktop: `> 1024px` (xl, 2xl)

**Responsive Patterns:**
```tsx
// Grid layouts
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {/* Cards */}
</div>

// Text sizes
<p className="text-xs sm:text-sm text-base font-medium">...</p>

// Spacing
<div className="space-y-2 sm:space-y-3 sm:space-y-4">...</div>
```

### Dark Mode Support

**Color Classes:**
```tsx
// Background
className="bg-white dark:bg-gray-800"

// Text
className="text-gray-900 dark:text-white"

// Borders
className="border-gray-200 dark:border-gray-700"
```

---

## Main Pages Implementation

### Dashboard Page (`page.tsx`)

**Features:**
- Real-time KPI cards (6 metrics)
- Quick action buttons
- Quick reports section
- Responsive grid layout

**Data Flow:**
1. Component mounts
2. `fetchBIData()` called
3. Parallel API calls: `getDashboard()` and `getKPIs()`
4. Data extracted from wrapped responses
5. State updated
6. UI re-renders

**Key Sections:**
- Header with user greeting
- Stats cards (3-column grid)
- Quick actions (4-column grid)
- Quick reports (3-column grid)

### ABC Analysis Page (`abc-analysis/page.tsx`)

**Features:**
- Period selector (7d, 30d, 90d)
- Summary cards (Total Products, Total Sales, Products with Sales)
- Category breakdown (A, B, C cards)
- Products table with sorting
- Empty state handling

**Data Display:**
- Category cards with product lists
- Full products table with:
  - Rank
  - Product name and category
  - Total sales
  - Quantity
  - Percentage
  - Cumulative percentage
  - ABC category badge

**Color Coding:**
- Category A: Green
- Category B: Yellow
- Category C: Red

### Profit Analysis Page (`profit-analysis/page.tsx`)

**Features:**
- Period selector (7d, 30d, 90d, 1y)
- Group by selector (Item/Category)
- Summary cards (Revenue, Cost, Profit, Margin)
- Multiple chart visualizations:
  - Top Profitable Products (Bar Chart)
  - Revenue vs Profit (Scatter Chart)
  - Profit Margin Distribution (Donut Chart)
  - Cost vs Revenue Comparison (Bar Chart)
  - Profit Performance Matrix (Matrix Chart)
- Profit table with detailed breakdown
- Key insights cards

**Chart Layout:**
- Top Products: Full width
- Revenue vs Profit + Margin Distribution: 8/4 column split
- Cost vs Revenue + Matrix: 6/6 column split

**Data Transformation:**
- Uses `ChartDataTransformer` for all chart data
- Maintains backward compatibility
- Type-safe transformations

### Trend Analysis Page (`trend-analysis/page.tsx`)

**Features:**
- Metric selector (Revenue, Profit, Sales Volume, Customers)
- Period selector (7d, 30d, 90d, 1y)
- Granularity selector (Daily, Weekly, Monthly)
- Tabbed interface:
  - Overview: Summary cards and trend chart
  - Forecast: Future predictions
  - Multi-Metric: Multiple metrics comparison
  - Insights: AI-generated insights
  - Scorecard: KPI scorecard

**Summary Cards:**
- Total value
- Growth percentage
- Trend accuracy (R-squared)
- Average value

**Empty State:**
- Shows when no data available
- Provides period selection buttons
- Helpful message

### Analytics Reports Page (`analytics/page.tsx`)

**Features:**
- Period selector (7, 30, 90 days)
- Summary cards (4 metrics)
- Category distribution chart
- Recent trends list
- Monthly data grid
- Quick actions section

**Data Sources:**
- `getAnalyticsSummary()` for summary
- `getDashboard()` for category chart
- `getTrendAnalysis()` for trends and monthly data

### Custom Reports Page (`custom-reports/page.tsx`)

**Features:**
- Report list with search and filters
- Create report form
- Edit report form
- Report execution with preview
- Export functionality (PDF, Excel, CSV, JSON)
- Report templates
- Field selection interface
- Filter builder
- Sorting configuration

**Report Builder Flow:**
1. Select report type
2. Choose data sources
3. Select fields
4. Configure filters
5. Set sorting
6. Preview report
7. Save or execute

**Available Fields:**
- Item Information (6 fields)
- Inventory Information (6 fields)
- User Information (3 fields)
- Supplier Information (3 fields)

**Report Templates:**
- Inventory Items Report
- Inventory Transactions Report
- Low Stock Items Report

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Previous Part:** [Part 3: Backend Implementation](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART3.md)  
**Next Part:** [Part 5: Core Features](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART5.md)

