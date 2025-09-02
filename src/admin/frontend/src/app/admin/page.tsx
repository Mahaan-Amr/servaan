'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminPage() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/admin/dashboard');
      } else {
        router.push('/admin/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-admin-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-admin-text">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
