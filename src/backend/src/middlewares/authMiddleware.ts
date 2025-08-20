import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { prisma } from '../services/dbService';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'ADMIN' | 'MANAGER' | 'STAFF';
        tenantId: string;
      };
    }
  }
}

// Middleware to authenticate token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('توکن احراز هویت ارائه نشده است', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database with tenant filtering if available
    let user;
    if (req.tenant?.id) {
      // If tenant context is available, filter by tenant
      user = await prisma.user.findFirst({
        where: { 
          id: decoded.id,
          tenantId: req.tenant.id  // Filter by tenant
        },
        select: { id: true, role: true, active: true, tenantId: true }
      });
    } else {
      // If no tenant context, find user without tenant filtering (for universal login)
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, active: true, tenantId: true }
      });
    }
    
    if (!user) {
      throw new AppError('کاربر یافت نشد', 404);
    }
    
    if (!user.active) {
      throw new AppError('حساب کاربری غیرفعال است', 403);
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId
    };
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('توکن نامعتبر', 401));
    }
  }
};

// Middleware for role-based access control
export const authorize = (roles: ('ADMIN' | 'MANAGER' | 'STAFF')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('لطفا ابتدا وارد شوید', 401);
      }
      
      if (!roles.includes(req.user.role)) {
        throw new AppError('شما دسترسی لازم برای این عملیات را ندارید', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}; 