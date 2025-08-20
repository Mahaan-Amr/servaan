'use client';

import React from 'react';

// Maintain backward compatibility with existing interfaces
interface LegacyTopProductData {
  name: string;
  revenue: number;
  quantity: number;
  abcCategory: 'A' | 'B' | 'C';
  percentage: number;
  fullName?: string;
}

interface LegacyCustomTopProductsChartProps {
  data: LegacyTopProductData[];
  title?: string;
  height?: number;
  className?: string;
  maxProducts?: number;
}

export const CustomTopProductsChart: React.FC<LegacyCustomTopProductsChartProps> = ({
  data,
  title,
  height = 500,
  className = '',
  maxProducts = 8
}) => {
  // Limit and sort data by revenue - don't reverse for horizontal layout
  const chartData = data
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, maxProducts);

  if (chartData.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  // Find max value for better scaling
  const maxValue = Math.max(...chartData.map(item => item.revenue));

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {title}
        </h3>
      )}
      
      {/* Enhanced Legend */}
      <div className="flex justify-center gap-4 mb-6 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <span className="text-gray-700 dark:text-gray-300">A (کلیدی)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
          <span className="text-gray-700 dark:text-gray-300">B (مهم)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500"></div>
          <span className="text-gray-700 dark:text-gray-300">C (معمولی)</span>
        </div>
      </div>
      
      {/* Custom Bar Chart */}
      <div className="space-y-3" style={{ minHeight: height - 200 + 'px' }}>
        {chartData.map((item, index) => {
          const percentage = (item.revenue / maxValue) * 100;
          const isTop = index < 3;
          
          return (
            <div key={index} className="relative">
              {/* Rank Badge */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                  index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {index + 1}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.quantity.toLocaleString('fa-IR')} عدد
                      </div>
                    </div>
                    
                    {/* ABC Category Badge */}
                    <div className="flex-shrink-0 ml-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        item.abcCategory === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        item.abcCategory === 'B' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {item.abcCategory}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  className={`h-full rounded-lg transition-all duration-700 ${
                    isTop ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                
                {/* Revenue Label */}
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {item.revenue.toLocaleString('fa-IR', { notation: 'compact' })} ریال
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {chartData.filter(d => d.abcCategory === 'A').length}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">محصولات کلیدی</div>
        </div>
        
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
            {chartData.filter(d => d.abcCategory === 'B').length}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">محصولات مهم</div>
        </div>
        
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <div className="text-lg font-bold text-red-700 dark:text-red-300">
            {chartData.filter(d => d.abcCategory === 'C').length}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400">محصولات معمولی</div>
        </div>
      </div>
    </div>
  );
}; 