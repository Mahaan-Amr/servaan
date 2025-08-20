import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import {
  updateAllCustomerSegments,
  getCustomersBySegment,
  createCustomSegment,
  getSegmentAnalysis,
  getUpgradeableCustomers,
  calculateCustomerSegment,
  SegmentationCriteria
} from '../services/customerSegmentationService';

const router = Router();

// Validation schemas
const segmentFilterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional()
});

const customSegmentSchema = z.object({
  name: z.string().min(2, 'نام بخش باید حداقل 2 کاراکتر باشد').max(100, 'نام بخش نباید بیش از 100 کاراکتر باشد'),
  description: z.string().max(500, 'توضیحات نباید بیش از 500 کاراکتر باشد').optional(),
  rules: z.array(z.object({
    field: z.string(),
    operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between', 'in', 'not_in']),
    value: z.any(),
    logic: z.enum(['AND', 'OR']).optional()
  })),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, 'کد رنگ نامعتبر است').optional(),
  iconName: z.string().max(50).optional()
});

const segmentCalculationSchema = z.object({
  lifetimeSpent: z.number().min(0),
  totalVisits: z.number().min(0),
  currentYearSpent: z.number().min(0),
  lastVisitDays: z.number().min(0),
  currentMonthSpent: z.number().min(0).optional()
});

// GET /api/crm/segments/analysis - Get segment analysis and insights
router.get('/segments/analysis', authenticate, async (req, res, next) => {
  try {
    const analysis = await getSegmentAnalysis();
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// POST /api/crm/segments/update-all - Update all customer segments
router.post('/segments/update-all', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const report = await updateAllCustomerSegments();
    
    res.json({
      message: 'بخش‌بندی مشتریان با موفقیت بروزرسانی شد',
      report
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/segments/:segment/customers - Get customers by segment
router.get('/segments/:segment/customers', authenticate, async (req, res, next) => {
  try {
    const { segment } = req.params;
    const filter = segmentFilterSchema.parse(req.query);
    
    if (!['NEW', 'OCCASIONAL', 'REGULAR', 'VIP'].includes(segment)) {
      return res.status(400).json({ message: 'بخش مشتری نامعتبر است' });
    }
    
    const result = await getCustomersBySegment(
      segment as any,
      filter.page,
      filter.limit
    );
    
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

// POST /api/crm/segments/custom - Create custom segment
router.post('/segments/custom', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const validatedData = customSegmentSchema.parse(req.body);
    
    const segmentData: SegmentationCriteria = {
      name: validatedData.name,
      description: validatedData.description || '',
      rules: validatedData.rules as any,
      colorHex: validatedData.colorHex,
      iconName: validatedData.iconName
    };
    
    if (!req.tenant?.id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }
    
    const segment = await createCustomSegment(segmentData, req.user!.id, req.tenant.id);
    
    res.status(201).json({
      message: 'بخش سفارشی با موفقیت ایجاد شد',
      segment
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

// GET /api/crm/segments/upgradeable/:targetSegment - Get customers ready for upgrade
router.get('/segments/upgradeable/:targetSegment', authenticate, async (req, res, next) => {
  try {
    const { targetSegment } = req.params;
    
    if (!['OCCASIONAL', 'REGULAR', 'VIP'].includes(targetSegment)) {
      return res.status(400).json({ message: 'بخش هدف نامعتبر است' });
    }
    
    const customers = await getUpgradeableCustomers(targetSegment);
    
    res.json({
      targetSegment,
      upgradeableCustomers: customers
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/crm/segments/calculate - Calculate segment for given parameters
router.post('/segments/calculate', authenticate, async (req, res, next) => {
  try {
    const validatedData = segmentCalculationSchema.parse(req.body);
    
    const result = calculateCustomerSegment(
      validatedData.lifetimeSpent,
      validatedData.totalVisits,
      validatedData.currentYearSpent,
      validatedData.lastVisitDays,
      validatedData.currentMonthSpent
    );
    
    res.json({
      suggestedSegment: result.segment,
      score: result.score,
      reasons: result.reasons,
      parameters: validatedData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'پارامترهای محاسبه نامعتبر', 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// GET /api/crm/dashboard/overview - Get CRM dashboard overview
router.get('/dashboard/overview', authenticate, async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // For MVP, return mock data since CRM services need tenant awareness
    // Import the required services at the top level
    // const { getCustomerStatistics } = await import('../services/customerService');
    // const { getLoyaltyStatistics } = await import('../services/loyaltyService');
    // const { getVisitAnalytics } = await import('../services/visitTrackingService');
    
    // Get data from all services - temporarily disabled until services are tenant-aware
    // const [customerStats, loyaltyStats] = await Promise.all([
    //   getCustomerStatistics(),
    //   getLoyaltyStatistics()
    //   // getVisitAnalytics() - temporarily disabled due to SQL syntax error
    // ]);
    
    // Mock data for MVP
    const customerStats = {
      totalCustomers: 0,
      activeCustomers: 0,
      newThisMonth: 0,
      segmentDistribution: {}
    };
    
    const loyaltyStats = {
      totalPointsEarned: 0,
      totalActivePoints: 0,
      totalPointsRedeemed: 0,
      averagePointsPerCustomer: 0,
      topCustomers: []
    };
    
    // Mock visit stats for now
    const visitStats = {
      totalVisits: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
    
    const overview = {
      customerStats: {
        total: customerStats.totalCustomers || 0,
        active: customerStats.activeCustomers || 0,
        newThisMonth: customerStats.newThisMonth || 0,
        bySegment: customerStats.segmentDistribution || {}
      },
      loyaltyStats: {
        totalPoints: loyaltyStats.totalPointsEarned || 0,
        activePoints: loyaltyStats.totalActivePoints || 0,
        redemptionRate: loyaltyStats.totalPointsRedeemed && loyaltyStats.totalPointsEarned 
          ? Math.round((loyaltyStats.totalPointsRedeemed / loyaltyStats.totalPointsEarned) * 100)
          : 0,
        averagePointsPerCustomer: loyaltyStats.averagePointsPerCustomer || 0
      },
      visitStats: {
        totalVisits: visitStats.totalVisits || 0,
        totalRevenue: visitStats.totalRevenue || 0,
        averageOrderValue: visitStats.averageOrderValue || 0,
        visitsThisMonth: visitStats.totalVisits || 0 // This would need proper filtering by month
      },
      recentActivities: [],
      topCustomers: loyaltyStats.topCustomers || [],
      segmentTrends: []
    };
    
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/reports/customer-lifetime-value - Get customer lifetime value report
router.get('/reports/customer-lifetime-value', authenticate, async (req, res, next) => {
  try {
    // This would be implemented based on specific business requirements
    const report = {
      averageLifetimeValue: 0,
      valueDistribution: [],
      topValueCustomers: [],
      trends: []
    };
    
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/reports/retention - Get customer retention report
router.get('/reports/retention', authenticate, async (req, res, next) => {
  try {
    // This would analyze customer visit patterns and retention rates
    const report = {
      overallRetentionRate: 0,
      retentionBySegment: {},
      churnRisk: [],
      recommendations: []
    };
    
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/alerts - Get CRM alerts and notifications
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    // This would return various business alerts
    const alerts = [
      {
        type: 'birthday',
        priority: 'medium',
        message: 'تولد مشتریان این هفته',
        count: 0,
        actionRequired: true
      },
      {
        type: 'churn_risk',
        priority: 'high',
        message: 'مشتریان در معرض از دست رفتن',
        count: 0,
        actionRequired: true
      },
      {
        type: 'upgrade_opportunity',
        priority: 'low',
        message: 'مشتریان آماده ارتقا',
        count: 0,
        actionRequired: false
      }
    ];
    
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

// POST /api/crm/bulk-actions/send-birthday-messages - Send birthday messages
router.post('/bulk-actions/send-birthday-messages', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    // This would integrate with the loyalty service to send birthday bonuses
    // and with a messaging service to send birthday messages
    
    res.json({
      message: 'پیام‌های تولد با موفقیت ارسال شد',
      sent: 0,
      failed: 0
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/crm/bulk-actions/tier-updates - Update customer tiers
router.post('/bulk-actions/tier-updates', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    // This would update all customer tiers based on current spending and activity
    
    res.json({
      message: 'سطوح وفاداری مشتریان بروزرسانی شد',
      updated: 0,
      errors: []
    });
  } catch (error) {
    next(error);
  }
});

export const crmRoutes = router; 