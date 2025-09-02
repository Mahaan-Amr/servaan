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
        tenants: {
            id: any;
            subdomain: any;
            name: any;
            displayName: any;
            plan: any;
            isActive: any;
            businessType: any;
            city: any;
            country: any;
            createdAt: any;
            updatedAt: any;
            userCount: any;
            features: any;
            metrics: {
                userCount: any;
                customerCount: number;
                orderCount: number;
                revenue: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get tenant by ID
     */
    static getTenantById(id: string): Promise<{
        id: string;
        subdomain: string;
        name: string;
        displayName: string;
        description: string | null;
        plan: import("../../../../shared/generated/client").$Enums.TenantPlan;
        isActive: boolean;
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string | null;
        businessType: string | null;
        city: string | null;
        country: string;
        createdAt: Date;
        updatedAt: Date;
        features: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            hasInventoryManagement: boolean;
            hasCustomerManagement: boolean;
            hasAccountingSystem: boolean;
            hasReporting: boolean;
            hasNotifications: boolean;
            hasAdvancedReporting: boolean;
            hasApiAccess: boolean;
            hasCustomBranding: boolean;
            hasMultiLocation: boolean;
            hasAdvancedCRM: boolean;
            hasWhatsappIntegration: boolean;
            hasInstagramIntegration: boolean;
            hasAnalyticsBI: boolean;
        } | null;
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
    static updateTenant(id: string, updateData: any): Promise<{
        features: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            hasInventoryManagement: boolean;
            hasCustomerManagement: boolean;
            hasAccountingSystem: boolean;
            hasReporting: boolean;
            hasNotifications: boolean;
            hasAdvancedReporting: boolean;
            hasApiAccess: boolean;
            hasCustomBranding: boolean;
            hasMultiLocation: boolean;
            hasAdvancedCRM: boolean;
            hasWhatsappIntegration: boolean;
            hasInstagramIntegration: boolean;
            hasAnalyticsBI: boolean;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        subdomain: string;
        displayName: string;
        description: string | null;
        logo: string | null;
        primaryColor: string | null;
        secondaryColor: string | null;
        plan: import("../../../../shared/generated/client").$Enums.TenantPlan;
        planStartedAt: Date;
        planExpiresAt: Date | null;
        maxUsers: number;
        maxItems: number;
        maxCustomers: number;
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string | null;
        businessType: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string;
        timezone: string;
        locale: string;
        currency: string;
    }>;
    /**
     * Deactivate tenant
     */
    static deactivateTenant(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        subdomain: string;
        displayName: string;
        description: string | null;
        logo: string | null;
        primaryColor: string | null;
        secondaryColor: string | null;
        plan: import("../../../../shared/generated/client").$Enums.TenantPlan;
        planStartedAt: Date;
        planExpiresAt: Date | null;
        maxUsers: number;
        maxItems: number;
        maxCustomers: number;
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string | null;
        businessType: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string;
        timezone: string;
        locale: string;
        currency: string;
    }>;
    /**
     * Activate a previously deactivated tenant
     */
    static activateTenant(id: string): Promise<({
        _count: {
            users: number;
        };
        features: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            hasInventoryManagement: boolean;
            hasCustomerManagement: boolean;
            hasAccountingSystem: boolean;
            hasReporting: boolean;
            hasNotifications: boolean;
            hasAdvancedReporting: boolean;
            hasApiAccess: boolean;
            hasCustomBranding: boolean;
            hasMultiLocation: boolean;
            hasAdvancedCRM: boolean;
            hasWhatsappIntegration: boolean;
            hasInstagramIntegration: boolean;
            hasAnalyticsBI: boolean;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        subdomain: string;
        displayName: string;
        description: string | null;
        logo: string | null;
        primaryColor: string | null;
        secondaryColor: string | null;
        plan: import("../../../../shared/generated/client").$Enums.TenantPlan;
        planStartedAt: Date;
        planExpiresAt: Date | null;
        maxUsers: number;
        maxItems: number;
        maxCustomers: number;
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string | null;
        businessType: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        country: string;
        timezone: string;
        locale: string;
        currency: string;
    }) | null>;
    /**
     * Bulk update tenant status
     */
    static bulkUpdateStatus(tenantIds: string[], isActive: boolean): Promise<{
        updatedCount: number;
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
        data: unknown;
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