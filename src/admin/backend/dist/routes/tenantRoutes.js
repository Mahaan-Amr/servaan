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
            res.status(404).json({
                success: false,
                error: 'مستأجر یافت نشد',
                message: 'Tenant not found'
            });
            return;
        }
        // Audit log
        await (0, auditLogger_1.auditLog)({
            adminUserId: req.adminUser.id,
            action: 'TENANT_DETAILS_VIEWED',
            details: { tenantId: id },
            ipAddress: req.ip || 'unknown'
        });
        res.json({
            success: true,
            data: { tenant }
        });
    }
    catch (error) {
        console.error('Admin tenant details error:', error);
        res.status(500).json({
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
        res.json({
            success: true,
            data: { metrics }
        });
    }
    catch (error) {
        console.error('Admin tenant metrics error:', error);
        res.status(500).json({
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
        res.json({
            success: true,
            message: 'مستأجر با موفقیت به‌روزرسانی شد',
            data: { tenant: updatedTenant }
        });
    }
    catch (error) {
        console.error('Admin tenant update error:', error);
        res.status(500).json({
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
        res.json({
            success: true,
            message: 'مستأجر با موفقیت غیرفعال شد'
        });
    }
    catch (error) {
        console.error('Admin tenant deactivation error:', error);
        res.status(500).json({
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
        res.json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        console.error('Admin platform overview error:', error);
        res.status(500).json({
            success: false,
            error: 'خطا در دریافت نمای کلی پلتفرم',
            message: 'Failed to fetch platform overview'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tenantRoutes.js.map