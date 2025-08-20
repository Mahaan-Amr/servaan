'use client';

import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MultiMetricDataPoint {
  period: string;
  formattedPeriod: string;
  [key: string]: string | number;
}

interface MetricConfig {
  dataKey: string;
  name: string;
  type: 'line' | 'bar';
  yAxisId?: 'left' | 'right';
  color: string;
  unit?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

interface CustomMultiMetricChartProps {
  data: MultiMetricDataPoint[];
  metrics: MetricConfig[];
  title?: string;
  height?: number;
  className?: string;
  leftYAxisLabel?: string;
  rightYAxisLabel?: string;
  xAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    unit?: string;
  }>;
  label?: string;
}

interface LegendProps {
  payload?: Array<{
    value: string;
    type?: string;
    color: string;
  }>;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
        <p className="text-gray-900 dark:text-white font-medium mb-3 text-center border-b border-gray-200 dark:border-gray-600 pb-2">
          {label}
        </p>
        
        <div className="space-y-2">
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {entry.name}:
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium" style={{ color: entry.color }}>
                  {entry.value?.toLocaleString('fa-IR')}
                </span>
                {entry.unit && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                    {entry.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Calculate correlations and insights */}
        {payload.length >= 2 && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>نسبت {payload[1]?.name} به {payload[0]?.name}:</span>
                <span className="font-medium">
                  {payload[0]?.value > 0 ? 
                    ((payload[1]?.value / payload[0]?.value) * 100).toFixed(1) + '%' : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: LegendProps) => {
  const { payload } = props;
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-4">
      {payload.map((entry, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
          {entry.type === 'line' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">(خط)</span>
          )}
          {entry.type === 'bar' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">(ستون)</span>
          )}
        </div>
      ))}
    </div>
  );
};

export const CustomMultiMetricChart: React.FC<CustomMultiMetricChartProps> = ({
  data,
  metrics,
  title,
  height = 400,
  className = '',
  leftYAxisLabel,
  rightYAxisLabel,
  xAxisLabel,
  showGrid = true,
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

  // Separate metrics by Y-axis
  const rightMetrics = metrics.filter(m => m.yAxisId === 'right');
  const hasRightAxis = rightMetrics.length > 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            {leftYAxisLabel && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">{leftYAxisLabel}</span>
              </div>
            )}
            {rightYAxisLabel && hasRightAxis && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-purple-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">{rightYAxisLabel}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
              stroke="currentColor"
            />
          )}
          
          <XAxis 
            dataKey="formattedPeriod"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          />
          
          {/* Left Y-Axis */}
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={leftYAxisLabel ? { value: leftYAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          
          {/* Right Y-Axis */}
          {hasRightAxis && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
              label={rightYAxisLabel ? { value: rightYAxisLabel, angle: 90, position: 'insideRight' } : undefined}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
          
          {/* Render metrics */}
          {metrics.map((metric, index) => {
            const yAxisId = metric.yAxisId || 'left';
            
            if (metric.type === 'bar') {
              return (
                <Bar
                  key={index}
                  yAxisId={yAxisId}
                  dataKey={metric.dataKey}
                  fill={metric.color}
                  fillOpacity={metric.fillOpacity || 0.8}
                  name={metric.name}
                  unit={metric.unit}
                />
              );
            } else {
              return (
                <Line
                  key={index}
                  yAxisId={yAxisId}
                  type="monotone"
                  dataKey={metric.dataKey}
                  stroke={metric.color}
                  strokeWidth={metric.strokeWidth || 2}
                  dot={{ r: 4, fill: metric.color }}
                  activeDot={{ r: 6 }}
                  name={metric.name}
                  unit={metric.unit}
                />
              );
            }
          })}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Metrics Summary */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          خلاصه معیارها
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const values = data.map(d => {
              const value = d[metric.dataKey];
              return typeof value === 'number' ? value : 0;
            });
            const total = values.reduce((sum, val) => sum + val, 0);
            const average = values.length > 0 ? total / values.length : 0;
            const max = values.length > 0 ? Math.max(...values) : 0;
            const min = values.length > 0 ? Math.min(...values) : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {metric.name}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>میانگین:</span>
                    <span className="font-medium">
                      {average.toLocaleString('fa-IR')} {metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>حداکثر:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {max.toLocaleString('fa-IR')} {metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>حداقل:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {min.toLocaleString('fa-IR')} {metric.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 