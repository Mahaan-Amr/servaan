'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { biService } from '../../../../services/biService';
import { 
  ABCAnalysisData, 
  ABCProduct, 
  ABCSummary 
} from '../../../../types/bi';

export default function ABCAnalysisPage() {
  const [abcData, setAbcData] = useState<ABCAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  // Load ABC analysis data
  const loadABCAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching ABC analysis data for period:', period);
      
      // Get real ABC analysis data from backend
      const response = await biService.getABCAnalysis(period);
      
      console.log('📊 Raw API response:', response);
      
      // Type guard to ensure response has the expected structure
      if (!response || typeof response !== 'object') {
        console.error('❌ Invalid response structure:', response);
        throw new Error('No ABC analysis data received');
      }

      // Define proper types for the response structure
      type ABCResponse = {
        success?: boolean;
        data?: {
          products: ABCProduct[];
          totalProducts: number;
          totalSales: number;
          summary: ABCSummary;
        };
        products?: ABCProduct[];
        totalProducts?: number;
        totalSales?: number;
        summary?: ABCSummary;
      };

      const responseData = response as ABCResponse;
      
      // Check if this is a wrapped response with {success, data, message} structure
      let abcData: ABCAnalysisData;
      if (responseData.success && responseData.data) {
        // Backend returns {success: true, data: {...}, message: "..."}
        abcData = responseData.data;
        console.log('✅ Extracted data from wrapped response');
      } else if (responseData.products) {
        // Direct response structure (fallback)
        abcData = {
          products: responseData.products,
          totalProducts: responseData.totalProducts || 0,
          totalSales: responseData.totalSales || 0,
          summary: responseData.summary || {
            categoryA: { count: 0, salesPercentage: 0, products: [] },
            categoryB: { count: 0, salesPercentage: 0, products: [] },
            categoryC: { count: 0, salesPercentage: 0, products: [] }
          }
        };
        console.log('✅ Using direct response structure');
      } else {
        console.error('❌ Invalid response structure:', responseData);
        throw new Error('No ABC analysis data received');
      }

      // Check if we have products but no sales data - this is NOT an error, just empty data
      if (abcData.products.length === 0 && abcData.totalProducts > 0) {
        // This is a valid empty state, not an error
        console.log('ℹ️ No sales data available for the selected period');
        setAbcData({
          totalProducts: abcData.totalProducts || 0,
          totalSales: 0,
          products: [],
          summary: {
            categoryA: { count: 0, salesPercentage: 0, products: [] },
            categoryB: { count: 0, salesPercentage: 0, products: [] },
            categoryC: { count: 0, salesPercentage: 0, products: [] }
          }
        });
        setError(null); // Clear any previous errors
        return;
      }

      if (abcData.totalProducts === 0) {
        // This is a valid empty state, not an error
        console.log('ℹ️ No active products in the system');
        setAbcData({
          totalProducts: 0,
          totalSales: 0,
          products: [],
          summary: {
            categoryA: { count: 0, salesPercentage: 0, products: [] },
            categoryB: { count: 0, salesPercentage: 0, products: [] },
            categoryC: { count: 0, salesPercentage: 0, products: [] }
          }
        });
        setError(null); // Clear any previous errors
        return;
      }

      // Validate the data structure
      if (!abcData.products || !Array.isArray(abcData.products)) {
        throw new Error('Invalid products data structure');
      }

      if (!abcData.summary || typeof abcData.summary !== 'object') {
        throw new Error('Invalid summary data structure');
      }

      console.log('✅ ABC Analysis data loaded successfully:', {
        totalProducts: abcData.totalProducts,
        totalSales: abcData.totalSales,
        productsCount: abcData.products.length,
        summary: abcData.summary
      });

      setAbcData(abcData);
      setError(null);
    } catch (error) {
      console.error('❌ Error loading ABC analysis:', error);
      setError(error instanceof Error ? error.message : 'خطا در بارگذاری تحلیل ABC');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load ABC analysis data
  useEffect(() => {
    loadABCAnalysis();
  }, [loadABCAnalysis]); // Add loadABCAnalysis as dependency since it's now useCallback

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort products by total sales (descending)
  const sortedProducts = abcData?.products?.sort((a: ABCProduct, b: ABCProduct) => b.totalSales - a.totalSales) || [];

  // Calculate category statistics
  const categoryAProducts = sortedProducts.filter((product: ABCProduct) => product.abcCategory === 'A');
  const categoryBProducts = sortedProducts.filter((product: ABCProduct) => product.abcCategory === 'B');
  const categoryCProducts = sortedProducts.filter((product: ABCProduct) => product.abcCategory === 'C');

  const getCategoryColor = (category: 'A' | 'B' | 'C') => {
    switch (category) {
      case 'A':
        return 'text-green-600 dark:text-green-400';
      case 'B':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'C':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getCategoryBgColor = (category: 'A' | 'B' | 'C') => {
    switch (category) {
      case 'A':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'B':
        return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'C':
        return 'bg-red-100 dark:bg-red-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getCategoryIcon = (category: 'A' | 'B' | 'C') => {
    switch (category) {
      case 'A':
        return (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'B':
        return (
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'C':
        return (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری تحلیل ABC...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3 sm:p-4 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadABCAnalysis}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!abcData || abcData.products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3 sm:p-4 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">داده‌ای موجود نیست</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            {abcData?.totalProducts === 0 
              ? 'هیچ محصول فعالی در سیستم وجود ندارد'
              : 'هیچ داده فروشی برای دوره انتخاب شده موجود نیست'
            }
          </p>
          <div className="space-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <p>• کل محصولات: {abcData?.totalProducts || 0}</p>
            <p>• کل فروش: {abcData?.totalSales || 0}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              تحلیل ABC - دسته‌بندی محصولات
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              دسته‌بندی محصولات بر اساس ارزش فروش و اهمیت
            </p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-left">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">دوره تحلیل</p>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              >
                <option value="7d">۷ روز گذشته</option>
                <option value="30d">۳۰ روز گذشته</option>
                <option value="90d">۹۰ روز گذشته</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل محصولات</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{abcData.totalProducts}</p>
              <p className="text-xs text-green-600 dark:text-green-400">محصولات فعال</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل فروش</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(abcData.totalSales)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">درآمد کل</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="mr-3 sm:mr-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">محصولات با فروش</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{abcData.products.length}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">دارای داده فروش</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Placeholder for now */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">نمودارها</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">نمودار پارتو</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              نمودار پارتو در حال حاضر در دسترس نیست
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">نمودار دونات</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              نمودار دونات در حال حاضر در دسترس نیست
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">نمودار محصولات برتر</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              نمودار محصولات برتر در حال حاضر در دسترس نیست
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Category A */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">دسته A</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">عالی</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            محصولات با ارزش بالا - 80% از فروش
          </p>
          <div className="space-y-2 sm:space-y-3">
            {categoryAProducts.slice(0, 5).map((product: ABCProduct, index: number) => (
              <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{index + 1}</span>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(product.totalSales)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {categoryAProducts.length === 0 && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
                هیچ محصولی در این دسته وجود ندارد
              </p>
            )}
          </div>
        </div>

        {/* Category B */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-yellow-600 dark:text-yellow-400">دسته B</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">متوسط</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            محصولات با ارزش متوسط - 15% از فروش
          </p>
          <div className="space-y-2 sm:space-y-3">
            {categoryBProducts.slice(0, 5).map((product: ABCProduct, index: number) => (
              <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{index + 1}</span>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(product.totalSales)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {categoryBProducts.length === 0 && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
                هیچ محصولی در این دسته وجود ندارد
              </p>
            )}
          </div>
        </div>

        {/* Category C */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">دسته C</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">پایین</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            محصولات با ارزش پایین - 5% از فروش
          </p>
          <div className="space-y-2 sm:space-y-3">
            {categoryCProducts.slice(0, 5).map((product: ABCProduct, index: number) => (
              <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{index + 1}</span>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(product.totalSales)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {categoryCProducts.length === 0 && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
                هیچ محصولی در این دسته وجود ندارد
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">لیست کامل محصولات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  رتبه
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  محصول
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  دسته
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  فروش کل
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  تعداد
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  درصد
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  درصد تجمعی
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  دسته ABC
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedProducts.map((product: ABCProduct, index: number) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1 sm:p-2 rounded-lg ${getCategoryBgColor(product.abcCategory)}`}>
                        {getCategoryIcon(product.abcCategory)}
                      </div>
                      <div className="mr-2 sm:mr-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {product.category}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(product.totalSales)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {product.totalQuantity}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {product.percentage.toFixed(1)}%
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {product.cumulativePercentage.toFixed(1)}%
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBgColor(product.abcCategory)} ${getCategoryColor(product.abcCategory)}`}>
                      {product.abcCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 