import express from 'express';
import { authenticateAdmin, requireRole } from '../middlewares/authMiddleware';
import { TenantService } from '../services/TenantService';
import { auditLog } from '../utils/auditLogger';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * GET /api/admin/tenants
 * List all tenants with pagination and search
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, limit = 10, search, status, plan, sortBy, sortDir, refresh,
      businessType, city, country, createdFrom, createdTo,
      revenueFrom, revenueTo, userCountFrom, userCountTo, hasFeatures
    } = req.query;
    
    const result = await TenantService.listTenants({
      page: Number(page),
      limit: Number(limit),
      sortBy: (sortBy as 'createdAt' | 'monthlyRevenue' | 'ordersThisMonth') || 'createdAt',
      sortDir: (sortDir as 'asc' | 'desc') || 'desc',
      refresh: refresh === 'true',
      ...(search ? { search: search as string } : {}),
      ...(status ? { status: status as string } : {}),
      ...(plan ? { plan: plan as string } : {}),
      // Enhanced filters (only include when provided)
      ...(businessType ? { businessType: businessType as string } : {}),
      ...(city ? { city: city as string } : {}),
      ...(country ? { country: country as string } : {}),
      ...(createdFrom ? { createdFrom: createdFrom as string } : {}),
      ...(createdTo ? { createdTo: createdTo as string } : {}),
      ...(revenueFrom !== undefined ? { revenueFrom: Number(revenueFrom) } : {}),
      ...(revenueTo ? { revenueTo: Number(revenueTo) } : {}),
      ...(userCountFrom ? { userCountFrom: Number(userCountFrom) } : {}),
      ...(userCountTo ? { userCountTo: Number(userCountTo) } : {}),
      ...(hasFeatures ? { hasFeatures: (hasFeatures as string).split(',') } : {})
    });

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_LIST_VIEWED',
      details: { page, limit, search, status, plan },
      ipAddress: req.ip || 'unknown'
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Admin tenant list error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت لیست مستأجرین',
      message: 'Failed to fetch tenants list'
    });
  }
});

/**
 * POST /api/admin/tenants
 * Create a new tenant
 */
router.post('/', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const data = req.body;

    // Basic validation
    const required = ['name', 'subdomain', 'ownerName', 'ownerEmail'];
    const missing = required.filter((k) => !data[k]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PAYLOAD',
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    const tenant = await TenantService.createTenant(data);

    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_CREATED',
      details: { tenantId: tenant.id, subdomain: tenant.subdomain },
      ipAddress: req.ip || 'unknown'
    });

    return res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: { tenant }
    });
  } catch (error: any) {
    if (error?.message === 'SUBDOMAIN_TAKEN') {
      return res.status(409).json({
        success: false,
        error: 'SUBDOMAIN_TAKEN',
        message: 'زیردامنه قبلاً استفاده شده است'
      });
    }
    console.error('Admin tenant create error:', error);
    return res.status(500).json({
      success: false,
      error: 'TENANT_CREATE_FAILED',
      message: 'Failed to create tenant'
    });
  }
});

/**
 * GET /api/admin/tenants/export
 * Export tenants data in various formats with enhanced filtering
 */
router.get('/export', authenticateAdmin, async (req, res) => {
  try {
    const { 
      format = 'csv', 
      search, 
      status, 
      plan,
      businessType,
      city,
      country,
      createdFrom,
      createdTo,
      revenueFrom,
      revenueTo,
      userCountFrom,
      userCountTo,
      hasFeatures,
      selectedTenants
    } = req.query;
    
    const exportData = await TenantService.exportTenants({
      format: format as 'csv' | 'excel' | 'pdf',
      ...(search ? { search: search as string } : {}),
      ...(status ? { status: status as string } : {}),
      ...(plan ? { plan: plan as string } : {})
    });

    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const tenantCount = selectedTenants ? (selectedTenants as string).split(',').length : 'all';
    const filename = `tenants-export-${tenantCount}-${timestamp}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    }

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANTS_EXPORTED',
      details: { 
        format, 
        search, 
        status, 
        plan,
        businessType,
        city,
        country,
        createdFrom,
        createdTo,
        revenueFrom,
        revenueTo,
        userCountFrom,
        userCountTo,
        hasFeatures,
        selectedTenants: selectedTenants ? (selectedTenants as string).split(',').length : 'all'
      },
      ipAddress: req.ip || 'unknown'
    });

    return res.send(exportData);

  } catch (error) {
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
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'شناسه مستأجر ارائه نشده',
        message: 'Tenant ID not provided'
      });
    }
    
    const tenant = await TenantService.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'مستأجر یافت نشد',
        message: 'Tenant not found'
      });
    }

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_DETAILS_VIEWED',
      details: { tenantId: id },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      data: { tenant }
    });

  } catch (error) {
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
router.get('/:id/metrics', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'شناسه مستأجر ارائه نشده',
        message: 'Tenant ID not provided'
      });
    }
    
    const metrics = await TenantService.getTenantMetrics(id);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'متریک‌های مستأجر یافت نشد',
        message: 'Tenant metrics not found'
      });
    }

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_METRICS_VIEWED',
      details: { tenantId: id },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      data: { metrics }
    });

  } catch (error) {
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
router.put('/:id', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
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
    
    const updatedTenant = await TenantService.updateTenant(id, updateData);
    
    if (!updatedTenant) {
      return res.status(404).json({
        success: false,
        error: 'مستأجر یافت نشد',
        message: 'Tenant not found'
      });
    }

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_UPDATED',
      details: { tenantId: id, updateData },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      message: 'مستأجر با موفقیت به‌روزرسانی شد',
      data: { tenant: updatedTenant }
    });

  } catch (error) {
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
router.delete('/:id', authenticateAdmin, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'شناسه مستأجر ارائه نشده',
        message: 'Tenant ID not provided'
      });
    }
    
    const result = await TenantService.deactivateTenant(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'مستأجر یافت نشد',
        message: 'Tenant not found'
      });
    }

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_DEACTIVATED',
      details: { tenantId: id },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      message: 'مستأجر با موفقیت غیرفعال شد'
    });

  } catch (error) {
    console.error('Admin tenant deactivation error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطا در غیرفعال‌سازی مستأجر',
      message: 'Failed to deactivate tenant'
    });
  }
});

/**
 * GET /api/admin/tenants/check-subdomain/:subdomain
 * Check if subdomain is available
 */
router.get('/check-subdomain/:subdomain', authenticateAdmin, async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    if (!subdomain || subdomain.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'SUBDOMAIN_TOO_SHORT',
        message: 'زیردامنه باید حداقل ۳ کاراکتر باشد'
      });
    }

    // Check if subdomain contains only valid characters
    if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SUBDOMAIN',
        message: 'زیردامنه فقط می‌تواند شامل حروف، اعداد و خط تیره باشد'
      });
    }

    // Check reserved subdomains
    const reservedSubdomains = ['admin', 'api', 'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'app', 'dashboard'];
    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'SUBDOMAIN_RESERVED',
        message: 'این زیردامنه رزرو شده است'
      });
    }

    // Check if subdomain already exists
    const existingTenant = await TenantService.getTenantBySubdomain(subdomain);
    
    if (existingTenant) {
      return res.json({
        success: true,
        available: false,
        message: 'این زیردامنه قبلاً استفاده شده است'
      });
    }

    return res.json({
      success: true,
      available: true,
      message: 'این زیردامنه در دسترس است'
    });

  } catch (error) {
    console.error('Subdomain check error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطا در بررسی زیردامنه',
      message: 'Failed to check subdomain availability'
    });
  }
});

/**
 * GET /api/admin/tenants/overview
 * Get platform-wide tenant overview and statistics
 */
router.get('/overview', authenticateAdmin, async (req, res) => {
  try {
    const overview = await TenantService.getPlatformOverview();
    
    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'PLATFORM_OVERVIEW_VIEWED',
      details: {},
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      data: overview
    });

  } catch (error) {
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
router.put('/:id/activate', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'شناسه مستأجر ارائه نشده',
        message: 'Tenant ID not provided'
      });
    }
    
    const result = await TenantService.activateTenant(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'مستأجر یافت نشد',
        message: 'Tenant not found'
      });
    }

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_ACTIVATED',
      details: { tenantId: id },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      message: 'مستأجر با موفقیت فعال شد'
    });

  } catch (error) {
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
router.post('/bulk-status', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { tenantIds, isActive } = req.body;
    
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لیست شناسه‌های مستأجر نامعتبر است',
        message: 'Invalid tenant IDs list'
      });
    }

    const result = await TenantService.bulkUpdateStatus(tenantIds, isActive);
    
    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'BULK_TENANT_STATUS_UPDATED',
      details: { tenantIds, isActive, updatedCount: result.updatedCount },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      message: `${result.updatedCount} مستأجر با موفقیت به‌روزرسانی شد`,
      data: result
    });

  } catch (error) {
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
router.get('/:id/activity', authenticateAdmin, async (req, res) => {
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
    
    const activities = await TenantService.getTenantActivity(id, {
      page: Number(page),
      limit: Number(limit),
      type: type as string
    });

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_ACTIVITY_VIEWED',
      details: { tenantId: id, page, limit, type },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      data: activities
    });

  } catch (error) {
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
router.get('/analytics/growth', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30, groupBy = 'day' } = req.query;
    
    const growthData = await TenantService.getTenantGrowthAnalytics({
      days: Number(days),
      groupBy: groupBy as 'day' | 'week' | 'month'
    });

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_GROWTH_ANALYTICS_VIEWED',
      details: { days, groupBy },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      data: growthData
    });

  } catch (error) {
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
router.get('/analytics/revenue', authenticateAdmin, async (req, res) => {
  try {
    const { period = 'monthly', year } = req.query;
    
    const revenueData = await TenantService.getTenantRevenueAnalytics({
      period: period as 'daily' | 'weekly' | 'monthly' | 'yearly',
      ...(year && { year: Number(year) })
    });

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_REVENUE_ANALYTICS_VIEWED',
      details: { period, year },
      ipAddress: req.ip || 'unknown'
    });

    return res.json({
      success: true,
      data: revenueData
    });

  } catch (error) {
    console.error('Admin tenant revenue analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطا در دریافت تحلیل درآمد مستأجرین',
      message: 'Failed to fetch tenant revenue analytics'
    });
  }
});

export default router;

/**
 * POST /api/admin/tenants/:id/users/reset-password
 * Reset a tenant user's password by email (SUPER_ADMIN, PLATFORM_ADMIN)
 */
router.post('/:id/users/reset-password', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { email, newPassword } = req.body as { email?: string; newPassword?: string };
    if (!email || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const result = await TenantService.resetTenantUserPasswordByEmail(id, email, newPassword);
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_USER_PASSWORD_RESET',
      details: { tenantId: id, email },
      ipAddress: req.ip || 'unknown'
    });
    return res.json({ success: true, data: result });
  } catch (e: any) {
    if (e?.message === 'TENANT_USER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Tenant user not found' });
    }
    console.error('Tenant user reset password error:', e);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

/**
 * GET /api/admin/tenants/:id/users
 * List tenant users (minimal) with optional ?q= search
 */
router.get('/:id/users', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const q = (req.query['q'] as string | undefined) || undefined;
    const users = await TenantService.listTenantUsers(id, q);
    return res.json({ success: true, data: users });
  } catch (e) {
    console.error('List tenant users error:', e);
    return res.status(500).json({ success: false, message: 'Failed to list tenant users' });
  }
});

/**
 * POST /api/admin/tenants/:id/users
 * Create a new user for a specific tenant
 */
router.post('/:id/users', authenticateAdmin, requireRole(['SUPER_ADMIN', 'PLATFORM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { name, email, phone, status } = req.body as { 
      name?: string; 
      email?: string; 
      phone?: string; 
      status?: string; 
    };

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'نام و ایمیل الزامی است'
      });
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'مستأجر یافت نشد'
      });
    }

    // Check if user already exists with this email in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        tenantId: id
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'کاربری با این ایمیل قبلاً در این مستأجر وجود دارد'
      });
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: 'temp_password_123', // Temporary password - should be changed on first login
        phoneNumber: phone || null,
        tenantId: id,
        active: status !== 'inactive',
        role: 'STAFF', // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        createdAt: true
      }
    });

    // Audit log
    await auditLog({
      adminUserId: req.adminUser!.id,
      action: 'TENANT_USER_CREATED',
      details: { tenantId: id, userId: newUser.id, email },
      ipAddress: req.ip || 'unknown'
    });

    return res.status(201).json({
      success: true,
      message: 'کاربر با موفقیت ایجاد شد',
      data: newUser
    });

  } catch (error: any) {
    console.error('Create tenant user error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ایجاد کاربر'
    });
  }
});
