'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-admin-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-admin-text">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
