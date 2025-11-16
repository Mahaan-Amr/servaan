import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../services/dbService';

const router = express.Router();

// GET /api/workspace/user-access/:userId - Get user workspace access
router.get('/user-access/:userId', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const { userId } = req.params;

    // Verify user exists and belongs to the tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: req.tenant.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
        error: 'User not found in this tenant'
      });
    }

    // Build workspace access based on tenant features and user role
    const workspaceAccess = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      tenantId: req.tenant.id,
      workspaces: {
        // Inventory Management
        'inventory-management': {
          hasAccess: req.tenant.features?.hasInventoryManagement || false,
          level: user.role === 'ADMIN' ? 'full' : (user.role === 'MANAGER' ? 'full' : 'read-only')
        },
        // Business Intelligence 
        'business-intelligence': {
          hasAccess: req.tenant.features?.hasAnalyticsBI || false,
          level: user.role === 'ADMIN' ? 'full' : (user.role === 'MANAGER' ? 'full' : 'none')
        },
        // Accounting System
        'accounting-system': {
          hasAccess: req.tenant.features?.hasAccountingSystem || false,
          level: user.role === 'ADMIN' ? 'full' : (user.role === 'MANAGER' ? 'full' : 'none')
        },
        // Customer Relationship Management - DEACTIVATED (Maintenance)
        'customer-relationship-management': {
          hasAccess: false, // Deactivated - will be re-enabled in future
          level: 'none'
        },
        // SMS Management
        'sms-management': {
          hasAccess: req.tenant.features?.hasNotifications || false,
          level: user.role === 'ADMIN' ? 'full' : (user.role === 'MANAGER' ? 'full' : 'read-only')
        },
        // Public Relations - DEACTIVATED (Maintenance)
        'public-relations': {
          hasAccess: false, // Deactivated - will be re-enabled in future
          level: 'none'
        },
        // Ordering and Sales System
        'ordering-sales-system': {
          hasAccess: true, // Available for all tenants
          level: user.role === 'ADMIN' ? 'full' : (user.role === 'MANAGER' ? 'full' : 'read-only')
        }
      }
    };

    res.json({
      success: true,
      data: workspaceAccess
    });

  } catch (error) {
    console.error('Error getting user workspace access:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت دسترسی فضای کاری کاربر',
      error: (error as Error).message
    });
  }
});

// POST /api/workspace/user-access - Update user workspace access (admin only)
router.post('/user-access', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // Only admins can modify workspace access
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر سیستم می‌تواند دسترسی‌های فضای کاری را تغییر دهد',
        error: 'Admin access required'
      });
    }

    // This would be for future implementation of custom workspace permissions
    // For now, access is determined by tenant features and user roles
    
    res.json({
      success: true,
      message: 'دسترسی‌های فضای کاری بر اساس ویژگی‌های مجموعه و نقش کاربر تعیین می‌شود'
    });

  } catch (error) {
    console.error('Error updating user workspace access:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی دسترسی فضای کاری',
      error: (error as Error).message
    });
  }
});

export const workspaceRoutes = router; 
