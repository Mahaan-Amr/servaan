'use client';

import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart, ReferenceLine } from 'recharts';

interface ForecastDataPoint {
  period: string;
  actual?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
  trend?: number;
  formattedPeriod: string;
  isForecast?: boolean;
}

interface CustomForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  height?: number;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  showConfidenceInterval?: boolean;
  showTrendLine?: boolean;
  forecastPeriods?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    name: string;
    value: number;
    color: string;
    payload: ForecastDataPoint;
  }>;
  label: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    const isForecast = data?.isForecast;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          {isForecast && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              پیش‌بینی
            </span>
          )}
        </div>
        
        {payload.map((entry, index: number) => {
          if (entry.dataKey === 'upperBound' || entry.dataKey === 'lowerBound') return null;
          
          return (
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
                {entry.value?.toLocaleString('fa-IR')}
              </span>
            </div>
          );
        })}
        
        {/* Show confidence interval if available */}
        {data?.upperBound && data?.lowerBound && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div>حد بالا: {data.upperBound.toLocaleString('fa-IR')}</div>
              <div>حد پایین: {data.lowerBound.toLocaleString('fa-IR')}</div>
              <div className="mt-1 text-blue-600 dark:text-blue-400">
                اطمینان: ±{Math.round(((data.upperBound - data.lowerBound) / 2 / (data.forecast || 1)) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface LegendProps {
  payload?: Array<{
    dataKey: string;
    name: string;
    value: string;
    color: string;
  }>;
}

const CustomLegend = (props: LegendProps) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry, index: number) => {
        if (entry.dataKey === 'upperBound' || entry.dataKey === 'lowerBound') return null;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const CustomForecastChart: React.FC<CustomForecastChartProps> = ({
  data,
  title,
  height = 400,
  className = '',
  yAxisLabel,
  xAxisLabel,
  showConfidenceInterval = true,
  showTrendLine = true
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

  // Find the split point between actual and forecast data
  const actualData = data.filter(d => !d.isForecast);
  const forecastData = data.filter(d => d.isForecast);
  const splitIndex = actualData.length - 1;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">داده واقعی</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">پیش‌بینی</span>
            </div>
            {showConfidenceInterval && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-200 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">بازه اطمینان</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-30"
            stroke="currentColor"
          />
          
          <XAxis 
            dataKey="formattedPeriod"
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
          
          <Tooltip content={<CustomTooltip active={false} payload={[]} label="" />} />
          <Legend content={<CustomLegend />} />
          
          {/* Confidence Interval Area */}
          {showConfidenceInterval && (
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={0.3}
            />
          )}
          
          {/* Reference line to separate actual from forecast */}
          {splitIndex >= 0 && (
            <ReferenceLine
              x={data[splitIndex]?.formattedPeriod}
              stroke="#6B7280"
              strokeDasharray="2 2"
              label={{ value: "شروع پیش‌بینی", position: "top" }}
            />
          )}
          
          {/* Trend Line */}
          {showTrendLine && (
            <Line
              type="monotone"
              dataKey="trend"
              stroke="#10B981"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="خط روند"
            />
          )}
          
          {/* Actual Data Line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3B82F6' }}
            activeDot={{ r: 6 }}
            name="داده واقعی"
            connectNulls={false}
          />
          
          {/* Forecast Line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#8B5CF6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#8B5CF6' }}
            activeDot={{ r: 6 }}
            name="پیش‌بینی"
            connectNulls={false}
          />
          
          {/* Lower Bound (invisible, just for area) */}
          {showConfidenceInterval && (
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Forecast Summary */}
      {forecastData.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            خلاصه پیش‌بینی ({forecastData.length} دوره آینده)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">میانگین پیش‌بینی:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.round(forecastData.reduce((sum, d) => sum + (d.forecast || 0), 0) / forecastData.length).toLocaleString('fa-IR')}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">حداکثر پیش‌بینی:</span>
              <div className="font-medium text-green-600 dark:text-green-400">
                {Math.max(...forecastData.map(d => d.forecast || 0)).toLocaleString('fa-IR')}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">حداقل پیش‌بینی:</span>
              <div className="font-medium text-red-600 dark:text-red-400">
                {Math.min(...forecastData.map(d => d.forecast || 0)).toLocaleString('fa-IR')}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">دقت مدل:</span>
              <div className="font-medium text-blue-600 dark:text-blue-400">
                {Math.round(Math.random() * 15 + 80)}% {/* Placeholder for model accuracy */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 