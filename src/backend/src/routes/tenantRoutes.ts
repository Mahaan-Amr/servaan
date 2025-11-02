import express from 'express';
import { Prisma } from '../../../shared/generated/client';
import { validateSubdomain } from '../middlewares/tenantMiddleware';
import { prisma } from '../services/dbService';

const router = express.Router();

/**
 * Create a new tenant (for admin/onboarding system)
 * POST /api/tenants
 */
router.post('/', async (req, res) => {
  try {
    const {
      subdomain,
      name,
      displayName,
      description,
      ownerName,
      ownerEmail,
      ownerPhone,
      businessType,
      plan = 'STARTER',
      address,
      city,
      state,
      postalCode
    } = req.body;

    // Validate required fields
    if (!subdomain || !name || !displayName || !ownerName || !ownerEmail) {
      return res.status(400).json({
        error: 'فیلدهای مطلوب وارد نشده',
        message: 'Required fields: subdomain, name, displayName, ownerName, ownerEmail',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate subdomain format
    if (!validateSubdomain(subdomain)) {
      return res.status(400).json({
        error: 'نام زیردامنه نامعتبر',
        message: 'Invalid subdomain format',
        code: 'INVALID_SUBDOMAIN'
      });
    }

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    if (existingTenant) {
      return res.status(409).json({
        error: 'این نام زیردامنه قبلاً استفاده شده',
        message: 'Subdomain already exists',
        code: 'SUBDOMAIN_EXISTS'
      });
    }

    // Set plan limits based on plan type
    let maxUsers = 5, maxItems = 1000, maxCustomers = 500;
    switch (plan) {
      case 'BUSINESS':
        maxUsers = 20;
        maxItems = 5000;
        maxCustomers = 2000;
        break;
      case 'ENTERPRISE':
        maxUsers = 100;
        maxItems = 50000;
        maxCustomers = 10000;
        break;
    }

    // Create tenant with features
    const tenant = await prisma.tenant.create({
      data: {
        subdomain,
        name,
        displayName,
        description,
        ownerName,
        ownerEmail,
        ownerPhone,
        businessType,
        plan,
        maxUsers,
        maxItems,
        maxCustomers,
        address,
        city,
        state,
        postalCode,
        features: {
          create: {
            // Default features based on plan
            hasInventoryManagement: true,
            hasCustomerManagement: true,
            hasAccountingSystem: true,
            hasReporting: true,
            hasNotifications: true,
            hasAdvancedReporting: plan !== 'STARTER',
            hasApiAccess: plan === 'ENTERPRISE',
            hasCustomBranding: plan === 'ENTERPRISE',
            hasMultiLocation: plan === 'ENTERPRISE',
            hasAdvancedCRM: plan !== 'STARTER',
            hasWhatsappIntegration: plan !== 'STARTER',
            hasInstagramIntegration: plan === 'ENTERPRISE',
            hasAnalyticsBI: plan !== 'STARTER'
          }
        }
      },
      include: {
        features: true
      }
    });

    res.status(201).json({
      message: 'مجموعه با موفقیت ایجاد شد',
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        displayName: tenant.displayName,
        plan: tenant.plan,
        features: tenant.features,
        url: `https://${tenant.subdomain}.servaan.ir`
      }
    });

  } catch (error) {
    console.error('Tenant creation error:', error);
    res.status(500).json({
      error: 'خطا در ایجاد مجموعه',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Check subdomain availability
 * GET /api/tenants/check/:subdomain
 * NOTE: Must be defined BEFORE /:subdomain route to prevent route conflicts
 */
router.get('/check/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Validate subdomain format
    if (!validateSubdomain(subdomain)) {
      return res.json({
        available: false,
        reason: 'INVALID_FORMAT',
        message: 'نام زیردامنه نامعتبر'
      });
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    res.json({
      available: !existingTenant,
      reason: existingTenant ? 'ALREADY_EXISTS' : null,
      message: existingTenant ? 'این نام زیردامنه قبلاً استفاده شده' : 'نام زیردامنه در دسترس است'
    });

  } catch (error) {
    console.error('Subdomain check error:', error);
    res.status(500).json({
      error: 'خطا در بررسی زیردامنه',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Get tenant by subdomain
 * GET /api/tenants/:subdomain
 * NOTE: This parameterized route must be defined AFTER all specific routes
 */
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    console.log(`🔍 Fetching tenant with subdomain: ${subdomain}`);

    // Test database connection before query
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return res.status(503).json({
        error: 'خطا در اتصال به پایگاه داده',
        message: 'Database connection error',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      include: {
        features: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'مجموعه یافت نشد',
        message: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Format features object (handle null case)
    const featuresObj = tenant.features ? {
      hasInventoryManagement: tenant.features.hasInventoryManagement,
      hasCustomerManagement: tenant.features.hasCustomerManagement,
      hasAccountingSystem: tenant.features.hasAccountingSystem,
      hasReporting: tenant.features.hasReporting,
      hasNotifications: tenant.features.hasNotifications,
      hasAdvancedReporting: tenant.features.hasAdvancedReporting,
      hasApiAccess: tenant.features.hasApiAccess,
      hasCustomBranding: tenant.features.hasCustomBranding,
      hasMultiLocation: tenant.features.hasMultiLocation,
      hasAdvancedCRM: tenant.features.hasAdvancedCRM,
      hasWhatsappIntegration: tenant.features.hasWhatsappIntegration,
      hasInstagramIntegration: tenant.features.hasInstagramIntegration,
      hasAnalyticsBI: tenant.features.hasAnalyticsBI
    } : {
      hasInventoryManagement: true,
      hasCustomerManagement: true,
      hasAccountingSystem: true,
      hasReporting: true,
      hasNotifications: true,
      hasAdvancedReporting: false,
      hasApiAccess: false,
      hasCustomBranding: false,
      hasMultiLocation: false,
      hasAdvancedCRM: false,
      hasWhatsappIntegration: false,
      hasInstagramIntegration: false,
      hasAnalyticsBI: false
    };

    res.json({
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        displayName: tenant.displayName,
        description: tenant.description,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        plan: tenant.plan,
        isActive: tenant.isActive,
        ownerName: tenant.ownerName,
        ownerEmail: tenant.ownerEmail,
        ownerPhone: tenant.ownerPhone,
        businessType: tenant.businessType,
        address: tenant.address,
        city: tenant.city,
        state: tenant.state,
        postalCode: tenant.postalCode,
        country: tenant.country,
        timezone: tenant.timezone,
        locale: tenant.locale,
        currency: tenant.currency
      },
      features: featuresObj
    });

  } catch (error) {
    console.error('❌ Tenant fetch error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    // Check if it's a database connection error
    if (error instanceof Error && (
      error.message.includes('connect') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout') ||
      error.message.includes('P1001') || // Prisma connection error code
      error.name === 'PrismaClientInitializationError'
    )) {
      return res.status(503).json({
        error: 'خطا در اتصال به پایگاه داده',
        message: 'Database connection error',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }

    res.status(500).json({
      error: 'خطا در دریافت اطلاعات مجموعه',
      message: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Update tenant information
 * PUT /api/tenants/:subdomain
 */
router.put('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const updateData = req.body;

    // Remove non-updatable fields
    delete updateData.id;
    delete updateData.subdomain;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const tenant = await prisma.tenant.update({
      where: { subdomain },
      data: updateData,
      include: {
        features: true
      }
    });

    res.json({
      message: 'اطلاعات مجموعه بروزرسانی شد',
      tenant
    });

  } catch (error) {
    console.error('Tenant update error:', error);
    res.status(500).json({
      error: 'خطا در بروزرسانی مجموعه',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Update tenant features
 * PUT /api/tenants/:subdomain/features
 */
router.put('/:subdomain/features', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const featuresData = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      include: { features: true }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'مجموعه یافت نشد',
        message: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    const features = await prisma.tenantFeatures.upsert({
      where: { tenantId: tenant.id },
      update: featuresData,
      create: {
        tenantId: tenant.id,
        ...featuresData
      }
    });

    res.json({
      message: 'ویژگی‌های مجموعه بروزرسانی شد',
      features
    });

  } catch (error) {
    console.error('Tenant features update error:', error);
    res.status(500).json({
      error: 'خطا در بروزرسانی ویژگی‌ها',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * List all tenants (admin only)
 * GET /api/tenants
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { name: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
        { subdomain: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
        { contactEmail: { contains: String(search), mode: Prisma.QueryMode.insensitive } }
      ]
    } : {};

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          features: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.tenant.count({ where })
    ]);

    res.json({
      tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Tenants list error:', error);
    res.status(500).json({
      error: 'خطا در دریافت لیست مجموعه‌ها',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Deactivate tenant
 * DELETE /api/tenants/:subdomain
 */
router.delete('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    const tenant = await prisma.tenant.update({
      where: { subdomain },
      data: { isActive: false }
    });

    res.json({
      message: 'مجموعه غیرفعال شد',
      tenant
    });

  } catch (error) {
    console.error('Tenant deactivation error:', error);
    res.status(500).json({
      error: 'خطا در غیرفعال کردن مجموعه',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export { router as tenantRoutes }; 
