import { Router } from 'express';
import { prisma } from '../services/dbService';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/analytics/consumption-by-category - Get consumption by category for pie chart
router.get('/consumption-by-category', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const { period = '30' } = req.query; // default to last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get all OUT transactions in the period, grouped by category
    const consumption = await prisma.inventoryEntry.groupBy({
      by: ['itemId'],
      where: {
        item: {
          tenantId: req.tenant.id
        },
        type: 'OUT',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Get item details and group by category
    const categoryData: Record<string, { name: string; value: number; color: string }> = {};
    const colorPalette = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', 
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
    ];

    for (const item of consumption) {
      const itemDetails: { category: string } | null = await prisma.item.findFirst({
        where: { 
          id: item.itemId,
          tenantId: req.tenant.id
        },
        select: { category: true }
      });

      if (itemDetails) {
        const category = itemDetails.category;
        if (!categoryData[category]) {
          categoryData[category] = {
            name: category,
            value: 0,
            color: colorPalette[Object.keys(categoryData).length % colorPalette.length]
          };
        }
        categoryData[category].value += item._sum.quantity || 0;
      }
    }

    const chartData = Object.values(categoryData);
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching consumption by category:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های مصرف به تفکیک دسته‌بندی' });
  }
});

// GET /api/analytics/inventory-trends - Get inventory trends over time
router.get('/inventory-trends', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const { period = '90', itemId } = req.query; // default to last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Create date intervals (weekly for period > 30 days, daily otherwise)
    const intervals = parseInt(period as string) > 30 ? 7 : 1;
    const data = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + intervals)) {
      const periodEnd = new Date(d);
      periodEnd.setDate(periodEnd.getDate() + intervals - 1);
      if (periodEnd > endDate) break;

      const whereClause: any = {
        item: {
          tenantId: req.tenant.id
        },
        createdAt: {
          lte: periodEnd
        }
      };

      if (itemId) {
        whereClause.itemId = itemId as string;
      }

      // Calculate total IN and OUT up to this date
      const totalIn = await prisma.inventoryEntry.aggregate({
        where: {
          ...whereClause,
          type: 'IN'
        },
        _sum: { quantity: true }
      });

      const totalOut = await prisma.inventoryEntry.aggregate({
        where: {
          ...whereClause,
          type: 'OUT'
        },
        _sum: { quantity: true }
      });

      const currentStock = (totalIn._sum.quantity || 0) - (totalOut._sum.quantity || 0);

      data.push({
        date: periodEnd.toISOString().split('T')[0],
        stock: currentStock,
        totalIn: totalIn._sum.quantity || 0,
        totalOut: totalOut._sum.quantity || 0
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching inventory trends:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های روند موجودی' });
  }
});

// GET /api/analytics/monthly-movements - Get monthly IN/OUT movements
router.get('/monthly-movements', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const { months = '12' } = req.query; // default to last 12 months
    const data = [];

    for (let i = parseInt(months as string) - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const inMovements = await prisma.inventoryEntry.aggregate({
        where: {
          item: {
            tenantId: req.tenant.id
          },
          type: 'IN',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { quantity: true }
      });

      const outMovements = await prisma.inventoryEntry.aggregate({
        where: {
          item: {
            tenantId: req.tenant.id
          },
          type: 'OUT',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { quantity: true }
      });

      data.push({
        month: date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' }),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        in: inMovements._sum.quantity || 0,
        out: outMovements._sum.quantity || 0,
        net: (inMovements._sum.quantity || 0) - (outMovements._sum.quantity || 0)
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly movements:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های حرکت ماهانه' });
  }
});

// GET /api/analytics/summary - Get analytics summary data
router.get('/summary', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total items for this tenant
    const totalItems = await prisma.item.count({
      where: { 
        tenantId: req.tenant.id,
        isActive: true 
      }
    });

    // Low stock items for this tenant
    const lowStockItems = await prisma.item.findMany({
      where: { 
        tenantId: req.tenant.id,
        isActive: true 
      },
      include: {
        inventoryEntries: true
      }
    });

    let lowStockCount = 0;
    for (const item of lowStockItems) {
      const totalIn = item.inventoryEntries
        .filter(entry => entry.type === 'IN')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const totalOut = item.inventoryEntries
        .filter(entry => entry.type === 'OUT')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const current = totalIn - totalOut;
      if (current <= (item.minStock || 0)) {
        lowStockCount++;
      }
    }

    // Recent transactions (last 30 days) for this tenant
    const recentTransactions = await prisma.inventoryEntry.count({
      where: {
        item: {
          tenantId: req.tenant.id
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Total inventory value for this tenant
    const inventoryEntries = await prisma.inventoryEntry.findMany({
      where: {
        item: {
          tenantId: req.tenant.id
        },
        type: 'IN',
        unitPrice: { not: null }
      },
      select: {
        itemId: true,
        quantity: true,
        unitPrice: true
      }
    });

    let totalValue = 0;
    const itemValues: Record<string, { totalQuantity: number; totalValue: number }> = {};

    // Calculate weighted average cost per item
    for (const entry of inventoryEntries) {
      if (!itemValues[entry.itemId]) {
        itemValues[entry.itemId] = { totalQuantity: 0, totalValue: 0 };
      }
      itemValues[entry.itemId].totalQuantity += entry.quantity;
      itemValues[entry.itemId].totalValue += entry.quantity * (entry.unitPrice || 0);
    }

    // Calculate current stock value for each item
    for (const item of lowStockItems) {
      const totalIn = item.inventoryEntries
        .filter(entry => entry.type === 'IN')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const totalOut = item.inventoryEntries
        .filter(entry => entry.type === 'OUT')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const currentStock = totalIn - totalOut;
      
      if (currentStock > 0 && itemValues[item.id]) {
        const avgCost = itemValues[item.id].totalValue / itemValues[item.id].totalQuantity;
        totalValue += currentStock * avgCost;
      }
    }

    res.json({
      totalItems,
      lowStockCount,
      recentTransactions,
      totalInventoryValue: Math.round(totalValue)
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ message: 'خطا در دریافت خلاصه آمار' });
  }
});

// Get monthly analytics count
router.get('/monthly/count', authenticate, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const count = await prisma.inventoryEntry.count({
      where: {
        item: {
          tenantId: req.tenant.id  // Filter by tenant through item relation
        },
        createdAt: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth
        }
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting monthly analytics count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار ماهانه',
      error: (error as Error).message
    });
  }
});

export default router; 
