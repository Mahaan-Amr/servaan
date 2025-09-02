'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Building2,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTenants, TenantListResponse, TenantListParams, exportTenants } from '@/services/admin/tenants/tenantService';
import { Tenant, TenantStatus, TenantPlan } from '@/types/admin';
import { formatAdminDate } from '@/utils/persianDate';
import { withAdminAuth } from '@/contexts/AdminAuthContext';
import TenantEditModal from '@/components/admin/tenants/TenantEditModal';
import BulkOperationsBar from '@/components/admin/tenants/BulkOperationsBar';
import TenantAnalyticsDashboard from '@/components/admin/tenants/TenantAnalyticsDashboard';
import CreateTenantModal from '@/components/admin/tenants/CreateTenantModal';

function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced features
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load tenants data
  const loadTenants = async (params: Partial<TenantListParams> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams: TenantListParams = {
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        search: params.search !== undefined ? params.search : search,
        status: params.status !== undefined ? params.status : statusFilter,
        plan: params.plan !== undefined ? params.plan : planFilter
      };

      const response: TenantListResponse = await getTenants(queryParams);
      
      setTenants(response.tenants);
      setPagination(response.pagination);
      
      // Update local state
      if (params.page) setPagination(prev => ({ ...prev, page: params.page! }));
      if (params.limit) setPagination(prev => ({ ...prev, limit: params.limit! }));
      if (params.search !== undefined) setSearch(params.search);
      if (params.status !== undefined) setStatusFilter(params.status);
      if (params.plan !== undefined) setPlanFilter(params.plan);
      
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    loadTenants({ search: value, page: 1 });
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    loadTenants({ status, page: 1 });
  };

  // Handle plan filter
  const handlePlanFilter = (plan: string) => {
    setPlanFilter(plan);
    loadTenants({ plan, page: 1 });
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit }));
    loadTenants({ limit, page: 1 });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadTenants({ page });
  };

  // Handle tenant selection
  const handleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  // Handle edit tenant
  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowEditModal(true);
  };

  // Handle save tenant
  const handleSaveTenant = (updatedTenant: Tenant) => {
    setTenants(prev => 
      prev.map(t => t.id === updatedTenant.id ? updatedTenant : t)
    );
    toast.success('مستأجر با موفقیت به‌روزرسانی شد');
  };

  // Handle refresh
  const handleRefresh = () => {
    loadTenants();
    setSelectedTenants([]);
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportTenants(format);
      toast.success(`داده‌ها با موفقیت به فرمت ${format} صادر شد`);
    } catch (error: any) {
      toast.error(error.message || 'خطا در صادرات داده‌ها');
    }
  };

  // Handle new tenant creation
  const handleCreateNewTenant = () => {
    setShowCreateModal(true);
  };

  // Helper functions
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-success text-white">
          <CheckCircle className="h-3 w-3 ml-1" />
          فعال
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-danger text-white">
          <XCircle className="h-3 w-3 ml-1" />
          غیرفعال
        </span>
      );
    }
  };

  const getPlanBadge = (plan: string) => {
    const planColors = {
      'STARTER': 'bg-admin-info text-white',
      'BUSINESS': 'bg-admin-warning text-white',
      'ENTERPRISE': 'bg-admin-primary text-white'
    };

    const planLabels = {
      'STARTER': 'استارتر',
      'BUSINESS': 'بیزینس',
      'ENTERPRISE': 'انترپرایز'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[plan as keyof typeof planColors] || 'bg-admin-bg text-admin-text'}`}>
        {planLabels[plan as keyof typeof planLabels] || plan}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-admin-bg">
      {/* Header */}
      <div className="bg-white border-b border-admin-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-text">مدیریت مستأجرین</h1>
            <p className="text-admin-text-light">مدیریت و نظارت بر مستأجرین پلتفرم</p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Analytics Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`btn-admin-secondary flex items-center ${
                showAnalytics ? 'bg-admin-primary text-white' : ''
              }`}
            >
              <BarChart3 className="h-4 w-4 ml-2" />
              {showAnalytics ? 'مخفی کردن تحلیل' : 'نمایش تحلیل'}
            </button>

            {/* Export Button */}
            <div className="relative group">
              <button className="btn-admin-secondary flex items-center">
                <Download className="h-4 w-4 ml-2" />
                صادرات
                <svg className="h-4 w-4 mr-2 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Export Options Dropdown */}
              <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-admin-border rounded-admin shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Add New Tenant */}
            <button 
              onClick={handleCreateNewTenant}
              className="btn-admin-primary flex items-center"
            >
              <Plus className="h-4 w-4 ml-2" />
              مستأجر جدید
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="p-6">
          <TenantAnalyticsDashboard />
        </div>
      )}

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        tenants={tenants}
        selectedTenants={selectedTenants}
        onSelectionChange={setSelectedTenants}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Filters Section */}
        <div className="bg-white rounded-admin border border-admin-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-admin-text">فیلترها و جستجو</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-admin-primary hover:text-admin-primary-dark text-sm"
            >
              {showFilters ? 'مخفی کردن فیلترها' : 'نمایش فیلترها'}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                <input
                  type="text"
                  placeholder="جستجو در نام، زیردامنه، یا ایمیل..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-admin-secondary flex items-center"
            >
              <Filter className="h-4 w-4 ml-2" />
              فیلترها
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-admin-bg rounded-admin">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">وضعیت</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  >
                    <option value="all">همه</option>
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                  </select>
                </div>

                {/* Plan Filter */}
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">طرح</label>
                  <select
                    value={planFilter}
                    onChange={(e) => handlePlanFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  >
                    <option value="all">همه</option>
                    <option value="STARTER">استارتر</option>
                    <option value="BUSINESS">بیزینس</option>
                    <option value="ENTERPRISE">انترپرایز</option>
                  </select>
                </div>

                {/* Limit Filter */}
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">تعداد در صفحه</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
                  >
                    <option value={10}>۱۰</option>
                    <option value={25}>۲۵</option>
                    <option value={50}>۵۰</option>
                    <option value={100}>۱۰۰</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-16 w-16 text-admin-danger mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-admin-text mb-2">خطا در بارگذاری داده‌ها</h2>
            <p className="text-admin-text-light mb-4">{error}</p>
            <button 
              onClick={() => loadTenants()}
              className="btn-admin-primary"
            >
              تلاش مجدد
            </button>
          </div>
        ) : (
          <>
            {/* Tenants Table */}
            <div className="bg-white rounded-admin border border-admin-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-admin-border">
                  <thead className="bg-admin-bg">
                    <tr>
                      {/* Selection Column */}
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedTenants.length === tenants.length && tenants.length > 0}
                          onChange={() => {
                            if (selectedTenants.length === tenants.length) {
                              setSelectedTenants([]);
                            } else {
                              setSelectedTenants(tenants.map(t => t.id));
                            }
                          }}
                          className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded"
                        />
                      </th>
                      
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        مستأجر
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        طرح
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        کاربران
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        درآمد ماهانه
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        وضعیت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        تاریخ ایجاد
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-admin-border">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : tenants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-admin-text-muted">
                          هیچ مستأجری یافت نشد
                        </td>
                      </tr>
                    ) : (
                      tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-admin-bg transition-colors">
                          {/* Selection Checkbox */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedTenants.includes(tenant.id)}
                              onChange={() => handleTenantSelection(tenant.id)}
                              className="h-4 w-4 text-admin-primary focus:ring-admin-primary border-admin-border rounded"
                            />
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-admin-primary flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-admin-text">
                                  {tenant.displayName || tenant.name}
                                </div>
                                <div className="text-sm text-admin-text-light">
                                  {tenant.subdomain}.servaan.com
                                </div>
                                <div className="text-xs text-admin-text-muted">
                                  {tenant.businessType || 'نامشخص'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPlanBadge(tenant.plan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-admin-text">
                              <Users className="h-4 w-4 ml-1 text-admin-text-muted" />
                              {tenant.userCount || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-admin-text">
                              <DollarSign className="h-4 w-4 ml-1 text-admin-text-muted" />
                              {formatCurrency(tenant.monthlyRevenue || tenant.metrics?.revenue || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(tenant.isActive || tenant.status === 'ACTIVE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-text-muted">
                            {formatAdminDate(tenant.createdAt, { format: 'short' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/tenants/${tenant.id}`);
                                }}
                                className="text-admin-primary hover:text-admin-primary-dark"
                                title="مشاهده جزئیات"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTenant(tenant);
                                }}
                                className="text-admin-warning hover:text-admin-warning-dark"
                                title="ویرایش"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement quick actions menu
                                }}
                                className="text-admin-text-muted hover:text-admin-text"
                                title="عملیات بیشتر"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-admin-text-muted">
                  نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} نتیجه
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-admin-text bg-white border border-admin-border rounded-admin hover:bg-admin-bg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    قبلی
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-admin ${
                          page === pagination.page
                            ? 'bg-admin-primary text-white'
                            : 'text-admin-text bg-white border border-admin-border hover:bg-admin-bg'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-admin-text bg-white border border-admin-border rounded-admin hover:bg-admin-bg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <TenantEditModal
        tenant={editingTenant}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTenant(null);
        }}
        onSave={handleSaveTenant}
      />

      {/* Create Tenant Modal */}
      <CreateTenantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          handleRefresh();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

export default withAdminAuth(TenantsPage);
