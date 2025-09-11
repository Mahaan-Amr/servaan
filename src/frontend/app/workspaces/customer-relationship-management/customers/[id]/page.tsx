'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../../contexts/AuthContext';
import { getCustomerById } from '../../../../../services/customerService';
import { getCustomerVisitHistory } from '../../../../../services/visitService';
import { getCustomerLoyaltyDetails, addLoyaltyPoints, redeemLoyaltyPoints } from '../../../../../services/loyaltyService';
import { Customer, CustomerVisit, CustomerLoyalty, TierBenefits } from '../../../../../types/crm';
import CustomerAnalyticsDashboard from '../../../../../components/customer/CustomerAnalyticsDashboard';
import EnhancedCustomerProfileDashboard from '../../../../../components/customer/EnhancedCustomerProfileDashboard';
import CustomerHealthScoreDashboard from '../../../../../components/customer/CustomerHealthScoreDashboard';

interface LoyaltyData {
  loyalty: CustomerLoyalty;
  tierBenefits: TierBenefits;
  nextTierRequirements: {
    nextTier: string | null;
    progress: number;
    requirements: {
      lifetimeSpent: { required: number; current: number; remaining: number; progress: number };
      totalVisits: { required: number; current: number; remaining: number; progress: number };
      yearlySpent: { required: number; current: number; remaining: number; progress: number };
    } | null;
  };
}

interface VisitHistoryData {
  visits: CustomerVisit[];
  statistics: {
    totalVisits: number;
    totalSpent: number;
    averageOrderValue: number;
    lastVisitDate: string;
  };
  pagination: Record<string, unknown>;
}

interface SMSMessage {
  id: string;
  phoneNumber: string;
  message: string;
  messageType: string;
  status: string;
  sentAt: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string;
  customer?: {
    name: string;
  };
}

interface CustomerInsights {
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
}

export default function CustomerDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoyalty, setCustomerLoyalty] = useState<LoyaltyData | null>(null);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryData | null>(null);
  const [smsHistory, setSmsHistory] = useState<SMSMessage[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'loyalty' | 'communication' | 'analytics' | 'enhanced-profile' | 'health-score'>('overview');

  // Quick action states
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAction, setPointsAction] = useState<'add' | 'redeem'>('add');
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsDescription, setPointsDescription] = useState('');
  const [processingPoints, setProcessingPoints] = useState(false);

  // SMS states
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    if (!customerId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch customer basic info
      const customerData = await getCustomerById(customerId);
      setCustomer(customerData);

      // Fetch loyalty details if customer has loyalty program
      if (customerData.loyalty) {
        try {
          const loyaltyData = await getCustomerLoyaltyDetails(customerId) as unknown as LoyaltyData;
          setCustomerLoyalty(loyaltyData);
        } catch (loyaltyError) {
          console.warn('Could not fetch loyalty details:', loyaltyError);
        }
      }

      // Fetch visit history
      try {
        const visitData = await getCustomerVisitHistory(customerId) as unknown as VisitHistoryData;
        setVisitHistory(visitData);
      } catch (visitError) {
        console.warn('Could not fetch visit history:', visitError);
      }

      // Fetch SMS communication history
      try {
        const smsData = await fetch(`/api/sms/customer/${customerId}/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (smsData.ok) {
          const smsResult = await smsData.json();
          setSmsHistory(smsResult.messages || []);
        }
      } catch (smsError) {
        console.warn('Could not fetch SMS history:', smsError);
      }

      // Fetch customer insights and analytics
      try {
        const insightsData = await fetch(`/api/customers/${customerId}/insights`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (insightsData.ok) {
          const insights = await insightsData.json();
          setCustomerInsights(insights);
        } else {
          console.warn('Could not fetch customer insights from API');
          // Fallback to mock insights for demo
          setCustomerInsights(generateMockInsights(customerData));
        }
      } catch (insightsError) {
        console.warn('Could not fetch customer insights:', insightsError);
        // Fallback to mock insights for demo
        setCustomerInsights(generateMockInsights(customerData));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات مشتری';
      console.error('Error fetching customer data:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [customerId, user]);

  // Generate mock insights for demonstration
  const generateMockInsights = (customer: Customer): CustomerInsights => {
    const visitCount = customer.loyalty?.totalVisits || 0;
    const lifetimeSpent = customer.loyalty?.lifetimeSpent || 0;
    
    return {
      customerId: customer.id,
      riskScore: customer.segment === 'VIP' ? 5 : customer.segment === 'REGULAR' ? 15 : customer.segment === 'OCCASIONAL' ? 35 : 65,
      lifetimeValuePrediction: lifetimeSpent * 1.5,
      nextVisitPrediction: customer.segment === 'REGULAR' || customer.segment === 'VIP' ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      preferredVisitDays: ['شنبه', 'یکشنبه', 'پنج‌شنبه'],
      preferredVisitTimes: ['17:00-19:00', '20:00-22:00'],
      averageDaysBetweenVisits: customer.segment === 'VIP' ? 5 : customer.segment === 'REGULAR' ? 12 : 25,
      spendingTrend: lifetimeSpent > 5000000 ? 'INCREASING' : lifetimeSpent > 2000000 ? 'STABLE' : 'DECREASING',
      loyaltyEngagement: customer.loyalty?.currentPoints && customer.loyalty.currentPoints > 1000 ? 'HIGH' : 
        customer.loyalty?.currentPoints && customer.loyalty.currentPoints > 500 ? 'MEDIUM' : 'LOW',
      recommendedOffers: [
        'تخفیف ۱۰٪ برای سفارش بعدی',
        'منوی ویژه عضو برنزی',
        'نوشیدنی رایگان در بازدید بعدی'
      ],
      similarCustomers: ['احمد محمدی', 'فاطمه احمدی'],
      visitFrequencyScore: Math.min(visitCount * 10, 100),
      satisfactionScore: 85,
      churnProbability: customer.segment === 'NEW' ? 45 : customer.segment === 'OCCASIONAL' ? 25 : 8
    };
  };

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    if (phone.startsWith('+98')) {
      return phone.replace('+98', '0');
    }
    return phone;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('fa-IR') + ' ریال';
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'نامشخص';
    return new Date(dateString).toLocaleDateString('fa-IR') + ' ' + 
           new Date(dateString).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  const getSegmentBadgeColor = (segment: string): string => {
    switch (segment) {
      case 'VIP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'REGULAR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'OCCASIONAL': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'NEW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTierBadgeColor = (tier: string): string => {
    switch (tier) {
      case 'PLATINUM': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'SILVER': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'BRONZE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handlePointsAction = async () => {
    if (!customer || !pointsAmount || !pointsDescription) return;

    setProcessingPoints(true);
    try {
      const points = parseInt(pointsAmount);
      if (isNaN(points) || points <= 0) {
        throw new Error('مقدار امتیاز معتبر نیست');
      }

      if (pointsAction === 'add') {
        await addLoyaltyPoints({
          customerId: customer.id,
          points,
          description: pointsDescription,
          transactionType: 'ADJUSTMENT_ADD'
        });
      } else {
        await redeemLoyaltyPoints({
          customerId: customer.id,
          pointsToRedeem: points,
          description: pointsDescription
        });
      }

      // Refresh data
      await fetchCustomerData();
      
      // Reset form
      setShowPointsModal(false);
      setPointsAmount('');
      setPointsDescription('');
    } catch (error) {
      console.error('Error processing points:', error);
      alert(error instanceof Error ? error.message : 'خطا در پردازش امتیاز');
    } finally {
      setProcessingPoints(false);
    }
  };

  const handleSendSms = async () => {
    if (!customer || !smsMessage.trim()) return;

    setSendingSms(true);
    try {
      const response = await fetch('/api/sms/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: customer.phone,
          message: smsMessage,
          customerId: customer.id
        })
      });

      if (!response.ok) {
        throw new Error('خطا در ارسال پیامک');
      }

      // Refresh SMS history
      await fetchCustomerData();
      
      // Reset form
      setShowSmsModal(false);
      setSmsMessage('');
      alert('پیامک با موفقیت ارسال شد');
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert(error instanceof Error ? error.message : 'خطا در ارسال پیامک');
    } finally {
      setSendingSms(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
            {error || 'مشتری یافت نشد'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            ممکن است مشتری حذف شده باشد یا شناسه اشتباه باشد
          </p>
          <Link
            href="/workspaces/customer-relationship-management/customers"
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
          >
            بازگشت به فهرست مشتریان
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link
            href="/workspaces/customer-relationship-management/customers"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              عضو از {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:space-x-3 sm:space-x-reverse">
          <button
            onClick={() => setShowPointsModal(true)}
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="hidden sm:inline">مدیریت امتیاز</span>
            <span className="sm:hidden">امتیاز</span>
          </button>
          <Link
            href={`/workspaces/customer-relationship-management/visits/new?customerId=${customer.id}`}
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">ثبت بازدید</span>
            <span className="sm:hidden">بازدید</span>
          </Link>
          <Link
            href={`/workspaces/customer-relationship-management/customers/${customer.id}/edit`}
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">ویرایش</span>
            <span className="sm:hidden">ویرایش</span>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex overflow-x-auto space-x-4 sm:space-x-8 space-x-reverse">
          {[
            { id: 'overview', name: 'نمای کلی', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'visits', name: 'بازدیدها', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2' },
            { id: 'loyalty', name: 'برنامه وفاداری', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            { id: 'communication', name: 'ارتباطات', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
            { id: 'analytics', name: 'تحلیل‌ها', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'enhanced-profile', name: 'پروفایل پیشرفته', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'health-score', name: 'امتیاز سلامت', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'visits' | 'loyalty' | 'communication' | 'analytics' | 'enhanced-profile' | 'health-score')}
              className={`group inline-flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 ${
                  activeTab === tab.id ? 'text-pink-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">
                {tab.id === 'overview' ? 'کلی' :
                 tab.id === 'visits' ? 'بازدید' :
                 tab.id === 'loyalty' ? 'وفاداری' :
                 tab.id === 'communication' ? 'ارتباط' :
                 tab.id === 'analytics' ? 'تحلیل' :
                 tab.id === 'enhanced-profile' ? 'پروفایل' :
                 tab.id === 'health-score' ? 'سلامت' : tab.name}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">اطلاعات مشتری</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">نام کامل</dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{customer.name}</dd>
                  </div>
                  {customer.nameEnglish && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">نام انگلیسی</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white" dir="ltr">{customer.nameEnglish}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">شماره تلفن</dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white" dir="ltr">{formatPhoneNumber(customer.phone)}</dd>
                  </div>
                  {customer.email && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">ایمیل</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white" dir="ltr">{customer.email}</dd>
                    </div>
                  )}
                  {customer.birthday && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">تاریخ تولد</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{formatDate(customer.birthday)}</dd>
                    </div>
                  )}
                  {customer.anniversary && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">سالگرد</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{formatDate(customer.anniversary)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">بخش مشتری</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSegmentBadgeColor(customer.segment)}`}>
                        {customer.segment}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">روش تماس ترجیحی</dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{customer.preferredContactMethod}</dd>
                  </div>
                </div>
                {customer.notes && (
                  <div className="mt-4 sm:mt-6">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">یادداشت‌ها</dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{customer.notes}</dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Visit History */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">تاریخچه بازدیدها</h3>
                    <Link
                      href={`/workspaces/customer-relationship-management/visits?customerId=${customer.id}`}
                      className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 text-xs sm:text-sm font-medium"
                    >
                      مشاهده همه
                    </Link>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {visitHistory?.visits?.length ? (
                    <div className="space-y-4">
                      {visitHistory.visits.map((visit) => (
                        <div key={visit.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg gap-3 sm:gap-0">
                          <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            <div>
                              <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                بازدید #{visit.visitNumber}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(visit.visitDate)}
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                              {formatCurrency(visit.finalAmount)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {visit.itemCount} آیتم
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">هنوز هیچ بازدیدی ثبت نشده است</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Loyalty Program Details */}
              {customer.loyalty && customerLoyalty ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">جزئیات برنامه وفاداری</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {customer.loyalty.currentPoints.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">امتیاز فعلی</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {customer.loyalty.totalVisits.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل بازدیدها</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(customer.loyalty.lifetimeSpent)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل خرید</div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">سطح وفاداری</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(customer.loyalty.tierLevel)}`}>
                        {customer.loyalty.tierLevel}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">این مشتری در برنامه وفاداری عضو نیست</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="space-y-4 sm:space-y-6">
              {/* SMS Communication History */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">تاریخچه ارتباطات</h3>
                    <button
                      onClick={() => setShowSmsModal(true)}
                      className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 text-xs sm:text-sm font-medium"
                    >
                      ارسال پیامک جدید
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {smsHistory.length > 0 ? (
                    <div className="space-y-4">
                      {smsHistory.map((sms) => (
                        <div key={sms.id} className="flex items-start space-x-3 sm:space-x-4 space-x-reverse p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                              sms.status === 'SENT' ? 'bg-green-100 text-green-600' : 
                              sms.status === 'FAILED' ? 'bg-red-100 text-red-600' : 
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                {sms.messageType}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(sms.sentAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {sms.message}
                            </p>
                            <div className="mt-2 flex items-center space-x-3 sm:space-x-4 space-x-reverse">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(sms.status.toLowerCase())}`}>
                                {sms.status === 'SENT' ? 'ارسال شده' : 
                                 sms.status === 'FAILED' ? 'ناموفق' : 'در انتظار'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">هنوز هیچ پیامکی ارسال نشده است</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Communication Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">تنظیمات ارتباط</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">روش ترجیحی</dt>
                    <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white">{customer.preferredContactMethod}</dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">اجازه بازاریابی</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.allowMarketing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.allowMarketing ? 'مجاز' : 'غیرمجاز'}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Insights */}
              {customerInsights ? (
                <CustomerAnalyticsDashboard insights={customerInsights} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    تحلیل‌های مشتری
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    در حال پردازش داده‌ها برای ارائه تحلیل‌های دقیق...
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'enhanced-profile' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Enhanced Customer Profile */}
              {customer ? (
                <EnhancedCustomerProfileDashboard customerId={customer.id} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    پروفایل پیشرفته مشتری
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    در حال پردازش داده‌ها برای ارائه پروفایل پیشرفته...
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'health-score' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Health Score */}
              {customer ? (
                <CustomerHealthScoreDashboard customerId={customer.id} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    امتیاز سلامت مشتری
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    در حال پردازش داده‌ها برای ارائه امتیاز سلامت...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Customer Avatar & Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
              {customer.name.charAt(0)}
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1">{customer.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">{formatPhoneNumber(customer.phone)}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSegmentBadgeColor(customer.segment)}`}>
                {customer.segment}
              </span>
              {customer.loyalty && (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(customer.loyalty.tierLevel)}`}>
                  {customer.loyalty.tierLevel}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {visitHistory?.statistics && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">آمار کلی</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">تعداد بازدیدها</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {visitHistory.statistics.totalVisits.toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">کل خرید</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(visitHistory.statistics.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">میانگین خرید</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(visitHistory.statistics.averageOrderValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">آخرین بازدید</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(visitHistory.statistics.lastVisitDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">عملیات سریع</h3>
            <div className="space-y-2 sm:space-y-3">
              <Link
                href={`/workspaces/customer-relationship-management/visits/new?customerId=${customer.id}`}
                className="w-full inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ثبت بازدید جدید
              </Link>
              <button
                onClick={() => {
                  setPointsAction('add');
                  setShowPointsModal(true);
                }}
                className="w-full inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                افزودن امتیاز
              </button>
              <Link
                href={`/workspaces/customer-relationship-management/customers/${customer.id}/edit`}
                className="w-full inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base font-medium rounded-lg transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                ویرایش اطلاعات
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Points Management Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {pointsAction === 'add' ? 'افزودن امتیاز' : 'استفاده امتیاز'}
              </h3>
              <button
                onClick={() => setShowPointsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setPointsAction('add')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                    pointsAction === 'add'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  افزودن امتیاز
                </button>
                <button
                  onClick={() => setPointsAction('redeem')}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                    pointsAction === 'redeem'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  استفاده امتیاز
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مقدار امتیاز
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  placeholder="مثال: 100"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <input
                  type="text"
                  value={pointsDescription}
                  onChange={(e) => setPointsDescription(e.target.value)}
                  placeholder="دلیل تغییر امتیاز..."
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                />
              </div>

              <div className="flex space-x-2 sm:space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handlePointsAction}
                  disabled={processingPoints || !pointsAmount || !pointsDescription}
                  className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base font-medium transition-colors ${
                    pointsAction === 'add' 
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400' 
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                  }`}
                >
                  {processingPoints ? 'در حال پردازش...' : pointsAction === 'add' ? 'افزودن امتیاز' : 'استفاده امتیاز'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                ارسال پیامک به {customer.name}
              </h3>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره تلفن
                </label>
                <input
                  type="text"
                  value={formatPhoneNumber(customer.phone)}
                  disabled
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  متن پیامک
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="متن پیامک خود را وارد کنید..."
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={4}
                  dir="rtl"
                  maxLength={160}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {smsMessage.length}/160 کاراکتر
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.ceil(smsMessage.length / 70)} پیامک
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 sm:space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowSmsModal(false)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSendSms}
                  disabled={sendingSms || !smsMessage.trim()}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
                >
                  {sendingSms ? 'در حال ارسال...' : 'ارسال پیامک'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 