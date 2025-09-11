'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { getCustomerStatistics, getUpcomingBirthdays } from '../../../../services/customerService';
import { getLoyaltyStatistics } from '../../../../services/loyaltyService';
import { getVisitAnalytics } from '../../../../services/visitService';
import { 
  CustomerStatistics, 
  LoyaltyStatistics, 
  VisitAnalytics, 
  Customer 
} from '../../../../types/crm';
import { 
  CustomDonutChart, 
  CustomBarChart, 
  CustomLineChart
} from '../../../../components/charts';

interface AnalyticsData {
  customerStats: CustomerStatistics | null;
  loyaltyStats: LoyaltyStatistics | null;
  visitAnalytics: VisitAnalytics | null;
  upcomingBirthdays: Customer[];
}

interface CustomerTrendData {
  period: string;
  newCustomers: number;
  activeCustomers: number;
  revenue: number;
  [key: string]: unknown;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [data, setData] = useState<AnalyticsData>({
    customerStats: null,
    loyaltyStats: null,
    visitAnalytics: null,
    upcomingBirthdays: []
  });

  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [
        customerStatsRes,
        loyaltyStatsRes,
        visitAnalyticsRes,
        birthdaysRes
      ] = await Promise.allSettled([
        getCustomerStatistics(),
        getLoyaltyStatistics(),
        getVisitAnalytics(),
        getUpcomingBirthdays({ days: 7 })
      ]);

      setData({
        customerStats: customerStatsRes.status === 'fulfilled' ? customerStatsRes.value : null,
        loyaltyStats: loyaltyStatsRes.status === 'fulfilled' ? loyaltyStatsRes.value : null,
        visitAnalytics: visitAnalyticsRes.status === 'fulfilled' ? visitAnalyticsRes.value : null,
        upcomingBirthdays: birthdaysRes.status === 'fulfilled' ? birthdaysRes.value : []
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات تحلیلی');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, timeRange]);

  // Prepare chart data
  const segmentDistributionData = data.customerStats?.bySegment ? 
    Object.entries(data.customerStats.bySegment).map(([segment, count]) => ({
      name: getSegmentLabel(segment),
      value: count,
      count: count,
      color: getSegmentColor(segment),
      percentage: (count / data.customerStats!.total) * 100
    })) : [];

  const tierDistributionData = data.loyaltyStats?.tierDistribution ? 
    Object.entries(data.loyaltyStats.tierDistribution).map(([tier, count]) => ({
      name: getTierLabel(tier),
      value: Number(count),
      count: Number(count),
      color: getTierColor(tier),
      percentage: data.customerStats ? (Number(count) / data.customerStats.total) * 100 : 0
    })) : data.customerStats?.byTier ? 
    Object.entries(data.customerStats.byTier).map(([tier, count]) => ({
      name: getTierLabel(tier),
      value: Number(count),
      count: Number(count),
      color: getTierColor(tier),
      percentage: data.customerStats ? (Number(count) / data.customerStats.total) * 100 : 0
    })) : [];

  const loyaltyTrendData = data.loyaltyStats?.monthlyTrends || [];

  const customerGrowthData = generateCustomerGrowthData(timeRange);

  function getSegmentLabel(segment: string): string {
    const labels: Record<string, string> = {
      'VIP': 'مشتریان VIP',
      'REGULAR': 'مشتریان منظم',
      'OCCASIONAL': 'مشتریان گاه‌به‌گاه',
      'NEW': 'مشتریان جدید'
    };
    return labels[segment] || segment;
  }

  function getSegmentColor(segment: string): string {
    const colors: Record<string, string> = {
      'VIP': '#8B5CF6',
      'REGULAR': '#3B82F6',
      'OCCASIONAL': '#10B981',
      'NEW': '#F59E0B'
    };
    return colors[segment] || '#6B7280';
  }

  function getTierLabel(tier: string): string {
    const labels: Record<string, string> = {
      'PLATINUM': 'پلاتینیوم',
      'GOLD': 'طلایی',
      'SILVER': 'نقره‌ای',
      'BRONZE': 'برنزی'
    };
    return labels[tier] || tier;
  }

  function getTierColor(tier: string): string {
    const colors: Record<string, string> = {
      'PLATINUM': '#6B7280',
      'GOLD': '#F59E0B',
      'SILVER': '#9CA3AF',
      'BRONZE': '#F97316'
    };
    return colors[tier] || '#6B7280';
  }

  function generateCustomerGrowthData(range: string): CustomerTrendData[] {
    // Mock data for customer growth - in real implementation, this would come from API
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data: CustomerTrendData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        period: date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
        newCustomers: Math.floor(Math.random() * 5) + 1,
        activeCustomers: Math.floor(Math.random() * 20) + 10,
        revenue: Math.floor(Math.random() * 5000000) + 1000000
      });
    }
    
    return data;
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount) + ' ریال';
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 sm:w-1/3 mb-3 sm:mb-4"></div>
          <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 sm:w-1/2 mb-6 sm:mb-8"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 animate-pulse">
              <div className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">تحلیل‌های CRM</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            گزارش‌ها و آمارهای جامع مشتریان
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:space-x-reverse">
          <Link
            href="/workspaces/customer-relationship-management/analytics/advanced"
            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            تحلیل‌های پیشرفته
          </Link>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">7 روز گذشته</option>
            <option value="30d">30 روز گذشته</option>
            <option value="90d">90 روز گذشته</option>
            <option value="1y">یک سال گذشته</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium">کل مشتریان</p>
              <p className="text-2xl sm:text-3xl font-bold">{data.customerStats?.total || 0}</p>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                {data.customerStats?.newThisMonth || 0} مشتری جدید این ماه
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-400 bg-opacity-25 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm font-medium">مشتریان فعال</p>
              <p className="text-2xl sm:text-3xl font-bold">{data.customerStats?.active || 0}</p>
              <p className="text-green-100 text-xs sm:text-sm mt-1">
                {data.customerStats ? Math.round((data.customerStats.active / data.customerStats.total) * 100) : 0}% از کل مشتریان
              </p>
            </div>
            <div className="w-12 h-12 bg-green-400 bg-opacity-25 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium">امتیازات فعال</p>
              <p className="text-2xl sm:text-3xl font-bold">{data.loyaltyStats?.activePoints?.toLocaleString('fa-IR') || 0}</p>
              <p className="text-purple-100 text-xs sm:text-sm mt-1">
                {data.loyaltyStats?.averagePointsPerCustomer?.toLocaleString('fa-IR') || 0} امتیاز به ازای هر مشتری
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-400 bg-opacity-25 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs sm:text-sm font-medium">میانگین ارزش مشتری</p>
              <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(data.customerStats?.averageLifetimeValue || 0).split(' ')[0]}</p>
              <p className="text-orange-100 text-xs sm:text-sm mt-1">
                {data.customerStats?.averageVisits || 0} بازدید به طور متوسط
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-400 bg-opacity-25 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Customer Segment Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">توزیع بخش‌های مشتری</h3>
          {segmentDistributionData.length > 0 ? (
            <CustomDonutChart
              data={segmentDistributionData}

            />
          ) : (
            <div className="flex items-center justify-center h-48 sm:h-64">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>

        {/* Loyalty Tier Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">توزیع سطوح وفاداری</h3>
          {tierDistributionData.length > 0 ? (
            <CustomBarChart
              data={tierDistributionData.map(item => ({
                name: item.name,
                value: item.count,
                fill: item.color
              }))}
              bars={[{ dataKey: 'value', fill: '#8884d8', name: 'تعداد مشتریان' }]}
              xAxisKey="name"
              height={300}
              yAxisLabel="تعداد مشتریان"
            />
          ) : (
            <div className="flex items-center justify-center h-48 sm:h-64">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Customer Growth Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">روند رشد مشتریان</h3>
          <CustomLineChart
            data={customerGrowthData}
            lines={[
              { dataKey: 'newCustomers', fill: '#3B82F6', stroke: '#3B82F6', name: 'مشتریان جدید' },
              { dataKey: 'activeCustomers', fill: '#10B981', stroke: '#10B981', name: 'مشتریان فعال' }
            ]}
            xAxisKey="period"
            height={300}
            yAxisLabel="تعداد مشتری"
          />
        </div>

        {/* Loyalty Points Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">روند امتیازات وفاداری</h3>
          {loyaltyTrendData.length > 0 ? (
            <CustomLineChart
              data={loyaltyTrendData}
              lines={[
                { dataKey: 'pointsIssued', fill: '#8B5CF6', stroke: '#8B5CF6', name: 'امتیازات اعطایی' },
                { dataKey: 'pointsRedeemed', fill: '#F59E0B', stroke: '#F59E0B', name: 'امتیازات استفاده شده' }
              ]}
              xAxisKey="month"
              height={300}
              yAxisLabel="امتیاز"
            />
          ) : (
            <div className="flex items-center justify-center h-48 sm:h-64">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Birthdays */}
      {data.upcomingBirthdays.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">تولدهای نزدیک (7 روز آینده)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcomingBirthdays.map((customer) => (
              <div key={customer.id} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{customer.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
                    {customer.birthday && (
                      <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                        تولد: {new Date(customer.birthday).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                  <div className="text-yellow-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.993 1.993 0 003 15.546V7c0-1.657 1.343-3 3-3h12c1.657 0 3 1.343 3 3v8.546z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">آمار امتیازات</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل امتیازات اعطایی:</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {data.loyaltyStats?.totalPointsIssued?.toLocaleString('fa-IR') || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل امتیازات استفاده شده:</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {data.loyaltyStats?.totalPointsRedeemed?.toLocaleString('fa-IR') || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">نرخ استفاده:</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {data.loyaltyStats?.totalPointsIssued ? 
                  Math.round((data.loyaltyStats.totalPointsRedeemed / data.loyaltyStats.totalPointsIssued) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">آمار بازدیدها</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل بازدیدها:</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {data.visitAnalytics?.totalVisits?.toLocaleString('fa-IR') || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل درآمد:</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.visitAnalytics?.totalRevenue || 0).split(' ')[0]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">میانگین سفارش:</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.visitAnalytics?.averageOrderValue || 0).split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">مشتریان برتر</h4>
          <div className="space-y-3">
            {data.customerStats?.topSpenders?.slice(0, 3).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{customer.name}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {customer.loyalty?.lifetimeSpent ? formatCurrency(Number(customer.loyalty.lifetimeSpent)).split(' ')[0] : '0'}
                </span>
              </div>
            )) || (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">اطلاعاتی موجود نیست</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 