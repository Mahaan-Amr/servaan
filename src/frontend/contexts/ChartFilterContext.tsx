'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { FilterState } from '../utils/chartInteractivity';

interface ChartFilterContextType {
  filters: FilterState;
  setFilter: (field: string, filter: FilterState[string]) => void;
  removeFilter: (field: string) => void;
  clearFilters: () => void;
  getFilteredData: <T extends Record<string, unknown>>(data: T[]) => T[];
  activeFiltersCount: number;
}

const ChartFilterContext = createContext<ChartFilterContextType | undefined>(undefined);

interface ChartFilterProviderProps {
  children: ReactNode;
}

/**
 * Chart Filter Context Provider
 * Enables cross-chart filtering - when one chart applies a filter, all charts update
 */
export function ChartFilterProvider({ children }: ChartFilterProviderProps) {
  const [filters, setFilters] = useState<FilterState>({});

  const setFilter = useCallback((field: string, filter: FilterState[string]) => {
    setFilters(prev => ({
      ...prev,
      [field]: filter
    }));
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getFilteredData = useCallback(<T extends Record<string, unknown>>(data: T[]): T[] => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(item => {
      return Object.entries(filters).every(([key, filter]) => {
        const value = item[key];
        
        if (filter.operator === 'equals') {
          return value === filter.values?.[0];
        }
        
        if (filter.operator === 'notEquals') {
          return value !== filter.values?.[0];
        }
        
        if (filter.operator === 'greaterThan' && typeof value === 'number') {
          return value > (filter.min ?? 0);
        }
        
        if (filter.operator === 'lessThan' && typeof value === 'number') {
          return value < (filter.max ?? Infinity);
        }
        
        if (filter.operator === 'contains' && typeof value === 'string') {
          return value.includes(String(filter.values?.[0] || ''));
        }
        
        if (filter.operator === 'in' && filter.values) {
          return filter.values.includes(value as string | number);
        }
        
        if (filter.operator === 'between' && typeof value === 'number') {
          return value >= (filter.min ?? 0) && value <= (filter.max ?? Infinity);
        }
        
        // Range filter
        if (filter.min !== undefined || filter.max !== undefined) {
          if (typeof value === 'number') {
            const min = filter.min ?? -Infinity;
            const max = filter.max ?? Infinity;
            return value >= min && value <= max;
          }
        }
        
        // Value list filter
        if (filter.values && filter.values.length > 0) {
          return filter.values.includes(value as string | number);
        }
        
        return true;
      });
    });
  }, [filters]);

  const activeFiltersCount = useMemo(() => Object.keys(filters).length, [filters]);

  const value = useMemo(() => ({
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    getFilteredData,
    activeFiltersCount
  }), [filters, setFilter, removeFilter, clearFilters, getFilteredData, activeFiltersCount]);

  return (
    <ChartFilterContext.Provider value={value}>
      {children}
    </ChartFilterContext.Provider>
  );
}

/**
 * Hook to use chart filter context
 */
export function useChartFilters(): ChartFilterContextType {
  const context = useContext(ChartFilterContext);
  if (context === undefined) {
    throw new Error('useChartFilters must be used within a ChartFilterProvider');
  }
  return context;
}

