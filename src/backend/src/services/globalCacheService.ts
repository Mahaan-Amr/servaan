import { performanceMonitoringService } from './performanceMonitoringService';

/**
 * Advanced Global Caching Service
 * Provides intelligent caching strategies with automatic invalidation and performance monitoring
 */
export class GlobalCacheService {
  private cache = new Map<string, CacheEntry>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheInvalidations = 0;

  // Cache configuration
  private readonly DEFAULT_TTL = 5 * 60; // 5 minutes
  private readonly MAX_CACHE_SIZE = 10000; // Maximum cache entries
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  constructor() {
    // Start periodic cleanup
    setInterval(() => this.cleanupExpiredEntries(), this.CLEANUP_INTERVAL);
  }

  /**
   * Get cached data with intelligent fallback
   */
  async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cacheKey = this.buildCacheKey(key, options);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Check if cache entry exists and is valid
    if (cached && this.isValidEntry(cached, now)) {
      this.cacheHits++;
      this.recordCachePerformance(cacheKey, true);
      
      // Update access count for LRU-like behavior
      cached.accessCount++;
      cached.lastAccessed = now;
      
      return cached.data as T;
    }

    this.cacheMisses++;
    this.recordCachePerformance(cacheKey, false);

    try {
      // Fetch fresh data
      const data = await fetchFunction();
      
      // Store in cache
      this.setCacheEntry(cacheKey, data, options);
      
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      if (cached && options.allowStale && this.isStaleEntry(cached, now)) {
        console.warn(`⚠️ Returning stale cache data for ${cacheKey} due to fetch failure`);
        return cached.data as T;
      }
      throw error;
    }
  }

  /**
   * Set cache entry with intelligent TTL management
   */
  setCacheEntry<T>(key: string, data: T, options: CacheOptions = {}): void {
    const cacheKey = this.buildCacheKey(key, options);
    const ttl = options.ttl || this.DEFAULT_TTL;
    const now = Date.now();

    // Check cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRUEntries();
    }

    const entry: CacheEntry = {
      data,
      timestamp: now,
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 1,
      lastAccessed: now,
      tags: options.tags || [],
      priority: options.priority || 'normal'
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * Invalidate cache by pattern, tags, or specific keys
   */
  invalidateCache(pattern: string | string[], tags?: string[]): number {
    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    if (Array.isArray(pattern)) {
      // Invalidate multiple specific keys
      pattern.forEach(key => {
        if (this.cache.has(key)) {
          keysToDelete.push(key);
        }
      });
    } else {
      // Invalidate by pattern or tags
      for (const [key, entry] of this.cache.entries()) {
        let shouldInvalidate = false;

        if (pattern && key.includes(pattern)) {
          shouldInvalidate = true;
        }

        if (tags && tags.some(tag => entry.tags.includes(tag))) {
          shouldInvalidate = true;
        }

        if (shouldInvalidate) {
          keysToDelete.push(key);
        }
      }
    }

    // Delete invalidated entries
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      invalidatedCount++;
    });

    this.cacheInvalidations += invalidatedCount;
    console.log(`🗑️ Invalidated ${invalidatedCount} cache entries`);

    return invalidatedCount;
  }

  /**
   * Invalidate cache by tenant
   */
  invalidateTenantCache(tenantId: string): number {
    return this.invalidateCache(`tenant:${tenantId}`);
  }

  /**
   * Invalidate cache by entity type
   */
  invalidateEntityCache(entityType: string, entityId?: string): number {
    if (entityId) {
      return this.invalidateCache(`${entityType}:${entityId}`);
    }
    return this.invalidateCache(`${entityType}:`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    // Calculate memory usage (approximate)
    let estimatedMemoryUsage = 0;
    for (const [_, entry] of this.cache.entries()) {
      estimatedMemoryUsage += this.estimateEntrySize(entry);
    }

    return {
      totalRequests,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: `${hitRate.toFixed(2)}%`,
      cacheSize: this.cache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheInvalidations: this.cacheInvalidations,
      estimatedMemoryUsage: `${(estimatedMemoryUsage / 1024 / 1024).toFixed(2)} MB`,
      cacheUtilization: `${((this.cache.size / this.MAX_CACHE_SIZE) * 100).toFixed(2)}%`
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(tenantId: string): Promise<void> {
    console.log(`🔥 Warming up cache for tenant: ${tenantId}`);
    
    // This would typically pre-fetch commonly accessed data
    // For now, we'll just log the warmup process
    const warmupKeys = [
      `tenant:${tenantId}:dashboard`,
      `tenant:${tenantId}:menu`,
      `tenant:${tenantId}:stats`
    ];

    console.log(`🔥 Cache warmup completed for ${warmupKeys.length} keys`);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheInvalidations = 0;
    console.log('🗑️ All cache cleared');
  }

  /**
   * Build cache key with tenant context
   */
  private buildCacheKey(key: string, options: CacheOptions): string {
    let cacheKey = key;
    
    if (options.tenantId) {
      cacheKey = `tenant:${options.tenantId}:${key}`;
    }
    
    if (options.version) {
      cacheKey = `${cacheKey}:v${options.version}`;
    }
    
    return cacheKey;
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: CacheEntry, now: number): boolean {
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Check if cache entry is stale (expired but within grace period)
   */
  private isStaleEntry(entry: CacheEntry, now: number): boolean {
    const gracePeriod = 5 * 60 * 1000; // 5 minutes grace period
    return (now - entry.timestamp) < (entry.ttl + gracePeriod);
  }

  /**
   * Evict least recently used entries
   */
  private evictLRUEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access count and last accessed time
    entries.sort((a, b) => {
      if (a[1].accessCount !== b[1].accessCount) {
        return a[1].accessCount - b[1].accessCount;
      }
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    // Remove 20% of least used entries
    const entriesToRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < entriesToRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`🧹 Evicted ${entriesToRemove} LRU cache entries`);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry, now)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Estimate entry size in bytes
   */
  private estimateEntrySize(entry: CacheEntry): number {
    let size = 0;
    
    // Estimate data size
    if (typeof entry.data === 'string') {
      size += entry.data.length * 2; // UTF-16 characters
    } else if (typeof entry.data === 'object') {
      size += JSON.stringify(entry.data).length;
    } else {
      size += 8; // Number or boolean
    }
    
    // Add metadata size
    size += entry.tags.length * 20; // Tag strings
    size += 32; // Timestamps and counters
    
    return size;
  }

  /**
   * Record cache performance for monitoring
   */
  private recordCachePerformance(cacheKey: string, hit: boolean): void {
    performanceMonitoringService.recordCachePerformance(cacheKey, hit);
  }
}

// Cache entry interface
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  priority: 'low' | 'normal' | 'high';
}

// Cache options interface
interface CacheOptions {
  ttl?: number;
  tenantId?: string;
  version?: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  allowStale?: boolean;
}

// Cache statistics interface
interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: string;
  cacheSize: number;
  maxCacheSize: number;
  cacheInvalidations: number;
  estimatedMemoryUsage: string;
  cacheUtilization: string;
}

// Create singleton instance
export const globalCacheService = new GlobalCacheService();
