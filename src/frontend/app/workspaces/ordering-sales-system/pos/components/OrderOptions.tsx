'use client';

import React from 'react';
import type { OrderOptions, BusinessPreset } from '../../../../../services/orderingService';

interface OrderOptionsProps {
  options: OrderOptions;
  onOptionsChange: (options: OrderOptions) => void;
  presets: BusinessPreset[];
  onPresetSelect: (preset: BusinessPreset) => void;
}

export default function OrderOptions({ options, onOptionsChange, presets, onPresetSelect }: OrderOptionsProps) {
  const updateOption = (key: keyof OrderOptions, value: string | number | boolean) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تنظیمات سفارش</h3>
        
        {/* Presets Dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              const preset = presets.find(p => p.id === e.target.value);
              if (preset) onPresetSelect(preset);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">انتخاب پیش‌فرض</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {/* Discount Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تخفیف</label>
            <input
              type="checkbox"
              checked={options.discountEnabled}
              onChange={(e) => updateOption('discountEnabled', e.target.checked)}
              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {options.discountEnabled && (
            <div className="space-y-3">
              <div className="flex space-x-4 space-x-reverse">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="PERCENTAGE"
                    checked={options.discountType === 'PERCENTAGE'}
                    onChange={(e) => updateOption('discountType', e.target.value)}
                    className="ml-2 w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">درصد</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="AMOUNT"
                    checked={options.discountType === 'AMOUNT'}
                    onChange={(e) => updateOption('discountType', e.target.value)}
                    className="ml-2 w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">مبلغ</span>
                </label>
              </div>
              
              <input
                type="number"
                value={options.discountValue}
                onChange={(e) => updateOption('discountValue', Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder={options.discountType === 'PERCENTAGE' ? 'درصد تخفیف' : 'مبلغ تخفیف'}
                min="0"
                step={options.discountType === 'PERCENTAGE' ? '1' : '1000'}
              />
            </div>
          )}
        </div>

        {/* Tax Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">مالیات</label>
            <input
              type="checkbox"
              checked={options.taxEnabled}
              onChange={(e) => updateOption('taxEnabled', e.target.checked)}
              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {options.taxEnabled && (
            <input
              type="number"
              value={options.taxPercentage}
              onChange={(e) => updateOption('taxPercentage', Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="درصد مالیات"
              min="0"
              max="100"
              step="0.1"
            />
          )}
        </div>

        {/* Service Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">خدمات</label>
            <input
              type="checkbox"
              checked={options.serviceEnabled}
              onChange={(e) => updateOption('serviceEnabled', e.target.checked)}
              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {options.serviceEnabled && (
            <input
              type="number"
              value={options.servicePercentage}
              onChange={(e) => updateOption('servicePercentage', Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="درصد خدمات"
              min="0"
              max="100"
              step="0.1"
            />
          )}
        </div>

        {/* Courier Section */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">پیک</label>
            <input
              type="checkbox"
              checked={options.courierEnabled}
              onChange={(e) => updateOption('courierEnabled', e.target.checked)}
              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          {options.courierEnabled && (
            <div className="space-y-3">
              <input
                type="number"
                value={options.courierAmount}
                onChange={(e) => updateOption('courierAmount', Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="مبلغ پیک"
                min="0"
                step="1000"
              />
              <textarea
                value={options.courierNotes || ''}
                onChange={(e) => updateOption('courierNotes', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="یادداشت پیک (اختیاری)"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 