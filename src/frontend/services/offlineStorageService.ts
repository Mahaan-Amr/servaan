/**
 * Offline Storage Service
 * Manages IndexedDB for offline data persistence
 */

import { CreateOrderRequest, ProcessPaymentRequest, OrderingSettings } from './orderingService';

const DB_NAME = 'servaan_ordering_offline';
const DB_VERSION = 1;

// Menu and table types (simplified for caching)
// These are flexible types that accept the actual API types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CachedMenuCategory = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CachedMenuItem = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CachedTable = any;

export interface OfflineOrder {
  id: string; // Local ID (temporary)
  serverId?: string; // Server ID (after sync)
  orderData: CreateOrderRequest;
  status: 'pending' | 'synced' | 'failed';
  createdAt: number;
  syncedAt?: number;
  retryCount: number;
  error?: string;
}

export interface OfflinePayment {
  id: string;
  orderId: string;
  paymentData: ProcessPaymentRequest;
  status: 'pending' | 'synced' | 'failed';
  createdAt: number;
  syncedAt?: number;
  retryCount: number;
}

export interface CachedMenu {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  lastUpdated: number;
}

export interface CachedTables {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tables: any[];
  lastUpdated: number;
}

export interface CachedSettings {
  orderingSettings: OrderingSettings;
  lastUpdated: number;
}

export interface SyncQueueOperation {
  id?: number;
  type: 'order' | 'payment' | 'order_update' | 'payment_update';
  data: unknown;
  endpoint: string;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: number;
  retryCount: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ [OFFLINE_STORAGE] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ [OFFLINE_STORAGE] IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
          ordersStore.createIndex('serverId', 'serverId', { unique: true });
        }

        // Payments store
        if (!db.objectStoreNames.contains('payments')) {
          const paymentsStore = db.createObjectStore('payments', { keyPath: 'id' });
          paymentsStore.createIndex('orderId', 'orderId', { unique: false });
          paymentsStore.createIndex('status', 'status', { unique: false });
        }

        // Menu cache store
        if (!db.objectStoreNames.contains('menu_cache')) {
          db.createObjectStore('menu_cache', { keyPath: 'id' });
        }

        // Tables cache store
        if (!db.objectStoreNames.contains('tables_cache')) {
          db.createObjectStore('tables_cache', { keyPath: 'id' });
        }

        // Settings cache store
        if (!db.objectStoreNames.contains('settings_cache')) {
          db.createObjectStore('settings_cache', { keyPath: 'id' });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        console.log('✅ [OFFLINE_STORAGE] IndexedDB schema created/updated');
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // ==================== ORDERS ====================

  /**
   * Save order offline
   */
  async saveOrder(order: OfflineOrder): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.put(order);

      request.onsuccess = () => {
        console.log('💾 [OFFLINE_STORAGE] Order saved offline:', order.id);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ [OFFLINE_STORAGE] Failed to save order:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending orders
   */
  async getPendingOrders(): Promise<OfflineOrder[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<OfflineOrder | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      const request = store.get(orderId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OfflineOrder['status'], serverId?: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const getRequest = store.get(orderId);

      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (!order) {
          reject(new Error('Order not found'));
          return;
        }

        order.status = status;
        if (serverId) {
          order.serverId = serverId;
        }
        if (status === 'synced') {
          order.syncedAt = Date.now();
        }

        const putRequest = store.put(order);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.delete(orderId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== PAYMENTS ====================

  /**
   * Save payment offline
   */
  async savePayment(payment: OfflinePayment): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['payments'], 'readwrite');
      const store = transaction.objectStore('payments');
      const request = store.put(payment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending payments
   */
  async getPendingPayments(): Promise<OfflinePayment[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['payments'], 'readonly');
      const store = transaction.objectStore('payments');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ==================== CACHE ====================

  /**
   * Cache menu data
   */
  async cacheMenu(menu: CachedMenu): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['menu_cache'], 'readwrite');
      const store = transaction.objectStore('menu_cache');
      const request = store.put({ id: 'current', ...menu });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached menu
   */
  async getCachedMenu(): Promise<CachedMenu | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['menu_cache'], 'readonly');
      const store = transaction.objectStore('menu_cache');
      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          delete result.id;
        }
        resolve(result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache tables data
   */
  async cacheTables(tables: CachedTables): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tables_cache'], 'readwrite');
      const store = transaction.objectStore('tables_cache');
      const request = store.put({ id: 'current', ...tables });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached tables
   */
  async getCachedTables(): Promise<CachedTables | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tables_cache'], 'readonly');
      const store = transaction.objectStore('tables_cache');
      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          delete result.id;
        }
        resolve(result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache settings
   */
  async cacheSettings(settings: CachedSettings): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings_cache'], 'readwrite');
      const store = transaction.objectStore('settings_cache');
      const request = store.put({ id: 'current', ...settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached settings
   */
  async getCachedSettings(): Promise<CachedSettings | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings_cache'], 'readonly');
      const store = transaction.objectStore('settings_cache');
      const request = store.get('current');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          delete result.id;
        }
        resolve(result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==================== SYNC QUEUE ====================

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(operation: {
    type: 'order' | 'payment' | 'order_update' | 'payment_update';
    data: unknown;
    endpoint: string;
    method: string;
  }): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.add({
        ...operation,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending sync operations
   */
  async getPendingSyncOperations(): Promise<SyncQueueOperation[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Mark sync operation as completed
   */
  async markSyncCompleted(operationId: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = 'completed';
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Increment retry count for failed operation
   */
  async incrementRetryCount(operationId: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retryCount = (operation.retryCount || 0) + 1;
          if (operation.retryCount >= 5) {
            operation.status = 'failed';
          }
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Clear old completed operations (cleanup)
   */
  async clearOldSyncOperations(olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const index = store.index('status');
      const request = index.getAll('completed');

      request.onsuccess = () => {
        const operations = (request.result || []) as SyncQueueOperation[];
        const cutoff = Date.now() - olderThan;
        const deletePromises = operations
          .filter((op) => op.createdAt < cutoff && op.id !== undefined)
          .map((op) => {
            return new Promise<void>((resolveDelete) => {
              // TypeScript now knows op.id is defined due to filter
              const deleteRequest = store.delete(op.id!);
              deleteRequest.onsuccess = () => resolveDelete();
              deleteRequest.onerror = () => resolveDelete(); // Ignore errors
            });
          });

        Promise.all(deletePromises).then(() => resolve()).catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorageService();

