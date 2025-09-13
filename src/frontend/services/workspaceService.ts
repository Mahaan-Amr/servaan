// Workspace Service for Servaan Business Management System
// سرویس فضای کاری برای سیستم مدیریت کسب‌وکار سِروان

import { 
  Workspace, 
  WorkspaceId, 
  WorkspaceService as IWorkspaceService,
  WorkspaceAccessLevel,
  WorkspacePermission,
  UserWorkspaceAccess,
  WorkspaceStats,
  WorkspaceAnalytics
} from '../types/workspace';
import { 
  PREDEFINED_WORKSPACES, 
  DEFAULT_WORKSPACE_CONFIG,
  getWorkspaceById,
  getWorkspacesByRole
} from '../constants/workspaces';
import { getToken } from './authService';
import { API_URL } from '../lib/apiUtils';

/**
 * Cache entry interface - رابط ورودی کش
 */
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

/**
 * Workspace Service Implementation - پیاده‌سازی سرویس فضای کاری
 */
class WorkspaceService implements IWorkspaceService {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all workspaces - دریافت همه فضاهای کاری
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    const cacheKey = 'all-workspaces';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as Workspace[];

    try {
      // For now, return predefined workspaces
      // In future, this could fetch from API
      const workspaces = [...PREDEFINED_WORKSPACES];
      
      // Update stats for active workspaces
      for (const workspace of workspaces) {
        if (workspace.status === 'active') {
          try {
            workspace.stats = await this.updateWorkspaceStats(workspace.id);
          } catch (error) {
            console.warn(`Failed to update stats for workspace ${workspace.id}:`, error);
          }
        }
      }

      this.setCache(cacheKey, workspaces);
      return workspaces;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return PREDEFINED_WORKSPACES;
    }
  }

  /**
   * Get workspace by ID - دریافت فضای کاری با شناسه
   */
  async getWorkspaceById(id: WorkspaceId): Promise<Workspace | null> {
    const cacheKey = `workspace-${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as Workspace;

    try {
      const workspace = getWorkspaceById(id);
      if (!workspace) return null;

      // Update stats if workspace is active
      if (workspace.status === 'active') {
        try {
          workspace.stats = await this.updateWorkspaceStats(id);
        } catch (error) {
          console.warn(`Failed to update stats for workspace ${id}:`, error);
        }
      }

      this.setCache(cacheKey, workspace);
      return workspace;
    } catch (error) {
      console.error(`Error fetching workspace ${id}:`, error);
      return getWorkspaceById(id) || null;
    }
  }

  /**
   * Get user workspace access - دریافت دسترسی کاربر به فضاهای کاری
   */
  async getUserWorkspaceAccess(userId: string): Promise<UserWorkspaceAccess[]> {
    const cacheKey = `user-access-${userId}-v2`; // Force cache refresh for ordering workspace
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as UserWorkspaceAccess[];

    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

      const response = await fetch(`${API_URL}/workspace/user-access/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': hostname === 'localhost' ? 'dima' : hostname.split('.')[0] // Use custom header instead of Host
        }
      });

      if (response.ok) {
        const apiResponse = await response.json();
        
        // Transform backend response to expected format
        if (apiResponse.success && apiResponse.data) {
          const userAccess = this.transformBackendResponse(apiResponse.data);
          this.setCache(cacheKey, userAccess);
          return userAccess;
        }
      }
      
      // Fallback: generate default access based on user role
      return this.generateDefaultUserAccess(userId);
    } catch (error) {
      console.error(`Error fetching user access for ${userId}:`, error);
      return this.generateDefaultUserAccess(userId);
    }
  }

  /**
   * Update workspace statistics - به‌روزرسانی آمار فضای کاری
   */
  async updateWorkspaceStats(workspaceId: WorkspaceId): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      let stats: WorkspaceStats;

      switch (workspaceId) {
        case 'inventory-management':
          stats = await this.getInventoryStats();
          break;
        case 'business-intelligence':
          stats = await this.getBusinessIntelligenceStats();
          break;
        case 'accounting-system':
          stats = await this.getAccountingStats();
          break;
        case 'customer-relationship-management':
          stats = await this.getCRMStats();
          break;
        case 'sms-management':
          stats = await this.getSMSStats();
          break;
        case 'ordering-sales-system':
          stats = await this.getOrderingStats();
          break;
        default:
          stats = this.getDefaultStats(workspaceId);
      }

      return stats;
    } catch (error) {
      console.error(`Error updating stats for workspace ${workspaceId}:`, error);
      return this.getDefaultStats(workspaceId);
    }
  }

  /**
   * Check user access level - بررسی سطح دسترسی کاربر
   */
  async checkUserAccess(userId: string, workspaceId: WorkspaceId): Promise<WorkspaceAccessLevel> {
    try {
      const userAccess = await this.getUserWorkspaceAccess(userId);
      if (!Array.isArray(userAccess)) {
        return 'none';
      }
      const access = userAccess.find(a => a.workspaceId === workspaceId);
      return access?.accessLevel || 'none';
    } catch (error) {
      console.error(`Error checking user access for ${userId} to ${workspaceId}:`, error);
      return 'none';
    }
  }

  /**
   * Check if user has specific permission - بررسی مجوز خاص کاربر
   */
  async hasPermission(userId: string, workspaceId: WorkspaceId, permission: WorkspacePermission): Promise<boolean> {
    try {
      const userAccess = await this.getUserWorkspaceAccess(userId);
      if (!Array.isArray(userAccess)) {
        return false;
      }
      const access = userAccess.find(a => a.workspaceId === workspaceId);
      
      if (!access || !access.isActive) return false;
      
      // Full access has all permissions
      if (access.accessLevel === 'full') return true;
      
      // Check specific permissions
      return access.permissions.includes(permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for ${userId} to ${workspaceId}:`, error);
      return false;
    }
  }

  /**
   * Get workspace analytics - دریافت تحلیل‌های فضای کاری
   */
  async getWorkspaceAnalytics(workspaceId: WorkspaceId): Promise<WorkspaceAnalytics | null> {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/workspace/analytics/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching analytics for workspace ${workspaceId}:`, error);
      return null;
    }
  }

  /**
   * Update user workspace access - به‌روزرسانی دسترسی کاربر به فضای کاری
   */
  async updateUserAccess(
    userId: string, 
    workspaceId: WorkspaceId, 
    accessLevel: WorkspaceAccessLevel,
    permissions?: WorkspacePermission[]
  ): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];

      const response = await fetch(`${API_URL}/workspace/user-access`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': subdomain
        },
        body: JSON.stringify({
          userId,
          workspaceId,
          accessLevel,
          permissions: permissions || this.getDefaultPermissions(accessLevel)
        })
      });

      if (response.ok) {
        // Clear cache for this user
        this.clearCache(`user-access-${userId}-v2`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error updating user access for ${userId} to ${workspaceId}:`, error);
      return false;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Get inventory workspace stats - دریافت آمار فضای کاری موجودی
   */
  private async getInventoryStats(): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      if (!token) {
        console.warn('No auth token available for inventory stats');
        return this.getDefaultStatsWithRealData('inventory-management');
      }

      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];

      const [itemsRes, lowStockRes, transactionsRes] = await Promise.all([
        fetch(`${API_URL}/items/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          }
        }).catch(() => null),
        fetch(`${API_URL}/inventory/low-stock/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          }
        }).catch(() => null),
        fetch(`${API_URL}/inventory/today/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          }
        }).catch(() => null)
      ]);

      const [itemsCount, lowStockCount, transactionsCount] = await Promise.all([
        itemsRes?.ok ? itemsRes.json().catch(() => ({ data: { count: 0 } })) : { data: { count: 0 } },
        lowStockRes?.ok ? lowStockRes.json().catch(() => ({ data: { count: 0 } })) : { data: { count: 0 } },
        transactionsRes?.ok ? transactionsRes.json().catch(() => ({ data: { count: 0 } })) : { data: { count: 0 } }
      ]);

      // Use real data from API, fallback to 0 for new tenants
      const itemsValue = itemsCount.data?.count || 0;
      const lowStockValue = lowStockCount.data?.count || 0;
      const transactionsValue = transactionsCount.data?.count || 0;

      return {
        primary: {
          label: 'کل کالاها',
          value: itemsValue.toLocaleString('fa-IR'),
          icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
          color: 'text-blue-500'
        },
        secondary: {
          label: 'کالاهای کم موجود',
          value: lowStockValue.toLocaleString('fa-IR'),
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
          color: 'text-red-500'
        },
        tertiary: {
          label: 'تراکنش‌های امروز',
          value: transactionsValue.toLocaleString('fa-IR'),
          icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
          color: 'text-green-500'
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return this.getDefaultStatsWithRealData('inventory-management');
    }
  }

  /**
   * Get business intelligence workspace stats - دریافت آمار فضای کاری هوش تجاری
   */
  private async getBusinessIntelligenceStats(): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      
      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];
      
      const [reportsRes, analyticsRes, exportsRes] = await Promise.all([
        fetch(`${API_URL}/reports/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          } 
        }),
        fetch(`${API_URL}/analytics/monthly/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          } 
        }),
        fetch(`${API_URL}/bi/reports/exports/today/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          } 
        })
      ]);

      const [reportsCount, analyticsCount, exportsCount] = await Promise.all([
        reportsRes.ok ? reportsRes.json() : { data: { count: 0 } },
        analyticsRes.ok ? analyticsRes.json() : { data: { count: 0 } },
        exportsRes.ok ? exportsRes.json() : { data: { count: 0 } }
      ]);

      return {
        primary: {
          label: 'گزارش‌های فعال',
          value: reportsCount.data?.count?.toLocaleString('fa-IR') || '0',
          icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          color: 'text-purple-500'
        },
        secondary: {
          label: 'تحلیل‌های ماهانه',
          value: analyticsCount.data?.count?.toLocaleString('fa-IR') || '0',
          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
          color: 'text-blue-500'
        },
        tertiary: {
          label: 'خروجی‌های امروز',
          value: exportsCount.data?.count?.toLocaleString('fa-IR') || '0',
          icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          color: 'text-green-500'
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching business intelligence stats:', error);
      return this.getDefaultStatsWithRealData('business-intelligence');
    }
  }

  /**
   * Get accounting workspace stats - دریافت آمار فضای کاری حسابداری
   */
  private async getAccountingStats(): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      
      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];
      
      const [accountsRes, journalRes, balanceRes] = await Promise.all([
        fetch(`${API_URL}/accounting/accounts/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          } 
        }),
        fetch(`${API_URL}/accounting/journal-entries/monthly/count`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          } 
        }),
        fetch(`${API_URL}/accounting/balance/today`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-Subdomain': subdomain
          } 
        })
      ]);

      const [accountsCount, journalCount, balance] = await Promise.all([
        accountsRes.ok ? accountsRes.json() : { data: { count: 0 } },
        journalRes.ok ? journalRes.json() : { data: { count: 0 } },
        balanceRes.ok ? balanceRes.json() : { data: { balance: 0 } }
      ]);

      const formatPrice = (price: number): string => {
        if (price >= 1000000) {
          return `${(price / 1000000).toFixed(1)} میلیون تومان`;
        } else if (price >= 1000) {
          return `${(price / 1000).toFixed(0)} هزار تومان`;
        }
        return `${price.toLocaleString('fa-IR')} تومان`;
      };

      return {
        primary: {
          label: 'حساب‌های فعال',
          value: accountsCount.data?.count?.toLocaleString('fa-IR') || '0',
          icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
          color: 'text-green-500'
        },
        secondary: {
          label: 'اسناد این ماه',
          value: journalCount.data?.count?.toLocaleString('fa-IR') || '0',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          color: 'text-blue-500'
        },
        tertiary: {
          label: 'تراز امروز',
          value: formatPrice(balance.data?.balance || 0),
          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          color: 'text-purple-500'
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching accounting stats:', error);
      return this.getDefaultStatsWithRealData('accounting-system');
    }
  }

  /**
   * Get CRM statistics - دریافت آمار CRM
   */
  private async getCRMStats(): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];

      const response = await fetch(`${API_URL}/crm/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': subdomain
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          primary: {
            label: 'مشتریان فعال',
            value: data.totalCustomers?.toString() || '0',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            color: 'text-pink-500'
          },
          secondary: {
            label: 'بازدیدهای ماه',
            value: data.monthlyVisits?.toString() || '0',
            icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            color: 'text-green-500'
          },
          tertiary: {
            label: 'امتیازات فعال',
            value: data.totalLoyaltyPoints?.toString() || '0',
            icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
            color: 'text-yellow-500'
          },
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to fetch CRM stats');
      }
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return this.getDefaultStatsWithRealData('customer-relationship-management');
    }
  }

  /**
   * Get SMS statistics - دریافت آمار پیامک
   */
  private async getSMSStats(): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];

      const response = await fetch(`${API_URL}/sms/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': subdomain
        }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data;
        
        return {
          primary: {
            label: 'اعتبار باقی مانده',
            value: stats.remainingCredit?.toString() || '۰',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-emerald-500'
          },
          secondary: {
            label: 'دعوت نامه‌های فعال',
            value: '۰', // This would need a separate API call
            icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
            color: 'text-blue-500'
          },
          tertiary: {
            label: 'پیامک‌های ارسالی',
            value: stats.totalSent?.toString() || '۰',
            icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
            color: 'text-green-500'
          },
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to fetch SMS stats');
      }
    } catch (error) {
      console.error('Error fetching SMS stats:', error);
      return this.getDefaultStatsWithRealData('sms-management');
    }
  }

  /**
   * Get Ordering & Sales statistics - دریافت آمار سفارش‌گیری و فروش
   */
  private async getOrderingStats(): Promise<WorkspaceStats> {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token');

      // For now, return default stats since ordering stats API might not be implemented yet
      // In the future, this could call /api/orders/stats or similar endpoint
      
    } catch (error) {
      console.error('Error fetching Ordering stats:', error);
    }

    // Fallback to default stats
    return this.getDefaultStatsWithRealData('ordering-sales-system');
  }

  /**
   * Get default stats for workspace - دریافت آمار پیش‌فرض فضای کاری
   */
  private getDefaultStats(workspaceId: WorkspaceId): WorkspaceStats {
    const workspace = getWorkspaceById(workspaceId);
    return workspace?.stats || {
      primary: { label: 'آماده', value: '0', icon: '', color: 'text-gray-500' },
      secondary: { label: 'آماده', value: '0', icon: '', color: 'text-gray-500' },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get default stats with realistic sample data - دریافت آمار پیش‌فرض با داده‌های نمونه واقعی
   */
  private getDefaultStatsWithRealData(workspaceId: WorkspaceId): WorkspaceStats {
    switch (workspaceId) {
      case 'inventory-management':
        return {
          primary: {
            label: 'کل کالاها',
            value: '۰',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            color: 'text-blue-500'
          },
          secondary: {
            label: 'کالاهای کم موجود',
            value: '۰',
            icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            color: 'text-red-500'
          },
          tertiary: {
            label: 'تراکنش‌های امروز',
            value: '۰',
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            color: 'text-green-500'
          },
          lastUpdated: new Date().toISOString()
        };
      case 'business-intelligence':
        return {
          primary: {
            label: 'گزارش‌های فعال',
            value: '۰',
            icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            color: 'text-purple-500'
          },
          secondary: {
            label: 'تحلیل‌های ماهانه',
            value: '۰',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            color: 'text-blue-500'
          },
          tertiary: {
            label: 'خروجی‌های امروز',
            value: '۰',
            icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            color: 'text-green-500'
          },
          lastUpdated: new Date().toISOString()
        };
      case 'accounting-system':
        return {
          primary: {
            label: 'حساب‌های فعال',
            value: '۰',
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            color: 'text-green-500'
          },
          secondary: {
            label: 'اسناد این ماه',
            value: '۰',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            color: 'text-blue-500'
          },
          tertiary: {
            label: 'تراز امروز',
            value: '۰ ریال',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-purple-500'
          },
          lastUpdated: new Date().toISOString()
        };
      case 'customer-relationship-management':
        return {
          primary: {
            label: 'مشتریان فعال',
            value: '0',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            color: 'text-pink-500'
          },
          secondary: {
            label: 'بازدیدهای ماه',
            value: '0',
            icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            color: 'text-green-500'
          },
          tertiary: {
            label: 'امتیازات فعال',
            value: '0',
            icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
            color: 'text-yellow-500'
          },
          lastUpdated: new Date().toISOString()
        };
      case 'sms-management':
        return {
          primary: {
            label: 'اعتبار باقی مانده',
            value: '۰',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-emerald-500'
          },
          secondary: {
            label: 'دعوت نامه‌های فعال',
            value: '۰',
            icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
            color: 'text-blue-500'
          },
          tertiary: {
            label: 'پیامک‌های ارسالی',
            value: '۰',
            icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
            color: 'text-green-500'
          },
          lastUpdated: new Date().toISOString()
        };
      case 'ordering-sales-system':
        return {
          primary: {
            label: 'میزهای فعال',
            value: '۰۰',
            icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
            color: 'text-amber-500'
          },
          secondary: {
            label: 'فروش امروز',
            value: '۰ ریال',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-green-500'
          },
          tertiary: {
            label: 'سفارشات امروز',
            value: '۰',
            icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01',
            color: 'text-blue-500'
          },
          lastUpdated: new Date().toISOString()
        };
      default:
        return this.getDefaultStats(workspaceId);
    }
  }

  /**
   * Generate default user access - تولید دسترسی پیش‌فرض کاربر
   */
  private async generateDefaultUserAccess(userId: string): Promise<UserWorkspaceAccess[]> {
    try {
      // Get user info to determine role-based access
      const token = getToken();
      
      // Get current hostname for tenant context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const subdomain = hostname === 'localhost' ? 'dima' : hostname.split('.')[0];
      
      const userRes = await fetch(`${API_URL}/users/${userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Tenant-Subdomain': subdomain
        }
      });

      let userRole = 'STAFF';
      if (userRes.ok) {
        const user = await userRes.json();
        userRole = user.role;
      }

      const workspaces = getWorkspacesByRole(userRole);
      const defaultAccessLevel = DEFAULT_WORKSPACE_CONFIG.roleBasedAccess[userRole as keyof typeof DEFAULT_WORKSPACE_CONFIG.roleBasedAccess];

      return workspaces.map(workspace => ({
        userId,
        workspaceId: workspace.id,
        accessLevel: defaultAccessLevel,
        permissions: this.getDefaultPermissions(defaultAccessLevel),
        grantedAt: new Date().toISOString(),
        grantedBy: 'system',
        isActive: true
      }));
    } catch (error) {
      console.error('Error generating default user access:', error);
      return [];
    }
  }

  /**
   * Get default permissions for access level - دریافت مجوزهای پیش‌فرض برای سطح دسترسی
   */
  private getDefaultPermissions(accessLevel: WorkspaceAccessLevel): WorkspacePermission[] {
    switch (accessLevel) {
      case 'full':
        return ['read', 'write', 'delete', 'export_data', 'view_reports', 'admin'];
      case 'read-only':
        return ['read', 'export_data', 'view_reports'];
      case 'restricted':
        return ['read'];
      default:
        return [];
    }
  }

  /**
   * Transform backend response to expected format - تبدیل پاسخ بک‌اند به فرمت مورد انتظار
   */
  private transformBackendResponse(backendData: {
    userId: string;
    workspaces: Record<string, { hasAccess: boolean; level: string }>;
  }): UserWorkspaceAccess[] {
    if (!backendData || !backendData.workspaces) {
      return [];
    }

    const userAccess: UserWorkspaceAccess[] = [];
    
    for (const [workspaceId, accessData] of Object.entries(backendData.workspaces)) {
      const access = accessData as { hasAccess: boolean; level: string };
      
      if (access.hasAccess) {
        const accessLevel = this.mapAccessLevel(access.level);
        userAccess.push({
          userId: backendData.userId,
          workspaceId: workspaceId as WorkspaceId,
          accessLevel,
          permissions: this.getDefaultPermissions(accessLevel),
          grantedAt: new Date().toISOString(),
          grantedBy: 'system',
          isActive: true
        });
      }
    }

    return userAccess;
  }

  /**
   * Map backend access level to frontend format - نگاشت سطح دسترسی بک‌اند به فرمت فرانت‌اند
   */
  private mapAccessLevel(backendLevel: string): WorkspaceAccessLevel {
    switch (backendLevel) {
      case 'full':
        return 'full';
      case 'read-only':
        return 'read-only';
      case 'restricted':
        return 'restricted';
      default:
        return 'none';
    }
  }

  /**
   * Cache management methods - روش‌های مدیریت کش
   */
  private getFromCache(key: string): unknown {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();

// Export utility functions
export {
  getWorkspaceById,
  getActiveWorkspaces,
  getComingSoonWorkspaces,
  getWorkspacesByRole
} from '../constants/workspaces';

// Export helper functions
export const getWorkspaceColor = (workspaceId: WorkspaceId): string => {
  const workspace = getWorkspaceById(workspaceId);
  return workspace?.color.primary || 'gray-500';
};

export const getWorkspaceIcon = (workspaceId: WorkspaceId): string => {
  const workspace = getWorkspaceById(workspaceId);
  return workspace?.icon || '';
};

export const isWorkspaceAvailable = (workspaceId: WorkspaceId): boolean => {
  const workspace = getWorkspaceById(workspaceId);
  return workspace?.status === 'active';
};

export const canUserAccessWorkspace = async (userId: string, workspaceId: WorkspaceId): Promise<boolean> => {
  const accessLevel = await workspaceService.checkUserAccess(userId, workspaceId);
  return accessLevel !== 'none';
}; 