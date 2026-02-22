'use client';

import React from 'react';
import { CustomMultiMetricChart } from '../../../../components/charts/MultiMetricChart';
import { TrendAnalysisData } from '../../../../types/bi';

interface MultiMetricTabProps {
  multiMetricData: {
    revenue: TrendAnalysisData | null;
    profit: TrendAnalysisData | null;
    sales_volume: TrendAnalysisData | null;
    customers: TrendAnalysisData | null;
  };
  multiMetricLoading: boolean;
  formatCurrency: (value: number) => string;
  loadMultiMetricData: () => void;
}

export const MultiMetricTab: React.FC<MultiMetricTabProps> = ({
  multiMetricData,
  multiMetricLoading,
  formatCurrency,
  loadMultiMetricData
}) => {
  if (multiMetricLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Prepare data for comparison chart
  const allDataPoints = new Map<string, {
    period: string;
    formattedPeriod: string;
    revenue?: number;
    profit?: number;
    sales_volume?: number;
    customers?: number;
  }>();

  // Collect all periods from all metrics
  ['revenue', 'profit', 'sales_volume', 'customers'].forEach((m) => {
    const data = multiMetricData[m as keyof typeof multiMetricData];
    if (data?.dataPoints) {
      data.dataPoints.forEach((point) => {
        const key = point.period || point.formattedPeriod;
        if (!allDataPoints.has(key)) {
          allDataPoints.set(key, {
            period: point.period || '',
            formattedPeriod: point.formattedPeriod || point.period || ''
          });
        }
        const existing = allDataPoints.get(key)!;
        if (m === 'sales_volume') {
          existing.sales_volume = point.value;
        } else if (m === 'revenue') {
          existing.revenue = point.value;
        } else if (m === 'profit') {
          existing.profit = point.value;
        } else if (m === 'customers') {
          existing.customers = point.value;
        }
      });
    }
  });

  const chartData = Array.from(allDataPoints.values()).sort((a, b) => {
    const dateA = new Date(a.period || a.formattedPeriod);
    const dateB = new Date(b.period || b.formattedPeriod);
    return dateA.getTime() - dateB.getTime();
  });

  const hasData = chartData.length > 0 && (
    multiMetricData.revenue?.dataPoints?.length ||
    multiMetricData.profit?.dataPoints?.length ||
    multiMetricData.sales_volume?.dataPoints?.length ||
    multiMetricData.customers?.dataPoints?.length
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
          مقایسه چند معیاره
        </h3>
        
        {hasData ? (
          <>
            <CustomMultiMetricChart
              data={chartData}
              metrics={[
                {
                  dataKey: 'revenue',
                  name: 'درآمد',
                  type: 'line',
                  color: '#22c55e',
                  yAxisId: 'left',
                  strokeWidth: 2,
                  unit: 'تومان'
                },
                {
                  dataKey: 'profit',
                  name: 'سود',
                  type: 'line',
                  color: '#3b82f6',
                  yAxisId: 'left',
                  strokeWidth: 2,
                  unit: 'تومان'
                },
                {
                  dataKey: 'sales_volume',
                  name: 'حجم فروش',
                  type: 'bar',
                  color: '#f59e0b',
                  yAxisId: 'right',
                  unit: 'عدد'
                },
                {
                  dataKey: 'customers',
                  name: 'مشتریان',
                  type: 'line',
                  color: '#8b5cf6',
                  yAxisId: 'right',
                  strokeWidth: 2,
                  unit: 'نفر'
                }
              ]}
              height={400}
              title=""
              xAxisLabel="دوره زمانی"
              leftYAxisLabel="درآمد و سود (تومان)"
              rightYAxisLabel="حجم فروش و مشتریان"
            />

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {multiMetricData.revenue && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 mb-1">درآمد کل</p>
                  <p className="text-base sm:text-lg font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(multiMetricData.revenue.summary.totalValue)} تومان
                  </p>
                </div>
              )}
              {multiMetricData.profit && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">سود کل</p>
                  <p className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(multiMetricData.profit.summary.totalValue)} تومان
                  </p>
                </div>
              )}
              {multiMetricData.sales_volume && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
                  <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">حجم فروش کل</p>
                  <p className="text-base sm:text-lg font-bold text-orange-900 dark:text-orange-100">
                    {multiMetricData.sales_volume.summary.totalValue.toLocaleString('fa-IR')} عدد
                  </p>
                </div>
              )}
              {multiMetricData.customers && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                  <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">مشتریان منحصر به فرد</p>
                  <p className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-100">
                    {multiMetricData.customers.summary.totalValue.toLocaleString('fa-IR')} نفر
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl sm:text-6xl mb-4">📊</div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              داده‌ای برای مقایسه موجود نیست
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
              برای این دوره زمانی داده‌ای برای مقایسه چند معیاره موجود نیست.
            </p>
            <button
              onClick={loadMultiMetricData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              تلاش مجدد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

