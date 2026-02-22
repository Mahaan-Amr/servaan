import { Prisma } from '../../../shared/generated/client';
import { performanceMonitoringService } from './performanceMonitoringService';
import { prisma } from './dbService';

export interface QueryConfig {
  dataSources: any[];
  columns: any[];
  filters?: any[];
  sorting?: any[];
  parameters?: any;
  tenantId?: string;
}

export interface FieldMapping {
  [key: string]: {
    table: string;
    column: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  };
}

export class QueryBuilderValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'QueryBuilderValidationError';
  }
}

const FIELD_MAPPINGS: FieldMapping = {
  item_name: { table: 'items', column: 'name', type: 'text' },
  item_category: { table: 'items', column: 'category', type: 'text' },
  quantity: { table: 'inventory_entries', column: 'quantity', type: 'number' },
  unit_price: { table: 'inventory_entries', column: 'unitPrice', type: 'currency' },
  total_value: { table: 'calculated', column: 'quantity * unitPrice', type: 'currency' },
  entry_date: { table: 'inventory_entries', column: 'createdAt', type: 'date' },
  entry_type: { table: 'inventory_entries', column: 'type', type: 'text' },
  user_name: { table: 'users', column: 'name', type: 'text' },
  supplier_name: { table: 'suppliers', column: 'name', type: 'text' },
  current_stock: { table: 'calculated', column: 'current_stock', type: 'number' },
  item_unit: { table: 'items', column: 'unit', type: 'text' },
  item_description: { table: 'items', column: 'description', type: 'text' },
  item_barcode: { table: 'items', column: 'barcode', type: 'text' },
  item_min_stock: { table: 'items', column: 'minStock', type: 'number' },
  item_is_active: { table: 'items', column: 'isActive', type: 'boolean' },
  item_created_at: { table: 'items', column: 'createdAt', type: 'date' },
  inventory_quantity: { table: 'inventory_entries', column: 'quantity', type: 'number' },
  inventory_type: { table: 'inventory_entries', column: 'type', type: 'text' },
  inventory_unit_price: { table: 'inventory_entries', column: 'unitPrice', type: 'currency' },
  inventory_note: { table: 'inventory_entries', column: 'note', type: 'text' },
  inventory_batch_number: { table: 'inventory_entries', column: 'batchNumber', type: 'text' },
  inventory_expiry_date: { table: 'inventory_entries', column: 'expiryDate', type: 'date' },
  inventory_created_at: { table: 'inventory_entries', column: 'createdAt', type: 'date' },
  user_email: { table: 'users', column: 'email', type: 'text' },
  user_role: { table: 'users', column: 'role', type: 'text' },
  user_active: { table: 'users', column: 'active', type: 'boolean' },
  user_created_at: { table: 'users', column: 'createdAt', type: 'date' },
  supplier_contact_name: { table: 'suppliers', column: 'contactName', type: 'text' },
  supplier_email: { table: 'suppliers', column: 'email', type: 'text' },
  supplier_phone: { table: 'suppliers', column: 'phoneNumber', type: 'text' },
  supplier_address: { table: 'suppliers', column: 'address', type: 'text' },
  supplier_is_active: { table: 'suppliers', column: 'isActive', type: 'boolean' },
  item_supplier_unit_price: { table: 'item_suppliers', column: 'unitPrice', type: 'currency' },
  item_supplier_preferred: { table: 'item_suppliers', column: 'preferredSupplier', type: 'boolean' }
};

const ALLOWED_OPERATORS = new Set(['equals', 'contains', 'greater', 'less', 'between', 'in']);
const ALLOWED_AGGREGATIONS = new Set(['sum', 'avg', 'count', 'min', 'max', 'none']);

export class QueryBuilder {
  static async buildQuery(config: QueryConfig): Promise<Prisma.Sql> {
    const { columns, filters = [], sorting = [], tenantId } = config;

    if (!tenantId) {
      throw new QueryBuilderValidationError('TenantId is required for report execution');
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new QueryBuilderValidationError('At least one report column is required');
    }

    const requiredTables = this.getRequiredTables(columns, filters);
    const selectSql = this.buildSelectClause(columns);
    const fromSql = this.buildFromClause(requiredTables);
    const whereSql = this.buildWhereClause(filters, config.parameters, tenantId);
    const groupByFields = this.buildGroupByFields(columns);
    const orderBySql = this.buildOrderByClause(sorting, groupByFields);

    return Prisma.sql`
      SELECT ${selectSql}
      FROM ${fromSql}
      WHERE ${whereSql}
      ${groupByFields.length > 0 ? Prisma.sql`GROUP BY ${Prisma.join(groupByFields.map((f) => Prisma.raw(f)), ', ')}` : Prisma.empty}
      ${orderBySql ? Prisma.sql`ORDER BY ${orderBySql}` : Prisma.empty}
    `;
  }

  static async executeQuery(query: Prisma.Sql): Promise<any[]> {
    const startTime = Date.now();
    try {
      const result = await prisma.$queryRaw(query);
      const executionTime = Date.now() - startTime;
      performanceMonitoringService.recordDatabaseQuery(this.queryToLogString(query), executionTime);
      return result as any[];
    } catch (error) {
      const executionTime = Date.now() - startTime;
      performanceMonitoringService.recordDatabaseQuery(this.queryToLogString(query), executionTime);
      throw error;
    }
  }

  private static queryToLogString(query: Prisma.Sql): string {
    const rawSql = (query as any)?.sql || '';
    return typeof rawSql === 'string' ? rawSql : 'parameterized_query';
  }

  private static getRequiredTables(columns: any[], filters: any[]): Set<string> {
    const tables = new Set<string>();

    for (const column of columns) {
      const mapping = this.getFieldMapping(column.id, 'column');
      if (mapping.table === 'calculated') {
        if (column.id === 'total_value') {
          tables.add('inventory_entries');
        }
      } else {
        tables.add(mapping.table);
      }
    }

    for (const filter of filters) {
      const mapping = this.getFieldMapping(filter.field, 'filter');
      if (mapping.table === 'calculated') {
        throw new QueryBuilderValidationError(`Filtering by calculated field is not supported: ${filter.field}`);
      }
      tables.add(mapping.table);
    }

    if (tables.has('users')) {
      tables.add('inventory_entries');
    }
    if (tables.has('suppliers')) {
      tables.add('item_suppliers');
    }
    tables.add('items');

    return tables;
  }

  private static buildSelectClause(columns: any[]): Prisma.Sql {
    const fields: Prisma.Sql[] = [];

    for (const column of columns) {
      const mapping = this.getFieldMapping(column.id, 'column');
      const aggregation = column.aggregation || 'none';
      if (!ALLOWED_AGGREGATIONS.has(aggregation)) {
        throw new QueryBuilderValidationError(`Unsupported aggregation: ${aggregation}`);
      }

      let expression = this.buildFieldExpression(column.id, mapping);
      if (aggregation !== 'none') {
        expression = this.wrapAggregation(expression, aggregation);
      }

      const alias = this.escapeIdentifier(column.label || column.id);
      fields.push(Prisma.sql`${Prisma.raw(expression)} AS ${Prisma.raw(`"${alias}"`)}`);
    }

    if (fields.length === 0) {
      return Prisma.raw('i.id');
    }
    return Prisma.join(fields, ', ');
  }

  private static buildFromClause(tables: Set<string>): Prisma.Sql {
    let fromClause = '"Item" i';

    if (tables.has('inventory_entries')) {
      fromClause += ' LEFT JOIN "InventoryEntry" ie ON ie."itemId" = i.id';
    }
    if (tables.has('users') && tables.has('inventory_entries')) {
      fromClause += ' LEFT JOIN "User" u ON u.id = ie."userId"';
    }
    if (tables.has('item_suppliers')) {
      fromClause += ' LEFT JOIN "ItemSupplier" isp ON isp."itemId" = i.id';
    }
    if (tables.has('suppliers') && tables.has('item_suppliers')) {
      fromClause += ' LEFT JOIN "Supplier" s ON s.id = isp."supplierId"';
    }

    return Prisma.raw(fromClause);
  }

  private static buildWhereClause(filters: any[], parameters: any, tenantId: string): Prisma.Sql {
    const conditions: Prisma.Sql[] = [];
    conditions.push(Prisma.sql`i."tenantId" = ${tenantId}`);
    conditions.push(Prisma.raw('i."isActive" = true'));

    for (const filter of filters) {
      const mapping = this.getFieldMapping(filter.field, 'filter');
      const operator = filter.operator;
      if (!ALLOWED_OPERATORS.has(operator)) {
        throw new QueryBuilderValidationError(`Unsupported filter operator: ${operator}`);
      }

      const isEmptyValue =
        filter.value === '' ||
        filter.value === null ||
        filter.value === undefined ||
        (Array.isArray(filter.value) && filter.value.length === 0);
      if (isEmptyValue) {
        throw new QueryBuilderValidationError(`Invalid filter value for field: ${filter.field}`);
      }

      if (mapping.table === 'calculated') {
        throw new QueryBuilderValidationError(`Filtering by calculated field is not supported: ${filter.field}`);
      }

      const fieldExpression = Prisma.raw(this.getDbFieldName(mapping));
      switch (operator) {
        case 'equals':
          conditions.push(Prisma.sql`${fieldExpression} = ${filter.value}`);
          break;
        case 'contains':
          conditions.push(Prisma.sql`${fieldExpression} ILIKE ${`%${String(filter.value)}%`}`);
          break;
        case 'greater':
          conditions.push(Prisma.sql`${fieldExpression} > ${filter.value}`);
          break;
        case 'less':
          conditions.push(Prisma.sql`${fieldExpression} < ${filter.value}`);
          break;
        case 'between':
          if (!Array.isArray(filter.value) || filter.value.length !== 2) {
            throw new QueryBuilderValidationError(`Between filter requires two values: ${filter.field}`);
          }
          conditions.push(Prisma.sql`${fieldExpression} BETWEEN ${filter.value[0]} AND ${filter.value[1]}`);
          break;
        case 'in':
          if (!Array.isArray(filter.value) || filter.value.length === 0) {
            throw new QueryBuilderValidationError(`IN filter requires a non-empty list: ${filter.field}`);
          }
          conditions.push(Prisma.sql`${fieldExpression} IN (${Prisma.join(filter.value)})`);
          break;
        default:
          throw new QueryBuilderValidationError(`Unsupported filter operator: ${operator}`);
      }
    }

    if (parameters?.dateRange) {
      if (!parameters.dateRange.start || !parameters.dateRange.end) {
        throw new QueryBuilderValidationError('Date range filter requires start and end');
      }
      conditions.push(
        Prisma.sql`ie."createdAt" BETWEEN ${parameters.dateRange.start} AND ${parameters.dateRange.end}`
      );
    }

    if (parameters?.itemIds !== undefined) {
      if (!Array.isArray(parameters.itemIds) || parameters.itemIds.length === 0) {
        throw new QueryBuilderValidationError('itemIds must be a non-empty array');
      }
      conditions.push(Prisma.sql`i.id IN (${Prisma.join(parameters.itemIds)})`);
    }

    return Prisma.join(conditions, ' AND ');
  }

  private static buildGroupByFields(columns: any[]): string[] {
    const groupFields: string[] = [];
    const hasAggregation = columns.some((column) => (column.aggregation || 'none') !== 'none');

    for (const column of columns) {
      const mapping = this.getFieldMapping(column.id, 'column');
      const aggregation = column.aggregation || 'none';
      if (!ALLOWED_AGGREGATIONS.has(aggregation)) {
        throw new QueryBuilderValidationError(`Unsupported aggregation: ${aggregation}`);
      }

      if (aggregation === 'none' && mapping.table !== 'calculated') {
        const fieldName = this.getDbFieldName(mapping);
        if (!groupFields.includes(fieldName)) {
          groupFields.push(fieldName);
        }
      }
    }

    return hasAggregation ? groupFields : [];
  }

  private static buildOrderByClause(sorting: any[], groupByFields: string[]): Prisma.Sql | null {
    const hasGroupBy = groupByFields.length > 0;
    const orderFields: Prisma.Sql[] = [];

    for (const sort of sorting) {
      const mapping = this.getFieldMapping(sort.field, 'sorting');
      const direction = sort.direction === 'desc' ? 'DESC' : 'ASC';
      const fieldExpression = this.buildFieldExpression(sort.field, mapping);

      if (hasGroupBy && mapping.table !== 'calculated' && !groupByFields.includes(fieldExpression)) {
        throw new QueryBuilderValidationError(`Sort field is not available in grouped query: ${sort.field}`);
      }

      orderFields.push(Prisma.sql`${Prisma.raw(fieldExpression)} ${Prisma.raw(direction)}`);
    }

    if (orderFields.length === 0 && !hasGroupBy) {
      return Prisma.raw('i."createdAt" DESC');
    }
    if (orderFields.length === 0 && hasGroupBy) {
      return Prisma.raw(`${groupByFields[0]} ASC`);
    }
    return Prisma.join(orderFields, ', ');
  }

  private static getFieldMapping(fieldId: string, source: 'column' | 'filter' | 'sorting') {
    const mapping = FIELD_MAPPINGS[fieldId];
    if (!mapping) {
      throw new QueryBuilderValidationError(`Unsupported ${source} field: ${fieldId}`);
    }
    return mapping;
  }

  private static getDbFieldName(mapping: { table: string; column: string }): string {
    const tableAlias = this.getTableAlias(mapping.table);
    return `${tableAlias}."${mapping.column}"`;
  }

  private static buildFieldExpression(fieldId: string, mapping: { table: string; column: string }): string {
    if (mapping.table !== 'calculated') {
      return this.getDbFieldName(mapping);
    }

    if (fieldId === 'total_value') {
      return '(ie.quantity * COALESCE(ie."unitPrice", 0))';
    }

    if (fieldId === 'current_stock') {
      return `(
        SELECT COALESCE(SUM(
          CASE
            WHEN ie2.type = 'IN' THEN ie2.quantity
            WHEN ie2.type = 'OUT' THEN -ie2.quantity
            ELSE 0
          END
        ), 0)
        FROM "InventoryEntry" ie2
        WHERE ie2."itemId" = i.id
      )`;
    }

    throw new QueryBuilderValidationError(`Unsupported calculated field: ${fieldId}`);
  }

  private static wrapAggregation(expression: string, aggregation: string): string {
    switch (aggregation) {
      case 'sum':
        return `SUM(${expression})`;
      case 'avg':
        return `AVG(${expression})`;
      case 'count':
        return `COUNT(${expression})`;
      case 'min':
        return `MIN(${expression})`;
      case 'max':
        return `MAX(${expression})`;
      default:
        throw new QueryBuilderValidationError(`Unsupported aggregation: ${aggregation}`);
    }
  }

  private static getTableAlias(tableName: string): string {
    const aliases: { [key: string]: string } = {
      items: 'i',
      inventory_entries: 'ie',
      users: 'u',
      suppliers: 's',
      item_suppliers: 'isp',
      calculated: 'calc'
    };
    return aliases[tableName] || tableName;
  }

  private static escapeIdentifier(input: string): string {
    return String(input).replace(/"/g, '""').slice(0, 64);
  }

  static validateQuery(_query: string): boolean {
    return true;
  }

  static getAvailableFields(): any[] {
    return Object.entries(FIELD_MAPPINGS).map(([id, mapping]) => ({
      id,
      name: mapping.column,
      type: mapping.type,
      table: mapping.table,
      label: this.getFieldLabel(id),
      aggregation: 'none'
    }));
  }

  private static getFieldLabel(fieldId: string): string {
    const labels: Record<string, string> = {
      item_name: 'Ù†Ø§Ù… Ú©Ø§Ù„Ø§',
      item_category: 'Ø¯Ø³ØªÙ‡â€ŒØ¨Ù†Ø¯ÛŒ',
      quantity: 'ØªØ¹Ø¯Ø§Ø¯',
      unit_price: 'Ù‚ÛŒÙ…Øª ÙˆØ§Ø­Ø¯',
      total_value: 'Ø§Ø±Ø²Ø´ Ú©Ù„',
      entry_date: 'ØªØ§Ø±ÛŒØ® ÙˆØ±ÙˆØ¯/Ø®Ø±ÙˆØ¬',
      entry_type: 'Ù†ÙˆØ¹ ØªØ±Ø§Ú©Ù†Ø´',
      user_name: 'Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±',
      supplier_name: 'Ù†Ø§Ù… ØªØ£Ù…ÛŒÙ†â€ŒÚ©Ù†Ù†Ø¯Ù‡',
      current_stock: 'Ù…ÙˆØ¬ÙˆØ¯ÛŒ ÙØ¹Ù„ÛŒ',
      item_unit: 'ÙˆØ§Ø­Ø¯',
      item_description: 'ØªÙˆØ¶ÛŒØ­Ø§Øª',
      item_barcode: 'Ø¨Ø§Ø±Ú©Ø¯',
      item_min_stock: 'Ø­Ø¯Ø§Ù‚Ù„ Ù…ÙˆØ¬ÙˆØ¯ÛŒ',
      item_is_active: 'ÙˆØ¶Ø¹ÛŒØª ÙØ¹Ø§Ù„',
      item_created_at: 'ØªØ§Ø±ÛŒØ® Ø§ÛŒØ¬Ø§Ø¯ Ú©Ø§Ù„Ø§',
      inventory_quantity: 'Ù…Ù‚Ø¯Ø§Ø± ØªØ±Ø§Ú©Ù†Ø´',
      inventory_type: 'Ù†ÙˆØ¹ ØªØ±Ø§Ú©Ù†Ø´',
      inventory_unit_price: 'Ù‚ÛŒÙ…Øª ÙˆØ§Ø­Ø¯ ØªØ±Ø§Ú©Ù†Ø´',
      inventory_note: 'ÛŒØ§Ø¯Ø¯Ø§Ø´Øª',
      inventory_batch_number: 'Ø´Ù…Ø§Ø±Ù‡ Ø¯Ø³ØªÙ‡',
      inventory_expiry_date: 'ØªØ§Ø±ÛŒØ® Ø§Ù†Ù‚Ø¶Ø§',
      inventory_created_at: 'ØªØ§Ø±ÛŒØ® ØªØ±Ø§Ú©Ù†Ø´',
      user_email: 'Ø§ÛŒÙ…ÛŒÙ„ Ú©Ø§Ø±Ø¨Ø±',
      user_role: 'Ù†Ù‚Ø´ Ú©Ø§Ø±Ø¨Ø±',
      user_active: 'ÙˆØ¶Ø¹ÛŒØª Ú©Ø§Ø±Ø¨Ø±',
      user_created_at: 'ØªØ§Ø±ÛŒØ® Ø¹Ø¶ÙˆÛŒØª',
      supplier_contact_name: 'Ù†Ø§Ù… ØªÙ…Ø§Ø³',
      supplier_email: 'Ø§ÛŒÙ…ÛŒÙ„ ØªØ£Ù…ÛŒÙ†â€ŒÚ©Ù†Ù†Ø¯Ù‡',
      supplier_phone: 'ØªÙ„ÙÙ†',
      supplier_address: 'Ø¢Ø¯Ø±Ø³',
      supplier_is_active: 'ÙˆØ¶Ø¹ÛŒØª ØªØ£Ù…ÛŒÙ†â€ŒÚ©Ù†Ù†Ø¯Ù‡',
      item_supplier_unit_price: 'Ù‚ÛŒÙ…Øª Ø§Ø² ØªØ£Ù…ÛŒÙ†â€ŒÚ©Ù†Ù†Ø¯Ù‡',
      item_supplier_preferred: 'ØªØ£Ù…ÛŒÙ†â€ŒÚ©Ù†Ù†Ø¯Ù‡ ØªØ±Ø¬ÛŒØ­ÛŒ'
    };
    return labels[fieldId] || fieldId;
  }
}
