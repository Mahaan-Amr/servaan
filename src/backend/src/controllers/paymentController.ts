import { Request, Response, NextFunction } from 'express';
import { PaymentService, ProcessPaymentData, RefundPaymentData, PaymentFilterOptions } from '../services/paymentService';
import { AppError } from '../utils/AppError';
import { PaymentMethod, PaymentStatus } from '../../../shared/generated/client';

export class PaymentController {
  /**
   * Process payment for an order
   * POST /api/payments/process
   */
  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const processedBy = req.user?.id;

      if (!tenantId || !processedBy) {
        throw new AppError('Authentication required', 401);
      }

      const { orderId, amount, paymentMethod } = req.body;

      if (!orderId || !amount || !paymentMethod) {
        throw new AppError('Order ID, amount, and payment method are required', 400);
      }

      if (amount <= 0) {
        throw new AppError('Payment amount must be greater than zero', 400);
      }

      if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        throw new AppError('Invalid payment method', 400);
      }

      // Validate payment method specific requirements
      if (paymentMethod === PaymentMethod.CARD && !req.body.cardInfo?.terminalId) {
        throw new AppError('Terminal ID is required for card payments', 400);
      }

      if (paymentMethod === PaymentMethod.CASH && req.body.cashReceived && req.body.cashReceived < amount) {
        throw new AppError('Cash received cannot be less than payment amount', 400);
      }

      if (paymentMethod === PaymentMethod.MIXED && (!req.body.splitPayments || req.body.splitPayments.length === 0)) {
        throw new AppError('Split payments data is required for mixed payments', 400);
      }

      const paymentData: ProcessPaymentData = {
        orderId,
        amount: parseFloat(amount),
        paymentMethod,
        cardInfo: req.body.cardInfo,
        cashReceived: req.body.cashReceived ? parseFloat(req.body.cashReceived) : undefined,
        pointsUsed: req.body.pointsUsed ? parseInt(req.body.pointsUsed) : undefined,
        splitPayments: req.body.splitPayments,
        gatewayId: req.body.gatewayId,
        transactionId: req.body.transactionId,
        referenceNumber: req.body.referenceNumber
      };

      const result = await PaymentService.processPayment(tenantId, paymentData, processedBy);

      res.json({
        success: true,
        data: result,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments with filtering and pagination
   * GET /api/payments
   */
  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as string) || 'paymentDate';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      // Build filter options
      const filters: PaymentFilterOptions = {};

      if (req.query.orderId) {
        filters.orderId = req.query.orderId as string;
      }

      if (req.query.paymentMethod) {
        const methodArray = Array.isArray(req.query.paymentMethod)
          ? req.query.paymentMethod as PaymentMethod[]
          : [req.query.paymentMethod as PaymentMethod];
        filters.paymentMethod = methodArray.filter(method => Object.values(PaymentMethod).includes(method));
      }

      if (req.query.paymentStatus) {
        const statusArray = Array.isArray(req.query.paymentStatus)
          ? req.query.paymentStatus as PaymentStatus[]
          : [req.query.paymentStatus as PaymentStatus];
        filters.paymentStatus = statusArray.filter(status => Object.values(PaymentStatus).includes(status));
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.minAmount) {
        filters.minAmount = parseFloat(req.query.minAmount as string);
      }

      if (req.query.maxAmount) {
        filters.maxAmount = parseFloat(req.query.maxAmount as string);
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const result = await PaymentService.getPayments(tenantId, {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
        summary: result.summary,
        message: 'Payments retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process refund
   * POST /api/payments/refund
   */
  static async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const processedBy = req.user?.id;

      if (!tenantId || !processedBy) {
        throw new AppError('Authentication required', 401);
      }

      const { paymentId, refundAmount, reason } = req.body;

      if (!paymentId || !refundAmount || !reason) {
        throw new AppError('Payment ID, refund amount, and reason are required', 400);
      }

      if (refundAmount <= 0) {
        throw new AppError('Refund amount must be greater than zero', 400);
      }

      const refundData: RefundPaymentData = {
        paymentId,
        refundAmount: parseFloat(refundAmount),
        reason,
        refundMethod: req.body.refundMethod
      };

      const refundPayment = await PaymentService.processRefund(tenantId, refundData, processedBy);

      res.json({
        success: true,
        data: refundPayment,
        message: 'Refund processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get daily sales summary
   * GET /api/payments/daily-summary
   */
  static async getDailySalesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      const summary = await PaymentService.getDailySalesSummary(tenantId, date);

      res.json({
        success: true,
        data: summary,
        message: 'Daily sales summary retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment methods breakdown
   * GET /api/payments/methods-breakdown
   */
  static async getPaymentMethodsBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const result = await PaymentService.getPayments(tenantId, {
        startDate,
        endDate,
        paymentStatus: [PaymentStatus.PAID],
        page: 1,
        limit: 10000
      });

      // Calculate breakdown by payment method
      const methodBreakdown = result.payments.reduce((acc: any, payment: any) => {
        const method = payment.paymentMethod;
        if (!acc[method]) {
          acc[method] = {
            method,
            count: 0,
            totalAmount: 0,
            percentage: 0
          };
        }
        acc[method].count += 1;
        acc[method].totalAmount += Number(payment.amount);
        return acc;
      }, {});

      // Calculate percentages
      const totalAmount = Object.values(methodBreakdown).reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
      Object.values(methodBreakdown).forEach((item: any) => {
        item.percentage = totalAmount > 0 ? ((item.totalAmount || 0) / totalAmount) * 100 : 0;
      });

      res.json({
        success: true,
        data: {
          breakdown: Object.values(methodBreakdown),
          totalAmount,
          totalTransactions: result.payments.length,
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        },
        message: 'Payment methods breakdown retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment statistics
   * GET /api/payments/statistics
   */
  static async getPaymentStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const [allPayments, refunds, todaySummary] = await Promise.all([
        PaymentService.getPayments(tenantId, {
          startDate,
          endDate,
          page: 1,
          limit: 10000
        }),
        PaymentService.getPayments(tenantId, {
          startDate,
          endDate,
          paymentStatus: [PaymentStatus.REFUNDED],
          page: 1,
          limit: 1000
        }),
        PaymentService.getDailySalesSummary(tenantId, new Date())
      ]);

      // Calculate hourly breakdown
      const hourlyBreakdown = allPayments.payments
        .filter((payment: any) => payment.paymentStatus === PaymentStatus.PAID)
        .reduce((acc: Record<number, { count: number; amount: number }>, payment: any) => {
          const hour = new Date(payment.paymentDate).getHours();
          if (!acc[hour]) {
            acc[hour] = { count: 0, amount: 0 };
          }
          acc[hour].count += 1;
          acc[hour].amount += Number(payment.amount);
          return acc;
        }, {});

      // Calculate status breakdown
      const statusBreakdown = allPayments.payments.reduce((acc: Record<string, number>, payment) => {
        acc[payment.paymentStatus] = (acc[payment.paymentStatus] || 0) + 1;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          summary: allPayments.summary,
          todaySummary,
          refundsTotal: refunds.summary.totalAmount,
          refundsCount: refunds.summary.transactionCount,
          statusBreakdown,
          hourlyBreakdown,
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        },
        message: 'Payment statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending payments
   * GET /api/payments/pending
   */
  static async getPendingPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await PaymentService.getPayments(tenantId, {
        paymentStatus: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
        sortBy: 'paymentDate',
        sortOrder: 'desc',
        page: 1,
        limit: 100
      });

      res.json({
        success: true,
        data: result.payments,
        message: 'Pending payments retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get failed payments
   * GET /api/payments/failed
   */
  static async getFailedPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await PaymentService.getPayments(tenantId, {
        paymentStatus: [PaymentStatus.FAILED],
        sortBy: 'paymentDate',
        sortOrder: 'desc',
        page: 1,
        limit: 100
      });

      res.json({
        success: true,
        data: result.payments,
        message: 'Failed payments retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry failed payment
   * POST /api/payments/:id/retry
   */
  static async retryPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const processedBy = req.user?.id;
      const paymentId = req.params.id;

      if (!tenantId || !processedBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!paymentId) {
        throw new AppError('Payment ID is required', 400);
      }

      // This would implement retry logic for failed payments
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'Payment retry functionality not yet implemented'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cash management report
   * GET /api/payments/cash-management
   */
  static async getCashManagementReport(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      // Get cash payments for the day
      const result = await PaymentService.getPayments(tenantId, {
        paymentMethod: [PaymentMethod.CASH],
        paymentStatus: [PaymentStatus.PAID],
        startDate: new Date(date.setHours(0, 0, 0, 0)),
        endDate: new Date(date.setHours(23, 59, 59, 999)),
        page: 1,
        limit: 1000
      });

      // Calculate cash summary
      const cashIn = result.payments
        .filter(p => Number(p.amount) > 0)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const cashOut = result.payments
        .filter(p => Number(p.amount) < 0)
        .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0);

      const netCash = cashIn - cashOut;

      res.json({
        success: true,
        data: {
          date: date.toISOString().split('T')[0],
          cashIn,
          cashOut,
          netCash,
          transactionCount: result.payments.length,
          transactions: result.payments,
          openingBalance: 0, // This would come from cash management system
          closingBalance: netCash // This would be calculated with opening balance
        },
        message: 'Cash management report retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate payment before processing (pre-validation)
   * POST /api/payments/validate
   */
  static async validatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { orderId, amount, paymentMethod } = req.body;

      if (!orderId || !amount || !paymentMethod) {
        throw new AppError('Order ID, amount, and payment method are required', 400);
      }

      // Basic validation logic (this could be expanded)
      const validationResult = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[]
      };

      if (amount <= 0) {
        validationResult.valid = false;
        validationResult.errors.push('Payment amount must be greater than zero');
      }

      if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        validationResult.valid = false;
        validationResult.errors.push('Invalid payment method');
      }

      if (paymentMethod === PaymentMethod.CARD && !req.body.cardInfo?.terminalId) {
        validationResult.valid = false;
        validationResult.errors.push('Terminal ID is required for card payments');
      }

      // Add more validation logic as needed

      res.json({
        success: true,
        data: validationResult,
        message: 'Payment validation completed'
      });
    } catch (error) {
      next(error);
    }
  }
} 