'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../../../../contexts/NotificationContext';
import { getToken } from '../../../../../services/authService';
import { NotificationType, NotificationPriority } from '../../../../../../shared/types';
import { formatDate, formatCurrency } from '../../../../../utils/dateUtils';

// Interfaces
interface CampaignDelivery {
  id: string;
  recipientName: string;
  recipientPhone: string;
  deliveryStatus: string;
  messageContent: string;
  personalizedContent: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  messageCost: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    segment: string;
  };
}

interface CampaignDetails {
  id: string;
  name: string;
  description: string | null;
  campaignType: string;
  status: string;
  targetSegment: {
    segments?: string[];
    tiers?: string[];
    allowMarketing?: boolean;
    status?: string;
  };
  templateContent: string;
  templateVariables: Record<string, unknown>;
  scheduledDate: string | null;
  sentDate?: string | null;
  createdAt: string;
  updatedAt: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  messagesOpened: number;
  actualCost: number;
  costPerMessage: number;
  estimatedRecipients: number;
  estimatedCost?: number;
  deliveries: CampaignDelivery[];
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface CampaignPerformance {
  campaignId: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  messagesOpened: number;
  deliveryRate: number;
  openRate: number;
  failureRate: number;
  totalCost: number;
  costPerMessage: number;
  avgDeliveryTime: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// Status mapping
const statusMap: Record<string, string> = {
  'DRAFT': 'پیش‌نویس',
  'SCHEDULED': 'زمان‌بندی شده',
  'SENDING': 'در حال ارسال',
  'SENT': 'ارسال شده',
  'COMPLETED': 'تکمیل شده',
  'CANCELLED': 'لغو شده',
  'FAILED': 'ناموفق'
};

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [performance, setPerformance] = useState<CampaignPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'performance'>('overview');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'sent' | 'failed' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  
  const router = useRouter();
  const { addNotification } = useNotifications();

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات کمپین');
      }

      const data = await response.json();
      setCampaign(data.campaign);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات کمپین';
      setError(errorMessage);
      addNotification({
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        title: 'خطا',
        message: errorMessage,
        data: {}
      });
    } finally {
      setLoading(false);
    }
  }, [params.id, addNotification]);

  const fetchPerformance = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${params.id}/performance`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('خطا در دریافت آمار کمپین');
      }

      const data = await response.json();
      setPerformance(data.performance);
    } catch (err) {
      console.error('Error fetching performance:', err);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCampaign();
    fetchPerformance();
  }, [fetchCampaign, fetchPerformance]);

  const handleSendCampaign = async () => {
    if (!campaign) return;

    try {
      setSending(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${campaign.id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('خطا در ارسال کمپین');
      }

      const data = await response.json();
      
      addNotification({
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.HIGH,
        title: 'موفقیت',
        message: data.message,
        data: {}
      });

      setCampaign(prev => prev ? { ...prev, status: 'SENDING' } : null);
      
      // Refresh data after sending
      setTimeout(() => {
        fetchCampaign();
        fetchPerformance();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ارسال کمپین';
      addNotification({
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        title: 'خطا',
        message: errorMessage,
        data: {}
      });
    } finally {
      setSending(false);
    }
  };

  const filteredDeliveries = campaign?.deliveries?.filter((delivery: CampaignDelivery) => {
    const matchesFilter = 
      deliveryFilter === 'all' || 
      (deliveryFilter === 'sent' && delivery.deliveryStatus === 'SENT') ||
      (deliveryFilter === 'failed' && delivery.deliveryStatus === 'FAILED') ||
      (deliveryFilter === 'delivered' && delivery.deliveryStatus === 'DELIVERED');

    const matchesSearch = !searchQuery || 
      delivery.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.recipientPhone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'SENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'SENT': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'SENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'SENT': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getDeliveryStatusText = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'در صف';
      case 'SENDING': return 'در حال ارسال';
      case 'SENT': return 'ارسال شده';
      case 'DELIVERED': return 'تحویل شده';
      case 'FAILED': return 'ناموفق';
      default: return status;
    }
  };

  const getCampaignTypeText = (type: string) => {
    switch (type) {
      case 'SMS': return 'پیامک';
      case 'EMAIL': return 'ایمیل';
      case 'PUSH': return 'اعلان';
      case 'INSTAGRAM': return 'اینستاگرام';
      default: return type;
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS': return '📱';
      case 'EMAIL': return '📧';
      case 'PUSH': return '🔔';
      case 'INSTAGRAM': return '📸';
      default: return '📤';
    }
  };

  const getSegmentText = (segment: string) => {
    switch (segment) {
      case 'NEW': return 'جدید';
      case 'OCCASIONAL': return 'گاه‌به‌گاه';
      case 'REGULAR': return 'منظم';
      case 'VIP': return 'ویژه';
      default: return segment;
    }
  };

  const getTierText = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'برنز';
      case 'SILVER': return 'نقره';
      case 'GOLD': return 'طلا';
      case 'PLATINUM': return 'پلاتین';
      default: return tier;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">کمپین یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/workspaces/customer-relationship-management/campaigns')}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              بازگشت
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl">{getCampaignTypeIcon(campaign.campaignType)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getCampaignTypeText(campaign.campaignType)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {statusMap[campaign.status]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
              <button
                onClick={handleSendCampaign}
                disabled={sending}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    ارسال کمپین
                  </>
                )}
              </button>
            )}
            <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              ویرایش
            </button>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ارسال شده</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.messagesSent.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="text-3xl">📤</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">تحویل شده</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.messagesDelivered.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">باز شده</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.messagesOpened.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="text-3xl">👀</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">هزینه کل</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(campaign.actualCost)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            نمای کلی
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deliveries'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            تحویل پیام‌ها
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            عملکرد
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">جزئیات کمپین</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ ایجاد:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">آخرین بروزرسانی:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.updatedAt)}</p>
                  </div>
                </div>
                
                {campaign.description && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">توضیحات:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{campaign.description}</p>
                  </div>
                )}

                {campaign.scheduledDate && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">زمان‌بندی:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.scheduledDate)}</p>
                  </div>
                )}

                {campaign.sentDate && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ ارسال:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.sentDate)}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ایجاد کننده:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{campaign.createdByUser.name}</p>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">محتوای پیام</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{campaign.templateContent}</p>
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">مخاطبان هدف</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">تعداد مخاطبان:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{campaign.estimatedRecipients.toLocaleString('fa-IR')}</p>
                </div>

                {campaign.targetSegment.segments && campaign.targetSegment.segments.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">بخش‌های مشتری:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {campaign.targetSegment.segments.map((segment: string) => (
                        <span key={segment} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-800 dark:text-blue-200">
                          {getSegmentText(segment)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {campaign.targetSegment.tiers && campaign.targetSegment.tiers.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">سطح وفاداری:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {campaign.targetSegment.tiers.map((tier: string) => (
                        <span key={tier} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full dark:bg-yellow-800 dark:text-yellow-200">
                          {getTierText(tier)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات هزینه</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">هزینه هر پیام:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(campaign.costPerMessage)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">هزینه برآورد شده:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {campaign.estimatedCost ? formatCurrency(campaign.estimatedCost) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">هزینه واقعی:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(campaign.actualCost)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="جستجو در نام یا شماره تلفن..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value as 'all' | 'sent' | 'failed' | 'delivered')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="sent">ارسال شده</option>
                  <option value="delivered">تحویل شده</option>
                  <option value="failed">ناموفق</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    مخاطب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    تاریخ ارسال
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    هزینه
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    جزئیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {delivery.recipientName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {delivery.recipientPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(delivery.deliveryStatus)}`}>
                        {getDeliveryStatusText(delivery.deliveryStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {delivery.sentAt ? formatDate(delivery.sentAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(delivery.messageCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {delivery.errorMessage ? (
                        <span className="text-red-600 dark:text-red-400" title={delivery.errorMessage}>
                          خطا
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDeliveries.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">هیچ تحویل پیامی یافت نشد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'performance' && performance && (
        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">نرخ تحویل</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.deliveryRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">نرخ باز کردن</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.openRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">نرخ خطا</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.failureRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">متوسط زمان تحویل</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.avgDeliveryTime.toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Top Failure Reasons */}
          {performance.topFailureReasons.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">دلایل اصلی خطا</h3>
              <div className="space-y-3">
                {performance.topFailureReasons.map((reason: { reason: string; count: number }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-white">{reason.reason}</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {reason.count.toLocaleString('fa-IR')} مورد
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 