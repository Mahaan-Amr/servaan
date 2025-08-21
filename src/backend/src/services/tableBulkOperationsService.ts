import { PrismaClient, TableStatus, Table, TableReservation } from '../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { TableService } from './tableService';
import { tableCacheService } from './tableCacheService';

const prisma = new PrismaClient();

export interface BulkStatusChangeRequest {
  tableIds: string[];
  newStatus: TableStatus;
  reason?: string;
  notes?: string;
  assignedStaff?: string;
}

export interface BulkStatusChangeResult {
  success: boolean;
  tableId: string;
  tableNumber: string;
  oldStatus: TableStatus;
  newStatus: TableStatus;
  error?: string;
}

export interface BulkReservationRequest {
  reservations: Array<{
    tableId: string;
    customerName: string;
    customerPhone: string;
    guestCount: number;
    reservationDate: Date;
    duration?: number;
    notes?: string;
  }>;
  template?: string;
}

export interface BulkReservationResult {
  success: boolean;
  tableId: string;
  tableNumber: string;
  customerName: string;
  reservationId?: string;
  error?: string;
}

export interface TableImportData {
  tableNumber: string;
  tableName?: string;
  capacity: number;
  section?: string;
  floor: number;
  positionX?: number;
  positionY?: number;
  status?: TableStatus;
}

export interface TableImportResult {
  success: boolean;
  tableNumber: string;
  tableId?: string;
  error?: string;
  warnings?: string[];
}

export interface TableTemplate {
  id: string;
  name: string;
  description: string;
  tables: Array<{
    tableNumber: string;
    tableName?: string;
    capacity: number;
    section: string;
    floor: number;
    positionX?: number;
    positionY?: number;
  }>;
  totalTables: number;
  totalCapacity: number;
}

export class TableBulkOperationsService {
  /**
   * Bulk table status change with conflict detection
   */
  static async bulkChangeStatus(
    tenantId: string,
    request: BulkStatusChangeRequest
  ): Promise<{
    results: BulkStatusChangeResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      conflicts: number;
    };
  }> {
    const results: BulkStatusChangeResult[] = [];
    let successful = 0;
    let failed = 0;
    let conflicts = 0;

    // Get all tables to validate
    const tables = await prisma.table.findMany({
      where: {
        id: { in: request.tableIds },
        tenantId
      },
      include: {
        reservations: {
          where: {
            reservationDate: {
              gte: new Date()
            }
          }
        }
      }
    });

    // Process each table
    for (const table of tables) {
      try {
        // Check for conflicts
        const conflicts = await this.checkTableStatusConflicts(table, request.newStatus);
        
        if (conflicts.length > 0) {
          results.push({
            success: false,
            tableId: table.id,
            tableNumber: table.tableNumber,
            oldStatus: table.status,
            newStatus: request.newStatus,
            error: `Conflicts detected: ${conflicts.join(', ')}`
          });
          failed++;
          continue;
        }

        // Change status
        const updatedTable = await prisma.table.update({
          where: { id: table.id },
          data: {
            status: request.newStatus,
            updatedAt: new Date()
          }
        });

        // Log the status change
        await prisma.tableStatusLog.create({
          data: {
            tenantId,
            tableId: table.id,
            oldStatus: table.status,
            newStatus: request.newStatus,
            reason: request.reason,
            notes: request.notes,
            changedBy: request.assignedStaff || 'system',
            changedAt: new Date()
          }
        });

        results.push({
          success: true,
          tableId: table.id,
          tableNumber: table.tableNumber,
          oldStatus: table.status,
          newStatus: request.newStatus
        });
        successful++;

      } catch (error) {
        results.push({
          success: false,
          tableId: table.id,
          tableNumber: table.tableNumber,
          oldStatus: table.status,
          newStatus: request.newStatus,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    // Invalidate cache to ensure frontend gets updated data after bulk status changes
    if (successful > 0) {
      await tableCacheService.invalidateTableCache(tenantId);
    }

    return {
      results,
      summary: {
        total: request.tableIds.length,
        successful,
        failed,
        conflicts
      }
    };
  }

  /**
   * Bulk reservation creation
   */
  static async bulkCreateReservations(
    tenantId: string,
    request: BulkReservationRequest
  ): Promise<{
    results: BulkReservationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      conflicts: number;
    };
  }> {
    const results: BulkReservationResult[] = [];
    let successful = 0;
    let failed = 0;
    let conflicts = 0;

    for (const reservationData of request.reservations) {
      try {
        // Check for conflicts
        const hasConflict = await prisma.tableReservation.findFirst({
          where: {
            tableId: reservationData.tableId,
            reservationDate: {
              gte: reservationData.reservationDate,
              lt: new Date(reservationData.reservationDate.getTime() + (reservationData.duration || 120) * 60 * 1000)
            },
            status: 'CONFIRMED'
          }
        });

        if (hasConflict) {
          results.push({
            success: false,
            tableId: reservationData.tableId,
            tableNumber: '', // Will be filled below
            customerName: reservationData.customerName,
            error: 'Reservation time conflict detected'
          });
          failed++;
          conflicts++;
          continue;
        }

        // Create reservation
        const reservation = await prisma.tableReservation.create({
          data: {
            tenantId,
            tableId: reservationData.tableId,
            customerName: reservationData.customerName,
            customerPhone: reservationData.customerPhone,
            guestCount: reservationData.guestCount,
            reservationDate: reservationData.reservationDate,
            duration: reservationData.duration || 120,
            notes: reservationData.notes,
            status: 'CONFIRMED',
            createdBy: 'system'
          }
        });

        // Get table number for result
        const table = await prisma.table.findUnique({
          where: { id: reservationData.tableId },
          select: { tableNumber: true }
        });

        results.push({
          success: true,
          tableId: reservationData.tableId,
          tableNumber: table?.tableNumber || '',
          customerName: reservationData.customerName,
          reservationId: reservation.id
        });
        successful++;

      } catch (error) {
        results.push({
          success: false,
          tableId: reservationData.tableId,
          tableNumber: '',
          customerName: reservationData.customerName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    // Invalidate cache to ensure frontend gets updated data after bulk reservation creation
    if (successful > 0) {
      await tableCacheService.invalidateTableCache(tenantId);
    }

    return {
      results,
      summary: {
        total: request.reservations.length,
        successful,
        failed,
        conflicts
      }
    };
  }

  /**
   * Import tables from CSV/Excel data
   */
  static async importTables(
    tenantId: string,
    tableData: TableImportData[]
  ): Promise<{
    results: TableImportResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      warnings: number;
    };
  }> {
    const results: TableImportResult[] = [];
    let successful = 0;
    let failed = 0;
    let warnings = 0;

    for (const data of tableData) {
      try {
        // Validate data
        const validationErrors = this.validateTableImportData(data);
        if (validationErrors.length > 0) {
          results.push({
            success: false,
            tableNumber: data.tableNumber,
            error: validationErrors.join(', ')
          });
          failed++;
          continue;
        }

        // Check for duplicate table number
        const existingTable = await prisma.table.findFirst({
          where: {
            tenantId,
            tableNumber: data.tableNumber,
            isActive: true
          }
        });

        if (existingTable) {
          results.push({
            success: false,
            tableNumber: data.tableNumber,
            error: 'Table number already exists'
          });
          failed++;
          continue;
        }

        // Create table
        const table = await prisma.table.create({
          data: {
            tenantId,
            tableNumber: data.tableNumber,
            tableName: data.tableName,
            capacity: data.capacity,
            section: data.section,
            floor: data.floor,
            positionX: data.positionX,
            positionY: data.positionY,
            status: data.status || TableStatus.AVAILABLE,
            isActive: true
          }
        });

        const warningsList: string[] = [];
        if (!data.section) {
          warningsList.push('No section specified');
        }
        if (!data.positionX || !data.positionY) {
          warningsList.push('No position coordinates specified');
        }

        results.push({
          success: true,
          tableNumber: data.tableNumber,
          tableId: table.id,
          warnings: warningsList.length > 0 ? warningsList : undefined
        });
        successful++;
        if (warningsList.length > 0) warnings++;

      } catch (error) {
        results.push({
          success: false,
          tableNumber: data.tableNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return {
      results,
      summary: {
        total: tableData.length,
        successful,
        failed,
        warnings
      }
    };
  }

  /**
   * Export tables data
   */
  static async exportTables(
    tenantId: string,
    options: {
      includeInactive?: boolean;
      sections?: string[];
      floors?: number[];
    } = {}
  ): Promise<{
    tables: Array<{
      id: string;
      tableNumber: string;
      tableName?: string;
      capacity: number;
      section?: string;
      floor: number;
      positionX?: number;
      positionY?: number;
      status: TableStatus;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    summary: {
      total: number;
      active: number;
      inactive: number;
      sections: string[];
      floors: number[];
    };
  }> {
    const whereClause: any = { tenantId };

    if (!options.includeInactive) {
      whereClause.isActive = true;
    }

    if (options.sections && options.sections.length > 0) {
      whereClause.section = { in: options.sections };
    }

    if (options.floors && options.floors.length > 0) {
      whereClause.floor = { in: options.floors };
    }

    const tables = await prisma.table.findMany({
      where: whereClause,
      orderBy: [
        { floor: 'asc' },
        { section: 'asc' },
        { tableNumber: 'asc' }
      ]
    });

    const sections = Array.from(new Set(tables.map(t => t.section).filter((s): s is string => s !== null)));
    const floors = Array.from(new Set(tables.map(t => t.floor)));

    return {
      tables: tables.map(table => ({
        id: table.id,
        tableNumber: table.tableNumber,
        tableName: table.tableName || undefined,
        capacity: table.capacity,
        section: table.section || undefined,
        floor: table.floor,
        positionX: table.positionX || undefined,
        positionY: table.positionY || undefined,
        status: table.status,
        isActive: table.isActive,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt
      })),
      summary: {
        total: tables.length,
        active: tables.filter(t => t.isActive).length,
        inactive: tables.filter(t => !t.isActive).length,
        sections,
        floors
      }
    };
  }

  /**
   * Get available table templates
   */
  static async getTableTemplates(): Promise<TableTemplate[]> {
    return [
      {
        id: 'restaurant-small',
        name: 'رستوران کوچک',
        description: 'قالب مناسب برای رستوران‌های کوچک با 10-15 میز',
        tables: [
          { tableNumber: '1', capacity: 2, section: 'سالن اصلی', floor: 1, positionX: 10, positionY: 10 },
          { tableNumber: '2', capacity: 4, section: 'سالن اصلی', floor: 1, positionX: 30, positionY: 10 },
          { tableNumber: '3', capacity: 4, section: 'سالن اصلی', floor: 1, positionX: 50, positionY: 10 },
          { tableNumber: '4', capacity: 6, section: 'سالن اصلی', floor: 1, positionX: 10, positionY: 50 },
          { tableNumber: '5', capacity: 6, section: 'سالن اصلی', floor: 1, positionX: 30, positionY: 50 },
          { tableNumber: '6', capacity: 8, section: 'سالن اصلی', floor: 1, positionX: 50, positionY: 50 },
          { tableNumber: '7', capacity: 2, section: 'تراس', floor: 1, positionX: 80, positionY: 10 },
          { tableNumber: '8', capacity: 4, section: 'تراس', floor: 1, positionX: 100, positionY: 10 },
          { tableNumber: '9', capacity: 4, section: 'تراس', floor: 1, positionX: 80, positionY: 50 },
          { tableNumber: '10', capacity: 6, section: 'تراس', floor: 1, positionX: 100, positionY: 50 }
        ],
        totalTables: 10,
        totalCapacity: 46
      },
      {
        id: 'restaurant-medium',
        name: 'رستوران متوسط',
        description: 'قالب مناسب برای رستوران‌های متوسط با 20-30 میز',
        tables: [
          // Ground floor
          { tableNumber: '1', capacity: 2, section: 'سالن اصلی', floor: 1, positionX: 10, positionY: 10 },
          { tableNumber: '2', capacity: 4, section: 'سالن اصلی', floor: 1, positionX: 30, positionY: 10 },
          { tableNumber: '3', capacity: 4, section: 'سالن اصلی', floor: 1, positionX: 50, positionY: 10 },
          { tableNumber: '4', capacity: 6, section: 'سالن اصلی', floor: 1, positionX: 70, positionY: 10 },
          { tableNumber: '5', capacity: 6, section: 'سالن اصلی', floor: 1, positionX: 10, positionY: 50 },
          { tableNumber: '6', capacity: 8, section: 'سالن اصلی', floor: 1, positionX: 30, positionY: 50 },
          { tableNumber: '7', capacity: 8, section: 'سالن اصلی', floor: 1, positionX: 50, positionY: 50 },
          { tableNumber: '8', capacity: 10, section: 'سالن اصلی', floor: 1, positionX: 70, positionY: 50 },
          // VIP section
          { tableNumber: 'VIP1', capacity: 4, section: 'بخش ویژه', floor: 1, positionX: 120, positionY: 10 },
          { tableNumber: 'VIP2', capacity: 6, section: 'بخش ویژه', floor: 1, positionX: 140, positionY: 10 },
          { tableNumber: 'VIP3', capacity: 8, section: 'بخش ویژه', floor: 1, positionX: 120, positionY: 50 },
          { tableNumber: 'VIP4', capacity: 10, section: 'بخش ویژه', floor: 1, positionX: 140, positionY: 50 },
          // Terrace
          { tableNumber: 'T1', capacity: 2, section: 'تراس', floor: 1, positionX: 180, positionY: 10 },
          { tableNumber: 'T2', capacity: 4, section: 'تراس', floor: 1, positionX: 200, positionY: 10 },
          { tableNumber: 'T3', capacity: 4, section: 'تراس', floor: 1, positionX: 180, positionY: 50 },
          { tableNumber: 'T4', capacity: 6, section: 'تراس', floor: 1, positionX: 200, positionY: 50 }
        ],
        totalTables: 16,
        totalCapacity: 108
      },
      {
        id: 'cafe-layout',
        name: 'کافه',
        description: 'قالب مناسب برای کافه‌ها با میزهای کوچک و متوسط',
        tables: [
          { tableNumber: '1', capacity: 2, section: 'سالن داخلی', floor: 1, positionX: 10, positionY: 10 },
          { tableNumber: '2', capacity: 2, section: 'سالن داخلی', floor: 1, positionX: 30, positionY: 10 },
          { tableNumber: '3', capacity: 2, section: 'سالن داخلی', floor: 1, positionX: 50, positionY: 10 },
          { tableNumber: '4', capacity: 4, section: 'سالن داخلی', floor: 1, positionX: 10, positionY: 40 },
          { tableNumber: '5', capacity: 4, section: 'سالن داخلی', floor: 1, positionX: 30, positionY: 40 },
          { tableNumber: '6', capacity: 4, section: 'سالن داخلی', floor: 1, positionX: 50, positionY: 40 },
          { tableNumber: '7', capacity: 6, section: 'سالن داخلی', floor: 1, positionX: 10, positionY: 70 },
          { tableNumber: '8', capacity: 6, section: 'سالن داخلی', floor: 1, positionX: 30, positionY: 70 },
          { tableNumber: '9', capacity: 2, section: 'تراس', floor: 1, positionX: 80, positionY: 10 },
          { tableNumber: '10', capacity: 2, section: 'تراس', floor: 1, positionX: 100, positionY: 10 },
          { tableNumber: '11', capacity: 4, section: 'تراس', floor: 1, positionX: 80, positionY: 40 },
          { tableNumber: '12', capacity: 4, section: 'تراس', floor: 1, positionX: 100, positionY: 40 }
        ],
        totalTables: 12,
        totalCapacity: 44
      }
    ];
  }

  /**
   * Create tables from template
   */
  static async createTablesFromTemplate(
    tenantId: string,
    templateId: string,
    options: {
      prefix?: string;
      startNumber?: number;
      sections?: string[];
      floors?: number[];
    } = {}
  ): Promise<{
    results: TableImportResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      template: TableTemplate;
    };
  }> {
    const templates = await this.getTableTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const prefix = options.prefix || '';
    const startNumber = options.startNumber || 1;
    const results: TableImportResult[] = [];
    let successful = 0;
    let failed = 0;

    // Filter tables based on options
    let tablesToCreate = template.tables;
    if (options.sections && options.sections.length > 0) {
      tablesToCreate = tablesToCreate.filter(t => options.sections!.includes(t.section));
    }
    if (options.floors && options.floors.length > 0) {
      tablesToCreate = tablesToCreate.filter(t => options.floors!.includes(t.floor));
    }

    for (let i = 0; i < tablesToCreate.length; i++) {
      const tableData = tablesToCreate[i];
      const tableNumber = `${prefix}${startNumber + i}`;

      try {
        // Check for duplicate table number
        const existingTable = await prisma.table.findFirst({
          where: {
            tenantId,
            tableNumber,
            isActive: true
          }
        });

        if (existingTable) {
          results.push({
            success: false,
            tableNumber,
            error: 'Table number already exists'
          });
          failed++;
          continue;
        }

        // Create table
        const table = await prisma.table.create({
          data: {
            tenantId,
            tableNumber,
            tableName: tableData.tableName,
            capacity: tableData.capacity,
            section: tableData.section,
            floor: tableData.floor,
            positionX: tableData.positionX,
            positionY: tableData.positionY,
            status: TableStatus.AVAILABLE,
            isActive: true
          }
        });

        results.push({
          success: true,
          tableNumber,
          tableId: table.id
        });
        successful++;

      } catch (error) {
        results.push({
          success: false,
          tableNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    // Invalidate cache to ensure frontend gets updated data after bulk creation
    if (successful > 0) {
      await tableCacheService.invalidateTableCache(tenantId);
    }

    return {
      results,
      summary: {
        total: tablesToCreate.length,
        successful,
        failed,
        template
      }
    };
  }

  /**
   * Check for table status change conflicts
   */
  private static async checkTableStatusConflicts(
    table: Table & { reservations?: any[] },
    newStatus: TableStatus
  ): Promise<string[]> {
    const conflicts: string[] = [];

    // Check if table has upcoming reservations
    if (table.reservations && table.reservations.length > 0 && newStatus === TableStatus.OUT_OF_ORDER) {
      conflicts.push('Table has upcoming reservations');
    }

    return conflicts;
  }

  /**
   * Validate table import data
   */
  private static validateTableImportData(data: TableImportData): string[] {
    const errors: string[] = [];

    if (!data.tableNumber) {
      errors.push('Table number is required');
    }

    if (!data.capacity || data.capacity < 1 || data.capacity > 20) {
      errors.push('Capacity must be between 1 and 20');
    }

    if (!data.floor || data.floor < 1) {
      errors.push('Floor must be at least 1');
    }

    return errors;
  }
} 
