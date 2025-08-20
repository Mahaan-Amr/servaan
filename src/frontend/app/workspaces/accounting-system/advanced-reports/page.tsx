'use client';

import React, { useState, useEffect } from 'react';
import { biService } from '../../../../services/biService';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ReportField } from '../../../../types/bi';
import { getToken } from '../../../../services/authService';

interface Report {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags?: string[];
}

interface ReportFormValues {
  id?: string;
  name: string;
  description?: string;
  reportType: string;
  tags?: string;
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
  label?: string;
}

const REPORT_TYPES = [
  { value: 'TABULAR', label: 'جدولی' },
  { value: 'CHART', label: 'نموداری' },
  { value: 'DASHBOARD', label: 'داشبورد' },
  { value: 'PIVOT', label: 'محوری' },
];

export default function AdvancedReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<unknown>(null);
  const [resultReport, setResultReport] = useState<Report | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReportFormValues>({
    defaultValues: { name: '', description: '', reportType: 'TABULAR', tags: '' }
  });
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch available fields when modal opens
  useEffect(() => {
    if (showFormModal) {
      biService.getReportFields().then(setAvailableFields).catch(() => setAvailableFields([]));
    }
  }, [showFormModal]);

  // Reset field/filter state on modal open/close
  useEffect(() => {
    if (showFormModal && editingReport) {
      // Defensive: columnsConfig/filtersConfig may be stringified JSON from backend
      let columnsConfig: ReportField[] | string | undefined = (editingReport as { columnsConfig?: ReportField[] | string }).columnsConfig;
      if (typeof columnsConfig === 'string') {
        try { columnsConfig = JSON.parse(columnsConfig) as ReportField[]; } catch { columnsConfig = []; }
      }
      let filtersConfig: Filter[] | string | undefined = (editingReport as { filtersConfig?: Filter[] | string }).filtersConfig;
      if (typeof filtersConfig === 'string') {
        try { filtersConfig = JSON.parse(filtersConfig) as Filter[]; } catch { filtersConfig = []; }
      }
      setSelectedFields(Array.isArray(columnsConfig) ? columnsConfig.map((f: ReportField) => f.id) : []);
      setFilters(Array.isArray(filtersConfig) ? filtersConfig : []);
    } else if (showFormModal) {
      setSelectedFields([]);
      setFilters([]);
    }
  }, [showFormModal, editingReport]);

  // Operators by field type
  const OPERATORS: Record<string, { value: string; label: string }[]> = {
    text: [
      { value: 'equals', label: 'برابر' },
      { value: 'contains', label: 'شامل' },
      { value: 'in', label: 'در لیست' }
    ],
    number: [
      { value: 'equals', label: 'برابر' },
      { value: 'greater', label: 'بزرگتر' },
      { value: 'less', label: 'کوچکتر' },
      { value: 'between', label: 'بین' },
      { value: 'in', label: 'در لیست' }
    ],
    date: [
      { value: 'equals', label: 'برابر' },
      { value: 'greater', label: 'بعد از' },
      { value: 'less', label: 'قبل از' },
      { value: 'between', label: 'بین' }
    ],
    boolean: [
      { value: 'equals', label: 'برابر' }
    ],
    currency: [
      { value: 'equals', label: 'برابر' },
      { value: 'greater', label: 'بزرگتر' },
      { value: 'less', label: 'کوچکتر' },
      { value: 'between', label: 'بین' }
    ]
  };

  const handleFieldSelect = (id: string) => {
    setSelectedFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { id: `filter${filters.length + 1}`, field: '', operator: '', value: '', label: '' }]);
  };
  const handleRemoveFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };
  const handleFilterChange = (idx: number, key: keyof Filter, value: string) => {
    setFilters(filters.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await biService.getCustomReports(1, 50);
      setReports((data as { reports?: Report[] }).reports || []);
    } catch (err) {
      setError((err as Error).message || 'خطا در دریافت گزارش‌ها');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReport = async (report: Report) => {
    setResultReport(report);
    setShowResultModal(true);
    setResultData('loading');
    try {
      const result = await biService.executeReport(report.id, {}, 'VIEW');
      setResultData((result as { data?: unknown }).data || []);
    } catch (err) {
      setResultData({ error: (err as Error).message || 'خطا در اجرای گزارش' });
    }
  };

  const handleExportReport = async (report: Report, format: 'PDF' | 'EXCEL') => {
    setExporting(true);
    try {
      // Get JWT token from storage (consistent with app auth)
      const token = getToken();
      if (!token) {
        alert('توکن احراز هویت یافت نشد. لطفا دوباره وارد شوید.');
        setExporting(false);
        return;
      }
      const exportUrl = `/api/bi/reports/${report.id}/execute`;
      const res = await fetch(exportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exportFormat: format })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'خطا در دریافت فایل خروجی');
      }
      // Try to get filename from Content-Disposition
      const disposition = res.headers.get('Content-Disposition');
      let filename = report.name;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        } else {
          const fallback = disposition.match(/filename="?([^";]+)"?/);
          if (fallback && fallback[1]) filename = fallback[1];
        }
      } else {
        filename += format === 'PDF' ? '.pdf' : format === 'EXCEL' ? '.xlsx' : '.dat';
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert((err as Error).message || 'فایل خروجی یافت نشد');
    } finally {
      setExporting(false);
    }
  };

  const openCreateModal = () => {
    setEditingReport(null);
    reset({ name: '', description: '', reportType: 'TABULAR', tags: '' });
    setShowFormModal(true);
  };
  const openEditModal = (report: Report) => {
    setEditingReport(report);
    reset({
      id: report.id,
      name: report.name,
      description: report.description || '',
      reportType: report.reportType,
      tags: (report.tags || []).join(', ')
    });
    setShowFormModal(true);
  };
  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingReport(null);
  };

  const onSubmitForm = async (values: ReportFormValues) => {
    setFormError(null);
    if (selectedFields.length === 0) {
      setFormError('حداقل یک فیلد باید انتخاب شود');
      return;
    }
    const tagsArr = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const columnsConfig = availableFields.filter(f => selectedFields.includes(f.id));
    const filtersConfig = filters.filter(f => f.field && f.operator && f.value !== '');
    const dataSources = ['inventory', 'items']; // Default data sources for now
    try {
      if (editingReport) {
        await biService.createCustomReport({
          name: values.name,
          description: values.description,
          reportType: values.reportType,
          tags: tagsArr,
          columnsConfig,
          filtersConfig,
          dataSources
        });
      } else {
        await biService.createCustomReport({
          name: values.name,
          description: values.description,
          reportType: values.reportType,
          tags: tagsArr,
          columnsConfig,
          filtersConfig,
          dataSources
        });
      }
      await fetchReports();
      closeFormModal();
    } catch (err) {
      setFormError((err as Error).message || 'خطا در ذخیره گزارش');
    }
  };

  const categories = [
    { id: 'all', name: 'همه گزارش‌ها' },
    { id: 'financial', name: 'گزارش‌های مالی' },
    { id: 'tax', name: 'گزارش‌های مالیاتی' },
    { id: 'analytics', name: 'تحلیل‌ها' }
  ];

  const filteredReports = reports.filter(report => {
    return selectedCategory === 'all' || (report.tags && report.tags.includes(selectedCategory));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-4 rounded-md">
        {error}
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
              گزارش‌های پیشرفته
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              گزارش‌گیری تخصصی و تحلیلی سیستم حسابداری
            </p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors" onClick={openCreateModal}>
            گزارش سفارشی
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
            گزارشی یافت نشد.
          </div>
        ) : filteredReports.map((report) => (
          <div
            key={report.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md cursor-pointer hover:border-green-300 dark:hover:border-green-600`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {report.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {report.description}
            </p>
            <div className="flex items-center justify-between gap-2 mt-4">
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-xs"
                onClick={() => openEditModal(report)}
              >
                ویرایش
              </button>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                onClick={() => handleRunReport(report)}
              >
                مشاهده
              </button>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                onClick={() => handleExportReport(report, 'PDF')}
                disabled={exporting}
              >
                خروجی PDF
              </button>
              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs"
                onClick={() => handleExportReport(report, 'EXCEL')}
                disabled={exporting}
              >
                خروجی Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">نتیجه گزارش: {resultReport?.name}</h2>
              <button onClick={() => setShowResultModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            {resultData === 'loading' ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
              </div>
            ) : (resultData as { error?: string })?.error ? (
              <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-4 rounded-md">{(resultData as { error: string }).error}</div>
            ) : Array.isArray(resultData) && (resultData as Record<string, unknown>[]).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      {Object.keys((resultData as Record<string, unknown>[])[0]).map((key) => (
                        <th key={key} className="px-3 py-2 border-b bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(resultData as Record<string, unknown>[]).map((row, idx) => (
                      <tr key={idx} className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-700 dark:even:bg-gray-800">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-3 py-2 border-b text-gray-900 dark:text-white">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">داده‌ای برای نمایش وجود ندارد.</div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Report Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingReport ? 'ویرایش گزارش' : 'ایجاد گزارش سفارشی'}
              </h2>
              <button onClick={closeFormModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان گزارش *</label>
                <input
                  type="text"
                  {...register('name', { required: 'عنوان گزارش الزامی است' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="عنوان گزارش"
                />
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="توضیحات گزارش (اختیاری)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع گزارش *</label>
                <select
                  {...register('reportType', { required: 'نوع گزارش الزامی است' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                >
                  {REPORT_TYPES.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
                {errors.reportType && <span className="text-xs text-red-500">{errors.reportType.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تگ‌ها (با ویرگول جدا کنید)</label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="مثال: مالی, فروش, تحلیل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">انتخاب فیلدها *</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-700">
                  {availableFields.map(field => (
                    <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => handleFieldSelect(field.id)}
                        className="accent-green-600"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-200">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">فیلترها</label>
                <div className="space-y-2">
                  {filters.map((filter, idx) => {
                    const field = availableFields.find(f => f.id === filter.field);
                    const ops = field ? OPERATORS[field.type] : [];
                    return (
                      <div key={filter.id} className="flex gap-2 items-center">
                        <select
                          value={filter.field}
                          onChange={e => handleFilterChange(idx, 'field', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
                        >
                          <option value="">انتخاب فیلد</option>
                          {availableFields.map(f => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                        <select
                          value={filter.operator}
                          onChange={e => handleFilterChange(idx, 'operator', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
                        >
                          <option value="">اپراتور</option>
                          {ops.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={filter.value}
                          onChange={e => handleFilterChange(idx, 'value', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
                          placeholder="مقدار"
                        />
                        <button type="button" onClick={() => handleRemoveFilter(idx)} className="text-red-500 text-xs">حذف</button>
                      </div>
                    );
                  })}
                  <button type="button" onClick={handleAddFilter} className="text-green-600 text-xs mt-2">افزودن فیلتر</button>
                </div>
              </div>
              {formError && <div className="text-xs text-red-500 text-center mt-2">{formError}</div>}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={closeFormModal} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">انصراف</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                  {editingReport ? 'ذخیره تغییرات' : 'ایجاد گزارش'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل گزارش‌ها</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">آماده</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {reports.filter(r => r.isPublic).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">در انتظار</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {reports.filter(r => !r.isPublic).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">امروز تولید شده</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Common Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          گزارش‌های پرکاربرد
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/workspaces/accounting-system/trial-balance"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg ml-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">تراز آزمایشی</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">مانده کلیه حساب‌ها</p>
            </div>
          </Link>

          <Link
            href="/workspaces/accounting-system/financial-statements"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg ml-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">صورت‌های مالی</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">ترازنامه و سود و زیان</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 