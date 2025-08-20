import { PrismaClient, TableStatus } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface DateRange {
  start: Date;
  end: Date;
}

// ===================== DETAILED PERFORMANCE REPORTS =====================

export interface DetailedTablePerformance {
  tableId: string;
  tableNumber: string;
  tableName?: string;
  section?: string;
  performanceScore: number;
  utilizationRate: number;
  revenuePerHour: number;
  revenuePerSeat: number;
  customerSatisfaction: number;
  averageOrderValue: number;
  orderFrequency: number;
  peakHours: number[];
  issues: string[];
  recommendations: string[];
  historicalTrend: {
    period: string;
    performanceScore: number;
    utilizationRate: number;
    revenue: number;
  }[];
  comparisonMetrics: {
    sectionAverage: number;
    overallAverage: number;
    rankInSection: number;
    rankOverall: number;
  };
}

export interface PerformanceForecast {
  tableId: string;
  tableNumber: string;
  predictedUtilization: number;
  predictedRevenue: number;
  confidenceLevel: number;
  factors: string[];
  recommendations: string[];
}

// ===================== RESERVATION ANALYTICS =====================

export interface ReservationAnalytics {
  totalReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  completedReservations: number;
  conversionRate: number;
  noShowRate: number;
  averageGuestCount: number;
  averageDuration: number;
  peakReservationTimes: {
    hour: number;
    dayOfWeek: number;
    reservationCount: number;
    utilizationRate: number;
  }[];
  reservationPatterns: {
    dayOfWeek: number;
    averageReservations: number;
    peakHours: number[];
  }[];
  customerPreferences: {
    preferredTables: string[];
    preferredTimes: string[];
    averagePartySize: number;
    repeatCustomerRate: number;
  };
}

export interface ReservationInsights {
  highDemandPeriods: {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    demandLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendedCapacity: number;
  }[];
  optimizationOpportunities: {
    type: 'CAPACITY' | 'TIMING' | 'PRICING' | 'MARKETING';
    description: string;
    potentialImpact: number;
    implementationCost: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

// ===================== CUSTOMER BEHAVIOR INSIGHTS =====================

export interface CustomerBehaviorInsights {
  tablePreferences: {
    tableId: string;
    tableNumber: string;
    customerCount: number;
    averageRating: number;
    preferredBySegments: string[];
  }[];
  seatingPatterns: {
    section: string;
    preferredBySegment: string;
    averagePartySize: number;
    peakUsageTimes: string[];
  }[];
  customerSatisfaction: {
    tableId: string;
    tableNumber: string;
    averageRating: number;
    reviewCount: number;
    commonComplaints: string[];
    positiveFeedback: string[];
  }[];
  repeatCustomerAnalysis: {
    customerId: string;
    customerName: string;
    preferredTables: string[];
    visitFrequency: number;
    averageSpending: number;
    loyaltyLevel: string;
  }[];
}

// ===================== CAPACITY OPTIMIZATION =====================

export interface CapacityOptimizationData {
  section: string;
  currentCapacity: number;
  averageUtilization: number;
  peakUtilization: number;
  recommendedCapacity: number;
  efficiencyScore: number;
  bottlenecks: string[];
  recommendations: string[];
  seasonalAdjustments: {
    season: string;
    recommendedCapacity: number;
    reasoning: string;
  }[];
  revenueOptimization: {
    currentRevenue: number;
    projectedRevenue: number;
    revenueIncrease: number;
    implementationCost: number;
    roi: number;
  };
}

export interface StaffAllocationRecommendation {
  section: string;
  recommendedStaffCount: number;
  currentStaffCount: number;
  peakHours: number[];
  workloadDistribution: {
    hour: number;
    staffRequired: number;
    workloadLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  efficiencyImprovements: string[];
}

export class TableAdvancedAnalyticsService {
  // ===================== DETAILED PERFORMANCE REPORTS =====================

  /**
   * Get detailed table performance reports
   */
  static async getDetailedTablePerformance(
    tenantId: string,
    period: DateRange
  ): Promise<DetailedTablePerformance[]> {
    try {
      const tables = await prisma.table.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          orders: {
            where: {
              orderDate: {
                gte: period.start,
                lte: period.end
              },
              status: {
                notIn: ['CANCELLED', 'REFUNDED']
              }
            },
            include: {
              items: {
                include: {
                  item: true
                }
              }
            }
          },
          reservations: {
            where: {
              reservationDate: {
                gte: period.start,
                lte: period.end
              }
            }
          }
        }
      });

      const performanceData: DetailedTablePerformance[] = [];

      for (const table of tables) {
        const performanceScore = this.calculateDetailedPerformanceScore(table, period);
        const historicalTrend = await this.getHistoricalTrend(table.id, period);
        const comparisonMetrics = await this.getComparisonMetrics(table, tables, period);

        performanceData.push({
          tableId: table.id,
          tableNumber: table.tableNumber,
          tableName: table.tableName || undefined,
          section: table.section || undefined,
          performanceScore,
          utilizationRate: this.calculateUtilizationRate(table, period),
          revenuePerHour: this.calculateRevenuePerHour(table, period),
          revenuePerSeat: this.calculateRevenuePerSeat(table, period),
          customerSatisfaction: this.estimateCustomerSatisfaction(table),
          averageOrderValue: this.calculateAverageOrderValue(table),
          orderFrequency: this.calculateOrderFrequency(table, period),
          peakHours: this.getPeakHours(table),
          issues: this.identifyTableIssues(table),
          recommendations: this.generateTableRecommendations(table),
          historicalTrend,
          comparisonMetrics
        });
      }

      return performanceData.sort((a, b) => b.performanceScore - a.performanceScore);
    } catch (error) {
      throw new AppError('Failed to get detailed table performance', 500, error);
    }
  }

  /**
   * Get performance forecasts for tables
   */
  static async getPerformanceForecasts(
    tenantId: string,
    period: DateRange
  ): Promise<PerformanceForecast[]> {
    try {
      const tables = await prisma.table.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          orders: {
            where: {
              orderDate: {
                gte: new Date(period.start.getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                lte: period.end
              }
            }
          }
        }
      });

      const forecasts: PerformanceForecast[] = [];

      for (const table of tables) {
        const forecast = this.calculatePerformanceForecast(table, period);
        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      throw new AppError('Failed to get performance forecasts', 500, error);
    }
  }

  // ===================== RESERVATION ANALYTICS =====================

  /**
   * Get comprehensive reservation analytics
   */
  static async getReservationAnalytics(
    tenantId: string,
    period: DateRange
  ): Promise<ReservationAnalytics> {
    try {
      const reservations = await prisma.tableReservation.findMany({
        where: {
          tenantId,
          reservationDate: {
            gte: period.start,
            lte: period.end
          }
        },
        include: {
          table: true,
          customer: true
        }
      });

      const totalReservations = reservations.length;
      const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMED').length;
      const cancelledReservations = reservations.filter(r => r.status === 'CANCELLED').length;
      const noShowReservations = reservations.filter(r => r.status === 'NO_SHOW').length;
      const completedReservations = reservations.filter(r => r.status === 'COMPLETED').length;

      const conversionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;
      const noShowRate = totalReservations > 0 ? (noShowReservations / totalReservations) * 100 : 0;

      const averageGuestCount = reservations.length > 0 
        ? reservations.reduce((sum, r) => sum + r.guestCount, 0) / reservations.length 
        : 0;

      const averageDuration = reservations.length > 0
        ? reservations.reduce((sum, r) => sum + r.duration, 0) / reservations.length
        : 0;

      const peakReservationTimes = this.calculatePeakReservationTimes(reservations);
      const reservationPatterns = this.calculateReservationPatterns(reservations);
      const customerPreferences = this.calculateCustomerPreferences(reservations);

      return {
        totalReservations,
        confirmedReservations,
        cancelledReservations,
        noShowReservations,
        completedReservations,
        conversionRate,
        noShowRate,
        averageGuestCount,
        averageDuration,
        peakReservationTimes,
        reservationPatterns,
        customerPreferences
      };
    } catch (error) {
      throw new AppError('Failed to get reservation analytics', 500, error);
    }
  }

  /**
   * Get reservation insights and optimization opportunities
   */
  static async getReservationInsights(
    tenantId: string,
    period: DateRange
  ): Promise<ReservationInsights> {
    try {
      const reservations = await prisma.tableReservation.findMany({
        where: {
          tenantId,
          reservationDate: {
            gte: period.start,
            lte: period.end
          }
        }
      });

      const highDemandPeriods = this.identifyHighDemandPeriods(reservations);
      const optimizationOpportunities = this.identifyOptimizationOpportunities(reservations);

      return {
        highDemandPeriods,
        optimizationOpportunities
      };
    } catch (error) {
      throw new AppError('Failed to get reservation insights', 500, error);
    }
  }

  // ===================== CUSTOMER BEHAVIOR INSIGHTS =====================

  /**
   * Get customer behavior insights for tables
   */
  static async getCustomerBehaviorInsights(
    tenantId: string,
    period: DateRange
  ): Promise<CustomerBehaviorInsights> {
    try {
      const reservations = await prisma.tableReservation.findMany({
        where: {
          tenantId,
          reservationDate: {
            gte: period.start,
            lte: period.end
          }
        },
        include: {
          table: true,
          customer: true
        }
      });

      const tablePreferences = this.analyzeTablePreferences(reservations);
      const seatingPatterns = this.analyzeSeatingPatterns(reservations);
      const customerSatisfaction = this.analyzeCustomerSatisfaction(reservations);
      const repeatCustomerAnalysis = this.analyzeRepeatCustomers(reservations);

      return {
        tablePreferences,
        seatingPatterns,
        customerSatisfaction,
        repeatCustomerAnalysis
      };
    } catch (error) {
      throw new AppError('Failed to get customer behavior insights', 500, error);
    }
  }

  // ===================== CAPACITY OPTIMIZATION =====================

  /**
   * Get advanced capacity optimization data
   */
  static async getAdvancedCapacityOptimization(
    tenantId: string,
    period: DateRange
  ): Promise<CapacityOptimizationData[]> {
    try {
      const tables = await prisma.table.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          orders: {
            where: {
              orderDate: {
                gte: period.start,
                lte: period.end
              }
            }
          },
          reservations: {
            where: {
              reservationDate: {
                gte: period.start,
                lte: period.end
              }
            }
          }
        }
      });

      const sections = Array.from(new Set(tables.map(t => t.section).filter(Boolean)));
      const optimizationData: CapacityOptimizationData[] = [];

      for (const section of sections) {
        const sectionTables = tables.filter(t => t.section === section);
        const optimization = this.calculateSectionOptimization(sectionTables, period);
        optimizationData.push(optimization);
      }

      return optimizationData;
    } catch (error) {
      throw new AppError('Failed to get advanced capacity optimization', 500, error);
    }
  }

  /**
   * Get staff allocation recommendations
   */
  static async getStaffAllocationRecommendations(
    tenantId: string,
    period: DateRange
  ): Promise<StaffAllocationRecommendation[]> {
    try {
      const tables = await prisma.table.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          orders: {
            where: {
              orderDate: {
                gte: period.start,
                lte: period.end
              }
            }
          }
        }
      });

      const sections = Array.from(new Set(tables.map(t => t.section).filter(Boolean)));
      const recommendations: StaffAllocationRecommendation[] = [];

      for (const section of sections) {
        const sectionTables = tables.filter(t => t.section === section);
        const recommendation = this.calculateStaffAllocation(sectionTables, period);
        recommendations.push(recommendation);
      }

      return recommendations;
    } catch (error) {
      throw new AppError('Failed to get staff allocation recommendations', 500, error);
    }
  }

  // ===================== PRIVATE HELPER METHODS =====================

  private static calculateDetailedPerformanceScore(table: any, period: DateRange): number {
    const utilizationRate = this.calculateUtilizationRate(table, period);
    const revenuePerHour = this.calculateRevenuePerHour(table, period);
    const customerSatisfaction = this.estimateCustomerSatisfaction(table);
    const orderFrequency = this.calculateOrderFrequency(table, period);

    // Weighted scoring algorithm
    const score = (
      utilizationRate * 0.3 +
      (revenuePerHour / 1000) * 0.3 +
      customerSatisfaction * 0.2 +
      (orderFrequency / 10) * 0.2
    ) * 100;

    return Math.min(Math.max(score, 0), 100);
  }

  private static calculateUtilizationRate(table: any, period: DateRange): number {
    const totalHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    const occupiedHours = table.orders.reduce((sum: number, order: any) => {
      return sum + this.estimateOrderDuration(order);
    }, 0);

    return totalHours > 0 ? (occupiedHours / totalHours) * 100 : 0;
  }

  private static calculateRevenuePerHour(table: any, period: DateRange): number {
    const totalRevenue = table.orders.reduce((sum: number, order: any) => {
      return sum + Number(order.totalAmount);
    }, 0);

    const totalHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    return totalHours > 0 ? totalRevenue / totalHours : 0;
  }

  private static calculateRevenuePerSeat(table: any, period: DateRange): number {
    const totalRevenue = table.orders.reduce((sum: number, order: any) => {
      return sum + Number(order.totalAmount);
    }, 0);

    return table.capacity > 0 ? totalRevenue / table.capacity : 0;
  }

  private static estimateCustomerSatisfaction(table: any): number {
    // This would be calculated from actual customer feedback
    // For now, we'll estimate based on order frequency and value
    const orderCount = table.orders.length;
    const averageOrderValue = this.calculateAverageOrderValue(table);
    
    // Simple estimation algorithm
    const satisfaction = Math.min(
      (orderCount * 0.1 + averageOrderValue * 0.01) * 10,
      100
    );
    
    return Math.max(satisfaction, 0);
  }

  private static calculateAverageOrderValue(table: any): number {
    if (table.orders.length === 0) return 0;
    
    const totalRevenue = table.orders.reduce((sum: number, order: any) => {
      return sum + Number(order.totalAmount);
    }, 0);
    
    return totalRevenue / table.orders.length;
  }

  private static calculateOrderFrequency(table: any, period: DateRange): number {
    const daysInPeriod = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24);
    return daysInPeriod > 0 ? table.orders.length / daysInPeriod : 0;
  }

  private static getPeakHours(table: any): number[] {
    // Analyze order times to find peak hours
    const orderHours = table.orders.map((order: any) => 
      new Date(order.orderDate).getHours()
    );
    
    const hourCounts = orderHours.reduce((acc: any, hour: number) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(hourCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private static identifyTableIssues(table: any): string[] {
    const issues: string[] = [];
    
    if (table.orders.length === 0) {
      issues.push('No orders in period');
    }
    
    if (table.capacity > 8 && table.orders.length < 5) {
      issues.push('Large table underutilized');
    }
    
    return issues;
  }

  private static generateTableRecommendations(table: any): string[] {
    const recommendations: string[] = [];
    
    if (table.orders.length === 0) {
      recommendations.push('Consider promotional activities');
      recommendations.push('Review table positioning');
    }
    
    if (table.capacity > 8 && table.orders.length < 5) {
      recommendations.push('Consider smaller table configuration');
    }
    
    return recommendations;
  }

  private static async getHistoricalTrend(tableId: string, period: DateRange): Promise<any[]> {
    // This would fetch historical data for trend analysis
    // For now, return mock data
    return [
      {
        period: 'Previous Week',
        performanceScore: 75,
        utilizationRate: 60,
        revenue: 5000
      },
      {
        period: 'Current Week',
        performanceScore: 80,
        utilizationRate: 65,
        revenue: 5500
      }
    ];
  }

  private static async getComparisonMetrics(table: any, allTables: any[], period: DateRange): Promise<any> {
    const sectionTables = allTables.filter(t => t.section === table.section);
    const sectionAverage = sectionTables.reduce((sum: number, t: any) => {
      return sum + this.calculateDetailedPerformanceScore(t, period);
    }, 0) / sectionTables.length;
    
    const overallAverage = allTables.reduce((sum: number, t: any) => {
      return sum + this.calculateDetailedPerformanceScore(t, period);
    }, 0) / allTables.length;
    
    return {
      sectionAverage,
      overallAverage,
      rankInSection: 1, // Would calculate actual rank
      rankOverall: 1 // Would calculate actual rank
    };
  }

  private static calculatePerformanceForecast(table: any, period: DateRange): PerformanceForecast {
    // Simple forecasting algorithm
    const currentUtilization = this.calculateUtilizationRate(table, period);
    const currentRevenue = table.orders.reduce((sum: number, order: any) => {
      return sum + Number(order.totalAmount);
    }, 0);
    
    const predictedUtilization = Math.min(currentUtilization * 1.1, 100);
    const predictedRevenue = currentRevenue * 1.05;
    
    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      predictedUtilization,
      predictedRevenue,
      confidenceLevel: 0.8,
      factors: ['Historical trend', 'Seasonal patterns'],
      recommendations: ['Increase marketing efforts', 'Optimize table positioning']
    };
  }

  private static calculatePeakReservationTimes(reservations: any[]): any[] {
    const hourCounts: any = {};
    
    reservations.forEach(reservation => {
      const hour = new Date(reservation.reservationDate).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        dayOfWeek: 1, // Would calculate actual day
        reservationCount: count as number,
        utilizationRate: 0 // Would calculate actual utilization
      }))
      .sort((a, b) => b.reservationCount - a.reservationCount)
      .slice(0, 10);
  }

  private static calculateReservationPatterns(reservations: any[]): any[] {
    const dayCounts: any = {};
    
    reservations.forEach(reservation => {
      const day = new Date(reservation.reservationDate).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    return Object.entries(dayCounts).map(([day, count]) => ({
      dayOfWeek: parseInt(day),
      averageReservations: count as number,
      peakHours: [12, 18, 20] // Would calculate actual peak hours
    }));
  }

  private static calculateCustomerPreferences(reservations: any[]): any {
    const tableCounts: any = {};
    const timeCounts: any = {};
    let totalPartySize = 0;
    let repeatCustomers = 0;
    
    reservations.forEach(reservation => {
      tableCounts[reservation.tableId] = (tableCounts[reservation.tableId] || 0) + 1;
      
      const hour = new Date(reservation.reservationDate).getHours();
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
      
      totalPartySize += reservation.guestCount;
    });
    
    const preferredTables = Object.entries(tableCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([tableId]) => tableId);
    
    const preferredTimes = Object.entries(timeCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    
    return {
      preferredTables,
      preferredTimes,
      averagePartySize: reservations.length > 0 ? totalPartySize / reservations.length : 0,
      repeatCustomerRate: reservations.length > 0 ? (repeatCustomers / reservations.length) * 100 : 0
    };
  }

  private static identifyHighDemandPeriods(reservations: any[]): any[] {
    // Analyze reservations to identify high demand periods
    return [
      {
        startTime: '18:00',
        endTime: '20:00',
        dayOfWeek: 5, // Friday
        demandLevel: 'HIGH' as const,
        recommendedCapacity: 80
      }
    ];
  }

  private static identifyOptimizationOpportunities(reservations: any[]): any[] {
    return [
      {
        type: 'CAPACITY' as const,
        description: 'Increase capacity during peak hours',
        potentialImpact: 15,
        implementationCost: 5000,
        priority: 'HIGH' as const
      }
    ];
  }

  private static analyzeTablePreferences(reservations: any[]): any[] {
    const tableStats: any = {};
    
    reservations.forEach(reservation => {
      if (!tableStats[reservation.tableId]) {
        tableStats[reservation.tableId] = {
          tableId: reservation.tableId,
          tableNumber: reservation.table.tableNumber,
          customerCount: 0,
          averageRating: 0,
          preferredBySegments: []
        };
      }
      
      tableStats[reservation.tableId].customerCount++;
    });
    
    return Object.values(tableStats);
  }

  private static analyzeSeatingPatterns(reservations: any[]): any[] {
    const sectionStats: any = {};
    
    reservations.forEach(reservation => {
      const section = reservation.table.section;
      if (!sectionStats[section]) {
        sectionStats[section] = {
          section,
          preferredBySegment: 'General',
          averagePartySize: 0,
          peakUsageTimes: []
        };
      }
      
      sectionStats[section].averagePartySize += reservation.guestCount;
    });
    
    return Object.values(sectionStats).map((stat: any) => ({
      ...stat,
      averagePartySize: stat.averagePartySize / reservations.length
    }));
  }

  private static analyzeCustomerSatisfaction(reservations: any[]): any[] {
    // This would analyze actual customer feedback
    return reservations.map(reservation => ({
      tableId: reservation.tableId,
      tableNumber: reservation.table.tableNumber,
      averageRating: 4.2,
      reviewCount: 5,
      commonComplaints: [],
      positiveFeedback: ['Great service', 'Good atmosphere']
    }));
  }

  private static analyzeRepeatCustomers(reservations: any[]): any[] {
    const customerStats: any = {};
    
    reservations.forEach(reservation => {
      if (reservation.customerId) {
        if (!customerStats[reservation.customerId]) {
          customerStats[reservation.customerId] = {
            customerId: reservation.customerId,
            customerName: reservation.customerName,
            preferredTables: [],
            visitFrequency: 0,
            averageSpending: 0,
            loyaltyLevel: 'BRONZE'
          };
        }
        
        customerStats[reservation.customerId].visitFrequency++;
      }
    });
    
    return Object.values(customerStats);
  }

  private static calculateSectionOptimization(sectionTables: any[], period: DateRange): CapacityOptimizationData {
    const currentCapacity = sectionTables.reduce((sum, table) => sum + table.capacity, 0);
    const averageUtilization = sectionTables.reduce((sum, table) => {
      return sum + this.calculateUtilizationRate(table, period);
    }, 0) / sectionTables.length;
    
    const peakUtilization = Math.max(...sectionTables.map(table => 
      this.calculateUtilizationRate(table, period)
    ));
    
    const recommendedCapacity = Math.round(currentCapacity * (averageUtilization / 100));
    const efficiencyScore = (averageUtilization / peakUtilization) * 100;
    
    return {
      section: sectionTables[0].section,
      currentCapacity,
      averageUtilization,
      peakUtilization,
      recommendedCapacity,
      efficiencyScore,
      bottlenecks: [],
      recommendations: [],
      seasonalAdjustments: [],
      revenueOptimization: {
        currentRevenue: 0,
        projectedRevenue: 0,
        revenueIncrease: 0,
        implementationCost: 0,
        roi: 0
      }
    };
  }

  private static calculateStaffAllocation(sectionTables: any[], period: DateRange): StaffAllocationRecommendation {
    const currentStaffCount = 2; // Would get from actual data
    const recommendedStaffCount = Math.ceil(sectionTables.length / 5);
    
    return {
      section: sectionTables[0].section,
      recommendedStaffCount,
      currentStaffCount,
      peakHours: [12, 18, 20],
      workloadDistribution: [
        { hour: 12, staffRequired: 3, workloadLevel: 'HIGH' as const },
        { hour: 18, staffRequired: 4, workloadLevel: 'HIGH' as const },
        { hour: 20, staffRequired: 3, workloadLevel: 'MEDIUM' as const }
      ],
      efficiencyImprovements: [
        'Increase staff during peak hours',
        'Cross-train staff for multiple roles'
      ]
    };
  }

  private static estimateOrderDuration(order: any): number {
    // Estimate order duration based on order items and value
    const baseDuration = 60; // 1 hour base
    const itemCount = order.items.length;
    const orderValue = Number(order.totalAmount);
    
    // Adjust duration based on complexity
    let duration = baseDuration;
    duration += itemCount * 5; // 5 minutes per item
    duration += orderValue > 100000 ? 30 : 0; // 30 minutes for high-value orders
    
    return Math.min(duration, 180); // Cap at 3 hours
  }
} 