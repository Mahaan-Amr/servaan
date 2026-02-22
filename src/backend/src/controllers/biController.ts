import { Request, Response } from 'express';
import { BiService } from '../services/biService';
import { ReportService } from '../services/reportService';
import { ReportTemplateService } from '../services/reportTemplateService';
import { QueryBuilder } from '../services/queryBuilder';
import { DateRange } from '../types/bi';
import { dataAggregatorService, AggregationQuery } from '../services/bi/aggregators/DataAggregatorService';
import { OrderingConnector } from '../services/bi/connectors/OrderingConnector';
import { InventoryConnector } from '../services/bi/connectors/InventoryConnector';

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

      // Get workspace selector from query (default: 'merged' for backward compatibility)
      const workspace = (req.query.workspace as string) || 'merged';

      const dashboard = await BiService.buildExecutiveDashboard(
        dateRange, 
        userId, 
        req.tenant.id
      );

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
        granularity = 'day' 
      } = req.query;
      
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }
      
      // Map frontend granularity to backend format
      const granularityMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
        'day': 'daily',
        'week': 'weekly',
        'month': 'monthly',
        'daily': 'daily',
        'weekly': 'weekly',
        'monthly': 'monthly'
      };
      
      const backendGranularity = granularityMap[granularity as string] || 'daily';
      
      // Parse period string (e.g., '30d', '7d', '90d', '1y')
      const periodStr = (period as string || '30d').toLowerCase();
      let days = 30;
      
      if (periodStr.endsWith('d')) {
        days = parseInt(periodStr.replace('d', '')) || 30;
      } else if (periodStr.endsWith('y')) {
        const years = parseInt(periodStr.replace('y', '')) || 1;
        days = years * 365;
      } else if (periodStr.endsWith('m')) {
        const months = parseInt(periodStr.replace('m', '')) || 1;
        days = months * 30;
      } else {
        days = parseInt(periodStr) || 30;
      }
      
      const endTime = new Date();
      const startTime = new Date();
      
      // تعیین بازه زمانی بر اساس granularity
      switch (backendGranularity) {
        case 'daily':
          startTime.setDate(endTime.getDate() - days);
          break;
        case 'weekly':
          const weeks = Math.ceil(days / 7);
          startTime.setDate(endTime.getDate() - (weeks * 7));
          break;
        case 'monthly':
          const months = Math.ceil(days / 30);
          startTime.setMonth(endTime.getMonth() - months);
          break;
      }
      
      const dateRange: DateRange = { start: startTime, end: endTime };
      
      console.log('🔍 Trend analysis request:', {
        metric,
        period: periodStr,
        days,
        granularity: backendGranularity,
        dateRange: { start: startTime.toISOString(), end: endTime.toISOString() },
        tenantId: req.tenant.id
      });
      
      const trendAnalysis = await BiService.performTrendAnalysis(
        metric as 'revenue' | 'profit' | 'sales_volume' | 'customers',
        dateRange,
        backendGranularity,
        req.tenant.id
      );

      res.json({
        success: true,
        data: trendAnalysis,
        message: 'تحلیل روند با موفقیت انجام شد'
      });
    } catch (error) {
      console.error('❌ Error performing trend analysis:', error);
      console.error('❌ Error stack:', (error as Error).stack);
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

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const result = await ReportService.getReports(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        reportType as string,
        parsedTags,
        req.tenant.id // CRITICAL: Pass tenantId for security
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

      // If export format is not VIEW, send file download
      if (exportFormat !== 'VIEW' && result.exportFile) {
        const fileStream = require('fs').createReadStream(result.exportFile.filePath);
        
        res.setHeader('Content-Type', result.exportFile.mimeType);
        
        // Properly encode filename for Content-Disposition header
        const encodedFilename = encodeURIComponent(result.exportFile.filename);
        const safeFilename = result.exportFile.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Use RFC 6266 compliant format for international filenames
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
        );
        
        fileStream.pipe(res);
        
        // Clean up file after sending
        fileStream.on('end', async () => {
          await ReportService.cleanupTempFile(result.exportFile!.filePath);
        });
        
        fileStream.on('error', async (error: Error) => {
          console.error('Error streaming file:', error);
          await ReportService.cleanupTempFile(result.exportFile!.filePath);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'خطا در ارسال فایل'
            });
          }
        });
        
        return;
      }

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

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const report = await ReportService.getReportById(id, userId, req.tenant.id);

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

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const updatedReport = await ReportService.updateReport(id, userId, updates, req.tenant.id);

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

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      await ReportService.deleteReport(id, userId, req.tenant.id);

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
  },

  /**
   * POST /api/bi/aggregate
   * Execute aggregation queries across multiple workspaces
   * CRITICAL: All queries are tenant-aware
   */
  aggregate: async (req: Request, res: Response) => {
    try {
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }

      const aggregationQuery: AggregationQuery = req.body;

      // Validate required fields
      if (!aggregationQuery.workspaces || !Array.isArray(aggregationQuery.workspaces) || aggregationQuery.workspaces.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'حداقل یک workspace باید مشخص شود',
          error: 'At least one workspace is required'
        });
      }

      if (!aggregationQuery.joinType) {
        return res.status(400).json({
          success: false,
          message: 'نوع join الزامی است',
          error: 'Join type is required'
        });
      }

      if (!aggregationQuery.fields || !Array.isArray(aggregationQuery.fields) || aggregationQuery.fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'حداقل یک فیلد باید مشخص شود',
          error: 'At least one field is required'
        });
      }

      // Log the query for debugging
      console.log('🔍 Aggregation Query:', JSON.stringify(aggregationQuery, null, 2));
      console.log('🔍 Tenant ID:', req.tenant.id);

      // CRITICAL: Execute aggregation with tenantId
      const result = await dataAggregatorService.aggregate(aggregationQuery, req.tenant.id);

      console.log('✅ Aggregation successful, result count:', result.rowCount);

      res.json({
        success: true,
        data: result,
        message: 'داده‌ها با موفقیت تجمیع شدند'
      });
    } catch (error) {
      console.error('❌ Error aggregating data:', error);
      console.error('❌ Error stack:', (error as Error).stack);
      res.status(500).json({
        success: false,
        message: 'خطا در تجمیع داده‌ها',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/schema
   * Get available data schemas from all workspace connectors
   * CRITICAL: All schemas are tenant-aware
   */
  getSchema: async (req: Request, res: Response) => {
    try {
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }

      const { workspace } = req.query;

      // If specific workspace requested, return only that schema
      if (workspace) {
        let connector;
        if (workspace === 'ordering') {
          connector = new OrderingConnector();
        } else if (workspace === 'inventory') {
          connector = new InventoryConnector();
        } else {
          return res.status(400).json({
            success: false,
            message: `Workspace نامعتبر: ${workspace}`,
            error: `Invalid workspace: ${workspace}`
          });
        }

        // CRITICAL: Get schema with tenantId
        const schema = await connector.getSchema(req.tenant.id);

        return res.json({
          success: true,
          data: {
            workspace: connector.workspaceId,
            name: connector.name,
            schema
          },
          message: 'Schema با موفقیت دریافت شد'
        });
      }

      // Return all available schemas
      const orderingConnector = new OrderingConnector();
      const inventoryConnector = new InventoryConnector();

      const [orderingSchema, inventorySchema] = await Promise.all([
        orderingConnector.getSchema(req.tenant.id),
        inventoryConnector.getSchema(req.tenant.id)
      ]);

      res.json({
        success: true,
        data: {
          workspaces: [
            {
              workspace: orderingConnector.workspaceId,
              name: orderingConnector.name,
              schema: orderingSchema
            },
            {
              workspace: inventoryConnector.workspaceId,
              name: inventoryConnector.name,
              schema: inventorySchema
            }
          ]
        },
        message: 'Schema های موجود با موفقیت دریافت شدند'
      });
    } catch (error) {
      console.error('Error getting schema:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت schema',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/explore
   * Data exploration endpoint - simplified query interface
   * CRITICAL: All queries are tenant-aware
   */
  explore: async (req: Request, res: Response) => {
    try {
      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'نیاز به شناسایی مجموعه',
          error: 'Tenant context required'
        });
      }

      const {
        workspaces,
        fields,
        filters,
        groupBy,
        orderBy,
        limit = 100,
        offset = 0
      } = req.body;

      // Validate inputs
      if (!workspaces || !Array.isArray(workspaces) || workspaces.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'حداقل یک workspace باید مشخص شود',
          error: 'At least one workspace is required'
        });
      }

      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'حداقل یک فیلد باید مشخص شود',
          error: 'At least one field is required'
        });
      }

      // Build aggregation query
      const aggregationQuery: AggregationQuery = {
        workspaces,
        joinType: workspaces.length > 1 ? (req.body.joinType || 'INNER') : 'UNION',
        joinKeys: req.body.joinKeys,
        fields: fields.map((f: any) => ({
          workspace: f.workspace,
          table: f.table,
          field: f.field,
          alias: f.alias,
          aggregation: f.aggregation || 'none'
        })),
        filters: filters?.map((f: any) => ({
          workspace: f.workspace,
          table: f.table,
          field: f.field,
          operator: f.operator || 'equals',
          value: f.value
        })),
        groupBy,
        orderBy: orderBy?.map((o: any) => ({
          field: o.field,
          direction: o.direction || 'asc'
        })),
        limit: Math.min(limit, 1000), // Cap at 1000 rows
        offset
      };

      // CRITICAL: Execute exploration with tenantId
      const result = await dataAggregatorService.aggregate(aggregationQuery, req.tenant.id);

      res.json({
        success: true,
        data: result,
        message: 'اکتشاف داده با موفقیت انجام شد'
      });
    } catch (error) {
      console.error('Error exploring data:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در اکتشاف داده',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/templates
   * دریافت لیست قالب‌های گزارش
   */
  getTemplates: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const { category, reportType, isPublic, isSystemTemplate, search, tags, page, limit } = req.query;

      const templates = await ReportTemplateService.getTemplates(
        userId,
        req.tenant.id,
        {
          category: category as string,
          reportType: reportType as string,
          isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
          isSystemTemplate: isSystemTemplate === 'true' ? true : isSystemTemplate === 'false' ? false : undefined,
          search: search as string,
          tags: tags ? (tags as string).split(',') : undefined
        },
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20
        }
      );

      // Include system templates
      const systemTemplates = ReportTemplateService.getSystemTemplates();
      const allTemplates = {
        templates: [...systemTemplates, ...templates.templates],
        pagination: {
          ...templates.pagination,
          total: templates.pagination.total + systemTemplates.length
        }
      };

      res.json({
        success: true,
        data: allTemplates,
        message: 'قالب‌های گزارش با موفقیت دریافت شدند'
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت قالب‌های گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * GET /api/bi/templates/:id
   * دریافت قالب گزارش بر اساس ID
   */
  getTemplateById: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const { id } = req.params;

      // Check if it's a system template
      const systemTemplates = ReportTemplateService.getSystemTemplates();
      const systemTemplate = systemTemplates.find(t => t.id === id);

      if (systemTemplate) {
        return res.json({
          success: true,
          data: systemTemplate,
          message: 'قالب گزارش با موفقیت دریافت شد'
        });
      }

      const template = await ReportTemplateService.getTemplateById(id, userId, req.tenant.id);

      res.json({
        success: true,
        data: template,
        message: 'قالب گزارش با موفقیت دریافت شد'
      });
    } catch (error) {
      console.error('Error getting template by ID:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت قالب گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/templates
   * ایجاد قالب گزارش جدید
   */
  createTemplate: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const templateData = req.body;

      if (!templateData.name || !templateData.config) {
        return res.status(400).json({
          success: false,
          message: 'نام و تنظیمات قالب الزامی است'
        });
      }

      const template = await ReportTemplateService.createTemplate(
        templateData,
        userId,
        req.tenant.id
      );

      res.json({
        success: true,
        data: template,
        message: 'قالب گزارش با موفقیت ایجاد شد'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد قالب گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * PUT /api/bi/templates/:id
   * بروزرسانی قالب گزارش
   */
  updateTemplate: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const template = await ReportTemplateService.updateTemplate(
        id,
        updateData,
        userId,
        req.tenant.id
      );

      res.json({
        success: true,
        data: template,
        message: 'قالب گزارش با موفقیت بروزرسانی شد'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بروزرسانی قالب گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * DELETE /api/bi/templates/:id
   * حذف قالب گزارش
   */
  deleteTemplate: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const { id } = req.params;

      await ReportTemplateService.deleteTemplate(id, userId, req.tenant.id);

      res.json({
        success: true,
        message: 'قالب گزارش با موفقیت حذف شد'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در حذف قالب گزارش',
        error: (error as Error).message
      });
    }
  },

  /**
   * POST /api/bi/templates/:id/create-report
   * ایجاد گزارش از قالب
   */
  createReportFromTemplate: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'کاربر احراز هویت نشده است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      const { id } = req.params;
      const { reportName, customizations } = req.body;

      if (!reportName) {
        return res.status(400).json({
          success: false,
          message: 'نام گزارش الزامی است'
        });
      }

      const report = await ReportTemplateService.createReportFromTemplate(
        id,
        reportName,
        userId,
        req.tenant.id,
        customizations
      );

      res.json({
        success: true,
        data: report,
        message: 'گزارش از قالب با موفقیت ایجاد شد'
      });
    } catch (error) {
      console.error('Error creating report from template:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد گزارش از قالب',
        error: (error as Error).message
      });
    }
  }
}; 
