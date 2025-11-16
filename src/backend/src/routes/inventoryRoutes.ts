import { Router } from 'express';
import { prisma } from '../services/dbService';
import { z } from 'zod';
import { InventoryEntryType } from '../../../shared/types';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { notificationService } from '../services/notificationService';
import { getStockDeficits, getDeficitSummary, adjustStock } from '../services/inventoryService';
import { InventoryController } from '../controllers/inventoryController';
import stockValidationRoutes from './stockValidationRoutes';

const router = Router();

// Validation schema for inventory entry
const inventoryEntrySchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  type: z.enum(['IN', 'OUT']),
  note: z.string().optional(),
  unitPrice: z.number().positive().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

// Validation schema for bulk inventory entries
const bulkInventoryEntrySchema = z.object({
  entries: z.array(inventoryEntrySchema).min(1, 'حداقل یک ورودی الزامی است')
});

// GET /api/inventory - Get all inventory entries
router.get('/', authenticate, requireTenant, async (req, res) => {
  try {

    const { page = '1', limit = '50', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Validate sort order
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    // Validate sort field
    const allowedSortFields = ['createdAt', 'updatedAt', 'quantity', 'type'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    
    const entries = await prisma.inventoryEntry.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted entries
        item: {
          tenantId: req.tenant!.id
        }
      },
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        [sortField]: order
      },
      skip,
      take: limitNum
    });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching inventory entries:', error);
    res.status(500).json({ message: 'خطا در دریافت تراکنش‌های انبار' });
  }
});

// GET /api/inventory/current - Get current inventory status
router.get('/current', authenticate, requireTenant, async (req, res) => {
  try {

    // Optimized approach: Single query with groupBy to calculate all inventory in one go
    const inventorySummary = await prisma.inventoryEntry.groupBy({
      by: ['itemId', 'type'],
      where: {
        deletedAt: null, // Exclude soft-deleted entries
        item: {
          tenantId: req.tenant!.id,
          deletedAt: null // Exclude soft-deleted items
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Get all items info for this tenant (excluding deleted)
    const items = await prisma.item.findMany({
      where: {
        tenantId: req.tenant!.id,
        deletedAt: null, // Exclude soft-deleted items
        isActive: true
      },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true
      }
    });

    // Create a map for quick lookup
    const itemMap = new Map(items.map(item => [item.id, item]));
    
    // Build inventory summary by item
    const inventoryMap = new Map<string, { totalIn: number, totalOut: number }>();
    
    inventorySummary.forEach(summary => {
      const itemId = summary.itemId;
      const quantity = summary._sum.quantity || 0;
      
      if (!inventoryMap.has(itemId)) {
        inventoryMap.set(itemId, { totalIn: 0, totalOut: 0 });
      }
      
      const itemInventory = inventoryMap.get(itemId)!;
      if (summary.type === 'IN') {
        itemInventory.totalIn = quantity;
      } else if (summary.type === 'OUT') {
        itemInventory.totalOut = quantity;
      }
    });

    // Build final result using single-source-of-truth for current stock
    const inventoryStatus = items.map(item => {
      const inventory = inventoryMap.get(item.id) || { totalIn: 0, totalOut: 0 };
      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
        totalIn: inventory.totalIn,
        totalOut: inventory.totalOut,
        // OUT totals are negative; current = totalIn + totalOut (sum of raw quantities)
        current: inventory.totalIn + inventory.totalOut
      };
    });
    
    res.json(inventoryStatus);
  } catch (error) {
    console.error('Error calculating inventory status:', error);
    res.status(500).json({ message: 'خطا در محاسبه وضعیت موجودی' });
  }
});

// GET /api/inventory/low-stock/count - Get count of items with low stock
router.get('/low-stock/count', authenticate, requireTenant, async (req, res) => {
  try {

    // Optimized approach: Single query with groupBy to calculate all inventory in one go
    const inventorySummary = await prisma.inventoryEntry.groupBy({
      by: ['itemId', 'type'],
      where: {
        item: {
          tenantId: req.tenant!.id  // Filter by tenant
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Get all items info for this tenant
    const items = await prisma.item.findMany({
      where: {
        tenantId: req.tenant!.id,
        isActive: true
      },
      select: {
        id: true,
        minStock: true
      }
    });

    // Build inventory summary by item
    const inventoryMap = new Map<string, { totalIn: number, totalOut: number }>();
    
    inventorySummary.forEach(summary => {
      const itemId = summary.itemId;
      const quantity = summary._sum.quantity || 0;
      
      if (!inventoryMap.has(itemId)) {
        inventoryMap.set(itemId, { totalIn: 0, totalOut: 0 });
      }
      
      const itemInventory = inventoryMap.get(itemId)!;
      if (summary.type === 'IN') {
        itemInventory.totalIn = quantity;
      } else if (summary.type === 'OUT') {
        itemInventory.totalOut = quantity;
      }
    });

    // Count items below their minStock threshold using current = totalIn + totalOut
    const lowStockCount = items.filter(item => {
      const inventory = inventoryMap.get(item.id) || { totalIn: 0, totalOut: 0 };
      const current = inventory.totalIn + inventory.totalOut;
      const threshold = item.minStock || 10;
      return current < threshold;
    }).length;
    
    res.json({ success: true, data: { count: lowStockCount } });
  } catch (error) {
    console.error('Error getting low stock count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد اقلام کم موجود',
      error: (error as Error).message
    });
  }
});

// GET /api/inventory/low-stock - Get items with low stock
router.get('/low-stock', authenticate, requireTenant, async (req, res) => {
  try {
    // Optimized approach: Single query with groupBy to calculate all inventory in one go
    const inventorySummary = await prisma.inventoryEntry.groupBy({
      by: ['itemId', 'type'],
      where: {
        item: {
          tenantId: req.tenant!.id
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Get all items info for this tenant
    const items = await prisma.item.findMany({
      where: {
        tenantId: req.tenant!.id
      },
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        minStock: true
      }
    });

    // Build inventory summary by item
    const inventoryMap = new Map<string, { totalIn: number, totalOut: number }>();
    
    inventorySummary.forEach(summary => {
      const itemId = summary.itemId;
      const quantity = summary._sum.quantity || 0;
      
      if (!inventoryMap.has(itemId)) {
        inventoryMap.set(itemId, { totalIn: 0, totalOut: 0 });
      }
      
      const itemInventory = inventoryMap.get(itemId)!;
      if (summary.type === 'IN') {
        itemInventory.totalIn = quantity;
      } else if (summary.type === 'OUT') {
        itemInventory.totalOut = quantity;
      }
    });

    // Build inventory status and filter low stock items using current = totalIn + totalOut
    const lowStockItems = items
      .map(item => {
        const inventory = inventoryMap.get(item.id) || { totalIn: 0, totalOut: 0 };
        const current = inventory.totalIn + inventory.totalOut;
        return {
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          unit: item.unit,
          current,
          minStock: item.minStock
        };
      })
      .filter(item => {
        // Filter items below their minStock threshold or below default threshold of 10
        const threshold = item.minStock || 10;
        return item.current < threshold;
      });
    
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'خطا در دریافت اقلام کم موجود' });
  }
});

// GET /api/inventory/report - Generate inventory movement report
router.get('/report', authenticate, requireTenant, async (req, res) => {
  try {
    const { startDate, endDate, itemId, type } = req.query;
    
    // Build filter with tenant filtering
    const filter: any = {
      item: {
        tenantId: req.tenant!.id
      }
    };
    
    if (startDate && endDate) {
      filter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.createdAt = {
        gte: new Date(startDate as string)
      };
    } else if (endDate) {
      filter.createdAt = {
        lte: new Date(endDate as string)
      };
    }
    
    if (itemId) {
      filter.itemId = itemId as string;
    }
    
    if (type && (type === 'IN' || type === 'OUT')) {
      filter.type = type;
    }
    
    // Get entries based on filter (exclude soft-deleted)
    filter.deletedAt = null;
    const entries = await prisma.inventoryEntry.findMany({
      where: filter,
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Calculate summary
    const summary = {
      totalEntries: entries.length,
      totalIn: entries.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0),
      totalOut: entries.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0),
      itemSummary: {} as Record<string, { name: string, totalIn: number, totalOut: number, net: number }>
    };
    
    // Calculate per-item summary
    entries.forEach(entry => {
      const itemId = entry.itemId;
      const itemName = entry.item.name;
      
      if (!summary.itemSummary[itemId]) {
        summary.itemSummary[itemId] = {
          name: itemName,
          totalIn: 0,
          totalOut: 0,
          net: 0
        };
      }
      
      if (entry.type === 'IN') {
        summary.itemSummary[itemId].totalIn += entry.quantity;
      } else {
        summary.itemSummary[itemId].totalOut += entry.quantity;
      }
      
      summary.itemSummary[itemId].net = summary.itemSummary[itemId].totalIn - summary.itemSummary[itemId].totalOut;
    });
    
    res.json({
      entries,
      summary
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'خطا در تولید گزارش انبار' });
  }
});

// ==================== INVENTORY PRICE INTEGRATION ROUTES ====================

// GET /api/inventory/price-consistency - Validate price consistency
router.get('/price-consistency', authenticate, requireTenant, InventoryController.validatePriceConsistency);

// GET /api/inventory/price-statistics - Get price statistics
router.get('/price-statistics', authenticate, requireTenant, InventoryController.getPriceStatistics);

// GET /api/inventory/items/:id/price - Get inventory price for an item
router.get('/items/:id/price', authenticate, requireTenant, InventoryController.getItemPrice);

// GET /api/inventory/total-quantity - Get total inventory quantity
router.get('/total-quantity', authenticate, requireTenant, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    // Calculate total inventory quantity by summing all IN entries and subtracting OUT entries
    const inventorySummary = await prisma.inventoryEntry.groupBy({
      by: ['itemId', 'type'],
      where: {
        item: {
          tenantId: req.tenant.id
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Calculate total quantity for each item
    const itemQuantities = new Map<string, number>();
    
    inventorySummary.forEach(entry => {
      const currentQuantity = itemQuantities.get(entry.itemId) || 0;
      if (entry.type === 'IN') {
        itemQuantities.set(entry.itemId, currentQuantity + (entry._sum.quantity || 0));
      } else {
        itemQuantities.set(entry.itemId, currentQuantity - (entry._sum.quantity || 0));
      }
    });

    // Sum all positive quantities (negative quantities mean deficit)
    const totalQuantity = Array.from(itemQuantities.values())
      .filter(quantity => quantity > 0)
      .reduce((sum, quantity) => sum + quantity, 0);

    res.json({ 
      success: true, 
      data: { 
        totalQuantity,
        itemCount: itemQuantities.size
      } 
    });
  } catch (error) {
    console.error('Error getting total inventory quantity:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کل موجودی',
      error: (error as Error).message
    });
  }
});

// GET /api/inventory/total-value - Get total inventory value
router.get('/total-value', authenticate, requireTenant, async (req, res) => {
  try {
    // Get all items for this tenant with all their inventory entries
    const items = await prisma.item.findMany({
      where: {
        tenantId: req.tenant!.id,
        isActive: true
      },
      include: {
        inventoryEntries: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    let totalValue = 0;
    const itemValues: Array<{
      itemId: string;
      itemName: string;
      currentStock: number;
      averageCost: number;
      totalValue: number;
    }> = [];

    for (const item of items) {
      // Calculate current stock from all inventory entries
      const totalIn = item.inventoryEntries
        .filter(entry => entry.type === 'IN')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const totalOut = item.inventoryEntries
        .filter(entry => entry.type === 'OUT')
        .reduce((sum, entry) => sum + entry.quantity, 0);
      
      const currentStock = totalIn - totalOut;

      if (currentStock > 0) {
        // Calculate weighted average cost from IN entries with prices
        const inEntriesWithPrice = item.inventoryEntries.filter(entry => 
          entry.type === 'IN' && entry.unitPrice !== null && entry.unitPrice > 0
        );

        if (inEntriesWithPrice.length > 0) {
          const totalQuantityWithPrice = inEntriesWithPrice.reduce((sum, entry) => sum + entry.quantity, 0);
          const totalValueWithPrice = inEntriesWithPrice.reduce((sum, entry) => 
            sum + (entry.quantity * (entry.unitPrice || 0)), 0
          );
          
          const averageUnitCost = totalValueWithPrice / totalQuantityWithPrice;
          const itemValue = currentStock * averageUnitCost;

          itemValues.push({
            itemId: item.id,
            itemName: item.name,
            currentStock,
            averageCost: Math.round(averageUnitCost),
            totalValue: Math.round(itemValue)
          });

          totalValue += itemValue;
        } else {
          // Item has stock but no pricing information
          itemValues.push({
            itemId: item.id,
            itemName: item.name,
            currentStock,
            averageCost: 0,
            totalValue: 0
          });
        }
      }
    }

    res.json({ 
      success: true, 
      data: { 
        totalValue: Math.round(totalValue),
        itemCount: itemValues.length,
        items: itemValues.sort((a, b) => b.totalValue - a.totalValue)
      } 
    });
  } catch (error) {
    console.error('Error getting total inventory value:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کل ارزش موجودی',
      error: (error as Error).message
    });
  }
});

// ===================== ORDER-INVENTORY INTEGRATION ROUTES =====================
// 
// NOTE: These routes must be defined BEFORE the /:id route to prevent route conflicts
// Get low stock alerts for recipe ingredients
router.get('/low-stock-alerts', authenticate, requireTenant, async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    
    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const alerts = await OrderInventoryIntegrationService.getRecipeIngredientLowStockAlerts(tenantId);
    
    res.json({
      success: true,
      data: alerts,
      message: 'Low stock alerts retrieved'
    });
  } catch (error) {
    next(error);
  }
});

// Get comprehensive inventory integration status
router.get('/integration-status', authenticate, requireTenant, async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    
    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const status = await OrderInventoryIntegrationService.getInventoryIntegrationStatus(tenantId);
    
    res.json({
      success: true,
      data: status,
      message: 'Inventory integration status retrieved'
    });
  } catch (error) {
    next(error);
  }
});

// Validation schema for stock adjustment
const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid('شناسه کالا نامعتبر است'),
  newQuantity: z.number().min(0, 'مقدار موجودی نمی‌تواند منفی باشد'),
  reason: z.string().min(1, 'دلیل تعدیل موجودی الزامی است')
});

// POST /api/inventory/adjust - Adjust stock to a specific quantity
router.post('/adjust', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Validate request body
    const validatedData = stockAdjustmentSchema.parse(req.body);
    
    // Get the user ID from the authenticated user
    if (!req.user) {
      return res.status(401).json({ message: 'کاربر احراز هویت نشده است' });
    }
    const userId = req.user.id;
    const tenantId = req.tenant!.id;

    // Verify item exists and belongs to tenant
    const item = await prisma.item.findFirst({
      where: {
        id: validatedData.itemId,
        tenantId: tenantId,
        isActive: true
      },
      select: { id: true, name: true, unit: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'کالا یافت نشد یا غیرفعال است' });
    }

    // Adjust stock using the service function
    const adjustment = await adjustStock(
      validatedData.itemId,
      validatedData.newQuantity,
      validatedData.reason,
      userId,
      tenantId
    );

    // Send inventory update notification (non-blocking)
    setImmediate(async () => {
      try {
        const stockAgg = await prisma.inventoryEntry.aggregate({
          where: {
            itemId: validatedData.itemId
          },
          _sum: {
            quantity: true
          }
        });
        const newCurrentStock = stockAgg._sum.quantity || 0;
        const previousStock = newCurrentStock - adjustment.quantity;

        // Get user info for notification
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        await notificationService.sendInventoryUpdateNotification({
          itemId: validatedData.itemId,
          itemName: item.name,
          previousStock,
          newStock: newCurrentStock,
          changeAmount: adjustment.quantity,
          type: adjustment.type,
          unit: item.unit,
          userId,
          userName: user?.name || 'کاربر',
          tenantId
        });
      } catch (notifError) {
        console.error('Error sending inventory update notification:', notifError);
      }
    });

    res.json({
      success: true,
      message: 'تعدیل موجودی با موفقیت انجام شد',
      adjustment: adjustment
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: error.errors
      });
    }
    
    if (error instanceof Error && error.message.includes('موجودی فعلی برابر')) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error adjusting stock:', error);
    res.status(500).json({ message: 'خطا در تعدیل موجودی' });
  }
});

// POST /api/inventory/reset/:itemId - Reset stock to zero
router.post('/reset/:itemId', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Get the user ID from the authenticated user
    if (!req.user) {
      return res.status(401).json({ message: 'کاربر احراز هویت نشده است' });
    }
    const userId = req.user.id;
    const tenantId = req.tenant!.id;

    // Verify item exists and belongs to tenant
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        tenantId: tenantId,
        isActive: true
      },
      select: { id: true, name: true, unit: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'کالا یافت نشد یا غیرفعال است' });
    }

    // Reset stock to zero using the service function
    const adjustment = await adjustStock(
      itemId,
      0,
      'بازنشانی موجودی به صفر',
      userId,
      tenantId
    );

    // Send inventory update notification (non-blocking)
    setImmediate(async () => {
      try {
        const stockAgg = await prisma.inventoryEntry.aggregate({
          where: {
            itemId: itemId
          },
          _sum: {
            quantity: true
          }
        });
        const newCurrentStock = stockAgg._sum.quantity || 0;
        const previousStock = newCurrentStock - adjustment.quantity;

        // Get user info for notification
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        await notificationService.sendInventoryUpdateNotification({
          itemId: itemId,
          itemName: item.name,
          previousStock,
          newStock: newCurrentStock,
          changeAmount: adjustment.quantity,
          type: adjustment.type,
          unit: item.unit,
          userId,
          userName: user?.name || 'کاربر',
          tenantId
        });
      } catch (notifError) {
        console.error('Error sending inventory update notification:', notifError);
      }
    });

    res.json({
      success: true,
      message: 'موجودی کالا با موفقیت به صفر بازنشانی شد',
      adjustment: adjustment
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('موجودی فعلی برابر')) {
      return res.status(400).json({ message: 'موجودی این کالا در حال حاضر صفر است' });
    }

    console.error('Error resetting stock:', error);
    res.status(500).json({ message: 'خطا در بازنشانی موجودی' });
  }
});

// GET /api/inventory/settings - Get inventory settings
// IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
router.get('/settings', authenticate, requireTenant, async (req, res) => {
  try {
    const tenantId = req.tenant!.id;
    
    // Get or create default settings
    const settings = await prisma.inventorySettings.upsert({
      where: { tenantId },
      update: {},
      create: {
        tenantId,
        allowNegativeStock: true // Default: allow negative stock
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching inventory settings:', error);
    res.status(500).json({ message: 'خطا در دریافت تنظیمات موجودی' });
  }
});

// PUT /api/inventory/settings - Update inventory settings
// IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
router.put('/settings', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const tenantId = req.tenant!.id;
    const { allowNegativeStock } = req.body;
    
    // Validate input
    if (typeof allowNegativeStock !== 'boolean') {
      return res.status(400).json({ message: 'مقدار allowNegativeStock باید boolean باشد' });
    }
    
    // Update or create settings
    const settings = await prisma.inventorySettings.upsert({
      where: { tenantId },
      update: {
        allowNegativeStock
      },
      create: {
        tenantId,
        allowNegativeStock
      }
    });
    
    res.json({
      message: 'تنظیمات موجودی با موفقیت بروزرسانی شد',
      settings
    });
  } catch (error) {
    console.error('Error updating inventory settings:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی تنظیمات موجودی' });
  }
});

// GET /api/inventory/:id - Get an inventory entry by ID
// NOTE: This parameterized route must be defined AFTER all specific routes
router.get('/:id', authenticate, requireTenant, async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'نیاز به شناسایی مجموعه',
        error: 'Tenant context required'
      });
    }

    const { id } = req.params;
    
    const entry = await prisma.inventoryEntry.findFirst({
      where: { 
        id,
        deletedAt: null, // Exclude soft-deleted entries
        item: {
          tenantId: req.tenant!.id,
          deletedAt: null // Exclude soft-deleted items
        }
      },
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'تراکنش موجودی یافت نشد' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error fetching inventory entry:', error);
    res.status(500).json({ message: 'خطا در دریافت تراکنش انبار' });
  }
});

// POST /api/inventory - Create a new inventory entry
router.post('/', authenticate, requireTenant, async (req, res) => {
  try {
    // Validate request body
    const validatedData = inventoryEntrySchema.parse(req.body);
    
    // Get the user ID from the authenticated user
    if (!req.user) {
      return res.status(401).json({ message: 'کاربر احراز هویت نشده است' });
    }
    const userId = req.user.id;

    // Get inventory settings
    const inventorySettings = await prisma.inventorySettings.findUnique({
      where: { tenantId: req.tenant!.id }
    });
    const allowNegativeStock = inventorySettings?.allowNegativeStock ?? true; // Default: allow

    // IMPORTANT: For OUT entries, store quantity as NEGATIVE so calculateCurrentStock works correctly
    const entryQuantity = validatedData.type === 'OUT' 
      ? -validatedData.quantity 
      : validatedData.quantity;

    // Use database transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // For inventory out, check stock availability based on settings
      if (validatedData.type === 'OUT') {
        // Lock the item row to prevent race conditions
        const item = await tx.item.findUniqueOrThrow({
          where: { id: validatedData.itemId },
          select: { id: true, name: true, unit: true }
        });

        // Calculate current inventory atomically within transaction using optimized query
        const inventorySummary = await tx.inventoryEntry.groupBy({
          by: ['type'],
          where: {
            itemId: validatedData.itemId
          },
          _sum: {
            quantity: true
          }
        });

        let totalIn = 0;
        let totalOut = 0;
        
        inventorySummary.forEach(summary => {
          if (summary.type === 'IN') {
            totalIn = summary._sum.quantity || 0;
          } else if (summary.type === 'OUT') {
            totalOut = summary._sum.quantity || 0;
          }
        });
        const current = totalIn - totalOut;
        
        // Check if transaction would result in negative stock
        const willBeNegative = current < validatedData.quantity;
        
        if (willBeNegative) {
          if (!allowNegativeStock) {
            // Block transaction if negative stock is not allowed
            throw new Error(JSON.stringify({
              type: 'INSUFFICIENT_STOCK',
              message: `موجودی کافی نیست. موجودی فعلی: ${current} ${item.unit}`,
              itemId: item.id,
              itemName: item.name,
              currentStock: current,
              requestedQuantity: validatedData.quantity,
              unit: item.unit
            }));
          } else {
            // Log the deficit but allow the transaction
            console.log(`⚠️ Stock deficit detected: ${item.name} will go from ${current} to ${current - validatedData.quantity}`);
          }
        }
      }

      // Create inventory entry within transaction
      const newEntry = await tx.inventoryEntry.create({
        data: {
          ...validatedData,
          quantity: entryQuantity, // Use negated quantity for OUT entries
          expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : undefined,
          userId,
          tenantId: req.tenant!.id
        },
        include: {
          item: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return newEntry;
    }, {
      isolationLevel: 'Serializable'
    });

    // Ensure result has the proper structure for notifications
    if (!result || !result.item || !result.user) {
      console.error('Transaction result missing required relations:', result);
      return res.status(500).json({ message: 'خطا در ایجاد تراکنش انبار' });
    }

    // Calculate final stock using single-source-of-truth rule:
    // OUT entries are stored as negative → current stock = SUM(quantity)
    const stockAgg = await prisma.inventoryEntry.aggregate({
      where: {
        itemId: validatedData.itemId,
        deletedAt: null // Exclude soft-deleted entries
      },
      _sum: {
        quantity: true
      }
    });
    const newCurrentStock = stockAgg._sum.quantity || 0;
    // Previous stock: subtract the change we just made
    // For IN: we added positive, so subtract positive
    // For OUT: we added negative, so subtract negative (which is adding)
    const previousStock = newCurrentStock - entryQuantity;

    // Send inventory update notification (non-blocking)
    setImmediate(async () => {
      try {
        await notificationService.sendInventoryUpdateNotification({
          itemId: validatedData.itemId,
          itemName: result.item.name,
          previousStock,
          newStock: newCurrentStock,
          changeAmount: Math.abs(entryQuantity), // Use absolute value for display
          type: validatedData.type,
          unit: result.item.unit,
          userId,
          userName: result.user.name,
          tenantId: req.tenant!.id
        });
      } catch (notificationError) {
        console.error('Error sending inventory notification:', notificationError);
        // Log but don't affect main transaction
      }
    });
    
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    
    // Handle insufficient stock error
    if (error instanceof Error && error.message.startsWith('{"type":"INSUFFICIENT_STOCK"')) {
      const errorData = JSON.parse(error.message);
      return res.status(400).json(errorData);
    }
    
    console.error('Error creating inventory entry:', error);
    res.status(500).json({ message: 'خطا در ثبت تراکنش انبار' });
  }
});

// POST /api/inventory/bulk - Create multiple inventory entries in a single transaction
router.post('/bulk', authenticate, requireTenant, async (req, res) => {
  try {
    // Validate request body
    const validatedData = bulkInventoryEntrySchema.parse(req.body);
    
    // Get the user ID from the authenticated user
    if (!req.user) {
      return res.status(401).json({ message: 'کاربر احراز هویت نشده است' });
    }
    const userId = req.user.id;
    const tenantId = req.tenant!.id;

    // Ensure all entries are IN type for bulk entry
    const invalidEntries = validatedData.entries.filter(entry => entry.type !== 'IN');
    if (invalidEntries.length > 0) {
      return res.status(400).json({ 
        message: 'ورود گروهی فقط برای تراکنش‌های ورودی (IN) مجاز است',
        error: 'Bulk entry only allowed for IN transactions'
      });
    }

    // Process all entries in a single transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdEntries = [];
      const errors = [];

      for (let i = 0; i < validatedData.entries.length; i++) {
        const entryData = validatedData.entries[i];
        
        try {
          // Verify item exists and belongs to tenant
          const item = await tx.item.findFirst({
            where: {
              id: entryData.itemId,
              tenantId: tenantId,
              isActive: true
            },
            select: { id: true, name: true, unit: true }
          });

          if (!item) {
            errors.push({
              index: i,
              itemId: entryData.itemId,
              error: 'کالا یافت نشد یا غیرفعال است'
            });
            continue;
          }

          // Create inventory entry
          const newEntry = await tx.inventoryEntry.create({
            data: {
              ...entryData,
              expiryDate: entryData.expiryDate ? new Date(entryData.expiryDate) : undefined,
              userId,
              tenantId
            },
            include: {
              item: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          });

          createdEntries.push(newEntry);
        } catch (error) {
          errors.push({
            index: i,
            itemId: entryData.itemId,
            error: error instanceof Error ? error.message : 'خطای نامشخص'
          });
        }
      }

      return { createdEntries, errors };
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000 // 30 seconds timeout for bulk operations
    });

    // Send notifications for successfully created entries (non-blocking)
    if (results.createdEntries.length > 0) {
      setImmediate(async () => {
        for (const entry of results.createdEntries) {
          try {
            // Calculate stock for notification
            const stockAgg = await prisma.inventoryEntry.aggregate({
              where: {
                itemId: entry.itemId
              },
              _sum: {
                quantity: true
              }
            });
            const newCurrentStock = stockAgg._sum.quantity || 0;
            const previousStock = newCurrentStock - entry.quantity;

            await notificationService.sendInventoryUpdateNotification({
              itemId: entry.itemId,
              itemName: entry.item.name,
              previousStock,
              newStock: newCurrentStock,
              changeAmount: entry.quantity,
              type: entry.type,
              unit: entry.item.unit,
              userId,
              userName: entry.user.name,
              tenantId
            });
          } catch (notificationError) {
            console.error('Error sending inventory notification for bulk entry:', notificationError);
            // Log but don't affect main transaction
          }
        }
      });
    }

    // Return results
    if (results.errors.length > 0 && results.createdEntries.length === 0) {
      // All failed
      return res.status(400).json({
        success: false,
        message: 'هیچ تراکنشی ثبت نشد',
        errors: results.errors,
        created: []
      });
    } else if (results.errors.length > 0) {
      // Partial success
      return res.status(207).json({
        success: true,
        message: `${results.createdEntries.length} تراکنش با موفقیت ثبت شد، ${results.errors.length} تراکنش ناموفق بود`,
        created: results.createdEntries,
        errors: results.errors
      });
    } else {
      // All successful
      return res.status(201).json({
        success: true,
        message: `${results.createdEntries.length} تراکنش با موفقیت ثبت شد`,
        created: results.createdEntries,
        errors: []
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'اطلاعات نامعتبر', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating bulk inventory entries:', error);
    res.status(500).json({ 
      message: 'خطا در ثبت تراکنش‌های انبار',
      error: error instanceof Error ? error.message : 'خطای نامشخص'
    });
  }
});

// PUT /api/inventory/:id - Update an inventory entry
router.put('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists and is not deleted
    const existingEntry = await prisma.inventoryEntry.findFirst({
      where: { 
        id,
        deletedAt: null // Only find non-deleted entries
      }
    });
    
    if (!existingEntry) {
      return res.status(404).json({ message: 'تراکنش انبار یافت نشد یا قبلاً حذف شده است' });
    }
    
    // Validate request body
    const validatedData = inventoryEntrySchema.parse(req.body);
    
    // Get inventory settings
    const inventorySettings = await prisma.inventorySettings.findUnique({
      where: { tenantId: req.tenant!.id }
    });
    const allowNegativeStock = inventorySettings?.allowNegativeStock ?? true; // Default: allow
    
    // If changing type or quantity, need to check inventory constraints
    if (existingEntry.type !== validatedData.type || existingEntry.quantity !== validatedData.quantity) {
      // Use database transaction to ensure data consistency for updates
      const stockCheckResult = await prisma.$transaction(async (tx) => {
        // Calculate what the inventory would be after reversing the old entry using optimized query
        const inventorySummary = await tx.inventoryEntry.groupBy({
          by: ['type'],
          where: {
            itemId: validatedData.itemId
          },
          _sum: {
            quantity: true
          }
        });

        let totalIn = 0;
        let totalOut = 0;
        
        inventorySummary.forEach(summary => {
          if (summary.type === 'IN') {
            totalIn = summary._sum.quantity || 0;
          } else if (summary.type === 'OUT') {
            totalOut = summary._sum.quantity || 0;
          }
        });
        
        // Calculate current stock without the entry being updated
        // Note: OUT entries are stored as negative, so totalOut is already negative
        // So current = totalIn + totalOut (where totalOut is negative)
        let adjustedTotalIn = totalIn;
        let adjustedTotalOut = totalOut;
        
        // Remove the old entry's effect
        // existingEntry.quantity is already negative for OUT, positive for IN
        if (existingEntry.type === 'IN') {
          adjustedTotalIn -= existingEntry.quantity; // existingEntry.quantity is positive
        } else {
          // For OUT, existingEntry.quantity is negative, so subtracting it adds to totalOut
          adjustedTotalOut -= existingEntry.quantity; // This effectively adds (since quantity is negative)
        }
        
        // Calculate what stock would be after applying the new values
        // For OUT entries, we'll store negative, so we need to account for that
        const newEntryQuantity = validatedData.type === 'OUT' 
          ? -validatedData.quantity 
          : validatedData.quantity;
        
        if (validatedData.type === 'IN') {
          adjustedTotalIn += newEntryQuantity; // newEntryQuantity is positive
        } else {
          // For OUT, newEntryQuantity is negative, so adding it subtracts from totalOut
          adjustedTotalOut += newEntryQuantity; // This effectively subtracts (since quantity is negative)
        }
        
        // Since OUT entries are stored as negative, current = totalIn + totalOut
        const finalStock = adjustedTotalIn + adjustedTotalOut;
        
        // Check if update would result in negative stock
        const willBeNegative = finalStock < 0;
        if (willBeNegative && !allowNegativeStock) {
          // Block update if negative stock is not allowed
          throw new Error(JSON.stringify({
            type: 'INSUFFICIENT_STOCK',
            message: `به‌روزرسانی باعث موجودی منفی می‌شود. موجودی نهایی: ${finalStock}`,
            finalStock
          }));
        } else if (willBeNegative) {
          // Log the deficit but allow the update
          console.log(`⚠️ Stock deficit detected in update: Item will go to ${finalStock}`);
        }
        
        return { success: true };
      });
    }
    
    // Update inventory entry
    // IMPORTANT: For OUT entries, store quantity as NEGATIVE so calculateCurrentStock works correctly
    const entryQuantity = validatedData.type === 'OUT' 
      ? -validatedData.quantity 
      : validatedData.quantity;
    
    const updatedEntry = await prisma.inventoryEntry.update({
      where: { id },
      data: {
        ...validatedData,
        quantity: entryQuantity, // Use negated quantity for OUT entries
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : undefined,
      },
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    res.json(updatedEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'اطلاعات نامعتبر', errors: error.errors });
    }
    
    // Handle insufficient stock error
    if (error instanceof Error && error.message.startsWith('{"type":"INSUFFICIENT_STOCK"')) {
      const errorData = JSON.parse(error.message);
      return res.status(400).json(errorData);
    }
    
    console.error('Error updating inventory entry:', error);
    res.status(500).json({ message: 'خطا در به‌روزرسانی تراکنش انبار' });
  }
});

// DELETE /api/inventory/:id - Delete an inventory entry (soft delete)
router.delete('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Check if entry exists and is not already deleted
    const existingEntry = await prisma.inventoryEntry.findFirst({
      where: { 
        id,
        deletedAt: null // Only find non-deleted entries
      }
    });
    
    if (!existingEntry) {
      return res.status(404).json({ message: 'تراکنش انبار یافت نشد یا قبلاً حذف شده است' });
    }
    
    // Soft delete inventory entry
    await prisma.inventoryEntry.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
    
    res.json({ message: 'تراکنش انبار با موفقیت حذف شد (حذف نرم)' });
  } catch (error) {
    console.error('Error deleting inventory entry:', error);
    res.status(500).json({ message: 'خطا در حذف تراکنش انبار' });
  }
});

// PATCH /api/inventory/:itemId/barcode - Update item barcode
router.patch('/:itemId/barcode', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        error: 'بارکد الزامی است',
      });
    }

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({
        error: 'محصول یافت نشد',
      });
    }

    // Update item barcode
    await prisma.item.update({
      where: { id: itemId },
      data: { barcode },
    });

    res.json({ message: 'بارکد محصول با موفقیت بروزرسانی شد' });
  } catch (error: any) {
    console.error('Error updating item barcode:', error);
    res.status(500).json({
      error: error.message || 'خطا در بروزرسانی بارکد محصول',
    });
  }
});

// Get today's inventory activity count
router.get('/today/count', authenticate, requireTenant, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.inventoryEntry.count({
      where: {
        item: {
          tenantId: req.tenant!.id  // Filter by tenant through item relation
        },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting today inventory count:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد تراکنش‌های امروز',
      error: (error as Error).message
    });
  }
});



// GET /api/inventory/deficits - Get items with negative stock
router.get('/deficits', authenticate, requireTenant, async (req, res) => {
  try {
    const deficits = await getStockDeficits(req.tenant!.id);
    
    res.json({
      success: true,
      data: deficits,
      message: 'Stock deficits retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting stock deficits:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت کسری موجودی' 
    });
  }
});

// GET /api/inventory/deficits/summary - Get deficit summary statistics
router.get('/deficits/summary', authenticate, requireTenant, async (req, res) => {
  try {
    const summary = await getDeficitSummary(req.tenant!.id);
    
    res.json({
      success: true,
      data: summary,
      message: 'Deficit summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting deficit summary:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت خلاصه کسری موجودی' 
    });
  }
});

// Mount stock validation routes
router.use('/', stockValidationRoutes);

// ===================== ORDER-INVENTORY INTEGRATION ROUTES =====================

/**
 * Inventory integration endpoints for recipe-based stock management
 * These endpoints integrate ordering system with inventory management
 */

// Update menu item availability based on ingredient stock levels
router.post('/update-menu-availability', authenticate, requireTenant, authorize(['MANAGER', 'ADMIN']), async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    
    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const result = await OrderInventoryIntegrationService.updateMenuItemAvailability(tenantId);
    
    res.json({
      success: true,
      data: result,
      message: `Menu availability updated: ${result.updated} items changed`
    });
  } catch (error) {
    next(error);
  }
});

// Update recipe costs when ingredient prices change
router.post('/update-recipe-costs', authenticate, requireTenant, authorize(['MANAGER', 'ADMIN']), async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    
    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const result = await OrderInventoryIntegrationService.updateRecipeCosts(tenantId);
    
    res.json({
      success: true,
      data: result,
      message: `Recipe costs updated: ${result.updated} recipes changed`
    });
  } catch (error) {
    next(error);
  }
});

export { router as inventoryRoutes }; 
