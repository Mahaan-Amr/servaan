/**
 * React Hook for Offline Status
 */

import { useState, useEffect } from 'react';
import { connectionMonitor, ConnectionState } from '../services/connectionMonitorService';
import { syncService, SyncStatus } from '../services/syncService';

export interface OfflineStatus {
  connection: ConnectionState;
  sync: SyncStatus;
  isOffline: boolean;
  pendingOrders: number;
  pendingPayments: number;
}

export function useOfflineStatus(): OfflineStatus {
  const [connection, setConnection] = useState<ConnectionState>(connectionMonitor.getState());
  const [sync, setSync] = useState<SyncStatus>(syncService.getSyncStatus());
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribeConnection = connectionMonitor.subscribe((state) => {
      setConnection(state);
    });

    // Subscribe to sync status
    const unsubscribeSync = syncService.subscribe((status) => {
      setSync(status);
    });

    // Check pending operations periodically (only in browser)
    const checkPending = async () => {
      // Only run in browser environment
      if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
        return;
      }

      try {
        const { offlineStorage } = await import('../services/offlineStorageService');
        await offlineStorage.init();
        
        const orders = await offlineStorage.getPendingOrders();
        const payments = await offlineStorage.getPendingPayments();
        
        setPendingOrders(orders.length);
        setPendingPayments(payments.length);
      } catch (error) {
        console.error('Error checking pending operations:', error);
      }
    };

    // Only check pending operations in browser
    let pendingInterval: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined') {
      checkPending();
      pendingInterval = setInterval(checkPending, 5000);
    }

    return () => {
      unsubscribeConnection();
      unsubscribeSync();
      if (pendingInterval) {
        clearInterval(pendingInterval);
      }
    };
  }, []);

  return {
    connection,
    sync,
    isOffline: !connection.isOnline || connection.status === 'offline',
    pendingOrders,
    pendingPayments
  };
}

