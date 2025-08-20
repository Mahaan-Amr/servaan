'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'STAFF';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, authLoaded, hasAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Save current path for redirect after login (except login and register pages)
    if (!user && authLoaded && pathname !== '/login' && pathname !== '/register' && pathname !== '/unauthorized') {
      sessionStorage.setItem('redirectAfterLogin', pathname);
    }

    // Check authorization when user or auth state changes
    if (authLoaded) {
      if (!user) {
        setIsAuthorized(false);
        // Redirect to login only after we're sure auth is loaded and there's no user
        router.push('/login');
      } else if (requiredRole && !hasAccess(requiredRole)) {
        setIsAuthorized(false);
        router.push('/unauthorized');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, authLoaded, requiredRole, router, pathname, hasAccess]);

  // Show loading spinner when:
  // 1. Auth is still being checked
  // 2. We're still determining if the user has access
  // 3. The general loading state is active
  if (loading || !authLoaded || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // If not authorized, don't render anything (we've already redirected)
  if (!isAuthorized) {
    return null;
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
} 