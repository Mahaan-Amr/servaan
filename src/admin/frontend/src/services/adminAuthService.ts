import axios from 'axios';
import { AdminUser, AdminLoginRequest, AdminLoginResponse, AdminRole } from '@/types/admin';

// Admin API Configuration
// Use local development URL when running locally, production URL otherwise
const ADMIN_API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3003/api'
  : (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3003/api');

// Create axios instance for admin API
const adminApi = axios.create({
  baseURL: ADMIN_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearAdminAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Token management
export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const localToken = localStorage.getItem('admin_token');
  const sessionToken = sessionStorage.getItem('admin_token');
  
  const token = localToken || sessionToken;
  return token;
};

export const setAdminToken = (token: string, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  if (rememberMe) {
    localStorage.setItem('admin_token', token);
  } else {
    sessionStorage.setItem('admin_token', token);
  }
};

export const clearAdminAuth = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_user');
  
  // Clear axios default headers
  delete adminApi.defaults.headers.common['Authorization'];
};

export const getAdminUser = (): AdminUser | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing admin user data:', error);
      clearAdminAuth();
    }
  }
  return null;
};

export const setAdminUser = (user: AdminUser, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  const userStr = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem('admin_user', userStr);
  } else {
    sessionStorage.setItem('admin_user', userStr);
  }
};

// Authentication functions
export const adminLogin = async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
  try {
    const response = await adminApi.post('/admin/auth/login', credentials);
    const responseData = response.data;
    
    if (responseData.success) {
      const { user, token } = responseData.data;
      
      // Store token and user data
      setAdminToken(token, true); // Remember admin login
      setAdminUser(user, true);
      
      // Set default authorization header
      adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Return the expected structure for the context
      return {
        success: true,
        message: responseData.message,
        data: {
          user,
          token
        }
      };
    } else {
      throw new Error(responseData.message || 'Login failed');
    }
  } catch (error: any) {
    console.error('Admin login error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Login failed');
  }
};

export const adminLogout = async (): Promise<void> => {
  try {
    const token = getAdminToken();
    if (token) {
      await adminApi.post('/admin/auth/logout');
    }
  } catch (error) {
    console.error('Admin logout error:', error);
  } finally {
    clearAdminAuth();
  }
};

export const getAdminProfile = async (): Promise<AdminUser> => {
  try {
    const response = await adminApi.get('/admin/auth/profile');
    return response.data.data;
  } catch (error: any) {
    console.error('Get admin profile error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to get profile');
  }
};

export const verifyAdminToken = async (): Promise<boolean> => {
  try {
    const response = await adminApi.get('/admin/auth/verify');
    return response.data.success;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return false;
  }
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await adminApi.post('/admin/auth/change-password', {
      currentPassword,
      newPassword
    });
  } catch (error: any) {
    console.error('Change admin password error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to change password');
  }
};

// Role checking utilities
export const hasAdminRole = (user: AdminUser | null, role: AdminRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

export const hasAnyAdminRole = (user: AdminUser | null, roles: AdminRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const isSuperAdmin = (user: AdminUser | null): boolean => {
  return hasAdminRole(user, AdminRole.SUPER_ADMIN);
};

export const isPlatformAdmin = (user: AdminUser | null): boolean => {
  return hasAdminRole(user, AdminRole.PLATFORM_ADMIN);
};

export const isSupport = (user: AdminUser | null): boolean => {
  return hasAdminRole(user, AdminRole.SUPPORT);
};

export const isDeveloper = (user: AdminUser | null): boolean => {
  return hasAdminRole(user, AdminRole.DEVELOPER);
};

// Admin role hierarchy checking
export const canAccessAdminFeature = (user: AdminUser | null, requiredRole: AdminRole): boolean => {
  if (!user) return false;
  
  // Define role hierarchy (higher number = more permissions)
  const roleHierarchy = {
    [AdminRole.DEVELOPER]: 1,
    [AdminRole.SUPPORT]: 2,
    [AdminRole.PLATFORM_ADMIN]: 3,
    [AdminRole.SUPER_ADMIN]: 4,
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

// Health check
export const checkAdminHealth = async (): Promise<{ status: string; timestamp: string; version: string }> => {
  try {
    const response = await adminApi.get('/admin/auth/health');
    return response.data.data;
  } catch (error) {
    console.error('Admin health check failed:', error);
    throw new Error('Admin system is not available');
  }
};

export default adminApi;
