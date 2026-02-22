'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBIWorkspace } from '../../../../contexts/BIWorkspaceContext';
import { biService } from '../../../../services/biService';
import { SchemaViewer } from '../../../../components/bi/SchemaViewer';
import { ReportFieldPalette } from '../../../../components/bi/ReportFieldPalette';
import { toast } from 'react-hot-toast';
import { Card, Section } from '../../../../components/ui';

interface SchemaField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
  description?: string;
  workspace: 'ordering' | 'inventory';
  table: string;
  fieldName: string;
}

interface AggregationField {
  workspace: string;
  table: string;
  field: string;
  alias?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

interface AggregationFilter {
  workspace: string;
  table: string;
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
  value: unknown;
}

export default function DataExplorerPage() {
  const { workspace } = useBIWorkspace();
  
  // Determine available workspaces based on selected workspace
  const getAvailableWorkspaces = useCallback(() => {
    if (workspace === 'merged') {
      return ['ordering', 'inventory'];
    }
    return [workspace];
  }, [workspace]);

  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(() => {
    if (workspace === 'merged') {
      return ['ordering'];
    }
    return [workspace];
  });

  // Update selected workspaces when workspace changes
  useEffect(() => {
    const available = getAvailableWorkspaces();
    if (available.length > 0 && (!selectedWorkspaces.length || !available.includes(selectedWorkspaces[0]))) {
      setSelectedWorkspaces([available[0]]);
    }
  }, [workspace, getAvailableWorkspaces, selectedWorkspaces]);

  const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'UNION' | 'CROSS'>('INNER');
  const [fields, setFields] = useState<AggregationField[]>([]);
  const [filters, setFilters] = useState<AggregationFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<Array<{ field: string; direction: 'asc' | 'desc' }>>([]);
  const [limit, setLimit] = useState<number>(100);
  const [results, setResults] = useState<{
    rows?: Array<Record<string, unknown>>;
    columns?: string[];
    rowCount?: number;
    metadata?: {
      executionTime?: number;
      cached?: boolean;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  
  // Schema and field management
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Helper function to map schema types to field types
  const mapSchemaTypeToFieldType = (schemaType: string): 'text' | 'number' | 'date' | 'boolean' | 'currency' => {
    const lowerType = schemaType.toLowerCase();
    if (lowerType.includes('int') || lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('number')) {
      return 'number';
    }
    if (lowerType.includes('date') || lowerType.includes('time')) {
      return 'date';
    }
    if (lowerType.includes('bool')) {
      return 'boolean';
    }
    if (lowerType.includes('money') || lowerType.includes('currency') || lowerType.includes('price') || lowerType.includes('amount')) {
      return 'currency';
    }
    return 'text';
  };

  // Helper function to get Persian labels for fields
  const getFieldLabel = (table: string, fieldName: string): string => {
    const labelMap: Record<string, Record<string, string>> = {
      'orders': {
        'id': 'شناسه',
        'orderNumber': 'شماره سفارش',
        'totalAmount': 'مجموع سفارش',
        'orderDate': 'تاریخ سفارش',
        'status': 'وضعیت',
        'orderType': 'نوع سفارش',
        'customerName': 'نام مشتری',
        'tableId': 'شناسه میز'
      },
      'orderItems': {
        'id': 'شناسه',
        'orderId': 'شناسه سفارش',
        'menuItemId': 'شناسه آیتم منو',
        'itemName': 'نام آیتم',
        'quantity': 'تعداد',
        'unitPrice': 'قیمت واحد',
        'totalPrice': 'قیمت کل'
      },
      'items': {
        'id': 'شناسه',
        'name': 'نام',
        'category': 'دسته‌بندی',
        'unit': 'واحد',
        'currentStock': 'موجودی فعلی',
        'minStock': 'حداقل موجودی'
      },
      'inventoryEntries': {
        'id': 'شناسه',
        'itemId': 'شناسه کالا',
        'quantity': 'تعداد',
        'type': 'نوع',
        'unitPrice': 'قیمت واحد',
        'createdAt': 'تاریخ ایجاد'
      }
    };

    return labelMap[table]?.[fieldName] || fieldName;
  };

  // Load schema and build field definitions
  const loadSchemaFields = useCallback(async () => {
    try {
      setLoadingSchema(true);
      const fields: SchemaField[] = [];

      // Determine which workspaces to load
      const workspacesToLoad: string[] = [];
      if (workspace === 'merged') {
        workspacesToLoad.push('ordering', 'inventory');
      } else if (workspace === 'ordering') {
        workspacesToLoad.push('ordering');
      } else if (workspace === 'inventory') {
        workspacesToLoad.push('inventory');
      }

      // Load schema for each workspace
      for (const ws of workspacesToLoad) {
        try {
          const schemaData = await biService.getSchema(ws as 'ordering' | 'inventory');
          
          // Handle both single schema and workspaces array response
          let schema: { tables: Array<{ name: string; fields: Array<{ name: string; type: string; nullable: boolean }> }> } | null = null;
          
          if (schemaData.workspace && schemaData.schema) {
            schema = schemaData.schema as { tables: Array<{ name: string; fields: Array<{ name: string; type: string; nullable: boolean }> }> };
          } else if (schemaData.workspaces) {
            const wsData = schemaData.workspaces.find((w: { workspace: string }) => 
              w.workspace === (ws === 'ordering' ? 'ordering-sales-system' : 'inventory-management')
            );
            if (wsData) {
              schema = wsData.schema as { tables: Array<{ name: string; fields: Array<{ name: string; type: string; nullable: boolean }> }> };
            }
          }

          if (schema && schema.tables) {
            // Map schema tables and fields to field definitions
            schema.tables.forEach(table => {
              const categoryMap: Record<string, string> = {
                'items': 'کالا',
                'inventoryEntries': 'موجودی',
                'orders': 'سفارش',
                'orderItems': 'آیتم سفارش',
                'payments': 'پرداخت'
              };

              const category = categoryMap[table.name] || table.name;

              table.fields.forEach(field => {
                // Skip tenantId
                if (field.name === 'tenantId') {
                  return;
                }

                const fieldLabel = getFieldLabel(table.name, field.name);
                
                const finalLabel = fieldLabel && fieldLabel.trim() !== '' 
                  ? fieldLabel.trim() 
                  : field.name;

                fields.push({
                  id: `${table.name}_${field.name}`,
                  label: finalLabel,
                  type: mapSchemaTypeToFieldType(field.type),
                  category,
                  description: `${finalLabel} از جدول ${table.name}`,
                  workspace: ws === 'ordering' ? 'ordering' : 'inventory',
                  table: table.name,
                  fieldName: field.name
                });
              });
            });
          }
        } catch (error) {
          console.error(`Error loading schema for ${ws}:`, error);
        }
      }

      setSchemaFields(fields);
    } catch (error) {
      console.error('Error loading schema fields:', error);
      toast.error('خطا در بارگذاری فیلدها از schema');
    } finally {
      setLoadingSchema(false);
    }
  }, [workspace]);

  // Load schema on mount and when workspace changes
  useEffect(() => {
    loadSchemaFields();
  }, [loadSchemaFields]);

  // Filter available fields based on selected workspaces
  const availableFields = useMemo(() => {
    return schemaFields.filter(field => 
      selectedWorkspaces.includes(field.workspace)
    );
  }, [schemaFields, selectedWorkspaces]);

  // Get tables for a specific workspace
  const getTablesForWorkspace = (ws: string) => {
    const wsFields = availableFields.filter(f => f.workspace === ws);
    return Array.from(new Set(wsFields.map(f => f.table)));
  };

  // Get fields for a specific workspace and table
  const getFieldsForTable = (ws: string, table: string) => {
    return availableFields.filter(f => f.workspace === ws && f.table === table);
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'field') {
      const field = active.data.current.field as SchemaField;
      handleAddFieldFromPalette(field);
    }
  };

  const handleAddFieldFromPalette = (field: { id: string; label: string; table?: string; fieldName?: string; workspace?: string }) => {
    // Find the full field definition from schemaFields
    const fullField = schemaFields.find(f => f.id === field.id);
    if (fullField) {
      setFields([...fields, {
        workspace: fullField.workspace,
        table: fullField.table,
        field: fullField.fieldName,
        aggregation: 'none'
      }]);
      toast.success(`فیلد ${fullField.label} اضافه شد`);
    }
  };

  const handleAddField = () => {
    setFields([...fields, {
      workspace: selectedWorkspaces[0] || 'ordering',
      table: '',
      field: '',
      aggregation: 'none'
    }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, updates: Partial<AggregationField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleAddFilter = () => {
    setFilters([...filters, {
      workspace: selectedWorkspaces[0] || 'ordering',
      table: '',
      field: '',
      operator: 'equals',
      value: ''
    }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleUpdateFilter = (index: number, updates: Partial<AggregationFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const handleAddGroupBy = () => {
    // Get available fields from selected fields
    const availableFieldIds = fields
      .filter(f => f.table && f.field)
      .map(f => `${f.table}_${f.field}`);
    
    if (availableFieldIds.length === 0) {
      toast.error('ابتدا فیلدها را اضافه کنید');
      return;
    }

    setGroupBy([...groupBy, '']);
  };

  const handleRemoveGroupBy = (index: number) => {
    setGroupBy(groupBy.filter((_, i) => i !== index));
  };

  const handleUpdateGroupBy = (index: number, fieldId: string) => {
    const newGroupBy = [...groupBy];
    newGroupBy[index] = fieldId;
    setGroupBy(newGroupBy);
  };

  const handleAddOrderBy = () => {
    setOrderBy([...orderBy, { field: '', direction: 'asc' }]);
  };

  const handleRemoveOrderBy = (index: number) => {
    setOrderBy(orderBy.filter((_, i) => i !== index));
  };

  const handleUpdateOrderBy = (index: number, updates: Partial<{ field: string; direction: 'asc' | 'desc' }>) => {
    const newOrderBy = [...orderBy];
    newOrderBy[index] = { ...newOrderBy[index], ...updates };
    setOrderBy(newOrderBy);
  };

  const handleExecuteQuery = async () => {
    // Filter out empty fields and validate
    const validFields = fields.filter(f => f.table && f.field);
    if (validFields.length === 0) {
      toast.error('حداقل یک فیلد با جدول و فیلد انتخاب شده نیاز است');
      return;
    }
    
    // Warn if there are incomplete fields
    const incompleteFields = fields.filter(f => !f.table || !f.field);
    if (incompleteFields.length > 0) {
      toast.error(`${incompleteFields.length} فیلد ناقص است. لطفاً جدول و فیلد را انتخاب کنید یا فیلدهای خالی را حذف کنید.`);
      return;
    }

    try {
      setLoading(true);
      
      // Map groupBy field IDs to field names
      const mappedGroupBy = groupBy
        .filter(g => g)
        .map(fieldId => {
          const field = schemaFields.find(f => f.id === fieldId);
          return field ? `${field.table}.${field.fieldName}` : fieldId;
        });
      
      // Map orderBy field IDs to field names
      const mappedOrderBy = orderBy
        .filter(o => o.field)
        .map(order => {
          const field = schemaFields.find(f => f.id === order.field);
          return {
            field: field ? `${field.table}.${field.fieldName}` : order.field,
            direction: order.direction
          };
        });
      
      const result = await biService.aggregate({
        workspaces: selectedWorkspaces,
        joinType,
        fields: validFields, // Use only valid fields
        filters: filters.length > 0 ? filters : undefined,
        groupBy: mappedGroupBy.length > 0 ? mappedGroupBy : undefined,
        orderBy: mappedOrderBy.length > 0 ? mappedOrderBy : undefined,
        limit
      });
      setResults(result as typeof results);
      toast.success('داده‌ها با موفقیت دریافت شدند');
    } catch (error) {
      console.error('Error executing query:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در اجرای query');
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = async () => {
    // Filter out empty fields and validate
    const validFields = fields.filter(f => f.table && f.field);
    if (validFields.length === 0) {
      toast.error('حداقل یک فیلد با جدول و فیلد انتخاب شده نیاز است');
      return;
    }
    
    // Warn if there are incomplete fields
    const incompleteFields = fields.filter(f => !f.table || !f.field);
    if (incompleteFields.length > 0) {
      toast.error(`${incompleteFields.length} فیلد ناقص است. لطفاً جدول و فیلد را انتخاب کنید یا فیلدهای خالی را حذف کنید.`);
      return;
    }

    try {
      setLoading(true);
      
      // Map groupBy field IDs to field names
      const mappedGroupBy = groupBy
        .filter(g => g)
        .map(fieldId => {
          const field = schemaFields.find(f => f.id === fieldId);
          return field ? `${field.table}.${field.fieldName}` : fieldId;
        });
      
      // Map orderBy field IDs to field names
      const mappedOrderBy = orderBy
        .filter(o => o.field)
        .map(order => {
          const field = schemaFields.find(f => f.id === order.field);
          return {
            field: field ? `${field.table}.${field.fieldName}` : order.field,
            direction: order.direction
          };
        });
      
      const result = await biService.explore({
        workspaces: selectedWorkspaces,
        fields: validFields, // Use only valid fields
        filters: filters.length > 0 ? filters : undefined,
        groupBy: mappedGroupBy.length > 0 ? mappedGroupBy : undefined,
        orderBy: mappedOrderBy.length > 0 ? mappedOrderBy : undefined,
        limit,
        offset: 0,
        joinType
      });
      setResults(result as typeof results);
      toast.success('اکتشاف داده با موفقیت انجام شد');
    } catch (error) {
      console.error('Error exploring data:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در اکتشاف داده');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Section className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Data Explorer
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                اکتشاف و تجمیع داده‌ها از چندین workspace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSchema(!showSchema)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showSchema ? 'مخفی کردن' : 'نمایش'} Schema
              </button>
            </div>
          </div>
        </Card>

        {/* Schema Viewer */}
        {showSchema && (
          <div className={`grid gap-6 ${workspace === 'merged' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {(workspace === 'ordering' || workspace === 'merged') && (
              <SchemaViewer workspace="ordering" />
            )}
            {(workspace === 'inventory' || workspace === 'merged') && (
              <SchemaViewer workspace="inventory" />
            )}
          </div>
        )}

        {/* Query Builder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Query Builder</h2>
          
          {/* Workspace Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspaces
            </label>
            <div className="flex gap-4">
              {(workspace === 'ordering' || workspace === 'merged') && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedWorkspaces.includes('ordering')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorkspaces([...selectedWorkspaces, 'ordering']);
                      } else {
                        setSelectedWorkspaces(selectedWorkspaces.filter(w => w !== 'ordering'));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Ordering</span>
                </label>
              )}
              {(workspace === 'inventory' || workspace === 'merged') && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedWorkspaces.includes('inventory')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorkspaces([...selectedWorkspaces, 'inventory']);
                      } else {
                        setSelectedWorkspaces(selectedWorkspaces.filter(w => w !== 'inventory'));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Inventory</span>
                </label>
              )}
            </div>
          </div>

          {/* Join Type */}
          {selectedWorkspaces.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Join Type
              </label>
              <select
                value={joinType}
                onChange={(e) => setJoinType(e.target.value as typeof joinType)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="INNER">INNER JOIN</option>
                <option value="LEFT">LEFT JOIN</option>
                <option value="UNION">UNION</option>
                <option value="CROSS">CROSS JOIN</option>
              </select>
            </div>
          )}

          {/* Field Palette */}
          {!loadingSchema && availableFields.length > 0 && (
            <div className="mb-6">
              <ReportFieldPalette
                availableFields={availableFields}
                onFieldAdd={handleAddFieldFromPalette}
                selectedFields={fields.map(f => `${f.table}_${f.field}`)}
                useSharedContext={true}
              />
            </div>
          )}

          {/* Fields */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fields
              </label>
              <button
                onClick={handleAddField}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + افزودن فیلد
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => {
                const tables = getTablesForWorkspace(field.workspace);
                const tableFields = field.table ? getFieldsForTable(field.workspace, field.table) : [];
                const isIncomplete = !field.table || !field.field;
                
                return (
                  <div key={index} className={`flex gap-2 items-center p-3 rounded-lg flex-wrap ${isIncomplete ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
                    <select
                      value={field.workspace}
                      onChange={(e) => handleUpdateField(index, { workspace: e.target.value, table: '', field: '' })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="ordering">Ordering</option>
                      <option value="inventory">Inventory</option>
                    </select>
                    <select
                      value={field.table}
                      onChange={(e) => handleUpdateField(index, { table: e.target.value, field: '' })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="">انتخاب جدول</option>
                      {tables.map(table => (
                        <option key={table} value={table}>{table}</option>
                      ))}
                    </select>
                    <select
                      value={field.field}
                      onChange={(e) => handleUpdateField(index, { field: e.target.value })}
                      disabled={!field.table}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex-1 min-w-0 sm:min-w-[150px] disabled:opacity-50"
                    >
                      <option value="">انتخاب فیلد</option>
                      {tableFields.map(f => (
                        <option key={f.id} value={f.fieldName}>{f.label} ({f.type})</option>
                      ))}
                    </select>
                    <select
                      value={field.aggregation}
                      onChange={(e) => handleUpdateField(index, { aggregation: e.target.value as AggregationField['aggregation'] })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="none">None</option>
                      <option value="sum">SUM</option>
                      <option value="avg">AVG</option>
                      <option value="count">COUNT</option>
                      <option value="min">MIN</option>
                      <option value="max">MAX</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Alias (optional)"
                      value={field.alias || ''}
                      onChange={(e) => handleUpdateField(index, { alias: e.target.value })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                    <button
                      onClick={() => handleRemoveField(index)}
                      className="w-full sm:w-auto px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters
              </label>
              <button
                onClick={handleAddFilter}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + افزودن فیلتر
              </button>
            </div>
            <div className="space-y-2">
              {filters.map((filter, index) => {
                const tables = getTablesForWorkspace(filter.workspace);
                const tableFields = filter.table ? getFieldsForTable(filter.workspace, filter.table) : [];
                
                return (
                  <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex-wrap">
                    <select
                      value={filter.workspace}
                      onChange={(e) => handleUpdateFilter(index, { workspace: e.target.value, table: '', field: '' })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="ordering">Ordering</option>
                      <option value="inventory">Inventory</option>
                    </select>
                    <select
                      value={filter.table}
                      onChange={(e) => handleUpdateFilter(index, { table: e.target.value, field: '' })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="">انتخاب جدول</option>
                      {tables.map(table => (
                        <option key={table} value={table}>{table}</option>
                      ))}
                    </select>
                    <select
                      value={filter.field}
                      onChange={(e) => handleUpdateFilter(index, { field: e.target.value })}
                      disabled={!filter.table}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 min-w-0 sm:min-w-[150px] disabled:opacity-50"
                    >
                      <option value="">انتخاب فیلد</option>
                      {tableFields.map(f => (
                        <option key={f.id} value={f.fieldName}>{f.label} ({f.type})</option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => handleUpdateFilter(index, { operator: e.target.value as AggregationFilter['operator'] })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="equals">Equals</option>
                      <option value="notEquals">Not Equals</option>
                      <option value="greaterThan">Greater Than</option>
                      <option value="lessThan">Less Than</option>
                      <option value="contains">Contains</option>
                      <option value="in">In</option>
                      <option value="between">Between</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Value"
                      value={String(filter.value)}
                      onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex-1 min-w-0 sm:min-w-[150px]"
                    />
                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="w-full sm:w-auto px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group By */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Group By
              </label>
              <button
                onClick={handleAddGroupBy}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + افزودن Group By
              </button>
            </div>
            <div className="space-y-2">
              {groupBy.map((fieldId, index) => {
                const availableFieldIds = fields
                  .filter(f => f.table && f.field)
                  .map(f => `${f.table}_${f.field}`);
                const fieldOptions = availableFields.filter(f => availableFieldIds.includes(f.id));
                
                return (
                  <div key={index} className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <select
                      value={fieldId}
                      onChange={(e) => handleUpdateGroupBy(index, e.target.value)}
                      className="w-full sm:flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="">انتخاب فیلد</option>
                      {fieldOptions.map(f => (
                        <option key={f.id} value={f.id}>{f.label} ({f.table})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveGroupBy(index)}
                      className="w-full sm:w-auto px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order By */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Order By
              </label>
              <button
                onClick={handleAddOrderBy}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + افزودن Order By
              </button>
            </div>
            <div className="space-y-2">
              {orderBy.map((order, index) => {
                const availableFieldIds = fields
                  .filter(f => f.table && f.field)
                  .map(f => `${f.table}_${f.field}`);
                const fieldOptions = availableFields.filter(f => availableFieldIds.includes(f.id));
                
                return (
                  <div key={index} className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <select
                      value={order.field}
                      onChange={(e) => handleUpdateOrderBy(index, { field: e.target.value })}
                      className="w-full sm:flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="">انتخاب فیلد</option>
                      {fieldOptions.map(f => (
                        <option key={f.id} value={f.id}>{f.label} ({f.table})</option>
                      ))}
                    </select>
                    <select
                      value={order.direction}
                      onChange={(e) => handleUpdateOrderBy(index, { direction: e.target.value as 'asc' | 'desc' })}
                      className="w-full sm:w-auto px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="asc">صعودی (ASC)</option>
                      <option value="desc">نزولی (DESC)</option>
                    </select>
                    <button
                      onClick={() => handleRemoveOrderBy(index)}
                      className="w-full sm:w-auto px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Limit */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Limit (تعداد رکوردها)
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
              min={1}
              max={1000}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-32"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExecuteQuery}
              disabled={loading || fields.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال اجرا...' : 'اجرای Query'}
            </button>
            <button
              onClick={handleExplore}
              disabled={loading || fields.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال اکتشاف...' : 'اکتشاف داده'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">نتایج</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {results.columns?.map((col: string) => (
                      <th key={col} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {results.rows?.slice(0, limit).map((row: Record<string, unknown>, index: number) => (
                    <tr key={index}>
                      {results.columns?.map((col: string) => (
                        <td key={col} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.metadata && (
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                تعداد ردیف‌ها: {results.rowCount} | زمان اجرا: {results.metadata.executionTime}ms
                {results.metadata.cached && ' (از cache)'}
              </div>
            )}
          </div>
        )}
      </Section>
    </DndContext>
  );
}
