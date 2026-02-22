'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { templateService, ReportTemplate } from '../../services/templateService';
import toast from 'react-hot-toast';

interface TemplateLibraryProps {
  onTemplateSelect: (template: ReportTemplate) => void;
  onTemplateCreate?: () => void;
  className?: string;
}

const categories = [
  { value: 'all', label: 'همه', icon: '📚' },
  { value: 'inventory', label: 'موجودی', icon: '📦' },
  { value: 'financial', label: 'مالی', icon: '💰' },
  { value: 'sales', label: 'فروش', icon: '📊' },
  { value: 'customer', label: 'مشتری', icon: '👥' },
  { value: 'supplier', label: 'تأمین‌کننده', icon: '🏭' },
  { value: 'user', label: 'کاربر', icon: '👤' },
  { value: 'custom', label: 'سفارشی', icon: '🎨' }
];

const reportTypeLabels: Record<string, string> = {
  'TABULAR': 'جدولی',
  'CHART': 'نمودار',
  'DASHBOARD': 'داشبورد',
  'PIVOT': 'جدول محوری'
};

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelect,
  onTemplateCreate,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSystemOnly, setShowSystemOnly] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const result = await templateService.getTemplates(
        {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          reportType: selectedType !== 'all' ? selectedType : undefined,
          isSystemTemplate: showSystemOnly ? true : undefined,
          search: searchTerm || undefined
        },
        { page: 1, limit: 50 }
      );
      setTemplates(result.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('خطا در دریافت قالب‌ها');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedType, showSystemOnly, searchTerm]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = templates.filter(template => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        template.name.toLowerCase().includes(searchLower) ||
        (template.description && template.description.toLowerCase().includes(searchLower)) ||
        template.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📋';
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            کتابخانه قالب‌ها
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            انتخاب قالب برای شروع سریع
          </p>
        </div>
        {onTemplateCreate && (
          <button
            onClick={onTemplateCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + ایجاد قالب جدید
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در قالب‌ها..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Category and Type Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              دسته‌بندی
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع گزارش
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">همه انواع</option>
              <option value="TABULAR">جدولی</option>
              <option value="CHART">نمودار</option>
              <option value="DASHBOARD">داشبورد</option>
              <option value="PIVOT">جدول محوری</option>
            </select>
          </div>
        </div>

        {/* System Templates Toggle */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showSystemOnly}
              onChange={(e) => setShowSystemOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
              فقط قالب‌های سیستم
            </span>
          </label>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            هیچ قالبی یافت نشد
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => onTemplateSelect(template)}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      template.reportType === 'TABULAR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      template.reportType === 'CHART' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      template.reportType === 'DASHBOARD' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                    }`}>
                      {reportTypeLabels[template.reportType]}
                    </span>
                  </div>
                </div>
                {template.isSystemTemplate && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded text-xs">
                    سیستم
                  </span>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span>{getCategoryLabel(template.category)}</span>
                  {template.usageCount > 0 && (
                    <span>استفاده: {template.usageCount}</span>
                  )}
                </div>
                {template.isPublic && (
                  <span className="text-blue-600 dark:text-blue-400">عمومی</span>
                )}
              </div>

              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

