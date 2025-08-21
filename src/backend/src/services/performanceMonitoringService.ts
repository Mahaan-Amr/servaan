import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../shared/generated/client';

const prisma = new PrismaClient();

/**
 * Performance Monitoring Service
 * Tracks API performance, database queries, cache performance, and system resources
 */
export class PerformanceMonitoringService {
  private metrics = {
    apiCalls: new Map<string, { count: number; totalTime: number; avgTime: number; minTime: number; maxTime: number }>(),
    databaseQueries: new Map<string, { count: number; totalTime: number; avgTime: number; slowQueries: number }>(),
    cachePerformance: new Map<string, { hits: number; misses: number; hitRate: number }>(),
    systemResources: {
      memoryUsage: [] as number[],
      cpuUsage: [] as number[],
      activeConnections: [] as number[],
      timestamp: [] as number[]
    },
    errors: new Map<string, { count: number; lastOccurrence: Date; errorTypes: Set<string> }>(),
    tenantPerformance: new Map<string, { apiCalls: number; avgResponseTime: number; errorRate: number }>()
  };

  private slowQueryThreshold = 1000; // 1 second
  private maxMetricsHistory = 1000; // Keep last 1000 data points

  /**
   * Start API performance monitoring
   */
  startApiMonitoring(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const tenantId = (req as any).tenant?.id || 'unknown';

    // Store the original methods to avoid conflicts
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Override res.send to capture response time
    res.send = function(this: Response, body?: any) {
      const responseTime = Date.now() - startTime;
      performanceMonitoringService.recordApiMetric(endpoint, responseTime, tenantId);
      return originalSend.call(this, body);
    };

    // Override res.json to capture response time
    res.json = function(this: Response, body?: any) {
      const responseTime = Date.now() - startTime;
      performanceMonitoringService.recordApiMetric(endpoint, responseTime, tenantId);
      return originalJson.call(this, body);
    };

    // Override res.end to capture response time (fallback)
    res.end = function(this: Response, chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      performanceMonitoringService.recordApiMetric(endpoint, responseTime, tenantId);
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  /**
   * Record API performance metric
   */
  private recordApiMetric(endpoint: string, responseTime: number, tenantId: string) {
    const existing = this.metrics.apiCalls.get(endpoint) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: responseTime,
      maxTime: responseTime
    };

    existing.count++;
    existing.totalTime += responseTime;
    existing.avgTime = existing.totalTime / existing.count;
    existing.minTime = Math.min(existing.minTime, responseTime);
    existing.maxTime = Math.max(existing.maxTime, responseTime);

    this.metrics.apiCalls.set(endpoint, existing);

    // Record tenant-specific performance
    this.recordTenantPerformance(tenantId, responseTime);
  }

  /**
   * Record tenant-specific performance metrics
   */
  private recordTenantPerformance(tenantId: string, responseTime: number) {
    const existing = this.metrics.tenantPerformance.get(tenantId) || {
      apiCalls: 0,
      avgResponseTime: 0,
      errorRate: 0
    };

    existing.apiCalls++;
    existing.avgResponseTime = (existing.avgResponseTime * (existing.apiCalls - 1) + responseTime) / existing.apiCalls;

    this.metrics.tenantPerformance.set(tenantId, existing);
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(query: string, executionTime: number) {
    const queryHash = this.hashQuery(query);
    const existing = this.metrics.databaseQueries.get(queryHash) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowQueries: 0
    };

    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;

    if (executionTime > this.slowQueryThreshold) {
      existing.slowQueries++;
      console.warn(`🐌 Slow query detected (${executionTime}ms):`, query.substring(0, 200) + '...');
    }

    this.metrics.databaseQueries.set(queryHash, existing);
  }

  /**
   * Record cache performance
   */
  recordCachePerformance(cacheKey: string, hit: boolean) {
    const existing = this.metrics.cachePerformance.get(cacheKey) || {
      hits: 0,
      misses: 0,
      hitRate: 0
    };

    if (hit) {
      existing.hits++;
    } else {
      existing.misses++;
    }

    existing.hitRate = (existing.hits / (existing.hits + existing.misses)) * 100;
    this.metrics.cachePerformance.set(cacheKey, existing);
  }

  /**
   * Record system resource usage
   */
  recordSystemResources() {
    const memUsage = process.memoryUsage();
    const timestamp = Date.now();

    this.metrics.systemResources.memoryUsage.push(memUsage.heapUsed / 1024 / 1024); // MB
    this.metrics.systemResources.timestamp.push(timestamp);

    // Keep only recent data points
    if (this.metrics.systemResources.memoryUsage.length > this.maxMetricsHistory) {
      this.metrics.systemResources.memoryUsage.shift();
      this.metrics.systemResources.timestamp.shift();
    }

    // Record active database connections (approximate)
    this.recordDatabaseConnections();
  }

  /**
   * Record database connection count
   */
  private async recordDatabaseConnections() {
    try {
      // This is an approximation - Prisma doesn't expose connection count directly
      const result = await prisma.$queryRaw`SELECT count(*) as connection_count FROM pg_stat_activity WHERE state = 'active'`;
      const connectionCount = (result as any)[0]?.connection_count || 0;
      
      this.metrics.systemResources.activeConnections.push(connectionCount);
      
      if (this.metrics.systemResources.activeConnections.length > this.maxMetricsHistory) {
        this.metrics.systemResources.activeConnections.shift();
      }
    } catch (error) {
      // Ignore connection monitoring errors
    }
  }

  /**
   * Record error occurrence
   */
  recordError(endpoint: string, error: Error, tenantId?: string) {
    const existing = this.metrics.errors.get(endpoint) || {
      count: 0,
      lastOccurrence: new Date(),
      errorTypes: new Set<string>()
    };

    existing.count++;
    existing.lastOccurrence = new Date();
    existing.errorTypes.add(error.constructor.name);

    this.metrics.errors.set(endpoint, existing);

    // Update tenant error rate
    if (tenantId) {
      const tenantMetrics = this.metrics.tenantPerformance.get(tenantId);
      if (tenantMetrics) {
        tenantMetrics.errorRate = (existing.count / tenantMetrics.apiCalls) * 100;
      }
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const apiSummary = Array.from(this.metrics.apiCalls.entries()).map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
      avgTimeFormatted: `${metrics.avgTime.toFixed(2)}ms`
    }));

    const slowQueries = Array.from(this.metrics.databaseQueries.entries())
      .filter(([_, metrics]) => metrics.slowQueries > 0)
      .map(([queryHash, metrics]) => ({
        queryHash,
        ...metrics,
        avgTimeFormatted: `${metrics.avgTime.toFixed(2)}ms`
      }));

    const cacheSummary = Array.from(this.metrics.cachePerformance.entries()).map(([cacheKey, metrics]) => ({
      cacheKey,
      ...metrics,
      hitRateFormatted: `${metrics.hitRate.toFixed(2)}%`
    }));

    const tenantSummary = Array.from(this.metrics.tenantPerformance.entries()).map(([tenantId, metrics]) => ({
      tenantId,
      ...metrics,
      avgResponseTimeFormatted: `${metrics.avgResponseTime.toFixed(2)}ms`,
      errorRateFormatted: `${metrics.errorRate.toFixed(2)}%`
    }));

    const errorSummary = Array.from(this.metrics.errors.entries()).map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
      errorTypes: Array.from(metrics.errorTypes)
    }));

    return {
      timestamp: new Date().toISOString(),
      apiPerformance: {
        totalEndpoints: apiSummary.length,
        endpoints: apiSummary.sort((a, b) => b.count - a.count).slice(0, 10)
      },
      databasePerformance: {
        totalQueries: Array.from(this.metrics.databaseQueries.values()).reduce((sum, m) => sum + m.count, 0),
        slowQueries: slowQueries.length,
        slowQueryDetails: slowQueries.slice(0, 5)
      },
      cachePerformance: {
        totalCaches: cacheSummary.length,
        caches: cacheSummary.sort((a, b) => b.hitRate - a.hitRate).slice(0, 10)
      },
      tenantPerformance: {
        totalTenants: tenantSummary.length,
        tenants: tenantSummary.sort((a, b) => b.apiCalls - a.apiCalls).slice(0, 10)
      },
      errorSummary: {
        totalErrors: Array.from(this.metrics.errors.values()).reduce((sum, e) => sum + e.count, 0),
        errorEndpoints: errorSummary.sort((a, b) => b.count - a.count).slice(0, 10)
      },
      systemResources: {
        currentMemoryUsage: this.metrics.systemResources.memoryUsage[this.metrics.systemResources.memoryUsage.length - 1] || 0,
        memoryUsageTrend: this.getMemoryUsageTrend(),
        activeConnections: this.metrics.systemResources.activeConnections[this.metrics.systemResources.activeConnections.length - 1] || 0
      }
    };
  }

  /**
   * Get memory usage trend
   */
  private getMemoryUsageTrend(): 'stable' | 'increasing' | 'decreasing' {
    const recent = this.metrics.systemResources.memoryUsage.slice(-10);
    if (recent.length < 2) return 'stable';

    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Hash query for storage efficiency
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Clear old metrics (keep only recent data)
   */
  clearOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clear old system resource data
    this.metrics.systemResources.timestamp = this.metrics.systemResources.timestamp.filter(t => t > cutoff);
    this.metrics.systemResources.memoryUsage = this.metrics.systemResources.memoryUsage.slice(-this.maxMetricsHistory);
    this.metrics.systemResources.activeConnections = this.metrics.systemResources.activeConnections.slice(-this.maxMetricsHistory);

    console.log('🧹 Old performance metrics cleared');
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics.apiCalls.clear();
    this.metrics.databaseQueries.clear();
    this.metrics.cachePerformance.clear();
    this.metrics.errors.clear();
    this.metrics.tenantPerformance.clear();
    this.metrics.systemResources.memoryUsage = [];
    this.metrics.systemResources.cpuUsage = [];
    this.metrics.systemResources.activeConnections = [];
    this.metrics.systemResources.timestamp = [];

    console.log('🔄 All performance metrics reset');
  }
}

// Create singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Start periodic resource monitoring
setInterval(() => {
  performanceMonitoringService.recordSystemResources();
}, 30000); // Every 30 seconds

// Clear old metrics daily
setInterval(() => {
  performanceMonitoringService.clearOldMetrics();
}, 24 * 60 * 60 * 1000); // Every 24 hours
