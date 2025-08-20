'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FaChartLine, FaClock, FaDollarSign, FaUsers, FaLightbulb } from 'react-icons/fa';

interface TableUtilizationMetric {
  tableId: string;
  tableNumber: string;
  tableName?: string;
  section?: string;
  capacity: number;
  totalHours: number;
  occupiedHours: number;
  utilizationRate: number;
  revenue: number;
  averageOrderValue: number;
  orderCount: number;
  averageOccupancyDuration: number;
}

interface PeakHoursData {
  hour: number;
  utilizationRate: number;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

interface TableRevenueData {
  tableId: string;
  tableNumber: string;
  tableName?: string;
  section?: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  revenuePerHour: number;
  revenuePerSeat: number;
  utilizationRate: number;
}

interface CapacityOptimizationData {
  section: string;
  totalCapacity: number;
  averageUtilization: number;
  peakUtilization: number;
  recommendedCapacity: number;
  efficiencyScore: number;
  bottlenecks: string[];
  recommendations: string[];
}

interface TableAnalyticsSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalTables: number;
  averageUtilization: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  peakHours: PeakHoursData[];
  topPerformingTables: TableRevenueData[];
  capacityOptimization: CapacityOptimizationData[];
  performanceInsights: string[];
}

interface TableAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TableAnalyticsDashboard({ isOpen, onClose }: TableAnalyticsDashboardProps) {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'utilization' | 'revenue' | 'capacity' | 'performance'>('overview');
  
  // Analytics data
  const [summary, setSummary] = useState<TableAnalyticsSummary | null>(null);
  const [utilizationMetrics, setUtilizationMetrics] = useState<TableUtilizationMetric[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHoursData[]>([]);
  const [revenueData, setRevenueData] = useState<TableRevenueData[]>([]);
  const [capacityOptimization, setCapacityOptimization] = useState<CapacityOptimizationData[]>([]);

  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      // Load summary data
      const summaryResponse = await fetch(`/api/ordering/tables/analytics/summary?${params}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.data);
      }

      // Load detailed analytics based on active tab
      switch (activeTab) {
        case 'utilization':
          const utilizationResponse = await fetch(`/api/ordering/tables/analytics/utilization?${params}`);
          if (utilizationResponse.ok) {
            const utilizationData = await utilizationResponse.json();
            setUtilizationMetrics(utilizationData.data.utilizationMetrics);
          }
          break;

        case 'revenue':
          const revenueResponse = await fetch(`/api/ordering/tables/analytics/revenue?${params}`);
          if (revenueResponse.ok) {
            const revenueData = await revenueResponse.json();
            setRevenueData(revenueData.data.revenueData);
          }
          break;

        case 'capacity':
          const capacityResponse = await fetch(`/api/ordering/tables/analytics/capacity-optimization?${params}`);
          if (capacityResponse.ok) {
            const capacityData = await capacityResponse.json();
            setCapacityOptimization(capacityData.data.capacityOptimization);
          }
          break;
      }

      // Always load peak hours for charts
      const peakHoursResponse = await fetch(`/api/ordering/tables/analytics/peak-hours?${params}`);
      if (peakHoursResponse.ok) {
        const peakHoursData = await peakHoursResponse.json();
        setPeakHours(peakHoursData.data.peakHours);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری داده‌های تحلیلی';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, activeTab]);

  // Load data on mount and when filters change
  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, loadAnalyticsData]);

  // Format Persian numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${formatNumber(amount)} تومان`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get utilization color
  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get efficiency color
  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              داشبورد تحلیلی میزها
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              تحلیل عملکرد، درآمد و بهینه‌سازی ظرفیت میزها
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
              <span className="text-gray-500">تا</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={loadAnalyticsData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'در حال بارگذاری...' : 'بروزرسانی'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'نمای کلی', icon: FaChartLine },
              { id: 'utilization', label: 'نرخ استفاده', icon: FaUsers },
              { id: 'revenue', label: 'درآمد', icon: FaDollarSign },
              { id: 'capacity', label: 'بهینه‌سازی ظرفیت', icon: FaLightbulb },
              { id: 'performance', label: 'عملکرد', icon: FaClock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'utilization' | 'revenue' | 'capacity' | 'performance')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400">
              <p>{error}</p>
              <button
                onClick={loadAnalyticsData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                تلاش مجدد
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && summary && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FaUsers className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل میزها</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalTables}</p>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                          <FaChartLine className="w-6 h-6 text-green-600 dark:text-green-300" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">نرخ استفاده متوسط</p>
                          <p className={`text-2xl font-bold ${getUtilizationColor(summary.averageUtilization)}`}>
                            {formatPercentage(summary.averageUtilization)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                          <FaDollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل درآمد</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(summary.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <FaClock className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">میانگین سفارش</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(summary.averageOrderValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Peak Hours Chart */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ساعات اوج تقاضا</h3>
                    <div className="grid grid-cols-12 gap-2">
                      {peakHours.map((hour) => (
                        <div key={hour.hour} className="text-center">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {hour.hour}:00
                          </div>
                          <div className="relative bg-gray-200 dark:bg-gray-700 rounded h-32">
                            <div
                              className="absolute bottom-0 w-full bg-blue-500 rounded-b"
                              style={{ height: `${hour.utilizationRate}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                              {formatPercentage(hour.utilizationRate)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {hour.orderCount} سفارش
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Performing Tables */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">بهترین میزها</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-right py-2">میز</th>
                            <th className="text-right py-2">درآمد کل</th>
                            <th className="text-right py-2">تعداد سفارش</th>
                            <th className="text-right py-2">میانگین سفارش</th>
                            <th className="text-right py-2">نرخ استفاده</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.topPerformingTables.slice(0, 5).map((table) => (
                            <tr key={table.tableId} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 text-right">
                                <div>
                                  <div className="font-medium">میز {table.tableNumber}</div>
                                  {table.tableName && (
                                    <div className="text-sm text-gray-500">{table.tableName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 text-right font-medium">
                                {formatCurrency(table.totalRevenue)}
                              </td>
                              <td className="py-2 text-right">{table.orderCount}</td>
                              <td className="py-2 text-right">
                                {formatCurrency(table.averageOrderValue)}
                              </td>
                              <td className="py-2 text-right">
                                <span className={getUtilizationColor(table.utilizationRate)}>
                                  {formatPercentage(table.utilizationRate)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">بینش‌های عملکرد</h3>
                    <div className="space-y-3">
                      {summary.performanceInsights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <FaLightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Utilization Tab */}
              {activeTab === 'utilization' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">نرخ استفاده میزها</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-right py-2">میز</th>
                            <th className="text-right py-2">بخش</th>
                            <th className="text-right py-2">ظرفیت</th>
                            <th className="text-right py-2">ساعات اشغال</th>
                            <th className="text-right py-2">نرخ استفاده</th>
                            <th className="text-right py-2">تعداد سفارش</th>
                            <th className="text-right py-2">میانگین سفارش</th>
                          </tr>
                        </thead>
                        <tbody>
                          {utilizationMetrics.map((metric) => (
                            <tr key={metric.tableId} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 text-right">
                                <div>
                                  <div className="font-medium">میز {metric.tableNumber}</div>
                                  {metric.tableName && (
                                    <div className="text-sm text-gray-500">{metric.tableName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 text-right">{metric.section || 'اصلی'}</td>
                              <td className="py-2 text-right">{metric.capacity} نفر</td>
                              <td className="py-2 text-right">{metric.occupiedHours.toFixed(1)} ساعت</td>
                              <td className="py-2 text-right">
                                <span className={getUtilizationColor(metric.utilizationRate)}>
                                  {formatPercentage(metric.utilizationRate)}
                                </span>
                              </td>
                              <td className="py-2 text-right">{metric.orderCount}</td>
                              <td className="py-2 text-right">
                                {formatCurrency(metric.averageOrderValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تحلیل درآمد میزها</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-right py-2">میز</th>
                            <th className="text-right py-2">درآمد کل</th>
                            <th className="text-right py-2">درآمد ساعتی</th>
                            <th className="text-right py-2">درآمد به ازای صندلی</th>
                            <th className="text-right py-2">تعداد سفارش</th>
                            <th className="text-right py-2">میانگین سفارش</th>
                            <th className="text-right py-2">نرخ استفاده</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueData.map((table) => (
                            <tr key={table.tableId} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 text-right">
                                <div>
                                  <div className="font-medium">میز {table.tableNumber}</div>
                                  {table.tableName && (
                                    <div className="text-sm text-gray-500">{table.tableName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 text-right font-medium">
                                {formatCurrency(table.totalRevenue)}
                              </td>
                              <td className="py-2 text-right">
                                {formatCurrency(table.revenuePerHour)}
                              </td>
                              <td className="py-2 text-right">
                                {formatCurrency(table.revenuePerSeat)}
                              </td>
                              <td className="py-2 text-right">{table.orderCount}</td>
                              <td className="py-2 text-right">
                                {formatCurrency(table.averageOrderValue)}
                              </td>
                              <td className="py-2 text-right">
                                <span className={getUtilizationColor(table.utilizationRate)}>
                                  {formatPercentage(table.utilizationRate)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Capacity Optimization Tab */}
              {activeTab === 'capacity' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">بهینه‌سازی ظرفیت</h3>
                    <div className="space-y-4">
                      {capacityOptimization.map((section) => (
                        <div key={section.section} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              بخش {section.section}
                            </h4>
                            <div className="flex items-center gap-4">
                              <span className={`text-lg font-bold ${getEfficiencyColor(section.efficiencyScore)}`}>
                                امتیاز: {section.efficiencyScore.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">ظرفیت کل</p>
                              <p className="text-lg font-medium">{section.totalCapacity} نفر</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">نرخ استفاده متوسط</p>
                              <p className={`text-lg font-medium ${getUtilizationColor(section.averageUtilization)}`}>
                                {formatPercentage(section.averageUtilization)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">ظرفیت پیشنهادی</p>
                              <p className="text-lg font-medium">{section.recommendedCapacity} نفر</p>
                            </div>
                          </div>

                          {section.bottlenecks.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">مشکلات:</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {section.bottlenecks.map((bottleneck, index) => (
                                  <li key={index}>{bottleneck}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.recommendations.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">پیشنهادات:</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {section.recommendations.map((recommendation, index) => (
                                  <li key={index}>{recommendation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تحلیل عملکرد</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      این بخش در حال توسعه است و به زودی در دسترس خواهد بود.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 