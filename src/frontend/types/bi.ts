// Business Intelligence Types

export interface ABCProduct {
  id: string;
  name: string;
  category: string;
  totalSales: number;
  totalQuantity: number;
  percentage: number;
  cumulativePercentage: number;
  abcCategory: 'A' | 'B' | 'C';
}

export interface ABCCategory {
  count: number;
  salesPercentage: number;
  products: ABCProduct[];
}

export interface ABCSummary {
  categoryA: ABCCategory;
  categoryB: ABCCategory;
  categoryC: ABCCategory;
}

export interface ABCAnalysisData {
  totalProducts: number;
  totalSales: number;
  products: ABCProduct[];
  summary: ABCSummary;
}

export interface ProfitItem {
  id: string;
  name: string;
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  quantity: number;
  averagePrice?: number;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMargin: number;
  totalItems: number;
}

export interface ProfitData {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMargin: number;
  analysis: ProfitItem[];
  summary?: ProfitSummary;
}

export interface TrendDataPoint {
  period: string;
  value: number;
  formattedPeriod: string;
  date?: Date;
}

export interface TrendAnalysisData {
  metric: string;
  granularity: string;
  dataPoints: TrendDataPoint[];
  trend: {
    direction: 'up' | 'down' | 'stable';
    slope: number;
    rSquared: number;
    description: string;
  };
  insights: string[];
  forecast: TrendDataPoint[];
  summary: {
    totalValue: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    growth: number;
  };
  seasonality?: unknown;
}

// ===================== ANALYTICS TYPES =====================

/**
 * Analytics Summary Data
 */
export interface AnalyticsSummary {
  totalItems: number;
  lowStockCount: number;
  recentTransactions: number;
  totalInventoryValue: number;
}

/**
 * Category Data for Charts
 */
export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

/**
 * Trend Data for Time Series
 */
export interface TrendData {
  date: string;
  stock: number;
  totalIn: number;
  totalOut: number;
}

/**
 * Monthly Data for Period Analysis
 */
export interface MonthlyData {
  month: string;
  monthKey: string;
  in: number;
  out: number;
  net: number;
}

/**
 * Enhanced Trend Data Point with proper typing
 */
export interface EnhancedTrendDataPoint {
  period: string;
  date?: string;
  value: number;
  formattedPeriod?: string;
}

/**
 * Enhanced Trend Analysis Response
 */
export interface EnhancedTrendAnalysisData {
  metric: string;
  granularity: string;
  dataPoints: EnhancedTrendDataPoint[];
  trend?: {
    direction: 'up' | 'down' | 'stable';
    slope: number;
    rSquared: number;
    description: string;
  };
  insights?: string[];
  forecast?: EnhancedTrendDataPoint[];
  summary?: {
    totalValue: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    growth: number;
  };
}

/**
 * Dashboard Chart Data Structure
 */
export interface DashboardChartData {
  labels: string[];
  data: number[];
  colors?: string[];
}

/**
 * Dashboard Response Structure
 */
export interface DashboardResponse {
  charts?: {
    categoryChart?: DashboardChartData;
    revenueChart?: DashboardChartData;
    topProductsChart?: DashboardChartData;
  };
  period?: string;
  startDate?: string;
  endDate?: string;
}

// ===================== ENHANCED CHART DATA TYPES =====================

/**
 * Unified chart data structure for consistent chart rendering
 * This maintains backward compatibility while providing better type safety
 */
export interface UnifiedChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
    tension?: number;
  }>;
}

/**
 * Generic chart data point interface for flexible data handling
 */
export interface ChartDataPoint {
  [key: string]: string | number | Date | boolean | null | undefined;
}

/**
 * Chart data adapter interface for transforming API data to chart-ready format
 */
export interface ChartDataAdapter<T> {
  transform: (apiData: T) => ChartDataPoint[];
  validate: (data: unknown) => data is T;
  fallback: () => ChartDataPoint[];
}

/**
 * Chart configuration interface for consistent chart behavior
 */
export interface ChartConfig {
  title?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
  animation?: boolean;
}

// ===================== PROFIT ANALYSIS ENHANCED TYPES =====================

/**
 * Enhanced profit analysis response interface
 * Maintains backward compatibility with existing ProfitData
 */
export interface ProfitAnalysisResponse {
  success: boolean;
  data: ProfitData;
  message?: string;
}

/**
 * Chart-specific profit data interfaces for better type safety
 */
export interface TopProfitableProductsData {
  name: string;
  fullName: string;
  revenue: number;
  quantity: number;
  profit: number;
  profitMargin: number;
  abcCategory: 'A' | 'B' | 'C';
  percentage: number;
}

export interface RevenueVsProfitScatterData {
  name: string;
  revenue: number;
  profit: number;
  profitMargin: number;
  quantity: number;
  category: string;
}

export interface ProfitMarginDistributionData {
  name: string;
  value: number;
  count: number;
  color: string;
  percentage: number;
}

export interface CostVsRevenueComparisonData {
  name: string;
  fullName: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitPerformanceMatrixData {
  name: string;
  revenue: number;
  profit: number;
  profitMargin: number;
  quantity: number;
  category: string;
}

// ===================== EXISTING TYPES (MAINTAINED FOR BACKWARD COMPATIBILITY) =====================

export interface BIDashboard {
  period: {
    start: Date;
    end: Date;
  };
  kpis: {
    totalRevenue: {
      value: number;
      previousValue: number;
      change: number;
      changePercent: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      unit: string;
      description: string;
      status: string;
    };
    netProfit: {
      value: number;
      previousValue: number;
      change: number;
      changePercent: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      unit: string;
      description: string;
      status: string;
    };
    profitMargin: {
      value: number;
      previousValue: number;
      change: number;
      changePercent: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      unit: string;
      description: string;
      status: string;
    };
    inventoryTurnover: {
      value: number;
      previousValue: number;
      change: number;
      changePercent: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      unit: string;
      description: string;
      status: string;
    };
    averageOrderValue: {
      value: number;
      previousValue: number;
      change: number;
      changePercent: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      unit: string;
      description: string;
      status: string;
    };
    stockoutRate: {
      value: number;
      previousValue: number;
      change: number;
      changePercent: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      unit: string;
      description: string;
      status: string;
    };
    activeProductsCount: number;
  };
  charts: {
    revenueChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
      }>;
    };
    topProductsChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
      }>;
    };
    categoryChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
      }>;
    };
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  table: string;
  label: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

// KPI Value interface that matches the actual backend response structure
export interface KPIValue {
  value: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface FinancialKPI {
  totalRevenue: KPIValue;
  netProfit: KPIValue;
  profitMargin: KPIValue;
  averageOrderValue: KPIValue;
  revenueGrowth: KPIValue;
  profitGrowth: KPIValue;
}

export interface OperationalKPI {
  totalOrders: KPIValue;
  averageOrderTime: KPIValue;
  customerSatisfaction: KPIValue;
  inventoryTurnover: KPIValue;
  stockoutRate: KPIValue;
  orderFulfillmentRate: KPIValue;
}

export interface KPIData {
  financial: FinancialKPI;
  operational: OperationalKPI;
}
