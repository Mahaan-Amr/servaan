/**
 * Ordering Workspace Connector
 * Connects to Ordering & Sales System workspace
 * CRITICAL: All queries MUST filter by tenantId
 */

import { prisma } from '../../dbService';
import { WorkspaceConnector, Schema, Query, Data, Table, Field, Relationship } from './WorkspaceConnector';

export class OrderingConnector implements WorkspaceConnector {
  workspaceId = 'ordering-sales-system';
  name = 'Ordering & Sales System';

  async connect(): Promise<void> {
    // Optional: Initialize connection if needed
    // Prisma client is already connected via dbService singleton
  }

  async disconnect(): Promise<void> {
    // Optional: Cleanup if needed
    // Don't disconnect Prisma as it's shared singleton
  }

  /**
   * Get schema for Ordering workspace
   * CRITICAL: tenantId required for tenant-specific schema
   */
  async getSchema(tenantId: string): Promise<Schema> {
    return {
      tables: [
        {
          name: 'orders',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'orderNumber', type: 'string', nullable: false },
            { name: 'totalAmount', type: 'number', nullable: false },
            { name: 'orderDate', type: 'date', nullable: false },
            { name: 'status', type: 'string', nullable: false },
            { name: 'orderType', type: 'string', nullable: false },
            { name: 'customerName', type: 'string', nullable: true },
            { name: 'tableId', type: 'string', nullable: true },
            { name: 'tenantId', type: 'string', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['orderDate', 'status', 'orderType', 'tenantId']
        },
        {
          name: 'orderItems',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'orderId', type: 'string', nullable: false },
            { name: 'menuItemId', type: 'string', nullable: true },
            { name: 'itemName', type: 'string', nullable: false },
            { name: 'quantity', type: 'number', nullable: false },
            { name: 'unitPrice', type: 'number', nullable: false },
            { name: 'totalPrice', type: 'number', nullable: false },
            { name: 'tenantId', type: 'string', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['orderId', 'menuItemId', 'tenantId']
        },
        {
          name: 'payments',
          fields: [
            { name: 'id', type: 'string', nullable: false },
            { name: 'orderId', type: 'string', nullable: false },
            { name: 'amount', type: 'number', nullable: false },
            { name: 'paymentMethod', type: 'string', nullable: false },
            { name: 'paymentDate', type: 'date', nullable: false },
            { name: 'tenantId', type: 'string', nullable: false }
          ],
          primaryKey: 'id',
          indexes: ['orderId', 'paymentDate', 'tenantId']
        }
      ],
      relationships: [
        {
          from: 'orders',
          to: 'orderItems',
          type: 'one-to-many',
          key: 'id -> orderId'
        },
        {
          from: 'orders',
          to: 'payments',
          type: 'one-to-many',
          key: 'id -> orderId'
        }
      ]
    };
  }

  /**
   * Execute query against Ordering workspace
   * CRITICAL: tenantId required for tenant isolation
   */
  async executeQuery(query: Query, tenantId: string): Promise<Data> {
    // CRITICAL: Validate tenantId
    if (!tenantId) {
      throw new Error('TenantId is required for query execution');
    }

    // Build Prisma query with tenantId filter
    const prismaQuery = this.buildPrismaQuery(query, tenantId);

    // Check if we need raw SQL (for GROUP BY or aggregations)
    const hasAggregations = query.select?.some(s => s.aggregation && s.aggregation !== 'none') || false;
    const hasGroupBy = query.groupBy && query.groupBy.length > 0;
    
    if (hasGroupBy || hasAggregations) {
      // Use raw SQL for GROUP BY or aggregation queries
      const rawQuery = this.buildRawQuery(query, tenantId);
      try {
        console.log('Executing raw SQL query:', rawQuery);
        const data = await prisma.$queryRawUnsafe(rawQuery);
        return this.transformData(data as any[], query.select);
      } catch (error) {
        console.error('Error executing raw query:', error);
        console.error('Query:', rawQuery);
        throw new Error(`Error executing query: ${(error as Error).message}`);
      }
    }

    // Execute query using Prisma
    let data: any[];
    try {
      if (query.from === 'orders') {
        data = await prisma.order.findMany(prismaQuery);
      } else if (query.from === 'orderItems') {
        data = await prisma.orderItem.findMany(prismaQuery);
      } else if (query.from === 'payments') {
        data = await prisma.orderPayment.findMany(prismaQuery);
      } else {
        throw new Error(`Unknown table: ${query.from}`);
      }
    } catch (error) {
      console.error('Error executing Prisma query:', error);
      console.error('Query:', JSON.stringify(prismaQuery, null, 2));
      throw new Error(`Error executing query: ${(error as Error).message}`);
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

    // Check if we need raw SQL (for GROUP BY or aggregations)
    const hasAggregations = query.select?.some(s => s.aggregation && s.aggregation !== 'none') || false;
    const hasGroupBy = query.groupBy && query.groupBy.length > 0;
    
    if (hasGroupBy || hasAggregations) {
      // Use raw SQL for GROUP BY or aggregation queries
      return this.buildRawQuery(query, tenantId);
    }

    const prismaQuery: any = {
      where,
      select: this.buildSelect(query.select),
      orderBy: this.buildOrderBy(query.orderBy),
      take: query.limit || 1000,
      skip: query.offset || 0
    };

    return prismaQuery;
  }

  /**
   * Build select clause
   */
  private buildSelect(select: Query['select']): any {
    if (!select || select.length === 0) {
      return undefined; // Select all
    }

    const selectObj: any = {};
    for (const field of select) {
      if (field.aggregation && field.aggregation !== 'none') {
        // Aggregations need special handling (use raw SQL)
        continue;
      }
      selectObj[field.field] = true;
    }

    return Object.keys(selectObj).length > 0 ? selectObj : undefined;
  }

  /**
   * Build orderBy clause
   */
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

  /**
   * Build raw SQL query for GROUP BY
   * CRITICAL: Include tenantId in WHERE clause
   */
  private buildRawQuery(query: Query, tenantId: string): string {
    // Map table names to actual database table names
    const tableMap: Record<string, string> = {
      'orders': 'orders',
      'orderItems': 'order_items',
      'payments': 'order_payments'
    };
    const dbTable = tableMap[query.from] || query.from;

    const selectFields = query.select.map(s => {
      // Extract field name from "table.field" format if needed
      const fieldName = s.field.includes('.') ? s.field.split('.').pop() || s.field : s.field;
      
      if (s.aggregation && s.aggregation !== 'none') {
        const alias = s.alias || fieldName;
        return `${s.aggregation.toUpperCase()}("${fieldName}") as "${alias}"`;
      }
      return `"${fieldName}"`;
    }).join(', ');

    // Extract field names from "table.field" format for groupBy
    const groupByFields = query.groupBy?.map(gb => {
      const fieldName = gb.includes('.') ? gb.split('.').pop() || gb : gb;
      return `"${fieldName}"`;
    }).join(', ') || '';
    
    // Extract field names from "table.field" format for orderBy
    const orderByClause = query.orderBy?.map(o => {
      const fieldName = o.field.includes('.') ? o.field.split('.').pop() || o.field : o.field;
      return `"${fieldName}" ${o.direction}`;
    }).join(', ') || '';

    // Build WHERE clause
    let whereClause = `"tenantId" = '${tenantId}'`;
    if (query.where && Object.keys(query.where).length > 1) {
      // Add additional where conditions (skip tenantId as it's already added)
      const additionalConditions: string[] = [];
      for (const [key, value] of Object.entries(query.where)) {
        if (key !== 'tenantId') {
          if (typeof value === 'string') {
            additionalConditions.push(`"${key}" = '${value.replace(/'/g, "''")}'`);
          } else if (typeof value === 'number') {
            additionalConditions.push(`"${key}" = ${value}`);
          } else if (value && typeof value === 'object') {
            // Handle Prisma-style conditions like { gt: 100 }
            if ('gt' in value) {
              additionalConditions.push(`"${key}" > ${value.gt}`);
            } else if ('lt' in value) {
              additionalConditions.push(`"${key}" < ${value.lt}`);
            } else if ('gte' in value) {
              additionalConditions.push(`"${key}" >= ${value.gte}`);
            } else if ('lte' in value) {
              additionalConditions.push(`"${key}" <= ${value.lte}`);
            } else if ('contains' in value) {
              additionalConditions.push(`"${key}" ILIKE '%${String(value.contains).replace(/'/g, "''")}%'`);
            }
          }
        }
      }
      if (additionalConditions.length > 0) {
        whereClause += ' AND ' + additionalConditions.join(' AND ');
      }
    }

    return `
      SELECT ${selectFields}
      FROM "${dbTable}"
      WHERE ${whereClause}
      ${groupByFields ? `GROUP BY ${groupByFields}` : ''}
      ${orderByClause ? `ORDER BY ${orderByClause}` : ''}
      LIMIT ${query.limit || 1000}
      OFFSET ${query.offset || 0}
    `.trim();
  }

  /**
   * Build WHERE clause string
   */
  private buildWhereClause(where: any): string {
    // Simple implementation - can be enhanced
    return JSON.stringify(where);
  }

  /**
   * Transform Prisma data to standard format
   */
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
        message: isConnected ? 'Ordering connector is healthy' : 'Ordering connector is unhealthy'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: (error as Error).message
      };
    }
  }
}

