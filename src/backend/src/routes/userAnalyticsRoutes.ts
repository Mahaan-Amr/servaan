import { Router } from 'express';
import { prisma } from '../services/dbService';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/user-analytics/summary - Get user statistics summary
router.get('/summary', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total users
    const totalUsers = await prisma.user.count({
      where: { active: true }
    });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { active: true },
      _count: { role: true }
    });

    // Active users (logged in last 30 days)
    const activeUsers = await prisma.user.count({
      where: {
        active: true,
        lastLogin: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Users created this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: thisMonthStart }
      }
    });

    // Recent activity (inventory transactions last 30 days)
    const recentActivity = await prisma.inventoryEntry.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    res.json({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      recentActivity,
      roleDistribution: usersByRole.map(role => ({
        role: role.role,
        count: role._count.role
      }))
    });
  } catch (error) {
    console.error('Error fetching user analytics summary:', error);
    res.status(500).json({ message: 'خطا در دریافت خلاصه آمار کاربران' });
  }
});

// GET /api/user-analytics/activity-trends - Get user activity trends
router.get('/activity-trends', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { period = '30' } = req.query; // default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    const data = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      // Count daily activities (inventory transactions)
      const dailyTransactions = await prisma.inventoryEntry.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      // Count unique active users that day
      const activeUsersCount = await prisma.inventoryEntry.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      data.push({
        date: d.toISOString().split('T')[0],
        transactions: dailyTransactions,
        activeUsers: activeUsersCount.length
      });

      if (d.getTime() >= endDate.getTime()) break;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user activity trends:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های روند فعالیت کاربران' });
  }
});

// GET /api/user-analytics/user-performance - Get individual user performance
router.get('/user-performance', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { period = '30' } = req.query; // default to last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get user activity data
    const userActivity = await prisma.inventoryEntry.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      },
      _sum: {
        quantity: true
      }
    });

    // Get user details
    const usersWithActivity = await Promise.all(
      userActivity.map(async (activity) => {
        const user = await prisma.user.findUnique({
          where: { id: activity.userId },
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        });

        return {
          userId: activity.userId,
          userName: user?.name || 'نامشخص',
          userRole: user?.role || 'STAFF',
          userEmail: user?.email || '',
          totalTransactions: activity._count.id,
          totalQuantity: activity._sum.quantity || 0
        };
      })
    );

    // Sort by total transactions descending
    usersWithActivity.sort((a, b) => b.totalTransactions - a.totalTransactions);

    res.json(usersWithActivity);
  } catch (error) {
    console.error('Error fetching user performance data:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های عملکرد کاربران' });
  }
});

// GET /api/user-analytics/login-statistics - Get login statistics
router.get('/login-statistics', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { period = '30' } = req.query; // default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Since we don't track individual login events, we'll use lastLogin field
    // and estimate based on inventory activity as a proxy for "daily logins"
    
    const data = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      // Count unique users who were active (made transactions) that day
      const activeUsers = await prisma.inventoryEntry.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      data.push({
        date: d.toISOString().split('T')[0],
        estimatedLogins: activeUsers.length
      });

      if (d.getTime() >= endDate.getTime()) break;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching login statistics:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار ورود کاربران' });
  }
});

// GET /api/user-analytics/role-distribution - Get role distribution for pie chart
router.get('/role-distribution', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const roleData = await prisma.user.groupBy({
      by: ['role'],
      where: { active: true },
      _count: { role: true }
    });

    const colorPalette = {
      'ADMIN': '#ef4444',    // Red
      'MANAGER': '#f97316',  // Orange
      'STAFF': '#22c55e'     // Green
    };

    const roleLabels = {
      'ADMIN': 'مدیر سیستم',
      'MANAGER': 'مدیر',
      'STAFF': 'کارمند'
    };

    const chartData = roleData.map(role => ({
      name: roleLabels[role.role as keyof typeof roleLabels] || role.role,
      value: role._count.role,
      color: colorPalette[role.role as keyof typeof colorPalette] || '#6b7280'
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching role distribution:', error);
    res.status(500).json({ message: 'خطا در دریافت توزیع نقش‌های کاربری' });
  }
});

export default router; 