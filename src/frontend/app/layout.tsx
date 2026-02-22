import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import { TenantProvider } from '../contexts/TenantContext';
import { ClientInitializer } from '../components/ClientInitializer';
import { MainAppShell } from '../components/layout/MainAppShell';
import { Toaster } from 'react-hot-toast';

// Client-side initialization of axios interceptors - moved to a client component
export const metadata = {
  title: 'سِروان | مدیریت انبار و کافه و رستوران',
  description: 'سیستم مدیریت انبار و کافه و رستوران',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex flex-col min-h-screen">
        <TenantProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <NotificationProvider>
                <ClientInitializer />
                <MainAppShell>{children}</MainAppShell>
                {/* Toast Notifications */}
                <Toaster
                  position="top-center"
                  reverseOrder={false}
                  gutter={8}
                  containerClassName=""
                  containerStyle={{}}
                  toastOptions={{
                    // Default options for all toasts
                    className: '',
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      direction: 'rtl',
                      fontFamily: 'inherit',
                    },
                    // Default options for specific types
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
              </NotificationProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
