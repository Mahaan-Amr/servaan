'use client';

import React, { useState } from 'react';

export interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
}

interface SortingBuilderProps {
  fields: Array<{ id: string; label: string; type: string }>;
  sorting: ReportSorting[];
  onSortingChange: (sorting: ReportSorting[]) => void;
  className?: string;
}

export const SortingBuilder: React.FC<SortingBuilderProps> = ({
  fields,
  sorting,
  onSortingChange,
  className = ''
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReportSorting>({
    field: '',
    direction: 'asc'
  });

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingIndex(null);
    setFormData({ field: '', direction: 'asc' });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData(sorting[index]);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formData.field) return;

    if (editingIndex !== null) {
      const newSorting = [...sorting];
      newSorting[editingIndex] = formData;
      onSortingChange(newSorting);
    } else {
      // Check if field already exists
      const existingIndex = sorting.findIndex(s => s.field === formData.field);
      if (existingIndex >= 0) {
        const newSorting = [...sorting];
        newSorting[existingIndex] = formData;
        onSortingChange(newSorting);
      } else {
        onSortingChange([...sorting, formData]);
      }
    }

    setShowAddForm(false);
    setFormData({ field: '', direction: 'asc' });
  };

  const handleDelete = (index: number) => {
    onSortingChange(sorting.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newSorting = [...sorting];
    if (direction === 'up' && index > 0) {
      [newSorting[index - 1], newSorting[index]] = [newSorting[index], newSorting[index - 1]];
      onSortingChange(newSorting);
    } else if (direction === 'down' && index < newSorting.length - 1) {
      [newSorting[index], newSorting[index + 1]] = [newSorting[index + 1], newSorting[index]];
      onSortingChange(newSorting);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            مرتب‌سازی
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ترتیب نمایش داده‌ها را تنظیم کنید
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + افزودن مرتب‌سازی
        </button>
      </div>

      {/* Sorting List */}
      {sorting.length > 0 && (
        <div className="space-y-2">
          {sorting.map((sort, index) => {
            const field = fields.find(f => f.id === sort.field);
            return (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {field?.label || sort.field}
                      </span>
                      <span className={`mr-2 px-2 py-0.5 rounded text-xs ${
                        sort.direction === 'asc'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {sort.direction === 'asc' ? 'صعودی' : 'نزولی'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="جابجایی به بالا"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sorting.length - 1}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="جابجایی به پایین"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
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
              value={formData.field}
              onChange={(e) => setFormData({ ...formData, field: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جهت *
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, direction: 'asc' })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  formData.direction === 'asc'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                صعودی ↑
              </button>
              <button
                onClick={() => setFormData({ ...formData, direction: 'desc' })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  formData.direction === 'desc'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                نزولی ↓
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.field}
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

