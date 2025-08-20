import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, requireTenant, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await notificationService.getUserNotifications(userId, req.tenant!.id, limit, offset);
    
    res.json({ 
      notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'خطا در دریافت اعلان‌ها' });
  }
});

// Get unread notification count
router.get('/unread/count', authenticate, requireTenant, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const count = await notificationService.getUnreadCount(userId, req.tenant!.id);
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'خطا در دریافت تعداد اعلان‌های خوانده نشده' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, requireTenant, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const notificationId = req.params.id;

    const result = await notificationService.markAsRead(notificationId, userId, req.tenant!.id);
    
    res.json({ message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'خطا در علامت‌گذاری اعلان' });
  }
});

// Mark all notifications as read
router.patch('/read/all', authenticate, requireTenant, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const result = await notificationService.markAllAsRead(userId, req.tenant!.id);
    
    res.json({ message: 'تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'خطا در علامت‌گذاری تمام اعلان‌ها' });
  }
});

// Admin only: Check for low stock and send notifications
router.post('/check-low-stock', authenticate, requireTenant, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'دسترسی محدود' });
    }

    const lowStockItems = await notificationService.checkLowStockNotifications(req.tenant!.id);
    
    res.json({ 
      message: 'بررسی موجودی کم انجام شد',
      lowStockItems
    });
  } catch (error) {
    console.error('Error checking low stock:', error);
    res.status(500).json({ message: 'خطا در بررسی موجودی کم' });
  }
});

// Admin only: Cleanup expired notifications
router.delete('/cleanup/expired', authenticate, requireTenant, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی محدود' });
    }

    const result = await notificationService.cleanupExpiredNotifications(req.tenant!.id);
    
    res.json({ 
      message: 'پاکسازی اعلان‌های منقضی انجام شد',
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    res.status(500).json({ message: 'خطا در پاکسازی اعلان‌ها' });
  }
});

// Admin only: Cleanup old read notifications
router.delete('/cleanup/old', authenticate, requireTenant, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی محدود' });
    }

    const daysOld = parseInt(req.query.days as string) || 30;
    
    const result = await notificationService.cleanupOldNotifications(req.tenant!.id, daysOld);
    
    res.json({ 
      message: `پاکسازی اعلان‌های قدیمی (${daysOld} روز) انجام شد`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    res.status(500).json({ message: 'خطا در پاکسازی اعلان‌های قدیمی' });
  }
});

export { router as notificationRoutes }; 