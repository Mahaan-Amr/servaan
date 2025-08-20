'use client';

// Workspace Context for Servaan Business Management System
// کانتکست فضای کاری برای سیستم مدیریت کسب‌وکار سِروان

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Workspace, 
  WorkspaceId, 
  UserWorkspaceAccess, 
  WorkspaceAccessLevel,
  WorkspacePermission
} from '../types/workspace';
import { workspaceService } from '../services/workspaceService';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  // Workspace Data
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  userAccess: UserWorkspaceAccess[];
  
  // Loading States
  isLoading: boolean;
  isLoadingWorkspaces: boolean;
  isLoadingAccess: boolean;
  
  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshUserAccess: () => Promise<void>;
  
  // Access Control
  getUserAccessLevel: (workspaceId: WorkspaceId) => WorkspaceAccessLevel;
  hasPermission: (workspaceId: WorkspaceId, permission: WorkspacePermission) => boolean;
  canAccessWorkspace: (workspaceId: WorkspaceId) => boolean;
  
  // Filtering
  getActiveWorkspaces: () => Workspace[];
  getComingSoonWorkspaces: () => Workspace[];
  getAccessibleWorkspaces: () => Workspace[];
  
  // Error Handling
  error: string | null;
  clearError: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { user, authLoaded } = useAuth();
  
  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userAccess, setUserAccess] = useState<UserWorkspaceAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if user is authenticated
  const isAuthenticated = authLoaded && !!user;

  /**
   * Refresh workspaces data - به‌روزرسانی داده‌های فضاهای کاری
   */
  const refreshWorkspaces = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingWorkspaces(true);
      setError(null);
      
      const fetchedWorkspaces = await workspaceService.getAllWorkspaces();
      setWorkspaces(fetchedWorkspaces);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت فضاهای کاری';
      setError(errorMessage);
      console.error('Error refreshing workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  /**
   * Refresh user access data - به‌روزرسانی داده‌های دسترسی کاربر
   */
  const refreshUserAccess = async (): Promise<void> => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      setIsLoadingAccess(true);
      setError(null);
      
      const fetchedAccess = await workspaceService.getUserWorkspaceAccess(user.id);
      setUserAccess(fetchedAccess);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت دسترسی‌های کاربر';
      setError(errorMessage);
      console.error('Error refreshing user access:', err);
    } finally {
      setIsLoadingAccess(false);
    }
  };

  /**
   * Get user access level for workspace - دریافت سطح دسترسی کاربر برای فضای کاری
   */
  const getUserAccessLevel = (workspaceId: WorkspaceId): WorkspaceAccessLevel => {
    if (!Array.isArray(userAccess) || userAccess.length === 0) {
      return 'none';
    }
    const access = userAccess.find(a => a.workspaceId === workspaceId);
    return access?.accessLevel || 'none';
  };

  /**
   * Check if user has specific permission - بررسی مجوز خاص کاربر
   */
  const hasPermission = (workspaceId: WorkspaceId, permission: WorkspacePermission): boolean => {
    if (!Array.isArray(userAccess) || userAccess.length === 0) {
      return false;
    }
    const access = userAccess.find(a => a.workspaceId === workspaceId);
    
    if (!access || !access.isActive) return false;
    
    // Full access has all permissions
    if (access.accessLevel === 'full') return true;
    
    // Check specific permissions
    return access.permissions.includes(permission);
  };

  /**
   * Check if user can access workspace - بررسی دسترسی کاربر به فضای کاری
   */
  const canAccessWorkspace = (workspaceId: WorkspaceId): boolean => {
    const accessLevel = getUserAccessLevel(workspaceId);
    return accessLevel !== 'none';
  };

  /**
   * Get active workspaces - دریافت فضاهای کاری فعال
   */
  const getActiveWorkspaces = (): Workspace[] => {
    return workspaces.filter(workspace => workspace.status === 'active');
  };

  /**
   * Get coming soon workspaces - دریافت فضاهای کاری به‌زودی
   */
  const getComingSoonWorkspaces = (): Workspace[] => {
    return workspaces.filter(workspace => workspace.status === 'coming-soon');
  };

  /**
   * Get accessible workspaces for current user - دریافت فضاهای کاری قابل دسترس برای کاربر فعلی
   */
  const getAccessibleWorkspaces = (): Workspace[] => {
    if (!Array.isArray(workspaces) || !Array.isArray(userAccess)) {
      return [];
    }
    return workspaces.filter(workspace => {
      // Check if user has required role
      if (!user?.role || !workspace.requiredRoles.includes(user.role)) {
        return false;
      }
      
      // Check if user has access
      return canAccessWorkspace(workspace.id);
    });
  };

  /**
   * Clear error state - پاک کردن وضعیت خطا
   */
  const clearError = (): void => {
    setError(null);
  };

  /**
   * Initialize data when user changes - مقداردهی اولیه داده‌ها هنگام تغییر کاربر
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const initializeData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            refreshWorkspaces(),
            refreshUserAccess()
          ]);
        } catch (err) {
          console.error('Error initializing workspace data:', err);
        } finally {
          setIsLoading(false);
        }
      };

      initializeData();
    } else {
      // Clear data when user logs out
      setWorkspaces([]);
      setUserAccess([]);
      setCurrentWorkspace(null);
      setError(null);
    }
  }, [isAuthenticated, user?.id]);

  /**
   * Auto-refresh data periodically - به‌روزرسانی خودکار داده‌ها
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      // Refresh workspace stats every 5 minutes
      refreshWorkspaces();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  /**
   * Update current workspace based on URL - به‌روزرسانی فضای کاری فعلی بر اساس URL
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const workspaceMatch = path.match(/\/workspaces\/([^\/]+)/);
      
      if (workspaceMatch) {
        const workspaceId = workspaceMatch[1] as WorkspaceId;
        const workspace = workspaces.find(w => w.id === workspaceId);
        
        if (workspace && canAccessWorkspace(workspaceId)) {
          setCurrentWorkspace(workspace);
        } else if (workspace && !canAccessWorkspace(workspaceId)) {
          // User doesn't have access to this workspace
          setError('شما به این فضای کاری دسترسی ندارید');
        }
      } else {
        setCurrentWorkspace(null);
      }
    }
  }, [workspaces, userAccess]);

  const contextValue: WorkspaceContextType = {
    // Data
    workspaces,
    currentWorkspace,
    userAccess,
    
    // Loading States
    isLoading,
    isLoadingWorkspaces,
    isLoadingAccess,
    
    // Actions
    setCurrentWorkspace,
    refreshWorkspaces,
    refreshUserAccess,
    
    // Access Control
    getUserAccessLevel,
    hasPermission,
    canAccessWorkspace,
    
    // Filtering
    getActiveWorkspaces,
    getComingSoonWorkspaces,
    getAccessibleWorkspaces,
    
    // Error Handling
    error,
    clearError
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

/**
 * Hook to use workspace context - هوک برای استفاده از کانتکست فضای کاری
 */
export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

/**
 * Hook to get current workspace - هوک برای دریافت فضای کاری فعلی
 */
export const useCurrentWorkspace = (): Workspace | null => {
  const { currentWorkspace } = useWorkspace();
  return currentWorkspace;
};

/**
 * Hook to check workspace access - هوک برای بررسی دسترسی فضای کاری
 */
export const useWorkspaceAccess = (workspaceId: WorkspaceId) => {
  const { getUserAccessLevel, hasPermission, canAccessWorkspace } = useWorkspace();
  
  return {
    accessLevel: getUserAccessLevel(workspaceId),
    canAccess: canAccessWorkspace(workspaceId),
    hasPermission: (permission: WorkspacePermission) => hasPermission(workspaceId, permission)
  };
};

/**
 * Hook to get accessible workspaces - هوک برای دریافت فضاهای کاری قابل دسترس
 */
export const useAccessibleWorkspaces = (): Workspace[] => {
  const { getAccessibleWorkspaces } = useWorkspace();
  return getAccessibleWorkspaces();
}; 