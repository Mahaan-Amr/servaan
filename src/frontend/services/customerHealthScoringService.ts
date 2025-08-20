import { apiClient } from '../lib/apiClient';
import {
  CustomerHealthScore,
  HealthScoreComponents,
  RiskAssessment,
  EngagementAnalysis,
  PredictionModels,
  HealthHistory,
  HealthInsights
} from '../types/crm';

// Get complete customer health score
export const getCustomerHealthScore = async (customerId: string): Promise<CustomerHealthScore> => {
  try {
    return await apiClient.get<CustomerHealthScore>(`/customers/${customerId}/health-score`);
  } catch (error) {
    throw error;
  }
};

// Get health score components breakdown
export const getHealthScoreComponents = async (customerId: string): Promise<HealthScoreComponents> => {
  try {
    return await apiClient.get<HealthScoreComponents>(`/customers/${customerId}/health-score/components`);
  } catch (error) {
    throw error;
  }
};

// Get risk assessment
export const getRiskAssessment = async (customerId: string): Promise<RiskAssessment> => {
  try {
    return await apiClient.get<RiskAssessment>(`/customers/${customerId}/risk-assessment`);
  } catch (error) {
    throw error;
  }
};

// Get engagement analysis
export const getEngagementAnalysis = async (customerId: string): Promise<EngagementAnalysis> => {
  try {
    return await apiClient.get<EngagementAnalysis>(`/customers/${customerId}/engagement-analysis`);
  } catch (error) {
    throw error;
  }
};

// Get prediction models
export const getPredictionModels = async (customerId: string): Promise<PredictionModels> => {
  try {
    return await apiClient.get<PredictionModels>(`/customers/${customerId}/prediction-models`);
  } catch (error) {
    throw error;
  }
};

// Get health history
export const getHealthHistory = async (customerId: string): Promise<HealthHistory[]> => {
  try {
    return await apiClient.get<HealthHistory[]>(`/customers/${customerId}/health-history`);
  } catch (error) {
    throw error;
  }
};

// Get health insights
export const getHealthInsights = async (customerId: string): Promise<HealthInsights> => {
  try {
    return await apiClient.get<HealthInsights>(`/customers/${customerId}/health-insights`);
  } catch (error) {
    throw error;
  }
};

// Get batch health scores for multiple customers
export const getBatchHealthScores = async (customerIds: string[]): Promise<{
  scores: Record<string, CustomerHealthScore>;
  errors: string[];
}> => {
  try {
    return await apiClient.post<{
      scores: Record<string, CustomerHealthScore>;
      errors: string[];
    }>('/customers/batch-health-scores', { customerIds });
  } catch (error) {
    throw error;
  }
};

// Utility functions for data formatting and display
export const getHealthLevelColor = (level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'): string => {
  switch (level) {
    case 'POOR': return 'text-red-600 bg-red-100';
    case 'FAIR': return 'text-yellow-600 bg-yellow-100';
    case 'GOOD': return 'text-green-600 bg-green-100';
    case 'EXCELLENT': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getHealthLevelLabel = (level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'): string => {
  switch (level) {
    case 'POOR': return 'ضعیف';
    case 'FAIR': return 'متوسط';
    case 'GOOD': return 'خوب';
    case 'EXCELLENT': return 'عالی';
    default: return 'نامشخص';
  }
};

export const getRiskLevelColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string => {
  switch (level) {
    case 'LOW': return 'text-green-600 bg-green-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'HIGH': return 'text-orange-600 bg-orange-100';
    case 'CRITICAL': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getRiskLevelLabel = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string => {
  switch (level) {
    case 'LOW': return 'کم';
    case 'MEDIUM': return 'متوسط';
    case 'HIGH': return 'بالا';
    case 'CRITICAL': return 'بحرانی';
    default: return 'نامشخص';
  }
};

export const getEngagementLevelColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEPTIONAL'): string => {
  switch (level) {
    case 'LOW': return 'text-red-600 bg-red-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'HIGH': return 'text-green-600 bg-green-100';
    case 'EXCEPTIONAL': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getEngagementLevelLabel = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEPTIONAL'): string => {
  switch (level) {
    case 'LOW': return 'کم';
    case 'MEDIUM': return 'متوسط';
    case 'HIGH': return 'بالا';
    case 'EXCEPTIONAL': return 'استثنایی';
    default: return 'نامشخص';
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

export const getSeverityColor = (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string => {
  switch (severity) {
    case 'LOW': return 'text-green-600 bg-green-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'HIGH': return 'text-orange-600 bg-orange-100';
    case 'CRITICAL': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getImpactColor = (impact: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
  switch (impact) {
    case 'LOW': return 'text-gray-600 bg-gray-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'HIGH': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getEffortColor = (effort: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
  switch (effort) {
    case 'LOW': return 'text-green-600 bg-green-100';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
    case 'HIGH': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
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

export const getAlertTypeIcon = (type: 'IMPROVEMENT' | 'DECLINE' | 'MILESTONE' | 'RISK'): string => {
  switch (type) {
    case 'IMPROVEMENT': return '📈';
    case 'DECLINE': return '📉';
    case 'MILESTONE': return '🎯';
    case 'RISK': return '⚠️';
    default: return '📊';
  }
};

export const formatHealthScore = (score: number): string => {
  return `${score.toFixed(1)}/100`;
};

export const formatConfidence = (confidence: number): string => {
  return `${confidence.toFixed(0)}%`;
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('fa-IR') + ' تومان';
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
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

export const getProgressBarColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

export const calculateWeightedScore = (components: HealthScoreComponents): number => {
  const totalWeight = Object.values(components).reduce((sum, component) => sum + component.weight, 0);
  const weightedSum = Object.values(components).reduce((sum, component) => sum + (component.score * component.weight), 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

export const getComponentLabel = (componentKey: string): string => {
  const labels: Record<string, string> = {
    visitFrequency: 'تکرار بازدید',
    spendingBehavior: 'رفتار خرید',
    loyaltyEngagement: 'مشارکت وفاداری',
    feedbackSentiment: 'احساسات بازخورد',
    communicationResponse: 'پاسخ ارتباطات',
    recencyFactor: 'عامل تازگی'
  };
  return labels[componentKey] || componentKey;
};

export const getComponentIcon = (componentKey: string): string => {
  const icons: Record<string, string> = {
    visitFrequency: '🔄',
    spendingBehavior: '💰',
    loyaltyEngagement: '🎯',
    feedbackSentiment: '💬',
    communicationResponse: '📞',
    recencyFactor: '⏰'
  };
  return icons[componentKey] || '📊';
}; 