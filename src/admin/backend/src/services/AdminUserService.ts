import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { adminConfig } from '../config/admin';

export type AdminUserRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';

export interface ListParams {
  page: number;
  limit: number;
  search?: string;
  role?: AdminUserRole | 'ALL';
  isActive?: 'true' | 'false' | 'all';
}

export class AdminUserService {
  static async list(params: ListParams) {
    const { page, limit, search, role, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'ALL') where.role = role;
    if (isActive && isActive !== 'all') where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true },
      }),
      prisma.adminUser.count({ where })
    ]);

    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  static async create(data: { email: string; password: string; role: AdminUserRole }) {
    const passwordHash = await bcrypt.hash(data.password, parseInt(String(adminConfig.security.bcryptRounds)) || 12);
    const user = await prisma.adminUser.create({
      data: { email: data.email, passwordHash, role: data.role, isActive: true }
    });
    return { id: user.id, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt };
  }

  static async updateRole(id: string, role: AdminUserRole) {
    const user = await prisma.adminUser.update({ where: { id }, data: { role } });
    return { id: user.id, email: user.email, role: user.role, isActive: user.isActive };
  }

  static async setActive(id: string, isActive: boolean) {
    const user = await prisma.adminUser.update({ where: { id }, data: { isActive } });
    return { id: user.id, email: user.email, role: user.role, isActive: user.isActive };
  }

  static async resetPassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, parseInt(String(adminConfig.security.bcryptRounds)) || 12);
    await prisma.adminUser.update({ where: { id }, data: { passwordHash } });
    return { success: true };
  }
}


