'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { 
  ChartTooltipProps, 
  ChartLegendProps 
} from '../../types/charts';

// Maintain backward compatibility with existing interfaces
interface LegacyBarChartData {
  [key: string]: unknown;
}

interface LegacyBarConfig {
  dataKey: string;
  fill: string;
  name: string;
}

interface LegacyCustomBarChartProps {
  data: LegacyBarChartData[];
  bars: LegacyBarConfig[];
  title?: string;
  height?: number;
  xAxisKey: string;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

// Enhanced tooltip with proper typing
const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('fa-IR') : String(entry.value)}
          </p>
        ))}
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
            className="w-3 h-3 rounded-sm"
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

export const CustomBarChart: React.FC<LegacyCustomBarChartProps> = ({
  data,
  bars,
  title,
  height = 300,
  xAxisKey,
  className = '',
  yAxisLabel,
  xAxisLabel
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

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-30"
            stroke="currentColor"
          />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              radius={[2, 2, 0, 0]}
            >
              {data.map((entry, cellIndex) => (
                <Cell key={`cell-${cellIndex}`} fill={typeof entry.fill === 'string' ? entry.fill : bar.fill} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 