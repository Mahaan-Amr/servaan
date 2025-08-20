'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  ChartTooltipProps, 
  ChartLegendProps 
} from '../../types/charts';

// Maintain backward compatibility with existing interfaces
interface LegacyPieChartData {
  name: string;
  value: number;
  fill?: string;
}

interface LegacyCustomPieChartProps {
  data: LegacyPieChartData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  showLegend?: boolean;
}

// Enhanced tooltip with proper typing
const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-medium mb-2">{data.name}</p>
        <p className="text-sm" style={{ color: data.color }}>
          {typeof data.value === 'number' ? data.value.toLocaleString('fa-IR') : String(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

// Enhanced legend with proper typing
const CustomLegend: React.FC<ChartLegendProps> = ({ payload }) => {
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CustomPieChart: React.FC<LegacyCustomPieChartProps> = ({
  data,
  title,
  height = 300,
  className = '',
  showLegend = true
}) => {
  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}; 