/**
 * Tenant Context Utilities
 * 
 * Provides helper functions for consistent tenant context handling across the application.
 * Ensures single source of truth for tenant identification.
 * 
 * Priority Order:
 * 1. req.tenant?.id (from subdomain via resolveTenant middleware) - PREFERRED
 * 2. req.user?.tenantId (from JWT token) - FALLBACK
 * 3. Explicit tenantId parameter - MANUAL
 */

import { Request } from 'express';
import { AppError } from '../middlewares/errorHandler';

/**
 * Get tenant ID from request with guaranteed non-null result
 * 
 * IMPORTANT: This function should ONLY be called from routes that have
 * requireTenant middleware applied (either at mount point or per-route).
 * 
 * @param req - Express request object
 * @returns Tenant ID string (guaranteed not null due to requireTenant middleware)
 * @throws AppError if tenant context is missing (400 Bad Request)
 * 
 * @example
 * // In a route with requireTenant middleware
 * router.get('/', authenticate, requireTenant, async (req, res) => {
 *   const tenantId = getTenantId(req);  // Safe - requireTenant guarantees req.tenant exists
 *   const users = await prisma.user.findMany({
 *     where: { tenantId }
 *   });
 * });
 */
export function getTenantId(req: Request): string {
  // Primary source: subdomain-based tenant context (set by resolveTenant middleware)
  if (req.tenant?.id) {
    return req.tenant.id;
  }

  // Fallback: user's home tenant (set by authenticate middleware)
  if (req.user?.tenantId) {
    return req.user.tenantId;
  }

  // If neither available, throw error (should not happen if requireTenant middleware is applied)
  throw new AppError('نیاز به شناسایی مجموعه', 400);
}

/**
 * Get tenant ID from request without throwing error
 * Returns null if no tenant context available
 * 
 * Used in optional tenant routes that don't have requireTenant middleware.
 * 
 * @param req - Express request object
 * @returns Tenant ID string or null
 * 
 * @example
 * // In auth routes that handle their own tenant resolution
 * router.post('/login', async (req, res) => {
 *   const tenantId = getTenantIdOptional(req);
 *   // tenantId is null for main domain login, or a string for subdomain login
 * });
 */
export function getTenantIdOptional(req: Request): string | null {
  // Primary source: subdomain-based tenant context
  if (req.tenant?.id) {
    return req.tenant.id;
  }

  // Fallback: user's home tenant
  if (req.user?.tenantId) {
    return req.user.tenantId;
  }

  // No tenant context available
  return null;
}

/**
 * Validate that tenant context exists
 * Useful for explicit validation in route handlers
 * 
 * @param req - Express request object
 * @returns true if tenant context exists, false otherwise
 * 
 * @example
 * // Defensive check in a route
 * if (!hasTenantContext(req)) {
 *   return res.status(400).json({ error: 'Tenant context required' });
 * }
 */
export function hasTenantContext(req: Request): boolean {
  return !!(req.tenant?.id || req.user?.tenantId);
}

/**
 * Get tenant info from request
 * Returns both tenant context from subdomain and user's home tenant
 * 
 * Useful for cases where you need to know both:
 * - Where the user is accessing from (subdomain/req.tenant)
 * - Where the user belongs (home tenant/req.user.tenantId)
 * 
 * @param req - Express request object
 * @returns Object with tenant information
 * 
 * @example
 * const tenantInfo = getTenantInfo(req);
 * console.log(tenantInfo);
 * // {
 * //   workspaceTenant: "dima",        // Tenant accessed via subdomain
 * //   userHomeTenant: "user-tenant-id", // User's home tenant
 * //   subdomainMatch: true             // true if user's home = workspace tenant
 * // }
 */
export function getTenantInfo(req: Request) {
  const workspaceTenant = req.tenant?.id || null;  // From subdomain
  const userHomeTenant = req.user?.tenantId || null;  // From JWT
  
  return {
    workspaceTenant,
    userHomeTenant,
    subdomainMatch: workspaceTenant === userHomeTenant,
    workspaceSubdomain: req.tenant?.subdomain || null,
    workspaceName: req.tenant?.name || null,
  };
}

/**
 * Validate that user is accessing their home tenant
 * 
 * Useful for sensitive operations that should only work in user's home tenant.
 * For example: account settings, password changes, etc.
 * 
 * @param req - Express request object
 * @returns true if user is in their home tenant, false otherwise
 * 
 * @example
 * // Only allow password change if accessing own tenant
 * if (!isUserInHomeTenant(req)) {
 *   return res.status(403).json({ error: 'Can only change password in your home workspace' });
 * }
 * 
 * // This prevents user from changing another tenant's admin password
 */
export function isUserInHomeTenant(req: Request): boolean {
  return req.tenant?.id === req.user?.tenantId;
}

/**
 * Assert tenant context exists, throw if not
 * 
 * Shorter alias for getTenantId, returns void if valid, throws if not.
 * Useful for strict validation at the start of route handlers.
 * 
 * @param req - Express request object
 * @throws AppError if tenant context missing
 * 
 * @example
 * router.post('/', authenticate, requireTenant, (req, res) => {
 *   assertTenant(req);  // Validate (should never fail due to middleware)
 *   const tenantId = req.tenant!.id;  // Safe to use non-null assertion
 * });
 */
export function assertTenant(req: Request): void {
  if (!hasTenantContext(req)) {
    throw new AppError('نیاز به شناسایی مجموعه', 400);
  }
}

/**
 * Validate tenant ownership of a resource
 * 
 * Ensures a resource (identified by tenantId) belongs to the current tenant context.
 * Prevents cross-tenant access when a resource ID is provided by user.
 * 
 * @param resourceTenantId - The tenantId of the resource (from database)
 * @param req - Express request object
 * @param resourceType - Type of resource for error message
 * @throws AppError if resource doesn't belong to current tenant
 * 
 * @example
 * // Validate that item belongs to current tenant before modifying
 * const item = await prisma.item.findUnique({ where: { id: itemId } });
 * validateTenantOwnership(item.tenantId, req, 'Item');
 * // If item.tenantId !== req.tenant.id, throws 403 error
 */
export function validateTenantOwnership(resourceTenantId: string, req: Request, resourceType: string = 'Resource'): void {
  const currentTenantId = getTenantId(req);
  
  if (resourceTenantId !== currentTenantId) {
    throw new AppError(
      `شما دسترسی به این ${resourceType} را ندارید`,
      403
    );
  }
}

/**
 * Get tenant context for logging
 * 
 * Returns a string representation of current tenant context for debug logging.
 * Useful for tracking which tenant performed an action.
 * 
 * @param req - Express request object
 * @returns String describing current tenant context
 * 
 * @example
 * console.log(`User action: ${getTenantContext(req)}`, action);
 * // Output: "User action: workspace=dima (user-home-id)" action
 */
export function getTenantContext(req: Request): string {
  const workspaceTenant = req.tenant?.subdomain || 'none';
  const userHome = req.user?.tenantId || 'none';
  return `workspace=${workspaceTenant} (user-home=${userHome})`;
}
