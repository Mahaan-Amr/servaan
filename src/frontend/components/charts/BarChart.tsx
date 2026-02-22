'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { 
  ChartTooltipProps, 
  ChartLegendProps 
} from '../../types/charts';
import { exportChartToPNG, exportChartToSVG } from '../../utils/chartExport';
import { useChartFilters } from '../../contexts/ChartFilterContext';
import { EnhancedTooltip } from './EnhancedTooltip';

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
  enableExport?: boolean;
  chartId?: string;
  enableCrossFilter?: boolean;
  enableEnhancedTooltip?: boolean;
  filterField?: string;
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

export const CustomBarChart: React.FC<LegacyCustomBarChartProps> = React.memo(({
  data,
  bars,
  title,
  height = 300,
  xAxisKey,
  className = '',
  yAxisLabel,
  xAxisLabel,
  enableExport = false,
  chartId,
  enableCrossFilter = false,
  enableEnhancedTooltip = false,
  filterField
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useMemo(() => chartId || `bar-chart-${Math.random().toString(36).substr(2, 9)}`, [chartId]);
  const { getFilteredData, setFilter, filters } = useChartFilters();

  // Apply cross-chart filtering if enabled
  const filteredData = useMemo(() => {
    if (enableCrossFilter) {
      return getFilteredData(data);
    }
    return data;
  }, [data, enableCrossFilter, getFilteredData]);

  // Handle bar click for filtering
  const handleBarClick = useCallback((data: LegacyBarChartData) => {
    if (enableCrossFilter && filterField) {
      const value = data[filterField] ?? data[xAxisKey];
      if (value !== undefined && value !== null) {
        // Toggle filter: if already filtered, remove; otherwise, set
        const currentFilter = filters[filterField];
        if (currentFilter && currentFilter.values?.includes(value as string | number)) {
          // Remove from filter
          const newValues = currentFilter.values.filter(v => v !== value);
          if (newValues.length === 0) {
            // Remove filter entirely if no values left
            setFilter(filterField, { values: [] });
          } else {
            setFilter(filterField, { ...currentFilter, values: newValues });
          }
        } else {
          // Add to filter
          const existingValues = currentFilter?.values || [];
          setFilter(filterField, {
            operator: 'in',
            values: [...existingValues, value as string | number]
          });
        }
      }
    }
  }, [enableCrossFilter, filterField, xAxisKey, filters, setFilter]);

  const handleExportPNG = useCallback(async () => {
    try {
      await exportChartToPNG(uniqueId, `${title || 'chart'}-${Date.now()}.png`);
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      alert('خطا در صادرات نمودار به PNG');
    }
  }, [uniqueId, title]);

  const handleExportSVG = useCallback(() => {
    try {
      exportChartToSVG(uniqueId, `${title || 'chart'}-${Date.now()}.svg`);
    } catch (error) {
      console.error('Error exporting to SVG:', error);
      alert('خطا در صادرات نمودار به SVG');
    }
  }, [uniqueId, title]);

  if (filteredData.length === 0) {
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
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        {enableExport && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
              title="صادرات به PNG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PNG
            </button>
            <button
              onClick={handleExportSVG}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
              title="صادرات به SVG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              SVG
            </button>
          </div>
        )}
      </div>
      
      <div id={uniqueId} ref={containerRef}>
        <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={filteredData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={(chartData) => {
            if (enableCrossFilter && chartData && chartData.activePayload && chartData.activePayload[0]) {
              const clickedData = chartData.activePayload[0].payload as LegacyBarChartData;
              handleBarClick(clickedData);
            }
          }}
        >
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
          <Tooltip 
            content={enableEnhancedTooltip ? (
              <EnhancedTooltip 
                showStatistics={true}
                showComparison={true}
                showPercentage={true}
                data={filteredData}
              />
            ) : (
              <CustomTooltip />
            )}
            cursor={{ stroke: '#8884d8', strokeWidth: 1 }}
          />
          <Legend content={<CustomLegend />} />
          
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              radius={[2, 2, 0, 0]}
              cursor={enableCrossFilter ? 'pointer' : 'default'}
            >
              {filteredData.map((entry, cellIndex) => {
                const isFiltered = enableCrossFilter && filterField && filters[filterField]?.values?.includes(
                  (entry[filterField] ?? entry[xAxisKey]) as string | number
                );
                return (
                  <Cell 
                    key={`cell-${cellIndex}`} 
                    fill={typeof entry.fill === 'string' ? entry.fill : bar.fill}
                    opacity={isFiltered ? 0.5 : 1}
                  />
                );
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      </div>
      
      {/* Filter Indicator */}
      {enableCrossFilter && filters[filterField || ''] && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          فیلتر فعال: {filters[filterField || '']?.values?.length || 0} مورد
        </div>
      )}
    </div>
  );
});

CustomBarChart.displayName = 'CustomBarChart'; 