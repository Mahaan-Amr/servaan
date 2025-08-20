'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { NotificationType, NotificationPriority } from '../../../../../shared/types';
import { formatDate, formatCurrency } from '../../../../utils/dateUtils';

interface TargetSegment {
  segments?: string[];
  loyaltyTiers?: string[];
  minPoints?: number;
  maxPoints?: number;
  hasMarketingConsent?: boolean;
  status?: string;
  registrationDateFrom?: string;
  registrationDateTo?: string;
  lastVisitFrom?: string;
  lastVisitTo?: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaignType: 'SMS' | 'INSTAGRAM' | 'EMAIL' | 'PUSH';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  targetSegment: TargetSegment;
  templateContent: string;
  scheduledDate?: string;
  sentDate?: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  averageDeliveryRate: number;
  totalCost: number;
  campaignsByType: Record<string, number>;
  campaignsByStatus: Record<string, number>;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { campaignType: typeFilter })
      });

      const response = await fetch(`/api/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('خطا در دریافت کمپین‌ها');
      }

      const result = await response.json();
      
      if (result.success) {
        setCampaigns(result.campaigns);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.pages
        }));
      } else {
        throw new Error(result.message || 'خطا در دریافت کمپین‌ها');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت کمپین‌ها');
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, searchTerm, statusFilter, typeFilter]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/campaigns/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('خطا در دریافت آمار کمپین‌ها');
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchCampaigns();
    fetchAnalytics();
  }, [fetchCampaigns, fetchAnalytics]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSelectCampaign = (campaignId: string, selected: boolean) => {
    setSelectedCampaigns(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(campaignId);
      } else {
        newSelection.delete(campaignId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
    } else {
      setSelectedCampaigns(new Set());
    }
  };

  const handleDuplicateCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('خطا در کپی کردن کمپین');
      }

      const result = await response.json();
      
      if (result.success) {
        addNotification({
          type: NotificationType.SUCCESS,
          priority: NotificationPriority.MEDIUM,
          title: 'موفقیت',
          message: result.message,
          data: {}
        });
        fetchCampaigns();
      } else {
        throw new Error(result.message || 'خطا در کپی کردن کمپین');
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      addNotification({
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        title: 'خطا',
        message: error instanceof Error ? error.message : 'خطا در کپی کردن کمپین',
        data: {}
      });
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'SENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'SENT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'CANCELLED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'SMS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'EMAIL': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'PUSH': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INSTAGRAM': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مدیریت کمپین‌ها</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ایجاد و مدیریت کمپین‌های تبلیغاتی و اطلاع‌رسانی
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces/customer-relationship-management/campaigns/templates"
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            قالب‌ها
          </Link>
          
          <Link
            href="/workspaces/customer-relationship-management/campaigns/new"
            className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            کمپین جدید
          </Link>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">کل کمپین‌ها</h3>
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {analytics.totalCampaigns.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {analytics.activeCampaigns.toLocaleString('fa-IR')} فعال
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-green-700 dark:text-green-300">پیام‌های ارسالی</h3>
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
              {analytics.totalMessagesSent.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {analytics.totalMessagesDelivered.toLocaleString('fa-IR')} تحویل شده
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">نرخ تحویل</h3>
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {analytics.averageDeliveryRate.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              میانگین موفقیت
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300">هزینه کل</h3>
              <div className="p-2 bg-orange-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">
              {formatCurrency(analytics.totalCost)}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              کل هزینه‌ها
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                جستجوی کمپین
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام کمپین یا توضیحات..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وضعیت
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="DRAFT">پیش‌نویس</option>
                <option value="SCHEDULED">زمان‌بندی شده</option>
                <option value="SENDING">در حال ارسال</option>
                <option value="SENT">ارسال شده</option>
                <option value="COMPLETED">تکمیل شده</option>
                <option value="CANCELLED">لغو شده</option>
                <option value="FAILED">ناموفق</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع کمپین
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">همه انواع</option>
                <option value="SMS">پیامک</option>
                <option value="EMAIL">ایمیل</option>
                <option value="PUSH">پوش نوتیفیکیشن</option>
                <option value="INSTAGRAM">اینستاگرام</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
              >
                جستجو
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              کمپین‌ها ({pagination.total.toLocaleString('fa-IR')})
            </h3>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">انتخاب همه</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">خطا در بارگذاری</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => fetchCampaigns()}
                className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">کمپینی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                هنوز کمپینی ایجاد نشده است. اولین کمپین خود را شروع کنید.
              </p>
              <Link
                href="/workspaces/customer-relationship-management/campaigns/new"
                className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
              >
                کمپین جدید
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 rtl:space-x-reverse flex-1">
                      <div className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.has(campaign.id)}
                          onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-gray-300 text-pink-600 focus:ring-pink-500 focus:ring-2 transition-all"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {campaign.name}
                          </h3>
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(campaign.campaignType)}`}>
                            {campaign.campaignType}
                          </span>
                        </div>
                        
                        {campaign.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {campaign.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">ارسال شده:</span>
                            <span className="font-semibold text-gray-900 dark:text-white mr-2">
                              {campaign.messagesSent.toLocaleString('fa-IR')}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">تحویل شده:</span>
                            <span className="font-semibold text-gray-900 dark:text-white mr-2">
                              {campaign.messagesDelivered.toLocaleString('fa-IR')}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">ناموفق:</span>
                            <span className="font-semibold text-gray-900 dark:text-white mr-2">
                              {campaign.messagesFailed.toLocaleString('fa-IR')}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">هزینه:</span>
                            <span className="font-semibold text-gray-900 dark:text-white mr-2">
                              {campaign.actualCost ? formatCurrency(campaign.actualCost) : '-'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div>
                            ایجاد شده در {formatDate(campaign.createdAt)} توسط {campaign.createdByUser.name}
                          </div>
                          {campaign.scheduledDate && (
                            <div>
                              زمان‌بندی: {formatDate(campaign.scheduledDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/workspaces/customer-relationship-management/campaigns/${campaign.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      >
                        مشاهده
                      </Link>
                      
                      <button
                        onClick={() => handleDuplicateCampaign(campaign.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                      >
                        کپی
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                نمایش {((pagination.page - 1) * pagination.limit + 1).toLocaleString('fa-IR')} تا{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('fa-IR')} از{' '}
                {pagination.total.toLocaleString('fa-IR')} کمپین
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  قبلی
                </button>
                
                <span className="px-4 py-2 text-sm bg-pink-600 text-white rounded-lg">
                  {pagination.page.toLocaleString('fa-IR')}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 