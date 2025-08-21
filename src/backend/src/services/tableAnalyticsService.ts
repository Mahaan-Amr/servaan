import { PrismaClient, TableStatus } from '../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TableUtilizationMetric {
  tableId: string;
  tableNumber: string;
  tableName?: string;
  section?: string;
  capacity: number;
  totalHours: number;
  occupiedHours: number;
  utilizationRate: number;
  revenue: number;
  averageOrderValue: number;
  orderCount: number;
  averageOccupancyDuration: number;
}

export interface PeakHoursData {
  hour: number;
  utilizationRate: number;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface TableRevenueData {
  tableId: string;
  tableNumber: string;
  tableName?: string;
  section?: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  revenuePerHour: number;
  revenuePerSeat: number;
  utilizationRate: number;
}

export interface CapacityOptimizationData {
  section: string;
  totalCapacity: number;
  averageUtilization: number;
  peakUtilization: number;
  recommendedCapacity: number;
  efficiencyScore: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface TablePerformanceData {
  tableId: string;
  tableNumber: string;
  tableName?: string;
  section?: string;
  performanceScore: number;
  utilizationRate: number;
  revenuePerHour: number;
  customerSatisfaction: number;
  averageOrderValue: number;
  orderFrequency: number;
  peakHours: number[];
  issues: string[];
  recommendations: string[];
}

export interface TableAnalyticsSummary {
  period: DateRange;
  totalTables: number;
  averageUtilization: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  peakHours: PeakHoursData[];
  topPerformingTables: TableRevenueData[];
  capacityOptimization: CapacityOptimizationData[];
  performanceInsights: string[];
}

export class TableAnalyticsService {
  /**
   * Get table utilization analytics for a specific period
   */
  static async getTableUtilization(
    tenantId: string,
    period: DateRange
  ): Promise<TableUtilizationMetric[]> {
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
              },
              status: 'CONFIRMED'
            }
          }
        }
      });

      const utilizationMetrics: TableUtilizationMetric[] = [];

      for (const table of tables) {
        const totalHours = this.calculateTotalHours(period);
        const occupiedHours = this.calculateOccupiedHours(table, period);
        const utilizationRate = (occupiedHours / totalHours) * 100;
        const revenue = this.calculateTableRevenue(table.orders);
        const orderCount = table.orders.length;
        const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
        const averageOccupancyDuration = this.calculateAverageOccupancyDuration(table.orders);

        utilizationMetrics.push({
          tableId: table.id,
          tableNumber: table.tableNumber,
          tableName: table.tableName || undefined,
          section: table.section || undefined,
          capacity: table.capacity,
          totalHours,
          occupiedHours,
          utilizationRate,
          revenue,
          averageOrderValue,
          orderCount,
          averageOccupancyDuration
        });
      }

      return utilizationMetrics.sort((a, b) => b.utilizationRate - a.utilizationRate);
    } catch (error) {
      throw new AppError('Failed to get table utilization analytics', 500, error);
    }
  }

  /**
   * Get peak hours analysis
   */
  static async getPeakHoursAnalysis(
    tenantId: string,
    period: DateRange
  ): Promise<PeakHoursData[]> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          tenantId,
          orderDate: {
            gte: period.start,
            lte: period.end
          },
          status: {
            notIn: ['CANCELLED', 'REFUNDED']
          }
        },
        include: {
          table: true,
          items: {
            include: {
              item: true
            }
          }
        }
      });

      const hourlyData: Map<number, {
        orderCount: number;
        revenue: number;
        totalHours: number;
      }> = new Map();

      // Initialize hourly data
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.set(hour, {
          orderCount: 0,
          revenue: 0,
          totalHours: 0
        });
      }

      // Process orders by hour
      for (const order of orders) {
        const orderHour = new Date(order.orderDate).getHours();
        const current = hourlyData.get(orderHour)!;
        
        current.orderCount++;
        current.revenue += Number(order.totalAmount);
        current.totalHours += this.estimateOrderDuration(order);
      }

      // Calculate utilization rates and convert to array
      const peakHours: PeakHoursData[] = [];
      const totalTables = await prisma.table.count({
        where: { tenantId, isActive: true }
      });

      for (let hour = 0; hour < 24; hour++) {
        const data = hourlyData.get(hour)!;
        const utilizationRate = totalTables > 0 ? (data.totalHours / (totalTables * 1)) * 100 : 0;
        const averageOrderValue = data.orderCount > 0 ? data.revenue / data.orderCount : 0;

        peakHours.push({
          hour,
          utilizationRate,
          orderCount: data.orderCount,
          revenue: data.revenue,
          averageOrderValue
        });
      }

      return peakHours;
    } catch (error) {
      throw new AppError('Failed to get peak hours analysis', 500, error);
    }
  }

  /**
   * Get revenue analysis per table
   */
  static async getTableRevenueAnalysis(
    tenantId: string,
    period: DateRange
  ): Promise<TableRevenueData[]> {
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
            }
          }
        }
      });

      const revenueData: TableRevenueData[] = [];

      for (const table of tables) {
        const totalRevenue = table.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const orderCount = table.orders.length;
        const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
        
        // Calculate occupied hours for revenue per hour
        const occupiedHours = this.calculateOccupiedHours(table, period);
        const revenuePerHour = occupiedHours > 0 ? totalRevenue / occupiedHours : 0;
        const revenuePerSeat = table.capacity > 0 ? totalRevenue / table.capacity : 0;
        
        // Calculate utilization rate
        const totalHours = this.calculateTotalHours(period);
        const utilizationRate = (occupiedHours / totalHours) * 100;

        revenueData.push({
          tableId: table.id,
          tableNumber: table.tableNumber,
          tableName: table.tableName || undefined,
          section: table.section || undefined,
          totalRevenue,
          orderCount,
          averageOrderValue,
          revenuePerHour,
          revenuePerSeat,
          utilizationRate
        });
      }

      return revenueData.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      throw new AppError('Failed to get table revenue analysis', 500, error);
    }
  }

  /**
   * Get capacity optimization analysis
   */
  static async getCapacityOptimization(
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
              },
              status: {
                notIn: ['CANCELLED', 'REFUNDED']
              }
            }
          }
        }
      });

      // Group tables by section
      const sectionData: Map<string, {
        tables: typeof tables;
        totalCapacity: number;
        totalUtilization: number;
        peakUtilization: number;
      }> = new Map();

      for (const table of tables) {
        const section = table.section || 'Main';
        const occupiedHours = this.calculateOccupiedHours(table, period);
        const totalHours = this.calculateTotalHours(period);
        const utilizationRate = (occupiedHours / totalHours) * 100;

        if (!sectionData.has(section)) {
          sectionData.set(section, {
            tables: [],
            totalCapacity: 0,
            totalUtilization: 0,
            peakUtilization: 0
          });
        }

        const sectionInfo = sectionData.get(section)!;
        sectionInfo.tables.push(table);
        sectionInfo.totalCapacity += table.capacity;
        sectionInfo.totalUtilization += utilizationRate;
        sectionInfo.peakUtilization = Math.max(sectionInfo.peakUtilization, utilizationRate);
      }

      const optimizationData: CapacityOptimizationData[] = [];

      for (const [section, data] of Array.from(sectionData.entries())) {
        const averageUtilization = data.totalUtilization / data.tables.length;
        const efficiencyScore = this.calculateEfficiencyScore(averageUtilization, data.peakUtilization);
        const recommendedCapacity = this.calculateRecommendedCapacity(data.totalCapacity, averageUtilization);
        
        const bottlenecks: string[] = [];
        const recommendations: string[] = [];

        if (averageUtilization < 50) {
          bottlenecks.push('کمبود تقاضا');
          recommendations.push('افزایش بازاریابی و تبلیغات');
        } else if (averageUtilization > 90) {
          bottlenecks.push('ظرفیت ناکافی');
          recommendations.push('افزایش تعداد میزها یا ظرفیت');
        }

        if (data.peakUtilization > 95) {
          bottlenecks.push('اوج تقاضا');
          recommendations.push('بهینه‌سازی زمان‌بندی رزروها');
        }

        optimizationData.push({
          section,
          totalCapacity: data.totalCapacity,
          averageUtilization,
          peakUtilization: data.peakUtilization,
          recommendedCapacity,
          efficiencyScore,
          bottlenecks,
          recommendations
        });
      }

      return optimizationData.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    } catch (error) {
      throw new AppError('Failed to get capacity optimization analysis', 500, error);
    }
  }

  /**
   * Get comprehensive table analytics summary
   */
  static async getTableAnalyticsSummary(
    tenantId: string,
    period: DateRange
  ): Promise<TableAnalyticsSummary> {
    try {
      const [
        utilizationMetrics,
        peakHours,
        revenueData,
        capacityOptimization
      ] = await Promise.all([
        this.getTableUtilization(tenantId, period),
        this.getPeakHoursAnalysis(tenantId, period),
        this.getTableRevenueAnalysis(tenantId, period),
        this.getCapacityOptimization(tenantId, period)
      ]);

      const totalTables = utilizationMetrics.length;
      const averageUtilization = utilizationMetrics.reduce((sum, metric) => sum + metric.utilizationRate, 0) / totalTables;
      const totalRevenue = revenueData.reduce((sum, data) => sum + data.totalRevenue, 0);
      const totalOrders = revenueData.reduce((sum, data) => sum + data.orderCount, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const topPerformingTables = revenueData.slice(0, 10);

      const performanceInsights = this.generatePerformanceInsights(
        utilizationMetrics,
        peakHours,
        revenueData,
        capacityOptimization
      );

      return {
        period,
        totalTables,
        averageUtilization,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        peakHours,
        topPerformingTables,
        capacityOptimization,
        performanceInsights
      };
    } catch (error) {
      throw new AppError('Failed to get table analytics summary', 500, error);
    }
  }

  // =================== PRIVATE HELPER METHODS ===================

  private static calculateTotalHours(period: DateRange): number {
    const diffTime = period.end.getTime() - period.start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays * 24; // Assuming 24-hour operation
  }

  private static calculateOccupiedHours(table: any, period: DateRange): number {
    let totalHours = 0;

    // Calculate hours from orders
    for (const order of table.orders) {
      const orderDuration = this.estimateOrderDuration(order);
      totalHours += orderDuration;
    }

    // Calculate hours from reservations
    for (const reservation of table.reservations) {
      const reservationDuration = reservation.duration || 120; // Default 2 hours
      totalHours += reservationDuration / 60; // Convert minutes to hours
    }

    return totalHours;
  }

  private static estimateOrderDuration(order: any): number {
    // Estimate order duration based on order value and items
    const baseDuration = 1; // Base 1 hour
    const itemCount = order.items.length;
    const valueMultiplier = order.totalAmount / 100000; // Adjust based on average order value
    
    return Math.max(baseDuration, Math.min(3, baseDuration + (itemCount * 0.1) + valueMultiplier));
  }

  private static calculateAverageOccupancyDuration(orders: any[]): number {
    if (orders.length === 0) return 0;
    
    const totalDuration = orders.reduce((sum, order) => {
      return sum + this.estimateOrderDuration(order);
    }, 0);
    
    return totalDuration / orders.length;
  }

  private static calculateTableRevenue(orders: any[]): number {
    return orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  }

  private static calculateEfficiencyScore(averageUtilization: number, peakUtilization: number): number {
    // Efficiency score based on utilization balance
    const utilizationScore = Math.min(averageUtilization / 80, 1) * 50; // Max 50 points for utilization
    const peakScore = Math.min(peakUtilization / 100, 1) * 30; // Max 30 points for peak handling
    const balanceScore = Math.max(0, 20 - Math.abs(averageUtilization - 70)); // 20 points for optimal balance
    
    return utilizationScore + peakScore + balanceScore;
  }

  private static calculateRecommendedCapacity(currentCapacity: number, utilization: number): number {
    if (utilization < 50) {
      return Math.max(1, Math.floor(currentCapacity * 0.8)); // Reduce capacity
    } else if (utilization > 90) {
      return Math.ceil(currentCapacity * 1.2); // Increase capacity
    } else {
      return currentCapacity; // Keep current capacity
    }
  }

  private static generatePerformanceInsights(
    utilizationMetrics: TableUtilizationMetric[],
    peakHours: PeakHoursData[],
    revenueData: TableRevenueData[],
    capacityOptimization: CapacityOptimizationData[]
  ): string[] {
    const insights: string[] = [];

    // Utilization insights
    const avgUtilization = utilizationMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / utilizationMetrics.length;
    if (avgUtilization < 60) {
      insights.push('نرخ استفاده از میزها پایین است. پیشنهاد می‌شود استراتژی‌های بازاریابی بهبود یابد.');
    } else if (avgUtilization > 85) {
      insights.push('نرخ استفاده از میزها بالا است. پیشنهاد می‌شود ظرفیت افزایش یابد.');
    }

    // Peak hours insights
    const peakHour = peakHours.reduce((max, hour) => hour.utilizationRate > max.utilizationRate ? hour : max);
    if (peakHour.utilizationRate > 95) {
      insights.push(`ساعت ${peakHour.hour}:00 اوج تقاضا است. پیشنهاد می‌شود مدیریت رزروها بهبود یابد.`);
    }

    // Revenue insights
    const topTable = revenueData[0];
    const bottomTable = revenueData[revenueData.length - 1];
    if (topTable && bottomTable && (topTable.totalRevenue / bottomTable.totalRevenue) > 5) {
      insights.push('تفاوت قابل توجهی در درآمد میزها وجود دارد. پیشنهاد می‌شود توزیع مشتریان بهبود یابد.');
    }

    // Capacity insights
    const lowEfficiencySections = capacityOptimization.filter(section => section.efficiencyScore < 60);
    if (lowEfficiencySections.length > 0) {
      insights.push(`${lowEfficiencySections.length} بخش نیاز به بهینه‌سازی ظرفیت دارد.`);
    }

    return insights;
  }
} 
