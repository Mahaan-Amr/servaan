import { Request, Response, NextFunction } from 'express';
import { OrderBulkOperationsService, BulkOrderStatusChangeRequest } from '../services/orderBulkOperationsService';
import { AppError } from '../utils/AppError';

export class OrderBulkOperationsController {
  /**
   * Bulk order status change
   * POST /api/orders/bulk/status
   */
  static async bulkChangeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.id;

      if (!tenantId || !updatedBy) {
        throw new AppError('Authentication required', 401);
      }

      const { orderIds, newStatus, reason, notes } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        throw new AppError('Order IDs array is required', 400);
      }

      if (!newStatus) {
        throw new AppError('New status is required', 400);
      }

      const request: BulkOrderStatusChangeRequest = {
        orderIds,
        newStatus,
        reason,
        notes,
        updatedBy
      };

      const result = await OrderBulkOperationsService.bulkChangeStatus(tenantId, request);

      res.json({
        success: true,
        data: result,
        message: `Bulk status change completed. ${result.summary.successful} successful, ${result.summary.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }
}
