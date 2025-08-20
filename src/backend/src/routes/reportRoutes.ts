import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/reports
 * @desc دریافت لیست گزارش‌های سفارشی
 * @access Private
 */
router.get('/', ReportController.getReports);

/**
 * @route POST /api/reports
 * @desc ایجاد گزارش سفارشی جدید
 * @access Private
 */
router.post('/', ReportController.createReport);

/**
 * @route GET /api/reports/count
 * @desc دریافت تعداد کل گزارش‌ها
 * @access Private
 */
router.get('/count', ReportController.getReportsCount);

/**
 * @route GET /api/reports/available-fields
 * @desc دریافت فیلدهای موجود برای گزارش‌سازی
 * @access Private
 */
router.get('/available-fields', ReportController.getAvailableFields);

/**
 * @route GET /api/reports/popular
 * @desc دریافت گزارش‌های پرطرفدار
 * @access Private
 */
router.get('/popular', ReportController.getPopularReports);

/**
 * @route GET /api/reports/search
 * @desc جستجو در گزارش‌ها
 * @access Private
 */
router.get('/search', ReportController.searchReports);

/**
 * @route POST /api/reports/execute-temporary
 * @desc اجرای گزارش موقت (بدون ذخیره)
 * @access Private
 */
router.post('/execute-temporary', ReportController.executeTemporaryReport);

/**
 * @route GET /api/reports/:id
 * @desc دریافت جزئیات یک گزارش
 * @access Private
 */
router.get('/:id', ReportController.getReportById);

/**
 * @route PUT /api/reports/:id
 * @desc بروزرسانی گزارش
 * @access Private
 */
router.put('/:id', ReportController.updateReport);

/**
 * @route DELETE /api/reports/:id
 * @desc حذف گزارش
 * @access Private
 */
router.delete('/:id', ReportController.deleteReport);

/**
 * @route POST /api/reports/:id/execute
 * @desc اجرای گزارش
 * @access Private
 */
router.post('/:id/execute', ReportController.executeReport);

/**
 * @route POST /api/reports/:id/share
 * @desc اشتراک گذاری گزارش
 * @access Private
 */
router.post('/:id/share', ReportController.shareReport);

/**
 * @route GET /api/reports/:id/execution-history
 * @desc دریافت تاریخچه اجرای گزارش
 * @access Private
 */
router.get('/:id/execution-history', ReportController.getExecutionHistory);

/**
 * @route POST /api/reports/:id/export
 * @desc صادرات گزارش به فرمت‌های مختلف
 * @access Private
 */
router.post('/:id/export', ReportController.exportReport);

export default router; 