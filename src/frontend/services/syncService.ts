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
    this.init();
  }

  /**
   * Initialize sync service
   */
  private init() {
    // Listen to connection changes
    connectionMonitor.subscribe((state) => {
      if (state.isOnline && !this.isSyncing) {
        // Connection restored, start syncing
        console.log('🔄 [SYNC] Connection restored, starting sync...');
        this.syncAll();
      }
    });

    // Periodic sync check (every 30 seconds when online)
    this.syncInterval = setInterval(() => {
      if (connectionMonitor.isCurrentlyOnline() && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);
  }

  /**
   * Sync all pending data
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⏳ [SYNC] Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    if (!connectionMonitor.isCurrentlyOnline()) {
      console.log('📴 [SYNC] Cannot sync - offline');
      return { success: false, message: 'Offline' };
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing', progress: 0 });

    try {
      console.log('🔄 [SYNC] Starting full sync...');

      // Initialize offline storage
      await offlineStorage.init();

      // Sync orders
      const ordersResult = await this.syncOrders();
      
      // Sync payments
      const paymentsResult = await this.syncPayments();

      // Sync queue operations
      const queueResult = await this.syncQueue();

      const result: SyncResult = {
        success: true,
        ordersSynced: ordersResult.synced,
        ordersFailed: ordersResult.failed,
        paymentsSynced: paymentsResult.synced,
        paymentsFailed: paymentsResult.failed,
        queueSynced: queueResult.synced,
        queueFailed: queueResult.failed
      };

      console.log('✅ [SYNC] Sync completed:', result);
      this.notifyListeners({ status: 'completed', result });

      // Cleanup old sync operations
      await offlineStorage.clearOldSyncOperations();

      return result;
    } catch (error) {
      console.error('❌ [SYNC] Sync failed:', error);
      const result: SyncResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.notifyListeners({ status: 'failed', error: result.message });
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync pending orders
   */
  private async syncOrders(): Promise<{ synced: number; failed: number }> {
    const pendingOrders = await offlineStorage.getPendingOrders();
    let synced = 0;
    let failed = 0;

    console.log(`🔄 [SYNC] Syncing ${pendingOrders.length} pending orders...`);

    for (const order of pendingOrders) {
      try {
        // Try to create order on server
        const response = await fetch(`${ORDERING_API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'X-Tenant-Subdomain': this.getTenantSubdomain()
          },
          body: JSON.stringify(order.orderData)
        });

        if (response.ok) {
          const data = await response.json();
          const serverOrderId = data.data?.order?.id || data.order?.id;

          if (serverOrderId) {
            // Update order with server ID and mark as synced
            await offlineStorage.updateOrderStatus(order.id, 'synced', serverOrderId);
            synced++;
            console.log(`✅ [SYNC] Order ${order.id} synced as ${serverOrderId}`);
          } else {
            throw new Error('No server ID returned');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ [SYNC] Failed to sync order ${order.id}:`, error);
        failed++;

        // Update retry count
        const updatedOrder = await offlineStorage.getOrder(order.id);
        if (updatedOrder) {
          updatedOrder.retryCount++;
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

  /**
   * Sync pending payments
   */
  private async syncPayments(): Promise<{ synced: number; failed: number }> {
    const pendingPayments = await offlineStorage.getPendingPayments();
    let synced = 0;
    let failed = 0;

    console.log(`🔄 [SYNC] Syncing ${pendingPayments.length} pending payments...`);

    for (const payment of pendingPayments) {
      try {
        // Try to process payment on server
        const response = await fetch(`${ORDERING_API_BASE}/payments/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'X-Tenant-Subdomain': this.getTenantSubdomain()
          },
          body: JSON.stringify(payment.paymentData)
        });

        if (response.ok) {
          // Mark payment as synced
          payment.status = 'synced';
          payment.syncedAt = Date.now();
          await offlineStorage.savePayment(payment);
          synced++;
          console.log(`✅ [SYNC] Payment ${payment.id} synced`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ [SYNC] Failed to sync payment ${payment.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Sync queue operations
   */
  private async syncQueue(): Promise<{ synced: number; failed: number }> {
    const pendingOps = await offlineStorage.getPendingSyncOperations();
    let synced = 0;
    let failed = 0;

    console.log(`🔄 [SYNC] Syncing ${pendingOps.length} queue operations...`);

    for (const operation of pendingOps) {
      // Skip operations without an ID
      if (operation.id === undefined) {
        console.warn('⚠️ [SYNC] Skipping operation without ID:', operation);
        continue;
      }

      try {
        const response = await fetch(`${ORDERING_API_BASE}${operation.endpoint}`, {
          method: operation.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'X-Tenant-Subdomain': this.getTenantSubdomain()
          },
          body: operation.method !== 'GET' ? JSON.stringify(operation.data) : undefined
        });

        if (response.ok) {
          await offlineStorage.markSyncCompleted(operation.id);
          synced++;
          console.log(`✅ [SYNC] Queue operation ${operation.id} synced`);
        } else {
          await offlineStorage.incrementRetryCount(operation.id);
          failed++;
        }
      } catch (error) {
        console.error(`❌ [SYNC] Failed to sync queue operation ${operation.id}:`, error);
        await offlineStorage.incrementRetryCount(operation.id);
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Get tenant subdomain
   */
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

  /**
   * Subscribe to sync status updates
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      status: this.isSyncing ? 'syncing' : 'idle',
      progress: 0
    };
  }

  /**
   * Cleanup
   */
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

