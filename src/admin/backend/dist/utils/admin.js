"use strict";
// Admin utility functions for Servaan Platform
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateAdminResults = exports.formatAdminSuccess = exports.formatAdminError = exports.validateAdminResourceAccess = exports.generateAuditLogEntry = exports.isIpWhitelisted = exports.parseAdminTimestamp = exports.formatAdminTimestamp = exports.generateSecureString = exports.sanitizeAdminInput = exports.validateAdminPassword = exports.validateAdminEmail = exports.hasAdminRole = exports.verifyAdminToken = exports.generateAdminToken = exports.compareAdminPassword = exports.hashAdminPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const admin_1 = require("../config/admin");
/**
 * Hash password for admin users
 */
const hashAdminPassword = async (password) => {
    const saltRounds = admin_1.adminConfig.security.bcryptRounds;
    return await bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashAdminPassword = hashAdminPassword;
/**
 * Compare password with hash for admin users
 */
const compareAdminPassword = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.compareAdminPassword = compareAdminPassword;
/**
 * Generate JWT token for admin users
 */
const generateAdminToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
    };
    return jsonwebtoken_1.default.sign(payload, admin_1.adminConfig.jwt.secret, {
        expiresIn: admin_1.adminConfig.jwt.expiresIn,
        issuer: 'servaan-admin',
        audience: 'servaan-admin-users'
    });
};
exports.generateAdminToken = generateAdminToken;
/**
 * Verify JWT token for admin users
 */
const verifyAdminToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, admin_1.adminConfig.jwt.secret, {
            issuer: 'servaan-admin',
            audience: 'servaan-admin-users'
        });
        return decoded;
    }
    catch (error) {
        console.error('Admin token verification failed:', error);
        return null;
    }
};
exports.verifyAdminToken = verifyAdminToken;
/**
 * Check if admin user has required role
 */
const hasAdminRole = (userRole, requiredRole) => {
    const roleHierarchy = {
        'SUPER_ADMIN': 4,
        'PLATFORM_ADMIN': 3,
        'SUPPORT': 2,
        'DEVELOPER': 1
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
exports.hasAdminRole = hasAdminRole;
/**
 * Validate admin email format
 */
const validateAdminEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateAdminEmail = validateAdminEmail;
/**
 * Validate admin password strength
 */
const validateAdminPassword = (password) => {
    const errors = [];
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
exports.validateAdminPassword = validateAdminPassword;
/**
 * Sanitize admin input
 */
const sanitizeAdminInput = (input) => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove potential JavaScript
        .replace(/on\w+=/gi, ''); // Remove potential event handlers
};
exports.sanitizeAdminInput = sanitizeAdminInput;
/**
 * Generate secure random string for admin operations
 */
const generateSecureString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateSecureString = generateSecureString;
/**
 * Format admin timestamp
 */
const formatAdminTimestamp = (date) => {
    return date.toISOString();
};
exports.formatAdminTimestamp = formatAdminTimestamp;
/**
 * Parse admin timestamp
 */
const parseAdminTimestamp = (timestamp) => {
    return new Date(timestamp);
};
exports.parseAdminTimestamp = parseAdminTimestamp;
/**
 * Check if IP is whitelisted for admin access
 */
const isIpWhitelisted = (ip) => {
    return admin_1.adminConfig.security.ipWhitelist.includes(ip);
};
exports.isIpWhitelisted = isIpWhitelisted;
/**
 * Generate admin audit log entry
 */
const generateAuditLogEntry = (adminUserId, action, resourceType, resourceId, details, ipAddress, userAgent) => {
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
exports.generateAuditLogEntry = generateAuditLogEntry;
/**
 * Validate admin resource access
 */
const validateAdminResourceAccess = (userRole, resourceType, _action) => {
    // Define resource access rules based on role
    const accessRules = {
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
exports.validateAdminResourceAccess = validateAdminResourceAccess;
/**
 * Format admin error response
 */
const formatAdminError = (code, message, details) => {
    return {
        success: false,
        error: message,
        code,
        details,
        timestamp: new Date().toISOString()
    };
};
exports.formatAdminError = formatAdminError;
/**
 * Format admin success response
 */
const formatAdminSuccess = (data, message) => {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
};
exports.formatAdminSuccess = formatAdminSuccess;
/**
 * Paginate admin results
 */
const paginateAdminResults = (data, page, limit, total) => {
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
exports.paginateAdminResults = paginateAdminResults;
//# sourceMappingURL=admin.js.map