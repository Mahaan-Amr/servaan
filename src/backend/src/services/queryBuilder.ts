import { PrismaClient } from '../../../shared/generated/client';
import { performanceMonitoringService } from './performanceMonitoringService';

const prisma = new PrismaClient();

export interface QueryConfig {
  dataSources: any[];
  columns: any[];
  filters?: any[];
  sorting?: any[];
  parameters?: any;
  tenantId?: string; // Add tenantId to prevent data leakage
}

export interface FieldMapping {
  [key: string]: {
    table: string;
    column: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  };
}

// نقشه‌برداری فیلدهای موجود در سیستم
const FIELD_MAPPINGS: FieldMapping = {
  // Frontend field IDs that match the AVAILABLE_FIELDS in the report builder
  'item_name': { table: 'items', column: 'name', type: 'text' },
  'item_category': { table: 'items', column: 'category', type: 'text' },
  'quantity': { table: 'inventory_entries', column: 'quantity', type: 'number' },
  'unit_price': { table: 'inventory_entries', column: 'unitPrice', type: 'currency' },
  'total_value': { table: 'calculated', column: 'quantity * unitPrice', type: 'currency' },
  'entry_date': { table: 'inventory_entries', column: 'createdAt', type: 'date' },
  'entry_type': { table: 'inventory_entries', column: 'type', type: 'text' },
  'user_name': { table: 'users', column: 'name', type: 'text' },
  'supplier_name': { table: 'suppliers', column: 'name', type: 'text' },
  'current_stock': { table: 'calculated', column: 'current_stock', type: 'number' },
  
  // Additional legacy mappings for backward compatibility
  'item_unit': { table: 'items', column: 'unit', type: 'text' },
  'item_description': { table: 'items', column: 'description', type: 'text' },
  'item_barcode': { table: 'items', column: 'barcode', type: 'text' },
  'item_min_stock': { table: 'items', column: 'minStock', type: 'number' },
  'item_is_active': { table: 'items', column: 'isActive', type: 'boolean' },
  'item_created_at': { table: 'items', column: 'createdAt', type: 'date' },
  
  'inventory_quantity': { table: 'inventory_entries', column: 'quantity', type: 'number' },
  'inventory_type': { table: 'inventory_entries', column: 'type', type: 'text' },
  'inventory_unit_price': { table: 'inventory_entries', column: 'unitPrice', type: 'currency' },
  'inventory_note': { table: 'inventory_entries', column: 'note', type: 'text' },
  'inventory_batch_number': { table: 'inventory_entries', column: 'batchNumber', type: 'text' },
  'inventory_expiry_date': { table: 'inventory_entries', column: 'expiryDate', type: 'date' },
  'inventory_created_at': { table: 'inventory_entries', column: 'createdAt', type: 'date' },
  
  'user_email': { table: 'users', column: 'email', type: 'text' },
  'user_role': { table: 'users', column: 'role', type: 'text' },
  'user_active': { table: 'users', column: 'active', type: 'boolean' },
  'user_created_at': { table: 'users', column: 'createdAt', type: 'date' },
  
  'supplier_contact_name': { table: 'suppliers', column: 'contactName', type: 'text' },
  'supplier_email': { table: 'suppliers', column: 'email', type: 'text' },
  'supplier_phone': { table: 'suppliers', column: 'phoneNumber', type: 'text' },
  'supplier_address': { table: 'suppliers', column: 'address', type: 'text' },
  'supplier_is_active': { table: 'suppliers', column: 'isActive', type: 'boolean' },
  
  'item_supplier_unit_price': { table: 'item_suppliers', column: 'unitPrice', type: 'currency' },
  'item_supplier_preferred': { table: 'item_suppliers', column: 'preferredSupplier', type: 'boolean' }
};

export class QueryBuilder {
  /**
   * ساخت کوئری SQL از تنظیمات گزارش
   */
  static async buildQuery(config: QueryConfig): Promise<string> {
    try {
      const { columns, filters = [], sorting = [], tenantId } = config;
      
      // تشخیص جداول مورد نیاز
      const requiredTables = this.getRequiredTables(columns, filters);
      console.log('DEBUG: Required tables:', Array.from(requiredTables));
      
      // ساخت بخش SELECT
      const selectClause = this.buildSelectClause(columns);
      console.log('DEBUG: Select clause:', selectClause);
      
      // ساخت بخش FROM و JOIN
      const fromClause = this.buildFromClause(requiredTables);
      console.log('DEBUG: From clause:', fromClause);
      
      // ساخت بخش WHERE - CRITICAL: Always include tenant filtering
      const whereClause = this.buildWhereClause(filters, config.parameters, tenantId);
      
      // ساخت بخش GROUP BY
      const groupByClause = this.buildGroupByClause(columns);
      
      // ساخت بخش ORDER BY
      const orderByClause = this.buildOrderByClause(
        sorting, 
        groupByClause.length > 0, 
        groupByClause.length > 0 ? groupByClause.split(', ') : []
      );
      
      // ساخت کوئری نهایی
      const query = `
        SELECT ${selectClause}
        FROM ${fromClause}
        WHERE ${whereClause}
        ${groupByClause ? `GROUP BY ${groupByClause}` : ''}
        ${orderByClause ? `ORDER BY ${orderByClause}` : ''}
      `.trim().replace(/\s+/g, ' ');
      
      console.log('Executing query:', query);
      
      return query;
    } catch (error) {
      console.error('Error building query:', error);
      throw error;
    }
  }

  /**
   * اجرای کوئری و بازگرداندن نتایج
   */
  static async executeQuery(query: string): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      const result = await prisma.$queryRawUnsafe(query);
      const executionTime = Date.now() - startTime;
      
      // Record query performance for monitoring
      performanceMonitoringService.recordDatabaseQuery(query, executionTime);
      
      return result as any[];
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failed query performance
      performanceMonitoringService.recordDatabaseQuery(query, executionTime);
      
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * تشخیص جداول مورد نیاز بر اساس ستون‌ها و فیلترها
   */
  private static getRequiredTables(columns: any[], filters: any[]): Set<string> {
    const tables = new Set<string>();
    
    // بررسی ستون‌ها
    columns.forEach(column => {
      const fieldMapping = FIELD_MAPPINGS[column.id];
      if (fieldMapping) {
        if (fieldMapping.table === 'calculated') {
          // فیلدهای محاسبه شده که به جداول خاصی نیاز دارند
          if (column.id === 'total_value') {
            tables.add('inventory_entries');
          } else if (column.id === 'current_stock') {
            // current_stock uses a subquery, doesn't need JOIN
          }
        } else {
          tables.add(fieldMapping.table);
        }
      }
    });
    
    // بررسی فیلترها
    filters.forEach(filter => {
      const fieldMapping = FIELD_MAPPINGS[filter.field];
      if (fieldMapping) {
        if (fieldMapping.table === 'calculated') {
          // فیلدهای محاسبه شده که به جداول خاصی نیاز دارند
          if (filter.field === 'total_value') {
            tables.add('inventory_entries');
          }
        } else {
          tables.add(fieldMapping.table);
        }
      }
    });
    
    // اعمال وابستگی‌های جداول
    // اگر از جدول users استفاده می‌شود، به inventory_entries نیاز است
    if (tables.has('users')) {
      tables.add('inventory_entries');
    }
    
    // اگر از جدول suppliers استفاده می‌شود، به item_suppliers نیاز است
    if (tables.has('suppliers')) {
      tables.add('item_suppliers');
    }
    
    // همیشه جدول items را اضافه کن (جدول اصلی)
    tables.add('items');
    
    return tables;
  }

  /**
   * ساخت بخش SELECT
   */
  private static buildSelectClause(columns: any[]): string {
    const selectFields: string[] = [];
    
    columns.forEach(column => {
      const fieldMapping = FIELD_MAPPINGS[column.id];
      if (!fieldMapping) return;
      
      let fieldExpression = '';
      
      if (fieldMapping.table === 'calculated') {
        // فیلدهای محاسبه شده
        if (column.id === 'total_value') {
          fieldExpression = '(ie.quantity * COALESCE(ie."unitPrice", 0))';
          // اعمال تجمیع در صورت نیاز
          if (column.aggregation && column.aggregation !== 'none') {
            fieldExpression = `SUM(${fieldExpression})`;
          }
        } else if (column.id === 'current_stock') {
          fieldExpression = `(
            SELECT COALESCE(SUM(
              CASE WHEN ie2.type = 'IN' THEN ie2.quantity 
                   WHEN ie2.type = 'OUT' THEN -ie2.quantity 
                   ELSE 0 END
            ), 0)
            FROM "InventoryEntry" ie2 
            WHERE ie2."itemId" = i.id
          )`;
        }
      } else {
        // فیلدهای عادی
        const tableAlias = this.getTableAlias(fieldMapping.table);
        fieldExpression = `${tableAlias}."${fieldMapping.column}"`;
        
        // اعمال تجمیع در صورت نیاز
        if (column.aggregation && column.aggregation !== 'none') {
          switch (column.aggregation) {
            case 'sum':
              fieldExpression = `SUM(${fieldExpression})`;
              break;
            case 'avg':
              fieldExpression = `AVG(${fieldExpression})`;
              break;
            case 'count':
              fieldExpression = `COUNT(${fieldExpression})`;
              break;
            case 'min':
              fieldExpression = `MIN(${fieldExpression})`;
              break;
            case 'max':
              fieldExpression = `MAX(${fieldExpression})`;
              break;
          }
        }
      }
      
      selectFields.push(`${fieldExpression} AS "${column.label || column.id}"`);
    });
    
    return selectFields.length > 0 ? selectFields.join(', ') : 'i.id';
  }

  /**
   * ساخت بخش FROM و JOIN
   */
  private static buildFromClause(tables: Set<string>): string {
    let fromClause = '"Item" i';
    
    // Join InventoryEntry if needed
    if (tables.has('inventory_entries')) {
      fromClause += ' LEFT JOIN "InventoryEntry" ie ON ie."itemId" = i.id';
    }
    
    // Join User only if both users and inventory_entries tables are needed
    if (tables.has('users') && tables.has('inventory_entries')) {
      fromClause += ' LEFT JOIN "User" u ON u.id = ie."userId"';
    }
    
    // Join ItemSupplier if needed
    if (tables.has('item_suppliers')) {
      fromClause += ' LEFT JOIN "ItemSupplier" isp ON isp."itemId" = i.id';
    }
    
    // Join Supplier only if both suppliers and item_suppliers tables are needed
    if (tables.has('suppliers') && tables.has('item_suppliers')) {
      fromClause += ' LEFT JOIN "Supplier" s ON s.id = isp."supplierId"';
    }
    
    return fromClause;
  }

  /**
   * ساخت بخش WHERE - CRITICAL: Always include tenant filtering
   */
  private static buildWhereClause(filters: any[], parameters?: any, tenantId?: string): string {
    const conditions: string[] = [];
    
    // CRITICAL SECURITY FIX: Always add tenant filtering first to prevent data leakage
    if (tenantId) {
      conditions.push(`i."tenantId" = '${tenantId}'`);
      console.log('DEBUG: Added tenant filtering:', `i."tenantId" = '${tenantId}'`);
    } else {
      console.warn('WARNING: No tenantId provided to QueryBuilder - potential data leakage risk!');
      // For safety, we could throw an error here, but for now we'll log a warning
      // throw new Error('TenantId is required for security - cannot build query without tenant context');
    }
    
    // فیلتر پیش‌فرض: فقط کالاهای فعال
    conditions.push('i."isActive" = true');
    
    // Add debugging to see what filters are being processed
    console.log('DEBUG: Processing filters:', JSON.stringify(filters, null, 2));
    
    filters.forEach((filter, index) => {
      console.log(`DEBUG: Processing filter ${index}:`, filter);
      
      const fieldMapping = FIELD_MAPPINGS[filter.field];
      if (!fieldMapping) {
        console.log(`DEBUG: No field mapping found for: ${filter.field}`);
        return;
      }
      
      // Skip empty or invalid filters
      if (!filter.value || filter.value === '' || filter.value === null || filter.value === undefined) {
        console.log(`DEBUG: Skipping empty filter for field: ${filter.field}`);
        return;
      }
      
      // Skip calculated field filters completely
      if (fieldMapping.table === 'calculated') {
        console.log(`DEBUG: Skipping calculated field filter: ${filter.field}`);
        return;
      }
      
      let condition = '';
      const tableAlias = this.getTableAlias(fieldMapping.table);
      const fieldName = `${tableAlias}."${fieldMapping.column}"`;
      
      console.log(`DEBUG: Building condition for ${filter.field}: ${fieldName} ${filter.operator} ${filter.value}`);
      
      switch (filter.operator) {
        case 'equals':
          condition = `${fieldName} = '${filter.value}'`;
          break;
        case 'contains':
          condition = `${fieldName} ILIKE '%${filter.value}%'`;
          break;
        case 'greater':
          condition = `${fieldName} > ${filter.value}`;
          break;
        case 'less':
          condition = `${fieldName} < ${filter.value}`;
          break;
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            condition = `${fieldName} BETWEEN ${filter.value[0]} AND ${filter.value[1]}`;
          }
          break;
        case 'in':
          if (Array.isArray(filter.value)) {
            const values = filter.value.map((v: any) => `'${v}'`).join(', ');
            condition = `${fieldName} IN (${values})`;
          }
          break;
      }
      
      if (condition) {
        console.log(`DEBUG: Adding condition: ${condition}`);
        conditions.push(condition);
      }
    });
    
    // اعمال پارامترهای اضافی
    if (parameters) {
      if (parameters.dateRange) {
        const dateCondition = `ie."createdAt" BETWEEN '${parameters.dateRange.start}' AND '${parameters.dateRange.end}'`;
        console.log(`DEBUG: Adding date range condition: ${dateCondition}`);
        conditions.push(dateCondition);
      }
      
      if (parameters.itemIds && Array.isArray(parameters.itemIds)) {
        const itemIds = parameters.itemIds.map((id: any) => `'${id}'`).join(', ');
        const itemCondition = `i.id IN (${itemIds})`;
        console.log(`DEBUG: Adding item IDs condition: ${itemCondition}`);
        conditions.push(itemCondition);
      }
    }
    
    const finalWhere = conditions.length > 0 ? conditions.join(' AND ') : '';
    console.log(`DEBUG: Final WHERE clause: ${finalWhere}`);
    
    return finalWhere;
  }

  /**
   * ساخت بخش GROUP BY
   */
  private static buildGroupByClause(columns: any[]): string {
    const groupFields: string[] = [];
    let hasAggregation = false;
    
    columns.forEach(column => {
      const fieldMapping = FIELD_MAPPINGS[column.id];
      if (!fieldMapping) return;
      
      if (column.aggregation && column.aggregation !== 'none') {
        hasAggregation = true;
      } else if (fieldMapping.table !== 'calculated') {
        // فقط فیلدهای غیر محاسبه شده را در GROUP BY قرار بده
        const tableAlias = this.getTableAlias(fieldMapping.table);
        const fieldExpression = `${tableAlias}."${fieldMapping.column}"`;
        if (!groupFields.includes(fieldExpression)) {
          groupFields.push(fieldExpression);
        }
      }
    });
    
    // اگر تجمیع وجود دارد، GROUP BY اعمال شود
    return hasAggregation && groupFields.length > 0 ? groupFields.join(', ') : '';
  }

  /**
   * ساخت بخش ORDER BY
   */
  private static buildOrderByClause(sorting: any[], hasGroupBy: boolean = false, groupByFields: string[] = []): string {
    const orderFields: string[] = [];
    
    sorting.forEach(sort => {
      const fieldMapping = FIELD_MAPPINGS[sort.field];
      if (!fieldMapping) return;
      
      const tableAlias = this.getTableAlias(fieldMapping.table);
      const fieldExpression = `${tableAlias}."${fieldMapping.column}"`;
      const direction = sort.direction === 'desc' ? 'DESC' : 'ASC';
      
      // اگر GROUP BY وجود دارد، فقط فیلدهای موجود در GROUP BY یا تجمیع شده را استفاده کن
      if (hasGroupBy) {
        if (groupByFields.includes(fieldExpression)) {
          orderFields.push(`${fieldExpression} ${direction}`);
        }
      } else {
        orderFields.push(`${fieldExpression} ${direction}`);
      }
    });
    
    // اگر هیچ ORDER BY معتبری وجود ندارد و GROUP BY نداریم، از پیش‌فرض استفاده کن
    if (orderFields.length === 0 && !hasGroupBy) {
      return 'i."createdAt" DESC';
    }
    
    // اگر GROUP BY داریم و هیچ ORDER BY معتبری نیست، از اولین فیلد GROUP BY استفاده کن
    if (orderFields.length === 0 && hasGroupBy && groupByFields.length > 0) {
      return `${groupByFields[0]} ASC`;
    }
    
    return orderFields.join(', ');
  }

  /**
   * دریافت نام مستعار جدول
   */
  private static getTableAlias(tableName: string): string {
    const aliases: { [key: string]: string } = {
      'items': 'i',
      'inventory_entries': 'ie',
      'users': 'u',
      'suppliers': 's',
      'item_suppliers': 'isp',
      'calculated': 'calc' // for calculated fields
    };
    
    return aliases[tableName] || tableName;
  }

  /**
   * اعتبارسنجی کوئری برای امنیت
   */
  static validateQuery(query: string): boolean {
    // کلمات کلیدی خطرناک
    const dangerousKeywords = [
      'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE',
      'EXEC', 'EXECUTE', 'DECLARE', 'CURSOR', 'PROCEDURE', 'FUNCTION'
    ];
    
    const upperQuery = query.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * دریافت فیلدهای موجود برای گزارش‌سازی
   */
  static getAvailableFields(): any[] {
    return Object.entries(FIELD_MAPPINGS).map(([id, mapping]) => ({
      id,
      name: mapping.column,
      type: mapping.type,
      table: mapping.table,
      label: this.getFieldLabel(id),
      aggregation: 'none' // Default to no aggregation, let user choose
    }));
  }

  /**
   * دریافت برچسب فیلد
   */
  private static getFieldLabel(fieldId: string): string {
    const labels: Record<string, string> = {
      // Primary field mappings
      'item_name': 'نام کالا',
      'item_category': 'دسته‌بندی',
      'quantity': 'تعداد',
      'unit_price': 'قیمت واحد',
      'total_value': 'ارزش کل',
      'entry_date': 'تاریخ ورود/خروج',
      'entry_type': 'نوع تراکنش',
      'user_name': 'نام کاربر',
      'supplier_name': 'نام تأمین‌کننده',
      'current_stock': 'موجودی فعلی',
      
      // Additional item fields
      'item_unit': 'واحد',
      'item_description': 'توضیحات',
      'item_barcode': 'بارکد',
      'item_min_stock': 'حداقل موجودی',
      'item_is_active': 'وضعیت فعال',
      'item_created_at': 'تاریخ ایجاد کالا',
      
      // Inventory fields
      'inventory_quantity': 'مقدار تراکنش',
      'inventory_type': 'نوع تراکنش',
      'inventory_unit_price': 'قیمت واحد تراکنش',
      'inventory_note': 'یادداشت',
      'inventory_batch_number': 'شماره دسته',
      'inventory_expiry_date': 'تاریخ انقضا',
      'inventory_created_at': 'تاریخ تراکنش',
      
      // User fields
      'user_email': 'ایمیل کاربر',
      'user_role': 'نقش کاربر',
      'user_active': 'وضعیت کاربر',
      'user_created_at': 'تاریخ عضویت',
      
      // Supplier fields
      'supplier_contact_name': 'نام تماس',
      'supplier_email': 'ایمیل تأمین‌کننده',
      'supplier_phone': 'تلفن',
      'supplier_address': 'آدرس',
      'supplier_is_active': 'وضعیت تأمین‌کننده',
      
      // Item-Supplier fields
      'item_supplier_unit_price': 'قیمت از تأمین‌کننده',
      'item_supplier_preferred': 'تأمین‌کننده ترجیحی'
    };
    return labels[fieldId] || fieldId;
  }
}