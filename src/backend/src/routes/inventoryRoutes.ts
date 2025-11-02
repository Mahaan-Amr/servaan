import { Router } from 'express';
import { prisma } from '../services/dbService';
import { z } from 'zod';
import { InventoryEntryType } from '../../../shared/types';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { requireTenant } from '../middlewares/tenantMiddleware';
import { notificationService } from '../services/notificationService';
import { getStockDeficits, getDeficitSummary } from '../services/inventoryService';
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
    
    // Get entries based on filter
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

    // Use database transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // For inventory out, track deficit but allow negative stock
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
        
        // Track deficit but allow negative stock
        const willBeNegative = current < validatedData.quantity;
        if (willBeNegative) {
          console.log(`⚠️ Stock deficit detected: ${item.name} will go from ${current} to ${current - validatedData.quantity}`);
          // Note: We don't throw an error anymore, just log the deficit
        }
      }

      // Create inventory entry within transaction
      const newEntry = await tx.inventoryEntry.create({
        data: {
          ...validatedData,
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
    // OUT entries are already negative → current stock = SUM(quantity)
    const stockAgg = await prisma.inventoryEntry.aggregate({
      where: {
        itemId: validatedData.itemId
      },
      _sum: {
        quantity: true
      }
    });
    const newCurrentStock = stockAgg._sum.quantity || 0;
    // Previous stock is simply current minus this change (works for both IN and OUT)
    const previousStock = newCurrentStock - validatedData.quantity;

    // Send inventory update notification (non-blocking)
    setImmediate(async () => {
      try {
        await notificationService.sendInventoryUpdateNotification({
          itemId: validatedData.itemId,
          itemName: result.item.name,
          previousStock,
          newStock: newCurrentStock,
          changeAmount: validatedData.quantity,
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

// PUT /api/inventory/:id - Update an inventory entry
router.put('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists
    const existingEntry = await prisma.inventoryEntry.findUnique({
      where: { id }
    });
    
    if (!existingEntry) {
      return res.status(404).json({ message: 'تراکنش انبار یافت نشد' });
    }
    
    // Validate request body
    const validatedData = inventoryEntrySchema.parse(req.body);
    
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
        let adjustedTotalIn = totalIn;
        let adjustedTotalOut = totalOut;
        
        if (existingEntry.type === 'IN') {
          adjustedTotalIn -= existingEntry.quantity;
        } else {
          adjustedTotalOut -= existingEntry.quantity;
        }
        
        // Calculate what stock would be after applying the new values
        if (validatedData.type === 'IN') {
          adjustedTotalIn += validatedData.quantity;
        } else {
          adjustedTotalOut += validatedData.quantity;
        }
        
        const finalStock = adjustedTotalIn - adjustedTotalOut;
        
        // Track deficit but allow negative stock
        const willBeNegative = finalStock < 0;
        if (willBeNegative) {
          console.log(`⚠️ Stock deficit detected in update: Item will go to ${finalStock}`);
          // Note: We don't throw an error anymore, just log the deficit
        }
        
        return { success: true };
      });
    }
    
    // Update inventory entry
    const updatedEntry = await prisma.inventoryEntry.update({
      where: { id },
      data: {
        ...validatedData,
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

// DELETE /api/inventory/:id - Delete an inventory entry
router.delete('/:id', authenticate, requireTenant, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entry exists
    const existingEntry = await prisma.inventoryEntry.findUnique({
      where: { id }
    });
    
    if (!existingEntry) {
      return res.status(404).json({ message: 'تراکنش انبار یافت نشد' });
    }
    
    // Delete inventory entry
    await prisma.inventoryEntry.delete({
      where: { id }
    });
    
    res.json({ message: 'تراکنش انبار با موفقیت حذف شد' });
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
