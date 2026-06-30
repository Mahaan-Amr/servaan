import axios from 'axios';
import { User } from '../types';
import { API_URL } from '../lib/apiUtils';
import { cacheOnlineLogin } from './offlineAuthCacheService';
import { localFirstSyncService } from './localFirstSyncService';
import { deleteDesktopSecret, isDesktopApp, storeDesktopSecret } from './desktopBridgeService';
import { isNativeRoute } from './nativeDeviceService';
import { cacheNativeOnlineLoginSnapshot } from './nativeAuthSnapshotService';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF';
  phoneNumber?: string;
}

export const login = async (credentials: LoginCredentials, rememberMe: boolean = false): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      ...credentials,
      rememberMe
    });

    const responseData = response.data;
    const userData = responseData.data || responseData;

    if (rememberMe) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('token', userData.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

    if (typeof window !== 'undefined') {
      storeDesktopSecret('auth.token', userData.token).catch((error) => {
        console.warn('Failed to store desktop auth token:', error);
      });
      storeDesktopSecret('auth.user', JSON.stringify(userData)).catch((error) => {
        console.warn('Failed to store desktop user profile:', error);
      });
      cacheOnlineLogin(userData).catch((error) => {
        console.warn('Failed to cache offline auth after online login:', error);
      });
      cacheNativeOnlineLoginSnapshot({ user: userData, token: userData.token }).catch((error) => {
        console.warn('Failed to cache native login snapshot after online login:', error);
      });
      localFirstSyncService.registerDeviceOnline().catch((error) => {
        console.warn('Failed to register offline device after online login:', error);
      });
    }

    if (userData.tenantSubdomain && typeof window !== 'undefined' && !isNativeRoute() && !isDesktopApp()) {
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;

      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        const newUrl = `http://${userData.tenantSubdomain}.${currentHost}${currentPort ? ':' + currentPort : ''}?token=${encodeURIComponent(userData.token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        window.location.href = newUrl;
        return userData;
      }

      if (currentHost.includes('servaan.com')) {
        const newUrl = `https://${userData.tenantSubdomain}.servaan.com?token=${encodeURIComponent(userData.token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        window.location.href = newUrl;
        return userData;
      }
    }

    return userData;
  } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || 'ورود به سیستم ناموفق بود');
  }
};

export const persistAuthSession = (user: User, token?: string, rememberMe: boolean = true): void => {
  if (token) {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  if (rememberMe) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.setItem('user', JSON.stringify(user));
  }
};

export const register = async (userData: RegisterData): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    const user = response.data;

    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    storeDesktopSecret('auth.token', user.token).catch((error) => {
      console.warn('Failed to store desktop auth token after registration:', error);
    });
    storeDesktopSecret('auth.user', JSON.stringify(user)).catch((error) => {
      console.warn('Failed to store desktop user profile after registration:', error);
    });

    axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;

    return user;
  } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || 'ثبت‌نام ناموفق بود');
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  deleteDesktopSecret('auth.token').catch((error) => {
    console.warn('Failed to delete desktop auth token:', error);
  });
  deleteDesktopSecret('auth.user').catch((error) => {
    console.warn('Failed to delete desktop user profile:', error);
  });
  delete axios.defaults.headers.common['Authorization'];
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
};

export const extractTokenFromUrl = (): void => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userStr = urlParams.get('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      storeDesktopSecret('auth.token', token).catch((error) => {
        console.warn('Failed to store desktop auth token from URL:', error);
      });
      storeDesktopSecret('auth.user', JSON.stringify(user)).catch((error) => {
        console.warn('Failed to store desktop user profile from URL:', error);
      });

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      cacheOnlineLogin(user).catch((error) => {
        console.warn('Failed to cache offline auth from URL token:', error);
      });
      cacheNativeOnlineLoginSnapshot({ user, token }).catch((error) => {
        console.warn('Failed to cache native login snapshot from URL token:', error);
      });
      localFirstSyncService.registerDeviceOnline().catch((error) => {
        console.warn('Failed to register offline device from URL token:', error);
      });

      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    } catch (error) {
      console.error('Error extracting token from URL:', error);
    }
  }
};

export const hasRole = (user: User | null, requiredRole: 'ADMIN' | 'MANAGER' | 'STAFF'): boolean => {
  if (!user) return false;

  switch (requiredRole) {
    case 'ADMIN':
      return user.role === 'ADMIN';
    case 'MANAGER':
      return user.role === 'ADMIN' || user.role === 'MANAGER';
    case 'STAFF':
      return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'STAFF';
    default:
      return false;
  }
};

export const getCurrentUserProfile = async (): Promise<User> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('توکن پیدا نشد');
    }

    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || 'خطا در دریافت پروفایل کاربر');
  }
};

