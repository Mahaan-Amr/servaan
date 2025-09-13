'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { CustomPieChart } from '../../../components/charts/PieChart';
import { CustomLineChart } from '../../../components/charts/LineChart';
import { getToken } from '../../../services/authService';

import { API_URL } from '../../lib/apiUtils';

interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  recentActivity: number;
  roleDistribution: Array<{
    role: string;
    count: number;
  }>;
}

interface ActivityTrendData {
  date: string;
  transactions: number;
  activeUsers: number;
  [key: string]: unknown;
}

interface UserPerformanceData {
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  totalTransactions: number;
  totalQuantity: number;
}

interface RoleDistributionData {
  name: string;
  value: number;
  color: string;
}

export default function UserReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [activityTrends, setActivityTrends] = useState<ActivityTrendData[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserPerformanceData[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistributionData[]>([]);
  
  // Filter states
  const [activityPeriod, setActivityPeriod] = useState('30');
  const [performancePeriod, setPerformancePeriod] = useState('30');

  const fetchUserAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      // Fetch all user analytics data in parallel
      const [summaryRes, trendsRes, performanceRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/user-analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/user-analytics/activity-trends?period=${activityPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/user-analytics/user-performance?period=${performancePeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/user-analytics/role-distribution`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok || !trendsRes.ok || !performanceRes.ok || !rolesRes.ok) {
        throw new Error('خطا در دریافت داده‌های کاربران');
      }

      const [summaryData, trendsData, performanceData, rolesData] = await Promise.all([
        summaryRes.json(),
        trendsRes.json(),
        performanceRes.json(),
        rolesRes.json()
      ]);

      setSummary(summaryData);
      setActivityTrends(trendsData);
      setUserPerformance(performanceData);
      setRoleDistribution(rolesData);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      setError('خطا در دریافت داده‌های کاربران');
    } finally {
      setLoading(false);
    }
  }, [activityPeriod, performancePeriod]);

  useEffect(() => {
    fetchUserAnalytics();
  }, [fetchUserAnalytics]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="MANAGER">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="MANAGER">
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-4 rounded-md">
          {error}
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute requiredRole="MANAGER">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">گزارش کاربران</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">مشاهده فعالیت‌های کاربران در سیستم</p>
          </div>
          <Link 
            href="/reports" 
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            بازگشت به گزارش‌ها
          </Link>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-5 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">تعداد کاربران</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalUsers}</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/30 p-5 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">کاربران فعال</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.activeUsers}</p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/30 p-5 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">کاربران جدید این ماه</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.newUsersThisMonth}</p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/30 p-5 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">فعالیت‌های اخیر</h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.recentActivity}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CustomPieChart
            data={roleDistribution}
            title="توزیع نقش‌های کاربری"
            height={300}
          />
          
          <CustomLineChart
            data={activityTrends}
            lines={[
              { dataKey: 'transactions', stroke: '#3b82f6', fill: '#3b82f6', name: 'تراکنش‌ها' },
              { dataKey: 'activeUsers', stroke: '#22c55e', fill: '#22c55e', name: 'کاربران فعال' }
            ]}
            title="روند فعالیت کاربران"
            xAxisKey="date"
            height={300}
          />
        </div>
        
        {/* User Performance Table */}
        {userPerformance.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              عملکرد کاربران (بر اساس {performancePeriod} روز اخیر)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      نام کاربر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      نقش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ایمیل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      تعداد تراکنش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      مجموع مقدار
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userPerformance.slice(0, 10).map((userPerf) => (
                    <tr key={userPerf.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{userPerf.userName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userPerf.userRole === 'ADMIN' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : userPerf.userRole === 'MANAGER'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {userPerf.userRole === 'ADMIN' ? 'مدیر سیستم' : 
                           userPerf.userRole === 'MANAGER' ? 'مدیر' : 'کارمند'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{userPerf.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {userPerf.totalTransactions.toLocaleString('fa-IR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {userPerf.totalQuantity.toLocaleString('fa-IR')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">فیلترهای گزارش</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بازه روند فعالیت (روز)
              </label>
              <select
                value={activityPeriod}
                onChange={(e) => setActivityPeriod(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="7">هفته اخیر</option>
                <option value="30">ماه اخیر</option>
                <option value="90">سه ماه اخیر</option>
                <option value="365">سال اخیر</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بازه عملکرد کاربران (روز)
              </label>
              <select
                value={performancePeriod}
                onChange={(e) => setPerformancePeriod(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="7">هفته اخیر</option>
                <option value="30">ماه اخیر</option>
                <option value="90">سه ماه اخیر</option>
                <option value="365">سال اخیر</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={fetchUserAnalytics}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              بروزرسانی گزارش
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 