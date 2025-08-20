'use client';

import React from 'react';

// Maintain backward compatibility with existing interfaces
interface LegacyDonutChartData {
  name: string;
  value: number;
  count: number;
  color: string;
  percentage: number;
}

interface LegacyCustomDonutChartProps {
  data: LegacyDonutChartData[];
  title?: string;
  className?: string;
}

export const CustomDonutChart: React.FC<LegacyCustomDonutChartProps> = ({
  data,
  title,
  className = ''
}) => {
  if (data.length === 0) {
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

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {title}
        </h3>
      )}
      
      {/* Compact Chart Container */}
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Custom SVG Donut Chart */}
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
              </filter>
            </defs>
            
            {/* Background Circle */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              className="text-gray-200 dark:text-gray-700"
              opacity="0.3"
            />
            
            {/* Data Segments */}
            {data.map((item, index) => {
              const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.value / totalValue) * 360, 0);
              const endAngle = startAngle + (item.value / totalValue) * 360;
              const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
              
              const startX = 100 + 70 * Math.cos((startAngle - 90) * Math.PI / 180);
              const startY = 100 + 70 * Math.sin((startAngle - 90) * Math.PI / 180);
              const endX = 100 + 70 * Math.cos((endAngle - 90) * Math.PI / 180);
              const endY = 100 + 70 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const pathData = [
                `M 100 100`,
                `L ${startX} ${startY}`,
                `A 70 70 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z'
              ].join(' ');
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  filter="url(#shadow)"
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
            
            {/* Center Circle */}
            <circle
              cx="100"
              cy="100"
              r="45"
              fill="currentColor"
              className="text-white dark:text-gray-800"
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                کل محصولات
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {totalValue.toLocaleString('fa-IR', { notation: 'compact' })} ریال
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Category Cards */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {data.map((category, index) => (
          <div 
            key={index} 
            className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${category.color}15, ${category.color}25)`,
              borderLeft: `4px solid ${category.color}`
            }}
          >
            {/* Category Badge */}
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {category.percentage.toFixed(1)}%
              </div>
            </div>
            
            {/* Metrics */}
            <div className="space-y-2">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {category.count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  محصول
                </div>
              </div>
              
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {category.value.toLocaleString('fa-IR', { notation: 'compact' })}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  ریال درآمد
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  backgroundColor: category.color,
                  width: `${category.percentage}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {data.filter(d => d.name === 'A').length > 0 ? data.find(d => d.name === 'A')?.percentage.toFixed(0) : 0}%
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            درآمد محصولات کلیدی
          </div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {Math.round((data.filter(d => d.name === 'A' || d.name === 'B').reduce((sum, d) => sum + d.percentage, 0)))}%
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            درآمد A+B محصولات
          </div>
        </div>
      </div>
    </div>
  );
}; 