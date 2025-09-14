'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal, 
  Building2, 
  Users, 
  DollarSign, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getTenantById, getTenantMetrics, TenantDetail, TenantMetrics, activateTenant, deactivateTenant } from '@/services/admin/tenants/tenantService';
import { TenantPlan } from '@/types/admin';
import { formatAdminDate } from '@/utils/persianDate';
import { withAdminAuth } from '@/contexts/AdminAuthContext';
import TenantUsersResetPassword from './TenantUsersResetPassword';
import TenantMetricsDashboard from '@/components/admin/tenants/TenantMetricsDashboard';
import TenantActivityTimeline from '@/components/admin/tenants/TenantActivityTimeline';
import TenantUserManagement from '@/components/admin/tenants/TenantUserManagement';

function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'users' | 'activity'>('overview');
  const [statusLoading, setStatusLoading] = useState(false);

  // Load tenant data
  const loadTenantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tenantData, metricsData] = await Promise.all([
        getTenantById(tenantId),
        getTenantMetrics(tenantId)
      ]);
      
      setTenant(tenantData);
      setMetrics(metricsData);
      
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (tenantId) {
      loadTenantData();
    }
  }, [tenantId]);

  // Get plan badge
  const getPlanBadge = (plan: TenantPlan) => {
    const planConfig = {
      STARTER: { color: 'bg-blue-100 text-blue-800', label: 'استارتر' },
      BUSINESS: { color: 'bg-purple-100 text-purple-800', label: 'بیزینس' },
      ENTERPRISE: { color: 'bg-yellow-100 text-yellow-800', label: 'انترپرایز' }
    };

    const config = planConfig[plan] || planConfig.STARTER;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          فعال
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        غیرفعال
      </span>
    );
  };

  // Format currency
  const formatToman = (amountRial: number) => `${Math.floor((amountRial || 0)/10).toLocaleString('fa-IR')} تومان`;

  // Handle refresh
  const handleRefresh = () => {
    loadTenantData();
    toast.success('داده‌ها به‌روزرسانی شد');
  };

  const toggleStatus = async () => {
    if (!tenant) return;
    setStatusLoading(true);
    try {
      if (tenant.isActive) {
        await deactivateTenant(tenant.id);
        setTenant({ ...tenant, isActive: false });
        toast.success('مستأجر غیرفعال شد');
      } else {
        await activateTenant(tenant.id);
        setTenant({ ...tenant, isActive: true });
        toast.success('مستأجر فعال شد');
      }
    } catch (e: any) {
      toast.error(e.message || 'خطا در تغییر وضعیت');
    } finally {
      setStatusLoading(false);
    }
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-admin-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-admin-text mb-2">خطا در بارگذاری داده‌ها</h2>
          <p className="text-admin-text-light mb-4">{error}</p>
          <button 
            onClick={loadTenantData}
            className="btn-admin-primary flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-admin-text">در حال بارگذاری اطلاعات مستأجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="btn-admin-secondary flex items-center mr-4"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                بازگشت
              </button>
              <div>
                <h1 className="text-3xl font-bold text-admin-text mb-2">
                  {tenant.displayName || tenant.name}
                </h1>
                <p className="text-admin-text-light">
                  {tenant.subdomain}.servaan.com
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handleRefresh}
                className="btn-admin-secondary flex items-center"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                به‌روزرسانی
              </button>
              <button
                onClick={() => router.push(`/admin/tenants/${tenantId}/edit`)}
                className="btn-admin-primary flex items-center"
              >
                <Edit className="h-4 w-4 ml-2" />
                ویرایش
              </button>
            </div>
          </div>

          {/* Status and Plan */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {getStatusBadge(tenant.isActive)}
            {getPlanBadge(tenant.plan)}
            <span className="text-sm text-admin-text-muted">
              ایجاد شده در {formatAdminDate(tenant.createdAt, { format: 'long' })}
            </span>
            <button onClick={toggleStatus} disabled={statusLoading} className={`ml-4 btn-admin-secondary ${tenant.isActive ? 'text-admin-danger' : 'text-admin-success'}`}>
              {statusLoading ? '...' : tenant.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 space-x-reverse border-b border-admin-border">
            {[
              { id: 'overview', label: 'نمای کلی', icon: Building2 },
              { id: 'metrics', label: 'متریک‌ها', icon: BarChart3 },
              { id: 'users', label: 'کاربران', icon: Users },
              { id: 'activity', label: 'فعالیت‌ها', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-admin-primary text-admin-primary'
                      : 'border-transparent text-admin-text-muted hover:text-admin-text hover:border-admin-border'
                  }`}
                >
                  <Icon className="h-4 w-4 ml-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-admin border border-admin-border p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-admin-text mb-4">اطلاعات پایه</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">نام کسب و کار</p>
                        <p className="text-sm text-admin-text-light">{tenant.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">زیردامنه</p>
                        <p className="text-sm text-admin-text-light">{tenant.subdomain}.servaan.com</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">شهر</p>
                        <p className="text-sm text-admin-text-light">{tenant.city || 'نامشخص'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">نوع کسب و کار</p>
                        <p className="text-sm text-admin-text-light">{tenant.businessType || 'نامشخص'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">نام مالک</p>
                        <p className="text-sm text-admin-text-light">{tenant.ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">ایمیل مالک</p>
                        <p className="text-sm text-admin-text-light">{tenant.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">تلفن مالک</p>
                        <p className="text-sm text-admin-text-light">{tenant.ownerPhone || 'نامشخص'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-admin-text-muted ml-3" />
                      <div>
                        <p className="text-sm font-medium text-admin-text">آخرین فعالیت</p>
                        <p className="text-sm text-admin-text-light">
                          {tenant.usage?.lastActivity ? formatAdminDate(tenant.usage.lastActivity, { format: 'relative' }) : 'نامشخص'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              {tenant.features && (
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-4">ویژگی‌های فعال</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(tenant.features).map(([key, enabled]) => {
                      if (!enabled) return null;
                      const featureLabels: Record<string, string> = {
                        hasInventoryManagement: 'مدیریت موجودی',
                        hasCustomerManagement: 'مدیریت مشتریان',
                        hasAccountingSystem: 'سیستم حسابداری',
                        hasReporting: 'گزارش‌گیری',
                        hasNotifications: 'اعلان‌ها',
                        hasAdvancedReporting: 'گزارش‌گیری پیشرفته',
                        hasApiAccess: 'دسترسی API',
                        hasCustomBranding: 'برندینگ سفارشی',
                        hasMultiLocation: 'چند شعبه',
                        hasAdvancedCRM: 'CRM پیشرفته',
                        hasWhatsappIntegration: 'ادغام واتساپ',
                        hasInstagramIntegration: 'ادغام اینستاگرام',
                        hasAnalyticsBI: 'تحلیل و هوش تجاری'
                      };
                      return (
                        <div key={key} className="flex items-center p-3 bg-green-50 rounded-admin">
                          <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                          <span className="text-sm text-green-800">{featureLabels[key] || key}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Usage Statistics */}
              {tenant.usage && (
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-4">آمار استفاده</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-admin">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-blue-600 ml-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">فضای ذخیره</p>
                          <p className="text-lg font-bold text-blue-900">{tenant.usage.storageUsed}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-admin">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-600 ml-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-800">فراخوانی API</p>
                          <p className="text-lg font-bold text-purple-900">
                            {tenant.usage.apiCallsLastMonth.toLocaleString('fa-IR')}
                          </p>
                          <p className="text-xs text-purple-600">ماه گذشته</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-admin">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-green-600 ml-3" />
                        <div>
                          <p className="text-sm font-medium text-green-800">کاربران فعال</p>
                                                     <p className="text-lg font-bold text-green-900">{metrics?.users?.total || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && metrics && (
            <TenantMetricsDashboard
              tenantId={tenantId}
              metrics={metrics}
              onRefresh={loadTenantData}
            />
          )}

          {activeTab === 'users' && (
            <TenantUserManagement tenantId={tenantId} />
          )}

          {activeTab === 'activity' && (
            <TenantActivityTimeline tenantId={tenantId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(TenantDetailPage);
