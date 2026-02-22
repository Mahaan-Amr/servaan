# Business Intelligence System Workspace - Comprehensive Documentation
## Part 1: Overview and System Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)

---

## Overview

The Business Intelligence (BI) workspace is a comprehensive analytics and reporting system designed to provide deep insights into business operations. It aggregates data from multiple workspaces (Ordering & Sales, Inventory Management, and Accounting) to deliver actionable intelligence through advanced analytics, custom reports, and real-time dashboards.

### Key Characteristics

- **Multi-Source Data Integration**: Aggregates data from Ordering, Inventory, and Accounting workspaces
- **Advanced Analytics**: ABC Analysis, Profit Analysis, Trend Analysis, and Forecasting
- **Custom Report Builder**: Drag-and-drop report creation with multiple data sources
- **Real-Time KPIs**: Live calculation of key performance indicators
- **Multi-Tenant Architecture**: Complete data isolation per tenant
- **Persian Calendar Support**: Date formatting and analysis based on Shamsi calendar
- **Export Capabilities**: PDF, Excel, CSV, and JSON export formats
- **Visual Analytics**: Interactive charts and graphs for data visualization
- **Smart Insights**: AI-powered business insights and recommendations

### Main Components

1. **Dashboard (داشبورد هوش تجاری)**: Real-time KPI overview and quick insights
2. **ABC Analysis (تحلیل ABC)**: Product categorization based on sales value
3. **Profit Analysis (تحلیل سودآوری)**: Revenue, cost, and profit margin analysis
4. **Trend Analysis (تحلیل روند)**: Time-series analysis with forecasting
5. **Analytics Reports (گزارش‌های آماری)**: Statistical summaries and category breakdowns
6. **Custom Reports (گزارش‌ساز سفارشی)**: User-defined reports with flexible data sources

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │ ABC Analysis │  │   Profit     │     │
│  │              │  │              │  │   Analysis   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Trend      │  │   Analytics  │  │    Custom    │     │
│  │   Analysis   │  │   Reports    │  │    Reports   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           BI Controller                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ BI Service   │  │ Report      │  │  Query       │   │
│  │              │  │ Service     │  │  Builder     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            │
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Orders     │  │  Inventory   │  │  Accounting  │     │
│  │  OrderItems  │  │  Entries     │  │  Journals    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │   Custom     │  │  Report      │                      │
│  │   Reports    │  │  Executions  │                      │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Layers

1. **Presentation Layer (Frontend)**
   - React components for UI
   - Next.js pages for routing
   - Chart components for visualization
   - Service layer for API communication

2. **Application Layer (Backend)**
   - Express routes for API endpoints
   - Controllers for request handling
   - Services for business logic and calculations
   - Query builder for dynamic report generation

3. **Data Layer**
   - Prisma ORM for database access
   - PostgreSQL for data persistence
   - Multi-tenant data isolation
   - Cross-workspace data aggregation

4. **Integration Layer**
   - Ordering workspace integration (sales data)
   - Inventory workspace integration (stock data)
   - Accounting workspace integration (financial data)
   - Real-time data synchronization

### Workspace Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│              Business Intelligence Workspace                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Data Aggregation Layer                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│        ┌───────────────────┼───────────────────┐            │
│        │                   │                   │            │
│        ▼                   ▼                   ▼            │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │ Ordering │      │Inventory │      │Accounting│         │
│  │ Workspace│      │Workspace │      │Workspace │         │
│  └──────────┘      └──────────┘      └──────────┘         │
│        │                   │                   │            │
│        └───────────────────┼───────────────────┘            │
│                            │                                 │
│        ┌───────────────────┼───────────────────┐            │
│        │                   │                   │            │
│        ▼                   ▼                   ▼            │
│  • Sales Data      • Stock Levels      • Journal Entries   │
│  • Order Items     • Inventory Value  • Financial Stats   │
│  • Revenue         • Transactions     • COGS Data         │
│  • Customers       • Suppliers        • Tax Data          │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: useState, useEffect, useCallback for state management
- **Chart Libraries**: Custom chart components (Bar, Line, Scatter, Donut, Matrix)
- **React Hot Toast**: User notifications

### Backend

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe backend development
- **Prisma ORM**: Database access layer
- **PostgreSQL**: Primary database
- **JWT Authentication**: Secure API access
- **Express-validator**: Input validation

### Database

- **PostgreSQL**: Relational database
- **Prisma Schema**: Type-safe database models
- **Multi-tenant Isolation**: Tenant-based data segregation
- **Indexes**: Optimized queries for analytics

### Data Processing

- **Real-time Calculations**: KPI computation on-demand
- **Aggregation Queries**: Complex SQL aggregations
- **Time-series Analysis**: Trend detection and forecasting
- **Statistical Functions**: ABC classification, profit margins, growth rates

---

## Data Flow

### 1. Dashboard Data Flow

```
User Request → Frontend (Dashboard Page)
    ↓
BI Service (Frontend) → API Call
    ↓
Backend Route (/api/bi/dashboard)
    ↓
BI Controller → BI Service
    ↓
Data Aggregation:
  ├─ Ordering Data (Revenue, Orders)
  ├─ Inventory Data (Stock, Transactions)
  └─ Accounting Data (Profit, COGS)
    ↓
KPI Calculations:
  ├─ Total Revenue
  ├─ Net Profit
  ├─ Profit Margin
  ├─ Inventory Turnover
  ├─ Average Order Value
  └─ Stockout Rate
    ↓
Chart Data Generation
    ↓
JSON Response → Frontend
    ↓
React State Update → UI Rendering
```

### 2. ABC Analysis Data Flow

```
User Request → Frontend (ABC Analysis Page)
    ↓
BI Service → API Call (/api/bi/analytics/abc-analysis)
    ↓
Backend Route → BI Controller
    ↓
BI Service.performABCAnalysis():
  1. Fetch order items with sales data
  2. Calculate total sales per product
  3. Sort by sales value (descending)
  4. Calculate cumulative percentages
  5. Classify into A (80%), B (15%), C (5%)
    ↓
Response with ABC categories
    ↓
Frontend → Display charts and tables
```

### 3. Profit Analysis Data Flow

```
User Request → Frontend (Profit Analysis Page)
    ↓
BI Service → API Call (/api/bi/analytics/profit-analysis)
    ↓
Backend Route → BI Controller
    ↓
BI Service.performProfitAnalysis():
  1. Fetch order items with revenue
  2. Fetch recipe costs (COGS)
  3. Calculate profit per item
  4. Calculate profit margins
  5. Group by item or category
    ↓
Response with profit breakdown
    ↓
Frontend → Transform to chart data
    ↓
Display visualizations (Bar, Scatter, Donut, Matrix)
```

### 4. Custom Report Execution Flow

```
User Creates Report → Frontend (Custom Reports Page)
    ↓
Report Configuration:
  ├─ Selected Fields
  ├─ Filters
  ├─ Sorting
  └─ Data Sources
    ↓
API Call → POST /api/bi/reports
    ↓
Backend → Save Report Configuration
    ↓
User Executes Report → POST /api/bi/reports/:id/execute
    ↓
Report Service:
  1. Parse report configuration
  2. Build SQL query (QueryBuilder)
  3. Execute query with filters
  4. Format results
    ↓
Response with data
    ↓
Frontend → Display in table/chart
    ↓
Export Options (PDF, Excel, CSV, JSON)
```

### 5. Real-Time KPI Update Flow

```
Period Change → Frontend
    ↓
API Call → GET /api/bi/kpis?period=30d
    ↓
Backend → BI Service
    ↓
Parallel KPI Calculations:
  ├─ calculateTotalRevenue()
  ├─ calculateNetProfit()
  ├─ calculateProfitMargin()
  ├─ calculateInventoryTurnover()
  ├─ calculateAverageOrderValue()
  └─ calculateStockoutRate()
    ↓
Compare with Previous Period
    ↓
Calculate Trends (UP/DOWN/STABLE)
    ↓
Response with KPI data
    ↓
Frontend → Update KPI cards
```

---

## Integration Architecture

### Cross-Workspace Data Integration

The BI workspace integrates with three main workspaces:

#### 1. Ordering & Sales System Integration

**Data Sources:**
- `Order` table: Order information, totals, payment status
- `OrderItem` table: Individual items, quantities, prices
- `OrderPayment` table: Payment transactions
- `MenuItem` table: Menu item details and pricing

**Analytics Provided:**
- Sales revenue by period
- Top-selling items
- Average order value
- Order volume trends
- Customer analytics
- Payment method distribution

**Integration Points:**
- Revenue calculation from completed orders
- COGS calculation from recipe ingredients
- Profit calculation (Revenue - COGS)
- Sales volume for ABC analysis

#### 2. Inventory Management Integration

**Data Sources:**
- `Item` table: Product information
- `InventoryEntry` table: Stock transactions (IN/OUT)
- `InventorySettings` table: Stock thresholds
- `Supplier` table: Supplier information

**Analytics Provided:**
- Inventory valuation
- Stock turnover rate
- Low stock alerts
- Stock movement trends
- Category-wise consumption
- Supplier performance

**Integration Points:**
- Stock levels for availability analysis
- Inventory value calculations
- Stock movement patterns
- Category distribution

#### 3. Accounting System Integration

**Data Sources:**
- `JournalEntry` table: Accounting entries
- `JournalEntryLine` table: Entry line items
- `ChartOfAccount` table: Account structure
- `FinancialStatement` table: Cached statements

**Analytics Provided:**
- Financial KPIs (Revenue, Profit, Margin)
- Cost analysis
- Financial ratios
- Budget vs. actual comparisons

**Integration Points:**
- Journal entries for revenue recognition
- COGS from accounting entries
- Financial statement data
- Account balances

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Next Part:** [Part 2: Database Schema and Data Models](BI_SYSTEM_COMPREHENSIVE_DOCUMENTATION_PART2.md)

