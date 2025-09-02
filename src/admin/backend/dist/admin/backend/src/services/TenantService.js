"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const prisma_1 = require("../lib/prisma");
const pdfkit_1 = __importDefault(require("pdfkit"));
class TenantService {
    /**
     * List all tenants with pagination and search
     */
    static async listTenants(params) {
        const { page, limit, search, status, plan } = params;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
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
        // Get tenants with features
        const [tenants, total] = await Promise.all([
            prisma_1.prisma.tenant.findMany({
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
            prisma_1.prisma.tenant.count({ where })
        ]);
        // Transform data for admin view
        const transformedTenants = tenants.map((tenant) => ({
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
            // Add mock metrics for now (will be replaced with real data)
            metrics: {
                userCount: tenant._count.users,
                customerCount: Math.floor(Math.random() * 1000) + 100,
                orderCount: Math.floor(Math.random() * 500) + 50,
                revenue: Math.floor(Math.random() * 10000000) + 1000000
            }
        }));
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
     * Get tenant by ID
     */
    static async getTenantById(id) {
        const tenant = await prisma_1.prisma.tenant.findUnique({
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
        if (!tenant)
            return null;
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
    static async getTenantMetrics(tenantId) {
        const tenant = await prisma_1.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });
        if (!tenant)
            return null;
        // For now, return mock metrics (will be replaced with real data)
        return {
            users: {
                total: tenant._count.users,
                active: Math.floor(tenant._count.users * 0.8),
                inactive: Math.floor(tenant._count.users * 0.2)
            },
            customers: {
                total: Math.floor(Math.random() * 1000) + 100,
                newThisMonth: Math.floor(Math.random() * 50) + 10,
                active: Math.floor(Math.random() * 500) + 50
            },
            orders: {
                total: Math.floor(Math.random() * 500) + 50,
                thisMonth: Math.floor(Math.random() * 100) + 20,
                averageValue: Math.floor(Math.random() * 50000) + 25000
            },
            revenue: {
                total: Math.floor(Math.random() * 10000000) + 1000000,
                thisMonth: Math.floor(Math.random() * 2000000) + 200000,
                growth: Math.floor(Math.random() * 30) + 5
            },
            inventory: {
                items: Math.floor(Math.random() * 100) + 20,
                lowStock: Math.floor(Math.random() * 10) + 1,
                outOfStock: Math.floor(Math.random() * 5)
            }
        };
    }
    /**
     * Update tenant
     */
    static async updateTenant(id, updateData) {
        const tenant = await prisma_1.prisma.tenant.update({
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
    static async deactivateTenant(id) {
        const tenant = await prisma_1.prisma.tenant.update({
            where: { id },
            data: { isActive: false }
        });
        return tenant;
    }
    /**
     * Activate a previously deactivated tenant
     */
    static async activateTenant(id) {
        try {
            const tenant = await prisma_1.prisma.tenant.update({
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
        }
        catch (error) {
            console.error('Error activating tenant:', error);
            return null;
        }
    }
    /**
     * Bulk update tenant status
     */
    static async bulkUpdateStatus(tenantIds, isActive) {
        try {
            const result = await prisma_1.prisma.tenant.updateMany({
                where: {
                    id: { in: tenantIds }
                },
                data: { isActive }
            });
            return {
                updatedCount: result.count,
                totalRequested: tenantIds.length
            };
        }
        catch (error) {
            console.error('Error bulk updating tenant status:', error);
            throw error;
        }
    }
    /**
     * Get tenant activity logs
     */
    static async getTenantActivity(tenantId, params) {
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
        }
        catch (error) {
            console.error('Error getting tenant activity:', error);
            throw error;
        }
    }
    /**
     * Get tenant growth analytics
     */
    static async getTenantGrowthAnalytics(params) {
        try {
            const { days, groupBy } = params;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            // Generate date range based on groupBy
            const growthData = await prisma_1.prisma.$queryRaw `
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
        }
        catch (error) {
            console.error('Error getting tenant growth analytics:', error);
            throw error;
        }
    }
    /**
     * Get tenant revenue analytics
     */
    static async getTenantRevenueAnalytics(params) {
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
        }
        catch (error) {
            console.error('Error getting tenant revenue analytics:', error);
            throw error;
        }
    }
    /**
     * Export tenants data
     */
    static async exportTenants(params) {
        try {
            const { format, search, status, plan } = params;
            // Build where clause
            const where = {};
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
            const tenants = await prisma_1.prisma.tenant.findMany({
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
                const csvRows = tenants.map((tenant) => `${tenant.id},"${tenant.name}","${tenant.subdomain}","${tenant.plan}","${tenant.isActive ? 'Active' : 'Inactive'}","${tenant.ownerName}",${tenant._count.users},"${tenant.createdAt.toISOString()}"`).join('\n');
                return csvHeaders + csvRows;
            }
            // Generate PDF format
            if (format === 'pdf') {
                const doc = new pdfkit_1.default();
                const chunks = [];
                // Collect PDF data chunks
                doc.on('data', (chunk) => chunks.push(chunk));
                // Generate PDF content
                doc.fontSize(20).text('Tenants Export Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
                doc.moveDown(2);
                // Add tenant data
                tenants.forEach((tenant, index) => {
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
                return new Promise((resolve) => {
                    doc.on('end', () => {
                        const result = Buffer.concat(chunks);
                        resolve(result);
                    });
                });
            }
            // For Excel format, return CSV for now (would be enhanced with proper Excel generation)
            if (format === 'excel') {
                const csvHeaders = 'ID,Name,Subdomain,Plan,Status,Owner,Users,Created At\n';
                const csvRows = tenants.map((tenant) => `${tenant.id},"${tenant.name}","${tenant.subdomain}","${tenant.plan}","${tenant.isActive ? 'Active' : 'Inactive'}","${tenant.ownerName}",${tenant._count.users},"${tenant.createdAt.toISOString()}"`).join('\n');
                return csvHeaders + csvRows;
            }
            // For other formats, return JSON for now
            return JSON.stringify(tenants, null, 2);
        }
        catch (error) {
            console.error('Error exporting tenants:', error);
            throw error;
        }
    }
    /**
     * Get platform overview
     */
    static async getPlatformOverview() {
        const [totalTenants, activeTenants, totalUsers] = await Promise.all([
            prisma_1.prisma.tenant.count(),
            prisma_1.prisma.tenant.count({ where: { isActive: true } }),
            prisma_1.prisma.user.count()
        ]);
        // Get top tenants by user count
        const topTenants = await prisma_1.prisma.tenant.findMany({
            take: 5,
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });
        const transformedTopTenants = topTenants.map((tenant) => ({
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
}
exports.TenantService = TenantService;
//# sourceMappingURL=TenantService.js.map