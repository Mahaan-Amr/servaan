import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { 
  generateEnhancedCustomerProfile,
  getBatchEnhancedCustomerProfiles,
  refreshCustomerProfile,
  getCustomerProfileSummary 
} from '../services/enhancedCustomerProfileService';
import { AppError } from '../utils/AppError';

const router = Router();

/**
 * Get enhanced customer profile
 * GET /api/customers/:customerId/enhanced-profile
 */
router.get('/:customerId/enhanced-profile', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const profile = await generateEnhancedCustomerProfile(customerId);
    
    res.json({
      success: true,
      data: profile,
      message: 'پروفایل پیشرفته مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get enhanced customer profile summary
 * GET /api/customers/:customerId/profile-summary
 */
router.get('/:customerId/profile-summary', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const summary = await getCustomerProfileSummary(customerId);
    
    res.json({
      success: true,
      data: summary,
      message: 'خلاصه پروفایل مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh enhanced customer profile
 * PUT /api/customers/:customerId/refresh-profile
 */
router.put('/:customerId/refresh-profile', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const profile = await refreshCustomerProfile(customerId);
    
    res.json({
      success: true,
      data: profile,
      message: 'پروفایل پیشرفته مشتری با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get batch enhanced customer profiles
 * POST /api/customers/batch-enhanced-profiles
 */
router.post('/batch-enhanced-profiles', authenticateToken, async (req, res, next) => {
  try {
    const { customerIds } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return next(new AppError('لیست شناسه مشتریان الزامی است', 400));
    }

    if (customerIds.length > 50) {
      return next(new AppError('حداکثر 50 مشتری در هر درخواست پشتیبانی می‌شود', 400));
    }

    const profiles = await getBatchEnhancedCustomerProfiles(customerIds);
    
    res.json({
      success: true,
      data: profiles,
      message: `${profiles.length} پروفایل پیشرفته مشتری با موفقیت دریافت شد`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer profile analytics
 * GET /api/customers/:customerId/profile-analytics
 */
router.get('/:customerId/profile-analytics', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const profile = await generateEnhancedCustomerProfile(customerId);
    
    // Extract key analytics from the profile
    const analytics = {
      profileCompleteness: profile.profileCompleteness,
      relationshipStrength: profile.relationshipStrengthIndicators.overallStrength,
      loyaltyLevel: profile.relationshipStrengthIndicators.loyaltyLevel,
      engagementMetrics: profile.relationshipStrengthIndicators.engagementMetrics,
      behavioralInsights: {
        preferredVisitDays: profile.behavioralPreferences.preferredVisitDays,
        preferredVisitTimes: profile.behavioralPreferences.preferredVisitTimes,
        seasonalPatterns: profile.behavioralPreferences.seasonalPatterns,
        priceSegment: profile.purchaseHistoryAnalysis.priceSegment
      },
      riskAssessment: profile.relationshipStrengthIndicators.retentionRisk,
      personalizedRecommendations: {
        nextBestActions: profile.personalizedInsights.nextBestActions,
        personalizedOffers: profile.personalizedInsights.personalizedOffers,
        careOpportunities: profile.personalizedInsights.careOpportunities,
        upsellOpportunities: profile.personalizedInsights.upsellOpportunities
      }
    };
    
    res.json({
      success: true,
      data: analytics,
      message: 'تحلیل پروفایل مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer demographic insights
 * GET /api/customers/:customerId/demographics
 */
router.get('/:customerId/demographics', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const profile = await generateEnhancedCustomerProfile(customerId);
    
    res.json({
      success: true,
      data: profile.demographicInsights,
      message: 'تحلیل جمعیت‌شناختی مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer behavioral preferences
 * GET /api/customers/:customerId/behavioral-preferences
 */
router.get('/:customerId/behavioral-preferences', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const profile = await generateEnhancedCustomerProfile(customerId);
    
    res.json({
      success: true,
      data: profile.behavioralPreferences,
      message: 'ترجیحات رفتاری مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer purchase history analysis
 * GET /api/customers/:customerId/purchase-analysis
 */
router.get('/:customerId/purchase-analysis', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const profile = await generateEnhancedCustomerProfile(customerId);
    
    res.json({
      success: true,
      data: profile.purchaseHistoryAnalysis,
      message: 'تحلیل تاریخچه خرید مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 