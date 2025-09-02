// Admin utility functions for Servaan Platform

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminConfig } from '../config/admin';
import { AdminUser, AdminRole, AdminAuthToken } from '../types/admin';

/**
 * Hash password for admin users
 */
export const hashAdminPassword = async (password: string): Promise<string> => {
  const saltRounds = adminConfig.security.bcryptRounds;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash for admin users
 */
export const compareAdminPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token for admin users
 */
export const generateAdminToken = (user: AdminUser): string => {
  const payload = {
    adminUserId: user.id,  // Changed from 'userId' to 'adminUserId' to match middleware
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, adminConfig.jwt.secret, {
    expiresIn: adminConfig.jwt.expiresIn,
    issuer: 'servaan-admin',
    audience: 'servaan-admin-users'
  } as jwt.SignOptions);
};

/**
 * Verify JWT token for admin users
 */
export const verifyAdminToken = (token: string): AdminAuthToken | null => {
  try {
    const decoded = jwt.verify(token, adminConfig.jwt.secret, {
      issuer: 'servaan-admin',
      audience: 'servaan-admin-users'
    }) as AdminAuthToken;
    
    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
};

/**
 * Check if admin user has required role
 */
export const hasAdminRole = (userRole: AdminRole, requiredRole: AdminRole): boolean => {
  const roleHierarchy: Record<AdminRole, number> = {
    'SUPER_ADMIN': 4,
    'PLATFORM_ADMIN': 3,
    'SUPPORT': 2,
    'DEVELOPER': 1
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Validate admin email format
 */
export const validateAdminEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate admin password strength
 */
export const validateAdminPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize admin input
 */
export const sanitizeAdminInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JavaScript
    .replace(/on\w+=/gi, ''); // Remove potential event handlers
};

/**
 * Generate secure random string for admin operations
 */
export const generateSecureString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Format admin timestamp
 */
export const formatAdminTimestamp = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse admin timestamp
 */
export const parseAdminTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

/**
 * Check if IP is whitelisted for admin access
 */
export const isIpWhitelisted = (ip: string): boolean => {
  return adminConfig.security.ipWhitelist.includes(ip);
};

/**
 * Generate admin audit log entry
 */
export const generateAuditLogEntry = (
  adminUserId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) => {
  return {
    adminUserId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
    createdAt: new Date()
  };
};

/**
 * Validate admin resource access
 */
export const validateAdminResourceAccess = (
  userRole: AdminRole,
  resourceType: string,
  _action: string
): boolean => {
  // Define resource access rules based on role
  const accessRules: Record<AdminRole, string[]> = {
    'SUPER_ADMIN': ['*'], // Access to everything
    'PLATFORM_ADMIN': ['tenants', 'system', 'analytics', 'billing', 'support'],
    'SUPPORT': ['tenants', 'support'],
    'DEVELOPER': ['system', 'analytics']
  };

  const allowedResources = accessRules[userRole];
  
  if (allowedResources.includes('*')) {
    return true;
  }
  
  return allowedResources.includes(resourceType);
};

/**
 * Format admin error response
 */
export const formatAdminError = (
  code: string,
  message: string,
  details?: Record<string, any>
) => {
  return {
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format admin success response
 */
export const formatAdminSuccess = <T>(
  data: T,
  message?: string
) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Paginate admin results
 */
export const paginateAdminResults = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    timestamp: new Date().toISOString()
  };
};
