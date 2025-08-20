'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryPriceManager } from '../../../components/inventory/InventoryPriceManager';
import { LowStockAlerts } from '../../../components/inventory/LowStockAlerts';
import * as inventoryService from '../../../services/inventoryService';
import toast from 'react-hot-toast';

interface InventoryDashboardStats {
  totalItems: number;
  lowStockCount: number;
  recentTransactions: number;
  totalInventoryValue: number;
  totalInventoryQuantity?: number; // Added for total inventory quantity
}

interface RecentActivity {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  note?: string;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function InventoryWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [statsData, activitiesData, totalQuantityData] = await Promise.all([
          inventoryService.getInventoryStats(),
          inventoryService.getRecentActivities(),
          inventoryService.getTotalInventoryQuantity().catch(() => ({ totalQuantity: 0, itemCount: 0 }))
        ]);

        setStats({
          ...statsData,
          totalInventoryQuantity: totalQuantityData.totalQuantity
        });
        setRecentActivities(activitiesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات داشبورد';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatPrice = (price: number): string => {
    // Convert Rials to Tomans (1 Toman = 10 Rials)
    const priceInTomans = price / 10;
    
    if (priceInTomans >= 1000000) {
      return `${(priceInTomans / 1000000).toFixed(1)} میلیون تومان`;
    } else if (priceInTomans >= 1000) {
      return `${(priceInTomans / 1000).toFixed(0)} هزار تومان`;
    }
    return `${priceInTomans.toLocaleString('fa-IR')} تومان`;
  };

  const getActivityTitle = (activity: RecentActivity): string => {
    return activity.type === 'IN' ? 'ورود کالا به انبار' : 'خروج کالا از انبار';
  };

  const getActivityDescription = (activity: RecentActivity): string => {
    const action = activity.type === 'IN' ? 'ورود' : 'خروج';
    return `${action} ${activity.quantity.toLocaleString('fa-IR')} واحد ${activity.item?.name || 'کالای نامشخص'}`;
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'اکنون';
    if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} روز پیش`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            داشبورد مدیریت موجودی
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            مدیریت کامل موجودی، کالاها و تراکنش‌های انبار
          </p>
        </div>
        
        {/* Workspace Badge */}
        <div className="flex items-center space-x-3 space-x-reverse bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">فضای کاری موجودی</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Inventory Workspace</div>
          </div>
        </div>
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
              name: 'کل کالاها',
              value: stats.totalItems.toLocaleString('fa-IR'),
              icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
              color: 'bg-blue-100 dark:bg-blue-900 text-blue-500',
              gradient: 'from-blue-500 to-blue-600',
              subtitle: 'تعداد انواع کالاهای موجود'
            },
            {
              id: 2,
              name: 'کل موجودی',
              value: stats.totalInventoryQuantity?.toLocaleString('fa-IR') || '۰',
              icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
              color: 'bg-green-100 dark:bg-green-900 text-green-500',
              gradient: 'from-green-500 to-green-600',
              subtitle: 'مجموع کل موجودی تمام کالاها'
            },
            {
              id: 3,
              name: 'کالاهای کم موجود',
              value: stats.lowStockCount.toLocaleString('fa-IR'),
              icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              color: 'bg-red-100 dark:bg-red-900 text-red-500',
              gradient: 'from-red-500 to-red-600',
              subtitle: 'کالاهایی که موجودی کم دارند'
            },
            {
              id: 4,
              name: 'ارزش موجودی',
              value: formatPrice(stats.totalInventoryValue),
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
              color: 'bg-purple-100 dark:bg-purple-900 text-purple-500',
              gradient: 'from-purple-500 to-purple-600',
              subtitle: 'ارزش کل موجودی بر اساس قیمت متوسط'
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
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.subtitle}</p>
                )}
              </div>
            </div>
          ))
        ) : null}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">عملیات سریع</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Add Inventory Entry (IN) */}
          <Link
            href="/workspaces/inventory-management/inventory/add"
            className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  ثبت ورود کالا
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  افزودن موجودی جدید
                </p>
              </div>
            </div>
          </Link>

          {/* Remove Inventory Entry (OUT) */}
          <Link
            href="/workspaces/inventory-management/inventory/remove"
            className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/30 transition-colors">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  ثبت خروج کالا
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  کاهش موجودی
                </p>
              </div>
            </div>
          </Link>

          {/* Add New Item */}
          <Link
            href="/workspaces/inventory-management/items/add"
            className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  افزودن کالای جدید
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  تعریف کالای جدید
                </p>
              </div>
            </div>
          </Link>

          {/* Barcode Scanner */}
          <Link
            href="/workspaces/inventory-management/scanner"
            className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m12 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  اسکن بارکد
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  اسکن و عملیات سریع
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">فعالیت‌های اخیر</h2>
          <div className="card">
            {loading ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0 animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActivityTitle(activity)}
                      </h4>
                      <span className="text-xs text-gray-500">{getTimeAgo(activity.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getActivityDescription(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">توسط: {activity.user?.name || 'کاربر نامشخص'}</p>
                                         {activity.note && (
                       <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{activity.note}&rdquo;</p>
                     )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>هنوز تراکنشی ثبت نشده است</p>
              </div>
            )}
            
            {recentActivities.length > 0 && (
              <div className="mt-6 text-center">
                <Link href="/workspaces/inventory-management/inventory" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  مشاهده همه تراکنش‌ها
                </Link>
              </div>
            )}
          </div>
        </div>

                 {/* Low Stock Alerts */}
         <div>
           <LowStockAlerts limit={5} />
         </div>
       </div>

       {/* Inventory List Section */}
       <div className="card">
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">لیست موجودی</h2>
           <Link 
             href="/workspaces/inventory-management/inventory" 
             className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
           >
             مشاهده کامل
           </Link>
         </div>
         
         {loading ? (
           <div className="space-y-3">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                 <div className="flex items-center space-x-3 space-x-reverse">
                   <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                   <div>
                     <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
                     <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                   </div>
                 </div>
                 <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
               </div>
             ))}
           </div>
         ) : (
           <div className="space-y-3">
             {stats && Array.from({ length: Math.min(5, stats.totalItems) }).map((_, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                 <div className="flex items-center space-x-3 space-x-reverse">
                   <div className={`w-3 h-3 rounded-full ${
                     i < stats.lowStockCount ? 'bg-red-500' : 'bg-green-500'
                   }`}></div>
                   <div>
                     <p className="text-sm font-medium text-gray-900 dark:text-white">
                       کالای نمونه {i + 1}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       دسته‌بندی نمونه
                     </p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-medium text-gray-900 dark:text-white">
                     {Math.floor(Math.random() * 100) + 1} واحد
                   </p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">
                     موجود
                   </p>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>

       {/* Inventory Price Management */}
       <div className="card">
         <InventoryPriceManager />
       </div>
     </div>
   );
} 