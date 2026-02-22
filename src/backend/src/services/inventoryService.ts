import { PrismaClient } from '../../../shared/generated/client';
import { prisma } from './dbService';

export interface StockMovementFilter {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  type?: 'IN' | 'OUT';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface InventoryValuation {
  totalValue: number;
  items: Array<{
    itemId: string;
    itemName: string;
    currentStock: number;
    averageCost: number;
    totalValue: number;
  }>;
}

export interface DeletionPermission {
  allowed: boolean;
  reason?: string;
}

/**
 * Get stock summary for all items (optimized - single query)
 * Returns stock level for all items in one aggregation query
 */
async function getItemsStockSummary(tenantId: string): Promise<Map<string, number>> {
  const entries = await prisma.inventoryEntry.groupBy({
    by: ['itemId'],
    where: {
      tenantId,
      deletedAt: null
    },
    _sum: {
      quantity: true
    }
  });

  const stockMap = new Map<string, number>();
  for (const entry of entries) {
    stockMap.set(entry.itemId, entry._sum.quantity || 0);
  }
  return stockMap;
}

/**
 * Get weighted average cost for all items (optimized - single query)
 */
async function getItemsWACMap(tenantId: string): Promise<Map<string, number>> {
  const inEntries = await prisma.inventoryEntry.groupBy({
    by: ['itemId'],
    where: {
      tenantId,
      type: 'IN',
      deletedAt: null,
      unitPrice: { not: null }
    },
    _sum: {
      quantity: true,
      unitPrice: true
    }
  });

  const wacMap = new Map<string, number>();
  for (const entry of inEntries) {
    if (entry._sum.quantity && entry._sum.unitPrice) {
      const wac = Number(entry._sum.unitPrice) / Number(entry._sum.quantity);
      wacMap.set(entry.itemId, wac);
    }
  }
  return wacMap;
}

/**
 * Get current stock for an item
 */
export async function calculateCurrentStock(
  itemId: string, 
  tenantId: string,
  startDate?: Date, 
  endDate?: Date
): Promise<number> {
  const whereClause: any = { 
    itemId,
    tenantId,
    deletedAt: null
  };
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const result = await prisma.inventoryEntry.aggregate({
    where: whereClause,
    _sum: { quantity: true }
  });

  return result._sum.quantity || 0;
}

/**
 * Get items with negative stock (OPTIMIZED - single query instead of N+1)
 */
export async function getStockDeficits(tenantId: string): Promise<Array<{
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  deficitAmount: number;
  tenantId: string;
}>> {
  // Get all items
  const items = await prisma.item.findMany({
    where: { 
      isActive: true,
      tenantId
    },
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      tenantId: true
    }
  });

  // Get stock for ALL items in ONE query
  const stockMap = await getItemsStockSummary(tenantId);

  const deficits = [];
  
  for (const item of items) {
    const currentStock = stockMap.get(item.id) || 0;
    if (currentStock < 0) {
      deficits.push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
        currentStock,
        deficitAmount: Math.abs(currentStock),
        tenantId: item.tenantId
      });
    }
  }

  return deficits;
}

/**
 * Get deficit summary statistics (OPTIMIZED - uses pre-fetched data)
 */
export async function getDeficitSummary(tenantId: string): Promise<{
  totalDeficitItems: number;
  totalDeficitValue: number;
  criticalDeficits: number;
  moderateDeficits: number;
}> {
  const deficits = await getStockDeficits(tenantId);
  
  // Fetch WAC map once for all items
  const wacMap = await getItemsWACMap(tenantId);
  
  let totalDeficitValue = 0;
  let criticalDeficits = 0;
  let moderateDeficits = 0;

  for (const deficit of deficits) {
    // Use pre-fetched WAC data instead of querying for each item
    const averageCost = wacMap.get(deficit.itemId) || 0;
    const deficitValue = deficit.deficitAmount * averageCost;
    totalDeficitValue += deficitValue;

    // Categorize by severity
    if (deficit.deficitAmount > 10) {
      criticalDeficits++;
    } else {
      moderateDeficits++;
    }
  }

  return {
    totalDeficitItems: deficits.length,
    totalDeficitValue,
    criticalDeficits,
    moderateDeficits
  };
}

/**
 * Get stock movements with filtering and pagination
 */
export async function getStockMovements(itemId: string, filter: StockMovementFilter = {}, tenantId: string) {
  const { page = 1, limit = 50, startDate, endDate, type } = filter;
  const skip = (page - 1) * limit;

  const whereClause: any = { itemId, tenantId }; // Added tenantId filter
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }
  
  if (type) {
    whereClause.type = type;
  }

  // Always exclude soft-deleted entries
  whereClause.deletedAt = null;
  
  const [entries, total] = await Promise.all([
    prisma.inventoryEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.inventoryEntry.count({ where: whereClause })
  ]);

  return {
    entries,
    pagination: {
      currentPage: page,
      total,
      pages: Math.ceil(total / limit),
      limit
    }
  };
}

/**
 * Validate stock entry data
 */
/**
 * Validate stock entry data with comprehensive input checks
 * ENHANCED: Added barcode format, minStock validation, and date range checks
 */
export function validateStockEntry(entry: {
  itemId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  note?: string;
  unitPrice?: number;
  expiryDate?: Date;
  barcode?: string;
  minStock?: number;
  dateRange?: { startDate: Date; endDate: Date };
}): ValidationResult {
  const errors: string[] = [];

  // Validate itemId
  if (!entry.itemId || entry.itemId.trim() === '') {
    errors.push('شناسه کالا الزامی است');
  }

  // Validate quantity is not zero
  if (entry.quantity === 0) {
    errors.push('مقدار باید غیر صفر باشد');
  }

  // Validate quantity sign matches type
  if (entry.type === 'IN' && entry.quantity < 0) {
    errors.push('مقدار ورودی باید مثبت باشد');
  }

  if (entry.type === 'OUT' && entry.quantity > 0) {
    errors.push('مقدار خروجی باید منفی باشد');
  }

  // Validate unit price for IN entries
  if (entry.type === 'IN' && (!entry.unitPrice || entry.unitPrice <= 0)) {
    errors.push('قیمت واحد برای ورودی الزامی و مثبت باشد');
  }

  if (entry.unitPrice && entry.unitPrice < 0) {
    errors.push('قیمت واحد باید مثبت باشد');
  }

  // Validate expiry date (must be in future)
  if (entry.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (entry.expiryDate < today) {
      errors.push('تاریخ انقضا باید در آینده باشد');
    }
  }

  // NEW: Validate barcode format (alphanumeric, 4-50 chars)
  if (entry.barcode) {
    const barcodeRegex = /^[a-zA-Z0-9]{4,50}$/;
    if (!barcodeRegex.test(entry.barcode)) {
      errors.push('بارکد باید 4-50 کاراکتر حروف و اعداد باشد');
    }
  }

  // NEW: Validate minStock >= 0
  if (entry.minStock !== undefined && entry.minStock < 0) {
    errors.push('حد اقل موجودی نمی‌تواند منفی باشد');
  }

  // NEW: Validate date range
  if (entry.dateRange) {
    if (entry.dateRange.startDate >= entry.dateRange.endDate) {
      errors.push('تاریخ شروع باید قبل از تاریخ پایان باشد');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if item is low stock
 */
export async function isLowStock(itemId: string, tenantId: string): Promise<boolean> { // Added tenantId parameter
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { minStock: true }
  });

  if (!item || !item.minStock || item.minStock === 0) {
    return false;
  }

  const currentStock = await calculateCurrentStock(itemId, tenantId);
  return currentStock < item.minStock;
}

/**
 * Calculate weighted average cost for an item
 */
export async function calculateWeightedAverageCost(itemId: string, tenantId: string): Promise<number> {
  const entries = await prisma.inventoryEntry.findMany({
    where: {
      itemId,
      tenantId, // Added tenantId filter
      type: 'IN',
      deletedAt: null, // Exclude soft-deleted entries
      unitPrice: {
        not: null
      }
    },
    select: {
      quantity: true,
      unitPrice: true
    }
  });

  if (entries.length === 0) {
    return 0;
  }

  const totalQuantity = entries.reduce((sum: number, entry: any) => sum + entry.quantity, 0);
  const totalValue = entries.reduce((sum: number, entry: any) => sum + (entry.quantity * (entry.unitPrice || 0)), 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

/**
 * Calculate inventory valuation
 */
/**
 * Calculate total inventory valuation for reporting
 * OPTIMIZED: Fetches stock and WAC for all items in parallel single queries
 * Before: 2N queries (N calls to calculateCurrentStock + N calls to calculateWeightedAverageCost)
 * After: 3 queries total (items query + 1 groupBy for stock + 1 groupBy for WAC)
 */
export async function calculateInventoryValuation(tenantId: string): Promise<InventoryValuation> {
  // Get all items with their current stock
  const items = await prisma.item.findMany({
    where: { 
      isActive: true,
      tenantId
    },
    select: {
      id: true,
      name: true,
      tenantId: true
    }
  });

  // Fetch both stock and WAC in parallel with single queries each (not per-item loops)
  const [stockMap, wacMap] = await Promise.all([
    getItemsStockSummary(tenantId),
    getItemsWACMap(tenantId)
  ]);

  const valuationItems = [];
  let totalValue = 0;

  for (const item of items) {
    // Use pre-calculated maps instead of querying for each item
    const currentStock = stockMap.get(item.id) || 0;
    
    if (currentStock > 0) {
      const averageCost = wacMap.get(item.id) || 0;
      const itemTotalValue = currentStock * averageCost;
      
      valuationItems.push({
        itemId: item.id,
        itemName: item.name,
        currentStock,
        averageCost,
        totalValue: itemTotalValue
      });
      
      totalValue += itemTotalValue;
    }
  }

  return {
    totalValue,
    items: valuationItems
  };
}

/**
 * Check if inventory entry can be deleted
 */
export async function canDeleteInventoryEntry(
  entryId: string, 
  userId: string, 
  userRole: string
): Promise<DeletionPermission> {
  const entry = await prisma.inventoryEntry.findFirst({
    where: { 
      id: entryId,
      deletedAt: null // Only check non-deleted entries
    },
    select: {
      userId: true,
      createdAt: true
    }
  });

  if (!entry) {
    return { allowed: false, reason: 'رکورد یافت نشد' };
  }

  // Check if entry is too old (more than 7 days)
  const daysDiff = Math.floor((Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 7) {
    return { allowed: false, reason: 'نمی‌توان رکوردهای قدیمی را حذف کرد' };
  }

  // Admin and Manager can delete any entry
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return { allowed: true };
  }

  // Staff can only delete their own entries
  if (userRole === 'STAFF' && entry.userId === userId) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'شما دسترسی لازم برای این عملیات را ندارید' };
}

/**
 * Adjust stock to a specific quantity
 */
export async function adjustStock(
  itemId: string,
  newQuantity: number,
  reason: string,
  userId: string,
  tenantId: string // Added tenantId
): Promise<any> {
  const currentStock = await calculateCurrentStock(itemId, tenantId);
  const adjustment = newQuantity - currentStock;

  if (adjustment === 0) {
    throw new Error('موجودی فعلی برابر با مقدار جدید است');
  }

  const entry = await prisma.inventoryEntry.create({
    data: {
      itemId,
      quantity: adjustment,
      type: adjustment > 0 ? 'IN' : 'OUT',
      note: `تعدیل موجودی: ${reason}`,
      userId,
      tenantId, // Added tenantId
      ...(adjustment > 0 && { unitPrice: 0 }) // For adjustments, we don't have a purchase price
    }
  });

  return entry;
}

/**
 * Check stock availability for outgoing entries
 */
export async function checkStockAvailability(itemId: string, requestedQuantity: number, tenantId: string): Promise<boolean> { // Added tenantId parameter
  const currentStock = await calculateCurrentStock(itemId, tenantId);
  return currentStock >= Math.abs(requestedQuantity);
} 

/**
 * Get current inventory price for an item (WAC)
 * Used by recipe system to fetch ingredient prices
 */
export async function getInventoryPrice(itemId: string, tenantId: string): Promise<{
  price: number;
  priceSource: 'WAC' | 'MANUAL' | 'NONE';
  lastUpdated: Date;
  priceHistory: Array<{
    date: Date;
    price: number;
    quantity: number;
  }>;
}> {
  try {
    // Get current WAC
    const currentPrice = await calculateWeightedAverageCost(itemId, tenantId);
    
    // Get price history from recent IN transactions
    const priceHistory = await prisma.inventoryEntry.findMany({
      where: {
        itemId,
        type: 'IN',
        unitPrice: {
          not: null
        }
      },
      select: {
        createdAt: true,
        unitPrice: true,
        quantity: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Last 10 transactions
    });

    const priceSource = currentPrice > 0 ? 'WAC' : 'NONE';

    return {
      price: currentPrice,
      priceSource,
      lastUpdated: priceHistory.length > 0 ? priceHistory[0].createdAt : new Date(),
      priceHistory: priceHistory.map(entry => ({
        date: entry.createdAt,
        price: Number(entry.unitPrice),
        quantity: Number(entry.quantity)
      }))
    };
  } catch (error) {
    console.error('Failed to get inventory price:', error);
    return {
      price: 0,
      priceSource: 'NONE',
      lastUpdated: new Date(),
      priceHistory: []
    };
  }
}

/**
 * Validate price consistency between inventory and recipe
 * Returns items with price mismatches
 */
export async function validatePriceConsistency(tenantId: string): Promise<Array<{
  itemId: string;
  itemName: string;
  inventoryPrice: number;
  recipePrices: Array<{
    recipeId: string;
    recipeName: string;
    recipePrice: number;
    difference: number;
    percentageDiff: number;
  }>;
}>> {
  try {
    // Get all items with recipes
    const itemsWithRecipes = await prisma.item.findMany({
      where: {
        tenantId,
        isActive: true,
        recipeIngredients: {
          some: {}
        }
      },
      include: {
        recipeIngredients: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const inconsistencies = [];

    for (const item of itemsWithRecipes) {
      const inventoryPrice = await calculateWeightedAverageCost(item.id, item.tenantId);
      
      if (inventoryPrice > 0) {
        const recipePrices = item.recipeIngredients.map(ingredient => {
          const recipePrice = Number(ingredient.unitCost);
          const difference = Math.abs(recipePrice - inventoryPrice);
          const percentageDiff = inventoryPrice > 0 ? (difference / inventoryPrice) * 100 : 0;
          
          return {
            recipeId: ingredient.recipeId,
            recipeName: ingredient.recipe.name,
            recipePrice,
            difference,
            percentageDiff
          };
        }).filter(price => price.difference > 0.01); // Only include significant differences

        if (recipePrices.length > 0) {
          inconsistencies.push({
            itemId: item.id,
            itemName: item.name,
            inventoryPrice,
            recipePrices
          });
        }
      }
    }

    return inconsistencies;
  } catch (error) {
    console.error('Failed to validate price consistency:', error);
    return [];
  }
}

/**
 * Notify recipe system when inventory prices change
 * Triggers recipe cost recalculation and menu item profitability updates
 */
export async function notifyPriceChange(itemId: string, newPrice: number, oldPrice: number): Promise<void> {
  try {
    // Find all recipes using this item
    const affectedRecipes = await prisma.recipeIngredient.findMany({
      where: {
        itemId
      },
      include: {
        recipe: {
          include: {
            menuItem: {
              select: {
                id: true,
                displayName: true,
                menuPrice: true,
                tenantId: true
              }
            }
          }
        }
      }
    });

    if (affectedRecipes.length > 0) {
      console.log(`📊 Price change detected for item ${itemId}: ${oldPrice.toFixed(2)} → ${newPrice.toFixed(2)}`);
      console.log(`📋 Affecting ${affectedRecipes.length} recipes`);
      
      // Import services
      const { RecipeService } = await import('./recipeService');
      const { socketService } = await import('./socketService');
      
      const costUpdates: Array<{
        recipeId: string;
        recipeName: string;
        menuItemId: string;
        menuItemName: string;
        oldCost: number;
        newCost: number;
        oldProfitMargin: number;
        newProfitMargin: number;
      }> = [];

      // Group by tenant to batch updates
      const recipesByTenant = new Map<string, typeof affectedRecipes>();
      for (const ingredient of affectedRecipes) {
        const tenantId = ingredient.recipe.tenantId;
        if (!recipesByTenant.has(tenantId)) {
          recipesByTenant.set(tenantId, []);
        }
        recipesByTenant.get(tenantId)!.push(ingredient);
      }

      // Process each tenant's recipes
      for (const [tenantId, tenantRecipes] of recipesByTenant.entries()) {
        // Update ingredient unit cost first
        for (const ingredient of tenantRecipes) {
          try {
            // Update ingredient unit cost
            const newTotalCost = Number(ingredient.quantity) * newPrice;
            await prisma.recipeIngredient.update({
              where: { id: ingredient.id },
              data: {
                unitCost: newPrice,
                totalCost: newTotalCost
              }
            });

            // Recalculate recipe cost
            await RecipeService.recalculateRecipeCost(tenantId, ingredient.recipeId);
            
            // Get updated recipe with menu item
            const updatedRecipe = await prisma.recipe.findUnique({
              where: { id: ingredient.recipeId },
              include: {
                menuItem: {
                  select: {
                    id: true,
                    displayName: true,
                    menuPrice: true
                  }
                }
              }
            });

            if (updatedRecipe && updatedRecipe.menuItem) {
              const menuPrice = Number(updatedRecipe.menuItem.menuPrice);
              const newCostPerServing = Number(updatedRecipe.costPerServing);
              const oldCostPerServing = Number(ingredient.recipe.costPerServing || 0);
              
              // Calculate profit margins
              const oldProfit = menuPrice - oldCostPerServing;
              const newProfit = menuPrice - newCostPerServing;
              const oldProfitMargin = menuPrice > 0 ? (oldProfit / menuPrice) * 100 : 0;
              const newProfitMargin = menuPrice > 0 ? (newProfit / menuPrice) * 100 : 0;

              costUpdates.push({
                recipeId: ingredient.recipeId,
                recipeName: ingredient.recipe.name,
                menuItemId: updatedRecipe.menuItem.id,
                menuItemName: updatedRecipe.menuItem.displayName,
                oldCost: oldCostPerServing,
                newCost: newCostPerServing,
                oldProfitMargin,
                newProfitMargin
              });
            }
          } catch (error) {
            console.error(`Failed to update recipe ${ingredient.recipeId}:`, error);
          }
        }

        // Emit WebSocket notification for cost updates
        if (costUpdates.length > 0) {
          try {
            const item = await prisma.item.findUnique({ 
              where: { id: itemId }, 
              select: { name: true } 
            });
            
            socketService.broadcast('recipe:cost-updated', {
              itemId,
              itemName: item?.name || 'Unknown Item',
              oldPrice,
              newPrice,
              affectedRecipes: costUpdates.map(update => ({
                recipeId: update.recipeId,
                recipeName: update.recipeName,
                menuItemId: update.menuItemId,
                menuItemName: update.menuItemName,
                oldCost: update.oldCost,
                newCost: update.newCost,
                oldProfitMargin: update.oldProfitMargin,
                newProfitMargin: update.newProfitMargin
              }))
            }, tenantId);
            console.log(`📡 [COST_UPDATE] Emitted cost update notifications for ${costUpdates.length} recipes`);
          } catch (socketError) {
            console.error('Failed to emit cost update notification:', socketError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to notify price change:', error);
  }
}

/**
 * Get price statistics for inventory items
 */
export async function getPriceStatistics(tenantId: string): Promise<{
  totalItems: number;
  itemsWithPrices: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  recentPriceChanges: Array<{
    itemId: string;
    itemName: string;
    oldPrice: number;
    newPrice: number;
    changeDate: Date;
  }>;
}> {
  try {
    const items = await prisma.item.findMany({
      where: {
        tenantId,
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    });

    let itemsWithPrices = 0;
    let totalPrice = 0;
    const prices: number[] = [];
    const recentChanges: Array<{
      itemId: string;
      itemName: string;
      oldPrice: number;
      newPrice: number;
      changeDate: Date;
    }> = [];

    for (const item of items) {
      const priceInfo = await getInventoryPrice(item.id, tenantId);
      
      if (priceInfo.price > 0) {
        itemsWithPrices++;
        totalPrice += priceInfo.price;
        prices.push(priceInfo.price);
        
        // Check for recent price changes (last 30 days)
        if (priceInfo.priceHistory.length > 1) {
          const recent = priceInfo.priceHistory[0];
          const previous = priceInfo.priceHistory[1];
          
          if (recent.price !== previous.price) {
            recentChanges.push({
              itemId: item.id,
              itemName: item.name,
              oldPrice: previous.price,
              newPrice: recent.price,
              changeDate: recent.date
            });
          }
        }
      }
    }

    const averagePrice = itemsWithPrices > 0 ? totalPrice / itemsWithPrices : 0;
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices)
    } : { min: 0, max: 0 };

    return {
      totalItems: items.length,
      itemsWithPrices,
      averagePrice,
      priceRange,
      recentPriceChanges: recentChanges.slice(0, 10) // Last 10 changes
    };
  } catch (error) {
    console.error('Failed to get price statistics:', error);
    return {
      totalItems: 0,
      itemsWithPrices: 0,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      recentPriceChanges: []
    };
  }
} 
