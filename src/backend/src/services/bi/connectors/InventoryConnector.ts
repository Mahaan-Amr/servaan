/**
 * Inventory Workspace Connector
 * Connects to Inventory Management workspace
 * CRITICAL: All queries MUST filter by tenantId
 */

import { prisma } from '../../dbService';
import { WorkspaceConnector, Schema, Query, Data } from './WorkspaceConnector';

export class InventoryConnector implements WorkspaceConnector {
  workspaceId = 'inventory-management';
  name = 'Inventory Management';

  async connect(): Promise<void> {
    // Prisma client is already connected via dbService singleton
  }

  async disconnect(): Promise<void> {
    // Don't disconnect Prisma as it's shared singleton
  }

  /**
   * Get schema for Inventory workspace
   * CRITICAL: tenantId required for tenant-specific schema
   */
  async getSchema(tenantId: string): Promise<Schema> {
    return {
      tables: [
        {
          name: 'items',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'name', type: 'string', nullable: false },
            { name: 'category', type: 'string', nullable: false },
            { name: 'unit', type: 'string', nullable: false },
            { name: 'currentStock', type: 'number', nullable: false },
            { name: 'minStock', type: 'number', nullable: false },
            { name: 'tenantId', type: 'string', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['category', 'name', 'tenantId']
        },
        {
          name: 'inventoryEntries',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'itemId', type: 'string', nullable: false },
            { name: 'quantity', type: 'number', nullable: false },
            { name: 'type', type: 'string', nullable: false },
            { name: 'unitPrice', type: 'number', nullable: true },
            { name: 'createdAt', type: 'date', nullable: false },
            { name: 'tenantId', type: 'string', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['itemId', 'type', 'createdAt', 'tenantId']
        }
      ],
      relationships: [
        {
          from: 'items',
          to: 'inventoryEntries',
          type: 'one-to-many',
          key: 'id -> itemId'
        }
      ]
    };
  }

  /**
   * Execute query against Inventory workspace
   * CRITICAL: tenantId required for tenant isolation
   */
  async executeQuery(query: Query, tenantId: string): Promise<Data> {
    // CRITICAL: Validate tenantId
    if (!tenantId) {
      throw new Error('TenantId is required for query execution');
    }

    // Build Prisma query with tenantId filter
    const prismaQuery = this.buildPrismaQuery(query, tenantId);

    // Execute query
    let data: any[];
    if (query.from === 'items') {
      data = await prisma.item.findMany({
        ...prismaQuery,
        include: {
          inventoryEntries: {
            where: {
              tenantId: tenantId // CRITICAL: Nested relations also filtered
            }
          }
        }
      });
    } else if (query.from === 'inventoryEntries') {
      data = await prisma.inventoryEntry.findMany({
        ...prismaQuery,
        include: {
          item: {
            where: {
              tenantId: tenantId // CRITICAL: Related items also filtered
            }
          }
        }
      });
    } else {
      throw new Error(`Unknown table: ${query.from}`);
    }

    // Transform to standard format
    return this.transformData(data, query.select);
  }

  /**
   * Build Prisma query from Query object
   * CRITICAL: Always include tenantId filter
   */
  private buildPrismaQuery(query: Query, tenantId: string): any {
    const where: any = {
      tenantId: tenantId // CRITICAL: Tenant isolation
    };

    // Add additional where conditions
    if (query.where) {
      Object.assign(where, query.where);
    }

    return {
      where,
      select: this.buildSelect(query.select),
      orderBy: this.buildOrderBy(query.orderBy),
      take: query.limit || 1000,
      skip: query.offset || 0
    };
  }

  private buildSelect(select: Query['select']): any {
    if (!select || select.length === 0) {
      return undefined;
    }

    const selectObj: any = {};
    for (const field of select) {
      if (field.aggregation && field.aggregation !== 'none') {
        continue;
      }
      selectObj[field.field] = true;
    }

    return Object.keys(selectObj).length > 0 ? selectObj : undefined;
  }

  private buildOrderBy(orderBy?: Query['orderBy']): any {
    if (!orderBy || orderBy.length === 0) {
      return undefined;
    }

    return orderBy.map(o => {
      // Extract field name from "table.field" format if needed
      const fieldName = o.field.includes('.') ? o.field.split('.').pop() || o.field : o.field;
      return {
        [fieldName]: o.direction
      };
    });
  }

  private transformData(data: any[], select: Query['select']): Data {
    if (data.length === 0) {
      return {
        rows: [],
        columns: select?.map(s => s.alias || s.field) || [],
        rowCount: 0
      };
    }

    const columns = select?.map(s => s.alias || s.field) || Object.keys(data[0]);

    return {
      rows: data,
      columns,
      rowCount: data.length
    };
  }

  async validate(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async getHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    try {
      const isConnected = await this.validate();
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Inventory connector is healthy' : 'Inventory connector is unhealthy'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: (error as Error).message
      };
    }
  }
}

