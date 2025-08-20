import { TableStatus } from '../types/ordering';

// Type definitions for performance service
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface TableData {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  floor: number;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
  } | null;
  nextReservation?: {
    id: string;
    customerName: string;
    reservationDate: string;
    guestCount: number;
  } | null;
  isOccupied?: boolean;
  occupancyDuration?: number | null;
}

interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Performance optimization service for table management
class TablePerformanceService {
  private cache = new Map<string, CacheEntry>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private realTimeListeners = new Set<(event: string, data: unknown) => void>();

  // Cache configuration
  private readonly CACHE_TTL = {
    TABLE_LIST: 5 * 60 * 1000, // 5 minutes
    TABLE_DETAILS: 2 * 60 * 1000, // 2 minutes
    RESERVATIONS: 1 * 60 * 1000, // 1 minute
    ANALYTICS: 10 * 60 * 1000, // 10 minutes
  };

  /**
   * Cache table data with TTL
   */
  cacheTableData<T>(key: string, data: T, ttl: number = this.CACHE_TTL.TABLE_LIST) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached table data
   */
  getCachedTableData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern: string) {
    const keysToDelete: string[] = [];
    
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    key: string,
    func: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Optimize table list rendering with virtual scrolling
   */
  optimizeTableList(tables: TableData[], pageSize: number = 20) {
    return {
      items: tables,
      totalCount: tables.length,
      pageSize,
      getVisibleItems: (startIndex: number, endIndex: number) => {
        return tables.slice(startIndex, endIndex);
      }
    };
  }

  /**
   * Batch API calls for better performance
   */
  async batchApiCalls<T>(
    calls: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(call => call()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Optimize table status updates
   */
  optimizeStatusUpdate(
    tableId: string,
    newStatus: TableStatus,
    updateFunction: (tableId: string, status: TableStatus) => Promise<void>
  ) {
    // Debounce status updates to prevent rapid API calls
    const debouncedUpdate = this.debounce(
      `status-update-${tableId}`,
      updateFunction,
      500
    );

    return debouncedUpdate(tableId, newStatus);
  }

  /**
   * Add real-time listener
   */
  addRealTimeListener(listener: (event: string, data: unknown) => void) {
    this.realTimeListeners.add(listener);
  }

  /**
   * Remove real-time listener
   */
  removeRealTimeListener(listener: (event: string, data: unknown) => void) {
    this.realTimeListeners.delete(listener);
  }

  /**
   * Broadcast real-time event to all listeners
   */
  broadcastRealTimeEvent(event: string, data: unknown) {
    this.realTimeListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in real-time listener:', error);
      }
    });
  }

  /**
   * Optimize search with debouncing
   */
  createDebouncedSearch(
    searchFunction: (query: string) => void,
    delay: number = 300
  ) {
    return this.debounce('table-search', searchFunction, delay);
  }

  /**
   * Optimize filter changes
   */
  createDebouncedFilter(
    filterFunction: (filters: Record<string, unknown>) => void,
    delay: number = 200
  ) {
    return this.debounce('table-filter', filterFunction, delay);
  }

  /**
   * Preload table data for better UX
   */
  preloadTableData(tableIds: string[], loadFunction: (id: string) => Promise<TableData>) {
    // Load data in background without blocking UI
    setTimeout(() => {
      tableIds.forEach(id => {
        loadFunction(id).catch(error => {
          console.error(`Failed to preload table ${id}:`, error);
        });
      });
    }, 100);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      cacheSize: this.cache.size,
      activeDebounceTimers: this.debounceTimers.size,
      realTimeListeners: this.realTimeListeners.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): MemoryUsage | null {
    if ('memory' in performance) {
      const memory = (performance as { memory: MemoryUsage }).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear cache
    this.cache.clear();

    // Clear listeners
    this.realTimeListeners.clear();
  }
}

export const tablePerformanceService = new TablePerformanceService(); 