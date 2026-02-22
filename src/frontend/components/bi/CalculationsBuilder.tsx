'use client';

import React, { useState } from 'react';
import { validateFormula, CommonFormulas } from '../../utils/calculationsEngine';

export interface ReportCalculation {
  id: string;
  name: string;
  formula: string;
  resultField: string;
  description?: string;
}

interface CalculationsBuilderProps {
  fields: Array<{ id: string; label: string; type: string }>;
  calculations: ReportCalculation[];
  onCalculationsChange: (calculations: ReportCalculation[]) => void;
  className?: string;
}

export const CalculationsBuilder: React.FC<CalculationsBuilderProps> = ({
  fields,
  calculations,
  onCalculationsChange,
  className = ''
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    formula: '',
    resultField: '',
    description: ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const numericFields = fields.filter(f => f.type === 'number' || f.type === 'currency');
  const availableVars = numericFields.map(f => f.id);

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({ name: '', formula: '', resultField: '', description: '' });
    setValidationError(null);
  };

  const handleEdit = (calc: ReportCalculation) => {
    setEditingId(calc.id);
    setFormData({
      name: calc.name,
      formula: calc.formula,
      resultField: calc.resultField,
      description: calc.description || ''
    });
    setShowAddForm(true);
    setValidationError(null);
  };

  const handleSave = () => {
    // Validate formula
    const validation = validateFormula(formData.formula, availableVars);
    if (!validation.valid) {
      setValidationError(validation.error || 'فرمول نامعتبر است');
      return;
    }

    if (editingId) {
      // Update existing
      onCalculationsChange(calculations.map(c => 
        c.id === editingId 
          ? { ...c, ...formData }
          : c
      ));
    } else {
      // Add new
      const newCalc: ReportCalculation = {
        id: `calc-${Date.now()}`,
        ...formData
      };
      onCalculationsChange([...calculations, newCalc]);
    }

    setShowAddForm(false);
    setFormData({ name: '', formula: '', resultField: '', description: '' });
    setValidationError(null);
  };

  const handleDelete = (id: string) => {
    onCalculationsChange(calculations.filter(c => c.id !== id));
  };

  const handleUseTemplate = (template: typeof CommonFormulas[keyof typeof CommonFormulas]) => {
    setFormData({
      ...formData,
      name: template.name,
      formula: template.expression,
      description: template.description || ''
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            محاسبات سفارشی
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
              ایجاد فیلدهای محاسباتی با فرمول‌های سفارشی
            </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + افزودن محاسبه
        </button>
      </div>

      {/* Calculations List */}
      {calculations.length > 0 && (
        <div className="space-y-2">
          {calculations.map(calc => (
            <div
              key={calc.id}
              className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {calc.name}
                    </h4>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs">
                      {calc.resultField}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-1">
                    {calc.formula}
                  </p>
                  {calc.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {calc.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(calc)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(calc.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نام محاسبه *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="مثال: حاشیه سود"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              فرمول *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.formula}
                onChange={(e) => {
                  setFormData({ ...formData, formula: e.target.value });
                  setValidationError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                placeholder="مثال: (profit / revenue) * 100"
              />
              {validationError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationError}
                </p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                فیلدهای عددی موجود: {numericFields.map(f => f.id).join(', ')}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نام فیلد نتیجه *
            </label>
            <input
              type="text"
              value={formData.resultField}
              onChange={(e) => setFormData({ ...formData, resultField: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="مثال: profit_margin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="توضیحات اختیاری"
            />
          </div>

          {/* Template Formulas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              قالب‌های آماده
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CommonFormulas).map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleUseTemplate(template)}
                  className="p-2 text-right text-xs bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-mono">{template.expression}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowAddForm(false);
                setValidationError(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.formula || !formData.resultField}
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

