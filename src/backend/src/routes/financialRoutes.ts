import { Router } from 'express';
import { prisma } from '../services/dbService';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/financial/inventory-valuation - Get current inventory valuation
router.get('/inventory-valuation', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Get all active items with their inventory entries
    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        inventoryEntries: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    let totalValue = 0;
    const itemValuations = [];

    for (const item of items) {
      // Calculate current stock
      const totalIn = item.inventoryEntries
        .filter(entry => entry.type === 'IN')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const totalOut = item.inventoryEntries
        .filter(entry => entry.type === 'OUT')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const currentStock = totalIn - totalOut;

      if (currentStock > 0) {
        // Calculate weighted average cost
        const inEntries = item.inventoryEntries.filter(entry => 
          entry.type === 'IN' && entry.unitPrice !== null
        );

        if (inEntries.length > 0) {
          const totalQuantityWithPrice = inEntries.reduce((sum, entry) => sum + entry.quantity, 0);
          const totalValueWithPrice = inEntries.reduce((sum, entry) => 
            sum + (entry.quantity * (entry.unitPrice || 0)), 0
          );
          
          const averageUnitCost = totalValueWithPrice / totalQuantityWithPrice;
          const itemValue = currentStock * averageUnitCost;

          itemValuations.push({
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            unit: item.unit,
            currentStock,
            averageUnitCost: Math.round(averageUnitCost),
            totalValue: Math.round(itemValue)
          });

          totalValue += itemValue;
        } else {
          // Item has stock but no pricing information
          itemValuations.push({
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            unit: item.unit,
            currentStock,
            averageUnitCost: 0,
            totalValue: 0
          });
        }
      }
    }

    res.json({
      totalInventoryValue: Math.round(totalValue),
      itemCount: itemValuations.length,
      items: itemValuations.sort((a, b) => b.totalValue - a.totalValue)
    });
  } catch (error) {
    console.error('Error calculating inventory valuation:', error);
    res.status(500).json({ message: 'خطا در محاسبه ارزیابی موجودی' });
  }
});

// GET /api/financial/monthly-financial - Get monthly purchase and consumption values
router.get('/monthly-financial', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { months = '12' } = req.query;
    const data = [];

    for (let i = parseInt(months as string) - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Calculate purchases (IN transactions with prices)
      const purchases = await prisma.inventoryEntry.findMany({
        where: {
          type: 'IN',
          unitPrice: { not: null },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        select: {
          quantity: true,
          unitPrice: true
        }
      });

      const totalPurchases = purchases.reduce((sum, entry) => 
        sum + (entry.quantity * (entry.unitPrice || 0)), 0
      );

      // Calculate consumption value (OUT transactions using weighted average cost)
      const outTransactions = await prisma.inventoryEntry.findMany({
        where: {
          type: 'OUT',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        include: {
          item: {
            include: {
              inventoryEntries: {
                where: {
                  type: 'IN',
                  unitPrice: { not: null },
                  createdAt: { lte: endOfMonth }
                }
              }
            }
          }
        }
      });

      let totalConsumption = 0;
      for (const outEntry of outTransactions) {
        const inEntries = outEntry.item.inventoryEntries;
        if (inEntries.length > 0) {
          const totalQty = inEntries.reduce((sum, entry) => sum + entry.quantity, 0);
          const totalVal = inEntries.reduce((sum, entry) => 
            sum + (entry.quantity * (entry.unitPrice || 0)), 0
          );
          const avgCost = totalVal / totalQty;
          totalConsumption += outEntry.quantity * avgCost;
        }
      }

      data.push({
        month: date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' }),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        purchases: Math.round(totalPurchases),
        consumption: Math.round(totalConsumption),
        net: Math.round(totalPurchases - totalConsumption)
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly financial data:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های مالی ماهانه' });
  }
});

// GET /api/financial/financial-trends - Get financial trends over time
router.get('/financial-trends', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { period = '90' } = req.query; // default to last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Create weekly intervals for trends
    const intervals = 7;
    const data = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + intervals)) {
      const periodEnd = new Date(d);
      periodEnd.setDate(periodEnd.getDate() + intervals - 1);
      if (periodEnd > endDate) {
        periodEnd.setTime(endDate.getTime());
      }

      const periodStart = new Date(d);

      // Calculate purchases for this week
      const purchases = await prisma.inventoryEntry.aggregate({
        where: {
          type: 'IN',
          unitPrice: { not: null },
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        _sum: {
          quantity: true
        }
      });

      // Calculate average unit price for purchases
      const purchaseEntries = await prisma.inventoryEntry.findMany({
        where: {
          type: 'IN',
          unitPrice: { not: null },
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        select: {
          quantity: true,
          unitPrice: true
        }
      });

      const totalPurchaseValue = purchaseEntries.reduce((sum, entry) => 
        sum + (entry.quantity * (entry.unitPrice || 0)), 0
      );

      // Calculate total inventory value up to this point
      const allPurchasesUpToDate = await prisma.inventoryEntry.findMany({
        where: {
          type: 'IN',
          unitPrice: { not: null },
          createdAt: { lte: periodEnd }
        },
        select: {
          itemId: true,
          quantity: true,
          unitPrice: true
        }
      });

      // Get current stock for each item at this point in time
      const itemStocks: Record<string, number> = {};
      const allTransactionsUpToDate = await prisma.inventoryEntry.findMany({
        where: {
          createdAt: { lte: periodEnd }
        },
        select: {
          itemId: true,
          quantity: true,
          type: true
        }
      });

      for (const entry of allTransactionsUpToDate) {
        if (!itemStocks[entry.itemId]) {
          itemStocks[entry.itemId] = 0;
        }
        if (entry.type === 'IN') {
          itemStocks[entry.itemId] += entry.quantity;
        } else {
          itemStocks[entry.itemId] -= entry.quantity;
        }
      }

      // Calculate total inventory value
      let totalInventoryValue = 0;
      const itemValues: Record<string, { totalQty: number; totalVal: number }> = {};

      for (const purchase of allPurchasesUpToDate) {
        if (!itemValues[purchase.itemId]) {
          itemValues[purchase.itemId] = { totalQty: 0, totalVal: 0 };
        }
        itemValues[purchase.itemId].totalQty += purchase.quantity;
        itemValues[purchase.itemId].totalVal += purchase.quantity * (purchase.unitPrice || 0);
      }

      for (const [itemId, stock] of Object.entries(itemStocks)) {
        if (stock > 0 && itemValues[itemId]) {
          const avgCost = itemValues[itemId].totalVal / itemValues[itemId].totalQty;
          totalInventoryValue += stock * avgCost;
        }
      }

      data.push({
        date: periodEnd.toISOString().split('T')[0],
        weeklyPurchases: Math.round(totalPurchaseValue),
        totalInventoryValue: Math.round(totalInventoryValue),
        purchaseQuantity: purchases._sum.quantity || 0
      });

      if (periodEnd.getTime() >= endDate.getTime()) break;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching financial trends:', error);
    res.status(500).json({ message: 'خطا در دریافت داده‌های روند مالی' });
  }
});

// GET /api/financial/summary - Get financial summary
router.get('/summary', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month purchases
    const thisMonthPurchases = await prisma.inventoryEntry.findMany({
      where: {
        type: 'IN',
        unitPrice: { not: null },
        createdAt: { gte: thisMonthStart }
      },
      select: { quantity: true, unitPrice: true }
    });

    const thisMonthTotal = thisMonthPurchases.reduce((sum, entry) => 
      sum + (entry.quantity * (entry.unitPrice || 0)), 0
    );

    // Last month purchases
    const lastMonthPurchases = await prisma.inventoryEntry.findMany({
      where: {
        type: 'IN',
        unitPrice: { not: null },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      },
      select: { quantity: true, unitPrice: true }
    });

    const lastMonthTotal = lastMonthPurchases.reduce((sum, entry) => 
      sum + (entry.quantity * (entry.unitPrice || 0)), 0
    );

    // Calculate total inventory value (from analytics)
    const analyticsResponse = await fetch('http://localhost:3001/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${res.locals.token}` }
    });
    const analyticsData = await analyticsResponse.json();

    const changePercent = lastMonthTotal > 0 ? 
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    res.json({
      thisMonthPurchases: Math.round(thisMonthTotal),
      lastMonthPurchases: Math.round(lastMonthTotal),
      changePercent: Math.round(changePercent * 100) / 100,
      totalInventoryValue: analyticsData.totalInventoryValue || 0,
      purchaseTransactions: thisMonthPurchases.length
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'خطا در دریافت خلاصه مالی' });
  }
});

export default router;
