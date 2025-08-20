import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

// Journey Stage Definitions
export type JourneyStage = 
  | 'AWARENESS'      // First discovery/contact
  | 'CONSIDERATION'  // Learning about services
  | 'FIRST_VISIT'    // Initial experience
  | 'ONBOARDING'     // First 2-3 visits
  | 'ENGAGEMENT'     // Regular interaction
  | 'LOYALTY'        // Committed customer
  | 'ADVOCACY'       // Promoting to others
  | 'AT_RISK'        // Declining engagement
  | 'CHURNED'        // Inactive customer
  | 'REACTIVATION'; // Returning after absence

export type TouchpointType = 
  | 'SMS_OUTBOUND'
  | 'SMS_INBOUND'
  | 'VISIT'
  | 'FEEDBACK'
  | 'LOYALTY_EARN'
  | 'LOYALTY_REDEEM'
  | 'CAMPAIGN'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'REFERRAL';

export interface JourneyTouchpoint {
  id: string;
  customerId: string;
  touchpointType: TouchpointType;
  channel: string;
  timestamp: Date;
  stage: JourneyStage;
  content: string;
  value: number; // Business value (revenue, engagement score, etc.)
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  metadata: Record<string, any>;
}

export interface JourneyStageInfo {
  stage: JourneyStage;
  stageStart: Date;
  stageEnd?: Date;
  duration: number; // days in stage
  touchpointCount: number;
  averageValue: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  keyTouchpoints: JourneyTouchpoint[];
  challenges: string[];
  opportunities: string[];
}

export interface CustomerJourneyMap {
  customerId: string;
  currentStage: JourneyStage;
  totalJourneyDuration: number; // days since first touchpoint
  totalTouchpoints: number;
  totalValue: number;
  averageEngagement: number;
  
  // Journey progression
  stageHistory: JourneyStageInfo[];
  touchpointTimeline: JourneyTouchpoint[];
  
  // Analysis
  journeyHealth: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  progressionRate: number; // stages per month
  retentionProbability: number;
  
  // Recommendations
  nextBestActions: NextBestAction[];
  criticalMoments: CriticalMoment[];
  
  // Insights
  behaviorPatterns: BehaviorPattern[];
  preferredChannels: string[];
  peakEngagementTimes: string[];
}

export interface NextBestAction {
  id: string;
  type: 'ENGAGEMENT' | 'RETENTION' | 'UPSELL' | 'RECOVERY' | 'REFERRAL';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  channel: string;
  timing: 'IMMEDIATE' | 'WITHIN_WEEK' | 'WITHIN_MONTH' | 'SCHEDULED';
  expectedOutcome: string;
  confidence: number; // 0-100
  rationale: string;
  requiredResources: string[];
}

export interface CriticalMoment {
  id: string;
  type: 'RISK_POINT' | 'OPPORTUNITY' | 'DECISION_POINT';
  stage: JourneyStage;
  description: string;
  probability: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timeframe: string;
  mitigationActions: string[];
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
  examples: string[];
}

/**
 * Generate comprehensive customer journey map
 */
export async function generateCustomerJourneyMap(customerId: string): Promise<CustomerJourneyMap> {
  try {
    // Get all customer touchpoints
    const touchpoints = await collectCustomerTouchpoints(customerId);
    
    // Analyze journey stages
    const stageHistory = await analyzeJourneyStages(customerId, touchpoints);
    
    // Determine current stage
    const currentStage = determineCurrentStage(stageHistory, touchpoints);
    
    // Calculate journey metrics
    const metrics = calculateJourneyMetrics(touchpoints, stageHistory);
    
    // Generate recommendations
    const nextBestActions = await generateNextBestActions(customerId, currentStage, touchpoints);
    
    // Identify critical moments
    const criticalMoments = await identifyCriticalMoments(customerId, currentStage, touchpoints);
    
    // Analyze behavior patterns
    const behaviorPatterns = analyzeBehaviorPatterns(touchpoints);
    
    // Calculate preferences
    const preferences = calculatePreferences(touchpoints);
    
    return {
      customerId,
      currentStage,
      totalJourneyDuration: metrics.totalDuration,
      totalTouchpoints: touchpoints.length,
      totalValue: metrics.totalValue,
      averageEngagement: metrics.averageEngagement,
      
      stageHistory,
      touchpointTimeline: touchpoints.slice(0, 50), // Latest 50 touchpoints
      
      journeyHealth: assessJourneyHealth(currentStage, touchpoints),
      progressionRate: metrics.progressionRate,
      retentionProbability: metrics.retentionProbability,
      
      nextBestActions,
      criticalMoments,
      
      behaviorPatterns,
      preferredChannels: preferences.channels,
      peakEngagementTimes: preferences.times
    };
  } catch (error) {
    console.error('Error generating customer journey map:', error);
    throw new AppError('خطا در تولید نقشه مسیر مشتری', 500);
  }
}

/**
 * Collect all customer touchpoints from various sources
 */
async function collectCustomerTouchpoints(customerId: string): Promise<JourneyTouchpoint[]> {
  const [customer, visits, smsHistory, feedback, loyaltyTransactions, campaigns] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      include: { loyalty: true }
    }),
    prisma.customerVisit.findMany({
      where: { customerId },
      orderBy: { visitDate: 'desc' },
      take: 100
    }),
    prisma.smsHistory.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.customerFeedback.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.campaignDelivery.findMany({
      where: { customerId },
      orderBy: { queuedAt: 'desc' },
      include: { campaign: true },
      take: 100
    })
  ]);

  const touchpoints: JourneyTouchpoint[] = [];

  // Customer registration touchpoint
  if (customer) {
    touchpoints.push({
      id: `customer-${customer.id}`,
      customerId,
      touchpointType: 'VISIT',
      channel: 'IN_PERSON',
      timestamp: customer.createdAt,
      stage: 'AWARENESS',
      content: 'ثبت نام مشتری',
      value: 0,
      sentiment: 'POSITIVE',
      metadata: {
        segment: customer.segment,
        source: 'registration'
      }
    });
  }

  // Visit touchpoints
  visits.forEach(visit => {
    touchpoints.push({
      id: `visit-${visit.id}`,
      customerId,
      touchpointType: 'VISIT',
      channel: 'IN_PERSON',
      timestamp: visit.visitDate,
      stage: 'ENGAGEMENT',
      content: `بازدید - مبلغ: ${visit.finalAmount?.toLocaleString()} ریال`,
      value: Number(visit.finalAmount || 0),
      sentiment: visit.feedbackRating && visit.feedbackRating >= 4 ? 'POSITIVE' : 
                visit.feedbackRating && visit.feedbackRating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
      metadata: {
        visitNumber: visit.visitNumber,
        paymentMethod: visit.paymentMethod,
        itemCount: visit.itemCount,
        feedbackRating: visit.feedbackRating
      }
    });
  });

  // SMS touchpoints
  smsHistory.forEach(sms => {
    touchpoints.push({
      id: `sms-${sms.id}`,
      customerId,
      touchpointType: 'SMS_OUTBOUND',
      channel: 'SMS',
      timestamp: sms.createdAt,
      stage: 'ENGAGEMENT',
      content: sms.message,
      value: 0,
      sentiment: 'NEUTRAL',
      metadata: {
        messageType: sms.messageType,
        status: sms.status
      }
    });
  });

  // Feedback touchpoints
  feedback.forEach(fb => {
    touchpoints.push({
      id: `feedback-${fb.id}`,
      customerId,
      touchpointType: 'FEEDBACK',
      channel: 'IN_PERSON',
      timestamp: fb.createdAt,
      stage: 'ENGAGEMENT',
      content: `نظر مشتری - امتیاز: ${fb.overallRating}/5`,
      value: fb.overallRating * 20, // Convert to 0-100 scale
      sentiment: fb.overallRating >= 4 ? 'POSITIVE' : 
                fb.overallRating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
      metadata: {
        rating: fb.overallRating,
        source: fb.feedbackSource,
        categories: fb.feedbackCategories
      }
    });
  });

  // Loyalty transaction touchpoints
  loyaltyTransactions.forEach(transaction => {
    touchpoints.push({
      id: `loyalty-${transaction.id}`,
      customerId,
      touchpointType: transaction.transactionType.includes('EARNED') ? 'LOYALTY_EARN' : 'LOYALTY_REDEEM',
      channel: 'IN_PERSON',
      timestamp: transaction.createdAt,
      stage: 'LOYALTY',
      content: `${transaction.transactionType.includes('EARNED') ? 'دریافت' : 'استفاده'} امتیاز: ${transaction.pointsChange}`,
      value: Math.abs(transaction.pointsChange),
      sentiment: transaction.transactionType.includes('EARNED') ? 'POSITIVE' : 'NEUTRAL',
      metadata: {
        transactionType: transaction.transactionType,
        pointsChange: transaction.pointsChange,
        balanceAfter: transaction.balanceAfter
      }
    });
  });

  // Campaign touchpoints
  campaigns.forEach(delivery => {
    touchpoints.push({
      id: `campaign-${delivery.id}`,
      customerId,
      touchpointType: 'CAMPAIGN',
      channel: 'SMS',
      timestamp: delivery.queuedAt,
      stage: 'ENGAGEMENT',
      content: `کمپین: ${delivery.campaign.name}`,
      value: 0,
      sentiment: 'NEUTRAL',
      metadata: {
        campaignType: delivery.campaign.campaignType,
        status: delivery.deliveryStatus
      }
    });
  });

  // Sort by timestamp
  touchpoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return touchpoints;
}

/**
 * Analyze journey stages based on touchpoints
 */
async function analyzeJourneyStages(customerId: string, touchpoints: JourneyTouchpoint[]): Promise<JourneyStageInfo[]> {
  const stages: JourneyStageInfo[] = [];
  let currentStage: JourneyStage = 'AWARENESS';
  let stageStart = touchpoints[0]?.timestamp || new Date();
  let stageTouchpoints: JourneyTouchpoint[] = [];

  for (const touchpoint of touchpoints) {
    const newStage = determineStageFromTouchpoint(touchpoint, currentStage);
    
    if (newStage !== currentStage) {
      // Finish current stage
      if (stageTouchpoints.length > 0) {
        stages.push(createStageInfo(currentStage, stageStart, touchpoint.timestamp, stageTouchpoints));
      }
      
      // Start new stage
      currentStage = newStage;
      stageStart = touchpoint.timestamp;
      stageTouchpoints = [];
    }
    
    // Update touchpoint stage
    touchpoint.stage = currentStage;
    stageTouchpoints.push(touchpoint);
  }

  // Add final stage
  if (stageTouchpoints.length > 0) {
    stages.push(createStageInfo(currentStage, stageStart, undefined, stageTouchpoints));
  }

  return stages;
}

/**
 * Determine journey stage from touchpoint
 */
function determineStageFromTouchpoint(touchpoint: JourneyTouchpoint, currentStage: JourneyStage): JourneyStage {
  const daysSinceFirst = (Date.now() - touchpoint.timestamp.getTime()) / (1000 * 60 * 60 * 24);
  
  // Business logic for stage transitions
  switch (touchpoint.touchpointType) {
    case 'VISIT':
      const visitCount = touchpoint.metadata.visitNumber || 1;
      if (visitCount === 1) return 'FIRST_VISIT';
      if (visitCount <= 3) return 'ONBOARDING';
      if (visitCount >= 10) return 'LOYALTY';
      return 'ENGAGEMENT';
      
    case 'LOYALTY_EARN':
    case 'LOYALTY_REDEEM':
      return 'LOYALTY';
      
    case 'FEEDBACK':
      const rating = touchpoint.metadata.rating;
      if (rating >= 4) return currentStage; // Maintain current stage
      if (rating <= 2) return 'AT_RISK';
      return currentStage;
      
    default:
      return currentStage;
  }
}

/**
 * Create stage information object
 */
function createStageInfo(stage: JourneyStage, start: Date, end: Date | undefined, touchpoints: JourneyTouchpoint[]): JourneyStageInfo {
  const duration = end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 
                   Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const totalValue = touchpoints.reduce((sum, tp) => sum + tp.value, 0);
  const avgValue = touchpoints.length > 0 ? totalValue / touchpoints.length : 0;
  
  // Determine overall sentiment
  const sentimentCounts = touchpoints.reduce((counts, tp) => {
    counts[tp.sentiment]++;
    return counts;
  }, { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 });
  
  const overallSentiment = sentimentCounts.POSITIVE > sentimentCounts.NEGATIVE ? 'POSITIVE' :
                          sentimentCounts.NEGATIVE > sentimentCounts.POSITIVE ? 'NEGATIVE' : 'NEUTRAL';

  return {
    stage,
    stageStart: start,
    stageEnd: end,
    duration,
    touchpointCount: touchpoints.length,
    averageValue: avgValue,
    sentiment: overallSentiment,
    keyTouchpoints: touchpoints.slice(0, 5), // Top 5 touchpoints
    challenges: generateStageChallenges(stage, touchpoints),
    opportunities: generateStageOpportunities(stage, touchpoints)
  };
}

/**
 * Generate stage-specific challenges
 */
function generateStageChallenges(stage: JourneyStage, touchpoints: JourneyTouchpoint[]): string[] {
  const challenges: string[] = [];
  
  const negativeCount = touchpoints.filter(tp => tp.sentiment === 'NEGATIVE').length;
  const avgValue = touchpoints.reduce((sum, tp) => sum + tp.value, 0) / touchpoints.length;
  
  switch (stage) {
    case 'AWARENESS':
      challenges.push('عدم آشنایی با خدمات');
      challenges.push('رقابت با سایر گزینه‌ها');
      break;
      
    case 'FIRST_VISIT':
      challenges.push('انطباق انتظارات با تجربه');
      challenges.push('کیفیت اولین برخورد');
      break;
      
    case 'ONBOARDING':
      challenges.push('ایجاد عادت بازدید');
      challenges.push('درک کامل خدمات');
      break;
      
    case 'AT_RISK':
      challenges.push('کاهش رضایت مشتری');
      challenges.push('احتمال ترک خدمات');
      break;
  }
  
  if (negativeCount > touchpoints.length * 0.3) {
    challenges.push('نارضایتی در تجربه‌های اخیر');
  }
  
  if (avgValue < 100000) {
    challenges.push('پایین بودن ارزش خرید');
  }
  
  return challenges;
}

/**
 * Generate stage-specific opportunities
 */
function generateStageOpportunities(stage: JourneyStage, touchpoints: JourneyTouchpoint[]): string[] {
  const opportunities: string[] = [];
  
  const positiveCount = touchpoints.filter(tp => tp.sentiment === 'POSITIVE').length;
  const avgValue = touchpoints.reduce((sum, tp) => sum + tp.value, 0) / touchpoints.length;
  
  switch (stage) {
    case 'ENGAGEMENT':
      opportunities.push('ارتقاء به مشتری وفادار');
      opportunities.push('افزایش فرکانس بازدید');
      break;
      
    case 'LOYALTY':
      opportunities.push('تبدیل به مشتری مدافع');
      opportunities.push('معرفی سایر مشتریان');
      break;
      
    case 'ADVOCACY':
      opportunities.push('همکاری در بازاریابی');
      opportunities.push('ارائه نظرات سازنده');
      break;
  }
  
  if (positiveCount > touchpoints.length * 0.7) {
    opportunities.push('استفاده از رضایت بالا');
  }
  
  if (avgValue > 200000) {
    opportunities.push('پیشنهاد خدمات پریمیوم');
  }
  
  return opportunities;
}

/**
 * Determine current stage based on recent activity
 */
function determineCurrentStage(stageHistory: JourneyStageInfo[], touchpoints: JourneyTouchpoint[]): JourneyStage {
  if (stageHistory.length === 0) return 'AWARENESS';
  
  const latestStage = stageHistory[stageHistory.length - 1];
  const daysSinceLastTouchpoint = touchpoints.length > 0 ? 
    (Date.now() - touchpoints[touchpoints.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 
    999;
  
  // Check for churned status
  if (daysSinceLastTouchpoint > 90) {
    return 'CHURNED';
  }
  
  // Check for at-risk status
  if (daysSinceLastTouchpoint > 30) {
    return 'AT_RISK';
  }
  
  return latestStage.stage;
}

/**
 * Calculate journey metrics
 */
function calculateJourneyMetrics(touchpoints: JourneyTouchpoint[], stageHistory: JourneyStageInfo[]) {
  const firstTouchpoint = touchpoints[0];
  const lastTouchpoint = touchpoints[touchpoints.length - 1];
  
  const totalDuration = firstTouchpoint && lastTouchpoint ?
    Math.ceil((lastTouchpoint.timestamp.getTime() - firstTouchpoint.timestamp.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const totalValue = touchpoints.reduce((sum, tp) => sum + tp.value, 0);
  const averageEngagement = touchpoints.length > 0 ? 
    touchpoints.filter(tp => tp.sentiment === 'POSITIVE').length / touchpoints.length * 100 : 0;
  
  const progressionRate = stageHistory.length > 0 ? 
    (stageHistory.length / totalDuration) * 30 : 0; // stages per month
  
  const retentionProbability = calculateRetentionProbability(touchpoints, stageHistory);
  
  return {
    totalDuration,
    totalValue,
    averageEngagement,
    progressionRate,
    retentionProbability
  };
}

/**
 * Calculate retention probability
 */
function calculateRetentionProbability(touchpoints: JourneyTouchpoint[], stageHistory: JourneyStageInfo[]): number {
  let score = 50; // Base score
  
  // Recent activity bonus
  const daysSinceLastTouchpoint = touchpoints.length > 0 ? 
    (Date.now() - touchpoints[touchpoints.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceLastTouchpoint <= 7) score += 20;
  else if (daysSinceLastTouchpoint <= 30) score += 10;
  else if (daysSinceLastTouchpoint <= 90) score -= 10;
  else score -= 30;
  
  // Positive sentiment bonus
  const positiveRate = touchpoints.length > 0 ? 
    touchpoints.filter(tp => tp.sentiment === 'POSITIVE').length / touchpoints.length : 0;
  score += positiveRate * 30;
  
  // Frequency bonus
  const touchpointFrequency = touchpoints.length > 0 ? 
    touchpoints.length / Math.max(1, daysSinceLastTouchpoint / 30) : 0;
  if (touchpointFrequency > 2) score += 15;
  
  // Stage progression bonus
  const currentStage = stageHistory[stageHistory.length - 1]?.stage;
  if (currentStage === 'LOYALTY' || currentStage === 'ADVOCACY') score += 25;
  else if (currentStage === 'AT_RISK' || currentStage === 'CHURNED') score -= 40;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate next best actions
 */
async function generateNextBestActions(
  customerId: string, 
  currentStage: JourneyStage, 
  touchpoints: JourneyTouchpoint[]
): Promise<NextBestAction[]> {
  const actions: NextBestAction[] = [];
  
  // Get customer insights for context
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { loyalty: true }
  });
  
  if (!customer) return actions;
  
  const recentTouchpoints = touchpoints.slice(-10);
  const daysSinceLastTouchpoint = touchpoints.length > 0 ? 
    (Date.now() - touchpoints[touchpoints.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  // Stage-specific actions
  switch (currentStage) {
    case 'AWARENESS':
      actions.push({
        id: 'welcome-sms',
        type: 'ENGAGEMENT',
        priority: 'HIGH',
        action: 'ارسال پیام خوش‌آمدگویی',
        channel: 'SMS',
        timing: 'IMMEDIATE',
        expectedOutcome: 'آشنایی بیشتر با خدمات',
        confidence: 85,
        rationale: 'مشتری تازه ثبت‌نام کرده و نیاز به راهنمایی دارد',
        requiredResources: ['SMS Credits', 'خوش‌آمدگویی Template']
      });
      break;
      
    case 'FIRST_VISIT':
      actions.push({
        id: 'follow-up-feedback',
        type: 'ENGAGEMENT',
        priority: 'HIGH',
        action: 'دریافت نظر درباره اولین تجربه',
        channel: 'SMS',
        timing: 'WITHIN_WEEK',
        expectedOutcome: 'بهبود تجربه و حل مشکلات',
        confidence: 80,
        rationale: 'اولین تجربه تعیین‌کننده ادامه رابطه است',
        requiredResources: ['SMS Credits', 'Feedback Template']
      });
      break;
      
    case 'AT_RISK':
      actions.push({
        id: 'retention-offer',
        type: 'RETENTION',
        priority: 'HIGH',
        action: 'پیشنهاد ویژه بازگشت',
        channel: 'SMS',
        timing: 'IMMEDIATE',
        expectedOutcome: 'بازگشت مشتری و افزایش رضایت',
        confidence: 70,
        rationale: 'مشتری در معرض خطر ترک است',
        requiredResources: ['SMS Credits', 'Discount Offer', 'Manager Approval']
      });
      break;
      
    case 'LOYALTY':
      actions.push({
        id: 'referral-program',
        type: 'REFERRAL',
        priority: 'MEDIUM',
        action: 'دعوت به برنامه معرفی دوستان',
        channel: 'SMS',
        timing: 'WITHIN_MONTH',
        expectedOutcome: 'جذب مشتریان جدید',
        confidence: 75,
        rationale: 'مشتری وفادار و احتمال معرفی بالا',
        requiredResources: ['SMS Credits', 'Referral Program Template']
      });
      break;
  }
  
  // Activity-based actions
  if (daysSinceLastTouchpoint > 14) {
    actions.push({
      id: 're-engagement',
      type: 'ENGAGEMENT',
      priority: 'MEDIUM',
      action: 'پیام یادآوری و پیشنهاد ویژه',
      channel: 'SMS',
      timing: 'IMMEDIATE',
      expectedOutcome: 'بازگشت مشتری',
      confidence: 60,
      rationale: `${Math.floor(daysSinceLastTouchpoint)} روز عدم فعالیت`,
      requiredResources: ['SMS Credits', 'Re-engagement Template']
    });
  }
  
  // Birthday and anniversary actions
  if (customer.birthday) {
    const today = new Date();
    const birthday = new Date(customer.birthday);
    const daysToBirthday = Math.ceil((new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate()).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToBirthday >= 0 && daysToBirthday <= 7) {
      actions.push({
        id: 'birthday-greeting',
        type: 'ENGAGEMENT',
        priority: 'HIGH',
        action: 'تبریک تولد و پیشنهاد ویژه',
        channel: 'SMS',
        timing: 'SCHEDULED',
        expectedOutcome: 'تقویت رابطه عاطفی',
        confidence: 90,
        rationale: 'تولد مشتری فرصتی برای تقویت رابطه است',
        requiredResources: ['SMS Credits', 'Birthday Template', 'Special Discount']
      });
    }
  }
  
  // Sort by priority and confidence
  actions.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.confidence - a.confidence;
  });
  
  return actions.slice(0, 5); // Top 5 actions
}

/**
 * Identify critical moments in customer journey
 */
async function identifyCriticalMoments(
  customerId: string, 
  currentStage: JourneyStage, 
  touchpoints: JourneyTouchpoint[]
): Promise<CriticalMoment[]> {
  const moments: CriticalMoment[] = [];
  
  const recentTouchpoints = touchpoints.slice(-10);
  const negativeCount = recentTouchpoints.filter(tp => tp.sentiment === 'NEGATIVE').length;
  
  // At-risk detection
  if (negativeCount >= 2) {
    moments.push({
      id: 'satisfaction-risk',
      type: 'RISK_POINT',
      stage: currentStage,
      description: 'کاهش رضایت مشتری در تجربه‌های اخیر',
      probability: 80,
      impact: 'HIGH',
      timeframe: 'یک هفته آینده',
      mitigationActions: [
        'تماس مستقیم با مشتری',
        'بررسی علت نارضایتی',
        'ارائه راه‌حل مناسب'
      ]
    });
  }
  
  // Loyalty opportunity
  if (currentStage === 'ENGAGEMENT') {
    const visitCount = touchpoints.filter(tp => tp.touchpointType === 'VISIT').length;
    if (visitCount >= 8) {
      moments.push({
        id: 'loyalty-upgrade',
        type: 'OPPORTUNITY',
        stage: currentStage,
        description: 'آماده ارتقاء به مشتری وفادار',
        probability: 75,
        impact: 'MEDIUM',
        timeframe: 'یک ماه آینده',
        mitigationActions: [
          'معرفی برنامه وفاداری',
          'ارائه امتیازات ویژه',
          'پیشنهاد خدمات پریمیوم'
        ]
      });
    }
  }
  
  // Churn risk
  const daysSinceLastTouchpoint = touchpoints.length > 0 ? 
    (Date.now() - touchpoints[touchpoints.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceLastTouchpoint > 60) {
    moments.push({
      id: 'churn-risk',
      type: 'RISK_POINT',
      stage: currentStage,
      description: 'خطر ترک مشتری به دلیل عدم فعالیت',
      probability: 70,
      impact: 'HIGH',
      timeframe: 'دو هفته آینده',
      mitigationActions: [
        'تماس فوری جهت بازگشت',
        'پیشنهاد تخفیف ویژه',
        'بررسی دلایل عدم حضور'
      ]
    });
  }
  
  return moments;
}

/**
 * Analyze behavior patterns
 */
function analyzeBehaviorPatterns(touchpoints: JourneyTouchpoint[]): BehaviorPattern[] {
  const patterns: BehaviorPattern[] = [];
  
  // Visit frequency pattern
  const visits = touchpoints.filter(tp => tp.touchpointType === 'VISIT');
  if (visits.length > 3) {
    const avgDaysBetweenVisits = visits.length > 1 ? 
      visits.reduce((sum, visit, index) => {
        if (index === 0) return sum;
        return sum + (visit.timestamp.getTime() - visits[index - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / (visits.length - 1) : 0;
    
    patterns.push({
      pattern: 'visit-frequency',
      frequency: Math.round(avgDaysBetweenVisits),
      impact: avgDaysBetweenVisits <= 14 ? 'POSITIVE' : 'NEUTRAL',
      description: `بازدید منظم هر ${Math.round(avgDaysBetweenVisits)} روز`,
      examples: visits.slice(0, 3).map(v => v.content)
    });
  }
  
  // Spending pattern
  const spendingTouchpoints = touchpoints.filter(tp => tp.value > 0);
  if (spendingTouchpoints.length > 0) {
    const avgSpending = spendingTouchpoints.reduce((sum, tp) => sum + tp.value, 0) / spendingTouchpoints.length;
    
    patterns.push({
      pattern: 'spending-behavior',
      frequency: Math.round(avgSpending),
      impact: avgSpending > 150000 ? 'POSITIVE' : 'NEUTRAL',
      description: `میانگین خرید: ${Math.round(avgSpending).toLocaleString()} ریال`,
      examples: spendingTouchpoints.slice(0, 3).map(tp => tp.content)
    });
  }
  
  // Feedback pattern
  const feedbackTouchpoints = touchpoints.filter(tp => tp.touchpointType === 'FEEDBACK');
  if (feedbackTouchpoints.length > 0) {
    const avgRating = feedbackTouchpoints.reduce((sum, tp) => sum + (tp.metadata.rating || 0), 0) / feedbackTouchpoints.length;
    
    patterns.push({
      pattern: 'feedback-engagement',
      frequency: Math.round(avgRating * 10) / 10,
      impact: avgRating >= 4 ? 'POSITIVE' : avgRating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
      description: `مشارکت در نظرسنجی با میانگین ${Math.round(avgRating * 10) / 10}`,
      examples: feedbackTouchpoints.slice(0, 3).map(tp => tp.content)
    });
  }
  
  return patterns;
}

/**
 * Calculate customer preferences
 */
function calculatePreferences(touchpoints: JourneyTouchpoint[]) {
  const channelCounts: Record<string, number> = {};
  const timeCounts: Record<string, number> = {};
  
  touchpoints.forEach(tp => {
    // Channel preferences
    channelCounts[tp.channel] = (channelCounts[tp.channel] || 0) + 1;
    
    // Time preferences
    const hour = tp.timestamp.getHours();
    const timeSlot = hour < 12 ? 'صبح' : hour < 17 ? 'ظهر' : 'عصر';
    timeCounts[timeSlot] = (timeCounts[timeSlot] || 0) + 1;
  });
  
  const sortedChannels = Object.entries(channelCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([channel]) => channel);
  
  const sortedTimes = Object.entries(timeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([time]) => time);
  
  return {
    channels: sortedChannels,
    times: sortedTimes
  };
}

/**
 * Assess journey health
 */
function assessJourneyHealth(currentStage: JourneyStage, touchpoints: JourneyTouchpoint[]): 'HEALTHY' | 'AT_RISK' | 'CRITICAL' {
  if (currentStage === 'CHURNED') return 'CRITICAL';
  if (currentStage === 'AT_RISK') return 'AT_RISK';
  
  const recentTouchpoints = touchpoints.slice(-5);
  const negativeCount = recentTouchpoints.filter(tp => tp.sentiment === 'NEGATIVE').length;
  
  if (negativeCount >= 2) return 'AT_RISK';
  if (negativeCount >= 1) return 'AT_RISK';
  
  const daysSinceLastTouchpoint = touchpoints.length > 0 ? 
    (Date.now() - touchpoints[touchpoints.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceLastTouchpoint > 60) return 'CRITICAL';
  if (daysSinceLastTouchpoint > 30) return 'AT_RISK';
  
  return 'HEALTHY';
}

/**
 * Get journey summary for multiple customers
 */
export async function getCustomerJourneySummary(customerIds: string[]): Promise<{
  [customerId: string]: {
    currentStage: JourneyStage;
    journeyHealth: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
    totalTouchpoints: number;
    daysSinceLastTouchpoint: number;
    retentionProbability: number;
  }
}> {
  const summaries: { [customerId: string]: any } = {};
  
  for (const customerId of customerIds) {
    try {
      const journeyMap = await generateCustomerJourneyMap(customerId);
      summaries[customerId] = {
        currentStage: journeyMap.currentStage,
        journeyHealth: journeyMap.journeyHealth,
        totalTouchpoints: journeyMap.totalTouchpoints,
        daysSinceLastTouchpoint: journeyMap.touchpointTimeline.length > 0 ? 
          Math.ceil((Date.now() - journeyMap.touchpointTimeline[journeyMap.touchpointTimeline.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24)) : 999,
        retentionProbability: journeyMap.retentionProbability
      };
    } catch (error) {
      console.error(`Error generating journey summary for customer ${customerId}:`, error);
      summaries[customerId] = {
        currentStage: 'AWARENESS',
        journeyHealth: 'AT_RISK',
        totalTouchpoints: 0,
        daysSinceLastTouchpoint: 999,
        retentionProbability: 0
      };
    }
  }
  
  return summaries;
} 