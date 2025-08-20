'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { biService } from '../../../services/biService';
import { BIDashboard, KPIData } from '../../../types/bi';

interface BIStats {
  totalSales: number;
  totalProfit: number;
  profitMargin: number;
  activeProducts: number;
  lowStockItems: number;
  monthlyGrowth: number;
  inventoryTurnover: number;
  averageOrderValue: number;
  stockoutRate: number;
}

interface QuickReport {
  id: string;
  title: string;
  description: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export default function BusinessIntelligenceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BIStats>({
    totalSales: 0,
    totalProfit: 0,
    profitMargin: 0,
    activeProducts: 0,
    lowStockItems: 0,
    monthlyGrowth: 0,
    inventoryTurnover: 0,
    averageOrderValue: 0,
    stockoutRate: 0
  });
  const [reports, setReports] = useState<QuickReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBIData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real BI data from backend
      const [dashboardResponse, kpisResponse] = await Promise.all([
        biService.getDashboard('30d'),
        biService.getKPIs('30d')
      ]);

      // Extract data from wrapped responses
      let dashboard: BIDashboard | null = null, kpis: KPIData | null = null;
      
      if (dashboardResponse && typeof dashboardResponse === 'object' && (dashboardResponse as { success?: boolean; data?: BIDashboard }).success && (dashboardResponse as { success?: boolean; data?: BIDashboard }).data) {
        dashboard = (dashboardResponse as { success?: boolean; data?: BIDashboard }).data || null;
        console.log('✅ Extracted dashboard data from wrapped response');
      } else {
        dashboard = dashboardResponse as BIDashboard || null;
        console.log('✅ Using direct dashboard response structure');
      }
      
      if (kpisResponse && typeof kpisResponse === 'object' && (kpisResponse as { success?: boolean; data?: KPIData }).success && (kpisResponse as { success?: boolean; data?: KPIData }).data) {
        kpis = (kpisResponse as { success?: boolean; data?: KPIData }).data || null;
        console.log('✅ Extracted KPIs data from wrapped response');
      } else {
        kpis = kpisResponse as KPIData || null;
        console.log('✅ Using direct KPIs response structure');
      }

      // Map backend data to frontend stats
      setStats({
        totalSales: kpis?.financial?.totalRevenue?.value || 0,
        totalProfit: kpis?.financial?.netProfit?.value || 0,
        profitMargin: kpis?.financial?.profitMargin?.value || 0,
        activeProducts: dashboard?.kpis?.activeProductsCount || 0,
        lowStockItems: Math.floor((kpis?.operational?.stockoutRate?.value || 0) / 100 * 50), // Estimate based on rate
        monthlyGrowth: kpis?.financial?.totalRevenue?.changePercent || 0,
        inventoryTurnover: kpis?.operational?.inventoryTurnover?.value || 0,
        averageOrderValue: kpis?.operational?.averageOrderTime?.value || 0, // Using averageOrderTime as fallback
        stockoutRate: kpis?.operational?.stockoutRate?.value || 0
      });

      // Generate reports from KPI data
      const quickReports: QuickReport[] = [
        {
          id: '1',
          title: 'درآمد کل',
          description: 'مجموع درآمد در 30 روز گذشته',
          value: formatCurrency(kpis?.financial?.totalRevenue?.value || 0),
          change: kpis?.financial?.totalRevenue?.changePercent || 0,
          trend: kpis?.financial?.totalRevenue?.trend === 'UP' ? 'up' : 
                kpis?.financial?.totalRevenue?.trend === 'DOWN' ? 'down' : 'neutral'
        },
        {
          id: '2',
          title: 'سود خالص',
          description: 'سود پس از کسر هزینه‌ها',
          value: formatCurrency(kpis?.financial?.netProfit?.value || 0),
          change: kpis?.financial?.netProfit?.changePercent || 0,
          trend: kpis?.financial?.netProfit?.trend === 'UP' ? 'up' : 
                kpis?.financial?.netProfit?.trend === 'DOWN' ? 'down' : 'neutral'
        },
        {
          id: '3',
          title: 'حاشیه سود',
          description: 'درصد سود نسبت به فروش',
          value: `${(kpis?.financial?.profitMargin?.value || 0).toFixed(1)}%`,
          change: kpis?.financial?.profitMargin?.changePercent || 0,
          trend: kpis?.financial?.profitMargin?.trend === 'UP' ? 'up' : 
                kpis?.financial?.profitMargin?.trend === 'DOWN' ? 'down' : 'neutral'
        }
      ];

      setReports(quickReports);
    } catch (error) {
      console.error('Error fetching BI data:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت داده‌های BI');
      
      // Fallback to basic data when API fails
      setStats({
        totalSales: 0,
        totalProfit: 0,
        profitMargin: 0,
        activeProducts: 0,
        lowStockItems: 0,
        monthlyGrowth: 0,
        inventoryTurnover: 0,
        averageOrderValue: 0,
        stockoutRate: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBIData();
  }, [fetchBIData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const quickActions = [
    {
      title: 'تحلیل ABC',
      description: 'دسته‌بندی محصولات بر اساس فروش',
      href: '/workspaces/business-intelligence/abc-analysis',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'bg-blue-500'
    },
    {
      title: 'تحلیل سودآوری',
      description: 'بررسی سود و زیان محصولات',
      href: '/workspaces/business-intelligence/profit-analysis',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-green-500'
    },
    {
      title: 'تحلیل روند',
      description: 'بررسی روندهای فروش',
      href: '/workspaces/business-intelligence/trend-analysis',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      color: 'bg-purple-500'
    },
    {
      title: 'گزارش‌ساز سفارشی',
      description: 'ایجاد گزارش‌های سفارشی',
      href: '/workspaces/business-intelligence/custom-reports',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری داده‌های BI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchBIData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              داشبورد هوش تجاری
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              خوش آمدید {user?.name} - تحلیل و گزارش‌گیری پیشرفته
            </p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">آخرین بروزرسانی</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل فروش</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSales)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">+{stats.monthlyGrowth}% این ماه</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">سود خالص</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalProfit)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">حاشیه سود: {stats.profitMargin}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">محصولات فعال</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeProducts}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{stats.lowStockItems} کم موجود</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ابزارهای تحلیل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`p-2 ${action.color} rounded-lg`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش‌های سریع</h2>
          <Link
            href="/workspaces/business-intelligence/custom-reports"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
          >
            مشاهده همه گزارش‌ها
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{report.title}</h3>
                <div className="flex items-center">
                  {report.trend === 'up' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {report.trend === 'down' && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                  <span className={`text-sm ml-1 ${
                    report.trend === 'up' ? 'text-green-600' : 
                    report.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {report.change > 0 ? '+' : ''}{report.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{report.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 