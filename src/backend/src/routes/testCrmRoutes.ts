import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Test endpoint to verify CRM routes are working
router.get('/test', authenticate, async (req, res) => {
  res.json({
    message: 'CRM routes are working!',
    timestamp: new Date().toISOString(),
    user: req.user?.id
  });
});

// Basic customer endpoint
router.get('/customers/test', authenticate, async (req, res) => {
  res.json({
    message: 'Customer management endpoint is ready',
    features: [
      'Customer CRUD operations',
      'Phone validation',
      'Loyalty tracking',
      'Visit management',
      'Customer segmentation'
    ]
  });
});

export const testCrmRoutes = router; 