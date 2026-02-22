/**
 * Base Service Class
 * 
 * Provides common functionality for all tenant-aware services:
 * - Tenant validation
 * - Centralized Prisma client access
 * - Common error handling
 * - Audit logging support
 * 
 * Usage:
 * ```typescript
 * export class ItemService extends BaseService {
 *   static async getItems(tenantId: string) {
 *     const validated = this.validateTenant(tenantId);
 *     return await this.db.item.findMany({
 *       where: { tenantId: validated }
 *     });
 *   }
 * }
 * ```
 */

import { prisma } from './dbService';
import { AppError } from '../middlewares/errorHandler';

export abstract class BaseService {
  /**
   * Get Prisma client instance
   * Centralized access to database for all services
   */
  protected static get db() {
    return prisma;
  }

  /**
   * Validate and return tenant ID
   * Ensures tenantId is provided and non-empty
   * 
   * @param tenantId - Tenant ID to validate
   * @returns Validated tenant ID (guaranteed non-empty string)
   * @throws AppError if tenantId is missing or empty
   * 
   * @example
   * ```typescript
   * static async getItems(tenantId: string) {
   *   const validated = this.validateTenant(tenantId);
   *   // Now validated is guaranteed to be a non-empty string
   *   return await this.db.item.findMany({
   *     where: { tenantId: validated }
   *   });
   * }
   * ```
   */
  protected static validateTenant(tenantId?: string): string {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new AppError('نیاز به شناسایی مجموعه', 400);
    }
    return tenantId.trim();
  }

  /**
   * Validate multiple tenant IDs match
   * Used when checking resource ownership
   * 
   * @param resourceTenantId - Tenant ID from resource (database)
   * @param requestTenantId - Tenant ID from request context
   * @param resourceType - Type of resource for error message
   * @throws AppError if tenant IDs don't match
   * 
   * @example
   * ```typescript
   * static async updateItem(tenantId: string, itemId: string, data: any) {
   *   const item = await this.db.item.findUnique({ where: { id: itemId } });
   *   this.validateTenantOwnership(item.tenantId, tenantId, 'Item');
   * }
   * ```
   */
  protected static validateTenantOwnership(
    resourceTenantId: string | undefined,
    requestTenantId: string,
    resourceType: string = 'Resource'
  ): void {
    const validated = this.validateTenant(requestTenantId);

    if (!resourceTenantId || resourceTenantId !== validated) {
      throw new AppError(
        `شما دسترسی به این ${resourceType} را ندارید`,
        403
      );
    }
  }

  /**
   * Validate resource exists and belongs to tenant
   * Combined validation for existence and ownership
   * 
   * @param resource - The resource object to check
   * @param tenantId - Expected tenant ID
   * @param resourceType - Type of resource for error message
   * @returns The validated resource
   * @throws AppError if resource not found or doesn't belong to tenant
   */
  protected static validateResourceOwnership<T extends { tenantId?: string }>(
    resource: T | null | undefined,
    tenantId: string,
    resourceType: string = 'Resource'
  ): T {
    if (!resource) {
      throw new AppError(`این ${resourceType} یافت نشد`, 404);
    }

    this.validateTenantOwnership(resource.tenantId, tenantId, resourceType);
    return resource;
  }

  /**
   * Log service action for audit trail
   * Can be overridden by child classes for custom logging
   * 
   * @param action - Action performed (CREATE, UPDATE, DELETE, etc.)
   * @param tenantId - Tenant performing the action
   * @param userId - User performing the action
   * @param details - Additional details to log
   */
  protected static logAction(
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE',
    tenantId: string,
    userId: string | undefined,
    details: Record<string, any> = {}
  ): void {
    // This can be extended in Phase 4 for audit logging
    const timestamp = new Date().toISOString();
    console.log(
      `[${action}] ${timestamp} | Tenant: ${tenantId} | User: ${userId || 'system'} |`,
      details
    );
  }

  /**
   * Handle service error with consistent formatting
   * Wraps business logic errors in AppError
   * 
   * @param error - Original error
   * @param message - Farsi error message
   * @param statusCode - HTTP status code (default 500)
   * @throws AppError with formatted message
   */
  protected static handleError(
    error: Error | any,
    message: string = 'خطای داخلی سرور',
    statusCode: number = 500
  ): never {
    console.error(`Service Error: ${message}`, error);
    throw new AppError(message, statusCode);
  }
}
