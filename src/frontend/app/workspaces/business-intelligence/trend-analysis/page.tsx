'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { biService } from '../../../../services/biService';
import { TrendAnalysisData, TrendDataPoint } from '../../../../types/bi';

export default function TrendAnalysisPage() {
  const [trendData, setTrendData] = useState<TrendAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'sales_volume' | 'customers'>('revenue');
  const [period, setPeriod] = useState('30d');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'multi-metric' | 'insights' | 'scorecard'>('overview');

  // Load trend analysis data
  const loadTrendAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Loading trend analysis for:', { metric, period, granularity });
      
      // Load trend analysis data
      const trendResponse = await biService.getTrendAnalysis(metric, period, granularity);
      
      // Check if this is a wrapped response with {success, data, message} structure
      let trendData: TrendAnalysisData;
      if (trendResponse && typeof trendResponse === 'object' && (trendResponse as { success?: boolean; data?: TrendAnalysisData }).success && (trendResponse as { success?: boolean; data?: TrendAnalysisData }).data) {
        // Backend returns {success: true, data: {...}, message: "..."}
        const wrappedData = (trendResponse as { success?: boolean; data?: TrendAnalysisData }).data;
        if (!wrappedData) {
        throw new Error('No trend analysis data received');
        }
        trendData = wrappedData;
        console.log('✅ Extracted trend data from wrapped response');
      } else if (trendResponse && typeof trendResponse === 'object' && (trendResponse as TrendAnalysisData).dataPoints) {
        // Direct response structure (fallback)
        trendData = trendResponse as TrendAnalysisData;
        console.log('✅ Using direct trend response structure');
      } else {
        // This is a valid empty state, not an error
        console.log('ℹ️ No trend analysis data available for the selected parameters');
        setTrendData({
          metric,
          granularity,
          dataPoints: [],
          trend: { direction: 'stable', slope: 0, rSquared: 0, description: 'داده‌ای موجود نیست' },
          insights: [],
          forecast: [],
          summary: { totalValue: 0, averageValue: 0, minValue: 0, maxValue: 0, growth: 0 }
        });
        setError(null); // Clear any previous errors
        return;
      }

      // Transform backend response - ensure we work with the actual TrendDataPoint structure
      const dataPoints: TrendDataPoint[] = trendData.dataPoints?.map((point: TrendDataPoint) => ({
        period: point.period || '',
        value: point.value || 0,
        formattedPeriod: formatPeriod(point.period || '', granularity),
        date: point.date || new Date()
      })) || [];

      // Calculate summary statistics
      const values = dataPoints.map((p: TrendDataPoint) => p.value);
      const totalValue = values.reduce((sum: number, val: number) => sum + val, 0);
      const averageValue = values.length > 0 ? totalValue / values.length : 0;
      const minValue = values.length > 0 ? Math.min(...values) : 0;
      const maxValue = values.length > 0 ? Math.max(...values) : 0;
      
      const growth = values.length >= 2 && values[0] > 0 
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100 
        : 0;

      const processedTrendData: TrendAnalysisData = {
        metric,
        granularity,
        dataPoints,
        trend: {
          direction: trendData.trend?.slope > 0.1 ? 'up' : trendData.trend?.slope < -0.1 ? 'down' : 'stable',
          slope: trendData.trend?.slope || 0,
          rSquared: trendData.trend?.rSquared || 0,
          description: trendData.trend?.description || 'روند پایدار'
        },
        insights: trendData.insights || [],
        forecast: trendData.forecast ? trendData.forecast.map((point: TrendDataPoint) => ({
          period: point.period || '',
          value: point.value || 0,
          formattedPeriod: formatPeriod(point.period || '', granularity),
          date: point.date || new Date()
        })) : [],
        summary: {
          totalValue,
          averageValue,
          minValue,
          maxValue,
          growth
        },
        seasonality: trendData.seasonality
      };

      setTrendData(processedTrendData);
      setError(null);
    } catch (error) {
      console.error('❌ Error loading trend analysis:', error);
      setError(error instanceof Error ? error.message : 'خطا در بارگذاری تحلیل روند');
    } finally {
      setLoading(false);
    }
  }, [metric, period, granularity]);

  // Load trend analysis data
  useEffect(() => {
    loadTrendAnalysis();
  }, [loadTrendAnalysis]); // Add loadTrendAnalysis as dependency since it's now useCallback

  const formatPeriod = (period: string, granularity: 'day' | 'week' | 'month'): string => {
    if (!period) return '';
    
    try {
      const date = new Date(period);
      if (isNaN(date.getTime())) return period;
      
      switch (granularity) {
        case 'day':
          return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
        case 'week':
          return `هفته ${Math.ceil(date.getDate() / 7)}`;
        case 'month':
          return date.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });
        default:
          return period;
      }
    } catch {
      return period;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'revenue': return 'درآمد';
      case 'profit': return 'سود';
      case 'sales_volume': return 'حجم فروش';
      case 'customers': return 'مشتریان';
      default: return metric;
    }
  };

  const getMetricUnit = (metric: string): string => {
    switch (metric) {
      case 'revenue':
      case 'profit':
        return 'ریال';
      case 'sales_volume':
        return 'عدد';
      case 'customers':
        return 'نفر';
      default:
        return '';
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 sm:w-1/4 mb-4 sm:mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-64 sm:h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 sm:py-12">
            <div className="text-red-500 text-4xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{error}</p>
          <button
              onClick={loadTrendAnalysis}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
          >
            تلاش مجدد
          </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!trendData || !trendData.dataPoints || trendData.dataPoints.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📊</div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">داده‌ای برای نمایش وجود ندارد</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              برای دوره انتخاب شده داده‌ای موجود نیست. لطفاً دوره یا معیار دیگری انتخاب کنید.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setPeriod('7d')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                ۷ روز گذشته
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                ۳۰ روز گذشته
              </button>
              <button
                onClick={() => setPeriod('90d')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                ۹۰ روز گذشته
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              📈 تحلیل پیشرفته روند
                  </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              تحلیل جامع روند، پیش‌بینی و بینش‌های هوشمند {getMetricLabel(metric)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:space-x-reverse">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as 'revenue' | 'profit' | 'sales_volume' | 'customers')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="revenue">درآمد</option>
              <option value="profit">سود</option>
              <option value="sales_volume">حجم فروش</option>
              <option value="customers">مشتریان</option>
            </select>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="day">روزانه</option>
              <option value="week">هفتگی</option>
              <option value="month">ماهانه</option>
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="7d">۷ روز گذشته</option>
              <option value="30d">۳۰ روز گذشته</option>
              <option value="90d">۹۰ روز گذشته</option>
              <option value="1y">یک سال گذشته</option>
            </select>
            <button
              onClick={loadTrendAnalysis}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 space-x-reverse px-4 sm:px-6">
            {[
              { id: 'overview', label: '📊 نمای کلی', icon: '📊' },
              { id: 'forecast', label: '🔮 پیش‌بینی', icon: '🔮' },
              { id: 'multi-metric', label: '📈 چندمعیاره', icon: '📈' },
              { id: 'insights', label: '🧠 بینش‌ها', icon: '🧠' },
              { id: 'scorecard', label: '📋 کارت امتیاز', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'forecast' | 'multi-metric' | 'insights' | 'scorecard')}
                className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && trendData && (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <span className="text-lg sm:text-2xl text-white">📊</span>
                    </div>
                    <div className="mr-3 sm:mr-4">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">مجموع</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(trendData.summary.totalValue)} {getMetricUnit(metric)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <span className="text-lg sm:text-2xl text-white">📈</span>
                    </div>
                    <div className="mr-3 sm:mr-4">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">رشد</p>
                      <p className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100">
                        {trendData.summary.growth > 0 ? '+' : ''}{trendData.summary.growth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <span className="text-lg sm:text-2xl text-white">🎯</span>
                    </div>
                    <div className="mr-3 sm:mr-4">
                      <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">دقت روند</p>
                      <p className="text-lg sm:text-xl font-bold text-purple-900 dark:text-purple-100">
                        {(trendData.trend.rSquared * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <span className="text-lg sm:text-2xl text-white">📊</span>
                    </div>
                    <div className="mr-3 sm:mr-4">
                      <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">میانگین</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(trendData.summary.averageValue)} {getMetricUnit(metric)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rich Trend Visualization */}
              {/* CustomAreaChart component was removed, so this section is now a placeholder */}
              {/* You would need to re-add the CustomAreaChart component or a similar chart */}
              {/* For now, we'll just show a placeholder message */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  نمودار روند در حال حاضر در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
                </p>
              </div>
            </div>
          )}

          {/* Forecast Tab */}
          {activeTab === 'forecast' && trendData && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rich Forecast Visualization */}
              {/* CustomForecastChart component was removed, so this section is now a placeholder */}
              {/* You would need to re-add the CustomForecastChart component or a similar chart */}
              {/* For now, we'll just show a placeholder message */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  پیش‌بینی روند در حال حاضر در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
                </p>
              </div>
            </div>
          )}

          {/* Multi-Metric Tab */}
          {activeTab === 'multi-metric' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rich Multi-Metric Visualization */}
              {/* CustomMultiMetricChart component was removed, so this section is now a placeholder */}
              {/* You would need to re-add the CustomMultiMetricChart component or a similar chart */}
              {/* For now, we'll just show a placeholder message */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  چندمعیاره روند در حال حاضر در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
                </p>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rich Insights Display */}
              {/* CustomInsightsCard component was removed, so this section is now a placeholder */}
              {/* You would need to re-add the CustomInsightsCard component or a similar display */}
              {/* For now, we'll just show a placeholder message */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  بینش‌های هوشمند در حال حاضر در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
                </p>
              </div>
            </div>
          )}

          {/* Scorecard Tab */}
          {activeTab === 'scorecard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rich Scorecard Display */}
              {/* CustomKPIScorecard component was removed, so this section is now a placeholder */}
              {/* You would need to re-add the CustomKPIScorecard component or a similar display */}
              {/* For now, we'll just show a placeholder message */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  کارت امتیاز در حال حاضر در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {trendData && trendData.dataPoints.length === 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              هیچ داده‌ای یافت نشد
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              برای دوره و معیار انتخاب شده داده‌ای موجود نیست
          </p>
        </div>
      </div>
      )}
    </div>
  );
} 