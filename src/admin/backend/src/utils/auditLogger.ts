import { PrismaClient } from '../../shared/generated/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  adminUserId: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Log admin actions for audit purposes
 */
export async function auditLog(data: AuditLogData) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: data.adminUserId,
        action: data.action,
        details: data.details as any || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        resourceId: data.resourceId || null,
        resourceType: data.resourceType || null
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw error - audit logging failure shouldn't break the main functionality
  }
}

/**
 * Get audit logs for an admin user
 */
export async function getAuditLogs(adminUserId: string, options: {
  page?: number;
  limit?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const { page = 1, limit = 50, action, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: any = { adminUserId };

  if (action) {
    where.action = action;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.adminAuditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(resourceId: string, resourceType: string, options: {
  page?: number;
  limit?: number;
} = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where: {
        resourceId,
        resourceType
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: {
          select: {
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.adminAuditLog.count({
      where: {
        resourceId,
        resourceType
      }
    })
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
