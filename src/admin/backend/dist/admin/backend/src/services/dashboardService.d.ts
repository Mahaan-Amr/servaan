import { DashboardStats, RecentActivity, SystemMetrics } from '../types/dashboard';
export interface DashboardData {
    stats: DashboardStats;
    recentActivities: RecentActivity[];
    systemMetrics: SystemMetrics;
}
/**
 * Get comprehensive dashboard data
 */
export declare const getDashboardData: () => Promise<DashboardData>;
/**
 * Get dashboard statistics
 */
export declare const getDashboardStats: () => Promise<DashboardStats>;
/**
 * Get recent activities across all tenants
 */
export declare const getRecentActivities: (limit?: number) => Promise<RecentActivity[]>;
/**
 * Get system metrics
 */
export declare const getSystemMetrics: () => Promise<SystemMetrics>;
/**
 * Get tenant growth data
 */
export declare const getTenantGrowthData: (days?: number) => Promise<{
    date: Date;
    count: number;
}[]>;
/**
 * Get revenue data
 */
export declare const getRevenueData: (days?: number) => Promise<{
    date: Date;
    amount: number;
}[]>;
/**
 * Get user activity data
 */
export declare const getUserActivityData: (days?: number) => Promise<{
    date: Date;
    count: number;
}[]>;
/**
 * Get tenant overview data for dashboard cards
 */
export declare const getTenantOverviewData: (limit?: number) => Promise<{
    id: string;
    name: string;
    subdomain: string;
    status: "maintenance" | "active" | "inactive" | "suspended";
    userCount: number;
    monthlyRevenue: number;
    lastActivity: Date;
    health: "healthy" | "warning" | "critical";
    plan: "basic" | "premium" | "enterprise";
}[]>;
declare const _default: {
    getDashboardData: () => Promise<DashboardData>;
    getDashboardStats: () => Promise<DashboardStats>;
    getRecentActivities: (limit?: number) => Promise<RecentActivity[]>;
    getSystemMetrics: () => Promise<SystemMetrics>;
    getTenantGrowthData: (days?: number) => Promise<{
        date: Date;
        count: number;
    }[]>;
    getRevenueData: (days?: number) => Promise<{
        date: Date;
        amount: number;
    }[]>;
    getUserActivityData: (days?: number) => Promise<{
        date: Date;
        count: number;
    }[]>;
    getTenantOverviewData: (limit?: number) => Promise<{
        id: string;
        name: string;
        subdomain: string;
        status: "maintenance" | "active" | "inactive" | "suspended";
        userCount: number;
        monthlyRevenue: number;
        lastActivity: Date;
        health: "healthy" | "warning" | "critical";
        plan: "basic" | "premium" | "enterprise";
    }[]>;
};
export default _default;
//# sourceMappingURL=dashboardService.d.ts.map