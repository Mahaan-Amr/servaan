import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { 
  generateCustomerHealthScore,
  getBatchHealthScores,
  getHealthScoringMetrics,
  getCustomersNeedingHealthUpdates,
  getHealthScoreAlerts 
} from '../services/customerHealthScoringService';
import { AppError } from '../utils/AppError';

const router = Router();

/**
 * Get customer health score
 * GET /api/customers/:customerId/health-score
 */
router.get('/:customerId/health-score', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const healthScore = await generateCustomerHealthScore(customerId);
    
    res.json({
      success: true,
      data: healthScore,
      message: 'امتیاز سلامت مشتری با موفقیت محاسبه شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get batch customer health scores
 * POST /api/customers/batch-health-scores
 */
router.post('/batch-health-scores', authenticateToken, async (req, res, next) => {
  try {
    const { customerIds } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return next(new AppError('لیست شناسه مشتریان الزامی است', 400));
    }

    if (customerIds.length > 20) {
      return next(new AppError('حداکثر 20 مشتری در هر درخواست پشتیبانی می‌شود', 400));
    }

    const healthScores = await getBatchHealthScores(customerIds);
    
    res.json({
      success: true,
      data: healthScores,
      message: `${healthScores.length} امتیاز سلامت مشتری با موفقیت محاسبه شد`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get health scoring metrics
 * GET /api/customers/health-metrics
 */
router.get('/health-metrics', authenticateToken, async (req, res, next) => {
  try {
    const metrics = await getHealthScoringMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'آمار امتیازدهی سلامت مشتریان با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get health score alerts
 * GET /api/customers/health-alerts
 */
router.get('/health-alerts', authenticateToken, async (req, res, next) => {
  try {
    const alerts = await getHealthScoreAlerts();
    
    res.json({
      success: true,
      data: alerts,
      message: 'هشدارهای امتیاز سلامت با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customers needing health updates
 * GET /api/customers/health-updates-needed
 */
router.get('/health-updates-needed', authenticateToken, async (req, res, next) => {
  try {
    const customerIds = getCustomersNeedingHealthUpdates();
    
    res.json({
      success: true,
      data: customerIds,
      message: `${customerIds.length} مشتری نیاز به به‌روزرسانی امتیاز سلامت دارند`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer health score summary
 * GET /api/customers/:customerId/health-summary
 */
router.get('/:customerId/health-summary', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const healthScore = await generateCustomerHealthScore(customerId);
    
    // Extract summary data
    const summary = {
      customerId: healthScore.customerId,
      overallHealthScore: healthScore.overallHealthScore,
      healthLevel: healthScore.healthLevel,
      healthTrend: healthScore.healthTrend,
      churnRisk: healthScore.riskAssessment.churnRisk,
      churnProbability: healthScore.riskAssessment.churnProbability,
      engagementLevel: healthScore.engagementAnalysis.level,
      criticalAlerts: healthScore.automatedInsights.criticalAlerts,
      nextBestActions: healthScore.automatedInsights.nextBestActions,
      lastUpdated: healthScore.lastUpdated,
      nextUpdateDue: healthScore.nextUpdateDue
    };
    
    res.json({
      success: true,
      data: summary,
      message: 'خلاصه امتیاز سلامت مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer risk assessment
 * GET /api/customers/:customerId/risk-assessment
 */
router.get('/:customerId/risk-assessment', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const healthScore = await generateCustomerHealthScore(customerId);
    
    res.json({
      success: true,
      data: {
        customerId: healthScore.customerId,
        riskAssessment: healthScore.riskAssessment,
        predictionModels: healthScore.predictionModels,
        automatedInsights: healthScore.automatedInsights
      },
      message: 'ارزیابی ریسک مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer engagement analysis
 * GET /api/customers/:customerId/engagement-analysis
 */
router.get('/:customerId/engagement-analysis', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const healthScore = await generateCustomerHealthScore(customerId);
    
    res.json({
      success: true,
      data: {
        customerId: healthScore.customerId,
        engagementAnalysis: healthScore.engagementAnalysis,
        scoringComponents: healthScore.scoringComponents,
        benchmarkComparison: healthScore.benchmarkComparison
      },
      message: 'تحلیل تعامل مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer health history
 * GET /api/customers/:customerId/health-history
 */
router.get('/:customerId/health-history', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const healthScore = await generateCustomerHealthScore(customerId);
    
    res.json({
      success: true,
      data: {
        customerId: healthScore.customerId,
        healthHistory: healthScore.healthHistory,
        healthTrend: healthScore.healthTrend,
        updateFrequency: healthScore.updateFrequency
      },
      message: 'تاریخچه امتیاز سلامت مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get customer predictions
 * GET /api/customers/:customerId/predictions
 */
router.get('/:customerId/predictions', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return next(new AppError('شناسه مشتری الزامی است', 400));
    }

    const healthScore = await generateCustomerHealthScore(customerId);
    
    res.json({
      success: true,
      data: {
        customerId: healthScore.customerId,
        predictionModels: healthScore.predictionModels,
        riskAssessment: healthScore.riskAssessment,
        automatedInsights: {
          opportunities: healthScore.automatedInsights.opportunities,
          recommendations: healthScore.automatedInsights.recommendations
        }
      },
      message: 'پیش‌بینی‌های مشتری با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get health score dashboard data
 * GET /api/customers/health-dashboard
 */
router.get('/health-dashboard', authenticateToken, async (req, res, next) => {
  try {
    const [metrics, alerts, updatesNeeded] = await Promise.all([
      getHealthScoringMetrics(),
      getHealthScoreAlerts(),
      Promise.resolve(getCustomersNeedingHealthUpdates())
    ]);
    
    const dashboardData = {
      metrics,
      alerts: alerts.slice(0, 10), // Top 10 alerts
      updatesNeeded: updatesNeeded.length,
      summary: {
        totalCustomers: metrics.totalCustomers,
        averageHealthScore: metrics.averageHealthScore,
        criticalCustomers: metrics.healthDistribution.critical,
        highRiskCustomers: metrics.churnRiskDistribution.critical + metrics.churnRiskDistribution.high,
        improvingCustomers: metrics.trendsAnalysis.improvingCustomers,
        decliningCustomers: metrics.trendsAnalysis.decliningCustomers
      }
    };
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'داده‌های داشبورد امتیاز سلامت با موفقیت دریافت شد'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 