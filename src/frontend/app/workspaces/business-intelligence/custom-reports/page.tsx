'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import * as reportService from '../../../../services/reportService';
import toast from 'react-hot-toast';
import { 
  ReportField, 
  ReportFilter,
  ReportExecutionResult
} from '../../../../services/reportService';

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
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

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

  // Available fields for report building
  const availableFields = [
    // Item Information
    { id: 'item_name', label: 'نام کالا', type: 'text', category: 'کالا' },
    { id: 'item_category', label: 'دسته‌بندی', type: 'text', category: 'کالا' },
    { id: 'item_unit', label: 'واحد', type: 'text', category: 'کالا' },
    { id: 'item_description', label: 'توضیحات', type: 'text', category: 'کالا' },
    { id: 'item_barcode', label: 'بارکد', type: 'text', category: 'کالا' },
    { id: 'item_min_stock', label: 'حداقل موجودی', type: 'number', category: 'کالا' },
    
    // Inventory Information
    { id: 'current_stock', label: 'موجودی فعلی', type: 'number', category: 'موجودی' },
    { id: 'quantity', label: 'مقدار تراکنش', type: 'number', category: 'موجودی' },
    { id: 'unit_price', label: 'قیمت واحد', type: 'currency', category: 'موجودی' },
    { id: 'total_value', label: 'ارزش کل', type: 'currency', category: 'موجودی' },
    { id: 'entry_type', label: 'نوع تراکنش', type: 'text', category: 'موجودی' },
    { id: 'entry_date', label: 'تاریخ تراکنش', type: 'date', category: 'موجودی' },
    
    // User Information
    { id: 'user_name', label: 'نام کاربر', type: 'text', category: 'کاربر' },
    { id: 'user_email', label: 'ایمیل کاربر', type: 'text', category: 'کاربر' },
    { id: 'user_role', label: 'نقش کاربر', type: 'text', category: 'کاربر' },
    
    // Supplier Information
    { id: 'supplier_name', label: 'نام تأمین‌کننده', type: 'text', category: 'تأمین‌کننده' },
    { id: 'supplier_contact_name', label: 'نام تماس', type: 'text', category: 'تأمین‌کننده' },
    { id: 'supplier_phone', label: 'تلفن', type: 'text', category: 'تأمین‌کننده' }
  ];

  // Pre-defined report templates
  const reportTemplates = [
    {
      name: 'گزارش موجودی کالاها',
      description: 'نمایش موجودی فعلی همه کالاها',
      fields: ['item_name', 'item_category', 'item_unit', 'current_stock', 'item_min_stock'],
      filters: []
    },
    {
      name: 'گزارش تراکنش‌های موجودی',
      description: 'تمام تراکنش‌های ورود و خروج کالا',
      fields: ['item_name', 'entry_type', 'quantity', 'unit_price', 'total_value', 'entry_date', 'user_name'],
      filters: []
    },
    {
      name: 'گزارش کالاهای کم موجودی',
      description: 'کالاهایی که زیر حداقل موجودی هستند',
      fields: ['item_name', 'current_stock', 'item_min_stock', 'item_category'],
      filters: []
    }
  ];

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
      const { reports: fetchedReports } = await reportService.getReports(
        {
          reportType: selectedType === 'ALL' ? undefined : selectedType
        },
        {
          page: 1,
          limit: 50
        }
      );
      setReports(fetchedReports || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت گزارش‌ها';
      setError(errorMessage);
      setReports([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

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
        return {
          id: fieldId,
          name: fieldId,
          type: (field?.type || 'text') as 'text' | 'number' | 'date' | 'boolean' | 'currency',
          table: 'auto', // Let backend determine the table
          label: field?.label || fieldId,
          aggregation: 'none' as 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'
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
        sortingConfig: newReport.sorting,
        isPublic: newReport.isPublic,
        tags: newReport.tags
      };

      await reportService.createReport(reportConfig);
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
      // Get full report details
      const fullReport = await reportService.getReportById(report.id);
      
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

      if (editReport.selectedFields.length === 0) {
        toast.error('حداقل یک فیلد برای گزارش انتخاب کنید');
        return;
      }

      // Convert selected fields to proper column configuration
      const columnsConfig = editReport.selectedFields.map(fieldId => {
        const field = availableFields.find(f => f.id === fieldId);
        return {
          id: fieldId,
          name: fieldId,
          type: (field?.type || 'text') as 'text' | 'number' | 'date' | 'boolean' | 'currency',
          table: 'auto',
          label: field?.label || fieldId,
          aggregation: 'none' as 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'
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
        sortingConfig: editReport.sorting,
        isPublic: editReport.isPublic,
        tags: editReport.tags
      };

      await reportService.updateReport(editingReport.id, updates);
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

  const handleEditSelectTemplate = (template: { name: string; description: string; fields: string[]; filters?: ReportFilter[] }) => {
    setEditReport({
      ...editReport,
      name: template.name,
      description: template.description,
      selectedFields: template.fields,
      filters: template.filters || []
    });
  };

  const handleSelectTemplate = (template: { name: string; description: string; fields: string[]; filters?: ReportFilter[] }) => {
    setNewReport({
      ...newReport,
      name: template.name,
      description: template.description,
      selectedFields: template.fields,
      filters: template.filters || []
    });
  };

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
      await reportService.deleteReport(reportId);
      toast.success('گزارش حذف شد');
      loadReports();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در حذف گزارش';
      toast.error(errorMessage);
    }
  };

  const handleExecuteReport = async (reportId: string) => {
    try {
      setLoading(true);
      
      // Execute the report
      const result = await reportService.executeReport(reportId);
      
      if (result.status === 'SUCCESS') {
        toast.success(`گزارش با موفقیت اجرا شد. ${result.resultCount} رکورد یافت شد.`);
        
        // Show results in modal instead of alert
        setExecutionResult(result);
        setShowResultsModal(true);
        
        console.log('Report execution result:', result);
      } else {
        toast.error(result.errorMessage || 'خطا در اجرای گزارش');
        // Show error result in modal too
        setExecutionResult(result);
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

  const handleExportReport = async (reportId: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      setExportingFormat(format);
      
      // Use the reportService function for consistent authentication
      const { blob, filename } = await reportService.exportReportFile(reportId, format);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              گزارش‌های سفارشی
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ایجاد و مدیریت گزارش‌های سفارشی
            </p>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              گزارش جدید
            </button>
            <Link
              href="/workspaces/business-intelligence"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بازگشت
            </Link>
          </div>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                ایجاد گزارش سفارشی جدید
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Report Templates */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  قالب‌های آماده گزارش
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {reportTemplates.map((template, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectTemplate(template)}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <h5 className="font-medium text-gray-900 dark:text-white">{template.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        {template.fields.length} فیلد
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام گزارش *
                  </label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="TABULAR">جدولی</option>
                    <option value="CHART">نمودار</option>
                    <option value="DASHBOARD">داشبورد</option>
                    <option value="PIVOT">جدول محوری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="توضیحات گزارش"
                  rows={3}
                />
              </div>

              {/* Field Selection */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  انتخاب فیلدها ({newReport.selectedFields.length} انتخاب شده)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
                    availableFields.reduce((acc, field) => {
                      if (!acc[field.category]) acc[field.category] = [];
                      acc[field.category].push(field);
                      return acc;
                    }, {} as Record<string, typeof availableFields>)
                  ).map(([category, fields]) => (
                    <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">{category}</h5>
                      <div className="space-y-2">
                        {fields.map(field => (
                          <label key={field.id} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={newReport.selectedFields.includes(field.id)}
                              onChange={() => handleFieldToggle(field.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
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
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    فیلدهای انتخاب شده
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {newReport.selectedFields.map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return (
                        <span
                          key={fieldId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {field?.label || fieldId}
                          <button
                            onClick={() => handleFieldToggle(fieldId)}
                            className="mr-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newReport.isPublic}
                    onChange={(e) => setNewReport({ ...newReport, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-2 text-sm text-gray-900 dark:text-white">گزارش عمومی</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-8">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateReport}
                disabled={!newReport.name.trim() || newReport.selectedFields.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ایجاد گزارش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جستجو
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">همه انواع</option>
              <option value="TABULAR">جدولی</option>
              <option value="CHART">نمودار</option>
              <option value="DASHBOARD">داشبورد</option>
              <option value="PIVOT">جدول محوری</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadReports}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              اعمال فیلتر
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          گزارش‌های موجود ({filteredReports.length} مورد)
        </h3>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {report.name}
                    </h4>
                    {report.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)}`}>
                    {getReportTypeLabel(report.reportType)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleEditReport(report)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleExecuteReport(report.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
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
                      className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                      title="صادرات"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <div className="hidden export-dropdown absolute left-0 top-full mt-1 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'PDF');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      >
                        PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'EXCEL');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Excel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'CSV');
                          (e.currentTarget.parentElement as HTMLElement).classList.add('hidden');
                        }}
                        className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                  
                  {report.creator?.id === user?.id && (
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              گزارشی یافت نشد
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              برای شروع، یک گزارش سفارشی جدید ایجاد کنید
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ایجاد اولین گزارش
            </button>
          </div>
        )}
      </div>

      {/* Edit Report Modal */}
      {showEditForm && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                ویرایش گزارش
              </h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Report Templates */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  قالب‌های آماده گزارش
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {reportTemplates.map((template, index) => (
                    <div
                      key={index}
                      onClick={() => handleEditSelectTemplate(template)}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <h5 className="font-medium text-gray-900 dark:text-white">{template.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        {template.fields.length} فیلد
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام گزارش *
                  </label>
                  <input
                    type="text"
                    value={editReport.name}
                    onChange={(e) => setEditReport({ ...editReport, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="TABULAR">جدولی</option>
                    <option value="CHART">نمودار</option>
                    <option value="DASHBOARD">داشبورد</option>
                    <option value="PIVOT">جدول محوری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={editReport.description}
                  onChange={(e) => setEditReport({ ...editReport, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="توضیحات گزارش"
                  rows={3}
                />
              </div>

              {/* Field Selection */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  انتخاب فیلدها ({editReport.selectedFields.length} انتخاب شده)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
                    availableFields.reduce((acc, field) => {
                      if (!acc[field.category]) acc[field.category] = [];
                      acc[field.category].push(field);
                      return acc;
                    }, {} as Record<string, typeof availableFields>)
                  ).map(([category, fields]) => (
                    <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">{category}</h5>
                      <div className="space-y-2">
                        {fields.map(field => (
                          <label key={field.id} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={editReport.selectedFields.includes(field.id)}
                              onChange={() => handleEditFieldToggle(field.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
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
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    فیلدهای انتخاب شده
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {editReport.selectedFields.map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return (
                        <span
                          key={fieldId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {field?.label || fieldId}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFieldToggle(fieldId);
                            }}
                            className="mr-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editReport.isPublic}
                    onChange={(e) => setEditReport({ ...editReport, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-2 text-sm text-gray-900 dark:text-white">گزارش عمومی</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-8">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleUpdateReport}
                disabled={!editReport.name.trim() || editReport.selectedFields.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بروزرسانی گزارش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && executionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                نتایج اجرای گزارش
              </h3>
              <button
                onClick={() => setShowResultsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Execution Summary */}
              {executionResult.status === 'SUCCESS' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                      گزارش با موفقیت اجرا شد
                    </h4>
                  </div>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                    <p>تعداد رکوردها: <span className="font-semibold">{executionResult.resultCount.toLocaleString('fa-IR')}</span></p>
                    <p>زمان اجرا: <span className="font-semibold">{executionResult.executionTime.toLocaleString('fa-IR')} میلی‌ثانیه</span></p>
                    <p>زمان اجرا: <span className="font-semibold">{new Date(executionResult.executedAt).toLocaleString('fa-IR')}</span></p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                      خطا در اجرای گزارش
                    </h4>
                  </div>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                    <p>پیام خطا: <span className="font-semibold">{executionResult.errorMessage}</span></p>
                    <p>زمان اجرا: <span className="font-semibold">{new Date(executionResult.executedAt).toLocaleString('fa-IR')}</span></p>
                  </div>
                </div>
              )}

              {/* Data Preview - Only show for successful executions */}
              {executionResult.status === 'SUCCESS' && executionResult.data && executionResult.data.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نتایج گزارش ({executionResult.resultCount.toLocaleString('fa-IR')} رکورد)
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          {Object.keys(executionResult.data[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {executionResult.data.slice(0, 10).map((row: Record<string, unknown>, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            {Object.values(row).map((value: unknown, cellIndex: number) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300"
                              >
                                {value != null ? String(value) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {executionResult.data.length > 10 && (
                      <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        نمایش ۱۰ رکورد اول از {executionResult.resultCount.toLocaleString('fa-IR')} رکورد
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Data Message - Only show for successful executions with no data */}
              {executionResult.status === 'SUCCESS' && (!executionResult.data || executionResult.data.length === 0) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-yellow-800 dark:text-yellow-300">
                      هیچ داده‌ای یافت نشد
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-6">
              {/* Export Buttons - Only show for successful executions with data */}
              {executionResult.status === 'SUCCESS' && executionResult.data && executionResult.data.length > 0 && (
                <div className="flex space-x-2 space-x-reverse mr-auto">
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'PDF')}
                    disabled={exportingFormat === 'PDF'}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {exportingFormat === 'PDF' ? (
                      <svg className="w-4 h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    PDF
                  </button>
                  
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'EXCEL')}
                    disabled={exportingFormat === 'EXCEL'}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {exportingFormat === 'EXCEL' ? (
                      <svg className="w-4 h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Excel
                  </button>
                  
                  <button
                    onClick={() => handleExportReport(executionResult.reportId, 'CSV')}
                    disabled={exportingFormat === 'CSV'}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {exportingFormat === 'CSV' ? (
                      <svg className="w-4 h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    CSV
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 