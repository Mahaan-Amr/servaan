/**
 * Chart Interactivity Utilities
 * Provides functions for zoom, pan, filter, and keyboard shortcuts
 */

export interface ZoomState {
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  isZoomed: boolean;
}

export interface FilterState {
  [key: string]: {
    min?: number;
    max?: number;
    values?: (string | number)[];
    operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
  };
}

/**
 * Keyboard shortcuts handler for charts
 */
export class ChartKeyboardShortcuts {
  private handlers: Map<string, () => void> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  register(shortcut: string, handler: () => void) {
    this.handlers.set(shortcut.toLowerCase(), handler);
  }

  unregister(shortcut: string) {
    this.handlers.delete(shortcut.toLowerCase());
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Check for modifier keys
    const modifiers: string[] = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');

    const key = event.key.toLowerCase();
    const shortcut = modifiers.length > 0 
      ? `${modifiers.join('+')}+${key}`
      : key;

    const handler = this.handlers.get(shortcut);
    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }
}

/**
 * Apply filters to data
 */
export function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  filters: FilterState
): T[] {
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
}

/**
 * Reset zoom state
 */
export function resetZoom(): ZoomState {
  return {
    isZoomed: false
  };
}

/**
 * Calculate zoom bounds from selection
 */
export function calculateZoomBounds(
  startIndex: number,
  endIndex: number,
  dataLength: number
): { start: number; end: number } {
  return {
    start: Math.max(0, Math.min(startIndex, endIndex)),
    end: Math.min(dataLength - 1, Math.max(startIndex, endIndex))
  };
}

