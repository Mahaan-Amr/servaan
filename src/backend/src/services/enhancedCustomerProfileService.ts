import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { generateCustomerInsights } from './customerInsightsService';
import { getCustomerCommunicationHistory } from './communicationTrackingService';

const prisma = new PrismaClient();

export interface EnhancedCustomerProfile {
  customerId: string;
  basicInfo: {
    name: string;
    phone: string;
    email?: string;
    birthday?: Date;
    anniversary?: Date;
    segment: string;
    status: string;
    memberSince: Date;
    lastActivity: Date;
  };
  
  behavioralPreferences: {
    preferredVisitDays: string[];
    preferredVisitTimes: string[];
    averageVisitDuration: number;
    preferredPaymentMethod: string;
    diningPreferences: {
      favoriteCategories: string[];
      averageOrderSize: number;
      preferredTableTypes: string[];
      servicePreferences: string[];
    };
    seasonalPatterns: {
      mostActiveMonth: string;
      leastActiveMonth: string;
      seasonalSpendingPattern: Record<string, number>;
    };
  };
  
  purchaseHistoryAnalysis: {
    lifetimeValue: number;
    totalOrders: number;
    averageOrderValue: number;
    favoriteItems: Array<{
      itemName: string;
      orderCount: number;
      totalSpent: number;
      lastOrdered: Date;
    }>;
    spendingPatterns: {
      monthlyAverage: number;
      yearlyTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
      spendingConsistency: number; // 0-100
    };
    priceSegment: 'BUDGET' | 'MODERATE' | 'PREMIUM';
  };
  
  demographicInsights: {
    estimatedAgeGroup: string;
    lifeStage: 'YOUNG_ADULT' | 'FAMILY' | 'MATURE' | 'SENIOR';
    locationPattern: {
      preferredLocation: string;
      visitsFromDifferentLocations: number;
    };
    socialEngagement: {
      groupSize: number;
      familyOriented: boolean;
      businessOriented: boolean;
    };
  };
  
  relationshipStrengthIndicators: {
    overallStrength: number; // 0-100
    loyaltyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'ADVOCATE';
    engagementMetrics: {
      communicationResponseRate: number;
      feedbackParticipationRate: number;
      loyaltyProgramEngagement: number;
      campaignEngagement: number;
    };
    referralPotential: {
      score: number; // 0-100
      indicators: string[];
    };
    retentionRisk: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      riskFactors: string[];
      lastRiskAssessment: Date;
    };
  };
  
  personalizedInsights: {
    nextBestActions: string[];
    personalizedOffers: string[];
    communicationPreferences: {
      preferredChannel: string;
      preferredFrequency: string;
      bestContactTime: string;
    };
    careOpportunities: string[];
    upsellOpportunities: string[];
  };
  
  profileCompleteness: {
    score: number; // 0-100
    missingFields: string[];
    dataQuality: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  };
  
  lastUpdated: Date;
  refreshNeeded: boolean;
}

/**
 * Generate enhanced customer profile with comprehensive behavioral and demographic insights
 */
export async function generateEnhancedCustomerProfile(customerId: string): Promise<EnhancedCustomerProfile> {
  try {
    // Fetch base customer data with all relations
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        loyalty: true,
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 200 // Get comprehensive visit history
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        campaignDeliveries: {
          orderBy: { queuedAt: 'desc' },
          take: 50
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        smsHistory: {
          orderBy: { sentAt: 'desc' },
          take: 100
        }
      }
    });

    if (!customer) {
      throw new AppError('مشتری یافت نشد', 404);
    }

    // Get existing insights and communication data
    const [insights, communicationData] = await Promise.all([
      generateCustomerInsights(customerId),
      getCustomerCommunicationHistory(customerId, 100)
    ]);

    // Generate enhanced profile components
    const basicInfo = generateBasicInfo(customer);
    const behavioralPreferences = generateBehavioralPreferences(customer, insights);
    const purchaseHistoryAnalysis = generatePurchaseHistoryAnalysis(customer);
    const demographicInsights = generateDemographicInsights(customer);
    const relationshipStrengthIndicators = generateRelationshipStrengthIndicators(
      customer, 
      insights, 
      communicationData
    );
    const personalizedInsights = generatePersonalizedInsights(customer, insights);
    const profileCompleteness = calculateProfileCompleteness(customer);

    return {
      customerId,
      basicInfo,
      behavioralPreferences,
      purchaseHistoryAnalysis,
      demographicInsights,
      relationshipStrengthIndicators,
      personalizedInsights,
      profileCompleteness,
      lastUpdated: new Date(),
      refreshNeeded: false
    };

  } catch (error) {
    console.error('Error generating enhanced customer profile:', error);
    throw new AppError('خطا در ایجاد پروفایل پیشرفته مشتری', 500);
  }
}

/**
 * Generate basic customer information
 */
function generateBasicInfo(customer: any): EnhancedCustomerProfile['basicInfo'] {
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    birthday: customer.birthday,
    anniversary: customer.anniversary,
    segment: customer.segment,
    status: customer.status,
    memberSince: customer.createdAt,
    lastActivity: customer.loyalty?.lastVisitDate || customer.createdAt
  };
}

/**
 * Generate behavioral preferences based on visit patterns
 */
function generateBehavioralPreferences(customer: any, insights: any): EnhancedCustomerProfile['behavioralPreferences'] {
  const visits = customer.visits || [];
  
  // Analyze visit day patterns
  const visitDays = visits.map((visit: any) => 
    new Date(visit.visitDate).toLocaleDateString('fa-IR', { weekday: 'long' })
  );
  const dayFrequency = visitDays.reduce((acc: any, day: string) => {
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const preferredVisitDays = Object.entries(dayFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([day]) => day);

  // Analyze visit time patterns
  const visitTimes = visits.map((visit: any) => 
    new Date(visit.visitDate).getHours()
  );
  const timeFrequency = visitTimes.reduce((acc: any, hour: number) => {
    const timeSlot = getTimeSlot(hour);
    acc[timeSlot] = (acc[timeSlot] || 0) + 1;
    return acc;
  }, {});
  const preferredVisitTimes = Object.entries(timeFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([timeSlot]) => timeSlot);

  // Calculate average visit duration
  const averageVisitDuration = visits.length > 0 
    ? visits.reduce((sum: number, visit: any) => sum + (visit.serviceDuration || 60), 0) / visits.length
    : 60;

  // Find preferred payment method
  const paymentMethods = visits.map((visit: any) => visit.paymentMethod);
  const paymentFrequency = paymentMethods.reduce((acc: any, method: string) => {
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});
  const preferredPaymentMethod = Object.entries(paymentFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'CARD';

  // Analyze dining preferences
  const diningPreferences = analyzeDiningPreferences(visits);
  
  // Analyze seasonal patterns
  const seasonalPatterns = analyzeSeasonalPatterns(visits);

  return {
    preferredVisitDays,
    preferredVisitTimes,
    averageVisitDuration,
    preferredPaymentMethod,
    diningPreferences,
    seasonalPatterns
  };
}

/**
 * Generate purchase history analysis
 */
function generatePurchaseHistoryAnalysis(customer: any): EnhancedCustomerProfile['purchaseHistoryAnalysis'] {
  const visits = customer.visits || [];
  const loyalty = customer.loyalty;
  
  const lifetimeValue = Number(loyalty?.lifetimeSpent || 0);
  const totalOrders = visits.length;
  const averageOrderValue = totalOrders > 0 ? lifetimeValue / totalOrders : 0;
  
  // Analyze favorite items (simplified - would need more detailed order data)
  const favoriteItems = analyzeFavoriteItems(visits);
  
  // Analyze spending patterns
  const spendingPatterns = analyzeSpendingPatterns(visits, loyalty);
  
  // Determine price segment
  const priceSegment = determinePriceSegment(averageOrderValue);

  return {
    lifetimeValue,
    totalOrders,
    averageOrderValue,
    favoriteItems,
    spendingPatterns,
    priceSegment
  };
}

/**
 * Generate demographic insights
 */
function generateDemographicInsights(customer: any): EnhancedCustomerProfile['demographicInsights'] {
  const birthday = customer.birthday;
  const visits = customer.visits || [];
  
  // Estimate age group
  const estimatedAgeGroup = birthday 
    ? calculateAgeGroup(birthday)
    : 'نامشخص';
  
  // Determine life stage
  const lifeStage = determineLifeStage(birthday, visits);
  
  // Analyze location patterns
  const locationPattern = analyzeLocationPattern(customer);
  
  // Analyze social engagement
  const socialEngagement = analyzeSocialEngagement(visits);

  return {
    estimatedAgeGroup,
    lifeStage,
    locationPattern,
    socialEngagement
  };
}

/**
 * Generate relationship strength indicators
 */
function generateRelationshipStrengthIndicators(
  customer: any, 
  insights: any, 
  communicationData: any
): EnhancedCustomerProfile['relationshipStrengthIndicators'] {
  const visits = customer.visits || [];
  const feedback = customer.feedback || [];
  const loyaltyTransactions = customer.loyaltyTransactions || [];
  
  // Calculate overall relationship strength
  const overallStrength = calculateOverallStrength(customer, insights, communicationData);
  
  // Determine loyalty level
  const loyaltyLevel = determineLoyaltyLevel(overallStrength, insights);
  
  // Calculate engagement metrics
  const engagementMetrics = calculateEngagementMetrics(
    customer, 
    communicationData, 
    feedback, 
    loyaltyTransactions
  );
  
  // Calculate referral potential
  const referralPotential = calculateReferralPotential(customer, insights);
  
  // Assess retention risk
  const retentionRisk = assessRetentionRisk(customer, insights);

  return {
    overallStrength,
    loyaltyLevel,
    engagementMetrics,
    referralPotential,
    retentionRisk
  };
}

/**
 * Generate personalized insights and recommendations
 */
function generatePersonalizedInsights(customer: any, insights: any): EnhancedCustomerProfile['personalizedInsights'] {
  const nextBestActions = generateNextBestActions(customer, insights);
  const personalizedOffers = generatePersonalizedOffers(customer, insights);
  const communicationPreferences = generateCommunicationPreferences(customer, insights);
  const careOpportunities = generateCareOpportunities(customer, insights);
  const upsellOpportunities = generateUpsellOpportunities(customer, insights);

  return {
    nextBestActions,
    personalizedOffers,
    communicationPreferences,
    careOpportunities,
    upsellOpportunities
  };
}

/**
 * Calculate profile completeness score
 */
function calculateProfileCompleteness(customer: any): EnhancedCustomerProfile['profileCompleteness'] {
  let score = 0;
  const missingFields: string[] = [];

  // Check basic fields
  if (customer.name) score += 10;
  if (customer.phone) score += 10;
  if (customer.email) score += 10; else missingFields.push('ایمیل');
  if (customer.birthday) score += 10; else missingFields.push('تاریخ تولد');
  if (customer.anniversary) score += 5; else missingFields.push('تاریخ سالگرد');
  if (customer.address) score += 5; else missingFields.push('آدرس');
  if (customer.city) score += 5; else missingFields.push('شهر');
  
  // Check loyalty data
  if (customer.loyalty) score += 15;
  
  // Check visit history
  if (customer.visits && customer.visits.length > 0) score += 20;
  
  // Check feedback participation
  if (customer.feedback && customer.feedback.length > 0) score += 10;

  const dataQuality = score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : 'NEEDS_IMPROVEMENT';

  return { score, missingFields, dataQuality };
}

// Helper functions
function getTimeSlot(hour: number): string {
  if (hour < 6) return 'شب';
  if (hour < 12) return 'صبح';
  if (hour < 17) return 'ظهر';
  if (hour < 21) return 'عصر';
  return 'شب';
}

function analyzeDiningPreferences(visits: any[]): any {
  // Simplified analysis - would need more detailed menu data
  const totalSpent = visits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0);
  const averageOrderSize = visits.length > 0 ? totalSpent / visits.length : 0;
  
  return {
    favoriteCategories: ['غذاهای اصلی', 'نوشیدنی'], // Simplified
    averageOrderSize,
    preferredTableTypes: ['میز معمولی'], // Simplified
    servicePreferences: ['سرویس سریع'] // Simplified
  };
}

function analyzeSeasonalPatterns(visits: any[]): any {
  const monthlyVisits = visits.reduce((acc, visit) => {
    const month = new Date(visit.visitDate).getMonth();
    const monthName = new Date(2023, month).toLocaleDateString('fa-IR', { month: 'long' });
    acc[monthName] = (acc[monthName] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(monthlyVisits);
  const mostActiveMonth = entries.sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'نامشخص';
  const leastActiveMonth = entries.sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] || 'نامشخص';

  return {
    mostActiveMonth,
    leastActiveMonth,
    seasonalSpendingPattern: monthlyVisits
  };
}

function analyzeFavoriteItems(visits: any[]): any[] {
  // Simplified - would need detailed menu item data
  return [
    {
      itemName: 'غذای محبوب',
      orderCount: Math.floor(visits.length * 0.3),
      totalSpent: visits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) * 0.3,
      lastOrdered: visits[0]?.visitDate || new Date()
    }
  ];
}

function analyzeSpendingPatterns(visits: any[], loyalty: any): any {
  const monthlySpending = visits.reduce((acc, visit) => {
    const month = new Date(visit.visitDate).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + (visit.finalAmount || 0);
    return acc;
  }, {});

  const monthlyValues = Object.values(monthlySpending) as number[];
  const monthlyAverage = monthlyValues.length > 0 
    ? monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length 
    : 0;

  // Determine trend
  const yearlyTrend = monthlyValues.length > 2 
    ? (monthlyValues[0] > monthlyValues[monthlyValues.length - 1] ? 'DECREASING' : 'INCREASING')
    : 'STABLE';

  // Calculate spending consistency
  const spendingConsistency = monthlyValues.length > 0 
    ? Math.max(0, 100 - (Math.sqrt(monthlyValues.reduce((sum, val) => sum + Math.pow(val - monthlyAverage, 2), 0) / monthlyValues.length) / monthlyAverage * 100))
    : 0;

  return {
    monthlyAverage,
    yearlyTrend,
    spendingConsistency: Math.round(spendingConsistency)
  };
}

function determinePriceSegment(averageOrderValue: number): 'BUDGET' | 'MODERATE' | 'PREMIUM' {
  if (averageOrderValue < 100000) return 'BUDGET';
  if (averageOrderValue < 300000) return 'MODERATE';
  return 'PREMIUM';
}

function calculateAgeGroup(birthday: Date): string {
  const age = new Date().getFullYear() - birthday.getFullYear();
  if (age < 25) return '۱۸-۲۴ سال';
  if (age < 35) return '۲۵-۳۴ سال';
  if (age < 45) return '۳۵-۴۴ سال';
  if (age < 55) return '۴۵-۵۴ سال';
  if (age < 65) return '۵۵-۶۴ سال';
  return '۶۵+ سال';
}

function determineLifeStage(birthday: Date | null, visits: any[]): any {
  if (!birthday) return 'MATURE';
  
  const age = new Date().getFullYear() - birthday.getFullYear();
  if (age < 25) return 'YOUNG_ADULT';
  if (age < 45) return 'FAMILY';
  if (age < 65) return 'MATURE';
  return 'SENIOR';
}

function analyzeLocationPattern(customer: any): any {
  return {
    preferredLocation: customer.city || 'نامشخص',
    visitsFromDifferentLocations: 1 // Simplified
  };
}

function analyzeSocialEngagement(visits: any[]): any {
  // Simplified analysis based on order amounts
  const averageOrderValue = visits.length > 0 
    ? visits.reduce((sum, visit) => sum + (visit.finalAmount || 0), 0) / visits.length
    : 0;
  
  const groupSize = averageOrderValue > 200000 ? 3 : 2; // Estimate based on order value
  
  return {
    groupSize,
    familyOriented: groupSize > 2,
    businessOriented: false // Simplified
  };
}

function calculateOverallStrength(customer: any, insights: any, communicationData: any): number {
  let score = 0;
  
  // Visit frequency (0-30 points)
  const visitCount = customer.visits?.length || 0;
  if (visitCount > 50) score += 30;
  else if (visitCount > 20) score += 25;
  else if (visitCount > 10) score += 20;
  else if (visitCount > 5) score += 15;
  else score += 10;
  
  // Loyalty engagement (0-25 points)
  const loyaltyEngagement = insights.loyaltyEngagement;
  if (loyaltyEngagement === 'HIGH') score += 25;
  else if (loyaltyEngagement === 'MEDIUM') score += 15;
  else score += 5;
  
  // Communication engagement (0-20 points)
  const responseRate = communicationData.summary?.responseRate || 0;
  score += Math.round(responseRate * 0.2);
  
  // Spending consistency (0-15 points)
  const spendingTrend = insights.spendingTrend;
  if (spendingTrend === 'INCREASING') score += 15;
  else if (spendingTrend === 'STABLE') score += 10;
  else score += 5;
  
  // Feedback participation (0-10 points)
  const feedbackCount = customer.feedback?.length || 0;
  score += Math.min(feedbackCount * 2, 10);
  
  return Math.min(score, 100);
}

function determineLoyaltyLevel(overallStrength: number, insights: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'ADVOCATE' {
  if (overallStrength >= 90) return 'ADVOCATE';
  if (overallStrength >= 70) return 'HIGH';
  if (overallStrength >= 50) return 'MEDIUM';
  return 'LOW';
}

function calculateEngagementMetrics(customer: any, communicationData: any, feedback: any[], loyaltyTransactions: any[]): any {
  const communicationResponseRate = communicationData.summary?.responseRate || 0;
  const feedbackParticipationRate = feedback.length > 0 ? Math.min(feedback.length * 10, 100) : 0;
  const loyaltyProgramEngagement = loyaltyTransactions.length > 0 ? Math.min(loyaltyTransactions.length * 5, 100) : 0;
  const campaignEngagement = communicationData.summary?.engagementScore || 0;

  return {
    communicationResponseRate,
    feedbackParticipationRate,
    loyaltyProgramEngagement,
    campaignEngagement
  };
}

function calculateReferralPotential(customer: any, insights: any): any {
  let score = 0;
  const indicators: string[] = [];
  
  // High satisfaction customers are more likely to refer
  if (insights.satisfactionScore > 80) {
    score += 30;
    indicators.push('رضایت بالای مشتری');
  }
  
  // Loyal customers refer more
  if (insights.loyaltyEngagement === 'HIGH') {
    score += 25;
    indicators.push('وفاداری بالا');
  }
  
  // Regular visitors refer more
  if (customer.visits?.length > 20) {
    score += 20;
    indicators.push('بازدید منظم');
  }
  
  // VIP customers refer more
  if (customer.segment === 'VIP') {
    score += 15;
    indicators.push('مشتری VIP');
  }
  
  // Feedback givers are more engaged
  if (customer.feedback?.length > 5) {
    score += 10;
    indicators.push('مشارکت در نظرسنجی');
  }

  return { score: Math.min(score, 100), indicators };
}

function assessRetentionRisk(customer: any, insights: any): any {
  const riskScore = insights.riskScore || 0;
  const churnProbability = insights.churnProbability || 0;
  const riskFactors: string[] = [];
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  
  if (riskScore > 70 || churnProbability > 60) {
    riskLevel = 'HIGH';
    riskFactors.push('احتمال بالای ترک');
  } else if (riskScore > 40 || churnProbability > 30) {
    riskLevel = 'MEDIUM';
    riskFactors.push('احتمال متوسط ترک');
  }
  
  // Check for other risk factors
  const daysSinceLastVisit = customer.loyalty?.lastVisitDate
    ? Math.floor((Date.now() - new Date(customer.loyalty.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceLastVisit > 90) {
    riskFactors.push('عدم بازدید طولانی مدت');
  }
  
  if (insights.spendingTrend === 'DECREASING') {
    riskFactors.push('کاهش میزان خرید');
  }

  return {
    riskLevel,
    riskFactors,
    lastRiskAssessment: new Date()
  };
}

function generateNextBestActions(customer: any, insights: any): string[] {
  const actions: string[] = [];
  
  // Based on visit frequency
  const daysSinceLastVisit = customer.loyalty?.lastVisitDate
    ? Math.floor((Date.now() - new Date(customer.loyalty.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceLastVisit > 30) {
    actions.push('ارسال پیام دلجویی');
  }
  
  // Based on loyalty points
  if (customer.loyalty?.currentPoints > 1000) {
    actions.push('یادآوری استفاده از امتیازات');
  }
  
  // Based on birthday
  if (customer.birthday) {
    const nextBirthday = new Date(customer.birthday);
    nextBirthday.setFullYear(new Date().getFullYear());
    const daysUntilBirthday = Math.floor((nextBirthday.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilBirthday <= 30 && daysUntilBirthday > 0) {
      actions.push('ارسال پیام تبریک تولد');
    }
  }
  
  // Based on spending trend
  if (insights.spendingTrend === 'INCREASING') {
    actions.push('ارائه محصولات پریمیوم');
  }
  
  return actions;
}

function generatePersonalizedOffers(customer: any, insights: any): string[] {
  const offers: string[] = [];
  
  // Based on segment
  if (customer.segment === 'VIP') {
    offers.push('تخفیف ویژه VIP');
    offers.push('دسترسی به منوی ویژه');
  } else if (customer.segment === 'REGULAR') {
    offers.push('تخفیف مشتری دائم');
  } else if (customer.segment === 'NEW') {
    offers.push('پیشنهاد خوش‌آمدگویی');
  }
  
  // Based on spending pattern
  const averageOrderValue = insights.averageOrderValue || 0;
  if (averageOrderValue > 200000) {
    offers.push('پکیج خانوادگی');
  }
  
  // Based on loyalty points
  if (customer.loyalty?.currentPoints > 500) {
    offers.push('تخفیف با امتیازات');
  }
  
  return offers;
}

function generateCommunicationPreferences(customer: any, insights: any): any {
  return {
    preferredChannel: insights.preferredChannel || 'SMS',
    preferredFrequency: 'هفتگی',
    bestContactTime: insights.preferredTime || 'عصر'
  };
}

function generateCareOpportunities(customer: any, insights: any): string[] {
  const opportunities: string[] = [];
  
  // Based on risk level
  if (insights.riskScore > 60) {
    opportunities.push('تماس مراقبت از مشتری');
  }
  
  // Based on satisfaction
  if (insights.satisfactionScore < 60) {
    opportunities.push('پیگیری رضایت مشتری');
  }
  
  // Based on complaints
  if (customer.feedback?.some((f: any) => f.overallRating < 3)) {
    opportunities.push('پیگیری شکایات');
  }
  
  return opportunities;
}

function generateUpsellOpportunities(customer: any, insights: any): string[] {
  const opportunities: string[] = [];
  
  // Based on spending trend
  if (insights.spendingTrend === 'INCREASING') {
    opportunities.push('معرفی محصولات جدید');
  }
  
  // Based on loyalty level
  if (insights.loyaltyEngagement === 'HIGH') {
    opportunities.push('ارتقاء به پکیج‌های بالاتر');
  }
  
  // Based on visit frequency
  if (customer.visits?.length > 30) {
    opportunities.push('عضویت در برنامه VIP');
  }
  
  return opportunities;
}

/**
 * Get multiple enhanced customer profiles
 */
export async function getBatchEnhancedCustomerProfiles(
  customerIds: string[]
): Promise<EnhancedCustomerProfile[]> {
  const profiles = await Promise.all(
    customerIds.map(id => generateEnhancedCustomerProfile(id))
  );
  
  return profiles;
}

/**
 * Update customer profile cache
 */
export async function refreshCustomerProfile(customerId: string): Promise<EnhancedCustomerProfile> {
  return await generateEnhancedCustomerProfile(customerId);
}

/**
 * Get profile summary for quick access
 */
export async function getCustomerProfileSummary(customerId: string): Promise<{
  name: string;
  segment: string;
  relationshipStrength: number;
  loyaltyLevel: string;
  lastActivity: Date;
  riskLevel: string;
  profileCompleteness: number;
}> {
  const profile = await generateEnhancedCustomerProfile(customerId);
  
  return {
    name: profile.basicInfo.name,
    segment: profile.basicInfo.segment,
    relationshipStrength: profile.relationshipStrengthIndicators.overallStrength,
    loyaltyLevel: profile.relationshipStrengthIndicators.loyaltyLevel,
    lastActivity: profile.basicInfo.lastActivity,
    riskLevel: profile.relationshipStrengthIndicators.retentionRisk.riskLevel,
    profileCompleteness: profile.profileCompleteness.score
  };
} 