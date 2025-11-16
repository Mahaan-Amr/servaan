'use client';

import React, { useState } from 'react';
import type { OrderOptions, OrderCalculation, BusinessPreset } from '../../../../../services/orderingService';
import { FormattedNumberInput } from '../../../../../components/ui/FormattedNumberInput';

interface OrderSummaryProps {
  orderItems: Array<{
    id: string;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  options: OrderOptions;
  calculation: OrderCalculation;
  onOptionsChange: (options: OrderOptions) => void;
  presets: BusinessPreset[];
  onPresetSelect: (preset: BusinessPreset) => void;
  defaultExpanded?: boolean;
  showItemsList?: boolean;
}

export default function OrderSummary({ orderItems, options, calculation, onOptionsChange, presets, onPresetSelect, defaultExpanded, showItemsList = true }: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('fa-IR');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-b border-gray-200 dark:border-gray-700">
      {/* Collapsible Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">خلاصه سفارش</h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {formatPrice(calculation.totalAmount)} تومان
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Quick Summary removed for brevity; breakdown below suffices */}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Order Items Summary */}
          {showItemsList && (
            <div className="mb-4 mt-3">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatPrice(item.totalPrice)} تومان
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Calculation Breakdown */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">جمع آیتم‌ها:</span>
              <span className="text-gray-900 dark:text-white">{formatPrice(calculation.subtotal)} تومان</span>
            </div>
            
            {calculation.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>
                  تخفیف ({calculation.discountPercentage}%):
                </span>
                <span>-{formatPrice(calculation.discountAmount)} تومان</span>
              </div>
            )}
            
            {calculation.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>مالیات ({calculation.taxPercentage}%):</span>
                <span>{formatPrice(calculation.taxAmount)} تومان</span>
              </div>
            )}
            
            {calculation.serviceAmount > 0 && (
              <div className="flex justify-between">
                <span>خدمات ({calculation.servicePercentage}%):</span>
                <span>{formatPrice(calculation.serviceAmount)} تومان</span>
              </div>
            )}
            
            {calculation.courierAmount > 0 && (
              <div className="flex justify-between">
                <span>پیک:</span>
                <span>{formatPrice(calculation.courierAmount)} تومان</span>
              </div>
            )}
            
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 font-bold">
              <div className="flex justify-between">
                <span className="text-gray-900 dark:text-white">مجموع کل:</span>
                                  <span className="text-amber-600 dark:text-amber-400">
                    {formatPrice(calculation.totalAmount)} تومان
                  </span>
              </div>
            </div>
          </div>

          {/* Order Options - Compact Horizontal Switches */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">تنظیمات سفارش</h4>
              
              {/* Presets Dropdown */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    const preset = presets.find(p => p.id === e.target.value);
                    if (preset) onPresetSelect(preset);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">پیش‌فرض</option>
                  {presets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Options presented as labeled cards in a responsive grid */}
            {/* Force 2-column grid on all sizes to create two rows with 4 cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Discount */}
              <div className="rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900/40 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">تخفیف</span>
                  <input
                    type="checkbox"
                    checked={options.discountEnabled}
                    onChange={(e) => onOptionsChange({ ...options, discountEnabled: e.target.checked })}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                </div>
                <div className="mt-3 flex items-center space-x-2 space-x-reverse">
                  <select
                    value={options.discountType}
                    onChange={(e) => onOptionsChange({ ...options, discountType: e.target.value as 'PERCENTAGE' | 'AMOUNT' })}
                    disabled={!options.discountEnabled}
                    className={`px-2 py-1 rounded text-xs border ${options.discountEnabled ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/40'} text-gray-900 dark:text-white`}
                  >
                    <option value="PERCENTAGE">%</option>
                    <option value="AMOUNT">تومان</option>
                  </select>
                  <FormattedNumberInput
                    value={options.discountValue}
                    onChange={(value: string) => onOptionsChange({ ...options, discountValue: parseFloat(value) || 0 })}
                    disabled={!options.discountEnabled}
                    placeholder="0"
                    min={0}
                    allowDecimals={true}
                    className={`w-20 text-xs ${options.discountEnabled ? '' : 'opacity-50'}`}
                  />
                </div>
              </div>

              {/* Tax */}
              <div className="rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900/40 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">مالیات</span>
                  <input
                    type="checkbox"
                    checked={options.taxEnabled}
                    onChange={(e) => onOptionsChange({ ...options, taxEnabled: e.target.checked })}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                </div>
                <div className="mt-3 flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs text-gray-500">%</span>
                  <FormattedNumberInput
                    value={options.taxPercentage}
                    onChange={(value: string) => onOptionsChange({ ...options, taxPercentage: parseFloat(value) || 0 })}
                    disabled={!options.taxEnabled}
                    placeholder="9"
                    min={0}
                    max={100}
                    allowDecimals={true}
                    className={`w-20 text-xs ${options.taxEnabled ? '' : 'opacity-50'}`}
                  />
                </div>
              </div>

              {/* Service */}
              <div className="rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900/40 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">خدمات</span>
                  <input
                    type="checkbox"
                    checked={options.serviceEnabled}
                    onChange={(e) => onOptionsChange({ ...options, serviceEnabled: e.target.checked })}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                </div>
                <div className="mt-3 flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs text-gray-500">%</span>
                  <FormattedNumberInput
                    value={options.servicePercentage}
                    onChange={(value: string) => onOptionsChange({ ...options, servicePercentage: parseFloat(value) || 0 })}
                    disabled={!options.serviceEnabled}
                    placeholder="10"
                    min={0}
                    max={100}
                    allowDecimals={true}
                    className={`w-20 text-xs ${options.serviceEnabled ? '' : 'opacity-50'}`}
                  />
                </div>
              </div>

              {/* Courier */}
              <div className="rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900/40 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">پیک</span>
                  <input
                    type="checkbox"
                    checked={options.courierEnabled}
                    onChange={(e) => onOptionsChange({ ...options, courierEnabled: e.target.checked })}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                </div>
                <div className="mt-3 flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs text-gray-500">تومان</span>
                  <FormattedNumberInput
                    value={options.courierAmount}
                    onChange={(value: string) => onOptionsChange({ ...options, courierAmount: parseFloat(value) || 0 })}
                    disabled={!options.courierEnabled}
                    placeholder="0"
                    min={0}
                    allowDecimals={false}
                    className={`w-24 text-xs ${options.courierEnabled ? '' : 'opacity-50'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 