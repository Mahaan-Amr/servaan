'use client';

import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { Toaster } from 'react-hot-toast';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AdminAuthProvider>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            direction: 'rtl',
            fontFamily: 'Vazirmatn, Inter, sans-serif',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
            },
          },
        }}
      />
    </AdminAuthProvider>
  );
}
