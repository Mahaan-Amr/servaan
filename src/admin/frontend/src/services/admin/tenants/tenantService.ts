// Tenant Service for Admin Frontend
// سرویس مدیریت مستأجرین برای پنل مدیریت

import adminApi from '../../adminAuthService';
import { 
  Tenant, 
  TenantStatus, 
  TenantPlan, 
  TenantActivityParams,
  TenantActivityResponse,
  TenantGrowthAnalytics,
  TenantRevenueAnalytics,
  BulkStatusUpdateRequest,
  BulkStatusUpdateResponse
} from '../../../types/admin';

export interface TenantListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  plan?: string;
}

export interface TenantListResponse {
  tenants: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TenantMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    active: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    averageValue: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
  };
  inventory: {
    items: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface TenantDetail {
  id: string;
  subdomain: string;
  name: string;
  displayName: string;
  description?: string;
  plan: TenantPlan;
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  businessType?: string;
  city?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  features: {
    hasInventoryManagement: boolean;
    hasCustomerManagement: boolean;
    hasAccountingSystem: boolean;
    hasReporting: boolean;
    hasNotifications: boolean;
    hasAdvancedReporting: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
    hasMultiLocation: boolean;
    hasAdvancedCRM: boolean;
    hasWhatsappIntegration: boolean;
    hasInstagramIntegration: boolean;
    hasAnalyticsBI: boolean;
  };
  usage: {
    storageUsed: string;
    apiCallsLastMonth: number;
    lastActivity: Date;
  };
  metrics: TenantMetrics;
}

export interface TenantUpdateData {
  name?: string;
  displayName?: string;
  description?: string;
  plan?: TenantPlan;
  isActive?: boolean;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessType?: string;
  city?: string;
  country?: string;
  features?: Partial<{
    hasInventoryManagement: boolean;
    hasCustomerManagement: boolean;
    hasAccountingSystem: boolean;
    hasReporting: boolean;
    hasNotifications: boolean;
    hasAdvancedReporting: boolean;
    hasApiAccess: boolean;
    hasCustomBranding: boolean;
    hasMultiLocation: boolean;
    hasAdvancedCRM: boolean;
    hasWhatsappIntegration: boolean;
    hasInstagramIntegration: boolean;
    hasAnalyticsBI: boolean;
  }>;
}

/**
 * Get list of all tenants with pagination and search
 */
export const getTenants = async (params: TenantListParams): Promise<TenantListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());
    
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.plan) queryParams.append('plan', params.plan);

    const response = await adminApi.get(`/admin/tenants?${queryParams.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت لیست مستأجرین');
  }
};

/**
 * Get detailed information about a specific tenant
 */
export const getTenantById = async (id: string): Promise<TenantDetail> => {
  try {
    const response = await adminApi.get(`/admin/tenants/${id}`);
    return response.data.data.tenant;
  } catch (error: any) {
    console.error('Error fetching tenant details:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت جزئیات مستأجر');
  }
};

/**
 * Get detailed metrics for a specific tenant
 */
export const getTenantMetrics = async (id: string): Promise<TenantMetrics> => {
  try {
    const response = await adminApi.get(`/admin/tenants/${id}/metrics`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant metrics:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت متریک‌های مستأجر');
  }
};

/**
 * Update tenant information
 */
export const updateTenant = async (id: string, data: TenantUpdateData): Promise<TenantDetail> => {
  try {
    const response = await adminApi.put(`/admin/tenants/${id}`, data);
    return response.data.data.tenant;
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    throw new Error(error.response?.data?.message || 'خطا در به‌روزرسانی مستأجر');
  }
};

/**
 * Deactivate a tenant (soft delete)
 */
export const deactivateTenant = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await adminApi.delete(`/admin/tenants/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deactivating tenant:', error);
    throw new Error(error.response?.data?.message || 'خطا در غیرفعال‌سازی مستأجر');
  }
};

/**
 * Activate a previously deactivated tenant
 */
export const activateTenant = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await adminApi.put(`/admin/tenants/${id}`, { isActive: true });
    return response.data;
  } catch (error: any) {
    console.error('Error activating tenant:', error);
    throw new Error(error.response?.data?.message || 'خطا در فعال‌سازی مستأجر');
  }
};

/**
 * Get tenant growth data for analytics
 */
export const getTenantGrowthData = async (days: number = 30) => {
  try {
    const response = await adminApi.get(`/admin/tenants/growth?days=${days}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant growth data:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت داده‌های رشد مستأجرین');
  }
};

/**
 * Get platform overview with tenant statistics
 */
export const getPlatformOverview = async () => {
  try {
    const response = await adminApi.get('/admin/tenants/overview');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching platform overview:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت نمای کلی پلتفرم');
  }
};

/**
 * Export tenants data
 */
export const exportTenants = async (format: 'csv' | 'excel' | 'pdf', filters?: Partial<TenantListParams>) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    if (filters) {
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.plan) queryParams.append('plan', filters.plan);
    }

    const response = await adminApi.get(`/admin/tenants/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tenants-export-${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error: any) {
    console.error('Error exporting tenants:', error);
    throw new Error(error.response?.data?.message || 'خطا در صادرات داده‌ها');
  }
};

/**
 * Bulk update tenant status
 */
export const bulkUpdateTenantStatus = async (tenantIds: string[], isActive: boolean) => {
  try {
    const response = await adminApi.post('/admin/tenants/bulk-status', {
      tenantIds,
      isActive
    });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk updating tenant status:', error);
    throw new Error(error.response?.data?.message || 'خطا در به‌روزرسانی وضعیت گروهی');
  }
};

/**
 * Get tenant activity logs
 */
export const getTenantActivity = async (tenantId: string, params: TenantActivityParams) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());
    
    if (params.type) {
      queryParams.append('type', params.type);
    }

    const response = await adminApi.get(`/admin/tenants/${tenantId}/activity?${queryParams.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant activity:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت فعالیت‌های مستأجر');
  }
};

/**
 * Get tenant growth analytics
 */
export const getTenantGrowthAnalytics = async (days: number = 30, groupBy: 'day' | 'week' | 'month' = 'day') => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days.toString());
    queryParams.append('groupBy', groupBy);

    const response = await adminApi.get(`/admin/tenants/analytics/growth?${queryParams.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant growth analytics:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت تحلیل رشد مستأجرین');
  }
};

/**
 * Get tenant revenue analytics
 */
export const getTenantRevenueAnalytics = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly', year?: number) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('period', period);
    
    if (year) {
      queryParams.append('year', year.toString());
    }

    const response = await adminApi.get(`/admin/tenants/analytics/revenue?${queryParams.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching tenant revenue analytics:', error);
    throw new Error(error.response?.data?.message || 'خطا در دریافت تحلیل درآمد مستأجرین');
  }
};
