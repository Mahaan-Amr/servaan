import { Request, Response } from 'express';
import { performanceMonitoringService } from '../services/performanceMonitoringService';
import { globalCacheService } from '../services/globalCacheService';

/**
 * Performance Monitoring Controller
 * Provides endpoints for accessing performance metrics and system health
 */
export class PerformanceController {
  /**
   * Get comprehensive performance summary
   */
  static async getPerformanceSummary(req: Request, res: Response) {
    try {
      const performanceSummary = performanceMonitoringService.getPerformanceSummary();
      const cacheStats = globalCacheService.getCacheStats();

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        performance: performanceSummary,
        cache: cacheStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting performance summary:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت اطلاعات عملکرد سیستم'
      });
    }
  }

  /**
   * Get API performance metrics
   */
  static async getApiPerformance(req: Request, res: Response) {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      
      res.json({
        success: true,
        apiPerformance: summary.apiPerformance,
        tenantPerformance: summary.tenantPerformance
      });
    } catch (error) {
      console.error('Error getting API performance:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت اطلاعات عملکرد API'
      });
    }
  }

  /**
   * Get database performance metrics
   */
  static async getDatabasePerformance(req: Request, res: Response) {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      
      res.json({
        success: true,
        databasePerformance: summary.databasePerformance
      });
    } catch (error) {
      console.error('Error getting database performance:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت اطلاعات عملکرد پایگاه داده'
      });
    }
  }

  /**
   * Get cache performance metrics
   */
  static async getCachePerformance(req: Request, res: Response) {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      const cacheStats = globalCacheService.getCacheStats();
      
      res.json({
        success: true,
        cachePerformance: summary.cachePerformance,
        cacheStats: cacheStats
      });
    } catch (error) {
      console.error('Error getting cache performance:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت اطلاعات عملکرد کش'
      });
    }
  }

  /**
   * Get system resource usage
   */
  static async getSystemResources(req: Request, res: Response) {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      
      res.json({
        success: true,
        systemResources: summary.systemResources,
        currentMemory: process.memoryUsage(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('Error getting system resources:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت اطلاعات منابع سیستم'
      });
    }
  }

  /**
   * Get error summary
   */
  static async getErrorSummary(req: Request, res: Response) {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      
      res.json({
        success: true,
        errorSummary: summary.errorSummary
      });
    } catch (error) {
      console.error('Error getting error summary:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت خلاصه خطاها'
      });
    }
  }

  /**
   * Reset performance metrics
   */
  static async resetMetrics(req: Request, res: Response) {
    try {
      performanceMonitoringService.resetMetrics();
      
      res.json({
        success: true,
        message: 'شاخص‌های عملکرد با موفقیت بازنشانی شدند'
      });
    } catch (error) {
      console.error('Error resetting metrics:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بازنشانی شاخص‌های عملکرد'
      });
    }
  }

  /**
   * Clear cache
   */
  static async clearCache(req: Request, res: Response) {
    try {
      globalCacheService.clearCache();
      
      res.json({
        success: true,
        message: 'کش با موفقیت پاک شد'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در پاک کردن کش'
      });
    }
  }

  /**
   * Warm up cache for specific tenant
   */
  static async warmupCache(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'شناسه مجموعه مورد نیاز است'
        });
      }

      await globalCacheService.warmupCache(tenantId);
      
      res.json({
        success: true,
        message: `کش برای مجموعه ${tenantId} گرم شد`
      });
    } catch (error) {
      console.error('Error warming up cache:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در گرم کردن کش'
      });
    }
  }

  /**
   * Get performance health status
   */
  static async getHealthStatus(req: Request, res: Response) {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      const cacheStats = globalCacheService.getCacheStats();
      
      // Calculate health scores
      const apiHealthScore = this.calculateApiHealthScore(summary);
      const cacheHealthScore = this.calculateCacheHealthScore(cacheStats);
      const databaseHealthScore = this.calculateDatabaseHealthScore(summary);
      
      const overallHealth = (apiHealthScore + cacheHealthScore + databaseHealthScore) / 3;
      
      const healthStatus = {
        overall: {
          score: overallHealth,
          status: this.getHealthStatusText(overallHealth),
          color: this.getHealthColor(overallHealth)
        },
        api: {
          score: apiHealthScore,
          status: this.getHealthStatusText(apiHealthScore),
          color: this.getHealthColor(apiHealthScore)
        },
        cache: {
          score: cacheHealthScore,
          status: this.getHealthStatusText(cacheHealthScore),
          color: this.getHealthColor(cacheHealthScore)
        },
        database: {
          score: databaseHealthScore,
          status: this.getHealthStatusText(databaseHealthScore),
          color: this.getHealthColor(databaseHealthScore)
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        health: healthStatus
      });
    } catch (error) {
      console.error('Error getting health status:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت وضعیت سلامت سیستم'
      });
    }
  }

  /**
   * Calculate API health score
   */
  private static calculateApiHealthScore(summary: any): number {
    const endpoints = summary.apiPerformance.endpoints;
    if (endpoints.length === 0) return 100;

    const avgResponseTime = endpoints.reduce((sum: number, ep: any) => sum + ep.avgTime, 0) / endpoints.length;
    
    // Score based on average response time
    if (avgResponseTime < 100) return 100;
    if (avgResponseTime < 500) return 80;
    if (avgResponseTime < 1000) return 60;
    if (avgResponseTime < 2000) return 40;
    return 20;
  }

  /**
   * Calculate cache health score
   */
  private static calculateCacheHealthScore(cacheStats: any): number {
    const hitRate = parseFloat(cacheStats.hitRate.replace('%', ''));
    
    if (hitRate >= 80) return 100;
    if (hitRate >= 60) return 80;
    if (hitRate >= 40) return 60;
    if (hitRate >= 20) return 40;
    return 20;
  }

  /**
   * Calculate database health score
   */
  private static calculateDatabaseHealthScore(summary: any): number {
    const slowQueries = summary.databasePerformance.slowQueries;
    const totalQueries = summary.databasePerformance.totalQueries;
    
    if (totalQueries === 0) return 100;
    
    const slowQueryRate = (slowQueries / totalQueries) * 100;
    
    if (slowQueryRate < 1) return 100;
    if (slowQueryRate < 5) return 80;
    if (slowQueryRate < 10) return 60;
    if (slowQueryRate < 20) return 40;
    return 20;
  }

  /**
   * Get health status text
   */
  private static getHealthStatusText(score: number): string {
    if (score >= 80) return 'عالی';
    if (score >= 60) return 'خوب';
    if (score >= 40) return 'متوسط';
    if (score >= 20) return 'ضعیف';
    return 'بحرانی';
  }

  /**
   * Get health status color
   */
  private static getHealthColor(score: number): string {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#F97316'; // Orange
    if (score >= 20) return '#EF4444'; // Red
    return '#7F1D1D'; // Dark Red
  }
}
