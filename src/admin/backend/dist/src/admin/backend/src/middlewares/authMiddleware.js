"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = authenticateAdmin;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
/**
 * Authenticate admin user via JWT token
 */
async function authenticateAdmin(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env['ADMIN_JWT_SECRET']);
        if (!decoded.adminUserId) {
            res.status(401).json({
                success: false,
                error: 'توکن نامعتبر',
                message: 'Invalid token'
            });
            return;
        }
        // Get admin user from database
        const adminUser = await prisma_1.prisma.adminUser.findUnique({
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
    }
    catch (error) {
        console.error('Admin authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'توکن نامعتبر',
                message: 'Invalid token'
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
function requireRole(roles) {
    return (req, res, next) => {
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
async function optionalAuth(req, _res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env['ADMIN_JWT_SECRET']);
        if (decoded.adminUserId) {
            // Get admin user from database
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
                req.adminUser = adminUser;
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication on error
        next();
    }
}
//# sourceMappingURL=authMiddleware.js.map