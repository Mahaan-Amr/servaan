'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Calendar,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';
import { getCustomers, deleteCustomer } from '../../../services/customerService';
import { Customer, CustomerFilter } from '../../../types/crm';

function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    pages: 0,
    limit: 20
  });

  // Filter state
  const [filters, setFilters] = useState<CustomerFilter>({
    page: 1,
    limit: 20,
    search: searchParams.get('search') || '',
    segment: (searchParams.get('segment') as 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP') || undefined,
    status: (searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'BLOCKED') || undefined
  });

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomers(filters);
      setCustomers(response.customers);
      setPagination(response.pagination);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطای نامشخص';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof CustomerFilter, value: CustomerFilter[keyof CustomerFilter]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('آیا از حذف این مشتری اطمینان دارید؟')) return;
    
    try {
      await deleteCustomer(customerId);
      await loadCustomers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطای نامشخص';
      alert('خطا در حذف مشتری: ' + errorMessage);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const getSegmentBadge = (segment: string) => {
    const segmentConfig = {
      NEW: { label: 'جدید', color: 'bg-gray-100 text-gray-800' },
      OCCASIONAL: { label: 'گاه‌به‌گاه', color: 'bg-blue-100 text-blue-800' },
      REGULAR: { label: 'منظم', color: 'bg-green-100 text-green-800' },
      VIP: { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = segmentConfig[segment as keyof typeof segmentConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || segment}
      </span>
    );
  };

  const getTierBadge = (tierLevel: string) => {
    const tierConfig = {
      BRONZE: { label: 'برنز', color: 'text-orange-600' },
      SILVER: { label: 'نقره', color: 'text-gray-600' },
      GOLD: { label: 'طلا', color: 'text-yellow-600' },
      PLATINUM: { label: 'پلاتین', color: 'text-purple-600' }
    };
    
    const config = tierConfig[tierLevel as keyof typeof tierConfig];
    return (
      <div className={`flex items-center gap-1 ${config?.color || 'text-gray-600'}`}>
        <Star className="w-3 h-3" />
        <span className="text-xs">{config?.label || tierLevel}</span>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت مشتریان</h1>
          <p className="text-gray-600">
            {loading ? 'در حال بارگذاری...' : `${pagination.total} مشتری`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            فیلترها
          </button>
          <button
            onClick={loadCustomers}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </button>
          <button
            onClick={() => router.push('/crm/customers/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            مشتری جدید
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام، شماره تماس یا ایمیل..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">بخش</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.segment || ''}
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                >
                  <option value="">همه بخش‌ها</option>
                  <option value="NEW">جدید</option>
                  <option value="OCCASIONAL">گاه‌به‌گاه</option>
                  <option value="REGULAR">منظم</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="ACTIVE">فعال</option>
                  <option value="INACTIVE">غیرفعال</option>
                  <option value="BLOCKED">مسدود</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سطح وفاداری</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.tierLevel || ''}
                  onChange={(e) => handleFilterChange('tierLevel', e.target.value)}
                >
                  <option value="">همه سطوح</option>
                  <option value="BRONZE">برنز</option>
                  <option value="SILVER">نقره</option>
                  <option value="GOLD">طلا</option>
                  <option value="PLATINUM">پلاتین</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ page: 1, limit: 20 })}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  پاک کردن فیلترها
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری مشتریان...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadCustomers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              تلاش مجدد
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">مشتری‌ای یافت نشد</p>
            <button
              onClick={() => router.push('/crm/customers/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              اولین مشتری را اضافه کنید
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedCustomers.length > 0 && `${selectedCustomers.length} انتخاب شده`}
                  </span>
                </div>
                {selectedCustomers.length > 0 && (
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      اعمال گروهی
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <div key={customer.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers([...selectedCustomers, customer.id]);
                          } else {
                            setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{customer.name}</h3>
                          {getSegmentBadge(customer.segment)}
                          {customer.loyalty && getTierBadge(customer.loyalty.tierLevel)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>عضویت: {formatDate(customer.createdAt)}</span>
                          </div>
                        </div>

                        {customer.loyalty && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">کل خرید: </span>
                              <span className="font-medium">{formatCurrency(customer.loyalty.lifetimeSpent)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">تعداد بازدید: </span>
                              <span className="font-medium">{customer.loyalty.totalVisits}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">امتیاز فعلی: </span>
                              <span className="font-medium text-purple-600">{customer.loyalty.currentPoints}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/crm/customers/${customer.id}`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="مشاهده جزئیات"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/crm/customers/${customer.id}/edit`)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    صفحه {pagination.currentPage} از {pagination.pages} 
                    ({pagination.total} مشتری)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      قبلی
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="bg-white p-6 rounded-lg shadow h-64"></div>
        </div>
      </div>
    }>
      <CustomersPageContent />
    </Suspense>
  );
} 