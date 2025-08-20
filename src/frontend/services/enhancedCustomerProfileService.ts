import { apiClient } from '../lib/apiClient';
import {
  EnhancedCustomerProfile,
  BehavioralPreferences,
  PurchaseHistoryAnalysis,
  DemographicInsights,
  RelationshipStrength,
  PersonalizedInsights,
  ProfileCompleteness
} from '../types/crm';

// Get complete enhanced customer profile
export const getEnhancedCustomerProfile = async (customerId: string): Promise<EnhancedCustomerProfile> => {
  try {
    return await apiClient.get<EnhancedCustomerProfile>(`/customers/${customerId}/enhanced-profile`);
  } catch (error) {
    throw error;
  }
};

// Get behavioral preferences
export const getBehavioralPreferences = async (customerId: string): Promise<BehavioralPreferences> => {
  try {
    return await apiClient.get<BehavioralPreferences>(`/customers/${customerId}/behavioral-preferences`);
  } catch (error) {
    throw error;
  }
};

// Get purchase history analysis
export const getPurchaseHistoryAnalysis = async (customerId: string): Promise<PurchaseHistoryAnalysis> => {
  try {
    return await apiClient.get<PurchaseHistoryAnalysis>(`/customers/${customerId}/purchase-history-analysis`);
  } catch (error) {
    throw error;
  }
};

// Get demographic insights
export const getDemographicInsights = async (customerId: string): Promise<DemographicInsights> => {
  try {
    return await apiClient.get<DemographicInsights>(`/customers/${customerId}/demographic-insights`);
  } catch (error) {
    throw error;
  }
};

// Get relationship strength analysis
export const getRelationshipStrength = async (customerId: string): Promise<RelationshipStrength> => {
  try {
    return await apiClient.get<RelationshipStrength>(`/customers/${customerId}/relationship-strength`);
  } catch (error) {
    throw error;
  }
};

// Get personalized insights
export const getPersonalizedInsights = async (customerId: string): Promise<PersonalizedInsights> => {
  try {
    return await apiClient.get<PersonalizedInsights>(`/customers/${customerId}/personalized-insights`);
  } catch (error) {
    throw error;
  }
};

// Get profile completeness score
export const getProfileCompleteness = async (customerId: string): Promise<ProfileCompleteness> => {
  try {
    return await apiClient.get<ProfileCompleteness>(`/customers/${customerId}/profile-completeness`);
  } catch (error) {
    throw error;
  }
};

// Get batch enhanced profiles for multiple customers
export const getBatchEnhancedProfiles = async (customerIds: string[]): Promise<{
  profiles: Record<string, EnhancedCustomerProfile>;
  errors: string[];
}> => {
  try {
    return await apiClient.post<{
      profiles: Record<string, EnhancedCustomerProfile>;
      errors: string[];
    }>('/customers/batch-enhanced-profiles', { customerIds });
  } catch (error) {
    throw error;
  }
};

// Utility functions for data formatting and display
export const formatLifetimeValue = (value: number): string => {
  return value.toLocaleString('fa-IR') + ' تومان';
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getStrengthLevelColor = (level: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG'): string => {
  switch (level) {
    case 'WEAK': return 'text-red-600 bg-red-100';
    case 'MODERATE': return 'text-yellow-600 bg-yellow-100';
    case 'STRONG': return 'text-green-600 bg-green-100';
    case 'VERY_STRONG': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getCompleteLevelColor = (level: 'BASIC' | 'GOOD' | 'EXCELLENT' | 'COMPLETE'): string => {
  switch (level) {
    case 'BASIC': return 'text-red-600 bg-red-100';
    case 'GOOD': return 'text-yellow-600 bg-yellow-100';
    case 'EXCELLENT': return 'text-green-600 bg-green-100';
    case 'COMPLETE': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getTrendColor = (trend: 'IMPROVING' | 'STABLE' | 'DECLINING'): string => {
  switch (trend) {
    case 'IMPROVING': return 'text-green-600';
    case 'STABLE': return 'text-blue-600';
    case 'DECLINING': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getTrendIcon = (trend: 'IMPROVING' | 'STABLE' | 'DECLINING'): string => {
  switch (trend) {
    case 'IMPROVING': return '📈';
    case 'STABLE': return '📊';
    case 'DECLINING': return '📉';
    default: return '➖';
  }
};

export const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  switch (priority) {
    case 'HIGH': return 'text-red-600 bg-red-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'LOW': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getAgeGroupLabel = (ageGroup: 'UNDER_25' | '25_35' | '35_45' | '45_55' | '55_65' | 'OVER_65'): string => {
  switch (ageGroup) {
    case 'UNDER_25': return 'زیر ۲۵ سال';
    case '25_35': return '۲۵ تا ۳۵ سال';
    case '35_45': return '۳۵ تا ۴۵ سال';
    case '45_55': return '۴۵ تا ۵۵ سال';
    case '55_65': return '۵۵ تا ۶۵ سال';
    case 'OVER_65': return 'بالای ۶۵ سال';
    default: return 'نامشخص';
  }
};

export const getLifeStageLabel = (lifeStage: 'STUDENT' | 'YOUNG_PROFESSIONAL' | 'FAMILY' | 'EMPTY_NESTER' | 'RETIREE'): string => {
  switch (lifeStage) {
    case 'STUDENT': return 'دانشجو';
    case 'YOUNG_PROFESSIONAL': return 'متخصص جوان';
    case 'FAMILY': return 'خانواده';
    case 'EMPTY_NESTER': return 'والدین خالی';
    case 'RETIREE': return 'بازنشسته';
    default: return 'نامشخص';
  }
};

export const getPricePointLabel = (pricePoint: 'BUDGET' | 'STANDARD' | 'PREMIUM' | 'LUXURY'): string => {
  switch (pricePoint) {
    case 'BUDGET': return 'اقتصادی';
    case 'STANDARD': return 'استاندارد';
    case 'PREMIUM': return 'پریمیوم';
    case 'LUXURY': return 'لوکس';
    default: return 'نامشخص';
  }
};

export const getUsagePatternLabel = (pattern: 'SAVER' | 'SPENDER' | 'STRATEGIC'): string => {
  switch (pattern) {
    case 'SAVER': return 'پس‌انداز کننده';
    case 'SPENDER': return 'خرج کننده';
    case 'STRATEGIC': return 'استراتژیک';
    default: return 'نامشخص';
  }
};

export const getWeekdayPreferenceLabel = (preference: 'WEEKDAY' | 'WEEKEND' | 'BALANCED'): string => {
  switch (preference) {
    case 'WEEKDAY': return 'روزهای هفته';
    case 'WEEKEND': return 'آخر هفته';
    case 'BALANCED': return 'متعادل';
    default: return 'نامشخص';
  }
};

export const formatPersianDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR');
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'دیروز';
  if (diffDays <= 7) return `${diffDays} روز پیش`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} هفته پیش`;
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)} ماه پیش`;
  return `${Math.floor(diffDays / 365)} سال پیش`;
};

export const calculatePercentileRank = (score: number, benchmark: number): number => {
  if (benchmark === 0) return 0;
  return Math.round((score / benchmark) * 100);
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}; 