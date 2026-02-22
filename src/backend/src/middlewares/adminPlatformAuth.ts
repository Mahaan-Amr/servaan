import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type AdminPlatformRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';

interface AdminPlatformTokenPayload {
  adminUserId?: string;
  role?: AdminPlatformRole;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      adminPlatformUser?: {
        id: string;
        role: AdminPlatformRole;
        email?: string;
      };
    }
  }
}

const DEFAULT_ISSUER = 'servaan-admin';
const DEFAULT_AUDIENCE = 'servaan-admin-users';

const authError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({
    success: false,
    error: code,
    message
  });

export const authenticateAdminPlatform = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[SECURITY] Tenant management denied: missing admin token', { method: req.method, path: req.path });
    return authError(res, 401, 'ADMIN_TOKEN_REQUIRED', 'Admin authentication token required');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    console.error('[SECURITY] ADMIN_JWT_SECRET is not configured');
    return authError(res, 500, 'ADMIN_AUTH_MISCONFIGURED', 'Admin authentication is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: process.env.ADMIN_JWT_ISSUER || DEFAULT_ISSUER,
      audience: process.env.ADMIN_JWT_AUDIENCE || DEFAULT_AUDIENCE
    }) as AdminPlatformTokenPayload;

    if (!decoded.adminUserId || !decoded.role) {
      console.warn('[SECURITY] Tenant management denied: malformed admin token', { method: req.method, path: req.path });
      return authError(res, 401, 'INVALID_ADMIN_TOKEN', 'Invalid admin token');
    }

    req.adminPlatformUser = {
      id: decoded.adminUserId,
      role: decoded.role,
      email: decoded.email
    };

    console.info('[SECURITY] Tenant management auth success', {
      method: req.method,
      path: req.path,
      adminRole: decoded.role
    });
    return next();
  } catch (_error) {
    console.warn('[SECURITY] Tenant management denied: admin token verification failed', {
      method: req.method,
      path: req.path
    });
    return authError(res, 401, 'INVALID_ADMIN_TOKEN', 'Invalid or expired admin token');
  }
};

export const authorizeAdminPlatform = (allowedRoles: AdminPlatformRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminPlatformUser) {
      return authError(res, 401, 'ADMIN_AUTH_REQUIRED', 'Admin authentication required');
    }

    if (!allowedRoles.includes(req.adminPlatformUser.role)) {
      console.warn('[SECURITY] Tenant management denied: insufficient admin role', {
        method: req.method,
        path: req.path,
        role: req.adminPlatformUser.role
      });
      return authError(res, 403, 'INSUFFICIENT_ADMIN_ROLE', 'Admin role is not allowed for this endpoint');
    }

    return next();
  };
};
