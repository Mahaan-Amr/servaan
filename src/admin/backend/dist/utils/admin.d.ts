import { AdminUser, AdminRole, AdminAuthToken } from '../types/admin';
/**
 * Hash password for admin users
 */
export declare const hashAdminPassword: (password: string) => Promise<string>;
/**
 * Compare password with hash for admin users
 */
export declare const compareAdminPassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Generate JWT token for admin users
 */
export declare const generateAdminToken: (user: AdminUser) => string;
/**
 * Verify JWT token for admin users
 */
export declare const verifyAdminToken: (token: string) => AdminAuthToken | null;
/**
 * Check if admin user has required role
 */
export declare const hasAdminRole: (userRole: AdminRole, requiredRole: AdminRole) => boolean;
/**
 * Validate admin email format
 */
export declare const validateAdminEmail: (email: string) => boolean;
/**
 * Validate admin password strength
 */
export declare const validateAdminPassword: (password: string) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Sanitize admin input
 */
export declare const sanitizeAdminInput: (input: string) => string;
/**
 * Generate secure random string for admin operations
 */
export declare const generateSecureString: (length?: number) => string;
/**
 * Format admin timestamp
 */
export declare const formatAdminTimestamp: (date: Date) => string;
/**
 * Parse admin timestamp
 */
export declare const parseAdminTimestamp: (timestamp: string) => Date;
/**
 * Check if IP is whitelisted for admin access
 */
export declare const isIpWhitelisted: (ip: string) => boolean;
/**
 * Generate admin audit log entry
 */
export declare const generateAuditLogEntry: (adminUserId: string, action: string, resourceType?: string, resourceId?: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string) => {
    adminUserId: string;
    action: string;
    resourceType: string | undefined;
    resourceId: string | undefined;
    details: Record<string, any> | undefined;
    ipAddress: string | undefined;
    userAgent: string | undefined;
    createdAt: Date;
};
/**
 * Validate admin resource access
 */
export declare const validateAdminResourceAccess: (userRole: AdminRole, resourceType: string, _action: string) => boolean;
/**
 * Format admin error response
 */
export declare const formatAdminError: (code: string, message: string, details?: Record<string, any>) => {
    success: boolean;
    error: string;
    code: string;
    details: Record<string, any> | undefined;
    timestamp: string;
};
/**
 * Format admin success response
 */
export declare const formatAdminSuccess: <T>(data: T, message?: string) => {
    success: boolean;
    data: T;
    message: string | undefined;
    timestamp: string;
};
/**
 * Paginate admin results
 */
export declare const paginateAdminResults: <T>(data: T[], page: number, limit: number, total: number) => {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
};
//# sourceMappingURL=admin.d.ts.map