// Dashboard Routes for Admin Panel
// مسیرهای داشبورد برای پنل مدیریت

import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../middlewares/adminAuth';
import dashboardService from '../services/dashboardService';

const router = Router();

/**
 * GET /api/admin/dashboard
 * Get comprehensive dashboard data
 */
router.get('/', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const dashboardData = await dashboardService.getDashboardData();
    
    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).json({
      success: false,
      error: 'DASHBOARD_ERROR',
      message: 'Failed to load dashboard data'
    });
  }
});

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics only
 */
router.get('/stats', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    
    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats route error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_ERROR',
      message: 'Failed to load dashboard statistics'
    });
  }
});

/**
 * GET /api/admin/dashboard/activities
 * Get recent activities
 */
router.get('/activities', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query as any)['limit'] as string) || 10;
    const activities = await dashboardService.getRecentActivities(limit);
    
    res.json({
      success: true,
      message: 'Recent activities retrieved successfully',
      data: activities
    });
  } catch (error) {
    console.error('Dashboard activities route error:', error);
    res.status(500).json({
      success: false,
      error: 'ACTIVITIES_ERROR',
      message: 'Failed to load recent activities'
    });
  }
});

/**
 * GET /api/admin/dashboard/metrics
 * Get system metrics
 */
router.get('/metrics', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const metrics = await dashboardService.getSystemMetrics();
    
    res.json({
      success: true,
      message: 'System metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Dashboard metrics route error:', error);
    res.status(500).json({
      success: false,
      error: 'METRICS_ERROR',
      message: 'Failed to load system metrics'
    });
  }
});

/**
 * GET /api/admin/dashboard/tenant-growth
 * Get tenant growth data
 */
router.get('/tenant-growth', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt((req.query as any)['days'] as string) || 30;
    const growthData = await dashboardService.getTenantGrowthData(days);
    
    res.json({
      success: true,
      message: 'Tenant growth data retrieved successfully',
      data: growthData
    });
  } catch (error) {
    console.error('Dashboard tenant growth route error:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_GROWTH_ERROR',
      message: 'Failed to load tenant growth data'
    });
  }
});

/**
 * GET /api/admin/dashboard/revenue
 * Get revenue data
 */
router.get('/revenue', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt((req.query as any)['days'] as string) || 30;
    const revenueData = await dashboardService.getRevenueData(days);
    
    res.json({
      success: true,
      message: 'Revenue data retrieved successfully',
      data: revenueData
    });
  } catch (error) {
    console.error('Dashboard revenue route error:', error);
    res.status(500).json({
      success: false,
      error: 'REVENUE_ERROR',
      message: 'Failed to load revenue data'
    });
  }
});

/**
 * GET /api/admin/dashboard/user-activity
 * Get user activity data
 */
router.get('/user-activity', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt((req.query as any)['days'] as string) || 30;
    const activityData = await dashboardService.getUserActivityData(days);
    
    res.json({
      success: true,
      message: 'User activity data retrieved successfully',
      data: activityData
    });
  } catch (error) {
    console.error('Dashboard user activity route error:', error);
    res.status(500).json({
      success: false,
      error: 'USER_ACTIVITY_ERROR',
      message: 'Failed to load user activity data'
    });
  }
});

/**
 * GET /api/admin/dashboard/health
 * Get system health status
 */
router.get('/health', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    
    res.json({
      success: true,
      message: 'System health status retrieved successfully',
      data: {
        status: stats.systemHealth,
        lastUpdated: stats.lastUpdated,
        uptime: 99.9, // This would come from actual system monitoring
        responseTime: 120, // This would come from actual system monitoring
      }
    });
  } catch (error) {
    console.error('Dashboard health route error:', error);
    res.status(500).json({
      success: false,
      error: 'HEALTH_ERROR',
      message: 'Failed to load system health status'
    });
  }
});

export default router;
