"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
    static async deactivateTenant(id) {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: { isActive: false }
        });
        return tenant;
    }
    /**
     * Get platform overview
     */
    static async getPlatformOverview() {
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
            },
            orderBy: {
                _count: {
                    users: 'desc'
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