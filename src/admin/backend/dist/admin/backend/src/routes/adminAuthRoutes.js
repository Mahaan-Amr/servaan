"use strict";
// Admin Authentication Routes for Servaan Platform
// Handles admin login, logout, and profile management
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const adminAuthService_1 = require("../services/adminAuthService");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// Validation schemas
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    twoFactorCode: zod_1.z.string().optional()
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters')
});
/**
 * POST /api/admin/auth/login
 * Admin login endpoint
 */
router.post('/login', async (req, res) => {
    try {
        // Validate request body
        const validatedData = loginSchema.parse(req.body);
        // Prepare login request
        const loginRequest = {
            email: validatedData.email,
            password: validatedData.password,
            twoFactorCode: validatedData.twoFactorCode || undefined
        };
        // Attempt admin login
        const loginResponse = await (0, adminAuthService_1.adminLogin)(loginRequest);
        // Note: Audit logging is handled in the service layer
        return res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                user: loginResponse.user,
                token: loginResponse.token
            }
        });
    }
    catch (error) {
        console.error('Admin login route error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: error.issues
            });
        }
        // Handle specific authentication errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        switch (errorMessage) {
            case 'INVALID_CREDENTIALS':
                return res.status(401).json({
                    success: false,
                    error: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                });
            case 'ACCOUNT_DISABLED':
                return res.status(403).json({
                    success: false,
                    error: 'ACCOUNT_DISABLED',
                    message: 'Admin account is disabled'
                });
            case 'TWO_FACTOR_REQUIRED':
                return res.status(200).json({
                    success: false,
                    error: 'TWO_FACTOR_REQUIRED',
                    message: 'Two-factor authentication required',
                    requiresTwoFactor: true
                });
            case 'INVALID_TWO_FACTOR_CODE':
                return res.status(401).json({
                    success: false,
                    error: 'INVALID_TWO_FACTOR_CODE',
                    message: 'Invalid two-factor authentication code'
                });
            default:
                return res.status(500).json({
                    success: false,
                    error: 'LOGIN_ERROR',
                    message: 'An error occurred during login'
                });
        }
    }
});
/**
 * POST /api/admin/auth/logout
 * Admin logout endpoint
 */
router.post('/logout', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        if (!req.adminUser) {
            return res.status(401).json({
                success: false,
                error: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required'
            });
        }
        // Get client IP and user agent
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        // Perform logout
        await (0, adminAuthService_1.adminLogout)(req.adminUser.id, clientIP, userAgent);
        return res.json({
            success: true,
            message: 'Admin logout successful'
        });
    }
    catch (error) {
        console.error('Admin logout route error:', error);
        return res.status(500).json({
            success: false,
            error: 'LOGOUT_ERROR',
            message: 'An error occurred during logout'
        });
    }
});
/**
 * GET /api/admin/auth/profile
 * Get admin user profile
 */
router.get('/profile', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        if (!req.adminUser) {
            return res.status(401).json({
                success: false,
                error: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required'
            });
        }
        const profile = await (0, adminAuthService_1.getAdminProfile)(req.adminUser.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'PROFILE_NOT_FOUND',
                message: 'Admin profile not found'
            });
        }
        // Remove sensitive information
        const safeProfile = {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            isActive: profile.isActive,
            lastLogin: profile.lastLogin,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
            // Note: twoFactorSecret is intentionally excluded
        };
        return res.json({
            success: true,
            message: 'Admin profile retrieved successfully',
            data: safeProfile
        });
    }
    catch (error) {
        console.error('Get admin profile route error:', error);
        return res.status(500).json({
            success: false,
            error: 'PROFILE_ERROR',
            message: 'An error occurred while retrieving profile'
        });
    }
});
/**
 * PUT /api/admin/auth/change-password
 * Change admin password
 */
router.put('/change-password', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        if (!req.adminUser) {
            return res.status(401).json({
                success: false,
                error: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required'
            });
        }
        // Validate request body
        const validatedData = changePasswordSchema.parse(req.body);
        // Change password
        await (0, adminAuthService_1.changeAdminPassword)(req.adminUser.id, validatedData.currentPassword, validatedData.newPassword);
        return res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change admin password route error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: error.issues
            });
        }
        // Handle specific password change errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        switch (errorMessage) {
            case 'ADMIN_USER_NOT_FOUND':
                return res.status(404).json({
                    success: false,
                    error: 'ADMIN_USER_NOT_FOUND',
                    message: 'Admin user not found'
                });
            case 'INVALID_CURRENT_PASSWORD':
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_CURRENT_PASSWORD',
                    message: 'Current password is incorrect'
                });
            default:
                return res.status(500).json({
                    success: false,
                    error: 'PASSWORD_CHANGE_ERROR',
                    message: 'An error occurred while changing password'
                });
        }
    }
});
/**
 * GET /api/admin/auth/verify
 * Verify admin token and return user info
 */
router.get('/verify', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        if (!req.adminUser) {
            return res.status(401).json({
                success: false,
                error: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required'
            });
        }
        return res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: req.adminUser,
                authenticated: true
            }
        });
    }
    catch (error) {
        console.error('Verify admin token route error:', error);
        return res.status(500).json({
            success: false,
            error: 'VERIFICATION_ERROR',
            message: 'An error occurred while verifying token'
        });
    }
});
/**
 * GET /api/admin/auth/health
 * Authentication system health check
 */
router.get('/health', async (_req, res) => {
    try {
        return res.json({
            success: true,
            message: 'Admin authentication system is healthy',
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    }
    catch (error) {
        console.error('Admin auth health check error:', error);
        return res.status(500).json({
            success: false,
            error: 'HEALTH_CHECK_ERROR',
            message: 'Authentication system health check failed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=adminAuthRoutes.js.map