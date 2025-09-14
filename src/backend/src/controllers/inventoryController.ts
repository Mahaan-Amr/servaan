import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { 
  getInventoryPrice, 
  validatePriceConsistency, 
  getPriceStatistics 
} from '../services/inventoryService';

const prisma = new PrismaClient();

export class InventoryController {
  /**
   * Get inventory price for an item
   * GET /api/inventory/items/:id/price
   */
  static async getItemPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { id: itemId } = req.params;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!itemId) {
        throw new AppError('Item ID is required', 400);
      }

      // Verify item belongs to tenant
      const item = await prisma.item.findFirst({
        where: {
          id: itemId,
          tenantId,
          isActive: true
        }
      });

      if (!item) {
        throw new AppError('Item not found', 404);
      }

      const priceInfo = await getInventoryPrice(itemId, tenantId);

      res.json({
        success: true,
        data: priceInfo,
        message: 'Item price retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate price consistency between inventory and recipes
   * GET /api/inventory/price-consistency
   */
  static async validatePriceConsistency(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const inconsistencies = await validatePriceConsistency(tenantId);

      res.json({
        success: true,
        data: {
          inconsistencies,
          totalInconsistencies: inconsistencies.length
        },
        message: 'Price consistency validation completed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get price statistics for inventory
   * GET /api/inventory/price-statistics
   */
  static async getPriceStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const statistics = await getPriceStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Price statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 
