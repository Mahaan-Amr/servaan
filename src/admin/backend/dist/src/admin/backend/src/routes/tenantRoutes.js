"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const TenantService_1 = require("../services/TenantService");
const auditLogger_1 = require("../utils/auditLogger");
const router = express_1.default.Router();
/**
 * GET /api/admin/tenants
 * List all tenants with pagination and search
 */
router.get('/', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, plan } = req.query;
        const result = await TenantService_1.TenantService.listTenants({
            page: Number(page),
            limit: Number(limit),
            search: search,
            status: status,
            plan: plan
        });
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_LIST_VIEWED',
            details: { page, limit, search, status, plan },
            ipAddress: req.ip || 'unknown'
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Admin tenant list error:', error);
        res.status(500).json({
            success: false,
            error: 'خطا در دریافت لیست مستأجرین',
            message: 'Failed to fetch tenants list'
        });
    }
});
/**
 * GET /api/admin/tenants/export
 * Export tenants data in various formats
 */
router.get('/export', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { format = 'csv', search, status, plan } = req.query;
        const exportData = await TenantService_1.TenantService.exportTenants({
            format: format,
            search: search,
            status: status,
            plan: plan
        });
        // Set appropriate headers for file download
        const filename = `tenants-export-${new Date().toISOString().split('T')[0]}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
        }
        else if (format === 'excel') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
        else if (format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANTS_EXPORTED',
            details: { format, search, status, plan },
            ipAddress: req.ip || 'unknown'
        });
        return res.send(exportData);
    }
    catch (error) {
        console.error('Admin tenants export error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در صادرات داده‌های مستأجرین',
            message: 'Failed to export tenants data'
        });
    }
});
/**
 * GET /api/admin/tenants/:id
 * Get detailed information about a specific tenant
 */
router.get('/:id', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'شناسه مستأجر ارائه نشده',
                message: 'Tenant ID not provided'
            });
        }
        const tenant = await TenantService_1.TenantService.getTenantById(id);
        if (!tenant) {
            return res.status(404).json({
                success: false,
                error: 'مستأجر یافت نشد',
                message: 'Tenant not found'
            });
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_DETAILS_VIEWED',
            details: { tenantId: id },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            data: { tenant }
        });
    }
    catch (error) {
        console.error('Admin tenant details error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در دریافت جزئیات مستأجر',
            message: 'Failed to fetch tenant details'
        });
    }
});
/**
 * GET /api/admin/tenants/:id/metrics
 * Get detailed metrics for a specific tenant
 */
router.get('/:id/metrics', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'شناسه مستأجر ارائه نشده',
                message: 'Tenant ID not provided'
            });
        }
        const metrics = await TenantService_1.TenantService.getTenantMetrics(id);
        if (!metrics) {
            return res.status(404).json({
                success: false,
                error: 'متریک‌های مستأجر یافت نشد',
                message: 'Tenant metrics not found'
            });
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_METRICS_VIEWED',
            details: { tenantId: id },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            data: { metrics }
        });
    }
    catch (error) {
        console.error('Admin tenant metrics error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در دریافت متریک‌های مستأجر',
            message: 'Failed to fetch tenant metrics'
        });
    }
});
/**
 * PUT /api/admin/tenants/:id
 * Update tenant information
 */
router.put('/:id', authMiddleware_1.authenticateAdmin, (0, authMiddleware_1.requireRole)(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'شناسه مستأجر ارائه نشده',
                message: 'Tenant ID not provided'
            });
        }
        const updatedTenant = await TenantService_1.TenantService.updateTenant(id, updateData);
        if (!updatedTenant) {
            return res.status(404).json({
                success: false,
                error: 'مستأجر یافت نشد',
                message: 'Tenant not found'
            });
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_UPDATED',
            details: { tenantId: id, updateData },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            message: 'مستأجر با موفقیت به‌روزرسانی شد',
            data: { tenant: updatedTenant }
        });
    }
    catch (error) {
        console.error('Admin tenant update error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در به‌روزرسانی مستأجر',
            message: 'Failed to update tenant'
        });
    }
});
/**
 * DELETE /api/admin/tenants/:id
 * Deactivate a tenant (soft delete)
 */
router.delete('/:id', authMiddleware_1.authenticateAdmin, (0, authMiddleware_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'شناسه مستأجر ارائه نشده',
                message: 'Tenant ID not provided'
            });
        }
        const result = await TenantService_1.TenantService.deactivateTenant(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'مستأجر یافت نشد',
                message: 'Tenant not found'
            });
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_DEACTIVATED',
            details: { tenantId: id },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            message: 'مستأجر با موفقیت غیرفعال شد'
        });
    }
    catch (error) {
        console.error('Admin tenant deactivation error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در غیرفعال‌سازی مستأجر',
            message: 'Failed to deactivate tenant'
        });
    }
});
/**
 * GET /api/admin/tenants/overview
 * Get platform-wide tenant overview and statistics
 */
router.get('/overview', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const overview = await TenantService_1.TenantService.getPlatformOverview();
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'PLATFORM_OVERVIEW_VIEWED',
            details: {},
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        console.error('Admin platform overview error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در دریافت نمای کلی پلتفرم',
            message: 'Failed to fetch platform overview'
        });
    }
});
/**
 * PUT /api/admin/tenants/:id/activate
 * Activate a previously deactivated tenant
 */
router.put('/:id/activate', authMiddleware_1.authenticateAdmin, (0, authMiddleware_1.requireRole)(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'شناسه مستأجر ارائه نشده',
                message: 'Tenant ID not provided'
            });
        }
        const result = await TenantService_1.TenantService.activateTenant(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'مستأجر یافت نشد',
                message: 'Tenant not found'
            });
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_ACTIVATED',
            details: { tenantId: id },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            message: 'مستأجر با موفقیت فعال شد'
        });
    }
    catch (error) {
        console.error('Admin tenant activation error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در فعال‌سازی مستأجر',
            message: 'Failed to activate tenant'
        });
    }
});
/**
 * POST /api/admin/tenants/bulk-status
 * Bulk update tenant status (activate/deactivate multiple tenants)
 */
router.post('/bulk-status', authMiddleware_1.authenticateAdmin, (0, authMiddleware_1.requireRole)(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
    try {
        const { tenantIds, isActive } = req.body;
        if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'لیست شناسه‌های مستأجر نامعتبر است',
                message: 'Invalid tenant IDs list'
            });
        }
        const result = await TenantService_1.TenantService.bulkUpdateStatus(tenantIds, isActive);
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'BULK_TENANT_STATUS_UPDATED',
            details: { tenantIds, isActive, updatedCount: result.updatedCount },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            message: `${result.updatedCount} مستأجر با موفقیت به‌روزرسانی شد`,
            data: result
        });
    }
    catch (error) {
        console.error('Admin bulk tenant status update error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در به‌روزرسانی وضعیت گروهی مستأجرین',
            message: 'Failed to bulk update tenant status'
        });
    }
});
/**
 * GET /api/admin/tenants/:id/activity
 * Get tenant-specific activity logs
 */
router.get('/:id/activity', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, type } = req.query;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'شناسه مستأجر ارائه نشده',
                message: 'Tenant ID not provided'
            });
        }
        const activities = await TenantService_1.TenantService.getTenantActivity(id, {
            page: Number(page),
            limit: Number(limit),
            type: type
        });
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_ACTIVITY_VIEWED',
            details: { tenantId: id, page, limit, type },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            data: activities
        });
    }
    catch (error) {
        console.error('Admin tenant activity error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در دریافت فعالیت‌های مستأجر',
            message: 'Failed to fetch tenant activity'
        });
    }
});
/**
 * GET /api/admin/tenants/analytics/growth
 * Get tenant growth analytics data
 */
router.get('/analytics/growth', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { days = 30, groupBy = 'day' } = req.query;
        const growthData = await TenantService_1.TenantService.getTenantGrowthAnalytics({
            days: Number(days),
            groupBy: groupBy
        });
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_GROWTH_ANALYTICS_VIEWED',
            details: { days, groupBy },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            data: growthData
        });
    }
    catch (error) {
        console.error('Admin tenant growth analytics error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در دریافت تحلیل رشد مستأجرین',
            message: 'Failed to fetch tenant growth analytics'
        });
    }
});
/**
 * GET /api/admin/tenants/analytics/revenue
 * Get tenant revenue analytics data
 */
router.get('/analytics/revenue', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { period = 'monthly', year } = req.query;
        const revenueData = await TenantService_1.TenantService.getTenantRevenueAnalytics({
            period: period,
            ...(year && { year: Number(year) })
        });
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_REVENUE_ANALYTICS_VIEWED',
            details: { period, year },
            ipAddress: req.ip || 'unknown'
        });
        return res.json({
            success: true,
            data: revenueData
        });
    }
    catch (error) {
        console.error('Admin tenant revenue analytics error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در دریافت تحلیل درآمد مستأجرین',
            message: 'Failed to fetch tenant revenue analytics'
        });
    }
});
/**
 * GET /api/admin/tenants/export
 * Export tenants data in various formats
 */
router.get('/export', authMiddleware_1.authenticateAdmin, async (req, res) => {
    try {
        const { format = 'csv', search, status, plan } = req.query;
        const exportData = await TenantService_1.TenantService.exportTenants({
            format: format,
            search: search,
            status: status,
            plan: plan
        });
        // Set appropriate headers for file download
        const filename = `tenants-export-${new Date().toISOString().split('T')[0]}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
        }
        else if (format === 'excel') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }
        else if (format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANTS_EXPORTED',
            details: { format, search, status, plan },
            ipAddress: req.ip || 'unknown'
        });
        return res.send(exportData);
    }
    catch (error) {
        console.error('Admin tenants export error:', error);
        return res.status(500).json({
            success: false,
            error: 'خطا در صادرات داده‌های مستأجرین',
            message: 'Failed to export tenants data'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tenantRoutes.js.map