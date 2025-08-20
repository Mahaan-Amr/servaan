'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  ChartTooltipProps 
} from '../../types/charts';

// Maintain backward compatibility with existing interfaces
interface LegacyScatterChartData {
  name: string;
  revenue: number;
  profit: number;
  profitMargin: number;
  quantity: number;
  category: string;
  fill?: string;
}

interface LegacyCustomScatterChartProps {
  data: LegacyScatterChartData[];
  title?: string;
  height?: number;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// Enhanced tooltip with proper typing
const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as unknown as LegacyScatterChartData;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-bold mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-600 dark:text-blue-400">
            درآمد: {typeof data.revenue === 'number' ? data.revenue.toLocaleString('fa-IR') : 'N/A'} ریال
          </p>
          <p className="text-green-600 dark:text-green-400">
            سود: {typeof data.profit === 'number' ? data.profit.toLocaleString('fa-IR') : 'N/A'} ریال
          </p>
          <p className="text-purple-600 dark:text-purple-400">
            حاشیه سود: {typeof data.profitMargin === 'number' ? data.profitMargin.toFixed(1) : 'N/A'}%
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            تعداد: {typeof data.quantity === 'number' ? data.quantity.toLocaleString('fa-IR') : 'N/A'}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            دسته: {data.category || 'N/A'}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const CustomScatterChart: React.FC<LegacyCustomScatterChartProps> = ({
  data,
  title,
  height = 400,
  className = '',
  xAxisLabel = 'درآمد (ریال)',
  yAxisLabel = 'سود (ریال)'
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

  // Color points based on profit margin
  const getPointColor = (profitMargin: number) => {
    if (profitMargin >= 20) return '#10B981'; // Green
    if (profitMargin >= 10) return '#F59E0B'; // Yellow
    if (profitMargin >= 0) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const chartData = data.map(item => ({
    ...item,
    fill: getPointColor(item.profitMargin)
  }));

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-30"
            stroke="currentColor"
          />
          <XAxis 
            type="number"
            dataKey="revenue"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={{ 
              value: xAxisLabel, 
              position: 'insideBottom', 
              offset: -10,
              style: { textAnchor: 'middle', fill: 'currentColor' }
            }}
            tickFormatter={(value) => value.toLocaleString('fa-IR', { notation: 'compact' })}
          />
          <YAxis 
            type="number"
            dataKey="profit"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={{ 
              value: yAxisLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: 'currentColor' }
            }}
            tickFormatter={(value) => value.toLocaleString('fa-IR', { notation: 'compact' })}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter 
            data={chartData} 
            fill="#8884d8"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">سود بالا (&gt;20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">سود متوسط (10-20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">سود پایین (0-10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">ضرر (&lt;0%)</span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {data.filter(d => d.profitMargin >= 20).length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            محصولات پرسود
          </div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {(data.reduce((sum, d) => sum + d.profitMargin, 0) / data.length).toFixed(1)}%
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            میانگین حاشیه سود
          </div>
        </div>
      </div>
    </div>
  );
}; 