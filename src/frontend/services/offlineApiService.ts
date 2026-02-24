/**
 * Offline-Aware API Service
 * Wraps API calls with offline detection and queue management
 */

import { connectionMonitor } from './connectionMonitorService';
import { offlineStorage } from './offlineStorageService';
import { API_URL } from '../lib/apiUtils';
import type { OrderingSettings, ProcessPaymentRequest } from './orderingService';

const ORDERING_API_BASE = `${API_URL}/ordering`;

type OperationType = 'order' | 'payment' | 'order_update' | 'payment_update';

export interface OfflineApiRequest {
  endpoint: string;
  options: RequestInit;
  queueIfOffline?: boolean;
  cacheResponse?: boolean;
}

export class OfflineQueuedError extends Error {
  code: 'OFFLINE_QUEUED';
  endpoint: string;
  operationType: OperationType;

  constructor(message: string, endpoint: string, operationType: OperationType) {
    super(message);
    this.name = 'OfflineQueuedError';
    this.code = 'OFFLINE_QUEUED';
    this.endpoint = endpoint;
    this.operationType = operationType;
  }
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

    if (isOnline) {
      try {
        const response = await fetch(url, config);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (cacheResponse) {
          await this.cacheResponse(endpoint, data);
        }

        return data.data || data;
      } catch (error) {
        if (
          queueIfOffline &&
          options.method &&
          options.method !== 'GET' &&
          this.isNetworkFailure(error)
        ) {
          console.log('📴 [OFFLINE_API] Network failure, applying offline mutation strategy:', endpoint);
          return await this.handleOfflineMutation(endpoint, options);
        }
        throw error;
      }
    }

    if (queueIfOffline && options.method && options.method !== 'GET') {
      console.log('📴 [OFFLINE_API] Offline, applying offline mutation strategy:', endpoint);
      return await this.handleOfflineMutation(endpoint, options);
    }

    if (options.method === 'GET' || !options.method) {
      const cached = await this.getCachedResponse(endpoint);
      if (cached) {
        console.log('💾 [OFFLINE_API] Returning cached data for:', endpoint);
        return cached as T;
      }
    }

    throw new Error('Offline and no cached data available');
  }

  private async handleOfflineMutation<T = unknown>(endpoint: string, options: RequestInit): Promise<T> {
    await offlineStorage.init();
    const method = (options.method || 'GET').toUpperCase();
    const operationType = this.getOperationType(endpoint, method);
    const payload = this.parseRequestBody(options.body);

    // Dedicated order store path
    if (operationType === 'order' && method === 'POST') {
      return await this.createLocalOrderResponse(payload) as T;
    }

    // Dedicated payment store path
    if (operationType === 'payment' && method === 'POST') {
      await this.queueOfflinePayment(payload as ProcessPaymentRequest);
      throw new OfflineQueuedError(
        'Payment queued for sync after connectivity is restored',
        endpoint,
        operationType
      );
    }

    // Generic queue for other mutations
    await this.queueRequest(endpoint, {
      ...options,
      method,
      body: payload === null ? undefined : JSON.stringify(payload),
    });

    throw new OfflineQueuedError('Request queued for offline sync', endpoint, operationType);
  }

  private parseRequestBody(body: BodyInit | null | undefined): unknown {
    if (!body) return null;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  }

  private isNetworkFailure(error: unknown): boolean {
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    const lowered = message.toLowerCase();
    return (
      lowered.includes('failed to fetch') ||
      lowered.includes('networkerror') ||
      lowered.includes('network request failed') ||
      lowered.includes('load failed') ||
      lowered.includes('timeout') ||
      lowered.includes('aborted')
    );
  }

  private async queueOfflinePayment(paymentData: ProcessPaymentRequest): Promise<void> {
    const localPaymentId = `local_payment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await offlineStorage.savePayment({
      id: localPaymentId,
      orderId: paymentData.orderId,
      paymentData,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0
    });
    console.log('💾 [OFFLINE_STORAGE] Payment saved offline:', localPaymentId);
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

    // Avoid duplicate sync paths for order/payment
    if (operationType === 'order' || operationType === 'payment') {
      return;
    }

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
  private getOperationType(endpoint: string, method: string): OperationType {
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
    return 'order_update';
  }

  /**
   * Cache API response
   */
  private async cacheResponse(endpoint: string, data: unknown): Promise<void> {
    await offlineStorage.init();

    if (endpoint.includes('/menu/full')) {
      const menuData = data as { categories?: unknown[]; items?: unknown[] };
      await offlineStorage.cacheMenu({
        categories: menuData.categories || [],
        items: menuData.items || [],
        lastUpdated: Date.now()
      });
    }

    if (endpoint.includes('/tables')) {
      const tablesData = Array.isArray(data)
        ? data
        : (data as { tables?: unknown[] }).tables || [];
      await offlineStorage.cacheTables({
        tables: tablesData,
        lastUpdated: Date.now()
      });
    }

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

    if (endpoint.includes('/menu/full')) {
      const cached = await offlineStorage.getCachedMenu();
      if (cached && (Date.now() - cached.lastUpdated) < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    if (endpoint.includes('/tables')) {
      const cached = await offlineStorage.getCachedTables();
      if (cached && (Date.now() - cached.lastUpdated) < 60 * 60 * 1000) {
        return cached.tables;
      }
    }

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
  private async createLocalOrderResponse(orderData: unknown): Promise<unknown> {
    const data = orderData as Record<string, unknown>;
    const localOrderId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const orderNumber = `OFFLINE-${Date.now()}`;

    await offlineStorage.init();
    await offlineStorage.saveOrder({
      id: localOrderId,
      orderData: data as any,
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
