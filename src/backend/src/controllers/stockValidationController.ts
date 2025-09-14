import { Request, Response, NextFunction } from 'express';
import { OrderInventoryIntegrationService, FlexibleStockValidationResult } from '../services/orderInventoryIntegrationService';
import { AppError } from '../utils/AppError';

export class StockValidationController {
  /**
   * Validate flexible stock availability for a single menu item
   * GET /api/inventory/stock-validation/:menuItemId
   */
  static async validateFlexibleStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { menuItemId } = req.params;
      const { quantity = 1 } = req.query;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!menuItemId) {
        throw new AppError('Menu item ID is required', 400);
      }

      const validationResult = await OrderInventoryIntegrationService.validateFlexibleStockAvailability(
        tenantId,
        menuItemId,
        Number(quantity)
      );

      res.json({
        success: true,
        data: validationResult,
        message: 'Stock validation completed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate flexible stock availability for multiple order items
   * POST /api/inventory/validate-order-stock
   */
  static async validateFlexibleOrderStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { orderItems } = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        throw new AppError('Order items array is required', 400);
      }

      // Validate order items structure
      for (const item of orderItems) {
        if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
          throw new AppError('Each order item must have menuItemId and valid quantity', 400);
        }
      }

      const validationResult = await OrderInventoryIntegrationService.validateFlexibleOrderStockAvailability(
        tenantId,
        orderItems
      );

      res.json({
        success: true,
        data: validationResult,
        message: 'Order stock validation completed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record stock override when staff proceeds with order despite warnings
   * POST /api/inventory/stock-override
   */
  static async recordStockOverride(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const overriddenBy = req.user?.id;

      if (!tenantId || !overriddenBy) {
        throw new AppError('Authentication required', 401);
      }

      const {
        orderId,
        menuItemId,
        itemId,
        itemName,
        requiredQuantity,
        availableQuantity,
        overrideReason,
        overrideType,
        notes
      } = req.body;

      // Validate required fields
      if (!orderId || !menuItemId || !itemId || !itemName || 
          requiredQuantity === undefined || availableQuantity === undefined ||
          !overrideReason || !overrideType) {
        throw new AppError('All required fields must be provided', 400);
      }

      // Validate override type
      const validOverrideTypes = ['STAFF_DECISION', 'EMERGENCY_PURCHASE', 'SUBSTITUTE_INGREDIENT', 'VIP_CUSTOMER'];
      if (!validOverrideTypes.includes(overrideType)) {
        throw new AppError('Invalid override type', 400);
      }

      const overrideRecord = await OrderInventoryIntegrationService.recordStockOverride(
        tenantId,
        orderId,
        menuItemId,
        itemId,
        itemName,
        Number(requiredQuantity),
        Number(availableQuantity),
        overrideReason,
        overrideType,
        overriddenBy,
        notes
      );

      res.status(201).json({
        success: true,
        data: overrideRecord,
        message: 'Stock override recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock override analytics for business intelligence
   * GET /api/inventory/stock-override-analytics
   */
  static async getStockOverrideAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { startDate, endDate } = req.query;

      const analytics = await OrderInventoryIntegrationService.getStockOverrideAnalytics(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: analytics,
        message: 'Stock override analytics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock validation configuration for tenant
   * GET /api/inventory/stock-validation-config
   */
  static async getStockValidationConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Default configuration - can be extended to read from tenant settings
      const config = {
        validationMode: 'FLEXIBLE', // 'STRICT' | 'FLEXIBLE' | 'DISABLED'
        allowStaffOverride: true,
        requireManagerApproval: false,
        autoReserveStock: false,
        warningThresholds: {
          lowStock: 25, // percentage
          criticalStock: 10, // percentage
          outOfStock: 0 // percentage
        },
        overrideTypes: [
          'STAFF_DECISION',
          'EMERGENCY_PURCHASE', 
          'SUBSTITUTE_INGREDIENT',
          'VIP_CUSTOMER'
        ]
      };

      res.json({
        success: true,
        data: config,
        message: 'Stock validation configuration retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
