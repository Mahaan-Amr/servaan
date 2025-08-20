import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { 
  generateCustomerJourneyMap, 
  getCustomerJourneySummary 
} from '../services/customerJourneyService';
import { AppError } from '../utils/AppError';

const router = Router();

/**
 * GET /api/customer-journey/:customerId
 * Get comprehensive customer journey map
 */
router.get('/:customerId', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const journeyMap = await generateCustomerJourneyMap(customerId);
    
    res.json({
      success: true,
      data: journeyMap
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customer-journey/summary
 * Get journey summary for multiple customers
 */
router.post('/summary', authenticateToken, async (req, res, next) => {
  try {
    const { customerIds } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({ error: 'Customer IDs array is required' });
    }
    
    if (customerIds.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 customers allowed per request' });
    }
    
    const summaries = await getCustomerJourneySummary(customerIds);
    
    res.json({
      success: true,
      data: summaries
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customer-journey/:customerId/touchpoints
 * Get customer touchpoints timeline
 */
router.get('/:customerId/touchpoints', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const journeyMap = await generateCustomerJourneyMap(customerId);
    
    const touchpoints = journeyMap.touchpointTimeline.slice(
      Number(offset), 
      Number(offset) + Number(limit)
    );
    
    res.json({
      success: true,
      data: {
        touchpoints,
        total: journeyMap.touchpointTimeline.length,
        currentStage: journeyMap.currentStage,
        journeyHealth: journeyMap.journeyHealth
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customer-journey/:customerId/next-actions
 * Get next best actions for customer
 */
router.get('/:customerId/next-actions', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const journeyMap = await generateCustomerJourneyMap(customerId);
    
    res.json({
      success: true,
      data: {
        nextBestActions: journeyMap.nextBestActions,
        criticalMoments: journeyMap.criticalMoments,
        currentStage: journeyMap.currentStage,
        journeyHealth: journeyMap.journeyHealth
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customer-journey/:customerId/stages
 * Get customer journey stage history
 */
router.get('/:customerId/stages', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const journeyMap = await generateCustomerJourneyMap(customerId);
    
    res.json({
      success: true,
      data: {
        currentStage: journeyMap.currentStage,
        stageHistory: journeyMap.stageHistory,
        totalJourneyDuration: journeyMap.totalJourneyDuration,
        progressionRate: journeyMap.progressionRate
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customer-journey/:customerId/behavior-patterns
 * Get customer behavior patterns
 */
router.get('/:customerId/behavior-patterns', authenticateToken, async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    const journeyMap = await generateCustomerJourneyMap(customerId);
    
    res.json({
      success: true,
      data: {
        behaviorPatterns: journeyMap.behaviorPatterns,
        preferredChannels: journeyMap.preferredChannels,
        peakEngagementTimes: journeyMap.peakEngagementTimes,
        averageEngagement: journeyMap.averageEngagement
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 