"use strict";
// Admin Authentication Middleware for Servaan Platform
// This is SEPARATE from tenant authentication - completely isolated
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAdminAuth = exports.requireSupportAccess = exports.requirePlatformAdmin = exports.requireSuperAdmin = exports.authorizeAdmin = exports.authenticateAdmin = void 0;
const prisma_1 = require("../lib/prisma");
const admin_1 = require("../utils/admin");
const admin_2 = require("../config/admin");
/**
 * Admin Authentication Middleware
 * Verifies JWT token and loads admin user from database
 */
const authenticateAdmin = async (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'ADMIN_TOKEN_REQUIRED',
                message: 'Admin authentication token required'
            });
        }
        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'INVALID_TOKEN_FORMAT',
                message: 'Invalid token format'
            });
        }
        // Verify admin token
        const decoded = (0, admin_1.verifyAdminToken)(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'INVALID_ADMIN_TOKEN',
                message: 'Invalid or expired admin token'
            });
        }
        // Get admin user from database
        const adminUser = await prisma_1.prisma.adminUser.findUnique({
            where: { id: decoded.adminUserId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                lastLogin: true
            }
        });
        if (!adminUser) {
            return res.status(401).json({
                success: false,
                error: 'ADMIN_USER_NOT_FOUND',
                message: 'Admin user not found'
            });
        }
        if (!adminUser.isActive) {
            return res.status(403).json({
                success: false,
                error: 'ADMIN_ACCOUNT_DISABLED',
                message: 'Admin account is disabled'
            });
        }
        // Check IP whitelist if configured
        if (admin_2.adminConfig.security.ipWhitelist.length > 0) {
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            if (!admin_2.adminConfig.security.ipWhitelist.includes(clientIP)) {
                return res.status(403).json({
                    success: false,
                    error: 'IP_NOT_WHITELISTED',
                    message: 'Access denied from this IP address'
                });
            }
        }
        // Attach admin user to request
        req.adminUser = {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            isActive: adminUser.isActive
        };
        next();
    }
    catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(401).json({
            success: false,
            error: 'ADMIN_AUTH_ERROR',
            message: 'Admin authentication failed'
        });
    }
};
exports.authenticateAdmin = authenticateAdmin;
/**
 * Admin Role Authorization Middleware
 * Checks if admin user has required role(s)
 */
const authorizeAdmin = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.adminUser) {
                return res.status(401).json({
                    success: false,
                    error: 'ADMIN_AUTH_REQUIRED',
                    message: 'Admin authentication required'
                });
            }
            if (!roles.includes(req.adminUser.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'INSUFFICIENT_ADMIN_PERMISSIONS',
                    message: `Required role: ${roles.join(' or ')}, Current role: ${req.adminUser.role}`
                });
            }
            next();
        }
        catch (error) {
            console.error('Admin authorization error:', error);
            return res.status(403).json({
                success: false,
                error: 'ADMIN_AUTH_ERROR',
                message: 'Admin authorization failed'
            });
        }
    };
};
exports.authorizeAdmin = authorizeAdmin;
/**
 * Super Admin Only Middleware
 * Only allows SUPER_ADMIN role
 */
exports.requireSuperAdmin = (0, exports.authorizeAdmin)(['SUPER_ADMIN']);
/**
 * Platform Admin or Higher Middleware
 * Allows SUPER_ADMIN and PLATFORM_ADMIN roles
 */
exports.requirePlatformAdmin = (0, exports.authorizeAdmin)(['SUPER_ADMIN', 'PLATFORM_ADMIN']);
/**
 * Support or Higher Middleware
 * Allows all admin roles except DEVELOPER
 */
exports.requireSupportAccess = (0, exports.authorizeAdmin)(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT']);
/**
 * Optional Admin Authentication Middleware
 * Authenticates if token is provided, but doesn't require it
 */
const optionalAdminAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without admin user
            return next();
        }
        // Try to authenticate, but don't fail if it doesn't work
        const token = authHeader.split(' ')[1];
        if (!token) {
            return next();
        }
        const decoded = (0, admin_1.verifyAdminToken)(token);
        if (decoded) {
            const adminUser = await prisma_1.prisma.adminUser.findUnique({
                where: { id: decoded.adminUserId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            });
            if (adminUser && adminUser.isActive) {
                req.adminUser = {
                    id: adminUser.id,
                    email: adminUser.email,
                    role: adminUser.role,
                    isActive: adminUser.isActive
                };
            }
        }
        next();
    }
    catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
exports.optionalAdminAuth = optionalAdminAuth;
//# sourceMappingURL=adminAuth.js.map