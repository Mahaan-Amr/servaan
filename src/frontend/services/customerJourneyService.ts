import { 
  CustomerJourneyMap, 
  CustomerJourneyResponse, 
  JourneySummaryResponse, 
  TouchpointsResponse, 
  NextActionsResponse, 
  StageHistoryResponse, 
  BehaviorPatternsResponse 
} from '../types/customerJourney';
import { formatCurrency as formatCurrencyUtil } from '../../shared/utils/currencyUtils';

const API_BASE_URL = '/api/customer-journey';

/**
 * Get comprehensive customer journey map
 */
export async function getCustomerJourneyMap(customerId: string): Promise<CustomerJourneyMap> {
  try {
    const response = await fetch(`${API_BASE_URL}/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CustomerJourneyResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch customer journey map');
    }

    // Convert date strings to Date objects
    const journeyMap = {
      ...data.data,
      stageHistory: data.data.stageHistory.map(stage => ({
        ...stage,
        stageStart: new Date(stage.stageStart),
        stageEnd: stage.stageEnd ? new Date(stage.stageEnd) : undefined,
        keyTouchpoints: stage.keyTouchpoints.map(tp => ({
          ...tp,
          timestamp: new Date(tp.timestamp)
        }))
      })),
      touchpointTimeline: data.data.touchpointTimeline.map(tp => ({
        ...tp,
        timestamp: new Date(tp.timestamp)
      }))
    };

    return journeyMap;
  } catch (error) {
    console.error('Error fetching customer journey map:', error);
    throw new Error('خطا در دریافت نقشه مسیر مشتری');
  }
}

/**
 * Get journey summary for multiple customers
 */
export async function getCustomerJourneySummary(customerIds: string[]): Promise<JourneySummaryResponse['data']> {
  try {
    const response = await fetch(`${API_BASE_URL}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ customerIds })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: JourneySummaryResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch customer journey summaries');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching customer journey summaries:', error);
    throw new Error('خطا در دریافت خلاصه مسیر مشتریان');
  }
}

/**
 * Get customer touchpoints timeline
 */
export async function getCustomerTouchpoints(
  customerId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<TouchpointsResponse['data']> {
  try {
    const response = await fetch(`${API_BASE_URL}/${customerId}/touchpoints?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TouchpointsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch customer touchpoints');
    }

    // Convert date strings to Date objects
    return {
      ...data.data,
      touchpoints: data.data.touchpoints.map(tp => ({
        ...tp,
        timestamp: new Date(tp.timestamp)
      }))
    };
  } catch (error) {
    console.error('Error fetching customer touchpoints:', error);
    throw new Error('خطا در دریافت نقاط تماس مشتری');
  }
}

/**
 * Get next best actions for customer
 */
export async function getCustomerNextActions(customerId: string): Promise<NextActionsResponse['data']> {
  try {
    const response = await fetch(`${API_BASE_URL}/${customerId}/next-actions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NextActionsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch customer next actions');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching customer next actions:', error);
    throw new Error('خطا در دریافت پیشنهادات مشتری');
  }
}

/**
 * Get customer journey stage history
 */
export async function getCustomerStageHistory(customerId: string): Promise<StageHistoryResponse['data']> {
  try {
    const response = await fetch(`${API_BASE_URL}/${customerId}/stages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: StageHistoryResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch customer stage history');
    }

    // Convert date strings to Date objects
    return {
      ...data.data,
      stageHistory: data.data.stageHistory.map(stage => ({
        ...stage,
        stageStart: new Date(stage.stageStart),
        stageEnd: stage.stageEnd ? new Date(stage.stageEnd) : undefined,
        keyTouchpoints: stage.keyTouchpoints.map(tp => ({
          ...tp,
          timestamp: new Date(tp.timestamp)
        }))
      }))
    };
  } catch (error) {
    console.error('Error fetching customer stage history:', error);
    throw new Error('خطا در دریافت تاریخچه مراحل مشتری');
  }
}

/**
 * Get customer behavior patterns
 */
export async function getCustomerBehaviorPatterns(customerId: string): Promise<BehaviorPatternsResponse['data']> {
  try {
    const response = await fetch(`${API_BASE_URL}/${customerId}/behavior-patterns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BehaviorPatternsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch customer behavior patterns');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching customer behavior patterns:', error);
    throw new Error('خطا در دریافت الگوهای رفتاری مشتری');
  }
}

/**
 * Helper function to get stage color
 */
export function getStageColor(stage: string): string {
  const colors = {
    AWARENESS: 'blue',
    CONSIDERATION: 'indigo',
    FIRST_VISIT: 'purple',
    ONBOARDING: 'pink',
    ENGAGEMENT: 'green',
    LOYALTY: 'emerald',
    ADVOCACY: 'teal',
    AT_RISK: 'orange',
    CHURNED: 'red',
    REACTIVATION: 'cyan'
  };
  return colors[stage as keyof typeof colors] || 'gray';
}

/**
 * Helper function to get health color
 */
export function getHealthColor(health: string): string {
  const colors = {
    HEALTHY: 'green',
    AT_RISK: 'yellow',
    CRITICAL: 'red'
  };
  return colors[health as keyof typeof colors] || 'gray';
}

/**
 * Helper function to get priority color
 */
export function getPriorityColor(priority: string): string {
  const colors = {
    HIGH: 'red',
    MEDIUM: 'yellow',
    LOW: 'green'
  };
  return colors[priority as keyof typeof colors] || 'gray';
}

/**
 * Helper function to get sentiment color
 */
export function getSentimentColor(sentiment: string): string {
  const colors = {
    POSITIVE: 'green',
    NEUTRAL: 'gray',
    NEGATIVE: 'red'
  };
  return colors[sentiment as keyof typeof colors] || 'gray';
}

/**
 * Helper function to format Persian date
 */
export function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Helper function to format Persian date and time
 */
export function formatPersianDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Helper function to calculate relative time
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'همین الان';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} دقیقه پیش`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ساعت پیش`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} روز پیش`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ماه پیش`;
  }
}

/**
 * Helper function to get touchpoint icon
 */
export function getTouchpointIcon(touchpointType: string): string {
  const icons = {
    SMS_OUTBOUND: '📱',
    SMS_INBOUND: '📱',
    VISIT: '🏠',
    FEEDBACK: '⭐',
    LOYALTY_EARN: '🎁',
    LOYALTY_REDEEM: '🛒',
    CAMPAIGN: '📢',
    BIRTHDAY: '🎂',
    ANNIVERSARY: '❤️',
    REFERRAL: '👥'
  };
  return icons[touchpointType as keyof typeof icons] || '📋';
}

/**
 * Helper function to format currency
 * @deprecated Use CurrencyUtils.format instead
 */
export function formatCurrency(amount: number): string {
  return formatCurrencyUtil(amount);
}

/**
 * Helper function to get action type icon
 */
export function getActionTypeIcon(actionType: string): string {
  const icons = {
    ENGAGEMENT: '🤝',
    RETENTION: '🔒',
    UPSELL: '📈',
    RECOVERY: '🔄',
    REFERRAL: '👥'
  };
  return icons[actionType as keyof typeof icons] || '💡';
}

/**
 * Helper function to get critical moment icon
 */
export function getCriticalMomentIcon(momentType: string): string {
  const icons = {
    RISK_POINT: '⚠️',
    OPPORTUNITY: '✨',
    DECISION_POINT: '🎯'
  };
  return icons[momentType as keyof typeof icons] || '❓';
} 