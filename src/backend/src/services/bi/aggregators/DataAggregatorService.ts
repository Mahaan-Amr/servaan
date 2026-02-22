/**
 * Data Aggregator Service
 * Aggregates and merges data from multiple workspace connectors
 * CRITICAL: All operations MUST be tenant-aware
 */

import { WorkspaceConnector, Query, Data } from '../connectors/WorkspaceConnector';
import { OrderingConnector } from '../connectors/OrderingConnector';
import { InventoryConnector } from '../connectors/InventoryConnector';
import { globalCacheService } from '../../globalCacheService';

export interface AggregationQuery {
  workspaces: string[];
  joinType: 'INNER' | 'LEFT' | 'UNION' | 'CROSS';
  joinKeys?: JoinKey[];
  fields: AggregationField[];
  filters?: AggregationFilter[];
  groupBy?: string[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface JoinKey {
  from: string; // e.g., "orders.id"
  to: string;   // e.g., "inventoryEntries.orderId"
}

export interface AggregationField {
  workspace: string;
  table: string;
  field: string;
  alias?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

export interface AggregationFilter {
  workspace: string;
  table: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
  value: any;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AggregatedData {
  rows: any[];
  columns: string[];
  rowCount: number;
  metadata?: {
    workspaces: string[];
    joinType: string;
    executionTime: number;
    cached: boolean;
  };
}

export class DataAggregatorService {
  private connectors: Map<string, WorkspaceConnector>;
  private readonly DEFAULT_CACHE_TTL = 5 * 60; // 5 minutes

  constructor() {
    this.connectors = new Map();
    this.connectors.set('ordering', new OrderingConnector());
    this.connectors.set('inventory', new InventoryConnector());
    // Future: Add AccountingConnector when Accounting workspace is activated
  }

  /**
   * Register a new workspace connector
   */
  registerConnector(connector: WorkspaceConnector): void {
    this.connectors.set(connector.workspaceId, connector);
  }

  /**
   * Aggregate data from multiple workspaces
   * CRITICAL: tenantId is required for tenant isolation
   */
  async aggregate(
    query: AggregationQuery,
    tenantId: string
  ): Promise<AggregatedData> {
    const startTime = Date.now();

    // CRITICAL: Validate tenantId
    if (!tenantId) {
      throw new Error('TenantId is required for data aggregation');
    }

    // CRITICAL: Validate all workspaces exist
    for (const workspace of query.workspaces) {
      if (!this.connectors.has(workspace)) {
        throw new Error(`Connector not found for workspace: ${workspace}`);
      }
    }

    // Check cache first (tenant-specific cache key)
    const cacheKey = this.generateCacheKey(query, tenantId);
    const cached = await globalCacheService.getCachedData<AggregatedData>(
      cacheKey,
      async () => {
        // Cache miss - fetch fresh data
        return await this.fetchAndAggregate(query, tenantId);
      },
      {
        tenantId,
        ttl: this.DEFAULT_CACHE_TTL,
        tags: ['bi', 'aggregation', ...query.workspaces]
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      ...cached,
      metadata: {
        workspaces: query.workspaces,
        joinType: query.joinType,
        executionTime,
        cached: cached.metadata?.cached || false
      }
    };
  }

  /**
   * Fetch and aggregate data from workspaces
   * CRITICAL: All queries filtered by tenantId
   */
  private async fetchAndAggregate(
    query: AggregationQuery,
    tenantId: string
  ): Promise<AggregatedData> {
    // Build queries for each workspace
    const workspaceQueries = this.buildWorkspaceQueries(query, tenantId);
    console.log('🔍 Built workspace queries:', Array.from(workspaceQueries.entries()).map(([ws, q]) => ({
      workspace: ws,
      from: q.from,
      selectCount: q.select.length,
      groupBy: q.groupBy,
      orderBy: q.orderBy
    })));

    // Execute queries in parallel (CRITICAL: All with tenantId)
    const dataPromises = query.workspaces.map(async (workspace) => {
      const connector = this.connectors.get(workspace);
      if (!connector) {
        throw new Error(`Connector not found: ${workspace}`);
      }

      const workspaceQuery = workspaceQueries.get(workspace);
      if (!workspaceQuery) {
        throw new Error(`Query not built for workspace: ${workspace}`);
      }

      console.log(`🔍 Executing query for workspace ${workspace}:`, JSON.stringify({
        from: workspaceQuery.from,
        select: workspaceQuery.select.map(s => ({ field: s.field, table: s.table, aggregation: s.aggregation })),
        groupBy: workspaceQuery.groupBy,
        orderBy: workspaceQuery.orderBy
      }, null, 2));

      // CRITICAL: Execute query with tenantId
      try {
        const result = await connector.executeQuery(workspaceQuery, tenantId);
        console.log(`✅ Query executed for ${workspace}, rows: ${result.rowCount}`);
        return result;
      } catch (error) {
        console.error(`❌ Error executing query for ${workspace}:`, error);
        console.error(`❌ Error stack:`, (error as Error).stack);
        throw error;
      }
    });

    const dataArray = await Promise.all(dataPromises);

    // Merge data based on join type
    let mergedData: Data;
    
    // If only one workspace, no need to join
    if (dataArray.length === 1) {
      mergedData = dataArray[0];
    } else {
      switch (query.joinType) {
        case 'INNER':
          // For INNER JOIN with multiple workspaces, join keys are required
          if (!query.joinKeys || query.joinKeys.length === 0) {
            // If no join keys provided, try UNION instead
            console.warn('INNER JOIN requires join keys, falling back to UNION');
            mergedData = this.union(dataArray);
          } else {
            mergedData = this.innerJoin(dataArray, query.joinKeys, query.workspaces);
          }
          break;
        case 'LEFT':
          // For LEFT JOIN with multiple workspaces, join keys are required
          if (!query.joinKeys || query.joinKeys.length === 0) {
            console.warn('LEFT JOIN requires join keys, falling back to UNION');
            mergedData = this.union(dataArray);
          } else {
            mergedData = this.leftJoin(dataArray, query.joinKeys, query.workspaces);
          }
          break;
        case 'UNION':
          mergedData = this.union(dataArray);
          break;
        case 'CROSS':
          mergedData = this.crossJoin(dataArray);
          break;
        default:
          throw new Error(`Unsupported join type: ${query.joinType}`);
      }
    }

    // Map groupBy to handle "table.field" format
    const mappedGroupBy = (query.groupBy || []).map(gb => {
      // If already in "table.field" format, extract just field name for aggregation
      if (gb.includes('.')) {
        return gb.split('.').pop() || gb;
      }
      // Otherwise, try to find matching field from query.fields
      const matchingField = query.fields.find(f => 
        `${f.table}_${f.field}` === gb || 
        `${f.table}.${f.field}` === gb ||
        f.field === gb
      );
      return matchingField ? matchingField.field : gb;
    });

    // Map orderBy to handle "table.field" format
    const mappedOrderBy = (query.orderBy || []).map(ob => {
      let fieldName = ob.field;
      // If already in "table.field" format, extract just field name
      if (fieldName.includes('.')) {
        fieldName = fieldName.split('.').pop() || fieldName;
      } else {
        // Try to find matching field from query.fields
        const matchingField = query.fields.find(f => 
          `${f.table}_${f.field}` === fieldName || 
          `${f.table}.${f.field}` === fieldName ||
          f.field === fieldName ||
          f.alias === fieldName
        );
        if (matchingField) {
          fieldName = matchingField.alias || matchingField.field;
        }
      }
      return {
        field: fieldName,
        direction: ob.direction
      };
    });

    // Apply aggregations
    const aggregated = this.applyAggregations(mergedData, query.fields, mappedGroupBy);

    // Apply ordering
    if (mappedOrderBy.length > 0) {
      aggregated.rows = this.applyOrdering(aggregated.rows, mappedOrderBy);
    }

    // Apply limit and offset
    if (query.offset) {
      aggregated.rows = aggregated.rows.slice(query.offset);
    }
    if (query.limit) {
      aggregated.rows = aggregated.rows.slice(0, query.limit);
    }

    aggregated.rowCount = aggregated.rows.length;

    return {
      ...aggregated,
      metadata: {
        workspaces: query.workspaces,
        joinType: query.joinType,
        executionTime: 0,
        cached: false
      }
    };
  }

  /**
   * Build queries for each workspace
   * CRITICAL: All queries include tenantId filter
   */
  private buildWorkspaceQueries(
    query: AggregationQuery,
    tenantId: string
  ): Map<string, Query> {
    const workspaceQueries = new Map<string, Query>();

    for (const workspace of query.workspaces) {
      // Get fields for this workspace
      const workspaceFields = query.fields.filter(f => f.workspace === workspace);
      
      // Get filters for this workspace
      const workspaceFilters = query.filters?.filter(f => f.workspace === workspace) || [];

      // Build WHERE clause with tenantId
      const where: any = {
        tenantId: tenantId // CRITICAL: Tenant isolation
      };

      // Add other filters
      for (const filter of workspaceFilters) {
        if (!where[filter.field]) {
          where[filter.field] = this.buildFilterCondition(filter);
        }
      }

      // Determine primary table from fields
      const primaryTable = workspaceFields[0]?.table || this.getDefaultTable(workspace);

      // Map groupBy fields - handle both "table.field" format and field IDs
      const mappedGroupBy = query.groupBy?.map(gb => {
        // If it's already in "table.field" format, use it
        if (gb.includes('.')) {
          return gb;
        }
        // Otherwise, try to find matching field
        const matchingField = workspaceFields.find(f => 
          `${f.table}_${f.field}` === gb || 
          `${f.table}.${f.field}` === gb ||
          f.field === gb
        );
        return matchingField ? `${matchingField.table}.${matchingField.field}` : gb;
      }).filter(gb => 
        workspaceFields.some(f => 
          gb === `${f.table}.${f.field}` || 
          gb === f.field ||
          gb.includes(f.table)
        )
      ) || [];

      // Map orderBy fields - handle both "table.field" format and field IDs
      const mappedOrderBy = query.orderBy?.map(ob => {
        let fieldName = ob.field;
        // If it's already in "table.field" format, use it
        if (!fieldName.includes('.')) {
          // Try to find matching field
          const matchingField = workspaceFields.find(f => 
            `${f.table}_${f.field}` === fieldName || 
            `${f.table}.${f.field}` === fieldName ||
            f.field === fieldName ||
            f.alias === fieldName
          );
          if (matchingField) {
            fieldName = `${matchingField.table}.${matchingField.field}`;
          }
        }
        return {
          field: fieldName,
          direction: ob.direction
        };
      }).filter(ob =>
        workspaceFields.some(f => 
          ob.field === `${f.table}.${f.field}` || 
          ob.field === f.field ||
          ob.field === f.alias ||
          ob.field.includes(f.table)
        )
      ) || [];

      const workspaceQuery: Query = {
        select: workspaceFields.map(f => ({
          field: f.field,
          table: f.table,
          alias: f.alias,
          aggregation: f.aggregation || 'none'
        })),
        from: primaryTable,
        where,
        groupBy: mappedGroupBy,
        orderBy: mappedOrderBy,
        limit: query.limit,
        offset: query.offset
      };

      workspaceQueries.set(workspace, workspaceQuery);
    }

    return workspaceQueries;
  }

  /**
   * Build filter condition from AggregationFilter
   */
  private buildFilterCondition(filter: AggregationFilter): any {
    switch (filter.operator) {
      case 'equals':
        return filter.value;
      case 'notEquals':
        return { not: filter.value };
      case 'greaterThan':
        return { gt: filter.value };
      case 'lessThan':
        return { lt: filter.value };
      case 'contains':
        return { contains: filter.value };
      case 'in':
        return { in: Array.isArray(filter.value) ? filter.value : [filter.value] };
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          return { gte: filter.value[0], lte: filter.value[1] };
        }
        return filter.value;
      default:
        return filter.value;
    }
  }

  /**
   * Get default table for workspace
   */
  private getDefaultTable(workspace: string): string {
    const defaults: Record<string, string> = {
      'ordering': 'orders',
      'inventory': 'items',
      'accounting': 'journalEntries'
    };
    return defaults[workspace] || 'items';
  }

  /**
   * Perform INNER JOIN on data arrays
   * CRITICAL: Ensure tenantId consistency across joined data
   */
  private innerJoin(
    dataArray: Data[],
    joinKeys: JoinKey[],
    workspaces: string[]
  ): Data {
    if (dataArray.length === 0) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    if (dataArray.length === 1) {
      return dataArray[0];
    }

    if (joinKeys.length === 0) {
      throw new Error('INNER JOIN requires join keys');
    }

    // Start with first dataset
    let result = dataArray[0];

    // Join each subsequent dataset
    for (let i = 1; i < dataArray.length; i++) {
      const currentData = dataArray[i];
      const joinKey = joinKeys[i - 1] || joinKeys[0]; // Use first join key if not enough specified

      result = this.performJoin(result, currentData, joinKey, 'INNER');
    }

    return result;
  }

  /**
   * Perform LEFT JOIN on data arrays
   * CRITICAL: Ensure tenantId consistency
   */
  private leftJoin(
    dataArray: Data[],
    joinKeys: JoinKey[],
    workspaces: string[]
  ): Data {
    if (dataArray.length === 0) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    if (dataArray.length === 1) {
      return dataArray[0];
    }

    // Start with first dataset (left table)
    let result = dataArray[0];

    // Left join each subsequent dataset
    for (let i = 1; i < dataArray.length; i++) {
      const currentData = dataArray[i];
      const joinKey = joinKeys[i - 1] || joinKeys[0];

      result = this.performJoin(result, currentData, joinKey, 'LEFT');
    }

    return result;
  }

  /**
   * Perform UNION of data arrays
   * CRITICAL: All data must have same tenantId
   */
  private union(dataArray: Data[]): Data {
    if (dataArray.length === 0) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    // Get common columns
    const allColumns = new Set<string>();
    dataArray.forEach(data => {
      data.columns.forEach(col => allColumns.add(col));
    });

    const columns = Array.from(allColumns);

    // Union all rows
    const rows: any[] = [];
    for (const data of dataArray) {
      for (const row of data.rows) {
        // Normalize row to have all columns
        const normalizedRow: any = {};
        columns.forEach(col => {
          normalizedRow[col] = row[col] || null;
        });
        rows.push(normalizedRow);
      }
    }

    // Remove duplicates (simple comparison)
    const uniqueRows = this.removeDuplicates(rows, columns);

    return {
      rows: uniqueRows,
      columns,
      rowCount: uniqueRows.length
    };
  }

  /**
   * Perform CROSS JOIN (Cartesian product)
   * WARNING: Can produce very large result sets
   */
  private crossJoin(dataArray: Data[]): Data {
    if (dataArray.length === 0) {
      return { rows: [], columns: [], rowCount: 0 };
    }

    if (dataArray.length === 1) {
      return dataArray[0];
    }

    // Combine all columns
    const columns: string[] = [];
    dataArray.forEach((data, index) => {
      data.columns.forEach(col => {
        columns.push(`${index === 0 ? '' : `ws${index}_`}${col}`);
      });
    });

    // Generate Cartesian product
    const rows: any[] = [];
    const rowArrays = dataArray.map(d => d.rows);

    // Recursive function to generate combinations
    const generateCombinations = (arrays: any[][], index: number, current: Record<string, any>): void => {
      if (index === arrays.length) {
        rows.push({ ...current });
        return;
      }

      for (const item of arrays[index]) {
        const newCurrent = { ...current };
        const dataIndex = index;
        dataArray[dataIndex].columns.forEach((col, colIndex) => {
          const newColName = `${dataIndex === 0 ? '' : `ws${dataIndex}_`}${col}`;
          // Type assertion: item is from rows array, col is a valid column name
          newCurrent[newColName] = (item as Record<string, any>)[col];
        });
        generateCombinations(arrays, index + 1, newCurrent);
      }
    };

    generateCombinations(rowArrays, 0, {});

    return {
      rows,
      columns,
      rowCount: rows.length
    };
  }

  /**
   * Perform join operation between two datasets
   */
  private performJoin(
    leftData: Data,
    rightData: Data,
    joinKey: JoinKey,
    joinType: 'INNER' | 'LEFT'
  ): Data {
    // Extract join field names
    const leftKey = joinKey.from.split('.').pop() || joinKey.from;
    const rightKey = joinKey.to.split('.').pop() || joinKey.to;

    // Combine columns (prefix right columns to avoid conflicts)
    const columns = [
      ...leftData.columns,
      ...rightData.columns.map(col => `right_${col}`)
    ];

    const rows: any[] = [];

    // Build index for right dataset
    const rightIndex = new Map<any, any[]>();
    for (const rightRow of rightData.rows) {
      const key = rightRow[rightKey];
      if (key !== undefined && key !== null) {
        if (!rightIndex.has(key)) {
          rightIndex.set(key, []);
        }
        rightIndex.get(key)!.push(rightRow);
      }
    }

    // Join left with right
    for (const leftRow of leftData.rows) {
      const key = leftRow[leftKey];
      const matchingRightRows = rightIndex.get(key) || [];

      if (joinType === 'INNER') {
        // INNER JOIN: Only include if match found
        if (matchingRightRows.length > 0) {
          for (const rightRow of matchingRightRows) {
            const joinedRow: any = { ...leftRow };
            rightData.columns.forEach(col => {
              joinedRow[`right_${col}`] = rightRow[col];
            });
            rows.push(joinedRow);
          }
        }
      } else {
        // LEFT JOIN: Include even if no match
        if (matchingRightRows.length > 0) {
          for (const rightRow of matchingRightRows) {
            const joinedRow: any = { ...leftRow };
            rightData.columns.forEach(col => {
              joinedRow[`right_${col}`] = rightRow[col];
            });
            rows.push(joinedRow);
          }
        } else {
          // No match - include left row with null right values
          const joinedRow: any = { ...leftRow };
          rightData.columns.forEach(col => {
            joinedRow[`right_${col}`] = null;
          });
          rows.push(joinedRow);
        }
      }
    }

    return {
      rows,
      columns,
      rowCount: rows.length
    };
  }

  /**
   * Apply aggregations to merged data
   */
  private applyAggregations(
    data: Data,
    fields: AggregationField[],
    groupBy: string[]
  ): AggregatedData {
    if (groupBy.length === 0) {
      // No grouping - aggregate all rows
      const aggregatedRow: any = {};
      
      for (const field of fields) {
        if (field.aggregation && field.aggregation !== 'none') {
          const values = data.rows.map(row => {
            const fieldName = field.alias || field.field;
            return this.getNestedValue(row, fieldName);
          }).filter(v => v !== null && v !== undefined && !isNaN(v));

          let aggregatedValue: number;
          switch (field.aggregation) {
            case 'sum':
              aggregatedValue = values.reduce((sum, v) => sum + Number(v), 0);
              break;
            case 'avg':
              aggregatedValue = values.length > 0 
                ? values.reduce((sum, v) => sum + Number(v), 0) / values.length 
                : 0;
              break;
            case 'count':
              aggregatedValue = values.length;
              break;
            case 'min':
              aggregatedValue = values.length > 0 ? Math.min(...values.map(v => Number(v))) : 0;
              break;
            case 'max':
              aggregatedValue = values.length > 0 ? Math.max(...values.map(v => Number(v))) : 0;
              break;
            default:
              aggregatedValue = 0;
          }

          aggregatedRow[field.alias || field.field] = aggregatedValue;
        } else {
          // No aggregation - take first value (should be same for all rows)
          aggregatedRow[field.alias || field.field] = data.rows[0]?.[field.alias || field.field] || null;
        }
      }

      return {
        rows: [aggregatedRow],
        columns: fields.map(f => f.alias || f.field),
        rowCount: 1
      };
    }

    // Group by specified fields
    const groups = new Map<string, any[]>();

    for (const row of data.rows) {
      const groupKey = groupBy.map(gb => {
        const value = this.getNestedValue(row, gb);
        return value !== null && value !== undefined ? String(value) : 'null';
      }).join('|');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    }

    // Aggregate each group
    const aggregatedRows: any[] = [];
    for (const [groupKey, groupRows] of groups.entries()) {
      const aggregatedRow: any = {};

      // Add group by values
      const groupValues = groupKey.split('|');
      groupBy.forEach((gb, index) => {
        aggregatedRow[gb] = groupValues[index] === 'null' ? null : groupValues[index];
      });

      // Apply aggregations
      for (const field of fields) {
        if (field.aggregation && field.aggregation !== 'none') {
          const values = groupRows.map(row => {
            const fieldName = field.alias || field.field;
            return this.getNestedValue(row, fieldName);
          }).filter(v => v !== null && v !== undefined && !isNaN(v));

          let aggregatedValue: number;
          switch (field.aggregation) {
            case 'sum':
              aggregatedValue = values.reduce((sum, v) => sum + Number(v), 0);
              break;
            case 'avg':
              aggregatedValue = values.length > 0 
                ? values.reduce((sum, v) => sum + Number(v), 0) / values.length 
                : 0;
              break;
            case 'count':
              aggregatedValue = values.length;
              break;
            case 'min':
              aggregatedValue = values.length > 0 ? Math.min(...values.map(v => Number(v))) : 0;
              break;
            case 'max':
              aggregatedValue = values.length > 0 ? Math.max(...values.map(v => Number(v))) : 0;
              break;
            default:
              aggregatedValue = 0;
          }

          aggregatedRow[field.alias || field.field] = aggregatedValue;
        } else {
          // No aggregation - take first value from group
          aggregatedRow[field.alias || field.field] = groupRows[0]?.[field.alias || field.field] || null;
        }
      }

      aggregatedRows.push(aggregatedRow);
    }

    return {
      rows: aggregatedRows,
      columns: [
        ...groupBy,
        ...fields.map(f => f.alias || f.field)
      ],
      rowCount: aggregatedRows.length
    };
  }

  /**
   * Apply ordering to rows
   */
  private applyOrdering(rows: any[], orderBy: OrderBy[]): any[] {
    return [...rows].sort((a, b) => {
      for (const ob of orderBy) {
        const aValue = this.getNestedValue(a, ob.field);
        const bValue = this.getNestedValue(b, ob.field);

        if (aValue === bValue) continue;

        const comparison = aValue < bValue ? -1 : 1;
        return ob.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  /**
   * Get nested value from object (supports dot notation)
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = value[part];
    }
    return value;
  }

  /**
   * Remove duplicate rows
   */
  private removeDuplicates(rows: any[], columns: string[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const row of rows) {
      const key = columns.map(col => String(row[col] || '')).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(row);
      }
    }

    return unique;
  }

  /**
   * Generate cache key for aggregation query
   * CRITICAL: Include tenantId for tenant isolation
   */
  private generateCacheKey(query: AggregationQuery, tenantId: string): string {
    const queryHash = JSON.stringify({
      workspaces: query.workspaces.sort(),
      joinType: query.joinType,
      fields: query.fields,
      filters: query.filters,
      groupBy: query.groupBy,
      orderBy: query.orderBy,
      limit: query.limit,
      offset: query.offset
    });

    return `bi:aggregate:${tenantId}:${Buffer.from(queryHash).toString('base64').substring(0, 50)}`;
  }

  /**
   * Invalidate cache for tenant
   */
  invalidateTenantCache(tenantId: string): void {
    globalCacheService.invalidateTenantCache(tenantId);
  }

  /**
   * Invalidate cache for specific workspaces
   */
  invalidateWorkspaceCache(workspaces: string[]): void {
    for (const workspace of workspaces) {
      globalCacheService.invalidateCache(`bi:aggregate:*:${workspace}:*`);
    }
  }
}

// Export singleton instance
export const dataAggregatorService = new DataAggregatorService();

