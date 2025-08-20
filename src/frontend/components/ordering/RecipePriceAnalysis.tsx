'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  InventoryPriceService, 
  RecipePriceAnalysis 
} from '../../services/orderingService';

interface RecipePriceAnalysisProps {
  recipeId: string;
  recipeName?: string;
  onPriceUpdate?: (ingredientId: string, newPrice: number) => void;
}

export function RecipePriceAnalysisComponent({ 
  recipeId, 
  recipeName,
  onPriceUpdate 
}: RecipePriceAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RecipePriceAnalysis | null>(null);
  const [editingPrice, setEditingPrice] = useState<{
    ingredientId: string;
    currentPrice: number;
  } | null>(null);

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await InventoryPriceService.getRecipePriceAnalysis(recipeId);
      setAnalysis(data);
    } catch (error) {
      toast.error('خطا در دریافت تحلیل قیمت دستور پخت');
      console.error('Failed to load recipe price analysis:', error);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (recipeId) {
      loadAnalysis();
    }
  }, [recipeId, loadAnalysis]);

  const handlePriceUpdate = async (ingredientId: string, newPrice: number) => {
    try {
      setLoading(true);
      await InventoryPriceService.updateIngredientPrice(recipeId, ingredientId, newPrice);
      toast.success('قیمت با موفقیت به‌روزرسانی شد');
      onPriceUpdate?.(ingredientId, newPrice);
      loadAnalysis(); // Reload analysis
    } catch (error) {
      toast.error('خطا در به‌روزرسانی قیمت');
      console.error('Failed to update ingredient price:', error);
    } finally {
      setLoading(false);
      setEditingPrice(null);
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('fa-IR');
  };

  const getPriceSourceColor = (source: 'SYNCED' | 'MANUAL' | 'MISSING') => {
    switch (source) {
      case 'SYNCED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'MANUAL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'MISSING':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriceSourceText = (source: 'SYNCED' | 'MANUAL' | 'MISSING') => {
    switch (source) {
      case 'SYNCED':
        return 'همگام‌سازی شده';
      case 'MANUAL':
        return 'دستی';
      case 'MISSING':
        return 'ناموجود';
      default:
        return 'نامشخص';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">تحلیل قیمت در دسترس نیست</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          اطلاعات تحلیل قیمت برای این دستور پخت یافت نشد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            تحلیل قیمت دستور پخت
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {recipeName || analysis.recipeName}
          </p>
        </div>
        <button
          onClick={loadAnalysis}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          بروزرسانی
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">هزینه کل</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(analysis.totalCost)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">هزینه هر سرو</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(analysis.costPerServing)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تعداد مواد</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.ingredients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">جزئیات مواد اولیه</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ماده اولیه
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  مقدار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  قیمت دستور پخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  قیمت موجودی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  تفاوت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  منبع قیمت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analysis.ingredients.map((ingredient, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {ingredient.itemName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {ingredient.quantity} {ingredient.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatPrice(ingredient.recipePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatPrice(ingredient.inventoryPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ingredient.priceDifference > 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : ingredient.priceDifference < 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {ingredient.priceDifference > 0 ? '+' : ''}{formatPrice(ingredient.priceDifference)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriceSourceColor(ingredient.priceSource)}`}>
                      {getPriceSourceText(ingredient.priceSource)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingPrice?.ingredientId === ingredient.id ? (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingPrice.currentPrice}
                          onChange={(e) => setEditingPrice({
                            ...editingPrice,
                            currentPrice: Number(e.target.value) || 0
                          })}
                          className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={() => handlePriceUpdate(ingredient.id, editingPrice.currentPrice)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPrice({
                          ingredientId: ingredient.id,
                          currentPrice: ingredient.recipePrice
                        })}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        ویرایش
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Sync Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
          وضعیت همگام‌سازی قیمت‌ها
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <div>مواد همگام‌سازی شده: {analysis.ingredients.filter(i => i.priceSource === 'SYNCED').length}</div>
          <div>مواد دستی: {analysis.ingredients.filter(i => i.priceSource === 'MANUAL').length}</div>
          <div>مواد بدون قیمت: {analysis.ingredients.filter(i => i.priceSource === 'MISSING').length}</div>
        </div>
      </div>
    </div>
  );
} 