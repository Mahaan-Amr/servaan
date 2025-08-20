import { Request, Response, NextFunction } from 'express';
import { TableService, CreateTableData, UpdateTableData, CreateReservationData, TableFilterOptions, ReservationFilterOptions } from '../services/tableService';
import { AppError } from '../utils/AppError';
import { TableStatus } from '../../../shared/generated/client';

export class TableController {
  /**
   * Create a new table
   * POST /api/tables
   */
  static async createTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { tableNumber, capacity } = req.body;

      if (!tableNumber || !capacity) {
        throw new AppError('Table number and capacity are required', 400);
      }

      if (capacity < 1 || capacity > 20) {
        throw new AppError('Capacity must be between 1 and 20', 400);
      }

      const tableData: CreateTableData = {
        tableNumber: tableNumber.toString(),
        tableName: req.body.tableName,
        capacity: parseInt(capacity),
        section: req.body.section,
        floor: parseInt(req.body.floor) || 1,
        positionX: req.body.positionX ? parseFloat(req.body.positionX) : undefined,
        positionY: req.body.positionY ? parseFloat(req.body.positionY) : undefined
      };

      const table = await TableService.createTable(tenantId, tableData);

      res.status(201).json({
        success: true,
        data: table,
        message: 'Table created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tables with filtering
   * GET /api/tables
   */
  static async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      // Build filter options
      const filters: TableFilterOptions = {};

      if (req.query.section) {
        filters.section = req.query.section as string;
      }

      if (req.query.floor) {
        filters.floor = parseInt(req.query.floor as string);
      }

      if (req.query.status) {
        const statusArray = Array.isArray(req.query.status)
          ? req.query.status as TableStatus[]
          : [req.query.status as TableStatus];
        filters.status = statusArray.filter(status => Object.values(TableStatus).includes(status));
      }

      if (req.query.minCapacity || req.query.maxCapacity) {
        filters.capacity = {};
        if (req.query.minCapacity) {
          filters.capacity.min = parseInt(req.query.minCapacity as string);
        }
        if (req.query.maxCapacity) {
          filters.capacity.max = parseInt(req.query.maxCapacity as string);
        }
      }

      if (req.query.includeInactive === 'true') {
        filters.isActive = undefined; // Include both active and inactive
      }

      const result = await TableService.getTables(tenantId, filters);

      // Handle both old format (with tables and summary) and new format (just tables array)
      const tables = Array.isArray(result) ? result : (result as any).tables;
      const summary = Array.isArray(result) ? null : (result as any).summary;

      res.json({
        success: true,
        data: tables,
        summary: summary,
        message: 'Tables retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table by ID
   * GET /api/tables/:id
   */
  static async getTableById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      const table = await TableService.getTableById(tenantId, tableId);

      res.json({
        success: true,
        data: table,
        message: 'Table retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update table
   * PUT /api/tables/:id
   */
  static async updateTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      // Validate capacity if provided
      if (req.body.capacity !== undefined && (req.body.capacity < 1 || req.body.capacity > 20)) {
        throw new AppError('Capacity must be between 1 and 20', 400);
      }

      // Validate status if provided
      if (req.body.status && !Object.values(TableStatus).includes(req.body.status)) {
        throw new AppError('Invalid table status', 400);
      }

      const updateData: UpdateTableData = {
        tableNumber: req.body.tableNumber?.toString(),
        tableName: req.body.tableName,
        capacity: req.body.capacity ? parseInt(req.body.capacity) : undefined,
        section: req.body.section,
        floor: req.body.floor ? parseInt(req.body.floor) : undefined,
        positionX: req.body.positionX ? parseFloat(req.body.positionX) : undefined,
        positionY: req.body.positionY ? parseFloat(req.body.positionY) : undefined,
        status: req.body.status,
        isActive: req.body.isActive
      };

      const updatedTable = await TableService.updateTable(tenantId, tableId, updateData);

      res.json({
        success: true,
        data: updatedTable,
        message: 'Table updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete table
   * DELETE /api/tables/:id
   */
  static async deleteTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      await TableService.deleteTable(tenantId, tableId);

      res.json({
        success: true,
        message: 'Table deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change table status
   * PATCH /api/tables/:id/status
   */
  static async changeTableStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.id;
      const { status, reason } = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      if (!status || !Object.values(TableStatus).includes(status)) {
        throw new AppError('Valid status is required', 400);
      }

      const updatedTable = await TableService.changeTableStatus(tenantId, tableId, status, reason);

      res.json({
        success: true,
        data: updatedTable,
        message: `Table status changed to ${status}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer order to another table
   * POST /api/tables/:tableId/transfer
   */
  static async transferOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const transferredBy = req.user?.id;
      const newTableId = req.params.tableId;
      const { orderId } = req.body;

      if (!tenantId || !transferredBy) {
        throw new AppError('Authentication required', 401);
      }

      if (!newTableId || !orderId) {
        throw new AppError('Table ID and Order ID are required', 400);
      }

      const updatedOrder = await TableService.transferOrder(
        tenantId,
        orderId,
        newTableId,
        transferredBy
      );

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order transferred successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table layout (for visual representation)
   * GET /api/tables/layout
   */
  static async getTableLayout(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const layout = await TableService.getTableLayout(tenantId);

      res.json({
        success: true,
        data: layout,
        message: 'Table layout retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available tables for specific time and guest count
   * GET /api/tables/available
   */
  static async getAvailableTables(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const guestCount = parseInt(req.query.guestCount as string) || 1;
      const dateTime = req.query.dateTime ? new Date(req.query.dateTime as string) : new Date();

      // Get tables that can accommodate the guest count
      const filters: TableFilterOptions = {
        status: [TableStatus.AVAILABLE],
        capacity: { min: guestCount }
      };

      const result = await TableService.getTables(tenantId, filters);

      // Handle both old format (with tables and summary) and new format (just tables array)
      const tables = Array.isArray(result) ? result : (result as any).tables;

      // Filter out tables with conflicting reservations (this logic can be enhanced)
      const availableTables = tables.filter((table: any) => {
        // Check if table has upcoming reservations
        return !table.nextReservation || 
               new Date(table.nextReservation.reservationDate) > dateTime;
      });

      res.json({
        success: true,
        data: availableTables,
        message: 'Available tables retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================== RESERVATION ENDPOINTS =====================

  /**
   * Create table reservation
   * POST /api/tables/reservations
   */
  static async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        throw new AppError('Authentication required', 401);
      }

      const { tableId, customerName, customerPhone, guestCount, reservationDate } = req.body;

      if (!tableId || !customerName || !customerPhone || !guestCount || !reservationDate) {
        throw new AppError('Table ID, customer name, phone, guest count, and reservation date are required', 400);
      }

      if (guestCount < 1 || guestCount > 20) {
        throw new AppError('Guest count must be between 1 and 20', 400);
      }

      const reservationDateTime = new Date(reservationDate);
      if (reservationDateTime < new Date()) {
        throw new AppError('Reservation date cannot be in the past', 400);
      }

      const reservationData: CreateReservationData = {
        tableId,
        customerId: req.body.customerId,
        customerName,
        customerPhone,
        guestCount: parseInt(guestCount),
        reservationDate: reservationDateTime,
        duration: req.body.duration ? parseInt(req.body.duration) : 120,
        notes: req.body.notes
      };

      const reservation = await TableService.createReservation(tenantId, reservationData, createdBy);

      res.status(201).json({
        success: true,
        data: reservation,
        message: 'Reservation created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reservations with filtering
   * GET /api/tables/reservations
   */
  static async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: ReservationFilterOptions = {};

      if (req.query.tableId) {
        filters.tableId = req.query.tableId as string;
      }

      if (req.query.customerId) {
        filters.customerId = req.query.customerId as string;
      }

      if (req.query.date) {
        filters.date = new Date(req.query.date as string);
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.status) {
        const statusArray = Array.isArray(req.query.status)
          ? req.query.status as string[]
          : [req.query.status as string];
        filters.status = statusArray;
      }

      const result = await TableService.getReservations(tenantId, {
        ...filters,
        page,
        limit
      });

      res.json({
        success: true,
        data: result.reservations,
        pagination: result.pagination,
        message: 'Reservations retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update reservation
   * PUT /api/tables/reservations/:id
   */
  static async updateReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const reservationId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!reservationId) {
        throw new AppError('Reservation ID is required', 400);
      }

      // Validate guest count if provided
      if (req.body.guestCount !== undefined && (req.body.guestCount < 1 || req.body.guestCount > 20)) {
        throw new AppError('Guest count must be between 1 and 20', 400);
      }

      // Validate reservation date if provided
      if (req.body.reservationDate) {
        const reservationDateTime = new Date(req.body.reservationDate);
        if (reservationDateTime < new Date()) {
          throw new AppError('Reservation date cannot be in the past', 400);
        }
      }

      const updateData = {
        tableId: req.body.tableId,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        guestCount: req.body.guestCount ? parseInt(req.body.guestCount) : undefined,
        reservationDate: req.body.reservationDate ? new Date(req.body.reservationDate) : undefined,
        duration: req.body.duration ? parseInt(req.body.duration) : undefined,
        status: req.body.status,
        notes: req.body.notes
      };

      const updatedReservation = await TableService.updateReservation(
        tenantId,
        reservationId,
        updateData
      );

      res.json({
        success: true,
        data: updatedReservation,
        message: 'Reservation updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel reservation
   * POST /api/tables/reservations/:id/cancel
   */
  static async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const reservationId = req.params.id;
      const { reason } = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!reservationId) {
        throw new AppError('Reservation ID is required', 400);
      }

      const cancelledReservation = await TableService.cancelReservation(
        tenantId,
        reservationId,
        reason
      );

      res.json({
        success: true,
        data: cancelledReservation,
        message: 'Reservation cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming reservations
   * GET /api/tables/reservations/upcoming
   */
  static async getUpcomingReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const reservations = await TableService.getUpcomingReservations(tenantId);

      res.json({
        success: true,
        data: reservations,
        message: 'Upcoming reservations retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's reservations
   * GET /api/tables/reservations/today
   */
  static async getTodaysReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const today = new Date();
      const result = await TableService.getReservations(tenantId, {
        date: today,
        page: 1,
        limit: 100
      });

      res.json({
        success: true,
        data: result.reservations,
        message: 'Today\'s reservations retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark table as occupied (when customer arrives)
   * POST /api/tables/:id/occupy
   */
  static async occupyTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.id;
      const { reservationId } = req.body;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      const updatedTable = await TableService.changeTableStatus(
        tenantId,
        tableId,
        TableStatus.OCCUPIED,
        reservationId ? `Customer arrived for reservation ${reservationId}` : 'Walk-in customer'
      );

      // If there's a reservation, mark it as completed
      if (reservationId) {
        await TableService.updateReservation(tenantId, reservationId, {
          status: 'COMPLETED'
        });
      }

      res.json({
        success: true,
        data: updatedTable,
        message: 'Table marked as occupied'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear table (when customers leave)
   * POST /api/tables/:id/clear
   */
  static async clearTable(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const tableId = req.params.id;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      if (!tableId) {
        throw new AppError('Table ID is required', 400);
      }

      // First set to cleaning, then available after a delay or manual confirmation
      const updatedTable = await TableService.changeTableStatus(
        tenantId,
        tableId,
        TableStatus.CLEANING,
        'Table cleared, ready for cleaning'
      );

      res.json({
        success: true,
        data: updatedTable,
        message: 'Table marked for cleaning'
      });
    } catch (error) {
      next(error);
    }
  }
} 