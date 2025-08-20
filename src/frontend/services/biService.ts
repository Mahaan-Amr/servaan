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
   */
  async getDashboard(period: string = '30d', startDate?: string, endDate?: string): Promise<BIDashboard> {
    try {
      const params: Record<string, string> = { period };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      
      const response = await apiClient.get<BIDashboard>('/bi/dashboard', params);
      return response;
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
}

export const biService = new BiService(); 