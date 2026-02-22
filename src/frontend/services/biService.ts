import { apiClient } from '../lib/apiClient';
import { 
  ProfitAnalysisResponse,
  BIDashboard,
  ReportField,
  KPIData,
  AnalyticsSummary
} from '../types/bi';

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

class BiService {
  /**
   * دریافت داشبورد Business Intelligence
   * Supports workspace selector: 'ordering', 'inventory', or 'merged'
   */
  async getDashboard(
    period: string = '30d', 
    startDate?: string, 
    endDate?: string,
    workspace: 'ordering' | 'inventory' | 'merged' = 'merged'
  ): Promise<BIDashboard> {
    try {
      const params: Record<string, string> = { period, workspace };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      const response = await apiClient.get<{
        success?: boolean;
        data?: BIDashboard;
        message?: string;
      } | BIDashboard>('/bi/dashboard', params);
      
      // Extract data from wrapped response if present
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        const wrappedResponse = response as { success: boolean; data: BIDashboard; message?: string };
        if (wrappedResponse.success && wrappedResponse.data) {
          return wrappedResponse.data;
        }
        throw new Error(wrappedResponse.message || 'خطا در دریافت داشبورد');
      }
      
      // Direct response structure (backward compatibility)
      return response as BIDashboard;
    } catch (error) {
      console.error('Error fetching BI dashboard:', error);
      throw error;
    }
  }

  /**
   * دریافت KPI های کلیدی
   */
  async getKPIs(period: string = '30d'): Promise<KPIData> {
    try {
      const response = await apiClient.get<KPIData>('/bi/kpis', { period });
      return response;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  /**
   * تحلیل ABC
   */
  async getABCAnalysis(period: string = '30d'): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/analytics/abc-analysis', { period });
      return response;
    } catch (error) {
      console.error('Error fetching ABC analysis:', error);
      throw error;
    }
  }

  /**
   * تحلیل سودآوری - Enhanced with proper typing
   * Maintains backward compatibility while providing better type safety
   */
  async getProfitAnalysis(period: string = '30d', groupBy: 'item' | 'category' = 'item'): Promise<ProfitAnalysisResponse> {
    try {
      const response = await apiClient.get<ProfitAnalysisResponse>('/bi/analytics/profit-analysis', { period, groupBy });
      return response;
    } catch (error) {
      console.error('Error fetching profit analysis:', error);
      throw error;
    }
  }

  /**
   * تحلیل روند
   */
  async getTrendAnalysis(
    metric: string,
    period: string = '30d',
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>(
        `/bi/analytics/trends?metric=${metric}&period=${period}&granularity=${granularity}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching trend analysis:', error);
      throw error;
    }
  }

  /**
   * دریافت خلاصه آمار تحلیلی
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const response = await apiClient.get<AnalyticsSummary>('/bi/analytics/summary');
      return response;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  }

  /**
   * دریافت روند موجودی اخیر
   */
  async getInventoryTrends(period: string = '90'): Promise<Array<{
    date: string;
    stock: number;
    totalIn: number;
    totalOut: number;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        date: string;
        stock: number;
        totalIn: number;
        totalOut: number;
      }>>('/analytics/inventory-trends', { period });
      return response;
    } catch (error) {
      console.error('Error fetching inventory trends:', error);
      throw error;
    }
  }

  /**
   * دریافت روند ماهانه ورود و خروج کالا
   */
  async getMonthlyMovements(months: string = '12'): Promise<Array<{
    month: string;
    monthKey: string;
    in: number;
    out: number;
    net: number;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        month: string;
        monthKey: string;
        in: number;
        out: number;
        net: number;
      }>>('/analytics/monthly-movements', { months });
      return response;
    } catch (error) {
      console.error('Error fetching monthly movements:', error);
      throw error;
    }
  }

  /**
   * دریافت مصرف به تفکیک دسته‌بندی
   */
  async getConsumptionByCategory(period: string = '30'): Promise<Array<{
    name: string;
    value: number;
    color: string;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        name: string;
        value: number;
        color: string;
      }>>('/analytics/consumption-by-category', { period });
      return response;
    } catch (error) {
      console.error('Error fetching consumption by category:', error);
      throw error;
    }
  }

  /**
   * دریافت بینش‌ها
   */
  async getInsights(period: string = '30d'): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/insights', { period });
      return response;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  }

  /**
   * ایجاد گزارش سفارشی
   */
  async createCustomReport(reportConfig: unknown): Promise<unknown> {
    try {
      const response = await apiClient.post<unknown>('/bi/reports', reportConfig);
      return response;
    } catch (error) {
      console.error('Error creating custom report:', error);
      throw error;
    }
  }

  /**
   * دریافت لیست گزارش‌های سفارشی
   */
  async getCustomReports(page: number = 1, limit: number = 10, search?: string): Promise<unknown> {
    try {
      const params: Record<string, string | number | boolean> = { page, limit };
      if (search) {
        params.search = search;
      }
      const response = await apiClient.get<unknown>('/bi/reports', params);
      return response;
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      throw error;
    }
  }

  /**
   * اجرای پیش‌نمایش گزارش موقت
   */
  async executeTemporaryReport(reportConfig: unknown): Promise<unknown> {
    try {
      const response = await apiClient.post<unknown>('/bi/reports/preview/execute', { reportConfig, parameters: {} });
      return response;
    } catch (error) {
      console.error('Error executing temporary report:', error);
      throw error;
    }
  }

  /**
   * اجرای گزارش ذخیره شده
   */
  async executeReport(reportId: string, parameters?: unknown, exportFormat: string = 'JSON'): Promise<unknown> {
    try {
      const response = await apiClient.post<unknown>(`/bi/reports/${reportId}/execute`, { parameters, exportFormat });
      return response;
    } catch (error) {
      console.error('Error executing report:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش بر اساس ID
   */
  async getReportById(reportId: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>(`/bi/reports/${reportId}`);
      return response;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      throw error;
    }
  }

  /**
   * بروزرسانی گزارش
   */
  async updateReport(reportId: string, updates: unknown): Promise<unknown> {
    try {
      const response = await apiClient.put<unknown>(`/bi/reports/${reportId}`, updates);
      return response;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  /**
   * حذف گزارش
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      await apiClient.delete<void>(`/bi/reports/${reportId}`);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * دریافت فیلدهای گزارش
   */
  async getReportFields(): Promise<ReportField[]> {
    try {
      const response = await apiClient.get<ReportField[]>('/bi/reports/fields');
      return response;
    } catch (error) {
      console.error('Error fetching report fields:', error);
      throw error;
    }
  }

  /**
   * دریافت پیشنهادات گزارش
   */
  async getReportSuggestions(query: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/suggestions', { query });
      return response;
    } catch (error) {
      console.error('Error fetching report suggestions:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار گزارش‌ها
   */
  async getReportStats(period: string = '30d'): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/stats', { period });
      return response;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های محبوب
   */
  async getPopularReports(limit: number = 5): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/popular', { limit });
      return response;
    } catch (error) {
      console.error('Error fetching popular reports:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های اخیر
   */
  async getRecentReports(limit: number = 10): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/recent', { limit });
      return response;
    } catch (error) {
      console.error('Error fetching recent reports:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های پیشنهادی
   */
  async getSuggestedReports(userId: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/suggested', { userId });
      return response;
    } catch (error) {
      console.error('Error fetching suggested reports:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های دسته‌بندی شده
   */
  async getReportsByCategory(category: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/category', { category });
      return response;
    } catch (error) {
      console.error('Error fetching reports by category:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس تاریخ
   */
  async getReportsByDate(startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/date-range', { startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by date range:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس کاربر
   */
  async getReportsByUser(userId: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/user', { userId });
      return response;
    } catch (error) {
      console.error('Error fetching reports by user:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس وضعیت
   */
  async getReportsByStatus(status: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/status', { status });
      return response;
    } catch (error) {
      console.error('Error fetching reports by status:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس نوع
   */
  async getReportsByType(type: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/type', { type });
      return response;
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس اولویت
   */
  async getReportsByPriority(priority: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/priority', { priority });
      return response;
    } catch (error) {
      console.error('Error fetching reports by priority:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس برچسب
   */
  async getReportsByTag(tag: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/tag', { tag });
      return response;
    } catch (error) {
      console.error('Error fetching reports by tag:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس کلمات کلیدی
   */
  async searchReports(keywords: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/search', { keywords });
      return response;
    } catch (error) {
      console.error('Error searching reports:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس فیلترهای پیشرفته
   */
  async getReportsWithFilters(filters: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await apiClient.post<unknown>('/bi/reports/filter', filters);
      return response;
    } catch (error) {
      console.error('Error fetching reports with filters:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس دسته‌بندی و تاریخ
   */
  async getReportsByCategoryAndDate(category: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/category-date', { category, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by category and date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس کاربر و تاریخ
   */
  async getReportsByUserAndDate(userId: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/user-date', { userId, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by user and date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس وضعیت و تاریخ
   */
  async getReportsByStatusAndDate(status: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/status-date', { status, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by status and date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس نوع و تاریخ
   */
  async getReportsByTypeAndDate(type: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/type-date', { type, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by type and date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس اولویت و تاریخ
   */
  async getReportsByPriorityAndDate(priority: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/priority-date', { priority, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by priority and date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس برچسب و تاریخ
   */
  async getReportsByTagAndDate(tag: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/tag-date', { tag, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports by tag and date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس کلمات کلیدی و تاریخ
   */
  async searchReportsByDate(keywords: string, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('/bi/reports/search-date', { keywords, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error searching reports by date:', error);
      throw error;
    }
  }

  /**
   * دریافت گزارش‌های بر اساس فیلترهای پیشرفته و تاریخ
   */
  async getReportsWithFiltersAndDate(filters: Record<string, unknown>, startDate: string, endDate: string): Promise<unknown> {
    try {
      const response = await apiClient.post<unknown>('/bi/reports/filter-date', { ...filters, startDate, endDate });
      return response;
    } catch (error) {
      console.error('Error fetching reports with filters and date:', error);
      throw error;
    }
  }

  // ===================== NEW DATA AGGREGATION ENDPOINTS =====================

  /**
   * Execute aggregation queries across multiple workspaces
   */
  async aggregate(query: {
    workspaces: string[];
    joinType: 'INNER' | 'LEFT' | 'UNION' | 'CROSS';
    joinKeys?: Array<{ from: string; to: string }>;
    fields: Array<{
      workspace: string;
      table: string;
      field: string;
      alias?: string;
      aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
    }>;
    filters?: Array<{
      workspace: string;
      table: string;
      field: string;
      operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
      value: unknown;
    }>;
    groupBy?: string[];
    orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
    offset?: number;
  }): Promise<{
    rows: unknown[];
    columns: string[];
    rowCount: number;
    metadata?: {
      workspaces: string[];
      joinType: string;
      executionTime: number;
      cached: boolean;
    };
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          rows: unknown[];
          columns: string[];
          rowCount: number;
          metadata?: {
            workspaces: string[];
            joinType: string;
            executionTime: number;
            cached: boolean;
          };
        };
        message?: string;
      }>('/bi/aggregate', query);
      
      // Extract data from response wrapper
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'خطا در تجمیع داده‌ها');
    } catch (error) {
      console.error('Error aggregating data:', error);
      throw error;
    }
  }

  /**
   * Get available data schemas from workspace connectors
   */
  async getSchema(workspace?: 'ordering' | 'inventory'): Promise<{
    workspace?: string;
    name?: string;
    schema?: unknown;
    workspaces?: Array<{
      workspace: string;
      name: string;
      schema: unknown;
    }>;
  }> {
    try {
      const params: Record<string, string> = {};
      if (workspace) {
        params.workspace = workspace;
      }
      
      const response = await apiClient.get<{
        success: boolean;
        data: {
          workspace?: string;
          name?: string;
          schema?: unknown;
          workspaces?: Array<{
            workspace: string;
            name: string;
            schema: unknown;
          }>;
        };
        message?: string;
      }>('/bi/schema', params);
      
      // Extract data from response wrapper
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'خطا در دریافت schema');
    } catch (error) {
      console.error('Error getting schema:', error);
      throw error;
    }
  }

  /**
   * Data exploration endpoint (simplified query interface)
   */
  async explore(query: {
    workspaces: string[];
    fields: Array<{
      workspace: string;
      table: string;
      field: string;
      alias?: string;
      aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
    }>;
    filters?: Array<{
      workspace: string;
      table: string;
      field: string;
      operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
      value: unknown;
    }>;
    groupBy?: string[];
    orderBy?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    limit?: number;
    offset?: number;
    joinType?: 'INNER' | 'LEFT' | 'UNION' | 'CROSS';
    joinKeys?: Array<{ from: string; to: string }>;
  }): Promise<{
    rows: unknown[];
    columns: string[];
    rowCount: number;
    metadata?: {
      workspaces: string[];
      joinType: string;
      executionTime: number;
      cached: boolean;
    };
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          rows: unknown[];
          columns: string[];
          rowCount: number;
          metadata?: {
            workspaces: string[];
            joinType: string;
            executionTime: number;
            cached: boolean;
          };
        };
        message?: string;
      }>('/bi/explore', query);
      
      // Extract data from response wrapper
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'خطا در اکتشاف داده');
    } catch (error) {
      console.error('Error exploring data:', error);
      throw error;
    }
  }
}

export const biService = new BiService(); 