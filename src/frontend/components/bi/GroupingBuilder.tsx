'use client';

import React, { useState } from 'react';

export interface ReportGrouping {
  field: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

interface GroupingBuilderProps {
  fields: Array<{ id: string; label: string; type: string }>;
  grouping: ReportGrouping[];
  onGroupingChange: (grouping: ReportGrouping[]) => void;
  className?: string;
}

const aggregations = [
  { value: 'none', label: 'بدون تجمیع' },
  { value: 'sum', label: 'جمع' },
  { value: 'avg', label: 'میانگین' },
  { value: 'count', label: 'تعداد' },
  { value: 'min', label: 'حداقل' },
  { value: 'max', label: 'حداکثر' }
];

export const GroupingBuilder: React.FC<GroupingBuilderProps> = ({
  fields,
  grouping,
  onGroupingChange,
  className = ''
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReportGrouping>({
    field: '',
    aggregation: 'none'
  });

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingIndex(null);
    setFormData({ field: '', aggregation: 'none' });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData(grouping[index]);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formData.field) return;

    if (editingIndex !== null) {
      const newGrouping = [...grouping];
      newGrouping[editingIndex] = formData;
      onGroupingChange(newGrouping);
    } else {
      // Check if field already exists
      const existingIndex = grouping.findIndex(g => g.field === formData.field);
      if (existingIndex >= 0) {
        const newGrouping = [...grouping];
        newGrouping[existingIndex] = formData;
        onGroupingChange(newGrouping);
      } else {
        onGroupingChange([...grouping, formData]);
      }
    }

    setShowAddForm(false);
    setFormData({ field: '', aggregation: 'none' });
  };

  const handleDelete = (index: number) => {
    onGroupingChange(grouping.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newGrouping = [...grouping];
    if (direction === 'up' && index > 0) {
      [newGrouping[index - 1], newGrouping[index]] = [newGrouping[index], newGrouping[index - 1]];
      onGroupingChange(newGrouping);
    } else if (direction === 'down' && index < newGrouping.length - 1) {
      [newGrouping[index], newGrouping[index + 1]] = [newGrouping[index + 1], newGrouping[index]];
      onGroupingChange(newGrouping);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            گروه‌بندی
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            فیلدهای گروه‌بندی و تجمیع را تنظیم کنید
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + افزودن گروه‌بندی
        </button>
      </div>

      {/* Grouping List */}
      {grouping.length > 0 && (
        <div className="space-y-2">
          {grouping.map((group, index) => {
            const field = fields.find(f => f.id === group.field);
            const aggregation = aggregations.find(a => a.value === group.aggregation);
            return (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded text-xs font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {field?.label || group.field}
                      </span>
                      {group.aggregation && group.aggregation !== 'none' && (
                        <span className="mr-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs">
                          {aggregation?.label}
                        </span>
                      )}
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
                      disabled={index === grouping.length - 1}
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
              تجمیع
            </label>
            <select
              value={formData.aggregation || 'none'}
              onChange={(e) => setFormData({ ...formData, aggregation: e.target.value as ReportGrouping['aggregation'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {aggregations.map(agg => (
                <option key={agg.value} value={agg.value}>
                  {agg.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              برای فیلدهای عددی، می‌توانید نوع تجمیع را انتخاب کنید
            </p>
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

