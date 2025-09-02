import { AdminLoginRequest, AdminLoginResponse, AdminUser } from '../types/admin';
/**
 * Admin Login Service
 * Authenticates admin user and returns JWT token
 */
export declare const adminLogin: (loginData: AdminLoginRequest) => Promise<AdminLoginResponse>;
/**
 * Admin Logout Service
 * Creates audit log for logout action
 */
export declare const adminLogout: (adminUserId: string, ipAddress?: string, userAgent?: string) => Promise<void>;
/**
 * Get Admin User Profile
 * Returns admin user information
 */
export declare const getAdminProfile: (adminUserId: string) => Promise<AdminUser | null>;
/**
 * Change Admin Password
 * Updates admin user password
 */
export declare const changeAdminPassword: (adminUserId: string, currentPassword: string, newPassword: string) => Promise<void>;
/**
 * Validate Admin Credentials
 * Helper function to validate admin credentials without logging in
 */
export declare const validateAdminCredentials: (email: string, password: string) => Promise<boolean>;
//# sourceMappingURL=adminAuthService.d.ts.map