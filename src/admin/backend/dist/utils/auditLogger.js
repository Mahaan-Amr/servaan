"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
exports.getAuditLogs = getAuditLogs;
exports.getResourceAuditLogs = getResourceAuditLogs;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Log admin actions for audit purposes
 */
async function auditLog(data) {
    try {
        await prisma.adminAuditLog.create({
            data: {
                adminUserId: data.adminUserId,
                action: data.action,
                details: data.details ? JSON.stringify(data.details) : null,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                resourceId: data.resourceId,
                resourceType: data.resourceType,
                timestamp: new Date()
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
        where.timestamp = {};
        if (startDate)
            where.timestamp.gte = startDate;
        if (endDate)
            where.timestamp.lte = endDate;
    }
    const [logs, total] = await Promise.all([
        prisma.adminAuditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { timestamp: 'desc' }
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
async function getResourceAuditLogs(resourceId, resourceType, options = {}) {
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
            orderBy: { timestamp: 'desc' },
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
//# sourceMappingURL=auditLogger.js.map