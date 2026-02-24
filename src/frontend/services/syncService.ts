/**
 * Sync Service
 * Handles automatic synchronization of offline data when connection is restored
 */

import { offlineStorage } from './offlineStorageService';
import { connectionMonitor } from './connectionMonitorService';
import { API_URL } from '../lib/apiUtils';

const ORDERING_API_BASE = `${API_URL}/ordering`;

class SyncService {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    connectionMonitor.subscribe((state) => {
      if (state.isOnline && !this.isSyncing) {
        console.log('[SYNC] Connection restored, starting sync...');
        this.syncAll();
      }
    });

    this.syncInterval = setInterval(() => {
      if (connectionMonitor.isCurrentlyOnline() && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);
  }

  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SYNC] Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    if (!connectionMonitor.isCurrentlyOnline()) {
      console.log('[SYNC] Cannot sync while offline');
      return { success: false, message: 'Offline' };
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing', progress: 0 });

    try {
      if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
        return { success: false, message: 'Not in browser environment' };
      }

      await offlineStorage.init();

      const ordersResult = await this.syncOrders();
      const paymentsResult = await this.syncPayments();
      const queueResult = await this.syncQueue();

      const result: SyncResult = {
        success: true,
        ordersSynced: ordersResult.synced,
        ordersFailed: ordersResult.failed,
        paymentsSynced: paymentsResult.synced,
        paymentsFailed: paymentsResult.failed,
        queueSynced: queueResult.synced,
        queueFailed: queueResult.failed,
      };

      console.log('[SYNC] Completed:', result);
      this.notifyListeners({ status: 'completed', result });
      await offlineStorage.clearOldSyncOperations();

      return result;
    } catch (error) {
      console.error('[SYNC] Failed:', error);
      const result: SyncResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      this.notifyListeners({ status: 'failed', error: result.message });
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncOrders(): Promise<{ synced: number; failed: number }> {
    const pendingOrders = await offlineStorage.getPendingOrders();
    let synced = 0;
    let failed = 0;

    console.log(`[SYNC] Syncing ${pendingOrders.length} pending orders...`);

    for (const order of pendingOrders) {
      try {
        const response = await fetch(`${ORDERING_API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'X-Tenant-Subdomain': this.getTenantSubdomain(),
          },
          body: JSON.stringify(order.orderData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const serverOrderId = data.data?.order?.id || data.order?.id;

        if (!serverOrderId) {
          throw new Error('No server order ID returned');
        }

        await offlineStorage.updateOrderStatus(order.id, 'synced', serverOrderId);
        synced++;
        console.log(`[SYNC] Order ${order.id} synced as ${serverOrderId}`);
      } catch (error) {
        console.error(`[SYNC] Failed to sync order ${order.id}:`, error);
        failed++;

        const updatedOrder = await offlineStorage.getOrder(order.id);
        if (updatedOrder) {
          updatedOrder.retryCount += 1;
          if (updatedOrder.retryCount >= 5) {
            await offlineStorage.updateOrderStatus(order.id, 'failed');
          } else {
            await offlineStorage.saveOrder(updatedOrder);
          }
        }
      }
    }

    return { synced, failed };
  }

  private async syncPayments(): Promise<{ synced: number; failed: number }> {
    const pendingPayments = await offlineStorage.getPendingPayments();
    let synced = 0;
    let failed = 0;

    console.log(`[SYNC] Syncing ${pendingPayments.length} pending payments...`);

    for (const payment of pendingPayments) {
      try {
        const resolvedOrderId = await this.resolveServerOrderId(payment.orderId);
        if (!resolvedOrderId) {
          console.log(`[SYNC] Deferring payment ${payment.id}; order ${payment.orderId} not synced yet`);
          continue;
        }

        const response = await fetch(`${ORDERING_API_BASE}/payments/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'X-Tenant-Subdomain': this.getTenantSubdomain(),
          },
          body: JSON.stringify({
            ...payment.paymentData,
            orderId: resolvedOrderId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        payment.status = 'synced';
        payment.syncedAt = Date.now();
        await offlineStorage.savePayment(payment);
        synced++;
        console.log(`[SYNC] Payment ${payment.id} synced for order ${resolvedOrderId}`);
      } catch (error) {
        console.error(`[SYNC] Failed to sync payment ${payment.id}:`, error);
        failed++;

        payment.retryCount = (payment.retryCount || 0) + 1;
        if (payment.retryCount >= 5) {
          payment.status = 'failed';
        }
        await offlineStorage.savePayment(payment);
      }
    }

    return { synced, failed };
  }

  private async syncQueue(): Promise<{ synced: number; failed: number }> {
    const pendingOps = await offlineStorage.getPendingSyncOperations();
    let synced = 0;
    let failed = 0;

    console.log(`[SYNC] Syncing ${pendingOps.length} queue operations...`);

    for (const operation of pendingOps) {
      if (operation.id === undefined) {
        console.warn('[SYNC] Skipping operation without ID:', operation);
        continue;
      }

      // Orders and payments are synced through dedicated stores only.
      if (operation.type === 'order' || operation.type === 'payment') {
        await offlineStorage.markSyncCompleted(operation.id);
        synced++;
        continue;
      }

      try {
        const response = await fetch(`${ORDERING_API_BASE}${operation.endpoint}`, {
          method: operation.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'X-Tenant-Subdomain': this.getTenantSubdomain(),
          },
          body: operation.method !== 'GET' ? JSON.stringify(operation.data) : undefined,
        });

        if (response.ok) {
          await offlineStorage.markSyncCompleted(operation.id);
          synced++;
        } else {
          await offlineStorage.incrementRetryCount(operation.id);
          failed++;
        }
      } catch (error) {
        console.error(`[SYNC] Failed to sync queue operation ${operation.id}:`, error);
        await offlineStorage.incrementRetryCount(operation.id);
        failed++;
      }
    }

    return { synced, failed };
  }

  private async resolveServerOrderId(orderId: string): Promise<string | null> {
    if (!orderId.startsWith('local_')) {
      return orderId;
    }

    const localOrder = await offlineStorage.getOrder(orderId);
    if (!localOrder?.serverId) {
      return null;
    }

    return localOrder.serverId;
  }

  private getTenantSubdomain(): string {
    if (typeof window === 'undefined') return 'dima';

    const hostname = window.location.hostname;
    if (hostname.includes('localhost')) {
      const parts = hostname.split('.');
      if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
        return parts[0];
      }
      return 'dima';
    }

    const parts = hostname.split('.');
    return parts.length >= 3 ? parts[0] : 'dima';
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  getSyncStatus(): SyncStatus {
    return {
      status: this.isSyncing ? 'syncing' : 'idle',
      progress: 0,
    };
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.syncListeners.clear();
  }
}

export interface SyncResult {
  success: boolean;
  message?: string;
  ordersSynced?: number;
  ordersFailed?: number;
  paymentsSynced?: number;
  paymentsFailed?: number;
  queueSynced?: number;
  queueFailed?: number;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  progress?: number;
  result?: SyncResult;
  error?: string;
}

export const syncService = new SyncService();
