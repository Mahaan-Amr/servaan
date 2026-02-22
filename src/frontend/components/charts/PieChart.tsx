'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  ChartTooltipProps, 
  ChartLegendProps 
} from '../../types/charts';
import { exportChartToPNG, exportChartToSVG } from '../../utils/chartExport';
import { useChartFilters } from '../../contexts/ChartFilterContext';
import { EnhancedTooltip } from './EnhancedTooltip';

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
  enableExport?: boolean;
  chartId?: string;
  enableCrossFilter?: boolean;
  enableEnhancedTooltip?: boolean;
  filterField?: string;
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

export const CustomPieChart: React.FC<LegacyCustomPieChartProps> = React.memo(({
  data,
  title,
  height = 300,
  className = '',
  showLegend = true,
  enableExport = false,
  chartId,
  enableCrossFilter = false,
  enableEnhancedTooltip = false,
  filterField = 'name'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useMemo(() => chartId || `pie-chart-${Math.random().toString(36).substr(2, 9)}`, [chartId]);
  const { getFilteredData, setFilter, filters } = useChartFilters();

  // Apply cross-chart filtering if enabled
  const filteredData = useMemo(() => {
    if (enableCrossFilter) {
      return getFilteredData(data as unknown as Record<string, unknown>[]) as unknown as LegacyPieChartData[];
    }
    return data;
  }, [data, enableCrossFilter, getFilteredData]);

  // Handle slice click for filtering
  const handleSliceClick = useCallback((data: LegacyPieChartData) => {
    if (enableCrossFilter && filterField) {
      const dataRecord = data as unknown as Record<string, unknown>;
      const value = dataRecord[filterField] ?? data.name;
      if (value !== undefined && value !== null) {
        // Toggle filter
        const currentFilter = filters[filterField];
        if (currentFilter && currentFilter.values?.includes(value as string | number)) {
          const newValues = currentFilter.values.filter(v => v !== value);
          if (newValues.length === 0) {
            setFilter(filterField, { values: [] });
          } else {
            setFilter(filterField, { ...currentFilter, values: newValues });
          }
        } else {
          const existingValues = currentFilter?.values || [];
          setFilter(filterField, {
            operator: 'in',
            values: [...existingValues, value as string | number]
          });
        }
      }
    }
  }, [enableCrossFilter, filterField, filters, setFilter]);

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

  const COLORS = useMemo(() => ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'], []);

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
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => handleSliceClick(data as LegacyPieChartData)}
            cursor={enableCrossFilter ? 'pointer' : 'default'}
          >
            {filteredData.map((entry, index) => {
              const entryRecord = entry as unknown as Record<string, unknown>;
              const isFiltered = enableCrossFilter && filters[filterField]?.values?.includes(
                (entryRecord[filterField] ?? entry.name) as string | number
              );
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill || COLORS[index % COLORS.length]}
                  opacity={isFiltered ? 0.5 : 1}
                />
              );
            })}
          </Pie>
          <Tooltip 
            content={enableEnhancedTooltip ? (
              <EnhancedTooltip 
                showStatistics={true}
                showComparison={true}
                showPercentage={true}
                data={filteredData as unknown as Record<string, unknown>[]}
              />
            ) : (
              <CustomTooltip />
            )}
          />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>
      </div>
      
      {/* Filter Indicator */}
      {enableCrossFilter && filters[filterField] && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          فیلتر فعال: {filters[filterField]?.values?.length || 0} مورد
        </div>
      )}
    </div>
  );
});

CustomPieChart.displayName = 'CustomPieChart'; 