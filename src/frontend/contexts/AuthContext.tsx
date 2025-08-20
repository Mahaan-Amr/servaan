'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '../services/authService';
import { User } from '../types';
import { LoginCredentials, RegisterData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  hasAccess: (requiredRole: 'ADMIN' | 'MANAGER' | 'STAFF') => boolean;
  authLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);
  const router = useRouter();

  // Check if token is valid and fetch current user
  const checkTokenValidity = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // Check if token is expired
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        // Check if token expires in the next 5 minutes (300000ms)
        if (currentTime >= expiryTime - 300000) {
          console.log('Token is expiring soon or expired, attempting refresh...');
          
          try {
            // Try to refresh the token using the current user's credentials
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
              // For now, we'll just logout and redirect
              // In a full implementation, you'd call a refresh endpoint
              console.log('Token expired, logging out');
              authService.logout();
              setUser(null);
              return;
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            authService.logout();
            setUser(null);
            return;
          }
        }
        
        // Token is valid, get current user
        const user = authService.getCurrentUser();
        if (user) {
          setUser(user);
        }
      }
    } catch (error) {
      console.error('Error checking token validity:', error);
      // If there's any error, clear the token
      authService.logout();
      setUser(null);
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Extract token from URL parameters first (for cross-domain redirects)
    authService.extractTokenFromUrl();
    
    // Check if user is already logged in from localStorage
    checkTokenValidity();
    
    // Set up an interval to check token validity periodically (every 5 minutes)
    const intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [checkTokenValidity]);

  const login = async (credentials: LoginCredentials, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.login(credentials, rememberMe);
      setUser(user);
      router.push('/'); // Redirect to dashboard after login
    } catch (err) {
      let errorMessage = 'خطا در ورود به سیستم';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.register(userData);
      setUser(user);
      router.push('/'); // Redirect to dashboard after registration
    } catch (err) {
      let errorMessage = 'خطا در ثبت‌نام';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/login');
  };

  const clearError = () => {
    setError(null);
  };
  
  // Helper methods for role-based access control
  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };
  
  const isManager = () => {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  };
  
  const hasAccess = (requiredRole: 'ADMIN' | 'MANAGER' | 'STAFF') => {
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      clearError, 
      isAdmin, 
      isManager, 
      hasAccess,
      authLoaded
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 