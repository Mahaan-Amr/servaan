import { prisma } from './dbService';
import { socketService } from './socketService';
import { 
  NotificationType, 
  NotificationPriority,
  InventoryEntryType
} from '../../../shared/generated/client';
import { 
  LowStockNotificationData,
  InventoryUpdateNotificationData,
  UserActivityNotificationData,
  StockDeficitNotificationData
} from '../../../shared/types';

class NotificationService {
  
  // Create and send a notification
  async createNotification(data: {
    userId?: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    data?: any;
    expiresAt?: Date;
    tenantId: string; // Added tenantId parameter
  }) {
    try {
      // Save to database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          priority: data.priority,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.parse(JSON.stringify(data.data)) : null,
          expiresAt: data.expiresAt,
          tenantId: data.tenantId // Added tenantId
        }
      });

      // Send real-time notification
      await socketService.sendNotification({
        userId: data.userId,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        data: data.data,
        tenantId: data.tenantId
      });

      console.log(`📢 Notification created: ${data.title} (${data.type})`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Check and send low stock notifications
  async checkLowStockNotifications(tenantId: string) { // Added tenantId parameter
    try {
      // Get current inventory status for items with minStock defined
      const lowStockItems = await prisma.$queryRaw<any[]>`
        SELECT 
          i.id as "itemId",
          i.name as "itemName",
          i.category,
          i.unit,
          i."minStock",
          COALESCE(inv.current_stock, 0) as "currentStock"
        FROM "Item" i
        LEFT JOIN (
          SELECT 
            "itemId",
            SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as current_stock
          FROM "InventoryEntry"
          GROUP BY "itemId"
        ) inv ON i.id = inv."itemId"
        WHERE i."isActive" = true 
        AND i."minStock" IS NOT NULL 
        AND COALESCE(inv.current_stock, 0) <= i."minStock"
        AND i."tenantId" = ${tenantId}
      `;

      // Create notifications for low stock items
      for (const item of lowStockItems) {
        const notificationData: LowStockNotificationData = {
          itemId: item.itemId,
          itemName: item.itemName,
          currentStock: parseFloat(item.currentStock) || 0,
          minStock: parseFloat(item.minStock) || 0,
          unit: item.unit
        };

        // Check if we've already sent a notification for this item recently (within 24 hours)
        const recentNotification = await prisma.notification.findFirst({
          where: {
            type: NotificationType.LOW_STOCK,
            data: {
              path: ['itemId'],
              equals: item.itemId
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            },
            tenantId // Added tenantId filter
          }
        });

        if (!recentNotification) {
          await this.createNotification({
            type: NotificationType.LOW_STOCK,
            priority: NotificationPriority.HIGH,
            title: 'هشدار موجودی کم',
            message: `موجودی ${item.itemName} به ${item.currentStock} ${item.unit} رسیده است`,
            data: notificationData,
            tenantId // Added tenantId
          });
        }
      }

      return lowStockItems;
    } catch (error) {
      console.error('Error checking low stock notifications:', error);
      throw error;
    }
  }

  // Send inventory update notification
  async sendInventoryUpdateNotification(data: {
    itemId: string;
    itemName: string;
    previousStock: number;
    newStock: number;
    changeAmount: number;
    type: any; // Using any to resolve type conflict between Prisma and shared types
    unit: string;
    userId: string;
    userName: string;
    tenantId: string; // Added tenantId parameter
  }) {
    try {
      const notificationData: InventoryUpdateNotificationData = {
        itemId: data.itemId,
        itemName: data.itemName,
        previousStock: data.previousStock,
        newStock: data.newStock,
        changeAmount: data.changeAmount,
        type: data.type,
        unit: data.unit,
        userId: data.userId,
        userName: data.userName
      };

      const message = data.type === 'IN' 
        ? `موجودی ${data.itemName} از ${data.previousStock} به ${data.newStock} ${data.unit} افزایش یافت`
        : `موجودی ${data.itemName} از ${data.previousStock} به ${data.newStock} ${data.unit} کاهش یافت`;

      await this.createNotification({
        userId: data.userId,
        type: NotificationType.INVENTORY_UPDATE,
        priority: NotificationPriority.MEDIUM,
        title: 'به‌روزرسانی موجودی',
        message,
        data: notificationData,
        tenantId: data.tenantId // Added tenantId
      });

      console.log(`📦 Inventory update notification sent: ${data.itemName}`);
    } catch (error) {
      console.error('Error sending inventory update notification:', error);
      throw error;
    }
  }

  // Send stock deficit notification
  async sendStockDeficitNotification(data: {
    itemId: string;
    itemName: string;
    previousStock: number;
    newStock: number;
    deficitAmount: number;
    unit: string;
    userId: string;
    userName: string;
    tenantId: string; // Added tenantId parameter
  }) {
    try {
      const notificationData: StockDeficitNotificationData = {
        itemId: data.itemId,
        itemName: data.itemName,
        previousStock: data.previousStock,
        newStock: data.newStock,
        deficitAmount: data.deficitAmount,
        unit: data.unit,
        userId: data.userId,
        userName: data.userName
      };

      await this.createNotification({
        userId: data.userId,
        type: NotificationType.STOCK_DEFICIT,
        priority: NotificationPriority.HIGH,
        title: 'هشدار کسری موجودی',
        message: `موجودی ${data.itemName} کافی نیست. کسری: ${data.deficitAmount} ${data.unit}`,
        data: notificationData,
        tenantId: data.tenantId // Added tenantId
      });

      console.log(`⚠️ Stock deficit notification sent: ${data.itemName}`);
    } catch (error) {
      console.error('Error sending stock deficit notification:', error);
      throw error;
    }
  }

  // Send user activity notification
  async sendUserActivityNotification(data: {
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    tenantId: string; // Added tenantId parameter
  }) {
    try {
      const notificationData: UserActivityNotificationData = {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName
      };

      await this.createNotification({
        userId: data.userId,
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.LOW,
        title: 'فعالیت کاربر',
        message: `${data.userName} ${data.action} ${data.entityType} ${data.entityName || ''}`.trim(),
        data: notificationData,
        tenantId: data.tenantId // Added tenantId
      });

      console.log(`👤 User activity notification sent: ${data.userName} - ${data.action}`);
    } catch (error) {
      console.error('Error sending user activity notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, tenantId: string, limit: number = 20, offset: number = 0) { // Added tenantId parameter
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          tenantId // Added tenantId filter
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string, tenantId: string) { // Added tenantId parameter
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          tenantId // Added tenantId filter
        },
        data: {
          read: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all user notifications as read
  async markAllAsRead(userId: string, tenantId: string) { // Added tenantId parameter
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
          tenantId // Added tenantId filter
        },
        data: {
          read: true
        }
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string, tenantId: string): Promise<number> { // Added tenantId parameter
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
          tenantId // Added tenantId filter
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Cleanup expired notifications
  async cleanupExpiredNotifications(tenantId: string) { // Added tenantId parameter
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          tenantId // Added tenantId filter
        }
      });

      console.log(`🧹 Cleaned up ${result.count} expired notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(tenantId: string, daysOld: number = 30) { // Added tenantId parameter
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          tenantId // Added tenantId filter
        }
      });

      console.log(`🧹 Cleaned up ${result.count} old notifications (older than ${daysOld} days)`);
      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService(); 