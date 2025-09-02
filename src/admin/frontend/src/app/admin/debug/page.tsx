'use client';

import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { user, loading, isAuthenticated, error } = useAdminAuth();
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // Get localStorage data
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
      const userData = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
      
      setLocalStorageData({
        token: token ? `${token.substring(0, 20)}...` : 'No token',
        userData: userData ? JSON.parse(userData) : 'No user data',
        hasToken: !!token,
        hasUserData: !!userData
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-admin-bg p-6">
      <h1 className="text-3xl font-bold text-admin-text mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Context State */}
        <div className="bg-white p-6 rounded-admin border border-admin-border">
          <h2 className="text-xl font-semibold text-admin-text mb-4">Context State</h2>
          <div className="space-y-2">
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'No user'}</div>
            <div><strong>Error:</strong> {error || 'No error'}</div>
          </div>
        </div>

        {/* Local Storage */}
        <div className="bg-white p-6 rounded-admin border border-admin-border">
          <h2 className="text-xl font-semibold text-admin-text mb-4">Local Storage</h2>
          <div className="space-y-2">
            <div><strong>Has Token:</strong> {localStorageData.hasToken ? 'Yes' : 'No'}</div>
            <div><strong>Has User Data:</strong> {localStorageData.hasUserData ? 'Yes' : 'No'}</div>
            <div><strong>Token:</strong> {localStorageData.token}</div>
            <div><strong>User Data:</strong> <pre className="text-xs">{JSON.stringify(localStorageData.userData, null, 2)}</pre></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 bg-white p-6 rounded-admin border border-admin-border">
        <h2 className="text-xl font-semibold text-admin-text mb-4">Actions</h2>
        <div className="space-x-4">
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="btn-admin-danger"
          >
            Clear All Storage
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="btn-admin-secondary"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
