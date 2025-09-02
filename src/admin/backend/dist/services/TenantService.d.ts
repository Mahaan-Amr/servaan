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
     * Get platform overview
     */
    static getPlatformOverview(): Promise<PlatformOverview>;
}
//# sourceMappingURL=TenantService.d.ts.map