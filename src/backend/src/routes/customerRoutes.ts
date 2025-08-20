import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import {
  createCustomer,
  getCustomerById,
  getCustomerByPhone,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  getCustomerSummaries,
  getUpcomingBirthdays,
  getCustomerStatistics,
  validateAndNormalizePhone,
  customerExistsByPhone,
  CustomerCreateData,
  CustomerUpdateData,
  CustomerFilter
} from '../services/customerService';
import { getCustomerInsights, getBatchCustomerInsights } from '../services/customerInsightsService';
import { 
  generateEnhancedCustomerProfile,
  getBatchEnhancedCustomerProfiles,
  refreshCustomerProfile,
  getCustomerProfileSummary 
} from '../services/enhancedCustomerProfileService';
import { 
  generateCustomerHealthScore,
  getBatchHealthScores,
  getHealthScoringMetrics,
  getCustomersNeedingHealthUpdates,
  getHealthScoreAlerts 
} from '../services/customerHealthScoringService';

const router = Router();

// Validation schemas
const phoneValidationSchema = z.object({
  phone: z.string().min(10, 'شماره تلفن باید حداقل 10 رقم باشد')
});

const customerCreateSchema = z.object({
  phone: z.string().min(10, 'شماره تلفن الزامی است'),
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد').max(100, 'نام نباید بیش از 100 کاراکتر باشد'),
  nameEnglish: z.string().max(100, 'نام انگلیسی نباید بیش از 100 کاراکتر باشد').optional(),
  email: z.string().email('فرمت ایمیل نامعتبر است').optional().or(z.literal('')),
  birthday: z.string().datetime().optional().or(z.literal('')),
  anniversary: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().max(1000, 'یادداشت نباید بیش از 1000 کاراکتر باشد').optional(),
  address: z.string().max(500, 'آدرس نباید بیش از 500 کاراکتر باشد').optional(),
  city: z.string().max(50, 'نام شهر نباید بیش از 50 کاراکتر باشد').optional(),
  postalCode: z.string().max(10, 'کد پستی نباید بیش از 10 کاراکتر باشد').optional(),
  preferences: z.record(z.any()).optional()
});

const customerUpdateSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد').max(100, 'نام نباید بیش از 100 کاراکتر باشد').optional(),
  nameEnglish: z.string().max(100, 'نام انگلیسی نباید بیش از 100 کاراکتر باشد').optional(),
  email: z.string().email('فرمت ایمیل نامعتبر است').optional().or(z.literal('')),
  birthday: z.string().datetime().optional().or(z.literal('')),
  anniversary: z.string().datetime().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  notes: z.string().max(1000, 'یادداشت نباید بیش از 1000 کاراکتر باشد').optional(),
  address: z.string().max(500, 'آدرس نباید بیش از 500 کاراکتر باشد').optional(),
  city: z.string().max(50, 'نام شهر نباید بیش از 50 کاراکتر باشد').optional(),
  postalCode: z.string().max(10, 'کد پستی نباید بیش از 10 کاراکتر باشد').optional(),
  preferences: z.record(z.any()).optional()
});

const customerFilterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  segment: z.enum(['NEW', 'OCCASIONAL', 'REGULAR', 'VIP']).optional(),
  tierLevel: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
  city: z.string().optional(),
  birthdayMonth: z.string().transform(Number).pipe(z.number().min(1).max(12)).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  lastVisitFrom: z.string().datetime().optional(),
  lastVisitTo: z.string().datetime().optional()
});

// POST /api/customers/validate-phone - Validate phone number
router.post('/validate-phone', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { phone } = phoneValidationSchema.parse(req.body);
    
    const validation = validateAndNormalizePhone(phone);
    const exists = validation.isValid ? await customerExistsByPhone(phone, req.tenant!.id) : false;
    
    res.json({
      ...validation,
      exists,
      suggestion: validation.normalized
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

// POST /api/customers - Create new customer
router.post('/', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const validatedData = customerCreateSchema.parse(req.body);
    
    // Convert date strings to Date objects
    const customerData: CustomerCreateData = {
      ...validatedData,
      email: validatedData.email || undefined,
      birthday: validatedData.birthday ? new Date(validatedData.birthday) : undefined,
      anniversary: validatedData.anniversary ? new Date(validatedData.anniversary) : undefined,
      tenantId: req.tenant!.id // Add tenantId from context
    };
    
    const customer = await createCustomer(customerData, req.user!.id);
    
    res.status(201).json({
      message: 'مشتری با موفقیت ایجاد شد',
      customer
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

// GET /api/customers - Get customers with filtering
router.get('/', authenticate, requireTenant, async (req, res, next) => {
  try {
    const filter = customerFilterSchema.parse(req.query);
    
    // Convert date strings to Date objects
    const customerFilter: CustomerFilter = {
      ...filter,
      createdFrom: filter.createdFrom ? new Date(filter.createdFrom) : undefined,
      createdTo: filter.createdTo ? new Date(filter.createdTo) : undefined,
      lastVisitFrom: filter.lastVisitFrom ? new Date(filter.lastVisitFrom) : undefined,
      lastVisitTo: filter.lastVisitTo ? new Date(filter.lastVisitTo) : undefined
    };
    
    const result = await getCustomers(customerFilter, req.tenant!.id);
    
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

// GET /api/customers/summaries - Get customer summaries (optimized)
router.get('/summaries', authenticate, requireTenant, async (req, res, next) => {
  try {
    const filter = customerFilterSchema.parse(req.query);
    
    // Convert date strings to Date objects
    const customerFilter: CustomerFilter = {
      ...filter,
      createdFrom: filter.createdFrom ? new Date(filter.createdFrom) : undefined,
      createdTo: filter.createdTo ? new Date(filter.createdTo) : undefined,
      lastVisitFrom: filter.lastVisitFrom ? new Date(filter.lastVisitFrom) : undefined,
      lastVisitTo: filter.lastVisitTo ? new Date(filter.lastVisitTo) : undefined
    };
    
    const summaries = await getCustomerSummaries(customerFilter, req.tenant!.id);
    
    res.json({ customers: summaries });
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

// GET /api/customers/statistics - Get customer statistics
router.get('/statistics', authenticate, requireTenant, async (req, res, next) => {
  try {
    const statistics = await getCustomerStatistics(req.tenant!.id);
    res.json(statistics);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/birthdays - Get upcoming birthdays
router.get('/birthdays', authenticate, requireTenant, async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    
    if (days < 1 || days > 365) {
      return res.status(400).json({ 
        message: 'تعداد روزها باید بین 1 تا 365 باشد' 
      });
    }
    
    const customers = await getUpcomingBirthdays(days, req.tenant!.id);
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/phone/:phone - Get customer by phone
router.get('/phone/:phone', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({ message: 'شماره تلفن الزامی است' });
    }
    
    const customer = await getCustomerByPhone(phone, req.tenant!.id);
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
    }
    
    const customer = await getCustomerById(id, req.tenant!.id);
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER', 'STAFF']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = customerUpdateSchema.parse(req.body);
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
    }
    
    // Convert date strings to Date objects
    const updateData: CustomerUpdateData = {
      ...validatedData,
      email: validatedData.email || undefined,
      birthday: validatedData.birthday ? new Date(validatedData.birthday) : undefined,
      anniversary: validatedData.anniversary ? new Date(validatedData.anniversary) : undefined
    };
    
    const customer = await updateCustomer(id, updateData, req.user!.id, req.tenant!.id);
    
    res.json({
      message: 'اطلاعات مشتری با موفقیت بروزرسانی شد',
      customer
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

// DELETE /api/customers/:id - Soft delete customer
router.delete('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
    }
    
    await deleteCustomer(id, req.user!.id, req.tenant!.id);
    
    res.json({
      message: 'مشتری با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/insights - Get customer insights and analytics
// router.get('/:id/insights', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     const insights = await getCustomerInsights(customerId, req.tenant!.id);
//     res.json(insights);
//   } catch (error) {
//     next(error);
//   }
// });

// POST /api/customers/batch-insights - Get batch customer insights
// router.post('/batch-insights', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const { customerIds } = req.body;
//     if (!Array.isArray(customerIds) || customerIds.length === 0) {
//       return res.status(400).json({ error: 'لیست شناسه مشتریان الزامی است' });
//     }
//     
//     const insights = await getBatchCustomerInsights(customerIds, req.tenant!.id);
//     res.json(insights);
//   } catch (error) {
//     next(error);
//   }
// });

// Enhanced Customer Profile Routes

// GET /api/customers/:id/enhanced-profile - Get enhanced customer profile
// router.get('/:id/enhanced-profile', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const profile = await generateEnhancedCustomerProfile(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: profile,
//       message: 'پروفایل پیشرفته مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/profile-summary - Get enhanced customer profile summary
// router.get('/:id/profile-summary', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const summary = await getCustomerProfileSummary(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: summary,
//       message: 'خلاصه پروفایل مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// PUT /api/customers/:id/refresh-profile - Refresh enhanced customer profile
// router.put('/:id/refresh-profile', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const profile = await refreshCustomerProfile(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: profile,
//       message: 'پروفایل پیشرفته مشتری با موفقیت به‌روزرسانی شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// POST /api/customers/batch-enhanced-profiles - Get batch enhanced customer profiles
// router.post('/batch-enhanced-profiles', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const { customerIds } = req.body;
//     
//     if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
//       return res.status(400).json({ message: 'لیست شناسه مشتریان الزامی است' });
//     }

//     if (customerIds.length > 50) {
//       return res.status(400).json({ message: 'حداکثر 50 مشتری در هر درخواست پشتیبانی می‌شود' });
//     }

//     const profiles = await getBatchEnhancedCustomerProfiles(customerIds, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: profiles,
//       message: `${profiles.length} پروفایل پیشرفته مشتری با موفقیت دریافت شد`
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/profile-analytics - Get customer profile analytics
// router.get('/:id/profile-analytics', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const profile = await generateEnhancedCustomerProfile(customerId, req.tenant!.id);
//     
//     // Extract key analytics from the profile
//     const analytics = {
//       profileCompleteness: profile.profileCompleteness,
//       relationshipStrength: profile.relationshipStrengthIndicators.overallStrength,
//       loyaltyLevel: profile.relationshipStrengthIndicators.loyaltyLevel,
//       engagementMetrics: profile.relationshipStrengthIndicators.engagementMetrics,
//       behavioralInsights: {
//         preferredVisitDays: profile.behavioralPreferences.preferredVisitDays,
//         preferredVisitTimes: profile.behavioralPreferences.preferredVisitTimes,
//         seasonalPatterns: profile.behavioralPreferences.seasonalPatterns,
//         priceSegment: profile.purchaseHistoryAnalysis.priceSegment
//       },
//       riskAssessment: profile.relationshipStrengthIndicators.retentionRisk,
//       personalizedRecommendations: {
//         nextBestActions: profile.personalizedInsights.nextBestActions,
//         personalizedOffers: profile.personalizedInsights.personalizedOffers,
//         careOpportunities: profile.personalizedInsights.careOpportunities,
//         upsellOpportunities: profile.personalizedInsights.upsellOpportunities
//       }
//     };
//     
//     res.json({
//       success: true,
//       data: analytics,
//       message: 'تحلیل پروفایل مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/demographics - Get customer demographic insights
// router.get('/:id/demographics', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const profile = await generateEnhancedCustomerProfile(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: profile.demographicInsights,
//       message: 'تحلیل جمعیت‌شناختی مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/behavioral-preferences - Get customer behavioral preferences
// router.get('/:id/behavioral-preferences', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const profile = await generateEnhancedCustomerProfile(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: profile.behavioralPreferences,
//       message: 'ترجیحات رفتاری مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/purchase-analysis - Get customer purchase history analysis
// router.get('/:id/purchase-analysis', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const profile = await generateEnhancedCustomerProfile(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: profile.purchaseHistoryAnalysis,
//       message: 'تحلیل تاریخچه خرید مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// Customer Health Scoring Routes

// GET /api/customers/:id/health-score - Get customer health score
// router.get('/:id/health-score', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const healthScore = await generateCustomerHealthScore(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: healthScore,
//       message: 'امتیاز سلامت مشتری با موفقیت محاسبه شد'
//     });
//   } catch (error) {
//     next(error);
//     }
// });

// POST /api/customers/batch-health-scores - Get batch customer health scores
// router.post('/batch-health-scores', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const { customerIds } = req.body;
//     
//     if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
//       return res.status(400).json({ message: 'لیست شناسه مشتریان الزامی است' });
//     }

//     if (customerIds.length > 20) {
//       return res.status(400).json({ message: 'حداکثر 20 مشتری در هر درخواست پشتیبانی می‌شود' });
//     }

//     const healthScores = await getBatchHealthScores(customerIds, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: healthScores,
//       message: `${healthScores.length} امتیاز سلامت مشتری با موفقیت محاسبه شد`
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/health-metrics - Get health scoring metrics
// router.get('/health-metrics', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const metrics = await getHealthScoringMetrics(req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: metrics,
//       message: 'آمار امتیازدهی سلامت مشتریان با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/health-alerts - Get health score alerts
// router.get('/health-alerts', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const alerts = await getHealthScoreAlerts(req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: alerts,
//       message: 'هشدارهای امتیاز سلامت با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/health-summary - Get customer health score summary
// router.get('/:id/health-summary', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const healthScore = await generateCustomerHealthScore(customerId, req.tenant!.id);
//     
//     // Extract summary data
//     const summary = {
//       customerId: healthScore.customerId,
//       overallHealthScore: healthScore.overallHealthScore,
//       healthLevel: healthScore.healthLevel,
//       healthTrend: healthScore.healthTrend,
//       churnRisk: healthScore.riskAssessment.churnRisk,
//       churnProbability: healthScore.riskAssessment.churnProbability,
//       engagementLevel: healthScore.engagementAnalysis.level,
//       criticalAlerts: healthScore.automatedInsights.criticalAlerts,
//       nextBestActions: healthScore.automatedInsights.nextBestActions,
//       lastUpdated: healthScore.lastUpdated,
//       nextUpdateDue: healthScore.nextUpdateDue
//     };
//     
//     res.json({
//       success: true,
//       data: summary,
//       message: 'خلاصه امتیاز سلامت مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//     }
// });

// GET /api/customers/:id/risk-assessment - Get customer risk assessment
// router.get('/:id/risk-assessment', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const healthScore = await generateCustomerHealthScore(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: {
//         customerId: healthScore.customerId,
//         riskAssessment: healthScore.riskScore,
//         predictionModels: healthScore.predictionModels,
//         automatedInsights: healthScore.automatedInsights
//       },
//       message: 'ارزیابی ریسک مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/customers/:id/engagement-analysis - Get customer engagement analysis
// router.get('/:id/engagement-analysis', authenticate, requireTenant, async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     
//     if (!customerId) {
//       return res.status(400).json({ message: 'شناسه مشتری الزامی است' });
//     }

//     const healthScore = await generateCustomerHealthScore(customerId, req.tenant!.id);
//     
//     res.json({
//       success: true,
//       data: {
//         customerId: healthScore.customerId,
//         engagementAnalysis: healthScore.engagementAnalysis,
//         scoringComponents: healthScore.scoringComponents,
//         benchmarkComparison: healthScore.benchmarkComparison
//       },
//       message: 'تحلیل تعامل مشتری با موفقیت دریافت شد'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

export const customerRoutes = router; 