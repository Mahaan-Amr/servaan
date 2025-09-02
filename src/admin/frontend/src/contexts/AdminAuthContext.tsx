'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AdminUser, 
  AdminLoginRequest, 
  AdminRole, 
  AdminAuthContextType 
} from '@/types/admin';
import * as adminAuthService from '@/services/adminAuthService';

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if admin token is valid and fetch current user
  const checkAdminAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = adminAuthService.getAdminToken();
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify token with backend
      const isValid = await adminAuthService.verifyAdminToken();
      
      if (!isValid) {
        adminAuthService.clearAdminAuth();
        setUser(null);
        setLoading(false);
        return;
      }

      // Get fresh user data
      const userData = await adminAuthService.getAdminProfile();
      
      setUser(userData);
      
      // Update stored user data
      adminAuthService.setAdminUser(userData, true);
      
    } catch (error) {
      console.error('Admin auth check failed:', error);
      adminAuthService.clearAdminAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: AdminLoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAuthService.adminLogin(credentials);
      
      if (response.success) {
        setUser(response.data.user);
        router.push('/admin/dashboard');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await adminAuthService.adminLogout();
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      setUser(null);
      adminAuthService.clearAdminAuth();
      setLoading(false);
      router.push('/admin/login');
    }
  }, [router]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Role checking functions
  const hasRole = useCallback((role: AdminRole): boolean => {
    return adminAuthService.hasAdminRole(user, role);
  }, [user]);

  const hasAnyRole = useCallback((roles: AdminRole[]): boolean => {
    return adminAuthService.hasAnyAdminRole(user, roles);
  }, [user]);

  // Check authentication on mount
  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const token = adminAuthService.getAdminToken();
    if (!token) return;

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // Refresh token 5 minutes before expiry
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        console.log('Admin token expiring soon, refreshing...');
        checkAdminAuth();
      }
    } catch (error) {
      console.error('Error parsing admin token:', error);
    }
  }, [user, checkAdminAuth]);

  const value: AdminAuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Higher-order component for admin route protection
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: AdminRole
) {
  return function AdminProtectedComponent(props: P) {
    const { user, loading, hasRole } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push('/admin/login');
          return;
        }
        
        if (requiredRole && !hasRole(requiredRole)) {
          router.push('/admin/unauthorized');
          return;
        }
      }
    }, [user, loading, hasRole, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return null;
    }

    return <Component {...props} />;
  };
}
