/**
 * Connection Monitor Service
 * Monitors online/offline status and connection quality
 */

export type ConnectionStatus = 'online' | 'offline' | 'slow' | 'unstable';

export interface ConnectionState {
  status: ConnectionStatus;
  lastOnline: number | null;
  lastOffline: number | null;
  isOnline: boolean;
  quality: 'good' | 'poor';
}

class ConnectionMonitorService {
  private status: ConnectionStatus = 'online';
  private isOnline: boolean = true;
  private lastOnline: number | null = Date.now();
  private lastOffline: number | null = null;
  private quality: 'good' | 'poor' = 'good';
  private listeners: Set<(state: ConnectionState) => void> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures: number = 0;

  constructor() {
    this.init();
  }

  /**
   * Initialize connection monitoring
   */
  private init() {
    // Monitor browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Initial status
      this.isOnline = navigator.onLine;
      this.status = navigator.onLine ? 'online' : 'offline';

      // Start ping monitoring for connection quality
      this.startPingMonitoring();
    }
  }

  /**
   * Handle online event
   */
  private handleOnline() {
    console.log('🌐 [CONNECTION] Browser reported online');
    this.isOnline = true;
    this.lastOnline = Date.now();
    this.status = 'online';
    this.consecutiveFailures = 0;
    this.quality = 'good';
    this.notifyListeners();
  }

  /**
   * Handle offline event
   */
  private handleOffline() {
    console.log('📴 [CONNECTION] Browser reported offline');
    this.isOnline = false;
    this.lastOffline = Date.now();
    this.status = 'offline';
    this.quality = 'poor';
    this.notifyListeners();
  }

  /**
   * Start ping monitoring to detect slow/unstable connections
   */
  private startPingMonitoring() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(async () => {
      if (!this.isOnline) return;

      try {
        const startTime = Date.now();
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        const latency = Date.now() - startTime;

        if (response.ok) {
          this.consecutiveFailures = 0;

          if (latency > 3000) {
            // Slow connection
            if (this.status !== 'slow') {
              console.log('🐌 [CONNECTION] Connection is slow');
              this.status = 'slow';
              this.quality = 'poor';
              this.notifyListeners();
            }
          } else if (latency > 1000) {
            // Unstable connection
            if (this.status !== 'unstable') {
              console.log('⚠️ [CONNECTION] Connection is unstable');
              this.status = 'unstable';
              this.quality = 'poor';
              this.notifyListeners();
            }
          } else {
            // Good connection
            if (this.status !== 'online') {
              console.log('✅ [CONNECTION] Connection is good');
              this.status = 'online';
              this.quality = 'good';
              this.notifyListeners();
            }
          }
        } else {
          this.handleConnectionFailure();
        }
      } catch {
        this.handleConnectionFailure();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure() {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= 3) {
      // After 3 consecutive failures, consider offline
      if (this.status !== 'offline') {
        console.log('❌ [CONNECTION] Connection failed, marking as offline');
        this.isOnline = false;
        this.status = 'offline';
        this.lastOffline = Date.now();
        this.quality = 'poor';
        this.notifyListeners();
      }
    } else if (this.consecutiveFailures >= 2) {
      // After 2 failures, mark as unstable
      if (this.status !== 'unstable') {
        console.log('⚠️ [CONNECTION] Connection is unstable');
        this.status = 'unstable';
        this.quality = 'poor';
        this.notifyListeners();
      }
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    const state: ConnectionState = {
      status: this.status,
      lastOnline: this.lastOnline,
      lastOffline: this.lastOffline,
      isOnline: this.isOnline,
      quality: this.quality
    };

    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener);

    // Immediately call with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return {
      status: this.status,
      lastOnline: this.lastOnline,
      lastOffline: this.lastOffline,
      isOnline: this.isOnline,
      quality: this.quality
    };
  }

  /**
   * Check if currently online
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline && this.status !== 'offline';
  }

  /**
   * Check if connection is good enough for real-time operations
   */
  isConnectionGood(): boolean {
    return this.isOnline && (this.status === 'online' || this.status === 'unstable');
  }

  /**
   * Cleanup
   */
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

