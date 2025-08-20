// Customer Journey Mapping Types

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
  metadata: Record<string, unknown>;
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

// API Response Types
export interface CustomerJourneyResponse {
  success: boolean;
  data: CustomerJourneyMap;
}

export interface JourneySummaryResponse {
  success: boolean;
  data: {
    [customerId: string]: {
      currentStage: JourneyStage;
      journeyHealth: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
      totalTouchpoints: number;
      daysSinceLastTouchpoint: number;
      retentionProbability: number;
    };
  };
}

export interface TouchpointsResponse {
  success: boolean;
  data: {
    touchpoints: JourneyTouchpoint[];
    total: number;
    currentStage: JourneyStage;
    journeyHealth: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  };
}

export interface NextActionsResponse {
  success: boolean;
  data: {
    nextBestActions: NextBestAction[];
    criticalMoments: CriticalMoment[];
    currentStage: JourneyStage;
    journeyHealth: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  };
}

export interface StageHistoryResponse {
  success: boolean;
  data: {
    currentStage: JourneyStage;
    stageHistory: JourneyStageInfo[];
    totalJourneyDuration: number;
    progressionRate: number;
  };
}

export interface BehaviorPatternsResponse {
  success: boolean;
  data: {
    behaviorPatterns: BehaviorPattern[];
    preferredChannels: string[];
    peakEngagementTimes: string[];
    averageEngagement: number;
  };
}

// Utility Types
export type JourneyHealthColor = {
  HEALTHY: 'green';
  AT_RISK: 'yellow';
  CRITICAL: 'red';
};

export type StageColor = {
  AWARENESS: 'blue';
  CONSIDERATION: 'indigo';
  FIRST_VISIT: 'purple';
  ONBOARDING: 'pink';
  ENGAGEMENT: 'green';
  LOYALTY: 'emerald';
  ADVOCACY: 'teal';
  AT_RISK: 'orange';
  CHURNED: 'red';
  REACTIVATION: 'cyan';
};

export type TouchpointIcon = {
  SMS_OUTBOUND: 'phone';
  SMS_INBOUND: 'phone';
  VISIT: 'home';
  FEEDBACK: 'star';
  LOYALTY_EARN: 'gift';
  LOYALTY_REDEEM: 'shopping-cart';
  CAMPAIGN: 'megaphone';
  BIRTHDAY: 'cake';
  ANNIVERSARY: 'heart';
  REFERRAL: 'users';
};

// Journey Stage Translations
export const JourneyStageLabels: Record<JourneyStage, string> = {
  AWARENESS: 'آگاهی',
  CONSIDERATION: 'بررسی',
  FIRST_VISIT: 'اولین بازدید',
  ONBOARDING: 'آشنایی',
  ENGAGEMENT: 'تعامل',
  LOYALTY: 'وفاداری',
  ADVOCACY: 'حمایت',
  AT_RISK: 'در خطر',
  CHURNED: 'از دست رفته',
  REACTIVATION: 'بازگشت'
};

// Touchpoint Type Translations
export const TouchpointTypeLabels: Record<TouchpointType, string> = {
  SMS_OUTBOUND: 'پیامک ارسالی',
  SMS_INBOUND: 'پیامک دریافتی',
  VISIT: 'بازدید',
  FEEDBACK: 'نظرسنجی',
  LOYALTY_EARN: 'کسب امتیاز',
  LOYALTY_REDEEM: 'استفاده امتیاز',
  CAMPAIGN: 'کمپین',
  BIRTHDAY: 'تولد',
  ANNIVERSARY: 'سالگرد',
  REFERRAL: 'معرفی'
};

// Action Type Translations
export const ActionTypeLabels: Record<NextBestAction['type'], string> = {
  ENGAGEMENT: 'تعامل',
  RETENTION: 'نگهداری',
  UPSELL: 'فروش بیشتر',
  RECOVERY: 'بازگشت',
  REFERRAL: 'معرفی'
};

// Priority Translations
export const PriorityLabels: Record<NextBestAction['priority'], string> = {
  HIGH: 'بالا',
  MEDIUM: 'متوسط',
  LOW: 'پایین'
};

// Timing Translations
export const TimingLabels: Record<NextBestAction['timing'], string> = {
  IMMEDIATE: 'فوری',
  WITHIN_WEEK: 'طی هفته',
  WITHIN_MONTH: 'طی ماه',
  SCHEDULED: 'برنامه‌ریزی شده'
};

// Critical Moment Type Translations
export const CriticalMomentTypeLabels: Record<CriticalMoment['type'], string> = {
  RISK_POINT: 'نقطه خطر',
  OPPORTUNITY: 'فرصت',
  DECISION_POINT: 'نقطه تصمیم'
};

// Impact Translations
export const ImpactLabels: Record<CriticalMoment['impact'], string> = {
  HIGH: 'بالا',
  MEDIUM: 'متوسط',
  LOW: 'پایین'
};

// Sentiment Translations
export const SentimentLabels: Record<JourneyTouchpoint['sentiment'], string> = {
  POSITIVE: 'مثبت',
  NEUTRAL: 'خنثی',
  NEGATIVE: 'منفی'
};

// Health Status Translations
export const HealthStatusLabels: Record<CustomerJourneyMap['journeyHealth'], string> = {
  HEALTHY: 'سالم',
  AT_RISK: 'در خطر',
  CRITICAL: 'بحرانی'
}; 