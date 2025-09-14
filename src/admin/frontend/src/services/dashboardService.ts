// Dashboard Service for Admin Frontend
// سرویس داشبورد برای فرانت‌اند مدیریت

import adminApi from './adminAuthService';
import { DashboardStats, RecentActivity, SystemMetrics, DashboardData } from '../types/dashboard';

/**
 * Get comprehensive dashboard data
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await adminApi.get('/admin/dashboard');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    throw new Error(error.response?.data?.message || 'Failed to load dashboard data');
  }
};

/**
 * Get dashboard statistics only
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await adminApi.get('/admin/dashboard/stats');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to load dashboard statistics');
  }
};

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  try {
    const response = await adminApi.get(`/admin/dashboard/activities?limit=${limit}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    throw new Error(error.response?.data?.message || 'Failed to load recent activities');
  }
};

/**
 * Get system metrics
 */
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const response = await adminApi.get('/admin/dashboard/metrics');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching system metrics:', error);
    throw new Error(error.response?.data?.message || 'Failed to load system metrics');
  }
};

/**
 * Get tenant growth data
 */
export const getTenantGrowthData = async (days: number = 30) => {
  try {
    const response = await adminApi.get(`/admin/dashboard/tenant-growth?days=${days}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant growth data:', error);
    throw new Error(error.response?.data?.message || 'Failed to load tenant growth data');
  }
};

/**
 * Get revenue data
 */
export const getRevenueData = async (days: number = 30) => {
  try {
    const response = await adminApi.get(`/admin/dashboard/revenue?days=${days}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching revenue data:', error);
    throw new Error(error.response?.data?.message || 'Failed to load revenue data');
  }
};

/**
 * Get user activity data
 */
export const getUserActivityData = async (days: number = 30) => {
  try {
    const response = await adminApi.get(`/admin/dashboard/user-activity?days=${days}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching user activity data:', error);
    throw new Error(error.response?.data?.message || 'Failed to load user activity data');
  }
};

/**
 * Get system health status
 */
export const getSystemHealth = async () => {
  try {
    const response = await adminApi.get('/admin/dashboard/health');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching system health:', error);
    throw new Error(error.response?.data?.message || 'Failed to load system health status');
  }
};

/**
 * Get tenant overview data for dashboard cards
 */
export const getTenantOverviewData = async (limit: number = 10) => {
  try {
    const response = await adminApi.get(`/admin/dashboard/tenant-overview?limit=${limit}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant overview data:', error);
    throw new Error(error.response?.data?.message || 'Failed to load tenant overview data');
  }
};

export default {
  getDashboardData,
  getDashboardStats,
  getRecentActivities,
  getSystemMetrics,
  getTenantGrowthData,
  getRevenueData,
  getUserActivityData,
  getSystemHealth,
  getTenantOverviewData,
};
