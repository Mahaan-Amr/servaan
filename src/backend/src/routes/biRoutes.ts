import { Router } from 'express';
import { biController } from '../controllers/biController';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../services/dbService';

const router = Router();

// تمام route های BI نیاز به احراز هویت دارند
router.use(authenticate);

/**
 * Dashboard و KPI Routes
 */

// دریافت داشبورد اصلی Business Intelligence
router.get('/dashboard', biController.getDashboard);

// دریافت لیست KPI های موجود
router.get('/kpis', biController.getKPIs);

/**
 * Analytics Routes
 */

// دریافت خلاصه آمار تحلیلی
router.get('/analytics/summary', biController.getAnalyticsSummary);

// تحلیل ABC محصولات
router.get('/analytics/abc-analysis', biController.getABCAnalysis);

// تحلیل سودآوری
router.get('/analytics/profit-analysis', biController.getProfitAnalysis);

// تحلیل روندها
router.get('/analytics/trends', biController.getTrends);

/**
 * Custom Reports Routes
 */

// IMPORTANT: Specific routes must come BEFORE parametric routes!

// Get reports count (MUST come before /reports/:id)
router.get('/reports/count', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است'
      });
    }

    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // Filter by tenant through user relation
    const count = await prisma.customReport.count({
      where: {
        AND: [
          { isActive: true },
          {
            creator: {
              tenantId: req.tenant.id
            }
          },
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
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting reports count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد گزارش‌ها',
      error: (error as Error).message
    });
  }
});

// Get today's reports exports count (MUST come before /reports/:id)
router.get('/reports/exports/today/count', async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // For MVP, return count without tenant filtering but with auth requirement
    // ReportExecution model needs proper tenant awareness
    const count = await prisma.reportExecution.count({
      where: {
        executedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting today exports count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد خروجی‌های امروز',
      error: (error as Error).message
    });
  }
});

// دریافت فیلدهای موجود برای گزارش‌سازی (MUST come before /reports/:id)
router.get('/reports/fields/available', biController.getAvailableFields);

// دریافت گزارش‌های محبوب (MUST come before /reports/:id)
router.get('/reports/popular/list', biController.getPopularReports);

// اجرای پیش‌نمایش گزارش موقت (MUST come before /reports/:id)
router.post('/reports/preview/execute', biController.executeTemporaryReport);

// جستجوی پیشرفته گزارش‌ها (MUST come before /reports/:id)
router.post('/reports/search/advanced', biController.searchReports);

// ایجاد گزارش سفارشی
router.post('/reports', biController.createCustomReport);

// دریافت لیست گزارش‌های سفارشی
router.get('/reports', biController.getCustomReports);

// دریافت گزارش سفارشی بر اساس ID (MUST come after specific routes)
router.get('/reports/:id', biController.getReportById);

// بروزرسانی گزارش سفارشی
router.put('/reports/:id', biController.updateReport);

// حذف گزارش سفارشی
router.delete('/reports/:id', biController.deleteReport);

// اشتراک‌گذاری گزارش
router.post('/reports/:id/share', biController.shareReport);

// اجرای گزارش سفارشی
router.post('/reports/:id/execute', biController.executeReport);

// دریافت تاریخچه اجرای گزارش
router.get('/reports/:id/executions', biController.getExecutionHistory);

/**
 * Export Routes
 */

// خروجی گرفتن از گزارش
router.get('/export/:reportId', biController.exportReport);

/**
 * Insights Routes
 */

// دریافت بینش‌های هوشمند
router.get('/insights', biController.getInsights);

export default router; 
