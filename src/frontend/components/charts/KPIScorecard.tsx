'use client';

import React from 'react';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  change?: number;
  changePercent?: number;
  description?: string;
  category: 'financial' | 'operational' | 'customer' | 'growth';
}

interface CustomKPIScorecardProps {
  metrics: KPIMetric[];
  title?: string;
  className?: string;
  showTargets?: boolean;
  showTrends?: boolean;
  compactView?: boolean;
  period?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent':
      return 'bg-green-500';
    case 'good':
      return 'bg-blue-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'excellent':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'excellent':
      return 'عالی';
    case 'good':
      return 'خوب';
    case 'warning':
      return 'هشدار';
    case 'critical':
      return 'بحرانی';
    default:
      return 'نامشخص';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'stable':
      return '➡️';
    default:
      return '📊';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up':
      return 'text-green-600 dark:text-green-400';
    case 'down':
      return 'text-red-600 dark:text-red-400';
    case 'stable':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'financial':
      return '💰';
    case 'operational':
      return '⚙️';
    case 'customer':
      return '👥';
    case 'growth':
      return '🚀';
    default:
      return '📊';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'financial':
      return 'مالی';
    case 'operational':
      return 'عملیاتی';
    case 'customer':
      return 'مشتری';
    case 'growth':
      return 'رشد';
    default:
      return 'عمومی';
  }
};

const calculateTargetProgress = (value: number, target: number) => {
  if (target === 0) return 0;
  return Math.min((value / target) * 100, 100);
};

export const CustomKPIScorecard: React.FC<CustomKPIScorecardProps> = ({
  metrics,
  title = 'کارت امتیاز عملکرد',
  className = '',
  showTargets = true,
  showTrends = true,
  compactView = false,
  period = '30 روز گذشته'
}) => {
  if (metrics.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">هیچ معیاری برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  // Calculate overall health score
  const statusScores = { excellent: 4, good: 3, warning: 2, critical: 1 };
  const overallScore = metrics.reduce((sum, metric) => sum + statusScores[metric.status], 0) / metrics.length;
  const overallHealth = overallScore >= 3.5 ? 'excellent' : overallScore >= 2.5 ? 'good' : overallScore >= 1.5 ? 'warning' : 'critical';

  // Group metrics by category
  const metricsByCategory = metrics.reduce((acc, metric) => {
    acc[metric.category] = acc[metric.category] || [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, KPIMetric[]>);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {period} • {metrics.length} معیار
          </p>
        </div>
        
        {/* Overall Health Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">سلامت کلی</div>
            <div className={`text-lg font-bold ${getTrendColor(overallHealth === 'excellent' || overallHealth === 'good' ? 'up' : 'down')}`}>
              {(overallScore * 25).toFixed(0)}%
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full ${getStatusColor(overallHealth)}`}></div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusScores).map(([status]) => {
          const count = metrics.filter(m => m.status === status).length;
          return (
            <div key={status} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${getStatusColor(status)}`}></div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{getStatusLabel(status)}</div>
            </div>
          );
        })}
      </div>

      {/* Metrics by Category */}
      <div className="space-y-6">
        {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {getCategoryLabel(category)}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({categoryMetrics.length})
              </span>
            </div>

            <div className={`grid gap-4 ${compactView ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {categoryMetrics.map((metric) => (
                <div key={metric.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Metric Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                        {metric.name}
                      </h5>
                      {metric.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {metric.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(metric.status)}`}>
                        {getStatusLabel(metric.status)}
                      </span>
                    </div>
                  </div>

                  {/* Metric Value */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {metric.unit}
                      </span>
                    </div>

                    {/* Trend and Change */}
                    {showTrends && metric.changePercent !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                        <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                          {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                        </span>
                        {metric.previousValue && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            از {metric.previousValue.toLocaleString('fa-IR')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Target Progress */}
                  {showTargets && metric.target && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>هدف: {metric.target.toLocaleString('fa-IR')} {metric.unit}</span>
                        <span>{calculateTargetProgress(metric.value, metric.target).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculateTargetProgress(metric.value, metric.target) >= 100
                              ? 'bg-green-500'
                              : calculateTargetProgress(metric.value, metric.target) >= 80
                              ? 'bg-blue-500'
                              : calculateTargetProgress(metric.value, metric.target) >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${calculateTargetProgress(metric.value, metric.target)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Health Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)}`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        وضعیت سلامت
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      آخرین بروزرسانی: همین الان
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Items */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          اقدامات پیشنهادی
        </h4>
        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          {metrics.filter(m => m.status === 'critical').length > 0 && (
            <div>• بررسی فوری معیارهای بحرانی ({metrics.filter(m => m.status === 'critical').length} مورد)</div>
          )}
          {metrics.filter(m => m.status === 'warning').length > 0 && (
            <div>• نظارت بر معیارهای هشدار ({metrics.filter(m => m.status === 'warning').length} مورد)</div>
          )}
          {metrics.filter(m => m.target && m.value < m.target).length > 0 && (
            <div>• بازنگری اهداف و استراتژی‌های دستیابی</div>
          )}
          <div>• تحلیل عمیق‌تر روندهای منفی برای شناسایی علل ریشه‌ای</div>
        </div>
      </div>
    </div>
  );
}; 