"use strict";
// Dashboard Routes for Admin Panel
// مسیرهای داشبورد برای پنل مدیریت
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../middlewares/adminAuth");
const dashboardService_1 = __importDefault(require("../services/dashboardService"));
const router = (0, express_1.Router)();
/**
 * GET /api/admin/dashboard
 * Get comprehensive dashboard data
 */
router.get('/', adminAuth_1.authenticateAdmin, async (_req, res) => {
    try {
        const dashboardData = await dashboardService_1.default.getDashboardData();
        res.json({
            success: true,
            message: 'Dashboard data retrieved successfully',
            data: dashboardData
        });
    }
    catch (error) {
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
router.get('/stats', adminAuth_1.authenticateAdmin, async (_req, res) => {
    try {
        const stats = await dashboardService_1.default.getDashboardStats();
        res.json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: stats
        });
    }
    catch (error) {
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
router.get('/activities', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query['limit']) || 10;
        const activities = await dashboardService_1.default.getRecentActivities(limit);
        res.json({
            success: true,
            message: 'Recent activities retrieved successfully',
            data: activities
        });
    }
    catch (error) {
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
router.get('/metrics', adminAuth_1.authenticateAdmin, async (_req, res) => {
    try {
        const metrics = await dashboardService_1.default.getSystemMetrics();
        res.json({
            success: true,
            message: 'System metrics retrieved successfully',
            data: metrics
        });
    }
    catch (error) {
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
router.get('/tenant-growth', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query['days']) || 30;
        const growthData = await dashboardService_1.default.getTenantGrowthData(days);
        res.json({
            success: true,
            message: 'Tenant growth data retrieved successfully',
            data: growthData
        });
    }
    catch (error) {
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
router.get('/revenue', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query['days']) || 30;
        const revenueData = await dashboardService_1.default.getRevenueData(days);
        res.json({
            success: true,
            message: 'Revenue data retrieved successfully',
            data: revenueData
        });
    }
    catch (error) {
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
router.get('/user-activity', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query['days']) || 30;
        const activityData = await dashboardService_1.default.getUserActivityData(days);
        res.json({
            success: true,
            message: 'User activity data retrieved successfully',
            data: activityData
        });
    }
    catch (error) {
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
router.get('/health', adminAuth_1.authenticateAdmin, async (_req, res) => {
    try {
        const stats = await dashboardService_1.default.getDashboardStats();
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
    }
    catch (error) {
        console.error('Dashboard health route error:', error);
        res.status(500).json({
            success: false,
            error: 'HEALTH_ERROR',
            message: 'Failed to load system health status'
        });
    }
});
/**
 * GET /api/admin/dashboard/tenant-overview
 * Get tenant overview data for dashboard cards
 */
router.get('/tenant-overview', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query['limit']) || 10;
        const tenantData = await dashboardService_1.default.getTenantOverviewData(limit);
        res.json({
            success: true,
            message: 'Tenant overview data retrieved successfully',
            data: tenantData
        });
    }
    catch (error) {
        console.error('Dashboard tenant overview route error:', error);
        res.status(500).json({
            success: false,
            error: 'TENANT_OVERVIEW_ERROR',
            message: 'Failed to load tenant overview data'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map