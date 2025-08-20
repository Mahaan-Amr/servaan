import { socketService } from './socketService';
import { tableCacheService } from './tableCacheService';
import { TableStatus } from '../../../shared/generated/client';

// Real-time table event types
export interface TableStatusUpdate {
  tableId: string;
  tableNumber: string;
  oldStatus: TableStatus;
  newStatus: TableStatus;
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
}

export interface TableReservationUpdate {
  reservationId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  reservationDate: Date;
  guestCount: number;
  action: 'created' | 'updated' | 'cancelled';
  updatedBy: string;
}

export interface TableOrderUpdate {
  tableId: string;
  tableNumber: string;
  orderId: string;
  orderNumber: string;
  action: 'created' | 'updated' | 'completed' | 'cancelled';
  customerName: string;
  totalAmount: number;
  updatedBy: string;
}

export interface TableAnalyticsUpdate {
  tableId: string;
  tableNumber: string;
  metrics: {
    utilizationRate: number;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
}

class TableRealTimeService {
  /**
   * Send table status update to all connected users in the tenant
   */
  async broadcastTableStatusUpdate(tenantId: string, update: TableStatusUpdate) {
    try {
      // Invalidate cache for this table
      await tableCacheService.invalidateTableCache(tenantId, update.tableId);
      
      // Broadcast to all users in the tenant
      socketService.sendToRole('ADMIN', 'table-status-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      socketService.sendToRole('MANAGER', 'table-status-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      socketService.sendToRole('STAFF', 'table-status-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      console.log(`📡 Broadcasted table status update: ${update.tableNumber} -> ${update.newStatus}`);
    } catch (error) {
      console.error('❌ Error broadcasting table status update:', error);
    }
  }

  /**
   * Send reservation update to relevant users
   */
  async broadcastReservationUpdate(tenantId: string, update: TableReservationUpdate) {
    try {
      // Invalidate cache for reservations
      await tableCacheService.invalidateTableCache(tenantId);
      
      // Broadcast to managers and staff
      socketService.sendToRole('MANAGER', 'table-reservation-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      socketService.sendToRole('STAFF', 'table-reservation-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      console.log(`📡 Broadcasted reservation update: ${update.action} for table ${update.tableNumber}`);
    } catch (error) {
      console.error('❌ Error broadcasting reservation update:', error);
    }
  }

  /**
   * Send order update to kitchen and relevant staff
   */
  async broadcastOrderUpdate(tenantId: string, update: TableOrderUpdate) {
    try {
      // Invalidate cache for this table
      await tableCacheService.invalidateTableCache(tenantId, update.tableId);
      
      // Broadcast to kitchen staff
      socketService.sendToRole('STAFF', 'table-order-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      // Send specific kitchen update if order is created/updated
      if (update.action === 'created' || update.action === 'updated') {
        socketService.sendKitchenOrderUpdate(tenantId, {
          orderId: update.orderId,
          orderNumber: update.orderNumber,
          status: update.action === 'created' ? 'pending' : 'updated',
          items: [], // Will be populated by order service
          estimatedTime: 0,
          allergyInfo: '',
          kitchenNotes: ''
        });
      }
      
      console.log(`📡 Broadcasted order update: ${update.action} for table ${update.tableNumber}`);
    } catch (error) {
      console.error('❌ Error broadcasting order update:', error);
    }
  }

  /**
   * Send analytics update to managers and admins
   */
  async broadcastAnalyticsUpdate(tenantId: string, update: TableAnalyticsUpdate) {
    try {
      // Invalidate analytics cache
      await tableCacheService.invalidateAnalyticsCache(tenantId);
      
      // Broadcast to managers and admins
      socketService.sendToRole('ADMIN', 'table-analytics-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      socketService.sendToRole('MANAGER', 'table-analytics-updated', {
        tenantId,
        ...update
      }, tenantId);
      
      console.log(`📡 Broadcasted analytics update for table ${update.tableNumber}`);
    } catch (error) {
      console.error('❌ Error broadcasting analytics update:', error);
    }
  }

  /**
   * Send bulk table status update
   */
  async broadcastBulkTableUpdate(tenantId: string, updates: TableStatusUpdate[]) {
    try {
      // Invalidate cache for all affected tables
      const tableIds = updates.map(u => u.tableId);
      await tableCacheService.invalidateTableCache(tenantId);
      
      // Broadcast to all roles
      socketService.sendToRole('ADMIN', 'bulk-table-status-updated', {
        tenantId,
        updates
      }, tenantId);
      
      socketService.sendToRole('MANAGER', 'bulk-table-status-updated', {
        tenantId,
        updates
      }, tenantId);
      
      socketService.sendToRole('STAFF', 'bulk-table-status-updated', {
        tenantId,
        updates
      }, tenantId);
      
      console.log(`📡 Broadcasted bulk table update: ${updates.length} tables updated`);
    } catch (error) {
      console.error('❌ Error broadcasting bulk table update:', error);
    }
  }

  /**
   * Send table capacity optimization alert
   */
  async broadcastCapacityAlert(tenantId: string, alert: {
    type: 'high_utilization' | 'low_utilization' | 'capacity_shortage';
    section: string;
    currentUtilization: number;
    recommendedCapacity: number;
    affectedTables: string[];
  }) {
    try {
      socketService.sendToRole('ADMIN', 'table-capacity-alert', {
        tenantId,
        ...alert
      }, tenantId);
      
      socketService.sendToRole('MANAGER', 'table-capacity-alert', {
        tenantId,
        ...alert
      }, tenantId);
      
      console.log(`📡 Broadcasted capacity alert: ${alert.type} for section ${alert.section}`);
    } catch (error) {
      console.error('❌ Error broadcasting capacity alert:', error);
    }
  }

  /**
   * Send table performance alert
   */
  async broadcastPerformanceAlert(tenantId: string, alert: {
    type: 'underperforming' | 'overperforming' | 'anomaly';
    tableId: string;
    tableNumber: string;
    metric: string;
    value: number;
    threshold: number;
    recommendation: string;
  }) {
    try {
      socketService.sendToRole('ADMIN', 'table-performance-alert', {
        tenantId,
        ...alert
      }, tenantId);
      
      socketService.sendToRole('MANAGER', 'table-performance-alert', {
        tenantId,
        ...alert
      }, tenantId);
      
      console.log(`📡 Broadcasted performance alert: ${alert.type} for table ${alert.tableNumber}`);
    } catch (error) {
      console.error('❌ Error broadcasting performance alert:', error);
    }
  }

  /**
   * Get real-time connection statistics
   */
  getConnectionStats() {
    return {
      onlineUsers: socketService.getOnlineUserCount(),
      cacheStats: tableCacheService.getCacheStats()
    };
  }
}

export const tableRealTimeService = new TableRealTimeService(); 