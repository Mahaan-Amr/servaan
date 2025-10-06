import { PrismaClient, OrderStatus, PaymentMethod, OrderType } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

// ==================== INTERFACES ====================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  topSellingItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageOrderValue: number;
  customerGrowth: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
    lastVisit: string;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageSpent: number;
  }>;
}

export interface KitchenPerformance {
  totalOrders: number;
  averagePrepTime: number;
  onTimeDelivery: number;
  delayedOrders: number;
  efficiency: number;
  topItems: Array<{
    itemName: string;
    orderCount: number;
    averagePrepTime: number;
  }>;
  performanceByHour: Array<{
    hour: number;
    orders: number;
    averagePrepTime: number;
  }>;
}

export interface TableUtilization {
  totalTables: number;
  averageUtilization: number;
  peakHours: Array<{
    hour: number;
    utilization: number;
  }>;
  topPerformingTables: Array<{
    tableNumber: string;
    utilization: number;
    revenue: number;
    orderCount: number;
  }>;
  capacityOptimization: Array<{
    tableNumber: string;
    capacity: number;
    utilization: number;
    recommendation: string;
  }>;
}

// ==================== ORDERING ANALYTICS SERVICE ====================

export class OrderingAnalyticsService {
  
  /**
   * Get comprehensive sales analytics for a specific period
   */
  static async getSalesSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesAnalytics> {
    try {
      console.log('📊 [ORDERING_ANALYTICS] Getting sales summary for tenant:', tenantId);
      console.log('📊 [ORDERING_ANALYTICS] Date range:', { startDate, endDate });

      // Get current period data
      const currentPeriodData = await this.getCurrentPeriodSalesData(tenantId, startDate, endDate);
      
      // Get previous period data for growth calculation
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      const previousEndDate = new Date(startDate.getTime() - 1);
      const previousPeriodData = await this.getCurrentPeriodSalesData(tenantId, previousStartDate, previousEndDate);

      // Calculate growth percentages
      const revenueGrowth = this.calculateGrowthPercentage(
        previousPeriodData.totalRevenue,
        currentPeriodData.totalRevenue
      );
      const orderGrowth = this.calculateGrowthPercentage(
        previousPeriodData.totalOrders,
        currentPeriodData.totalOrders
      );

      // Get top selling items
      const topSellingItems = await this.getTopSellingItems(tenantId, startDate, endDate, currentPeriodData.totalRevenue);

      // Get hourly breakdown
      const hourlyBreakdown = await this.getHourlyBreakdown(tenantId, startDate, endDate);

      // Get daily revenue
      const dailyRevenue = await this.getDailyRevenue(tenantId, startDate, endDate);

      // Get payment methods distribution
      const paymentMethods = await this.getPaymentMethodsDistribution(tenantId, startDate, endDate);

      return {
        totalRevenue: currentPeriodData.totalRevenue,
        totalOrders: currentPeriodData.totalOrders,
        averageOrderValue: currentPeriodData.averageOrderValue,
        revenueGrowth,
        orderGrowth,
        topSellingItems,
        hourlyBreakdown,
        dailyRevenue,
        paymentMethods
      };

    } catch (error) {
      console.error('❌ [ORDERING_ANALYTICS] Error getting sales summary:', error);
      throw new AppError('Failed to get sales analytics', 500, error);
    }
  }

  /**
   * Get customer analytics for a specific period
   */
  static async getCustomerAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CustomerAnalytics> {
    try {
      console.log('👥 [ORDERING_ANALYTICS] Getting customer analytics for tenant:', tenantId);

      // Get current period customer data
      const currentPeriodData = await this.getCurrentPeriodCustomerData(tenantId, startDate, endDate);
      
      // Get previous period data for growth calculation
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      const previousEndDate = new Date(startDate.getTime() - 1);
      const previousPeriodData = await this.getCurrentPeriodCustomerData(tenantId, previousStartDate, previousEndDate);

      // Calculate customer growth
      const customerGrowth = this.calculateGrowthPercentage(
        previousPeriodData.totalCustomers,
        currentPeriodData.totalCustomers
      );

      // Get top customers
      const topCustomers = await this.getTopCustomers(tenantId, startDate, endDate);

      // Get customer segments
      const customerSegments = await this.getCustomerSegments(tenantId, startDate, endDate);

      return {
        totalCustomers: currentPeriodData.totalCustomers,
        newCustomers: currentPeriodData.newCustomers,
        repeatCustomers: currentPeriodData.repeatCustomers,
        averageOrderValue: currentPeriodData.averageOrderValue,
        customerGrowth,
        topCustomers,
        customerSegments
      };

    } catch (error) {
      console.error('❌ [ORDERING_ANALYTICS] Error getting customer analytics:', error);
      throw new AppError('Failed to get customer analytics', 500, error);
    }
  }

  /**
   * Get kitchen performance analytics for a specific period
   */
  static async getKitchenPerformance(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KitchenPerformance> {
    try {
      console.log('👨‍🍳 [ORDERING_ANALYTICS] Getting kitchen performance for tenant:', tenantId);

      // Get orders with timing data
      const orders = await prisma.order.findMany({
        where: {
          tenantId,
          orderDate: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: ['COMPLETED', 'SERVED']
          },
          startedAt: { not: null },
          readyAt: { not: null }
        },
        select: {
          id: true,
          startedAt: true,
          readyAt: true,
          items: {
            select: {
              itemName: true,
              prepStartedAt: true,
              prepCompletedAt: true
            }
          }
        }
      });

      const totalOrders = orders.length;

      // Calculate average prep time
      const prepTimes = orders
        .map(order => {
          if (order.startedAt && order.readyAt) {
            return (order.readyAt.getTime() - order.startedAt.getTime()) / (1000 * 60); // minutes
          }
          return null;
        })
        .filter(time => time !== null) as number[];

      const averagePrepTime = prepTimes.length > 0 
        ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length 
        : 0;

      // Calculate on-time delivery (assuming 30 minutes is the target)
      const targetPrepTime = 30; // minutes
      const onTimeOrders = prepTimes.filter(time => time <= targetPrepTime).length;
      const onTimeDelivery = prepTimes.length > 0 ? (onTimeOrders / prepTimes.length) * 100 : 0;
      const delayedOrders = 100 - onTimeDelivery;

      // Calculate efficiency (based on on-time delivery and average prep time)
      const efficiency = Math.max(0, Math.min(100, onTimeDelivery - (averagePrepTime - targetPrepTime) * 2));

      // Get top items by order count
      const topItems = await this.getTopKitchenItems(tenantId, startDate, endDate);

      // Get performance by hour
      const performanceByHour = await this.getKitchenPerformanceByHour(tenantId, startDate, endDate);

      return {
        totalOrders,
        averagePrepTime: Math.round(averagePrepTime * 10) / 10, // Round to 1 decimal
        onTimeDelivery: Math.round(onTimeDelivery * 10) / 10,
        delayedOrders: Math.round(delayedOrders * 10) / 10,
        efficiency: Math.round(efficiency * 10) / 10,
        topItems,
        performanceByHour
      };

    } catch (error) {
      console.error('❌ [ORDERING_ANALYTICS] Error getting kitchen performance:', error);
      throw new AppError('Failed to get kitchen performance analytics', 500, error);
    }
  }

  /**
   * Get table utilization analytics for a specific period
   */
  static async getTableUtilization(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TableUtilization> {
    try {
      console.log('🪑 [ORDERING_ANALYTICS] Getting table utilization for tenant:', tenantId);

      // Get all active tables
      const tables = await prisma.table.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          orders: {
            where: {
              orderDate: {
                gte: startDate,
                lte: endDate
              },
              status: {
                notIn: ['CANCELLED', 'REFUNDED']
              }
            }
          }
        }
      });

      const totalTables = tables.length;

      // Calculate utilization for each table
      const tableUtilizations = tables.map(table => {
        const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60); // hours
        const occupiedHours = table.orders.reduce((sum, order) => {
          if (order.startedAt && order.completedAt) {
            return sum + (order.completedAt.getTime() - order.startedAt.getTime()) / (1000 * 60 * 60);
          }
          return sum + 1; // Default 1 hour if no timing data
        }, 0);
        
        const utilization = totalHours > 0 ? (occupiedHours / totalHours) * 100 : 0;
        const revenue = table.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        
        return {
          tableNumber: table.tableNumber,
          utilization: Math.round(utilization * 10) / 10,
          revenue,
          orderCount: table.orders.length
        };
      });

      // Calculate average utilization
      const averageUtilization = tableUtilizations.length > 0
        ? tableUtilizations.reduce((sum, table) => sum + table.utilization, 0) / tableUtilizations.length
        : 0;

      // Get peak hours
      const peakHours = await this.getPeakHours(tenantId, startDate, endDate);

      // Get top performing tables
      const topPerformingTables = tableUtilizations
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Get capacity optimization recommendations
      const capacityOptimization = tableUtilizations.map(table => {
        const recommendation = this.getCapacityRecommendation(table.utilization);
        return {
          tableNumber: table.tableNumber,
          capacity: 4, // Default capacity, could be from table data
          utilization: table.utilization,
          recommendation
        };
      });

      return {
        totalTables,
        averageUtilization: Math.round(averageUtilization * 10) / 10,
        peakHours,
        topPerformingTables,
        capacityOptimization
      };

    } catch (error) {
      console.error('❌ [ORDERING_ANALYTICS] Error getting table utilization:', error);
      throw new AppError('Failed to get table utilization analytics', 500, error);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private static async getCurrentPeriodSalesData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalRevenue: number; totalOrders: number; averageOrderValue: number }> {
    const result = await prisma.order.aggregate({
      where: {
        tenantId,
        orderDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const totalRevenue = Number(result._sum.totalAmount) || 0;
    const totalOrders = result._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, averageOrderValue };
  }

  private static async getCurrentPeriodCustomerData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalCustomers: number; newCustomers: number; repeatCustomers: number; averageOrderValue: number }> {
    // Get unique customers in period
    const uniqueCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        orderDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        },
        customerId: { not: null }
      }
    });

    const totalCustomers = uniqueCustomers.length;

    // Get new customers (first order in this period)
    const newCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        orderDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        },
        customerId: { not: null }
      },
      _min: {
        orderDate: true
      }
    });

    // Count customers whose first order is in this period
    const newCustomerCount = await Promise.all(
      newCustomers.map(async (customer) => {
        if (!customer._min.orderDate) return 0;
        const earlierOrders = await prisma.order.count({
          where: {
            tenantId,
            customerId: customer.customerId,
            orderDate: {
              lt: customer._min.orderDate
            }
          }
        });
        return earlierOrders === 0 ? 1 : 0;
      })
    );

    const newCustomersCount = newCustomerCount.reduce((sum: number, count: number) => sum + count, 0);
    const repeatCustomers = totalCustomers - newCustomersCount;

    // Get average order value
    const salesData = await this.getCurrentPeriodSalesData(tenantId, startDate, endDate);

    return {
      totalCustomers,
      newCustomers: newCustomersCount,
      repeatCustomers,
      averageOrderValue: salesData.averageOrderValue
    };
  }

  private static async getTopSellingItems(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    totalRevenue: number
  ): Promise<Array<{ itemId: string; itemName: string; quantity: number; revenue: number; percentage: number }>> {
    const topItems = await prisma.orderItem.groupBy({
      by: ['itemName', 'menuItemId'],
      where: {
        tenantId,
        order: {
          orderDate: {
            gte: startDate,
            lte: endDate
          },
          status: {
            notIn: ['CANCELLED', 'REFUNDED']
          }
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 10
    });

    return topItems.map(item => ({
      itemId: item.menuItemId || 'unknown',
      itemName: item.itemName,
      quantity: item._sum.quantity || 0,
      revenue: Number(item._sum.totalPrice) || 0,
      percentage: totalRevenue > 0 ? (Number(item._sum.totalPrice) / totalRevenue) * 100 : 0
    }));
  }

  private static async getHourlyBreakdown(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ hour: number; orders: number; revenue: number }>> {
    const hourlyData = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "orderDate") as hour,
        COUNT(*) as orders,
        SUM("totalAmount") as revenue
      FROM orders
      WHERE "tenantId" = ${tenantId}
        AND "orderDate" >= ${startDate}
        AND "orderDate" <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY EXTRACT(HOUR FROM "orderDate")
      ORDER BY hour
    ` as Array<{ hour: number; orders: bigint; revenue: any }>;

    return hourlyData.map(data => ({
      hour: data.hour,
      orders: Number(data.orders),
      revenue: Number(data.revenue) || 0
    }));
  }

  private static async getDailyRevenue(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const dailyData = await prisma.$queryRaw`
      SELECT 
        DATE("orderDate") as date,
        COUNT(*) as orders,
        SUM("totalAmount") as revenue
      FROM orders
      WHERE "tenantId" = ${tenantId}
        AND "orderDate" >= ${startDate}
        AND "orderDate" <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY DATE("orderDate")
      ORDER BY date
    ` as Array<{ date: Date; orders: bigint; revenue: any }>;

    return dailyData.map(data => ({
      date: data.date.toISOString().split('T')[0],
      revenue: Number(data.revenue) || 0,
      orders: Number(data.orders)
    }));
  }

  private static async getPaymentMethodsDistribution(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ method: string; count: number; amount: number; percentage: number }>> {
    const paymentData = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        tenantId,
        orderDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        },
        paymentMethod: { not: null }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const totalAmount = paymentData.reduce((sum, item) => sum + Number(item._sum.totalAmount), 0);

    return paymentData.map(item => ({
      method: item.paymentMethod || 'Unknown',
      count: item._count.id,
      amount: Number(item._sum.totalAmount),
      percentage: totalAmount > 0 ? (Number(item._sum.totalAmount) / totalAmount) * 100 : 0
    }));
  }

  private static async getTopCustomers(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ customerId: string; customerName: string; totalSpent: number; orderCount: number; lastVisit: string }>> {
    const topCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        orderDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        },
        customerId: { not: null }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      _max: {
        orderDate: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 10
    });

    // Get customer names
    const customerIds = topCustomers.map(c => c.customerId).filter(id => id !== null) as string[];
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        tenantId
      },
      select: {
        id: true,
        name: true
      }
    });

    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    return topCustomers.map(customer => ({
      customerId: customer.customerId || 'unknown',
      customerName: customerMap.get(customer.customerId || '') || 'Unknown Customer',
      totalSpent: Number(customer._sum.totalAmount),
      orderCount: customer._count.id,
      lastVisit: customer._max.orderDate?.toISOString().split('T')[0] || ''
    }));
  }

  private static async getCustomerSegments(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ segment: string; count: number; percentage: number; averageSpent: number }>> {
    // Get customer order data
    const customerData = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        orderDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED']
        },
        customerId: { not: null }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const totalCustomers = customerData.length;

    // Segment customers based on spending and frequency
    const segments = {
      'VIP': { count: 0, totalSpent: 0 },
      'Regular': { count: 0, totalSpent: 0 },
      'Occasional': { count: 0, totalSpent: 0 }
    };

    customerData.forEach(customer => {
      const totalSpent = Number(customer._sum.totalAmount);
      const orderCount = customer._count.id;

      if (totalSpent > 1000000 || orderCount > 10) { // VIP: > 1M or > 10 orders
        segments.VIP.count++;
        segments.VIP.totalSpent += totalSpent;
      } else if (totalSpent > 500000 || orderCount > 5) { // Regular: > 500K or > 5 orders
        segments.Regular.count++;
        segments.Regular.totalSpent += totalSpent;
      } else { // Occasional: others
        segments.Occasional.count++;
        segments.Occasional.totalSpent += totalSpent;
      }
    });

    return Object.entries(segments).map(([segment, data]) => ({
      segment,
      count: data.count,
      percentage: totalCustomers > 0 ? (data.count / totalCustomers) * 100 : 0,
      averageSpent: data.count > 0 ? data.totalSpent / data.count : 0
    }));
  }

  private static async getTopKitchenItems(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ itemName: string; orderCount: number; averagePrepTime: number }>> {
    const itemData = await prisma.orderItem.groupBy({
      by: ['itemName'],
      where: {
        tenantId,
        order: {
          orderDate: {
            gte: startDate,
            lte: endDate
          },
          status: {
            notIn: ['CANCELLED', 'REFUNDED']
          }
        },
        prepStartedAt: { not: null },
        prepCompletedAt: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get actual prep times for each item
    const itemsWithPrepTime = await Promise.all(
      itemData.map(async (item) => {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            tenantId,
            itemName: item.itemName,
            order: {
              orderDate: {
                gte: startDate,
                lte: endDate
              },
              status: {
                notIn: ['CANCELLED', 'REFUNDED']
              }
            },
            prepStartedAt: { not: null },
            prepCompletedAt: { not: null }
          },
          select: {
            prepStartedAt: true,
            prepCompletedAt: true
          }
        });

        const prepTimes = orderItems
          .map(oi => {
            if (oi.prepStartedAt && oi.prepCompletedAt) {
              return (oi.prepCompletedAt.getTime() - oi.prepStartedAt.getTime()) / (1000 * 60); // minutes
            }
            return null;
          })
          .filter(time => time !== null) as number[];

        const averagePrepTime = prepTimes.length > 0
          ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
          : 0;

        return {
          itemName: item.itemName,
          orderCount: item._count.id,
          averagePrepTime: Math.round(averagePrepTime * 10) / 10
        };
      })
    );

    return itemsWithPrepTime;
  }

  private static async getKitchenPerformanceByHour(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ hour: number; orders: number; averagePrepTime: number }>> {
    const hourlyData = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "orderDate") as hour,
        COUNT(*) as orders
      FROM orders
      WHERE "tenantId" = ${tenantId}
        AND "orderDate" >= ${startDate}
        AND "orderDate" <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
        AND "startedAt" IS NOT NULL
        AND "readyAt" IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM "orderDate")
      ORDER BY hour
    ` as Array<{ hour: number; orders: bigint }>;

    // Get average prep time for each hour
    const hourlyPerformance = await Promise.all(
      hourlyData.map(async (data) => {
        const orders = await prisma.order.findMany({
          where: {
            tenantId,
            orderDate: {
              gte: startDate,
              lte: endDate
            },
            status: {
              notIn: ['CANCELLED', 'REFUNDED']
            },
            startedAt: { not: null },
            readyAt: { not: null }
          },
          select: {
            startedAt: true,
            readyAt: true
          }
        });

        const prepTimes = orders
          .map(order => {
            if (order.startedAt && order.readyAt) {
              return (order.readyAt.getTime() - order.startedAt.getTime()) / (1000 * 60); // minutes
            }
            return null;
          })
          .filter(time => time !== null) as number[];

        const averagePrepTime = prepTimes.length > 0
          ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
          : 0;

        return {
          hour: data.hour,
          orders: Number(data.orders),
          averagePrepTime: Math.round(averagePrepTime * 10) / 10
        };
      })
    );

    return hourlyPerformance;
  }

  private static async getPeakHours(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ hour: number; utilization: number }>> {
    const hourlyData = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "orderDate") as hour,
        COUNT(*) as orders
      FROM orders
      WHERE "tenantId" = ${tenantId}
        AND "orderDate" >= ${startDate}
        AND "orderDate" <= ${endDate}
        AND status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY EXTRACT(HOUR FROM "orderDate")
      ORDER BY orders DESC
      LIMIT 6
    ` as Array<{ hour: number; orders: bigint }>;

    const maxOrders = Math.max(...hourlyData.map(d => Number(d.orders)));

    return hourlyData.map(data => ({
      hour: data.hour,
      utilization: maxOrders > 0 ? (Number(data.orders) / maxOrders) * 100 : 0
    }));
  }

  private static calculateGrowthPercentage(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private static getCapacityRecommendation(utilization: number): string {
    if (utilization >= 90) return 'بسیار پرترافیک - نیاز به میز اضافی';
    if (utilization >= 75) return 'پرترافیک - بهینه';
    if (utilization >= 50) return 'متوسط - بهینه';
    if (utilization >= 25) return 'کم - قابل بهبود';
    return 'بسیار کم - نیاز به بازاریابی';
  }

  // ==================== EXPORT FUNCTIONALITY ====================

  /**
   * Export analytics data to CSV format
   */
  static async exportToCSV(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    dataType: 'sales' | 'customers' | 'kitchen' | 'tables' | 'all'
  ): Promise<string> {
    try {
      console.log('📄 [ORDERING_ANALYTICS] Exporting to CSV:', { tenantId, dataType, startDate, endDate });

      let csvData = '';
      const headers = ['گزارش تحلیلی سیستم سفارش‌گیری', '', '', ''];
      const period = [`دوره: ${startDate.toLocaleDateString('fa-IR')} تا ${endDate.toLocaleDateString('fa-IR')}`, '', '', ''];
      const generatedAt = [`تاریخ تولید: ${new Date().toLocaleString('fa-IR')}`, '', '', ''];
      
      csvData += headers.join(',') + '\n';
      csvData += period.join(',') + '\n';
      csvData += generatedAt.join(',') + '\n\n';

      if (dataType === 'sales' || dataType === 'all') {
        const salesData = await this.getSalesSummary(tenantId, startDate, endDate);
        csvData += this.formatSalesDataForCSV(salesData);
        csvData += '\n\n';
      }

      if (dataType === 'customers' || dataType === 'all') {
        const customerData = await this.getCustomerAnalytics(tenantId, startDate, endDate);
        csvData += this.formatCustomerDataForCSV(customerData);
        csvData += '\n\n';
      }

      if (dataType === 'kitchen' || dataType === 'all') {
        const kitchenData = await this.getKitchenPerformance(tenantId, startDate, endDate);
        csvData += this.formatKitchenDataForCSV(kitchenData);
        csvData += '\n\n';
      }

      if (dataType === 'tables' || dataType === 'all') {
        const tableData = await this.getTableUtilization(tenantId, startDate, endDate);
        csvData += this.formatTableDataForCSV(tableData);
      }

      return csvData;
    } catch (error) {
      console.error('❌ [ORDERING_ANALYTICS] Error exporting to CSV:', error);
      throw new AppError('Failed to export analytics to CSV', 500, error);
    }
  }

  /**
   * Export analytics data to JSON format (for Excel conversion)
   */
  static async exportToJSON(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    dataType: 'sales' | 'customers' | 'kitchen' | 'tables' | 'all'
  ): Promise<any> {
    try {
      console.log('📊 [ORDERING_ANALYTICS] Exporting to JSON:', { tenantId, dataType, startDate, endDate });

      const exportData: any = {
        metadata: {
          title: 'گزارش تحلیلی سیستم سفارش‌گیری',
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            startDatePersian: startDate.toLocaleDateString('fa-IR'),
            endDatePersian: endDate.toLocaleDateString('fa-IR')
          },
          generatedAt: new Date().toISOString(),
          generatedAtPersian: new Date().toLocaleString('fa-IR'),
          tenantId
        }
      };

      if (dataType === 'sales' || dataType === 'all') {
        exportData.sales = await this.getSalesSummary(tenantId, startDate, endDate);
      }

      if (dataType === 'customers' || dataType === 'all') {
        exportData.customers = await this.getCustomerAnalytics(tenantId, startDate, endDate);
      }

      if (dataType === 'kitchen' || dataType === 'all') {
        exportData.kitchen = await this.getKitchenPerformance(tenantId, startDate, endDate);
      }

      if (dataType === 'tables' || dataType === 'all') {
        exportData.tables = await this.getTableUtilization(tenantId, startDate, endDate);
      }

      return exportData;
    } catch (error) {
      console.error('❌ [ORDERING_ANALYTICS] Error exporting to JSON:', error);
      throw new AppError('Failed to export analytics to JSON', 500, error);
    }
  }

  // ==================== PRIVATE CSV FORMATTING METHODS ====================

  private static formatSalesDataForCSV(data: SalesAnalytics): string {
    let csv = '=== گزارش فروش ===\n';
    csv += 'کل درآمد,کل سفارشات,میانگین سفارش,رشد درآمد (%),رشد سفارشات (%)\n';
    csv += `${data.totalRevenue},${data.totalOrders},${data.averageOrderValue},${data.revenueGrowth},${data.orderGrowth}\n\n`;
    
    csv += '=== محصولات پرفروش ===\n';
    csv += 'نام محصول,تعداد,درآمد,درصد\n';
    data.topSellingItems.forEach(item => {
      csv += `${item.itemName},${item.quantity},${item.revenue},${item.percentage}\n`;
    });
    csv += '\n';

    csv += '=== فروش ساعتی ===\n';
    csv += 'ساعت,تعداد سفارشات,درآمد\n';
    data.hourlyBreakdown.forEach(hour => {
      csv += `${hour.hour},${hour.orders},${hour.revenue}\n`;
    });
    csv += '\n';

    csv += '=== روش‌های پرداخت ===\n';
    csv += 'روش پرداخت,تعداد,مبلغ,درصد\n';
    data.paymentMethods.forEach(method => {
      csv += `${method.method},${method.count},${method.amount},${method.percentage}\n`;
    });

    return csv;
  }

  private static formatCustomerDataForCSV(data: CustomerAnalytics): string {
    let csv = '=== گزارش مشتریان ===\n';
    csv += 'کل مشتریان,مشتریان جدید,مشتریان تکراری,میانگین سفارش,رشد مشتریان (%)\n';
    csv += `${data.totalCustomers},${data.newCustomers},${data.repeatCustomers},${data.averageOrderValue},${data.customerGrowth}\n\n`;
    
    csv += '=== مشتریان برتر ===\n';
    csv += 'نام مشتری,کل هزینه,تعداد سفارش,آخرین بازدید\n';
    data.topCustomers.forEach(customer => {
      csv += `${customer.customerName},${customer.totalSpent},${customer.orderCount},${customer.lastVisit}\n`;
    });
    csv += '\n';

    csv += '=== بخش‌های مشتری ===\n';
    csv += 'بخش,تعداد,درصد,میانگین هزینه\n';
    data.customerSegments.forEach(segment => {
      csv += `${segment.segment},${segment.count},${segment.percentage},${segment.averageSpent}\n`;
    });

    return csv;
  }

  private static formatKitchenDataForCSV(data: KitchenPerformance): string {
    let csv = '=== گزارش عملکرد آشپزخانه ===\n';
    csv += 'کل سفارشات,میانگین زمان آماده‌سازی,تحویل به موقع (%),سفارشات تاخیری (%),کارایی\n';
    csv += `${data.totalOrders},${data.averagePrepTime},${data.onTimeDelivery},${data.delayedOrders},${data.efficiency}\n\n`;
    
    csv += '=== محصولات برتر ===\n';
    csv += 'نام محصول,تعداد سفارش,میانگین زمان آماده‌سازی\n';
    data.topItems.forEach(item => {
      csv += `${item.itemName},${item.orderCount},${item.averagePrepTime}\n`;
    });
    csv += '\n';

    csv += '=== عملکرد ساعتی ===\n';
    csv += 'ساعت,تعداد سفارشات,میانگین زمان آماده‌سازی\n';
    data.performanceByHour.forEach(hour => {
      csv += `${hour.hour},${hour.orders},${hour.averagePrepTime}\n`;
    });

    return csv;
  }

  private static formatTableDataForCSV(data: TableUtilization): string {
    let csv = '=== گزارش استفاده از میزها ===\n';
    csv += 'کل میزها,میانگین استفاده (%)\n';
    csv += `${data.totalTables},${data.averageUtilization}\n\n`;
    
    csv += '=== ساعات پیک ===\n';
    csv += 'ساعت,درصد استفاده\n';
    data.peakHours.forEach(hour => {
      csv += `${hour.hour},${hour.utilization}\n`;
    });
    csv += '\n';

    csv += '=== میزهای برتر ===\n';
    csv += 'شماره میز,درصد استفاده,درآمد,تعداد سفارش\n';
    data.topPerformingTables.forEach(table => {
      csv += `${table.tableNumber},${table.utilization},${table.revenue},${table.orderCount}\n`;
    });
    csv += '\n';

    csv += '=== بهینه‌سازی ظرفیت ===\n';
    csv += 'شماره میز,ظرفیت,درصد استفاده,توصیه\n';
    data.capacityOptimization.forEach(table => {
      csv += `${table.tableNumber},${table.capacity},${table.utilization},${table.recommendation}\n`;
    });

    return csv;
  }
}
