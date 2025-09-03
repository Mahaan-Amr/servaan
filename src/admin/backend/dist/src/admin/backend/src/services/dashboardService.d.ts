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
export declare const getTenantGrowthData: (days?: number) => Promise<any>;
/**
 * Get revenue data
 */
export declare const getRevenueData: (days?: number) => Promise<any>;
/**
 * Get user activity data
 */
export declare const getUserActivityData: (days?: number) => Promise<any>;
declare const _default: {
    getDashboardData: () => Promise<DashboardData>;
    getDashboardStats: () => Promise<DashboardStats>;
    getRecentActivities: (limit?: number) => Promise<RecentActivity[]>;
    getSystemMetrics: () => Promise<SystemMetrics>;
    getTenantGrowthData: (days?: number) => Promise<any>;
    getRevenueData: (days?: number) => Promise<any>;
    getUserActivityData: (days?: number) => Promise<any>;
};
export default _default;
//# sourceMappingURL=dashboardService.d.ts.map