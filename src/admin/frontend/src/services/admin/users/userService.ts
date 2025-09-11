import adminApi from '../../adminAuthService';

export type AdminUserRole = 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListParams {
  page: number;
  limit: number;
  search?: string;
  role?: AdminUserRole | 'ALL';
  isActive?: 'true' | 'false' | 'all';
}

export interface ListResponse {
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const listAdminUsers = async (params: ListParams): Promise<ListResponse> => {
  const qs = new URLSearchParams();
  qs.append('page', String(params.page));
  qs.append('limit', String(params.limit));
  if (params.search) qs.append('search', params.search);
  if (params.role) qs.append('role', params.role);
  if (params.isActive) qs.append('isActive', params.isActive);
  const res = await adminApi.get(`/admin/users?${qs.toString()}`);
  return res.data.data as ListResponse;
};

export const createAdminUser = async (email: string, password: string, role: AdminUserRole): Promise<AdminUser> => {
  const res = await adminApi.post('/admin/users', { email, password, role });
  return res.data.data as AdminUser;
};

export const updateAdminUserRole = async (id: string, role: AdminUserRole) => {
  const res = await adminApi.put(`/admin/users/${encodeURIComponent(id)}/role`, { role });
  return res.data.data as AdminUser;
};

export const setAdminUserActive = async (id: string, isActive: boolean) => {
  const res = await adminApi.put(`/admin/users/${encodeURIComponent(id)}/active`, { isActive });
  return res.data.data as AdminUser;
};

export const resetAdminUserPassword = async (id: string, newPassword: string) => {
  const res = await adminApi.post(`/admin/users/${encodeURIComponent(id)}/reset-password`, { newPassword });
  return res.data as { success: boolean };
};


