// Dashboard Service for Admin Panel
// سرویس داشبورد برای پنل مدیریت

import { prisma } from '../lib/prisma';
import { DashboardStats, RecentActivity, SystemMetrics } from '../types/dashboard';

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  systemMetrics: SystemMetrics;
}

/**
 * Get comprehensive dashboard data
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const [stats, activities, metrics] = await Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      getSystemMetrics(),
    ]);

    return {
      stats,
      recentActivities: activities,
      systemMetrics: metrics,
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw new Error('Failed to load dashboard data');
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get tenant statistics
    const [totalTenants, activeTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({
        where: { isActive: true }
      })
    ]);

    // Get user statistics (aggregated from all tenants)
    const totalUsers = await prisma.user.count();

    // Calculate monthly revenue (aggregated from all tenants)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.orderPayment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        createdAt: {
          gte: currentMonth
        }
        // Note: status field may not exist in OrderPayment model
      }
    });

    // Get system health status
    const systemHealth = await getSystemHealthStatus();

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      systemHealth,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics');
  }
};

/**
 * Get recent activities across all tenants
 */
export const getRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  try {
    const activities: RecentActivity[] = [];

    // Get recent tenant registrations
    const recentTenants = await prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    });

    recentTenants.forEach(tenant => {
      activities.push({
        id: `tenant_${tenant.id}`,
        type: 'tenant',
        message: `مستأجر جدید "${tenant.name}" ثبت شد`,
        timestamp: tenant.createdAt,
        severity: 'info',
      });
    });

    // Get recent admin logins
    const recentLogins = await prisma.adminAuditLog.findMany({
      take: 5,
      where: { action: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        ipAddress: true,
        adminUser: {
          select: { email: true }
        }
      }
    });

    recentLogins.forEach(login => {
      activities.push({
        id: `login_${login.id}`,
        type: 'user',
        message: `کاربر ادمین ${login.adminUser?.email} از آدرس IP ${login.ipAddress} وارد شد`,
        timestamp: login.createdAt,
        severity: 'info',
      });
    });

    // Get system alerts
    const systemAlerts = await getSystemAlerts(5);
    activities.push(...systemAlerts);

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw new Error('Failed to load recent activities');
  }
};

/**
 * Get system metrics
 */
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // In a real implementation, these would come from system monitoring
    // For now, we'll simulate based on database performance
    const dbPerformance = await getDatabasePerformance();

    return {
      cpuUsage: Math.floor(Math.random() * 30) + 30, // 30-60%
      memoryUsage: Math.floor(Math.random() * 40) + 40, // 40-80%
      diskUsage: Math.floor(Math.random() * 20) + 20, // 20-40%
      networkIO: Math.floor(Math.random() * 15) + 10, // 10-25%
      uptime: 99.9,
      responseTime: dbPerformance.avgResponseTime,
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    throw new Error('Failed to load system metrics');
  }
};

/**
 * Get system health status
 */
const getSystemHealthStatus = async (): Promise<'healthy' | 'warning' | 'critical' | 'maintenance'> => {
  try {
    // Check various system health indicators
    const checks = await Promise.all([
      checkDatabaseHealth(),
      checkSystemResources(),
      checkActiveAlerts(),
    ]);

    const hasCritical = checks.some(check => check === 'critical');
    const hasWarning = checks.some(check => check === 'warning');

    if (hasCritical) return 'critical';
    if (hasWarning) return 'warning';
    return 'healthy';
  } catch (error) {
    console.error('Error checking system health:', error);
    return 'warning';
  }
};

/**
 * Check database health
 */
const checkDatabaseHealth = async (): Promise<'healthy' | 'warning' | 'critical'> => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    if (responseTime > 1000) return 'critical';
    if (responseTime > 500) return 'warning';
    return 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'critical';
  }
};

/**
 * Check system resources
 */
const checkSystemResources = async (): Promise<'healthy' | 'warning' | 'critical'> => {
  try {
    // In a real implementation, this would check actual system resources
    // For now, return healthy
    return 'healthy';
  } catch (error) {
    console.error('System resources check failed:', error);
    return 'warning';
  }
};

/**
 * Check for active alerts
 */
const checkActiveAlerts = async (): Promise<'healthy' | 'warning' | 'critical'> => {
  try {
    // Check for any critical system alerts
    const criticalAlerts = await prisma.adminAuditLog.count({
      where: {
        action: 'SYSTEM_ALERT',
        details: {
          path: ['severity'],
          equals: 'critical'
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (criticalAlerts > 5) return 'critical';
    if (criticalAlerts > 0) return 'warning';
    return 'healthy';
  } catch (error) {
    console.error('Active alerts check failed:', error);
    return 'warning';
  }
};

/**
 * Get system alerts
 */
const getSystemAlerts = async (limit: number): Promise<RecentActivity[]> => {
  try {
    const alerts = await prisma.adminAuditLog.findMany({
      take: limit,
      where: {
        action: 'SYSTEM_ALERT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        details: true,
      }
    });

    return alerts.map(alert => {
      const details = alert.details as any;
      return {
        id: `alert_${alert.id}`,
        type: 'system',
        message: details.message || 'هشدار سیستم',
        timestamp: alert.createdAt,
        severity: details.severity || 'warning',
      };
    });
  } catch (error) {
    console.error('Error getting system alerts:', error);
    return [];
  }
};

/**
 * Get database performance metrics
 */
const getDatabasePerformance = async (): Promise<{ avgResponseTime: number }> => {
  try {
    // In a real implementation, this would query actual performance metrics
    // For now, return a simulated value
    return {
      avgResponseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
    };
  } catch (error) {
    console.error('Error getting database performance:', error);
    return { avgResponseTime: 100 };
  }
};

/**
 * Get tenant growth data
 */
export const getTenantGrowthData = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growthData = await prisma.tenant.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return growthData.map(item => ({
      date: item.createdAt,
      count: item._count.id
    }));
  } catch (error) {
    console.error('Error getting tenant growth data:', error);
    throw new Error('Failed to load tenant growth data');
  }
};

/**
 * Get revenue data
 */
export const getRevenueData = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueData = await prisma.orderPayment.groupBy({
      by: ['createdAt'],
      _sum: {
        amount: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
        // Note: status field may not exist in OrderPayment model
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return revenueData.map(item => ({
      date: item.createdAt,
      amount: Number(item._sum.amount || 0)
    }));
  } catch (error) {
    console.error('Error getting revenue data:', error);
    throw new Error('Failed to load revenue data');
  }
};

/**
 * Get user activity data
 */
export const getUserActivityData = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activityData = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return activityData.map(item => ({
      date: item.createdAt,
      count: item._count.id
    }));
  } catch (error) {
    console.error('Error getting user activity data:', error);
    throw new Error('Failed to load user activity data');
  }
};

/**
 * Get tenant overview data for dashboard cards
 */
export const getTenantOverviewData = async (limit: number = 10) => {
  try {
    const tenants = await prisma.tenant.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    // Get monthly revenue for each tenant
    const tenantRevenues = await Promise.all(
      tenants.map(async (tenant) => {
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const revenue = await prisma.orderPayment.aggregate({
          _sum: {
            amount: true
          },
          where: {
            order: {
              tenantId: tenant.id
            },
            createdAt: {
              gte: currentMonth
            }
          }
        });

        return {
          tenantId: tenant.id,
          monthlyRevenue: Number(revenue._sum.amount || 0)
        };
      })
    );

    // Combine tenant data with revenue data
    const tenantCards = tenants.map((tenant, index) => ({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: tenant.isActive ? 'active' : 'inactive' as 'active' | 'inactive' | 'suspended' | 'maintenance',
      userCount: tenant._count.users,
      monthlyRevenue: tenantRevenues[index]?.monthlyRevenue || 0,
      lastActivity: tenant.createdAt, // Using createdAt as lastActivity for now
      health: 'healthy' as 'healthy' | 'warning' | 'critical', // Default to healthy
      plan: tenant.plan?.toLowerCase() as 'basic' | 'premium' | 'enterprise' || 'basic'
    }));

    return tenantCards;
  } catch (error) {
    console.error('Error getting tenant overview data:', error);
    throw new Error('Failed to load tenant overview data');
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
  getTenantOverviewData,
};
