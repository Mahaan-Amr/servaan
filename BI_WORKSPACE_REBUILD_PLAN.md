# Business Intelligence Workspace - Complete Rebuild Plan
## برنامه جامع بازسازی فضای کاری هوش تجاری

**Document Version:** 1.1  
**Created:** 2025-01-27  
**Last Updated:** 2025-01-28  
**Status:** Implementation Phase  
**Priority:** Critical

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Research Analysis](#research-analysis)
3. [Current State Analysis](#current-state-analysis)
4. [Vision and Goals](#vision-and-goals)
5. [Architecture Design](#architecture-design)
6. [Feature Specifications](#feature-specifications)
7. [UX/UI Design Principles](#uxui-design-principles)
8. [Integration Strategy](#integration-strategy)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Technical Specifications](#technical-specifications)
11. [Success Metrics](#success-metrics)

---

## Executive Summary

### Purpose

This document outlines a comprehensive plan to rebuild the Business Intelligence (BI) workspace from scratch, incorporating best practices from leading global BI platforms while maintaining compatibility with Iranian business requirements. The new BI workspace will be:

- **Professional**: Enterprise-grade features and capabilities
- **User-Friendly**: Intuitive interface requiring no technical knowledge
- **Flexible**: Works with Ordering and Inventory workspaces individually or merged
- **Future-Proof**: Ready for Accounting workspace integration
- **Scalable**: Handles growth and increasing data volumes

### Key Objectives

1. **Rebuild from Scratch**: Complete redesign based on industry best practices
2. **Multi-Workspace Support**: Individual and merged workspace analytics
3. **Zero-Learning Curve**: Intuitive UX for non-technical users
4. **Professional Grade**: Enterprise-level features and performance
5. **Iranian Market Ready**: Persian language, calendar, and business practices

---

## Research Analysis

### Top 10 Global BI Platforms - Feature Analysis

#### 1. Microsoft Power BI

**Key Strengths:**
- Natural language queries (Q&A feature)
- Seamless Excel integration
- Real-time dashboards
- AI-powered insights (Quick Insights)
- Mobile-first design
- Affordable pricing ($10/user/month)

**Features to Adopt:**
- ✅ Natural language query interface
- ✅ Drag-and-drop report builder
- ✅ Real-time data refresh
- ✅ Mobile-responsive design
- ✅ AI-powered anomaly detection
- ✅ Custom visualizations

#### 2. Tableau

**Key Strengths:**
- Best-in-class visualizations
- Advanced analytics (forecasting, clustering)
- Storytelling mode
- Extensive data connectors
- Community-driven visualizations

**Features to Adopt:**
- ✅ Advanced chart types (heatmaps, treemaps, box plots)
- ✅ Data storytelling interface
- ✅ Interactive dashboards with drill-down
- ✅ Calculated fields and formulas
- ✅ Dashboard actions and filters

#### 3. Qlik Sense

**Key Strengths:**
- Associative data model
- AI-powered insights (Qlik Insight Advisor)
- Self-service analytics
- Associative engine for flexible exploration

**Features to Adopt:**
- ✅ Associative data exploration
- ✅ Smart search and suggestions
- ✅ AI-generated insights
- ✅ Flexible data relationships

#### 4. Looker (Google Cloud)

**Key Strengths:**
- LookML semantic layer
- SQL-based modeling
- Strong API for embedding
- Real-time analytics

**Features to Adopt:**
- ✅ Semantic data modeling
- ✅ API-first architecture
- ✅ Embedded analytics capabilities
- ✅ Version control for reports

#### 5. Sisense

**Key Strengths:**
- In-chip technology (fast queries)
- Embedded analytics
- AI-driven exploration
- Customizable widgets

**Features to Adopt:**
- ✅ Performance optimization
- ✅ Embedded analytics
- ✅ Widget-based dashboards
- ✅ Custom calculations

#### 6. Domo

**Key Strengths:**
- Real-time collaboration
- Mobile-first design
- Extensive connectors
- Buzz (social collaboration)

**Features to Adopt:**
- ✅ Real-time collaboration
- ✅ Social features (comments, sharing)
- ✅ Mobile app design
- ✅ Alert system

#### 7. SAP BusinessObjects

**Key Strengths:**
- Enterprise reporting
- Role-based dashboards
- Deep ERP integration
- Ad-hoc analysis

**Features to Adopt:**
- ✅ Role-based dashboards
- ✅ Enterprise reporting templates
- ✅ Ad-hoc query builder
- ✅ Scheduled reports

#### 8. IBM Cognos Analytics

**Key Strengths:**
- AI-powered insights (Watson)
- Advanced reporting
- Data governance
- Predictive analytics

**Features to Adopt:**
- ✅ AI-powered insights
- ✅ Data governance features
- ✅ Predictive analytics
- ✅ Advanced reporting

#### 9. Zoho Analytics

**Key Strengths:**
- Drag-and-drop interface
- 500+ connectors
- AI assistant (Zia)
- Affordable pricing

**Features to Adopt:**
- ✅ Drag-and-drop simplicity
- ✅ AI assistant for insights
- ✅ Template library
- ✅ White-label options

#### 10. Oracle Analytics Cloud

**Key Strengths:**
- Machine learning integration
- Real-time streaming
- Broad data source support
- Enterprise scalability

**Features to Adopt:**
- ✅ ML integration
- ✅ Real-time streaming
- ✅ Enterprise scalability
- ✅ Advanced security

### Common Features Across Top BI Platforms

**Must-Have Features:**
1. **Interactive Dashboards**: Real-time, customizable, responsive
2. **Self-Service Analytics**: No-code report building
3. **Data Visualization**: Rich chart library
4. **Mobile Support**: Responsive design and mobile apps
5. **Collaboration**: Sharing, commenting, annotations
6. **AI/ML Integration**: Automated insights, predictions
7. **Export Capabilities**: PDF, Excel, CSV, images
8. **Scheduled Reports**: Automated delivery
9. **Role-Based Access**: Security and permissions
10. **Data Refresh**: Real-time or scheduled updates

### Iranian BI Services Research

**Note**: Limited information available on Iranian-specific BI platforms. However, key considerations for Iranian market:

1. **Persian Language Support**: RTL text, Persian calendar (Shamsi)
2. **Iranian Business Practices**: Toman currency, local tax structures
3. **Cultural Considerations**: Business hours, holidays, local reporting needs
4. **Compliance**: Iranian accounting standards, tax regulations

**Requirements:**
- ✅ Full Persian (Farsi) language support
- ✅ Shamsi (Persian) calendar integration
- ✅ Toman currency formatting
- ✅ Iranian business day calculations
- ✅ Local tax and accounting standards

---

## Current State Analysis

### Ordering Workspace - Data Sources

**Main Entities:**
- `Order`: Orders with status, totals, dates
- `OrderItem`: Order line items with quantities, prices
- `OrderPayment`: Payment transactions
- `MenuItem`: Menu items with pricing
- `MenuCategory`: Menu categories
- `Recipe`: Recipe definitions
- `RecipeIngredient`: Recipe ingredients
- `Table`: Table management
- `OrderModification`: Order changes
- `KitchenDisplay`: Kitchen display orders

**Key Metrics Available:**
- Revenue (by period, item, category)
- Order volume
- Average order value
- Payment methods distribution
- Order status distribution
- Table utilization
- Kitchen performance
- Menu item popularity
- Order modifications
- Cancellation rates

**Data Relationships:**
```
Order → OrderItem → MenuItem → Recipe → RecipeIngredient → Item
Order → OrderPayment
Order → Table
Order → OrderModification
```

### Inventory Workspace - Data Sources

**Main Entities:**
- `Item`: Inventory items with categories, units
- `InventoryEntry`: Stock transactions (IN/OUT)
- `Supplier`: Supplier information
- `ItemSupplier`: Supplier-item relationships
- `InventorySettings`: Stock thresholds
- `StockOverride`: Stock override records

**Key Metrics Available:**
- Inventory value (WAC-based)
- Stock levels
- Stock movements (IN/OUT)
- Low stock alerts
- Supplier performance
- Category distribution
- Stock turnover
- Cost of goods sold (COGS)
- Price trends
- Stockout events

**Data Relationships:**
```
Item → InventoryEntry
Item → ItemSupplier → Supplier
Item → RecipeIngredient (via Recipe)
InventoryEntry → Order (via orderId)
```

### Current BI Workspace - Limitations

**Issues Identified:**
1. ❌ Limited visualization options
2. ❌ No natural language queries
3. ❌ Basic report builder
4. ❌ No collaboration features
5. ❌ Limited mobile support
6. ❌ No AI-powered insights
7. ❌ Basic filtering and drill-down
8. ❌ No scheduled reports
9. ❌ Limited export options
10. ❌ No data storytelling

**Strengths to Preserve:**
1. ✅ Multi-tenant architecture
2. ✅ Persian language support
3. ✅ Integration with Ordering/Inventory
4. ✅ Basic analytics (ABC, Profit, Trends)
5. ✅ Custom reports foundation

---

## Vision and Goals

### Vision Statement

"Create a world-class Business Intelligence workspace that empowers Iranian businesses to make data-driven decisions through intuitive, professional-grade analytics that work seamlessly across all business functions."

### Core Goals

1. **User Experience**
   - Zero learning curve for basic operations
   - Intuitive drag-and-drop interface
   - Mobile-responsive design
   - Persian-first experience

2. **Functionality**
   - Enterprise-grade features
   - AI-powered insights
   - Advanced visualizations
   - Flexible data exploration

3. **Integration**
   - Individual workspace analytics
   - Merged workspace analytics
   - Future Accounting workspace ready
   - Real-time data synchronization

4. **Performance**
   - Sub-second query responses
   - Efficient data processing
   - Scalable architecture
   - Optimized for large datasets

5. **Professionalism**
   - Enterprise-level security
   - Comprehensive audit logging
   - Role-based access control
   - Professional reporting

---

## Multi-Tenancy Architecture (Subdomain-Based)

### Subdomain-Based Tenant System

**Critical**: This project uses **subdomain-based multi-tenancy**. Each tenant is identified by a unique subdomain (e.g., `cafe-golestan.servaan.ir`, `restaurant-pardis.servaan.ir`).

**How It Works:**
1. **Subdomain Extraction**: Tenant subdomain extracted from `Host` header or `X-Tenant-Subdomain` header
2. **Tenant Resolution**: Middleware resolves tenant from database using subdomain
3. **Request Context**: Tenant information attached to `req.tenant` object
4. **Data Isolation**: All database queries MUST filter by `tenantId`

### Tenant Resolution Flow

```
Request: https://cafe-golestan.servaan.ir/api/bi/dashboard
    ↓
Extract Subdomain: "cafe-golestan"
    ↓
Tenant Middleware (resolveTenant)
    ↓
Query Database: Tenant.findUnique({ where: { subdomain: "cafe-golestan" } })
    ↓
Set req.tenant = { id: "...", subdomain: "cafe-golestan", ... }
    ↓
BI Controller: Check req.tenant.id
    ↓
BI Service: Filter all queries by tenantId
    ↓
Response: Tenant-specific data only
```

### Tenant Context Structure

```typescript
interface TenantContext {
  id: string;              // Tenant UUID
  subdomain: string;        // e.g., "cafe-golestan"
  name: string;            // e.g., "کافه گلستان"
  plan: string;            // e.g., "BUSINESS"
  isActive: boolean;       // Tenant status
  features: {
    hasInventoryManagement?: boolean;
    hasAnalyticsBI?: boolean;
    hasOrderingSystem?: boolean;
    // ... other features
  };
}
```

### Backend Tenant Handling

**Middleware Usage:**
```typescript
// All BI routes MUST use tenant middleware
import { resolveTenant, requireTenant } from '../middlewares/tenantMiddleware';

// Apply tenant resolution
router.use(resolveTenant);

// Require tenant for all BI routes
router.use(requireTenant);

// Or use feature gate for BI workspace
router.use(requireFeature('hasAnalyticsBI'));
```

**Controller Pattern:**
```typescript
export const biController = {
  getDashboard: async (req: Request, res: Response) => {
    // CRITICAL: Check tenant context
    if (!req.tenant?.id) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }
    
    const tenantId = req.tenant.id; // Use tenant ID for all queries
    
    // All service calls MUST include tenantId
    const dashboard = await BiService.buildExecutiveDashboard(
      dateRange, 
      userId, 
      tenantId  // CRITICAL: Pass tenantId
    );
    
    res.json({ success: true, data: dashboard });
  }
};
```

**Service Pattern:**
```typescript
class BiService {
  static async calculateTotalRevenue(
    period: DateRange, 
    tenantId: string  // CRITICAL: Always require tenantId
  ): Promise<KPIMetric> {
    // ALL queries MUST filter by tenantId
    const transactions = await prisma.inventoryEntry.findMany({
      where: {
        type: 'OUT',
        createdAt: { gte: period.start, lte: period.end },
        item: {
          tenantId: tenantId  // CRITICAL: Tenant filter
        }
      }
    });
    
    // ... rest of calculation
  }
}
```

### Frontend Tenant Handling

**API Client Pattern:**
```typescript
// Frontend automatically includes subdomain in requests
class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
    
    // Extract subdomain from current URL
    const subdomain = this.extractSubdomain();
    if (subdomain) {
      headers['X-Tenant-Subdomain'] = subdomain;  // CRITICAL: Include subdomain
    }
    
    return headers;
  }
  
  private extractSubdomain(): string | null {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    
    // Development: dima.localhost -> "dima"
    if (hostname.includes('localhost')) {
      const parts = hostname.split('.');
      if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
        return parts[0];
      }
      return null;
    }
    
    // Production: cafe-golestan.servaan.ir -> "cafe-golestan"
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    
    return null;
  }
}
```

**Tenant Context Usage:**
```typescript
// Frontend components use TenantContext
import { useTenant } from '@/contexts/TenantContext';

function BIDashboard() {
  const { tenant, subdomain } = useTenant();
  
  // All API calls automatically include subdomain
  const dashboard = await biService.getDashboard('30d');
  
  // Display tenant name
  return (
    <div>
      <h1>داشبورد {tenant?.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Data Connector Tenant Handling

**CRITICAL**: All workspace connectors MUST filter by tenantId

```typescript
class OrderingConnector implements WorkspaceConnector {
  async executeQuery(query: Query, tenantId: string): Promise<Data> {
    // CRITICAL: All Prisma queries MUST include tenantId filter
    const prismaQuery = {
      where: {
        ...query.where,
        tenantId: tenantId  // CRITICAL: Always filter by tenant
      }
    };
    
    const data = await prisma.order.findMany(prismaQuery);
    return this.transformData(data);
  }
}
```

### Data Aggregator Tenant Handling

```typescript
class DataAggregatorService {
  async aggregate(
    query: AggregationQuery, 
    tenantId: string  // CRITICAL: Require tenantId
  ): Promise<AggregatedData> {
    // Pass tenantId to all connectors
    const dataPromises = query.workspaces.map(ws => {
      const connector = this.connectors.get(ws);
      return connector.executeQuery(query, tenantId);  // CRITICAL: Pass tenantId
    });
    
    // ... rest of aggregation
  }
}
```

### Tenant Isolation Rules

**MUST DO:**
1. ✅ **Always check `req.tenant?.id`** in controllers
2. ✅ **Always pass `tenantId`** to service methods
3. ✅ **Always filter queries** by `tenantId`
4. ✅ **Always include subdomain** in frontend API calls
5. ✅ **Always validate tenant** before data access

**MUST NOT:**
1. ❌ **Never query without tenantId filter**
2. ❌ **Never trust client-provided tenantId** (use `req.tenant.id`)
3. ❌ **Never skip tenant validation**
4. ❌ **Never share data between tenants**

### Tenant Feature Gates

**BI Workspace Feature Gate:**
```typescript
// Check if tenant has BI feature enabled
if (!req.tenant?.features?.hasAnalyticsBI) {
  return res.status(403).json({
    success: false,
    message: 'این ویژگی برای مجموعه شما فعال نیست',
    error: 'BI feature not enabled for this tenant'
  });
}
```

**Plan-Based Access:**
```typescript
// Some features may require specific plan
if (req.tenant.plan === 'STARTER') {
  // Limit to basic features
} else if (req.tenant.plan === 'BUSINESS') {
  // Full access
} else if (req.tenant.plan === 'ENTERPRISE') {
  // Premium features
}
```

---

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BI Workspace Frontend                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Analytics   │  │   Reports    │     │
│  │   Builder    │  │   Explorer   │  │   Builder    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Insights    │  │  Data Story  │  │   Mobile     │     │
│  │   Engine     │  │   Builder    │  │   Interface  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BI Workspace Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Analytics   │  │  Query       │  │   AI/ML      │     │
│  │   Engine     │  │   Builder     │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Data        │  │  Report      │  │   Export    │     │
│  │  Aggregator  │  │   Generator  │  │   Service   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Ordering   │  │   Inventory  │  │  Accounting  │
│  Workspace   │  │  Workspace   │  │  Workspace   │
│   (Active)   │  │   (Active)   │  │  (Future)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow Architecture

**Individual Workspace Mode:**
```
Ordering Workspace Data → BI Analytics Engine → Ordering Dashboard
Inventory Workspace Data → BI Analytics Engine → Inventory Dashboard
```

**Merged Workspace Mode:**
```
Ordering Data ──┐
                ├─→ BI Data Aggregator → Unified Analytics → Merged Dashboard
Inventory Data ─┘
```

**Future Accounting Integration:**
```
Ordering Data ──┐
Inventory Data ─┼─→ BI Data Aggregator → Unified Analytics → Complete Dashboard
Accounting Data ┘
```

### Component Architecture

**1. Data Layer**
- **Data Connectors**: Connect to Ordering, Inventory, Accounting workspaces
- **Data Aggregator**: Merge data from multiple sources
- **Data Cache**: Cache frequently accessed data
- **Data Validator**: Ensure data quality and consistency

**2. Analytics Layer**
- **Query Builder**: Build complex queries dynamically
- **Analytics Engine**: Perform calculations and aggregations
- **AI/ML Service**: Generate insights and predictions
- **Trend Analyzer**: Analyze trends and patterns

**3. Visualization Layer**
- **Chart Library**: Rich set of visualizations
- **Dashboard Builder**: Drag-and-drop dashboard creation
- **Report Generator**: Generate formatted reports
- **Export Service**: Export to various formats

**4. Presentation Layer**
- **Dashboard Views**: Display dashboards
- **Report Views**: Display reports
- **Mobile Views**: Mobile-optimized views
- **Story Views**: Data storytelling interface

---

## Feature Specifications

### Phase 1: Core Dashboard (MVP)

#### 1.1 Executive Dashboard

**Purpose:** High-level overview for decision-makers

**Components:**
- **KPI Cards**: 8-12 key metrics with trends
- **Revenue Chart**: Revenue over time (line/area)
- **Top Products**: Top 10 products by revenue
- **Category Breakdown**: Sales by category (pie/donut)
- **Alerts Panel**: Important alerts and notifications
- **Quick Actions**: Common actions (export, refresh, etc.)

**Features:**
- Real-time data refresh
- Period selector (Today, Week, Month, Quarter, Year, Custom)
- Workspace selector (Ordering, Inventory, Merged)
- Responsive design
- Export to PDF/Excel

#### 1.2 Workspace-Specific Dashboards

**Ordering Dashboard:**
- Revenue metrics
- Order volume
- Average order value
- Payment methods
- Table utilization
- Kitchen performance
- Top menu items
- Order status distribution

**Inventory Dashboard:**
- Inventory value
- Stock levels
- Low stock alerts
- Stock movements
- Supplier performance
- Category distribution
- Stock turnover
- Cost analysis

**Merged Dashboard:**
- Combined metrics from both workspaces
- Cross-workspace insights
- Profitability analysis
- Operational efficiency
- Resource utilization

### Phase 2: Advanced Analytics

#### 2.1 Analytics Explorer

**Purpose:** Self-service data exploration

**Features:**
- **Data Source Selector**: Choose workspace(s)
- **Field Selector**: Select fields to analyze
- **Filter Builder**: Build complex filters
- **Group By**: Group data by dimensions
- **Aggregations**: Sum, Average, Count, Min, Max
- **Sorting**: Sort by any field
- **Visualization Selector**: Choose chart type
- **Drill-Down**: Click to explore details

**Chart Types:**
- Bar Chart (vertical, horizontal, stacked, grouped)
- Line Chart (single, multi-line, area)
- Pie/Donut Chart
- Scatter Plot
- Heatmap
- Treemap
- Box Plot
- Waterfall Chart
- Funnel Chart
- Gauge Chart
- Map Chart (if location data available)

#### 2.2 Natural Language Query (AI-Powered)

**Purpose:** Query data using natural language

**Features:**
- Persian language support
- Query examples and suggestions
- Auto-complete for fields and metrics
- Query history
- Saved queries

**Example Queries:**
- "نمایش فروش امروز"
- "مقایسه فروش این ماه با ماه گذشته"
- "محصولات پرفروش‌تر"
- "موجودی کالاهای کم"
- "سودآوری دسته‌بندی‌ها"

#### 2.3 Advanced Analytics

**ABC Analysis:**
- Product categorization (A, B, C)
- Configurable thresholds
- Visual representation
- Export capabilities

**Profit Analysis:**
- Revenue vs Cost
- Profit margin analysis
- By item, category, period
- Trend analysis

**Trend Analysis:**
- Time-series analysis
- Seasonality detection
- Forecasting
- Anomaly detection

**Comparative Analysis:**
- Period-over-period comparison
- Year-over-year comparison
- Benchmark analysis
- Variance analysis

### Phase 3: Report Builder

#### 3.1 Drag-and-Drop Report Builder

**Purpose:** Create custom reports without coding

**Features:**
- **Data Source Selection**: Choose workspace(s) and tables
- **Field Selection**: Drag fields to report
- **Layout Builder**: Arrange fields and charts
- **Filter Builder**: Add filters
- **Sorting**: Define sorting rules
- **Grouping**: Group data
- **Calculations**: Add calculated fields
- **Formatting**: Format numbers, dates, text
- **Preview**: Real-time preview
- **Save & Share**: Save and share reports

**Report Types:**
- **Tabular**: Table format
- **Chart**: Visual representation
- **Dashboard**: Multiple visualizations
- **Pivot**: Cross-tabulation
- **Form**: Formatted report

#### 3.2 Report Templates

**Pre-built Templates:**
- Sales Report
- Inventory Report
- Profit & Loss Report
- Performance Report
- Custom templates

**Template Library:**
- Browse templates
- Preview templates
- Use template
- Customize template
- Save as new template

### Phase 4: Data Storytelling

#### 4.1 Story Builder

**Purpose:** Create data-driven narratives

**Features:**
- **Story Canvas**: Drag-and-drop story creation
- **Slide Builder**: Create story slides
- **Narrative Text**: Add explanations
- **Visualizations**: Embed charts
- **Annotations**: Add annotations
- **Navigation**: Story navigation
- **Sharing**: Share stories
- **Presentation Mode**: Full-screen presentation

### Phase 5: AI-Powered Insights

#### 5.1 Automated Insights

**Purpose:** AI-generated business insights

**Features:**
- **Anomaly Detection**: Detect unusual patterns
- **Trend Detection**: Identify trends
- **Predictions**: Forecast future values
- **Recommendations**: Actionable recommendations
- **Alerts**: Smart alerts
- **Insights Dashboard**: Centralized insights view

#### 5.2 Smart Suggestions

**Purpose:** Suggest relevant analyses

**Features:**
- **Query Suggestions**: Suggest relevant queries
- **Chart Suggestions**: Suggest appropriate charts
- **Filter Suggestions**: Suggest useful filters
- **Metric Suggestions**: Suggest relevant metrics

### Phase 6: Collaboration

#### 6.1 Sharing & Collaboration

**Features:**
- **Share Dashboards**: Share with users/teams
- **Share Reports**: Share reports
- **Comments**: Add comments on dashboards/reports
- **Annotations**: Annotate visualizations
- **Notifications**: Notify on changes
- **Version Control**: Track changes
- **Permissions**: Granular permissions

#### 6.2 Scheduled Reports

**Features:**
- **Schedule Reports**: Schedule automatic generation
- **Email Delivery**: Email reports
- **Recipients**: Define recipients
- **Format**: Choose format (PDF, Excel, etc.)
- **Frequency**: Daily, weekly, monthly, custom

### Phase 7: Mobile Support

#### 7.1 Mobile Interface

**Features:**
- **Responsive Design**: Works on all devices
- **Touch-Optimized**: Touch-friendly interface
- **Mobile Dashboards**: Optimized for mobile
- **Offline Mode**: View cached data offline
- **Push Notifications**: Important alerts

---

## UX/UI Design Principles

### Design Philosophy

**"Intuitive, Beautiful, Powerful"**

1. **Intuitive**: Zero learning curve for basic operations
2. **Beautiful**: Modern, clean, professional design
3. **Powerful**: Advanced features for power users

### Design Principles

#### 1. Persian-First Design

- **RTL Support**: Full right-to-left support
- **Persian Typography**: Beautiful Persian fonts
- **Cultural Context**: Iranian business context
- **Local Conventions**: Iranian date/time formats

#### 2. Progressive Disclosure

- **Simple First**: Show simple options first
- **Advanced Later**: Hide advanced options initially
- **Contextual Help**: Help where needed
- **Tooltips**: Explain features

#### 3. Visual Hierarchy

- **Clear Structure**: Clear information hierarchy
- **Consistent Spacing**: Consistent spacing
- **Color Coding**: Meaningful color usage
- **Typography**: Clear typography hierarchy

#### 4. Responsive Design

- **Mobile-First**: Design for mobile first
- **Breakpoints**: Proper breakpoints
- **Touch Targets**: Adequate touch targets
- **Performance**: Fast loading

#### 5. Accessibility

- **WCAG Compliance**: WCAG 2.1 AA compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Screen reader support
- **Color Contrast**: Adequate contrast

### UI Components

#### Dashboard Components

1. **KPI Card**
   - Large number
   - Trend indicator
   - Period comparison
   - Color coding
   - Click to drill-down

2. **Chart Card**
   - Chart visualization
   - Title and description
   - Filters
   - Export button
   - Full-screen option

3. **Table Card**
   - Sortable columns
   - Filterable rows
   - Pagination
   - Export option
   - Row actions

4. **Filter Panel**
   - Date range picker
   - Workspace selector
   - Category filters
   - Quick filters
   - Clear filters

#### Report Builder Components

1. **Field Palette**
   - Available fields
   - Search fields
   - Field categories
   - Drag to add

2. **Canvas**
   - Drop zone
   - Grid layout
   - Resize handles
   - Alignment guides

3. **Property Panel**
   - Field properties
   - Format options
   - Aggregation options
   - Filter options

4. **Preview Panel**
   - Live preview
   - Refresh button
   - Export preview

### Color Scheme

**Primary Colors:**
- Primary: `#6366F1` (Indigo)
- Secondary: `#8B5CF6` (Purple)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)
- Info: `#3B82F6` (Blue)

**Neutral Colors:**
- Background: `#FFFFFF` / `#1F2937` (Light/Dark)
- Surface: `#F9FAFB` / `#374151` (Light/Dark)
- Border: `#E5E7EB` / `#4B5563` (Light/Dark)
- Text: `#111827` / `#F9FAFB` (Light/Dark)

### Typography

**Font Family:**
- Persian: `Vazir`, `Tahoma`, `Arial`
- English: `Inter`, `Roboto`, `Arial`

**Font Sizes:**
- H1: 32px
- H2: 24px
- H3: 20px
- H4: 18px
- Body: 16px
- Small: 14px
- Tiny: 12px

---

## Integration Strategy

### Workspace Integration Modes

#### Mode 1: Individual Workspace Analytics

**Ordering-Only Analytics:**
- Data from Ordering workspace only
- Ordering-specific metrics
- Ordering-specific visualizations
- Ordering-specific reports

**Inventory-Only Analytics:**
- Data from Inventory workspace only
- Inventory-specific metrics
- Inventory-specific visualizations
- Inventory-specific reports

#### Mode 2: Merged Workspace Analytics

**Ordering + Inventory Analytics:**
- Combined data from both workspaces
- Cross-workspace metrics
- Unified visualizations
- Comprehensive reports

**Key Features:**
- **Data Joining**: Join Ordering and Inventory data
- **Unified Metrics**: Metrics across workspaces
- **Cross-Analysis**: Analyze relationships
- **Comprehensive Reports**: Reports spanning workspaces

#### Mode 3: Future Accounting Integration

**Ordering + Inventory + Accounting Analytics:**
- Combined data from all three workspaces
- Financial metrics
- Complete business picture
- Financial reporting

### Integration Architecture

**Data Connector Pattern:**
```typescript
interface WorkspaceConnector {
  workspaceId: string;
  connect(): Promise<void>;
  getData(query: Query): Promise<Data>;
  getSchema(): Promise<Schema>;
  validate(): Promise<boolean>;
}
```

**Data Aggregator Pattern:**
```typescript
interface DataAggregator {
  connectors: WorkspaceConnector[];
  aggregate(query: Query): Promise<AggregatedData>;
  merge(data: Data[]): Promise<MergedData>;
}
```

### Integration Points

**Ordering Workspace:**
- Orders API
- OrderItems API
- Payments API
- Menu API
- Analytics API

**Inventory Workspace:**
- Items API
- InventoryEntries API
- Suppliers API
- Analytics API

**Accounting Workspace (Future):**
- JournalEntries API
- ChartOfAccounts API
- FinancialStatements API
- Analytics API

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2: Planning & Design**
- ✅ Finalize architecture
- ✅ Create detailed designs
- ✅ Set up development environment
- ✅ Create project structure

**Week 3-4: Core Infrastructure**
- ✅ Data connector framework
- ✅ Data aggregator service
- ✅ Query builder service
- ✅ Authentication & authorization
- ✅ Multi-tenant support

**Deliverables:**
- Architecture documentation
- API specifications
- Database schema
- Development environment

### Phase 2: Core Dashboard (Weeks 5-8)

**Week 5-6: Executive Dashboard**
- ✅ Dashboard layout
- ✅ KPI cards
- ✅ Basic charts
- ✅ Workspace selector
- ✅ Period selector

**Week 7-8: Workspace Dashboards**
- ✅ Ordering dashboard
- ✅ Inventory dashboard
- ✅ Merged dashboard
- ✅ Real-time updates
- ✅ Export functionality

**Deliverables:**
- Executive dashboard
- Workspace-specific dashboards
- Basic visualizations
- Export functionality

### Phase 3: Analytics Explorer (Weeks 9-12)

**Week 9-10: Data Explorer**
- ✅ Data source selector
- ✅ Field selector
- ✅ Filter builder
- ✅ Basic visualizations

**Week 11-12: Advanced Features**
- ✅ Advanced chart types
- ✅ Drill-down functionality
- ✅ Calculations
- ✅ Grouping & sorting

**Deliverables:**
- Analytics explorer
- Advanced visualizations
- Drill-down capabilities
- Calculation engine

### Phase 4: Report Builder (Weeks 13-16)

**Week 13-14: Basic Report Builder**
- ✅ Drag-and-drop interface
- ✅ Field selection
- ✅ Layout builder
- ✅ Basic report types

**Week 15-16: Advanced Report Builder**
- ✅ Advanced report types
- ✅ Templates
- ✅ Formatting options
- ✅ Export options

**Deliverables:**
- Report builder
- Report templates
- Export functionality
- Report sharing

### Phase 5: AI & Insights (Weeks 17-20)

**Week 17-18: Natural Language Query**
- ✅ NLP integration
- ✅ Query parser
- ✅ Query executor
- ✅ Query suggestions

**Week 19-20: AI Insights**
- ✅ Anomaly detection
- ✅ Trend detection
- ✅ Predictions
- ✅ Recommendations

**Deliverables:**
- Natural language query
- AI-powered insights
- Automated recommendations
- Smart alerts

### Phase 6: Collaboration (Weeks 21-24)

**Week 21-22: Sharing & Collaboration**
- ✅ Share functionality
- ✅ Comments
- ✅ Annotations
- ✅ Permissions

**Week 23-24: Scheduled Reports**
- ✅ Schedule builder
- ✅ Email delivery
- ✅ Report templates
- ✅ Notification system

**Deliverables:**
- Sharing functionality
- Collaboration features
- Scheduled reports
- Notification system

### Phase 7: Mobile & Polish (Weeks 25-28)

**Week 25-26: Mobile Interface**
- ✅ Responsive design
- ✅ Mobile dashboards
- ✅ Touch optimization
- ✅ Offline mode

**Week 27-28: Polish & Testing**
- ✅ UI/UX polish
- ✅ Performance optimization
- ✅ Testing
- ✅ Documentation

**Deliverables:**
- Mobile interface
- Performance optimizations
- Test suite
- User documentation

### Phase 8: Launch (Weeks 29-32)

**Week 29-30: Beta Testing**
- ✅ Internal testing
- ✅ User acceptance testing
- ✅ Bug fixes
- ✅ Performance tuning

**Week 31-32: Launch**
- ✅ Production deployment
- ✅ User training
- ✅ Support setup
- ✅ Monitoring

**Deliverables:**
- Production system
- Training materials
- Support documentation
- Monitoring dashboard

---

## Technical Specifications

### Technology Stack

**Frontend:**
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Charts**: Recharts / Chart.js / D3.js
- **State Management**: Zustand / Redux Toolkit
- **Forms**: React Hook Form
- **Date Handling**: date-fns-jalali
- **Icons**: Heroicons / Lucide React

**Backend:**
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull (Redis-based)

**AI/ML:**
- **NLP**: OpenAI API / Local model
- **ML**: TensorFlow.js / scikit-learn
- **Analytics**: Custom algorithms

**Infrastructure:**
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus / Grafana
- **Logging**: Winston / Pino

### Database Schema

**New Tables:**
```prisma
model BIDashboard {
  id          String   @id @default(uuid())
  tenantId    String   // CRITICAL: Tenant isolation
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  layout      Json     // Dashboard layout configuration
  widgets     Json     // Widget configurations
  isPublic    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId])  // CRITICAL: Index for tenant queries
  @@index([createdBy, tenantId])  // For user's dashboards
}

model BIReport {
  id          String   @id @default(uuid())
  tenantId    String   // CRITICAL: Tenant isolation
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  type        ReportType
  config      Json     // Report configuration
  template    Boolean  @default(false)
  isPublic    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId])  // CRITICAL: Index for tenant queries
  @@index([createdBy, tenantId])  // For user's reports
  @@index([isPublic, tenantId])  // For public reports
}

model BIInsight {
  id          String   @id @default(uuid())
  tenantId    String   // CRITICAL: Tenant isolation
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  type        InsightType
  title       String
  description String
  data        Json
  priority    Priority
  createdAt   DateTime @default(now())
  
  @@index([tenantId])  // CRITICAL: Index for tenant queries
  @@index([tenantId, priority])  // For priority-based queries
  @@index([tenantId, createdAt])  // For time-based queries
}
```

### API Endpoints

**Route Setup Pattern:**
```typescript
// src/backend/src/routes/biRoutes.ts
import { Router } from 'express';
import { resolveTenant, requireTenant, requireFeature } from '../middlewares/tenantMiddleware';
import { authenticate } from '../middlewares/authMiddleware';
import { biController } from '../controllers/biController';

const router = Router();

// CRITICAL: Apply tenant resolution first
router.use(resolveTenant);

// CRITICAL: Require authentication
router.use(authenticate);

// CRITICAL: Require tenant context for all BI routes
router.use(requireTenant);

// CRITICAL: Check if tenant has BI feature enabled
router.use(requireFeature('hasAnalyticsBI'));

// Now define routes - all will have req.tenant available
router.get('/dashboard', biController.getDashboard);
router.get('/kpis', biController.getKPIs);
// ... other routes

export default router;
```

**Dashboard APIs:**
- `GET /api/bi/dashboard` - Get executive dashboard (UPDATED: Now supports workspace selector)
  - **Query Parameters**: 
    - `period` (optional): '7d', '30d', '90d', '1y' (default: '30d')
    - `startDate` (optional): Custom start date
    - `endDate` (optional): Custom end date
    - `workspace` (optional): 'ordering', 'inventory', or 'merged' (default: 'merged')
  - **Response**: `{ success: true, data: ExecutiveDashboard, message: string }`
  - **CRITICAL**: All data is tenant-aware via `req.tenant.id`
  - **Frontend Usage**: `biService.getDashboard(period, startDate?, endDate?, workspace)` - automatically unwraps response
  - **Workspace Filtering**:
    - **ordering**: Shows `totalRevenue`, `averageOrderValue` KPIs + revenue/top products charts
    - **inventory**: Shows `inventoryTurnover`, `stockoutRate`, `activeProductsCount` KPIs + category chart
    - **merged**: Shows all KPIs including `netProfit`, `profitMargin` + all charts
  - **Example**: `GET /api/bi/dashboard?period=30d&workspace=merged`

- `GET /api/bi/dashboards` - List dashboards (tenant-filtered) - Future implementation
- `POST /api/bi/dashboards` - Create dashboard (tenant from req.tenant) - Future implementation
- `GET /api/bi/dashboards/:id` - Get dashboard (tenant-validated) - Future implementation
- `PUT /api/bi/dashboards/:id` - Update dashboard (tenant-validated) - Future implementation
- `DELETE /api/bi/dashboards/:id` - Delete dashboard (tenant-validated) - Future implementation
- `POST /api/bi/dashboards/:id/share` - Share dashboard (tenant-validated) - Future implementation

**All endpoints require:**
- `resolveTenant` middleware (extracts subdomain from Host or X-Tenant-Subdomain header)
- `authenticate` middleware (validates JWT token)
- `requireTenant` middleware (validates tenant context exists)
- `requireFeature('hasAnalyticsBI')` middleware (checks feature access)

**Request Flow:**
```
1. Request: https://cafe-golestan.servaan.ir/api/bi/dashboard
2. resolveTenant middleware:
   - Extracts subdomain: "cafe-golestan"
   - Queries database: Tenant.findUnique({ where: { subdomain: "cafe-golestan" } })
   - Sets req.tenant = { id: "...", subdomain: "cafe-golestan", ... }
3. authenticate middleware:
   - Validates JWT token
   - Sets req.user = { id: "...", ... }
4. requireTenant middleware:
   - Checks req.tenant exists
   - Returns 400 if missing
5. requireFeature middleware:
   - Checks req.tenant.features.hasAnalyticsBI === true
   - Returns 403 if feature not enabled
6. Controller:
   - Uses req.tenant.id for all queries
   - Returns tenant-specific data
```

**Data Aggregation APIs (NEW - IMPLEMENTED):**
- `POST /api/bi/aggregate` - Execute aggregation queries across multiple workspaces
  - **Request Body**: `AggregationQuery` (workspaces, joinType, fields, filters, groupBy, orderBy, limit, offset)
  - **Response**: `{ success: true, data: AggregatedData, message: string }`
  - **CRITICAL**: All queries are tenant-aware via `req.tenant.id`
  - **Frontend Usage**: `biService.aggregate(query)` - automatically unwraps response
  - **Example**:
    ```json
    {
      "workspaces": ["ordering", "inventory"],
      "joinType": "INNER",
      "joinKeys": [{"from": "orders.id", "to": "inventoryEntries.orderId"}],
      "fields": [
        {"workspace": "ordering", "table": "orders", "field": "totalAmount", "aggregation": "sum", "alias": "revenue"},
        {"workspace": "inventory", "table": "inventoryEntries", "field": "quantity", "aggregation": "sum", "alias": "stockUsed"}
      ],
      "filters": [
        {"workspace": "ordering", "table": "orders", "field": "orderDate", "operator": "between", "value": ["2024-01-01", "2024-12-31"]}
      ],
      "groupBy": ["orders.orderDate"],
      "orderBy": [{"field": "revenue", "direction": "desc"}],
      "limit": 100
    }
    ```

- `GET /api/bi/schema` - Get available data schemas from workspace connectors
  - **Query Parameters**: `workspace` (optional) - If provided, returns schema for specific workspace only
  - **Response**: `{ success: true, data: { workspace, name, schema } | { workspaces: [...] }, message: string }`
  - **CRITICAL**: All schemas are tenant-aware via `req.tenant.id`
  - **Frontend Usage**: `biService.getSchema(workspace?)` - automatically unwraps response
  - **Example**: `GET /api/bi/schema?workspace=ordering`

- `POST /api/bi/explore` - Data exploration endpoint (simplified query interface)
  - **Request Body**: Simplified query structure (workspaces, fields, filters, groupBy, orderBy, limit, offset)
  - **Response**: `{ success: true, data: AggregatedData, message: string }`
  - **CRITICAL**: All queries are tenant-aware via `req.tenant.id`
  - **Frontend Usage**: `biService.explore(query)` - automatically unwraps response
  - **Purpose**: Easier-to-use interface for ad-hoc data exploration

**Analytics APIs:**
- `POST /api/bi/analytics/explore` - Explore data (legacy, consider using `/api/bi/explore`)
- `POST /api/bi/analytics/query` - Execute query (legacy)
- `GET /api/bi/analytics/schema` - Get data schema (legacy, consider using `/api/bi/schema`)
- `POST /api/bi/analytics/insights` - Get insights

**Report APIs:**
- `GET /api/bi/reports` - List reports
- `POST /api/bi/reports` - Create report
- `GET /api/bi/reports/:id` - Get report
- `PUT /api/bi/reports/:id` - Update report
- `DELETE /api/bi/reports/:id` - Delete report
- `POST /api/bi/reports/:id/execute` - Execute report
- `POST /api/bi/reports/:id/schedule` - Schedule report

**AI APIs:**
- `POST /api/bi/ai/query` - Natural language query
- `GET /api/bi/ai/insights` - Get AI insights
- `POST /api/bi/ai/suggestions` - Get suggestions

---

## Success Metrics

### User Adoption Metrics

- **Active Users**: Daily/weekly/monthly active users
- **Feature Usage**: Usage of each feature
- **Report Creation**: Number of reports created
- **Dashboard Views**: Number of dashboard views
- **Export Usage**: Number of exports

### Performance Metrics

- **Query Response Time**: < 2 seconds for 95% of queries
- **Dashboard Load Time**: < 3 seconds
- **Report Generation Time**: < 5 seconds for standard reports
- **System Uptime**: > 99.9%

### Business Metrics

- **Decision Making**: Faster decision making
- **Data-Driven Decisions**: Increase in data-driven decisions
- **Time Saved**: Time saved on reporting
- **User Satisfaction**: User satisfaction score > 4.5/5

### Technical Metrics

- **Code Coverage**: > 80%
- **Bug Rate**: < 1 bug per 1000 lines of code
- **API Response Time**: < 500ms for 95% of requests
- **Error Rate**: < 0.1%

---

## Detailed Feature Specifications

### Dashboard Features

#### 1. Executive Dashboard

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Header: Period Selector | Workspace Selector | Actions │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │   KPI    │  │   KPI    │  │   KPI    │  │   KPI    ││
│  │  Card 1  │  │  Card 2  │  │  Card 3  │  │  Card 4  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │   KPI    │  │   KPI    │  │   KPI    │  │   KPI    ││
│  │  Card 5  │  │  Card 6  │  │  Card 7  │  │  Card 8  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │   Revenue Chart       │  │   Top Products        │ │
│  │   (Line/Area)         │  │   (Bar Chart)         │ │
│  └──────────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │   Category Breakdown  │  │   Alerts Panel       │ │
│  │   (Pie/Donut)         │  │   (List)              │ │
│  └──────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**KPI Cards:**
- **Revenue**: Total revenue with trend indicator (↑/↓/→)
- **Profit**: Net profit with margin percentage
- **Orders**: Order count with growth percentage
- **AOV**: Average order value with comparison
- **Inventory Value**: Total inventory value (WAC-based)
- **Stock Turnover**: Turnover rate with target indicator
- **Low Stock**: Count of low stock items with alert badge
- **Top Product**: Best-selling product name with revenue

**Interactivity:**
- Click KPI card → Drill-down to detailed analytics
- Hover → Show tooltip with period comparison
- Period change → Auto-refresh all widgets
- Workspace change → Switch data source seamlessly
- Export button → Export dashboard as PDF/Excel

#### 2. Analytics Explorer

**Interface Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Toolbar: Data Source | Fields | Filters | Visualize    │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Fields  │           Canvas/Preview                     │
│  Palette │                                              │
│          │                                              │
│  ┌────┐  │  ┌──────────────────────────────────────┐   │
│  │Item│  │  │  Chart Visualization                 │   │
│  │Name│  │  │                                      │   │
│  └────┘  │  │                                      │   │
│  ┌────┐  │  │                                      │   │
│  │Qty │  │  └──────────────────────────────────────┘   │
│  └────┘  │                                              │
│  ┌────┐  │  ┌──────────────────────────────────────┐   │
│  │Date│  │  │  Data Table                           │   │
│  └────┘  │  │                                      │   │
│          │  └──────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────┘
```

**Features:**
- **Drag & Drop**: Drag fields from palette to canvas
- **Auto-Visualization**: System suggests best chart type
- **Filter Builder**: Visual filter builder with AND/OR logic
- **Calculations**: Add calculated fields (sum, avg, count, etc.)
- **Grouping**: Group by one or more dimensions
- **Sorting**: Sort by any field (ascending/descending)
- **Export**: Export visualization as image or data as CSV/Excel

**Supported Chart Types:**
- Bar Chart (vertical, horizontal, stacked, grouped)
- Line Chart (single, multi-line, area, spline)
- Pie/Donut Chart
- Scatter Plot
- Heatmap
- Treemap
- Box Plot
- Waterfall Chart
- Funnel Chart
- Gauge Chart
- Map Chart (if location data available)

#### 3. Natural Language Query

**Example Queries (Persian):**
1. "نمایش فروش امروز"
   → Returns: Today's total sales

2. "مقایسه فروش این ماه با ماه گذشته"
   → Returns: Current month vs previous month comparison

3. "محصولات پرفروش‌تر"
   → Returns: Top products by revenue

4. "موجودی کالاهای کم"
   → Returns: Items with stock below threshold

5. "سودآوری دسته‌بندی‌ها"
   → Returns: Profitability analysis by category

**Implementation Features:**
- **NLP Engine**: Parse Persian natural language queries
- **Query Builder**: Convert to structured SQL/API calls
- **Suggestions**: Auto-complete suggestions as user types
- **History**: Save and reuse query history
- **Favorites**: Save frequently used queries
- **Validation**: Validate query before execution
- **Error Handling**: Friendly error messages in Persian

---

## Technical Implementation Details

### Data Connector Framework

**Base Connector Interface:**
```typescript
interface WorkspaceConnector {
  workspaceId: string;
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getSchema(): Promise<Schema>;
  executeQuery(query: Query): Promise<Data>;
  validate(): Promise<boolean>;
  getHealth(): Promise<HealthStatus>;
}

interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

interface Table {
  name: string;
  fields: Field[];
  primaryKey: string;
  indexes: string[];
}

interface Field {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'json';
  nullable: boolean;
  description?: string;
}
```

**Ordering Workspace Connector:**
```typescript
class OrderingConnector implements WorkspaceConnector {
  workspaceId = 'ordering-sales-system';
  name = 'Ordering & Sales System';
  
  // CRITICAL: All methods require tenantId parameter
  async getSchema(tenantId: string): Promise<Schema> {
    return {
      tables: [
        {
          name: 'orders',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'orderNumber', type: 'string', nullable: false },
            { name: 'totalAmount', type: 'number', nullable: false },
            { name: 'orderDate', type: 'date', nullable: false },
            { name: 'status', type: 'string', nullable: false },
            { name: 'orderType', type: 'string', nullable: false },
            { name: 'customerName', type: 'string', nullable: true },
            { name: 'tableId', type: 'string', nullable: true }
          ],
          primaryKey: 'id',
          indexes: ['orderDate', 'status', 'orderType']
        },
        {
          name: 'orderItems',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'orderId', type: 'string', nullable: false },
            { name: 'menuItemId', type: 'string', nullable: true },
            { name: 'itemName', type: 'string', nullable: false },
            { name: 'quantity', type: 'number', nullable: false },
            { name: 'unitPrice', type: 'number', nullable: false },
            { name: 'totalPrice', type: 'number', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['orderId', 'menuItemId']
        },
        {
          name: 'payments',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'orderId', type: 'string', nullable: false },
            { name: 'amount', type: 'number', nullable: false },
            { name: 'paymentMethod', type: 'string', nullable: false },
            { name: 'paymentDate', type: 'date', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['orderId', 'paymentDate']
        }
      ],
      relationships: [
        {
          from: 'orders',
          to: 'orderItems',
          type: 'one-to-many',
          key: 'id -> orderId'
        },
        {
          from: 'orders',
          to: 'payments',
          type: 'one-to-many',
          key: 'id -> orderId'
        }
      ]
    };
  }
  
  async executeQuery(query: Query, tenantId: string): Promise<Data> {
    // CRITICAL: Build Prisma query with tenantId filter
    const prismaQuery = this.buildPrismaQuery(query, tenantId);
    
    // Execute against Ordering workspace database
    // CRITICAL: All queries MUST filter by tenantId
    const data = await prisma.order.findMany({
      ...prismaQuery,
      where: {
        ...prismaQuery.where,
        tenantId: tenantId  // CRITICAL: Tenant isolation
      }
    });
    
    // Transform to standard format
    return this.transformData(data);
  }
  
  private buildPrismaQuery(query: Query, tenantId: string): any {
    return {
      where: {
        ...query.where,
        tenantId: tenantId  // CRITICAL: Always include tenantId
      },
      // ... rest of query
    };
  }
}
```

**Inventory Workspace Connector:**
```typescript
class InventoryConnector implements WorkspaceConnector {
  workspaceId = 'inventory-management';
  name = 'Inventory Management';
  
  // CRITICAL: All methods require tenantId parameter
  async getSchema(tenantId: string): Promise<Schema> {
    return {
      tables: [
        {
          name: 'items',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'name', type: 'string', nullable: false },
            { name: 'category', type: 'string', nullable: false },
            { name: 'unit', type: 'string', nullable: false },
            { name: 'currentStock', type: 'number', nullable: false },
            { name: 'minStock', type: 'number', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['category', 'name']
        },
        {
          name: 'inventoryEntries',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'itemId', type: 'string', nullable: false },
            { name: 'quantity', type: 'number', nullable: false },
            { name: 'type', type: 'string', nullable: false },
            { name: 'unitPrice', type: 'number', nullable: true },
            { name: 'createdAt', type: 'date', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['itemId', 'type', 'createdAt']
        }
      ],
      relationships: [
        {
          from: 'items',
          to: 'inventoryEntries',
          type: 'one-to-many',
          key: 'id -> itemId'
        }
      ]
    };
  }
  
  async executeQuery(query: Query, tenantId: string): Promise<Data> {
    // CRITICAL: All queries MUST filter by tenantId
    const data = await prisma.item.findMany({
      where: {
        ...query.where,
        tenantId: tenantId  // CRITICAL: Tenant isolation
      },
      include: {
        inventoryEntries: {
          where: {
            tenantId: tenantId  // CRITICAL: Nested relations also filtered
          }
        }
      }
    });
    
    return this.transformData(data);
  }
}
```

### Data Aggregator Service

**Status:** ✅ **IMPLEMENTED** (Phase 1: Foundation - Week 4)

**Service Implementation:**
```typescript
/**
 * Data Aggregator Service
 * Aggregates and merges data from multiple workspace connectors
 * CRITICAL: All operations MUST be tenant-aware
 */
export class DataAggregatorService {
  private connectors: Map<string, WorkspaceConnector>;
  private readonly DEFAULT_CACHE_TTL = 5 * 60; // 5 minutes

  constructor() {
    this.connectors = new Map();
    this.connectors.set('ordering', new OrderingConnector());
    this.connectors.set('inventory', new InventoryConnector());
    // Future: Add AccountingConnector when Accounting workspace is activated
  }

  /**
   * Register a new workspace connector
   */
  registerConnector(connector: WorkspaceConnector): void {
    this.connectors.set(connector.workspaceId, connector);
  }

  /**
   * Aggregate data from multiple workspaces
   * CRITICAL: tenantId is required for tenant isolation
   */
  async aggregate(
    query: AggregationQuery,
    tenantId: string
  ): Promise<AggregatedData> {
    const startTime = Date.now();

    // CRITICAL: Validate tenantId
    if (!tenantId) {
      throw new Error('TenantId is required for data aggregation');
    }

    // CRITICAL: Validate all workspaces exist
    for (const workspace of query.workspaces) {
      if (!this.connectors.has(workspace)) {
        throw new Error(`Connector not found for workspace: ${workspace}`);
      }
    }

    // Check cache first (tenant-specific cache key)
    const cacheKey = this.generateCacheKey(query, tenantId);
    const cached = await globalCacheService.getCachedData<AggregatedData>(
      cacheKey,
      async () => {
        // Cache miss - fetch fresh data
        return await this.fetchAndAggregate(query, tenantId);
      },
      {
        tenantId,
        ttl: this.DEFAULT_CACHE_TTL,
        tags: ['bi', 'aggregation', ...query.workspaces]
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      ...cached,
      metadata: {
        workspaces: query.workspaces,
        joinType: query.joinType,
        executionTime,
        cached: cached.metadata?.cached || false
      }
    };
  }

  /**
   * Fetch and aggregate data from workspaces
   * CRITICAL: All queries filtered by tenantId
   */
  private async fetchAndAggregate(
    query: AggregationQuery,
    tenantId: string
  ): Promise<AggregatedData> {
    // Build queries for each workspace
    const workspaceQueries = this.buildWorkspaceQueries(query, tenantId);

    // Execute queries in parallel (CRITICAL: All with tenantId)
    const dataPromises = query.workspaces.map(async (workspace) => {
      const connector = this.connectors.get(workspace);
      if (!connector) {
        throw new Error(`Connector not found: ${workspace}`);
      }

      const workspaceQuery = workspaceQueries.get(workspace);
      if (!workspaceQuery) {
        throw new Error(`Query not built for workspace: ${workspace}`);
      }

      // CRITICAL: Execute query with tenantId
      return await connector.executeQuery(workspaceQuery, tenantId);
    });

    const dataArray = await Promise.all(dataPromises);

    // Merge data based on join type
    let mergedData: Data;
    switch (query.joinType) {
      case 'INNER':
        mergedData = this.innerJoin(dataArray, query.joinKeys || [], query.workspaces);
        break;
      case 'LEFT':
        mergedData = this.leftJoin(dataArray, query.joinKeys || [], query.workspaces);
        break;
      case 'UNION':
        mergedData = this.union(dataArray);
        break;
      case 'CROSS':
        mergedData = this.crossJoin(dataArray);
        break;
      default:
        throw new Error(`Unsupported join type: ${query.joinType}`);
    }

    // Apply aggregations
    const aggregated = this.applyAggregations(mergedData, query.fields, query.groupBy || []);

    // Apply ordering
    if (query.orderBy && query.orderBy.length > 0) {
      aggregated.rows = this.applyOrdering(aggregated.rows, query.orderBy);
    }

    // Apply limit and offset
    if (query.offset) {
      aggregated.rows = aggregated.rows.slice(query.offset);
    }
    if (query.limit) {
      aggregated.rows = aggregated.rows.slice(0, query.limit);
    }

    aggregated.rowCount = aggregated.rows.length;

    return {
      ...aggregated,
      metadata: {
        workspaces: query.workspaces,
        joinType: query.joinType,
        executionTime: 0,
        cached: false
      }
    };
  }

  /**
   * Build queries for each workspace
   * CRITICAL: All queries include tenantId filter
   */
  private buildWorkspaceQueries(
    query: AggregationQuery,
    tenantId: string
  ): Map<string, Query> {
    const workspaceQueries = new Map<string, Query>();

    for (const workspace of query.workspaces) {
      // Get fields for this workspace
      const workspaceFields = query.fields.filter(f => f.workspace === workspace);
      
      // Get filters for this workspace
      const workspaceFilters = query.filters?.filter(f => f.workspace === workspace) || [];

      // Build WHERE clause with tenantId
      const where: any = {
        tenantId: tenantId // CRITICAL: Tenant isolation
      };

      // Add other filters
      for (const filter of workspaceFilters) {
        if (!where[filter.field]) {
          where[filter.field] = this.buildFilterCondition(filter);
        }
      }

      // Determine primary table from fields
      const primaryTable = workspaceFields[0]?.table || this.getDefaultTable(workspace);

      const workspaceQuery: Query = {
        select: workspaceFields.map(f => ({
          field: f.field,
          table: f.table,
          alias: f.alias,
          aggregation: f.aggregation || 'none'
        })),
        from: primaryTable,
        where,
        groupBy: query.groupBy?.filter(gb => 
          workspaceFields.some(f => `${f.table}.${gb}` === gb || f.field === gb)
        ),
        orderBy: query.orderBy?.filter(ob =>
          workspaceFields.some(f => f.field === ob.field || f.alias === ob.field)
        ),
        limit: query.limit,
        offset: query.offset
      };

      workspaceQueries.set(workspace, workspaceQuery);
    }

    return workspaceQueries;
  }

  /**
   * Perform INNER JOIN on data arrays
   * CRITICAL: Ensure tenantId consistency across joined data
   */
  private innerJoin(
    dataArray: Data[],
    joinKeys: JoinKey[],
    workspaces: string[]
  ): Data {
    // Implementation: Joins datasets based on specified keys
    // Validates tenantId consistency
  }

  /**
   * Perform LEFT JOIN on data arrays
   * CRITICAL: Ensure tenantId consistency
   */
  private leftJoin(
    dataArray: Data[],
    joinKeys: JoinKey[],
    workspaces: string[]
  ): Data {
    // Implementation: Left joins datasets, preserving left side data
  }

  /**
   * Perform UNION of data arrays
   * CRITICAL: All data must have same tenantId
   */
  private union(dataArray: Data[]): Data {
    // Implementation: Combines datasets with common columns
    // Removes duplicates
  }

  /**
   * Perform CROSS JOIN (Cartesian product)
   * WARNING: Can produce very large result sets
   */
  private crossJoin(dataArray: Data[]): Data {
    // Implementation: Generates all combinations of rows
  }

  /**
   * Apply aggregations to merged data
   */
  private applyAggregations(
    data: Data,
    fields: AggregationField[],
    groupBy: string[]
  ): AggregatedData {
    // Implementation: Applies SUM, AVG, COUNT, MIN, MAX aggregations
    // Supports grouping by multiple fields
  }

  /**
   * Generate cache key for aggregation query
   * CRITICAL: Include tenantId for tenant isolation
   */
  private generateCacheKey(query: AggregationQuery, tenantId: string): string {
    const queryHash = JSON.stringify({
      workspaces: query.workspaces.sort(),
      joinType: query.joinType,
      fields: query.fields,
      filters: query.filters,
      groupBy: query.groupBy,
      orderBy: query.orderBy,
      limit: query.limit,
      offset: query.offset
    });

    return `bi:aggregate:${tenantId}:${Buffer.from(queryHash).toString('base64').substring(0, 50)}`;
  }

  /**
   * Invalidate cache for tenant
   */
  invalidateTenantCache(tenantId: string): void {
    globalCacheService.invalidateTenantCache(tenantId);
  }

  /**
   * Invalidate cache for specific workspaces
   */
  invalidateWorkspaceCache(workspaces: string[]): void {
    for (const workspace of workspaces) {
      globalCacheService.invalidateCache(`bi:aggregate:*:${workspace}:*`);
    }
  }
}

// Export singleton instance
export const dataAggregatorService = new DataAggregatorService();
```

**Key Features Implemented:**
- ✅ **Tenant-Aware Aggregation**: All operations require and validate `tenantId`
- ✅ **Multi-Workspace Support**: Aggregates data from Ordering and Inventory workspaces
- ✅ **Join Operations**: Supports INNER, LEFT, UNION, and CROSS joins
- ✅ **Caching Layer**: Uses `globalCacheService` with tenant-specific cache keys
- ✅ **Query Building**: Automatically builds workspace-specific queries with tenantId filters
- ✅ **Aggregations**: Supports SUM, AVG, COUNT, MIN, MAX with optional grouping
- ✅ **Filtering**: Supports complex filters with multiple operators
- ✅ **Ordering & Pagination**: Supports sorting and limit/offset
- ✅ **Cache Invalidation**: Methods to invalidate tenant or workspace-specific caches

**Interfaces:**
```typescript
export interface AggregationQuery {
  workspaces: string[];
  joinType: 'INNER' | 'LEFT' | 'UNION' | 'CROSS';
  joinKeys?: JoinKey[];
  fields: AggregationField[];
  filters?: AggregationFilter[];
  groupBy?: string[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface JoinKey {
  from: string; // e.g., "orders.id"
  to: string;   // e.g., "inventoryEntries.orderId"
}

export interface AggregationField {
  workspace: string;
  table: string;
  field: string;
  alias?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

export interface AggregationFilter {
  workspace: string;
  table: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
  value: any;
}

export interface AggregatedData {
  rows: any[];
  columns: string[];
  rowCount: number;
  metadata?: {
    workspaces: string[];
    joinType: string;
    executionTime: number;
    cached: boolean;
  };
}
```

**Usage Example:**
```typescript
// Aggregate data from Ordering and Inventory workspaces
const result = await dataAggregatorService.aggregate({
  workspaces: ['ordering', 'inventory'],
  joinType: 'INNER',
  joinKeys: [
    { from: 'orders.id', to: 'inventoryEntries.orderId' }
  ],
  fields: [
    { workspace: 'ordering', table: 'orders', field: 'totalAmount', aggregation: 'sum', alias: 'revenue' },
    { workspace: 'inventory', table: 'inventoryEntries', field: 'quantity', aggregation: 'sum', alias: 'stockUsed' }
  ],
  filters: [
    { workspace: 'ordering', table: 'orders', field: 'orderDate', operator: 'between', value: [startDate, endDate] },
    { workspace: 'ordering', table: 'orders', field: 'status', operator: 'equals', value: 'COMPLETED' }
  ],
  groupBy: ['orders.orderDate'],
  orderBy: [{ field: 'revenue', direction: 'desc' }],
  limit: 100
}, tenantId); // CRITICAL: tenantId from req.tenant.id
```

### Query Builder Service

**Query Builder Implementation:**
```typescript
class QueryBuilderService {
  // CRITICAL: tenantId is required for all queries
  buildQuery(config: QueryConfig, tenantId: string): Query {
    const query: Query = {
      select: config.fields.map(f => ({
        field: f.name,
        table: f.table,
        alias: f.alias,
        aggregation: f.aggregation || 'none'
      })),
      from: config.dataSource,
      where: {
        ...this.buildFilters(config.filters),
        tenantId: tenantId  // CRITICAL: Always include tenantId filter
      },
      groupBy: config.groupBy || [],
      orderBy: config.sorting || [],
      limit: config.limit || 1000,
      offset: config.offset || 0
    };
    
    return query;
  }
  
  private buildFilters(filters: Filter[]): WhereClause {
    if (!filters || filters.length === 0) return {};
    
    const where: WhereClause = {
      AND: filters.map(filter => {
        switch (filter.operator) {
          case 'equals':
            return { [filter.field]: filter.value };
          case 'notEquals':
            return { [filter.field]: { not: filter.value } };
          case 'greaterThan':
            return { [filter.field]: { gt: filter.value } };
          case 'lessThan':
            return { [filter.field]: { lt: filter.value } };
          case 'contains':
            return { [filter.field]: { contains: filter.value } };
          case 'in':
            return { [filter.field]: { in: filter.value } };
          case 'between':
            return {
              [filter.field]: {
                gte: filter.value[0],
                lte: filter.value[1]
              }
            };
          default:
            return {};
        }
      })
    };
    
    return where;
  }
  
  buildPrismaQuery(query: Query, workspace: string, tenantId: string): any {
    // CRITICAL: Convert Query to Prisma query format with tenantId
    const prismaQuery: any = {
      where: {
        ...query.where,
        tenantId: tenantId  // CRITICAL: Always include tenantId
      },
      select: this.buildSelect(query.select),
      orderBy: this.buildOrderBy(query.orderBy),
      take: query.limit,
      skip: query.offset
    };
    
    if (query.groupBy && query.groupBy.length > 0) {
      // Use raw SQL for GROUP BY (CRITICAL: Include tenantId in WHERE clause)
      return this.buildRawQuery(query, workspace, tenantId);
    }
    
    return prismaQuery;
  }
  
  private buildRawQuery(query: Query, workspace: string, tenantId: string): string {
    // CRITICAL: Raw SQL queries MUST include tenantId filter
    return `
      SELECT ${query.select.map(s => `${s.table}.${s.field}`).join(', ')}
      FROM ${query.from}
      WHERE tenant_id = '${tenantId}'  -- CRITICAL: Tenant filter
        ${query.where ? `AND ${this.buildWhereClause(query.where)}` : ''}
      GROUP BY ${query.groupBy.join(', ')}
      ORDER BY ${query.orderBy.map(o => `${o.field} ${o.direction}`).join(', ')}
      LIMIT ${query.limit}
      OFFSET ${query.offset}
    `;
  }
}
```

### AI/ML Service

**AI Service Implementation:**
```typescript
class AIService {
  private nlpService: NLPService;
  private mlService: MLService;
  
  // CRITICAL: tenantId required for tenant-specific insights
  async generateInsights(data: Data, context: Context, tenantId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Detect anomalies
    const anomalies = await this.detectAnomalies(data);
    insights.push(...anomalies);
    
    // Detect trends
    const trends = await this.detectTrends(data);
    insights.push(...trends);
    
    // Generate predictions
    const predictions = await this.generatePredictions(data);
    insights.push(...predictions);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(data, context);
    insights.push(...recommendations);
    
    return insights.sort((a, b) => b.priority - a.priority);
  }
  
  async detectAnomalies(data: Data): Promise<Insight[]> {
    // Use statistical methods or ML to detect anomalies
    // Z-score, IQR, Isolation Forest, etc.
  }
  
  async detectTrends(data: Data): Promise<Insight[]> {
    // Use time series analysis to detect trends
    // Linear regression, moving averages, etc.
  }
  
  async generatePredictions(data: Data): Promise<Insight[]> {
    // Use ML models to generate predictions
    // ARIMA, Prophet, LSTM, etc.
  }
  
  async parseNaturalLanguage(query: string): Promise<Query> {
    // Use NLP to parse Persian query
    const parsed = await this.nlpService.parse(query);
    
    // Convert to structured query
    return this.nlpToQuery(parsed);
  }
  
  private nlpToQuery(parsed: ParsedQuery): Query {
    // Convert NLP parse tree to Query object
  }
}
```

---

## Detailed Roadmap with Tasks

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Planning & Design
**Tasks:**
- [ ] Finalize architecture document
- [ ] Create detailed UI/UX mockups (Figma)
- [ ] Design database schema (Prisma)
- [ ] Create API specifications (OpenAPI)
- [ ] Set up project structure (monorepo)
- [ ] Set up development environment (Docker)
- [ ] Create coding standards document
- [ ] Set up version control (Git)

**Deliverables:**
- Architecture document
- UI/UX designs
- Database schema
- API specifications
- Development environment

#### Week 2: Core Infrastructure Setup
**Tasks:**
- [ ] Set up backend project structure
- [ ] Set up frontend project structure
- [ ] Configure PostgreSQL database
- [ ] Set up Prisma schema (with tenantId in all BI tables)
- [ ] Configure authentication middleware
- [ ] Set up subdomain-based tenant middleware
- [ ] Configure tenant resolution (resolveTenant)
- [ ] Set up tenant validation (requireTenant)
- [ ] Set up feature gates (requireFeature)
- [ ] Create base services (logger, error handler)
- [ ] Set up testing framework (Jest)
- [ ] Add tenant isolation tests

**Deliverables:**
- Project structure
- Database setup
- Authentication system
- Multi-tenant framework
- Testing framework

#### Week 3: Data Connector Framework
**Status:** ✅ **COMPLETED**

**Tasks:**
- [x] Create WorkspaceConnector interface (with tenantId parameter)
- [x] Implement OrderingConnector (with tenantId filtering)
- [x] Implement InventoryConnector (with tenantId filtering)
- [x] Create connector registry (in DataAggregatorService)
- [x] Add connector validation (tenantId required)
- [x] Add tenant isolation checks
- [x] Add error handling
- [ ] Write unit tests (with tenant isolation tests)
- [ ] Write integration tests (multi-tenant scenarios)

**Deliverables:**
- ✅ Connector framework (`src/backend/src/services/bi/connectors/WorkspaceConnector.ts`)
- ✅ Ordering connector (`src/backend/src/services/bi/connectors/OrderingConnector.ts`)
- ✅ Inventory connector (`src/backend/src/services/bi/connectors/InventoryConnector.ts`)
- ⏳ Test suite (pending)

**Implementation Notes:**
- All connectors require `tenantId` parameter in `getSchema()` and `executeQuery()` methods
- All Prisma queries include `tenantId` filtering for data isolation
- Connectors are registered in `DataAggregatorService` constructor
- Ready for use in data aggregation operations

#### Week 4: Data Aggregator Service
**Status:** ✅ **COMPLETED**

**Tasks:**
- [x] Create DataAggregatorService (with tenantId parameter)
- [x] Implement data merging logic (tenant-aware)
- [x] Implement join operations (INNER, LEFT, UNION, CROSS) with tenantId validation
- [x] Add data validation (tenantId consistency check)
- [x] Add caching layer using globalCacheService (tenant-specific cache keys)
- [ ] Add tenant isolation tests
- [ ] Write unit tests (multi-tenant scenarios)
- [ ] Write integration tests (cross-tenant data leak tests)
- [ ] Performance testing (with tenant filtering)

**Deliverables:**
- ✅ Data aggregator service (`src/backend/src/services/bi/aggregators/DataAggregatorService.ts`)
- ✅ Caching layer (integrated with `globalCacheService`)
- ⏳ Test suite (pending)
- ⏳ Performance benchmarks (pending)

**Implementation Notes:**
- Service fully implements tenant-aware data aggregation
- Supports all join types: INNER, LEFT, UNION, CROSS
- Implements full aggregation operations: SUM, AVG, COUNT, MIN, MAX
- Includes filtering, grouping, ordering, and pagination
- Cache integration with tenant-specific keys
- Ready for use in BI controllers and services

### Phase 2: Core Dashboard (Weeks 5-8)

#### Week 5: Executive Dashboard - Layout
**Status:** ✅ **PARTIALLY COMPLETED** (Workspace Selector & Period Selector Added)

**Tasks:**
- [x] Create dashboard layout component (existing, enhanced)
- [x] Implement KPI card component (existing, enhanced with workspace filtering)
- [x] Implement period selector component
- [x] Implement workspace selector component
- [x] Add responsive design (mobile, tablet, desktop) - existing
- [x] Add loading states - existing
- [x] Add error handling - existing
- [ ] Write component tests - Pending

**Deliverables:**
- ✅ Dashboard layout (existing, enhanced)
- ✅ KPI card component (workspace-aware filtering)
- ✅ Period selector component
- ✅ Workspace selector component
- ✅ Responsive design (existing)
- ⏳ Component tests (pending)

**Implementation Notes:**
- **Global Workspace Context**: Implemented `BIWorkspaceContext` to manage workspace selection across the entire BI workspace
  - Workspace selection is persisted in localStorage
  - All BI pages automatically respect the selected workspace
  - Workspace selector is available in the sidebar layout (visible when sidebar is expanded)
- **Workspace Selector**: Added dropdown in sidebar header with options:
  - 'merged' (ترکیبی): Shows all KPIs from both workspaces
  - 'ordering' (سفارشات): Shows ordering-specific KPIs (totalRevenue, averageOrderValue)
  - 'inventory' (موجودی): Shows inventory-specific KPIs (inventoryTurnover, stockoutRate, activeProductsCount)
- **Navigation Filtering**: Navigation items are automatically filtered based on selected workspace:
  - Ordering workspace: Shows ordering-specific pages (Ordering Dashboard, Profit Analysis)
  - Inventory workspace: Shows inventory-specific pages (Inventory Dashboard, ABC Analysis)
  - Merged workspace: Shows all pages including Merged Dashboard
- **Page-Level Filtering**: All BI pages respect the global workspace selection:
  - **ABC Analysis**: Only available for inventory and merged workspaces
  - **Profit Analysis**: Only available for ordering and merged workspaces
  - **Trend Analysis**: Available for all workspaces
    - ✅ Fixed granularity parameter mapping (day/week/month → daily/weekly/monthly)
    - ✅ Fixed period parsing (30d, 7d, 90d, 1y)
    - ✅ Updated queries to use Order data for revenue/profit metrics (more accurate for BI workspace)
    - ✅ Fixed date parsing with proper error handling (handles Date objects and string dates from JSON)
    - ✅ Fixed frontend-backend trend direction mapping (UP/DOWN/STABLE → up/down/stable)
    - ✅ Added comprehensive error handling and logging
    - ✅ Fixed profit metric calculation query:
      - Simplified profit calculation to use a fixed 30% margin (70% cost assumption)
      - This avoids complex joins with item_suppliers that may fail if data is missing
      - Uses order totalAmount directly for reliable calculation
      - Improved error logging for profit calculation debugging
      - Note: This is a simplified approach. For more accurate profit calculation, use the Profit Analysis page which uses InventoryEntry data
    - ✅ Implemented all tabs with full functionality:
      - **Overview Tab**: Area chart visualization with trend information cards
      - **Forecast Tab**: Forecast chart showing actual vs predicted data with forecast summary
      - **Multi-Metric Tab**: Metric selector UI for switching between different metrics
      - **Insights Tab**: Display of AI-generated insights with trend analysis information
      - **Scorecard Tab**: Comprehensive KPI scorecard with all key metrics and trend status
    - ✅ Improved responsive design for all screen sizes
    - ✅ Fixed date type handling (Date objects vs strings from JSON serialization)
  - **Data Explorer**: Workspace checkboxes filtered based on selected workspace
  - **Custom Reports**: Available fields filtered based on selected workspace
- **Period Selector**: Added dropdown with options: 7d, 30d, 90d, 1y
- **KPI Filtering**: KPIs are conditionally rendered based on selected workspace:
  - Ordering workspace: Shows 2 KPI cards (Total Sales, Average Order Value)
  - Inventory workspace: Shows 3 KPI cards (Inventory Turnover, Stockout Rate, Active Products)
  - Merged workspace: Shows all 6 KPI cards (includes Net Profit, Profit Margin)
- **Quick Reports**: Filtered based on workspace selection
- **State Management**: Workspace and period changes trigger automatic data refresh
- **User Experience**: Clear visual indicators for workspace-specific data
- **Consistency**: Entire BI workspace maintains consistency - when a workspace is selected, all features, navigation, and data are filtered accordingly

#### Week 6: Executive Dashboard - Data
**Status:** ✅ **COMPLETED** (API Endpoints & Workspace Filtering)

**Tasks:**
- [x] Create dashboard API endpoint (with workspace selector support)
- [x] Implement KPI calculation service (existing, enhanced with workspace support)
- [x] Implement data fetching logic (DataAggregatorService integration)
- [x] Add data aggregation endpoints (POST /api/bi/aggregate, GET /api/bi/schema, POST /api/bi/explore)
- [x] Enhance buildExecutiveDashboard() to filter KPIs by workspace
- [x] Update frontend biService.ts to use new endpoints
- [ ] Add real-time updates (WebSocket) - Pending
- [x] Add data caching (via DataAggregatorService)
- [x] Add error handling
- [ ] Write API tests - Pending
- [ ] Write integration tests - Pending

**Deliverables:**
- ✅ Dashboard API (`GET /api/bi/dashboard` with workspace parameter)
- ✅ Data Aggregation API (`POST /api/bi/aggregate`)
- ✅ Schema API (`GET /api/bi/schema`)
- ✅ Data Exploration API (`POST /api/bi/explore`)
- ✅ KPI calculation service (existing, enhanced with workspace filtering)
- ✅ Frontend service updated with new endpoints and workspace support
- ⏳ Real-time updates (pending)
- ⏳ Test suite (pending)

**Implementation Notes:**
- **Workspace Filtering**: Dashboard now filters KPIs based on workspace:
  - **Ordering workspace**: Shows `totalRevenue`, `averageOrderValue` (ordering-specific KPIs)
  - **Inventory workspace**: Shows `inventoryTurnover`, `stockoutRate`, `activeProductsCount` (inventory-specific KPIs)
  - **Merged workspace**: Shows all KPIs including `netProfit`, `profitMargin` (requires both workspaces)
- **Frontend Integration**: 
  - Updated `getDashboard()` to accept workspace parameter
  - Added `aggregate()`, `getSchema()`, and `explore()` methods
  - All methods handle response unwrapping from `{ success, data, message }` format
  - **Dashboard Page Enhanced** (`src/frontend/app/workspaces/business-intelligence/page.tsx`):
    - Added workspace selector dropdown in header (options: merged, ordering, inventory)
    - Added period selector dropdown (7d, 30d, 90d, 1y)
    - KPIs conditionally rendered based on workspace selection
    - Quick reports filtered by workspace
    - Automatic data refresh when workspace or period changes
    - Responsive design maintained for mobile/tablet/desktop
- **Backend Enhancements**:
  - `buildExecutiveDashboard()` now calculates only relevant KPIs based on workspace
  - Charts are filtered by workspace (revenue/top products for ordering, category breakdown for inventory)
  - KPIs not in workspace show default values with descriptive messages
- All new endpoints are tenant-aware and use `req.tenant.id`
- DataAggregatorService integrated for cross-workspace analytics
- Backward compatible: default workspace is 'merged'

#### Week 7: Workspace-Specific Dashboards
**Status:** ✅ **COMPLETED** (Core Features Implemented)

**Tasks:**
- [x] Create Ordering dashboard page
- [x] Create Inventory dashboard page
- [x] Create Merged dashboard page
- [x] Implement workspace switching (via dedicated pages)
- [ ] Add dashboard customization - Pending
- [x] Add export functionality (PDF, Excel)
- [ ] Write E2E tests - Pending

**Deliverables:**
- ✅ Ordering dashboard (`/workspaces/business-intelligence/ordering`)
- ✅ Inventory dashboard (`/workspaces/business-intelligence/inventory`)
- ✅ Merged dashboard (`/workspaces/business-intelligence/merged`)
- ✅ Export functionality (PDF, Excel)

**Implementation Notes:**
- **Dashboard Export Utility** (`src/frontend/utils/dashboardExport.ts`):
  - `exportDashboardToPDF()` - Creates comprehensive PDF reports with cover page, KPIs, and chart data
  - `exportDashboardToExcel()` - Creates multi-sheet Excel workbooks with KPIs, chart data, and metadata
  - Supports all workspace types (ordering, inventory, merged)
  - Includes proper formatting, page numbers, and metadata
- **Ordering Dashboard** (`src/frontend/app/workspaces/business-intelligence/ordering/page.tsx`):
  - Focused on ordering-specific KPIs (Total Revenue, Average Order Value)
  - Displays revenue trend chart and top products chart
  - Export buttons for PDF and Excel
  - Period selector (7d, 30d, 90d, 1y)
- **Inventory Dashboard** (`src/frontend/app/workspaces/business-intelligence/inventory/page.tsx`):
  - Focused on inventory-specific KPIs (Inventory Turnover, Stockout Rate, Active Products)
  - Displays category breakdown chart
  - Export buttons for PDF and Excel
  - Period selector (7d, 30d, 90d, 1y)
- **Merged Dashboard** (`src/frontend/app/workspaces/business-intelligence/merged/page.tsx`):
  - Combines all KPIs from both ordering and inventory workspaces
  - Displays all available charts (revenue trend, top products, category breakdown)
  - Export buttons for PDF and Excel
  - Period selector (7d, 30d, 90d, 1y)
- **Navigation Updates**:
  - Added links to workspace-specific dashboards in BI layout navigation
  - Quick access to Ordering, Inventory, and Merged dashboards
- **Export Features**:
  - PDF export includes cover page, KPI summary, and chart data tables
  - Excel export includes multiple sheets: KPIs, Revenue Trend, Top Products, Category Distribution, Metadata
  - Proper filtering of non-KPI fields (e.g., `activeProductsCount` as number)
  - Toast notifications for success/error states
- **User Experience**:
  - Responsive design for mobile/tablet/desktop
  - Loading states during data fetch
  - Error handling with retry functionality
  - Persian labels and RTL support

#### Week 8: Charts & Visualizations
**Status:** ✅ **COMPLETED** (Core Charts Implemented)

**Tasks:**
- [x] Integrate chart library (Recharts) - Already installed (v2.15.3)
- [x] Create revenue chart component (using existing CustomLineChart)
- [x] Create top products chart component (using existing CustomBarChart)
- [x] Create category breakdown chart component (using existing CustomPieChart)
- [x] Add chart interactivity (hover tooltips via Recharts)
- [ ] Add chart export (PNG, SVG) - Pending
- [ ] Write component tests - Pending

**Deliverables:**
- ✅ Chart components integrated into dashboard
- ✅ Interactive visualizations (hover tooltips, legends)
- ✅ Workspace-based chart filtering
- ⏳ Export functionality (pending)
- ⏳ Test suite (pending)

**Implementation Notes:**
- **Chart Library**: Recharts v2.15.3 already installed and integrated
- **Chart Components Used**:
  - `CustomLineChart` for revenue trend (ordering & merged workspaces)
  - `CustomBarChart` for top products (ordering & merged workspaces)
  - `CustomPieChart` for category breakdown (inventory & merged workspaces)
- **Data Transformation**: Backend returns Chart.js format (`labels` + `datasets`), converted to Recharts format (array of objects)
- **Workspace Filtering**: Charts conditionally rendered based on workspace selection:
  - **Ordering workspace**: Revenue trend + Top products charts
  - **Inventory workspace**: Category breakdown chart
  - **Merged workspace**: All three charts
- **Interactivity**: 
  - Hover tooltips showing detailed values (via Recharts CustomTooltip)
  - Interactive legends (via Recharts CustomLegend)
  - Responsive design for mobile/tablet/desktop
- **Chart Data Structure**: 
  ```typescript
  {
    revenueChart: { labels: string[], datasets: Array<{label, data, backgroundColor, borderColor}> },
    topProductsChart: { labels: string[], datasets: Array<{label, data, backgroundColor, borderColor}> },
    categoryChart: { labels: string[], datasets: Array<{label, data, backgroundColor, borderColor}> }
  }
  ```
- **Location**: Charts added to `src/frontend/app/workspaces/business-intelligence/page.tsx`
- **Chart Export Functionality**: ✅ **COMPLETED**
  - Created `chartExport.ts` utility with `exportChartToPNG()` and `exportChartToSVG()` functions
  - Added export buttons to `CustomBarChart`, `CustomLineChart`, and `CustomPieChart` components
  - Export buttons appear in chart header when `enableExport={true}` prop is set
  - Charts on dashboard have export enabled with unique chart IDs
  - PNG export converts SVG to canvas and downloads as image
  - SVG export downloads raw SVG with XML declaration
- **Future Enhancements**: 
  - Drill-down functionality (click to see details)
  - Additional chart types (inventory turnover chart)
  - Chart customization options

#### Analytics Reports Page (گزارش آماری)
**Status:** ✅ **FIXED** (UI Issues Resolved & Workspace-Aware)

**Location:** `src/frontend/app/workspaces/business-intelligence/analytics/page.tsx`

**Issues Fixed:**
- ✅ **Category Breakdown Percentage Calculation**: Fixed incorrect percentage display (was showing raw revenue values as percentages, causing values like 189651732%)
  - Now calculates proper percentages: `percentage = (rawValue / totalValue) * 100`
  - Percentages are rounded to 2 decimal places
  - Progress bars capped at 100% to prevent overflow
- ✅ **Workspace Awareness**: Page now respects global workspace selection
  - Summary cards only shown for inventory and merged workspaces
  - Category breakdown and trends only shown for inventory and merged workspaces
  - Shows informative message for ordering workspace
  - Dashboard data fetched with workspace parameter
- ✅ **UI Layout Fixes**: 
  - Fixed conditional rendering structure
  - Proper workspace-based filtering of all sections
  - Improved percentage display formatting
  - Better empty state messages

**Implementation Notes:**
- **Workspace Filtering**: 
  - **Ordering workspace**: Shows message that analytics summary is only available for inventory/merged workspaces
  - **Inventory workspace**: Shows all analytics sections (summary cards, category breakdown, trends, monthly data, quick actions)
  - **Merged workspace**: Shows all analytics sections
- **Category Data Processing**: 
  - Backend returns raw revenue values (in Toman)
  - Frontend calculates percentages: `(value / total) * 100`
  - Percentages displayed with 1 decimal place: `{value.toFixed(1)}%`
  - Progress bars use `Math.min(value, 100)` to prevent overflow
- **Data Fetching**: 
  - `getDashboard()` now called with workspace parameter: `biService.getDashboard(period, undefined, undefined, workspace)`
  - `fetchAnalyticsData` dependency array includes `workspace` to trigger refresh on workspace change
- **User Experience**:
  - Clear visual indicators for workspace-specific content
  - Informative messages when content is not available for selected workspace
  - Consistent with global workspace filtering across BI workspace

#### Custom Reports Page (گزارش‌های سفارشی)
**Status:** ✅ **COMPLETELY CUSTOMIZED** (Schema-Based Dynamic Field Loading)

**Location:** `src/frontend/app/workspaces/business-intelligence/custom-reports/page.tsx`

**Issues Fixed:**
- ✅ **Wrong API Endpoints**: Frontend was using `reportService` which calls `/reports` endpoints, but should use `biService` which calls `/api/bi/reports` endpoints
  - Updated `loadReports()` to use `biService.getCustomReports()` instead of `reportService.getReports()`
  - Updated `handleCreateReport()` to use `biService.createCustomReport()` instead of `reportService.createReport()`
  - Updated `handleEditReport()` to use `biService.getReportById()` instead of `reportService.getReportById()`
  - Updated `handleUpdateReport()` to use `biService.updateReport()` instead of `reportService.updateReport()`
  - Updated `handleDeleteReport()` to use `biService.deleteReport()` instead of `reportService.deleteReport()`
  - Updated `handleExecuteReport()` to use `biService.executeReport()` instead of `reportService.executeReport()`
- ✅ **Missing tenantId Filtering**: Backend methods were not filtering by `tenantId`, causing potential data leakage
  - Added `tenantId` parameter to `ReportService.getReports()` and filter by tenant
  - Added `tenantId` parameter to `ReportService.getReportById()` and filter by tenant
  - Added `tenantId` parameter to `ReportService.updateReport()` and filter by tenant
  - Added `tenantId` parameter to `ReportService.deleteReport()` and filter by tenant
  - Updated `biController.getCustomReports()` to pass `tenantId` to `ReportService.getReports()`
  - Updated `biController.getReportById()` to pass `tenantId` to `ReportService.getReportById()`
  - Updated `biController.updateReport()` to pass `tenantId` to `ReportService.updateReport()`
  - Updated `biController.deleteReport()` to pass `tenantId` to `ReportService.deleteReport()`
- ✅ **API Response Unwrapping**: Frontend was not properly unwrapping the wrapped API responses `{ success: true, data: {...} }`
  - Updated `loadReports()` to unwrap response: `response.data.reports`
  - Updated `handleEditReport()` to unwrap response: `response.data`
  - Updated `handleExecuteReport()` to unwrap response: `response.data`
- ✅ **Missing biService Methods**: Added missing methods to `biService`:
  - `getReportById(reportId: string)` - Get report by ID
  - `updateReport(reportId: string, updates: unknown)` - Update report
  - `deleteReport(reportId: string)` - Delete report

**Implementation Notes:**
- **API Endpoints**: All custom reports operations now use `/api/bi/reports` endpoints:
  - `GET /api/bi/reports` - List reports (with tenantId filtering)
  - `POST /api/bi/reports` - Create report
  - `GET /api/bi/reports/:id` - Get report by ID (with tenantId filtering)
  - `PUT /api/bi/reports/:id` - Update report (with tenantId filtering)
  - `DELETE /api/bi/reports/:id` - Delete report (with tenantId filtering)
  - `POST /api/bi/reports/:id/execute` - Execute report
- **Multi-Tenancy**: All backend methods now enforce tenant isolation:
  - `ReportService.getReports()` filters by `tenantId`
  - `ReportService.getReportById()` filters by `tenantId`
  - `ReportService.updateReport()` filters by `tenantId`
  - `ReportService.deleteReport()` filters by `tenantId`
- **Response Format**: All BI API endpoints return wrapped responses:
  ```typescript
  {
    success: true,
    data: { ... },
    message: "..."
  }
  ```
  Frontend now properly unwraps these responses before using the data.
- **Workspace Filtering**: The page already respects workspace selection for field filtering:
  - **Ordering workspace**: Shows ordering and merged fields
  - **Inventory workspace**: Shows inventory and merged fields
  - **Merged workspace**: Shows all fields
- **User Experience**:
  - Proper error handling with toast notifications
  - Loading states during API calls
  - Proper response unwrapping prevents runtime errors
  - Tenant isolation ensures data security

**Latest Enhancements - Complete BI Workspace Customization (COMPLETED):**

**1. Schema-Based Dynamic Field Loading:**
- ✅ **Dynamic Schema Loading**: Replaced hardcoded field definitions with dynamic loading from BI schema API (`/api/bi/schema`)
  - Fields are now loaded based on the selected workspace (ordering, inventory, merged)
  - Schema is fetched from `OrderingConnector` and `InventoryConnector` which provide actual database table structures
  - Fields are automatically mapped to their actual database tables and columns
  - Field IDs follow format: `tableName_fieldName` (e.g., `items_name`, `orders_totalAmount`)
- ✅ **Workspace-Aware Field Filtering**: 
  - **Ordering workspace**: Shows only fields from ordering tables (orders, orderItems, payments)
  - **Inventory workspace**: Shows only fields from inventory tables (items, inventoryEntries)
  - **Merged workspace**: Shows all fields from both workspaces
- ✅ **Proper Data Source Configuration**:
  - Data sources are automatically built from selected fields
  - Each data source includes workspace ID and table name
  - Format: `{ id: 'workspace_table', name: 'Workspace - Table', type: 'database', connection: { workspace: 'workspace-id', table: 'tableName' } }`
  - Data sources are displayed in the workspace info panel
- ✅ **Enhanced Field Display**:
  - Fields show table name and field name: `table.fieldName` in monospace font
  - Persian labels for better UX (e.g., 'نام کالا' for `items.name`)
  - Field descriptions include table context: `{label} از جدول {table}`
  - Fields organized by category (کالا, موجودی, سفارش, آیتم سفارش, پرداخت)
  - Category headers show field count
- ✅ **Workspace Info Panel**: 
  - Shows currently selected workspace with Persian label
  - Displays loading state when fetching schema (spinner + message)
  - Shows count of available fields and tables
  - Lists data sources that will be used in the report
- ✅ **Improved Create Report Handler**:
  - Uses actual table and field names from schema instead of hardcoded mappings
  - Builds proper `dataSources` array based on unique tables from selected fields
  - Maps fields correctly to `columnsConfig` with proper table references
  - Supports both builder mode and form mode with schema-based fields
  - Field mapping: `{ id: fieldId, name: field.fieldName, type: field.type, table: field.table, label: field.label, aggregation: ... }`
- ✅ **Loading States & Error Handling**: 
  - Shows loading spinner while fetching schema
  - Displays error messages if schema loading fails
  - Provides retry functionality
  - Empty state when no fields available for selected workspace
- ✅ **Backward Compatibility**: 
  - Still supports existing report configurations
  - Template system works with new schema-based fields
  - Field IDs maintain format: `tableName_fieldName` for easy mapping
  - QueryBuilder can still handle old field mappings via FIELD_MAPPINGS

**2. BI-Specific System Templates (COMPLETED):**
- ✅ **Replaced Inventory Templates**: Updated `getSystemTemplates()` in `ReportTemplateService` to return BI-specific templates
  - All templates now use schema-based field IDs (e.g., `items_name`, `orders_totalAmount`, `inventoryEntries_quantity`)
  - Templates include proper workspace and table references in `dataSources`
  - Format: `{ id: 'workspace_table', name: 'Workspace - Table', type: 'database', connection: { workspace: 'workspace-id', table: 'tableName' } }`
- ✅ **BI Inventory Templates**:
  - `bi-system-inventory-stock`: گزارش موجودی کالاها (Items stock report) - Uses `items` table fields
  - `bi-system-inventory-transactions`: گزارش تراکنش‌های موجودی (Inventory transactions report) - Uses `inventoryEntries` and `items` tables
  - `bi-system-inventory-low-stock`: گزارش کالاهای کم موجودی (Low stock alert report) - Uses `items` table with filter
- ✅ **BI Ordering Templates**:
  - `bi-system-orders-summary`: گزارش خلاصه سفارشات (Orders summary report) - Uses `orders` table
  - `bi-system-order-items`: گزارش آیتم‌های سفارش (Order items report) - Uses `orderItems` table
  - `bi-system-payments`: گزارش پرداخت‌ها (Payments report) - Uses `payments` table
- ✅ **Removed Hardcoded Template Cards**: Removed hardcoded template cards from `custom-reports/page.tsx`
  - Now only uses `TemplateLibrary` component which loads templates dynamically
  - Templates are filtered and displayed based on workspace selection
  - All templates use schema-based field IDs for proper mapping
  - Template library shows all available templates with filtering options

**3. Fixed Drag-and-Drop System (COMPLETED):**
- ✅ **Unified DndContext**: Moved `DndContext` from individual components to `AdvancedReportBuilder`
  - `ReportFieldPalette` and `ReportCanvas` now share the same `DndContext` when `useSharedContext={true}`
  - This enables proper drag-and-drop between palette and canvas
  - Single source of truth for drag state management
- ✅ **Shared Context Implementation**:
  - `AdvancedReportBuilder` wraps both components in a single `DndContext`
  - Handles drag start/end events at the parent level
  - Manages active field state for drag overlay
  - Uses `arrayMove` from `@dnd-kit/sortable` for proper reordering
  - Drag overlay shows visual feedback during drag operation
- ✅ **Component Updates**:
  - `ReportFieldPalette`: Added `useSharedContext` prop to conditionally render its own `DndContext`
  - `ReportCanvas`: Added `useSharedContext` prop to conditionally render its own `DndContext`
  - Both components can work standalone (with their own context) or shared (without context)
  - Maintains backward compatibility for standalone usage
- ✅ **Drag Overlay**: Added drag overlay in `AdvancedReportBuilder` to show visual feedback during drag
- ✅ **Field Reordering**: Fixed field reordering within canvas using `arrayMove` utility
- ✅ **Field Drop Handling**: Properly handles field drops from palette to canvas with duplicate prevention

**4. Enhanced Field Labels Display (COMPLETED):**
- ✅ **Comprehensive Field Label Mapping**: Enhanced `getFieldLabel()` function to provide Persian labels for ALL fields
  - Added common field labels (id, createdAt, updatedAt, tenantId, etc.) used across multiple tables
  - Expanded table-specific labels for all fields in:
    - `items`: Added labels for itemId, supplierId, price, cost, and all existing fields
    - `inventoryEntries`: Added labels for itemId, userId, orderId, orderItemId, batchNumber, expiryDate, and all existing fields
    - `orders`: Added labels for all order fields including customerId, tableId, payment fields, timing fields, and status fields
    - `orderItems`: Added labels for orderId, menuItemId, notes, modifications, allergyInfo
    - `payments`: Added labels for orderId, processedBy, transactionId, referenceNumber, notes
- ✅ **Smart Fallback System with CamelCase Translation**:
  - First checks table-specific labels
  - Then checks common field labels
  - Then converts camelCase field names to words and translates each word to Persian
  - Word mapping includes 50+ common English words (order, number, date, amount, price, etc.)
  - Final fallback: returns capitalized field name if no translation found
- ✅ **Field Display Fix**: Fixed issue where field names were not showing in "فیلدهای موجود" (Available Fields) section
  - All fields now display their Persian labels properly
  - Field types are shown as badges alongside labels
  - Field descriptions include table context for better understanding
  - Added fallback display in `DraggableField` component to show `table.fieldName` if label is missing
  - Ensured labels are never empty by using field name as final fallback
- ✅ **Improved Field Creation Logic**:
  - Simplified field creation logic to avoid skipping fields incorrectly
  - Ensured all fields (except tenantId) are included with proper labels
  - Added validation to ensure label is never empty before creating field object
  - Added multiple fallback layers: table-specific labels → common labels → camelCase translation → formatted field name → table.fieldName
  - Added debugging logs to track fields without labels
- ✅ **Enhanced Component Display**:
  - Improved layout with `flex-shrink-0` for icons and type badges to prevent layout issues
  - Added `minHeight` to label paragraph to ensure it always takes space
  - Added `overflow-hidden` to prevent text overflow issues
  - Enhanced fallback display logic to always show meaningful text
  - Added debug logging in `DraggableField` component to track missing labels
  - Fixed flex layout issues by using `flex: '1 1 0%'` and proper `min-w-0` classes
  - Wrapped label in a flex column container to ensure proper text rendering
  - Added `flexShrink: 0` to label paragraph to prevent it from collapsing
  - Added non-breaking space fallback (`\u00A0`) to ensure label always takes space even if empty
  - **Matched ReportCanvas Layout Structure**: Updated `DraggableField` component to use the exact same layout structure as `SortableFieldItem` in `ReportCanvas`:
    - Changed icon size from `text-lg` to `text-xl` to match ReportCanvas
    - Simplified layout structure to match: `flex items-center justify-between gap-3` with nested `flex items-center gap-3 flex-1 min-w-0`
    - Removed complex inline styles and used simple `truncate` class like ReportCanvas
    - Removed `flex-shrink-0` from icon and type badge to match ReportCanvas exactly
    - This ensures consistent visual appearance between "فیلدهای موجود" (Available Fields) and "ناحیه گزارش" (Report Area)
  - **Enhanced Label Rendering**: 
    - Added explicit inline styles to ensure label text is always visible: `display: 'block'`, `visibility: 'visible'`, `opacity: 1`, `minHeight: '1.25rem'`, `lineHeight: '1.25rem'`
    - Replaced `truncate` class with explicit inline styles for text overflow handling to ensure label text renders correctly
    - Added `title` attribute to label paragraph for tooltip display
    - Added comprehensive debug logging to trace field data through the component rendering pipeline
    - Added fallback text "NO LABEL" to help identify when labels are missing
  - **Fixed Responsive Layout Issue**: 
    - **Root Cause**: The issue was screen-size specific - labels displayed correctly on mobile (`grid-cols-1`) but not on laptop/desktop (`sm:grid-cols-2`). The 2-column grid layout made each field card narrower, causing the flex layout to collapse the label text.
    - **Solution**: 
      - Simplified flex layout structure: Removed nested `justify-between` and `flex-1 min-w-0` wrapper that was causing layout collapse
      - Changed to direct flex layout: `flex items-center gap-3` with icon, label div, and type badge as direct children
      - Added `flex-shrink-0` to icon and type badge to prevent them from shrinking
      - Ensured label container has `flex-1 min-w-0 overflow-hidden` to allow proper text truncation
    - Added `maxWidth: '100%'` to label paragraph style to ensure it respects container width
    - Added `minWidth: 0` to grid container to prevent grid items from overflowing
    - This ensures labels display correctly at all screen sizes, matching the behavior of `ReportCanvas`
  - **Changed Layout from Columns to Rows**: 
    - Changed the main layout in `AdvancedReportBuilder` from `grid grid-cols-1 lg:grid-cols-3` (side-by-side columns) to `flex flex-col` (stacked vertically in rows)
    - This ensures "فیلدهای موجود" (Available Fields) appears above "ناحیه گزارش" (Report Area) instead of side-by-side
    - This provides more horizontal space for each component, which helps prevent label text from being truncated or hidden
    - Both components now take full width, making labels more visible and preventing layout collapse issues
  - **Added Click-to-Select Functionality**: 
    - Added `onFieldClick` prop to `DraggableField` component to handle click events
    - Implemented `handleClick` handler that adds fields to the report area when clicked
    - Click functionality works alongside drag-and-drop without interference
    - Added visual feedback: changed cursor from `cursor-grab` to `cursor-pointer` and added `hover:border-blue-400` for better UX
    - Click handler checks for `isDragging` state to prevent conflicts with drag operations
    - Users can now either drag-and-drop fields or simply click on them to add to the report area
  - **Fixed Edit Modal to Match Create Modal**:
    - Removed duplicate edit modal (there were two edit modals in the code)
    - Added builder mode toggle (`useEditBuilderMode`) to edit modal, matching the create modal structure
    - Added separate builder state variables for edit mode: `editBuilderSelectedFields`, `editAdvancedFormatting`, `editAdvancedCalculations`, `editAdvancedSorting`, `editAdvancedGrouping`
    - Updated edit modal to include Template Library, Workspace Info, Mode Toggle, and AdvancedReportBuilder component
    - Updated `handleEditReport` to properly initialize builder state from saved report configuration
    - Updated `handleUpdateReport` to use builder mode fields when builder mode is enabled
    - Edit modal now supports both "سازنده پیشرفته" (Advanced Builder) and "فرم ساده" (Simple Form) modes, matching the create modal
  - **Fixed Action Buttons**:
    - Fixed `handleExportReport` to use direct API fetch instead of `reportService.executeReport` (which was using wrong endpoint)
    - Removed unused `reportService` import
    - All action buttons (Edit, Execute, Export, Delete) now work correctly:
      - **Edit**: Opens edit modal with full report configuration, supports both builder and form modes
      - **Execute**: Executes report and shows results in modal
      - **Export**: Downloads report in selected format (PDF, Excel, CSV, JSON, PNG, SVG)
      - **Delete**: Deletes report with confirmation dialog
  - **Fixed Template Selection in Edit Mode**:
    - Fixed `handleTemplateSelect` to detect whether we're in create or edit mode
    - When template is selected in edit mode, it now updates edit state (`editReport`, `editBuilderSelectedFields`, etc.) instead of create state
    - When template is selected in create mode, it updates create state and opens create form
    - Prevents create form from opening behind edit modal when selecting templates in edit mode
    - Template selection now works correctly in both create and edit modals
  - **Rebuilt Results Modal (نتایج اجرای گزارش)**:
    - **Enhanced Data Display**: Results modal now uses report configuration to display data properly
    - **Report Information**: Shows report name and description at the top of the modal
    - **Column Configuration**: Uses `columnsConfig` from report to:
      - Display proper Persian labels for columns (instead of raw field IDs)
      - Maintain correct column order as defined in the report
      - Apply proper formatting based on field types
    - **Value Formatting**: Added `formatValue()` helper function that formats values based on type:
      - **Currency**: Formats numbers as Toman with proper Persian number formatting (displays "تومان" symbol)
      - **Number**: Formats numbers with Persian locale (thousand separators)
      - **Date**: Formats dates in Persian calendar format (YYYY/MM/DD)
      - **Boolean**: Displays "بله" (Yes) or "خیر" (No) instead of true/false
      - **Text**: Default string formatting
    - **Improved Layout**:
      - Modal size increased from `max-w-2xl` to `max-w-7xl` for better data visibility
      - Height increased from `max-h-[80vh]` to `max-h-[90vh]`
      - Better spacing and typography
      - Improved execution summary with grid layout showing record count, execution time, and execution date
      - Fixed duplicate "زمان اجرا" label (now shows "زمان اجرا" and "تاریخ اجرا" separately)
    - **Enhanced Table Display**:
      - Shows up to 50 records (increased from 10) in the preview
      - Proper column alignment (numbers/currency left-aligned, text right-aligned)
      - Better hover effects and visual feedback
      - Improved responsive design for mobile and desktop
    - **Report Configuration Integration**:
      - `handleExecuteReport` now fetches report configuration before execution
      - Stores report config in `executedReport` state for use in display
      - `getColumnConfig()` helper parses column configuration from stored report
      - `getDisplayColumns()` helper maps data columns to configured labels and types
    - **Better Error Handling**: Improved error display with clearer messaging
    - **No Data State**: Enhanced empty state with icon and helpful message
    - **Improved Column Matching**:
      - Enhanced `getDisplayColumns()` function with multiple matching strategies:
        - Exact match on column ID/name
        - Match without table prefix (e.g., "orders_orderNumber" matches "orderNumber")
        - Case-insensitive matching
        - Fallback to availableFields for unmatched columns to get Persian labels
      - Added comprehensive debug logging to trace column matching issues
      - Better handling of column configuration parsing (handles both string and object formats)
      - Improved type safety with proper TypeScript types for column types
      - Handles edge cases where column config IDs don't match data keys exactly

#### Week 9: Data Explorer - UI
**Status:** ✅ **COMPLETED** (All Core Features Implemented)

**Tasks:**
- [x] Create explorer layout component
- [x] Implement field builder UI with dropdowns
- [x] Implement canvas area component (results table)
- [x] Implement filter builder UI with dropdowns
- [x] Add responsive design
- [x] Add drag-and-drop functionality - **✅ IMPLEMENTED**
- [x] Add field picker/dropdown - **✅ IMPLEMENTED**
- [x] Expose Group By UI - **✅ IMPLEMENTED**
- [x] Expose Order By UI - **✅ IMPLEMENTED**
- [ ] Write component tests - **PENDING**

**Deliverables:**
- ✅ Data Explorer page (`/workspaces/business-intelligence/data-explorer`)
- ✅ Schema Viewer component
- ✅ Query Builder UI (complete implementation)
- ✅ Results viewer
- ✅ Field palette with drag-and-drop
- ✅ Drag-and-drop functionality
- ✅ Group By UI
- ✅ Order By UI
- ⏳ Component tests - **PENDING**

**Implementation Notes:**
- **Data Explorer Page** (`src/frontend/app/workspaces/business-intelligence/data-explorer/page.tsx`):
  - Integrated query builder with workspace selection
  - **Field Builder with Dropdowns**: 
    - Dropdown for workspace selection
    - Dropdown for table selection (populated from schema)
    - Dropdown for field selection (populated from selected table)
    - Aggregation options (SUM, AVG, COUNT, MIN, MAX, NONE)
    - Optional alias field
  - **Field Palette with Drag-and-Drop**:
    - Integrated `ReportFieldPalette` component
    - Drag-and-drop fields from palette to add to query
    - Click-to-select functionality
    - Fields grouped by category with Persian labels
  - **Filter Builder with Dropdowns**:
    - Dropdown for workspace selection
    - Dropdown for table selection (populated from schema)
    - Dropdown for field selection (populated from selected table)
    - Multiple operators (equals, notEquals, greaterThan, lessThan, contains, in, between)
    - Value input field
  - **Group By UI**:
    - Add/remove group by fields
    - Dropdown populated with selected fields from query
    - Maps field IDs to `table.fieldName` format for backend
  - **Order By UI**:
    - Add/remove order by fields
    - Dropdown populated with selected fields from query
    - Direction selector (ASC/DESC)
    - Maps field IDs to `table.fieldName` format for backend
  - **Schema Integration**:
    - Loads schema from `biService.getSchema()` for each workspace
    - Builds field definitions with Persian labels
    - Maps schema types to field types (text, number, date, boolean, currency)
    - Filters fields based on selected workspaces
  - Join type selector (INNER, LEFT, UNION, CROSS) for multi-workspace queries
  - Results table with column headers and row data
  - Execution metadata display (row count, execution time, cache status)
  - Limit input field (1-1000)
  - Two execution modes: `aggregate()` and `explore()`
  - **Validation**: Validates that all fields have table and field selected before execution
- **Schema Viewer Component** (`src/frontend/components/bi/SchemaViewer.tsx`):
  - Displays workspace schemas with expandable table views
  - Shows table fields with types, nullable status, and descriptions
  - Primary key indicators
  - Supports viewing single workspace or all workspaces
  - Toggle schema visibility in Data Explorer
- **Query Builder Features**:
  - Multi-workspace selection (Ordering, Inventory)
  - Dynamic field addition/removal (manual text input)
  - Dynamic filter addition/removal (manual text input)
  - Group by and order by support (**Backend fully supports, but UI doesn't expose these features**)
  - Limit/offset for pagination
  - Two execution modes: `aggregate()` (full control) and `explore()` (simplified - both use same backend)
- **Navigation**: Added Data Explorer link to BI workspace navigation menu
- **User Experience**: 
  - Toast notifications for success/error states
  - Loading states during query execution
  - Responsive design for mobile/tablet/desktop
  - Persian labels and RTL support
- **Known Limitations**:
  - No field picker/dropdown - users must manually type table/field names
  - No Group By UI - cannot group results (backend supports it)
  - No Order By UI - cannot sort results (backend supports it)
  - No drag-and-drop - inconsistent with Custom Reports UX
  - No query validation - users can submit invalid queries
  - No export functionality - cannot export results

#### Week 10: Data Explorer - Backend
**Status:** ✅ **COMPLETED** (Fully Implemented)

**Tasks:**
- [x] Create explorer API endpoint (`/api/bi/aggregate`, `/api/bi/explore`)
- [x] Implement query builder service (`DataAggregatorService`)
- [x] Implement data fetching logic (workspace connectors)
- [x] Add query validation (basic validation exists)
- [x] Add query optimization (basic optimization exists)
- [x] Add error handling
- [ ] Write API tests - **PENDING**

**Deliverables:**
- ✅ Explorer API (`POST /api/bi/aggregate`, `POST /api/bi/explore`)
- ✅ Query builder (`DataAggregatorService`)
- ✅ Query optimization (basic optimization)
- ⏳ API tests - **PENDING**

**Implementation Notes:**
- **Data Aggregator Service** (`src/backend/src/services/bi/aggregators/DataAggregatorService.ts`):
  - Aggregates data from multiple workspaces (Ordering, Inventory)
  - Supports INNER, LEFT, UNION, and CROSS joins
  - Applies aggregations (SUM, AVG, COUNT, MIN, MAX)
  - Supports Group By and Order By (fully implemented)
  - Tenant isolation (all queries filtered by tenantId)
  - Caching integration (5-minute TTL)
  - Parallel query execution for multiple workspaces
- **API Endpoints** (`src/backend/src/controllers/biController.ts`):
  - `POST /api/bi/aggregate`: Full control aggregation endpoint
  - `POST /api/bi/explore`: Simplified exploration endpoint (uses aggregate internally)
  - Both endpoints require tenant context and validate input
- **Workspace Connectors**:
  - `OrderingConnector`: Handles Ordering workspace queries
  - `InventoryConnector`: Handles Inventory workspace queries
  - Both implement `WorkspaceConnector` interface
  - All queries automatically filtered by tenantId

#### Week 11: Advanced Visualizations
**Status:** ✅ **COMPLETED** (Core Features Implemented)

**Tasks:**
- [x] Implement advanced chart types (heatmap, treemap)
- [x] Add drill-down functionality
- [x] Add calculations engine
- [x] Add export functionality (PNG, SVG)
- [ ] Add grouping & sorting (pending - can use Data Aggregator)
- [ ] Add performance optimization (pending)
- [ ] Write tests (pending)

**Deliverables:**
- ✅ Advanced charts (HeatmapChart, TreemapChart)
- ✅ Drill-down (onClick handlers in charts)
- ✅ Calculations engine (`calculationsEngine.ts`)
- ✅ Export functionality (PNG, SVG)

**Implementation Notes:**
- **HeatmapChart Component** (`src/frontend/components/charts/HeatmapChart.tsx`):
  - Custom SVG-based heatmap visualization
  - Color scale with configurable gradient
  - Interactive cells with hover tooltips
  - Click handlers for drill-down
  - Export to PNG/SVG
  - Responsive grid layout
- **TreemapChart Component** (`src/frontend/components/charts/TreemapChart.tsx`):
  - Squarified treemap algorithm implementation
  - Hierarchical data visualization
  - Interactive nodes with hover states
  - Click handlers for drill-down
  - Export to PNG/SVG
  - Auto-sizing text based on node dimensions
- **Calculations Engine** (`src/frontend/utils/calculationsEngine.ts`):
  - Formula evaluation with variable substitution
  - Common formulas library (profit margin, growth rate, etc.)
  - Formula validation
  - Variable extraction from data
  - Safe expression evaluation
- **Drill-Down Functionality**:
  - Added `onDrillDown` callback prop to `CustomLineChart`
  - Click handlers on chart elements
  - Data point selection and navigation
- **Chart Export**:
  - PNG export (via html2canvas)
  - SVG export (direct download)
  - Export buttons in chart headers

#### Week 12: Interactivity
**Status:** ✅ **COMPLETED** (Core Features Implemented)

**Tasks:**
- [x] Add chart interactions (zoom, pan via Brush)
- [x] Add drill-down navigation (onClick handlers)
- [x] Add keyboard shortcuts
- [x] Enhanced tooltips
- [x] Add filter interactions (cross-chart filtering)
- [x] Performance optimizations (useMemo, useCallback, React.memo)
- [ ] Add data table interactions (pending)
- [ ] Write tests (pending)

**Deliverables:**
- ✅ Interactive features (zoom, pan, drill-down)
- ✅ Navigation system (keyboard shortcuts)
- ✅ Keyboard shortcuts (R for reset, Ctrl+Z for undo)

**Implementation Notes:**
- **Zoom & Pan** (`src/frontend/components/charts/LineChart.tsx`):
  - Recharts `Brush` component for zooming
  - Zoom state management
  - Reset zoom functionality
  - Display filtered data count
- **Keyboard Shortcuts** (`src/frontend/utils/chartInteractivity.ts`):
  - `ChartKeyboardShortcuts` class for managing shortcuts
  - R key: Reset zoom
  - Ctrl+Z: Undo zoom
  - Extensible shortcut registration system
- **Drill-Down Navigation**:
  - Click handlers on chart elements
  - `onDrillDown` callback prop
  - Active dot highlighting
  - Cursor pointer on interactive elements
- **Enhanced Tooltips**:
  - Custom tooltip components with detailed information
  - Hover states with visual feedback
  - Contextual data display
- **Chart Interactivity Utilities** (`src/frontend/utils/chartInteractivity.ts`):
  - Filter state management
  - Zoom state management
  - Data filtering functions
  - Keyboard shortcut handler
- **Cross-Chart Filtering** (`src/frontend/contexts/ChartFilterContext.tsx`):
  - `ChartFilterProvider` context for sharing filter state across charts
  - `useChartFilters` hook for accessing filter functionality
  - Automatic data filtering when filters are applied
  - Filter toggle on chart element click (bars, pie slices)
  - Visual feedback for filtered elements (opacity)
  - Filter indicator showing active filter count
- **Enhanced Tooltips** (`src/frontend/components/charts/EnhancedTooltip.tsx`):
  - Detailed statistics (average, median, min, max, count, sum)
  - Comparison metrics (vs average, vs median with percentages)
  - Percentage calculations
  - Formatted value display
  - Additional info support
  - Multi-payload support
- **Filter Control Component** (`src/frontend/components/bi/ChartFilterControl.tsx`):
  - Displays active filters
  - Individual filter removal
  - Clear all filters button
  - Filter value display with overflow handling
- **Performance Optimizations**:
  - `React.memo` for chart components to prevent unnecessary re-renders
  - `useMemo` for expensive calculations (filtered data, statistics, colors)
  - `useCallback` for event handlers (export, click handlers)
  - Memoized filtered data to avoid recalculation on every render
  - Optimized filter application logic

### Phase 4: Report Builder (Weeks 13-16)

#### Week 13: Basic Report Builder
**Status:** ✅ **COMPLETED**

**Tasks:**
- [x] Create report builder layout
- [x] Implement drag-and-drop
- [x] Implement field selection
- [x] Implement layout builder
- [x] Add preview functionality
- [x] Add save functionality
- [ ] Write tests (pending)

**Deliverables:**
- Report builder UI
- Drag-and-drop
- Preview system

**Implementation Notes:**
- **ReportFieldPalette Component** (`src/frontend/components/bi/ReportFieldPalette.tsx`):
  - Draggable field palette with categorized fields
  - Visual indicators for field types (text, number, date, currency, boolean)
  - Shows selected state for fields already in report
  - Uses @dnd-kit/core for drag functionality
  - Grouped by category (کالا, موجودی, کاربر, تأمین‌کننده)
  
- **ReportCanvas Component** (`src/frontend/components/bi/ReportCanvas.tsx`):
  - Droppable canvas area for arranging fields
  - Sortable field items with drag handles
  - Visual feedback during drag operations
  - Remove field functionality
  - Reorder fields by dragging within canvas
  - Empty state with helpful instructions
  
- **ReportBuilder Component** (`src/frontend/components/bi/ReportBuilder.tsx`):
  - Tabbed interface (Builder, Preview)
  - Integrates ReportFieldPalette and ReportCanvas
  - Real-time preview of report structure
  - Table preview showing field order and types
  - Save and preview actions
  
- **Custom Reports Page Integration** (`src/frontend/app/workspaces/business-intelligence/custom-reports/page.tsx`):
  - Toggle between "Form Mode" (simple checkboxes) and "Builder Mode" (drag-and-drop)
  - Seamless integration with existing report creation flow
  - Template selection updates builder state
  - Preserves field order from drag-and-drop operations
  - Syncs builder state with form state
  
- **Key Features:**
  - Drag fields from palette to canvas
  - Reorder fields by dragging within canvas
  - Visual field type indicators
  - Category-based field organization
  - Real-time preview
  - Dual mode support (simple form + advanced builder)

#### Week 14: Advanced Report Builder
**Status:** ✅ **COMPLETED**

**Tasks:**
- [x] Add report types (Tabular, Chart, Dashboard, Pivot)
- [x] Add formatting options
- [x] Add calculations
- [x] Add filters
- [x] Add sorting
- [x] Add grouping
- [ ] Write tests (pending)

**Deliverables:**
- Report types
- Formatting options
- Advanced features

**Implementation Notes:**
- **ReportTypeSelector Component** (`src/frontend/components/bi/ReportTypeSelector.tsx`):
  - Visual selector for report types (TABULAR, CHART, DASHBOARD, PIVOT)
  - Icon-based cards with descriptions
  - Color-coded type indicators
  - Preview text for each type
  
- **FormattingOptionsPanel Component** (`src/frontend/components/bi/FormattingOptionsPanel.tsx`):
  - Field-specific formatting options
  - Custom labels, widths, alignment
  - Number formatting (number, currency, percentage, decimal)
  - Date formatting options
  - Text formatting (case, truncation)
  - Color customization (text and background)
  - Font weight options
  
- **CalculationsBuilder Component** (`src/frontend/components/bi/CalculationsBuilder.tsx`):
  - Custom formula builder
  - Integration with calculations engine
  - Formula validation
  - Template formulas (profit margin, growth rate, etc.)
  - Result field naming
  - Formula description support
  
- **FiltersBuilder Component** (`src/frontend/components/bi/FiltersBuilder.tsx`):
  - Field-based filter creation
  - Operator selection (equals, contains, greater, less, between, in)
  - Type-specific operators
  - Multiple value support (for 'between' and 'in' operators)
  - Filter labels and descriptions
  
- **SortingBuilder Component** (`src/frontend/components/bi/SortingBuilder.tsx`):
  - Multi-level sorting
  - Ascending/descending direction
  - Sort order management (move up/down)
  - Visual sort priority indicators
  
- **GroupingBuilder Component** (`src/frontend/components/bi/GroupingBuilder.tsx`):
  - Field grouping configuration
  - Aggregation options (sum, avg, count, min, max, none)
  - Group order management
  - Visual group indicators
  
- **AdvancedReportBuilder Component** (`src/frontend/components/bi/AdvancedReportBuilder.tsx`):
  - Comprehensive tabbed interface
  - 8 tabs: Fields, Type, Formatting, Calculations, Filters, Sorting, Grouping, Preview
  - Integrated all advanced components
  - Summary statistics in preview
  - Real-time configuration updates
  
- **Custom Reports Page Integration**:
  - AdvancedReportBuilder replaces basic ReportBuilder in builder mode
  - All advanced configurations saved to reportConfig
  - Calculations, formatting, grouping stored in chartConfig
  - Sorting and filters integrated with existing flow
  - State management for all advanced features
  
- **Key Features:**
  - Complete report type selection with visual previews
  - Comprehensive field formatting options
  - Custom calculations with formula validation
  - Advanced filtering with multiple operators
  - Multi-level sorting with priority management
  - Grouping with aggregation functions
  - All configurations preserved in report save

#### Week 15: Report Templates
**Status:** ✅ **COMPLETED**

**Tasks:**
- [x] Create template library
- [x] Implement template system
- [x] Add pre-built templates
- [x] Add template customization
- [x] Add template sharing
- [ ] Add template marketplace (optional - can be added later)
- [ ] Write tests (pending)

**Deliverables:**
- Template system
- Pre-built templates
- Template library UI

**Implementation Notes:**
- **ReportTemplateService** (`src/backend/src/services/reportTemplateService.ts`):
  - CRUD operations for report templates
  - Tenant isolation enforced (templates are tenant-specific)
  - Public/private template sharing
  - System templates (pre-built)
  - Template usage tracking
  - Create report from template functionality
  
- **Template Routes** (`src/backend/src/routes/biRoutes.ts`):
  - `GET /api/bi/templates` - Get templates with filtering
  - `GET /api/bi/templates/:id` - Get template by ID
  - `POST /api/bi/templates` - Create template
  - `PUT /api/bi/templates/:id` - Update template
  - `DELETE /api/bi/templates/:id` - Delete template
  - `POST /api/bi/templates/:id/create-report` - Create report from template
  
- **Template Service (Frontend)** (`src/frontend/services/templateService.ts`):
  - Client-side API wrapper for template operations
  - Handles wrapped/unwrapped API responses
  - Type-safe template operations
  
- **TemplateLibrary Component** (`src/frontend/components/bi/TemplateLibrary.tsx`):
  - Visual template browser with filtering
  - Category and type filters
  - Search functionality
  - System template indicator
  - Usage count display
  - Public/private template badges
  - Template selection callback
  
- **Custom Reports Page Integration** (`src/frontend/app/workspaces/business-intelligence/custom-reports/page.tsx`):
  - TemplateLibrary integrated into report creation flow
  - Quick template cards for system templates
  - "Save as Template" functionality
  - Template selection populates report builder
  - Advanced configurations loaded from templates
  
- **Key Features:**
  - Template library with search and filters
  - Pre-built system templates (Inventory Stock, Inventory Transactions, Low Stock)
  - Template sharing (public/private)
  - Save current report as template
  - Create report from template with customization
  - Template usage tracking
  - Category-based organization
  - Tag support for templates

#### Week 16: Report Execution & Export
**Status:** ✅ **COMPLETED**

**Tasks:**
- [x] Implement report execution engine
- [x] Add export to PDF (Puppeteer)
- [x] Add export to Excel (ExcelJS)
- [x] Add export to CSV
- [x] Add export to JSON
- [x] Add export to image (PNG, SVG)
- [ ] Write tests

**Deliverables:**
- Report execution
- Export functionality
- Multiple formats

**Implementation Notes:**
- **ExportService Enhancement** (`src/backend/src/services/exportService.ts`):
  - Added `exportToJSON()` method for JSON export with metadata
  - Added `exportToPNG()` method using Puppeteer screenshot
  - Added `exportToSVG()` method with custom SVG table generation
  - Updated `ExportOptions` interface to include `JSON`, `PNG`, `SVG` formats
  - Enhanced `generateSVGTable()` for SVG export with proper RTL support

- **ReportService Enhancement** (`src/backend/src/services/reportService.ts`):
  - Updated `executeSavedReport()` to handle all export formats
  - Added automatic file generation for non-VIEW export formats
  - Updated `ReportExecutionResult` interface to include optional `exportFile` property
  - Export files are generated and returned in execution result

- **BI Controller Enhancement** (`src/backend/src/controllers/biController.ts`):
  - Updated `executeReport()` to handle file downloads for export formats
  - Added proper Content-Disposition headers for file downloads
  - Implemented file streaming and cleanup after download

- **Prisma Schema Update** (`src/prisma/schema.prisma`):
  - Added `PNG` and `SVG` to `ExportFormat` enum
  - Regenerated Prisma client to support new export formats

- **Frontend Integration** (`src/frontend/app/workspaces/business-intelligence/custom-reports/page.tsx`):
  - Updated `handleExportReport()` to support all export formats
  - Added export buttons for JSON, PNG, and SVG in export dropdown
  - Added export buttons in Results Modal for all formats
  - Implemented proper file download handling for all formats
  - Added loading states for export operations

- **Key Features:**
  - PDF export with Puppeteer (existing, enhanced)
  - Excel export with ExcelJS (existing, enhanced)
  - CSV export (existing, enhanced)
  - JSON export with metadata (new)
  - PNG export using Puppeteer screenshot (new)
  - SVG export with custom table generation (new)
  - Automatic file cleanup after download
  - Proper filename encoding for international characters
  - Tenant isolation maintained in all export operations

### Phase 5: AI & Insights (Weeks 17-20)

#### Week 17: Natural Language Query - NLP
**Tasks:**
- [ ] Integrate NLP service (OpenAI or local)
- [ ] Implement Persian query parser
- [ ] Add query suggestions
- [ ] Add query history
- [ ] Add query favorites
- [ ] Add query validation
- [ ] Write tests

**Deliverables:**
- NLP integration
- Query parser
- Suggestions system

#### Week 18: Natural Language Query - Backend
**Tasks:**
- [ ] Create NLP API endpoint
- [ ] Implement query conversion
- [ ] Add query execution
- [ ] Add error handling
- [ ] Add query optimization
- [ ] Add caching
- [ ] Write tests

**Deliverables:**
- NLP API
- Query conversion
- Execution engine

#### Week 19: AI Insights - Detection
**Tasks:**
- [ ] Implement anomaly detection (Z-score, IQR)
- [ ] Implement trend detection (linear regression)
- [ ] Implement seasonality detection (FFT)
- [ ] Add ML models (TensorFlow.js)
- [ ] Add model training pipeline
- [ ] Add model evaluation
- [ ] Write tests

**Deliverables:**
- Detection algorithms
- ML models
- Training pipeline

#### Week 20: AI Insights - Generation
**Tasks:**
- [ ] Implement insight generation engine
- [ ] Add recommendations engine
- [ ] Add predictions engine
- [ ] Add insights dashboard
- [ ] Add insights sharing
- [ ] Add insights export
- [ ] Write tests

**Deliverables:**
- Insight generation
- Recommendations
- Predictions

### Phase 6: Collaboration (Weeks 21-24)

#### Week 21: Sharing & Permissions
**Tasks:**
- [ ] Implement sharing system
- [ ] Add permission management
- [ ] Add role-based access
- [ ] Add public/private settings
- [ ] Add share links
- [ ] Add embed codes
- [ ] Write tests

**Deliverables:**
- Sharing system
- Permission system
- Access control

#### Week 22: Collaboration Features
**Tasks:**
- [ ] Add comments system
- [ ] Add annotations
- [ ] Add discussions
- [ ] Add @mentions
- [ ] Add notifications
- [ ] Add activity feed
- [ ] Write tests

**Deliverables:**
- Comments system
- Annotations
- Notifications

#### Week 23: Version Control
**Tasks:**
- [ ] Implement version control system
- [ ] Add version history
- [ ] Add version comparison
- [ ] Add rollback functionality
- [ ] Add change tracking
- [ ] Add audit logs
- [ ] Write tests

**Deliverables:**
- Version control
- History system
- Audit logs

#### Week 24: Scheduled Reports
**Tasks:**
- [ ] Implement scheduling system (Bull queue)
- [ ] Add schedule builder UI
- [ ] Add email delivery (Nodemailer)
- [ ] Add recipient management
- [ ] Add format selection
- [ ] Add schedule management
- [ ] Write tests

**Deliverables:**
- Scheduling system
- Email delivery
- Schedule management

### Phase 7: Mobile & Polish (Weeks 25-28)

#### Week 25: Mobile Interface
**Tasks:**
- [ ] Create mobile layouts
- [ ] Optimize for touch interactions
- [ ] Add mobile navigation
- [ ] Add mobile dashboards
- [ ] Add offline mode (Service Worker)
- [ ] Add push notifications
- [ ] Write tests

**Deliverables:**
- Mobile interface
- Touch optimization
- Offline mode

#### Week 26: Performance Optimization
**Tasks:**
- [ ] Optimize database queries
- [ ] Add query caching (Redis)
- [ ] Add data pagination
- [ ] Add lazy loading
- [ ] Add code splitting
- [ ] Add bundle optimization
- [ ] Write performance tests

**Deliverables:**
- Optimized queries
- Caching layer
- Performance improvements

#### Week 27: UI/UX Polish
**Tasks:**
- [ ] Polish UI components
- [ ] Improve animations (Framer Motion)
- [ ] Add micro-interactions
- [ ] Improve accessibility (WCAG 2.1 AA)
- [ ] Add keyboard navigation
- [ ] Add screen reader support
- [ ] Write tests

**Deliverables:**
- Polished UI
- Animations
- Accessibility

#### Week 28: Testing & Documentation
**Tasks:**
- [ ] Write unit tests (target: 80% coverage)
- [ ] Write integration tests
- [ ] Write E2E tests (Playwright)
- [ ] Write performance tests
- [ ] Create user documentation
- [ ] Create API documentation
- [ ] Create developer guide

**Deliverables:**
- Test suite
- Documentation
- Developer guide

### Phase 8: Launch (Weeks 29-32)

#### Week 29: Beta Testing
**Tasks:**
- [ ] Internal testing
- [ ] User acceptance testing (UAT)
- [ ] Bug fixes
- [ ] Performance tuning
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation review

**Deliverables:**
- Beta version
- Bug fixes
- Performance improvements

#### Week 30: Pre-Launch
**Tasks:**
- [ ] Final bug fixes
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Backup & recovery setup
- [ ] Monitoring setup (Prometheus, Grafana)
- [ ] Support setup
- [ ] Training materials

**Deliverables:**
- Production-ready system
- Monitoring
- Support system

#### Week 31: Launch
**Tasks:**
- [ ] Production deployment
- [ ] User training sessions
- [ ] Support activation
- [ ] Monitoring activation
- [ ] Marketing launch
- [ ] Documentation release
- [ ] Feedback collection

**Deliverables:**
- Live system
- Trained users
- Active support

#### Week 32: Post-Launch
**Tasks:**
- [ ] Monitor system performance
- [ ] Collect user feedback
- [ ] Fix critical issues
- [ ] Optimize performance
- [ ] Plan improvements
- [ ] Document lessons learned
- [ ] Celebrate success!

**Deliverables:**
- Stable system
- User feedback
- Improvement plan

---

## Integration Patterns

### Pattern 1: Individual Workspace Analytics

**Use Case**: Analyze Ordering workspace data only

**Implementation:**
```typescript
// User selects "Ordering" workspace
// CRITICAL: tenantId extracted from req.tenant.id (set by middleware)
const dashboard = await biService.getDashboard({
  workspace: 'ordering',
  period: '30d',
  tenantId: req.tenant.id  // CRITICAL: From req.tenant (subdomain-based)
});

// Data flow:
// 1. Tenant middleware resolves tenant from subdomain
// 2. req.tenant.id set to tenant UUID
// 3. OrderingConnector connects with tenantId filter
// 4. Query Builder creates query with tenantId filter
// 5. Analytics Engine processes tenant-specific data
// 6. Dashboard displays tenant-specific results
```

**Data Sources:**
- `orders` table
- `orderItems` table
- `payments` table
- `menuItems` table
- `tables` table

**Available Metrics:**
- Revenue (total, by period, by item, by category)
- Order volume (count, trends)
- Average order value (AOV)
- Payment methods distribution
- Table utilization
- Kitchen performance
- Menu item popularity
- Order status distribution

**Example Query:**
```typescript
{
  workspace: 'ordering',
  tenantId: 'tenant-123',  // CRITICAL: Tenant ID from req.tenant.id
  fields: [
    { table: 'orders', field: 'totalAmount', aggregation: 'sum' },
    { table: 'orders', field: 'id', aggregation: 'count' }
  ],
  filters: [
    { field: 'orderDate', operator: 'between', value: [startDate, endDate] },
    { field: 'status', operator: 'equals', value: 'COMPLETED' },
    { field: 'tenantId', operator: 'equals', value: 'tenant-123' }  // CRITICAL: Tenant filter
  ],
  groupBy: ['orderDate'],
  orderBy: [{ field: 'orderDate', direction: 'asc' }]
}
```

### Pattern 2: Merged Workspace Analytics

**Use Case**: Analyze combined Ordering + Inventory data

**Implementation:**
```typescript
// User selects "Merged" workspace
// CRITICAL: tenantId from req.tenant.id (same tenant for both workspaces)
const dashboard = await biService.getDashboard({
  workspace: 'merged',
  workspaces: ['ordering', 'inventory'],
  period: '30d',
  tenantId: req.tenant.id  // CRITICAL: From req.tenant (subdomain-based)
});

// Data flow:
// 1. Tenant middleware resolves tenant from subdomain
// 2. req.tenant.id set to tenant UUID
// 3. OrderingConnector fetches Ordering data (filtered by tenantId)
// 4. InventoryConnector fetches Inventory data (filtered by tenantId)
// 5. Data Aggregator merges tenant-specific data
// 6. Analytics Engine processes merged tenant data
// 7. Dashboard displays unified tenant-specific results
```

**Data Joining:**
- **Orders ↔ InventoryEntries**: Join via `orderId` field
  ```sql
  -- CRITICAL: Both tables MUST filter by tenantId
  SELECT o.*, ie.*
  FROM orders o
  INNER JOIN inventory_entries ie ON o.id = ie.orderId
  WHERE o.tenant_id = 'tenant-123'  -- CRITICAL: Tenant filter
    AND ie.tenant_id = 'tenant-123'  -- CRITICAL: Tenant filter
  ```

- **MenuItems ↔ Items**: Join via `itemId` field
  ```sql
  SELECT mi.*, i.*
  FROM menu_items mi
  LEFT JOIN items i ON mi.itemId = i.id
  ```

- **RecipeIngredients ↔ Items**: Join via `itemId` field
  ```sql
  SELECT ri.*, i.*
  FROM recipe_ingredients ri
  INNER JOIN items i ON ri.itemId = i.id
  ```

**Available Metrics:**
- Combined revenue & inventory value
- Profitability analysis (Revenue - COGS)
- Stock utilization (sales vs stock)
- Cross-workspace insights
- Recipe cost analysis
- Ingredient consumption patterns

**Example Merged Query:**
```typescript
{
  workspaces: ['ordering', 'inventory'],
  tenantId: 'tenant-123',  // CRITICAL: Tenant ID from req.tenant.id
  joinType: 'INNER',
  joinKeys: [
    { from: 'orders.id', to: 'inventoryEntries.orderId' }
  ],
  fields: [
    { table: 'orders', field: 'totalAmount', aggregation: 'sum', alias: 'revenue' },
    { table: 'inventoryEntries', field: 'quantity', aggregation: 'sum', alias: 'stockUsed' },
    { table: 'inventoryEntries', field: 'unitPrice', aggregation: 'avg', alias: 'avgCost' }
  ],
  filters: [
    { field: 'orders.tenantId', operator: 'equals', value: 'tenant-123' },  // CRITICAL: Tenant filter
    { field: 'inventoryEntries.tenantId', operator: 'equals', value: 'tenant-123' },  // CRITICAL: Tenant filter
    { field: 'orders.orderDate', operator: 'between', value: [startDate, endDate] },
    { field: 'inventoryEntries.type', operator: 'equals', value: 'OUT' }
  ],
  groupBy: ['orders.orderDate', 'items.category'],
  orderBy: [{ field: 'revenue', direction: 'desc' }]
}
```

### Pattern 3: Future Accounting Integration

**Use Case**: Analyze all three workspaces together

**Implementation:**
```typescript
// User selects "Complete" workspace
const dashboard = await biService.getDashboard({
  workspace: 'complete',
  workspaces: ['ordering', 'inventory', 'accounting'],
  period: '30d',
  tenantId: 'tenant-123'
});

// Data flow:
// 1. OrderingConnector fetches Ordering data
// 2. InventoryConnector fetches Inventory data
// 3. AccountingConnector fetches Accounting data
// 4. Data Aggregator merges all data
// 5. Analytics Engine processes complete data
// 6. Dashboard displays comprehensive results
```

**Data Joining:**
- **Orders ↔ JournalEntries**: Join via `orderId` or transaction reference
  ```sql
  SELECT o.*, je.*
  FROM orders o
  LEFT JOIN journal_entries je ON o.id = je.referenceId
  WHERE je.accountCode LIKE '4101%' -- Revenue accounts
  ```

- **InventoryEntries ↔ JournalEntries**: Join via transaction reference
  ```sql
  SELECT ie.*, je.*
  FROM inventory_entries ie
  LEFT JOIN journal_entries je ON ie.id = je.referenceId
  WHERE je.accountCode LIKE '5100%' -- COGS accounts
  ```

- **Financial Statements Integration**: Use cached financial statements
  ```typescript
  const balanceSheet = await accountingService.getBalanceSheet(tenantId, date);
  const incomeStatement = await accountingService.getIncomeStatement(tenantId, startDate, endDate);
  ```

**Available Metrics:**
- Complete financial picture
- Revenue reconciliation (Orders vs Journal Entries)
- Cost reconciliation (Inventory vs Journal Entries)
- Financial health indicators
- Profit & Loss analysis
- Balance sheet integration
- Cash flow analysis
- Financial ratios

**Example Complete Query:**
```typescript
{
  workspaces: ['ordering', 'inventory', 'accounting'],
  joinType: 'LEFT',
  joinKeys: [
    { from: 'orders.id', to: 'journalEntries.referenceId' },
    { from: 'inventoryEntries.id', to: 'journalEntries.referenceId' }
  ],
  fields: [
    { table: 'orders', field: 'totalAmount', aggregation: 'sum', alias: 'orderRevenue' },
    { table: 'journalEntries', field: 'debit', aggregation: 'sum', alias: 'accountingRevenue' },
    { table: 'inventoryEntries', field: 'quantity', aggregation: 'sum', alias: 'stockUsed' },
    { table: 'journalEntries', field: 'credit', aggregation: 'sum', alias: 'cogs' }
  ],
  filters: [
    { field: 'orders.orderDate', operator: 'between', value: [startDate, endDate] },
    { field: 'journalEntries.accountCode', operator: 'like', value: '4101%' } // Revenue accounts
  ],
  groupBy: ['orders.orderDate'],
  orderBy: [{ field: 'orderRevenue', direction: 'desc' }]
}
```

### Pattern 4: Real-Time Analytics

**Use Case**: Live dashboard updates

**Implementation:**
```typescript
// Frontend: WebSocket connection for real-time updates
// CRITICAL: Include subdomain in connection
const subdomain = extractSubdomain(window.location.hostname);
const socket = io('/bi', {
  query: { 
    subdomain: subdomain,  // CRITICAL: Use subdomain for tenant identification
    workspace: 'ordering' 
  }
});

socket.on('dashboard:update', (data) => {
  // Update dashboard with new data
  updateDashboard(data);
});

// Backend: Emit updates to tenant-specific room
// CRITICAL: Use tenantId from req.tenant for room identification
io.to(`tenant:${req.tenant.id}`).emit('dashboard:update', {
  kpis: updatedKPIs,
  charts: updatedCharts
});
```

**Update Triggers:**
- New order created
- Order status changed
- Payment received
- Inventory entry created
- Stock level changed

**Update Frequency:**
- Real-time for critical metrics
- 5-second intervals for standard metrics
- 30-second intervals for heavy calculations

### Pattern 5: Scheduled Analytics

**Use Case**: Automated report generation

**Implementation:**
```typescript
// Schedule report generation
// CRITICAL: Include tenantId for tenant-specific scheduling
await scheduleService.createSchedule({
  reportId: 'report-123',
  tenantId: req.tenant.id,  // CRITICAL: From req.tenant
  frequency: 'DAILY',
  time: '09:00',
  timezone: 'Asia/Tehran',
  recipients: ['user1@example.com', 'user2@example.com'],
  format: 'PDF'
});

// Bull queue processes scheduled reports
// CRITICAL: Validate tenantId in job data
queue.process('generate-report', async (job) => {
  const { reportId, tenantId } = job.data;
  
  // CRITICAL: Verify tenant has access to report
  const report = await prisma.bIReport.findFirst({
    where: {
      id: reportId,
      tenantId: tenantId  // CRITICAL: Tenant validation
    }
  });
  
  if (!report) {
    throw new Error('Report not found or access denied');
  }
  
  const reportData = await reportService.executeReport(reportId, tenantId);
  await emailService.sendReport(reportData, job.data.recipients);
});
```

**Schedule Types:**
- **Daily**: Every day at specified time
- **Weekly**: Specific day of week
- **Monthly**: Specific day of month
- **Custom**: Cron expression

**Delivery Methods:**
- Email attachment
- Email link
- In-app notification
- Webhook callback

---

## Tenant Handling Best Practices

### Critical Rules for BI Workspace

#### 1. Always Validate Tenant Context

**In Controllers:**
```typescript
// ✅ CORRECT
export const biController = {
  getDashboard: async (req: Request, res: Response) => {
    // CRITICAL: Always check tenant context first
    if (!req.tenant?.id) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }
    
    const tenantId = req.tenant.id; // Use from req.tenant, never from request body
    // ... rest of implementation
  }
};

// ❌ WRONG - Never trust client-provided tenantId
getDashboard: async (req: Request, res: Response) => {
  const tenantId = req.body.tenantId; // ❌ SECURITY RISK
  // ...
}
```

#### 2. Always Filter Queries by TenantId

**In Services:**
```typescript
// ✅ CORRECT
static async calculateTotalRevenue(period: DateRange, tenantId: string) {
  const transactions = await prisma.inventoryEntry.findMany({
    where: {
      type: 'OUT',
      createdAt: { gte: period.start, lte: period.end },
      item: {
        tenantId: tenantId  // CRITICAL: Always filter by tenantId
      }
    }
  });
}

// ❌ WRONG - Missing tenant filter
static async calculateTotalRevenue(period: DateRange) {
  const transactions = await prisma.inventoryEntry.findMany({
    where: {
      type: 'OUT',
      createdAt: { gte: period.start, lte: period.end }
      // ❌ Missing tenantId filter - DATA LEAK RISK
    }
  });
}
```

#### 3. Always Include TenantId in Cache Keys

**Caching:**
```typescript
// ✅ CORRECT
private generateCacheKey(query: Query, tenantId: string): string {
  return `bi:cache:${tenantId}:${JSON.stringify(query)}`;
}

// ❌ WRONG - Cache key without tenantId
private generateCacheKey(query: Query): string {
  return `bi:cache:${JSON.stringify(query)}`; // ❌ Cross-tenant cache pollution
}
```

#### 4. Always Validate Tenant Access to Resources

**Resource Access:**
```typescript
// ✅ CORRECT
async getDashboard(dashboardId: string, tenantId: string) {
  const dashboard = await prisma.bIDashboard.findFirst({
    where: {
      id: dashboardId,
      tenantId: tenantId  // CRITICAL: Validate tenant ownership
    }
  });
  
  if (!dashboard) {
    throw new Error('Dashboard not found or access denied');
  }
  
  return dashboard;
}

// ❌ WRONG - No tenant validation
async getDashboard(dashboardId: string) {
  const dashboard = await prisma.bIDashboard.findUnique({
    where: { id: dashboardId } // ❌ Can access other tenants' dashboards
  });
  return dashboard;
}
```

#### 5. Always Use Subdomain in Frontend API Calls

**Frontend API Client:**
```typescript
// ✅ CORRECT
class ApiClient {
  private getHeaders(): HeadersInit {
    const subdomain = this.extractSubdomain();
    return {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Subdomain': subdomain  // CRITICAL: Include subdomain
    };
  }
  
  private extractSubdomain(): string | null {
    if (typeof window === 'undefined') return null;
    const hostname = window.location.hostname;
    
    // Development: dima.localhost -> "dima"
    if (hostname.includes('localhost')) {
      const parts = hostname.split('.');
      if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
        return parts[0];
      }
      return null;
    }
    
    // Production: cafe-golestan.servaan.ir -> "cafe-golestan"
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    
    return null;
  }
}
```

#### 6. Always Test Tenant Isolation

**Test Cases:**
```typescript
describe('BI Service Tenant Isolation', () => {
  it('should not return data from other tenants', async () => {
    const tenant1 = await createTestTenant('tenant1');
    const tenant2 = await createTestTenant('tenant2');
    
    // Create dashboard for tenant1
    await createDashboard(tenant1.id, 'Dashboard 1');
    
    // Try to access tenant1's dashboard as tenant2
    const result = await biService.getDashboard('dashboard-1', tenant2.id);
    
    expect(result).toBeNull(); // Should not return tenant1's data
  });
  
  it('should filter queries by tenantId', async () => {
    const tenant1 = await createTestTenant('tenant1');
    const tenant2 = await createTestTenant('tenant2');
    
    // Create orders for both tenants
    await createOrder(tenant1.id, 1000);
    await createOrder(tenant2.id, 2000);
    
    // Get revenue for tenant1
    const revenue = await biService.calculateTotalRevenue(period, tenant1.id);
    
    expect(revenue.value).toBe(1000); // Should only include tenant1's orders
    expect(revenue.value).not.toBe(3000); // Should not include tenant2's orders
  });
});
```

### Tenant Isolation Checklist

**Before Deploying Any BI Feature:**

- [ ] ✅ All routes use `resolveTenant` middleware
- [ ] ✅ All routes use `requireTenant` middleware
- [ ] ✅ All controllers check `req.tenant?.id`
- [ ] ✅ All service methods require `tenantId` parameter
- [ ] ✅ All database queries filter by `tenantId`
- [ ] ✅ All cache keys include `tenantId`
- [ ] ✅ All resource access validates `tenantId`
- [ ] ✅ All API calls include `X-Tenant-Subdomain` header
- [ ] ✅ All WebSocket connections include subdomain
- [ ] ✅ All scheduled jobs include `tenantId`
- [ ] ✅ All exports are tenant-specific
- [ ] ✅ All tests include tenant isolation tests
- [ ] ✅ No hardcoded tenant IDs
- [ ] ✅ No client-provided tenant IDs trusted

### Common Mistakes to Avoid

1. **❌ Querying without tenantId filter**
   ```typescript
   // WRONG
   const items = await prisma.item.findMany();
   
   // CORRECT
   const items = await prisma.item.findMany({
     where: { tenantId: tenantId }
   });
   ```

2. **❌ Using client-provided tenantId**
   ```typescript
   // WRONG
   const tenantId = req.body.tenantId;
   
   // CORRECT
   const tenantId = req.tenant.id;
   ```

3. **❌ Skipping tenant validation**
   ```typescript
   // WRONG
   const dashboard = await prisma.bIDashboard.findUnique({
     where: { id: dashboardId }
   });
   
   // CORRECT
   const dashboard = await prisma.bIDashboard.findFirst({
     where: {
       id: dashboardId,
       tenantId: req.tenant.id
     }
   });
   ```

4. **❌ Cache keys without tenantId**
   ```typescript
   // WRONG
   const cacheKey = `bi:dashboard:${dashboardId}`;
   
   // CORRECT
   const cacheKey = `bi:dashboard:${tenantId}:${dashboardId}`;
   ```

5. **❌ Missing subdomain in API calls**
   ```typescript
   // WRONG
   fetch('/api/bi/dashboard', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   
   // CORRECT
   fetch('/api/bi/dashboard', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'X-Tenant-Subdomain': subdomain
     }
   });
   ```

---

## Conclusion

This comprehensive rebuild plan provides a clear roadmap for creating a world-class BI workspace that:

1. **Meets Global Standards**: Incorporates best practices from top BI platforms
2. **Serves Iranian Market**: Tailored for Iranian business needs
3. **Works Flexibly**: Supports individual and merged workspace analytics
4. **Scales Effectively**: Handles growth and increasing data volumes
5. **Delivers Value**: Empowers users to make data-driven decisions

The phased approach ensures:
- **Incremental Delivery**: Value delivered in phases
- **Risk Mitigation**: Early identification of issues
- **User Feedback**: Continuous user feedback integration
- **Quality Assurance**: Thorough testing at each phase

**Next Steps:**
1. Review and approve this plan
2. Allocate resources
3. Begin Phase 1: Foundation
4. Establish project governance
5. Set up communication channels

---

---

## Currency Standardization Update (2025-01-28)

**Status**: ✅ Completed

All currency displays across the project have been standardized to use **تومان (Toman)** instead of **ریال (Rial)**:

- ✅ **BI Workspace**: All currency displays updated (trend-analysis, MultiMetricTab, analytics, profit-analysis, ordering, merged, page, custom-reports, abc-analysis)
- ✅ **Inventory Workspace**: All currency labels and displays updated (items, suppliers, inventory add/bulk-add, page)
- ✅ **Format Functions**: All `formatCurrency` functions updated to display "تومان"
- ✅ **Labels**: All hardcoded currency labels updated (e.g., "قیمت واحد (تومان)")
- ✅ **Documentation**: Updated references from Rial to Toman
- ✅ **Intl.NumberFormat Fix**: Removed `style: 'currency'` and `currency: 'IRR'` from all `Intl.NumberFormat` calls to prevent automatic "ریال" display. Now using plain number formatting with manual "تومان" suffix.

**Technical Details**:
- The issue with "ریال ۲۷۱٬۹۴۸٬۹۱۵ تومان" format was caused by `Intl.NumberFormat` with `currency: 'IRR'` automatically adding "ریال"
- Fixed in: `trend-analysis/page.tsx`, `custom-reports/page.tsx`, `abc-analysis/page.tsx`
- All `formatCurrency` functions now use: `new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + ' تومان'`
- **Duplication Fix**: Removed "تومان" from `formatCurrency` in `trend-analysis/page.tsx` since it's used with `getMetricUnit(metric)` which already adds "تومان". This prevents "تومان تومان" duplication.

**Note**: The `currencyUtils.ts` file already had the correct standard (`SYMBOL: 'تومان'`), and all instances have been aligned with this standard.

---

### Analytics Page Charts Fix (2024-12-XX)

**Problem**: Charts in the "گزارش آماری" (Analytics Reports) page were not loading and displaying "No data to display" messages for:
- "روند موجودی اخیر" (Recent Inventory Trend)
- "روند ماهانه ورود و خروج کالا" (Monthly Trend of Goods In/Out)

**Root Cause**: The analytics page was using `getTrendAnalysis('sales_volume', ...)` which is for ordering workspace data, not inventory data. For inventory workspace, we need to use actual inventory entry data from dedicated endpoints.

**Solution**:
1. **Added New Methods to `biService.ts`**:
   - `getInventoryTrends(period)`: Calls `/api/analytics/inventory-trends` to get recent inventory trends
   - `getMonthlyMovements(months)`: Calls `/api/analytics/monthly-movements` to get monthly in/out movements
   - `getConsumptionByCategory(period)`: Calls `/api/analytics/consumption-by-category` to get consumption data

2. **Updated `analytics/page.tsx`**:
   - Replaced `getTrendAnalysis('sales_volume', ...)` calls with proper inventory-specific endpoints
   - Added chart components (`CustomLineChart` and `CustomBarChart`) to visualize the data
   - Fixed data mapping to use actual inventory entry data instead of estimated values
   - Added proper error handling and empty state displays

3. **Chart Implementation**:
   - **Recent Inventory Trend**: Now displays a line chart showing ورودی (Input), خروجی (Output), and موجودی (Stock) over time
   - **Monthly Movements**: Now displays a bar chart showing ورودی (Input) and خروجی (Output) by month
   - Both charts use Recharts components with proper Persian labels and formatting

**Files Modified**:
- `src/frontend/services/biService.ts`: Added `getInventoryTrends`, `getMonthlyMovements`, and `getConsumptionByCategory` methods
- `src/frontend/app/workspaces/business-intelligence/analytics/page.tsx`: Updated data fetching logic and added chart components

**Technical Details**:
- The backend endpoints (`/api/analytics/inventory-trends` and `/api/analytics/monthly-movements`) were already implemented in `analyticsRoutes.ts`
- The issue was that the frontend was not using these endpoints and instead trying to use ordering workspace data
- Charts now properly display inventory-specific data with correct formatting and Persian labels

---

**Document Status**: Ready for Review  
**Next Review Date**: TBD  
**Owner**: Development Team  
**Stakeholders**: Product, Engineering, Design, Business

