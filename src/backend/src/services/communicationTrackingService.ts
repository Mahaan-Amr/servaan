import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface CommunicationHistory {
  id: string;
  customerId: string;
  type: 'SMS' | 'CAMPAIGN' | 'VISIT' | 'LOYALTY' | 'FEEDBACK';
  channel: 'SMS' | 'EMAIL' | 'PHONE' | 'IN_PERSON' | 'WHATSAPP';
  direction: 'OUTBOUND' | 'INBOUND';
  content: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RESPONDED';
  timestamp: Date;
  relatedCampaignId?: string;
  relatedVisitId?: string;
  responseContent?: string;
  responseTimestamp?: Date;
  metadata?: Record<string, any>;
}

export interface CommunicationSummary {
  totalCommunications: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
  responseRate: number;
  lastCommunication: Date;
  averageResponseTime: number;
  engagementScore: number;
  communicationFrequency: number;
  preferredChannel: string;
  preferredTime: string;
}

export interface FollowUpSuggestion {
  id: string;
  customerId: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'VISIT_REMINDER' | 'LOYALTY_REWARD' | 'FEEDBACK_REQUEST' | 'CAMPAIGN_FOLLOW_UP';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedChannel: 'SMS' | 'EMAIL' | 'PHONE' | 'WHATSAPP';
  suggestedContent: string;
  suggestedTime: Date;
  reason: string;
  isAutomated: boolean;
  triggerData?: Record<string, any>;
}

/**
 * Get comprehensive communication history for a customer
 */
export async function getCustomerCommunicationHistory(
  customerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ history: CommunicationHistory[]; summary: CommunicationSummary }> {
  try {
    const [
      smsHistory,
      visits,
      loyaltyTransactions,
      feedback,
      campaigns
    ] = await Promise.all([
      prisma.smsHistory.findMany({
        where: { customerId },
        orderBy: { sentAt: 'desc' },
        take: limit
      }),
      prisma.customerVisit.findMany({
        where: { customerId },
        orderBy: { visitDate: 'desc' },
        take: limit
      }),
      prisma.loyaltyTransaction.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.customerFeedback.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      // Fix campaign query - remove targetSegment filtering since it's a complex JSON field
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ]);

    // Compile all communications into a unified timeline
    const communications: CommunicationHistory[] = [];

    // Add SMS communications
    smsHistory.forEach(sms => {
      communications.push({
        id: sms.id,
        customerId,
        type: 'SMS',
        channel: 'SMS',
        direction: 'OUTBOUND',
        content: sms.message,
        status: sms.status as any,
        timestamp: new Date(sms.sentAt || sms.createdAt),
        metadata: {
          phoneNumber: sms.phoneNumber,
          messageType: sms.messageType,
          deliveredAt: sms.deliveredAt,
          failedAt: sms.failedAt,
          errorMessage: sms.errorMessage
        }
      });
    });

    // Add visit communications
    visits.forEach(visit => {
      communications.push({
        id: visit.id,
        customerId,
        type: 'VISIT',
        channel: 'IN_PERSON',
        direction: 'INBOUND',
        content: `بازدید - مبلغ: ${visit.finalAmount?.toLocaleString()} تومان`,
        status: 'DELIVERED',
        timestamp: new Date(visit.visitDate),
        relatedVisitId: visit.id,
        metadata: {
          totalAmount: visit.totalAmount,
          finalAmount: visit.finalAmount,
          paymentMethod: visit.paymentMethod,
          serviceDuration: visit.serviceDuration,
          feedbackRating: visit.feedbackRating
        }
      });
    });

    // Add loyalty transaction communications - fix field names
    loyaltyTransactions.forEach(transaction => {
      communications.push({
        id: transaction.id,
        customerId,
        type: 'LOYALTY',
        channel: 'IN_PERSON',
        direction: transaction.transactionType?.includes('REDEEMED') ? 'INBOUND' : 'OUTBOUND',
        content: `${transaction.transactionType?.includes('EARNED') ? 'دریافت' : 'استفاده'} امتیاز: ${transaction.pointsChange} - ${transaction.description}`,
        status: 'DELIVERED',
        timestamp: new Date(transaction.createdAt),
        metadata: {
          transactionType: transaction.transactionType,
          pointsChange: transaction.pointsChange,
          description: transaction.description
        }
      });
    });

    // Add feedback communications - fix field names
    feedback.forEach(fb => {
      communications.push({
        id: fb.id,
        customerId,
        type: 'FEEDBACK',
        channel: 'IN_PERSON',
        direction: 'INBOUND',
        content: `نظر مشتری - امتیاز: ${fb.overallRating}/5 - ${fb.comment || 'بدون نظر'}`,
        status: 'DELIVERED',
        timestamp: new Date(fb.createdAt),
        metadata: {
          overallRating: fb.overallRating,
          comment: fb.comment,
          feedbackCategories: fb.feedbackCategories
        }
      });
    });

    // Add campaign communications - fix field names
    campaigns.forEach(campaign => {
      communications.push({
        id: campaign.id,
        customerId,
        type: 'CAMPAIGN',
        channel: 'SMS',
        direction: 'OUTBOUND',
        content: `کمپین: ${campaign.name} - ${campaign.templateContent}`,
        status: campaign.status as any,
        timestamp: new Date(campaign.createdAt),
        relatedCampaignId: campaign.id,
        metadata: {
          campaignName: campaign.name,
          campaignType: campaign.campaignType,
          targetSegment: campaign.targetSegment
        }
      });
    });

    // Sort by timestamp descending
    communications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedCommunications = communications.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = calculateCommunicationSummary(communications);

    return {
      history: paginatedCommunications,
      summary
    };

  } catch (error) {
    console.error('Error fetching communication history:', error);
    throw new AppError('خطا در دریافت تاریخچه ارتباطات', 500);
  }
}

/**
 * Calculate communication summary statistics
 */
function calculateCommunicationSummary(communications: CommunicationHistory[]): CommunicationSummary {
  const totalCommunications = communications.length;
  
  // Group by channel
  const byChannel = communications.reduce((acc, comm) => {
    acc[comm.channel] = (acc[comm.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by type
  const byType = communications.reduce((acc, comm) => {
    acc[comm.type] = (acc[comm.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate response rate (visits and feedback as responses)
  const outboundCommunications = communications.filter(c => c.direction === 'OUTBOUND').length;
  const inboundCommunications = communications.filter(c => c.direction === 'INBOUND').length;
  const responseRate = outboundCommunications > 0 ? (inboundCommunications / outboundCommunications) * 100 : 0;

  // Find last communication
  const lastCommunication = communications.length > 0 ? communications[0].timestamp : new Date();

  // Calculate average response time (simplified - time between outbound and next inbound)
  const averageResponseTime = calculateAverageResponseTime(communications);

  // Calculate engagement score (0-100)
  const engagementScore = calculateEngagementScore(communications);

  // Calculate communication frequency (communications per month)
  const communicationFrequency = calculateCommunicationFrequency(communications);

  // Find preferred channel
  const preferredChannel = Object.entries(byChannel)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'SMS';

  // Find preferred time (hour of day)
  const preferredTime = findPreferredTime(communications);

  return {
    totalCommunications,
    byChannel,
    byType,
    responseRate,
    lastCommunication,
    averageResponseTime,
    engagementScore,
    communicationFrequency,
    preferredChannel,
    preferredTime
  };
}

/**
 * Calculate average response time in hours
 */
function calculateAverageResponseTime(communications: CommunicationHistory[]): number {
  const responseTimes: number[] = [];
  
  for (let i = 0; i < communications.length - 1; i++) {
    const current = communications[i];
    const next = communications[i + 1];
    
    if (current.direction === 'INBOUND' && next.direction === 'OUTBOUND') {
      const responseTime = current.timestamp.getTime() - next.timestamp.getTime();
      responseTimes.push(responseTime / (1000 * 60 * 60)); // Convert to hours
    }
  }
  
  return responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;
}

/**
 * Calculate engagement score based on communication patterns
 */
function calculateEngagementScore(communications: CommunicationHistory[]): number {
  if (communications.length === 0) return 0;

  let score = 0;
  const recentCommunications = communications.slice(0, 10);
  
  // Points for variety of communication types
  const typeVariety = Object.keys(
    recentCommunications.reduce((acc, comm) => {
      acc[comm.type] = true;
      return acc;
    }, {} as Record<string, boolean>)
  ).length;
  score += typeVariety * 10;

  // Points for recent activity
  const daysSinceLastComm = (new Date().getTime() - communications[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastComm < 7) score += 30;
  else if (daysSinceLastComm < 30) score += 20;
  else if (daysSinceLastComm < 90) score += 10;

  // Points for feedback participation
  const feedbackCount = communications.filter(c => c.type === 'FEEDBACK').length;
  score += Math.min(feedbackCount * 5, 20);

  // Points for visit frequency
  const visitCount = communications.filter(c => c.type === 'VISIT').length;
  score += Math.min(visitCount * 2, 30);

  return Math.min(score, 100);
}

/**
 * Calculate communication frequency per month
 */
function calculateCommunicationFrequency(communications: CommunicationHistory[]): number {
  if (communications.length === 0) return 0;

  const oldestComm = communications[communications.length - 1];
  const monthsSinceFirst = Math.max(1, 
    (new Date().getTime() - oldestComm.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return communications.length / monthsSinceFirst;
}

/**
 * Find preferred communication time
 */
function findPreferredTime(communications: CommunicationHistory[]): string {
  const hourCounts = communications.reduce((acc, comm) => {
    const hour = comm.timestamp.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const preferredHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  return preferredHour ? `${preferredHour}:00` : '17:00';
}

/**
 * Generate automated follow-up suggestions
 */
export async function generateFollowUpSuggestions(customerId: string): Promise<FollowUpSuggestion[]> {
  try {
    const [customer, recentVisits, loyaltyStatus, recentCommunications] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        include: { loyalty: true }
      }),
      prisma.customerVisit.findMany({
        where: { customerId },
        orderBy: { visitDate: 'desc' },
        take: 5
      }),
      prisma.customerLoyalty.findUnique({
        where: { customerId }
      }),
      prisma.smsHistory.findMany({
        where: { customerId },
        orderBy: { sentAt: 'desc' },
        take: 10
      })
    ]);

    if (!customer) {
      throw new AppError('مشتری یافت نشد', 404);
    }

    const suggestions: FollowUpSuggestion[] = [];

    // Birthday reminder
    if (customer.birthday) {
      const birthday = new Date(customer.birthday);
      const nextBirthday = new Date();
      nextBirthday.setMonth(birthday.getMonth());
      nextBirthday.setDate(birthday.getDate());
      if (nextBirthday < new Date()) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      }

      const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilBirthday <= 7) {
        suggestions.push({
          id: `birthday-${customerId}`,
          customerId,
          type: 'BIRTHDAY',
          priority: 'HIGH',
          suggestedChannel: 'SMS',
          suggestedContent: `${customer.name} عزیز، تولدتان مبارک! 🎉 برای جشن تولد، تخفیف ویژه ۲۰٪ در انتظار شماست.`,
          suggestedTime: new Date(nextBirthday.getTime() - (24 * 60 * 60 * 1000)),
          reason: `تولد مشتری در ${daysUntilBirthday} روز آینده`,
          isAutomated: true,
          triggerData: { daysUntilBirthday }
        });
      }
    }

    // Visit reminder for inactive customers
    if (recentVisits.length > 0) {
      const lastVisit = recentVisits[0];
      const daysSinceLastVisit = Math.ceil((new Date().getTime() - new Date(lastVisit.visitDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastVisit >= 30) {
        suggestions.push({
          id: `visit-reminder-${customerId}`,
          customerId,
          type: 'VISIT_REMINDER',
          priority: daysSinceLastVisit > 60 ? 'HIGH' : 'MEDIUM',
          suggestedChannel: 'SMS',
          suggestedContent: `${customer.name} عزیز، دلتان برای طعم‌های خوشمزه ما تنگ نشده؟ منتظر دیدارتان هستیم! 😊`,
          suggestedTime: new Date(Date.now() + (24 * 60 * 60 * 1000)),
          reason: `عدم بازدید از ${daysSinceLastVisit} روز قبل`,
          isAutomated: true,
          triggerData: { daysSinceLastVisit }
        });
      }
    }

    // Loyalty reward notification
    if (loyaltyStatus && loyaltyStatus.currentPoints >= 1000) {
      suggestions.push({
        id: `loyalty-reward-${customerId}`,
        customerId,
        type: 'LOYALTY_REWARD',
        priority: 'MEDIUM',
        suggestedChannel: 'SMS',
        suggestedContent: `${customer.name} عزیز، شما ${loyaltyStatus.currentPoints} امتیاز دارید! از امتیازاتتان برای دریافت جایزه استفاده کنید.`,
        suggestedTime: new Date(Date.now() + (24 * 60 * 60 * 1000)),
        reason: `امتیاز بالا (${loyaltyStatus.currentPoints} امتیاز)`,
        isAutomated: true,
        triggerData: { currentPoints: loyaltyStatus.currentPoints }
      });
    }

    // Feedback request after visit
    if (recentVisits.length > 0) {
      const lastVisit = recentVisits[0];
      const daysSinceLastVisit = Math.ceil((new Date().getTime() - new Date(lastVisit.visitDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastVisit >= 2 && daysSinceLastVisit <= 7 && !lastVisit.feedbackRating) {
        suggestions.push({
          id: `feedback-request-${customerId}`,
          customerId,
          type: 'FEEDBACK_REQUEST',
          priority: 'LOW',
          suggestedChannel: 'SMS',
          suggestedContent: `${customer.name} عزیز، از بازدید شما متشکریم! لطفاً نظر خود را درباره سرویس ما بیان کنید.`,
          suggestedTime: new Date(Date.now() + (6 * 60 * 60 * 1000)),
          reason: `درخواست نظر پس از بازدید ${daysSinceLastVisit} روز قبل`,
          isAutomated: true,
          triggerData: { visitId: lastVisit.id, daysSinceLastVisit }
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  } catch (error) {
    console.error('Error generating follow-up suggestions:', error);
    throw new AppError('خطا در تولید پیشنهادات پیگیری', 500);
  }
}

/**
 * Track a new communication - Fix SmsHistory creation
 */
export async function trackCommunication(
  customerId: string,
  type: CommunicationHistory['type'],
  channel: CommunicationHistory['channel'],
  direction: CommunicationHistory['direction'],
  content: string,
  status: CommunicationHistory['status'],
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // In a real implementation, you would save this to a dedicated communications table
    // For now, we'll leverage existing tables based on type
    
    if (type === 'SMS') {
      // Need to get tenantId from the user who created the customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { createdByUser: { select: { tenantId: true } } }
      });

      if (!customer) {
        throw new AppError('مشتری یافت نشد', 404);
      }

      await prisma.smsHistory.create({
        data: {
          tenantId: customer.createdByUser.tenantId,
          customerId,
          phoneNumber: metadata?.phoneNumber || '',
          message: content,
          messageType: metadata?.messageType || 'PROMOTIONAL',
          status: status as any,
          sentAt: new Date(),
          createdAt: new Date()
        }
      });
    }
    
    // Add other communication types as needed
    
  } catch (error) {
    console.error('Error tracking communication:', error);
    throw new AppError('خطا در ثبت ارتباط', 500);
  }
}

/**
 * Get communication analytics for a customer
 */
export async function getCommunicationAnalytics(customerId: string): Promise<{
  responseRate: number;
  preferredChannel: string;
  peakEngagementTime: string;
  communicationTrends: Record<string, number>;
  engagementScore: number;
}> {
  try {
    const { history, summary } = await getCustomerCommunicationHistory(customerId, 100);
    
    // Calculate trends over time
    const trends = history.reduce((acc, comm) => {
      const month = comm.timestamp.toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      responseRate: summary.responseRate,
      preferredChannel: summary.preferredChannel,
      peakEngagementTime: summary.preferredTime,
      communicationTrends: trends,
      engagementScore: summary.engagementScore
    };

  } catch (error) {
    console.error('Error getting communication analytics:', error);
    throw new AppError('خطا در دریافت آمار ارتباطات', 500);
  }
} 
