import { apiClient } from '../lib/apiClient';

// Report configuration interfaces
export interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  table: string;
  label: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | boolean | string[] | number[];
  label: string;
}

export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  dataSources: Record<string, unknown>[];
  columnsConfig: ReportField[];
  filtersConfig?: ReportFilter[];
  sortingConfig?: { field: string; direction: 'asc' | 'desc' }[];
  chartConfig?: Record<string, unknown>;
  layoutConfig?: Record<string, unknown>;
  isPublic?: boolean;
  sharedWith?: string[];
  tags?: string[];
}

export interface ReportExecutionResult {
  reportId: string;
  executedAt: Date;
  executedBy: string;
  executionTime: number;
  resultCount: number;
  data: Record<string, unknown>[];
  format: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  errorMessage?: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
  _count?: {
    executions: number;
  };
}

// Inventory specific report types
export interface InventoryReportData {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    currentStock: number;
    unit: string;
    value: number;
    status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>;
}

// Financial report types
export interface FinancialReportData {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    period: string;
  };
  transactions: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    date: string;
    description: string;
  }>;
}

// User activity report types
export interface UserReportData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    period: string;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastActivity: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
}

// Get reports with filtering and pagination
export const getReports = async (
  filters?: {
    reportType?: string;
    isPublic?: boolean;
    tags?: string[];
    creatorId?: string;
  },
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{ reports: Report[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
  try {
    // Convert filters and pagination to query parameters
    const params: Record<string, string | number | boolean> = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params[key] = value.join(',');
          } else {
            params[key] = value.toString();
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    const response = await apiClient.get<{ reports: Report[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>('/reports', params);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get report by ID
export const getReportById = async (id: string): Promise<Report> => {
  try {
    const response = await apiClient.get<{ report: Report }>(`/reports/${id}`);
    return response.report;
  } catch (error) {
    throw error;
  }
};

// Create new report
export const createReport = async (reportConfig: ReportConfig): Promise<Report> => {
  try {
    const response = await apiClient.post<{ report: Report }>('/reports', reportConfig);
    return response.report;
  } catch (error) {
    throw error;
  }
};

// Execute report
export const executeReport = async (
  reportId: string,
  parameters?: Record<string, unknown>,
  exportFormat: string = 'json'
): Promise<ReportExecutionResult> => {
  try {
    const response = await apiClient.post<ReportExecutionResult>(`/reports/${reportId}/execute`, {
      parameters,
      format: exportFormat
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Update report
export const updateReport = async (id: string, updates: Partial<ReportConfig>): Promise<Report> => {
  try {
    const response = await apiClient.put<{ report: Report }>(`/reports/${id}`, updates);
    return response.report;
  } catch (error) {
    throw error;
  }
};

// Delete report
export const deleteReport = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<void>(`/reports/${id}`);
  } catch (error) {
    throw error;
  }
};

// Get inventory report
export const getInventoryReport = async (
  filters?: {
    category?: string;
    status?: string;
    lowStockThreshold?: number;
  }
): Promise<InventoryReportData> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<InventoryReportData>('/reports/inventory', params);
  } catch (error) {
    throw error;
  }
};

// Get financial report
export const getFinancialReport = async (
  filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: 'INCOME' | 'EXPENSE';
  }
): Promise<FinancialReportData> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<FinancialReportData>('/reports/financial', params);
  } catch (error) {
    throw error;
  }
};

// Get user report
export const getUserReport = async (
  filters?: {
    role?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<UserReportData> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<UserReportData>('/reports/users', params);
  } catch (error) {
    throw error;
  }
};

// Export report
export const exportReport = async (
  reportId: string,
  format: string = 'excel',
  parameters?: Record<string, unknown>
): Promise<Blob> => {
  try {
    const response = await apiClient.post<Blob>(`/reports/${reportId}/export`, {
      format,
      parameters
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Export report file
export const exportReportFile = async (
  reportId: string,
  format: string = 'excel',
  parameters?: Record<string, unknown>
): Promise<{ blob: Blob; filename: string }> => {
  try {
    console.log('Exporting report:', { reportId, format });
    
    const response = await apiClient.post<{ blob: Blob; filename: string }>(`/reports/${reportId}/export`, {
      format,
      parameters
    });
    
    return response;
  } catch (error) {
    console.error('Export error:', error);
    
    if (error instanceof Error) {
      if ((error as Error & { statusCode?: number }).statusCode === 401) {
        throw new Error('جلسه شما منقضی شده است. لطفاً مجدداً وارد شوید');
      }
      if ((error as Error & { statusCode?: number }).statusCode === 403) {
        throw new Error('شما دسترسی لازم برای این عملیات را ندارید');
      }
      if ((error as Error & { statusCode?: number }).statusCode === 404) {
        throw new Error('گزارش مورد نظر یافت نشد');
      }
      if ((error as Error & { statusCode?: number }).statusCode === 500) {
        throw new Error('خطای سرور. لطفاً بعداً تلاش کنید');
      }
    }
    
    throw new Error('خطا در صادرات گزارش');
  }
};

// Get popular reports
export const getPopularReports = async (limit: number = 10): Promise<Report[]> => {
  try {
    const response = await apiClient.get<{ reports: Report[] }>('/reports/popular', { limit });
    return response.reports;
  } catch (error) {
    throw error;
  }
};

// Search reports
export const searchReports = async (
  searchTerm: string,
  filters?: Record<string, string | number | boolean>
): Promise<Report[]> => {
  try {
    const params: Record<string, string | number | boolean> = { q: searchTerm };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    const response = await apiClient.get<{ reports: Report[] }>('/reports/search', params);
    return response.reports;
  } catch (error) {
    throw error;
  }
}; 