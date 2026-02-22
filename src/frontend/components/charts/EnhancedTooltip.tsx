'use client';

import React from 'react';
import { ChartTooltipProps } from '../../types/charts';

interface EnhancedTooltipProps extends ChartTooltipProps {
  showStatistics?: boolean;
  showComparison?: boolean;
  showPercentage?: boolean;
  data?: Record<string, unknown>[];
  formatValue?: (value: number | string) => string;
  additionalInfo?: (payload: unknown) => React.ReactNode;
}

/**
 * Enhanced Tooltip Component
 * Provides detailed information including statistics, comparisons, and formatted values
 */
export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  active,
  payload,
  label,
  showStatistics = false,
  showComparison = false,
  showPercentage = false,
  data = [],
  formatValue,
  additionalInfo
}) => {
  const mainPayload = payload?.[0];
  const value = mainPayload?.value as number;
  const name = mainPayload?.name || mainPayload?.dataKey;
  const color = mainPayload?.color || '#8884d8';

  // Calculate statistics if data is provided (hooks must be called unconditionally)
  const statistics = React.useMemo(() => {
    if (!showStatistics || !data || data.length === 0 || !mainPayload?.dataKey) return null;

    const values = data
      .map(item => {
        const val = item[mainPayload.dataKey as string];
        return typeof val === 'number' ? val : 0;
      })
      .filter(v => !isNaN(v) && isFinite(v));

    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return {
      average: avg,
      median,
      min,
      max,
      count: values.length,
      sum
    };
  }, [showStatistics, data, mainPayload?.dataKey]);

  // Calculate comparison (vs average/median) - hooks must be called unconditionally
  const comparison = React.useMemo(() => {
    if (!showComparison || !statistics || value === undefined) return null;

    const vsAverage = value - statistics.average;
    const vsAveragePercent = statistics.average > 0
      ? ((vsAverage / statistics.average) * 100)
      : 0;

    const vsMedian = value - statistics.median;
    const vsMedianPercent = statistics.median > 0
      ? ((vsMedian / statistics.median) * 100)
      : 0;

    return {
      vsAverage,
      vsAveragePercent,
      vsMedian,
      vsMedianPercent
    };
  }, [showComparison, statistics, value]);

  // Format value
  const formatValueFunc = formatValue || ((val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString('fa-IR');
    }
    return String(val);
  });

  // Calculate percentage if needed - hooks must be called unconditionally
  const percentage = React.useMemo(() => {
    if (!showPercentage || !statistics || statistics.sum === 0 || value === undefined) return null;
    return (value / statistics.sum) * 100;
  }, [showPercentage, statistics, value]);

  // Early return after all hooks
  if (!active || !payload || payload.length === 0 || !mainPayload) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]">
      {/* Header */}
      <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-bold text-base mb-1">
          {label || name}
        </p>
        {mainPayload.unit && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            واحد: {mainPayload.unit}
          </p>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {name}:
            </span>
          </div>
          <span className="text-base font-bold" style={{ color }}>
            {formatValueFunc(value)}
            {mainPayload.unit && ` ${mainPayload.unit}`}
          </span>
        </div>

        {/* Percentage */}
        {percentage !== null && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {percentage.toFixed(1)}% از کل
          </div>
        )}
      </div>

      {/* All Payload Values */}
      {payload.length > 1 && (
        <div className="mb-3 space-y-1">
          {payload.slice(1).map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {entry.name}:
                </span>
              </div>
              <span className="font-medium" style={{ color: entry.color }}>
                {formatValueFunc(entry.value as number | string)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Comparison */}
      {comparison && (
        <div className="mb-3 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            مقایسه:
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">نسبت به میانگین:</span>
              <span className={`font-medium ${
                comparison.vsAveragePercent > 0 ? 'text-green-600 dark:text-green-400' :
                comparison.vsAveragePercent < 0 ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {comparison.vsAveragePercent > 0 ? '+' : ''}
                {comparison.vsAveragePercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">نسبت به میانه:</span>
              <span className={`font-medium ${
                comparison.vsMedianPercent > 0 ? 'text-green-600 dark:text-green-400' :
                comparison.vsMedianPercent < 0 ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {comparison.vsMedianPercent > 0 ? '+' : ''}
                {comparison.vsMedianPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            آمار:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-500">میانگین:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">
                {formatValueFunc(statistics.average)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">میانه:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">
                {formatValueFunc(statistics.median)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">حداقل:</span>
              <span className="font-medium text-red-600 dark:text-red-400 mr-1">
                {formatValueFunc(statistics.min)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500">حداکثر:</span>
              <span className="font-medium text-green-600 dark:text-green-400 mr-1">
                {formatValueFunc(statistics.max)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      {additionalInfo && mainPayload?.payload && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {additionalInfo(mainPayload.payload)}
        </div>
      )}
    </div>
  );
};

