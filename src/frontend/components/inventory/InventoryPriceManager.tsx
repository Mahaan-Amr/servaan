 'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  InventoryPriceService, 
  PriceStatistics, 
  PriceConsistencyItem, 
  PriceSyncResult 
} from '../../services/orderingService';

interface InventoryPriceManagerProps {
  onPriceSync?: (result: PriceSyncResult) => void;
}

export function InventoryPriceManager({ onPriceSync }: InventoryPriceManagerProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'consistency' | 'sync'>('stats');
  const [priceStats, setPriceStats] = useState<PriceStatistics | null>(null);
  const [consistencyData, setConsistencyData] = useState<PriceConsistencyItem[]>([]);
  const [syncResult, setSyncResult] = useState<PriceSyncResult | null>(null);

  useEffect(() => {
    loadPriceStatistics();
  }, []);

  const loadPriceStatistics = async () => {
    try {
      setLoading(true);
      const stats = await InventoryPriceService.getPriceStatistics();
      setPriceStats(stats);
    } catch (error) {
      console.error('❌ Failed to load price statistics:', error);
      toast.error('خطا در دریافت آمار قیمت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const loadConsistencyData = async () => {
    try {
      setLoading(true);
      const data = await InventoryPriceService.validatePriceConsistency();
      setConsistencyData(data);
    } catch (error) {
      toast.error('خطا در بررسی سازگاری قیمت‌ها');
      console.error('Failed to load consistency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSync = async () => {
    try {
      setLoading(true);
      const result = await InventoryPriceService.syncIngredientPrices();
      setSyncResult(result);
      toast.success(`تعداد ${result.synced} قیمت با موفقیت همگام‌سازی شد`);
      onPriceSync?.(result);
    } catch (error) {
      toast.error('خطا در همگام‌سازی قیمت‌ها');
      console.error('Failed to sync prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('fa-IR');
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            مدیریت قیمت‌های موجودی
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            نظارت و همگام‌سازی قیمت‌های موجودی با دستورات پخت
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            آمار قیمت‌ها
          </button>
          <button
            onClick={() => {
              setActiveTab('consistency');
              loadConsistencyData();
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'consistency'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            بررسی سازگاری
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            همگام‌سازی
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Price Statistics Tab */}
        {activeTab === 'stats' && priceStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل کالاها</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{priceStats.totalItems}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کالاهای دارای قیمت</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{priceStats.itemsWithPrices}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">میانگین قیمت</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(priceStats.averagePrice)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">دامنه قیمت</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(priceStats.priceRange.min)} - {formatPrice(priceStats.priceRange.max)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Price Changes */}
            {priceStats.recentPriceChanges.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">تغییرات اخیر قیمت</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          کالا
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          قیمت قبلی
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          قیمت جدید
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          تغییر
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          تاریخ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {priceStats.recentPriceChanges.map((change, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {change.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(change.oldPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(change.newPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              change.newPrice > change.oldPrice
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {change.newPrice > change.oldPrice ? '+' : ''}{formatPrice(change.newPrice - change.oldPrice)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(change.changeDate).toLocaleDateString('fa-IR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Consistency Tab */}
        {activeTab === 'consistency' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                بررسی سازگاری قیمت‌ها
              </h3>
              <button
                onClick={loadConsistencyData}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                بروزرسانی
              </button>
            </div>

            {consistencyData.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {consistencyData.length} کالا با قیمت‌های ناسازگار یافت شد
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          کالا
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          قیمت موجودی
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          دستورات پخت
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          وضعیت
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {consistencyData.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(item.inventoryPrice)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="space-y-1">
                              {item.recipePrices.map((recipe, recipeIndex) => (
                                <div key={recipeIndex} className="flex items-center justify-between">
                                  <span className="text-xs">{recipe.recipeName}</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    Math.abs(recipe.percentageDiff) > 10
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                    {formatPrice(recipe.recipePrice)} ({formatPercentage(recipe.percentageDiff)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.recipePrices.some(r => Math.abs(r.percentageDiff) > 10)
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {item.recipePrices.some(r => Math.abs(r.percentageDiff) > 10) ? 'نیاز به بررسی' : 'قابل قبول'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">هیچ ناسازگاری قیمتی یافت نشد</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  تمام قیمت‌های موجودی با دستورات پخت سازگار هستند.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Price Sync Tab */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    همگام‌سازی قیمت‌ها
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    قیمت‌های تمام دستورات پخت را با قیمت‌های فعلی موجودی همگام‌سازی کنید
                  </p>
                </div>
                <button
                  onClick={handleBulkSync}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال همگام‌سازی...' : 'شروع همگام‌سازی'}
                </button>
              </div>

              {syncResult && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                    نتیجه همگام‌سازی
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div>تعداد همگام‌سازی شده: {syncResult.synced}</div>
                    <div>تعداد ناموفق: {syncResult.failed}</div>
                    {syncResult.changes.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium mb-2">تغییرات اعمال شده:</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {syncResult.changes.map((change, index) => (
                            <div key={index} className="text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded">
                              <div className="font-medium">{change.itemName}</div>
                              <div className="text-blue-600 dark:text-blue-300">
                                {change.recipeName}: {formatPrice(change.oldPrice)} → {formatPrice(change.newPrice)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}