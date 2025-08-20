'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';
import { AnalyticsService } from '../../../../services/orderingService';
import { 
  CustomBarChart, 
  CustomLineChart, 
  CustomDonutChart,
  CustomAreaChart,
  CustomPieChart
} from '../../../../components/charts';
import { 
  FaChartLine, 
  FaDollarSign, 
  FaShoppingCart, 
  FaUsers, 
  FaDownload,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';

// Analytics Data Interfaces
interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  topSellingItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageOrderValue: number;
  customerGrowth: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
    lastVisit: string;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageSpent: number;
  }>;
}

interface KitchenPerformance {
  totalOrders: number;
  averagePrepTime: number;
  onTimeDelivery: number;
  delayedOrders: number;
  efficiency: number;
  topItems: Array<{
    itemName: string;
    orderCount: number;
    averagePrepTime: number;
  }>;
  performanceByHour: Array<{
    hour: number;
    orders: number;
    averagePrepTime: number;
  }>;
}

interface TableUtilization {
  totalTables: number;
  averageUtilization: number;
  peakHours: Array<{
    hour: number;
    utilization: number;
  }>;
  topPerformingTables: Array<{
    tableNumber: string;
    utilization: number;
    revenue: number;
    orderCount: number;
  }>;
  capacityOptimization: Array<{
    tableNumber: string;
    capacity: number;
    utilization: number;
    recommendation: string;
  }>;
}

interface AnalyticsData {
  sales: SalesAnalytics | null;
  customers: CustomerAnalytics | null;
  kitchen: KitchenPerformance | null;
  tables: TableUtilization | null;
  period: {
    startDate: string;
    endDate: string;
  };
}

// API Response types for proper typing
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
}

type SalesApiResponse = ApiResponse<SalesAnalytics>;
type CustomerApiResponse = ApiResponse<CustomerAnalytics>;
type KitchenApiResponse = ApiResponse<KitchenPerformance>;
type TableApiResponse = ApiResponse<TableUtilization>;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [data, setData] = useState<AnalyticsData>({
    sales: null,
    customers: null,
    kitchen: null,
    tables: null,
    period: {
      startDate: '',
      endDate: ''
    }
  });

  // Calculate date range based on timeRange
  const getDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }, [timeRange]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange();

      // Fetch analytics data from backend
      const [salesRes, customersRes, kitchenRes, tablesRes] = await Promise.allSettled([
        AnalyticsService.getSalesSummary(dateRange.startDate, dateRange.endDate),
        AnalyticsService.getCustomerAnalytics(dateRange.startDate, dateRange.endDate),
        AnalyticsService.getKitchenPerformance(dateRange.startDate, dateRange.endDate),
        AnalyticsService.getTableUtilization(dateRange.startDate, dateRange.endDate)
      ]);

      setData({
        sales: salesRes.status === 'fulfilled' ? (salesRes.value as SalesApiResponse)?.data : null,
        customers: customersRes.status === 'fulfilled' ? (customersRes.value as CustomerApiResponse)?.data : null,
        kitchen: kitchenRes.status === 'fulfilled' ? (kitchenRes.value as KitchenApiResponse)?.data : null,
        tables: tablesRes.status === 'fulfilled' ? (tablesRes.value as TableApiResponse)?.data : null,
        period: dateRange
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات تحلیلی');
      toast.error('خطا در بارگذاری اطلاعات تحلیلی');
    } finally {
      setLoading(false);
    }
  }, [user, getDateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  // Export functions
  const exportToPDF = () => {
    toast.success('گزارش PDF در حال آماده‌سازی...');
    // TODO: Implement PDF export
  };

  const exportToExcel = () => {
    toast.success('گزارش Excel در حال آماده‌سازی...');
    // TODO: Implement Excel export
  };

  const exportToCSV = () => {
    toast.success('گزارش CSV در حال آماده‌سازی...');
    // TODO: Implement CSV export
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('fa-IR', { 
      style: 'percent', 
      minimumFractionDigits: 1 
    }).format(value / 100);
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <FaArrowUp className="text-green-500" />;
    if (value < 0) return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-500" />;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              گزارشات و تحلیل
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              تحلیل فروش، عملکرد و گزارشات تفصیلی سیستم سفارش‌گیری
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {([
                { value: '7d', label: '7 روز' },
                { value: '30d', label: '30 روز' },
                { value: '90d', label: '90 روز' },
                { value: '1y', label: '1 سال' }
              ] as const).map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range.value
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={exportToPDF}
                className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaDownload className="inline ml-1" />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                <FaDownload className="inline ml-1" />
                Excel
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaDownload className="inline ml-1" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Period Display */}
        <div className="card p-4">
          <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
            <FaCalendarAlt />
            <span>دوره تحلیلی: {data.period.startDate} تا {data.period.endDate}</span>
          </div>
        </div>

        {/* Sales Metrics */}
        {data.sales && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaDollarSign className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل درآمد</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.sales.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(data.sales.revenueGrowth)}
                    <span className={`text-sm font-medium mr-1 ${getGrowthColor(data.sales.revenueGrowth)}`}>
                      {formatPercentage(Math.abs(data.sales.revenueGrowth))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaShoppingCart className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل سفارشات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.sales.totalOrders.toLocaleString('fa-IR')}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(data.sales.orderGrowth)}
                    <span className={`text-sm font-medium mr-1 ${getGrowthColor(data.sales.orderGrowth)}`}>
                      {formatPercentage(Math.abs(data.sales.orderGrowth))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaChartLine className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">میانگین سفارش</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.sales.averageOrderValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaUsers className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">مشتریان فعال</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.customers?.totalCustomers.toLocaleString('fa-IR') || '0'}
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(data.customers?.customerGrowth || 0)}
                    <span className={`text-sm font-medium mr-1 ${getGrowthColor(data.customers?.customerGrowth || 0)}`}>
                      {formatPercentage(Math.abs(data.customers?.customerGrowth || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          {data.sales && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">روند فروش روزانه</h3>
              <CustomLineChart
                data={data.sales.dailyRevenue}
                lines={[
                  { dataKey: 'revenue', fill: '#3B82F6', stroke: '#3B82F6', name: 'درآمد' },
                  { dataKey: 'orders', fill: '#10B981', stroke: '#10B981', name: 'سفارشات' }
                ]}
                xAxisKey="date"
                height={300}
                yAxisLabel="درآمد (ریال)"
              />
            </div>
          )}

          {/* Top Selling Items */}
          {data.sales && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">محصولات پرفروش</h3>
              <CustomBarChart
                data={data.sales.topSellingItems.slice(0, 10)}
                bars={[{ dataKey: 'revenue', fill: '#8B5CF6', name: 'درآمد' }]}
                xAxisKey="itemName"
                height={300}
                yAxisLabel="درآمد (ریال)"
              />
            </div>
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods Distribution */}
          {data.sales && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">توزیع روش‌های پرداخت</h3>
              <CustomDonutChart
                data={data.sales.paymentMethods.map((method, index) => ({
                  name: method.method,
                  value: method.amount,
                  percentage: method.percentage,
                  count: method.count,
                  color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
                }))}

              />
            </div>
          )}

          {/* Hourly Sales Breakdown */}
          {data.sales && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">فروش ساعتی</h3>
              <CustomAreaChart
                data={data.sales.hourlyBreakdown}
                areas={[
                  { dataKey: 'revenue', fill: '#3B82F6', stroke: '#3B82F6', name: 'درآمد' },
                  { dataKey: 'orders', fill: '#10B981', stroke: '#10B981', name: 'سفارشات' }
                ]}
                xAxisKey="hour"
                height={300}
                yAxisLabel="مقدار"
              />
            </div>
          )}
        </div>

        {/* Kitchen Performance */}
        {data.kitchen && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملکرد آشپزخانه</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.kitchen.totalOrders.toLocaleString('fa-IR')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">کل سفارشات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.kitchen.averagePrepTime} دقیقه
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">میانگین زمان آماده‌سازی</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPercentage(data.kitchen.onTimeDelivery)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">تحویل به موقع</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatPercentage(data.kitchen.efficiency)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">کارایی کلی</div>
              </div>
            </div>
          </div>
        )}

        {/* Table Utilization */}
        {data.tables && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">استفاده از میزها</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.tables.totalTables}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">کل میزها</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatPercentage(data.tables.averageUtilization)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">میانگین استفاده</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data.tables.topPerformingTables.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">میزهای برتر</div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Analytics */}
        {data.customers && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تحلیل مشتریان</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">مشتریان برتر</h4>
                <div className="space-y-2">
                  {data.customers.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {customer.customerName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {customer.orderCount} سفارش
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {customer.lastVisit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">بخش‌های مشتری</h4>
                <CustomPieChart
                  data={data.customers.customerSegments.map((segment, index) => ({
                    name: segment.segment,
                    value: segment.count,
                    percentage: segment.percentage,
                    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
                  }))}
                  height={250}
                  showLegend={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 