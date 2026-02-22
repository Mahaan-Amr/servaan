'use client';

import React, { useState, useCallback } from 'react';
import { ReportFieldPalette } from './ReportFieldPalette';
import { ReportCanvas } from './ReportCanvas';

interface FieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
  description?: string;
  table?: string;
}

interface ReportBuilderProps {
  availableFields: FieldDefinition[];
  selectedFields: FieldDefinition[];
  onFieldsChange: (fields: FieldDefinition[]) => void;
  reportName: string;
  onSave?: () => void;
  onPreview?: () => void;
  className?: string;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  availableFields,
  selectedFields,
  onFieldsChange,
  reportName,
  onSave,
  onPreview,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

  const handleFieldAdd = useCallback((field: FieldDefinition) => {
    if (!selectedFields.find(f => f.id === field.id)) {
      onFieldsChange([...selectedFields, field]);
    }
  }, [selectedFields, onFieldsChange]);

  const handleFieldRemove = useCallback((fieldId: string) => {
    onFieldsChange(selectedFields.filter(f => f.id !== fieldId));
  }, [selectedFields, onFieldsChange]);

  const handleFieldReorder = useCallback((fields: FieldDefinition[]) => {
    onFieldsChange(fields);
  }, [onFieldsChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'builder'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          سازنده گزارش
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          پیش‌نمایش
        </button>
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Field Palette */}
          <div className="lg:col-span-1">
            <ReportFieldPalette
              availableFields={availableFields}
              onFieldAdd={handleFieldAdd}
              selectedFields={selectedFields.map(f => f.id)}
            />
          </div>

          {/* Report Canvas */}
          <div className="lg:col-span-2">
            <ReportCanvas
              fields={selectedFields}
              onFieldsChange={onFieldsChange}
              onFieldRemove={handleFieldRemove}
              onFieldReorder={handleFieldReorder}
            />
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              پیش‌نمایش گزارش
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reportName || 'گزارش بدون نام'}
            </p>
          </div>

          {selectedFields.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                هیچ فیلدی انتخاب نشده است
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                برای پیش‌نمایش، فیلدها را به ناحیه گزارش اضافه کنید
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {selectedFields.map((field, index) => (
                      <th
                        key={field.id}
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          <span>{index + 1}</span>
                          <span>{field.label}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            field.type === 'text' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                            field.type === 'number' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            field.type === 'date' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                            field.type === 'currency' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {field.type}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Sample rows */}
                  {[1, 2, 3].map((row) => (
                    <tr key={row} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {selectedFields.map(field => (
                        <td
                          key={field.id}
                          className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300"
                        >
                          <span className="text-gray-400 dark:text-gray-500">
                            {field.type === 'number' || field.type === 'currency' ? '0' :
                             field.type === 'date' ? '1403/01/01' :
                             field.type === 'boolean' ? '✓' :
                             'مقدار نمونه'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onPreview}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              اجرای پیش‌نمایش
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSave}
          disabled={!reportName.trim() || selectedFields.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ذخیره گزارش
        </button>
      </div>
    </div>
  );
};

