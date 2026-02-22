'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBIWorkspace } from '../../../../contexts/BIWorkspaceContext';
import { biService } from '../../../../services/biService';
import { TrendAnalysisData, TrendDataPoint } from '../../../../types/bi';
import { CustomAreaChart } from '../../../../components/charts/AreaChart';
import { CustomForecastChart } from '../../../../components/charts/ForecastChart';
import { MultiMetricTab } from './MultiMetricTab';
import { Card, Section } from '../../../../components/ui';

export default function TrendAnalysisPage() {
  // Trend analysis available for all workspaces - workspace context available if needed
  useBIWorkspace();
  const [trendData, setTrendData] = useState<TrendAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'sales_volume' | 'customers'>('revenue');
  const [period, setPeriod] = useState('30d');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'multi-metric' | 'insights' | 'scorecard'>('overview');
  
  // Multi-metric data state
  const [multiMetricData, setMultiMetricData] = useState<{
    revenue: TrendAnalysisData | null;
    profit: TrendAnalysisData | null;
    sales_volume: TrendAnalysisData | null;
    customers: TrendAnalysisData | null;
  }>({
    revenue: null,
    profit: null,
    sales_volume: null,
    customers: null
  });
  const [multiMetricLoading, setMultiMetricLoading] = useState(false);

  const formatPeriod = useCallback((period: string, granularity: 'day' | 'week' | 'month'): string => {
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
  }, []);

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
      // Helper function to safely convert date to Date object
      const parseDate = (dateValue: Date | string | undefined): Date => {
        if (!dateValue) return new Date();
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        return new Date();
      };

      // Type for backend data point (date might be string or Date)
      type BackendDataPoint = {
        period?: string;
        value?: number;
        date?: Date | string;
      };

      const dataPoints: TrendDataPoint[] = trendData.dataPoints?.map((point: BackendDataPoint) => ({
        period: point.period || '',
        value: point.value || 0,
        formattedPeriod: formatPeriod(point.period || '', granularity),
        date: parseDate(point.date)
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

      // Map backend trend direction to frontend format
      // Backend returns: { direction: 'UP' | 'DOWN' | 'STABLE', strength: number, confidence: number }
      // Frontend expects: { direction: 'up' | 'down' | 'stable', slope: number, rSquared: number }
      const backendTrend = trendData.trend as {
        direction?: 'UP' | 'DOWN' | 'STABLE' | 'up' | 'down' | 'stable';
        strength?: number;
        confidence?: number;
        slope?: number;
        rSquared?: number;
        description?: string;
      };
      
      const trendDirection = backendTrend?.direction === 'UP' ? 'up' 
        : backendTrend?.direction === 'DOWN' ? 'down' 
        : backendTrend?.direction === 'STABLE' ? 'stable'
        : (backendTrend?.slope && backendTrend.slope > 0.1 ? 'up' : backendTrend?.slope && backendTrend.slope < -0.1 ? 'down' : 'stable');
      
      const processedTrendData: TrendAnalysisData = {
        metric,
        granularity,
        dataPoints,
        trend: {
          direction: trendDirection,
          slope: backendTrend?.strength || backendTrend?.slope || 0,
          rSquared: backendTrend?.confidence || backendTrend?.rSquared || 0,
          description: backendTrend?.description || 'روند پایدار'
        },
        insights: trendData.insights || [],
        forecast: trendData.forecast ? trendData.forecast.map((point: BackendDataPoint) => ({
          period: point.period || '',
          value: point.value || 0,
          formattedPeriod: formatPeriod(point.period || '', granularity),
          date: parseDate(point.date)
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
  }, [metric, period, granularity, formatPeriod]);

  // Load trend analysis data - available for all workspaces
  useEffect(() => {
    loadTrendAnalysis();
  }, [loadTrendAnalysis]);

  // Load multi-metric data when multi-metric tab is active
  const loadMultiMetricData = useCallback(async () => {
    if (activeTab !== 'multi-metric') return;
    
    try {
      setMultiMetricLoading(true);
      const metrics: Array<'revenue' | 'profit' | 'sales_volume' | 'customers'> = ['revenue', 'profit', 'sales_volume', 'customers'];
      
      const results = await Promise.allSettled(
        metrics.map(async (m) => {
          try {
            const response = await biService.getTrendAnalysis(m, period, granularity);
            // Handle wrapped response
            let data: TrendAnalysisData;
            if (response && typeof response === 'object' && (response as { success?: boolean; data?: TrendAnalysisData }).success && (response as { success?: boolean; data?: TrendAnalysisData }).data) {
              data = (response as { success?: boolean; data?: TrendAnalysisData }).data!;
            } else if (response && typeof response === 'object' && (response as TrendAnalysisData).dataPoints) {
              data = response as TrendAnalysisData;
            } else {
              return { metric: m, data: null };
            }
            
            // Transform data points
            const dataPoints: TrendDataPoint[] = data.dataPoints?.map((point: TrendDataPoint) => ({
              period: point.period || '',
              value: point.value || 0,
              formattedPeriod: formatPeriod(point.period || '', granularity),
              date: point.date instanceof Date ? point.date : (point.date ? new Date(point.date as string) : new Date())
            })) || [];
            
            // Calculate summary
            const values = dataPoints.map((p: TrendDataPoint) => p.value);
            const totalValue = values.reduce((sum: number, val: number) => sum + val, 0);
            const averageValue = values.length > 0 ? totalValue / values.length : 0;
            const minValue = values.length > 0 ? Math.min(...values) : 0;
            const maxValue = values.length > 0 ? Math.max(...values) : 0;
            const growth = values.length >= 2 && values[0] > 0 
              ? ((values[values.length - 1] - values[0]) / values[0]) * 100 
              : 0;
            
            return {
              metric: m,
              data: {
                ...data,
                dataPoints,
                summary: {
                  totalValue,
                  averageValue,
                  minValue,
                  maxValue,
                  growth
                }
              }
            };
          } catch (err) {
            console.warn(`⚠️ Failed to load ${m} metric:`, err);
            return { metric: m, data: null };
          }
        })
      );
      
      const newMultiMetricData: typeof multiMetricData = {
        revenue: null,
        profit: null,
        sales_volume: null,
        customers: null
      };
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const metric = metrics[index];
          newMultiMetricData[metric] = result.value.data;
        }
      });
      
      setMultiMetricData(newMultiMetricData);
    } catch (error) {
      console.error('❌ Error loading multi-metric data:', error);
    } finally {
      setMultiMetricLoading(false);
    }
  }, [activeTab, period, granularity, formatPeriod]);

  // Load multi-metric data when tab changes or period/granularity changes
  useEffect(() => {
    if (activeTab === 'multi-metric') {
      loadMultiMetricData();
    }
  }, [loadMultiMetricData, activeTab, period, granularity]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fa-IR', {
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
        return 'تومان';
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
    <Section className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <Card className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              📈 تحلیل پیشرفته روند
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              تحلیل جامع روند، پیش‌بینی و بینش‌های هوشمند {getMetricLabel(metric)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as 'revenue' | 'profit' | 'sales_volume' | 'customers')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="revenue">درآمد</option>
                <option value="profit">سود</option>
                <option value="sales_volume">حجم فروش</option>
                <option value="customers">مشتریان</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="day">روزانه</option>
                <option value="week">هفتگی</option>
                <option value="month">ماهانه</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="7d">۷ روز گذشته</option>
                <option value="30d">۳۰ روز گذشته</option>
                <option value="90d">۹۰ روز گذشته</option>
                <option value="1y">یک سال گذشته</option>
              </select>
            </div>
            <button
              onClick={loadTrendAnalysis}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
            >
              بروزرسانی
            </button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto space-x-2 sm:space-x-4 md:space-x-8 space-x-reverse px-3 sm:px-4 md:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
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

        <div className="p-3 sm:p-4 md:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && trendData && (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 p-2 bg-blue-500 rounded-lg">
                      <span className="text-lg sm:text-xl md:text-2xl text-white block">📊</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">مجموع</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100 truncate">
                        {formatCurrency(trendData.summary.totalValue)} {getMetricUnit(metric)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 p-2 bg-green-500 rounded-lg">
                      <span className="text-lg sm:text-xl md:text-2xl text-white block">📈</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 mb-1">رشد</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-green-900 dark:text-green-100">
                        {trendData.summary.growth > 0 ? '+' : ''}{trendData.summary.growth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 p-2 bg-purple-500 rounded-lg">
                      <span className="text-lg sm:text-xl md:text-2xl text-white block">🎯</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">دقت روند</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100">
                        {(trendData.trend.rSquared * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 p-2 bg-orange-500 rounded-lg">
                      <span className="text-lg sm:text-xl md:text-2xl text-white block">📊</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">میانگین</p>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-orange-900 dark:text-orange-100 truncate">
                        {formatCurrency(trendData.summary.averageValue)} {getMetricUnit(metric)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rich Trend Visualization */}
              {trendData.dataPoints && trendData.dataPoints.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    نمودار روند {getMetricLabel(metric)}
                  </h3>
                  <CustomAreaChart
                    data={trendData.dataPoints.map((point) => ({
                      period: point.formattedPeriod || point.period,
                      value: point.value,
                      date: point.date instanceof Date ? point.date.toISOString() : (point.date || point.period)
                    }))}
                    areas={[{
                      dataKey: 'value',
                      fill: '#8B5CF6',
                      stroke: '#7C3AED',
                      name: getMetricLabel(metric)
                    }]}
                    xAxisKey="period"
                    height={400}
                    title=""
                    xAxisLabel="دوره زمانی"
                    yAxisLabel={getMetricUnit(metric)}
                  />
                  
                  {/* Trend Information */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">جهت روند</p>
                      <p className={`text-base sm:text-lg font-semibold ${
                        trendData.trend.direction === 'up' ? 'text-green-600 dark:text-green-400' :
                        trendData.trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {trendData.trend.direction === 'up' ? '📈 صعودی' :
                         trendData.trend.direction === 'down' ? '📉 نزولی' :
                         '➡️ پایدار'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">قدرت روند</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {(Math.abs(trendData.trend.slope) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">دقت پیش‌بینی</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {(trendData.trend.rSquared * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-5 md:p-6 text-center min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center">
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 px-4">
                    داده‌ای برای نمایش نمودار موجود نیست
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Forecast Tab */}
          {activeTab === 'forecast' && trendData && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rich Forecast Visualization */}
              {trendData.forecast && trendData.forecast.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    پیش‌بینی روند {getMetricLabel(metric)}
                  </h3>
                  <CustomForecastChart
                    data={[
                      ...trendData.dataPoints.map((point) => ({
                        period: point.formattedPeriod || point.period,
                        actual: point.value,
                        formattedPeriod: point.formattedPeriod || point.period,
                        isForecast: false
                      })),
                      ...trendData.forecast.map((point) => ({
                        period: point.formattedPeriod || point.period,
                        forecast: point.value,
                        formattedPeriod: point.formattedPeriod || point.period,
                        isForecast: true
                      }))
                    ]}
                    height={400}
                    title=""
                    yAxisLabel={getMetricUnit(metric)}
                  />
                  
                  {/* Forecast Summary */}
                  {trendData.forecast.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mb-1">میانگین پیش‌بینی</p>
                        <p className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100">
                          {formatCurrency(
                            trendData.forecast.reduce((sum, p) => sum + p.value, 0) / trendData.forecast.length
                          )} {getMetricUnit(metric)}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1">حداکثر پیش‌بینی</p>
                        <p className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {formatCurrency(Math.max(...trendData.forecast.map(p => p.value)))} {getMetricUnit(metric)}
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 mb-1">حداقل پیش‌بینی</p>
                        <p className="text-base sm:text-lg font-semibold text-orange-900 dark:text-orange-100">
                          {formatCurrency(Math.min(...trendData.forecast.map(p => p.value)))} {getMetricUnit(metric)}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mb-1">تعداد دوره‌های پیش‌بینی</p>
                        <p className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100">
                          {trendData.forecast.length} دوره
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center min-h-[300px] flex items-center justify-center">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    داده پیش‌بینی در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Multi-Metric Tab */}
          {activeTab === 'multi-metric' && (
            <MultiMetricTab
              multiMetricData={multiMetricData}
              multiMetricLoading={multiMetricLoading}
              formatCurrency={formatCurrency}
              loadMultiMetricData={loadMultiMetricData}
            />
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && trendData && (
            <div className="space-y-4 sm:space-y-6">
              {trendData.insights && trendData.insights.length > 0 ? (
                <div className="space-y-4">
                  {trendData.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6 border-r-4 border-purple-500"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 text-lg sm:text-xl">💡</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed">
                            {insight}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-4">🧠</div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      بینش‌های هوشمند
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      برای این دوره و معیار انتخاب شده، بینش خاصی تولید نشده است.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
                      بینش‌ها بر اساس الگوهای موجود در داده‌ها و روندها تولید می‌شوند.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Additional Trend Insights */}
              {trendData && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 sm:p-5 md:p-6">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3">
                    تحلیل روند فعلی
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-gray-400">جهت روند:</span>
                      <span className={`font-medium ${
                        trendData.trend.direction === 'up' ? 'text-green-600 dark:text-green-400' :
                        trendData.trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {trendData.trend.description || 
                         (trendData.trend.direction === 'up' ? 'روند صعودی' :
                          trendData.trend.direction === 'down' ? 'روند نزولی' :
                          'روند پایدار')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-gray-400">نرخ رشد:</span>
                      <span className={`font-medium ${
                        trendData.summary.growth > 0 ? 'text-green-600 dark:text-green-400' :
                        trendData.summary.growth < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {trendData.summary.growth > 0 ? '+' : ''}{trendData.summary.growth.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-gray-400">دقت پیش‌بینی:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(trendData.trend.rSquared * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scorecard Tab */}
          {activeTab === 'scorecard' && trendData && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  کارت امتیاز {getMetricLabel(metric)}
                </h3>
                
                {/* Main KPIs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm opacity-90">مجموع کل</span>
                      <span className="text-lg sm:text-xl">📊</span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">
                      {formatCurrency(trendData.summary.totalValue)}
                    </p>
                    <p className="text-xs sm:text-sm opacity-75 mt-1">{getMetricUnit(metric)}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm opacity-90">میانگین</span>
                      <span className="text-lg sm:text-xl">📈</span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">
                      {formatCurrency(trendData.summary.averageValue)}
                    </p>
                    <p className="text-xs sm:text-sm opacity-75 mt-1">{getMetricUnit(metric)}</p>
                  </div>
                  
                  <div className={`bg-gradient-to-br rounded-lg p-4 sm:p-5 text-white ${
                    trendData.summary.growth >= 0 
                      ? 'from-green-500 to-green-600' 
                      : 'from-red-500 to-red-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm opacity-90">نرخ رشد</span>
                      <span className="text-lg sm:text-xl">
                        {trendData.summary.growth >= 0 ? '📈' : '📉'}
                      </span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">
                      {trendData.summary.growth > 0 ? '+' : ''}{trendData.summary.growth.toFixed(2)}%
                    </p>
                    <p className="text-xs sm:text-sm opacity-75 mt-1">در مقایسه با دوره قبل</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 sm:p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm opacity-90">دقت پیش‌بینی</span>
                      <span className="text-lg sm:text-xl">🎯</span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">
                      {(trendData.trend.rSquared * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs sm:text-sm opacity-75 mt-1">ضریب اطمینان</p>
                  </div>
                </div>
                
                {/* Additional Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">حداکثر مقدار</p>
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(trendData.summary.maxValue)} {getMetricUnit(metric)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">حداقل مقدار</p>
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(trendData.summary.minValue)} {getMetricUnit(metric)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">تعداد نقاط داده</p>
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                      {trendData.dataPoints.length} نقطه
                    </p>
                  </div>
                </div>
                
                {/* Trend Direction Card */}
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">وضعیت روند</p>
                      <p className={`text-base sm:text-lg md:text-xl font-semibold ${
                        trendData.trend.direction === 'up' ? 'text-green-600 dark:text-green-400' :
                        trendData.trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {trendData.trend.direction === 'up' ? '📈 روند صعودی' :
                         trendData.trend.direction === 'down' ? '📉 روند نزولی' :
                         '➡️ روند پایدار'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {trendData.trend.description}
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl">
                      {trendData.trend.direction === 'up' ? '📈' :
                       trendData.trend.direction === 'down' ? '📉' :
                       '➡️'}
                    </div>
                  </div>
                </div>
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
    </Section>
  );
}
