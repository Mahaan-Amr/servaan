'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotifications } from '../../../../contexts/NotificationContext';
import {
  getCustomers,
  getCustomerStatistics,
  bulkUpdateCustomers,
  bulkSendSms,
  bulkDeleteCustomers,
  exportCustomers,
  importCustomers,
  getCustomerRecommendations
} from '../../../../services/customerService';
import {
  Customer,
  CustomerFilter,
  CustomerStatistics,
  BulkUpdateRequest,
  BulkSmsRequest,
  CustomerExportRequest,
  CustomerImportRequest,
  CustomerRecommendation
} from '../../../../types/crm';

// Import the existing CustomerCard component
import CustomerCard from './components/CustomerCard';

// Temporary placeholder components (to be implemented)
const BulkOperationsPanel = ({ selectedCustomers, onBulkUpdate, onBulkSms, onBulkDelete, onClose, processing }: {
  selectedCustomers: string[];
  customers: Customer[];
  onBulkUpdate: (request: BulkUpdateRequest) => Promise<void>;
  onBulkSms: (request: BulkSmsRequest) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onClose: () => void;
  processing: boolean;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold mb-4">عملیات گروهی ({selectedCustomers.length} مشتری)</h3>
      <div className="space-y-3">
        <button 
          onClick={() => onBulkUpdate({ customerIds: selectedCustomers, updateData: { status: 'ACTIVE' } })}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          disabled={processing}
        >
          فعال کردن همه
        </button>
        <button 
          onClick={() => onBulkSms({ customerIds: selectedCustomers, message: 'پیام تستی', messageType: 'BULK' })}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={processing}
        >
          ارسال پیامک گروهی
        </button>
        <button 
          onClick={onBulkDelete}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          disabled={processing}
        >
          حذف گروهی
        </button>
        <button onClick={onClose} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          انصراف
        </button>
      </div>
    </div>
  </div>
);

const ImportExportModal = ({ onExport, onClose }: {
  onExport: (request: CustomerExportRequest) => Promise<void>;
  onImport: (request: CustomerImportRequest) => Promise<void>;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold mb-4">ورود/صادرات مشتریان</h3>
      <div className="space-y-3">
        <button 
          onClick={() => onExport({ format: 'CSV', includeFields: ['name', 'phone'], includeLoyalty: true })}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          صادرات به CSV
        </button>
        <button onClick={onClose} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          انصراف
        </button>
      </div>
    </div>
  </div>
);

const RecommendationsPanel = ({ recommendations, onClose }: {
  recommendations: CustomerRecommendation[];
  onApplyRecommendation: () => void;
  onClose: () => void;
}) => (
  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">پیشنهادات هوش مصنوعی</h3>
      <button onClick={onClose} className="text-blue-600 hover:text-blue-800">×</button>
    </div>
    <div className="space-y-2">
      {recommendations.slice(0, 3).map((rec) => (
        <div key={rec.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
          <div className="font-medium text-sm">{rec.title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{rec.description}</div>
        </div>
      ))}
    </div>
  </div>
);

const AdvancedFilters = ({ filters, onFilterChange, onClose }: {
  filters: CustomerFilter;
  onFilterChange: (key: keyof CustomerFilter, value: CustomerFilter[keyof CustomerFilter]) => void;
  onClose: () => void;
}) => (
  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 mt-4">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        فیلترهای پیشرفته
      </h4>
      <button 
        onClick={onClose} 
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Spending Range */}
      <div className="space-y-3 sm:space-y-4">
        <h5 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">محدوده خرید (تومان)</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">حداقل خرید</label>
            <input
              type="number"
              value={filters.minSpent || ''}
              onChange={(e) => onFilterChange('minSpent', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">حداکثر خرید</label>
            <input
              type="number"
              value={filters.maxSpent || ''}
              onChange={(e) => onFilterChange('maxSpent', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="∞"
            />
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="space-y-3 sm:space-y-4">
        <h5 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">محدوده تاریخ</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">عضویت از</label>
            <input
              type="date"
              value={filters.createdFrom || ''}
              onChange={(e) => onFilterChange('createdFrom', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">عضویت تا</label>
            <input
              type="date"
              value={filters.createdTo || ''}
              onChange={(e) => onFilterChange('createdTo', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Last Visit Range */}
      <div className="space-y-3 sm:space-y-4">
        <h5 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">آخرین بازدید</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">از تاریخ</label>
            <input
              type="date"
              value={filters.lastVisitFrom || ''}
              onChange={(e) => onFilterChange('lastVisitFrom', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">تا تاریخ</label>
            <input
              type="date"
              value={filters.lastVisitTo || ''}
              onChange={(e) => onFilterChange('lastVisitTo', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Quick Filter Presets */}
    <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h5 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">فیلترهای سریع</h5>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('lastVisitFrom', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
        >
          بازدید این هفته
        </button>
        <button
          onClick={() => onFilterChange('lastVisitFrom', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
        >
          بازدید این ماه
        </button>
        <button
          onClick={() => onFilterChange('createdFrom', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors"
        >
          عضو جدید (ماه اخیر)
        </button>
        <button
          onClick={() => {
            onFilterChange('minSpent', 1000000);
            onFilterChange('maxSpent', undefined);
          }}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
        >
          خریداران پرحجم
        </button>
      </div>
    </div>
  </div>
);

export default function CustomersPage() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<CustomerRecommendation[]>([]);
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilter>({
    segment: undefined,
    tierLevel: undefined,
    status: undefined
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // UI states
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [processingBulk, setProcessingBulk] = useState(false);

  // Enhanced search functionality
  const isIranianPhone = (searchTerm: string): boolean => {
    const cleanTerm = searchTerm.replace(/\s|-/g, '');
    return /^(\+98|0)?9\d{9}$/.test(cleanTerm);
  };

  // Memoized search filters for performance
  const searchFilters = useMemo((): CustomerFilter => {
    const baseFilters = {
      ...filters,
      page: pagination.page,
      limit: pagination.limit
    };

    if (searchTerm.trim()) {
      if (isIranianPhone(searchTerm)) {
        // Phone number search
        baseFilters.phone = searchTerm.replace(/\s|-/g, '');
        delete baseFilters.search;
      } else {
        // Name or general search
        baseFilters.search = searchTerm.trim();
        delete baseFilters.phone;
      }
    }

    return baseFilters;
  }, [filters, pagination.page, pagination.limit, searchTerm]);

  // Fetch customer statistics
  const fetchCustomerStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setStatsLoading(true);
      const stats = await getCustomerStatistics();
      setCustomerStats(stats);
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Fetch customers with enhanced analytics integration
  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const result = await getCustomers(searchFilters);
      
      setCustomers(result.customers);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.pages
      }));

      // Clear selections when data changes
      setSelectedCustomers(new Set());
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchFilters]);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      const recs = await getCustomerRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchCustomerStats();
  }, [fetchCustomerStats]);

  // Enhanced search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  // Advanced filter handler
  const handleFilterChange = (key: keyof CustomerFilter, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Selection handlers
  const handleSelectCustomer = (customerId: string, selected: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (selected) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  // Bulk operations handlers
  const handleBulkUpdate = async (request: BulkUpdateRequest) => {
    setProcessingBulk(true);
    try {
      await bulkUpdateCustomers(request);
      await fetchCustomers();
      setSelectedCustomers(new Set());
      setShowBulkPanel(false);
    } catch (error) {
      console.error('Error in bulk update:', error);
      alert('خطا در بروزرسانی گروهی');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkSms = async (request: BulkSmsRequest) => {
    setProcessingBulk(true);
    try {
      await bulkSendSms(request);
      setShowBulkPanel(false);
    } catch (error) {
      console.error('Error in bulk SMS:', error);
      alert('خطا در ارسال گروهی پیامک');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm('آیا از حذف مشتریان انتخاب شده اطمینان دارید؟')) return;
    
    setProcessingBulk(true);
    try {
      await bulkDeleteCustomers(Array.from(selectedCustomers));
      await fetchCustomers();
      setSelectedCustomers(new Set());
      setShowBulkPanel(false);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('خطا در حذف گروهی');
    } finally {
      setProcessingBulk(false);
    }
  };

  // Import/Export handlers
  const handleExport = async (request: CustomerExportRequest) => {
    try {
      const result = await exportCustomers(request);
      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowImportExport(false);
    } catch (error) {
      console.error('Error exporting customers:', error);
      alert('خطا در صادرات مشتریان');
    }
  };

  const handleImport = async (request: CustomerImportRequest) => {
    try {
      const result = await importCustomers(request);
      alert(`وارد شدن ${result.created} مشتری جدید، بروزرسانی ${result.updated} مشتری`);
      await fetchCustomers();
      setShowImportExport(false);
    } catch (error) {
      console.error('Error importing customers:', error);
      alert('خطا در وارد کردن مشتریان');
    }
  };

  // Utility functions
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

  const getSegmentBadgeColorLocal = (segment: string): string => {
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

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Enhanced Header with Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">مدیریت مشتریان</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            مشاهده و مدیریت اطلاعات مشتریان با قابلیت‌های هوش مصنوعی
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Notifications indicator */}
          {unreadCount > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg transition-colors w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12" />
                </svg>
                پیشنهادات ({recommendations.length})
              </button>
              {recommendations.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {recommendations.length}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={() => setShowImportExport(true)}
            className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            ورود/صادرات
          </button>

          <Link
            href="/workspaces/customer-relationship-management/customers/new"
            className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            مشتری جدید
          </Link>
        </div>
      </div>

      {/* Customer Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {statsLoading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : customerStats ? (
          <>
            {/* Total Customers */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-6 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">کل مشتریان</h3>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                {(customerStats.total || 0).toLocaleString('fa-IR')}
              </div>
              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                {(customerStats.active || 0).toLocaleString('fa-IR')} مشتری فعال
              </div>
            </div>

            {/* New This Month */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 sm:p-6 rounded-lg shadow-sm border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">عضو جدید این ماه</h3>
                <div className="p-2 bg-green-500 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                {(customerStats.newThisMonth || 0).toLocaleString('fa-IR')}
              </div>
              <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                مشتری جدید
              </div>
            </div>

            {/* Average Lifetime Value */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 sm:p-6 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">متوسط ارزش مشتری</h3>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                {Math.round(customerStats.averageLifetimeValue || 0).toLocaleString('fa-IR')}
              </div>
              <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                تومان
              </div>
            </div>

            {/* Average Visits */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 sm:p-6 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">متوسط بازدید</h3>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                {(customerStats.averageVisits || 0).toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                بازدید به ازای مشتری
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-4 text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
            خطا در بارگذاری آمار مشتریان
          </div>
        )}
      </div>

      {/* Segment Distribution */}
      {customerStats && customerStats.bySegment && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 ml-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            توزیع بخش‌های مشتری
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(customerStats.bySegment || {}).map(([segment, count]) => (
              <div key={segment} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mb-2 ${getSegmentBadgeColorLocal(segment)}`}>
                  {segment}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(count || 0).toLocaleString('fa-IR')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {(customerStats.total || 0) > 0 ? (((count || 0) / (customerStats.total || 1)) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations Panel */}
      {showRecommendations && (
        <RecommendationsPanel
          recommendations={recommendations}
          onApplyRecommendation={() => fetchRecommendations()}
          onClose={() => setShowRecommendations(false)}
        />
      )}

      {/* Enhanced Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar with Advanced Options */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                جستجوی پیشرفته
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام، شماره تلفن، ایمیل یا یادداشت مشتری..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
              >
                جستجو
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
              >
                فیلترهای پیشرفته
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                بخش مشتری
              </label>
              <select
                value={filters.segment || ''}
                onChange={(e) => handleFilterChange('segment', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">همه بخش‌ها</option>
                <option value="VIP">VIP</option>
                <option value="REGULAR">منظم</option>
                <option value="OCCASIONAL">گاه‌به‌گاه</option>
                <option value="NEW">جدید</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                سطح وفاداری
              </label>
              <select
                value={filters.tierLevel || ''}
                onChange={(e) => handleFilterChange('tierLevel', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">همه سطوح</option>
                <option value="PLATINUM">پلاتینیوم</option>
                <option value="GOLD">طلایی</option>
                <option value="SILVER">نقره‌ای</option>
                <option value="BRONZE">برنزی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وضعیت
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال</option>
                <option value="INACTIVE">غیرفعال</option>
                <option value="BLOCKED">مسدود</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <AdvancedFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClose={() => setShowAdvancedFilters(false)}
            />
          )}
        </form>
      </div>

      {/* Selection Summary and Bulk Actions */}
      {selectedCustomers.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {selectedCustomers.size} مشتری انتخاب شده
              </span>
              <button
                onClick={() => setSelectedCustomers(new Set())}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                لغو انتخاب
              </button>
            </div>
            
            <button
              onClick={() => setShowBulkPanel(true)}
              disabled={processingBulk}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              عملیات گروهی
            </button>
          </div>
        </div>
      )}

      {/* Customer Results with Enhanced Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              مشتریان ({pagination.total.toLocaleString('fa-IR')})
            </h3>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCustomers.size === customers.length && customers.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">انتخاب همه</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">مشتری یافت نشد</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                با فیلترهای فعلی مشتری یافت نشد. فیلترها را تغییر دهید یا مشتری جدید اضافه کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  selected={selectedCustomers.has(customer.id)}
                  onSelect={(selected: boolean) => handleSelectCustomer(customer.id, selected)}
                  getSegmentBadgeColor={getSegmentBadgeColorLocal}
                  getTierBadgeColor={getTierBadgeColor}
                  formatPhoneNumber={formatPhoneNumber}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Enhanced Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                نمایش {((pagination.page - 1) * pagination.limit + 1).toLocaleString('fa-IR')} تا{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('fa-IR')} از{' '}
                {pagination.total.toLocaleString('fa-IR')} مشتری
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  قبلی
                </button>
                
                <span className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-pink-600 text-white rounded-lg">
                  {pagination.page.toLocaleString('fa-IR')}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Modals */}
      {showBulkPanel && (
        <BulkOperationsPanel
          selectedCustomers={Array.from(selectedCustomers)}
          customers={customers.filter(c => selectedCustomers.has(c.id))}
          onBulkUpdate={handleBulkUpdate}
          onBulkSms={handleBulkSms}
          onBulkDelete={handleBulkDelete}
          onClose={() => setShowBulkPanel(false)}
          processing={processingBulk}
        />
      )}

      {showImportExport && (
        <ImportExportModal
          onExport={handleExport}
          onImport={handleImport}
          onClose={() => setShowImportExport(false)}
        />
      )}
    </div>
  );
} 