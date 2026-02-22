'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useBIWorkspace } from '../../../../contexts/BIWorkspaceContext';
import { ProfitData } from '../../../../types/bi';
import { biService } from '../../../../services/biService';
import { ChartDataTransformer } from '../../../../services/chartDataTransformer';
import { CustomBarChart } from '../../../../components/charts/BarChart';
import { CustomScatterChart } from '../../../../components/charts/ScatterChart';
import { CustomDonutChart } from '../../../../components/charts/DonutChart';
import { CustomMatrixChart } from '../../../../components/charts/MatrixChart';
import { CustomTopProductsChart } from '../../../../components/charts/TopProductsChart';
import { Button, Card, Section } from '../../../../components/ui';

// Backend response interfaces
interface BackendProfitItem {
  id?: string;
  name: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

interface BackendProfitSummary {
  totalItems: number;
  totalRevenue: number;
  totalProfit: number;
  overallMargin: number;
  bestPerformer: BackendProfitItem | null;
  worstPerformer: BackendProfitItem | null;
}

interface BackendProfitResponse {
  period: { start: string; end: string };
  groupBy: 'item' | 'category';
  items: BackendProfitItem[];
  summary: BackendProfitSummary;
}

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fa-IR').format(value);
};

const getProfitColor = (margin: number) => {
  if (margin >= 20) return 'text-green-600 dark:text-green-400';
  if (margin >= 10) return 'text-yellow-600 dark:text-yellow-400';
  if (margin >= 0) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getProfitBadge = (margin: number) => {
  if (margin >= 20) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (margin >= 10) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (margin >= 0) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
};

export default function ProfitAnalysisPage() {
  const { workspace, isOrderingWorkspace, isMergedWorkspace } = useBIWorkspace();
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [groupBy, setGroupBy] = useState<'item' | 'category'>('item');

  const loadProfitAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading profit analysis for period:', period, 'groupBy:', groupBy);
      
      const response = await biService.getProfitAnalysis(period, groupBy);
      
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      
      // Transform backend response to frontend expected format
      let profitData: ProfitData;
      
      if (response && typeof response === 'object') {
        // Check if it's the wrapped backend response format
        if ('success' in response && 'data' in response && response.success) {
          console.log('Detected wrapped response format');
          // Backend returns: { success: true, data: { period, groupBy, items, summary }, message }
          const wrappedResponse = response as { success: boolean; data: unknown; message?: string };
          const backendData = wrappedResponse.data as BackendProfitResponse;
          
          console.log('Extracted backend data:', backendData);
          console.log('Backend data keys:', backendData ? Object.keys(backendData) : 'null');
          
          if (backendData && 'items' in backendData && 'summary' in backendData) {
            console.log('Backend data structure is valid');
            profitData = {
              totalRevenue: backendData.summary?.totalRevenue || 0,
              totalCost: backendData.summary?.totalRevenue - backendData.summary?.totalProfit || 0,
              totalProfit: backendData.summary?.totalProfit || 0,
              overallMargin: backendData.summary?.overallMargin || 0,
              analysis: (backendData.items || []).map((item: BackendProfitItem) => ({
                id: item.id || item.name,
                name: item.name,
                category: item.category,
                revenue: item.totalRevenue || 0,
                cost: item.totalCost || 0,
                profit: item.totalProfit || 0,
                profitMargin: item.profitMargin || 0,
                quantity: item.totalSold || 0
              }))
            };
          } else {
            console.error('Backend data structure is invalid:', backendData);
            throw new Error('Invalid data structure in backend response');
          }
        } else if ('items' in response && 'summary' in response) {
          console.log('Detected direct backend format');
          // Handle direct backend format (if not wrapped)
          const backendData = response as unknown as BackendProfitResponse;
          profitData = {
            totalRevenue: backendData.summary?.totalRevenue || 0,
            totalCost: backendData.summary?.totalRevenue - backendData.summary?.totalProfit || 0,
            totalProfit: backendData.summary?.totalProfit || 0,
            overallMargin: backendData.summary?.overallMargin || 0,
            analysis: (backendData.items || []).map((item: BackendProfitItem) => ({
              id: item.id || item.name,
              name: item.name,
              category: item.category,
              revenue: item.totalRevenue || 0,
              cost: item.totalCost || 0,
              profit: item.totalProfit || 0,
              profitMargin: item.profitMargin || 0,
              quantity: item.totalSold || 0
            }))
          };
        } else if (ChartDataTransformer.validateProfitData(response)) {
          console.log('Detected legacy ProfitData format');
          // Handle direct ProfitData format (legacy)
          profitData = response as ProfitData;
        } else {
          console.error('Response structure:', response);
          console.error('Response does not match any expected format');
          throw new Error('Invalid profit data structure received from server');
        }
      } else {
        console.error('Response is null or not an object:', response);
        throw new Error('Invalid response format from server');
      }

      console.log('Transformed profit data:', profitData);
      console.log('Analysis items count:', profitData.analysis.length);

      // Check if we have meaningful data
      if (profitData.analysis.length === 0 && profitData.totalRevenue === 0) {
        console.log('No profit data available - setting empty state');
        // Set empty state with proper structure
        setProfitData({
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          overallMargin: 0,
          analysis: []
        });
      } else {
        console.log('Setting profit data with', profitData.analysis.length, 'items');
        // Set the validated profit data
        setProfitData(profitData);
      }
    } catch (err) {
      console.error('Error loading profit analysis:', err);
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری تحلیل سودآوری');
      
      // Set fallback data structure
      setProfitData({
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        overallMargin: 0,
        analysis: []
      });
    } finally {
      setLoading(false);
    }
  }, [period, groupBy]);

  // Load profit analysis data - only for ordering and merged workspaces
  useEffect(() => {
    if (isOrderingWorkspace || isMergedWorkspace) {
      loadProfitAnalysis();
    }
  }, [loadProfitAnalysis, isOrderingWorkspace, isMergedWorkspace]);

  // Show message if workspace doesn't support profit analysis
  if (workspace === 'inventory') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">تحلیل سودآوری در دسترس نیست</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            تحلیل سودآوری فقط برای workspace سفارشات و ترکیبی در دسترس است. لطفاً workspace را تغییر دهید.
          </p>
        </div>
      </div>
    );
  }

  // Enhanced data transformation functions using the new ChartDataTransformer
  // These maintain full backward compatibility while providing better type safety

  // 1. Top Profitable Products Chart Data
  const getTopProfitableProductsData = () => {
    return ChartDataTransformer.transformTopProfitableProducts(profitData, 10);
  };

  // 2. Revenue vs Profit Scatter Chart Data
  const getRevenueVsProfitScatterData = () => {
    return ChartDataTransformer.transformRevenueVsProfitScatter(profitData);
  };

  // 3. Profit Margin Distribution Donut Data
  const getProfitMarginDistributionData = () => {
    return ChartDataTransformer.transformProfitMarginDistribution(profitData);
  };

  // 4. Cost vs Revenue Comparison Chart Data
  const getCostVsRevenueComparisonData = () => {
    return ChartDataTransformer.transformCostVsRevenueComparison(profitData, 8);
  };

  // 5. Profit Performance Matrix Data
  const getProfitPerformanceMatrixData = () => {
    return ChartDataTransformer.transformProfitPerformanceMatrix(profitData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری تحلیل سودآوری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3 sm:p-4 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button
              onClick={loadProfitAnalysis}
              variant="success"
              size="small"
            >
              Refresh
            </Button>
        </div>
      </div>
    );
  }

  return (
    <Section className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          تحلیل سودآوری
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              تجزیه و تحلیل سود و زیان محصولات
        </p>
      </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:space-x-reverse">
            <select
              id="profit-groupby-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'item' | 'category')}
              aria-label="نوع گروه‌بندی"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="item">بر اساس کالا</option>
              <option value="category">بر اساس دسته‌بندی</option>
            </select>
            <select
              id="profit-period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="بازه زمانی"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="7d">۷ روز گذشته</option>
              <option value="30d">۳۰ روز گذشته</option>
              <option value="90d">۹۰ روز گذشته</option>
              <option value="1y">یک سال گذشته</option>
            </select>
            <Button
              onClick={loadProfitAnalysis}
              variant="success"
              size="small"
            >
              بروزرسانی
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {profitData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل درآمد</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(profitData.totalRevenue)} تومان</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">کل هزینه</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(profitData.totalCost)} تومان</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">سود خالص</p>
                <p className={`text-lg sm:text-xl font-bold ${profitData.overallMargin >= 20 ? 'text-green-600 dark:text-green-400' : profitData.overallMargin >= 10 ? 'text-yellow-600 dark:text-yellow-400' : profitData.overallMargin >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(profitData.totalProfit)} تومان
                </p>
              </div>
            </div>
          </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">حاشیه سود</p>
                <p className={`text-lg sm:text-xl font-bold ${profitData.overallMargin >= 20 ? 'text-green-600 dark:text-green-400' : profitData.overallMargin >= 10 ? 'text-yellow-600 dark:text-yellow-400' : profitData.overallMargin >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {profitData.overallMargin.toFixed(1)}%
          </p>
        </div>
      </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {profitData && profitData.analysis.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Profitable Products Chart - Full Width */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-8">
            <CustomTopProductsChart
              data={getTopProfitableProductsData()}
              title="🎯 محصولات پرسودترین"
              height={320}
              maxProducts={10}
            />
          </div>

          {/* Charts Grid - Three Row Layout */}
          <div className="space-y-4 sm:space-y-6">
            {/* First Row - Revenue vs Profit + Margin Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Revenue vs Profit Scatter Chart - 8 columns */}
              <div className="lg:col-span-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
                  <CustomScatterChart
                    data={getRevenueVsProfitScatterData()}
                    title="📈 رابطه درآمد و سودآوری"
                    height={300}
                  />
                </div>
              </div>

              {/* Profit Margin Distribution - 4 columns */}
              <div className="lg:col-span-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
                  <CustomDonutChart
                    data={getProfitMarginDistributionData()}
                    title="توزیع حاشیه سود"
                  />
                </div>
              </div>
            </div>

            {/* Second Row - Cost vs Revenue Comparison (Full Width) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <CustomBarChart
                data={getCostVsRevenueComparisonData().map(item => ({
                  name: item.name,
                  revenue: item.revenue,
                  cost: item.cost,
                  profit: item.profit,
                  fill: '#3B82F6'
                }))}
                bars={[
                  { dataKey: 'revenue', name: 'درآمد', fill: '#10B981' },
                  { dataKey: 'cost', name: 'هزینه', fill: '#EF4444' }
                ]}
                title="مقایسه هزینه و درآمد"
                xAxisKey="name"
                height={350}
              />
            </div>

            {/* Third Row - Profit Performance Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Profit Performance Matrix - 12 columns (full width) */}
              <div className="lg:col-span-12">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
                  <CustomMatrixChart
                    data={getProfitPerformanceMatrixData()}
                    title="🏆 ماتریس عملکرد سودآوری"
                    height={300}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profit Table */}
      {profitData && profitData.analysis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              جزئیات سودآوری {groupBy === 'item' ? 'کالاها' : 'دسته‌بندی‌ها'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {groupBy === 'item' ? 'کالا' : 'دسته‌بندی'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تعداد
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    درآمد
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    هزینه
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    سود
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    حاشیه سود
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {profitData.analysis.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.revenue)} تومان
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.cost)} تومان
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium ${getProfitColor(item.profitMargin)}`}>
                      {formatCurrency(item.profit)} تومان
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProfitBadge(item.profitMargin)}`}>
                        {item.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Insights Cards */}
      {profitData && profitData.analysis.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 بینش‌های کلیدی و پیشنهادات</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl ml-2">🌟</span>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">محصولات پرسود</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {profitData.analysis.filter(p => p.profitMargin >= 20).length} محصول با حاشیه سود بالای ۲۰٪. 
                تمرکز بر ترویج و تولید بیشتر این محصولات.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl ml-2">⚠️</span>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">محصولات کم‌سود</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {profitData.analysis.filter(p => p.profitMargin >= 0 && p.profitMargin < 10).length} محصول با حاشیه سود کمتر از ۱۰٪. 
                بررسی و بهینه‌سازی هزینه‌ها لازم است.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl ml-2">🎯</span>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">بهینه‌سازی قیمت</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                محصولات با درآمد بالا و سود پایین نیاز به بازنگری قیمت‌گذاری و کاهش هزینه‌های تولید دارند.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {profitData && profitData.analysis.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 sm:p-12">
          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3 sm:p-4 mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای برای نمایش وجود ندارد</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
              تحلیل سودآوری زمانی که تراکنش فروش داشته باشید قابل مشاهده خواهد بود.
            </p>
            <Link
              href="/workspaces/inventory-management/items"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              مشاهده محصولات
            </Link>
          </div>
        </div>
      )}
    </Section>
  );
}
