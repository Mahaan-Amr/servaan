// Comprehensive Report Types for Servaan Business Management System
// تایپ‌های جامع گزارش‌ها برای سیستم مدیریت کسب‌وکار سِروان

// ===== CORE REPORT TYPES =====

/**
 * Report Field Configuration - تنظیمات فیلد گزارش
 */
export interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  table: string;
  label: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  format?: string; // For date/currency formatting
}

/**
 * Report Filter Configuration - تنظیمات فیلتر گزارش
 */
export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in' | 'not_equals' | 'not_contains' | 'greater_equal' | 'less_equal';
  value: string | number | boolean | string[] | number[] | Date | null;
  label: string;
  isActive?: boolean;
  groupId?: string; // For grouped filters (AND/OR logic)
}

/**
 * Report Sorting Configuration - تنظیمات مرتب‌سازی گزارش
 */
export interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
  priority?: number; // For multiple sort fields
}

/**
 * Report Chart Configuration - تنظیمات نمودار گزارش
 */
export interface ReportChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area' | 'radar';
  xAxis?: {
    field: string;
    label?: string;
    type?: 'category' | 'time' | 'linear';
  };
  yAxis?: {
    field: string;
    label?: string;
    type?: 'linear' | 'log';
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
  series?: Array<{
    field: string;
    label: string;
    color?: string;
    type?: 'line' | 'bar' | 'area';
  }>;
  options?: Record<string, unknown>; // Chart.js options
}

/**
 * Report Layout Configuration - تنظیمات چیدمان گزارش
 */
export interface ReportLayoutConfig {
  columns: number;
  rows: number;
  widgets?: Array<{
    id: string;
    type: 'chart' | 'table' | 'metric' | 'text';
    position: { x: number; y: number; width: number; height: number };
    config: Record<string, unknown>;
  }>;
  theme?: 'light' | 'dark' | 'auto';
  responsive?: boolean;
}

/**
 * Report Data Source Configuration - تنظیمات منبع داده گزارش
 */
export interface ReportDataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'external';
  connection: {
    host?: string;
    database?: string;
    table?: string;
    query?: string;
    apiUrl?: string;
    headers?: Record<string, string>;
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'api_key';
      credentials?: Record<string, string>;
    };
  };
  refreshInterval?: number; // in seconds
  lastRefresh?: Date;
  status: 'active' | 'inactive' | 'error';
  errorMessage?: string;
}

/**
 * Report Configuration - تنظیمات کامل گزارش
 */
export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  dataSources: ReportDataSource[];
  columnsConfig: ReportField[];
  filtersConfig?: ReportFilter[];
  sortingConfig?: ReportSorting[];
  chartConfig?: ReportChartConfig;
  layoutConfig?: ReportLayoutConfig;
  isPublic?: boolean;
  sharedWith?: string[];
  tags?: string[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    recipients?: string[];
  };
  permissions?: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canExecute: string[];
    canShare: string[];
  };
}

/**
 * Report Execution Result - نتیجه اجرای گزارش
 */
export interface ReportExecutionResult {
  reportId: string;
  executedAt: Date;
  executedBy: string;
  executionTime: number;
  resultCount: number;
  data: Record<string, unknown>[];
  format: 'json' | 'csv' | 'excel' | 'pdf' | 'html';
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'CANCELLED';
  errorMessage?: string;
  metadata?: {
    totalRows?: number;
    totalColumns?: number;
    dataSize?: number; // in bytes
    compressionRatio?: number;
    cacheHit?: boolean;
    cacheAge?: number; // in seconds
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Report Template - قالب گزارش
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'inventory' | 'financial' | 'sales' | 'customer' | 'supplier' | 'user' | 'custom';
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  fields: string[]; // Field IDs
  filters: ReportFilter[];
  sorting: ReportSorting[];
  chartConfig?: ReportChartConfig;
  layoutConfig?: ReportLayoutConfig;
  isDefault?: boolean;
  isPublic?: boolean;
  tags?: string[];
  usageCount?: number;
  rating?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report Field Definition - تعریف فیلد گزارش
 */
export interface ReportFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage' | 'email' | 'phone' | 'url';
  category: 'item' | 'inventory' | 'user' | 'supplier' | 'customer' | 'financial' | 'transaction' | 'system';
  description?: string;
  table: string;
  column: string;
  dataType: 'varchar' | 'int' | 'decimal' | 'datetime' | 'boolean' | 'json';
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    custom?: string;
  };
  displayOptions?: {
    format?: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    color?: string;
    icon?: string;
    tooltip?: string;
  };
  aggregationOptions?: Array<'sum' | 'avg' | 'count' | 'min' | 'max' | 'count_distinct' | 'first' | 'last'>;
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
}

/**
 * Report Filter Definition - تعریف فیلتر گزارش
 */
export interface ReportFilterDefinition {
  id: string;
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select' | 'range' | 'custom';
  operators: Array<'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in' | 'not_equals' | 'not_contains' | 'greater_equal' | 'less_equal' | 'is_null' | 'is_not_null'>;
  defaultValue?: unknown;
  options?: Array<{ value: string | number; label: string }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  ui?: {
    component: 'input' | 'select' | 'datepicker' | 'checkbox' | 'radio' | 'slider' | 'autocomplete';
    placeholder?: string;
    helpText?: string;
    width?: number;
    height?: number;
  };
}

/**
 * Report Execution Request - درخواست اجرای گزارش
 */
export interface ReportExecutionRequest {
  reportId: string;
  parameters?: Record<string, unknown>;
  filters?: ReportFilter[];
  sorting?: ReportSorting[];
  pagination?: {
    page: number;
    pageSize: number;
  };
  format: 'json' | 'csv' | 'excel' | 'pdf' | 'html';
  includeMetadata?: boolean;
  cacheResults?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timeout?: number; // in seconds
  notifyOnComplete?: boolean;
  notificationEmail?: string;
}

/**
 * Report Export Options - گزینه‌های صادرات گزارش
 */
export interface ReportExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'html' | 'json';
  filename?: string;
  includeHeaders?: boolean;
  includeMetadata?: boolean;
  compression?: boolean;
  password?: string;
  watermark?: string;
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  styling?: {
    fontFamily?: string;
    fontSize?: number;
    headerColor?: string;
    rowColor?: string;
    alternateRowColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

/**
 * Report Performance Metrics - متریک‌های عملکرد گزارش
 */
export interface ReportPerformanceMetrics {
  reportId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  executionCount: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  successRate: number;
  errorRate: number;
  timeoutRate: number;
  averageResultSize: number;
  cacheHitRate: number;
  userSatisfaction?: number; // 1-5 rating
  mostCommonErrors?: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
  peakUsageTimes?: Array<{
    hour: number;
    count: number;
  }>;
  dataSourcePerformance?: Array<{
    dataSourceId: string;
    averageResponseTime: number;
    errorRate: number;
    availability: number;
  }>;
}

/**
 * Report Sharing Configuration - تنظیمات اشتراک‌گذاری گزارش
 */
export interface ReportSharingConfig {
  reportId: string;
  sharedWith: Array<{
    userId: string;
    email: string;
    name: string;
    permissions: Array<'view' | 'edit' | 'execute' | 'share'>;
    expiresAt?: Date;
    isActive: boolean;
  }>;
  publicAccess: {
    enabled: boolean;
    requireAuthentication: boolean;
    allowAnonymous: boolean;
    maxViews?: number;
    expiresAt?: Date;
  };
  embedOptions: {
    enabled: boolean;
    allowEmbedding: boolean;
    allowedDomains?: string[];
    requireAuthentication: boolean;
    maxEmbedViews?: number;
  };
  notificationSettings: {
    notifyOnView: boolean;
    notifyOnExport: boolean;
    notifyOnShare: boolean;
    notificationChannels: Array<'email' | 'sms' | 'push' | 'webhook'>;
  };
}

// ===== UTILITY TYPES =====

/**
 * Report Builder State - وضعیت سازنده گزارش
 */
export interface ReportBuilderState {
  name: string;
  description: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  selectedFields: string[];
  filters: ReportFilter[];
  sorting: ReportSorting[];
  chartConfig?: ReportChartConfig;
  layoutConfig?: ReportLayoutConfig;
  isPublic: boolean;
  tags: string[];
  dataSources: string[];
}

/**
 * Report Preview Data - داده‌های پیش‌نمایش گزارش
 */
export interface ReportPreviewData {
  columns: ReportField[];
  rows: Record<string, unknown>[];
  summary?: {
    totalRows: number;
    totalColumns: number;
    dataSize: number;
    executionTime: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Report Validation Result - نتیجه اعتبارسنجی گزارش
 */
export interface ReportValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  suggestions: Array<{
    field: string;
    message: string;
    type: 'performance' | 'usability' | 'best_practice';
  }>;
}

// ===== TYPE GUARDS =====

/**
 * Type guard to check if an object is a valid ReportField
 */
export function isReportField(obj: unknown): obj is ReportField {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'type' in obj &&
    'table' in obj &&
    'label' in obj
  );
}

/**
 * Type guard to check if an object is a valid ReportFilter
 */
export function isReportFilter(obj: unknown): obj is ReportFilter {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'field' in obj &&
    'operator' in obj &&
    'value' in obj &&
    'label' in obj
  );
}

/**
 * Type guard to check if an object is a valid ReportSorting
 */
export function isReportSorting(obj: unknown): obj is ReportSorting {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'field' in obj &&
    'direction' in obj
  );
}

// ===== CONSTANTS =====

/**
 * Available report types
 */
export const REPORT_TYPES = ['TABULAR', 'CHART', 'DASHBOARD', 'PIVOT'] as const;

/**
 * Available field types
 */
export const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'currency', 'percentage', 'email', 'phone', 'url'] as const;

/**
 * Available aggregation types
 */
export const AGGREGATION_TYPES = ['sum', 'avg', 'count', 'min', 'max', 'count_distinct', 'first', 'last', 'none'] as const;

/**
 * Available filter operators
 */
export const FILTER_OPERATORS = [
  'equals', 'contains', 'greater', 'less', 'between', 'in',
  'not_equals', 'not_contains', 'greater_equal', 'less_equal',
  'is_null', 'is_not_null'
] as const;

/**
 * Available sort directions
 */
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

/**
 * Available chart types
 */
export const CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'scatter', 'area', 'radar'] as const;

/**
 * Available export formats
 */
export const EXPORT_FORMATS = ['json', 'csv', 'excel', 'pdf', 'html'] as const;
