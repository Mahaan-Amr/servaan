'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FinancialSummary {
  thisMonthPurchases: number;
  lastMonthPurchases: number;
  changePercent: number;
  totalInventoryValue: number;
  purchaseTransactions: number;
}

export default function FinancialPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      setSummary({
        thisMonthPurchases: 25000000,
        lastMonthPurchases: 20000000,
        changePercent: 25,
        totalInventoryValue: 180000000,
        purchaseTransactions: 45
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError('خطا در دریافت داده‌های مالی');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-4 rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              گزارش‌های مالی
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              گزارش مالی از هزینه‌ها و ارزش موجودی
            </p>
          </div>
          <Link 
            href="/workspaces/accounting-system" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">ارزش کل موجودی</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalInventoryValue.toLocaleString('fa-IR')} ریال
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">خرید ماه جاری</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.thisMonthPurchases.toLocaleString('fa-IR')} ریال
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/30 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">خرید ماه قبل</h3>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.lastMonthPurchases.toLocaleString('fa-IR')} ریال
            </p>
          </div>
          
          <div className={`p-6 rounded-lg ${
            summary.changePercent >= 0 
              ? 'bg-green-50 dark:bg-green-900/30' 
              : 'bg-red-50 dark:bg-red-900/30'
          }`}>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">تغییر نسبت به ماه قبل</h3>
            <p className={`text-2xl font-bold ${
              summary.changePercent >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {summary.changePercent >= 0 ? '+' : ''}{summary.changePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Financial Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/workspaces/accounting-system/financial-statements"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">صورت‌های مالی</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">ترازنامه و صورت سود و زیان</p>
        </Link>

        <Link
          href="/workspaces/accounting-system/financial-ratios"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">نسبت‌های مالی</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">تحلیل نسبت‌های مالی کلیدی</p>
        </Link>

        <Link
          href="/workspaces/accounting-system/trial-balance"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">تراز آزمایشی</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">مانده کلیه حساب‌ها</p>
        </Link>

        <Link
          href="/workspaces/accounting-system/advanced-reports"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">گزارش‌های پیشرفته</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">گزارش‌های تخصصی و تحلیلی</p>
        </Link>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">تحلیل روند</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">تحلیل روند درآمد و هزینه‌ها</p>
          <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded dark:bg-yellow-900/20 dark:text-yellow-400">
            به‌زودی
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">گزارش مالیاتی</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">گزارش‌های آماده برای اداره مالیات</p>
          <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded dark:bg-yellow-900/20 dark:text-yellow-400">
            به‌زودی
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملیات سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg inline-block mb-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">ثبت سند جدید</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">ثبت سند حسابداری</p>
          </button>

          <button className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-block mb-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">گزارش ماهانه</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">تولید گزارش ماهانه</p>
          </button>

          <button className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-300 dark:hover:border-green-600 transition-colors">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg inline-block mb-2">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-1" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">دانلود گزارش</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">دانلود فایل PDF/Excel</p>
          </button>
        </div>
      </div>
    </div>
  );
} 