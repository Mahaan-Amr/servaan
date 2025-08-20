import { PrismaClient, PaymentStatus, PaymentMethod, OrderStatus } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { generatePaymentNumber } from '../utils/orderUtils';

const prisma = new PrismaClient();

export interface ProcessPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  
  // For card payments
  cardInfo?: {
    terminalId: string;
    transactionRef?: string;
    cardMask?: string;
    cardType?: string;
  };
  
  // For cash payments
  cashReceived?: number;
  
  // For loyalty points
  pointsUsed?: number;
  
  // For mixed payments
  splitPayments?: Array<{
    method: PaymentMethod;
    amount: number;
    cardInfo?: {
      terminalId: string;
      transactionRef?: string;
    };
  }>;
  
  // Gateway information
  gatewayId?: string;
  transactionId?: string;
  referenceNumber?: string;
}

export interface RefundPaymentData {
  paymentId: string;
  refundAmount: number;
  reason: string;
  refundMethod?: PaymentMethod;
}

export interface PaymentFilterOptions {
  orderId?: string;
  paymentMethod?: PaymentMethod[];
  paymentStatus?: PaymentStatus[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface IranianGatewayConfig {
  mellat: {
    terminalId: string;
    username: string;
    password: string;
    apiUrl: string;
  };
  saman: {
    merchantId: string;
    terminalId: string;
    apiUrl: string;
  };
  parsian: {
    merchantId: string;
    terminalId: string;
    apiUrl: string;
  };
  zarinpal: {
    merchantId: string;
    apiUrl: string;
    sandbox: boolean;
  };
}

export class PaymentService {
  /**
   * Process a payment for an order
   */
  static async processPayment(
    tenantId: string,
    paymentData: ProcessPaymentData,
    processedBy: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get order details
        const order = await tx.order.findFirst({
          where: {
            id: paymentData.orderId,
            tenantId
          },
          include: {
            payments: {
              where: {
                paymentStatus: PaymentStatus.PAID
              }
            }
          }
        });

        if (!order) {
          throw new AppError('Order not found', 404);
        }

        // Validate order status
        if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
          throw new AppError('Cannot process payment for cancelled or refunded order', 400);
        }

        // Calculate remaining amount
        const totalPaidFromPayments = order.payments.reduce(
          (sum, payment) => sum + Number(payment.amount), 
          0
        );
        // Consider both payments table and order's paidAmount field
        const totalPaid = Math.max(totalPaidFromPayments, Number(order.paidAmount || 0));
        const remainingAmount = Number(order.totalAmount) - totalPaid;

        // Debug logging
        console.log('Payment Debug:', {
          orderId: paymentData.orderId,
          orderTotalAmount: order.totalAmount,
          totalPaidFromPayments,
          orderPaidAmount: order.paidAmount,
          totalPaid,
          remainingAmount,
          paymentAmount: paymentData.amount
        });

        // Validate payment amount
        if (paymentData.amount <= 0) {
          throw new AppError('Payment amount must be greater than zero', 400);
        }

        // Allow payment if it matches the remaining amount (full payment) or is less
        if (paymentData.amount > remainingAmount) {
          throw new AppError(
            `Payment amount (${paymentData.amount}) exceeds remaining balance (${remainingAmount})`,
            400
          );
        }

        let paymentResult;

        // Handle different payment methods
        if (paymentData.paymentMethod === PaymentMethod.MIXED && paymentData.splitPayments) {
          paymentResult = await this.processSplitPayment(
            tenantId,
            paymentData,
            processedBy,
            tx
          );
        } else {
          paymentResult = await this.processSinglePayment(
            tenantId,
            paymentData,
            processedBy,
            tx
          );
        }

        // Update order payment status
        const newTotalPaid = totalPaid + paymentData.amount;
        const orderTotalAmount = Number(order.totalAmount);

        let newPaymentStatus: PaymentStatus;
        if (newTotalPaid >= orderTotalAmount) {
          newPaymentStatus = PaymentStatus.PAID;
        } else if (newTotalPaid > 0) {
          newPaymentStatus = PaymentStatus.PARTIAL;
        } else {
          newPaymentStatus = PaymentStatus.PENDING;
        }

        // Calculate change for cash payments
        let changeAmount = 0;
        if (paymentData.paymentMethod === PaymentMethod.CASH && paymentData.cashReceived) {
          changeAmount = Math.max(0, paymentData.cashReceived - paymentData.amount);
        }

        // Update order
        const updatedOrder = await tx.order.update({
          where: { id: paymentData.orderId },
          data: {
            paymentStatus: newPaymentStatus,
            paymentMethod: paymentData.paymentMethod,
            paidAmount: newTotalPaid,
            changeAmount,
            updatedAt: new Date()
          }
        });

        return {
          payment: paymentResult,
          order: updatedOrder,
          remainingAmount: Math.max(0, orderTotalAmount - newTotalPaid),
          changeAmount
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process payment', 500, error);
    }
  }

  /**
   * Process single payment
   */
  private static async processSinglePayment(
    tenantId: string,
    paymentData: ProcessPaymentData,
    processedBy: string,
    tx: any
  ) {
    const paymentNumber = await generatePaymentNumber(tenantId, tx);
    
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let gatewayResult = null;

    // Process based on payment method
    switch (paymentData.paymentMethod) {
      case PaymentMethod.CASH:
        paymentStatus = PaymentStatus.PAID;
        break;
        
      case PaymentMethod.CARD:
        if (paymentData.cardInfo?.terminalId) {
          // Process with Iranian payment gateway
          gatewayResult = await this.processCardPayment(paymentData, tenantId);
          paymentStatus = gatewayResult.success ? PaymentStatus.PAID : PaymentStatus.FAILED;
        } else {
          throw new AppError('Terminal ID required for card payments', 400);
        }
        break;
        
      case PaymentMethod.ONLINE:
        if (paymentData.gatewayId) {
          gatewayResult = await this.processOnlinePayment(paymentData, tenantId);
          paymentStatus = gatewayResult.success ? PaymentStatus.PAID : PaymentStatus.PENDING;
        } else {
          throw new AppError('Gateway ID required for online payments', 400);
        }
        break;
        
      case PaymentMethod.POINTS:
        // Validate customer has enough points
        await this.validateLoyaltyPoints(paymentData.orderId, paymentData.pointsUsed || 0, tx);
        paymentStatus = PaymentStatus.PAID;
        break;
        
      default:
        throw new AppError('Invalid payment method', 400);
    }

    // Create payment record
    const payment = await tx.orderPayment.create({
      data: {
        tenantId,
        paymentNumber,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentStatus,
        gatewayId: paymentData.gatewayId || gatewayResult?.gatewayId,
        transactionId: paymentData.transactionId || gatewayResult?.transactionId,
        referenceNumber: paymentData.referenceNumber || gatewayResult?.referenceNumber,
        terminalId: paymentData.cardInfo?.terminalId,
        cardMask: paymentData.cardInfo?.cardMask || gatewayResult?.cardMask,
        cardType: paymentData.cardInfo?.cardType || gatewayResult?.cardType,
        processedBy,
        processedAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
        failureReason: gatewayResult?.error || null
      }
    });

    // Deduct loyalty points if used
    if (paymentData.paymentMethod === PaymentMethod.POINTS && paymentData.pointsUsed) {
      await this.deductLoyaltyPoints(paymentData.orderId, paymentData.pointsUsed, tx);
    }

    return payment;
  }

  /**
   * Process split payment (multiple payment methods)
   */
  private static async processSplitPayment(
    tenantId: string,
    paymentData: ProcessPaymentData,
    processedBy: string,
    tx: any
  ) {
    if (!paymentData.splitPayments || paymentData.splitPayments.length === 0) {
      throw new AppError('Split payments data required', 400);
    }

    // Validate total amount matches
    const totalSplitAmount = paymentData.splitPayments.reduce(
      (sum, split) => sum + split.amount, 
      0
    );

    if (Math.abs(totalSplitAmount - paymentData.amount) > 0.01) {
      throw new AppError('Split payment amounts do not match total payment amount', 400);
    }

    const paymentNumber = await generatePaymentNumber(tenantId, tx);
    const subPayments = [];

    // Process each split payment
    for (const split of paymentData.splitPayments) {
      let splitStatus: PaymentStatus = PaymentStatus.PENDING;
      let gatewayResult = null;

      switch (split.method) {
        case PaymentMethod.CASH:
          splitStatus = PaymentStatus.PAID;
          break;
          
        case PaymentMethod.CARD:
          if (split.cardInfo?.terminalId) {
            gatewayResult = await this.processCardPayment({
              ...paymentData,
              amount: split.amount,
              cardInfo: split.cardInfo
            }, tenantId);
            splitStatus = gatewayResult.success ? PaymentStatus.PAID : PaymentStatus.FAILED;
          }
          break;
          
        default:
          splitStatus = PaymentStatus.PAID; // Assume success for other methods
      }

      subPayments.push({
        method: split.method,
        amount: split.amount,
        status: splitStatus,
        gatewayResult
      });
    }

    // Check if all split payments succeeded
    const allSucceeded = subPayments.every(sp => sp.status === PaymentStatus.PAID);
    const finalStatus = allSucceeded ? PaymentStatus.PAID : PaymentStatus.FAILED;

    // Create main payment record
    const payment = await tx.orderPayment.create({
      data: {
        tenantId,
        paymentNumber,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        paymentMethod: PaymentMethod.MIXED,
        paymentStatus: finalStatus,
        processedBy,
        processedAt: finalStatus === PaymentStatus.PAID ? new Date() : null,
        // Store split payment details in notes or separate table
        failureReason: allSucceeded ? null : 'One or more split payments failed'
      }
    });

    return payment;
  }

  /**
   * Process card payment with Iranian gateways
   */
  private static async processCardPayment(
    paymentData: ProcessPaymentData,
    tenantId: string
  ): Promise<any> {
    try {
      // This would integrate with actual Iranian payment gateways
      // For now, return mock success (implement actual gateway integration)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock gateway response
      return {
        success: true,
        gatewayId: 'SAMAN',
        transactionId: `TXN_${Date.now()}`,
        referenceNumber: `REF_${Date.now()}`,
        cardMask: paymentData.cardInfo?.cardMask || '****1234',
        cardType: paymentData.cardInfo?.cardType || 'VISA'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gateway connection failed'
      };
    }
  }

  /**
   * Process online payment
   */
  private static async processOnlinePayment(
    paymentData: ProcessPaymentData,
    tenantId: string
  ): Promise<any> {
    try {
      // Implement actual online payment gateway integration
      // (ZarinPal, Parsian, etc.)
      
      return {
        success: true,
        gatewayId: paymentData.gatewayId,
        transactionId: `ONL_${Date.now()}`,
        referenceNumber: `REF_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Online payment failed'
      };
    }
  }

  /**
   * Get payments with filtering
   */
  static async getPayments(
    tenantId: string,
    options: PaymentFilterOptions & {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'paymentDate',
        sortOrder = 'desc',
        ...filters
      } = options;

      const skip = (page - 1) * limit;
      const where: any = { tenantId };

      // Apply filters
      if (filters.orderId) {
        where.orderId = filters.orderId;
      }

      if (filters.paymentMethod && filters.paymentMethod.length > 0) {
        where.paymentMethod = { in: filters.paymentMethod };
      }

      if (filters.paymentStatus && filters.paymentStatus.length > 0) {
        where.paymentStatus = { in: filters.paymentStatus };
      }

      if (filters.startDate || filters.endDate) {
        where.paymentDate = {};
        if (filters.startDate) {
          where.paymentDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.paymentDate.lte = filters.endDate;
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
          where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = filters.maxAmount;
        }
      }

      if (filters.search) {
        where.OR = [
          { paymentNumber: { contains: filters.search, mode: 'insensitive' } },
          { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
          { transactionId: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.orderPayment.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                totalAmount: true,
                status: true
              }
            },
            processedByUser: {
              select: {
                id: true,
                name: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.orderPayment.count({ where })
      ]);

      // Get summary statistics
      const summary = await this.getPaymentsSummary(tenantId, filters);

      return {
        payments,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit
        },
        summary
      };
    } catch (error) {
      throw new AppError('Failed to get payments', 500, error);
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    tenantId: string,
    refundData: RefundPaymentData,
    processedBy: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get original payment
        const originalPayment = await tx.orderPayment.findFirst({
          where: {
            id: refundData.paymentId,
            tenantId
          },
          include: {
            order: true
          }
        });

        if (!originalPayment) {
          throw new AppError('Payment not found', 404);
        }

        if (originalPayment.paymentStatus !== PaymentStatus.PAID) {
          throw new AppError('Can only refund paid payments', 400);
        }

        // Validate refund amount
        if (refundData.refundAmount <= 0 || refundData.refundAmount > Number(originalPayment.amount)) {
          throw new AppError('Invalid refund amount', 400);
        }

        // Create refund payment record
        const refundPaymentNumber = await generatePaymentNumber(tenantId, tx);
        
        const refundPayment = await tx.orderPayment.create({
          data: {
            tenantId,
            paymentNumber: refundPaymentNumber,
            orderId: originalPayment.orderId,
            amount: -refundData.refundAmount,
            paymentMethod: refundData.refundMethod || originalPayment.paymentMethod,
            paymentStatus: PaymentStatus.REFUNDED,
            processedBy,
            processedAt: new Date(),
            failureReason: `Refund: ${refundData.reason}`
          }
        });

        // Update original payment status if fully refunded
        if (refundData.refundAmount === Number(originalPayment.amount)) {
          await tx.orderPayment.update({
            where: { id: refundData.paymentId },
            data: { paymentStatus: PaymentStatus.REFUNDED }
          });
        }

        // Update order payment status
        const allPayments = await tx.orderPayment.findMany({
          where: { orderId: originalPayment.orderId }
        });

        const netAmount = allPayments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        );

        let newOrderPaymentStatus: PaymentStatus;
        if (netAmount <= 0) {
          newOrderPaymentStatus = PaymentStatus.REFUNDED;
        } else if (netAmount < Number(originalPayment.order.totalAmount)) {
          newOrderPaymentStatus = PaymentStatus.PARTIAL;
        } else {
          newOrderPaymentStatus = PaymentStatus.PAID;
        }

        await tx.order.update({
          where: { id: originalPayment.orderId },
          data: {
            paymentStatus: newOrderPaymentStatus,
            paidAmount: netAmount
          }
        });

        return refundPayment;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process refund', 500, error);
    }
  }

  /**
   * Get daily sales summary
   */
  static async getDailySalesSummary(tenantId: string, date?: Date) {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [
        totalSales,
        totalTransactions,
        cashSales,
        cardSales,
        onlineSales,
        refunds
      ] = await Promise.all([
        prisma.orderPayment.aggregate({
          where: {
            tenantId,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfDay, lte: endOfDay },
            amount: { gt: 0 }
          },
          _sum: { amount: true }
        }),
        prisma.orderPayment.count({
          where: {
            tenantId,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfDay, lte: endOfDay },
            amount: { gt: 0 }
          }
        }),
        prisma.orderPayment.aggregate({
          where: {
            tenantId,
            paymentMethod: PaymentMethod.CASH,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfDay, lte: endOfDay },
            amount: { gt: 0 }
          },
          _sum: { amount: true }
        }),
        prisma.orderPayment.aggregate({
          where: {
            tenantId,
            paymentMethod: PaymentMethod.CARD,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfDay, lte: endOfDay },
            amount: { gt: 0 }
          },
          _sum: { amount: true }
        }),
        prisma.orderPayment.aggregate({
          where: {
            tenantId,
            paymentMethod: PaymentMethod.ONLINE,
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfDay, lte: endOfDay },
            amount: { gt: 0 }
          },
          _sum: { amount: true }
        }),
        prisma.orderPayment.aggregate({
          where: {
            tenantId,
            paymentStatus: PaymentStatus.REFUNDED,
            paymentDate: { gte: startOfDay, lte: endOfDay },
            amount: { lt: 0 }
          },
          _sum: { amount: true }
        })
      ]);

      return {
        date: targetDate.toISOString().split('T')[0],
        totalSales: Number(totalSales._sum.amount || 0),
        totalTransactions,
        paymentBreakdown: {
          cash: Number(cashSales._sum.amount || 0),
          card: Number(cardSales._sum.amount || 0),
          online: Number(onlineSales._sum.amount || 0)
        },
        refundsAmount: Math.abs(Number(refunds._sum.amount || 0)),
        averageTransaction: totalTransactions > 0 
          ? Number(totalSales._sum.amount || 0) / totalTransactions 
          : 0
      };
    } catch (error) {
      throw new AppError('Failed to get daily sales summary', 500, error);
    }
  }

  /**
   * Private helper methods
   */
  private static async validateLoyaltyPoints(
    orderId: string,
    pointsToUse: number,
    tx: any
  ) {
    // Get customer from order
    const order = await tx.order.findFirst({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order?.customer) {
      throw new AppError('Customer not found for loyalty points validation', 400);
    }

    // Check if customer has enough points (implement based on your loyalty system)
    // This is a placeholder - implement actual loyalty points checking
    const customerPoints = 1000; // Get from loyalty system
    
    if (pointsToUse > customerPoints) {
      throw new AppError('Insufficient loyalty points', 400);
    }
  }

  private static async deductLoyaltyPoints(
    orderId: string,
    pointsUsed: number,
    tx: any
  ) {
    // Implement loyalty points deduction
    // This would integrate with your existing loyalty system
    console.log(`Deducting ${pointsUsed} loyalty points for order ${orderId}`);
  }

  private static async getPaymentsSummary(
    tenantId: string,
    filters: PaymentFilterOptions
  ) {
    const where: any = { 
      tenantId,
      paymentStatus: PaymentStatus.PAID,
      amount: { gt: 0 }
    };

    // Apply same filters as main query
    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    const [totalAmount, transactionCount, avgTransaction] = await Promise.all([
      prisma.orderPayment.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.orderPayment.count({ where }),
      prisma.orderPayment.aggregate({
        where,
        _avg: { amount: true }
      })
    ]);

    return {
      totalAmount: Number(totalAmount._sum.amount || 0),
      transactionCount,
      averageTransaction: Number(avgTransaction._avg.amount || 0)
    };
  }
} 