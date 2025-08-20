import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface CustomerInsights {
  customerId: string;
  riskScore: number;
  lifetimeValuePrediction: number;
  nextVisitPrediction?: string;
  preferredVisitDays: string[];
  preferredVisitTimes: string[];
  averageDaysBetweenVisits: number;
  spendingTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  loyaltyEngagement: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedOffers: string[];
  similarCustomers: string[];
  visitFrequencyScore: number;
  satisfactionScore: number;
  churnProbability: number;
  behavioral: {
    peakVisitHours: string[];
    preferredPaymentMethod: string;
    averageSessionDuration: number;
    servicePreferences: string[];
    seasonalPatterns: string[];
  };
  engagement: {
    campaignResponseRate: number;
    smsEngagementRate: number;
    loyaltyParticipation: number;
    feedbackParticipation: number;
    lastEngagementDate: string;
  };
  predictive: {
    lifetimeValueGrowth: number;
    nextPurchaseAmount: number;
    churnRiskFactors: string[];
    upsellOpportunities: string[];
  };
}

/**
 * Generate comprehensive customer insights based on historical data
 */
export async function generateCustomerInsights(customerId: string): Promise<CustomerInsights> {
  try {
    const [
      customer,
      visits,
      loyalty,
      smsHistory,
      campaigns,
      feedback
    ] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          loyalty: true,
          _count: {
            select: {
              visits: true,
              feedback: true
            }
          }
        }
      }),
      prisma.customerVisit.findMany({
        where: { customerId },
        orderBy: { visitDate: 'desc' },
        take: 100
      }),
      prisma.customerLoyalty.findUnique({
        where: { customerId }
      }),
      prisma.smsHistory.findMany({
        where: { phoneNumber: { endsWith: customerId } },
        orderBy: { sentAt: 'desc' },
        take: 50
      }),
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.customerFeedback.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    if (!customer) {
      throw new AppError('مشتری یافت نشد', 404);
    }

    // Calculate behavioral patterns
    const behavioral = calculateBehavioralPatterns(visits);
    
    // Calculate engagement metrics
    const engagement = calculateEngagementMetrics(smsHistory, campaigns, feedback, visits);
    
    // Calculate predictive metrics
    const predictive = calculatePredictiveMetrics(customer, visits, loyalty);
    
    // Calculate risk and satisfaction scores
    const riskScore = calculateRiskScore(customer, visits, engagement);
    const satisfactionScore = calculateSatisfactionScore(feedback, visits);
    
    // Calculate spending trend
    const spendingTrend = calculateSpendingTrend(visits);
    
    // Calculate loyalty engagement
    const loyaltyEngagement = calculateLoyaltyEngagement(loyalty, visits);
    
    // Generate recommendations
    const recommendedOffers = generateRecommendedOffers(customer, visits, loyalty);
    
    // Find similar customers
    const similarCustomers = await findSimilarCustomers(customer, visits);
    
    // Calculate visit frequency score
    const visitFrequencyScore = calculateVisitFrequencyScore(visits);
    
    // Calculate average days between visits
    const averageDaysBetweenVisits = calculateAverageDaysBetweenVisits(visits);
    
    // Predict next visit
    const nextVisitPrediction = predictNextVisit(visits, averageDaysBetweenVisits);
    
    // Calculate churn probability
    const churnProbability = calculateChurnProbability(customer, visits, engagement);

    return {
      customerId,
      riskScore,
      lifetimeValuePrediction: predictive.lifetimeValueGrowth,
      nextVisitPrediction,
      preferredVisitDays: behavioral.peakVisitHours,
      preferredVisitTimes: behavioral.peakVisitHours,
      averageDaysBetweenVisits,
      spendingTrend,
      loyaltyEngagement,
      recommendedOffers,
      similarCustomers,
      visitFrequencyScore,
      satisfactionScore,
      churnProbability,
      behavioral,
      engagement,
      predictive
    };

  } catch (error) {
    console.error('Error generating customer insights:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در تولید تحلیل مشتری', 500);
  }
}

/**
 * Calculate behavioral patterns from visit history
 */
function calculateBehavioralPatterns(visits: any[]): CustomerInsights['behavioral'] {
  if (!visits.length) {
    return {
      peakVisitHours: [],
      preferredPaymentMethod: 'نامشخص',
      averageSessionDuration: 0,
      servicePreferences: [],
      seasonalPatterns: []
    };
  }

  // Analyze visit times
  const visitHours = visits.map(visit => {
    const hour = new Date(visit.visitDate).getHours();
    return `${hour}:00-${hour + 1}:00`;
  });

  const hourCounts = visitHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const peakVisitHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([hour]) => hour);

  // Analyze payment methods
  const paymentMethods = visits.map(visit => visit.paymentMethod).filter(Boolean);
  const paymentCounts = paymentMethods.reduce((acc, method) => {
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const preferredPaymentMethod = Object.entries(paymentCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'نامشخص';

  // Calculate average session duration
  const durations = visits.map(visit => visit.serviceDuration || 0).filter(d => d > 0);
  const averageSessionDuration = durations.length > 0 
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : 0;

  // Analyze seasonal patterns
  const months = visits.map(visit => new Date(visit.visitDate).getMonth());
  const seasonalPatterns = ['بهار', 'تابستان', 'پاییز', 'زمستان'];

  return {
    peakVisitHours,
    preferredPaymentMethod,
    averageSessionDuration,
    servicePreferences: [], // This would be calculated from service data
    seasonalPatterns
  };
}

/**
 * Calculate engagement metrics
 */
function calculateEngagementMetrics(
  smsHistory: any[],
  campaigns: any[],
  feedback: any[],
  visits: any[]
): CustomerInsights['engagement'] {
  const totalSms = smsHistory.length;
  const deliveredSms = smsHistory.filter(sms => sms.status === 'DELIVERED').length;
  const smsEngagementRate = totalSms > 0 ? (deliveredSms / totalSms) * 100 : 0;

  const campaignResponseRate = campaigns.length > 0 ? 
    (visits.filter(visit => 
      campaigns.some(campaign => 
        new Date(visit.visitDate) >= new Date(campaign.startDate) &&
        new Date(visit.visitDate) <= new Date(campaign.endDate)
      )
    ).length / campaigns.length) * 100 : 0;

  const loyaltyParticipation = visits.filter(visit => 
    visit.loyaltyTransactions && visit.loyaltyTransactions.length > 0
  ).length;

  const feedbackParticipation = (feedback.length / Math.max(visits.length, 1)) * 100;

  const lastEngagementDate = visits.length > 0 
    ? visits[0].visitDate 
    : smsHistory.length > 0 
      ? smsHistory[0].sentAt 
      : new Date().toISOString();

  return {
    campaignResponseRate,
    smsEngagementRate,
    loyaltyParticipation,
    feedbackParticipation,
    lastEngagementDate
  };
}

/**
 * Calculate predictive metrics
 */
function calculatePredictiveMetrics(
  customer: any,
  visits: any[],
  loyalty: any
): CustomerInsights['predictive'] {
  const lifetimeSpent = Number(loyalty?.lifetimeSpent || 0);
  const recentVisits = visits.slice(0, 10);
  const recentSpending = recentVisits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0);
  
  // Predict lifetime value growth based on recent spending patterns
  const lifetimeValueGrowth = lifetimeSpent + (recentSpending * 6); // 6 months projection
  
  // Predict next purchase amount based on average
  const nextPurchaseAmount = visits.length > 0 
    ? Math.round(visits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) / visits.length)
    : 0;

  // Identify churn risk factors
  const churnRiskFactors = [];
  if (visits.length > 0) {
    const daysSinceLastVisit = Math.ceil((new Date().getTime() - new Date(visits[0].visitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit > 30) churnRiskFactors.push('عدم بازدید در ماه گذشته');
  }
  if (customer.segment === 'NEW') churnRiskFactors.push('مشتری جدید');
  if (recentSpending < lifetimeSpent * 0.1) churnRiskFactors.push('کاهش میزان خرید');

  // Identify upsell opportunities
  const upsellOpportunities = [];
  if (customer.segment === 'REGULAR' && lifetimeSpent > 5000000) {
    upsellOpportunities.push('ارتقا به عضویت VIP');
  }
  if (loyalty && loyalty.currentPoints > 1000) {
    upsellOpportunities.push('استفاده از امتیازات برای خرید بیشتر');
  }

  return {
    lifetimeValueGrowth,
    nextPurchaseAmount,
    churnRiskFactors,
    upsellOpportunities
  };
}

/**
 * Calculate risk score (0-100, lower is better)
 */
function calculateRiskScore(customer: any, visits: any[], engagement: any): number {
  let score = 0;
  
  // Segment-based risk
  switch (customer.segment) {
    case 'NEW': score += 40; break;
    case 'OCCASIONAL': score += 25; break;
    case 'REGULAR': score += 10; break;
    case 'VIP': score += 5; break;
  }
  
  // Visit frequency risk
  if (visits.length === 0) score += 50;
  else if (visits.length < 5) score += 30;
  else if (visits.length < 10) score += 15;
  
  // Engagement risk
  if (engagement.smsEngagementRate < 50) score += 20;
  if (engagement.campaignResponseRate < 30) score += 15;
  
  // Recent activity risk
  if (visits.length > 0) {
    const daysSinceLastVisit = Math.ceil((new Date().getTime() - new Date(visits[0].visitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit > 60) score += 30;
    else if (daysSinceLastVisit > 30) score += 15;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate satisfaction score (0-100)
 */
function calculateSatisfactionScore(feedback: any[], visits: any[]): number {
  if (feedback.length === 0) return 75; // Default score
  
  const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length;
  const feedbackRatio = feedback.length / Math.max(visits.length, 1);
  
  // Base score from ratings
  let score = (avgRating / 5) * 100;
  
  // Adjust for feedback participation
  if (feedbackRatio > 0.5) score += 10;
  else if (feedbackRatio < 0.1) score -= 10;
  
  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Calculate spending trend
 */
function calculateSpendingTrend(visits: any[]): CustomerInsights['spendingTrend'] {
  if (visits.length < 3) return 'STABLE';
  
  const recentVisits = visits.slice(0, Math.min(5, visits.length));
  const olderVisits = visits.slice(5, Math.min(10, visits.length));
  
  if (olderVisits.length === 0) return 'STABLE';
  
  const recentAvg = recentVisits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) / recentVisits.length;
  const olderAvg = olderVisits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) / olderVisits.length;
  
  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (changePercent > 20) return 'INCREASING';
  if (changePercent < -20) return 'DECREASING';
  return 'STABLE';
}

/**
 * Calculate loyalty engagement level
 */
function calculateLoyaltyEngagement(loyalty: any, visits: any[]): CustomerInsights['loyaltyEngagement'] {
  if (!loyalty) return 'LOW';
  
  const currentPoints = loyalty.currentPoints || 0;
  const totalVisits = visits.length;
  const pointsPerVisit = totalVisits > 0 ? currentPoints / totalVisits : 0;
  
  if (currentPoints > 2000 && pointsPerVisit > 50) return 'HIGH';
  if (currentPoints > 500 && pointsPerVisit > 20) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate recommended offers
 */
function generateRecommendedOffers(customer: any, visits: any[], loyalty: any): string[] {
  const offers = [];
  
  // Segment-based offers
  switch (customer.segment) {
    case 'NEW':
      offers.push('پیشنهاد ویژه مشتری جدید - ۱۵٪ تخفیف');
      offers.push('منوی آشنایی رایگان');
      break;
    case 'OCCASIONAL':
      offers.push('برنامه وفاداری - کسب امتیاز دوگانه');
      offers.push('دعوت به رویدادهای ویژه');
      break;
    case 'REGULAR':
      offers.push('پیشنهاد ارتقا به VIP');
      offers.push('منوی اختصاصی اعضا');
      break;
    case 'VIP':
      offers.push('دسترسی اولویت‌دار به منوی جدید');
      offers.push('سرویس شخصی‌سازی شده');
      break;
  }
  
  // Loyalty-based offers
  if (loyalty && loyalty.currentPoints > 1000) {
    offers.push(`استفاده از ${loyalty.currentPoints} امتیاز برای جایزه`);
  }
  
  // Visit pattern-based offers
  if (visits.length > 0) {
    const avgAmount = visits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) / visits.length;
    if (avgAmount > 500000) {
      offers.push('پیشنهاد ویژه پکیج خانوادگی');
    }
  }
  
  return offers.slice(0, 5);
}

/**
 * Find similar customers
 */
async function findSimilarCustomers(customer: any, visits: any[]): Promise<string[]> {
  try {
    const avgSpending = visits.length > 0 
      ? visits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) / visits.length
      : 0;
    
    const similarCustomers = await prisma.customer.findMany({
      where: {
        AND: [
          { id: { not: customer.id } },
          { segment: customer.segment },
          {
            loyalty: {
              lifetimeSpent: {
                gte: Math.max(0, avgSpending * 0.7),
                lte: avgSpending * 1.3
              }
            }
          }
        ]
      },
      select: { name: true },
      take: 5
    });
    
    return similarCustomers.map((c: { name: string }) => c.name);
  } catch (error) {
    console.error('Error finding similar customers:', error);
    return [];
  }
}

/**
 * Calculate visit frequency score
 */
function calculateVisitFrequencyScore(visits: any[]): number {
  const totalVisits = visits.length;
  const monthsActive = visits.length > 0 
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(visits[visits.length - 1].visitDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 1;
  
  const visitsPerMonth = totalVisits / monthsActive;
  return Math.min(Math.round(visitsPerMonth * 10), 100);
}

/**
 * Calculate average days between visits
 */
function calculateAverageDaysBetweenVisits(visits: any[]): number {
  if (visits.length < 2) return 0;
  
  const intervals = [];
  for (let i = 0; i < visits.length - 1; i++) {
    const days = Math.ceil((new Date(visits[i].visitDate).getTime() - new Date(visits[i + 1].visitDate).getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }
  
  return Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length);
}

/**
 * Predict next visit date
 */
function predictNextVisit(visits: any[], averageDays: number): string | undefined {
  if (visits.length === 0 || averageDays === 0) return undefined;
  
  const lastVisit = new Date(visits[0].visitDate);
  const nextVisit = new Date(lastVisit.getTime() + (averageDays * 24 * 60 * 60 * 1000));
  
  return nextVisit.toISOString().split('T')[0];
}

/**
 * Calculate churn probability
 */
function calculateChurnProbability(customer: any, visits: any[], engagement: any): number {
  let probability = 0;
  
  // Base probability by segment
  switch (customer.segment) {
    case 'NEW': probability += 45; break;
    case 'OCCASIONAL': probability += 25; break;
    case 'REGULAR': probability += 10; break;
    case 'VIP': probability += 5; break;
  }
  
  // Adjust for recent activity
  if (visits.length > 0) {
    const daysSinceLastVisit = Math.ceil((new Date().getTime() - new Date(visits[0].visitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit > 90) probability += 30;
    else if (daysSinceLastVisit > 60) probability += 20;
    else if (daysSinceLastVisit > 30) probability += 10;
  }
  
  // Adjust for engagement
  if (engagement.smsEngagementRate < 30) probability += 15;
  if (engagement.campaignResponseRate < 20) probability += 10;
  
  return Math.min(Math.max(probability, 0), 100);
}

/**
 * Get customer insights with caching
 */
export async function getCustomerInsights(customerId: string): Promise<CustomerInsights> {
  // For now, generate fresh insights each time
  // In production, you might want to cache these for performance
  return await generateCustomerInsights(customerId);
}

/**
 * Get insights for multiple customers
 */
export async function getBatchCustomerInsights(customerIds: string[]): Promise<Record<string, CustomerInsights>> {
  const insights: Record<string, CustomerInsights> = {};
  
  for (const customerId of customerIds) {
    try {
      insights[customerId] = await generateCustomerInsights(customerId);
    } catch (error) {
      console.error(`Error generating insights for customer ${customerId}:`, error);
    }
  }
  
  return insights;
} 