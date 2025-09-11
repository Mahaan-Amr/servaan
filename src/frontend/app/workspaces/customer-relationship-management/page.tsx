'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { getCrmDashboard } from '../../../services/crmService';
import { getUpcomingBirthdays } from '../../../services/customerService';
import { Customer, CrmActivity, CrmSegmentTrend } from '../../../types/crm';

interface DashboardStats {
  customerStats: {
    total: number;
    active: number;
    newThisMonth: number;
    bySegment: Record<string, number>;
  };
  loyaltyStats: {
    totalPoints: number;
    activePoints: number;
    redemptionRate: number;
    averagePointsPerCustomer: number;
  };
  visitStats: {
    totalVisits: number;
    totalRevenue: number;
    averageOrderValue: number;
    visitsThisMonth: number;
  };
  recentActivities: CrmActivity[];
  topCustomers: Customer[];
  segmentTrends: CrmSegmentTrend[];
}

export default function CustomerRelationshipManagementPage() {
  const { user } = useAuth();
  const { workspaces } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Customer[]>([]);

  // Find the CRM workspace
  const crmWorkspace = workspaces.find(w => w.id === 'customer-relationship-management');

  // Quick action cards for CRM workspace
  const quickActions = [
    {
      id: 1,
      title: 'مشتری جدید',
      description: 'افزودن مشتری جدید به سیستم',
      icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
      href: '/workspaces/customer-relationship-management/customers/new',
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 2,
      title: 'ثبت بازدید',
      description: 'ثبت بازدید مشتری جدید',
      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      href: '/workspaces/customer-relationship-management/visits/new',
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 3,
      title: 'مدیریت امتیازات',
      description: 'افزودن یا استفاده امتیازات',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      href: '/workspaces/customer-relationship-management/loyalty',
      color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 4,
      title: 'تحلیل مشتریان',
      description: 'مشاهده تحلیل‌ها و گزارش‌ها',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      href: '/workspaces/customer-relationship-management/analytics',
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [dashboard, birthdays] = await Promise.all([
        getCrmDashboard().catch(() => null),
        getUpcomingBirthdays({ days: 7 }).catch(() => [])
      ]);
      
      if (dashboard) {
        setDashboardData(dashboard.stats);
      }
      setUpcomingBirthdays(birthdays);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
      setUpcomingBirthdays([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} میلیون تومان`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)} هزار تومان`;
    }
    return `${new Intl.NumberFormat('fa-IR').format(price)} تومان`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            داشبورد مدیریت ارتباط مشتری
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            مدیریت کامل مشتریان، برنامه وفاداری و تحلیل رفتار مشتریان
          </p>
        </div>
        
        {/* Workspace Badge */}
        <div className="flex items-center space-x-3 space-x-reverse bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${crmWorkspace?.gradient || 'from-pink-500 to-pink-600'} flex items-center justify-center shadow-lg`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">فضای کاری CRM</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Customer Relations</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Total Customers */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل مشتریان</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardData?.customerStats.total || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                    +{formatNumber(dashboardData?.customerStats.newThisMonth || 0)} این ماه
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Visits */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل بازدیدها</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardData?.visitStats.totalVisits || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                    {formatNumber(dashboardData?.visitStats.visitsThisMonth || 0)} این ماه
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">درآمد کل</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(dashboardData?.visitStats.totalRevenue || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                    میانگین: {formatPrice(dashboardData?.visitStats.averageOrderValue || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">امتیازات فعال</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardData?.loyaltyStats.activePoints || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                    میانگین: {formatNumber(dashboardData?.loyaltyStats.averagePointsPerCustomer || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">اقدامات سریع</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                    {action.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Grid - Upcoming Birthdays & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming Birthdays */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">تولدهای نزدیک</h2>
            <Link href="/workspaces/customer-relationship-management/customers?filter=birthdays" className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300">
              مشاهده همه
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingBirthdays.length > 0 ? (
            <div className="space-y-3">
              {upcomingBirthdays.slice(0, 5).map((customer) => (
                <div key={customer.id} className="flex items-center space-x-3 space-x-reverse p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {customer.birthday ? new Date(customer.birthday).toLocaleDateString('fa-IR') : 'تاریخ تولد نامشخص'}
                    </p>
                  </div>
                  <div className="text-pink-500 dark:text-pink-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base">هیچ تولدی در هفته آینده نیست</p>
            </div>
          )}
        </div>

        {/* Customer Segments Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">بخش‌بندی مشتریان</h2>
            <Link href="/workspaces/customer-relationship-management/segments" className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300">
              جزئیات بیشتر
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center mb-1">
                    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gray-300 dark:bg-gray-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(dashboardData?.customerStats.bySegment || {}).map(([segment, count], index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                const percentage = dashboardData?.customerStats.total ? (count / dashboardData.customerStats.total) * 100 : 0;
                
                return (
                  <div key={segment}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{segment}</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatNumber(count)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 