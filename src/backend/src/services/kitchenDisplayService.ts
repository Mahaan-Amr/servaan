import { PrismaClient, OrderStatus, KitchenDisplay } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface CreateKitchenDisplayData {
  orderId: string;
  displayName: string;
  station: string;
  priority?: number;
  estimatedTime?: number;
}

export interface UpdateKitchenDisplayData {
  status?: OrderStatus;
  priority?: number;
  estimatedTime?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface KitchenDisplayFilterOptions {
  displayName?: string;
  station?: string;
  status?: OrderStatus[];
  priority?: number;
  orderDate?: Date;
}

export interface KitchenDisplayOrder {
  orderId: string;
  orderNumber: string;
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    modifiers: string[];
    specialRequest?: string;
    prepStatus: OrderStatus;
  }>;
  priority: number;
  estimatedTime: number;
  elapsedTime: number;
  status: OrderStatus;
  notes?: string;
  allergyInfo?: string;
  guestCount?: number;
}

export interface KitchenStation {
  name: string;
  displayName: string;
  isActive: boolean;
  orders: KitchenDisplayOrder[];
  averagePrepTime: number;
  currentLoad: number;
}

export class KitchenDisplayService {
  /**
   * Get kitchen display orders for a specific display/station
   */
  static async getKitchenDisplayOrders(
    tenantId: string,
    displayName: string,
    options: KitchenDisplayFilterOptions = {}
  ) {
    try {
      console.log('🍳 [KITCHEN_DISPLAY_SERVICE] Getting kitchen display orders:', {
        tenantId,
        displayName,
        options
      });

      const where: any = {
        tenantId,
        displayName
      };

      if (options.station) {
        where.station = options.station;
      }

      if (options.status && options.status.length > 0) {
        where.status = { in: options.status };
      } else {
        // By default, exclude completed orders
        where.status = {
          notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.SERVED]
        };
      }

      if (options.priority !== undefined) {
        where.priority = { gte: options.priority };
      }

      if (options.orderDate) {
        const startOfDay = new Date(options.orderDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(options.orderDate);
        endOfDay.setHours(23, 59, 59, 999);

        where.order = {
          orderDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }

      console.log('🍳 [KITCHEN_DISPLAY_SERVICE] Query where clause:', where);

      const kitchenDisplays = await prisma.kitchenDisplay.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: {
                  item: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                },
                orderBy: {
                  lineNumber: 'asc'
                }
              },
              table: {
                select: {
                  id: true,
                  tableNumber: true,
                  section: true
                }
              },
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { displayedAt: 'asc' }
        ]
      });

      console.log('🍳 [KITCHEN_DISPLAY_SERVICE] Found kitchen displays:', kitchenDisplays.length);

      // Transform to kitchen display format
      const kitchenOrders: KitchenDisplayOrder[] = kitchenDisplays.map(display => {
        const order = display.order;
        const now = new Date();
        const elapsedTime = Math.floor(
          (now.getTime() - new Date(display.displayedAt).getTime()) / (1000 * 60)
        );

        return {
          kitchenDisplayId: display.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          tableNumber: order.table?.tableNumber,
          customerName: order.customerName || 
            (order.customer ? order.customer.name : undefined),
          items: order.items.map((item: any) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            modifiers: this.parseModifiers(item.modifiers),
            specialRequest: item.specialRequest || undefined,
            prepStatus: item.prepStatus
          })),
          priority: display.priority,
          estimatedTime: display.estimatedTime || 0,
          elapsedTime,
          status: display.status,
          notes: order.kitchenNotes || order.notes || undefined,
          allergyInfo: order.allergyInfo || undefined,
          guestCount: order.guestCount || undefined
        };
      });

      console.log('🍳 [KITCHEN_DISPLAY_SERVICE] Returning kitchen orders:', kitchenOrders.length);
      return kitchenOrders;
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY_SERVICE] Error getting kitchen display orders:', error);
      throw new AppError('Failed to get kitchen display orders', 500, error);
    }
  }

  /**
   * Fix existing orders that have kitchen display entries with wrong status
   * This ensures all orders have proper kitchen display entries
   */
  static async fixExistingKitchenDisplayEntries(tenantId: string) {
    try {
      console.log('🔧 [KITCHEN_DISPLAY_SERVICE] Fixing existing kitchen display entries for tenant:', tenantId);

      // Get all orders that should have kitchen display entries but don't
      const ordersWithoutKitchenDisplay = await prisma.order.findMany({
        where: {
          tenantId,
          status: {
            in: ['SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY']
          },
          kitchenDisplays: {
            none: {}
          }
        }
      });

      console.log(`🔧 [KITCHEN_DISPLAY_SERVICE] Found ${ordersWithoutKitchenDisplay.length} orders without kitchen display entries`);

      let createdCount = 0;
      for (const order of ordersWithoutKitchenDisplay) {
        try {
          await this.createKitchenDisplayEntry(tenantId, {
            orderId: order.id,
            displayName: 'Main Kitchen',
            station: 'Main Kitchen',
            priority: 5,
            estimatedTime: 30
          });
          createdCount++;
          console.log(`✅ [KITCHEN_DISPLAY_SERVICE] Created kitchen display entry for order ${order.orderNumber}`);
        } catch (error) {
          console.error(`❌ [KITCHEN_DISPLAY_SERVICE] Failed to create kitchen display entry for order ${order.orderNumber}:`, error);
        }
      }

      // Also fix existing kitchen display entries with wrong status
      const kitchenDisplaysWithWrongStatus = await prisma.kitchenDisplay.findMany({
        where: {
          tenantId,
          status: 'PENDING', // These should be SUBMITTED
          order: {
            status: 'SUBMITTED'
          }
        },
        include: {
          order: true
        }
      });

      console.log(`🔧 [KITCHEN_DISPLAY_SERVICE] Found ${kitchenDisplaysWithWrongStatus.length} kitchen display entries with wrong status`);

      let fixedCount = 0;
      for (const display of kitchenDisplaysWithWrongStatus) {
        try {
          await prisma.kitchenDisplay.update({
            where: { id: display.id },
            data: { status: OrderStatus.SUBMITTED }
          });
          fixedCount++;
          console.log(`✅ [KITCHEN_DISPLAY_SERVICE] Fixed kitchen display status for order ${display.order.orderNumber}`);
        } catch (error) {
          console.error(`❌ [KITCHEN_DISPLAY_SERVICE] Failed to fix kitchen display status for order ${display.order.orderNumber}:`, error);
        }
      }

      console.log(`🔧 [KITCHEN_DISPLAY_SERVICE] Fix completed: ${createdCount} created, ${fixedCount} fixed`);
      return { created: createdCount, fixed: fixedCount };
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY_SERVICE] Error fixing existing kitchen display entries:', error);
      throw new AppError('Failed to fix existing kitchen display entries', 500, error);
    }
  }

  /**
   * Sync kitchen display status with main order status
   * This ensures completed orders are properly filtered out
   */
  static async syncKitchenDisplayWithOrderStatus(tenantId: string, orderId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the main order status
        const order = await tx.order.findFirst({
          where: { id: orderId, tenantId },
          select: { status: true }
        });

        if (!order) {
          throw new AppError('Order not found', 404);
        }

        // Update all kitchen displays for this order to match the main order status
        const updatedDisplays = await tx.kitchenDisplay.updateMany({
          where: {
            orderId,
            tenantId
          },
          data: {
            status: order.status,
            updatedAt: new Date(),
            ...(order.status === OrderStatus.COMPLETED && { completedAt: new Date() })
          }
        });

        console.log(`🔄 [KITCHEN_DISPLAY_SERVICE] Synced ${updatedDisplays.count} kitchen displays for order ${orderId} to status ${order.status}`);
        return updatedDisplays;
      });
    } catch (error) {
      console.error('❌ [KITCHEN_DISPLAY_SERVICE] Error syncing kitchen display with order status:', error);
      throw new AppError('Failed to sync kitchen display with order status', 500, error);
    }
  }

  /**
   * Get all kitchen stations with their current orders
   */
  static async getAllKitchenStations(tenantId: string) {
    try {
      // Get all active kitchen displays grouped by display name
      const displays = await prisma.kitchenDisplay.groupBy({
        by: ['displayName', 'station'],
        where: {
          tenantId,
          status: {
            notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.SERVED]
          }
        },
        _count: {
          id: true
        }
      });

      const stations: KitchenStation[] = [];

      // Get orders for each station
      for (const display of displays) {
        const orders = await this.getKitchenDisplayOrders(tenantId, display.displayName);
        
        // Calculate average prep time for this station
        const avgPrepTime = await this.calculateAveragePrepTime(
          tenantId, 
          display.displayName
        );

        stations.push({
          name: display.station,
          displayName: display.displayName,
          isActive: true,
          orders,
          averagePrepTime: avgPrepTime,
          currentLoad: display._count.id
        });
      }

      return stations;
    } catch (error) {
      throw new AppError('Failed to get kitchen stations', 500, error);
    }
  }

  /**
   * Update kitchen display status
   */
  static async updateKitchenDisplayStatus(
    tenantId: string,
    kitchenDisplayId: string,
    status: OrderStatus,
    updatedBy?: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const display = await tx.kitchenDisplay.findFirst({
          where: {
            id: kitchenDisplayId,
            tenantId
          },
          include: {
            order: true
          }
        });

        if (!display) {
          throw new AppError('Kitchen display not found', 404);
        }

        // Validate status transition
        this.validateKitchenStatusTransition(display.status, status);

        // Prepare update data
        const updateData: any = {
          status,
          updatedAt: new Date()
        };

        // Set timing fields based on status
        if (status === OrderStatus.PREPARING && !display.startedAt) {
          updateData.startedAt = new Date();
        } else if (status === OrderStatus.READY && !display.completedAt) {
          updateData.completedAt = new Date();
        }

        // Update kitchen display
        const updatedDisplay = await tx.kitchenDisplay.update({
          where: { id: kitchenDisplayId },
          data: updateData
        });

        // Update corresponding order items status if this is item-specific
        await tx.orderItem.updateMany({
          where: {
            orderId: display.orderId
          },
          data: {
            prepStatus: status,
            ...(status === OrderStatus.PREPARING && { prepStartedAt: new Date() }),
            ...(status === OrderStatus.READY && { prepCompletedAt: new Date() })
          }
        });

        // Check if all kitchen displays for this order are ready
        const allDisplays = await tx.kitchenDisplay.findMany({
          where: {
            orderId: display.orderId,
            tenantId
          }
        });

        const allReady = allDisplays.every(d => 
          d.id === kitchenDisplayId ? status === OrderStatus.READY : d.status === OrderStatus.READY
        );

        // If all kitchen stations are ready, update main order status
        if (allReady && status === OrderStatus.READY) {
          await tx.order.update({
            where: { id: display.orderId },
            data: {
              status: OrderStatus.READY,
              readyAt: new Date(),
              updatedAt: new Date()
            }
          });
        } else if (status === OrderStatus.PREPARING) {
          // Update main order to preparing if not already
          const currentOrder = await tx.order.findFirst({
            where: { id: display.orderId },
            select: { status: true }
          });

          if (currentOrder?.status === OrderStatus.CONFIRMED) {
            await tx.order.update({
              where: { id: display.orderId },
              data: {
                status: OrderStatus.PREPARING,
                startedAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }

        // Handle COMPLETED status - update main order and sync kitchen display
        if (status === OrderStatus.COMPLETED) {
          await tx.order.update({
            where: { id: display.orderId },
            data: {
              status: OrderStatus.COMPLETED,
              completedAt: new Date(),
              servedAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Update all kitchen displays for this order to COMPLETED
          await tx.kitchenDisplay.updateMany({
            where: {
              orderId: display.orderId,
              tenantId
            },
            data: {
              status: OrderStatus.COMPLETED,
              completedAt: new Date(),
              updatedAt: new Date()
            }
          });
        }

        return updatedDisplay;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update kitchen display status', 500, error);
    }
  }

  /**
   * Update kitchen display priority
   */
  static async updateKitchenDisplayPriority(
    tenantId: string,
    kitchenDisplayId: string,
    priority: number,
    reason?: string
  ) {
    try {
      const display = await prisma.kitchenDisplay.findFirst({
        where: {
          id: kitchenDisplayId,
          tenantId
        }
      });

      if (!display) {
        throw new AppError('Kitchen display not found', 404);
      }

      // Validate priority range
      if (priority < 0 || priority > 5) {
        throw new AppError('Priority must be between 0 and 5', 400);
      }

      const updatedDisplay = await prisma.kitchenDisplay.update({
        where: { id: kitchenDisplayId },
        data: {
          priority,
          updatedAt: new Date()
        }
      });

      // Also update the main order priority
      await prisma.order.update({
        where: { id: display.orderId },
        data: {
          priority,
          notes: reason ? 
            `Priority updated to ${priority}: ${reason}` : 
            undefined
        }
      });

      return updatedDisplay;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update priority', 500, error);
    }
  }

  /**
   * Get kitchen performance metrics
   */
  static async getKitchenPerformanceMetrics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.order = {
          orderDate: {}
        };
        if (startDate) {
          dateFilter.order.orderDate.gte = startDate;
        }
        if (endDate) {
          dateFilter.order.orderDate.lte = endDate;
        }
      }

      // Get completed kitchen displays
      const completedDisplays = await prisma.kitchenDisplay.findMany({
        where: {
          tenantId,
          status: OrderStatus.READY,
          completedAt: { not: null },
          startedAt: { not: null },
          ...dateFilter
        },
        include: {
          order: {
            select: {
              orderDate: true,
              totalAmount: true,
              guestCount: true
            }
          }
        }
      });

      if (completedDisplays.length === 0) {
        return {
          totalOrders: 0,
          averagePrepTime: 0,
          onTimeDelivery: 0,
          stationPerformance: []
        };
      }

      // Calculate metrics
      const prepTimes = completedDisplays.map(display => {
        const startTime = new Date(display.startedAt!).getTime();
        const endTime = new Date(display.completedAt!).getTime();
        return (endTime - startTime) / (1000 * 60); // minutes
      });

      const averagePrepTime = prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length;

      // Calculate on-time delivery (orders completed within estimated time)
      const onTimeOrders = completedDisplays.filter(display => {
        const actualTime = prepTimes[completedDisplays.indexOf(display)];
        const estimatedTime = display.estimatedTime || 30; // default 30 minutes
        return actualTime <= estimatedTime * 1.1; // 10% tolerance
      });

      const onTimeDeliveryRate = (onTimeOrders.length / completedDisplays.length) * 100;

      // Station performance breakdown
      const stationGroups = completedDisplays.reduce((acc: any, display) => {
        const station = display.station;
        if (!acc[station]) {
          acc[station] = [];
        }
        acc[station].push(display);
        return acc;
      }, {});

      const stationPerformance = (Object.entries(stationGroups) as [string, any[]][]).map(([station, displays]) => {
        const stationPrepTimes = displays.map((display: any) => {
          const startTime = new Date(display.startedAt!).getTime();
          const endTime = new Date(display.completedAt!).getTime();
          return (endTime - startTime) / (1000 * 60);
        });

        const avgPrepTime = stationPrepTimes.reduce((sum: number, time: number) => sum + time, 0) / stationPrepTimes.length;
        
        const stationOnTime = displays.filter((display: any) => {
          const actualTime = stationPrepTimes[displays.indexOf(display)];
          const estimatedTime = display.estimatedTime || 30;
          return actualTime <= estimatedTime * 1.1;
        });

        return {
          station,
          totalOrders: displays.length,
          averagePrepTime: Math.round(avgPrepTime),
          onTimeRate: Math.round((stationOnTime.length / displays.length) * 100),
          currentLoad: 0 // Would be calculated from active orders
        };
      });

      return {
        totalOrders: completedDisplays.length,
        averagePrepTime: Math.round(averagePrepTime),
        onTimeDelivery: Math.round(onTimeDeliveryRate),
        stationPerformance
      };
    } catch (error) {
      throw new AppError('Failed to get kitchen performance metrics', 500, error);
    }
  }

  /**
   * Get kitchen workload distribution
   */
  static async getKitchenWorkload(tenantId: string) {
    try {
      const workload = await prisma.kitchenDisplay.groupBy({
        by: ['displayName', 'station', 'status'],
        where: {
          tenantId,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
          }
        },
        _count: {
          id: true
        },
        _avg: {
          priority: true
        }
      });

      // Group by station
      const stationWorkload = workload.reduce((acc: any, item) => {
        const station = item.station;
        if (!acc[station]) {
          acc[station] = {
            station,
            pending: 0,
            preparing: 0,
            total: 0,
            averagePriority: 0
          };
        }

        acc[station].total += item._count.id;
        acc[station].averagePriority = item._avg.priority || 0;

        if (item.status === OrderStatus.PENDING || item.status === OrderStatus.CONFIRMED) {
          acc[station].pending += item._count.id;
        } else if (item.status === OrderStatus.PREPARING) {
          acc[station].preparing += item._count.id;
        }

        return acc;
      }, {});

      return Object.values(stationWorkload);
    } catch (error) {
      throw new AppError('Failed to get kitchen workload', 500, error);
    }
  }

  /**
   * Create kitchen display entry for new order
   */
  static async createKitchenDisplayEntry(
    tenantId: string,
    displayData: CreateKitchenDisplayData
  ) {
    try {
      // Validate order exists
      const order = await prisma.order.findFirst({
        where: {
          id: displayData.orderId,
          tenantId
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const display = await prisma.kitchenDisplay.create({
        data: {
          tenantId,
          orderId: displayData.orderId,
          displayName: displayData.displayName,
          station: displayData.station,
          status: OrderStatus.SUBMITTED, // Match the order's initial status
          priority: displayData.priority || 0,
          estimatedTime: displayData.estimatedTime
        }
      });

      return display;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create kitchen display entry', 500, error);
    }
  }

  /**
   * Remove kitchen display entry (when order is completed/cancelled)
   */
  static async removeKitchenDisplayEntry(
    tenantId: string,
    orderId: string,
    displayName?: string
  ) {
    try {
      const where: any = {
        tenantId,
        orderId
      };

      if (displayName) {
        where.displayName = displayName;
      }

      const deletedCount = await prisma.kitchenDisplay.deleteMany({
        where
      });

      return deletedCount;
    } catch (error) {
      throw new AppError('Failed to remove kitchen display entry', 500, error);
    }
  }

  /**
   * Get real-time kitchen dashboard data
   */
  static async getKitchenDashboard(tenantId: string) {
    try {
      const [activeOrders, completedToday, averageWaitTime, stationStatus] = await Promise.all([
        // Active orders count
        prisma.kitchenDisplay.count({
          where: {
            tenantId,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
            }
          }
        }),

        // Completed orders today
        prisma.kitchenDisplay.count({
          where: {
            tenantId,
            status: OrderStatus.READY,
            completedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),

        // Average wait time for orders in queue
        this.calculateCurrentAverageWaitTime(tenantId),

        // Station status
        this.getStationStatus(tenantId)
      ]);

      return {
        activeOrders,
        completedToday,
        averageWaitTime,
        stationStatus,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new AppError('Failed to get kitchen dashboard', 500, error);
    }
  }

  /**
   * Private helper methods
   */
  private static parseModifiers(modifiersJson: any): string[] {
    try {
      if (typeof modifiersJson === 'string') {
        return JSON.parse(modifiersJson).map((mod: any) => mod.name || mod);
      }
      if (Array.isArray(modifiersJson)) {
        return modifiersJson.map((mod: any) => mod.name || mod);
      }
      return [];
    } catch {
      return [];
    }
  }

  private static validateKitchenStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.SUBMITTED, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.SUBMITTED]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING],
      [OrderStatus.PREPARING]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.COMPLETED], // Allow completion from READY
      [OrderStatus.SERVED]: [],
      [OrderStatus.COMPLETED]: [], // Terminal state
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.MODIFIED]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.PARTIALLY_PAID]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING]
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        `Invalid kitchen status transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }
  }

  private static async calculateAveragePrepTime(
    tenantId: string,
    displayName: string,
    days: number = 7
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const completedDisplays = await prisma.kitchenDisplay.findMany({
      where: {
        tenantId,
        displayName,
        status: OrderStatus.READY,
        completedAt: { not: null },
        startedAt: { not: null },
        createdAt: { gte: startDate }
      }
    });

    if (completedDisplays.length === 0) return 0;

    const totalTime = completedDisplays.reduce((sum, display) => {
      const startTime = new Date(display.startedAt!).getTime();
      const endTime = new Date(display.completedAt!).getTime();
      return sum + (endTime - startTime);
    }, 0);

    return Math.round(totalTime / (completedDisplays.length * 1000 * 60)); // minutes
  }

  private static async calculateCurrentAverageWaitTime(tenantId: string): Promise<number> {
    const activeDisplays = await prisma.kitchenDisplay.findMany({
      where: {
        tenantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
        }
      }
    });

    if (activeDisplays.length === 0) return 0;

    const now = new Date();
    const totalWaitTime = activeDisplays.reduce((sum, display) => {
      const waitTime = now.getTime() - new Date(display.displayedAt).getTime();
      return sum + waitTime;
    }, 0);

    return Math.round(totalWaitTime / (activeDisplays.length * 1000 * 60)); // minutes
  }

  private static async getStationStatus(tenantId: string) {
    const stationData = await prisma.kitchenDisplay.groupBy({
      by: ['station'],
      where: {
        tenantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
        }
      },
      _count: { id: true }
    });

    return stationData.map(station => ({
      station: station.station,
      activeOrders: station._count.id,
      status: station._count.id > 5 ? 'busy' : station._count.id > 2 ? 'moderate' : 'light'
    }));
  }
} 
