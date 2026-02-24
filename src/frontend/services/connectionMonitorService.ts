/**
 * Connection Monitor Service
 * Monitors online/offline status and connection quality
 */

import { API_URL } from '../lib/apiUtils';

export type ConnectionStatus = 'online' | 'offline' | 'slow' | 'unstable';
export type ConnectionReason = 'browser_offline' | 'health_check_failed' | 'recovered';

export interface ConnectionState {
  status: ConnectionStatus;
  lastOnline: number | null;
  lastOffline: number | null;
  isOnline: boolean;
  quality: 'good' | 'poor';
  reason?: ConnectionReason;
}

class ConnectionMonitorService {
  private status: ConnectionStatus = 'online';
  private isOnline: boolean = true;
  private lastOnline: number | null = Date.now();
  private lastOffline: number | null = null;
  private quality: 'good' | 'poor' = 'good';
  private reason: ConnectionReason | undefined = undefined;
  private listeners: Set<(state: ConnectionState) => void> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures: number = 0;
  private readonly healthCheckUrl: string = this.buildHealthCheckUrl();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      this.isOnline = navigator.onLine;
      this.status = navigator.onLine ? 'online' : 'offline';
      this.reason = navigator.onLine ? undefined : 'browser_offline';

      this.startPingMonitoring();
    }
  }

  private handleOnline() {
    console.log('[CONNECTION] Browser reported online');
    this.isOnline = true;
    this.lastOnline = Date.now();
    this.status = 'online';
    this.consecutiveFailures = 0;
    this.quality = 'good';
    this.reason = 'recovered';
    this.notifyListeners();
  }

  private handleOffline() {
    console.log('[CONNECTION] Browser reported offline');
    this.isOnline = false;
    this.lastOffline = Date.now();
    this.status = 'offline';
    this.quality = 'poor';
    this.reason = 'browser_offline';
    this.notifyListeners();
  }

  private startPingMonitoring() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      try {
        const startTime = Date.now();
        const response = await fetch(this.healthCheckUrl, {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000),
        });
        const latency = Date.now() - startTime;

        if (response.ok) {
          this.consecutiveFailures = 0;

          if (latency > 3000) {
            if (this.status !== 'slow') {
              console.log('[CONNECTION] Connection is slow');
              this.status = 'slow';
              this.quality = 'poor';
              this.reason = undefined;
              this.notifyListeners();
            }
          } else if (latency > 1000) {
            if (this.status !== 'unstable') {
              console.log('[CONNECTION] Connection is unstable');
              this.status = 'unstable';
              this.quality = 'poor';
              this.reason = undefined;
              this.notifyListeners();
            }
          } else if (this.status !== 'online') {
            console.log('[CONNECTION] Connection is good');
            this.status = 'online';
            this.isOnline = true;
            this.quality = 'good';
            this.reason = 'recovered';
            this.notifyListeners();
          }
        } else {
          this.handleConnectionFailure();
        }
      } catch {
        this.handleConnectionFailure();
      }
    }, 10000);
  }

  private handleConnectionFailure() {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= 3) {
      if (this.status !== 'offline') {
        console.log('[CONNECTION] Health checks failed repeatedly; marking offline');
        this.isOnline = false;
        this.status = 'offline';
        this.lastOffline = Date.now();
        this.quality = 'poor';
        this.reason = 'health_check_failed';
        this.notifyListeners();
      }
    } else if (this.consecutiveFailures >= 2) {
      if (this.status !== 'unstable') {
        console.log('[CONNECTION] Connection is unstable');
        this.status = 'unstable';
        this.quality = 'poor';
        this.reason = undefined;
        this.notifyListeners();
      }
    }
  }

  private buildHealthCheckUrl(): string {
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${base}/api/health`;
  }

  private notifyListeners() {
    const state: ConnectionState = {
      status: this.status,
      lastOnline: this.lastOnline,
      lastOffline: this.lastOffline,
      isOnline: this.isOnline,
      quality: this.quality,
      reason: this.reason,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): ConnectionState {
    return {
      status: this.status,
      lastOnline: this.lastOnline,
      lastOffline: this.lastOffline,
      isOnline: this.isOnline,
      quality: this.quality,
      reason: this.reason,
    };
  }

  isCurrentlyOnline(): boolean {
    return this.isOnline && this.status !== 'offline';
  }

  isConnectionGood(): boolean {
    return this.isOnline && (this.status === 'online' || this.status === 'unstable');
  }

  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    this.listeners.clear();
  }
}

export const connectionMonitor = new ConnectionMonitorService();
