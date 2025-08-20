'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { 
  getCustomerStatistics, 
  getLoyaltyStatistics
} from '../../../../../services/customerService';
import { getVisitAnalytics } from '../../../../../services/visitService';
import { 
  CustomerStatistics, 
  LoyaltyStatistics, 
  VisitAnalytics,
  CustomerAnalyticsFilters
} from '../../../../../types/crm';
import { 
  CustomForecastChart,
  CustomInsightsCard,
  CustomMultiMetricChart,
  CustomKPIScorecard,
  CustomDonutChart
} from '../../../../../components/charts';
import { TrendingUp, Users, Target, Brain, Zap } from 'lucide-react';

interface PredictiveInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'warning' | 'anomaly' | 'success';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  timestamp: Date;
}

interface AdvancedAnalyticsData {
  customerStats: CustomerStatistics | null;
  loyaltyStats: LoyaltyStatistics | null;
  visitAnalytics: VisitAnalytics | null;
  predictiveInsights: PredictiveInsight[];
  revenueAttribution: RevenueAttributionData[];
}

interface CustomerJourneyStage {
  stage: string;
  customers: number;
  conversionRate: number;
  averageTimeInStage: number;
  revenue: number;
}

interface ChurnPredictionData {
  segment: string;
  totalCustomers: number;
  atRiskCustomers: number;
  churnProbability: number;
  recommendedActions: string[];
}

interface RevenueAttributionData {
  channel: string;
  revenue: number;
  customers: number;
  averageOrderValue: number;
  conversionRate: number;
  costPerAcquisition: number;
  roi: number;
}

export default function AdvancedAnalyticsPage() {
  const { } = useAuth();
  const [data, setData] = useState<AdvancedAnalyticsData>({
    customerStats: null,
    loyaltyStats: null,
    visitAnalytics: null,
    predictiveInsights: [],
    revenueAttribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  const loadAdvancedAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: CustomerAnalyticsFilters = {
        timeRange,
        segments: selectedSegment !== 'all' ? [selectedSegment] : undefined
      };

      // Calculate date range for visit analytics
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const [customerStats, loyaltyStats, visitAnalytics] = await Promise.all([
        getCustomerStatistics(filters),
        getLoyaltyStatistics(filters),
        getVisitAnalytics({ startDate: startDate.toISOString(), endDate: endDate.toISOString() })
      ]);

      // Generate predictive insights and revenue attribution data
      const predictiveInsights = generatePredictiveInsights(customerStats, visitAnalytics);
      const revenueAttribution = generateRevenueAttribution(visitAnalytics, customerStats);

      setData({
        customerStats,
        loyaltyStats,
        visitAnalytics,
        predictiveInsights,
        revenueAttribution
      });
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
      setError(error instanceof Error ? error.message : 'خطا در بارگذاری تحلیل‌های پیشرفته');
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedSegment]);

  useEffect(() => {
    loadAdvancedAnalytics();
  }, [loadAdvancedAnalytics]);

  // Generate customer journey visualization data
  const generateCustomerJourneyData = (): CustomerJourneyStage[] => {
    if (!data.customerStats) return [];

    const totalCustomers = data.customerStats.total;
    const segments = data.customerStats.bySegment;

    return [
      {
        stage: 'آگاهی',
        customers: Math.round(totalCustomers * 1.5), // Potential customers
        conversionRate: 100,
        averageTimeInStage: 0,
        revenue: 0
      },
      {
        stage: 'علاقه‌مندی',
        customers: totalCustomers,
        conversionRate: 67,
        averageTimeInStage: 2,
        revenue: 0
      },
      {
        stage: 'اولین خرید',
        customers: segments.NEW || 0,
        conversionRate: 45,
        averageTimeInStage: 7,
        revenue: data.visitAnalytics?.totalRevenue ? data.visitAnalytics.totalRevenue * 0.15 : 0
      },
      {
        stage: 'مشتری گاه‌به‌گاه',
        customers: segments.OCCASIONAL || 0,
        conversionRate: 30,
        averageTimeInStage: 45,
        revenue: data.visitAnalytics?.totalRevenue ? data.visitAnalytics.totalRevenue * 0.25 : 0
      },
      {
        stage: 'مشتری منظم',
        customers: segments.REGULAR || 0,
        conversionRate: 20,
        averageTimeInStage: 90,
        revenue: data.visitAnalytics?.totalRevenue ? data.visitAnalytics.totalRevenue * 0.40 : 0
      },
      {
        stage: 'مشتری VIP',
        customers: segments.VIP || 0,
        conversionRate: 15,
        averageTimeInStage: 180,
        revenue: data.visitAnalytics?.totalRevenue ? data.visitAnalytics.totalRevenue * 0.20 : 0
      }
    ];
  };

  // Generate churn prediction data
  const generateChurnPredictionData = (): ChurnPredictionData[] => {
    if (!data.customerStats) return [];

    return Object.entries(data.customerStats.bySegment).map(([segment, count]) => {
      let churnProbability = 0;
      let recommendedActions: string[] = [];

      switch (segment) {
        case 'NEW':
          churnProbability = 65;
          recommendedActions = ['ارسال پیام خوش‌آمدگویی', 'ارائه تخفیف اولین خرید', 'راهنمایی محصولات'];
          break;
        case 'OCCASIONAL':
          churnProbability = 35;
          recommendedActions = ['کمپین بازگشت', 'ارسال پیشنهادات شخصی', 'دعوت به برنامه وفاداری'];
          break;
        case 'REGULAR':
          churnProbability = 15;
          recommendedActions = ['ارتقاء به VIP', 'ارائه خدمات ویژه', 'بررسی رضایت‌مندی'];
          break;
        case 'VIP':
          churnProbability = 8;
          recommendedActions = ['خدمات اختصاصی', 'مشاوره شخصی', 'دسترسی زودهنگام محصولات'];
          break;
      }

      return {
        segment: getSegmentLabel(segment),
        totalCustomers: count,
        atRiskCustomers: Math.round(count * (churnProbability / 100)),
        churnProbability,
        recommendedActions
      };
    });
  };

  // Generate revenue forecast data
  const generateRevenueForecastData = () => {
    if (!data.visitAnalytics) return [];

    const currentRevenue = data.visitAnalytics.totalRevenue;
    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
    
    return months.map((month, index) => {
      const growth = 1 + (Math.random() * 0.3 - 0.15); // Random growth between -15% to +15%
      const baseRevenue = currentRevenue * (1 + index * 0.05); // 5% base growth per month
      
      return {
        period: month,
        formattedPeriod: month,
        actual: index < 3 ? baseRevenue * growth : undefined,
        forecast: index >= 3 ? baseRevenue * growth : undefined,
        upperBound: index >= 3 ? baseRevenue * growth * 1.2 : undefined,
        lowerBound: index >= 3 ? baseRevenue * growth * 0.8 : undefined,
        isForecast: index >= 3
      };
    });
  };

  // Generate predictive insights
  const generatePredictiveInsights = (customerStats: CustomerStatistics, visitAnalytics: VisitAnalytics): PredictiveInsight[] => {
    const insights: PredictiveInsight[] = [];
    const currentDate = new Date();

    // Customer growth insight
    if (customerStats.newThisMonth > 0) {
      insights.push({
        id: '1',
        type: 'trend',
        title: 'رشد مشتریان جدید',
        description: `${customerStats.newThisMonth} مشتری جدید در این ماه اضافه شده‌اند`,
        impact: 'medium',
        confidence: 85,
        actionable: true,
        recommendations: ['تمرکز بر حفظ مشتریان جدید', 'ارسال پیام خوش‌آمدگویی'],
        timestamp: currentDate
      });
    }

    // Revenue trend insight
    if (visitAnalytics.averageOrderValue > 0) {
      insights.push({
        id: '2',
        type: 'opportunity',
        title: 'فرصت افزایش فروش',
        description: `متوسط ارزش سفارش ${Math.round(visitAnalytics.averageOrderValue).toLocaleString('fa-IR')} ریال است`,
        impact: 'high',
        confidence: 92,
        actionable: true,
        recommendations: ['پیشنهاد محصولات مکمل', 'ایجاد بسته‌های ترکیبی'],
        timestamp: currentDate
      });
    }

    // Segment analysis insight
    const vipCount = customerStats.bySegment.VIP || 0;
    const totalCustomers = customerStats.total;
    if (vipCount / totalCustomers < 0.1) {
      insights.push({
        id: '3',
        type: 'warning',
        title: 'کمبود مشتریان VIP',
        description: `تنها ${Math.round((vipCount / totalCustomers) * 100)}% مشتریان در سطح VIP هستند`,
        impact: 'high',
        confidence: 78,
        actionable: true,
        recommendations: ['برنامه ارتقاء مشتریان', 'ایجاد مزایای ویژه VIP'],
        timestamp: currentDate
      });
    }

    return insights;
  };

  // Generate revenue attribution data
  const generateRevenueAttribution = (visitAnalytics: VisitAnalytics, customerStats: CustomerStatistics): RevenueAttributionData[] => {
    const totalRevenue = visitAnalytics.totalRevenue;
    const totalCustomers = customerStats.total;

    return [
      {
        channel: 'مراجعه مستقیم',
        revenue: totalRevenue * 0.4,
        customers: Math.round(totalCustomers * 0.35),
        averageOrderValue: visitAnalytics.averageOrderValue * 1.2,
        conversionRate: 75,
        costPerAcquisition: 150000,
        roi: 320
      },
      {
        channel: 'معرفی دوستان',
        revenue: totalRevenue * 0.3,
        customers: Math.round(totalCustomers * 0.25),
        averageOrderValue: visitAnalytics.averageOrderValue * 1.5,
        conversionRate: 85,
        costPerAcquisition: 80000,
        roi: 450
      },
      {
        channel: 'شبکه‌های اجتماعی',
        revenue: totalRevenue * 0.2,
        customers: Math.round(totalCustomers * 0.3),
        averageOrderValue: visitAnalytics.averageOrderValue * 0.9,
        conversionRate: 45,
        costPerAcquisition: 200000,
        roi: 180
      },
      {
        channel: 'برنامه وفاداری',
        revenue: totalRevenue * 0.1,
        customers: Math.round(totalCustomers * 0.1),
        averageOrderValue: visitAnalytics.averageOrderValue * 1.8,
        conversionRate: 90,
        costPerAcquisition: 50000,
        roi: 520
      }
    ];
  };

  const getSegmentLabel = (segment: string): string => {
    const labels: Record<string, string> = {
      'VIP': 'مشتریان VIP',
      'REGULAR': 'مشتریان منظم',
      'OCCASIONAL': 'مشتریان گاه‌به‌گاه',
      'NEW': 'مشتریان جدید'
    };
    return labels[segment] || segment;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری تحلیل‌های پیشرفته...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری داده‌ها</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadAdvancedAnalytics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const customerJourneyData = generateCustomerJourneyData();
  const churnPredictionData = generateChurnPredictionData();
  const revenueForecastData = generateRevenueForecastData();
  const revenueAttributionData = data.revenueAttribution;

  // Generate KPI metrics data
  const kpiMetrics = [
    {
      id: '1',
      name: 'نرخ تبدیل کلی',
      value: Math.round((data.customerStats?.active || 0) / (data.customerStats?.total || 1) * 100),
      unit: '%',
      trend: 'up' as const,
      status: 'good' as const,
      change: 5.2,
      description: 'تبدیل مشتریان جدید به فعال',
      category: 'customer' as const
    },
    {
      id: '2',
      name: 'ارزش متوسط مشتری',
      value: data.customerStats?.averageLifetimeValue || 0,
      unit: 'ریال',
      trend: 'up' as const,
      status: 'good' as const,
      change: 8.7,
      description: 'CLV محاسبه شده',
      category: 'financial' as const
    },
    {
      id: '3',
      name: 'نرخ ریزش پیش‌بینی',
      value: Math.round(churnPredictionData.reduce((acc, item) => acc + item.churnProbability, 0) / (churnPredictionData.length || 1)),
      unit: '%',
      trend: 'down' as const,
      status: 'warning' as const,
      change: -2.1,
      description: 'ریزش در 30 روز آینده',
      category: 'customer' as const
    },
    {
      id: '4',
      name: 'ROI کمپین‌ها',
      value: 325,
      unit: '%',
      trend: 'up' as const,
      status: 'excellent' as const,
      change: 12.3,
      description: 'بازگشت سرمایه کلی',
      category: 'financial' as const
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            تحلیل‌های پیشرفته
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            سفر مشتری، تحلیل‌های پیش‌بینی و تحلیل درآمد
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '30d' | '90d' | '1y')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="30d">30 روز گذشته</option>
            <option value="90d">90 روز گذشته</option>
            <option value="1y">سال گذشته</option>
          </select>
          
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">همه بخش‌ها</option>
            <option value="NEW">مشتریان جدید</option>
            <option value="OCCASIONAL">مشتریان گاه‌به‌گاه</option>
            <option value="REGULAR">مشتریان منظم</option>
            <option value="VIP">مشتریان VIP</option>
          </select>
          
          <button
            onClick={loadAdvancedAnalytics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            بروزرسانی
          </button>
        </div>
      </div>

      {/* KPI Scorecards */}
      <CustomKPIScorecard
        metrics={kpiMetrics}
        title="شاخص‌های کلیدی عملکرد"
        showTargets={true}
        showTrends={true}
        period={`${timeRange === '30d' ? '30 روز' : timeRange === '90d' ? '90 روز' : 'سال'} گذشته`}
      />

      {/* Customer Journey Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            سفر مشتری
          </h3>
          <div className="space-y-4">
            {customerJourneyData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{stage.stage}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(stage.customers)} مشتری • {stage.conversionRate}% تبدیل
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(stage.revenue).split(' ')[0]}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">درآمد</p>
                  </div>
                </div>
                {index < customerJourneyData.length - 1 && (
                  <div className="absolute right-4 -bottom-2 w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Churn Prediction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            پیش‌بینی ریزش مشتری
          </h3>
          <div className="space-y-4">
            {churnPredictionData.map((item) => (
              <div key={item.segment} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.segment}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.churnProbability > 50 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : item.churnProbability > 25
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {item.churnProbability}% ریسک
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatNumber(item.atRiskCustomers)} در معرض ریسک</span>
                  <span>از {formatNumber(item.totalCustomers)} مشتری</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.churnProbability > 50 ? 'bg-red-500' :
                        item.churnProbability > 25 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${item.churnProbability}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Forecast */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            پیش‌بینی درآمد
          </h3>
          <CustomForecastChart
            data={revenueForecastData}
            height={300}
            showConfidenceInterval={true}
            showTrendLine={true}
            yAxisLabel="درآمد (ریال)"
          />
        </div>

        {/* Revenue Attribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            تحلیل منابع درآمد
          </h3>
          <CustomDonutChart
            data={revenueAttributionData.map(item => ({
              name: item.channel,
              value: item.revenue,
              count: item.customers,
              percentage: (item.revenue / revenueAttributionData.reduce((sum, i) => sum + i.revenue, 0)) * 100,
              color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'][revenueAttributionData.indexOf(item)]
            }))}

          />
        </div>
      </div>

      {/* Multi-Metric Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Metric Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تحلیل چندبعدی مشتریان</h3>
          <CustomMultiMetricChart
            data={customerJourneyData.map(stage => ({
              period: stage.stage,
              formattedPeriod: stage.stage,
              customers: stage.customers,
              revenue: stage.revenue,
              conversionRate: stage.conversionRate
            }))}
            metrics={[
              { 
                dataKey: 'customers', 
                name: 'تعداد مشتری', 
                type: 'bar', 
                color: '#3B82F6', 
                yAxisId: 'left' 
              },
              { 
                dataKey: 'revenue', 
                name: 'درآمد', 
                type: 'line', 
                color: '#10B981', 
                yAxisId: 'right',
                strokeWidth: 3
              },
              { 
                dataKey: 'conversionRate', 
                name: 'نرخ تبدیل', 
                type: 'line', 
                color: '#F59E0B', 
                yAxisId: 'left',
                strokeWidth: 2
              }
            ]}
            height={350}
            leftYAxisLabel="تعداد مشتری / نرخ تبدیل"
            rightYAxisLabel="درآمد (ریال)"
          />
        </div>

        {/* Insights Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <CustomInsightsCard
            insights={data.predictiveInsights}
            title="بینش‌های هوشمند"
            maxInsights={5}
            showMetrics={true}
          />
        </div>
      </div>

      {/* Revenue Attribution Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">جزئیات منابع درآمد</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">منبع</th>
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">درآمد</th>
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">مشتریان</th>
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">متوسط سفارش</th>
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">نرخ تبدیل</th>
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">هزینه جذب</th>
                <th className="text-right py-3 font-semibold text-gray-900 dark:text-white">ROI</th>
              </tr>
            </thead>
            <tbody>
              {revenueAttributionData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{item.channel}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatCurrency(item.revenue).split(' ')[0]}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatNumber(item.customers)}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatCurrency(item.averageOrderValue).split(' ')[0]}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{item.conversionRate}%</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatCurrency(item.costPerAcquisition).split(' ')[0]}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.roi > 300 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : item.roi > 200
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {item.roi}%
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