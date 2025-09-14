'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency as formatCurrencyUtil } from '../../../../../../shared/utils/currencyUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign,
  Users,
  Download,
  Building2,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getTenantGrowthAnalytics, 
  getTenantRevenueAnalytics,
  exportTenants 
} from '@/services/admin/tenants/tenantService';
import { TenantGrowthAnalytics, TenantRevenueAnalytics } from '@/types/admin';

interface TenantAnalyticsDashboardProps {
  className?: string;
}

export default function TenantAnalyticsDashboard({ className = '' }: TenantAnalyticsDashboardProps) {
  const [growthData, setGrowthData] = useState<TenantGrowthAnalytics | null>(null);
  const [revenueData, setRevenueData] = useState<TenantRevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [growthPeriod, setGrowthPeriod] = useState<number>(30);
  const [growthGroupBy, setGrowthGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [revenueYear, setRevenueYear] = useState<number>(new Date().getFullYear());

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [growth, revenue] = await Promise.all([
        getTenantGrowthAnalytics(growthPeriod, growthGroupBy),
        getTenantRevenueAnalytics(revenuePeriod, revenueYear)
      ]);

      setGrowthData(growth);
      setRevenueData(revenue);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری داده‌های تحلیلی';
      setError(errorMessage);
      toast.error('خطا در بارگذاری داده‌های تحلیلی');
    } finally {
      setLoading(false);
    }
  }, [growthPeriod, growthGroupBy, revenuePeriod, revenueYear]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportTenants(format);
      toast.success(`صادرات داده‌های تحلیلی با موفقیت انجام شد`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در صادرات داده‌ها';
      toast.error(errorMessage);
    }
  };


  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount);
  };

  if (loading && !growthData && !revenueData) {
    return (
      <div className={`bg-white rounded-admin border border-admin-border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-admin-bg rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-admin-bg rounded"></div>
            <div className="h-20 bg-admin-bg rounded"></div>
            <div className="h-20 bg-admin-bg rounded"></div>
          </div>
          <div className="h-64 bg-admin-bg rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-admin border border-admin-border p-6 ${className}`}>
        <div className="text-center py-8">
          <Activity className="h-16 w-16 text-admin-danger mx-auto mb-4" />
          <h3 className="text-lg font-medium text-admin-text mb-2">خطا در بارگذاری داده‌ها</h3>
          <p className="text-admin-text-light mb-4">{error}</p>
          <button 
            onClick={loadAnalytics}
            className="btn-admin-primary"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-admin border border-admin-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-admin-border">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-admin-primary ml-2" />
          <h2 className="text-xl font-bold text-admin-text">داشبورد تحلیلی مستأجرین</h2>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative group">
            <button className="btn-admin-secondary flex items-center">
              <Download className="h-4 w-4 ml-2" />
              صادرات
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-32 bg-white border border-admin-border rounded-admin shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-admin-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Growth Period */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">دوره رشد</label>
            <select
              value={growthPeriod}
              onChange={(e) => setGrowthPeriod(Number(e.target.value))}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            >
              <option value={7}>۷ روز</option>
              <option value={30}>۳۰ روز</option>
              <option value={90}>۹۰ روز</option>
              <option value={365}>یک سال</option>
            </select>
          </div>

          {/* Growth Group By */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">گروه‌بندی رشد</label>
            <select
              value={growthGroupBy}
              onChange={(e) => setGrowthGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            >
              <option value="day">روزانه</option>
              <option value="week">هفتگی</option>
              <option value="month">ماهانه</option>
            </select>
          </div>

          {/* Revenue Period */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">دوره درآمد</label>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            >
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهانه</option>
              <option value="yearly">سالانه</option>
            </select>
          </div>

          {/* Revenue Year */}
          <div>
            <label className="block text-sm font-medium text-admin-text mb-2">سال</label>
            <select
              value={revenueYear}
              onChange={(e) => setRevenueYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Tenants */}
          <div className="bg-gradient-to-br from-admin-primary to-admin-primary-dark text-white p-6 rounded-admin">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-admin-bg text-sm font-medium">کل مستأجرین</p>
                <p className="text-3xl font-bold">
                  {growthData?.data ? growthData.data.reduce((sum, item) => sum + item.new_tenants, 0) : 0}
                </p>
              </div>
              <Building2 className="h-12 w-12 text-admin-bg opacity-80" />
            </div>
          </div>

          {/* Active Tenants */}
          <div className="bg-gradient-to-br from-admin-success to-admin-success-dark text-white p-6 rounded-admin">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-admin-bg text-sm font-medium">مستأجرین فعال</p>
                <p className="text-3xl font-bold">
                  {growthData?.data ? growthData.data.reduce((sum, item) => sum + item.active_tenants, 0) : 0}
                </p>
              </div>
              <Users className="h-12 w-12 text-admin-bg opacity-80" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-admin-warning to-admin-warning-dark text-white p-6 rounded-admin">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-admin-bg text-sm font-medium">کل درآمد</p>
                <p className="text-3xl font-bold">
                  {revenueData?.summary.totalRevenue ? formatCurrency(revenueData.summary.totalRevenue) : '0'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-admin-bg opacity-80" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Growth Chart */}
          <div className="bg-admin-bg p-6 rounded-admin">
            <h3 className="text-lg font-medium text-admin-text mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-admin-primary ml-2" />
              روند رشد مستأجرین
            </h3>
            
            {growthData?.data && growthData.data.length > 0 ? (
              <div className="space-y-3">
                {growthData.data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-admin-text">
                      {new Date(item.period).toLocaleDateString('fa-IR')}
                    </span>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <span className="text-sm text-admin-text">
                        جدید: {item.new_tenants}
                      </span>
                      <span className="text-sm text-admin-success">
                        فعال: {item.active_tenants}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-admin-text-muted">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="bg-admin-bg p-6 rounded-admin">
            <h3 className="text-lg font-medium text-admin-text mb-4 flex items-center">
              <DollarSign className="h-5 w-5 text-admin-warning ml-2" />
              روند درآمد
            </h3>
            
            {revenueData?.data && revenueData.data.length > 0 ? (
              <div className="space-y-3">
                {revenueData.data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-admin-text">{item.period}</span>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <span className="text-sm text-admin-text">
                        {formatCurrency(item.revenue)}
                      </span>
                      <span className={`text-sm flex items-center ${
                        item.growth >= 0 ? 'text-admin-success' : 'text-admin-danger'
                      }`}>
                        {item.growth >= 0 ? (
                          <TrendingUp className="h-3 w-3 ml-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 ml-1" />
                        )}
                        {Math.abs(item.growth)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-admin-text-muted">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        {revenueData?.summary && (
          <div className="mt-8 bg-admin-bg p-6 rounded-admin">
            <h3 className="text-lg font-medium text-admin-text mb-4">خلاصه درآمد</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-admin-text-muted mb-1">کل درآمد</p>
                <p className="text-2xl font-bold text-admin-text">
                  {formatCurrency(revenueData.summary.totalRevenue)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-admin-text-muted mb-1">میانگین رشد</p>
                <p className="text-2xl font-bold text-admin-success">
                  {revenueData.summary.averageGrowth}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-admin-text-muted mb-1">بهترین ماه</p>
                <p className="text-2xl font-bold text-admin-primary">
                  {revenueData.summary.topMonth}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-admin-text-muted mb-1">بیشترین درآمد</p>
                <p className="text-2xl font-bold text-admin-warning">
                  {formatCurrency(revenueData.summary.topRevenue)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
