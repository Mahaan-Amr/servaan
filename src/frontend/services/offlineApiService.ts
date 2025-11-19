/**
 * Offline-Aware API Service
 * Wraps API calls with offline detection and queue management
 */

import { connectionMonitor } from './connectionMonitorService';
import { offlineStorage } from './offlineStorageService';
import { API_URL } from '../lib/apiUtils';
import type { OrderingSettings } from './orderingService';

const ORDERING_API_BASE = `${API_URL}/ordering`;

export interface OfflineApiRequest {
  endpoint: string;
  options: RequestInit;
  queueIfOffline?: boolean;
  cacheResponse?: boolean;
}

class OfflineApiService {
  /**
   * Make API request with offline support
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    queueIfOffline: boolean = true,
    cacheResponse: boolean = false
  ): Promise<T> {
    const url = `${ORDERING_API_BASE}${endpoint}`;
    const isOnline = connectionMonitor.isCurrentlyOnline();

    // Prepare headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('token') || sessionStorage.getItem('token') 
      : null;
    
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    defaultHeaders['X-Tenant-Subdomain'] = this.getTenantSubdomain();

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      cache: 'no-store'
    };

    // If online, try to make the request
    if (isOnline) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // Cache response if requested
        if (cacheResponse) {
          await this.cacheResponse(endpoint, data);
        }

        return data.data || data;
      } catch (error) {
        // If request fails and we should queue it, add to queue
        if (queueIfOffline && options.method && options.method !== 'GET') {
          console.log('📴 [OFFLINE_API] Request failed, queueing for later:', endpoint);
          await this.queueRequest(endpoint, options);
          throw new Error('Request queued for offline sync');
        }
        throw error;
      }
    } else {
      // Offline - queue if it's a mutation
      if (queueIfOffline && options.method && options.method !== 'GET') {
        console.log('📴 [OFFLINE_API] Offline, queueing request:', endpoint);
        await this.queueRequest(endpoint, options);
        
        // For POST requests (like order creation), return a local response
        if (options.method === 'POST' && endpoint.includes('/orders')) {
          return await this.createLocalOrderResponse(options.body as string) as T;
        }
        
        throw new Error('Request queued for offline sync');
      }

      // For GET requests, try to return cached data
      if (options.method === 'GET' || !options.method) {
        const cached = await this.getCachedResponse(endpoint);
        if (cached) {
          console.log('💾 [OFFLINE_API] Returning cached data for:', endpoint);
          return cached as T;
        }
      }

      throw new Error('Offline and no cached data available');
    }
  }

  /**
   * Queue request for later sync
   */
  private async queueRequest(endpoint: string, options: RequestInit): Promise<void> {
    await offlineStorage.init();
    
    let data = null;
    if (options.body) {
      try {
        data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch {
        data = options.body;
      }
    }

    const operationType = this.getOperationType(endpoint, options.method || 'GET');

    await offlineStorage.addToSyncQueue({
      type: operationType,
      data,
      endpoint,
      method: options.method || 'GET'
    });
  }

  /**
   * Get operation type from endpoint
   */
  private getOperationType(endpoint: string, method: string): 'order' | 'payment' | 'order_update' | 'payment_update' {
    if (endpoint.includes('/orders') && method === 'POST') {
      return 'order';
    }
    if (endpoint.includes('/payments') && method === 'POST') {
      return 'payment';
    }
    if (endpoint.includes('/orders') && (method === 'PUT' || method === 'PATCH')) {
      return 'order_update';
    }
    if (endpoint.includes('/payments') && (method === 'PUT' || method === 'PATCH')) {
      return 'payment_update';
    }
    return 'order'; // Default
  }

  /**
   * Cache API response
   */
  private async cacheResponse(endpoint: string, data: unknown): Promise<void> {
    await offlineStorage.init();
    
    // Cache menu data
    if (endpoint.includes('/menu/full')) {
      const menuData = data as { categories?: unknown[]; items?: unknown[] };
      await offlineStorage.cacheMenu({
        categories: menuData.categories || [],
        items: menuData.items || [],
        lastUpdated: Date.now()
      });
    }

    // Cache tables
    if (endpoint.includes('/tables')) {
      const tablesData = Array.isArray(data) 
        ? data 
        : (data as { tables?: unknown[] }).tables || [];
      await offlineStorage.cacheTables({
        tables: tablesData,
        lastUpdated: Date.now()
      });
    }

    // Cache settings
    if (endpoint.includes('/settings')) {
      await offlineStorage.cacheSettings({
        orderingSettings: data as OrderingSettings,
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(endpoint: string): Promise<unknown | null> {
    await offlineStorage.init();

    // Get cached menu
    if (endpoint.includes('/menu/full')) {
      const cached = await offlineStorage.getCachedMenu();
      if (cached && (Date.now() - cached.lastUpdated) < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    // Get cached tables
    if (endpoint.includes('/tables')) {
      const cached = await offlineStorage.getCachedTables();
      if (cached && (Date.now() - cached.lastUpdated) < 60 * 60 * 1000) {
        return cached.tables;
      }
    }

    // Get cached settings
    if (endpoint.includes('/settings')) {
      const cached = await offlineStorage.getCachedSettings();
      if (cached && (Date.now() - cached.lastUpdated) < 60 * 60 * 1000) {
        return cached.orderingSettings;
      }
    }

    return null;
  }

  /**
   * Create local order response for offline mode
   */
  private async createLocalOrderResponse(orderData: string): Promise<unknown> {
    const data = JSON.parse(orderData);
    const localOrderId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = `OFFLINE-${Date.now()}`;

    // Save to offline storage
    await offlineStorage.init();
    await offlineStorage.saveOrder({
      id: localOrderId,
      orderData: data,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0
    });

    return {
      success: true,
      data: {
        order: {
          id: localOrderId,
          orderNumber,
          status: 'SUBMITTED',
          orderType: data.orderType,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          tableId: data.tableId,
          guestCount: data.guestCount,
          subtotal: data.subtotal,
          discountAmount: data.discountAmount || 0,
          taxAmount: data.taxAmount || 0,
          serviceCharge: data.serviceCharge || 0,
          totalAmount: data.totalAmount,
          paymentStatus: 'PENDING',
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          paidAmount: data.paidAmount || 0,
          notes: data.notes,
          createdAt: new Date().toISOString()
        },
        orderNumber,
        message: 'Order created offline, will sync when connection is restored'
      }
    };
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
}

export const offlineApiService = new OfflineApiService();

