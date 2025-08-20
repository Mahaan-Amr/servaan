'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUserPlus, FiUsers, FiTrendingUp, FiCalendar, FiBarChart, FiShoppingBag, FiAward } from 'react-icons/fi';
import { getCrmDashboard } from '../../services/crmService';
import { getUpcomingBirthdays } from '../../services/customerService';
import { Customer, CrmActivity, CrmSegmentTrend } from '../../types/crm';

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

export default function CrmPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, birthdays] = await Promise.all([
        getCrmDashboard(),
        getUpcomingBirthdays({ days: 7 })
      ]);
      
      setDashboardData(dashboard.stats);
      setUpcomingBirthdays(birthdays);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطای نامشخص';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow h-64"></div>
            <div className="bg-white p-6 rounded-lg shadow h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">خطا در بارگذاری داشبورد: {error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">داشبورد CRM</h1>
          <p className="text-gray-600">مدیریت مشتریان و برنامه وفاداری</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/crm/customers/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiUserPlus className="w-4 h-4" />
            مشتری جدید
          </button>
          <button
            onClick={() => router.push('/crm/analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiBarChart className="w-4 h-4" />
            تحلیل‌ها
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">کل مشتریان</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData?.customerStats.total || 0)}
              </p>
              <p className="text-sm text-green-600">
                {formatNumber(dashboardData?.customerStats.newThisMonth || 0)} جدید این ماه
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">کل بازدیدها</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData?.visitStats.totalVisits || 0)}
              </p>
              <p className="text-sm text-blue-600">
                {formatNumber(dashboardData?.visitStats.visitsThisMonth || 0)} این ماه
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">درآمد کل</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData?.visitStats.totalRevenue || 0)}
              </p>
              <p className="text-sm text-purple-600">
                میانگین سفارش: {formatCurrency(dashboardData?.visitStats.averageOrderValue || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">امتیازات فعال</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData?.loyaltyStats.activePoints || 0)}
              </p>
              <p className="text-sm text-yellow-600">
                نرخ استفاده: {(dashboardData?.loyaltyStats.redemptionRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiAward className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segments */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">بخش‌بندی مشتریان</h2>
              <button
                onClick={() => router.push('/crm/segments')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                مشاهده همه
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dashboardData?.customerStats.bySegment || {}).map(([segment, count]) => {
                const segmentConfig = {
                  NEW: { label: 'جدید', color: 'bg-gray-100 text-gray-800' },
                  OCCASIONAL: { label: 'گاه‌به‌گاه', color: 'bg-blue-100 text-blue-800' },
                  REGULAR: { label: 'منظم', color: 'bg-green-100 text-green-800' },
                  VIP: { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
                };
                
                const config = segmentConfig[segment as keyof typeof segmentConfig];
                if (!config) return null;

                return (
                  <div key={segment} className="text-center">
                    <div className={`p-4 rounded-lg ${config.color} mb-2`}>
                      <p className="text-2xl font-bold">{formatNumber(count)}</p>
                    </div>
                    <p className="text-sm text-gray-600">{config.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">تولدهای نزدیک</h2>
            </div>
          </div>
          <div className="p-6">
            {upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {upcomingBirthdays.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                    <div className="text-xs text-orange-600">
                      {customer.birthday && new Date(customer.birthday).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                ))}
                {upcomingBirthdays.length > 5 && (
                  <button
                    onClick={() => router.push('/crm/customers?filter=upcoming-birthdays')}
                    className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-3"
                  >
                    مشاهده همه ({upcomingBirthdays.length})
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">تولدی در هفته آینده نیست</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/crm/customers')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
        >
          <FiUsers className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">مدیریت مشتریان</h3>
          <p className="text-gray-600">مشاهده، ویرایش و مدیریت اطلاعات مشتریان</p>
        </button>

        <button
          onClick={() => router.push('/crm/visits')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
        >
          <FiShoppingBag className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">تاریخچه بازدیدها</h3>
          <p className="text-gray-600">ثبت و مدیریت بازدیدهای مشتریان</p>
        </button>

        <button
          onClick={() => router.push('/crm/loyalty')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
        >
          <FiAward className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">برنامه وفاداری</h3>
          <p className="text-gray-600">مدیریت امتیازات و سطوح وفاداری</p>
        </button>
      </div>
    </div>
  );
} 