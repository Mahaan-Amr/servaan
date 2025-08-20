import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import {
  createVisit,
  getVisitById,
  updateVisit,
  getVisits,
  getCustomerVisitHistory,
  getVisitAnalytics,
  deleteVisit,
  VisitCreateData,
  VisitUpdateData,
  VisitFilter
} from '../services/visitTrackingService';

const router = Router();

// Validation schemas
const visitCreateSchema = z.object({
  customerId: z.string().uuid('شناسه مشتری نامعتبر است'),
  totalAmount: z.number().min(0, 'مبلغ کل باید مثبت باشد'),
  discountAmount: z.number().min(0, 'مبلغ تخفیف نمی‌تواند منفی باشد').optional().default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE', 'POINTS', 'MIXED']).optional(),
  itemsOrdered: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    category: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  tableNumber: z.string().max(10, 'شماره میز نباید بیش از 10 کاراکتر باشد').optional(),
  serverName: z.string().max(100, 'نام سرور نباید بیش از 100 کاراکتر باشد').optional(),
  serviceDuration: z.number().min(0, 'مدت سرویس نمی‌تواند منفی باشد').optional(),
  feedbackRating: z.number().min(1).max(5, 'امتیاز باید بین 1 تا 5 باشد').optional(),
  feedbackComment: z.string().max(1000, 'نظر نباید بیش از 1000 کاراکتر باشد').optional(),
  feedbackCategories: z.array(z.string()).optional(),
  visitNotes: z.string().max(500, 'یادداشت بازدید نباید بیش از 500 کاراکتر باشد').optional(),
  pointsRedeemed: z.number().min(0, 'امتیاز استفاده شده نمی‌تواند منفی باشد').optional().default(0)
});

const visitUpdateSchema = z.object({
  totalAmount: z.number().min(0, 'مبلغ کل باید مثبت باشد').optional(),
  discountAmount: z.number().min(0, 'مبلغ تخفیف نمی‌تواند منفی باشد').optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE', 'POINTS', 'MIXED']).optional(),
  itemsOrdered: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    category: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  tableNumber: z.string().max(10, 'شماره میز نباید بیش از 10 کاراکتر باشد').optional(),
  serverName: z.string().max(100, 'نام سرور نباید بیش از 100 کاراکتر باشد').optional(),
  serviceDuration: z.number().min(0, 'مدت سرویس نمی‌تواند منفی باشد').optional(),
  feedbackRating: z.number().min(1).max(5, 'امتیاز باید بین 1 تا 5 باشد').optional(),
  feedbackComment: z.string().max(1000, 'نظر نباید بیش از 1000 کاراکتر باشد').optional(),
  feedbackCategories: z.array(z.string()).optional(),
  visitNotes: z.string().max(500, 'یادداشت بازدید نباید بیش از 500 کاراکتر باشد').optional()
});

const visitFilterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxAmount: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE', 'POINTS', 'MIXED']).optional(),
  tableNumber: z.string().optional(),
  serverName: z.string().optional(),
  feedbackRating: z.string().transform(Number).pipe(z.number().min(1).max(5)).optional()
});

const analyticsFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// POST /api/visits - Create new visit
router.post('/', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const validatedData = visitCreateSchema.parse(req.body);
    
    const visitData: VisitCreateData = {
      ...validatedData
    };
    
    const visit = await createVisit(visitData, req.user!.id, req.tenant!.id);
    
    res.status(201).json({
      message: 'بازدید با موفقیت ثبت شد',
      visit
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/visits - Get visits with filtering
router.get('/', authenticate, requireTenant, async (req, res, next) => {
  try {
    const filter = visitFilterSchema.parse(req.query);
    
    // Convert date strings to Date objects
    const visitFilter: VisitFilter = {
      ...filter,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined
    };
    
    const result = await getVisits(visitFilter, req.tenant!.id);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'پارامترهای جستجو نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/visits/analytics - Get visit analytics
router.get('/analytics', authenticate, requireTenant, async (req, res, next) => {
  try {
    const filter = analyticsFilterSchema.parse(req.query);
    
    const analytics = await getVisitAnalytics(
      req.tenant!.id,
      filter.startDate ? new Date(filter.startDate) : undefined,
      filter.endDate ? new Date(filter.endDate) : undefined
    );
    
    res.json(analytics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'پارامترهای تحلیل نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/visits/customer/:customerId - Get customer visit history
router.get('/customer/:customerId', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    if (!customerId) {
      return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
    }
    
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'پارامترهای صفحه‌بندی نامعتبر' });
    }
    
    const result = await getCustomerVisitHistory(customerId, page, limit, req.tenant!.id);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/visits/:id - Get visit by ID
router.get('/:id', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه بازدید الزامی است' });
    }
    
    const visit = await getVisitById(id, req.tenant!.id);
    res.json({ visit });
  } catch (error) {
    next(error);
  }
});

// PUT /api/visits/:id - Update visit
router.put('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = visitUpdateSchema.parse(req.body);
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه بازدید الزامی است' });
    }
    
    const updateData: VisitUpdateData = {
      ...validatedData
    };
    
    const visit = await updateVisit(id, updateData, req.user!.id, req.tenant!.id);
    
    res.json({
      message: 'بازدید با موفقیت بروزرسانی شد',
      visit
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// DELETE /api/visits/:id - Delete visit
router.delete('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه بازدید الزامی است' });
    }
    
    await deleteVisit(id, req.user!.id, req.tenant!.id);
    
    res.json({
      message: 'بازدید با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/visits/quick-stats/today - Get today's quick stats
router.get('/quick-stats/today', authenticate, requireTenant, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const analytics = await getVisitAnalytics(req.tenant!.id, today, tomorrow);
    
    res.json({
      todayStats: {
        totalVisits: analytics.totalVisits,
        totalRevenue: analytics.totalRevenue,
        averageOrderValue: analytics.averageOrderValue,
        averageRating: analytics.averageRating
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/visits/quick-stats/week - Get this week's quick stats
router.get('/quick-stats/week', authenticate, requireTenant, async (req, res, next) => {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const analytics = await getVisitAnalytics(req.tenant!.id, weekStart);
    
    res.json({
      weekStats: {
        totalVisits: analytics.totalVisits,
        totalRevenue: analytics.totalRevenue,
        averageOrderValue: analytics.averageOrderValue,
        averageRating: analytics.averageRating,
        dailyRevenue: analytics.revenueByDay.slice(0, 7)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/visits/:id/feedback - Add/update visit feedback
router.post('/:id/feedback', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, categories } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه بازدید الزامی است' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'امتیاز باید بین 1 تا 5 باشد' });
    }
    
    const updateData: VisitUpdateData = {
      feedbackRating: rating,
      feedbackComment: comment || undefined,
      feedbackCategories: Array.isArray(categories) ? categories : []
    };
    
    const visit = await updateVisit(id, updateData, req.user!.id, req.tenant!.id);
    
    res.json({
      message: 'بازخورد با موفقیت ثبت شد',
      visit: {
        id: visit.id,
        feedbackRating: visit.feedbackRating,
        feedbackComment: visit.feedbackComment,
        feedbackCategories: visit.feedbackCategories
      }
    });
  } catch (error) {
    next(error);
  }
});

export const visitRoutes = router; 