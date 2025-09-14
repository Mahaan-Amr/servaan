'use client';

import { useState, useEffect } from 'react';
import { formatCurrency as formatCurrencyUtil } from '../../../../../../shared/utils/currencyUtils';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { 
  TenantGrowthData, 
  RevenueData, 
  UserActivityData,
  ChartData 
} from '@/types/dashboard';
import { 
  getTenantGrowthData, 
  getRevenueData, 
  getUserActivityData 
} from '@/services/dashboardService';
import toast from 'react-hot-toast';

interface PlatformAnalyticsProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'area';
  period: '7d' | '30d' | '90d' | '1y';
}

export default function PlatformAnalytics({ 
  className = '', 
  autoRefresh = true, 
  refreshInterval = 300000 // 5 minutes
}: PlatformAnalyticsProps) {
  const [tenantGrowthData, setTenantGrowthData] = useState<TenantGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'line',
    period: '30d'
  });

  const fetchAnalyticsData = async () => {
    try {
      const days = chartConfig.period === '7d' ? 7 : 
                   chartConfig.period === '30d' ? 30 : 
                   chartConfig.period === '90d' ? 90 : 365;

      const [growthData, revenueData, activityData] = await Promise.all([
        getTenantGrowthData(days),
        getRevenueData(days),
        getUserActivityData(days)
      ]);

      // Ensure we have valid data arrays
      setTenantGrowthData(Array.isArray(growthData) ? growthData : []);
      setRevenueData(Array.isArray(revenueData) ? revenueData : []);
      setUserActivityData(Array.isArray(activityData) ? activityData : []);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast.error('خطا در دریافت اطلاعات تحلیل‌ها');
      
      // Set empty arrays as fallback
      setTenantGrowthData([]);
      setRevenueData([]);
      setUserActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [chartConfig.period]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalyticsData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, chartConfig.period]);

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount);
  };

  const formatDate = (date: Date | string) => {
    // Validate date and handle invalid dates
    if (!date) {
      return 'تاریخ نامعتبر';
    }
    
    try {
      // Convert string to Date object if needed
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'تاریخ نامعتبر';
      }
      
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'تاریخ نامعتبر';
    }
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case '7d':
        return '۷ روز گذشته';
      case '30d':
        return '۳۰ روز گذشته';
      case '90d':
        return '۹۰ روز گذشته';
      case '1y':
        return 'یک سال گذشته';
      default:
        return '۳۰ روز گذشته';
    }
  };

  const getChartTypeText = (type: string) => {
    switch (type) {
      case 'line':
        return 'خطی';
      case 'bar':
        return 'ستونی';
      case 'area':
        return 'ناحیه‌ای';
      default:
        return 'خطی';
    }
  };

  // Calculate growth percentages
  const calculateGrowth = (data: any[]) => {
    if (data.length < 2) return { percentage: 0, trend: 'stable' };
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const growth = ((latest.count || latest.amount || 0) - (previous.count || previous.amount || 0)) / (previous.count || previous.amount || 1) * 100;
    
    return {
      percentage: Math.abs(growth),
      trend: growth >= 0 ? 'up' : 'down'
    };
  };

  const tenantGrowth = calculateGrowth(tenantGrowthData);
  const revenueGrowth = calculateGrowth(revenueData);
  const userGrowth = calculateGrowth(userActivityData);

  // Chart data for visualization
  const generateChartData = (data: any[], label: string, color: string): ChartData => {
    const labels = data.map(item => {
      // Ensure we have a valid date
      const date = item.date instanceof Date ? item.date : new Date(item.date);
      return formatDate(date);
    });
    const values = data.map(item => item.count || item.amount || 0);
    
    return {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: color + '20',
        borderColor: color,
        borderWidth: 2
      }]
    };
  };

  const tenantChartData = generateChartData(tenantGrowthData, 'مستأجرین جدید', '#3B82F6');
  const revenueChartData = generateChartData(revenueData, 'درآمد', '#10B981');
  const userChartData = generateChartData(userActivityData, 'کاربران جدید', '#8B5CF6');

  if (loading) {
    return (
      <div className={`admin-card ${className}`}>
        <div className="admin-card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-admin-text">تحلیل‌های پلتفرم</h3>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-admin-primary border-t-transparent"></div>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-card ${className}`}>
      <div className="admin-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-admin-primary ml-2" />
            <h3 className="text-lg font-semibold text-admin-text">تحلیل‌های پلتفرم</h3>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-admin-text-muted">نوع نمودار:</span>
              <select
                value={chartConfig.type}
                onChange={(e) => setChartConfig(prev => ({ ...prev, type: e.target.value as any }))}
                className="text-sm border border-admin-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-admin-primary"
              >
                <option value="line">خطی</option>
                <option value="bar">ستونی</option>
                <option value="area">ناحیه‌ای</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-admin-text-muted">دوره:</span>
              <select
                value={chartConfig.period}
                onChange={(e) => setChartConfig(prev => ({ ...prev, period: e.target.value as any }))}
                className="text-sm border border-admin-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-admin-primary"
              >
                <option value="7d">۷ روز</option>
                <option value="30d">۳۰ روز</option>
                <option value="90d">۹۰ روز</option>
                <option value="1y">یک سال</option>
              </select>
            </div>
            
            <button
              onClick={fetchAnalyticsData}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="به‌روزرسانی"
            >
              <RefreshCw className="h-4 w-4 text-admin-text-muted" />
            </button>
            
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="دانلود گزارش">
              <Download className="h-4 w-4 text-admin-text-muted" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-card-body">
        <div className="space-y-8">
          {/* Tenant Growth Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-blue-600 ml-2" />
                <h4 className="text-lg font-semibold text-admin-text">رشد مستأجرین</h4>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-admin-text-muted">{getPeriodText(chartConfig.period)}</span>
                <div className={`flex items-center px-2 py-1 rounded-full ${
                  tenantGrowth.trend === 'up' ? 'text-green-600 bg-green-50' : 
                  tenantGrowth.trend === 'down' ? 'text-red-600 bg-red-50' : 
                  'text-gray-600 bg-gray-50'
                }`}>
                  {tenantGrowth.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 ml-1" />
                  ) : tenantGrowth.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 ml-1" />
                  ) : null}
                  <span className="text-xs font-medium">
                    {tenantGrowth.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mock Chart Visualization */}
            <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">نمودار رشد مستأجرین</p>
                <p className="text-sm text-gray-400">
                  {tenantGrowthData.length} نقطه داده در {getPeriodText(chartConfig.period)}
                </p>
                <div className="mt-4 flex justify-center space-x-4 space-x-reverse">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tenantGrowthData.reduce((sum, item) => sum + item.count, 0)}
                    </div>
                    <div className="text-sm text-gray-500">مستأجرین جدید</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 ml-2" />
                <h4 className="text-lg font-semibold text-admin-text">درآمد پلتفرم</h4>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-admin-text-muted">{getPeriodText(chartConfig.period)}</span>
                <div className={`flex items-center px-2 py-1 rounded-full ${
                  revenueGrowth.trend === 'up' ? 'text-green-600 bg-green-50' : 
                  revenueGrowth.trend === 'down' ? 'text-red-600 bg-red-50' : 
                  'text-gray-600 bg-gray-50'
                }`}>
                  {revenueGrowth.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 ml-1" />
                  ) : revenueGrowth.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 ml-1" />
                  ) : null}
                  <span className="text-xs font-medium">
                    {revenueGrowth.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mock Chart Visualization */}
            <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">نمودار درآمد</p>
                <p className="text-sm text-gray-400">
                  {revenueData.length} نقطه داده در {getPeriodText(chartConfig.period)}
                </p>
                <div className="mt-4 flex justify-center space-x-4 space-x-reverse">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(revenueData.reduce((sum, item) => sum + item.amount, 0))}
                    </div>
                    <div className="text-sm text-gray-500">کل درآمد</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Activity Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 ml-2" />
                <h4 className="text-lg font-semibold text-admin-text">فعالیت کاربران</h4>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-admin-text-muted">{getPeriodText(chartConfig.period)}</span>
                <div className={`flex items-center px-2 py-1 rounded-full ${
                  userGrowth.trend === 'up' ? 'text-green-600 bg-green-50' : 
                  userGrowth.trend === 'down' ? 'text-red-600 bg-red-50' : 
                  'text-gray-600 bg-gray-50'
                }`}>
                  {userGrowth.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 ml-1" />
                  ) : userGrowth.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 ml-1" />
                  ) : null}
                  <span className="text-xs font-medium">
                    {userGrowth.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mock Chart Visualization */}
            <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">نمودار فعالیت کاربران</p>
                <p className="text-sm text-gray-400">
                  {userActivityData.length} نقطه داده در {getPeriodText(chartConfig.period)}
                </p>
                <div className="mt-4 flex justify-center space-x-4 space-x-reverse">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {userActivityData.reduce((sum, item) => sum + item.count, 0)}
                    </div>
                    <div className="text-sm text-gray-500">کاربران جدید</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-admin-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {tenantGrowthData.reduce((sum, item) => sum + item.count, 0)}
              </div>
              <div className="text-sm text-admin-text-muted">مستأجرین جدید</div>
              <div className="text-xs text-admin-text-muted mt-1">
                در {getPeriodText(chartConfig.period)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(revenueData.reduce((sum, item) => sum + item.amount, 0))}
              </div>
              <div className="text-sm text-admin-text-muted">کل درآمد</div>
              <div className="text-xs text-admin-text-muted mt-1">
                در {getPeriodText(chartConfig.period)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {userActivityData.reduce((sum, item) => sum + item.count, 0)}
              </div>
              <div className="text-sm text-admin-text-muted">کاربران جدید</div>
              <div className="text-xs text-admin-text-muted mt-1">
                در {getPeriodText(chartConfig.period)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
