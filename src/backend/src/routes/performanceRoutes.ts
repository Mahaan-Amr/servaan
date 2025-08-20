import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { requireTenant } from '../middlewares/tenantMiddleware';

const router = Router();

/**
 * Performance Monitoring Routes
 * Provides access to system performance metrics and health status
 */

// Get comprehensive performance summary
router.get('/summary', requireTenant, PerformanceController.getPerformanceSummary);

// Get API performance metrics
router.get('/api', requireTenant, PerformanceController.getApiPerformance);

// Get database performance metrics
router.get('/database', requireTenant, PerformanceController.getDatabasePerformance);

// Get cache performance metrics
router.get('/cache', requireTenant, PerformanceController.getCachePerformance);

// Get system resource usage
router.get('/resources', requireTenant, PerformanceController.getSystemResources);

// Get error summary
router.get('/errors', requireTenant, PerformanceController.getErrorSummary);

// Get system health status
router.get('/health', requireTenant, PerformanceController.getHealthStatus);

// Reset performance metrics
router.post('/reset', requireTenant, PerformanceController.resetMetrics);

// Clear cache
router.post('/cache/clear', requireTenant, PerformanceController.clearCache);

// Warm up cache for specific tenant
router.post('/cache/warmup/:tenantId', requireTenant, PerformanceController.warmupCache);

export default router;
