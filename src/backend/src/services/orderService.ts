import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { TableService } from './tableService';

const prisma = new PrismaClient();

export interface CreateOrderData {
  tenantId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  tableId?: string;
  guestCount?: number;
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: any[];
    specialRequest?: string;
  }>;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  totalAmount: number;
  paymentType?: 'IMMEDIATE' | 'PAY_AFTER_SERVICE' | 'PARTIAL';
  paymentMethod?: 'CASH' | 'CARD';
  paidAmount?: number;
  notes?: string;
  kitchenNotes?: string;
  allergyInfo?: string;
  createdBy: string;
}

export interface UpdateOrderData {
  items?: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: any[];
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
  modifiedBy: string;
}

export interface PaymentData {
  orderId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD';
  gatewayId?: string;
  transactionId?: string;
  referenceNumber?: string;
  terminalId?: string;
  cardMask?: string;
  cardType?: string;
  processedBy: string;
  notes?: string;
}

export class OrderService {
  // Create a new order with flexible payment options
  async createOrder(data: CreateOrderData): Promise<any> {
    const {
            tenantId,
      orderType,
      customerName,
      customerPhone,
      customerId,
      tableId,
      guestCount,
      items,
      subtotal,
      discountAmount = 0,
      taxAmount = 0,
      serviceCharge = 0,
      totalAmount,
      paymentType = 'IMMEDIATE',
      paymentMethod,
      paidAmount = 0,
      notes,
      kitchenNotes,
      allergyInfo,
      createdBy
    } = data;

    return await prisma.$transaction(async (tx: any) => {
      // Generate order number
      const orderNumber = await this.generateOrderNumber(tenantId);

      // Create the order
      const order = await tx.order.create({
        data: {
              tenantId,
          orderNumber,
          orderType,
          customerName,
          customerPhone,
          customerId,
          tableId,
          guestCount,
          subtotal,
          discountAmount,
          taxAmount,
          serviceCharge,
          totalAmount,
          paymentType,
          paymentMethod,
          paidAmount,
          remainingAmount: totalAmount - paidAmount,
          paymentStatus: paidAmount >= totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
          status: 'SUBMITTED', // Set initial status to SUBMITTED
          notes,
          kitchenNotes,
          allergyInfo,
          createdBy,
          lastPaymentAt: paidAmount > 0 ? new Date() : null
        }
      });

      // Fetch menu item details to get names and linked inventory items
      const itemIds = items.map((item: any) => item.itemId);
      const menuItemDetails = await tx.menuItem.findMany({
        where: { id: { in: itemIds } },
        select: { 
          id: true, 
          displayName: true, 
          itemId: true, // This is the linked inventory item ID
          menuPrice: true
        }
      });

      // Create a map for quick lookup
      const menuItemMap = new Map(menuItemDetails.map((item: { id: string; displayName: string; itemId?: string; menuPrice: any }) => [item.id, item]));

      // Create order items with menu item names
      const orderItems = items.map((item: any, index: number) => {
        const menuItemDetail = menuItemMap.get(item.itemId) as { id: string; displayName: string; itemId?: string; menuPrice: any } | undefined;
        if (!menuItemDetail) {
          throw new AppError(`Menu item with ID ${item.itemId} not found`, 400);
        }

        // Determine the itemId and menuItemId based on whether the menu item has a linked inventory item
        const hasLinkedInventory = menuItemDetail.itemId && menuItemDetail.itemId.trim() !== '';
        
        return {
          orderId: order.id,
          itemId: hasLinkedInventory ? menuItemDetail.itemId : null, // Use inventory item ID if available
          menuItemId: hasLinkedInventory ? null : menuItemDetail.id, // Use menu item ID if no inventory
          itemName: menuItemDetail.displayName, // Use the menu item display name
          itemCode: null, // Item model doesn't have a code field, so we set it to null
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          modifiers: item.modifiers || [],
          specialRequest: item.specialRequest,
          lineNumber: index + 1,
          tenantId: tenantId // Add the required tenantId field
        };
      });

      await tx.orderItem.createMany({
        data: orderItems
      });

      // Update table status to OCCUPIED if tableId is provided
      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' }
        });
      }

      // Create payment record if payment was made
      if (paidAmount > 0) {
        await tx.orderPayment.create({
          data: {
            tenantId,
            paymentNumber: await this.generatePaymentNumber(tenantId),
            orderId: order.id,
            amount: paidAmount,
            paymentMethod: paymentMethod!,
            paymentStatus: 'PAID',
            paymentDate: new Date(),
            processedBy: createdBy,
            processedAt: new Date()
          }
        });
      }

      return order;
    });
  }

  // Add real-time table status update after order creation
  async createOrderWithTableUpdate(data: CreateOrderData): Promise<any> {
    const order = await this.createOrder(data);
    
    // Send real-time table status update if tableId is provided
    if (data.tableId) {
      try {
        await TableService.changeTableStatus(
          data.tenantId, 
          data.tableId, 
          'OCCUPIED', 
          'Order created', 
          data.createdBy
        );
      } catch (error) {
        console.error('Failed to update table status:', error);
      }
    }
    
    return order;
  }

  // Add items to an existing order
  async addItemsToOrder(orderId: string, items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: any[];
    specialRequest?: string;
  }>, modifiedBy: string): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        throw new AppError('Cannot modify completed or cancelled order', 400);
      }

      // Fetch menu item details to get names and linked inventory items
      const itemIds = items.map((item: any) => item.itemId);
      const menuItemDetails = await tx.menuItem.findMany({
        where: { id: { in: itemIds } },
        select: { 
          id: true, 
          displayName: true, 
          itemId: true, // This is the linked inventory item ID
          menuPrice: true
        }
      });

      // Create a map for quick lookup
      const menuItemMap = new Map(menuItemDetails.map((item: { id: string; displayName: string; itemId?: string; menuPrice: any }) => [item.id, item]));

      // Calculate new totals with menu item names
      const newItems = items.map((item: any, index: number) => {
        const menuItemDetail = menuItemMap.get(item.itemId) as { id: string; displayName: string; itemId?: string; menuPrice: any } | undefined;
        if (!menuItemDetail) {
          throw new AppError(`Menu item with ID ${item.itemId} not found`, 400);
        }

        // Determine the itemId and menuItemId based on whether the menu item has a linked inventory item
        const hasLinkedInventory = menuItemDetail.itemId && menuItemDetail.itemId.trim() !== '';
        
        return {
          orderId: order.id,
          itemId: hasLinkedInventory ? menuItemDetail.itemId : null, // Use inventory item ID if available
          menuItemId: hasLinkedInventory ? null : menuItemDetail.id, // Use menu item ID if no inventory
          itemName: menuItemDetail.displayName, // Use the menu item display name
          itemCode: null, // Item model doesn't have a code field, so we set it to null
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          modifiers: item.modifiers || [],
          specialRequest: item.specialRequest,
          lineNumber: order.items.length + index + 1,
          tenantId: order.tenantId // Add the required tenantId field
        };
      });

      const newItemsTotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const newTotalAmount = order.totalAmount + newItemsTotal;
      const newRemainingAmount = newTotalAmount - order.paidAmount;

      // Create order modification record
      await tx.orderModification.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          modificationType: 'ADD_ITEM',
          description: `Added ${items.length} new item(s)`,
          previousData: { totalAmount: order.totalAmount, remainingAmount: order.remainingAmount },
          newData: { totalAmount: newTotalAmount, remainingAmount: newRemainingAmount },
          amountChange: newItemsTotal,
          previousTotal: order.totalAmount,
          newTotal: newTotalAmount,
          modifiedBy
        }
      });

      // Add new items
      await tx.orderItem.createMany({
        data: newItems
      });

      // Update order totals
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          totalAmount: newTotalAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newRemainingAmount <= 0 ? 'PAID' : order.paidAmount > 0 ? 'PARTIAL' : 'PENDING',
          status: 'MODIFIED'
        }
      });

      return updatedOrder;
    });
  }

  // Process payment for an order
  async processPayment(data: PaymentData): Promise<any> {
    const {
      orderId,
      amount,
      paymentMethod,
      gatewayId,
      transactionId,
      referenceNumber,
      terminalId,
      cardMask,
      cardType,
      processedBy,
      notes
    } = data;

    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'CANCELLED') {
        throw new AppError('Cannot process payment for cancelled order', 400);
      }

      // Create payment record
      const payment = await tx.orderPayment.create({
        data: {
          tenantId: order.tenantId,
          paymentNumber: await this.generatePaymentNumber(order.tenantId),
          orderId,
          amount,
          paymentMethod,
          paymentStatus: 'PAID',
          gatewayId,
          transactionId,
          referenceNumber,
          terminalId,
          cardMask,
          cardType,
          paymentDate: new Date(),
          processedBy,
          processedAt: new Date()
        }
      });

      // Update order payment status
      const totalPaid = order.paidAmount + amount;
      const newRemainingAmount = order.totalAmount - totalPaid;
      const newPaymentStatus = newRemainingAmount <= 0 ? 'PAID' : 'PARTIAL';

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: totalPaid,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaymentStatus,
          lastPaymentAt: new Date(),
          paymentNotes: notes ? `${order.paymentNotes || ''}\n${notes}`.trim() : order.paymentNotes
        }
      });

      return updatedOrder;
    });
  }

  // Get order with all related data
  async getOrder(orderId: string): Promise<any | null> {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { item: true }
        },
        payments: true,
        table: true,
        customer: true,
        modifications: {
          include: { modifiedByUser: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  // Get orders with filters
  async getOrders(filters: {
    tenantId: string;
    status?: any[];
    orderType?: string[];
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
    tableId?: string;
    paymentStatus?: any[];
  }): Promise<any[]> {
    const where: any = {
      tenantId: filters.tenantId
    };

    if (filters.status) {
        where.status = { in: filters.status };
      }

    if (filters.orderType) {
        where.orderType = { in: filters.orderType };
      }

      if (filters.startDate || filters.endDate) {
        where.orderDate = {};
        if (filters.startDate) {
          where.orderDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.orderDate.lte = filters.endDate;
        }
      }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.tableId) {
      where.tableId = filters.tableId;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = { in: filters.paymentStatus };
    }

    return await prisma.order.findMany({
          where,
          include: {
            items: {
          include: { item: true }
        },
        payments: true,
        table: true,
        customer: true
      },
      orderBy: { orderDate: 'desc' }
    });
  }

  // Generate numeric order number that resets daily per tenant and starts at 100
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const lastTodayOrder = await prisma.order.findFirst({
      where: { tenantId, orderDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { createdAt: 'desc' }
    });

    // Start at 100 each day
    let next = 100;
    if (lastTodayOrder && lastTodayOrder.orderNumber) {
      const parsed = parseInt(String(lastTodayOrder.orderNumber).replace(/\D/g, ''), 10);
      if (!isNaN(parsed)) next = parsed + 1;
    }

    // Store as plain number string for simplicity
    return String(next);
  }

  // Generate unique payment number
  private async generatePaymentNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastPayment = await prisma.orderPayment.findFirst({
        where: {
        tenantId,
        paymentNumber: { startsWith: `PAY-${dateStr}` }
      },
      orderBy: { paymentNumber: 'desc' }
    });

    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.paymentNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `PAY-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  // Update order with enhanced functionality
  async updateOrder(tenantId: string, orderId: string, updateData: UpdateOrderData, updatedBy: string): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
          where: { id: orderId, tenantId },
          include: { items: true }
        });

      if (!order) {
          throw new AppError('Order not found', 404);
        }

      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        throw new AppError('Cannot modify completed or cancelled order', 400);
        }

        // Prepare update data
        const orderUpdateData: any = {};

      if (updateData.subtotal !== undefined) orderUpdateData.subtotal = updateData.subtotal;
      if (updateData.discountAmount !== undefined) orderUpdateData.discountAmount = updateData.discountAmount;
      if (updateData.taxAmount !== undefined) orderUpdateData.taxAmount = updateData.taxAmount;
      if (updateData.serviceCharge !== undefined) orderUpdateData.serviceCharge = updateData.serviceCharge;
      if (updateData.totalAmount !== undefined) orderUpdateData.totalAmount = updateData.totalAmount;
      if (updateData.notes !== undefined) orderUpdateData.notes = updateData.notes;
      if (updateData.kitchenNotes !== undefined) orderUpdateData.kitchenNotes = updateData.kitchenNotes;
      if (updateData.allergyInfo !== undefined) orderUpdateData.allergyInfo = updateData.allergyInfo;
      if (updateData.status !== undefined) orderUpdateData.status = updateData.status;

      // Handle item updates
      if (updateData.items && updateData.items.length > 0) {
        // Fetch menu item details to get names and linked inventory items
        const itemIds = updateData.items.map((item: any) => item.itemId);
        const menuItemDetails = await tx.menuItem.findMany({
          where: { id: { in: itemIds } },
          select: { 
            id: true, 
            displayName: true, 
            itemId: true, // This is the linked inventory item ID
            menuPrice: true
          }
        });

        // Create a map for quick lookup
        const menuItemMap = new Map(menuItemDetails.map((item: { id: string; displayName: string; itemId?: string; menuPrice: any }) => [item.id, item]));

        // Calculate new totals
        const newItems = updateData.items.map((item: any, index: number) => {
          const menuItemDetail = menuItemMap.get(item.itemId) as { id: string; displayName: string; itemId?: string; menuPrice: any } | undefined;
          if (!menuItemDetail) {
            throw new AppError(`Menu item with ID ${item.itemId} not found`, 400);
          }

          // Determine the itemId and menuItemId based on whether the menu item has a linked inventory item
          const hasLinkedInventory = menuItemDetail.itemId && menuItemDetail.itemId.trim() !== '';
          
          return {
            orderId: order.id,
            itemId: hasLinkedInventory ? menuItemDetail.itemId : null, // Use inventory item ID if available
            menuItemId: hasLinkedInventory ? null : menuItemDetail.id, // Use menu item ID if no inventory
            itemName: menuItemDetail.displayName, // Use the menu item display name
            itemCode: null, // Item model doesn't have a code field, so we set it to null
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            modifiers: item.modifiers || [],
            specialRequest: item.specialRequest,
            lineNumber: order.items.length + index + 1,
            tenantId: order.tenantId // Add the required tenantId field
          };
        });

        const newItemsTotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const newTotalAmount = order.totalAmount + newItemsTotal;
        const newRemainingAmount = newTotalAmount - order.paidAmount;

        // Create order modification record
        await tx.orderModification.create({
          data: {
            tenantId: order.tenantId,
            orderId: order.id,
            modificationType: 'MODIFY_ITEM',
            description: `Modified ${updateData.items.length} item(s)`,
            previousData: { totalAmount: order.totalAmount, remainingAmount: order.remainingAmount },
            newData: { totalAmount: newTotalAmount, remainingAmount: newRemainingAmount },
            amountChange: newItemsTotal,
            previousTotal: order.totalAmount,
            newTotal: newTotalAmount,
            modifiedBy: updatedBy
          }
        });

        // Add new items
        await tx.orderItem.createMany({
          data: newItems
        });

        // Update order totals
        orderUpdateData.totalAmount = newTotalAmount;
        orderUpdateData.remainingAmount = newRemainingAmount;
        orderUpdateData.paymentStatus = newRemainingAmount <= 0 ? 'PAID' : order.paidAmount > 0 ? 'PARTIAL' : 'PENDING';
        orderUpdateData.status = 'MODIFIED';
        }

        // Update the order
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
        data: orderUpdateData,
          include: {
            items: {
            include: { item: true }
          },
          payments: true,
            table: true,
          customer: true
          }
        });

        return updatedOrder;
      });
  }

  // Complete order with enhanced functionality
  async completeOrder(tenantId: string, orderId: string, completedBy: string): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, tenantId },
        include: {
          table: true,
          items: {
            include: { item: true }
          }
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        throw new AppError('Order is already completed or cancelled', 400);
      }

      // Update order to completed
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          servedAt: order.servedAt || new Date(),
          servedBy: completedBy,
          updatedAt: new Date()
        },
        include: {
          items: {
            include: { item: true }
          },
          table: true,
          customer: true
        }
      });

      // Update table status to AVAILABLE if table was assigned
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' }
        });
      }

      return updatedOrder;
    });
  }

  // Cancel order with enhanced functionality
  async cancelOrder(tenantId: string, orderId: string, reason: string, cancelledBy: string): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
          where: { id: orderId, tenantId },
          include: { payments: true }
        });

        if (!order) {
          throw new AppError('Order not found', 404);
        }

      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        throw new AppError('Order is already completed or cancelled', 400);
      }

        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
          status: 'CANCELLED',
            notes: order.notes ? `${order.notes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`,
            updatedAt: new Date()
          }
        });

      // Update table status if table was assigned
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' }
        });
      }

        return updatedOrder;
      });
  }

  // Remove items from an existing order
  async removeItemsFromOrder(orderId: string, itemIds: string[], modifiedBy: string): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        throw new AppError('Cannot modify completed or cancelled order', 400);
      }

      // Get items to be removed
      const itemsToRemove = order.items.filter((item: any) => itemIds.includes(item.id));
      const removedItemsTotal = itemsToRemove.reduce((sum: number, item: any) => sum + Number(item.totalPrice), 0);

      // Remove items
      await tx.orderItem.deleteMany({
        where: { 
          orderId: orderId,
          id: { in: itemIds }
        }
      });

      // Calculate new totals
      const newTotalAmount = order.totalAmount - removedItemsTotal;
      const newRemainingAmount = newTotalAmount - order.paidAmount;

      // Create order modification record
      await tx.orderModification.create({
          data: {
          tenantId: order.tenantId,
          orderId: order.id,
          modificationType: 'REMOVE_ITEM',
          description: `Removed ${itemsToRemove.length} item(s)`,
          previousData: { totalAmount: order.totalAmount, remainingAmount: order.remainingAmount },
          newData: { totalAmount: newTotalAmount, remainingAmount: newRemainingAmount },
          amountChange: -removedItemsTotal,
          previousTotal: order.totalAmount,
          newTotal: newTotalAmount,
          modifiedBy
        }
      });

      // Update order totals
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
          data: {
          totalAmount: newTotalAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newRemainingAmount <= 0 ? 'PAID' : order.paidAmount > 0 ? 'PARTIAL' : 'PENDING',
          status: 'MODIFIED'
        }
      });

      return updatedOrder;
    });
  }

  // Update item quantities in an existing order
  async updateItemQuantities(orderId: string, itemUpdates: Array<{
    itemId: string;
    newQuantity: number;
  }>, modifiedBy: string): Promise<any> {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        throw new AppError('Cannot modify completed or cancelled order', 400);
      }

      let totalChange = 0;

      // Update each item quantity
      for (const update of itemUpdates) {
        const orderItem = order.items.find((item: any) => item.id === update.itemId);
        if (!orderItem) {
          throw new AppError(`Order item with ID ${update.itemId} not found`, 400);
        }

        const oldTotal = Number(orderItem.totalPrice);
        const newTotal = Number(orderItem.unitPrice) * update.newQuantity;
        const change = newTotal - oldTotal;
        totalChange += change;

        await tx.orderItem.update({
          where: { id: update.itemId },
          data: {
            quantity: update.newQuantity,
            totalPrice: newTotal
          }
        });
      }

      // Calculate new totals
      const newTotalAmount = order.totalAmount + totalChange;
      const newRemainingAmount = newTotalAmount - order.paidAmount;

      // Create order modification record
      await tx.orderModification.create({
        data: {
          tenantId: order.tenantId,
        orderId: order.id,
          modificationType: 'UPDATE_QUANTITY',
          description: `Updated quantities for ${itemUpdates.length} item(s)`,
          previousData: { totalAmount: order.totalAmount, remainingAmount: order.remainingAmount },
          newData: { totalAmount: newTotalAmount, remainingAmount: newRemainingAmount },
          amountChange: totalChange,
          previousTotal: order.totalAmount,
          newTotal: newTotalAmount,
          modifiedBy
        }
      });

      // Update order totals
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          totalAmount: newTotalAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newRemainingAmount <= 0 ? 'PAID' : order.paidAmount > 0 ? 'PARTIAL' : 'PENDING',
          status: 'MODIFIED'
        }
      });

      return updatedOrder;
    });
  }
} 
