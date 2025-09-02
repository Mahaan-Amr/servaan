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
    logs: {
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
        action: string;
        resourceType: string | null;
        resourceId: string | null;
        details: import("../../../../shared/generated/client/runtime/library").JsonValue | null;
        adminUserId: string;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
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
    logs: ({
        adminUser: {
            email: string;
            role: import("../../../../shared/generated/client").$Enums.AdminRole;
        };
    } & {
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
        action: string;
        resourceType: string | null;
        resourceId: string | null;
        details: import("../../../../shared/generated/client/runtime/library").JsonValue | null;
        adminUserId: string;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}>;
//# sourceMappingURL=auditLogger.d.ts.map