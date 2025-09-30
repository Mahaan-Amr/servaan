'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Package, 
  ShoppingCart,
  // Calendar,
  Activity,
  RefreshCw,
  Download,
  // Filter
} from 'lucide-react';
import { TenantMetrics } from '@/services/admin/tenants/tenantService';
import { formatAdminDate } from '@/utils/persianDate';
import toast from 'react-hot-toast';

interface TenantMetricsDashboardProps {
  tenantId: string;
  metrics: TenantMetrics;
  onRefresh?: () => void;
}

// interface ChartData {
//   labels: string[];
//   datasets: {
//     label: string;
//     data: number[];
//     backgroundColor: string[];
//     borderColor: string[];
//     borderWidth: number;
//   }[];
// }

export default function TenantMetricsDashboard({ metrics, onRefresh }: TenantMetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  // const [loading, setLoading] = useState(false);
  // const [chartData, setChartData] = useState<ChartData | null>(null);

  // Generate mock chart data based on time range
  useEffect(() => {
    generateChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, metrics]);

  // Early return if metrics is not available (after hooks)
  if (!metrics || !metrics.revenue || !metrics.orders || !metrics.users) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">در حال بارگذاری متریک‌ها...</div>
        </div>
      </div>
    );
  }

  const generateChartData = () => {
    // Early return if metrics is not available
    if (!metrics || !metrics.revenue || !metrics.orders || !metrics.users) {
      return;
    }

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const labels = [];
    const revenueData = [];
    const orderData = [];
    const userData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Keep label formats within allowed union types ('short' | 'long' | 'relative' | 'jalali')
      labels.push(formatAdminDate(date, { format: timeRange === '1y' ? 'long' : 'short' }));

      // Generate realistic data based on metrics with safe fallbacks
      const revenueBase = safeNum(metrics.revenue?.thisMonth, 100000) / days;
      const orderBase = safeNum(metrics.orders?.thisMonth, 10) / days;
      const userBase = safeNum(metrics.users?.total, 5) / days;

      revenueData.push(Math.floor(Math.random() * revenueBase) + 100000);
      orderData.push(Math.floor(Math.random() * orderBase) + 1);
      userData.push(Math.floor(Math.random() * userBase) + 1);
    }

    // setChartData({ labels, datasets: [...] }) // disabled until charts are implemented
  };

  const safeNum = (v: unknown, fallback = 0): number => {
    const n = typeof v === 'number' && isFinite(v) ? v : Number(v);
    return isFinite(n) && !isNaN(n) ? n : fallback;
  };

  const formatToman = (amountRial: number | undefined) => {
    const amountToman = Math.floor(safeNum(amountRial, 0) / 10);
    return `${amountToman.toLocaleString('fa-IR')} تومان`;
  };

  const formatNumber = (num: number | undefined) => {
    return safeNum(num, 0).toLocaleString('fa-IR');
  };

  const getGrowthIcon = (growth: number | undefined) => {
    const g = safeNum(growth, 0);
    return g > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number | undefined) => {
    const g = safeNum(growth, 0);
    return g > 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleExport = () => {
    toast.success('گزارش در حال آماده‌سازی...');
    // In real implementation, this would generate and download a report
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-admin-text">داشبورد متریک‌ها</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-1 border border-admin-border rounded-admin text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent"
          >
            <option value="7d">۷ روز گذشته</option>
            <option value="30d">۳۰ روز گذشته</option>
            <option value="90d">۹۰ روز گذشته</option>
            <option value="1y">یک سال گذشته</option>
          </select>
          
          <button
            onClick={onRefresh}
            className="btn-admin-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            به‌روزرسانی
          </button>
          
          <button
            onClick={handleExport}
            className="btn-admin-primary flex items-center"
          >
            <Download className="h-4 w-4 ml-1" />
            صادرات
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-admin p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">کل درآمد</p>
              <p className="text-2xl font-bold text-green-900">{formatToman(metrics?.revenue?.total)}</p>
              <div className="flex items-center mt-1">
                {getGrowthIcon(metrics?.revenue?.growth)}
                <span className={`text-sm font-medium ${getGrowthColor(metrics?.revenue?.growth)} mr-1`}>
                  {safeNum(metrics?.revenue?.growth, 0) > 0 ? '+' : ''}{safeNum(metrics?.revenue?.growth, 0)}%
                </span>
                <span className="text-xs text-green-600">نسبت به ماه قبل</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-admin p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">سفارشات این ماه</p>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(metrics?.orders?.thisMonth)}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium text-blue-600">
                  میانگین: {formatToman(metrics?.orders?.averageValue)}
                </span>
              </div>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-admin p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">کاربران فعال</p>
              <p className="text-2xl font-bold text-purple-900">{formatNumber(metrics?.users?.active)}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium text-purple-600">
                  از {formatNumber(metrics?.users?.total)} کل کاربران
                </span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        {/* Inventory Card */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-admin p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">موجودی کل</p>
              <p className="text-2xl font-bold text-orange-900">{formatNumber(metrics?.inventory?.items)}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium text-orange-600">
                  {safeNum(metrics?.inventory?.lowStock, 0)} کم موجود
                </span>
              </div>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white border border-admin-border rounded-admin p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-admin-text">روند درآمد</h4>
            <BarChart3 className="h-5 w-5 text-admin-text-muted" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-admin">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">نمودار درآمد</p>
              <p className="text-sm text-gray-400">در حال توسعه...</p>
            </div>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white border border-admin-border rounded-admin p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-admin-text">روند سفارشات</h4>
            <Activity className="h-5 w-5 text-admin-text-muted" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-admin">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">نمودار سفارشات</p>
              <p className="text-sm text-gray-400">در حال توسعه...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users Breakdown */}
        <div className="bg-white border border-admin-border rounded-admin p-6">
          <h4 className="text-md font-medium text-admin-text mb-4">تفکیک کاربران</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-text">کل کاربران</span>
              <span className="font-medium text-admin-text">{formatNumber(metrics?.users?.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">کاربران فعال</span>
              <span className="font-medium text-green-600">{formatNumber(metrics?.users?.active)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">کاربران غیرفعال</span>
              <span className="font-medium text-red-600">{formatNumber(metrics?.users?.inactive)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(safeNum(metrics?.users?.active, 0) / Math.max(safeNum(metrics?.users?.total, 0), 1)) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {Math.round((safeNum(metrics?.users?.active, 0) / Math.max(safeNum(metrics?.users?.total, 0), 1) ) * 100)}% فعال
            </p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white border border-admin-border rounded-admin p-6">
          <h4 className="text-md font-medium text-admin-text mb-4">تفکیک درآمد</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-text">کل درآمد</span>
              <span className="font-medium text-admin-text">{formatToman(metrics?.revenue?.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600">درآمد این ماه</span>
              <span className="font-medium text-blue-600">{formatToman(metrics?.revenue?.thisMonth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">رشد</span>
              <span className={`font-medium ${getGrowthColor(metrics?.revenue?.growth)}`}>
                {safeNum(metrics?.revenue?.growth, 0) > 0 ? '+' : ''}{safeNum(metrics?.revenue?.growth, 0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min((safeNum(metrics?.revenue?.thisMonth, 0) / Math.max(safeNum(metrics?.revenue?.total, 0), 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {Math.round((safeNum(metrics?.revenue?.thisMonth, 0) / Math.max(safeNum(metrics?.revenue?.total, 0), 1)) * 100)}% از کل درآمد
            </p>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-white border border-admin-border rounded-admin p-6">
          <h4 className="text-md font-medium text-admin-text mb-4">وضعیت موجودی</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-admin-text">کل آیتم‌ها</span>
              <span className="font-medium text-admin-text">{formatNumber(metrics?.inventory?.items)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-600">موجودی کم</span>
              <span className="font-medium text-yellow-600">{formatNumber(metrics?.inventory?.lowStock)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">ناموجود</span>
              <span className="font-medium text-red-600">{formatNumber(metrics?.inventory?.outOfStock)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${((safeNum(metrics?.inventory?.items, 0) - safeNum(metrics?.inventory?.outOfStock, 0)) / Math.max(safeNum(metrics?.inventory?.items, 0), 1)) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {Math.round(((safeNum(metrics?.inventory?.items, 0) - safeNum(metrics?.inventory?.outOfStock, 0)) / Math.max(safeNum(metrics?.inventory?.items, 0), 1)) * 100)}% موجود
            </p>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white border border-admin-border rounded-admin p-6">
        <h4 className="text-md font-medium text-admin-text mb-4">شاخص‌های عملکرد</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-admin">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((safeNum(metrics?.users?.active, 0) / Math.max(safeNum(metrics?.users?.total, 0), 1)) * 100)}%
            </div>
            <div className="text-sm text-green-800">نرخ فعال‌سازی کاربران</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-admin">
            <div className="text-2xl font-bold text-blue-600">
              {formatToman(metrics?.orders?.averageValue)}
            </div>
            <div className="text-sm text-blue-800">میانگین ارزش سفارش</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-admin">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(((safeNum(metrics?.inventory?.items, 0) - safeNum(metrics?.inventory?.outOfStock, 0)) / Math.max(safeNum(metrics?.inventory?.items, 0), 1)) * 100)}%
            </div>
            <div className="text-sm text-purple-800">نرخ موجودی</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-admin">
            <div className="text-2xl font-bold text-orange-600">
              {safeNum(metrics?.revenue?.growth, 0) > 0 ? '+' : ''}{safeNum(metrics?.revenue?.growth, 0)}%
            </div>
            <div className="text-sm text-orange-800">رشد درآمد</div>
          </div>
        </div>
      </div>
    </div>
  );
}
