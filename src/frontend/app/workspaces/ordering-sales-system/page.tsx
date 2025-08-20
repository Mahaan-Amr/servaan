 'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { OrderService, InventoryIntegrationService } from '../../../services/orderingService';
import { PaymentMethod } from '../../../types/ordering';

interface DashboardStats {
  todaysOrders?: number;
  todaysorders?: number; // API might return lowercase
  activeOrders: number;
  todaysRevenue: number;
  averageOrderValue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
  }>;
  tableStatus: Array<{
    status: string;
    count: number;
  }>;
}

interface InventoryStatus {
  totalMenuItems: number;
  availableMenuItems: number;
  unavailableMenuItems: number;
  itemsWithRecipes: number;
  itemsWithoutRecipes: number;
  lowStockIngredients: number;
  criticalStockIngredients: number;
  averageProfitMargin: number;
  lastUpdate: string;
}

interface LowStockAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  unit: string;
  affectedMenuItems: string[];
  priority: 'high' | 'medium' | 'low';
}

// API Response interfaces
interface TodaysSummaryResponse {
  data?: {
    summary?: {
      completedOrders?: number;
      pendingOrders?: number;
      totalRevenue?: number;
      averageOrderValue?: number;
    };
    topSellingItems?: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
    paymentMethods?: Array<{
      method: PaymentMethod;
      count: number;
      amount: number;
    }>;
    tableStatus?: Array<{
      status: string;
      count: number;
    }>;
  };
  summary?: {
    completedOrders?: number;
    pendingOrders?: number;
    totalRevenue?: number;
    averageOrderValue?: number;
  };
  topSellingItems?: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethods?: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
  }>;
  tableStatus?: Array<{
    status: string;
    count: number;
  }>;
}

interface InventoryDataResponse {
  data?: InventoryStatus;
}

interface AlertsDataResponse {
  data?: {
    criticalIngredients?: LowStockAlert[];
  };
  criticalIngredients?: LowStockAlert[];
}

export default function OrderingSystemDashboard() {
  const { workspaces } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);

  // Find the ordering workspace
  const orderingWorkspace = workspaces.find(w => w.id === 'ordering-sales-system');

  // Quick action cards for ordering workspace
  const quickActions = [
    {
      id: 1,
      title: 'سفارش جدید',
      description: 'ایجاد سفارش جدید',
      icon: 'M12 4v16m8-8H4',
      href: '/workspaces/ordering-sales-system/pos',
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 2,
      title: 'مدیریت منو',
      description: 'مدیریت دسته‌ها و آیتم‌ها',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      href: '/workspaces/ordering-sales-system/menu',
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 3,
      title: 'نمایشگر آشپزخانه',
      description: 'نمایشگر آشپزخانه',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/workspaces/ordering-sales-system/kitchen',
      color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 4,
      title: 'گزارشات',
      description: 'گزارشات و تحلیل',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      href: '/workspaces/ordering-sales-system/analytics',
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [todaysSummary, inventoryData, alertsData] = await Promise.all([
        OrderService.getTodaysSummary(),
        InventoryIntegrationService.getIntegrationStatus(),
        InventoryIntegrationService.getLowStockAlerts()
      ]);

      console.log('Dashboard Data Debug:', {
        todaysSummary,
        inventoryData,
        alertsData
      });

      // Handle the case where API returns data in different format
      const processedStats = {
        todaysOrders: (todaysSummary as TodaysSummaryResponse)?.data?.summary?.completedOrders || (todaysSummary as TodaysSummaryResponse)?.summary?.completedOrders || 0,
        todaysorders: (todaysSummary as TodaysSummaryResponse)?.data?.summary?.completedOrders || (todaysSummary as TodaysSummaryResponse)?.summary?.completedOrders || 0,
        activeOrders: (todaysSummary as TodaysSummaryResponse)?.data?.summary?.pendingOrders || (todaysSummary as TodaysSummaryResponse)?.summary?.pendingOrders || 0,
        todaysRevenue: (todaysSummary as TodaysSummaryResponse)?.data?.summary?.totalRevenue || (todaysSummary as TodaysSummaryResponse)?.summary?.totalRevenue || 0,
        averageOrderValue: (todaysSummary as TodaysSummaryResponse)?.data?.summary?.averageOrderValue || (todaysSummary as TodaysSummaryResponse)?.summary?.averageOrderValue || 0,
        topSellingItems: (todaysSummary as TodaysSummaryResponse)?.data?.topSellingItems || (todaysSummary as TodaysSummaryResponse)?.topSellingItems || [],
        paymentMethods: (todaysSummary as TodaysSummaryResponse)?.data?.paymentMethods || (todaysSummary as TodaysSummaryResponse)?.paymentMethods || [],
        tableStatus: (todaysSummary as TodaysSummaryResponse)?.data?.tableStatus || (todaysSummary as TodaysSummaryResponse)?.tableStatus || []
      };

      setStats(processedStats);
      setInventoryStatus((inventoryData as InventoryDataResponse)?.data || (inventoryData as InventoryStatus));
      setLowStockAlerts(((alertsData as AlertsDataResponse)?.data?.criticalIngredients || (alertsData as AlertsDataResponse)?.criticalIngredients || []) as LowStockAlert[]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('خطا در بارگذاری اطلاعات داشبورد');
      
      // Set fallback data for testing
      setStats({
        todaysOrders: 0,
        todaysorders: 0,
        activeOrders: 0,
        todaysRevenue: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        paymentMethods: [],
        tableStatus: []
      });
      
      setInventoryStatus({
        totalMenuItems: 9,
        availableMenuItems: 9,
        unavailableMenuItems: 0,
        itemsWithRecipes: 0,
        itemsWithoutRecipes: 9,
        lowStockIngredients: 0,
        criticalStockIngredients: 0,
        averageProfitMargin: 0,
        lastUpdate: new Date().toISOString()
      });
      
      setLowStockAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMenuAvailability = async () => {
    try {
      const result = await InventoryIntegrationService.updateMenuAvailability();
      toast.success(`وضعیت منو به‌روزرسانی شد: ${result.updated} آیتم تغییر کرد`);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error updating menu availability:', error);
      toast.error('خطا در به‌روزرسانی وضعیت منو');
    }
  };

  const updateRecipeCosts = async () => {
    try {
      const result = await InventoryIntegrationService.updateRecipeCosts();
      toast.success(`هزینه‌های دستور پخت به‌روزرسانی شد: ${result.updated} دستور پخت تغییر کرد`);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error updating recipe costs:', error);
      toast.error('خطا در به‌روزرسانی هزینه‌های دستور پخت');
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            داشبورد سیستم سفارش‌گیری
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            مدیریت سفارشات، منو و موجودی
          </p>
        </div>
        
        {/* Workspace Badge */}
        <div className="flex items-center space-x-3 space-x-reverse bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${orderingWorkspace?.gradient || 'from-amber-500 to-amber-600'} flex items-center justify-center shadow-lg`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M13 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">فضای کاری سفارش‌گیری</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ordering Workspace</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 space-x-reverse">
        <button
          onClick={updateMenuAvailability}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          به‌روزرسانی وضعیت منو
        </button>
        <button
          onClick={updateRecipeCosts}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          به‌روزرسانی هزینه‌ها
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card flex items-center p-6 animate-pulse">
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 w-12 h-12 ml-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : stats ? (
          [
            {
              id: 1,
              name: 'سفارشات امروز',
              value: (stats.todaysOrders || stats.todaysorders || 0).toLocaleString('fa-IR'),
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              color: 'bg-blue-100 dark:bg-blue-900 text-blue-500',
              gradient: 'from-blue-500 to-blue-600'
            },
            {
              id: 2,
              name: 'درآمد امروز',
              value: `${formatPrice(stats.todaysRevenue || 0)} ریال`,
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
              color: 'bg-green-100 dark:bg-green-900 text-green-500',
              gradient: 'from-green-500 to-green-600'
            },
            {
              id: 3,
              name: 'سفارشات فعال',
              value: (stats.activeOrders || 0).toLocaleString('fa-IR'),
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              color: 'bg-orange-100 dark:bg-orange-900 text-orange-500',
              gradient: 'from-orange-500 to-orange-600'
            },
            {
              id: 4,
              name: 'میانگین سفارش',
              value: `${formatPrice(stats.averageOrderValue || 0)} ریال`,
              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
              color: 'bg-purple-100 dark:bg-purple-900 text-purple-500',
              gradient: 'from-purple-500 to-purple-600'
            }
          ].map((stat) => (
            <div key={stat.id} className="card flex items-center p-6 hover:shadow-lg transition-shadow">
              <div className={`p-3 rounded-lg ${stat.color} ml-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))
        ) : (
          // Fallback when stats is null
          [
            {
              id: 1,
              name: 'سفارشات امروز',
              value: '0',
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              color: 'bg-blue-100 dark:bg-blue-900 text-blue-500',
              gradient: 'from-blue-500 to-blue-600'
            },
            {
              id: 2,
              name: 'درآمد امروز',
              value: '0 ریال',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
              color: 'bg-green-100 dark:bg-green-900 text-green-500',
              gradient: 'from-green-500 to-green-600'
            },
            {
              id: 3,
              name: 'سفارشات فعال',
              value: '0',
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              color: 'bg-orange-100 dark:bg-orange-900 text-orange-500',
              gradient: 'from-orange-500 to-orange-600'
            },
            {
              id: 4,
              name: 'میانگین سفارش',
              value: '0 ریال',
              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
              color: 'bg-purple-100 dark:bg-purple-900 text-purple-500',
              gradient: 'from-purple-500 to-purple-600'
            }
          ].map((stat) => (
            <div key={stat.id} className="card flex items-center p-6 hover:shadow-lg transition-shadow">
              <div className={`p-3 rounded-lg ${stat.color} ml-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="group block"
          >
            <div className="card p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${action.color} ml-4`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">روش‌های پرداخت امروز</h3>
          {stats?.paymentMethods?.length ? (
            <div className="space-y-3">
              {stats.paymentMethods.map((method, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{method.method}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatPrice(method.amount)} ریال</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">هیچ پرداختی ثبت نشده</div>
          )}
        </div>

        {/* Table Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت میزها</h3>
          {stats?.tableStatus?.length ? (
            <div className="space-y-3">
              {stats.tableStatus.map((status, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{status.status}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{status.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">هیچ میزی موجود نیست</div>
          )}
        </div>
      </div>

      {/* Inventory Status */}
      {inventoryStatus && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت موجودی</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inventoryStatus.totalMenuItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">کل آیتم‌های منو</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{inventoryStatus.availableMenuItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">آیتم‌های موجود</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{inventoryStatus.unavailableMenuItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">آیتم‌های ناموجود</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{inventoryStatus.itemsWithRecipes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">آیتم‌های با دستور پخت</div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">هشدارهای موجودی کم</h3>
          <div className="space-y-3">
            {lowStockAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{alert.itemName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    موجودی فعلی: {alert.currentStock} {alert.unit}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {alert.priority === 'high' ? 'بالا' : alert.priority === 'medium' ? 'متوسط' : 'کم'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}