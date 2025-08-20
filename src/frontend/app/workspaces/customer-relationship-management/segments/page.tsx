'use client';

import React, { useState, useEffect } from 'react';
import { 
  getSegmentAnalysis, 
  updateAllCustomerSegments, 
  getCustomersBySegment,
  getUpgradeableCustomers,
  createCustomSegment,
  SegmentationCriteria,
  SegmentRule
} from '../../../../services/crmService';
import { Customer } from '../../../../types/crm';

interface SegmentData {
  segmentDistribution: Record<string, { count: number; totalValue: number }>;
  recentMovements: Array<{
    customerName: string;
    currentSegment: string;
    suggestedSegment: string;
    segmentScore: number;
  }>;
  valueSegments: Array<{
    segment: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }>;
  activitySegments: Array<{
    segment: string;
    count: number;
    averageVisits: number;
    lastActivityDays: number;
  }>;
  insights: string[];
}

interface CustomerSegmentData {
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

function SegmentsPageContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP'>('NEW');
  const [segmentCustomers, setSegmentCustomers] = useState<Customer[]>([]);
  const [upgradeableCustomers, setUpgradeableCustomers] = useState<CustomerSegmentData[]>([]);
  const [showCustomSegmentModal, setShowCustomSegmentModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadSegmentData();
  }, []);

  const loadSegmentData = async () => {
    try {
      setLoading(true);
      const data = await getSegmentAnalysis();
      // Transform the data to match our SegmentData interface
      const transformedData: SegmentData = {
        segmentDistribution: data.segmentDistribution,
        recentMovements: data.recentMovements as Array<{
          customerName: string;
          currentSegment: string;
          suggestedSegment: string;
          segmentScore: number;
        }>,
        valueSegments: data.valueSegments as Array<{
          segment: string;
          count: number;
          totalValue: number;
          averageValue: number;
        }>,
        activitySegments: data.activitySegments as Array<{
          segment: string;
          count: number;
          averageVisits: number;
          lastActivityDays: number;
        }>,
        insights: data.insights
      };
      setSegmentData(transformedData);
    } catch (error) {
      console.error('Error loading segment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllSegments = async () => {
    try {
      setUpdateLoading(true);
      await updateAllCustomerSegments();
      await loadSegmentData(); // Reload data
    } catch (error) {
      console.error('Error updating segments:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const loadCustomersBySegment = async (segment: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP') => {
    try {
      const response = await getCustomersBySegment(segment, 1, 50);
      setSegmentCustomers(response.customers);
      setSelectedSegment(segment);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadUpgradeableCustomers = async (targetSegment: string) => {
    try {
      const customers = await getUpgradeableCustomers(targetSegment);
      setUpgradeableCustomers(customers);
    } catch (error) {
      console.error('Error loading upgradeable customers:', error);
    }
  };

  const segmentColors = {
    NEW: 'from-gray-500 to-gray-600',
    OCCASIONAL: 'from-blue-500 to-blue-600', 
    REGULAR: 'from-green-500 to-green-600',
    VIP: 'from-purple-500 to-purple-600'
  };

  const segmentLabels = {
    NEW: 'تازه وارد',
    OCCASIONAL: 'گاه‌وبیش',
    REGULAR: 'منظم',
    VIP: 'ویژه'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">بخش‌بندی مشتریان</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            تحلیل و دسته‌بندی مشتریان بر اساس رفتار خرید
          </p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={handleUpdateAllSegments}
            disabled={updateLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            {updateLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
            ) : (
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            بروزرسانی بخش‌بندی
          </button>
          <button
            onClick={() => setShowCustomSegmentModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ایجاد بخش سفارشی
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {[
            { id: 'overview', name: 'نمای کلی', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'segments', name: 'بخش‌های مشتری', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'upgrade', name: 'قابل ارتقا', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <svg
                className={`ml-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-pink-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab segmentData={segmentData} />
      )}

      {activeTab === 'segments' && (
        <SegmentsTab 
          segmentData={segmentData}
          selectedSegment={selectedSegment}
          segmentCustomers={segmentCustomers}
          onSegmentSelect={loadCustomersBySegment}
          segmentColors={segmentColors}
          segmentLabels={segmentLabels}
        />
      )}

      {activeTab === 'upgrade' && (
        <UpgradeTab 
          upgradeableCustomers={upgradeableCustomers}
          onLoadUpgradeable={loadUpgradeableCustomers}
        />
      )}

      {/* Custom Segment Modal */}
      {showCustomSegmentModal && (
        <CustomSegmentModal 
          onClose={() => setShowCustomSegmentModal(false)}
          onSave={async (data) => {
            try {
              await createCustomSegment(data);
              setShowCustomSegmentModal(false);
              await loadSegmentData();
            } catch (error) {
              console.error('Error creating custom segment:', error);
            }
          }}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ segmentData }: { segmentData: SegmentData | null }) {
  if (!segmentData) return null;

  const segmentColors = {
    NEW: 'from-gray-500 to-gray-600',
    OCCASIONAL: 'from-blue-500 to-blue-600', 
    REGULAR: 'from-green-500 to-green-600',
    VIP: 'from-purple-500 to-purple-600'
  };

  const segmentLabels = {
    NEW: 'تازه وارد',
    OCCASIONAL: 'گاه‌وبیش',
    REGULAR: 'منظم',
    VIP: 'ویژه'
  };

  return (
    <div className="space-y-6">
      {/* Segment Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(segmentData.segmentDistribution).map(([segment, data]) => (
          <div key={segment} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className={`w-12 h-12 bg-gradient-to-br ${segmentColors[segment as keyof typeof segmentColors]} rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {segmentLabels[segment as keyof typeof segmentLabels]}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{segment}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.count.toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ارزش کل: {(data.totalValue || 0).toLocaleString('fa-IR')} ریال
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Movements */}
      {segmentData.recentMovements && segmentData.recentMovements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تغییرات اخیر بخش‌ها</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {segmentData.recentMovements.slice(0, 5).map((movement, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-3"></div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {movement.customerName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {movement.currentSegment} ← {movement.suggestedSegment}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    امتیاز: {movement.segmentScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {segmentData.insights && segmentData.insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">بینش‌های بخش‌بندی</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {segmentData.insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 ml-3"></div>
                  <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Segments Tab Component  
interface SegmentsTabProps {
  segmentData: SegmentData | null;
  selectedSegment: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP';
  segmentCustomers: Customer[];
  onSegmentSelect: (segment: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP') => void;
  segmentColors: Record<string, string>;
  segmentLabels: Record<string, string>;
}

function SegmentsTab({ 
  segmentData, 
  selectedSegment, 
  segmentCustomers, 
  onSegmentSelect,
  segmentColors,
  segmentLabels 
}: SegmentsTabProps) {
  return (
    <div className="space-y-6">
      {/* Segment Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(segmentData?.segmentDistribution || {}).map(([segment, data]: [string, { count: number; totalValue: number }]) => (
          <button
            key={segment}
            onClick={() => onSegmentSelect(segment as 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedSegment === segment
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 bg-gradient-to-br ${segmentColors[segment]} rounded-lg flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{data.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{segmentLabels[segment]}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Customer List */}
      {segmentCustomers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              مشتریان بخش {segmentLabels[selectedSegment]}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    مشتری
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    بخش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تعداد بازدید
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    مجموع خرید
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    آخرین بازدید
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {segmentCustomers.map((customer: Customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${segmentColors[customer.segment]} text-white`}>
                        {segmentLabels[customer.segment]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {customer.loyalty?.totalVisits || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(customer.loyalty?.lifetimeSpent || 0).toLocaleString('fa-IR')} ریال
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {customer.loyalty?.lastVisitDate ? 
                        new Date(customer.loyalty.lastVisitDate).toLocaleDateString('fa-IR') : 
                        'بدون بازدید'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Upgrade Tab Component
interface UpgradeTabProps {
  upgradeableCustomers: CustomerSegmentData[];
  onLoadUpgradeable: (targetSegment: string) => void;
}

function UpgradeTab({ upgradeableCustomers, onLoadUpgradeable }: UpgradeTabProps) {
  const [selectedTargetSegment, setSelectedTargetSegment] = useState('REGULAR');

  useEffect(() => {
    onLoadUpgradeable(selectedTargetSegment);
  }, [selectedTargetSegment, onLoadUpgradeable]);

  return (
    <div className="space-y-6">
      {/* Target Segment Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          بخش هدف برای ارتقا
        </h3>
        <div className="flex space-x-4 space-x-reverse">
          {['OCCASIONAL', 'REGULAR', 'VIP'].map((segment) => (
            <button
              key={segment}
              onClick={() => setSelectedTargetSegment(segment)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTargetSegment === segment
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {segment === 'OCCASIONAL' ? 'گاه‌وبیش' : segment === 'REGULAR' ? 'منظم' : 'ویژه'}
            </button>
          ))}
        </div>
      </div>

      {/* Upgradeable Customers */}
      {upgradeableCustomers.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              مشتریان قابل ارتقا به {selectedTargetSegment === 'OCCASIONAL' ? 'گاه‌وبیش' : selectedTargetSegment === 'REGULAR' ? 'منظم' : 'ویژه'}
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upgradeableCustomers.map((customer: CustomerSegmentData) => (
                <div key={customer.customerId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          {customer.customerName.charAt(0)}
                        </span>
                      </div>
                      <div className="mr-4">
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {customer.customerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.customerPhone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        امتیاز: {customer.segmentScore}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.currentSegment} ← {customer.suggestedSegment}
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Stats */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {customer.loyaltyData.totalVisits}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">بازدید</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {customer.loyaltyData.lifetimeSpent.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">کل خرید</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {customer.loyaltyData.currentYearSpent.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">خرید امسال</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {customer.loyaltyData.lastVisitDays}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">روز پیش</div>
                    </div>
                  </div>

                  {/* Upgrade Reasons */}
                  {customer.reasons && customer.reasons.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        دلایل ارتقا:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {customer.reasons.map((reason: string, index: number) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            مشتری قابل ارتقا یافت نشد
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            در حال حاضر مشتری برای ارتقا به بخش {selectedTargetSegment === 'OCCASIONAL' ? 'گاه‌وبیش' : selectedTargetSegment === 'REGULAR' ? 'منظم' : 'ویژه'} وجود ندارد
          </p>
        </div>
      )}
    </div>
  );
}

// Custom Segment Modal Component
interface CustomSegmentModalProps {
  onClose: () => void;
  onSave: (data: SegmentationCriteria) => void;
}

function CustomSegmentModal({ onClose, onSave }: CustomSegmentModalProps) {
  const [formData, setFormData] = useState<SegmentationCriteria>({
    name: '',
    description: '',
    rules: [],
    conditions: [],
    isActive: true
  });

  const [currentRule, setCurrentRule] = useState<SegmentRule>({
    field: 'lifetimeSpent',
    operator: 'greater',
    value: ''
  });

  const fieldOptions = [
    { value: 'lifetimeSpent', label: 'مجموع خرید' },
    { value: 'totalVisits', label: 'تعداد بازدید' },
    { value: 'currentYearSpent', label: 'خرید امسال' },
    { value: 'lastVisitDays', label: 'روزهای آخرین بازدید' },
    { value: 'currentPoints', label: 'امتیاز فعلی' }
  ];

  const operatorOptions = [
    { value: 'greater', label: 'بیشتر از' },
    { value: 'less', label: 'کمتر از' },
    { value: 'equals', label: 'مساوی' },
    { value: 'between', label: 'بین' }
  ];

  const addRule = () => {
    if (currentRule.field && currentRule.operator && currentRule.value) {
      setFormData((prev: SegmentationCriteria) => ({
        ...prev,
        rules: [...prev.rules, { ...currentRule }]
      }));
             setCurrentRule({
         field: 'lifetimeSpent',
         operator: 'greater', 
         value: ''
       });
    }
  };

  const removeRule = (index: number) => {
    setFormData((prev: SegmentationCriteria) => ({
      ...prev,
      rules: prev.rules.filter((_: SegmentRule, i: number) => i !== index)
    }));
  };

  const handleSave = () => {
    if (formData.name && formData.description && formData.rules.length > 0) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto m-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              ایجاد بخش سفارشی
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام بخش
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev: SegmentationCriteria) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="نام بخش را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                توضیحات
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev: SegmentationCriteria) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="توضیحات بخش را وارد کنید"
              />
            </div>
          </div>

          {/* Add Rules */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">قوانین بخش‌بندی</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={currentRule.field}
                onChange={(e) => setCurrentRule((prev: SegmentRule) => ({ ...prev, field: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
              >
                {fieldOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={currentRule.operator}
                onChange={(e) => setCurrentRule((prev: SegmentRule) => ({ ...prev, operator: e.target.value as 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in' }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
              >
                {operatorOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

                             <input
                 type="number"
                 value={typeof currentRule.value === 'number' ? currentRule.value : ''}
                 onChange={(e) => setCurrentRule((prev: SegmentRule) => ({ ...prev, value: e.target.value ? Number(e.target.value) : '' }))}
                 className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                 placeholder="مقدار"
               />

              <button
                onClick={addRule}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                افزودن قانون
              </button>
            </div>
          </div>

          {/* Rules List */}
          {formData.rules.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-white">قوانین تعریف شده:</h5>
              {formData.rules.map((rule: SegmentRule, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {fieldOptions.find(f => f.value === rule.field)?.label} {operatorOptions.find(o => o.value === rule.operator)?.label} {rule.value}
                  </span>
                  <button
                    onClick={() => removeRule(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4 space-x-reverse">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name || !formData.description || formData.rules.length === 0}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ایجاد بخش
          </button>
        </div>
      </div>
    </div>
  );
}

// Main wrapper component with Suspense
export default function SegmentsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    }>
      <SegmentsPageContent />
    </React.Suspense>
  );
} 