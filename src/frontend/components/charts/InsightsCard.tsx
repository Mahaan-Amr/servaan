'use client';

import React from 'react';

interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  actionable: boolean;
  recommendations?: string[];
  metrics?: {
    current: number;
    previous: number;
    change: number;
    unit: string;
  };
  timestamp: Date;
}

interface CustomInsightsCardProps {
  insights: Insight[];
  title?: string;
  className?: string;
  maxInsights?: number;
  showMetrics?: boolean;
  onInsightClick?: (insight: Insight) => void;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'anomaly':
      return '🚨';
    case 'trend':
      return '📈';
    case 'opportunity':
      return '💡';
    case 'warning':
      return '⚠️';
    case 'success':
      return '✅';
    default:
      return '📊';
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'anomaly':
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    case 'trend':
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    case 'opportunity':
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
    case 'success':
      return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20';
    default:
      return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
  }
};

const getImpactBadge = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getImpactLabel = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'تأثیر بالا';
    case 'medium':
      return 'تأثیر متوسط';
    case 'low':
      return 'تأثیر کم';
    default:
      return 'نامشخص';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'همین الان';
  if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} روز پیش`;
};

export const CustomInsightsCard: React.FC<CustomInsightsCardProps> = ({
  insights,
  title = 'بینش‌های هوشمند',
  className = '',
  maxInsights = 10,
  showMetrics = true,
  onInsightClick
}) => {
  const displayedInsights = insights.slice(0, maxInsights);
  
  if (insights.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-gray-500 dark:text-gray-400">
              در حال تحلیل داده‌ها برای تولید بینش‌های جدید...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group insights by type for summary
  const insightsByType = insights.reduce((acc, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {insights.length} بینش
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {Object.entries(insightsByType).map(([type, count]) => (
          <div key={type} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
            <span className="text-lg">{getInsightIcon(type)}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
          </div>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayedInsights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${getInsightColor(insight.type)}`}
            onClick={() => onInsightClick?.(insight)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getInsightIcon(insight.type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {insight.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getImpactBadge(insight.impact)}`}>
                      {getImpactLabel(insight.impact)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      اطمینان: {insight.confidence}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(insight.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              
              {insight.actionable && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs">قابل اجرا</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {insight.description}
            </p>

            {/* Metrics */}
            {showMetrics && insight.metrics && (
              <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">فعلی</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {insight.metrics.current.toLocaleString('fa-IR')} {insight.metrics.unit}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">قبلی</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {insight.metrics.previous.toLocaleString('fa-IR')} {insight.metrics.unit}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">تغییر</div>
                  <div className={`font-medium ${insight.metrics.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {insight.metrics.change >= 0 ? '+' : ''}{insight.metrics.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insight.recommendations && insight.recommendations.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توصیه‌های عملی:
                </h5>
                <ul className="space-y-1">
                  {insight.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {insights.length > maxInsights && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            نمایش {insights.length - maxInsights} بینش دیگر
          </button>
        </div>
      )}

      {/* AI Status */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            هوش مصنوعی در حال تحلیل مداوم داده‌ها و تولید بینش‌های جدید است
          </span>
        </div>
      </div>
    </div>
  );
}; 