import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../shared/generated/client';

const prisma = new PrismaClient();

// Extend Request type to include tenant information
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

/**
 * Tenant Resolution Middleware
 * Resolves tenant from subdomain and adds tenant context to request
 */
export const resolveTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract subdomain from request - try multiple sources
    const host = req.get('host') || '';
    let subdomain = extractSubdomain(host);
    
    // If no subdomain from Host header, try custom header (for frontend requests)
    if (!subdomain) {
      const customSubdomain = req.get('X-Tenant-Subdomain');
      if (customSubdomain) {
        subdomain = customSubdomain;
        console.log(`🔍 Tenant resolved from X-Tenant-Subdomain header: ${subdomain}`);
      }
    } else {
      console.log(`🔍 Tenant resolved from Host header: ${subdomain}`);
    }
    
    // Skip tenant resolution only if no subdomain is found at all
    if (!subdomain) {
      return next();
    }
    
    // Skip tenant resolution for main domain and API subdomain
    // API subdomain should handle tenant resolution in individual routes
    if (subdomain === 'www' || subdomain === 'admin' || subdomain === 'api') {
      return next();
    }

    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { 
        subdomain: subdomain,
        isActive: true 
      },
      include: {
        features: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'مجموعه یافت نشد',
        message: `Tenant with subdomain '${subdomain}' not found`,
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Check if tenant plan is active
    if (tenant.planExpiresAt && tenant.planExpiresAt < new Date()) {
      return res.status(403).json({
        error: 'اشتراک منقضی شده',
        message: 'Tenant subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // Add tenant context to request
    req.tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
      plan: tenant.plan,
      isActive: tenant.isActive,
      features: tenant.features
    };

    console.log(`✅ Tenant context set: ${tenant.subdomain} (${tenant.name})`);
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({
      error: 'خطا در شناسایی مجموعه',
      message: 'Error resolving tenant',
      code: 'TENANT_RESOLUTION_ERROR'
    });
  }
};

/**
 * Require Tenant Middleware
 * Ensures that a tenant context exists in the request
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'نیاز به شناسایی مجموعه',
      message: 'Tenant context required',
      code: 'TENANT_REQUIRED'
    });
  }
  next();
};

/**
 * Feature Gate Middleware Factory
 * Creates middleware that checks if tenant has specific feature enabled
 */
export const requireFeature = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'نیاز به شناسایی مجموعه',
        message: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }

    if (!req.tenant.features || !req.tenant.features[featureName]) {
      return res.status(403).json({
        error: 'عدم دسترسی به این ویژگی',
        message: `Feature '${featureName}' not available for this tenant`,
        code: 'FEATURE_NOT_AVAILABLE'
      });
    }

    next();
  };
};

/**
 * Plan Gate Middleware Factory
 * Creates middleware that checks if tenant has required plan level or higher
 */
export const requirePlan = (requiredPlan: 'STARTER' | 'BUSINESS' | 'ENTERPRISE') => {
  const planLevels = { STARTER: 1, BUSINESS: 2, ENTERPRISE: 3 };
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'نیاز به شناسایی مجموعه',
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

/**
 * Tenant-aware Prisma Client Factory
 * Creates a Prisma client instance with automatic tenant filtering
 */
export const getTenantPrisma = (tenantId: string) => {
  // This will be used to automatically filter all queries by tenantId
  // For now, we'll return the base client and handle filtering manually
  return prisma;
};

/**
 * Extract subdomain from host header
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Split by dots
  const parts = hostname.split('.');
  
  // For localhost development: handle subdomains like dima.localhost
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // If we have a subdomain before localhost (e.g., dima.localhost)
    if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      return parts[0]; // Return the subdomain (e.g., 'dima')
    }
    // If it's just localhost without subdomain
    if (parts.length === 1 || (parts.length === 2 && parts[1] === 'localhost')) {
      return null; // No subdomain
    }
  }
  
  // For production domains: require at least 3 parts (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }
  
  // Return first part as subdomain
  return parts[0];
}

/**
 * Validate subdomain format
 */
export const validateSubdomain = (subdomain: string): boolean => {
  // RFC 1123 subdomain validation
  const subdomainRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$/;
  
  // Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'cdn'];
  
  return subdomainRegex.test(subdomain) && !reserved.includes(subdomain);
};

export { prisma }; 
