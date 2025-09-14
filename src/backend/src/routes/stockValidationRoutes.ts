import { Router } from 'express';
import { StockValidationController } from '../controllers/stockValidationController';
import { authenticate, authorize, requireTenant } from '../middleware/auth';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate);
router.use(requireTenant);

/**
 * @route GET /api/inventory/stock-validation/:menuItemId
 * @desc Validate flexible stock availability for a single menu item
 * @access Private (Staff+)
 */
router.get('/stock-validation/:menuItemId', 
  authorize(['STAFF', 'MANAGER', 'ADMIN']),
  StockValidationController.validateFlexibleStock
);

/**
 * @route POST /api/inventory/validate-order-stock
 * @desc Validate flexible stock availability for multiple order items
 * @access Private (Staff+)
 */
router.post('/validate-order-stock',
  authorize(['STAFF', 'MANAGER', 'ADMIN']),
  StockValidationController.validateFlexibleOrderStock
);

/**
 * @route POST /api/inventory/stock-override
 * @desc Record stock override when staff proceeds with order despite warnings
 * @access Private (Staff+)
 */
router.post('/stock-override',
  authorize(['STAFF', 'MANAGER', 'ADMIN']),
  StockValidationController.recordStockOverride
);

/**
 * @route GET /api/inventory/stock-override-analytics
 * @desc Get stock override analytics for business intelligence
 * @access Private (Manager+)
 */
router.get('/stock-override-analytics',
  authorize(['MANAGER', 'ADMIN']),
  StockValidationController.getStockOverrideAnalytics
);

/**
 * @route GET /api/inventory/stock-validation-config
 * @desc Get stock validation configuration for tenant
 * @access Private (Staff+)
 */
router.get('/stock-validation-config',
  authorize(['STAFF', 'MANAGER', 'ADMIN']),
  StockValidationController.getStockValidationConfig
);

export default router;
