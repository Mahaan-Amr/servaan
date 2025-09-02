// Admin Authentication Service for Servaan Platform
// Handles admin login, logout, and authentication logic

import { PrismaClient } from '@prisma/client';
import { compareAdminPassword, generateAdminToken, hashAdminPassword } from '../utils/admin';
import { adminConfig } from '../config/admin';
import { AdminLoginRequest, AdminLoginResponse, AdminUser } from '../types/admin';

const prisma = new PrismaClient();

/**
 * Admin Login Service
 * Authenticates admin user and returns JWT token
 */
export const adminLogin = async (loginData: AdminLoginRequest): Promise<AdminLoginResponse> => {
  try {
    // Find admin user by email
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: loginData.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        twoFactorSecret: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!adminUser) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!adminUser.isActive) {
      throw new Error('ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await compareAdminPassword(loginData.password, adminUser.passwordHash);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Check 2FA if enabled
    if (adminUser.twoFactorSecret && !loginData.twoFactorCode) {
      throw new Error('TWO_FACTOR_REQUIRED');
    }

    // TODO: Implement 2FA verification when 2FA is enabled
    // if (adminUser.twoFactorSecret && loginData.twoFactorCode) {
    //   const isValid2FA = verifyTwoFactorCode(adminUser.twoFactorSecret, loginData.twoFactorCode);
    //   if (!isValid2FA) {
    //     throw new Error('INVALID_TWO_FACTOR_CODE');
    //   }
    // }

    // Generate JWT token
    const token = generateAdminToken(adminUser);

    // Update last login time
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() }
    });

    // Create audit log
    await createAdminAuditLog({
      adminUserId: adminUser.id,
      action: 'LOGIN',
      resourceType: 'ADMIN_USER',
      resourceId: adminUser.id,
      details: {
        loginMethod: 'email_password',
        twoFactorUsed: !!adminUser.twoFactorSecret,
        ipAddress: 'unknown', // Will be filled by middleware
        userAgent: 'unknown'  // Will be filled by middleware
      }
    });

    // Return success response
    return {
      success: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive,
        twoFactorSecret: adminUser.twoFactorSecret,
        lastLogin: adminUser.lastLogin,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt
      },
      expiresIn: adminConfig.jwt.expiresIn
    };

  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

/**
 * Admin Logout Service
 * Creates audit log for logout action
 */
export const adminLogout = async (adminUserId: string, ipAddress?: string, userAgent?: string): Promise<void> => {
  try {
    // Create audit log for logout
    await createAdminAuditLog({
      adminUserId,
      action: 'LOGOUT',
      resourceType: 'ADMIN_USER',
      resourceId: adminUserId,
      details: {
        logoutMethod: 'manual',
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown'
      }
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    // Don't throw error for logout - it's not critical
  }
};

/**
 * Get Admin User Profile
 * Returns admin user information
 */
export const getAdminProfile = async (adminUserId: string): Promise<AdminUser | null> => {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        twoFactorSecret: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!adminUser) {
      return null;
    }

    return {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive,
      twoFactorSecret: adminUser.twoFactorSecret,
      lastLogin: adminUser.lastLogin,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt
    };
  } catch (error) {
    console.error('Get admin profile error:', error);
    throw error;
  }
};

/**
 * Change Admin Password
 * Updates admin user password
 */
export const changeAdminPassword = async (
  adminUserId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // Get admin user with password hash
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        passwordHash: true
      }
    });

    if (!adminUser) {
      throw new Error('ADMIN_USER_NOT_FOUND');
    }

    // Verify current password
    const isCurrentPasswordValid = await compareAdminPassword(currentPassword, adminUser.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }

    // Hash new password
    const newPasswordHash = await hashAdminPassword(newPassword);

    // Update password
    await prisma.adminUser.update({
      where: { id: adminUserId },
      data: { passwordHash: newPasswordHash }
    });

    // Create audit log
    await createAdminAuditLog({
      adminUserId,
      action: 'PASSWORD_CHANGE',
      resourceType: 'ADMIN_USER',
      resourceId: adminUserId,
      details: {
        passwordChanged: true,
        ipAddress: 'unknown', // Will be filled by middleware
        userAgent: 'unknown'  // Will be filled by middleware
      }
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    throw error;
  }
};

/**
 * Create Admin Audit Log
 * Helper function to create audit logs
 */
const createAdminAuditLog = async (logData: {
  adminUserId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: logData.adminUserId,
        action: logData.action,
        resourceType: logData.resourceType || null,
        resourceId: logData.resourceId || null,
        details: logData.details as any || null,
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null
      }
    });
  } catch (error) {
    console.error('Create admin audit log error:', error);
    // Don't throw error for audit logging - it's not critical
  }
};

/**
 * Validate Admin Credentials
 * Helper function to validate admin credentials without logging in
 */
export const validateAdminCredentials = async (email: string, password: string): Promise<boolean> => {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        isActive: true
      }
    });

    if (!adminUser || !adminUser.isActive) {
      return false;
    }

    return await compareAdminPassword(password, adminUser.passwordHash);
  } catch (error) {
    console.error('Validate admin credentials error:', error);
    return false;
  }
};
