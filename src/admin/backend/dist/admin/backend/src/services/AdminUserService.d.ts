export type AdminUserRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';
export interface ListParams {
    page: number;
    limit: number;
    search?: string;
    role?: AdminUserRole | 'ALL';
    isActive?: 'true' | 'false' | 'all';
}
export declare class AdminUserService {
    static list(params: ListParams): Promise<{
        users: {
            id: string;
            email: string;
            role: string;
            isActive: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    static create(data: {
        email: string;
        password: string;
        role: AdminUserRole;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    static updateRole(id: string, role: AdminUserRole): Promise<{
        id: string;
        email: string;
        role: string;
        isActive: boolean;
    }>;
    static setActive(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        role: string;
        isActive: boolean;
    }>;
    static resetPassword(id: string, newPassword: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=AdminUserService.d.ts.map