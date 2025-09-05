import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { generateCustomerInsights } from './customerInsightsService';
import { getCustomerCommunicationHistory } from './communicationTrackingService';
import { generateEnhancedCustomerProfile } from './enhancedCustomerProfileService';

const prisma = new PrismaClient();

// In-memory cache for health scores (in production, you'd use Redis or a dedicated table)
const healthScoreCache = new Map<string, { score: CustomerHealthScore; timestamp: number }>();

export interface CustomerHealthScore {
  customerId: string;
  overallHealthScore: number; // 0-100 (higher is healthier)
  healthLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  healthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  
  scoringComponents: {
    engagementScore: number; // 0-100
    loyaltyScore: number; // 0-100
    behavioralScore: number; // 0-100
    communicationScore: number; // 0-100
    satisfactionScore: number; // 0-100
    profitabilityScore: number; // 0-100
  };
  
  riskAssessment: {
    churnRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    churnProbability: number; // 0-100
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  
  engagementAnalysis: {
    level: 'HIGHLY_ENGAGED' | 'MODERATELY_ENGAGED' | 'LIGHTLY_ENGAGED' | 'DISENGAGED';
    communicationResponseRate: number;
    visitFrequency: number;
    loyaltyParticipation: number;
    feedbackEngagement: number;
    campaignEngagement: number;
    socialInfluence: number;
  };
  
  predictionModels: {
    nextVisitPrediction: {
      probability: number;
      expectedDate: Date | null;
      confidence: number;
    };
    spendingPrediction: {
      nextMonthSpending: number;
      spendingTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
      confidence: number;
    };
    lifetimeValuePrediction: {
      predictedLTV: number;
      growthPotential: number;
      timeframe: number; // months
    };
  };
  
  healthHistory: {
    currentScore: number;
    previousScore: number;
    changePercentage: number;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
    significantChanges: Array<{
      date: Date;
      oldScore: number;
      newScore: number;
      changeReason: string;
    }>;
  };
  
  automatedInsights: {
    criticalAlerts: string[];
    opportunities: string[];
    recommendations: string[];
    nextBestActions: string[];
  };
  
  benchmarkComparison: {
    segmentAverage: number;
    industryPercentile: number;
    ranking: 'TOP_10' | 'TOP_25' | 'AVERAGE' | 'BELOW_AVERAGE' | 'BOTTOM_10';
  };
  
  lastUpdated: Date;
  nextUpdateDue: Date;
  updateFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface HealthScoringMetrics {
  totalCustomers: number;
  averageHealthScore: number;
  healthDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
  churnRiskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  engagementDistribution: {
    highly_engaged: number;
    moderately_engaged: number;
    lightly_engaged: number;
    disengaged: number;
  };
  trendsAnalysis: {
    improvingCustomers: number;
    stableCustomers: number;
    decliningCustomers: number;
  };
}

/**
 * Generate comprehensive customer health score
 */
export async function generateCustomerHealthScore(customerId: string): Promise<CustomerHealthScore> {
  try {
    // Get comprehensive customer data
    const [customer, insights, profile, communicationData] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          loyalty: true,
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 100
          },
          feedback: {
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          campaignDeliveries: {
            orderBy: { queuedAt: 'desc' },
            take: 30
          },
          loyaltyTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      }),
      generateCustomerInsights(customerId),
      generateEnhancedCustomerProfile(customerId),
      getCustomerCommunicationHistory(customerId, 50)
    ]);

    if (!customer) {
      throw new AppError('مشتری یافت نشد', 404);
    }

    // Calculate scoring components
    const scoringComponents = calculateScoringComponents(customer, insights, profile, communicationData);
    
    // Calculate overall health score
    const overallHealthScore = calculateOverallHealthScore(scoringComponents);
    
    // Determine health level
    const healthLevel = determineHealthLevel(overallHealthScore);
    
    // Calculate health trend
    const healthTrend = calculateHealthTrend(customerId, overallHealthScore);
    
    // Assess risk
    const riskAssessment = assessCustomerRisk(customer, insights, profile, overallHealthScore);
    
    // Analyze engagement
    const engagementAnalysis = analyzeCustomerEngagement(customer, insights, communicationData);
    
    // Generate predictions
    const predictionModels = generatePredictionModels(customer, insights, profile);
    
    // Get health history
    const healthHistory = getHealthHistory(customerId, overallHealthScore);
    
    // Generate automated insights
    const automatedInsights = generateAutomatedInsights(customer, insights, profile, overallHealthScore);
    
    // Calculate benchmark comparison
    const benchmarkComparison = calculateBenchmarkComparison(customer, overallHealthScore);
    
    // Determine update frequency
    const updateFrequency = determineUpdateFrequency(overallHealthScore, healthLevel);
    
    const healthScore: CustomerHealthScore = {
      customerId,
      overallHealthScore,
      healthLevel,
      healthTrend,
      scoringComponents,
      riskAssessment,
      engagementAnalysis,
      predictionModels,
      healthHistory,
      automatedInsights,
      benchmarkComparison,
      lastUpdated: new Date(),
      nextUpdateDue: calculateNextUpdateDue(updateFrequency),
      updateFrequency
    };

    // Store health score for tracking
    storeHealthScore(healthScore);
    
    return healthScore;

  } catch (error) {
    console.error('Error generating customer health score:', error);
    throw new AppError('خطا در محاسبه امتیاز سلامت مشتری', 500);
  }
}

/**
 * Calculate individual scoring components
 */
function calculateScoringComponents(
  customer: any, 
  insights: any, 
  profile: any, 
  communicationData: any
): CustomerHealthScore['scoringComponents'] {
  
  // Engagement Score (0-100)
  const engagementScore = calculateEngagementScore(customer, insights, communicationData);
  
  // Loyalty Score (0-100)  
  const loyaltyScore = calculateLoyaltyScore(customer, insights);
  
  // Behavioral Score (0-100)
  const behavioralScore = calculateBehavioralScore(customer, insights, profile);
  
  // Communication Score (0-100)
  const communicationScore = calculateCommunicationScore(communicationData);
  
  // Satisfaction Score (0-100)
  const satisfactionScore = insights.satisfactionScore || 0;
  
  // Profitability Score (0-100)
  const profitabilityScore = calculateProfitabilityScore(customer, insights);

  return {
    engagementScore,
    loyaltyScore,
    behavioralScore,
    communicationScore,
    satisfactionScore,
    profitabilityScore
  };
}

/**
 * Calculate overall health score from components
 */
function calculateOverallHealthScore(components: CustomerHealthScore['scoringComponents']): number {
  // Weighted scoring based on importance
  const weights = {
    engagementScore: 0.25,      // 25% - Most important
    loyaltyScore: 0.20,         // 20% - Very important
    behavioralScore: 0.15,      // 15% - Important
    communicationScore: 0.15,   // 15% - Important
    satisfactionScore: 0.15,    // 15% - Important
    profitabilityScore: 0.10    // 10% - Good to have
  };
  
  const weightedScore = 
    components.engagementScore * weights.engagementScore +
    components.loyaltyScore * weights.loyaltyScore +
    components.behavioralScore * weights.behavioralScore +
    components.communicationScore * weights.communicationScore +
    components.satisfactionScore * weights.satisfactionScore +
    components.profitabilityScore * weights.profitabilityScore;
  
  return Math.round(weightedScore);
}

/**
 * Determine health level based on score
 */
function determineHealthLevel(score: number): CustomerHealthScore['healthLevel'] {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'FAIR';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
}

/**
 * Calculate health trend compared to previous scores
 */
function calculateHealthTrend(customerId: string, currentScore: number): CustomerHealthScore['healthTrend'] {
  try {
    // Get previous health score from cache
    const cachedScore = healthScoreCache.get(customerId);
    
    if (!cachedScore) {
      return 'STABLE';
    }
    
    const previousScore = cachedScore.score.overallHealthScore;
    const scoreDifference = currentScore - previousScore;
    
    if (scoreDifference > 5) return 'IMPROVING';
    if (scoreDifference < -5) return 'DECLINING';
    return 'STABLE';
    
  } catch (error) {
    console.error('Error calculating health trend:', error);
    return 'STABLE';
  }
}

/**
 * Assess customer risk levels
 */
function assessCustomerRisk(
  customer: any, 
  insights: any, 
  profile: any, 
  healthScore: number
): CustomerHealthScore['riskAssessment'] {
  let churnProbability = insights.churnProbability || 0;
  const riskFactors: string[] = [];
  const mitigationStrategies: string[] = [];
  
  // Adjust churn probability based on health score
  if (healthScore < 40) {
    churnProbability = Math.max(churnProbability, 70);
    riskFactors.push('امتیاز سلامت پایین');
  }
  
  // Check for specific risk factors
  const daysSinceLastVisit = customer.loyalty?.lastVisitDate 
    ? Math.floor((Date.now() - new Date(customer.loyalty.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceLastVisit > 60) {
    riskFactors.push('عدم بازدید طولانی مدت');
    mitigationStrategies.push('تماس و دعوت به بازدید');
  }
  
  if (insights.spendingTrend === 'DECREASING') {
    riskFactors.push('کاهش میزان خرید');
    mitigationStrategies.push('ارائه تخفیف ویژه');
  }
  
  if (insights.satisfactionScore < 50) {
    riskFactors.push('رضایت پایین');
    mitigationStrategies.push('بررسی و رفع مشکلات');
  }
  
  // Determine risk level
  let churnRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (churnProbability > 80) churnRisk = 'CRITICAL';
  else if (churnProbability > 60) churnRisk = 'HIGH';
  else if (churnProbability > 30) churnRisk = 'MEDIUM';
  
  return {
    churnRisk,
    churnProbability,
    riskFactors,
    mitigationStrategies
  };
}

/**
 * Analyze customer engagement levels
 */
function analyzeCustomerEngagement(
  customer: any, 
  insights: any, 
  communicationData: any
): CustomerHealthScore['engagementAnalysis'] {
  const communicationResponseRate = communicationData.summary?.responseRate || 0;
  const visitFrequency = insights.visitFrequencyScore || 0;
  const loyaltyParticipation = customer.loyalty?.currentPoints > 0 ? 80 : 20;
  const feedbackEngagement = customer.feedback?.length > 0 ? 70 : 30;
  const campaignEngagement = insights.engagement?.campaignResponseRate || 0;
  const socialInfluence = insights.referralPotential?.score || 0;
  
  // Calculate overall engagement level
  const overallEngagement = (
    communicationResponseRate * 0.2 +
    visitFrequency * 0.25 +
    loyaltyParticipation * 0.15 +
    feedbackEngagement * 0.15 +
    campaignEngagement * 0.15 +
    socialInfluence * 0.1
  );
  
  let level: 'HIGHLY_ENGAGED' | 'MODERATELY_ENGAGED' | 'LIGHTLY_ENGAGED' | 'DISENGAGED' = 'DISENGAGED';
  if (overallEngagement >= 80) level = 'HIGHLY_ENGAGED';
  else if (overallEngagement >= 60) level = 'MODERATELY_ENGAGED';
  else if (overallEngagement >= 40) level = 'LIGHTLY_ENGAGED';
  
  return {
    level,
    communicationResponseRate,
    visitFrequency,
    loyaltyParticipation,
    feedbackEngagement,
    campaignEngagement,
    socialInfluence
  };
}

/**
 * Generate prediction models
 */
function generatePredictionModels(
  customer: any, 
  insights: any, 
  profile: any
): CustomerHealthScore['predictionModels'] {
  // Next visit prediction
  const nextVisitPrediction = {
    probability: Math.max(0, 100 - (insights.churnProbability || 0)),
    expectedDate: insights.nextVisitPrediction ? new Date(insights.nextVisitPrediction) : null,
    confidence: insights.visitFrequencyScore || 50
  };
  
  // Spending prediction
  const currentMonthSpending = Number(customer.loyalty?.currentMonthSpent || 0);
  const nextMonthSpending = currentMonthSpending * (insights.spendingTrend === 'INCREASING' ? 1.1 : 
                                                   insights.spendingTrend === 'DECREASING' ? 0.9 : 1.0);
  
  const spendingPrediction = {
    nextMonthSpending,
    spendingTrend: insights.spendingTrend || 'STABLE',
    confidence: 70
  };
  
  // Lifetime value prediction
  const lifetimeValuePrediction = {
    predictedLTV: insights.lifetimeValuePrediction || 0,
    growthPotential: insights.predictive?.lifetimeValueGrowth || 0,
    timeframe: 24 // 24 months
  };
  
  return {
    nextVisitPrediction,
    spendingPrediction,
    lifetimeValuePrediction
  };
}

/**
 * Get health history for trend analysis
 */
function getHealthHistory(customerId: string, currentScore: number): CustomerHealthScore['healthHistory'] {
  try {
    // Get previous health score from cache
    const cachedScore = healthScoreCache.get(customerId);
    const previousScore = cachedScore?.score.overallHealthScore || currentScore;
    const changePercentage = previousScore !== 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;
    
    let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (changePercentage > 2) trendDirection = 'UP';
    else if (changePercentage < -2) trendDirection = 'DOWN';
    
    // Simplified significant changes tracking
    const significantChanges: Array<{
      date: Date;
      oldScore: number;
      newScore: number;
      changeReason: string;
    }> = [];
    
    if (Math.abs(currentScore - previousScore) > 10) {
      significantChanges.push({
        date: new Date(),
        oldScore: previousScore,
        newScore: currentScore,
        changeReason: Math.abs(currentScore - previousScore) > 20 ? 'تغییر عمده در رفتار' : 'تغییر متوسط در رفتار'
      });
    }
    
    return {
      currentScore,
      previousScore,
      changePercentage,
      trendDirection,
      significantChanges
    };
    
  } catch (error) {
    console.error('Error getting health history:', error);
    return {
      currentScore,
      previousScore: currentScore,
      changePercentage: 0,
      trendDirection: 'STABLE',
      significantChanges: []
    };
  }
}

/**
 * Generate automated insights and recommendations
 */
function generateAutomatedInsights(
  customer: any, 
  insights: any, 
  profile: any, 
  healthScore: number
): CustomerHealthScore['automatedInsights'] {
  const criticalAlerts: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];
  const nextBestActions: string[] = [];
  
  // Critical alerts
  if (healthScore < 40) {
    criticalAlerts.push('امتیاز سلامت مشتری در سطح بحرانی');
  }
  
  if (insights.churnProbability > 70) {
    criticalAlerts.push('احتمال بالای ترک مشتری');
  }
  
  // Opportunities
  if (insights.spendingTrend === 'INCREASING') {
    opportunities.push('افزایش میزان خرید - فرصت ارائه محصولات پریمیوم');
  }
  
  if (insights.loyaltyEngagement === 'HIGH') {
    opportunities.push('تعامل بالا با برنامه وفاداری - فرصت ارتقاء');
  }
  
  // Recommendations
  if (healthScore < 60) {
    recommendations.push('بهبود تجربه مشتری');
    recommendations.push('پیگیری نظرسنجی رضایت');
  }
  
  if (insights.satisfactionScore < 70) {
    recommendations.push('بررسی و رفع نقاط ضعف خدمات');
  }
  
  // Next best actions
  const daysSinceLastVisit = customer.loyalty?.lastVisitDate 
    ? Math.floor((Date.now() - new Date(customer.loyalty.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceLastVisit > 30) {
    nextBestActions.push('تماس و دعوت به بازدید');
  }
  
  if (customer.loyalty?.currentPoints > 500) {
    nextBestActions.push('یادآوری استفاده از امتیازات');
  }
  
  return {
    criticalAlerts,
    opportunities,
    recommendations,
    nextBestActions
  };
}

/**
 * Calculate benchmark comparison
 */
function calculateBenchmarkComparison(
  customer: any, 
  healthScore: number
): CustomerHealthScore['benchmarkComparison'] {
  try {
    // Simplified benchmark calculation
    const segmentAverage = 70; // Would calculate from actual data in production
    
    // Calculate industry percentile (simplified)
    const industryPercentile = Math.round((healthScore / 100) * 100);
    
    // Determine ranking
    let ranking: 'TOP_10' | 'TOP_25' | 'AVERAGE' | 'BELOW_AVERAGE' | 'BOTTOM_10' = 'AVERAGE';
    if (industryPercentile >= 90) ranking = 'TOP_10';
    else if (industryPercentile >= 75) ranking = 'TOP_25';
    else if (industryPercentile >= 40) ranking = 'AVERAGE';
    else if (industryPercentile >= 25) ranking = 'BELOW_AVERAGE';
    else ranking = 'BOTTOM_10';
    
    return {
      segmentAverage,
      industryPercentile,
      ranking
    };
    
  } catch (error) {
    console.error('Error calculating benchmark comparison:', error);
    return {
      segmentAverage: 70,
      industryPercentile: 50,
      ranking: 'AVERAGE'
    };
  }
}

// Helper calculation functions
function calculateEngagementScore(customer: any, insights: any, communicationData: any): number {
  let score = 0;
  
  // Visit frequency (0-30 points)
  const visitCount = customer.visits?.length || 0;
  if (visitCount > 50) score += 30;
  else if (visitCount > 20) score += 25;
  else if (visitCount > 10) score += 20;
  else if (visitCount > 5) score += 15;
  else score += 10;
  
  // Communication response rate (0-25 points)
  const responseRate = communicationData.summary?.responseRate || 0;
  score += Math.round(responseRate * 0.25);
  
  // Loyalty participation (0-20 points)
  const loyaltyEngagement = insights.loyaltyEngagement;
  if (loyaltyEngagement === 'HIGH') score += 20;
  else if (loyaltyEngagement === 'MEDIUM') score += 15;
  else score += 10;
  
  // Feedback participation (0-15 points)
  const feedbackCount = customer.feedback?.length || 0;
  score += Math.min(feedbackCount * 3, 15);
  
  // Campaign engagement (0-10 points)
  const campaignEngagement = insights.engagement?.campaignResponseRate || 0;
  score += Math.round(campaignEngagement * 0.1);
  
  return Math.min(score, 100);
}

function calculateLoyaltyScore(customer: any, insights: any): number {
  let score = 0;
  
  // Tier level (0-25 points)
  const tierLevel = customer.loyalty?.tierLevel;
  if (tierLevel === 'PLATINUM') score += 25;
  else if (tierLevel === 'GOLD') score += 20;
  else if (tierLevel === 'SILVER') score += 15;
  else score += 10;
  
  // Current points (0-20 points)
  const currentPoints = customer.loyalty?.currentPoints || 0;
  if (currentPoints > 2000) score += 20;
  else if (currentPoints > 1000) score += 15;
  else if (currentPoints > 500) score += 10;
  else score += 5;
  
  // Spending consistency (0-25 points)
  const spendingTrend = insights.spendingTrend;
  if (spendingTrend === 'INCREASING') score += 25;
  else if (spendingTrend === 'STABLE') score += 20;
  else score += 10;
  
  // Visit regularity (0-20 points)
  const visitFrequency = insights.visitFrequencyScore || 0;
  score += Math.round(visitFrequency * 0.2);
  
  // Loyalty program engagement (0-10 points)
  const loyaltyTransactions = customer.loyaltyTransactions?.length || 0;
  score += Math.min(loyaltyTransactions, 10);
  
  return Math.min(score, 100);
}

function calculateBehavioralScore(customer: any, insights: any, profile: any): number {
  let score = 0;
  
  // Visit pattern consistency (0-30 points)
  const preferredDays = profile.behavioralPreferences?.preferredVisitDays?.length || 0;
  score += Math.min(preferredDays * 10, 30);
  
  // Seasonal engagement (0-20 points)
  const seasonalActivity = profile.behavioralPreferences?.seasonalPatterns?.mostActiveMonth !== 'نامشخص' ? 20 : 10;
  score += seasonalActivity;
  
  // Price segment behavior (0-25 points)
  const priceSegment = profile.purchaseHistoryAnalysis?.priceSegment;
  if (priceSegment === 'PREMIUM') score += 25;
  else if (priceSegment === 'MODERATE') score += 20;
  else score += 15;
  
  // Dining preferences (0-15 points)
  const avgOrderSize = profile.behavioralPreferences?.diningPreferences?.averageOrderSize || 0;
  if (avgOrderSize > 200000) score += 15;
  else if (avgOrderSize > 100000) score += 10;
  else score += 5;
  
  // Service preferences (0-10 points)
  const servicePreferences = profile.behavioralPreferences?.diningPreferences?.servicePreferences?.length || 0;
  score += Math.min(servicePreferences * 5, 10);
  
  return Math.min(score, 100);
}

function calculateCommunicationScore(communicationData: any): number {
  const summary = communicationData.summary;
  if (!summary) return 50;
  
  let score = 0;
  
  // Response rate (0-40 points)
  score += Math.round(summary.responseRate * 0.4);
  
  // Engagement score (0-30 points)
  score += Math.round(summary.engagementScore * 0.3);
  
  // Communication frequency (0-20 points)
  const frequency = summary.communicationFrequency || 0;
  if (frequency > 4) score += 20;
  else if (frequency > 2) score += 15;
  else if (frequency > 0) score += 10;
  else score += 5;
  
  // Preferred channel usage (0-10 points)
  const preferredChannel = summary.preferredChannel;
  if (preferredChannel && preferredChannel !== 'UNKNOWN') score += 10;
  else score += 5;
  
  return Math.min(score, 100);
}

function calculateProfitabilityScore(customer: any, insights: any): number {
  let score = 0;
  
  // Lifetime value (0-40 points)
  const lifetimeValue = Number(customer.loyalty?.lifetimeSpent || 0);
  if (lifetimeValue > 10000000) score += 40;
  else if (lifetimeValue > 5000000) score += 30;
  else if (lifetimeValue > 2000000) score += 20;
  else if (lifetimeValue > 500000) score += 10;
  else score += 5;
  
  // Average order value (0-25 points)
  const avgOrderValue = insights.averageOrderValue || 0;
  if (avgOrderValue > 300000) score += 25;
  else if (avgOrderValue > 150000) score += 20;
  else if (avgOrderValue > 75000) score += 15;
  else score += 10;
  
  // Visit frequency impact (0-20 points)
  const visitCount = customer.visits?.length || 0;
  if (visitCount > 50) score += 20;
  else if (visitCount > 20) score += 15;
  else if (visitCount > 10) score += 10;
  else score += 5;
  
  // Growth potential (0-15 points)
  const spendingTrend = insights.spendingTrend;
  if (spendingTrend === 'INCREASING') score += 15;
  else if (spendingTrend === 'STABLE') score += 10;
  else score += 5;
  
  return Math.min(score, 100);
}

function determineUpdateFrequency(healthScore: number, healthLevel: string): 'DAILY' | 'WEEKLY' | 'MONTHLY' {
  if (healthLevel === 'CRITICAL' || healthScore < 40) return 'DAILY';
  if (healthLevel === 'POOR' || healthScore < 60) return 'WEEKLY';
  return 'MONTHLY';
}

function calculateNextUpdateDue(frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Date {
  const now = new Date();
  switch (frequency) {
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTHLY':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Store health score for historical tracking
 */
function storeHealthScore(healthScore: CustomerHealthScore): void {
  try {
    // Store in memory cache with timestamp
    healthScoreCache.set(healthScore.customerId, {
      score: healthScore,
      timestamp: Date.now()
    });
    
    // Clean old entries (keep only last 1000 entries)
    if (healthScoreCache.size > 1000) {
      const entries = Array.from(healthScoreCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      // Keep only the 1000 most recent entries
      healthScoreCache.clear();
      entries.slice(0, 1000).forEach(([key, value]) => {
        healthScoreCache.set(key, value);
      });
    }
  } catch (error) {
    console.error('Error storing health score:', error);
    // Don't throw - this is for tracking purposes
  }
}

/**
 * Get health scoring metrics for all customers
 */
export async function getHealthScoringMetrics(): Promise<HealthScoringMetrics> {
  try {
    const recentScores = Array.from(healthScoreCache.values())
      .filter(entry => Date.now() - entry.timestamp < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .map(entry => entry.score);
    
    const totalCustomers = recentScores.length;
    const averageHealthScore = totalCustomers > 0 
      ? recentScores.reduce((sum: number, score: CustomerHealthScore) => sum + score.overallHealthScore, 0) / totalCustomers 
      : 0;
    
    // Calculate distributions
    const healthDistribution = {
      excellent: recentScores.filter(s => s.healthLevel === 'EXCELLENT').length,
      good: recentScores.filter(s => s.healthLevel === 'GOOD').length,
      fair: recentScores.filter(s => s.healthLevel === 'FAIR').length,
      poor: recentScores.filter(s => s.healthLevel === 'POOR').length,
      critical: recentScores.filter(s => s.healthLevel === 'CRITICAL').length
    };
    
    const churnRiskDistribution = {
      low: recentScores.filter(s => s.riskAssessment.churnProbability < 30).length,
      medium: recentScores.filter(s => s.riskAssessment.churnProbability >= 30 && s.riskAssessment.churnProbability < 60).length,
      high: recentScores.filter(s => s.riskAssessment.churnProbability >= 60 && s.riskAssessment.churnProbability < 80).length,
      critical: recentScores.filter(s => s.riskAssessment.churnProbability >= 80).length
    };
    
    const engagementDistribution = {
      highly_engaged: recentScores.filter(s => s.engagementAnalysis.level === 'HIGHLY_ENGAGED').length,
      moderately_engaged: recentScores.filter(s => s.engagementAnalysis.level === 'MODERATELY_ENGAGED').length,
      lightly_engaged: recentScores.filter(s => s.engagementAnalysis.level === 'LIGHTLY_ENGAGED').length,
      disengaged: recentScores.filter(s => s.engagementAnalysis.level === 'DISENGAGED').length
    };
    
    const trendsAnalysis = {
      improvingCustomers: recentScores.filter(s => s.healthTrend === 'IMPROVING').length,
      stableCustomers: recentScores.filter(s => s.healthTrend === 'STABLE').length,
      decliningCustomers: recentScores.filter(s => s.healthTrend === 'DECLINING').length
    };
    
    return {
      totalCustomers,
      averageHealthScore,
      healthDistribution,
      churnRiskDistribution,
      engagementDistribution,
      trendsAnalysis
    };
    
  } catch (error) {
    console.error('Error getting health scoring metrics:', error);
    throw new AppError('خطا در دریافت آمار امتیاز سلامت', 500);
  }
}

/**
 * Get batch health scores for multiple customers
 */
export async function getBatchHealthScores(customerIds: string[]): Promise<CustomerHealthScore[]> {
  const healthScores = await Promise.all(
    customerIds.map(id => generateCustomerHealthScore(id))
  );
  
  return healthScores;
}

/**
 * Get customers needing health score updates
 */
export function getCustomersNeedingHealthUpdates(): string[] {
  try {
    const now = Date.now();
    const overdueCustomers: string[] = [];
    
    healthScoreCache.forEach((entry, customerId) => {
      const updateDue = entry.score.nextUpdateDue.getTime();
      if (updateDue <= now) {
        overdueCustomers.push(customerId);
      }
    });
    
    return overdueCustomers;
    
  } catch (error) {
    console.error('Error getting customers needing updates:', error);
    return [];
  }
}

/**
 * Get health score alerts for critical customers
 */
export async function getHealthScoreAlerts(): Promise<Array<{
  customerId: string;
  customerName: string;
  healthScore: number;
  alertType: 'CRITICAL_HEALTH' | 'HIGH_CHURN_RISK' | 'DECLINING_TREND';
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}>> {
  try {
    const alerts: Array<{
      customerId: string;
      customerName: string;
      healthScore: number;
      alertType: 'CRITICAL_HEALTH' | 'HIGH_CHURN_RISK' | 'DECLINING_TREND';
      message: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];
    
    // Get recent critical scores from cache
    const recentScores = Array.from(healthScoreCache.entries())
      .filter(([, entry]) => Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .map(([customerId, entry]) => ({ customerId, score: entry.score }))
      .filter(({ score }) => 
        score.overallHealthScore < 40 || 
        score.riskAssessment.churnProbability > 70 || 
        score.healthTrend === 'DECLINING'
      );
    
    // Get customer names for alerts
    for (const { customerId, score } of recentScores) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { name: true }
        });
        
        if (customer) {
          let alertType: 'CRITICAL_HEALTH' | 'HIGH_CHURN_RISK' | 'DECLINING_TREND' = 'CRITICAL_HEALTH';
          let message = '';
          let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
          
          if (score.overallHealthScore < 40) {
            alertType = 'CRITICAL_HEALTH';
            message = `امتیاز سلامت مشتری ${customer.name} در سطح بحرانی (${score.overallHealthScore})`;
            priority = 'HIGH';
          } else if (score.riskAssessment.churnProbability > 70) {
            alertType = 'HIGH_CHURN_RISK';
            message = `احتمال بالای ترک مشتری ${customer.name} (${score.riskAssessment.churnProbability}%)`;
            priority = 'HIGH';
          } else if (score.healthTrend === 'DECLINING') {
            alertType = 'DECLINING_TREND';
            message = `روند کاهشی امتیاز سلامت مشتری ${customer.name}`;
            priority = 'MEDIUM';
          }
          
          alerts.push({
            customerId,
            customerName: customer.name,
            healthScore: score.overallHealthScore,
            alertType,
            message,
            priority
          });
        }
      } catch (customerError) {
        console.error(`Error getting customer ${customerId} for alert:`, customerError);
      }
    }
    
    return alerts.sort((a, b) => a.healthScore - b.healthScore);
    
  } catch (error) {
    console.error('Error getting health score alerts:', error);
    return [];
  }
} 
