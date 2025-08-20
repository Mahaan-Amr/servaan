import React, { useState, useEffect, useCallback } from 'react';
import { 
  EnhancedCustomerProfile
} from '../../types/crm';
import { 
  getEnhancedCustomerProfile,
  formatLifetimeValue,
  formatPercentage,
  getStrengthLevelColor,
  getCompleteLevelColor,
  getTrendColor,
  getTrendIcon,
  getPriorityColor,
  getAgeGroupLabel,
  getLifeStageLabel,
  getPricePointLabel,
  formatPersianDate,
  formatRelativeTime,
  getScoreColor,
  getScoreBackgroundColor
} from '../../services/enhancedCustomerProfileService';

interface EnhancedCustomerProfileDashboardProps {
  customerId: string;
}

// Helper functions to convert enum values
const convertTrendValue = (trend: string): 'STABLE' | 'DECLINING' | 'IMPROVING' => {
  switch (trend) {
    case 'ASCENDING':
    case 'INCREASING':
      return 'IMPROVING';
    case 'DECREASING':
      return 'DECLINING';
    default:
      return 'STABLE';
  }
};

const convertPriorityValue = (priority: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  switch (priority) {
    case 'CRITICAL':
      return 'HIGH';
    case 'MEDIUM':
      return 'MEDIUM';
    case 'LOW':
      return 'LOW';
    default:
      return 'HIGH';
  }
};

export default function EnhancedCustomerProfileDashboard({ customerId }: EnhancedCustomerProfileDashboardProps) {
  const [profile, setProfile] = useState<EnhancedCustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'purchase' | 'demographic' | 'relationship' | 'insights'>('overview');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEnhancedCustomerProfile(customerId);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching enhanced customer profile:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت پروفایل پیشرفته مشتری');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchProfile}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">پروفایل پیشرفته مشتری موجود نیست</p>
      </div>
    );
  }

  // Continue with existing render functions but fix the type issues
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Completeness */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">کامل بودن پروفایل</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCompleteLevelColor(profile.profileCompleteness.completenessLevel)}`}>
            {profile.profileCompleteness.completenessLevel}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">امتیاز کلی</span>
              <span className="text-2xl font-bold text-gray-900">{profile.profileCompleteness.overallScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getScoreBackgroundColor(profile.profileCompleteness.overallScore)}`}
                style={{ width: `${profile.profileCompleteness.overallScore}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">دقت</div>
              <div className="text-lg font-semibold text-gray-900">{formatPercentage(profile.profileCompleteness.dataQuality.accuracy)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">تازگی</div>
              <div className="text-lg font-semibold text-gray-900">{formatPercentage(profile.profileCompleteness.dataQuality.freshness)}</div>
            </div>
          </div>
        </div>
        {profile.profileCompleteness.missingFields.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">فیلدهای گمشده:</h4>
            <div className="flex flex-wrap gap-2">
              {profile.profileCompleteness.missingFields.map((field, index) => (
                <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Relationship Strength Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">قدرت رابطه</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStrengthLevelColor(profile.relationshipStrength.strengthLevel)}`}>
            {profile.relationshipStrength.strengthLevel}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{profile.relationshipStrength.overallStrength}/100</div>
            <div className="text-sm text-gray-600">امتیاز کلی</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{formatPercentage(profile.relationshipStrength.engagementMetrics.visitFrequency)}</div>
            <div className="text-sm text-gray-600">تکرار بازدید</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{formatPercentage(profile.relationshipStrength.engagementMetrics.loyaltyParticipation)}</div>
            <div className="text-sm text-gray-600">مشارکت وفاداری</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{formatPercentage(profile.relationshipStrength.engagementMetrics.campaignResponseRate)}</div>
            <div className="text-sm text-gray-600">پاسخ کمپین</div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">بینش‌های کلیدی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.personalizedInsights.nextBestActions.slice(0, 4).map((action, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(convertPriorityValue(action.priority))}`}>
                  {action.priority}
                </span>
                <span className="text-sm text-gray-600">{formatPercentage(action.confidence)}</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{action.action}</h4>
              <p className="text-sm text-gray-600">{action.reasoning[0]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBehavioral = () => (
    <div className="space-y-6">
      {/* Visit Patterns */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الگوهای بازدید</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">تکرار بازدید</h4>
            <div className="text-2xl font-bold text-gray-900">{profile.behavioralPreferences.visitPatterns.averageFrequency}</div>
            <div className="text-sm text-gray-600">روز در ماه</div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ترجیح روزهای هفته</h4>
            <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
              {profile.behavioralPreferences.visitPatterns.weekdayVsWeekend}
            </span>
          </div>
        </div>
      </div>

      {/* Seasonal Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">روندهای فصلی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">فصل‌های پرترجیح</h4>
            <div className="space-y-1">
              {profile.behavioralPreferences.seasonalTrends.map((trend, index) => (
                <span key={index} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mr-1">
                  {trend.season}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">اقلام محبوب فصلی</h4>
            <div className="space-y-1">
              {profile.behavioralPreferences.seasonalTrends.map((trend, index) => 
                trend.popularItems.map((item, itemIndex) => (
                  <span key={`${index}-${itemIndex}`} className="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded mr-1">
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dining Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ترجیحات غذایی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ترجیحات محیطی</h4>
            <div className="space-y-1">
              {profile.behavioralPreferences.diningPreferences.ambientPreferences.map((preference, index) => (
                <span key={index} className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-1">
                  {preference}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">محدودیت‌های غذایی</h4>
            <div className="space-y-1">
              {profile.behavioralPreferences.diningPreferences.dietaryRestrictions.map((restriction, index) => (
                <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1">
                  {restriction}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Behavior */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">رفتار وفاداری</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.behavioralPreferences.loyaltyBehavior.pointsUsagePattern}</div>
            <div className="text-sm text-gray-600">نوع استفاده از امتیاز</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{profile.behavioralPreferences.loyaltyBehavior.redemptionFrequency}</div>
            <div className="text-sm text-gray-600">تکرار استفاده</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getTrendIcon(convertTrendValue(profile.behavioralPreferences.loyaltyBehavior.tierProgression))}</div>
            <div className="text-sm text-gray-600">روند پیشرفت</div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">جوایز ترجیحی</h4>
            <div className="space-y-1">
              {profile.behavioralPreferences.loyaltyBehavior.preferredRewards.map((reward, index) => (
                <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-1">
                  {reward}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPurchase = () => (
    <div className="space-y-6">
      {/* Lifetime Value */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ارزش مادام‌العمر</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{formatLifetimeValue(profile.purchaseHistoryAnalysis.lifetimeValue.total)}</div>
            <div className="text-sm text-gray-600">کل خرید</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getTrendColor(convertTrendValue(profile.purchaseHistoryAnalysis.lifetimeValue.trend))}`}>
              {getTrendIcon(convertTrendValue(profile.purchaseHistoryAnalysis.lifetimeValue.trend))}
            </div>
            <div className="text-sm text-gray-600">روند</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatLifetimeValue(profile.purchaseHistoryAnalysis.lifetimeValue.monthlyAverage)}</div>
            <div className="text-sm text-gray-600">میانگین ماهانه</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{profile.purchaseHistoryAnalysis.lifetimeValue.percentileRank}%</div>
            <div className="text-sm text-gray-600">رتبه صدکی</div>
          </div>
        </div>
      </div>

      {/* Spending Patterns */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الگوهای خرید</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">آمار کلی</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">میانگین ارزش سفارش</span>
                <span className="text-sm font-medium">{formatLifetimeValue(profile.purchaseHistoryAnalysis.spendingPatterns.averageOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">میانگین اقلام</span>
                <span className="text-sm font-medium">{profile.purchaseHistoryAnalysis.spendingPatterns.averageItemsPerVisit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">حساسیت تخفیف</span>
                <span className="text-sm font-medium">{formatPercentage(profile.purchaseHistoryAnalysis.spendingPatterns.discountSensitivity)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ترجیحات</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">نقطه قیمت</span>
                <span className="text-sm font-medium">{getPricePointLabel(profile.purchaseHistoryAnalysis.spendingPatterns.pricePointPreference)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">روش پرداخت</span>
                <span className="text-sm font-medium">{profile.purchaseHistoryAnalysis.spendingPatterns.paymentMethodPreference}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">اقلام مورد علاقه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.purchaseHistoryAnalysis.favoriteItems.slice(0, 6).map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                <span className="text-sm text-gray-600">{item.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">تعداد سفارش:</span>
                  <span className="font-medium ml-1">{item.orderCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">کل خرید:</span>
                  <span className="font-medium ml-1">{formatLifetimeValue(item.totalSpent)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">آخرین سفارش:</span>
                  <span className="font-medium ml-1">{formatRelativeTime(item.lastOrdered)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDemographic = () => (
    <div className="space-y-6">
      {/* Basic Demographics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">جمعیت‌شناسی پایه</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">گروه سنی</h4>
            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {getAgeGroupLabel(profile.demographicInsights.ageGroup)}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">مرحله زندگی</h4>
            <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
              {getLifeStageLabel(profile.demographicInsights.lifeStage)}
            </span>
          </div>
        </div>
      </div>

      {/* Social Behavior */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">رفتار اجتماعی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">الگوهای اجتماعی</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">میانگین اعضای گروه</span>
                <span className="text-sm font-medium">{profile.demographicInsights.socialBehavior.averagePartySize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">تنها غذا می‌خورد</span>
                <span className="text-sm font-medium">{profile.demographicInsights.socialBehavior.dinesAlone ? 'بله' : 'خیر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">دوستان می‌آورد</span>
                <span className="text-sm font-medium">{profile.demographicInsights.socialBehavior.bringsFriends ? 'بله' : 'خیر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">خانواده محور</span>
                <span className="text-sm font-medium">{profile.demographicInsights.socialBehavior.familyOriented ? 'بله' : 'خیر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">غذای کاری</span>
                <span className="text-sm font-medium">{profile.demographicInsights.socialBehavior.businessDining ? 'بله' : 'خیر'}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ترجیحات ارتباطی</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">کانال ترجیحی</span>
                <span className="text-sm font-medium">{profile.demographicInsights.communicationPreferences.preferredChannel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">نرخ پاسخ</span>
                <span className="text-sm font-medium">{formatPercentage(profile.demographicInsights.communicationPreferences.responseRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">بهترین زمان تماس</span>
                <span className="text-sm font-medium">{profile.demographicInsights.communicationPreferences.bestContactTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ترجیح زبان</span>
                <span className="text-sm font-medium">{profile.demographicInsights.communicationPreferences.languagePreference}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">بینش‌های موقعیت مکانی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">اطلاعات مکانی</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">موقعیت اصلی</span>
                <span className="text-sm font-medium">{profile.demographicInsights.locationInsights.primaryLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">الگوی سفر</span>
                <span className="text-sm font-medium">{profile.demographicInsights.locationInsights.travelPattern}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">وفاداری مکانی</span>
                <span className="text-sm font-medium">{profile.demographicInsights.locationInsights.locationLoyalty}%</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">رقبای نزدیک</h4>
            <div className="space-y-1">
              {profile.demographicInsights.locationInsights.nearbyCompetitors.map((competitor, index) => (
                <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1">
                  {competitor}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRelationship = () => (
    <div className="space-y-6">
      {/* Relationship Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">معیارهای رابطه</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{profile.relationshipStrength.overallStrength}/100</div>
            <div className="text-sm text-gray-600">قدرت کلی</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatPercentage(profile.relationshipStrength.engagementMetrics.visitFrequency)}</div>
            <div className="text-sm text-gray-600">تکرار بازدید</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatPercentage(profile.relationshipStrength.engagementMetrics.loyaltyParticipation)}</div>
            <div className="text-sm text-gray-600">مشارکت وفاداری</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatPercentage(profile.relationshipStrength.engagementMetrics.referralActivity)}</div>
            <div className="text-sm text-gray-600">فعالیت معرفی</div>
          </div>
        </div>
      </div>

      {/* Relationship Factors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">عوامل رابطه</h3>
        <div className="space-y-4">
          {profile.relationshipStrength.relationshipFactors.map((factor, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{factor.factor}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${getTrendColor(convertTrendValue(factor.trend))}`}>
                    {getTrendIcon(convertTrendValue(factor.trend))}
                  </span>
                  <span className="text-sm font-medium">{factor.score}/100</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getScoreColor(factor.score) === 'text-green-600' ? 'bg-green-500' : 
                    getScoreColor(factor.score) === 'text-yellow-600' ? 'bg-yellow-500' : 
                    getScoreColor(factor.score) === 'text-orange-600' ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نقاط عطف</h3>
        <div className="space-y-3">
          {profile.relationshipStrength.milestones.map((milestone, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-medium text-gray-900">{milestone.achievement}</h4>
                <p className="text-sm text-gray-600">{formatPersianDate(milestone.date)}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">تأثیر: {milestone.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Next Best Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">بهترین اقدامات بعدی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.personalizedInsights.nextBestActions.map((action, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(convertPriorityValue(action.priority))}`}>
                  {action.priority}
                </span>
                <span className="text-sm text-gray-600">{formatPercentage(action.confidence)}</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{action.action}</h4>
              <p className="text-sm text-gray-600 mb-3">{action.reasoning.join(', ')}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">تأثیر مورد انتظار:</span>
                <span className="font-medium">{action.expectedImpact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailored Offers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">پیشنهادات شخصی‌سازی شده</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.personalizedInsights.tailoredOffers.map((offer, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{offer.offer}</h4>
                <span className="text-sm text-green-600 font-medium">{formatPercentage(offer.discount)} تخفیف</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">دسته‌بندی:</span>
                  <span className="font-medium">{offer.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">احتمال پذیرش:</span>
                  <span className="font-medium">{formatPercentage(offer.likelihood)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">معتبر تا:</span>
                  <span className="font-medium">{formatPersianDate(offer.validUntil)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Care Opportunities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">فرصت‌های مراقبت</h3>
        <div className="space-y-3">
          {profile.personalizedInsights.careOpportunities.map((opportunity, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{opportunity.opportunity}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(convertPriorityValue(opportunity.urgency))}`}>
                    {opportunity.urgency}
                  </span>
                  <span className="text-sm text-gray-600">{opportunity.type}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{opportunity.suggestedAction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">عوامل ریسک</h3>
        <div className="space-y-3">
          {profile.personalizedInsights.riskFactors.map((risk, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{risk.factor}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(convertPriorityValue(risk.severity))}`}>
                  {risk.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600">{risk.mitigation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">پروفایل پیشرفته مشتری</h2>
            <p className="text-gray-600">تجزیه و تحلیل کامل رفتار و ترجیحات مشتری</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">آخرین بروزرسانی:</div>
            <div className="text-sm font-medium text-gray-900">{formatRelativeTime(profile.lastUpdated)}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 space-x-reverse">
          {[
            { key: 'overview', label: '🏠 نمای کلی', icon: '🏠' },
            { key: 'behavioral', label: '🎯 رفتاری', icon: '🎯' },
            { key: 'purchase', label: '💰 خرید', icon: '💰' },
            { key: 'demographic', label: '👥 جمعیت‌شناسی', icon: '👥' },
            { key: 'relationship', label: '🤝 رابطه', icon: '🤝' },
            { key: 'insights', label: '💡 بینش‌ها', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'overview' | 'behavioral' | 'purchase' | 'demographic' | 'relationship' | 'insights')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'behavioral' && renderBehavioral()}
        {activeTab === 'purchase' && renderPurchase()}
        {activeTab === 'demographic' && renderDemographic()}
        {activeTab === 'relationship' && renderRelationship()}
        {activeTab === 'insights' && renderInsights()}
      </div>
    </div>
  );
} 