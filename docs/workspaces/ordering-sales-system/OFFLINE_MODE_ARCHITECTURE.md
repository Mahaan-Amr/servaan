# Offline Mode Architecture - Ordering System
# معماری حالت آفلاین - سیستم سفارش‌گیری

## Overview | نمای کلی

The ordering system now supports **offline-first operation**, allowing the POS system to continue working even when internet connection is lost. All data is automatically synchronized when connection is restored.

سیستم سفارش‌گیری اکنون از **عملکرد آفلاین-اول** پشتیبانی می‌کند و به سیستم POS اجازه می‌دهد حتی در صورت قطع اتصال به اینترنت نیز به کار خود ادامه دهد. تمام داده‌ها به صورت خودکار هنگام بازگشت اتصال همگام‌سازی می‌شوند.

## Architecture Components | اجزای معماری

### 1. **Offline Storage Service** (`offlineStorageService.ts`)
- **Purpose**: Manages IndexedDB for persistent local storage
- **Features**:
  - Stores pending orders locally
  - Caches menu, tables, and settings data
  - Manages sync queue for pending operations
  - Tracks sync status and retry counts

### 2. **Connection Monitor Service** (`connectionMonitorService.ts`)
- **Purpose**: Monitors online/offline status and connection quality
- **Features**:
  - Detects browser online/offline events
  - Monitors connection quality (ping-based)
  - Distinguishes between offline, slow, and unstable connections
  - Provides real-time connection state updates

### 3. **Sync Service** (`syncService.ts`)
- **Purpose**: Handles automatic synchronization when connection is restored
- **Features**:
  - Syncs pending orders to server
  - Syncs pending payments
  - Processes sync queue operations
  - Retry logic with exponential backoff
  - Conflict resolution

### 4. **Offline API Service** (`offlineApiService.ts`)
- **Purpose**: Wraps API calls with offline detection and queue management
- **Features**:
  - Intercepts API requests
  - Queues mutations when offline
  - Returns cached data for GET requests
  - Creates local responses for offline order creation

### 5. **Offline Status Bar** (`OfflineStatusBar.tsx`)
- **Purpose**: UI component showing connection and sync status
- **Features**:
  - Visual indicator of online/offline status
  - Shows pending sync operations count
  - Displays sync progress
  - Color-coded status (green/yellow/red)

## How It Works | نحوه عملکرد

### **Online Mode (Normal Operation)**
1. User creates order → API request sent to server
2. Server responds with order data
3. Data is cached locally for offline use
4. Real-time updates via WebSocket

### **Offline Mode (Connection Lost)**
1. Connection monitor detects offline status
2. API requests are intercepted
3. **GET requests**: Return cached data from IndexedDB
4. **POST/PUT/DELETE requests**: Queued for later sync
5. Orders created offline get temporary local IDs
6. User can continue working normally

### **Sync Mode (Connection Restored)**
1. Connection monitor detects online status
2. Sync service automatically starts
3. Pending orders are synced to server
4. Pending payments are processed
5. Queue operations are executed
6. User is notified of sync completion

## Data Flow | جریان داده

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Offline API    │
│     Service     │
└──────┬──────────┘
       │
       ├─── Online? ──► Server API
       │
       └─── Offline? ──► IndexedDB Queue
                              │
                              ▼
                         ┌──────────┐
                         │  Sync    │
                         │ Service  │
                         └────┬─────┘
                              │
                              ▼ (when online)
                         ┌──────────┐
                         │ Server   │
                         └──────────┘
```

## Features Implemented | ویژگی‌های پیاده‌سازی شده

### ✅ **Offline Order Creation**
- Orders can be created when offline
- Temporary local IDs assigned (`local_${timestamp}_${random}`)
- Orders queued for sync
- User sees success message immediately

### ✅ **Offline Data Caching**
- Menu data cached (24 hour TTL)
- Tables data cached (1 hour TTL)
- Settings cached (1 hour TTL)
- Automatic cache refresh when online

### ✅ **Automatic Synchronization**
- Syncs when connection restored
- Retry failed operations (max 5 retries)
- Processes queue in order
- Updates local data with server IDs

### ✅ **Connection Quality Monitoring**
- Detects slow connections (>3s latency)
- Detects unstable connections (>1s latency)
- Marks as offline after 3 consecutive failures
- Provides connection quality feedback

### ✅ **UI Status Indicators**
- Offline status bar at top of POS
- Shows pending operations count
- Displays sync progress
- Color-coded status (red/yellow/green)

## Technical Details | جزئیات فنی

### **IndexedDB Schema**
```
servaan_ordering_offline (v1)
├── orders (keyPath: id)
│   ├── index: status
│   ├── index: createdAt
│   └── index: serverId
├── payments (keyPath: id)
│   ├── index: orderId
│   └── index: status
├── menu_cache (keyPath: id)
├── tables_cache (keyPath: id)
├── settings_cache (keyPath: id)
└── sync_queue (keyPath: id, autoIncrement)
    ├── index: type
    ├── index: status
    └── index: createdAt
```

### **Sync Queue Structure**
```typescript
{
  id: number;
  type: 'order' | 'payment' | 'order_update' | 'payment_update';
  data: any;
  endpoint: string;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: number;
  retryCount: number;
}
```

### **Order Offline Structure**
```typescript
{
  id: string; // Local ID
  serverId?: string; // Server ID (after sync)
  orderData: CreateOrderRequest;
  status: 'pending' | 'synced' | 'failed';
  createdAt: number;
  syncedAt?: number;
  retryCount: number;
  error?: string;
}
```

## Conflict Resolution | حل تعارض

When syncing, if an order with the same data already exists on the server:
1. Check if local order data matches server order
2. If match found, update local order with server ID
3. If no match, create new order on server
4. Mark local order as synced

## Limitations | محدودیت‌ها

1. **Real-time Updates**: WebSocket connections are lost when offline
2. **Stock Validation**: Cannot validate stock in real-time when offline
3. **Payment Processing**: Card payments require online connection
4. **Analytics**: Real-time analytics unavailable offline
5. **Multi-device Sync**: Conflicts possible if multiple devices offline simultaneously

## Future Enhancements | بهبودهای آینده

1. **Optimistic UI Updates**: Show changes immediately before sync
2. **Conflict Resolution UI**: Allow user to resolve conflicts manually
3. **Partial Sync**: Sync only changed data
4. **Background Sync API**: Use Service Worker Background Sync
5. **Compression**: Compress cached data to save space
6. **Sync Priority**: Prioritize critical operations (payments > orders)

## Testing | تست

To test offline mode:
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Try creating an order
4. Order should be created locally
5. Set throttling back to "Online"
6. Order should sync automatically

## Performance | عملکرد

- **IndexedDB Operations**: < 50ms per operation
- **Sync Time**: ~100-500ms per order (depending on network)
- **Cache Size**: ~1-5MB for typical menu data
- **Memory Usage**: Minimal (data stored in IndexedDB, not memory)

## Security | امنیت

- **Data Encryption**: Consider encrypting sensitive data in IndexedDB
- **Token Storage**: Tokens stored in localStorage (existing behavior)
- **Sync Validation**: Server validates all synced data
- **Retry Limits**: Prevents infinite retry loops

