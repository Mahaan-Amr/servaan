'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { 
  ChartTooltipProps, 
  ChartLegendProps 
} from '../../types/charts';

// Maintain backward compatibility with existing interfaces
interface LegacyAreaChartData {
  [key: string]: unknown;
}

interface LegacyAreaConfig {
  dataKey: string;
  fill: string;
  stroke: string;
  name: string;
  stackId?: string;
  fillOpacity?: number;
}

interface LegacyCustomAreaChartProps {
  data: LegacyAreaChartData[];
  areas: LegacyAreaConfig[];
  title?: string;
  height?: number;
  xAxisKey: string;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  referenceLines?: Array<{
    y?: number;
    x?: string;
    stroke?: string;
    strokeDasharray?: string;
    label?: string;
  }>;
}

// Enhanced tooltip with proper typing
const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {entry.name}:
              </span>
            </div>
            <span className="text-sm font-medium" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString('fa-IR') : String(entry.value)}
            </span>
          </div>
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

// Main component with backward compatibility
export const CustomAreaChart: React.FC<LegacyCustomAreaChartProps> = ({
  data,
  areas,
  title,
  height = 300,
  xAxisKey,
  className = '',
  yAxisLabel,
  xAxisLabel,
  showGrid = true,
  showLegend = true,
  stacked = false,
  referenceLines = []
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
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {areas.map((area, index) => (
              <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.fill} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={area.fill} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
              stroke="currentColor"
            />
          )}
          
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
          
          {showLegend && <Legend content={<CustomLegend />} />}
          
          {referenceLines.map((line, index) => (
            <ReferenceLine
              key={index}
              y={line.y}
              x={line.x}
              stroke={line.stroke || '#8884d8'}
              strokeDasharray={line.strokeDasharray || '5 5'}
              label={line.label}
            />
          ))}
          
          {areas.map((area, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={area.dataKey}
              stackId={stacked ? (area.stackId || '1') : undefined}
              stroke={area.stroke}
              fill={`url(#gradient-${index})`}
              fillOpacity={area.fillOpacity || 0.6}
              name={area.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}; 