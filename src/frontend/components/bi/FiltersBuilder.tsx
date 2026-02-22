'use client';

import React, { useState } from 'react';
import { ReportFilter } from '../../services/reportService';

interface FiltersBuilderProps {
  fields: Array<{ id: string; label: string; type: string }>;
  filters: ReportFilter[];
  onFiltersChange: (filters: ReportFilter[]) => void;
  className?: string;
}

const operators = {
  text: [
    { value: 'equals', label: 'برابر با' },
    { value: 'contains', label: 'شامل' },
    { value: 'in', label: 'یکی از' }
  ],
  number: [
    { value: 'equals', label: 'برابر با' },
    { value: 'greater', label: 'بزرگتر از' },
    { value: 'less', label: 'کوچکتر از' },
    { value: 'between', label: 'بین' }
  ],
  date: [
    { value: 'equals', label: 'برابر با' },
    { value: 'greater', label: 'بعد از' },
    { value: 'less', label: 'قبل از' },
    { value: 'between', label: 'بین' }
  ],
  boolean: [
    { value: 'equals', label: 'برابر با' }
  ]
};

export const FiltersBuilder: React.FC<FiltersBuilderProps> = ({
  fields,
  filters,
  onFiltersChange,
  className = ''
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ReportFilter>>({
    field: '',
    operator: 'equals',
    value: '',
    label: ''
  });

  const selectedField = fields.find(f => f.id === formData.field);
  const availableOperators = selectedField 
    ? operators[selectedField.type as keyof typeof operators] || operators.text
    : operators.text;

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ field: '', operator: 'equals', value: '', label: '' });
  };

  const handleEdit = (filter: ReportFilter) => {
    setEditingId(filter.id);
    setFormData(filter);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formData.field || !formData.operator || formData.value === undefined || formData.value === '') {
      return;
    }

    const field = fields.find(f => f.id === formData.field);
    if (!field) return;

    const newFilter: ReportFilter = {
      id: editingId || `filter-${Date.now()}`,
      field: formData.field,
      operator: formData.operator as ReportFilter['operator'],
      value: formData.value,
      label: formData.label || field.label
    };

    if (editingId) {
      onFiltersChange(filters.map(f => f.id === editingId ? newFilter : f));
    } else {
      onFiltersChange([...filters, newFilter]);
    }

    setShowAddForm(false);
    setFormData({ field: '', operator: 'equals', value: '', label: '' });
  };

  const handleDelete = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id));
  };

  const renderValueInput = () => {
    if (!selectedField) return null;

    const operator = formData.operator || 'equals';

    if (operator === 'between') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type={selectedField.type === 'date' ? 'date' : selectedField.type === 'number' ? 'number' : 'text'}
            value={Array.isArray(formData.value) ? formData.value[0] : ''}
            onChange={(e) => {
              const val: string | number = selectedField.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
              const existingVal = Array.isArray(formData.value) && typeof formData.value[1] !== 'undefined' 
                ? formData.value[1] 
                : (selectedField.type === 'number' ? 0 : '');
              setFormData({
                ...formData,
                value: [val, existingVal] as string[] | number[]
              });
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="از"
          />
          <input
            type={selectedField.type === 'date' ? 'date' : selectedField.type === 'number' ? 'number' : 'text'}
            value={Array.isArray(formData.value) ? formData.value[1] : ''}
            onChange={(e) => {
              const val: string | number = selectedField.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
              const existingVal = Array.isArray(formData.value) && typeof formData.value[0] !== 'undefined' 
                ? formData.value[0] 
                : (selectedField.type === 'number' ? 0 : '');
              setFormData({
                ...formData,
                value: [existingVal, val] as string[] | number[]
              });
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="تا"
          />
        </div>
      );
    }

    if (operator === 'in') {
      return (
        <input
          type="text"
          value={Array.isArray(formData.value) ? formData.value.join(', ') : ''}
          onChange={(e) => {
            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
            setFormData({ ...formData, value: values });
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="مقادیر را با کاما جدا کنید"
        />
      );
    }

    return (
      <input
        type={selectedField.type === 'date' ? 'date' : selectedField.type === 'number' ? 'number' : 'text'}
        value={typeof formData.value === 'string' || typeof formData.value === 'number' ? formData.value : ''}
        onChange={(e) => {
          const val = selectedField.type === 'number' 
            ? parseFloat(e.target.value) || 0
            : selectedField.type === 'boolean'
            ? e.target.checked
            : e.target.value;
          setFormData({ ...formData, value: val });
        }}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        placeholder="مقدار فیلتر"
      />
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            فیلترها
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            فیلترهای گزارش را تعریف کنید
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + افزودن فیلتر
        </button>
      </div>

      {/* Filters List */}
      {filters.length > 0 && (
        <div className="space-y-2">
          {filters.map(filter => {
            const field = fields.find(f => f.id === filter.field);
            return (
              <div
                key={filter.id}
                className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {filter.label || field?.label}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {field?.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {operators[field?.type as keyof typeof operators]?.[0]?.label || 'برابر با'} {filter.operator}: {Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(filter)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(filter.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              فیلد *
            </label>
            <select
              value={formData.field || ''}
              onChange={(e) => {
                setFormData({ ...formData, field: e.target.value, operator: 'equals', value: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">انتخاب فیلد</option>
              {fields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.label} ({field.type})
                </option>
              ))}
            </select>
          </div>

          {selectedField && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عملگر *
                </label>
                <select
                  value={formData.operator || 'equals'}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value as ReportFilter['operator'], value: '' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {availableOperators.map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مقدار *
                </label>
                {renderValueInput()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  برچسب (اختیاری)
                </label>
                <input
                  type="text"
                  value={formData.label || ''}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={selectedField.label}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.field || !formData.operator || formData.value === undefined || formData.value === ''}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ذخیره
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

