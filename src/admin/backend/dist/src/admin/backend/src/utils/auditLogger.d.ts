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
export declare function auditLog(data: AuditLogData): Promise<void>;
/**
 * Get audit logs for an admin user
 */
export declare function getAuditLogs(adminUserId: string, options?: {
    page?: number;
    limit?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<{
    logs: any;
    pagination: {
        page: number;
        limit: number;
        total: any;
        pages: number;
    };
}>;
/**
 * Get audit logs for a specific resource
 */
export declare function getResourceAuditLogs(resourceId: string, resourceType: string, options?: {
    page?: number;
    limit?: number;
}): Promise<{
    logs: any;
    pagination: {
        page: number;
        limit: number;
        total: any;
        pages: number;
    };
}>;
//# sourceMappingURL=auditLogger.d.ts.map