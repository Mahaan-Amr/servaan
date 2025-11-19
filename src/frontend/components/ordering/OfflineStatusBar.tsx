/**
 * Offline Status Bar Component
 * Shows connection status and pending sync operations
 */

'use client';

import React from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export default function OfflineStatusBar() {
  const { sync, isOffline, pendingOrders, pendingPayments } = useOfflineStatus();

  if (!isOffline && pendingOrders === 0 && pendingPayments === 0 && sync.status === 'idle') {
    return null; // Don't show anything when everything is synced
  }

  const getStatusColor = () => {
    if (isOffline) return 'bg-red-500';
    if (sync.status === 'syncing') return 'bg-yellow-500';
    if (pendingOrders > 0 || pendingPayments > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isOffline) {
      return 'آفلاین - سفارشات در صف انتظار هستند';
    }
    if (sync.status === 'syncing') {
      return 'در حال همگام‌سازی...';
    }
    if (pendingOrders > 0 || pendingPayments > 0) {
      return `${pendingOrders + pendingPayments} عملیات در انتظار همگام‌سازی`;
    }
    return 'آنلاین';
  };

  return (
    <div className={`${getStatusColor()} text-white px-4 py-2 text-sm font-medium flex items-center justify-between`}>
      <div className="flex items-center space-x-2 space-x-reverse">
        {isOffline ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        ) : sync.status === 'syncing' ? (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>{getStatusText()}</span>
      </div>
      
      {(pendingOrders > 0 || pendingPayments > 0) && (
        <div className="flex items-center space-x-2 space-x-reverse text-xs">
          {pendingOrders > 0 && (
            <span className="bg-white/20 px-2 py-1 rounded">
              {pendingOrders} سفارش
            </span>
          )}
          {pendingPayments > 0 && (
            <span className="bg-white/20 px-2 py-1 rounded">
              {pendingPayments} پرداخت
            </span>
          )}
        </div>
      )}
    </div>
  );
}

