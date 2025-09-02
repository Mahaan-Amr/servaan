"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
exports.getAuditLogs = getAuditLogs;
exports.getResourceAuditLogs = getResourceAuditLogs;
const prisma_1 = require("../lib/prisma");
/**
 * Log admin actions for audit purposes
 */
async function auditLog(data) {
    try {
        await prisma_1.prisma.adminAuditLog.create({
            data: {
                adminUserId: data.adminUserId,
                action: data.action,
                details: data.details || null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null,
                resourceId: data.resourceId || null,
                resourceType: data.resourceType || null
            }
        });
    }
    catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw error - audit logging failure shouldn't break the main functionality
    }
}
/**
 * Get audit logs for an admin user
 */
async function getAuditLogs(adminUserId, options = {}) {
    const { page = 1, limit = 50, action, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    const where = { adminUserId };
    if (action) {
        where.action = action;
    }
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = startDate;
        if (endDate)
            where.createdAt.lte = endDate;
    }
    const [logs, total] = await Promise.all([
        prisma_1.prisma.adminAuditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.adminAuditLog.count({ where })
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
async function getResourceAuditLogs(resourceId, resourceType, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        prisma_1.prisma.adminAuditLog.findMany({
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
        prisma_1.prisma.adminAuditLog.count({
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
//# sourceMappingURL=auditLogger.js.map