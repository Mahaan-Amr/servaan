import { PrismaClient, TableStatus, Table, TableReservation } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { tableCacheService } from './tableCacheService';
import { tableRealTimeService } from './tableRealTimeService';

const prisma = new PrismaClient();

export interface CreateTableData {
  tableNumber: string;
  tableName?: string;
  capacity: number;
  section?: string;
  floor: number;
  positionX?: number;
  positionY?: number;
}

export interface UpdateTableData {
  tableNumber?: string;
  tableName?: string;
  capacity?: number;
  section?: string;
  floor?: number;
  positionX?: number;
  positionY?: number;
  status?: TableStatus;
  isActive?: boolean;
}

export interface CreateReservationData {
  tableId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: Date;
  duration?: number;
  notes?: string;
}

export interface TableFilterOptions {
  section?: string;
  floor?: number;
  status?: TableStatus[];
  capacity?: {
    min?: number;
    max?: number;
  };
  isActive?: boolean;
}

export interface ReservationFilterOptions {
  tableId?: string;
  customerId?: string;
  date?: Date;
  status?: string[];
  startDate?: Date;
  endDate?: Date;
}

export class TableService {
  /**
   * Create a new table
   */
  static async createTable(tenantId: string, tableData: CreateTableData) {
    try {
      // Validate table number uniqueness
      const existingTable = await prisma.table.findFirst({
        where: {
          tenantId,
          tableNumber: tableData.tableNumber,
          isActive: true
        }
      });

      if (existingTable) {
        throw new AppError(`Table number ${tableData.tableNumber} already exists`, 400);
      }

      // Validate capacity
      if (tableData.capacity < 1 || tableData.capacity > 20) {
        throw new AppError('Table capacity must be between 1 and 20', 400);
      }

      const table = await prisma.table.create({
        data: {
          tenantId,
          tableNumber: tableData.tableNumber,
          tableName: tableData.tableName,
          capacity: tableData.capacity,
          section: tableData.section,
          floor: tableData.floor,
          positionX: tableData.positionX,
          positionY: tableData.positionY,
          status: TableStatus.AVAILABLE
        }
      });

      // Invalidate cache to ensure frontend gets updated data
      tableCacheService.invalidateTableCache(tenantId);
      tableCacheService.invalidateCache(`table_stats:${tenantId}`);

      return table;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create table', 500, error);
    }
  }

  /**
   * Get tables with optional filtering (with caching)
   */
  static async getTables(tenantId: string, options: TableFilterOptions = {}) {
    try {
      // Use cached data if available
      return await tableCacheService.getCachedTables(tenantId, options);
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw new AppError('Failed to get tables', 500, error);
    }
  }

  /**
   * Get table by ID with current order and reservations
   */
  static async getTableById(tenantId: string, tableId: string) {
    try {
      const table = await prisma.table.findFirst({
        where: {
          id: tableId,
          tenantId
        },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID']
              }
            },
            include: {
              items: {
                include: {
                  item: {
                    select: {
                      id: true,
                      name: true,
                      barcode: true
                    }
                  }
                }
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true
                }
              },
              payments: true
            },
            orderBy: {
              orderDate: 'desc'
            }
          },
          reservations: {
            where: {
              reservationDate: {
                gte: new Date()
              }
            },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              createdByUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: {
              reservationDate: 'asc'
            }
          }
        }
      });

      if (!table) {
        throw new AppError('Table not found', 404);
      }

      return table;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get table', 500, error);
    }
  }

  /**
   * Update table information
   */
  static async updateTable(tenantId: string, tableId: string, updateData: UpdateTableData) {
    try {
      // Validate table exists
      const existingTable = await prisma.table.findFirst({
        where: { id: tableId, tenantId }
      });

      if (!existingTable) {
        throw new AppError('Table not found', 404);
      }

      // Check table number uniqueness if being updated
      if (updateData.tableNumber && updateData.tableNumber !== existingTable.tableNumber) {
        const duplicateTable = await prisma.table.findFirst({
          where: {
            tenantId,
            tableNumber: updateData.tableNumber,
            isActive: true,
            id: { not: tableId }
          }
        });

        if (duplicateTable) {
          throw new AppError(`Table number ${updateData.tableNumber} already exists`, 400);
        }
      }

      // Validate capacity if being updated
      if (updateData.capacity !== undefined && (updateData.capacity < 1 || updateData.capacity > 20)) {
        throw new AppError('Table capacity must be between 1 and 20', 400);
      }

      // Validate status change
      if (updateData.status && updateData.status !== existingTable.status) {
        await this.validateStatusChange(tableId, existingTable.status, updateData.status);
      }

      const updatedTable = await prisma.table.update({
        where: { id: tableId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID']
              }
            },
            take: 1
          }
        }
      });

      // Invalidate cache to ensure frontend gets updated data
      tableCacheService.invalidateTableCache(tenantId);
      tableCacheService.invalidateCache(`table_stats:${tenantId}`);

      return updatedTable;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update table', 500, error);
    }
  }

  /**
   * Delete table (soft delete)
   */
  static async deleteTable(tenantId: string, tableId: string) {
    try {
      const existingTable = await prisma.table.findFirst({
        where: { id: tableId, tenantId },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID']
              }
            },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              customerName: true,
              totalAmount: true,
              orderDate: true
            }
          },
          reservations: {
            where: {
              status: 'CONFIRMED'
            },
            select: {
              id: true,
              customerName: true,
              reservationDate: true,
              guestCount: true
            }
          }
        }
      });

      if (!existingTable) {
        throw new AppError('Table not found', 404);
      }

      // Check if table has active orders
      if (existingTable.orders.length > 0) {
        const orderDetails = existingTable.orders.map(order => 
          `سفارش ${order.orderNumber} (${order.customerName || 'مشتری ناشناس'}) - ${order.status}`
        ).join(', ');
        
        throw new AppError(
          `Cannot delete table with active orders: ${orderDetails}`,
          400
        );
      }

      // Check if table has active reservations
      if (existingTable.reservations.length > 0) {
        const reservationDetails = existingTable.reservations.map(reservation => 
          `رزرو ${reservation.customerName} (${reservation.guestCount} نفر) - ${new Date(reservation.reservationDate).toLocaleDateString('fa-IR')}`
        ).join(', ');
        
        throw new AppError(
          `Cannot delete table with active reservations: ${reservationDetails}`,
          400
        );
      }

      // Soft delete by setting isActive to false
      await prisma.table.update({
        where: { id: tableId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Invalidate cache to ensure UI updates
      await tableCacheService.invalidateTableCache(tenantId, tableId);

      // Send real-time update for table deletion
      await tableRealTimeService.broadcastTableStatusUpdate(tenantId, {
        tableId,
        tableNumber: existingTable.tableNumber,
        oldStatus: existingTable.status,
        newStatus: 'DELETED' as TableStatus, // Special status for deletion
        updatedBy: 'system',
        updatedAt: new Date(),
        reason: 'Table deleted'
      });

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete table', 500, error);
    }
  }

  /**
   * Change table status
   */
  static async changeTableStatus(
    tenantId: string, 
    tableId: string, 
    status: TableStatus,
    reason?: string,
    updatedBy?: string
  ) {
    try {
      // Get current table info for real-time update
      const currentTable = await prisma.table.findUnique({
        where: { id: tableId },
        select: { tableNumber: true, status: true }
      });

      if (!currentTable) {
        throw new AppError('Table not found', 404);
      }

      const oldStatus = currentTable.status;

      // Update table status
      const updatedTable = await this.updateTable(tenantId, tableId, { status });

      // Invalidate cache
      await tableCacheService.invalidateTableCache(tenantId, tableId);

      // Send real-time update
      await tableRealTimeService.broadcastTableStatusUpdate(tenantId, {
        tableId,
        tableNumber: currentTable.tableNumber,
        oldStatus,
        newStatus: status,
        updatedBy: updatedBy || 'system',
        updatedAt: new Date(),
        reason
      });

      return updatedTable;
    } catch (error) {
      throw new AppError('Failed to change table status', 500, error);
    }
  }

  /**
   * Transfer order to another table
   */
  static async transferOrder(
    tenantId: string,
    orderId: string,
    newTableId: string,
    transferredBy: string
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get current order
        const order = await tx.order.findFirst({
          where: { id: orderId, tenantId },
          include: { table: true }
        });

        if (!order) {
          throw new AppError('Order not found', 404);
        }

        // Get new table
        const newTable = await tx.table.findFirst({
          where: { id: newTableId, tenantId, isActive: true }
        });

        if (!newTable) {
          throw new AppError('Target table not found', 404);
        }

        // Check if new table is available
        if (newTable.status !== TableStatus.AVAILABLE) {
          throw new AppError('Target table is not available', 400);
        }

        // Update order table
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            tableId: newTableId,
            notes: order.notes 
              ? `${order.notes}\n\nTransferred from Table ${order.table?.tableNumber} to Table ${newTable.tableNumber}`
              : `Transferred from Table ${order.table?.tableNumber} to Table ${newTable.tableNumber}`,
            updatedAt: new Date()
          }
        });

        // Update table statuses
        if (order.tableId) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: TableStatus.AVAILABLE }
          });
        }

        await tx.table.update({
          where: { id: newTableId },
          data: { status: TableStatus.OCCUPIED }
        });

        return updatedOrder;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to transfer order', 500, error);
    }
  }

  /**
   * Create table reservation
   */
  static async createReservation(
    tenantId: string,
    reservationData: CreateReservationData,
    createdBy: string
  ) {
    try {
      const reservation = await prisma.$transaction(async (tx) => {
        // Validate table exists and is active
        const table = await tx.table.findFirst({
          where: {
            id: reservationData.tableId,
            tenantId,
            isActive: true
          }
        });

        if (!table) {
          throw new AppError('Table not found', 404);
        }

        // Check table capacity
        if (reservationData.guestCount > table.capacity) {
          throw new AppError(
            `Guest count (${reservationData.guestCount}) exceeds table capacity (${table.capacity})`,
            400
          );
        }

        // Check for conflicting reservations
        const conflictingReservation = await this.checkReservationConflict(
          reservationData.tableId,
          reservationData.reservationDate,
          reservationData.duration || 120,
          tx
        );

        if (conflictingReservation) {
          throw new AppError('Table is already reserved for this time period', 400);
        }

        // Validate reservation time (not in the past, reasonable future)
        const now = new Date();
        const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        if (reservationData.reservationDate < now) {
          throw new AppError('Reservation cannot be in the past', 400);
        }

        if (reservationData.reservationDate > maxFutureDate) {
          throw new AppError('Reservation cannot be more than 30 days in advance', 400);
        }

        const reservation = await tx.tableReservation.create({
          data: {
            tenantId,
            tableId: reservationData.tableId,
            customerId: reservationData.customerId,
            customerName: reservationData.customerName,
            customerPhone: reservationData.customerPhone,
            guestCount: reservationData.guestCount,
            reservationDate: reservationData.reservationDate,
            duration: reservationData.duration || 120,
            status: 'CONFIRMED',
            notes: reservationData.notes,
            createdBy
          },
          include: {
            table: {
              select: {
                id: true,
                tableNumber: true,
                tableName: true,
                capacity: true,
                section: true
              }
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        });

        // Update table status if reservation is soon
        const timeDiff = reservationData.reservationDate.getTime() - now.getTime();
        const hoursUntilReservation = timeDiff / (1000 * 60 * 60);

        if (hoursUntilReservation <= 1 && table.status === TableStatus.AVAILABLE) {
          await tx.table.update({
            where: { id: reservationData.tableId },
            data: { status: TableStatus.RESERVED }
          });
        }

        return reservation;
      });

      // Invalidate cache to ensure frontend gets updated data
      tableCacheService.invalidateTableCache(tenantId);
      tableCacheService.invalidateCache(`table_stats:${tenantId}`);

      return reservation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create reservation', 500, error);
    }
  }

  /**
   * Get reservations with filtering
   */
  static async getReservations(
    tenantId: string,
    options: ReservationFilterOptions & {
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const {
        page = 1,
        limit = 20,
        ...filters
      } = options;

      const skip = (page - 1) * limit;
      const where: any = { tenantId };

      if (filters.tableId) {
        where.tableId = filters.tableId;
      }

      if (filters.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status };
      }

      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);

        where.reservationDate = {
          gte: startOfDay,
          lte: endOfDay
        };
      } else {
        if (filters.startDate || filters.endDate) {
          where.reservationDate = {};
          if (filters.startDate) {
            where.reservationDate.gte = filters.startDate;
          }
          if (filters.endDate) {
            where.reservationDate.lte = filters.endDate;
          }
        }
      }

      const [reservations, total] = await Promise.all([
        prisma.tableReservation.findMany({
          where,
          include: {
            table: {
              select: {
                id: true,
                tableNumber: true,
                tableName: true,
                capacity: true,
                section: true
              }
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true
              }
            },
            createdByUser: {
              select: {
                id: true,
                name: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            reservationDate: 'asc'
          }
        }),
        prisma.tableReservation.count({ where })
      ]);

      return {
        reservations,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to get reservations', 500, error);
    }
  }

  /**
   * Update reservation
   */
  static async updateReservation(
    tenantId: string,
    reservationId: string,
    updateData: Partial<CreateReservationData & { status: string }>
  ) {
    try {
      const existingReservation = await prisma.tableReservation.findFirst({
        where: { id: reservationId, tenantId },
        include: { table: true }
      });

      if (!existingReservation) {
        throw new AppError('Reservation not found', 404);
      }

      // Validate status change
      if (updateData.status && !['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(updateData.status)) {
        throw new AppError('Invalid reservation status', 400);
      }

      // Check for conflicts if time/table is being changed
      if (updateData.tableId || updateData.reservationDate || updateData.duration) {
        const tableId = updateData.tableId || existingReservation.tableId;
        const reservationDate = updateData.reservationDate || existingReservation.reservationDate;
        const duration = updateData.duration || existingReservation.duration;

        const conflictingReservation = await this.checkReservationConflict(
          tableId,
          reservationDate,
          duration,
          prisma,
          reservationId
        );

        if (conflictingReservation) {
          throw new AppError('Table is already reserved for this time period', 400);
        }
      }

      const updatedReservation = await prisma.tableReservation.update({
        where: { id: reservationId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          table: {
            select: {
              id: true,
              tableNumber: true,
              tableName: true,
              capacity: true,
              section: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      });

      // Invalidate cache to ensure frontend gets updated data
      tableCacheService.invalidateTableCache(tenantId);
      tableCacheService.invalidateCache(`table_stats:${tenantId}`);

      return updatedReservation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update reservation', 500, error);
    }
  }

  /**
   * Cancel reservation
   */
  static async cancelReservation(
    tenantId: string,
    reservationId: string,
    reason?: string
  ) {
    try {
      const result = await this.updateReservation(tenantId, reservationId, {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      });

      // Invalidate cache to ensure frontend gets updated data
      tableCacheService.invalidateTableCache(tenantId);
      tableCacheService.invalidateCache(`table_stats:${tenantId}`);

      return result;
    } catch (error) {
      throw new AppError('Failed to cancel reservation', 500, error);
    }
  }

  /**
   * Get table layout (for visual representation)
   */
  static async getTableLayout(tenantId: string) {
    try {
      const tables = await prisma.table.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID']
              }
            },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              guestCount: true,
              orderDate: true,
              totalAmount: true
            },
            take: 1
          }
        },
        orderBy: [
          { floor: 'asc' },
          { section: 'asc' },
          { tableNumber: 'asc' }
        ]
      });

      // Group by floor and section
      const layout = tables.reduce((acc: any, table) => {
        const floor = table.floor;
        const section = table.section || 'Main';

        if (!acc[floor]) acc[floor] = {};
        if (!acc[floor][section]) acc[floor][section] = [];

        acc[floor][section].push({
          ...table,
          currentOrder: table.orders[0] || null,
          isOccupied: table.orders.length > 0
        });

        return acc;
      }, {});

      return layout;
    } catch (error) {
      throw new AppError('Failed to get table layout', 500, error);
    }
  }

  /**
   * Get upcoming reservations (next 2 hours)
   */
  static async getUpcomingReservations(tenantId: string) {
    try {
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const reservations = await prisma.tableReservation.findMany({
        where: {
          tenantId,
          status: 'CONFIRMED',
          reservationDate: {
            gte: now,
            lte: twoHoursLater
          }
        },
        include: {
          table: {
            select: {
              id: true,
              tableNumber: true,
              section: true
            }
          }
        },
        orderBy: {
          reservationDate: 'asc'
        }
      });

      return reservations;
    } catch (error) {
      throw new AppError('Failed to get upcoming reservations', 500, error);
    }
  }

  /**
   * Private helper methods
   */
  private static async validateStatusChange(
    tableId: string,
    currentStatus: TableStatus,
    newStatus: TableStatus
  ) {
    // Check if table has active orders
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID']
        }
      }
    });

    // Allow setting to AVAILABLE even with active orders (needed for order creation flow)
    // The table status will be properly managed by the order creation/completion process
    
    // Cannot set to OCCUPIED without an active order
    if (newStatus === TableStatus.OCCUPIED && !activeOrder) {
      throw new AppError('Cannot set table to occupied without an active order', 400);
    }
  }

  private static async checkReservationConflict(
    tableId: string,
    reservationDate: Date,
    duration: number,
    prismaInstance: any,
    excludeReservationId?: string
  ): Promise<boolean> {
    const reservationStart = reservationDate;
    const reservationEnd = new Date(reservationDate.getTime() + duration * 60 * 1000);

    const where: any = {
      tableId,
      status: 'CONFIRMED',
      AND: [
        {
          reservationDate: {
            lt: reservationEnd
          }
        },
        {
          reservationDate: {
            gte: new Date(reservationStart.getTime() - 120 * 60 * 1000) // 2 hours buffer
          }
        }
      ]
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const conflictingReservation = await prismaInstance.tableReservation.findFirst({
      where
    });

    return !!conflictingReservation;
  }

  private static async getTablesSummary(tenantId: string) {
    const [totalTables, availableTables, occupiedTables, reservedTables, outOfOrderTables] = await Promise.all([
      prisma.table.count({
        where: { tenantId, isActive: true }
      }),
      prisma.table.count({
        where: { tenantId, isActive: true, status: TableStatus.AVAILABLE }
      }),
      prisma.table.count({
        where: { tenantId, isActive: true, status: TableStatus.OCCUPIED }
      }),
      prisma.table.count({
        where: { tenantId, isActive: true, status: TableStatus.RESERVED }
      }),
      prisma.table.count({
        where: { tenantId, isActive: true, status: TableStatus.OUT_OF_ORDER }
      })
    ]);

    const occupancyRate = totalTables > 0 ? (occupiedTables + reservedTables) / totalTables : 0;

    return {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      outOfOrderTables,
      occupancyRate: Math.round(occupancyRate * 100),
      cleaningTables: await prisma.table.count({
        where: { tenantId, isActive: true, status: TableStatus.CLEANING }
      })
    };
  }
} 
