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
 * Authenticate admin user via JWT token
 */
export declare function authenticateAdmin(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
/**
 * Require specific admin role(s)
 */
export declare function requireRole(roles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional authentication - doesn't fail if no token provided
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map