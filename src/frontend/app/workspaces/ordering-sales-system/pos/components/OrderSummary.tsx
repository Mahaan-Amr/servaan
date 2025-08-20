'use client';

import React, { useState } from 'react';
import type { OrderOptions, OrderCalculation, BusinessPreset } from '../../../../../services/orderingService';

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
}

export default function OrderSummary({ orderItems, options, calculation, onOptionsChange, presets, onPresetSelect }: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
              {formatPrice(calculation.totalAmount)} ریال
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
        
        {/* Quick Summary - Always Visible */}
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {orderItems.length} آیتم • {formatPrice(calculation.subtotal)} ریال
          {calculation.discountAmount > 0 && ` • تخفیف: ${formatPrice(calculation.discountAmount)} ریال`}
          {calculation.taxAmount > 0 && ` • مالیات: ${formatPrice(calculation.taxAmount)} ریال`}
          {calculation.serviceAmount > 0 && ` • خدمات: ${formatPrice(calculation.serviceAmount)} ریال`}
          {calculation.courierAmount > 0 && ` • پیک: ${formatPrice(calculation.courierAmount)} ریال`}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Order Items Summary */}
          <div className="mb-4 mt-3">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center mb-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatPrice(item.totalPrice)} ریال
                </span>
              </div>
            ))}
          </div>

          {/* Calculation Breakdown */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">جمع آیتم‌ها:</span>
              <span className="text-gray-900 dark:text-white">{formatPrice(calculation.subtotal)} ریال</span>
            </div>
            
            {calculation.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>
                  تخفیف ({calculation.discountPercentage}%):
                </span>
                <span>-{formatPrice(calculation.discountAmount)} ریال</span>
              </div>
            )}
            
            {calculation.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>مالیات ({calculation.taxPercentage}%):</span>
                <span>{formatPrice(calculation.taxAmount)} ریال</span>
              </div>
            )}
            
            {calculation.serviceAmount > 0 && (
              <div className="flex justify-between">
                <span>خدمات ({calculation.servicePercentage}%):</span>
                <span>{formatPrice(calculation.serviceAmount)} ریال</span>
              </div>
            )}
            
            {calculation.courierAmount > 0 && (
              <div className="flex justify-between">
                <span>پیک:</span>
                <span>{formatPrice(calculation.courierAmount)} ریال</span>
              </div>
            )}
            
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 font-bold">
              <div className="flex justify-between">
                <span className="text-gray-900 dark:text-white">مجموع کل:</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatPrice(calculation.totalAmount)} ریال
                </span>
              </div>
            </div>
          </div>

          {/* Order Options - Enhanced Version */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
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

            <div className="space-y-4">
              {/* Discount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={options.discountEnabled}
                    onChange={(e) => onOptionsChange({...options, discountEnabled: e.target.checked})}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">تخفیف</label>
                </div>
                {options.discountEnabled && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <select
                      value={options.discountType}
                      onChange={(e) => onOptionsChange({...options, discountType: e.target.value as 'PERCENTAGE' | 'AMOUNT'})}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="AMOUNT">ریال</option>
                    </select>
                    <input
                      type="number"
                      value={options.discountValue}
                      onChange={(e) => onOptionsChange({...options, discountValue: parseFloat(e.target.value) || 0})}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
              
              {/* Tax */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={options.taxEnabled}
                    onChange={(e) => onOptionsChange({...options, taxEnabled: e.target.checked})}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">مالیات</label>
                </div>
                {options.taxEnabled && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-xs text-gray-500">%</span>
                    <input
                      type="number"
                      value={options.taxPercentage}
                      onChange={(e) => onOptionsChange({...options, taxPercentage: parseFloat(e.target.value) || 0})}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      placeholder="9"
                    />
                  </div>
                )}
              </div>
              
              {/* Service */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={options.serviceEnabled}
                    onChange={(e) => onOptionsChange({...options, serviceEnabled: e.target.checked})}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">خدمات</label>
                </div>
                {options.serviceEnabled && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-xs text-gray-500">%</span>
                    <input
                      type="number"
                      value={options.servicePercentage}
                      onChange={(e) => onOptionsChange({...options, servicePercentage: parseFloat(e.target.value) || 0})}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                )}
              </div>
              
              {/* Courier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={options.courierEnabled}
                    onChange={(e) => onOptionsChange({...options, courierEnabled: e.target.checked})}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">پیک</label>
                </div>
                {options.courierEnabled && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-xs text-gray-500">ریال</span>
                    <input
                      type="number"
                      value={options.courierAmount}
                      onChange={(e) => onOptionsChange({...options, courierAmount: parseFloat(e.target.value) || 0})}
                      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 