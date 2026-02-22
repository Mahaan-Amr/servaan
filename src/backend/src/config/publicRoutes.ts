/**
 * Public Routes Configuration
 * Routes that do not require tenant context
 * 
 * These routes are explicitly excluded from requireTenant middleware
 * because they serve unauthenticated users or handle cross-tenant operations.
 */

/**
 * Routes that require NO authentication and NO tenant context
 */
export const PUBLIC_ROUTES = [
  '/api/health',           // Health check endpoint
  '/api/tenants',          // Tenant lookup/registration
];

/**
 * Routes that may or may not have tenant context
 * These routes handle their own tenant resolution if needed
 */
export const OPTIONAL_TENANT_ROUTES = [
  '/api/auth',             // Login, register, token refresh
];

/**
 * All other routes require:
 * 1. authenticate middleware (verify JWT token)
 * 2. requireTenant middleware (verify tenant context is present)
 * 3. Optional authorize middleware (check user role)
 */
export const PROTECTED_ROUTES = [
  '/api/users',
  '/api/items',
  '/api/inventory',
  '/api/audit',
  '/api/suppliers',
  '/api/notifications',
  '/api/scanner',
  '/api/bi',
  '/api/analytics',
  '/api/financial',
  '/api/user-analytics',
  '/api/accounting',
  '/api/reports',
  '/api/customers',
  '/api/loyalty',
  '/api/visits',
  '/api/crm',
  '/api/campaigns',
  '/api/workspace',
  '/api/sms',
  '/api/customer-journey',
  '/api/customer-service',
  '/api/ordering',
  '/api/performance',
];

/**
 * Check if a route is public (no auth required)
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

/**
 * Check if a route has optional tenant context
 */
export function isOptionalTenantRoute(path: string): boolean {
  return OPTIONAL_TENANT_ROUTES.some(route => path.startsWith(route));
}

/**
 * Check if a route requires tenant context
 */
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
}
