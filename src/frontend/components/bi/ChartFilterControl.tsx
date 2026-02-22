'use client';

import React from 'react';
import { useChartFilters } from '../../contexts/ChartFilterContext';

/**
 * Chart Filter Control Component
 * Displays active filters and allows clearing them
 */
export const ChartFilterControl: React.FC = () => {
  const { filters, clearFilters, removeFilter, activeFiltersCount } = useChartFilters();

  if (activeFiltersCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            فیلترهای فعال ({activeFiltersCount})
          </h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
        >
          پاک کردن همه
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(filters).map(([field, filter]) => {
          if (!filter.values || filter.values.length === 0) return null;
          
          return (
            <div
              key={field}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg"
            >
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {field}:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {filter.values.slice(0, 3).map((value, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                  >
                    {String(value)}
                  </span>
                ))}
                {filter.values.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{filter.values.length - 3} مورد دیگر
                  </span>
                )}
              </div>
              <button
                onClick={() => removeFilter(field)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 ml-1"
                title="حذف فیلتر"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

