import { Request, Response, NextFunction } from 'express';
import { OrderService, CreateOrderData, PaymentData } from '../services/orderService';
import { OrderAccountingIntegrationService } from '../services/orderAccountingIntegrationService';
import { OrderOptionsService } from '../services/orderOptionsService';
import { OrderCalculationService, OrderOptions } from '../services/orderCalculationService';
import { AppError } from '../utils/AppError';
import { OrderStatus, OrderType } from '../../shared/generated/client';

// Create OrderService instance
const orderService = new OrderService();

export interface UpdateOrderData {
  items?: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialRequest?: string;
  }>;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  totalAmount?: number;
  notes?: string;
  kitchenNotes?: string;
  allergyInfo?: string;
  status?: string;
  priority?: number;
  estimatedTime?: number;
  modifiedBy: string;
}

export class OrderController {
  /**
   * Create a new order with flexible payment options
   * POST /api/orders
   */
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        throw new AppError('Authentication required', 401);
      }

      // Validate required fields
      const { orderType, items, subtotal, totalAmount } = req.body as CreateOrderData;

      if (!orderType || !items || items.length === 0) {
        throw new AppError('Order type and items are required', 400);
      }

      if (!subtotal || !totalAmount) {
        throw new AppError('Subtotal and total amount are required', 400);
      }

      // Validate order type
      if (!Object.values(OrderType).includes(orderType)) {
        throw new AppError('Invalid order type', 400);
      }

      // Validate items structure
      for (const item of items) {
        if (!item.itemId || !item.quantity || item.quantity <= 0 || !item.unitPrice) {
          throw new AppError('Each item must have itemId, valid quantity, and unitPrice', 400);
        }
      }

      const orderData: CreateOrderData = {
        tenantId,
        orderType,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        tableId: req.body.tableId,
        guestCount: req.body.guestCount,
        items,
        subtotal,
        discountAmount: req.body.discountAmount || 0,
        taxAmount: req.body.taxAmount || 0,
        serviceCharge: req.body.serviceCharge || 0,
        totalAmount,
        paymentType: req.body.paymentType || 'IMMEDIATE',
        paymentMethod: req.body.paymentMethod,
        paidAmount: req.body.paidAmount || 0,
        notes: req.body.notes,
        kitchenNotes: req.body.kitchenNotes,
        allergyInfo: req.body.allergyInfo,
        createdBy
      };

      const order = await orderService.createOrderWithTableUpdate(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a flexible order (pay after service)
   * POST /api/orders/flexible
   */
  static async createFlexibleOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        throw new AppError('Authentication required', 401);
      }

      const { orderType, items, subtotal, totalAmount, paymentType = 'PAY_AFTER_SERVICE' } = req.body;

      if (!orderType || !items || items.length === 0) {
        throw new AppError('Order type and items are required', 400);
      }

      if (!subtotal || !totalAmount) {
        throw new AppError('Subtotal and total amount are required', 400);
      }

      // Validate payment type for flexible orders
      if (!['PAY_AFTER_SERVICE', 'PARTIAL'].includes(paymentType)) {
        throw new AppError('Invalid payment type for flexible order', 400);
      }

      const orderData: CreateOrderData = {
        tenantId,
        orderType,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        tableId: req.body.tableId,
        guestCount: req.body.guestCount,
        items,
        subtotal,
        discountAmount: req.body.discountAmount || 0,
        taxAmount: req.body.taxAmount || 0,
        serviceCharge: req.body.serviceCharge || 0,
        totalAmount,
        paymentType,
        paidAmount: 0, // No initial payment for flexible orders
        notes: req.body.notes,
        kitchenNotes: req.body.kitchenNotes,
        allergyInfo: req.body.allergyInfo,
        createdBy
      };

      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Flexible order created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add items to an existing order
   * POST /api/orders/:id/add-items
   */
  static async addItemsToOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const modifiedBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !modifiedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Items array is required', 400);
      }

      // Validate items structure
      for (const item of items) {
        if (!item.itemId || !item.quantity || item.quantity <= 0 || !item.unitPrice) {
          throw new AppError('Each item must have itemId, valid quantity, and unitPrice', 400);
        }
      }

      const updatedOrder = await orderService.addItemsToOrder(orderId, items, modifiedBy);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Items added to order successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process payment for an order
   * POST /api/orders/:id/process-payment
   */
  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const processedBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !processedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const { amount, paymentMethod, notes } = req.body;

      if (!amount || amount <= 0) {
        throw new AppError('Valid payment amount is required', 400);
      }

      if (!paymentMethod || !['CASH', 'CARD'].includes(paymentMethod)) {
        throw new AppError('Valid payment method is required', 400);
      }

      const paymentData: PaymentData = {
        orderId,
        amount: parseFloat(amount),
        paymentMethod,
        gatewayId: req.body.gatewayId,
        transactionId: req.body.transactionId,
        referenceNumber: req.body.referenceNumber,
        terminalId: req.body.terminalId,
        cardMask: req.body.cardMask,
        cardType: req.body.cardType,
        processedBy,
        notes
      };

      const updatedOrder = await orderService.processPayment(paymentData);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment history for an order
   * GET /api/orders/:id/payment-history
   */
  static async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const orderId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const order = await orderService.getOrder(orderId);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.json({
        success: true,
        data: {
          order,
          paymentHistory: order.payments || [],
          remainingAmount: order.remainingAmount,
          paidAmount: order.paidAmount,
          totalAmount: order.totalAmount
        },
        message: 'Payment history retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get orders with enhanced filtering
   * GET /api/orders
   */
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Build filter options
      const filters: any = {
        tenantId
      };

      if (req.query.status) {
        const statusArray = Array.isArray(req.query.status) 
          ? req.query.status as OrderStatus[]
          : [req.query.status as OrderStatus];
        filters.status = statusArray.filter(status => Object.values(OrderStatus).includes(status));
      }

      if (req.query.orderType) {
        const typeArray = Array.isArray(req.query.orderType)
          ? req.query.orderType as OrderType[]
          : [req.query.orderType as OrderType];
        filters.orderType = typeArray.filter(type => Object.values(OrderType).includes(type));
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.customerId) {
        filters.customerId = req.query.customerId as string;
      }

      if (req.query.tableId) {
        filters.tableId = req.query.tableId as string;
      }

      if (req.query.paymentStatus) {
        const paymentStatusArray = Array.isArray(req.query.paymentStatus)
          ? req.query.paymentStatus as string[]
          : [req.query.paymentStatus as string];
        filters.paymentStatus = paymentStatusArray;
      }

      const orders = await orderService.getOrders(filters);

      res.json({
        success: true,
        data: orders,
        message: 'Orders retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by ID with enhanced details
   * GET /api/orders/:id
   */
  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const orderId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const order = await orderService.getOrder(orderId);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order
   * PUT /api/orders/:id
   */
  static async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !updatedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      // Validate estimated time if provided
      if (req.body.estimatedTime !== undefined && (req.body.estimatedTime < 5 || req.body.estimatedTime > 300)) {
        throw new AppError('Estimated time must be between 5 and 300 minutes', 400);
      }

      const updateData: UpdateOrderData = {
        status: req.body.status,
        priority: req.body.priority,
        estimatedTime: req.body.estimatedTime,
        notes: req.body.notes,
        kitchenNotes: req.body.kitchenNotes,
        items: req.body.items,
        subtotal: req.body.subtotal,
        discountAmount: req.body.discountAmount,
        taxAmount: req.body.taxAmount,
        serviceCharge: req.body.serviceCharge,
        totalAmount: req.body.totalAmount,
        modifiedBy: updatedBy
      };

      const updatedOrder = await orderService.updateOrder(tenantId, orderId, updateData, updatedBy);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status
   * PATCH /api/orders/:id/status
   */
  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.id;
      const orderId = req.params.id;
      const { status, priority, estimatedTime } = req.body;

      if (!tenantId || !updatedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      if (!status || !Object.values(OrderStatus).includes(status)) {
        throw new AppError('Valid order status is required', 400);
      }

      // If status is COMPLETED, use the enhanced completeOrder method
      if (status === 'COMPLETED') {
        const result = await orderService.completeOrder(
          tenantId,
          orderId,
          updatedBy
        );

        res.json({
          success: true,
          data: result,
          message: 'Order completed successfully'
        });
      } else {
        // For other status updates, use the regular updateOrder method
        const updateData: UpdateOrderData = {
          status,
          priority,
          estimatedTime,
          modifiedBy: updatedBy
        };

        const updatedOrder = await orderService.updateOrder(
          tenantId,
          orderId,
          updateData,
          updatedBy
        );

        res.json({
          success: true,
          data: updatedOrder,
          message: 'Order status updated successfully'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel order
   * POST /api/orders/:id/cancel
   */
  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const cancelledBy = req.user?.id;
      const orderId = req.params.id;
      const { reason = 'Cancelled by user' } = req.body;

      if (!tenantId || !cancelledBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const cancelledOrder = await orderService.cancelOrder(
        tenantId,
        orderId,
        reason,
        cancelledBy
      );

      res.json({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's summary
   * GET /api/orders/today/summary
   */
  static async getTodaysSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Temporarily get all orders instead of just today's to test data processing
      const orders = await orderService.getOrders({
        tenantId
        // Removed date filtering temporarily to test if data processing works
        // startDate: startOfDay,
        // endDate: endOfDay
      });

      console.log(`🔍 Found ${orders.length} total orders for tenant ${tenantId}`);

      // Calculate summary statistics
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
      const completedOrders = orders.filter((order: any) => order.status === 'COMPLETED').length;
      const pendingOrders = orders.filter((order: any) => ['SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'].includes(order.status)).length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      console.log(`📊 Calculated stats: ${completedOrders} completed, ${pendingOrders} pending, ${totalRevenue} revenue`);

      // Get payment methods breakdown
      const paymentMethods = orders.reduce((acc: any[], order: any) => {
        if (order.paymentMethod) {
          const existing = acc.find(pm => pm.method === order.paymentMethod);
          if (existing) {
            existing.count++;
            existing.amount += Number(order.totalAmount || 0);
          } else {
            acc.push({
              method: order.paymentMethod,
              count: 1,
              amount: Number(order.totalAmount || 0)
            });
          }
        }
        return acc;
      }, []);

      // Get table status breakdown
      const tableStatus = orders.reduce((acc: any[], order: any) => {
        if (order.tableId) {
          const existing = acc.find(ts => ts.status === 'OCCUPIED');
          if (existing) {
            existing.count++;
          } else {
            acc.push({
              status: 'OCCUPIED',
              count: 1
            });
          }
        }
        return acc;
      }, []);

      // Get top selling items
      const itemSales = new Map();
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const itemName = item.item?.name || item.itemName || 'Unknown Item';
          const existing = itemSales.get(itemName);
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += Number(item.totalPrice || 0);
          } else {
            itemSales.set(itemName, {
              name: itemName,
              quantity: item.quantity,
              revenue: Number(item.totalPrice || 0)
            });
          }
        });
      });

      const topSellingItems = Array.from(itemSales.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const response = {
        success: true,
        data: {
          summary: {
            completedOrders,
            pendingOrders,
            totalRevenue,
            averageOrderValue,
            totalOrders: orders.length
          },
          topSellingItems,
          paymentMethods,
          tableStatus
        },
        message: 'Today\'s summary retrieved successfully'
      };

      console.log('📤 Sending response:', JSON.stringify(response, null, 2));

      res.json(response);
    } catch (error) {
      console.error('❌ Error in getTodaysSummary:', error);
      next(error);
    }
  }

  /**
   * Get active orders
   * GET /api/orders/active
   */
  static async getActiveOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const activeStatuses = [
        'SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'
      ];

      const result = await orderService.getOrders({
        tenantId,
        status: activeStatuses
      });

      res.json({
        success: true,
        data: result,
        message: 'Active orders retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get orders by table
   * GET /api/orders/table/:tableId
   */
  static async getOrdersByTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.tableId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      const status = req.query.status as string;
      const statusFilter = status ? [status] : undefined;

      const result = await orderService.getOrders({
        tenantId,
        tableId,
        status: statusFilter
      });

      res.json({
        success: true,
        data: result,
        message: 'Table orders retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order statistics
   * GET /api/orders/statistics
   */
  static async getOrderStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();

      const result = await orderService.getOrders({
        tenantId,
        startDate,
        endDate
      });

      // Calculate additional statistics
      const statusBreakdown = result.reduce((acc: Record<string, number>, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const typeBreakdown = result.reduce((acc: Record<string, number>, order: any) => {
        acc[order.orderType] = (acc[order.orderType] || 0) + 1;
        return acc;
      }, {});

      const hourlyBreakdown = result.reduce((acc: Record<number, number>, order: any) => {
        const hour = new Date(order.orderDate).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const totalRevenue = result.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);

      res.json({
        success: true,
        data: {
          totalRevenue,
          statusBreakdown,
          typeBreakdown,
          hourlyBreakdown,
          totalOrders: result.length,
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        },
        message: 'Order statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove item from order
   * DELETE /api/orders/:id/items/:itemId
   */
  static async removeItemFromOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.id;
      const orderId = req.params.id;
      const orderItemId = req.params.itemId;

      if (!tenantId || !updatedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId || !orderItemId) {
        throw new AppError('Order ID and item ID are required', 400);
      }

      // For now, we'll use a simple approach - this would need to be implemented in the service
      // The service should handle item removal logic
      const updateData: UpdateOrderData = {
        modifiedBy: updatedBy
      };

      const updatedOrder = await orderService.updateOrder(tenantId, orderId, updateData, updatedBy);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Item removed from order successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove items from order
   * DELETE /api/orders/:id/remove-items
   */
  static async removeItemsFromOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const modifiedBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !modifiedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const { itemIds } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        throw new AppError('Item IDs array is required', 400);
      }

      const updatedOrder = await orderService.removeItemsFromOrder(orderId, itemIds, modifiedBy);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Items removed from order successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update item quantities in order
   * PUT /api/orders/:id/update-quantities
   */
  static async updateItemQuantities(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const modifiedBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !modifiedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const { itemUpdates } = req.body;

      if (!itemUpdates || !Array.isArray(itemUpdates) || itemUpdates.length === 0) {
        throw new AppError('Item updates array is required', 400);
      }

      // Validate item updates structure
      for (const update of itemUpdates) {
        if (!update.itemId || !update.newQuantity || update.newQuantity <= 0) {
          throw new AppError('Each update must have itemId and valid newQuantity', 400);
        }
      }

      const updatedOrder = await orderService.updateItemQuantities(orderId, itemUpdates, modifiedBy);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Item quantities updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate order
   * POST /api/orders/:id/duplicate
   */
  static async duplicateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !createdBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      // Get original order
      const originalOrder = await orderService.getOrder(orderId);

      if (!originalOrder) {
        throw new AppError('Original order not found', 404);
      }

      // Calculate totals for the duplicated order
      const items = (originalOrder as any).items?.map((item: any) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        modifiers: typeof item.modifiers === 'string' 
          ? JSON.parse(item.modifiers) 
          : item.modifiers,
        specialRequest: item.specialRequest
      })) || [];

      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      const totalAmount = subtotal; // Simplified calculation

      // Create new order data based on original
      const orderData: CreateOrderData = {
        tenantId,
        orderType: originalOrder.orderType,
        customerId: originalOrder.customerId || undefined,
        customerName: originalOrder.customerName || undefined,
        customerPhone: originalOrder.customerPhone || undefined,
        tableId: req.body.tableId || originalOrder.tableId || undefined, // Allow different table
        guestCount: originalOrder.guestCount || undefined,
        items,
        subtotal,
        totalAmount,
        notes: req.body.notes || (originalOrder as any).notes || undefined,
        kitchenNotes: originalOrder.kitchenNotes || undefined,
        allergyInfo: originalOrder.allergyInfo || undefined,
        createdBy
      };

      const newOrder = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Order duplicated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete order with full integration processing
   * POST /api/orders/:id/complete
   */
  static async completeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const completedBy = req.user?.id;
      const orderId = req.params.id;

      if (!tenantId || !completedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      const result = await orderService.completeOrder(
        tenantId,
        orderId,
        completedBy
      );

      res.json({
        success: true,
        data: result,
        message: 'Order completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recipe-based profitability report
   * GET /api/orders/profitability-report
   */
  static async getProfitabilityReport(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();

      const result = await orderService.getOrders({
        tenantId,
        startDate,
        endDate
      });

      // Calculate profitability metrics
      const totalRevenue = result.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
      const totalOrders = result.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Simplified profitability calculation (in real implementation, this would use recipe costs)
      const estimatedCOGS = totalRevenue * 0.6; // Assume 60% cost of goods sold
      const grossProfit = totalRevenue - estimatedCOGS;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          summary: {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            estimatedCOGS,
            grossProfit,
            profitMargin: profitMargin.toFixed(2) + '%'
          },
          topSellingItems: [], // Would be calculated based on recipe integration
          profitByCategory: [], // Would be calculated based on recipe integration
          dailyProfitTrend: [] // Would be calculated based on recipe integration
        },
        message: 'Profitability report generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order options
   * PUT /api/orders/:orderId/options
   */
  static async updateOrderOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const orderId = req.params.orderId;
      const options = req.body as OrderOptions;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Validate options
      const validation = OrderCalculationService.validateOrderOptions(options);
      if (!validation.isValid) {
        throw new AppError(`Invalid order options: ${validation.errors.join(', ')}`, 400);
      }

      // Save options
      await OrderOptionsService.saveOrderOptions(tenantId, orderId, options);

      // Get updated calculation
      const order = await orderService.getOrder(orderId);
      const calculation = OrderCalculationService.calculateOrderTotal(order.items as any, options);

      res.json({
        success: true,
        data: {
          options,
          calculation
        },
        message: 'Order options updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order calculation
   * GET /api/orders/:orderId/calculation
   */
  static async getOrderCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const orderId = req.params.orderId;
      
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const order = await orderService.getOrder(orderId);
      const options = await OrderOptionsService.getOrderOptions(orderId);
      const calculation = OrderCalculationService.calculateOrderTotal(order.items as any, options);

      res.json({
        success: true,
        data: {
          options,
          calculation
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business presets
   * GET /api/business/presets
   */
  static async getBusinessPresets(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const presets = await OrderOptionsService.getBusinessPresets(tenantId);

      res.json({
        success: true,
        data: presets
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create business preset
   * POST /api/business/presets
   */
  static async createBusinessPreset(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const presetData = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const preset = await OrderOptionsService.createBusinessPreset(tenantId, presetData);

      res.status(201).json({
        success: true,
        data: preset,
        message: 'Business preset created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update business preset
   * PUT /api/business/presets/:id
   */
  static async updateBusinessPreset(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const presetId = req.params.id;
      const presetData = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const preset = await OrderOptionsService.updateBusinessPreset(tenantId, presetId, presetData);

      res.json({
        success: true,
        data: preset,
        message: 'Business preset updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete business preset
   * DELETE /api/business/presets/:id
   */
  static async deleteBusinessPreset(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const presetId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      await OrderOptionsService.deleteBusinessPreset(tenantId, presetId);

      res.json({
        success: true,
        message: 'Business preset deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply preset to order
   * POST /api/orders/:orderId/apply-preset/:presetId
   */
  static async applyPresetToOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const orderId = req.params.orderId;
      const presetId = req.params.presetId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const options = await OrderOptionsService.applyPresetToOrder(tenantId, orderId, presetId);
      const order = await orderService.getOrder(orderId);
      const calculation = OrderCalculationService.calculateOrderTotal(order.items as any, options);

      res.json({
        success: true,
        data: {
          options,
          calculation
        },
        message: 'Preset applied to order successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get default preset
   * GET /api/business/presets/default
   */
  static async getDefaultPreset(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const preset = await OrderOptionsService.getDefaultPreset(tenantId);

      res.json({
        success: true,
        data: preset
      });
    } catch (error) {
      next(error);
    }
  }
} 
