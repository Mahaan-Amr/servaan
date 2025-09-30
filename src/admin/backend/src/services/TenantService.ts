import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';

// Simple in-memory cache with TTL for expensive aggregations
type CacheEntry<T> = { value: T; expiresAt: number };
const metricsCache: Map<string, CacheEntry<any>> = new Map();
const DEFAULT_TTL_MS = 60_000; // 1 minute

function withCache<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = metricsCache.get(key);
  if (hit && hit.expiresAt > now) {
    return Promise.resolve(hit.value as T);
  }
  return compute().then((val) => {
    metricsCache.set(key, { value: val, expiresAt: now + ttlMs });
    return val;
  });
}

export interface TenantListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  plan?: string;
  sortBy?: 'createdAt' | 'monthlyRevenue' | 'ordersThisMonth';
  sortDir?: 'asc' | 'desc';
  refresh?: boolean;
  // Enhanced filters
  businessType?: string;
  city?: string;
  country?: string;
  createdFrom?: string; // ISO date string
  createdTo?: string; // ISO date string
  revenueFrom?: number;
  revenueTo?: number;
  userCountFrom?: number;
  userCountTo?: number;
  hasFeatures?: string[]; // Array of feature names
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

export interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  topTenants: Array<{
    id: string;
    name: string;
    subdomain: string;
    revenue: number;
    userCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    tenantId?: string;
  }>;
}

export class TenantService {
  /**
   * Create a new tenant
   */
  static async createTenant(data: any) {
    // Basic normalization
    const normalizedSubdomain = (data.subdomain || '').toLowerCase().trim();

    // Ensure unique subdomain
    const existing = await prisma.tenant.findUnique({ where: { subdomain: normalizedSubdomain } });
    if (existing) {
      throw new Error('SUBDOMAIN_TAKEN');
    }

    const tenant = await prisma.tenant.create({
      data: {
        subdomain: normalizedSubdomain,
        name: data.name,
        displayName: data.displayName || data.name,
        description: data.description || null,
        plan: data.plan || 'STARTER',
        isActive: data.isActive !== false,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPhone: data.ownerPhone || null,
        businessType: data.businessType || null,
        city: data.city || null,
        country: data.country || null,
        currency: 'IRR', // Hotfix: match DB VARCHAR(3) constraint
        // Optional nested features creation if provided
        ...(data.features && {
          features: {
            create: {
              hasInventoryManagement: !!data.features.hasInventoryManagement,
              hasCustomerManagement: !!data.features.hasCustomerManagement,
              hasAccountingSystem: !!data.features.hasAccountingSystem,
              hasReporting: !!data.features.hasReporting,
              hasNotifications: !!data.features.hasNotifications,
              hasAdvancedReporting: !!data.features.hasAdvancedReporting,
              hasApiAccess: !!data.features.hasApiAccess,
              hasCustomBranding: !!data.features.hasCustomBranding,
              hasMultiLocation: !!data.features.hasMultiLocation,
              hasAdvancedCRM: !!data.features.hasAdvancedCRM,
              hasWhatsappIntegration: !!data.features.hasWhatsappIntegration,
              hasInstagramIntegration: !!data.features.hasInstagramIntegration,
              hasAnalyticsBI: !!data.features.hasAnalyticsBI,
            }
          }
        })
      },
      include: { features: true }
    });

    return tenant;
  }
  /**
   * List all tenants with pagination and search
   */
  static async listTenants(params: TenantListParams) {
    const { 
      page, limit, search, status, plan, 
      businessType, city, country, 
      createdFrom, createdTo, 
      revenueFrom, revenueTo, 
      userCountFrom, userCountTo, 
      hasFeatures 
    } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // Text search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { ownerEmail: { contains: search, mode: 'insensitive' } },
        { businessType: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Basic filters
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    if (plan && plan !== 'all') {
      where.plan = plan;
    }

    // Enhanced filters
    if (businessType && businessType !== 'all') {
      where.businessType = businessType;
    }

    if (city && city !== 'all') {
      where.city = city;
    }

    if (country && country !== 'all') {
      where.country = country;
    }

    // Date range filters
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    // Feature filters
    if (hasFeatures && hasFeatures.length > 0) {
      where.features = {
        some: {
          OR: hasFeatures.map(feature => ({
            [feature]: true
          }))
        }
      };
    }

    // Get tenants with features
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          features: true,
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.tenant.count({ where })
    ]);

    // Aggregate monthly revenue for listed tenants (current calendar month)
    const tenantIds = tenants.map((t: any) => t.id);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueByTenant = await withCache<Record<string, number>>(
      `${params.refresh ? 'noCache:' : ''}monthlyRevenue:${tenantIds.sort().join(',')}:${startOfMonth.toISOString()}`,
      DEFAULT_TTL_MS,
      async () => {
        if (tenantIds.length === 0) return {};
        const rows = await prisma.orderPayment.groupBy({
          by: ['tenantId'],
          where: {
            tenantId: { in: tenantIds },
            paymentStatus: 'PAID',
            paymentDate: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });
        const map: Record<string, number> = {};
        for (const r of rows as any[]) {
          map[r.tenantId] = Number(r._sum?.amount || 0);
        }
        return map;
      }
    );

    // Orders count this month per tenant
    const ordersByTenant = await withCache<Record<string, number>>(
      `${params.refresh ? 'noCache:' : ''}ordersThisMonth:${tenantIds.sort().join(',')}:${startOfMonth.toISOString()}`,
      DEFAULT_TTL_MS,
      async () => {
        if (tenantIds.length === 0) return {};
        const rows = await prisma.order.groupBy({
          by: ['tenantId'],
          where: { tenantId: { in: tenantIds }, orderDate: { gte: startOfMonth } },
          _count: { _all: true },
        });
        const map: Record<string, number> = {};
        for (const r of rows as any[]) {
          map[r.tenantId] = Number(r._count?._all || 0);
        }
        return map;
      }
    );

    // Transform data for admin view
    let transformedTenants = tenants.map((tenant: any) => ({
      id: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
      displayName: tenant.displayName,
      plan: tenant.plan,
      isActive: tenant.isActive,
      businessType: tenant.businessType,
      city: tenant.city,
      country: tenant.country,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      userCount: tenant._count.users,
      features: tenant.features,
      monthlyRevenue: revenueByTenant[tenant.id] || 0,
      ordersThisMonth: ordersByTenant[tenant.id] || 0
    }));

    // Apply revenue and user count filters
    if (revenueFrom !== undefined || revenueTo !== undefined) {
      transformedTenants = transformedTenants.filter((tenant: any) => {
        const revenue = tenant.monthlyRevenue || 0;
        if (revenueFrom !== undefined && revenue < revenueFrom) return false;
        if (revenueTo !== undefined && revenue > revenueTo) return false;
        return true;
      });
    }

    if (userCountFrom !== undefined || userCountTo !== undefined) {
      transformedTenants = transformedTenants.filter((tenant: any) => {
        const userCount = tenant.userCount || 0;
        if (userCountFrom !== undefined && userCount < userCountFrom) return false;
        if (userCountTo !== undefined && userCount > userCountTo) return false;
        return true;
      });
    }

    // Apply sort if requested (revenue/orders)
    if (params.sortBy === 'monthlyRevenue') {
      transformedTenants = transformedTenants.sort((a: any, b: any) =>
        (params.sortDir === 'asc' ? 1 : -1) * ((a.monthlyRevenue || 0) - (b.monthlyRevenue || 0))
      );
    } else if (params.sortBy === 'ordersThisMonth') {
      transformedTenants = transformedTenants.sort((a: any, b: any) =>
        (params.sortDir === 'asc' ? 1 : -1) * ((a.ordersThisMonth || 0) - (b.ordersThisMonth || 0))
      );
    }

    return {
      tenants: transformedTenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get tenant by subdomain
   */
  static async getTenantBySubdomain(subdomain: string) {
    return await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
      include: { features: true }
    });
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        features: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
      displayName: tenant.displayName,
      description: tenant.description,
      plan: tenant.plan,
      isActive: tenant.isActive,
      ownerName: tenant.ownerName,
      ownerEmail: tenant.ownerEmail,
      ownerPhone: tenant.ownerPhone,
      businessType: tenant.businessType,
      city: tenant.city,
      country: tenant.country,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      features: tenant.features,
      usage: {
        storageUsed: `${Math.floor(Math.random() * 100)} MB`,
        apiCallsLastMonth: Math.floor(Math.random() * 50000) + 10000,
        lastActivity: new Date()
      }
    };
  }

  /**
   * Get tenant metrics
   */
  static async getTenantMetrics(tenantId: string): Promise<TenantMetrics | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!tenant) return null;

    // Compute basic metrics with caching
    const metrics = await withCache<TenantMetrics>(`tenantMetrics:${tenantId}`, DEFAULT_TTL_MS, async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [ordersTotal, ordersThisMonth, revenueAgg, revenueMonthAgg, customersTotal, customersVisitedThisMonth] = await Promise.all([
        prisma.order.count({ where: { tenantId } }),
        prisma.order.count({ where: { tenantId, orderDate: { gte: startOfMonth } } }),
        prisma.orderPayment.aggregate({
          where: { tenantId, paymentStatus: 'PAID' },
          _sum: { amount: true },
        }),
        prisma.orderPayment.aggregate({
          where: { tenantId, paymentStatus: 'PAID', paymentDate: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        prisma.customer.count({ where: { tenantId, isActive: true } }),
        prisma.customerVisit.count({ where: { tenantId, visitDate: { gte: startOfMonth } } }),
      ]);

      const totalRevenue = Number(revenueAgg._sum.amount || 0);
      const monthRevenue = Number(revenueMonthAgg._sum.amount || 0);

      return {
        users: {
          total: tenant._count.users,
          active: 0,
          inactive: 0,
        },
        customers: {
          total: customersTotal,
          newThisMonth: 0,
          active: customersVisitedThisMonth,
        },
        orders: {
          total: ordersTotal,
          thisMonth: ordersThisMonth,
          averageValue: ordersTotal > 0 ? Math.round(totalRevenue / ordersTotal) : 0,
        },
        revenue: {
          total: totalRevenue,
          thisMonth: monthRevenue,
          growth: 0,
        },
        inventory: {
          items: 0,
          lowStock: 0,
          outOfStock: 0,
        },
      };
    });

    return metrics;
  }

  /**
   * Update tenant
   */
  static async updateTenant(id: string, updateData: any) {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
      include: {
        features: true
      }
    });

    return tenant;
  }

  /**
   * Deactivate tenant
   */
  static async deactivateTenant(id: string) {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: { isActive: false }
    });

    return tenant;
  }

  /**
   * Activate a previously deactivated tenant
   */
  static async activateTenant(id: string) {
    try {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: { isActive: true },
        include: {
          features: true,
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      return tenant;
    } catch (error) {
      console.error('Error activating tenant:', error);
      return null;
    }
  }

  /**
   * Bulk update tenant status
   */
  static async bulkUpdateStatus(tenantIds: string[], isActive: boolean) {
    try {
      const result = await prisma.tenant.updateMany({
        where: {
          id: { in: tenantIds }
        },
        data: { isActive }
      });

      return {
        updatedCount: result.count,
        totalRequested: tenantIds.length
      };
    } catch (error) {
      console.error('Error bulk updating tenant status:', error);
      throw error;
    }
  }

  /**
   * Get tenant activity logs
   */
  static async getTenantActivity(tenantId: string, params: { page: number; limit: number; type?: string }) {
    try {
      const { page, limit } = params;

      // For now, return mock activity data since tenantActivityLog model doesn't exist
      // This would be replaced with actual activity logging when the model is created
      const mockActivities = [
        {
          id: '1',
          tenantId,
          type: 'system_event',
          description: 'Tenant created',
          details: { action: 'CREATE' },
          userId: null,
          user: null,
          createdAt: new Date()
        },
        {
          id: '2',
          tenantId,
          type: 'user_login',
          description: 'First user login',
          details: { action: 'LOGIN' },
          userId: 'user1',
          user: {
            id: 'user1',
            name: 'Admin User',
            email: 'admin@tenant.com'
          },
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        }
      ];

      return {
        activities: mockActivities,
        pagination: {
          page,
          limit,
          total: mockActivities.length,
          pages: Math.ceil(mockActivities.length / limit)
        }
      };
    } catch (error) {
      console.error('Error getting tenant activity:', error);
      throw error;
    }
  }

  /**
   * Get tenant growth analytics
   */
  static async getTenantGrowthAnalytics(params: { days: number; groupBy: 'day' | 'week' | 'month' }) {
    try {
      const { days, groupBy } = params;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Generate date range based on groupBy
      const growthData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${groupBy}, "createdAt") as period,
          CAST(COUNT(*) AS INTEGER) as new_tenants,
          CAST(SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) AS INTEGER) as active_tenants
        FROM "tenants"
        WHERE "createdAt" >= ${startDate}
        GROUP BY 1
        ORDER BY period ASC
      `;

      return {
        period: groupBy,
        days,
        data: growthData
      };
    } catch (error) {
      console.error('Error getting tenant growth analytics:', error);
      throw error;
    }
  }

  /**
   * Get tenant revenue analytics
   */
  static async getTenantRevenueAnalytics(params: { period: 'daily' | 'weekly' | 'monthly' | 'yearly'; year?: number }) {
    try {
      const { period, year } = params;
      
      // For now, return mock data structure - this would integrate with actual revenue data
      const revenueData = {
        period,
        year: year || new Date().getFullYear(),
        data: [
          { period: 'Jan', revenue: 125000, growth: 12.5 },
          { period: 'Feb', revenue: 138000, growth: 10.4 },
          { period: 'Mar', revenue: 145000, growth: 5.1 },
          { period: 'Apr', revenue: 152000, growth: 4.8 },
          { period: 'May', revenue: 158000, growth: 3.9 },
          { period: 'Jun', revenue: 165000, growth: 4.4 }
        ],
        summary: {
          totalRevenue: 883000,
          averageGrowth: 6.9,
          topMonth: 'Jun',
          topRevenue: 165000
        }
      };

      return revenueData;
    } catch (error) {
      console.error('Error getting tenant revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Export tenants data
   */
  static async exportTenants(params: { format: 'csv' | 'excel' | 'pdf'; search?: string; status?: string; plan?: string }) {
    try {
      const { format, search, status, plan } = params;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { subdomain: { contains: search, mode: 'insensitive' } },
          { ownerName: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status && status !== 'all') {
        where.isActive = status === 'active';
      }

      if (plan && plan !== 'all') {
        where.plan = plan;
      }

      // Get all tenants for export
      const tenants = await prisma.tenant.findMany({
        where,
        include: {
          features: true,
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // For now, return CSV format - this would be enhanced with proper CSV generation
      if (format === 'csv') {
        const csvHeaders = 'ID,Name,Subdomain,Plan,Status,Owner,Users,Created At\n';
        const csvRows = tenants.map((tenant: any) => 
          `${tenant.id},"${tenant.name}","${tenant.subdomain}","${tenant.plan}","${tenant.isActive ? 'Active' : 'Inactive'}","${tenant.ownerName}",${tenant._count.users},"${tenant.createdAt.toISOString()}"`
        ).join('\n');
        
        return csvHeaders + csvRows;
      }

      // Generate PDF format
      if (format === 'pdf') {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];
        
        // Collect PDF data chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        
        // Generate PDF content
        doc.fontSize(20).text('Tenants Export Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Add tenant data
        tenants.forEach((tenant: any, index: number) => {
          doc.fontSize(14).text(`${index + 1}. ${tenant.name}`, { underline: true });
          doc.fontSize(10).text(`Subdomain: ${tenant.subdomain}`);
          doc.fontSize(10).text(`Plan: ${tenant.plan}`);
          doc.fontSize(10).text(`Status: ${tenant.isActive ? 'Active' : 'Inactive'}`);
          doc.fontSize(10).text(`Owner: ${tenant.ownerName || 'N/A'}`);
          doc.fontSize(10).text(`Users: ${tenant._count.users}`);
          doc.fontSize(10).text(`Created: ${tenant.createdAt.toLocaleDateString()}`);
          doc.moveDown();
        });
        
        // Finalize PDF
        doc.end();
        
        // Wait for all chunks and combine
        return new Promise<Buffer>((resolve) => {
          doc.on('end', () => {
            const result = Buffer.concat(chunks);
            resolve(result);
          });
        });
      }
      
      // For Excel format, return CSV for now (would be enhanced with proper Excel generation)
      if (format === 'excel') {
        const csvHeaders = 'ID,Name,Subdomain,Plan,Status,Owner,Users,Created At\n';
        const csvRows = tenants.map((tenant: any) => 
          `${tenant.id},"${tenant.name}","${tenant.subdomain}","${tenant.plan}","${tenant.isActive ? 'Active' : 'Inactive'}","${tenant.ownerName}",${tenant._count.users},"${tenant.createdAt.toISOString()}"`
        ).join('\n');
        
        return csvHeaders + csvRows;
      }
      
      // For other formats, return JSON for now
      return JSON.stringify(tenants, null, 2);
    } catch (error) {
      console.error('Error exporting tenants:', error);
      throw error;
    }
  }

  /**
   * Get platform overview
   */
  static async getPlatformOverview(): Promise<PlatformOverview> {
    const [totalTenants, activeTenants, totalUsers] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count()
    ]);

    // Get top tenants by user count
    const topTenants = await prisma.tenant.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    const transformedTopTenants = topTenants.map((tenant: any) => ({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      revenue: Math.floor(Math.random() * 10000000) + 1000000,
      userCount: tenant._count.users
    }));

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalRevenue: Math.floor(Math.random() * 1000000000) + 100000000,
      monthlyGrowth: Math.floor(Math.random() * 50) + 10,
      topTenants: transformedTopTenants,
      recentActivity: [
        {
          type: 'TENANT_CREATED',
          description: 'مستأجر جدید ایجاد شد',
          timestamp: new Date(),
          tenantId: 'mock-id-1'
        },
        {
          type: 'USER_LOGIN',
          description: 'کاربر وارد سیستم شد',
          timestamp: new Date(),
          tenantId: 'mock-id-2'
        }
      ]
    };
  }

  /**
   * Reset tenant user password by email
   */
  static async resetTenantUserPasswordByEmail(tenantId: string, email: string, newPassword: string): Promise<{ id: string; email: string }> {
    const user = await prisma.user.findFirst({ where: { tenantId, email } });
    if (!user) {
      throw new Error('TENANT_USER_NOT_FOUND');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });
    return { id: updated.id, email: updated.email } as any;
  }

  /**
   * List tenant users (minimal fields)
   */
  static async listTenantUsers(tenantId: string, search?: string, limit: number = 50): Promise<Array<{ id: string; email: string; name: string | null }>> {
    const where: any = { tenantId };
    if (search && search.trim().length > 0) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        // If your schema has name/fullName fields, include them; harmless if not present at runtime selection time is controlled below
      ];
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true as any },
      take: limit,
      orderBy: { email: 'asc' }
    });
    return users as any;
  }
}
