import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AdminRole } from '../types/admin';

const prisma = new PrismaClient();

// Extend Express Request interface to include admin user
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        email: string;
        role: AdminRole;
        isActive: boolean;
      };
    }
  }
}

/**
 * Authenticate admin user via JWT token
 */
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'توکن احراز هویت ارائه نشده',
        message: 'Authentication token not provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env['ADMIN_JWT_SECRET']) {
      console.error('ADMIN_JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'خطای پیکربندی سرور',
        message: 'Server configuration error'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env['ADMIN_JWT_SECRET']) as any;
    
    if (!decoded.adminUserId) {
      res.status(401).json({
        success: false,
        error: 'توکن نامعتبر',
        message: 'Invalid token'
      });
      return;
    }

    // Get admin user from database
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.adminUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'کاربر غیرفعال یا یافت نشد',
        message: 'User not found or inactive'
      });
    }

    // Add admin user to request
    req.adminUser = adminUser;
    next();

  } catch (error) {
    console.error('Admin authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'توکن نامعتبر',
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'توکن منقضی شده',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'خطای احراز هویت',
      message: 'Authentication error'
    });
  }
}

/**
 * Require specific admin role(s)
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.adminUser) {
      return res.status(401).json({
        success: false,
        error: 'احراز هویت مورد نیاز',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.adminUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'دسترسی رد شد',
        message: 'Access denied',
        details: `Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!process.env['ADMIN_JWT_SECRET']) {
      return next(); // Continue without authentication
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env['ADMIN_JWT_SECRET']) as any;
    
    if (decoded.adminUserId) {
      // Get admin user from database
      const adminUser = await prisma.adminUser.findUnique({
        where: { id: decoded.adminUserId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      if (adminUser && adminUser.isActive) {
        req.adminUser = adminUser;
      }
    }

    next();

  } catch (error) {
    // Continue without authentication on error
    next();
  }
}
