'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryStatus, InventoryEntry, InventoryEntryType } from '../../../../../shared/types';
import * as inventoryService from '../../../../services/inventoryService';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<InventoryEntry[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all inventory data in parallel
        const [currentInventory, transactions, lowStock] = await Promise.all([
          inventoryService.getCurrentInventory(),
          inventoryService.getInventoryEntries(),
          inventoryService.getLowStockItems()
        ]);
        
        setInventoryStatus(currentInventory);
        setRecentTransactions(transactions.slice(0, 5)); // Get last 5 transactions
        setLowStockItems(lowStock);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات انبار';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryData();
  }, []);

  const getTotalItems = () => inventoryStatus.length;
  const getTotalStock = () => inventoryStatus.reduce((sum, item) => sum + item.current, 0);
  const getLowStockCount = () => lowStockItems.length;

  const getTypeLabel = (type: InventoryEntryType) => {
    return type === 'IN' ? 'ورود' : 'خروج';
  };

  const getTypeColor = (type: InventoryEntryType) => {
    return type === 'IN' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                خطا در دریافت اطلاعات انبار
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          مدیریت انبار
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          مشاهده و مدیریت موجودی کالاها
        </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
            <Link
              href="/workspaces/inventory-management/inventory/add"
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base text-center"
            >
              ورود کالا
            </Link>
            <Link
              href="/workspaces/inventory-management/inventory/bulk-add"
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base text-center"
            >
              ورود گروهی
            </Link>
            <Link
              href="/workspaces/inventory-management/inventory/remove"
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base text-center"
            >
              خروج کالا
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
              </div>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل اقلام</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {getTotalItems().toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل موجودی</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {getTotalStock().toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                getLowStockCount() > 0 ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کم موجودی</p>
              <p className={`text-lg sm:text-2xl font-bold ${getLowStockCount() > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {getLowStockCount().toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-400">
                هشدار کم موجودی
          </h3>
              <div className="mt-2 text-xs sm:text-sm text-red-700 dark:text-red-300">
                <p>{lowStockItems.length} قلم کالا کم موجود است:</p>
                <ul className="list-disc list-inside mt-1">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <li key={item.itemId}>
                      {item.itemName} - موجودی: {item.current.toLocaleString('fa-IR')}
                    </li>
                  ))}
                  {lowStockItems.length > 3 && (
                    <li>و {(lowStockItems.length - 3).toLocaleString('fa-IR')} مورد دیگر...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              آخرین تراکنش‌ها
            </h2>
            <Link
              href="/workspaces/inventory-management/inventory/transactions"
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              مشاهده همه
            </Link>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeLabel(transaction.type)}
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.item?.name || 'نامشخص'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.quantity.toLocaleString('fa-IR')} {transaction.item?.unit || ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4v-2a2 2 0 012-2 2 2 0 012 2v2" />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                هنوز تراکنشی ثبت نشده است
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            عملیات سریع
          </h2>
          
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            <Link
              href="/workspaces/inventory-management/inventory/transactions"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4v-2a2 2 0 012-2 2 2 0 012 2v2" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">تراکنش‌های انبار</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">مشاهده تاریخچه ورود و خروج</p>
              </div>
            </Link>

            <Link
              href="/workspaces/inventory-management/inventory/add"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">ورود کالا</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ثبت ورود کالای جدید</p>
              </div>
            </Link>

            <Link
              href="/workspaces/inventory-management/inventory/bulk-add"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">ورود گروهی کالاها</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ثبت ورود چندین کالا همزمان</p>
              </div>
            </Link>

            <Link
              href="/workspaces/inventory-management/inventory/remove"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">خروج کالا</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ثبت خروج کالا از انبار</p>
              </div>
            </Link>

            <Link
              href="/workspaces/inventory-management/scanner"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m12 0h4" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">اسکنر بارکد</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">اسکن و عملیات سریع</p>
              </div>
            </Link>

            <Link
              href="/workspaces/inventory-management/inventory/reports"
              className="flex items-center p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="mr-2 sm:mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">گزارش‌های انبار</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">تحلیل و گزارش‌گیری</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">لیست موجودی</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {inventoryStatus.length} کالا
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div>
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 sm:w-24 mb-1 sm:mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-600 rounded w-12 sm:w-16"></div>
                  </div>
                </div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-8 sm:w-12"></div>
              </div>
            ))}
          </div>
        ) : inventoryStatus.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {inventoryStatus.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    item.current <= 10 ? 'bg-red-500' : 
                    item.current <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {item.itemName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.category} • {item.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium ${
                    item.current <= 10 ? 'text-red-600 dark:text-red-400' : 
                    item.current <= 20 ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-gray-900 dark:text-white'
                  }`}>
                    {item.current.toLocaleString('fa-IR')} {item.unit}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.current <= 10 ? 'کم موجود' : 
                     item.current <= 20 ? 'موجودی متوسط' : 'موجود'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              هنوز کالایی در انبار ثبت نشده است
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 