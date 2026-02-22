'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { biService } from '../../../../services/biService';
import { BIDashboard } from '../../../../types/bi';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '../../../../components/charts';
import { exportDashboardToPDF, exportDashboardToExcel, DashboardExportData } from '../../../../utils/dashboardExport';
import { toast } from 'react-hot-toast';
import { Button, Card, Section } from '../../../../components/ui';

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

export default function MergedDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
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
  const [chartData, setChartData] = useState<{
    revenueChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
      }>;
    } | null;
    topProductsChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
      }>;
    } | null;
    categoryChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
      }>;
    } | null;
  } | null>(null);
  const [dashboardData, setDashboardData] = useState<BIDashboard | null>(null);

  const fetchBIData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardResponse = await biService.getDashboard(period, undefined, undefined, 'merged');

      let dashboard: BIDashboard | null = null;
      
      if (dashboardResponse && typeof dashboardResponse === 'object' && (dashboardResponse as { success?: boolean; data?: BIDashboard }).success && (dashboardResponse as { success?: boolean; data?: BIDashboard }).data) {
        dashboard = (dashboardResponse as { success?: boolean; data?: BIDashboard }).data || null;
      } else {
        dashboard = dashboardResponse as BIDashboard || null;
      }

      if (!dashboard) {
        throw new Error('داده‌های داشبورد دریافت نشد');
      }

      setDashboardData(dashboard);
      const dashboardKPIs = dashboard.kpis;
      
      setStats({
        totalSales: dashboardKPIs?.totalRevenue?.value || 0,
        totalProfit: dashboardKPIs?.netProfit?.value || 0,
        profitMargin: dashboardKPIs?.profitMargin?.value || 0,
        activeProducts: dashboardKPIs?.activeProductsCount || 0,
        lowStockItems: Math.floor((dashboardKPIs?.stockoutRate?.value || 0) / 100 * 50),
        monthlyGrowth: dashboardKPIs?.totalRevenue?.changePercent || 0,
        inventoryTurnover: dashboardKPIs?.inventoryTurnover?.value || 0,
        averageOrderValue: dashboardKPIs?.averageOrderValue?.value || 0,
        stockoutRate: dashboardKPIs?.stockoutRate?.value || 0
      });

      const quickReports: QuickReport[] = [];
      
      if (dashboardKPIs?.totalRevenue) {
        quickReports.push({
          id: '1',
          title: 'درآمد کل',
          description: 'مجموع درآمد در بازه انتخابی',
          value: formatCurrency(dashboardKPIs.totalRevenue.value || 0),
          change: dashboardKPIs.totalRevenue.changePercent || 0,
          trend: dashboardKPIs.totalRevenue.trend === 'UP' ? 'up' : 
                dashboardKPIs.totalRevenue.trend === 'DOWN' ? 'down' : 'neutral'
        });
      }
      
      if (dashboardKPIs?.netProfit) {
        quickReports.push({
          id: '2',
          title: 'سود خالص',
          description: 'سود پس از کسر هزینه‌ها',
          value: formatCurrency(dashboardKPIs.netProfit.value || 0),
          change: dashboardKPIs.netProfit.changePercent || 0,
          trend: dashboardKPIs.netProfit.trend === 'UP' ? 'up' : 
                dashboardKPIs.netProfit.trend === 'DOWN' ? 'down' : 'neutral'
        });
      }
      
      if (dashboardKPIs?.profitMargin) {
        quickReports.push({
          id: '3',
          title: 'حاشیه سود',
          description: 'درصد سود نسبت به فروش',
          value: `${(dashboardKPIs.profitMargin.value || 0).toFixed(1)}%`,
          change: dashboardKPIs.profitMargin.changePercent || 0,
          trend: dashboardKPIs.profitMargin.trend === 'UP' ? 'up' : 
                dashboardKPIs.profitMargin.trend === 'DOWN' ? 'down' : 'neutral'
        });
      }
      
      if (dashboardKPIs?.averageOrderValue) {
        quickReports.push({
          id: '4',
          title: 'میانگین ارزش سفارش',
          description: 'میانگین مبلغ هر سفارش',
          value: formatCurrency(dashboardKPIs.averageOrderValue.value || 0),
          change: dashboardKPIs.averageOrderValue.changePercent || 0,
          trend: dashboardKPIs.averageOrderValue.trend === 'UP' ? 'up' : 
                dashboardKPIs.averageOrderValue.trend === 'DOWN' ? 'down' : 'neutral'
        });
      }
      
      if (dashboardKPIs?.inventoryTurnover) {
        quickReports.push({
          id: '5',
          title: 'گردش موجودی',
          description: 'تعداد دفعات گردش موجودی',
          value: `${(dashboardKPIs.inventoryTurnover.value || 0).toFixed(1)} بار`,
          change: dashboardKPIs.inventoryTurnover.changePercent || 0,
          trend: dashboardKPIs.inventoryTurnover.trend === 'UP' ? 'up' : 
                dashboardKPIs.inventoryTurnover.trend === 'DOWN' ? 'down' : 'neutral'
        });
      }
      
      if (dashboardKPIs?.stockoutRate) {
        quickReports.push({
          id: '6',
          title: 'نرخ کمبود موجودی',
          description: 'درصد کالاهای کم موجود',
          value: `${(dashboardKPIs.stockoutRate.value || 0).toFixed(1)}%`,
          change: dashboardKPIs.stockoutRate.changePercent || 0,
          trend: dashboardKPIs.stockoutRate.trend === 'UP' ? 'up' : 
                dashboardKPIs.stockoutRate.trend === 'DOWN' ? 'down' : 'neutral'
        });
      }

      setReports(quickReports);

      if (dashboard.charts) {
        setChartData({
          revenueChart: dashboard.charts.revenueChart,
          topProductsChart: dashboard.charts.topProductsChart,
          categoryChart: dashboard.charts.categoryChart
        });
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error('Error fetching BI data:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت داده‌های BI');
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
  }, [period]);

  useEffect(() => {
    fetchBIData();
  }, [fetchBIData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const handleExportPDF = () => {
    if (!dashboardData) {
      toast.error('داده‌ای برای صادرات وجود ندارد');
      return;
    }

    try {
      // Filter out non-KPI fields from kpis object
      const kpisForExport: DashboardExportData['kpis'] = {};
      Object.entries(dashboardData.kpis).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          kpisForExport[key] = value;
        }
      });

      const exportData: DashboardExportData = {
        title: 'Merged Dashboard (Ordering + Inventory)',
        period,
        kpis: kpisForExport,
        charts: dashboardData.charts,
        workspace: 'merged',
        generatedAt: dashboardData.generatedAt || new Date(),
        generatedBy: user?.name
      };
      exportDashboardToPDF(exportData);
      toast.success('داشبورد با موفقیت به PDF صادر شد');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('خطا در صادرات PDF');
    }
  };

  const handleExportExcel = () => {
    if (!dashboardData) {
      toast.error('داده‌ای برای صادرات وجود ندارد');
      return;
    }

    try {
      // Filter out non-KPI fields from kpis object
      const kpisForExport: DashboardExportData['kpis'] = {};
      Object.entries(dashboardData.kpis).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          kpisForExport[key] = value;
        }
      });

      const exportData: DashboardExportData = {
        title: 'Merged Dashboard (Ordering + Inventory)',
        period,
        kpis: kpisForExport,
        charts: dashboardData.charts,
        workspace: 'merged',
        generatedAt: dashboardData.generatedAt || new Date(),
        generatedBy: user?.name
      };
      exportDashboardToExcel(exportData);
      toast.success('داشبورد با موفقیت به Excel صادر شد');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('خطا در صادرات Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری داشبورد ترکیبی...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3 sm:p-4 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button
            onClick={fetchBIData}
            variant="primary"
            size="small"
          >
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Section className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              داشبورد ترکیبی (Merged)
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              تحلیل و گزارش‌گیری از سیستم‌های سفارشات و موجودی
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 sm:space-x-reverse">
            {/* Period Selector */}
            <div className="flex flex-col">
              <label className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                بازه زمانی
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              >
                <option value="7d">۷ روز گذشته</option>
                <option value="30d">۳۰ روز گذشته</option>
                <option value="90d">۹۰ روز گذشته</option>
                <option value="1y">یک سال گذشته</option>
              </select>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col">
              <label className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                صادرات
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                  title="صادرات به PDF"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                  title="صادرات به Excel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <div className="text-left">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">آخرین بروزرسانی</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards - All KPIs for Merged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل فروش</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSales)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% این ماه
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">سود خالص</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalProfit)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">حاشیه سود: {stats.profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">حاشیه سود</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stats.profitMargin.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">درصد سود نسبت به فروش</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-5m-6 5h6a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">میانگین ارزش سفارش</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.averageOrderValue)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">مبلغ متوسط هر سفارش</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">گردش موجودی</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stats.inventoryTurnover.toFixed(1)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">بار در سال</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">نرخ کمبود موجودی</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stats.stockoutRate.toFixed(1)}%</p>
              <p className="text-xs text-red-600 dark:text-red-400">{stats.lowStockItems} کالای کم موجود</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">محصولات فعال</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stats.activeProducts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">تعداد کل محصولات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      {reports.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">گزارش‌های سریع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {reports.map((report) => (
              <div key={report.id} className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{report.title}</h3>
                  <div className="flex items-center">
                    {report.trend === 'up' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {report.trend === 'down' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    <span className={`text-xs sm:text-sm ml-1 ${
                      report.trend === 'up' ? 'text-green-600' : 
                      report.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {report.change > 0 ? '+' : ''}{report.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">{report.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section - All Charts for Merged */}
      {chartData && (
        <div className="space-y-4 sm:space-y-6">
          {/* Revenue Trend Chart */}
          {chartData.revenueChart && chartData.revenueChart.labels && chartData.revenueChart.labels.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                روند درآمد روزانه
              </h2>
              <CustomLineChart
                data={chartData.revenueChart.labels.map((label: string, index: number) => ({
                  date: label,
                  revenue: chartData.revenueChart!.datasets[0]?.data[index] || 0,
                  cost: chartData.revenueChart!.datasets[1]?.data[index] || 0,
                  profit: chartData.revenueChart!.datasets[2]?.data[index] || 0
                }))}
                lines={[
                  { dataKey: 'revenue', stroke: '#22c55e', name: 'درآمد', fill: '#22c55e' },
                  { dataKey: 'cost', stroke: '#ef4444', name: 'هزینه', fill: '#ef4444' },
                  { dataKey: 'profit', stroke: '#3b82f6', name: 'سود', fill: '#3b82f6' }
                ]}
                xAxisKey="date"
                height={300}
                enableExport={true}
                chartId="merged-revenue-chart"
              />
            </div>
          )}

          {/* Top Products Chart */}
          {chartData.topProductsChart && chartData.topProductsChart.labels && chartData.topProductsChart.labels.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                محصولات پرفروش
              </h2>
              <CustomBarChart
                data={chartData.topProductsChart.labels.map((label: string, index: number) => ({
                  name: label,
                  revenue: chartData.topProductsChart!.datasets[0]?.data[index] || 0
                }))}
                bars={[
                  { dataKey: 'revenue', fill: '#3b82f6', name: 'درآمد' }
                ]}
                xAxisKey="name"
                height={300}
                enableExport={true}
                chartId="merged-top-products-chart"
              />
            </div>
          )}

          {/* Category Breakdown Chart */}
          {chartData.categoryChart && chartData.categoryChart.labels && chartData.categoryChart.labels.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                توزیع فروش بر اساس دسته‌بندی
              </h2>
              <CustomPieChart
                data={chartData.categoryChart.labels.map((label: string, index: number) => ({
                  name: label,
                  value: chartData.categoryChart!.datasets[0]?.data[index] || 0,
                  fill: (Array.isArray(chartData.categoryChart!.datasets[0]?.backgroundColor) 
                    ? chartData.categoryChart!.datasets[0]!.backgroundColor[index] 
                    : chartData.categoryChart!.datasets[0]?.backgroundColor) ||
                     ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'][index % 6]
                }))}
                height={300}
                enableExport={true}
                chartId="merged-category-chart"
              />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

