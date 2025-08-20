// CRM Types for Frontend Integration

// ===================== CRM DASHBOARD TYPES =====================

/**
 * CRM Dashboard Statistics
 */
export interface CrmDashboardStats {
  customerStats: {
    total: number;
    active: number;
    newThisMonth: number;
    bySegment: Record<string, number>;
  };
  loyaltyStats: {
    totalPoints: number;
    activePoints: number;
    redemptionRate: number;
    averagePointsPerCustomer: number;
  };
  visitStats: {
    totalVisits: number;
    totalRevenue: number;
    averageOrderValue: number;
    visitsThisMonth: number;
  };
  recentActivities: CrmActivity[];
  topCustomers: Customer[];
  segmentTrends: CrmSegmentTrend[];
}

/**
 * CRM Activity for Dashboard
 */
export interface CrmActivity {
  id: string;
  type: 'CUSTOMER_CREATED' | 'VISIT_RECORDED' | 'LOYALTY_EARNED' | 'LOYALTY_REDEEMED' | 'SEGMENT_CHANGED';
  customerId: string;
  customerName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * CRM Segment Trend for Dashboard
 */
export interface CrmSegmentTrend {
  segment: string;
  change: number;
  changePercent: number;
  previousCount: number;
  currentCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

/**
 * CRM Dashboard Response
 */
export interface CrmDashboardResponse {
  stats: CrmDashboardStats;
  period: {
    start: string;
    end: string;
  };
  lastUpdated: string;
}

// Customer types
export interface Customer {
  id: string;
  phone: string;
  phoneNormalized: string;
  name: string;
  nameEnglish?: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  segment: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP';
  notes?: string;
  preferredContactMethod: 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  allowMarketing: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  loyalty?: CustomerLoyalty;
  _count?: {
    visits: number;
    feedback: number;
  };
}

// Customer Loyalty types
export interface CustomerLoyalty {
  id: string;
  customerId: string;
  totalVisits: number;
  lifetimeSpent: number;
  currentYearSpent: number;
  currentMonthSpent: number;
  visitsThisMonth: number;
  pointsEarned: number;
  pointsRedeemed: number;
  currentPoints: number;
  tierLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  firstVisitDate?: string;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Visit types
export interface CustomerVisit {
  id: string;
  customerId: string;
  customer?: {
    name: string;
    phone: string;
    segment: string;
  };
  visitNumber: number;
  visitDate: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  itemsOrdered: OrderItem[];
  itemCount: number;
  tableNumber?: string;
  serverName?: string;
  serviceDuration?: number;
  pointsEarned: number;
  pointsRedeemed: number;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackCategories: string[];
  visitNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser?: {
    name: string;
  };
  loyaltyTransactions?: LoyaltyTransaction[];
}

// Order Item interface
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

// Loyalty Transaction types
export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customer?: {
    name: string;
    phone: string;
  };
  transactionType: 'EARNED_PURCHASE' | 'EARNED_BONUS' | 'EARNED_REFERRAL' | 'EARNED_BIRTHDAY' | 
                   'REDEEMED_DISCOUNT' | 'REDEEMED_ITEM' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUBTRACT' | 'EXPIRED';
  pointsChange: number;
  description: string;
  notes?: string;
  visitId?: string;
  visit?: {
    visitNumber: number;
    finalAmount: number;
  };
  campaignId?: string;
  orderReference?: string;
  relatedAmount?: number;
  balanceAfter: number;
  createdAt: string;
  createdBy?: string;
  createdByUser?: {
    name: string;
  };
}

// Customer Segmentation types
export interface CustomerSegmentData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  currentSegment: string;
  suggestedSegment: string;
  segmentScore: number;
  reasons: string[];
  loyaltyData: {
    totalVisits: number;
    lifetimeSpent: number;
    currentYearSpent: number;
    currentPoints: number;
    tierLevel: string;
    lastVisitDays: number;
  };
}

export interface SegmentationReport {
  totalCustomers: number;
  segmentDistribution: Record<string, number>;
  movements: {
    upgraded: CustomerSegmentData[];
    downgraded: CustomerSegmentData[];
    unchanged: number;
  };
  recommendations: string[];
}

// Filter and search types
export interface CustomerFilter {
  page?: number;
  limit?: number;
  search?: string;
  phone?: string;
  segment?: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP';
  tierLevel?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdFrom?: string;
  createdTo?: string;
  lastVisitFrom?: string;
  lastVisitTo?: string;
  minSpent?: number;
  maxSpent?: number;
}

export interface VisitFilter {
  page?: number;
  limit?: number;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  tableNumber?: string;
  serverName?: string;
  feedbackRating?: number;
}

// Form data types
export interface CustomerCreateData {
  phone: string;
  name: string;
  nameEnglish?: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  notes?: string;
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  allowMarketing?: boolean;
}

export interface CustomerUpdateData {
  name?: string;
  nameEnglish?: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  notes?: string;
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  allowMarketing?: boolean;
}

export interface VisitCreateData {
  customerId: string;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  itemsOrdered?: OrderItem[];
  tableNumber?: string;
  serverName?: string;
  serviceDuration?: number;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackCategories?: string[];
  visitNotes?: string;
  pointsRedeemed?: number;
}

// Statistics types
export interface CustomerStatistics {
  total: number;
  active: number;
  bySegment: Record<string, number>;
  byTier: Record<string, number>;
  newThisMonth: number;
  averageLifetimeValue: number;
  averageVisits: number;
  topSpenders: Customer[];
}

export interface LoyaltyStatistics {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activePoints: number;
  averagePointsPerCustomer: number;
  tierDistribution: Record<string, number>;
  topLoyaltyCustomers: Customer[];
  monthlyTrends: {
    month: string;
    pointsIssued: number;
    pointsRedeemed: number;
  }[];
}

export interface VisitAnalytics {
  totalVisits: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageServiceDuration: number;
  averageRating: number;
  paymentMethodDistribution: Record<string, number>;
  topCustomers: CustomerSummary[];
  peakHours: PeakHourData[];
  revenueByDay: DailyRevenueData[];
}

// Supporting interfaces for VisitAnalytics
export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  visitCount: number;
}

export interface PeakHourData {
  hour: number;
  visitCount: number;
  revenue: number;
}

export interface DailyRevenueData {
  date: string;
  revenue: number;
  visitCount: number;
}

// Tier Benefits
export interface TierBenefits {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  pointMultiplier: number;
  discountPercentage: number;
  freeItemThreshold: number;
  specialOffers: string[];
  prioritySupport: boolean;
}

// API Response types
export interface CustomerResponse {
  customers: Customer[];
  pagination: {
    currentPage: number;
    total: number;
    pages: number;
    limit: number;
  };
}

export interface VisitResponse {
  visits: CustomerVisit[];
  pagination: {
    currentPage: number;
    total: number;
    pages: number;
    limit: number;
  };
}

export interface LoyaltyTransactionResponse {
  transactions: LoyaltyTransaction[];
  pagination: {
    currentPage: number;
    total: number;
    pages: number;
    limit: number;
  };
}

// New interfaces for enhanced customer management

// Bulk Operations
export interface BulkOperation {
  id: string;
  type: 'UPDATE_STATUS' | 'UPDATE_SEGMENT' | 'SMS_CAMPAIGN' | 'EXPORT' | 'DELETE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  progress: number;
  result?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BulkUpdateRequest {
  customerIds: string[];
  updateData: {
    segment?: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP';
    status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    allowMarketing?: boolean;
    notes?: string;
  };
}

export interface BulkSmsRequest {
  customerIds: string[];
  message: string;
  messageType: 'PROMOTIONAL' | 'TRANSACTIONAL' | 'BULK';
  scheduleTime?: string;
  templateId?: string;
  variables?: Record<string, string | number | boolean>;
}

export interface BulkOperationResult {
  operationId: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  failedItemsDetails?: Array<{
    itemId: string;
    error: string;
  }>;
}

// Import/Export functionality
export interface CustomerExportRequest {
  format: 'CSV' | 'EXCEL' | 'JSON';
  filters?: CustomerFilter;
  includeFields: string[];
  includeLoyalty?: boolean;
  includeVisits?: boolean;
}

export interface CustomerImportRequest {
  file: File;
  format: 'CSV' | 'EXCEL';
  mappings: Record<string, string>;
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    createLoyalty: boolean;
  };
}

export interface CustomerImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
}

// AI-powered recommendations
export interface CustomerRecommendation {
  id: string;
  customerId: string;
  customer: Customer;
  type: 'SEGMENT_UPGRADE' | 'AT_RISK' | 'WINBACK' | 'CROSS_SELL' | 'BIRTHDAY_CAMPAIGN' | 'LOYALTY_REWARD';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-100
  title: string;
  description: string;
  suggestedAction: string;
  potentialValue?: number;
  reasoning: string[];
  data: Record<string, unknown>;
  isRead: boolean;
  isApplied: boolean;
  validUntil?: string;
  createdAt: string;
}

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
  behavioral?: {
    peakVisitHours: string[];
    preferredPaymentMethod: string;
    averageSessionDuration: number;
    servicePreferences: string[];
    seasonalPatterns: string[];
  };
  engagement?: {
    campaignResponseRate: number;
    smsEngagementRate: number;
    loyaltyParticipation: number;
    feedbackParticipation: number;
    lastEngagementDate: string;
  };
  predictive?: {
    lifetimeValueGrowth: number;
    nextPurchaseAmount: number;
    churnRiskFactors: string[];
    upsellOpportunities: string[];
  };
}

// Advanced Segmentation
export interface CustomerSegmentRule {
  id: string;
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN' | 'BETWEEN';
  value: string | number | boolean | string[] | number[];
  logicalOperator?: 'AND' | 'OR';
}

export interface CustomSegment {
  id: string;
  name: string;
  description: string;
  rules: CustomerSegmentRule[];
  isActive: boolean;
  customerCount: number;
  colorHex: string;
  iconName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SegmentationAnalysis {
  totalCustomers: number;
  segments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageLifetimeValue: number;
    averageVisits: number;
    retentionRate: number;
  }>;
  recommendations: CustomerRecommendation[];
  trends: Array<{
    segment: string;
    trend: 'GROWING' | 'STABLE' | 'DECLINING';
    changePercentage: number;
  }>;
}

// Real-time Notifications
export interface CustomerNotification {
  id: string;
  type: 'CUSTOMER_VISIT' | 'LOYALTY_MILESTONE' | 'BIRTHDAY_REMINDER' | 'AT_RISK_CUSTOMER' | 'REVIEW_RECEIVED' | 'PAYMENT_ISSUE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    segment: string;
  };
  data: Record<string, unknown>;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  customerVisits: boolean;
  loyaltyMilestones: boolean;
  birthdayReminders: boolean;
  atRiskCustomers: boolean;
  reviewsReceived: boolean;
  paymentIssues: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

// Customer Activity Feed
export interface CustomerActivity {
  id: string;
  customerId: string;
  activityType: 'VISIT' | 'LOYALTY_TRANSACTION' | 'STATUS_CHANGE' | 'FEEDBACK' | 'SMS_SENT' | 'CAMPAIGN_INTERACTION';
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  relatedEntity?: {
    type: 'VISIT' | 'LOYALTY_TRANSACTION' | 'CAMPAIGN';
    id: string;
  };
}

// Enhanced analytics interfaces
export interface CustomerAnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: string;
  endDate?: string;
  segments?: string[];
  tiers?: string[];
  statuses?: string[];
  minVisits?: number;
  maxVisits?: number;
  minSpent?: number;
  maxSpent?: number;
}

export interface CustomerLifecycleAnalysis {
  customerId: string;
  currentStage: 'NEW' | 'ACTIVE' | 'AT_RISK' | 'DORMANT' | 'CHURNED';
  daysSinceFirstVisit: number;
  daysSinceLastVisit: number;
  totalVisits: number;
  totalSpent: number;
  averageDaysBetweenVisits: number;
  visitFrequencyTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  nextExpectedVisit?: string;
  churnProbability: number; // 0-100
  recommendedActions: string[];
}

// Campaign management interfaces
export interface CustomerCampaign {
  id: string;
  name: string;
  description: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';
  targetSegments: string[];
  targetCustomerIds?: string[];
  content: {
    message: string;
    subject?: string;
    template?: string;
    variables?: Record<string, string | number | boolean>;
  };
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  stats: {
    targetCount: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    openRate?: number;
    clickRate?: number;
    responseRate?: number;
  };
  createdAt: string;
  createdBy: string;
} 

// Enhanced Customer Profile types
export interface BehavioralPreferences {
  visitPatterns: {
    preferredDays: string[];
    preferredTimes: string[];
    averageFrequency: number;
    visitConsistency: number;
    peakHours: string[];
    weekdayVsWeekend: 'WEEKDAY' | 'WEEKEND' | 'BALANCED';
  };
  diningPreferences: {
    preferredSeating: string[];
    averagePartySize: number;
    servicePreferences: string[];
    ambientPreferences: string[];
    preferredServers: string[];
    dietaryRestrictions: string[];
  };
  seasonalTrends: {
    season: string;
    visitFrequency: number;
    spendingPattern: number;
    popularItems: string[];
    timePreference: string;
  }[];
  loyaltyBehavior: {
    pointsUsagePattern: 'SAVER' | 'SPENDER' | 'STRATEGIC';
    redemptionFrequency: number;
    preferredRewards: string[];
    tierProgression: 'ASCENDING' | 'STABLE' | 'DECLINING';
  };
}

export interface PurchaseHistoryAnalysis {
  lifetimeValue: {
    total: number;
    trend: 'INCREASING' | 'STABLE' | 'DECREASING';
    monthlyAverage: number;
    yearlyProjection: number;
    percentileRank: number;
  };
  spendingPatterns: {
    averageOrderValue: number;
    averageItemsPerVisit: number;
    pricePointPreference: 'BUDGET' | 'STANDARD' | 'PREMIUM' | 'LUXURY';
    discountSensitivity: number;
    paymentMethodPreference: string;
  };
  favoriteItems: {
    itemId: string;
    itemName: string;
    category: string;
    orderCount: number;
    totalSpent: number;
    lastOrdered: string;
  }[];
  categoryPreferences: {
    category: string;
    orderCount: number;
    spendingAmount: number;
    preference: number;
  }[];
  timeBasedAnalysis: {
    monthlyTrends: {
      month: string;
      visits: number;
      spending: number;
    }[];
    seasonalSpending: {
      season: string;
      totalSpent: number;
      visitCount: number;
    }[];
  };
}

export interface DemographicInsights {
  ageGroup: 'UNDER_25' | '25_35' | '35_45' | '45_55' | '55_65' | 'OVER_65';
  lifeStage: 'STUDENT' | 'YOUNG_PROFESSIONAL' | 'FAMILY' | 'EMPTY_NESTER' | 'RETIREE';
  socialBehavior: {
    averagePartySize: number;
    dinesAlone: boolean;
    bringsFriends: boolean;
    familyOriented: boolean;
    businessDining: boolean;
  };
  communicationPreferences: {
    preferredChannel: 'SMS' | 'EMAIL' | 'PHONE' | 'WHATSAPP';
    responseRate: number;
    bestContactTime: string;
    languagePreference: 'PERSIAN' | 'ENGLISH' | 'MIXED';
  };
  locationInsights: {
    primaryLocation: string;
    travelPattern: 'LOCAL' | 'REGIONAL' | 'TOURIST';
    locationLoyalty: number;
    nearbyCompetitors: string[];
  };
}

export interface RelationshipStrength {
  overallStrength: number;
  strengthLevel: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  loyaltyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CHAMPION';
  engagementMetrics: {
    visitFrequency: number;
    campaignResponseRate: number;
    feedbackParticipation: number;
    loyaltyParticipation: number;
    referralActivity: number;
  };
  relationshipFactors: {
    factor: string;
    score: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  }[];
  milestones: {
    achievement: string;
    date: string;
    impact: number;
  }[];
}

export interface PersonalizedInsights {
  nextBestActions: {
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    expectedImpact: number;
    reasoning: string[];
  }[];
  tailoredOffers: {
    offer: string;
    category: string;
    discount: number;
    validUntil: string;
    likelihood: number;
  }[];
  careOpportunities: {
    opportunity: string;
    type: 'RETENTION' | 'ENGAGEMENT' | 'UPSELL' | 'CROSS_SELL';
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedAction: string;
  }[];
  riskFactors: {
    factor: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    mitigation: string;
  }[];
}

export interface ProfileCompleteness {
  overallScore: number;
  completenessLevel: 'BASIC' | 'GOOD' | 'EXCELLENT' | 'COMPLETE';
  missingFields: string[];
  dataQuality: {
    accuracy: number;
    freshness: number;
    completeness: number;
    consistency: number;
  };
  improvementSuggestions: string[];
}

export interface EnhancedCustomerProfile {
  customerId: string;
  customer: Customer;
  profileCompleteness: ProfileCompleteness;
  behavioralPreferences: BehavioralPreferences;
  purchaseHistoryAnalysis: PurchaseHistoryAnalysis;
  demographicInsights: DemographicInsights;
  relationshipStrength: RelationshipStrength;
  personalizedInsights: PersonalizedInsights;
  lastUpdated: string;
  dataFreshness: {
    visitData: string;
    loyaltyData: string;
    campaignData: string;
    feedbackData: string;
  };
}

// Customer Health Scoring types
export interface HealthScoreComponents {
  visitFrequency: {
    score: number;
    weight: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
  spendingBehavior: {
    score: number;
    weight: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
  loyaltyEngagement: {
    score: number;
    weight: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
  feedbackSentiment: {
    score: number;
    weight: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
  communicationResponse: {
    score: number;
    weight: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
  recencyFactor: {
    score: number;
    weight: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
}

export interface RiskAssessment {
  churnRisk: {
    probability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    primaryFactors: string[];
    mitigationStrategies: string[];
  };
  engagementRisk: {
    probability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    primaryFactors: string[];
    mitigationStrategies: string[];
  };
  valueRisk: {
    probability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    primaryFactors: string[];
    mitigationStrategies: string[];
  };
}

export interface EngagementAnalysis {
  overallEngagement: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEPTIONAL';
    score: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    benchmarkPercentile: number;
  };
  channelEngagement: {
    channel: string;
    engagementRate: number;
    responseRate: number;
    lastActivity: string;
  }[];
  campaignEngagement: {
    totalCampaigns: number;
    responseRate: number;
    averageResponseTime: number;
    preferredCampaignType: string;
  };
  loyaltyEngagement: {
    participationRate: number;
    pointsEarningRate: number;
    redemptionRate: number;
    tierProgression: 'ASCENDING' | 'STABLE' | 'DECLINING';
  };
}

export interface PredictionModels {
  nextVisitPrediction: {
    predictedDate: string;
    confidence: number;
    factors: string[];
  };
  spendingPrediction: {
    nextVisitAmount: number;
    monthlySpending: number;
    yearlySpending: number;
    confidence: number;
  };
  lifetimeValuePrediction: {
    predictedLTV: number;
    confidence: number;
    timeHorizon: string;
    factors: string[];
  };
  churnPrediction: {
    churnProbability: number;
    timeToChurn: string;
    confidence: number;
    preventionActions: string[];
  };
}

export interface HealthHistory {
  date: string;
  healthScore: number;
  components: HealthScoreComponents;
  significantChanges: {
    component: string;
    change: number;
    reason: string;
  }[];
  alerts: {
    type: 'IMPROVEMENT' | 'DECLINE' | 'MILESTONE' | 'RISK';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
}

export interface HealthInsights {
  criticalAlerts: {
    alert: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    actionRequired: string;
    deadline: string;
  }[];
  opportunities: {
    opportunity: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    suggestedAction: string;
  }[];
  recommendations: {
    recommendation: string;
    category: 'RETENTION' | 'ENGAGEMENT' | 'UPSELL' | 'CROSS_SELL';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedImpact: number;
  }[];
}

export interface CustomerHealthScore {
  customerId: string;
  customer: Customer;
  healthScore: number;
  healthLevel: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  components: HealthScoreComponents;
  riskAssessment: RiskAssessment;
  engagementAnalysis: EngagementAnalysis;
  predictionModels: PredictionModels;
  healthHistory: HealthHistory[];
  insights: HealthInsights;
  benchmarkComparison: {
    segmentAverage: number;
    industryAverage: number;
    topPerformerAverage: number;
    percentileRank: number;
  };
  lastCalculated: string;
  nextCalculation: string;
} 