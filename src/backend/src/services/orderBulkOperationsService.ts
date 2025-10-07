import { PrismaClient, OrderStatus } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { OrderAccountingIntegrationService } from './orderAccountingIntegrationService';

const prisma = new PrismaClient();

export interface BulkOrderStatusChangeRequest {
  orderIds: string[];
  newStatus: OrderStatus;
  reason?: string;
  notes?: string;
  updatedBy: string;
}

export interface BulkOrderStatusChangeResult {
  success: boolean;
  orderId: string;
  orderNumber?: string;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  error?: string;
}

export class OrderBulkOperationsService {
  /**
   * Bulk order status change with proper error handling and accounting integration
   */
  static async bulkChangeStatus(
    tenantId: string,
    request: BulkOrderStatusChangeRequest
  ): Promise<{
    results: BulkOrderStatusChangeResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const { orderIds, newStatus, reason, notes, updatedBy } = request;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new AppError('Order IDs array is required', 400);
    }

    if (!newStatus || !Object.values(OrderStatus).includes(newStatus)) {
      throw new AppError('Valid order status is required', 400);
    }

    const results: BulkOrderStatusChangeResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process orders sequentially to avoid race conditions and database locks
    for (const orderId of orderIds) {
      try {
        // Get current order state
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId, tenantId },
          select: { 
            id: true, 
            orderNumber: true, 
            status: true,
            tenantId: true 
          }
        });

        if (!existingOrder) {
          results.push({
            success: false,
            orderId,
            newStatus,
            error: 'Order not found'
          });
          failed++;
          continue;
        }

        // Skip if already in target status
        if (existingOrder.status === newStatus) {
          results.push({
            success: true,
            orderId,
            orderNumber: existingOrder.orderNumber,
            oldStatus: existingOrder.status,
            newStatus
          });
          successful++;
          continue;
        }

        // Handle COMPLETED status with accounting integration
        if (newStatus === 'COMPLETED') {
          try {
                 // First, update the order status to COMPLETED
                 const updatedOrder = await prisma.order.update({
                   where: { id: orderId, tenantId },
                   data: {
                     status: 'COMPLETED',
                     completedAt: new Date(),
                     updatedAt: new Date()
                   }
                 });

            // Then process accounting integration
            const accountingResult = await OrderAccountingIntegrationService.processOrderCompletion(
              tenantId,
              orderId,
              updatedBy
            );

            // Automatically sync kitchen display status with main order status
            try {
              const { KitchenDisplayService } = await import('./kitchenDisplayService');
              await KitchenDisplayService.syncKitchenDisplayWithOrderStatus(tenantId, orderId);
              console.log(`🔄 [BULK_OPERATIONS] Auto-synced kitchen display for completed order ${existingOrder.orderNumber}`);
            } catch (syncError) {
              console.error(`❌ [BULK_OPERATIONS] Failed to auto-sync kitchen display for completed order ${existingOrder.orderNumber}:`, syncError);
              // Don't fail the entire operation if kitchen sync fails
            }
            
            results.push({
              success: true,
              orderId,
              orderNumber: existingOrder.orderNumber,
              oldStatus: existingOrder.status,
              newStatus
            });
            successful++;
          } catch (error) {
            console.error(`Failed to complete order ${orderId}:`, error);
            console.error(`Error details:`, error instanceof Error ? { message: error.message, stack: error.stack } : error);
            results.push({
              success: false,
              orderId,
              orderNumber: existingOrder.orderNumber,
              oldStatus: existingOrder.status,
              newStatus,
              error: error instanceof Error ? error.message : 'Completion failed'
            });
            failed++;
          }
        } else {
               // Handle other status updates
               const updatedOrder = await prisma.order.update({
                 where: { id: orderId, tenantId },
                 data: {
                   status: newStatus,
                   updatedAt: new Date()
                 }
               });

          // Automatically sync kitchen display status with main order status
          try {
            const { KitchenDisplayService } = await import('./kitchenDisplayService');
            await KitchenDisplayService.syncKitchenDisplayWithOrderStatus(tenantId, orderId);
            console.log(`🔄 [BULK_OPERATIONS] Auto-synced kitchen display for order ${existingOrder.orderNumber}`);
          } catch (syncError) {
            console.error(`❌ [BULK_OPERATIONS] Failed to auto-sync kitchen display for order ${existingOrder.orderNumber}:`, syncError);
            // Don't fail the entire operation if kitchen sync fails
          }

          results.push({
            success: true,
            orderId,
            orderNumber: existingOrder.orderNumber,
            oldStatus: existingOrder.status,
            newStatus
          });
          successful++;
        }

      } catch (error) {
        console.error(`Failed to update order ${orderId}:`, error);
        results.push({
          success: false,
          orderId,
          newStatus,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return {
      results,
      summary: {
        total: orderIds.length,
        successful,
        failed
      }
    };
  }
}
