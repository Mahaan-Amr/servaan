'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Shield, Users, Building, DollarSign, Activity, TrendingUp, Clock, AlertTriangle, CheckCircle, Server, RefreshCw } from 'lucide-react';
import { t } from '@/constants/localization';
import { formatAdminDate, getCurrentPersianTime } from '@/utils/persianDate';
import { getDashboardStats, getRecentActivities, getSystemMetrics } from '@/services/dashboardService';
import toast from 'react-hot-toast';

// Import enhanced dashboard components
import SystemHealthWidget from '@/components/admin/dashboard/SystemHealthWidget';
import TenantOverviewCards from '@/components/admin/dashboard/TenantOverviewCards';
import PlatformAnalytics from '@/components/admin/dashboard/PlatformAnalytics';
import QuickActions from '@/components/admin/dashboard/QuickActions';

// Real data interfaces (will be populated from API)
interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical' | 'maintenance';
  lastUpdated: Date;
}

interface RecentActivity {
  id: string;
  type: 'tenant' | 'user' | 'system' | 'security';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  uptime: number;
  responseTime: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAdminAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    systemHealth: 'healthy',
    lastUpdated: new Date(),
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkIO: 0,
    uptime: 0,
    responseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentPersianTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load dashboard data
  const loadDashboardData = async (showToast: boolean = false) => {
    if (!isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load data in parallel for better performance
      const [statsData, activitiesData, metricsData] = await Promise.all([
        getDashboardStats(),
        getRecentActivities(10),
        getSystemMetrics()
      ]);
      
      setStats(statsData);
      setRecentActivities(activitiesData);
      setSystemMetrics(metricsData);
      setLastRefresh(new Date());
      
      if (showToast) {
        toast.success('داده‌های داشبورد به‌روزرسانی شد');
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'خطا در بارگذاری داده‌ها';
      setError(errorMessage);
      
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-admin-healthy bg-green-100';
      case 'warning':
        return 'text-admin-warning bg-yellow-100';
      case 'critical':
        return 'text-admin-critical bg-red-100';
      case 'maintenance':
        return 'text-admin-maintenance bg-purple-100';
      default:
        return 'text-admin-text-muted bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return t('status.healthy');
      case 'warning':
        return t('status.warning');
      case 'critical':
        return t('status.critical');
      case 'maintenance':
        return t('status.maintenance');
      default:
        return t('status.unknown');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tenant':
        return <Building className="h-5 w-5" />;
      case 'user':
        return <Users className="h-5 w-5" />;
      case 'system':
        return <Server className="h-5 w-5" />;
      case 'security':
        return <Shield className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-admin-success';
      case 'warning':
        return 'text-admin-warning';
      case 'error':
        return 'text-admin-danger';
      case 'info':
      default:
        return 'text-admin-info';
    }
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-admin-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-admin-text mb-2">خطا در بارگذاری داده‌ها</h2>
          <p className="text-admin-text-light mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="btn-admin-primary flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (loading && !stats.totalTenants) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-admin-text">در حال بارگذاری داده‌های داشبورد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-admin-text mb-2">
                {t('dashboard.welcome')}، {user?.email}!
              </h1>
              <p className="text-admin-text-light">
                {t('dashboard.overview')} پلتفرم شما در امروز
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="btn-admin-secondary flex items-center"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
            </button>
          </div>
          <div className="flex items-center text-sm text-admin-text-muted">
            <Clock className="h-4 w-4 ml-1" />
            {t('dashboard.lastUpdated')}: {formatAdminDate(lastRefresh, { format: 'long' })} - {currentTime}
          </div>
        </div>

        {/* Enhanced Dashboard Components */}
        <div className="space-y-8">
          {/* Tenant Overview Cards */}
          <TenantOverviewCards autoRefresh={true} refreshInterval={60000} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health Widget */}
            <div className="lg:col-span-1">
              <SystemHealthWidget autoRefresh={true} refreshInterval={30000} />
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="text-lg font-semibold text-admin-text">{t('dashboard.recentActivity')}</h3>
                </div>
                <div className="admin-card-body">
                  {recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                          <div className={`p-2 rounded-admin ${getSeverityColor(activity.severity)} bg-opacity-10`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-admin-text">{activity.message}</p>
                            <p className="text-xs text-admin-text-muted mt-1">
                              {formatAdminDate(activity.timestamp, { format: 'relative' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-admin-text-muted">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>هیچ فعالیتی یافت نشد</p>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-admin-border">
                    <button className="text-admin-primary hover:text-admin-primary-dark text-sm font-medium">
                      {t('dashboard.viewAll')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Analytics */}
          <PlatformAnalytics autoRefresh={true} refreshInterval={300000} />

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
