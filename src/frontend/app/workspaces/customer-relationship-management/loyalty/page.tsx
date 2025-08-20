'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  getLoyaltyStatistics, 
  getLoyaltyTransactions, 
  addLoyaltyPoints, 
  redeemLoyaltyPoints,
  AddPointsData,
  RedeemPointsData,
  LoyaltyTransactionFilter
} from '../../../../services/loyaltyService';
import { getCustomers } from '../../../../services/customerService';
import { 
  LoyaltyStatistics, 
  LoyaltyTransaction, 
  Customer 
} from '../../../../types/crm';

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<LoyaltyStatistics | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'manage'>('overview');
  
  // Filters
  const [filters, setFilters] = useState<LoyaltyTransactionFilter>({
    page: 1,
    limit: 20
  });

  // Forms
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [showRedeemPointsModal, setShowRedeemPointsModal] = useState(false);
  const [addPointsForm, setAddPointsForm] = useState<AddPointsData>({
    customerId: '',
    points: 0,
    description: '',
    transactionType: 'EARNED_BONUS'
  });
  const [redeemPointsForm, setRedeemPointsForm] = useState<RedeemPointsData>({
    customerId: '',
    pointsToRedeem: 0,
    description: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching loyalty data...');
      
      const [statsData, transactionsData, customersData] = await Promise.all([
        getLoyaltyStatistics().catch(error => {
          console.error('Error fetching statistics:', error);
          return {
            totalPointsIssued: 0,
            totalPointsRedeemed: 0,
            activePoints: 0,
            averagePointsPerCustomer: 0,
            topLoyaltyCustomers: [],
            monthlyTrends: [],
            tierDistribution: {}
          };
        }),
        getLoyaltyTransactions(filters).catch(error => {
          console.error('Error fetching transactions:', error);
          return { transactions: [], pagination: { total: 0, pages: 0 } };
        }),
        getCustomers({ limit: 100 }).catch(error => {
          console.error('Error fetching customers:', error);
          return { customers: [] };
        })
      ]);
      
      console.log('Statistics data received:', statsData);
      setStatistics(statsData);
      setTransactions(transactionsData.transactions || []);
      setCustomers(customersData.customers || []);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      // Set default values to prevent runtime errors
      setStatistics({
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        activePoints: 0,
        averagePointsPerCustomer: 0,
        topLoyaltyCustomers: [],
        monthlyTrends: [],
        tierDistribution: {}
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLoyaltyPoints(addPointsForm);
      setShowAddPointsModal(false);
      setAddPointsForm({
        customerId: '',
        points: 0,
        description: '',
        transactionType: 'EARNED_BONUS'
      });
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در افزودن امتیاز';
      alert(errorMessage);
    }
  };

  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await redeemLoyaltyPoints(redeemPointsForm);
      setShowRedeemPointsModal(false);
      setRedeemPointsForm({
        customerId: '',
        pointsToRedeem: 0,
        description: ''
      });
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در استفاده از امتیاز';
      alert(errorMessage);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'EARNED_PURCHASE': 'کسب از خرید',
      'EARNED_BONUS': 'جایزه',
      'EARNED_REFERRAL': 'معرفی',
      'EARNED_BIRTHDAY': 'تولد',
      'REDEEMED_DISCOUNT': 'استفاده تخفیف',
      'REDEEMED_ITEM': 'استفاده کالا',
      'ADJUSTMENT_ADD': 'تعدیل افزایش',
      'ADJUSTMENT_SUBTRACT': 'تعدیل کاهش',
      'EXPIRED': 'منقضی شده'
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string): string => {
    if (type.startsWith('EARNED') || type === 'ADJUSTMENT_ADD') {
      return 'text-green-600 dark:text-green-400';
    } else if (type.startsWith('REDEEMED') || type === 'ADJUSTMENT_SUBTRACT' || type === 'EXPIRED') {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">برنامه وفاداری</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت امتیازات و پاداش‌های مشتریان
          </p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={() => setShowAddPointsModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            افزودن امتیاز
          </button>
          <button
            onClick={() => setShowRedeemPointsModal(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            استفاده امتیاز
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {[
            { id: 'overview', label: 'نمای کلی', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'transactions', label: 'تراکنش‌ها', icon: 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 7h10' },
            { id: 'manage', label: 'مدیریت', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'transactions' | 'manage')}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <svg className={`ml-2 -mr-0.5 h-5 w-5 ${
                activeTab === tab.id ? 'text-green-500 dark:text-green-400' : 'text-gray-400 group-hover:text-gray-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && statistics && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل امتیازات صادر شده</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(statistics?.totalPointsIssued || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل امتیازات استفاده شده</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(statistics?.totalPointsRedeemed || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">امتیازات فعال</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(statistics?.activePoints || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">میانگین امتیاز هر مشتری</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(statistics?.averagePointsPerCustomer || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Loyalty Customers */}
          {statistics.topLoyaltyCustomers && statistics.topLoyaltyCustomers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">برترین مشتریان وفادار</h3>
              <div className="space-y-4">
                {statistics.topLoyaltyCustomers.slice(0, 5).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-yellow-600' : 'bg-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="mr-3">
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400" dir="ltr">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(customer.loyalty?.currentPoints || 0).toLocaleString('fa-IR')} امتیاز
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.loyalty?.tierLevel || 'برنز'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مشتری
                </label>
                <select
                  value={filters.customerId || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                >
                  <option value="">همه مشتریان</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع تراکنش
                </label>
                <select
                  value={filters.transactionType || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                >
                  <option value="">همه تراکنش‌ها</option>
                  <option value="EARNED_PURCHASE">کسب از خرید</option>
                  <option value="EARNED_BONUS">جایزه</option>
                  <option value="EARNED_REFERRAL">معرفی</option>
                  <option value="EARNED_BIRTHDAY">تولد</option>
                  <option value="REDEEMED_DISCOUNT">استفاده تخفیف</option>
                  <option value="REDEEMED_ITEM">استفاده کالا</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاریخ
                </label>
                <div className="flex space-x-2 space-x-reverse">
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مشتری
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      نوع تراکنش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      امتیاز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      توضیحات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      تاریخ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-medium">{transaction.customer?.name}</div>
                          <div className="text-gray-500 dark:text-gray-400" dir="ltr">
                            {transaction.customer?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getTransactionTypeLabel(transaction.transactionType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.pointsChange > 0 ? '+' : ''}{transaction.pointsChange.toLocaleString('fa-IR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {transaction.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">اعمال سریع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setShowAddPointsModal(true)}
                className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <svg className="w-8 h-8 mx-auto text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm font-medium text-gray-900 dark:text-white">افزودن امتیاز</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">اعطای امتیاز دستی به مشتری</p>
              </button>

              <button
                onClick={() => setShowRedeemPointsModal(true)}
                className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-8 h-8 mx-auto text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <p className="text-sm font-medium text-gray-900 dark:text-white">استفاده امتیاز</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">استفاده دستی امتیاز مشتری</p>
              </button>

              <Link
                href="/workspaces/customer-relationship-management/customers"
                className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <svg className="w-8 h-8 mx-auto text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900 dark:text-white">مدیریت مشتریان</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">مشاهده و ویرایش اطلاعات مشتریان</p>
              </Link>
            </div>
          </div>

          {/* Tier Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">سطوح وفاداری</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { tier: 'BRONZE', label: 'برنز', color: 'from-yellow-600 to-yellow-700', multiplier: 1, discount: 0 },
                { tier: 'SILVER', label: 'نقره', color: 'from-gray-400 to-gray-500', multiplier: 1.25, discount: 5 },
                { tier: 'GOLD', label: 'طلا', color: 'from-yellow-400 to-yellow-500', multiplier: 1.5, discount: 10 },
                { tier: 'PLATINUM', label: 'پلاتین', color: 'from-purple-400 to-purple-500', multiplier: 2, discount: 15 }
              ].map((tier) => (
                <div key={tier.tier} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-lg flex items-center justify-center mb-3`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{tier.label}</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>ضریب امتیاز: {tier.multiplier}x</p>
                    <p>تخفیف: {tier.discount}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {showAddPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">افزودن امتیاز</h3>
            <form onSubmit={handleAddPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مشتری
                </label>
                <select
                  value={addPointsForm.customerId}
                  onChange={(e) => setAddPointsForm(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  dir="rtl"
                >
                  <option value="">انتخاب مشتری...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تعداد امتیاز
                </label>
                <input
                  type="number"
                  value={addPointsForm.points}
                  onChange={(e) => setAddPointsForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <input
                  type="text"
                  value={addPointsForm.description}
                  onChange={(e) => setAddPointsForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  dir="rtl"
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowAddPointsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  افزودن امتیاز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Points Modal */}
      {showRedeemPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">استفاده از امتیاز</h3>
            <form onSubmit={handleRedeemPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مشتری
                </label>
                <select
                  value={redeemPointsForm.customerId}
                  onChange={(e) => setRedeemPointsForm(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  dir="rtl"
                >
                  <option value="">انتخاب مشتری...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone}) - {customer.loyalty?.currentPoints || 0} امتیاز
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تعداد امتیاز برای استفاده
                </label>
                <input
                  type="number"
                  value={redeemPointsForm.pointsToRedeem}
                  onChange={(e) => setRedeemPointsForm(prev => ({ ...prev, pointsToRedeem: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <input
                  type="text"
                  value={redeemPointsForm.description}
                  onChange={(e) => setRedeemPointsForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  dir="rtl"
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowRedeemPointsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  استفاده امتیاز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 