import { Request, Response, NextFunction } from 'express';
import { TableAnalyticsService, DateRange } from '../services/tableAnalyticsService';
import { AppError } from '../utils/AppError';

export class TableAnalyticsController {
  /**
   * Get table utilization analytics
   * GET /api/tables/analytics/utilization
   */
  static async getTableUtilization(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const utilizationMetrics = await TableAnalyticsService.getTableUtilization(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          utilizationMetrics
        },
        message: 'Table utilization analytics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get peak hours analysis
   * GET /api/tables/analytics/peak-hours
   */
  static async getPeakHoursAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const peakHours = await TableAnalyticsService.getPeakHoursAnalysis(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          peakHours
        },
        message: 'Peak hours analysis retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table revenue analysis
   * GET /api/tables/analytics/revenue
   */
  static async getTableRevenueAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const revenueData = await TableAnalyticsService.getTableRevenueAnalysis(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          revenueData
        },
        message: 'Table revenue analysis retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get capacity optimization analysis
   * GET /api/tables/analytics/capacity-optimization
   */
  static async getCapacityOptimization(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const capacityOptimization = await TableAnalyticsService.getCapacityOptimization(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          capacityOptimization
        },
        message: 'Capacity optimization analysis retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comprehensive table analytics summary
   * GET /api/tables/analytics/summary
   */
  static async getTableAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const summary = await TableAnalyticsService.getTableAnalyticsSummary(tenantId, period);

      res.json({
        success: true,
        data: summary,
        message: 'Table analytics summary retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table performance metrics
   * GET /api/tables/analytics/performance
   */
  static async getTablePerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      // Get all analytics data for performance calculation
      const [utilizationMetrics, revenueData, peakHours] = await Promise.all([
        TableAnalyticsService.getTableUtilization(tenantId, period),
        TableAnalyticsService.getTableRevenueAnalysis(tenantId, period),
        TableAnalyticsService.getPeakHoursAnalysis(tenantId, period)
      ]);

      // Calculate performance scores for each table
      const performanceData = utilizationMetrics.map(utilization => {
        const revenue = revenueData.find(r => r.tableId === utilization.tableId);
        const performanceScore = this.calculatePerformanceScore(utilization, revenue, peakHours);
        
        return {
          tableId: utilization.tableId,
          tableNumber: utilization.tableNumber,
          tableName: utilization.tableName,
          section: utilization.section,
          performanceScore,
          utilizationRate: utilization.utilizationRate,
          revenuePerHour: revenue?.revenuePerHour || 0,
          customerSatisfaction: this.estimateCustomerSatisfaction(utilization, revenue),
          averageOrderValue: utilization.averageOrderValue,
          orderFrequency: utilization.orderCount / (period.end.getTime() - period.start.getTime()) * (1000 * 60 * 60 * 24), // Orders per day
          peakHours: this.getTablePeakHours(utilization.tableId, peakHours),
          issues: this.identifyTableIssues(utilization, revenue),
          recommendations: this.generateTableRecommendations(utilization, revenue)
        };
      });

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          performanceData: performanceData.sort((a, b) => b.performanceScore - a.performanceScore)
        },
        message: 'Table performance metrics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // =================== PRIVATE HELPER METHODS ===================

  private static calculatePerformanceScore(
    utilization: any,
    revenue: any,
    peakHours: any[]
  ): number {
    let score = 0;

    // Utilization score (40% weight)
    score += Math.min(utilization.utilizationRate / 80, 1) * 40;

    // Revenue efficiency score (30% weight)
    if (revenue) {
      const revenueEfficiency = Math.min(revenue.revenuePerHour / 100000, 1); // Assuming 100k per hour is excellent
      score += revenueEfficiency * 30;
    }

    // Order frequency score (20% weight)
    const orderFrequency = utilization.orderCount / 30; // Orders per day
    const frequencyScore = Math.min(orderFrequency / 10, 1); // Assuming 10 orders per day is excellent
    score += frequencyScore * 20;

    // Average order value score (10% weight)
    const orderValueScore = Math.min(utilization.averageOrderValue / 500000, 1); // Assuming 500k average is excellent
    score += orderValueScore * 10;

    return Math.round(score);
  }

  private static estimateCustomerSatisfaction(utilization: any, revenue: any): number {
    let satisfaction = 70; // Base satisfaction

    // Higher utilization suggests better customer flow
    if (utilization.utilizationRate > 70) satisfaction += 10;
    if (utilization.utilizationRate > 85) satisfaction += 10;

    // Higher average order value suggests customer satisfaction
    if (utilization.averageOrderValue > 300000) satisfaction += 10;
    if (utilization.averageOrderValue > 500000) satisfaction += 10;

    // Higher revenue per hour suggests efficiency
    if (revenue && revenue.revenuePerHour > 50000) satisfaction += 10;

    return Math.min(100, satisfaction);
  }

  private static getTablePeakHours(tableId: string, peakHours: any[]): number[] {
    // Return hours with utilization > 80%
    return peakHours
      .filter(hour => hour.utilizationRate > 80)
      .map(hour => hour.hour);
  }

  private static identifyTableIssues(utilization: any, revenue: any): string[] {
    const issues: string[] = [];

    if (utilization.utilizationRate < 50) {
      issues.push('نرخ استفاده پایین');
    }

    if (utilization.utilizationRate > 95) {
      issues.push('استفاده بیش از حد');
    }

    if (utilization.averageOrderValue < 100000) {
      issues.push('مقدار سفارش متوسط پایین');
    }

    if (revenue && revenue.revenuePerHour < 20000) {
      issues.push('درآمد ساعتی پایین');
    }

    if (utilization.orderCount === 0) {
      issues.push('بدون سفارش');
    }

    return issues;
  }

  private static generateTableRecommendations(utilization: any, revenue: any): string[] {
    const recommendations: string[] = [];

    if (utilization.utilizationRate < 50) {
      recommendations.push('بهبود بازاریابی و تبلیغات');
      recommendations.push('بررسی موقعیت میز');
    }

    if (utilization.utilizationRate > 95) {
      recommendations.push('افزایش ظرفیت');
      recommendations.push('بهینه‌سازی زمان‌بندی');
    }

    if (utilization.averageOrderValue < 100000) {
      recommendations.push('بهبود منو و قیمت‌گذاری');
      recommendations.push('آموزش کارکنان برای فروش بیشتر');
    }

    if (revenue && revenue.revenuePerHour < 20000) {
      recommendations.push('بهبود کارایی عملیاتی');
      recommendations.push('کاهش زمان انتظار');
    }

    if (utilization.orderCount === 0) {
      recommendations.push('بررسی علت عدم استفاده');
      recommendations.push('تغییر موقعیت یا حذف میز');
    }

    return recommendations;
  }
} 
