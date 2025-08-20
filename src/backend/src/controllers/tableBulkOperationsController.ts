import { Request, Response, NextFunction } from 'express';
import { TableBulkOperationsService, BulkStatusChangeRequest, BulkReservationRequest, TableImportData } from '../services/tableBulkOperationsService';
import { AppError } from '../utils/AppError';

export class TableBulkOperationsController {
  /**
   * Bulk table status change
   * POST /api/tables/bulk/status
   */
  static async bulkChangeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { tableIds, newStatus, reason, notes, assignedStaff } = req.body;

      if (!tableIds || !Array.isArray(tableIds) || tableIds.length === 0) {
        throw new AppError('Table IDs array is required', 400);
      }

      if (!newStatus) {
        throw new AppError('New status is required', 400);
      }

      const request: BulkStatusChangeRequest = {
        tableIds,
        newStatus,
        reason,
        notes,
        assignedStaff
      };

      const result = await TableBulkOperationsService.bulkChangeStatus(tenantId, request);

      res.json({
        success: true,
        data: result,
        message: `Bulk status change completed. ${result.summary.successful} successful, ${result.summary.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk reservation creation
   * POST /api/tables/bulk/reservations
   */
  static async bulkCreateReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { reservations, template } = req.body;

      if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
        throw new AppError('Reservations array is required', 400);
      }

      // Validate each reservation
      for (const reservation of reservations) {
        if (!reservation.tableId || !reservation.customerName || !reservation.customerPhone || !reservation.guestCount || !reservation.reservationDate) {
          throw new AppError('Invalid reservation data. All fields are required', 400);
        }
      }

      const request: BulkReservationRequest = {
        reservations: reservations.map(r => ({
          ...r,
          reservationDate: new Date(r.reservationDate),
          duration: r.duration || 120
        })),
        template
      };

      const result = await TableBulkOperationsService.bulkCreateReservations(tenantId, request);

      res.json({
        success: true,
        data: result,
        message: `Bulk reservation creation completed. ${result.summary.successful} successful, ${result.summary.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import tables from data
   * POST /api/tables/bulk/import
   */
  static async importTables(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { tables } = req.body;

      if (!tables || !Array.isArray(tables) || tables.length === 0) {
        throw new AppError('Tables array is required', 400);
      }

      // Validate each table
      for (const table of tables) {
        if (!table.tableNumber || !table.capacity || !table.floor) {
          throw new AppError('Invalid table data. Table number, capacity, and floor are required', 400);
        }
      }

      const tableData: TableImportData[] = tables.map(t => ({
        tableNumber: t.tableNumber,
        tableName: t.tableName,
        capacity: parseInt(t.capacity),
        section: t.section,
        floor: parseInt(t.floor),
        positionX: t.positionX ? parseFloat(t.positionX) : undefined,
        positionY: t.positionY ? parseFloat(t.positionY) : undefined,
        status: t.status
      }));

      const result = await TableBulkOperationsService.importTables(tenantId, tableData);

      res.json({
        success: true,
        data: result,
        message: `Table import completed. ${result.summary.successful} successful, ${result.summary.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export tables data
   * GET /api/tables/bulk/export
   */
  static async exportTables(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const options = {
        includeInactive: req.query.includeInactive === 'true',
        sections: req.query.sections ? (req.query.sections as string).split(',') : undefined,
        floors: req.query.floors ? (req.query.floors as string).split(',').map(f => parseInt(f)) : undefined
      };

      const result = await TableBulkOperationsService.exportTables(tenantId, options);

      res.json({
        success: true,
        data: result,
        message: `Table export completed. ${result.summary.total} tables exported`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available table templates
   * GET /api/tables/bulk/templates
   */
  static async getTableTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await TableBulkOperationsService.getTableTemplates();

      res.json({
        success: true,
        data: templates,
        message: 'Table templates retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create tables from template
   * POST /api/tables/bulk/templates/:templateId
   */
  static async createTablesFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { templateId } = req.params;
      const { prefix, startNumber, sections, floors } = req.body;

      const options = {
        prefix: prefix || '',
        startNumber: startNumber ? parseInt(startNumber) : 1,
        sections: sections ? (Array.isArray(sections) ? sections : [sections]) : undefined,
        floors: floors ? (Array.isArray(floors) ? floors.map(f => parseInt(f)) : [parseInt(floors)]) : undefined
      };

      const result = await TableBulkOperationsService.createTablesFromTemplate(tenantId, templateId, options);

      res.json({
        success: true,
        data: result,
        message: `Tables created from template. ${result.summary.successful} successful, ${result.summary.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table status history
   * GET /api/tables/:tableId/status-history
   */
  static async getTableStatusHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { tableId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { PrismaClient } = require('../../../shared/generated/client');
      const prisma = new PrismaClient();

      const statusHistory = await prisma.tableStatusLog.findMany({
        where: {
          tenantId,
          tableId
        },
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          changedAt: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      });

      const total = await prisma.tableStatusLog.count({
        where: {
          tenantId,
          tableId
        }
      });

      res.json({
        success: true,
        data: {
          statusHistory,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        },
        message: 'Table status history retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 