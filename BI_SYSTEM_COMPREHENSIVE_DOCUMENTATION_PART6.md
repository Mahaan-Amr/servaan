# Business Intelligence System Workspace - Comprehensive Documentation
## Part 6: Integration Features

## Table of Contents
1. [Ordering & Sales System Integration](#ordering--sales-system-integration)
2. [Inventory Management Integration](#inventory-management-integration)
3. [Accounting System Integration](#accounting-system-integration)
4. [Cross-Workspace Data Flow](#cross-workspace-data-flow)
5. [Integration Architecture](#integration-architecture)
6. [Future Integration Opportunities](#future-integration-opportunities)

---

## Ordering & Sales System Integration

### Overview

The BI workspace integrates with the Ordering & Sales System to provide sales analytics, revenue tracking, and order-based insights. This integration enables comprehensive business intelligence by analyzing sales patterns, customer behavior, and product performance.

### Data Sources

**Primary Tables:**
- `Order`: Order information, totals, payment status, dates
- `OrderItem`: Individual items, quantities, prices, menu item references
- `OrderPayment`: Payment transactions, methods, amounts
- `MenuItem`: Menu item details, pricing, availability
- `Recipe`: Recipe definitions for menu items
- `RecipeIngredient`: Ingredient quantities and costs

### Integration Points

#### 1. Revenue Calculation

**Location:** `src/backend/src/services/biService.ts` - `calculateTotalRevenue()`

**Data Flow:**
```
Order (status = COMPLETED)
  ↓
OrderItem (quantity × unitPrice)
  ↓
Sum all completed order items
  ↓
Total Revenue
```

**Implementation:**
- Queries `InventoryEntry` with type `OUT` (created from completed orders)
- Filters by date range and tenant
- Calculates: `revenue = sum(quantity × unitPrice)`
- Compares with previous period for trend analysis

**Use Cases:**
- Dashboard revenue KPI
- Revenue trend analysis
- Period-over-period comparison
- Revenue forecasting

#### 2. Average Order Value (AOV)

**Location:** `src/backend/src/services/biService.ts` - `calculateAverageOrderValue()`

**Calculation:**
```typescript
AOV = Total Revenue / Number of Transactions
```

**Data Sources:**
- `InventoryEntry` (type `OUT`) from completed orders
- Each OUT entry represents a transaction

**Business Logic:**
- Counts distinct transactions (OUT entries)
- Calculates total revenue from transactions
- Divides revenue by transaction count
- Target: 50,000 Toman per order

**Status Determination:**
- **GOOD:** AOV ≥ 50,000 Toman
- **WARNING:** 35,000 ≤ AOV < 50,000 Toman
- **CRITICAL:** AOV < 35,000 Toman

#### 3. Sales Volume Analysis

**Location:** `src/backend/src/services/biService.ts` - `performTrendAnalysis()` (metric: `sales_volume`)

**Data Flow:**
```
OrderItem (quantity)
  ↓
Group by time period (daily/weekly/monthly)
  ↓
Sum quantities per period
  ↓
Sales volume trend
```

**Use Cases:**
- Sales volume trends
- Seasonal pattern detection
- Demand forecasting
- Inventory planning

#### 4. Top-Selling Items

**Location:** `src/backend/src/services/biService.ts` - `getTopProductsChart()`

**Data Sources:**
- `OrderItem` linked to `MenuItem`
- Aggregated by `menuItemId` or `itemId`

**Calculation:**
- Groups by menu item or inventory item
- Sums quantities sold
- Sums revenue generated
- Sorts by revenue (descending)
- Returns top N products

**Visualization:**
- Bar chart showing top products
- Revenue and quantity metrics
- Category breakdown

#### 5. COGS (Cost of Goods Sold) Calculation

**Location:** `src/backend/src/services/biService.ts` - `getCostOfGoodsSold()`

**Data Flow:**
```
OrderItem
  ↓
Recipe → RecipeIngredient → Item (WAC)
  ↓
Calculate ingredient cost per serving
  ↓
Multiply by order quantity
  ↓
Total COGS
```

**Implementation:**
- Uses recipe-based costing
- Calculates weighted average cost (WAC) for ingredients
- Multiplies ingredient cost by recipe quantity
- Multiplies by order item quantity
- Sums all COGS for period

**Use Cases:**
- Profit calculation (Revenue - COGS)
- Profit margin analysis
- Cost trend analysis
- Menu item profitability

#### 6. Profit Analysis Integration

**Location:** `src/backend/src/services/biService.ts` - `performProfitAnalysis()`

**Data Sources:**
- Revenue: `OrderItem` (quantity × unitPrice)
- Cost: Recipe ingredients (WAC × quantity)

**Calculation:**
```typescript
Profit = Revenue - COGS
Profit Margin = (Profit / Revenue) × 100
```

**Grouping Options:**
- **By Item:** Individual menu item profitability
- **By Category:** Category-level profitability

**Use Cases:**
- Product profitability ranking
- Menu optimization
- Pricing strategy
- Cost management

### Analytics Provided

1. **Sales Revenue Analytics:**
   - Total revenue by period
   - Revenue trends (daily/weekly/monthly)
   - Revenue growth percentage
   - Revenue forecasting

2. **Order Analytics:**
   - Average order value
   - Order volume trends
   - Order completion rate
   - Order cancellation analysis

3. **Product Performance:**
   - Top-selling items
   - Slow-moving items
   - Product mix analysis
   - Category performance

4. **Customer Analytics:**
   - Customer count trends
   - Average transaction value
   - Customer behavior patterns
   - Repeat customer analysis

5. **Payment Analytics:**
   - Payment method distribution
   - Payment trends
   - Outstanding payments
   - Payment completion rate

### Integration Status

**✅ Implemented:**
- Revenue calculation from orders
- Average order value calculation
- Sales volume tracking
- Top products analysis
- COGS calculation from recipes
- Profit analysis by item/category
- Order-based trend analysis

**⏭️ Future Enhancements:**
- Customer segmentation based on order history
- Order cancellation reason analysis
- Payment method profitability
- Table performance analytics
- Kitchen display efficiency metrics
- Order preparation time analysis

---

## Inventory Management Integration

### Overview

The BI workspace integrates with the Inventory Management workspace to provide inventory analytics, stock valuation, turnover analysis, and supply chain insights. This integration enables data-driven inventory decisions and optimization.

### Data Sources

**Primary Tables:**
- `Item`: Product information, categories, units
- `InventoryEntry`: Stock transactions (IN/OUT), quantities, prices
- `InventorySettings`: Stock thresholds, reorder points
- `Supplier`: Supplier information, pricing
- `ItemSupplier`: Supplier-item relationships, preferred suppliers

### Integration Points

#### 1. Inventory Valuation

**Location:** `src/backend/src/services/biService.ts` - `getAverageInventoryValue()`

**Calculation:**
```typescript
Average Inventory Value = (Beginning Inventory + Ending Inventory) / 2
```

**Data Flow:**
```
InventoryEntry (type = IN)
  ↓
Calculate WAC (Weighted Average Cost)
  ↓
Current Stock × WAC
  ↓
Inventory Value
```

**Implementation:**
- Calculates weighted average cost (WAC) for each item
- Multiplies current stock by WAC
- Sums all item values
- Calculates average over period

**Use Cases:**
- Balance sheet inventory value
- Inventory investment analysis
- Working capital calculation
- Inventory ROI

#### 2. Inventory Turnover

**Location:** `src/backend/src/services/biService.ts` - `calculateInventoryTurnover()`

**Calculation:**
```typescript
Inventory Turnover = COGS / Average Inventory Value
```

**Business Logic:**
- Measures how many times inventory is sold and replaced
- Higher turnover = better inventory management
- Target: 12 times per year (monthly turnover)

**Status Determination:**
- **GOOD:** Turnover ≥ 12 times/year
- **WARNING:** 8 ≤ Turnover < 12 times/year
- **CRITICAL:** Turnover < 8 times/year

**Use Cases:**
- Inventory efficiency measurement
- Overstocking detection
- Understocking detection
- Supply chain optimization

#### 3. Stockout Rate

**Location:** `src/backend/src/services/biService.ts` - `calculateStockoutRate()`

**Calculation:**
```typescript
Stockout Rate = (Items with Zero Stock / Total Items) × 100
```

**Data Flow:**
```
Item (isActive = true)
  ↓
Check InventoryEntry history
  ↓
Calculate current stock
  ↓
Count items with stock ≤ 0
  ↓
Stockout Rate
```

**Business Logic:**
- Identifies items that reached zero stock during period
- Calculates percentage of total items
- Lower rate = better inventory management
- Target: < 5%

**Status Determination:**
- **GOOD:** Stockout Rate < 5%
- **WARNING:** 5% ≤ Stockout Rate < 10%
- **CRITICAL:** Stockout Rate ≥ 10%

**Use Cases:**
- Inventory availability analysis
- Stockout prevention
- Reorder point optimization
- Supplier performance

#### 4. ABC Analysis

**Location:** `src/backend/src/services/biService.ts` - `performABCAnalysis()`

**Data Sources:**
- `Item`: Product information
- `InventoryEntry` (type `OUT`): Sales transactions

**Calculation:**
```
For each item:
  totalSales = sum(quantity × unitPrice)
  
Sort by totalSales (descending)

Calculate cumulative percentage:
  cumulativeSales += item.totalSales
  cumulativePercentage = (cumulativeSales / totalSales) × 100

Categorize:
  Category A: cumulativePercentage ≤ 80%
  Category B: 80% < cumulativePercentage ≤ 95%
  Category C: cumulativePercentage > 95%
```

**Use Cases:**
- Inventory prioritization
- Stock management strategy
- Warehouse space allocation
- Purchasing focus

#### 5. Low Stock Alerts

**Location:** `src/backend/src/services/biService.ts` - `getAnalyticsSummary()`

**Data Sources:**
- `Item`: Current stock levels
- `InventorySettings`: Low stock thresholds

**Calculation:**
```typescript
lowStockItems = items.filter(item => 
  item.currentStock <= item.lowStockThreshold
)
```

**Use Cases:**
- Dashboard alerts
- Reorder recommendations
- Stock monitoring
- Supplier notification

#### 6. Stock Movement Trends

**Location:** `src/backend/src/services/biService.ts` - `getAnalyticsSummary()`

**Data Sources:**
- `InventoryEntry`: All IN/OUT transactions

**Analysis:**
- IN entries: Stock received
- OUT entries: Stock consumed
- Net movement: IN - OUT
- Trend analysis over time

**Use Cases:**
- Consumption patterns
- Seasonal demand
- Supplier delivery trends
- Inventory optimization

#### 7. Category Distribution

**Location:** `src/backend/src/services/biService.ts` - `getCategoryBreakdownChart()`

**Data Sources:**
- `Item`: Category information
- `InventoryEntry`: Transaction quantities

**Calculation:**
- Groups items by category
- Sums quantities or values per category
- Calculates percentage distribution
- Visualizes as pie/donut chart

**Use Cases:**
- Category performance
- Inventory mix analysis
- Category-based purchasing
- Category profitability

### Analytics Provided

1. **Inventory Valuation:**
   - Current inventory value
   - Average inventory value
   - Inventory value trends
   - Category-wise valuation

2. **Stock Management:**
   - Current stock levels
   - Low stock alerts
   - Stockout rate
   - Stock movement patterns

3. **Turnover Analysis:**
   - Inventory turnover rate
   - Turnover by category
   - Turnover trends
   - Turnover optimization

4. **Supplier Analytics:**
   - Supplier performance
   - Supplier pricing trends
   - Delivery reliability
   - Cost comparison

5. **Category Analytics:**
   - Category distribution
   - Category consumption
   - Category profitability
   - Category trends

### Integration Status

**✅ Implemented:**
- Inventory valuation calculation
- Inventory turnover calculation
- Stockout rate calculation
- ABC analysis
- Low stock detection
- Stock movement tracking
- Category distribution

**⏭️ Future Enhancements:**
- Supplier performance scoring
- Purchase order analytics
- Lead time analysis
- Safety stock optimization
- Economic order quantity (EOQ)
- Multi-location inventory support

---

## Accounting System Integration

### Overview

The BI workspace integrates with the Accounting System to provide financial analytics, profitability analysis, and financial health indicators. This integration enables comprehensive financial intelligence and business performance measurement.

### Data Sources

**Primary Tables:**
- `JournalEntry`: Accounting entries, dates, descriptions
- `JournalEntryLine`: Entry line items, accounts, debit/credit amounts
- `ChartOfAccount`: Account structure, account codes, account types
- `FinancialStatement`: Cached financial statements
- `CostCenter`: Department/project cost tracking

### Integration Points

#### 1. Financial Statement Integration

**Location:** `src/backend/src/services/financialStatementsService.ts`

**Data Sources:**
- Balance Sheet: Asset, liability, equity accounts
- Income Statement: Revenue, expense accounts
- Cash Flow: Operating, investing, financing activities

**BI Usage:**
- Financial health indicators
- Profitability ratios
- Liquidity ratios
- Leverage ratios

#### 2. Revenue Reconciliation

**Location:** `src/backend/src/services/biService.ts` - `calculateTotalRevenue()`

**Data Flow:**
```
Order Revenue (Ordering System)
  ↓
Journal Entry (Accounting System)
  ↓
Reconcile amounts
  ↓
Verify accuracy
```

**Business Logic:**
- BI calculates revenue from orders
- Accounting records revenue in journal entries
- Reconciliation ensures data consistency
- Identifies discrepancies

#### 3. Cost Reconciliation

**Location:** `src/backend/src/services/biService.ts` - `getTotalCostsForPeriod()`

**Data Flow:**
```
Inventory COGS (Inventory System)
  ↓
Journal Entry COGS (Accounting System)
  ↓
Reconcile costs
  ↓
Verify accuracy
```

**Business Logic:**
- BI calculates COGS from inventory
- Accounting records COGS in journal entries
- Reconciliation ensures cost accuracy
- Identifies cost discrepancies

#### 4. Profit Margin Calculation

**Location:** `src/backend/src/services/biService.ts` - `calculateProfitMargin()`

**Data Sources:**
- Revenue: From orders or journal entries
- Costs: From inventory or journal entries

**Calculation:**
```typescript
Profit Margin = (Net Profit / Total Revenue) × 100
```

**Accounting Integration:**
- Uses journal entry data for accuracy
- Reconciles with order-based calculations
- Provides financial statement alignment

#### 5. Financial Ratios

**Location:** `src/backend/src/services/financialRatiosService.ts`

**Ratios Calculated:**
- **Liquidity Ratios:**
  - Current Ratio
  - Quick Ratio
  - Cash Ratio

- **Profitability Ratios:**
  - Gross Profit Margin
  - Net Profit Margin
  - Return on Assets (ROA)
  - Return on Equity (ROE)

- **Leverage Ratios:**
  - Debt-to-Equity Ratio
  - Debt Ratio
  - Equity Ratio

- **Activity Ratios:**
  - Inventory Turnover
  - Accounts Receivable Turnover
  - Asset Turnover

**BI Usage:**
- Dashboard financial health indicators
- Trend analysis
- Benchmark comparison
- Risk assessment

#### 6. Budget vs Actual Analysis

**Location:** `src/backend/src/services/budgetService.ts`

**Data Sources:**
- Budget: Planned amounts
- Actual: Journal entry amounts
- Variance: Difference between budget and actual

**BI Usage:**
- Budget variance analysis
- Budget performance tracking
- Forecast accuracy
- Budget optimization

#### 7. Cost Center Analytics

**Location:** `src/backend/src/services/costCenterService.ts`

**Data Sources:**
- `CostCenter`: Department/project definitions
- `JournalEntryLine`: Cost allocations

**BI Usage:**
- Department profitability
- Project cost analysis
- Cost center performance
- Resource allocation

### Analytics Provided

1. **Financial Health:**
   - Profitability indicators
   - Liquidity ratios
   - Leverage ratios
   - Activity ratios

2. **Revenue Analytics:**
   - Revenue by account
   - Revenue trends
   - Revenue forecasting
   - Revenue reconciliation

3. **Cost Analytics:**
   - Cost by account
   - Cost trends
   - Cost center analysis
   - Cost reconciliation

4. **Profitability:**
   - Gross profit margin
   - Net profit margin
   - Profit by account
   - Profit trends

5. **Budget Analysis:**
   - Budget vs actual
   - Variance analysis
   - Budget performance
   - Forecast accuracy

### Integration Status

**✅ Implemented:**
- Revenue calculation alignment
- COGS calculation alignment
- Profit margin calculation
- Financial statement data access
- Basic financial ratios

**⏭️ Future Enhancements:**
- Advanced financial ratios
- Budget vs actual analysis
- Cost center analytics
- Tax analytics
- Cash flow analysis
- Financial forecasting

---

## Cross-Workspace Data Flow

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Business Intelligence Workspace                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Data Aggregation Layer                       │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │   Ordering   │  │  Inventory    │  │Accounting │  │   │
│  │  │   Workspace  │  │  Workspace    │  │ Workspace│  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │   │
│  │         │                 │                 │         │   │
│  │         ▼                 ▼                 ▼         │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │      Cross-Workspace Data Integration        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │         │                                           │   │
│  │         ▼                                           │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Analytics & Calculation Engine       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │         │                                           │   │
│  │         ▼                                           │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Visualization & Reporting Layer       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Examples

#### Example 1: Revenue Calculation

```
Order (Ordering Workspace)
  ├─ OrderItem (quantity, unitPrice)
  └─ OrderPayment (status = COMPLETED)
       │
       ▼
InventoryEntry (type = OUT) (Inventory Workspace)
  ├─ quantity
  ├─ unitPrice
  └─ orderId (link to Order)
       │
       ▼
BI Service: calculateTotalRevenue()
  ├─ Sum all OUT entries
  ├─ Filter by period
  └─ Calculate total revenue
       │
       ▼
JournalEntry (Accounting Workspace)
  ├─ Revenue account (4101)
  └─ Debit amount
       │
       ▼
BI Dashboard: Revenue KPI
```

#### Example 2: Profit Analysis

```
OrderItem (Ordering Workspace)
  ├─ MenuItem
  └─ Recipe
       │
       ▼
RecipeIngredient (Inventory Workspace)
  ├─ Item (WAC)
  └─ quantity
       │
       ▼
BI Service: performProfitAnalysis()
  ├─ Calculate Revenue (OrderItem)
  ├─ Calculate COGS (RecipeIngredient × WAC)
  ├─ Calculate Profit (Revenue - COGS)
  └─ Calculate Margin (Profit / Revenue × 100)
       │
       ▼
BI Dashboard: Profit Analysis Page
```

#### Example 3: Inventory Turnover

```
InventoryEntry (Inventory Workspace)
  ├─ type = IN (purchases)
  └─ type = OUT (sales)
       │
       ▼
BI Service: calculateInventoryTurnover()
  ├─ Calculate COGS (OUT entries × WAC)
  ├─ Calculate Average Inventory Value
  └─ Turnover = COGS / Avg Inventory
       │
       ▼
JournalEntry (Accounting Workspace)
  ├─ COGS account (5100)
  └─ Inventory account (1103)
       │
       ▼
BI Dashboard: Inventory Turnover KPI
```

### Data Consistency

**Multi-Source Validation:**
- BI calculations cross-validate with accounting entries
- Revenue reconciliation between orders and journal entries
- COGS reconciliation between inventory and journal entries
- Discrepancy detection and reporting

**Data Synchronization:**
- Real-time updates via WebSocket
- Event-driven data refresh
- Cache invalidation on data changes
- Periodic reconciliation jobs

---

## Integration Architecture

### Integration Patterns

#### 1. Direct Database Access

**Pattern:** BI service queries workspace tables directly

**Advantages:**
- Fast data access
- Real-time data
- No API overhead

**Disadvantages:**
- Tight coupling
- Schema dependency
- Cross-workspace access

**Usage:**
- Revenue calculation
- Inventory valuation
- Stock level queries

#### 2. Service Layer Integration

**Pattern:** BI service calls workspace services

**Advantages:**
- Loose coupling
- Service abstraction
- Business logic encapsulation

**Disadvantages:**
- API overhead
- Service dependency
- Potential latency

**Usage:**
- COGS calculation (via OrderInventoryIntegrationService)
- Financial statements (via FinancialStatementsService)
- Budget analysis (via BudgetService)

#### 3. Event-Driven Integration

**Pattern:** BI listens to workspace events

**Advantages:**
- Real-time updates
- Decoupled architecture
- Scalable

**Disadvantages:**
- Event handling complexity
- Event ordering
- Error handling

**Usage:**
- Real-time dashboard updates
- Stock change notifications
- Order completion events

### Integration Middleware

**Tenant Context:**
- All integrations enforce tenant isolation
- `tenantId` filtering in all queries
- Cross-workspace tenant validation

**Authentication:**
- JWT token validation
- User permission checks
- Workspace access control

**Error Handling:**
- Graceful degradation
- Partial data handling
- Error logging and monitoring

---

## Future Integration Opportunities

### 1. CRM Workspace Integration

**Potential Analytics:**
- Customer lifetime value (CLV)
- Customer segmentation
- Customer retention analysis
- Customer acquisition cost (CAC)
- Customer churn prediction

**Data Sources:**
- Customer profiles
- Customer interactions
- Customer feedback
- Loyalty program data

### 2. SMS Workspace Integration

**Potential Analytics:**
- Campaign effectiveness
- SMS delivery rates
- Customer engagement
- Marketing ROI
- Communication trends

**Data Sources:**
- SMS campaigns
- Delivery status
- Customer responses
- Campaign costs

### 3. Public Relations Workspace Integration

**Potential Analytics:**
- Brand awareness metrics
- Social media engagement
- Public sentiment analysis
- PR campaign ROI
- Media coverage analysis

**Data Sources:**
- Social media posts
- Media mentions
- Customer reviews
- PR campaign data

### 4. Advanced Predictive Analytics

**Potential Features:**
- Demand forecasting
- Sales prediction
- Inventory optimization
- Price optimization
- Customer behavior prediction

**Technologies:**
- Machine learning models
- Time series forecasting
- Regression analysis
- Clustering algorithms

### 5. Real-Time Analytics

**Potential Features:**
- Live dashboard updates
- Real-time alerts
- Streaming analytics
- Event-driven insights
- Instant notifications

**Technologies:**
- WebSocket connections
- Server-Sent Events (SSE)
- Real-time data pipelines
- Stream processing

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Previous Part:** [Part 5: Core Features](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART5.md)  
**Next Part:** [Part 7: API Endpoints and Business Logic](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART7.md)

