import axios from 'axios';
import { User } from '../types';

// Types
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

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Login user
export const login = async (credentials: LoginCredentials, rememberMe: boolean = false): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      ...credentials,
      rememberMe
    });
    
    const responseData = response.data;
    
    // Handle new response format with tenant information
    const userData = responseData.data || responseData;
    
    // Store user data in localStorage or sessionStorage based on rememberMe flag
    if (rememberMe) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('token', userData.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Set default Authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    
    // Handle tenant redirection if user has tenant subdomain
    if (userData.tenantSubdomain && typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;
      
      // For development: redirect to subdomain.localhost:3000
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        const newUrl = `http://${userData.tenantSubdomain}.${currentHost}${currentPort ? ':' + currentPort : ''}?token=${encodeURIComponent(userData.token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        console.log(`Redirecting to tenant subdomain: ${newUrl}`);
        window.location.href = newUrl;
        return userData; // Return data before redirect
      }
      
      // For production: redirect to subdomain.servaan.com
      if (currentHost.includes('servaan.com')) {
        const newUrl = `https://${userData.tenantSubdomain}.servaan.com?token=${encodeURIComponent(userData.token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        console.log(`Redirecting to tenant subdomain: ${newUrl}`);
        window.location.href = newUrl;
        return userData; // Return data before redirect
      }
    }
    
    return userData;
  } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || 'خطا در ورود به سیستم');
  }
};

// Register user
export const register = async (userData: RegisterData): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    
    const user = response.data;
    
    // Store user data in localStorage
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Set default Authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    
    return user;
  } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || 'خطا در ثبت‌نام');
  }
};

// Logout user
export const logout = (): void => {
  // Remove user data from storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Remove Authorization header
  delete axios.defaults.headers.common['Authorization'];
};

// Get current user from storage
export const getCurrentUser = (): User | null => {
  // Check localStorage first, then sessionStorage
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Get token from storage
export const getToken = (): string | null => {
  // Check localStorage first, then sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
};

// Extract and store token from URL parameters (for cross-domain redirects)
export const extractTokenFromUrl = (): void => {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userStr = urlParams.get('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));
      
      // Store in localStorage (more persistent for cross-domain)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      
      console.log('✅ Token extracted from URL and stored');
    } catch (error) {
      console.error('❌ Error extracting token from URL:', error);
    }
  }
};

// Check if user has required role
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

// Get current user profile from API
export const getCurrentUserProfile = async (): Promise<User> => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('توکن یافت نشد');
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