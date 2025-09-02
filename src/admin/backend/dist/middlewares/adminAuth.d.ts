import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '../types/admin';
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
 * Admin Authentication Middleware
 * Verifies JWT token and loads admin user from database
 */
export declare const authenticateAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Admin Role Authorization Middleware
 * Checks if admin user has required role(s)
 */
export declare const authorizeAdmin: (roles: AdminRole[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Super Admin Only Middleware
 * Only allows SUPER_ADMIN role
 */
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Platform Admin or Higher Middleware
 * Allows SUPER_ADMIN and PLATFORM_ADMIN roles
 */
export declare const requirePlatformAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Support or Higher Middleware
 * Allows all admin roles except DEVELOPER
 */
export declare const requireSupportAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional Admin Authentication Middleware
 * Authenticates if token is provided, but doesn't require it
 */
export declare const optionalAdminAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=adminAuth.d.ts.map