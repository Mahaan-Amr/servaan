import React from 'react';
import { CustomerInsights } from '../../types/crm';

interface CustomerAnalyticsDashboardProps {
  insights: CustomerInsights;
}

export default function CustomerAnalyticsDashboard({ insights }: CustomerAnalyticsDashboardProps) {
  const getRiskScoreColor = (score: number) => {
    if (score < 20) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
    if (score < 50) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'LOW': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'DECREASING':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('fa-IR') + ' ریال';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">امتیاز ریسک</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.riskScore}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(insights.riskScore)}`}>
              {insights.riskScore < 20 ? 'کم' : insights.riskScore < 50 ? 'متوسط' : 'بالا'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">امتیاز رضایت</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.satisfactionScore}</p>
            </div>
            <div className="text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">احتمال ترک</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.churnProbability}%</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              insights.churnProbability < 20 ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' :
              insights.churnProbability < 50 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300' :
              'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
            }`}>
              {insights.churnProbability < 20 ? 'کم' : insights.churnProbability < 50 ? 'متوسط' : 'بالا'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">میزان تعامل</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.loyaltyEngagement}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(insights.loyaltyEngagement)}`}>
              {insights.loyaltyEngagement === 'HIGH' ? 'بالا' : insights.loyaltyEngagement === 'MEDIUM' ? 'متوسط' : 'کم'}
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral Analytics */}
      {insights.behavioral && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">تحلیل رفتاری</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ساعات پیک بازدید</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {insights.behavioral.peakVisitHours.length > 0 ? 
                    insights.behavioral.peakVisitHours.join(', ') : 'اطلاعات کافی نیست'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">روش پرداخت ترجیحی</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.behavioral.preferredPaymentMethod}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">میانگین مدت جلسه</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.behavioral.averageSessionDuration} دقیقه</dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Analytics */}
      {insights.engagement && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">تحلیل تعامل</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">نرخ پاسخ به کمپین</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.engagement.campaignResponseRate.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">نرخ تعامل پیامکی</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.engagement.smsEngagementRate.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">مشارکت در وفاداری</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.engagement.loyaltyParticipation}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">آخرین تعامل</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(insights.engagement.lastEngagementDate)}</dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Analytics */}
      {insights.predictive && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">تحلیل پیش‌بینی</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">پیش‌بینی رشد ارزش مشتری</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatCurrency(insights.predictive.lifetimeValueGrowth)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">پیش‌بینی مبلغ خرید بعدی</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatCurrency(insights.predictive.nextPurchaseAmount)}</dd>
              </div>
              {insights.predictive.churnRiskFactors.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">عوامل ریسک ترک</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      {insights.predictive.churnRiskFactors.map((factor, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
              {insights.predictive.upsellOpportunities.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">فرصت‌های فروش بیشتر</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      {insights.predictive.upsellOpportunities.map((opportunity, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {opportunity}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visit Patterns */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">الگوهای بازدید</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">میانگین فاصله بازدیدها</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.averageDaysBetweenVisits} روز</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">امتیاز تناوب بازدید</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{insights.visitFrequencyScore}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">روند خرید</dt>
              <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                {getTrendIcon(insights.spendingTrend)}
                <span className="mr-2">
                  {insights.spendingTrend === 'INCREASING' ? 'رو به افزایش' : 
                   insights.spendingTrend === 'DECREASING' ? 'رو به کاهش' : 'ثابت'}
                </span>
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">پیشنهادات</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {insights.recommendedOffers.map((offer, index) => (
              <div key={index} className="flex items-start space-x-3 space-x-reverse">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{offer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar Customers */}
      {insights.similarCustomers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">مشتریان مشابه</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {insights.similarCustomers.map((customer, index) => (
                <span key={index} className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {customer}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 