'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { WorkspaceId } from '../../types/workspace';

interface WorkspaceProtectionProps {
  workspaceId: WorkspaceId;
  children: React.ReactNode;
  fallbackUrl?: string;
  showError?: boolean;
}

export const WorkspaceProtection: React.FC<WorkspaceProtectionProps> = ({
  workspaceId,
  children,
  fallbackUrl = '/',
  showError = true
}) => {
  const router = useRouter();
  const { user, authLoaded } = useAuth();
  const { canAccessWorkspace, isLoading, workspaces } = useWorkspace();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (authLoaded && !isLoading && workspaces.length > 0) {
      const hasAccess = canAccessWorkspace(workspaceId);
      
      if (!hasAccess) {
        if (showError) {
          // Show error for a moment before redirecting
          setTimeout(() => {
            router.push(fallbackUrl);
          }, 3000);
        } else {
          // Immediate redirect
          router.push(fallbackUrl);
        }
      }
      
      setAccessChecked(true);
    }
  }, [authLoaded, isLoading, workspaces, workspaceId, canAccessWorkspace, router, fallbackUrl, showError]);

  // Loading state
  if (!authLoaded || isLoading || !accessChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  // Check workspace access
  const hasAccess = canAccessWorkspace(workspaceId);

  if (!hasAccess) {
    if (!showError) {
      return null;
    }

    // Access denied screen
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            دسترسی غیرمجاز
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            شما به این فضای کاری دسترسی ندارید. لطفاً با مدیر سیستم تماس بگیرید یا به فضاهای کاری مجاز خود بروید.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              بازگشت به داشبورد
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              بازگشت به صفحه قبل
            </button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            شما در حال انتقال به داشبورد اصلی هستید...
          </p>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}; 