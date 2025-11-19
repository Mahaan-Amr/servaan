import { Request, Response, NextFunction } from 'express';
import { OrderingSettingsService, UpdateOrderingSettingsData } from '../services/orderingSettingsService';
import { AppError } from '../utils/AppError';

export class OrderingSettingsController {
  /**
   * Get ordering settings
   * GET /api/ordering/settings
   */
  static async getOrderingSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const settings = await OrderingSettingsService.getOrderingSettings(tenantId);

      res.json({
        success: true,
        data: settings,
        message: 'Ordering settings retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ordering settings
   * PUT /api/ordering/settings
   */
  static async updateOrderingSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Validate that user has manager/admin role
      if (req.user?.role !== 'MANAGER' && req.user?.role !== 'ADMIN') {
        throw new AppError('Only managers and admins can update ordering settings', 403);
      }

      const updateData: UpdateOrderingSettingsData = {};

      if (req.body.orderCreationEnabled !== undefined) {
        if (typeof req.body.orderCreationEnabled !== 'boolean') {
          throw new AppError('orderCreationEnabled must be a boolean', 400);
        }
        updateData.orderCreationEnabled = req.body.orderCreationEnabled;
      }

      if (req.body.lockItemsWithoutStock !== undefined) {
        if (typeof req.body.lockItemsWithoutStock !== 'boolean') {
          throw new AppError('lockItemsWithoutStock must be a boolean', 400);
        }
        updateData.lockItemsWithoutStock = req.body.lockItemsWithoutStock;
      }

      if (req.body.requireManagerConfirmationForNoStock !== undefined) {
        if (typeof req.body.requireManagerConfirmationForNoStock !== 'boolean') {
          throw new AppError('requireManagerConfirmationForNoStock must be a boolean', 400);
        }
        updateData.requireManagerConfirmationForNoStock = req.body.requireManagerConfirmationForNoStock;
      }

      const updatedSettings = await OrderingSettingsService.updateOrderingSettings(tenantId, updateData);

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Ordering settings updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

