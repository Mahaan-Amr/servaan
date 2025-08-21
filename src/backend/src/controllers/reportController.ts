import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';

export class ReportController {
  /**
   * دریافت لیست گزارش‌های سفارشی
   */
  static async getReports(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
      const search = req.query.search as string;
      const reportType = req.query.reportType as string;
      const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;

      const result = await ReportService.getReports(userId, page, limit, search, reportType, tags);

      res.status(200).json({
        success: true,
        data: result.reports,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        error: 'خطا در دریافت گزارش‌ها',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ایجاد گزارش سفارشی جدید
   */
  static async createReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const reportConfig = req.body;
      
      // Validate required fields
      if (!reportConfig.name || !reportConfig.reportType) {
        return res.status(400).json({
          error: 'نام گزارش و نوع گزارش الزامی است'
        });
      }

      if (!req.tenant?.id) {
        return res.status(400).json({
          error: 'Tenant context required'
        });
      }
      
      const report = await ReportService.createReport(reportConfig, userId, req.tenant.id);

      res.status(201).json({
        success: true,
        data: report,
        message: 'گزارش با موفقیت ایجاد شد'
      });
    } catch (error) {
      console.error('Error in createReport:', error);
      res.status(500).json({
        error: 'خطا در ایجاد گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * دریافت جزئیات یک گزارش
   */
  static async getReportById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const { id } = req.params;
      const report = await ReportService.getReportById(id, userId);

      if (!report) {
        return res.status(404).json({ error: 'گزارش یافت نشد' });
      }

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error in getReportById:', error);
      res.status(500).json({
        error: 'خطا در دریافت گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * اجرای گزارش
   */
  static async executeReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({ error: 'نیاز به شناسایی مجموعه' });
      }

      const { id } = req.params;
      const { parameters, format = 'VIEW' } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'شناسه گزارش الزامی است' });
      }

      // CRITICAL: Pass tenantId for security
      const result = await ReportService.executeReport(id, userId, parameters, format, req.tenant.id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in executeReport:', error);
      res.status(500).json({
        error: 'خطا در اجرای گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * بروزرسانی گزارش
   */
  static async updateReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const { id } = req.params;
      const updates = req.body;

      const report = await ReportService.updateReport(id, userId, updates);

      res.status(200).json({
        success: true,
        data: report,
        message: 'گزارش با موفقیت بروزرسانی شد'
      });
    } catch (error) {
      console.error('Error in updateReport:', error);
      res.status(500).json({
        error: 'خطا در بروزرسانی گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * حذف گزارش
   */
  static async deleteReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const { id } = req.params;
      await ReportService.deleteReport(id, userId);

      res.status(200).json({
        success: true,
        message: 'گزارش با موفقیت حذف شد'
      });
    } catch (error) {
      console.error('Error in deleteReport:', error);
      res.status(500).json({
        error: 'خطا در حذف گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * اشتراک گذاری گزارش
   */
  static async shareReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const { id } = req.params;
      const { sharedWith } = req.body;

      if (!Array.isArray(sharedWith)) {
        return res.status(400).json({
          error: 'فهرست کاربران برای اشتراک گذاری الزامی است'
        });
      }

      const report = await ReportService.shareReport(id, userId, sharedWith);

      res.status(200).json({
        success: true,
        data: report,
        message: 'گزارش با موفقیت به اشتراک گذاشته شد'
      });
    } catch (error) {
      console.error('Error in shareReport:', error);
      res.status(500).json({
        error: 'خطا در اشتراک گذاری گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * دریافت تاریخچه اجرای گزارش
   */
  static async getExecutionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const result = await ReportService.getExecutionHistory(id, userId, page, limit);

      res.status(200).json({
        success: true,
        data: result.executions,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getExecutionHistory:', error);
      res.status(500).json({
        error: 'خطا در دریافت تاریخچه اجرا',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * دریافت گزارش‌های پرطرفدار
   */
  static async getPopularReports(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const reports = await ReportService.getPopularReports(userId, limit);

      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('Error in getPopularReports:', error);
      res.status(500).json({
        error: 'خطا در دریافت گزارش‌های پرطرفدار',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * جستجو در گزارش‌ها
   */
  static async searchReports(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.status(400).json({ error: 'عبارت جستجو الزامی است' });
      }

      const filters = {
        reportType: req.query.reportType as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        createdBy: req.query.createdBy as string
      };

      const reports = await ReportService.searchReports(userId, searchTerm, filters);

      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('Error in searchReports:', error);
      res.status(500).json({
        error: 'خطا در جستجو',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * اجرای گزارش موقت (بدون ذخیره)
   */
  static async executeTemporaryReport(req: Request, res: Response) {
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
  }

  /**
   * دریافت تعداد کل گزارش‌ها
   */
  static async getReportsCount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      // Count reports accessible to the user
      const where: any = {
        AND: [
          { isActive: true },
          {
            OR: [
              { createdBy: userId },
              { isPublic: true },
              {
                sharedWith: {
                  string_contains: userId
                }
              }
            ]
          }
        ]
      };

      const count = await ReportService.getReportsCount(userId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error in getReportsCount:', error);
      res.status(500).json({
        error: 'خطا در دریافت تعداد گزارش‌ها',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * دریافت فیلدهای موجود برای گزارش‌سازی
   */
  static async getAvailableFields(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      const fields = await ReportService.getAvailableFields();

      res.status(200).json({
        success: true,
        data: fields
      });
    } catch (error) {
      console.error('Error in getAvailableFields:', error);
      res.status(500).json({
        error: 'خطا در دریافت فیلدهای موجود',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * صادرات گزارش به فرمت‌های مختلف
   */
  static async exportReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
      }

      // CRITICAL: Ensure tenant context is available
      if (!req.tenant?.id) {
        return res.status(400).json({ error: 'نیاز به شناسایی مجموعه' });
      }

      const { id } = req.params;
      const { parameters, format = 'EXCEL' } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'شناسه گزارش الزامی است' });
      }

      // First execute the report to get data
      const executionResult = await ReportService.executeReport(id, userId, parameters, 'VIEW', req.tenant.id);
      
      if (executionResult.status !== 'SUCCESS' || !executionResult.data) {
        return res.status(400).json({ error: 'خطا در اجرای گزارش برای صادرات' });
      }

      // Get report details for naming
      const report = await ReportService.getReportById(id, userId);
      
      // Export the data
      const exportResult = await ReportService.exportReport(
        executionResult.data,
        report.name,
        format as 'PDF' | 'EXCEL' | 'CSV'
      );

      // Send file as download
      res.setHeader('Content-Type', exportResult.mimeType);
      
      // Properly encode filename for Content-Disposition header
      // Handle Persian/Unicode characters by URL encoding
      const encodedFilename = encodeURIComponent(exportResult.filename);
      const safeFilename = exportResult.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Use RFC 6266 compliant format for international filenames
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      
      const fileStream = require('fs').createReadStream(exportResult.filePath);
      fileStream.pipe(res);
      
      // Clean up file after sending
      fileStream.on('end', async () => {
        await ReportService.cleanupTempFile(exportResult.filePath);
      });

    } catch (error) {
      console.error('Error in exportReport:', error);
      res.status(500).json({
        error: 'خطا در صادرات گزارش',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
