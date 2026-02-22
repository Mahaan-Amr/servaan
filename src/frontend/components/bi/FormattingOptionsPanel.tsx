'use client';

import React, { useState } from 'react';

export interface FieldFormatting {
  fieldId: string;
  label?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  numberFormat?: {
    type: 'number' | 'currency' | 'percentage' | 'decimal';
    decimals?: number;
    thousandSeparator?: boolean;
    currencySymbol?: string;
  };
  dateFormat?: string;
  textFormat?: {
    case?: 'uppercase' | 'lowercase' | 'capitalize';
    truncate?: number;
  };
  color?: string;
  backgroundColor?: string;
  fontWeight?: 'normal' | 'bold' | 'semibold';
}

interface FormattingOptionsPanelProps {
  fields: Array<{ id: string; label: string; type: string }>;
  formatting: FieldFormatting[];
  onFormattingChange: (formatting: FieldFormatting[]) => void;
  className?: string;
}

export const FormattingOptionsPanel: React.FC<FormattingOptionsPanelProps> = ({
  fields,
  formatting,
  onFormattingChange,
  className = ''
}) => {
  const [selectedField, setSelectedField] = useState<string | null>(fields[0]?.id || null);

  const getFieldFormatting = (fieldId: string): FieldFormatting => {
    return formatting.find(f => f.fieldId === fieldId) || { fieldId };
  };

  const updateFieldFormatting = (fieldId: string | null, updates: Partial<FieldFormatting>) => {
    if (!fieldId) return;
    const existing = formatting.find(f => f.fieldId === fieldId);
    if (existing) {
      onFormattingChange(formatting.map(f => 
        f.fieldId === fieldId ? { ...f, ...updates } : f
      ));
    } else {
      onFormattingChange([...formatting, { fieldId, ...updates }]);
    }
  };

  const currentFormatting = selectedField ? getFieldFormatting(selectedField) : null;
  const selectedFieldInfo = fields.find(f => f.id === selectedField);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          تنظیمات فرمت
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          فرمت نمایش فیلدها را تنظیم کنید
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Field Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            انتخاب فیلد
          </label>
          <select
            value={selectedField || ''}
            onChange={(e) => setSelectedField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {fields.map(field => (
              <option key={field.id} value={field.id}>
                {field.label} ({field.type})
              </option>
            ))}
          </select>
        </div>

        {/* Formatting Options */}
        {currentFormatting && selectedFieldInfo && (
          <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                برچسب سفارشی
              </label>
              <input
                type="text"
                value={currentFormatting.label || selectedFieldInfo.label}
                onChange={(e) => updateFieldFormatting(selectedField, { label: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={selectedFieldInfo.label}
              />
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عرض ستون (px)
              </label>
              <input
                type="number"
                value={currentFormatting.width || ''}
                onChange={(e) => updateFieldFormatting(selectedField, { 
                  width: e.target.value ? parseInt(e.target.value) || undefined : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="خودکار"
                min="50"
              />
            </div>

            {/* Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تراز
              </label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map(align => (
                  <button
                    key={align}
                    onClick={() => selectedField && updateFieldFormatting(selectedField, { alignment: align })}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      currentFormatting.alignment === align
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {align === 'left' ? 'چپ' : align === 'center' ? 'وسط' : 'راست'}
                  </button>
                ))}
              </div>
            </div>

            {/* Number Formatting */}
            {(selectedFieldInfo.type === 'number' || selectedFieldInfo.type === 'currency') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  فرمت عددی
                </label>
                <select
                  value={currentFormatting.numberFormat?.type || 'number'}
                  onChange={(e) => selectedField && updateFieldFormatting(selectedField, {
                    numberFormat: {
                      ...currentFormatting.numberFormat,
                      type: e.target.value as 'number' | 'currency' | 'percentage' | 'decimal'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="number">عدد</option>
                  <option value="currency">ارز</option>
                  <option value="percentage">درصد</option>
                  <option value="decimal">اعشاری</option>
                </select>
                
                {currentFormatting.numberFormat?.type && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        اعشار
                      </label>
                      <input
                        type="number"
                        value={currentFormatting.numberFormat?.decimals || 0}
                        onChange={(e) => selectedField && updateFieldFormatting(selectedField, {
                          numberFormat: {
                            type: currentFormatting.numberFormat?.type || 'number',
                            ...currentFormatting.numberFormat,
                            decimals: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        min="0"
                        max="10"
                      />
                    </div>
                    {currentFormatting.numberFormat?.type === 'currency' && (
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          نماد ارز
                        </label>
                        <input
                          type="text"
                          value={currentFormatting.numberFormat?.currencySymbol || 'تومان'}
                          onChange={(e) => selectedField && updateFieldFormatting(selectedField, {
                            numberFormat: {
                              type: currentFormatting.numberFormat?.type || 'currency',
                              ...currentFormatting.numberFormat,
                              currencySymbol: e.target.value
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="تومان"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Date Formatting */}
            {selectedFieldInfo.type === 'date' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  فرمت تاریخ
                </label>
                <select
                  value={currentFormatting.dateFormat || 'YYYY/MM/DD'}
                  onChange={(e) => selectedField && updateFieldFormatting(selectedField, { dateFormat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="YYYY/MM/DD">1403/01/01</option>
                  <option value="DD/MM/YYYY">01/01/1403</option>
                  <option value="YYYY-MM-DD">1403-01-01</option>
                  <option value="DD MMM YYYY">01 فروردین 1403</option>
                </select>
              </div>
            )}

            {/* Text Formatting */}
            {selectedFieldInfo.type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  فرمت متن
                </label>
                <select
                  value={currentFormatting.textFormat?.case || 'normal'}
                  onChange={(e) => selectedField && updateFieldFormatting(selectedField, {
                    textFormat: {
                      ...currentFormatting.textFormat,
                      case: e.target.value as 'uppercase' | 'lowercase' | 'capitalize'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="normal">عادی</option>
                  <option value="uppercase">بزرگ</option>
                  <option value="lowercase">کوچک</option>
                  <option value="capitalize">حرف اول بزرگ</option>
                </select>
              </div>
            )}

            {/* Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  رنگ متن
                </label>
                <input
                  type="color"
                  value={currentFormatting.color || '#000000'}
                  onChange={(e) => selectedField && updateFieldFormatting(selectedField, { color: e.target.value })}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  رنگ پس‌زمینه
                </label>
                <input
                  type="color"
                  value={currentFormatting.backgroundColor || '#ffffff'}
                  onChange={(e) => selectedField && updateFieldFormatting(selectedField, { backgroundColor: e.target.value })}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

