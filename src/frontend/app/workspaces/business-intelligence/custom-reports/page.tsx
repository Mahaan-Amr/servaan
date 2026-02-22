'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { useBIWorkspace } from '../../../../contexts/BIWorkspaceContext';
import { biService } from '../../../../services/biService';
import toast from 'react-hot-toast';
import { Button, Card, Section } from '../../../../components/ui';
import { 
  ReportField, 
  ReportFilter,
  ReportExecutionResult,
  ReportConfig
} from '../../../../services/reportService';
import { AdvancedReportBuilder } from '../../../../components/bi/AdvancedReportBuilder';
import { FieldFormatting } from '../../../../components/bi/FormattingOptionsPanel';
import { ReportCalculation } from '../../../../components/bi/CalculationsBuilder';
import { ReportSorting as AdvancedReportSorting } from '../../../../components/bi/SortingBuilder';
import { ReportGrouping } from '../../../../components/bi/GroupingBuilder';
import { TemplateLibrary } from '../../../../components/bi/TemplateLibrary';
import { templateService, ReportTemplate } from '../../../../services/templateService';

// Local type definition for sorting since it's not exported from the service
interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
}

interface Report {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
  _count?: {
    executions: number;
  };
  columnsConfig?: ReportField[];
  filtersConfig?: ReportFilter[];
  sortingConfig?: ReportSorting[];
  dataSources?: string[];
}

export default function CustomReportsPage() {
  const { user } = useAuth();
  const { workspace, isOrderingWorkspace, isInventoryWorkspace, isMergedWorkspace } = useBIWorkspace();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null);
  const [executedReport, setExecutedReport] = useState<Report | null>(null); // Store report config for display
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [useBuilderMode, setUseBuilderMode] = useState(true); // Toggle between builder and form mode for create
  const [useEditBuilderMode, setUseEditBuilderMode] = useState(true); // Toggle between builder and form mode for edit
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);

  // Create report form state
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    reportType: 'TABULAR' as 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT',
    tags: [] as string[],
    isPublic: false,
    selectedFields: [] as string[],
    filters: [] as ReportFilter[],
    sorting: [] as ReportSorting[]
  });

  // Edit report form state
  const [editReport, setEditReport] = useState({
    name: '',
    description: '',
    reportType: 'TABULAR' as 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT',
    tags: [] as string[],
    isPublic: false,
    selectedFields: [] as string[],
    filters: [] as ReportFilter[],
    sorting: [] as ReportSorting[]
  });

  // Schema-based field definitions (loaded dynamically)
  interface SchemaField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
    category: string;
    description?: string;
    workspace: 'ordering' | 'inventory' | 'merged';
    table: string;
    fieldName: string;
  }

  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [selectedDataSources, setSelectedDataSources] = useState<Array<{ workspace: string; table: string }>>([]);

  // Helper function to map schema types to field types
  const mapSchemaTypeToFieldType = (schemaType: string): 'text' | 'number' | 'date' | 'boolean' | 'currency' => {
    const typeMap: Record<string, 'text' | 'number' | 'date' | 'boolean' | 'currency'> = {
      'string': 'text',
      'number': 'number',
      'date': 'date',
      'boolean': 'boolean',
      'currency': 'currency'
    };
    return typeMap[schemaType.toLowerCase()] || 'text';
  };

  // Helper function to get Persian labels for fields
  const getFieldLabel = (table: string, field: string): string => {
    // Common field labels (used across multiple tables)
    const commonLabels: Record<string, string> = {
      'id': 'شناسه',
      'tenantId': 'شناسه مجموعه',
      'createdAt': 'تاریخ ایجاد',
      'updatedAt': 'تاریخ بروزرسانی',
      'createdBy': 'ایجاد کننده',
      'updatedBy': 'بروزرسانی کننده',
      'deletedAt': 'تاریخ حذف',
      'deletedBy': 'حذف کننده'
    };

    // Table-specific field labels
    const labelMap: Record<string, Record<string, string>> = {
      'items': {
        'name': 'نام کالا',
        'category': 'دسته‌بندی',
        'unit': 'واحد',
        'description': 'توضیحات',
        'barcode': 'بارکد',
        'minStock': 'حداقل موجودی',
        'currentStock': 'موجودی فعلی',
        'itemId': 'شناسه کالا',
        'supplierId': 'شناسه تأمین‌کننده',
        'price': 'قیمت',
        'cost': 'هزینه'
      },
      'inventoryEntries': {
        'quantity': 'مقدار',
        'type': 'نوع تراکنش',
        'unitPrice': 'قیمت واحد',
        'createdAt': 'تاریخ تراکنش',
        'note': 'یادداشت',
        'itemId': 'شناسه کالا',
        'userId': 'شناسه کاربر',
        'orderId': 'شناسه سفارش',
        'orderItemId': 'شناسه آیتم سفارش',
        'batchNumber': 'شماره بچ',
        'expiryDate': 'تاریخ انقضا'
      },
      'orders': {
        'orderNumber': 'شماره سفارش',
        'totalAmount': 'مجموع سفارش',
        'orderDate': 'تاریخ سفارش',
        'status': 'وضعیت',
        'orderType': 'نوع سفارش',
        'customerName': 'نام مشتری',
        'customerId': 'شناسه مشتری',
        'customerPhone': 'تلفن مشتری',
        'tableId': 'شناسه میز',
        'guestCount': 'تعداد مهمان',
        'subtotal': 'جمع جزء',
        'discountAmount': 'مبلغ تخفیف',
        'taxAmount': 'مبلغ مالیات',
        'serviceCharge': 'کارمزد سرویس',
        'paymentStatus': 'وضعیت پرداخت',
        'paymentMethod': 'روش پرداخت',
        'paidAmount': 'مبلغ پرداخت شده',
        'changeAmount': 'مبلغ برگشتی',
        'remainingAmount': 'مبلغ باقیمانده',
        'paymentType': 'نوع پرداخت',
        'lastPaymentAt': 'تاریخ آخرین پرداخت',
        'paymentNotes': 'یادداشت پرداخت',
        'estimatedTime': 'زمان تخمینی',
        'startedAt': 'زمان شروع',
        'readyAt': 'زمان آماده',
        'servedAt': 'زمان سرو',
        'completedAt': 'زمان تکمیل',
        'cancelledAt': 'زمان لغو',
        'notes': 'یادداشت',
        'kitchenNotes': 'یادداشت آشپزخانه',
        'allergyInfo': 'اطلاعات آلرژی',
        'priority': 'اولویت',
        'servedBy': 'سرو شده توسط'
      },
      'orderItems': {
        'itemName': 'نام آیتم',
        'quantity': 'تعداد',
        'unitPrice': 'قیمت واحد',
        'totalPrice': 'قیمت کل',
        'orderId': 'شناسه سفارش',
        'menuItemId': 'شناسه آیتم منو',
        'notes': 'یادداشت',
        'modifications': 'تغییرات',
        'allergyInfo': 'اطلاعات آلرژی'
      },
      'payments': {
        'amount': 'مبلغ',
        'paymentMethod': 'روش پرداخت',
        'paymentDate': 'تاریخ پرداخت',
        'orderId': 'شناسه سفارش',
        'processedBy': 'پردازش شده توسط',
        'transactionId': 'شناسه تراکنش',
        'referenceNumber': 'شماره مرجع',
        'notes': 'یادداشت'
      }
    };

    // First check table-specific labels (exact match)
    if (labelMap[table] && labelMap[table][field]) {
      return labelMap[table][field];
    }

    // Then check common labels (exact match)
    if (commonLabels[field]) {
      return commonLabels[field];
    }

    // Fallback: Convert camelCase to readable Persian
    // Split camelCase field names and create meaningful labels
    const camelCaseToWords = (str: string): string[] => {
      return str
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()
        .split(/\s+/);
    };

    const words = camelCaseToWords(field);
    
    // Map common English words to Persian
    const wordMap: Record<string, string> = {
      'order': 'سفارش',
      'number': 'شماره',
      'name': 'نام',
      'date': 'تاریخ',
      'time': 'زمان',
      'amount': 'مبلغ',
      'price': 'قیمت',
      'quantity': 'تعداد',
      'status': 'وضعیت',
      'type': 'نوع',
      'method': 'روش',
      'phone': 'تلفن',
      'count': 'تعداد',
      'notes': 'یادداشت',
      'info': 'اطلاعات',
      'item': 'آیتم',
      'customer': 'مشتری',
      'table': 'میز',
      'total': 'جمع',
      'sub': 'جزء',
      'discount': 'تخفیف',
      'tax': 'مالیات',
      'service': 'سرویس',
      'charge': 'کارمزد',
      'paid': 'پرداخت شده',
      'remaining': 'باقیمانده',
      'change': 'برگشتی',
      'payment': 'پرداخت',
      'created': 'ایجاد',
      'updated': 'بروزرسانی',
      'deleted': 'حذف',
      'by': 'توسط',
      'at': 'در',
      'id': 'شناسه',
      'unit': 'واحد',
      'category': 'دسته‌بندی',
      'description': 'توضیحات',
      'barcode': 'بارکد',
      'stock': 'موجودی',
      'min': 'حداقل',
      'current': 'فعلی',
      'entry': 'ورودی',
      'entries': 'ورودی‌ها',
      'batch': 'بچ',
      'expiry': 'انقضا',
      'transaction': 'تراکنش',
      'reference': 'مرجع',
      'processed': 'پردازش شده',
      'guest': 'مهمان',
      'estimated': 'تخمینی',
      'started': 'شروع',
      'ready': 'آماده',
      'served': 'سرو',
      'completed': 'تکمیل',
      'cancelled': 'لغو',
      'kitchen': 'آشپزخانه',
      'allergy': 'آلرژی',
      'priority': 'اولویت',
      'menu': 'منو'
    };

    // Try to translate each word
    const translatedWords = words.map(word => wordMap[word] || word);
    
    // If we got meaningful translations (at least one word was translated), join them
    const hasTranslation = translatedWords.some((w, i) => w !== words[i]);
    if (hasTranslation) {
      return translatedWords.join(' ');
    }

    // Final fallback: return formatted field name (capitalize first letter)
    return field.charAt(0).toUpperCase() + field.slice(1);
  };

  const loadSchemaFields = useCallback(async () => {
    try {
      setLoadingSchema(true);
      const fields: SchemaField[] = [];

      // Determine which workspaces to load
      const workspacesToLoad: Array<'ordering' | 'inventory'> = [];
      if (isMergedWorkspace) {
        workspacesToLoad.push('ordering', 'inventory');
      } else if (isOrderingWorkspace) {
        workspacesToLoad.push('ordering');
      } else if (isInventoryWorkspace) {
        workspacesToLoad.push('inventory');
      }

      // Load schema for each workspace
      for (const ws of workspacesToLoad) {
        try {
          const schemaData = await biService.getSchema(ws);
          
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

                // Include id only once per table
                if (field.name === 'id' && fields.find(f => f.table === table.name && f.fieldName === 'id')) {
                  return;
                }

                const fieldLabel = getFieldLabel(table.name, field.name);
                
                // Ensure label is never empty - use field name as fallback
                let finalLabel = fieldLabel && fieldLabel.trim() !== '' 
                  ? fieldLabel.trim() 
                  : null;

                // If label is still empty, try to format the field name
                if (!finalLabel || finalLabel === '') {
                  // Convert camelCase to readable format
                  const formatted = field.name
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  finalLabel = formatted;
                }

                // Final safety check - ensure label is never empty
                if (!finalLabel || finalLabel.trim() === '' || finalLabel === field.name) {
                  // Use table.fieldName format as absolute last resort
                  finalLabel = `${table.name}.${field.name}`;
                }

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

      // Debug: Verify all fields have labels
      const fieldsWithoutLabels = fields.filter(f => !f.label || f.label.trim() === '');
      if (fieldsWithoutLabels.length > 0) {
        console.error('Fields without labels:', fieldsWithoutLabels.map(f => ({
          id: f.id,
          table: f.table,
          fieldName: f.fieldName,
          label: f.label
        })));
      }

      // Debug: Log sample fields to verify labels
      if (fields.length > 0) {
        console.log('Sample fields with labels:', fields.slice(0, 5).map(f => ({
          id: f.id,
          label: f.label,
          table: f.table,
          fieldName: f.fieldName,
          type: f.type
        })));
      }

      setSchemaFields(fields);
      
      // Auto-select data sources based on selected fields
      const uniqueTables = Array.from(new Set(fields.map(f => ({ workspace: f.workspace, table: f.table }))));
      setSelectedDataSources(uniqueTables);
    } catch (error) {
      console.error('Error loading schema fields:', error);
      toast.error('خطا در بارگذاری فیلدها از schema');
    } finally {
      setLoadingSchema(false);
    }
  }, [isOrderingWorkspace, isInventoryWorkspace, isMergedWorkspace]);

  // Load schema and build field definitions
  useEffect(() => {
    loadSchemaFields();
  }, [loadSchemaFields]);

  // Filter available fields based on selected workspace
  const availableFields = schemaFields.filter(field => {
    if (isMergedWorkspace) {
      return true; // Show all fields for merged workspace
    }
    if (isOrderingWorkspace) {
      return field.workspace === 'ordering';
    }
    if (isInventoryWorkspace) {
      return field.workspace === 'inventory';
    }
    return false;
  });

  const [builderSelectedFields, setBuilderSelectedFields] = useState<typeof availableFields>([]);
  
  // Advanced builder state for create
  const [advancedFormatting, setAdvancedFormatting] = useState<FieldFormatting[]>([]);
  const [advancedCalculations, setAdvancedCalculations] = useState<ReportCalculation[]>([]);
  const [advancedSorting, setAdvancedSorting] = useState<AdvancedReportSorting[]>([]);
  const [advancedGrouping, setAdvancedGrouping] = useState<ReportGrouping[]>([]);

  // Advanced builder state for edit
  const [editBuilderSelectedFields, setEditBuilderSelectedFields] = useState<typeof availableFields>([]);
  const [editAdvancedFormatting, setEditAdvancedFormatting] = useState<FieldFormatting[]>([]);
  const [editAdvancedCalculations, setEditAdvancedCalculations] = useState<ReportCalculation[]>([]);
  const [editAdvancedSorting, setEditAdvancedSorting] = useState<AdvancedReportSorting[]>([]);
  const [editAdvancedGrouping, setEditAdvancedGrouping] = useState<ReportGrouping[]>([]);

  // Handle template selection
  const handleTemplateSelect = async (template: ReportTemplate) => {
    try {
      // Extract fields from template config
      const templateFields = template.config.columnsConfig.map((col: { id?: string; name?: string; label?: string; type?: string }) => {
        const field = availableFields.find(f => f.id === col.id || f.id === col.name);
        return field || {
          id: col.id || col.name,
          label: col.label || col.name,
          type: col.type || 'text',
          category: 'custom',
          description: col.label
        };
      });

      // Check if we're in edit mode or create mode
      const isEditMode = showEditForm && editingReport;

      if (isEditMode) {
        // Update edit mode state
        setEditBuilderSelectedFields(templateFields as typeof availableFields);
        setEditReport({
          ...editReport,
          name: template.name,
          description: template.description || '',
          reportType: template.reportType,
          selectedFields: templateFields.map((f) => f.id || '').filter(id => id !== ''),
          filters: template.config.filtersConfig || [],
          sorting: template.config.sortingConfig || []
        });

        // Load advanced configurations from template for edit mode
        if (template.config.chartConfig) {
          const chartConfig = template.config.chartConfig as Record<string, unknown>;
          if (chartConfig.calculations && Array.isArray(chartConfig.calculations)) {
            setEditAdvancedCalculations(chartConfig.calculations as ReportCalculation[]);
          }
          if (chartConfig.grouping && Array.isArray(chartConfig.grouping)) {
            setEditAdvancedGrouping(chartConfig.grouping as ReportGrouping[]);
          }
          if (chartConfig.formatting && Array.isArray(chartConfig.formatting)) {
            setEditAdvancedFormatting(chartConfig.formatting as FieldFormatting[]);
          }
        }

        if (template.config.sortingConfig) {
          setEditAdvancedSorting(template.config.sortingConfig as AdvancedReportSorting[]);
        }
      } else {
        // Update create mode state
        setBuilderSelectedFields(templateFields as typeof availableFields);
        setNewReport({
          ...newReport,
          name: template.name,
          description: template.description || '',
          reportType: template.reportType,
          selectedFields: templateFields.map((f) => f.id || '').filter(id => id !== ''),
          filters: template.config.filtersConfig || [],
          sorting: template.config.sortingConfig || []
        });

        // Load advanced configurations from template for create mode
        if (template.config.chartConfig) {
          const chartConfig = template.config.chartConfig as Record<string, unknown>;
          if (chartConfig.calculations && Array.isArray(chartConfig.calculations)) {
            setAdvancedCalculations(chartConfig.calculations as ReportCalculation[]);
          }
          if (chartConfig.grouping && Array.isArray(chartConfig.grouping)) {
            setAdvancedGrouping(chartConfig.grouping as ReportGrouping[]);
          }
          if (chartConfig.formatting && Array.isArray(chartConfig.formatting)) {
            setAdvancedFormatting(chartConfig.formatting as FieldFormatting[]);
          }
        }

        if (template.config.sortingConfig) {
          setAdvancedSorting(template.config.sortingConfig as AdvancedReportSorting[]);
        }

        // Only open create form if we're in create mode
        setShowCreateForm(true);
      }

      setShowTemplateLibrary(false);
      toast.success(`قالب "${template.name}" انتخاب شد`);
    } catch (error) {
      console.error('Error selecting template:', error);
      toast.error('خطا در انتخاب قالب');
    }
  };

  // Handle save as template
  const handleSaveAsTemplate = async () => {
    try {
      if (!newReport.name.trim()) {
        toast.error('نام گزارش الزامی است');
        return;
      }

      if (builderSelectedFields.length === 0) {
        toast.error('حداقل یک فیلد باید انتخاب شده باشد');
        return;
      }

      // Build report config from current state
      const reportConfig: ReportConfig = {
        name: newReport.name,
        description: newReport.description,
        reportType: newReport.reportType,
        dataSources: [
          { id: 'inventory', name: 'Inventory', type: 'database', connection: { table: 'inventory' } },
          { id: 'items', name: 'Items', type: 'database', connection: { table: 'items' } }
        ],
        columnsConfig: builderSelectedFields.map(field => ({
          id: field.id,
          name: field.id,
          type: field.type,
          table: 'auto',
          label: field.label,
          aggregation: 'none'
        })),
        filtersConfig: newReport.filters,
        sortingConfig: advancedSorting.length > 0 ? advancedSorting : newReport.sorting,
        chartConfig: {
          calculations: advancedCalculations,
          grouping: advancedGrouping,
          formatting: advancedFormatting
        },
        layoutConfig: {
          formatting: advancedFormatting
        },
        tags: []
      };

      const templateData = {
        name: `${newReport.name} - قالب`,
        description: newReport.description || `قالب بر اساس گزارش ${newReport.name}`,
        category: 'custom' as const,
        reportType: newReport.reportType,
        config: reportConfig,
        isPublic: false,
        tags: []
      };

      await templateService.createTemplate(templateData);
      toast.success('قالب با موفقیت ذخیره شد');
      setShowSaveAsTemplate(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('خطا در ذخیره قالب');
    }
  };

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('.export-dropdown');
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.add('hidden');
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use biService.getCustomReports() which calls /api/bi/reports
      const response = await biService.getCustomReports(
        1, // page
        50, // limit
        searchTerm || undefined // search
      );
      
      // Unwrap the response: { success: true, data: { reports: [...], pagination: {...} } }
      let fetchedReports: Report[] = [];
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && response.success) {
          const data = response.data as { reports?: Report[]; pagination?: unknown };
          fetchedReports = data.reports || [];
        } else if ('reports' in response) {
          fetchedReports = (response as { reports: Report[] }).reports;
        } else if (Array.isArray(response)) {
          fetchedReports = response as Report[];
        }
      }
      
      // Filter by reportType if not 'ALL'
      if (selectedType !== 'ALL') {
        fetchedReports = fetchedReports.filter(r => r.reportType === selectedType);
      }
      
      setReports(fetchedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت گزارش‌ها';
      setError(errorMessage);
      setReports([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedType, searchTerm]);

  // Load reports on component mount and when selectedType changes
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleCreateReport = async () => {
    try {
      if (!newReport.name.trim()) {
        toast.error('نام گزارش الزامی است');
        return;
      }

      if (newReport.selectedFields.length === 0) {
        toast.error('حداقل یک فیلد برای گزارش انتخاب کنید');
        return;
      }

      // Convert selected fields to proper column configuration
      const columnsConfig = newReport.selectedFields.map(fieldId => {
        const field = availableFields.find(f => f.id === fieldId);
        const formatting = advancedFormatting.find(f => f.fieldId === fieldId);
        const grouping = advancedGrouping.find(g => g.field === fieldId);
        return {
          id: fieldId,
          name: fieldId,
          type: (field?.type || 'text') as 'text' | 'number' | 'date' | 'boolean' | 'currency',
          table: 'auto', // Let backend determine the table
          label: formatting?.label || field?.label || fieldId,
          aggregation: grouping?.aggregation || 'none' as 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'
        };
      });

      const reportConfig = {
        name: newReport.name,
        description: newReport.description,
        reportType: newReport.reportType,
        dataSources: [
          { id: 'inventory', name: 'Inventory', type: 'database' as const, connection: { table: 'inventory' } },
          { id: 'items', name: 'Items', type: 'database' as const, connection: { table: 'items' } }
        ],
        columnsConfig,
        filtersConfig: newReport.filters,
        sortingConfig: advancedSorting.length > 0 ? advancedSorting : newReport.sorting,
        chartConfig: {
          calculations: advancedCalculations,
          grouping: advancedGrouping,
          formatting: advancedFormatting
        },
        layoutConfig: {
          formatting: advancedFormatting
        },
        isPublic: newReport.isPublic,
        tags: newReport.tags
      };

      // Use biService.createCustomReport() which calls /api/bi/reports
      const response = await biService.createCustomReport(reportConfig);
      
      // Unwrap the response if needed
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Response is already unwrapped by apiClient
      }
      toast.success('گزارش با موفقیت ایجاد شد');
      
      // Reset form
      setNewReport({
        name: '',
        description: '',
        reportType: 'TABULAR',
        tags: [],
        isPublic: false,
        selectedFields: [],
        filters: [],
        sorting: []
      });
      setShowCreateForm(false);
      
      // Reload reports
      loadReports();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ایجاد گزارش';
      toast.error(errorMessage);
    }
  };

  const handleEditReport = async (report: Report) => {
    try {
      // Get full report details using biService
      const response = await biService.getReportById(report.id);
      
      // Unwrap the response: { success: true, data: Report }
      let fullReport: Report;
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && response.success) {
          fullReport = response.data as Report;
        } else {
          fullReport = response as Report;
        }
      } else {
        throw new Error('Invalid response format');
      }
      
      // Parse the stored configurations - use type casting to handle missing properties
      const columnsConfig = typeof (fullReport as unknown as Record<string, unknown>).columnsConfig === 'string' 
        ? JSON.parse((fullReport as unknown as Record<string, unknown>).columnsConfig as string) 
        : (fullReport as unknown as Record<string, unknown>).columnsConfig as ReportField[] | undefined;
      
      const filtersConfig = typeof (fullReport as unknown as Record<string, unknown>).filtersConfig === 'string'
        ? JSON.parse((fullReport as unknown as Record<string, unknown>).filtersConfig as string)
        : (fullReport as unknown as Record<string, unknown>).filtersConfig as ReportFilter[] | undefined;
        
      const sortingConfig = typeof (fullReport as unknown as Record<string, unknown>).sortingConfig === 'string'
        ? JSON.parse((fullReport as unknown as Record<string, unknown>).sortingConfig as string)
        : (fullReport as unknown as Record<string, unknown>).sortingConfig as ReportSorting[] | undefined;

      // Extract selected field IDs from columns config
      const selectedFields = columnsConfig ? columnsConfig.map((col: ReportField) => col.id || col.name) : [];

      // Convert columns config to FieldDefinition[] for builder mode
      const builderFields = columnsConfig ? columnsConfig.map((col: ReportField) => {
        const field = availableFields.find(f => f.id === (col.id || col.name));
        return field || {
          id: col.id || col.name,
          label: col.label || col.name,
          type: col.type || 'text',
          category: 'سایر',
          workspace: isMergedWorkspace ? 'merged' : (isOrderingWorkspace ? 'ordering' : 'inventory'),
          table: col.table || 'auto',
          fieldName: col.name || col.id || ''
        };
      }) : [];

      // Parse chart config for advanced settings
      const chartConfig = typeof (fullReport as unknown as Record<string, unknown>).chartConfig === 'string'
        ? JSON.parse((fullReport as unknown as Record<string, unknown>).chartConfig as string)
        : (fullReport as unknown as Record<string, unknown>).chartConfig as { calculations?: ReportCalculation[]; grouping?: ReportGrouping[]; formatting?: FieldFormatting[] } | undefined;

      // Set the editing report and form data
      setEditingReport(fullReport);
      setEditReport({
        name: fullReport.name,
        description: fullReport.description || '',
        reportType: fullReport.reportType as 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT',
        tags: fullReport.tags || [],
        isPublic: fullReport.isPublic,
        selectedFields,
        filters: filtersConfig || [],
        sorting: sortingConfig || []
      });

      // Set builder mode state
      setEditBuilderSelectedFields(builderFields);
      setEditAdvancedFormatting(chartConfig?.formatting || []);
      setEditAdvancedCalculations(chartConfig?.calculations || []);
      setEditAdvancedSorting(sortingConfig || []);
      setEditAdvancedGrouping(chartConfig?.grouping || []);
      
      setShowEditForm(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات گزارش';
      toast.error(errorMessage);
    }
  };

  const handleUpdateReport = async () => {
    try {
      if (!editingReport) {
        toast.error('گزارش برای ویرایش انتخاب نشده است');
        return;
      }

      if (!editReport.name.trim()) {
        toast.error('نام گزارش الزامی است');
        return;
      }

      // Use builder mode fields if builder mode is enabled, otherwise use form mode fields
      const fieldsToUse = useEditBuilderMode ? editBuilderSelectedFields : editReport.selectedFields.map(id => availableFields.find(f => f.id === id)).filter(Boolean) as typeof availableFields;
      
      if (fieldsToUse.length === 0) {
        toast.error('حداقل یک فیلد برای گزارش انتخاب کنید');
        return;
      }

      // Convert selected fields to proper column configuration
      const columnsConfig = fieldsToUse.map(field => {
        const formatting = (useEditBuilderMode ? editAdvancedFormatting : []).find(f => f.fieldId === field.id);
        const grouping = (useEditBuilderMode ? editAdvancedGrouping : []).find(g => g.field === field.id);
        return {
          id: field.id,
          name: field.id,
          type: field.type as 'text' | 'number' | 'date' | 'boolean' | 'currency',
          table: 'auto',
          label: formatting?.label || field.label || field.id,
          aggregation: grouping?.aggregation || 'none' as 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'
        };
      });

      const updates = {
        name: editReport.name,
        description: editReport.description,
        reportType: editReport.reportType,
        dataSources: [
          { id: 'inventory', name: 'Inventory', type: 'database' as const, connection: { table: 'inventory' } },
          { id: 'items', name: 'Items', type: 'database' as const, connection: { table: 'items' } }
        ],
        columnsConfig,
        filtersConfig: editReport.filters,
        sortingConfig: useEditBuilderMode && editAdvancedSorting.length > 0 ? editAdvancedSorting : editReport.sorting,
        chartConfig: useEditBuilderMode ? {
          calculations: editAdvancedCalculations,
          grouping: editAdvancedGrouping,
          formatting: editAdvancedFormatting
        } : undefined,
        layoutConfig: useEditBuilderMode ? {
          formatting: editAdvancedFormatting
        } : undefined,
        isPublic: editReport.isPublic,
        tags: editReport.tags
      };

      // Use biService.updateReport() which calls /api/bi/reports/:id
      await biService.updateReport(editingReport.id, updates);
      toast.success('گزارش با موفقیت بروزرسانی شد');
      
      // Reset form and close modal
      setEditingReport(null);
      setEditReport({
        name: '',
        description: '',
        reportType: 'TABULAR',
        tags: [],
        isPublic: false,
        selectedFields: [],
        filters: [],
        sorting: []
      });
      setEditBuilderSelectedFields([]);
      setEditAdvancedFormatting([]);
      setEditAdvancedCalculations([]);
      setEditAdvancedSorting([]);
      setEditAdvancedGrouping([]);
      setShowEditForm(false);
      
      // Reload reports
      loadReports();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بروزرسانی گزارش';
      toast.error(errorMessage);
    }
  };

  const handleEditFieldToggle = (fieldId: string) => {
    const isSelected = editReport.selectedFields.includes(fieldId);
    if (isSelected) {
      setEditReport({
        ...editReport,
        selectedFields: editReport.selectedFields.filter(id => id !== fieldId)
      });
    } else {
      setEditReport({
        ...editReport,
        selectedFields: [...editReport.selectedFields, fieldId]
      });
    }
  };

  // Removed handleEditSelectTemplate - templates are now handled via TemplateLibrary


  const handleFieldToggle = (fieldId: string) => {
    const isSelected = newReport.selectedFields.includes(fieldId);
    if (isSelected) {
      setNewReport({
        ...newReport,
        selectedFields: newReport.selectedFields.filter(id => id !== fieldId)
      });
    } else {
      setNewReport({
        ...newReport,
        selectedFields: [...newReport.selectedFields, fieldId]
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('آیا از حذف این گزارش اطمینان دارید؟')) return;
    
    try {
      // Use biService.deleteReport() which calls /api/bi/reports/:id
      await biService.deleteReport(reportId);
      toast.success('گزارش حذف شد');
      loadReports();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در حذف گزارش';
      toast.error(errorMessage);
    }
  };

  // Helper function to format values based on type
  const formatValue = (value: unknown, fieldConfig?: ReportField): string => {
    if (value === null || value === undefined) return '-';
    
    // If we have field config, use it for formatting
    if (fieldConfig) {
      const type = fieldConfig.type;
      
      switch (type) {
        case 'currency':
          if (typeof value === 'number') {
            return new Intl.NumberFormat('fa-IR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value) + ' تومان';
          }
          break;
        case 'number':
          if (typeof value === 'number') {
            return new Intl.NumberFormat('fa-IR').format(value);
          }
          break;
        case 'date':
          if (value instanceof Date) {
            return new Intl.DateTimeFormat('fa-IR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).format(value);
          } else if (typeof value === 'string') {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return new Intl.DateTimeFormat('fa-IR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }).format(date);
              }
            } catch {
              // Fall through to default
            }
          }
          break;
        case 'boolean':
          return value === true || value === 'true' || value === 1 ? 'بله' : 'خیر';
      }
    }
    
    // Default formatting
    if (typeof value === 'number') {
      return new Intl.NumberFormat('fa-IR').format(value);
    }
    
    return String(value);
  };

  // Get column configuration for display
  const getColumnConfig = (): ReportField[] => {
    if (!executedReport || !executedReport.columnsConfig) return [];
    
    // Parse if it's a string
    if (typeof executedReport.columnsConfig === 'string') {
      try {
        return JSON.parse(executedReport.columnsConfig);
      } catch {
        return [];
      }
    }
    
    return executedReport.columnsConfig;
  };

  // Get column order and labels from configuration
  const getDisplayColumns = (): Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'boolean' | 'currency'; config?: ReportField }> => {
    const columnConfig = getColumnConfig();
    
    if (!executionResult?.data || executionResult.data.length === 0) {
      return [];
    }
    
    const firstRow = executionResult.data[0];
    const dataKeys = Object.keys(firstRow);
    
    // Debug logging
    console.log('🔍 DEBUG - Column Config:', columnConfig);
    console.log('🔍 DEBUG - Data Keys:', dataKeys);
    console.log('🔍 DEBUG - First Row Sample:', firstRow);
    console.log('🔍 DEBUG - Available Fields:', availableFields.slice(0, 5));
    
    // If we have column config, use it to order and label columns
    if (columnConfig.length > 0) {
      // Match columns from config to data keys
      const matchedColumns: Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'boolean' | 'currency'; config?: ReportField }> = [];
      
      for (const col of columnConfig) {
        const colId = col.id || col.name || '';
        const colName = col.name || col.id || '';
        
        // Try exact match first
        let matchedKey = dataKeys.find(k => k === colId || k === colName);
        
        // Try without table prefix (e.g., "orders_orderNumber" matches "orderNumber")
        if (!matchedKey) {
          const colIdParts = colId.split('_');
          const colNameParts = colName.split('_');
          matchedKey = dataKeys.find(k => {
            const kParts = k.split('_');
            const lastColPart = colIdParts[colIdParts.length - 1];
            const lastColNamePart = colNameParts[colNameParts.length - 1];
            const lastKPart = kParts[kParts.length - 1];
            return lastKPart === lastColPart || lastKPart === lastColNamePart;
          });
        }
        
        // Try case-insensitive match
        if (!matchedKey) {
          matchedKey = dataKeys.find(k => 
            k.toLowerCase() === colId.toLowerCase() || 
            k.toLowerCase() === colName.toLowerCase()
          );
        }
        
        if (matchedKey) {
          matchedColumns.push({
            key: matchedKey,
            label: col.label || col.name || col.id || matchedKey,
            type: (col.type || 'text') as 'text' | 'number' | 'date' | 'boolean' | 'currency',
            config: col
          });
        }
      }
      
      // If we matched some columns, add unmatched ones
      if (matchedColumns.length > 0) {
        const matchedKeys = new Set(matchedColumns.map(c => c.key));
        const unmatchedKeys = dataKeys.filter(k => !matchedKeys.has(k));
        
        // Try to find labels for unmatched keys from availableFields
        const unmatchedColumns = unmatchedKeys.map(key => {
          const matchingField = availableFields.find(f => 
            f.id === key || 
            f.id.endsWith(`_${key}`) || 
            key.endsWith(`_${f.fieldName}`) ||
            f.fieldName === key
          );
          
          return {
            key,
            label: matchingField?.label || key,
            type: (matchingField?.type || 'text') as 'text' | 'number' | 'date' | 'boolean' | 'currency',
            config: matchingField ? {
              id: matchingField.id,
              name: matchingField.fieldName,
              type: matchingField.type,
              table: matchingField.table,
              label: matchingField.label
            } : undefined
          };
        });
        
        return [...matchedColumns, ...unmatchedColumns];
      }
    }
    
    // Fallback: use data keys with labels from availableFields
    return dataKeys.map(key => {
      // Try to find matching field in availableFields
      const matchingField = availableFields.find(f => 
        f.id === key || 
        f.id.endsWith(`_${key}`) || 
        key.endsWith(`_${f.fieldName}`) ||
        f.fieldName === key ||
        key.includes(f.fieldName)
      );
      
      return {
        key,
        label: matchingField?.label || key,
        type: (matchingField?.type || 'text') as 'text' | 'number' | 'date' | 'boolean' | 'currency',
        config: matchingField ? {
          id: matchingField.id,
          name: matchingField.fieldName,
          type: matchingField.type,
          table: matchingField.table,
          label: matchingField.label
        } : undefined
      };
    });
  };

  const handleExecuteReport = async (reportId: string) => {
    try {
      setLoading(true);
      
      // First, fetch the report configuration to get column labels and formatting
      const reportResponse = await biService.getReportById(reportId);
      let reportConfig: Report | null = null;
      
      if (reportResponse && typeof reportResponse === 'object') {
        if ('success' in reportResponse && 'data' in reportResponse && reportResponse.success) {
          reportConfig = reportResponse.data as Report;
        } else {
          reportConfig = reportResponse as Report;
        }
      }
      
      // Execute the report using biService
      const response = await biService.executeReport(reportId, undefined, 'VIEW');
      
      // Unwrap the response: { success: true, data: ReportExecutionResult }
      let result: ReportExecutionResult;
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && response.success) {
          result = response.data as ReportExecutionResult;
        } else {
          result = response as ReportExecutionResult;
        }
      } else {
        throw new Error('Invalid response format');
      }
      
      if (result.status === 'SUCCESS') {
        toast.success(`گزارش با موفقیت اجرا شد. ${result.resultCount} رکورد یافت شد.`);
        
        // Store both execution result and report config
        setExecutionResult(result);
        setExecutedReport(reportConfig);
        setShowResultsModal(true);
        
        console.log('📊 Report execution result:', result);
        console.log('📋 Report configuration:', reportConfig);
        if (result.data && result.data.length > 0) {
          console.log('📊 First data row:', result.data[0]);
          console.log('📊 Data keys:', Object.keys(result.data[0]));
          if (reportConfig?.columnsConfig) {
            const cols = typeof reportConfig.columnsConfig === 'string' 
              ? JSON.parse(reportConfig.columnsConfig) 
              : reportConfig.columnsConfig;
            console.log('📋 Column config IDs:', cols.map((c: ReportField) => c.id || c.name));
          }
        }
      } else {
        toast.error(result.errorMessage || 'خطا در اجرای گزارش');
        // Show error result in modal too
        setExecutionResult(result);
        setExecutedReport(reportConfig);
        setShowResultsModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در اجرای گزارش';
      toast.error(errorMessage);
      
      // Show error in modal
      setExecutionResult({
        reportId: 'error',
        executedBy: 'system',
        format: 'json',
        status: 'ERROR',
        errorMessage,
        resultCount: 0,
        executionTime: 0,
        executedAt: new Date(),
        data: []
      });
      setShowResultsModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportId: string, format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'PNG' | 'SVG') => {
    try {
      setExportingFormat(format);
      
      // For export formats, fetch directly as blob from the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/bi/reports/${reportId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ exportFormat: format })
      });
      
      if (!response.ok) {
        throw new Error('خطا در دریافت فایل');
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `report_${Date.now()}.${format.toLowerCase()}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`گزارش با موفقیت در فرمت ${format} دانلود شد`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در صادرات گزارش';
      toast.error(errorMessage);
    } finally {
      setExportingFormat(null);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'TABULAR': 'جدولی',
      'CHART': 'نمودار',
      'DASHBOARD': 'داشبورد',
      'PIVOT': 'جدول محوری'
    };
    return types[type] || type;
  };

  const getReportTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'TABULAR': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'CHART': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'DASHBOARD': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'PIVOT': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const filteredReports = (reports || []).filter(report => {
    const matchesSearch = !searchTerm || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'ALL' || report.reportType === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Section className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              گزارش‌های سفارشی
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              ایجاد و مدیریت گزارش‌های سفارشی
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-x-reverse">
            <Button
              onClick={() => setShowCreateForm(true)}
              size="small"
            >
              گزارش جدید
            </Button>
            <Link
              href="/workspaces/business-intelligence"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base text-center"
            >
              بازگشت
            </Link>
          </div>
        </div>
      </Card>

      {/* Create Report Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                ایجاد گزارش سفارشی جدید
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Template Library */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  قالب‌های آماده گزارش
                </h4>
                  <button
                    onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showTemplateLibrary ? 'بستن کتابخانه' : 'مشاهده همه قالب‌ها'}
                  </button>
                      </div>
                
                <TemplateLibrary
                  onTemplateSelect={handleTemplateSelect}
                  onTemplateCreate={() => {
                    setShowTemplateLibrary(false);
                    setShowSaveAsTemplate(true);
                  }}
                />
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام گزارش *
                  </label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    placeholder="نام گزارش را وارد کنید"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع گزارش
                  </label>
                  <select
                    value={newReport.reportType}
                    onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value as 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  >
                    <option value="TABULAR">جدولی</option>
                    <option value="CHART">نمودار</option>
                    <option value="DASHBOARD">داشبورد</option>
                    <option value="PIVOT">جدول محوری</option>
                  </select>
                </div>
              </div>

              {/* Workspace Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Workspace انتخاب شده: {workspace === 'merged' ? 'ترکیبی (Ordering + Inventory)' : workspace === 'ordering' ? 'سفارشات (Ordering)' : 'موجودی (Inventory)'}
                  </span>
                </div>
                {loadingSchema && (
                  <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    در حال بارگذاری فیلدها از schema...
                  </div>
                )}
                {!loadingSchema && availableFields.length > 0 && (
                  <div className="text-xs text-blue-700 dark:text-blue-400">
                    {availableFields.length} فیلد از {Array.from(new Set(availableFields.map(f => f.table))).length} جدول در دسترس است
                  </div>
                )}
                {selectedDataSources.length > 0 && (
                  <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                    جداول استفاده شده: {selectedDataSources.map(ds => `${ds.workspace === 'ordering' ? 'سفارشات' : 'موجودی'}-${ds.table}`).join(', ')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  placeholder="توضیحات گزارش"
                  rows={3}
                />
              </div>

              {/* Mode Toggle */}
              <div className="mobile-control-stack sm:justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  حالت ساخت گزارش:
                </span>
                <div className="mobile-action-group">
                  <button
                    onClick={() => setUseBuilderMode(false)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      !useBuilderMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    فرم ساده
                  </button>
                  <button
                    onClick={() => setUseBuilderMode(true)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      useBuilderMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    سازنده پیشرفته
                  </button>
                </div>
              </div>

              {/* Builder Mode */}
              {useBuilderMode ? (
                <div className="mt-4">
                  <AdvancedReportBuilder
                    availableFields={availableFields}
                    selectedFields={builderSelectedFields}
                    onFieldsChange={(fields) => {
                      setBuilderSelectedFields(fields as typeof availableFields);
                      setNewReport({
                        ...newReport,
                        selectedFields: fields.map(f => f.id)
                      });
                    }}
                    reportName={newReport.name}
                    reportType={newReport.reportType}
                    onReportTypeChange={(type) => setNewReport({ ...newReport, reportType: type })}
                    formatting={advancedFormatting}
                    onFormattingChange={setAdvancedFormatting}
                    calculations={advancedCalculations}
                    onCalculationsChange={setAdvancedCalculations}
                    filters={newReport.filters}
                    onFiltersChange={(filters) => setNewReport({ ...newReport, filters })}
                    sorting={advancedSorting}
                    onSortingChange={setAdvancedSorting}
                    grouping={advancedGrouping}
                    onGroupingChange={setAdvancedGrouping}
                    onSave={handleCreateReport}
                    onPreview={() => {
                      toast.success('پیش‌نمایش در حال آماده‌سازی است...');
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Field Selection (Form Mode) */}
              <div>
                <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3">
                  انتخاب فیلدها ({newReport.selectedFields.length} انتخاب شده)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {Object.entries(
                    availableFields.reduce((acc, field) => {
                      if (!acc[field.category]) acc[field.category] = [];
                      acc[field.category].push(field);
                      return acc;
                    }, {} as Record<string, typeof availableFields>)
                  ).map(([category, fields]) => (
                    <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">{category}</h5>
                      <div className="space-y-2">
                        {fields.map(field => (
                          <label key={field.id} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={newReport.selectedFields.includes(field.id)}
                              onChange={() => handleFieldToggle(field.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Fields Preview */}
              {newReport.selectedFields.length > 0 && (
                <div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3">
                    فیلدهای انتخاب شده
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {newReport.selectedFields.map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return (
                        <span
                          key={fieldId}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {field?.label || fieldId}
                          <button
                            onClick={() => handleFieldToggle(fieldId)}
                            className="mr-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
                  )}
                </>
              )}

              {/* Settings */}
              <div className="mobile-control-stack">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newReport.isPublic}
                    onChange={(e) => setNewReport({ ...newReport, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-2 text-xs sm:text-sm text-gray-900 dark:text-white">گزارش عمومی</span>
                </label>
              </div>
            </div>
            
            {!useBuilderMode && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-x-reverse mt-6 sm:mt-8">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateReport}
                disabled={!newReport.name.trim() || newReport.selectedFields.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                ایجاد گزارش
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جستجو
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              placeholder="جستجو در گزارش‌ها"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع گزارش
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="ALL">همه انواع</option>
              <option value="TABULAR">جدولی</option>
              <option value="CHART">نمودار</option>
              <option value="DASHBOARD">داشبورد</option>
              <option value="PIVOT">جدول محوری</option>
            </select>
          </div>
          
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={loadReports}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              اعمال فیلتر
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
          گزارش‌های موجود ({filteredReports.length} مورد)
        </h3>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-700 dark:text-red-300 text-sm sm:text-base">{error}</p>
          </div>
        )}
        
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white truncate">
                      {report.name}
                    </h4>
                    {report.description && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)} flex-shrink-0 mr-2`}>
                    {getReportTypeLabel(report.reportType)}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 gap-1 sm:gap-0">
                  <span>
                    ایجاد شده: {new Date(report.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                  {report._count?.executions !== undefined && (
                    <span>
                      اجرا: {report._count.executions.toLocaleString('fa-IR')} بار
                    </span>
                  )}
                </div>
                
                {report.creator && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    ایجاد کننده: {report.creator.name}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-x-reverse">
                  <button
                    onClick={() => handleEditReport(report)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleExecuteReport(report.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    اجرا
                  </button>
                  
                  {/* Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle dropdown for this specific report
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        dropdown.classList.toggle('hidden');
                      }}
                      className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors"
                      title="صادرات"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <div className="hidden export-dropdown absolute left-0 top-full mt-1 w-20 sm:w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'PDF');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      >
                        PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'EXCEL');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Excel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'CSV');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        CSV
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'JSON');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        JSON
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'PNG');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        PNG
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'SVG');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      >
                        SVG
                      </button>
                    </div>
                  </div>
                  
                  {report.creator?.id === user?.id && (
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              هیچ گزارشی یافت نشد
            </p>
          </div>
        )}
      </div>


      {/* Results Modal */}
      {showResultsModal && executionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                نتایج اجرای گزارش
            </h3>
              <button
                onClick={() => setShowResultsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Execution Summary */}
              {executionResult.status === 'SUCCESS' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-green-800 dark:text-green-400">
                        گزارش با موفقیت اجرا شد
                      </p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-500 mt-1">
                        تعداد رکوردها: {executionResult.resultCount?.toLocaleString('fa-IR') || 0} | زمان اجرا: {executionResult.executionTime}ms
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base font-medium text-red-800 dark:text-red-400">
                    خطا در اجرای گزارش
                  </p>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-500 mt-1">
                    {executionResult.errorMessage || 'خطای نامشخص'}
                  </p>
                </div>
              )}

              {/* Data Table */}
              {executionResult.status === 'SUCCESS' && executionResult.data && executionResult.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {Object.keys(executionResult.data[0]).map((key) => (
                          <th
                            key={key}
                            className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {executionResult.data.slice(0, 100).map((row: Record<string, unknown>, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white"
                            >
                              {value != null ? String(value) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {executionResult.data.length > 100 && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                      نمایش 100 رکورد اول از {executionResult.data.length.toLocaleString('fa-IR')} رکورد
                    </p>
                  )}
                </div>
              )}

              {/* No Data Message */}
              {executionResult.status === 'SUCCESS' && (!executionResult.data || executionResult.data.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    داده‌ای یافت نشد
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-x-reverse mt-4 sm:mt-6">
              {/* Export Buttons - Only show for successful executions with data */}
              {executionResult.status === 'SUCCESS' && executionResult.data && executionResult.data.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-x-reverse sm:mr-auto">
            <button
                    onClick={() => handleExportReport(executionResult!.reportId, 'PDF')}
                    disabled={exportingFormat === 'PDF'}
                    className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'PDF' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PDF
                  </button>
                  
                  <button
                    onClick={() => handleExportReport(executionResult!.reportId, 'EXCEL')}
                    disabled={exportingFormat === 'EXCEL'}
                    className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'EXCEL' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Excel
                  </button>
                  
                  <button
                    onClick={() => handleExportReport(executionResult!.reportId, 'CSV')}
                    disabled={exportingFormat === 'CSV'}
                    className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'CSV' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    CSV
                  </button>
                  <button
                    onClick={() => handleExportReport(executionResult!.reportId, 'JSON')}
                    disabled={exportingFormat === 'JSON'}
                    className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'JSON' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    JSON
                  </button>
                  <button
                    onClick={() => handleExportReport(executionResult!.reportId, 'PNG')}
                    disabled={exportingFormat === 'PNG'}
                    className="px-3 py-2 bg-purple-600 text-white text-xs sm:text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'PNG' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PNG
                  </button>
                  <button
                    onClick={() => handleExportReport(executionResult!.reportId, 'SVG')}
                    disabled={exportingFormat === 'SVG'}
                    className="px-3 py-2 bg-indigo-600 text-white text-xs sm:text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'SVG' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    SVG
            </button>
          </div>
        )}
              
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
              >
                بستن
              </button>
      </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditForm && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                ویرایش گزارش
              </h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Template Library */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  قالب‌های آماده گزارش
                </h4>
                  <button
                    onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showTemplateLibrary ? 'بستن کتابخانه' : 'مشاهده همه قالب‌ها'}
                  </button>
                      </div>
                
                <TemplateLibrary
                  onTemplateSelect={handleTemplateSelect}
                  onTemplateCreate={() => {
                    setShowTemplateLibrary(false);
                    setShowSaveAsTemplate(true);
                  }}
                />
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام گزارش *
                  </label>
                  <input
                    type="text"
                    value={editReport.name}
                    onChange={(e) => setEditReport({ ...editReport, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    placeholder="نام گزارش را وارد کنید"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع گزارش
                  </label>
                  <select
                    value={editReport.reportType}
                    onChange={(e) => setEditReport({ ...editReport, reportType: e.target.value as 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  >
                    <option value="TABULAR">جدولی</option>
                    <option value="CHART">نمودار</option>
                    <option value="DASHBOARD">داشبورد</option>
                    <option value="PIVOT">جدول محوری</option>
                  </select>
                </div>
              </div>

              {/* Workspace Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Workspace انتخاب شده: {workspace === 'merged' ? 'ترکیبی (Ordering + Inventory)' : workspace === 'ordering' ? 'سفارشات (Ordering)' : 'موجودی (Inventory)'}
                  </span>
                </div>
                {loadingSchema && (
                  <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    در حال بارگذاری فیلدها از schema...
                  </div>
                )}
                {!loadingSchema && availableFields.length > 0 && (
                  <div className="text-xs text-blue-700 dark:text-blue-400">
                    {availableFields.length} فیلد از {Array.from(new Set(availableFields.map(f => f.table))).length} جدول در دسترس است
                  </div>
                )}
                {selectedDataSources.length > 0 && (
                  <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                    جداول استفاده شده: {selectedDataSources.map(ds => `${ds.workspace === 'ordering' ? 'سفارشات' : 'موجودی'}-${ds.table}`).join(', ')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={editReport.description}
                  onChange={(e) => setEditReport({ ...editReport, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  placeholder="توضیحات گزارش"
                  rows={3}
                />
              </div>

              {/* Mode Toggle */}
              <div className="mobile-control-stack sm:justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  حالت ساخت گزارش:
                </span>
                <div className="mobile-action-group">
                  <button
                    onClick={() => setUseEditBuilderMode(false)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      !useEditBuilderMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    فرم ساده
                  </button>
                  <button
                    onClick={() => setUseEditBuilderMode(true)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      useEditBuilderMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    سازنده پیشرفته
                  </button>
                </div>
              </div>

              {/* Builder Mode */}
              {useEditBuilderMode ? (
                <div className="mt-4">
                  <AdvancedReportBuilder
                    availableFields={availableFields}
                    selectedFields={editBuilderSelectedFields}
                    onFieldsChange={(fields) => {
                      setEditBuilderSelectedFields(fields as typeof availableFields);
                      setEditReport({
                        ...editReport,
                        selectedFields: fields.map(f => f.id)
                      });
                    }}
                    reportName={editReport.name}
                    reportType={editReport.reportType}
                    onReportTypeChange={(type) => setEditReport({ ...editReport, reportType: type })}
                    formatting={editAdvancedFormatting}
                    onFormattingChange={setEditAdvancedFormatting}
                    calculations={editAdvancedCalculations}
                    onCalculationsChange={setEditAdvancedCalculations}
                    filters={editReport.filters}
                    onFiltersChange={(filters) => setEditReport({ ...editReport, filters })}
                    sorting={editAdvancedSorting}
                    onSortingChange={setEditAdvancedSorting}
                    grouping={editAdvancedGrouping}
                    onGroupingChange={setEditAdvancedGrouping}
                    onSave={handleUpdateReport}
                    onPreview={() => {
                      toast.success('پیش‌نمایش در حال آماده‌سازی است...');
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Field Selection (Form Mode) */}
              <div>
                <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3">
                  انتخاب فیلدها ({editReport.selectedFields.length} انتخاب شده)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {Object.entries(
                    availableFields.reduce((acc, field) => {
                      if (!acc[field.category]) acc[field.category] = [];
                      acc[field.category].push(field);
                      return acc;
                    }, {} as Record<string, typeof availableFields>)
                  ).map(([category, fields]) => (
                    <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">{category}</h5>
                      <div className="space-y-2">
                        {fields.map(field => (
                          <label key={field.id} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={editReport.selectedFields.includes(field.id)}
                              onChange={() => handleEditFieldToggle(field.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Fields Preview */}
              {editReport.selectedFields.length > 0 && (
                <div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3">
                    فیلدهای انتخاب شده
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {editReport.selectedFields.map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return (
                        <span
                          key={fieldId}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {field?.label || fieldId}
                          <button
                                onClick={() => handleEditFieldToggle(fieldId)}
                            className="mr-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
                  )}
                </>
              )}

              {/* Settings */}
              <div className="mobile-control-stack">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editReport.isPublic}
                    onChange={(e) => setEditReport({ ...editReport, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-2 text-xs sm:text-sm text-gray-900 dark:text-white">گزارش عمومی</span>
                </label>
              </div>
            </div>
            
            {!useEditBuilderMode && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-x-reverse mt-6 sm:mt-8">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
              >
                انصراف
              </button>
              <button
                onClick={handleUpdateReport}
                disabled={!editReport.name.trim() || editReport.selectedFields.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                بروزرسانی گزارش
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && executionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                نتایج اجرای گزارش
              </h3>
                {executedReport && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium">{executedReport.name}</p>
                    {executedReport.description && (
                      <p className="text-xs mt-1">{executedReport.description}</p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setExecutedReport(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Execution Summary */}
              {executionResult.status === 'SUCCESS' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="text-sm sm:text-base font-medium text-green-800 dark:text-green-300">
                      گزارش با موفقیت اجرا شد
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-green-700 dark:text-green-400">
                    <div>
                      <span className="font-semibold">تعداد رکوردها: </span>
                      <span>{executionResult.resultCount.toLocaleString('fa-IR')}</span>
                    </div>
                    <div>
                      <span className="font-semibold">زمان اجرا: </span>
                      <span>{executionResult.executionTime.toLocaleString('fa-IR')} میلی‌ثانیه</span>
                    </div>
                    <div>
                      <span className="font-semibold">تاریخ اجرا: </span>
                      <span>{new Date(executionResult.executedAt).toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-sm sm:text-base font-medium text-red-800 dark:text-red-300">
                      خطا در اجرای گزارش
                    </h4>
                  </div>
                  <div className="text-xs sm:text-sm text-red-700 dark:text-red-400 space-y-1">
                    <p><span className="font-semibold">پیام خطا: </span>{executionResult.errorMessage}</p>
                    <p><span className="font-semibold">تاریخ اجرا: </span>{new Date(executionResult.executedAt).toLocaleString('fa-IR')}</p>
                  </div>
                </div>
              )}

              {/* Data Table - Only show for successful executions */}
              {executionResult.status === 'SUCCESS' && executionResult.data && executionResult.data.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                    نتایج گزارش ({executionResult.resultCount.toLocaleString('fa-IR')} رکورد)
                  </h4>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-4 overflow-x-auto border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          {getDisplayColumns().map((col) => (
                            <th
                              key={col.key}
                              className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {executionResult.data.slice(0, 50).map((row: Record<string, unknown>, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            {getDisplayColumns().map((col) => (
                              <td
                                key={col.key}
                                className={`px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm ${
                                  col.type === 'number' || col.type === 'currency' ? 'text-left font-mono' : 'text-right'
                                } text-gray-900 dark:text-gray-100`}
                              >
                                {formatValue(row[col.key], col.config)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {executionResult.data.length > 50 && (
                      <div className="mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        نمایش ۵۰ رکورد اول از {executionResult.resultCount.toLocaleString('fa-IR')} رکورد
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Data Message - Only show for successful executions with no data */}
              {executionResult.status === 'SUCCESS' && (!executionResult.data || executionResult.data.length === 0) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  <p className="text-sm sm:text-base text-yellow-800 dark:text-yellow-300 font-medium">
                      هیچ داده‌ای یافت نشد
                  </p>
                  <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    گزارش اجرا شد اما هیچ رکوردی مطابق با فیلترهای تعریف شده یافت نشد
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:space-x-reverse mt-4 sm:mt-6">
              {/* Export Buttons - Only show for successful executions with data */}
              {executionResult.status === 'SUCCESS' && executionResult.data && executionResult.data.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-x-reverse sm:mr-auto">
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'PDF')}
                    disabled={exportingFormat === 'PDF'}
                    className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'PDF' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PDF
                  </button>
                  
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'EXCEL')}
                    disabled={exportingFormat === 'EXCEL'}
                    className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'EXCEL' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Excel
                  </button>
                  
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'CSV')}
                    disabled={exportingFormat === 'CSV'}
                    className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'CSV' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    CSV
                  </button>
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'JSON')}
                    disabled={exportingFormat === 'JSON'}
                    className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'JSON' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    JSON
                  </button>
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'PNG')}
                    disabled={exportingFormat === 'PNG'}
                    className="px-3 py-2 bg-purple-600 text-white text-xs sm:text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'PNG' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PNG
                  </button>
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'SVG')}
                    disabled={exportingFormat === 'SVG'}
                    className="px-3 py-2 bg-indigo-600 text-white text-xs sm:text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {exportingFormat === 'SVG' ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    SVG
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveAsTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ذخیره به عنوان قالب
              </h3>
              <button
                onClick={() => setShowSaveAsTemplate(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام قالب *
                </label>
                <input
                  type="text"
                  value={`${newReport.name} - قالب`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={newReport.description || `قالب بر اساس گزارش ${newReport.name}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked={false}
                  />
                  <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                    قالب عمومی (قابل مشاهده برای همه)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowSaveAsTemplate(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ذخیره قالب
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
