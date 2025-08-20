import { Request, Response } from 'express';
import { BiService } from '../services/biService';
import { ReportService } from '../services/reportService';
import { QueryBuilder } from '../services/queryBuilder';
import { DateRange } from '../types/bi';

export const biController = {
  /**
   * GET /api/bi/dashboard
   * دریافت داشبورد اصلی Business Intelligence
   */
  getDashboard: async (req: Request, res: Response) => {
    try {
      const { period = '30d', startDate, endDate } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }

      // تعیین بازه زمانی
      let dateRange: DateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      } else {
        const endTime = new Date();
        const startTime = new Date();
        
        switch (period) {
          case '7d':
            startTime.setDate(endTime.getDate() - 7);
            break;
          case '30d':
            startTime.setDate(endTime.getDate() - 30);
            break;
          case '90d':
            startTime.setDate(endTime.getDate() - 90);
            break;
          case '1y':
            startTime.setFullYear(endTime.getFullYear() - 1);
            break;
          default:
            startTime.setDate(endTime.getDate() - 30);
        }
        
        dateRange = { start: startTime, end: endTime };
      }

      const dashboard = await BiService.buildExecutiveDashboard(dateRange, userId, req.tenant.id);

      res.json({
        success: true,
        data: dashboard,
        message: 'داشبورد با موفقیت بارگذاری شد'
      });
    } catch (error) {
      console.error('Error getting BI dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگذاری داشبورد',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/kpis
   * دریافت KPI های اصلی
   */
  getKPIs: async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      
      // تعیین بازه زمانی
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - parseInt(period as string || '30'));
      
      const dateRange: DateRange = { start: startTime, end: endTime };

      const [
        totalRevenue,
        netProfit,
        profitMargin,
        inventoryTurnover,
        averageOrderValue,
        stockoutRate
      ] = await Promise.all([
        BiService.calculateTotalRevenue(dateRange, req.tenant.id),
        BiService.calculateNetProfit(dateRange, req.tenant.id),
        BiService.calculateProfitMargin(dateRange, req.tenant.id),
        BiService.calculateInventoryTurnover(dateRange, req.tenant.id),
        BiService.calculateAverageOrderValue(dateRange, req.tenant.id),
        BiService.calculateStockoutRate(dateRange, req.tenant.id)
      ]);

      res.json({
        success: true,
        data: {
          financial: {
            totalRevenue,
            netProfit,
            profitMargin
          },
          operational: {
            inventoryTurnover,
            averageOrderValue,
            stockoutRate
          }
        },
        message: 'KPI ها با موفقیت محاسبه شدند'
      });
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در محاسبه KPI ها',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/analytics/summary
   * دریافت خلاصه آمار تحلیلی
   */
  getAnalyticsSummary: async (req: Request, res: Response) => {
    try {
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      
      const analyticsSummary = await BiService.getAnalyticsSummary(req.tenant.id);

      res.json({
        success: true,
        data: analyticsSummary,
        message: 'خلاصه آمار تحلیلی با موفقیت بارگذاری شد'
      });
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگذاری خلاصه آمار تحلیلی',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/analytics/abc-analysis
   * انجام تحلیل ABC محصولات
   */
  getABCAnalysis: async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - parseInt(period as string || '30'));
      
      const dateRange: DateRange = { start: startTime, end: endTime };
      
      const abcAnalysis = await BiService.performABCAnalysis(dateRange, req.tenant.id);

      res.json({
        success: true,
        data: abcAnalysis,
        message: 'تحلیل ABC با موفقیت انجام شد'
      });
    } catch (error) {
      console.error('Error performing ABC analysis:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در انجام تحلیل ABC',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/analytics/profit-analysis
   * تحلیل سودآوری
   */
  getProfitAnalysis: async (req: Request, res: Response) => {
    try {
      const { period = '30d', groupBy = 'item' } = req.query;
      
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - parseInt(period as string || '30'));
      
      const dateRange: DateRange = { start: startTime, end: endTime };
      
      const profitAnalysis = await BiService.performProfitAnalysis(
        dateRange, 
        groupBy as 'item' | 'category',
        req.tenant.id
      );

      res.json({
        success: true,
        data: profitAnalysis,
        message: 'تحلیل سودآوری با موفقیت انجام شد'
      });
    } catch (error) {
      console.error('Error performing profit analysis:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در انجام تحلیل سودآوری',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/analytics/trends
   * تحلیل روندها
   */
  getTrends: async (req: Request, res: Response) => {
    try {
      const { 
        metric = 'revenue', 
        period = '30d', 
        granularity = 'daily' 
      } = req.query;
      
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      
      const endTime = new Date();
      const startTime = new Date();
      
      // تعیین بازه زمانی بر اساس granularity
      switch (granularity) {
        case 'daily':
          startTime.setDate(endTime.getDate() - parseInt(period as string || '30'));
          break;
        case 'weekly':
          startTime.setDate(endTime.getDate() - (parseInt(period as string || '4') * 7));
          break;
        case 'monthly':
          startTime.setMonth(endTime.getMonth() - parseInt(period as string || '12'));
          break;
      }
      
      const dateRange: DateRange = { start: startTime, end: endTime };
      
      const trendAnalysis = await BiService.performTrendAnalysis(
        metric as 'revenue' | 'profit' | 'sales_volume' | 'customers',
        dateRange,
        granularity as 'daily' | 'weekly' | 'monthly',
        req.tenant.id
      );

      res.json({
        success: true,
        data: trendAnalysis,
        message: 'تحلیل روند با موفقیت انجام شد'
      });
    } catch (error) {
      console.error('Error performing trend analysis:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در انجام تحلیل روند',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/reports
   * ایجاد گزارش سفارشی
   */
  createCustomReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      const reportConfig = req.body;

      // اعتبارسنجی ورودی
      if (!reportConfig.name || !reportConfig.columnsConfig || !Array.isArray(reportConfig.columnsConfig)) {
        return res.status(400).json({
          success: false,
          message: 'اطلاعات گزارش ناقص است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }
      
      const report = await ReportService.createReport(reportConfig, userId, req.tenant.id);

      res.json({
        success: true,
        data: report,
        message: 'گزارش سفارشی با موفقیت ایجاد شد'
      });
    } catch (error) {
      console.error('Error creating custom report:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد گزارش سفارشی',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/reports
   * دریافت لیست گزارش‌های سفارشی
   */
  getCustomReports: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, search, reportType, tags } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      const parsedTags = tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined;

      const result = await ReportService.getReports(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        reportType as string,
        parsedTags
      );

      res.json({
        success: true,
        data: result,
        message: 'گزارش‌ها با موفقیت دریافت شدند'
      });
    } catch (error) {
      console.error('Error getting custom reports:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت گزارش‌ها',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/reports/preview/execute
   * اجرای پیش‌نمایش گزارش موقت
   */
  executeTemporaryReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({ error: 'نیاز به شناسایی مجموعه' });
      }

      const { reportConfig, parameters } = req.body;

      if (!reportConfig) {
        return res.status(400).json({ error: 'تنظیمات گزارش الزامی است' });
      }

      // CRITICAL: Pass tenantId for security
      const result = await ReportService.executeTemporaryReport(
        reportConfig, 
        userId, 
        req.tenant.id, // Pass tenantId for security
        parameters
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in executeTemporaryReport:', error);
      res.status(500).json({
        error: 'خطا در اجرای گزارش موقت',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * POST /api/bi/reports/:id/execute
   * اجرای گزارش سفارشی ذخیره شده
   */
  executeReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه'
        });
      }

      const { id } = req.params;
      const { parameters, exportFormat = 'VIEW' } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'شناسه گزارش الزامی است'
        });
      }

      // CRITICAL: Pass tenantId for security
      const result = await ReportService.executeReport(id, userId, parameters, exportFormat, req.tenant.id);

      res.json({
        success: true,
        data: result,
        message: 'گزارش با موفقیت اجرا شد'
      });
    } catch (error) {
      console.error('Error executing report:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در اجرای گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/reports/:id/executions
   * دریافت تاریخچه اجرای گزارش
   */
  getExecutionHistory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'شناسه گزارش الزامی است'
        });
      }

      const result = await ReportService.getExecutionHistory(
        id,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
        message: 'تاریخچه اجرا با موفقیت دریافت شد'
      });
    } catch (error) {
      console.error('Error getting execution history:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت تاریخچه اجرا',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/reports/fields/available
   * دریافت فیلدهای موجود برای گزارش‌سازی
   */
  getAvailableFields: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      const fields = QueryBuilder.getAvailableFields();

      res.json({
        success: true,
        data: fields,
        message: 'فیلدهای موجود با موفقیت دریافت شدند'
      });
    } catch (error) {
      console.error('Error getting available fields:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت فیلدهای موجود',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/reports/popular/list
   * دریافت گزارش‌های محبوب
   */
  getPopularReports: async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      const reports = await ReportService.getPopularReports(userId, parseInt(limit as string));

      res.json({
        success: true,
        data: reports,
        message: 'گزارش‌های محبوب با موفقیت دریافت شدند'
      });
    } catch (error) {
      console.error('Error getting popular reports:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت گزارش‌های محبوب',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/reports/search/advanced
   * جستجوی پیشرفته گزارش‌ها
   */
  searchReports: async (req: Request, res: Response) => {
    try {
      const { searchTerm, filters = {} } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!searchTerm || typeof searchTerm !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'عبارت جستجو الزامی است'
        });
      }

      const reports = await ReportService.searchReports(userId, searchTerm, filters);

      res.json({
        success: true,
        data: reports,
        message: 'جستجو با موفقیت انجام شد'
      });
    } catch (error) {
      console.error('Error searching reports:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در جستجوی گزارش‌ها',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/export/:reportId
   * خروجی گرفتن از گزارش
   */
  exportReport: async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { format = 'excel', includeCharts = false } = req.query;

      // TODO: Implement report export logic
      // This would generate the report in the requested format
      // and return it as a downloadable file

      res.json({
        success: true,
        message: 'خروجی گزارش در حال آماده‌سازی است',
        data: {
          downloadUrl: `/api/bi/download/${reportId}`,
          format,
          estimatedSize: '2.5 MB'
        }
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در خروجی گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/insights
   * دریافت بینش‌های هوشمند
   */
  getInsights: async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - parseInt(period as string || '30'));
      
      const dateRange: DateRange = { start: startTime, end: endTime };

      // TODO: Implement intelligent insights generation
      // This would analyze various metrics and provide actionable insights

      const mockInsights = [
        {
          type: 'OPPORTUNITY',
          title: 'فرصت افزایش فروش',
          message: 'قهوه اسپرسو 25% رشد فروش داشته - فرصت افزایش موجودی',
          priority: 'HIGH',
          action: 'سفارش 10 کیلوگرم اضافه قهوه اسپرسو',
          impact: 'افزایش درآمد ماهانه 15%'
        },
        {
          type: 'WARNING',
          title: 'کاهش حاشیه سود',
          message: 'حاشیه سود شیرینی‌ها 8% کاهش یافته',
          priority: 'MEDIUM',
          action: 'بررسی قیمت‌های تأمین‌کنندگان',
          impact: 'حفظ سودآوری'
        },
        {
          type: 'SUCCESS',
          title: 'بهبود گردش موجودی',
          message: 'گردش موجودی 15% بهبود یافته',
          priority: 'LOW',
          action: 'ادامه روند فعلی',
          impact: 'کاهش هزینه‌های نگهداری'
        }
      ];

      res.json({
        success: true,
        data: mockInsights,
        message: 'بینش‌ها با موفقیت تولید شدند'
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در تولید بینش‌ها',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/reports/:id
   * دریافت گزارش سفارشی بر اساس ID
   */
  getReportById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'شناسه گزارش الزامی است'
        });
      }

      const report = await ReportService.getReportById(id, userId);

      res.json({
        success: true,
        data: report,
        message: 'گزارش با موفقیت دریافت شد'
      });
    } catch (error) {
      console.error('Error getting report by ID:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * PUT /api/bi/reports/:id
   * بروزرسانی گزارش سفارشی
   */
  updateReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'شناسه گزارش الزامی است'
        });
      }

      const updatedReport = await ReportService.updateReport(id, userId, updates);

      res.json({
        success: true,
        data: updatedReport,
        message: 'گزارش با موفقیت بروزرسانی شد'
      });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * DELETE /api/bi/reports/:id
   * حذف گزارش سفارشی
   */
  deleteReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'شناسه گزارش الزامی است'
        });
      }

      await ReportService.deleteReport(id, userId);

      res.json({
        success: true,
        message: 'گزارش با موفقیت حذف شد'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در حذف گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/reports/:id/share
   * اشتراک‌گذاری گزارش
   */
  shareReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { sharedWith } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'شناسه گزارش الزامی است'
        });
      }

      if (!Array.isArray(sharedWith)) {
        return res.status(400).json({
          success: false,
          message: 'لیست کاربران برای اشتراک‌گذاری الزامی است'
        });
      }

      const updatedReport = await ReportService.shareReport(id, userId, sharedWith);

      res.json({
        success: true,
        data: updatedReport,
        message: 'گزارش با موفقیت به اشتراک گذاشته شد'
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در اشتراک‌گذاری گزارش',
        error: (error as Error).message
      });
    }
  }
}; 