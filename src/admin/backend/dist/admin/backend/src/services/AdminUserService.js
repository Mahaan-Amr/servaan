"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserService = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const admin_1 = require("../config/admin");
class AdminUserService {
    static async list(params) {
        const { page, limit, search, role, isActive } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role && role !== 'ALL')
            where.role = role;
        if (isActive && isActive !== 'all')
            where.isActive = isActive === 'true';
        const [users, total] = await Promise.all([
            prisma_1.prisma.adminUser.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: { id: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true },
            }),
            prisma_1.prisma.adminUser.count({ where })
        ]);
        return {
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }
    static async create(data) {
        const passwordHash = await bcryptjs_1.default.hash(data.password, parseInt(String(admin_1.adminConfig.security.bcryptRounds)) || 12);
        const user = await prisma_1.prisma.adminUser.create({
            data: { email: data.email, passwordHash, role: data.role, isActive: true }
        });
        return { id: user.id, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt };
    }
    static async updateRole(id, role) {
        const user = await prisma_1.prisma.adminUser.update({ where: { id }, data: { role } });
        return { id: user.id, email: user.email, role: user.role, isActive: user.isActive };
    }
    static async setActive(id, isActive) {
        const user = await prisma_1.prisma.adminUser.update({ where: { id }, data: { isActive } });
        return { id: user.id, email: user.email, role: user.role, isActive: user.isActive };
    }
    static async resetPassword(id, newPassword) {
        const passwordHash = await bcryptjs_1.default.hash(newPassword, parseInt(String(admin_1.adminConfig.security.bcryptRounds)) || 12);
        await prisma_1.prisma.adminUser.update({ where: { id }, data: { passwordHash } });
        return { success: true };
    }
}
exports.AdminUserService = AdminUserService;
//# sourceMappingURL=AdminUserService.js.map