export interface TenantListParams {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    plan?: string;
}
export interface TenantMetrics {
    users: {
        total: number;
        active: number;
        inactive: number;
    };
    customers: {
        total: number;
        newThisMonth: number;
        active: number;
    };
    orders: {
        total: number;
        thisMonth: number;
        averageValue: number;
    };
    revenue: {
        total: number;
        thisMonth: number;
        growth: number;
    };
    inventory: {
        items: number;
        lowStock: number;
        outOfStock: number;
    };
}
export interface PlatformOverview {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalRevenue: number;
    monthlyGrowth: number;
    topTenants: Array<{
        id: string;
        name: string;
        subdomain: string;
        revenue: number;
        userCount: number;
    }>;
    recentActivity: Array<{
        type: string;
        description: string;
        timestamp: Date;
        tenantId?: string;
    }>;
}
export declare class TenantService {
    /**
     * List all tenants with pagination and search
     */
    static listTenants(params: TenantListParams): Promise<{
        tenants: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
        };
    }>;
    /**
     * Get tenant by ID
     */
    static getTenantById(id: string): Promise<{
        id: any;
        subdomain: any;
        name: any;
        displayName: any;
        description: any;
        plan: any;
        isActive: any;
        ownerName: any;
        ownerEmail: any;
        ownerPhone: any;
        businessType: any;
        city: any;
        country: any;
        createdAt: any;
        updatedAt: any;
        features: any;
        usage: {
            storageUsed: string;
            apiCallsLastMonth: number;
            lastActivity: Date;
        };
    } | null>;
    /**
     * Get tenant metrics
     */
    static getTenantMetrics(tenantId: string): Promise<TenantMetrics | null>;
    /**
     * Update tenant
     */
    static updateTenant(id: string, updateData: any): Promise<any>;
    /**
     * Deactivate tenant
     */
    static deactivateTenant(id: string): Promise<any>;
    /**
     * Activate a previously deactivated tenant
     */
    static activateTenant(id: string): Promise<any>;
    /**
     * Bulk update tenant status
     */
    static bulkUpdateStatus(tenantIds: string[], isActive: boolean): Promise<{
        updatedCount: any;
        totalRequested: number;
    }>;
    /**
     * Get tenant activity logs
     */
    static getTenantActivity(tenantId: string, params: {
        page: number;
        limit: number;
        type?: string;
    }): Promise<{
        activities: ({
            id: string;
            tenantId: string;
            type: string;
            description: string;
            details: {
                action: string;
            };
            userId: null;
            user: null;
            createdAt: Date;
        } | {
            id: string;
            tenantId: string;
            type: string;
            description: string;
            details: {
                action: string;
            };
            userId: string;
            user: {
                id: string;
                name: string;
                email: string;
            };
            createdAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get tenant growth analytics
     */
    static getTenantGrowthAnalytics(params: {
        days: number;
        groupBy: 'day' | 'week' | 'month';
    }): Promise<{
        period: "week" | "day" | "month";
        days: number;
        data: any;
    }>;
    /**
     * Get tenant revenue analytics
     */
    static getTenantRevenueAnalytics(params: {
        period: 'daily' | 'weekly' | 'monthly' | 'yearly';
        year?: number;
    }): Promise<{
        period: "daily" | "weekly" | "monthly" | "yearly";
        year: number;
        data: {
            period: string;
            revenue: number;
            growth: number;
        }[];
        summary: {
            totalRevenue: number;
            averageGrowth: number;
            topMonth: string;
            topRevenue: number;
        };
    }>;
    /**
     * Export tenants data
     */
    static exportTenants(params: {
        format: 'csv' | 'excel' | 'pdf';
        search?: string;
        status?: string;
        plan?: string;
    }): Promise<string | Buffer<ArrayBufferLike>>;
    /**
     * Get platform overview
     */
    static getPlatformOverview(): Promise<PlatformOverview>;
}
//# sourceMappingURL=TenantService.d.ts.map