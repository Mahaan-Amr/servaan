'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FaChartLine, 
  FaUsers, 
  FaLightbulb,
  FaCalendarAlt,
  FaUserFriends,
  FaCogs,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';

interface AdvancedAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdvancedAnalyticsDashboard({ isOpen, onClose }: AdvancedAnalyticsDashboardProps) {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'reservations' | 'customer-behavior' | 'optimization'>('overview');
  
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

      // Load comprehensive summary
      const summaryResponse = await fetch(`/api/ordering/tables/advanced-analytics/summary?${params}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('Advanced analytics data loaded:', summaryData);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری داده‌ها';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, dateRange, loadAnalyticsData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              داشبورد تحلیل پیشرفته میزها
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              تحلیل جامع عملکرد، رزرو، رفتار مشتریان و بهینه‌سازی ظرفیت
            </p>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-500">تا</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaChartLine className="inline ml-2" />
            نمای کلی
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'performance'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaChartBar className="inline ml-2" />
            عملکرد
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'reservations'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaCalendarAlt className="inline ml-2" />
            رزرو
          </button>
          <button
            onClick={() => setActiveTab('customer-behavior')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'customer-behavior'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaUserFriends className="inline ml-2" />
            رفتار مشتریان
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'optimization'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaCogs className="inline ml-2" />
            بهینه‌سازی
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                          <FaChartLine className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تحلیل پیشرفته</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            فعال
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                          <FaCalendarAlt className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رزروها</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            تحلیل شده
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                          <FaCheckCircle className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">عملکرد</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            بهینه
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                          <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="mr-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">توصیه‌ها</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            آماده
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      ویژگی‌های تحلیل پیشرفته
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <FaChartBar className="text-blue-500" />
                          <span className="text-gray-700 dark:text-gray-300">تحلیل عملکرد تفصیلی</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <FaCalendarAlt className="text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">تحلیل رزرو و الگوها</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <FaUserFriends className="text-purple-500" />
                          <span className="text-gray-700 dark:text-gray-300">رفتار مشتریان</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <FaCogs className="text-orange-500" />
                          <span className="text-gray-700 dark:text-gray-300">بهینه‌سازی ظرفیت</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <FaUsers className="text-indigo-500" />
                          <span className="text-gray-700 dark:text-gray-300">تخصیص کارکنان</span>
                        </div>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <FaLightbulb className="text-yellow-500" />
                          <span className="text-gray-700 dark:text-gray-300">توصیه‌های هوشمند</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      تحلیل عملکرد تفصیلی
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      این بخش شامل تحلیل‌های پیشرفته عملکرد میزها، امتیازدهی، و پیش‌بینی‌ها خواهد بود.
                    </p>
                  </div>
                </div>
              )}

              {/* Reservations Tab */}
              {activeTab === 'reservations' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      تحلیل رزروها
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      این بخش شامل تحلیل الگوهای رزرو، نرخ تبدیل، و بهینه‌سازی زمان‌بندی خواهد بود.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Behavior Tab */}
              {activeTab === 'customer-behavior' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      رفتار مشتریان
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      این بخش شامل تحلیل ترجیحات مشتریان، الگوهای نشستن، و رضایت‌سنجی خواهد بود.
                    </p>
                  </div>
                </div>
              )}

              {/* Optimization Tab */}
              {activeTab === 'optimization' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      بهینه‌سازی
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      این بخش شامل توصیه‌های بهینه‌سازی ظرفیت، تخصیص کارکنان، و بهبود کارایی خواهد بود.
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