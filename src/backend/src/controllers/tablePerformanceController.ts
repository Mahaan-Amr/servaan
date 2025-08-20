import { Request, Response, NextFunction } from 'express';
import { tableCacheService } from '../services/tableCacheService';
import { tableRealTimeService } from '../services/tableRealTimeService';
import { AppError } from '../utils/AppError';

export class TablePerformanceController {
  /**
   * Get cache statistics
   * GET /api/ordering/tables/performance/cache-stats
   */
  static async getCacheStats(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const cacheStats = tableCacheService.getCacheStats();
      const connectionStats = tableRealTimeService.getConnectionStats();

      res.json({
        success: true,
        data: {
          cache: cacheStats,
          realTime: connectionStats
        },
        message: 'Performance statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cache for tenant
   * POST /api/ordering/tables/performance/clear-cache
   */
  static async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      await tableCacheService.invalidateTableCache(tenantId);

      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get real-time connection status
   * GET /api/ordering/tables/performance/connection-status
   */
  static async getConnectionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const connectionStats = tableRealTimeService.getConnectionStats();

      res.json({
        success: true,
        data: connectionStats,
        message: 'Connection status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Optimize table queries
   * POST /api/ordering/tables/performance/optimize-queries
   */
  static async optimizeQueries(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const { queryType, filters } = req.body;

      // Optimize based on query type
      switch (queryType) {
        case 'tables':
          // Pre-warm cache for common table queries
          await tableCacheService.getCachedTables(tenantId, filters || {});
          break;
        case 'reservations':
          // Pre-warm cache for reservation queries
          await tableCacheService.getCachedReservations(tenantId, filters || {});
          break;
        case 'stats':
          // Pre-warm cache for statistics
          await tableCacheService.getCachedTableStats(tenantId);
          break;
        default:
          throw new AppError('Invalid query type', 400);
      }

      res.json({
        success: true,
        message: 'Query optimization completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance recommendations
   * GET /api/ordering/tables/performance/recommendations
   */
  static async getPerformanceRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        throw new AppError('Authentication required', 401);
      }

      const cacheStats = tableCacheService.getCacheStats();
      const connectionStats = tableRealTimeService.getConnectionStats();

      const recommendations = [];

      // Analyze cache performance
      const hitRateNumber = parseFloat(cacheStats.hitRate.replace('%', ''));
      if (hitRateNumber < 50) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          title: 'کش ضعیف',
          description: 'نرخ hit کش کمتر از 50% است. پیشنهاد می‌شود تنظیمات کش بررسی شود.',
          action: 'increase_cache_ttl'
        });
      }

      // Analyze connection performance
      if (connectionStats.onlineUsers < 1) {
        recommendations.push({
          type: 'connection',
          priority: 'medium',
          title: 'اتصال real-time',
          description: 'هیچ کاربری متصل نیست. بررسی اتصال WebSocket پیشنهاد می‌شود.',
          action: 'check_websocket_connection'
        });
      }

      // Analyze memory usage
      if (cacheStats.cacheSize > 100) {
        recommendations.push({
          type: 'memory',
          priority: 'low',
          title: 'استفاده از حافظه',
          description: 'حجم کش بالا است. پاک کردن کش قدیمی پیشنهاد می‌شود.',
          action: 'clear_old_cache'
        });
      }

      res.json({
        success: true,
        data: {
          recommendations,
          stats: {
            cache: cacheStats,
            realTime: connectionStats
          }
        },
        message: 'Performance recommendations retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for performance services
   * GET /api/ordering/tables/performance/health
   */
  static async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheStats = tableCacheService.getCacheStats();
      const connectionStats = tableRealTimeService.getConnectionStats();

      const health = {
        cache: {
          status: 'healthy',
          size: cacheStats.cacheSize,
          hitRate: cacheStats.hitRate
        },
        realTime: {
          status: connectionStats.onlineUsers > 0 ? 'healthy' : 'warning',
          onlineUsers: connectionStats.onlineUsers
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: health,
        message: 'Performance health check completed'
      });
    } catch (error) {
      next(error);
    }
  }
} 