import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/dbService';

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        subdomain: string;
        name: string;
        plan: string;
        isActive: boolean;
        features: any;
      };
    }
  }
}

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'cdn']);

const isLoopbackHost = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
  /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);

const normalizeTenantSubdomain = (value: string | null, host: string): string | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const hostname = host.split(':')[0].trim().toLowerCase();

  if (normalized === '127' || normalized === 'localhost' || isLoopbackHost(normalized)) {
    return isLoopbackHost(hostname) ? 'dima' : null;
  }

  return normalized;
};

/**
 * Tenant Resolution Middleware
 * Resolves tenant from subdomain and adds tenant context to request
 */
export const resolveTenant = async (req: Request, res: Response, next: NextFunction) => {
  let subdomain: string | null = null;

  try {
    const host = req.get('host') || '';
    const customSubdomain = req.get('X-Tenant-Subdomain');
    subdomain = extractSubdomain(host, req.path);

    console.log('[مستاجر] هدر Host:', host, 'ساب‌دامین استخراج‌شده:', subdomain || 'ندارد');
    console.log('[مستاجر] هدر X-Tenant-Subdomain:', customSubdomain || 'ندارد');

    if (customSubdomain) {
      subdomain = normalizeTenantSubdomain(customSubdomain, host);
      console.log('[مستاجر] مستاجر از هدر سفارشی شناسایی شد:', subdomain);
    } else if (subdomain) {
      console.log('[مستاجر] مستاجر از هدر Host شناسایی شد:', subdomain);
    }

    if (!subdomain) {
      console.log('[مستاجر] ساب‌دامین پیدا نشد، ادامه بدون شناسایی مستاجر');
      return next();
    }

    if (!customSubdomain && RESERVED_SUBDOMAINS.has(subdomain)) {
      console.log('[مستاجر] ساب‌دامین رزرو شده است، ادامه بدون شناسایی مستاجر:', subdomain);
      return next();
    }

    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('[مستاجر] خطا در اتصال به پایگاه داده:', dbError);

      if (req.path && req.path.startsWith('/api/tenants')) {
        console.log('[مستاجر] مسیر /api/tenants است، ادامه درخواست');
        return next();
      }

      return res.status(503).json({
        error: 'خطا در اتصال به پایگاه داده',
        message: 'Database connection error',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }

    console.log('[مستاجر] جست‌وجوی مستاجر با ساب‌دامین:', subdomain);
    const tenant = await prisma.tenant.findFirst({
      where: {
        subdomain,
        isActive: true
      },
      include: {
        features: true
      }
    });

    console.log('[مستاجر] نتیجه جست‌وجو:', tenant ? `${tenant.id} - ${tenant.name}` : 'پیدا نشد');

    if (!tenant) {
      console.log('[مستاجر] مستاجر پیدا نشد:', subdomain);
      return res.status(404).json({
        error: 'مستاجر پیدا نشد',
        message: `Tenant with subdomain '${subdomain}' not found`,
        code: 'TENANT_NOT_FOUND'
      });
    }

    if (tenant.planExpiresAt && tenant.planExpiresAt < new Date()) {
      return res.status(403).json({
        error: 'اشتراک منقضی شده است',
        message: 'Tenant subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    req.tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
      plan: tenant.plan,
      isActive: tenant.isActive,
      features: tenant.features
    };

    console.log('[مستاجر] زمینه مستاجر ثبت شد:', `${tenant.subdomain} (${tenant.name})`);
    next();
  } catch (error) {
    console.error('[مستاجر] خطا در شناسایی مستاجر:', error);

    if (
      error instanceof Error &&
      (error.message.includes('connect') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout') ||
        error.message.includes('P1001') ||
        error.name === 'PrismaClientInitializationError')
    ) {
      if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
        console.log('[مستاجر] خطای پایگاه داده، اما ساب‌دامین رزرو شده است؛ ادامه درخواست');
        return next();
      }

      if (req.path && req.path.startsWith('/api/tenants')) {
        console.log('[مستاجر] مسیر /api/tenants است، ادامه درخواست');
        return next();
      }

      return res.status(503).json({
        error: 'خطا در اتصال به پایگاه داده',
        message: 'Database connection error',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }

    res.status(500).json({
      error: 'خطا در شناسایی مستاجر',
      message: error instanceof Error ? error.message : 'Error resolving tenant',
      code: 'TENANT_RESOLUTION_ERROR'
    });
  }
};

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'نیاز به شناسایی مستاجر',
      message: 'Tenant context required',
      code: 'TENANT_REQUIRED'
    });
  }
  next();
};

export const requireFeature = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'نیاز به شناسایی مستاجر',
        message: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }

    if (!req.tenant.features || !req.tenant.features[featureName]) {
      return res.status(403).json({
        error: 'دسترسی به این ویژگی مجاز نیست',
        message: `Feature '${featureName}' not available for this tenant`,
        code: 'FEATURE_NOT_AVAILABLE'
      });
    }

    next();
  };
};

export const requirePlan = (requiredPlan: 'STARTER' | 'BUSINESS' | 'ENTERPRISE') => {
  const planLevels = { STARTER: 1, BUSINESS: 2, ENTERPRISE: 3 };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'نیاز به شناسایی مستاجر',
        message: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }

    const currentLevel = planLevels[req.tenant.plan as keyof typeof planLevels] || 0;
    const requiredLevel = planLevels[requiredPlan];

    if (currentLevel < requiredLevel) {
      return res.status(403).json({
        error: 'نیاز به ارتقای اشتراک',
        message: `Plan '${requiredPlan}' or higher required`,
        code: 'PLAN_UPGRADE_REQUIRED',
        currentPlan: req.tenant.plan,
        requiredPlan
      });
    }

    next();
  };
};

export const getTenantPrisma = (_tenantId: string) => {
  return prisma;
};

function extractSubdomain(host: string, path = ''): string | null {
  if (!host) return null;

  const hostname = host.split(':')[0].trim().toLowerCase();

  if (path.startsWith('/native')) {
    return null;
  }

  if (isLoopbackHost(hostname)) {
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    const candidate = hostname.split('.')[0];
    return RESERVED_SUBDOMAINS.has(candidate) ? null : candidate;
  }

  const parts = hostname.split('.');
  if (parts.length < 3) {
    return null;
  }

  const candidate = parts[0];
  if (RESERVED_SUBDOMAINS.has(candidate)) {
    return null;
  }

  return candidate;
}

export const validateSubdomain = (subdomain: string): boolean => {
  const subdomainRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$/;
  return subdomainRegex.test(subdomain) && !RESERVED_SUBDOMAINS.has(subdomain);
};

export { prisma };

