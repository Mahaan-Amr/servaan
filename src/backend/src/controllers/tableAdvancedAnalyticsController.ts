import { Request, Response, NextFunction } from 'express';
import { TableAdvancedAnalyticsService, DateRange } from '../services/tableAdvancedAnalyticsService';
import { AppError } from '../utils/AppError';

export class TableAdvancedAnalyticsController {
  // ===================== DETAILED PERFORMANCE REPORTS =====================

  /**
   * Get detailed table performance reports
   * GET /api/tables/advanced-analytics/performance
   */
  static async getDetailedTablePerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const performanceData = await TableAdvancedAnalyticsService.getDetailedTablePerformance(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          performanceData
        },
        message: 'Detailed table performance reports retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance forecasts for tables
   * GET /api/tables/advanced-analytics/forecasts
   */
  static async getPerformanceForecasts(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const forecasts = await TableAdvancedAnalyticsService.getPerformanceForecasts(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          forecasts
        },
        message: 'Performance forecasts retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== RESERVATION ANALYTICS =====================

  /**
   * Get comprehensive reservation analytics
   * GET /api/tables/advanced-analytics/reservations
   */
  static async getReservationAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const analytics = await TableAdvancedAnalyticsService.getReservationAnalytics(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          analytics
        },
        message: 'Reservation analytics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reservation insights and optimization opportunities
   * GET /api/tables/advanced-analytics/reservation-insights
   */
  static async getReservationInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const insights = await TableAdvancedAnalyticsService.getReservationInsights(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          insights
        },
        message: 'Reservation insights retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== CUSTOMER BEHAVIOR INSIGHTS =====================

  /**
   * Get customer behavior insights for tables
   * GET /api/tables/advanced-analytics/customer-behavior
   */
  static async getCustomerBehaviorInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const insights = await TableAdvancedAnalyticsService.getCustomerBehaviorInsights(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          insights
        },
        message: 'Customer behavior insights retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== CAPACITY OPTIMIZATION =====================

  /**
   * Get advanced capacity optimization data
   * GET /api/tables/advanced-analytics/capacity-optimization
   */
  static async getAdvancedCapacityOptimization(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const optimizationData = await TableAdvancedAnalyticsService.getAdvancedCapacityOptimization(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          optimizationData
        },
        message: 'Advanced capacity optimization data retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff allocation recommendations
   * GET /api/tables/advanced-analytics/staff-allocation
   */
  static async getStaffAllocationRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      const recommendations = await TableAdvancedAnalyticsService.getStaffAllocationRecommendations(tenantId, period);

      res.json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          recommendations
        },
        message: 'Staff allocation recommendations retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== COMPREHENSIVE ANALYTICS SUMMARY =====================

  /**
   * Get comprehensive advanced analytics summary
   * GET /api/tables/advanced-analytics/summary
   */
  static async getAdvancedAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Parse date range from query parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const period: DateRange = { start: startDate, end: endDate };

      // Get all advanced analytics data
      const [
        performanceData,
        forecasts,
        reservationAnalytics,
        reservationInsights,
        customerBehavior,
        capacityOptimization,
        staffAllocation
      ] = await Promise.all([
        TableAdvancedAnalyticsService.getDetailedTablePerformance(tenantId, period),
        TableAdvancedAnalyticsService.getPerformanceForecasts(tenantId, period),
        TableAdvancedAnalyticsService.getReservationAnalytics(tenantId, period),
        TableAdvancedAnalyticsService.getReservationInsights(tenantId, period),
        TableAdvancedAnalyticsService.getCustomerBehaviorInsights(tenantId, period),
        TableAdvancedAnalyticsService.getAdvancedCapacityOptimization(tenantId, period),
        TableAdvancedAnalyticsService.getStaffAllocationRecommendations(tenantId, period)
      ]);

      // Calculate summary metrics
      const totalTables = performanceData.length;
      const averagePerformanceScore = performanceData.reduce((sum, table) => sum + table.performanceScore, 0) / totalTables;
      const topPerformingTables = performanceData.slice(0, 5);
      const underperformingTables = performanceData.filter(table => table.performanceScore < 50).slice(0, 5);

      const summary = {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        overview: {
          totalTables,
          averagePerformanceScore,
          totalReservations: reservationAnalytics.totalReservations,
          conversionRate: reservationAnalytics.conversionRate,
          noShowRate: reservationAnalytics.noShowRate
        },
        performance: {
          topPerformingTables,
          underperformingTables,
          forecasts
        },
        reservations: {
          analytics: reservationAnalytics,
          insights: reservationInsights
        },
        customerBehavior,
        optimization: {
          capacity: capacityOptimization,
          staff: staffAllocation
        },
        recommendations: this.generateComprehensiveRecommendations(
          performanceData,
          reservationAnalytics,
          customerBehavior,
          capacityOptimization
        )
      };

      res.json({
        success: true,
        data: summary,
        message: 'Advanced analytics summary retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== PRIVATE HELPER METHODS =====================

  private static generateComprehensiveRecommendations(
    performanceData: any[],
    reservationAnalytics: any,
    customerBehavior: any,
    capacityOptimization: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Performance-based recommendations
    const lowPerformingTables = performanceData.filter(table => table.performanceScore < 50);
    if (lowPerformingTables.length > 0) {
      recommendations.push(`Focus on improving ${lowPerformingTables.length} underperforming tables`);
    }

    // Reservation-based recommendations
    if (reservationAnalytics.noShowRate > 20) {
      recommendations.push('Implement reservation confirmation system to reduce no-shows');
    }

    if (reservationAnalytics.conversionRate < 80) {
      recommendations.push('Improve reservation-to-order conversion rate');
    }

    // Capacity-based recommendations
    const sectionsNeedingOptimization = capacityOptimization.filter(section => section.efficiencyScore < 70);
    if (sectionsNeedingOptimization.length > 0) {
      recommendations.push(`Optimize capacity in ${sectionsNeedingOptimization.length} sections`);
    }

    // Customer behavior recommendations
    if (customerBehavior.tablePreferences.length > 0) {
      recommendations.push('Consider customer preferences in table assignments');
    }

    return recommendations;
  }
} 