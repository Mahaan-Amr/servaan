'use client';

import { useState, useEffect } from 'react';
import { 
  FaSms, 
  FaBullhorn, 
  FaUsers, 
  FaCreditCard,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { AlertBox } from '../../../components/ui/AlertBox';
import { Spinner } from '../../../components/ui/Spinner';
import * as smsService from '../../../services/smsService';

interface SMSStats {
  totalSent: number;
  sentToday: number;
  remainingCredit: number;
  successRate: number;
  pendingMessages: number;
  failedMessages: number;
  trends: {
    sentToday: { value: number; direction: 'up' | 'down' | 'stable' };
    successRate: { value: number; direction: 'up' | 'down' | 'stable' };
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  count?: number;
}

const SMSDashboard = () => {
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [accountInfo, setAccountInfo] = useState<{credit?: string; balance?: string; status?: string} | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setWarning('');

      // Load real SMS statistics from backend
      const realStats = await smsService.getSMSStatistics();
      setStats({
        totalSent: realStats.totalSent,
        sentToday: realStats.totalSent, // Simplified for now
        remainingCredit: realStats.cost, // Using cost as credit
        successRate: realStats.deliveryRate,
        pendingMessages: 0, // Not available in backend
        failedMessages: realStats.totalFailed,
        trends: {
          sentToday: { value: realStats.totalSent, direction: 'stable' },
          successRate: { value: realStats.deliveryRate, direction: 'stable' }
        }
      });

      // Also load account info for additional details
      try {
        const accountData = await smsService.getSMSAccountInfo();
        setAccountInfo({
          credit: accountData.credit.toString(),
          balance: accountData.balance.toString(),
          status: 'success'
        });
      } catch (accountError) {
        console.warn('Could not load account info:', accountError);
        // Account info is optional, real stats are already loaded
      }

    } catch (err) {
      console.error('Failed to load SMS stats:', err);
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری آمار پیامک');
      setWarning('');
      
      // Fallback to basic stats if backend fails
      setStats({
        totalSent: 0,
        sentToday: 0,
        remainingCredit: 0,
        successRate: 0,
        pendingMessages: 0,
        failedMessages: 0,
        trends: {
          sentToday: { value: 0, direction: 'stable' },
          successRate: { value: 0, direction: 'stable' }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'bulk-sms',
      title: 'ارسال گروهی',
      description: 'ارسال پیامک به چندین شماره',
      icon: FaBullhorn,
      href: '/workspaces/sms-management/bulk-sms',
      color: 'bg-blue-500',
      count: stats?.pendingMessages
    },
    {
      id: 'invitation',
      title: 'دعوت کارمند',
      description: 'ارسال دعوت‌نامه برای کارمندان',
      icon: FaUsers,
      href: '/workspaces/sms-management/invitations',
      color: 'bg-green-500'
    },
    {
      id: 'history',
      title: 'تاریخچه پیامک‌ها',
      description: 'مشاهده تاریخچه ارسال',
      icon: FaClock,
      href: '/workspaces/sms-management/history',
      color: 'bg-purple-500'
    },
    {
      id: 'account',
      title: 'مدیریت اعتبار',
      description: 'مشاهده اعتبار و خرید',
      icon: FaCreditCard,
      href: '/workspaces/sms-management/account',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center py-12">
            <Spinner size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              داشبورد مدیریت پیامک
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              نمای کلی از عملکرد سیستم پیامک
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="btn btn-outline text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2"
            disabled={loading}
          >
            <FaChartLine className="w-4 h-4 ml-2" />
            بروزرسانی
          </button>
        </div>
      </div>

      {error && (
        <AlertBox type="error" message={error} />
      )}

      {warning && (
        <AlertBox type="warning" message={warning} />
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Sent */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  کل پیامک‌های ارسالی
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats?.totalSent ?? 0).toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FaSms className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Sent Today */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  ارسال امروز
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats?.sentToday ?? 0).toLocaleString('fa-IR')}
                </p>
                <div className="flex items-center mt-1">
                  {stats.trends.sentToday.direction === 'up' ? (
                    <FaArrowUp className="w-3 h-3 text-green-500 ml-1" />
                  ) : (
                    <FaArrowDown className="w-3 h-3 text-red-500 ml-1" />
                  )}
                  <span className={`text-xs ${
                    stats?.trends?.sentToday?.direction === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(stats?.trends?.sentToday?.value ?? 0)}% نسبت به دیروز
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Remaining Credit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  اعتبار باقی‌مانده
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats?.remainingCredit ?? 0).toLocaleString('fa-IR')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  تعداد پیامک
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <FaCreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  نرخ موفقیت
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.successRate}%
                </p>
                <div className="flex items-center mt-1">
                  <FaArrowUp className="w-3 h-3 text-green-500 ml-1" />
                  <span className="text-xs text-green-500">
                    +{(stats?.trends?.successRate?.value ?? 0)}% این ماه
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          اقدامات سریع
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.id}
                href={action.href}
                className="block p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 ${action.color} rounded-lg flex items-center justify-center relative`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    {action.count && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                        {action.count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              وضعیت سیستم
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <FaCheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    سرویس پیامک
                  </span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  فعال
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    پیام‌های در انتظار
                  </span>
                </div>
                <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                  {stats.pendingMessages} پیام
                </span>
              </div>

              {stats.failedMessages > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      پیام‌های ناموفق
                    </span>
                  </div>
                  <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                    {stats.failedMessages} پیام
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          {accountInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                اطلاعات حساب کاربری
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    اعتبار باقی‌مانده:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {parseInt(accountInfo.credit || '0').toLocaleString('fa-IR')} پیامک
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    وضعیت حساب:
                  </span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    فعال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    شماره فرستنده:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    ۲۰۰۰۶۶۰۱۱۰
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SMSDashboard; 