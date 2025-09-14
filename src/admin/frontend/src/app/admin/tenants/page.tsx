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
import { getTenants, TenantListResponse, TenantListParams, exportTenants, TenantDetail, activateTenant, deactivateTenant } from '@/services/admin/tenants/tenantService';
import { Tenant, TenantStatus, TenantPlan } from '@/types/admin';
import { formatAdminDate } from '@/utils/persianDate';
import { withAdminAuth } from '@/contexts/AdminAuthContext';
import TenantEditModal from '@/components/admin/tenants/TenantEditModal';
import BulkOperationsBar from '@/components/admin/tenants/BulkOperationsBar';
import TenantAnalyticsDashboard from '@/components/admin/tenants/TenantAnalyticsDashboard';
import CreateTenantModal from '@/components/admin/tenants/CreateTenantModal';
import TenantCreationWizard from '@/components/admin/tenants/TenantCreationWizard';
import AdvancedSearchFilters from '@/components/admin/tenants/AdvancedSearchFilters';

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
  
  // Enhanced filters
  const [filters, setFilters] = useState<Partial<TenantListParams>>({});

  // Enhanced features
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Load tenants data
  const loadTenants = async (params: Partial<TenantListParams> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams: TenantListParams = {
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...filters,
        ...params
      };

      const response: TenantListResponse = await getTenants(queryParams);
      
      setTenants(response.tenants);
      setPagination(response.pagination);
      
      // Update pagination state
      if (params.page) setPagination(prev => ({ ...prev, page: params.page! }));
      if (params.limit) setPagination(prev => ({ ...prev, limit: params.limit! }));
      
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

  // Handle filters change
  const handleFiltersChange = (newFilters: Partial<TenantListParams>) => {
    setFilters(newFilters);
    loadTenants({ ...newFilters, page: 1 });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    loadTenants({ page: 1 });
  };

  // Sorting handlers
  const sortByRevenue = () => loadTenants({ sortBy: 'monthlyRevenue', sortDir: 'desc', page: 1 });
  const sortByOrders = () => loadTenants({ sortBy: 'ordersThisMonth', sortDir: 'desc', page: 1 });
  const refreshBypassCache = () => loadTenants({ refresh: true });

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
  const handleSaveTenant = (updatedTenant: TenantDetail) => {
    // Convert TenantDetail to Tenant format for the list
    const tenantForList: Tenant = {
      id: updatedTenant.id,
      name: updatedTenant.name,
      displayName: updatedTenant.displayName,
      subdomain: updatedTenant.subdomain,
      description: updatedTenant.description,
      businessType: updatedTenant.businessType,
      city: updatedTenant.city,
      country: updatedTenant.country,
      status: 'ACTIVE' as TenantStatus, // Default status
      plan: updatedTenant.plan as TenantPlan,
      isActive: updatedTenant.isActive,
      ownerName: updatedTenant.ownerName,
      ownerEmail: updatedTenant.ownerEmail,
      ownerPhone: updatedTenant.ownerPhone,
      createdAt: updatedTenant.createdAt,
      updatedAt: updatedTenant.updatedAt,
      userCount: 0, // Will be updated from API
      storageUsed: 0, // Will be updated from API
      storageLimit: 0, // Will be updated from API
      features: updatedTenant.features,
      metrics: {
        userCount: 0,
        customerCount: 0,
        orderCount: 0,
        revenue: 0
      }
    };
    
    setTenants(prev => 
      prev.map(t => t.id === updatedTenant.id ? tenantForList : t)
    );
    toast.success('مستأجر با موفقیت به‌روزرسانی شد');
  };

  // Toggle tenant status with optimistic update
  const handleToggleStatus = async (tenant: Tenant) => {
    const targetActive = !tenant.isActive && tenant.status !== 'ACTIVE';
    const newIsActive = !(tenant.isActive || tenant.status === 'ACTIVE');
    const tenantId = tenant.id;
    setStatusUpdatingId(tenantId);

    // optimistic UI
    const prevTenants = tenants;
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, isActive: newIsActive, status: newIsActive ? 'ACTIVE' as TenantStatus : 'INACTIVE' as TenantStatus } : t));
    try {
      if (newIsActive) {
        await activateTenant(tenantId);
        toast.success('مستأجر فعال شد');
      } else {
        await deactivateTenant(tenantId);
        toast.success('مستأجر غیرفعال شد');
      }
    } catch (error: any) {
      // rollback
      setTenants(prevTenants);
      toast.error(error.message || 'خطا در تغییر وضعیت مستأجر');
    } finally {
      setStatusUpdatingId(null);
    }
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
    setShowCreateWizard(true);
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

  const formatToman = (amountRial: number) => {
    const amountToman = Math.floor((amountRial || 0) / 10);
    return `${amountToman.toLocaleString('fa-IR')} تومان`;
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

            {/* Sort & Refresh */}
            <button onClick={sortByRevenue} className="btn-admin-secondary">مرتب‌سازی بر اساس درآمد ماه</button>
            <button onClick={sortByOrders} className="btn-admin-secondary">مرتب‌سازی بر اساس سفارشات ماه</button>
            <button onClick={refreshBypassCache} className="btn-admin-secondary">بروزرسانی (بدون کش)</button>
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
        currentFilters={filters}
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Advanced Search Filters */}
        <AdvancedSearchFilters
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          initialFilters={filters}
        />

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
                              {formatToman(tenant.monthlyRevenue || 0)}
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
                                  handleToggleStatus(tenant);
                                }}
                                disabled={statusUpdatingId === tenant.id}
                                className={`hover:opacity-80 ${ (tenant.isActive || tenant.status === 'ACTIVE') ? 'text-admin-danger' : 'text-admin-success'}`}
                                title={(tenant.isActive || tenant.status === 'ACTIVE') ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                              >
                                {statusUpdatingId === tenant.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2"></div>
                                ) : (
                                  (tenant.isActive || tenant.status === 'ACTIVE') ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />
                                )}
                              </button>
                              <div className="relative group">
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-admin-text-muted hover:text-admin-text"
                                  title="عملیات بیشتر"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                                <div className="absolute left-0 bottom-full mb-2 bg-white border border-admin-border rounded-admin shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-10 min-w-[160px]">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditTenant(tenant); }}
                                    className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                                  >ویرایش</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(tenant); }}
                                    className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                                  >{(tenant.isActive || tenant.status === 'ACTIVE') ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/tenants/${tenant.id}`); }}
                                    className="block w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg"
                                  >مشاهده</button>
                                </div>
                              </div>
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

      {/* Create Tenant Wizard */}
      <TenantCreationWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSuccess={() => {
          handleRefresh();
          setShowCreateWizard(false);
        }}
      />
    </div>
  );
}

export default withAdminAuth(TenantsPage);
