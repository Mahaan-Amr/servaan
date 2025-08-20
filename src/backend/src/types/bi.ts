export interface DateRange {
  start: Date;
  end: Date;
}

export interface KPIMetric {
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  target?: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  unit: string;
  description: string;
}

export interface ExecutiveDashboard {
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
    revenueChart: any;
    topProductsChart: any;
    categoryChart: any;
  };
  alerts: any[];
  generatedAt: Date;
  generatedBy: string;
}

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

export interface ABCAnalysis {
  period: DateRange;
  totalProducts: number;
  totalSales: number;
  products: ABCProduct[];
  summary: {
    categoryA: ABCCategory;
    categoryB: ABCCategory;
    categoryC: ABCCategory;
  };
}

export interface ProfitAnalysisItem {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export interface ProfitAnalysis {
  period: DateRange;
  groupBy: 'item' | 'category';
  items: ProfitAnalysisItem[];
  summary: {
    totalItems: number;
    totalRevenue: number;
    totalProfit: number;
    overallMargin: number;
    bestPerformer: ProfitAnalysisItem | null;
    worstPerformer: ProfitAnalysisItem | null;
  };
}

export interface TrendDataPoint {
  period: string;
  value: number;
  date: Date;
}

export interface TrendDirection {
  direction: 'UP' | 'DOWN' | 'STABLE';
  strength: number;
  confidence: number;
  description: string;
}

export interface Seasonality {
  hasSeasonality: boolean;
  period: string | null;
  strength: number;
}

export interface ForecastPoint {
  period: string;
  value: number;
  confidence: number;
}

export interface TrendAnalysis {
  metric: 'revenue' | 'profit' | 'sales_volume' | 'customers';
  period: DateRange;
  granularity: 'daily' | 'weekly' | 'monthly';
  dataPoints: TrendDataPoint[];
  trend: TrendDirection;
  seasonality: Seasonality;
  forecast: ForecastPoint[];
  insights: string[];
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  dataSources: any[];
  columns: any[];
  filters?: any[];
  sorting?: any[];
  grouping?: any[];
  chartConfig?: any;
  isPublic: boolean;
  createdBy: string;
  sharedWith?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecution {
  reportId: string;
  executedAt: Date;
  executedBy: string;
  parameters?: any;
  executionTime: number;
  recordCount: number;
  success: boolean;
  error?: string;
}

export interface ExportOptions {
  format?: 'EXCEL' | 'PDF' | 'CSV' | 'JSON';
  includeCharts?: boolean;
  includeMetadata?: boolean;
  customLayout?: any;
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  margin?: number;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  condition: {
    metric: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN';
    threshold: any;
    entity: string;
  };
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT';
  frequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  recipients: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT';
  data?: any;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
} 