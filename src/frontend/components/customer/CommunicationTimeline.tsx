import React, { useState, useEffect, useCallback } from 'react';

interface CommunicationHistory {
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
  metadata?: Record<string, unknown>;
}

interface CommunicationSummary {
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

interface FollowUpSuggestion {
  id: string;
  customerId: string;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'VISIT_REMINDER' | 'LOYALTY_REWARD' | 'FEEDBACK_REQUEST' | 'CAMPAIGN_FOLLOW_UP';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedChannel: 'SMS' | 'EMAIL' | 'PHONE' | 'WHATSAPP';
  suggestedContent: string;
  suggestedTime: Date;
  reason: string;
  isAutomated: boolean;
  triggerData?: Record<string, unknown>;
}

interface CommunicationTimelineProps {
  customerId: string;
}

export default function CommunicationTimeline({ customerId }: CommunicationTimelineProps) {
  const [history, setHistory] = useState<CommunicationHistory[]>([]);
  const [summary, setSummary] = useState<CommunicationSummary | null>(null);
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunicationData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyResponse, suggestionsResponse] = await Promise.all([
        fetch(`/api/communication/customer/${customerId}/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`/api/communication/customer/${customerId}/suggestions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
        setSummary(historyData.summary || null);
      } else {
        console.warn('Could not fetch communication history');
      }

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData.suggestions || []);
      } else {
        console.warn('Could not fetch follow-up suggestions');
      }
    } catch (error) {
      console.error('Error fetching communication data:', error);
      setError('خطا در دریافت تاریخچه ارتباطات');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCommunicationData();
  }, [fetchCommunicationData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'VISIT':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'LOYALTY':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'FEEDBACK':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      case 'CAMPAIGN':
        return (
          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'SENT': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'LOW': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <p className="mr-3 text-gray-500 dark:text-gray-400">در حال بارگذاری تاریخچه ارتباطات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Communication Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalCommunications}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">کل ارتباطات</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.responseRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">نرخ پاسخ</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.engagementScore}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">امتیاز تعامل</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.preferredChannel}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">کانال ترجیحی</p>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">پیشنهادات پیگیری</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority === 'HIGH' ? 'بالا' : suggestion.priority === 'MEDIUM' ? 'متوسط' : 'کم'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{suggestion.suggestedChannel}</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-2">{suggestion.suggestedContent}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.reason}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(suggestion.suggestedTime)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Communication Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">تاریخچه ارتباطات</h3>
        </div>
        <div className="p-4">
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="flex items-start space-x-4 space-x-reverse">
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.type === 'SMS' ? 'پیامک' : 
                           item.type === 'VISIT' ? 'بازدید' :
                           item.type === 'LOYALTY' ? 'امتیاز' :
                           item.type === 'FEEDBACK' ? 'نظر' :
                           item.type === 'CAMPAIGN' ? 'کمپین' : item.type}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status === 'DELIVERED' ? 'تحویل شده' :
                           item.status === 'SENT' ? 'ارسال شده' :
                           item.status === 'FAILED' ? 'ناموفق' :
                           item.status === 'PENDING' ? 'در انتظار' : item.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.direction === 'INBOUND' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.direction === 'INBOUND' ? 'دریافتی' : 'ارسالی'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.content}</p>
                    
                    {/* Show metadata for specific types */}
                    {item.metadata && (() => {
                      const paymentMethod = item.type === 'VISIT' && typeof item.metadata.paymentMethod === 'string' 
                        ? item.metadata.paymentMethod : null;
                      const phoneNumber = item.type === 'SMS' && typeof item.metadata.phoneNumber === 'string' 
                        ? item.metadata.phoneNumber : null;
                      
                      if (!paymentMethod && !phoneNumber) return null;
                      
                      return (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {paymentMethod && <span>روش پرداخت: {paymentMethod}</span>}
                          {phoneNumber && <span>شماره: {phoneNumber}</span>}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute right-4 mt-8 w-0.5 h-4 bg-gray-200 dark:bg-gray-600"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">هیچ تاریخچه ارتباطی یافت نشد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 