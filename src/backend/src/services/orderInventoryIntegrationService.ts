import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
// import { calculateWeightedAverageCost, calculateCurrentStock, checkStockAvailability } from './inventoryService';
// import { RecipeService } from './recipeService';

const prisma = new PrismaClient();

export interface RecipeStockValidationResult {
  isAvailable: boolean;
  unavailableIngredients: {
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    unit: string;
  }[];
  totalCost: number;
  profitMargin: number;
}

export interface FlexibleStockValidationResult {
  isAvailable: boolean;
  hasWarnings: boolean;
  warnings: {
    type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    unit: string;
    message: string;
    suggestedAction: string;
  }[];
  unavailableIngredients: {
    itemId: string;
    itemName: string;
    requiredQuantity: number;
    availableQuantity: number;
    unit: string;
  }[];
  totalCost: number;
  profitMargin: number;
  canProceedWithOverride: boolean;
  overrideRequired: boolean;
}

export interface StockOverrideRecord {
  id: string;
  tenantId: string;
  orderId: string;
  menuItemId: string;
  itemId: string;
  itemName: string;
  requiredQuantity: number;
  availableQuantity: number;
  overrideReason: string;
  overrideType: 'STAFF_DECISION' | 'EMERGENCY_PURCHASE' | 'SUBSTITUTE_INGREDIENT' | 'VIP_CUSTOMER';
  overriddenBy: string;
  overriddenAt: Date;
  notes?: string;
}

export interface OrderItemWithRecipe {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  recipe?: {
    id: string;
    ingredients: {
      itemId: string;
      itemName: string;
      quantity: number;
      unit: string;
      unitCost: number;
      totalCost: number;
      isOptional: boolean;
    }[];
  };
}

export interface RecipeBasedStockDeduction {
  orderItemId: string;
  menuItemId: string;
  orderQuantity: number;
  ingredientDeductions: {
    itemId: string;
    itemName: string;
    quantityToDeduct: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }[];
  totalCOGS: number;
}

export interface MenuAvailabilityUpdate {
  updated: number;
  disabledItems: string[];
  enabledItems: string[];
  lowStockAlerts: {
    itemId: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    affectedMenuItems: string[];
  }[];
}

/**
 * Order-Inventory Integration Service
 * Service for integrating ordering system with inventory management
 * specifically for recipe-based operations
 */
export class OrderInventoryIntegrationService {

  /**
   * Validate stock availability for recipe-based menu items
   * Checks if all required ingredients are available in sufficient quantities
   */
  static async validateRecipeStockAvailability(
    tenantId: string,
    menuItemId: string,
    orderQuantity: number
  ): Promise<RecipeStockValidationResult> {
    try {
      // Get recipe for menu item with ingredients included
      const recipe = await prisma.recipe.findFirst({
        where: {
          menuItemId,
          tenantId,
          isActive: true
        },
        include: {
          menuItem: {
            select: {
              id: true,
              displayName: true,
              menuPrice: true
            }
          },
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  minStock: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
      
      if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        // No recipe found - treat as non-recipe item (no ingredients to check)
        return {
          isAvailable: true,
          unavailableIngredients: [],
          totalCost: 0,
          profitMargin: 0
        };
      }

      const unavailableIngredients = [];
      let totalCost = 0;

      // Check each ingredient availability
      for (const ingredient of recipe.ingredients) {
        const requiredQuantity = Number(ingredient.quantity) * orderQuantity;
        const { calculateCurrentStock } = await import('./inventoryService');
        const availableStock = await calculateCurrentStock(ingredient.itemId, tenantId);
        
        // Get current cost from inventory
        const { calculateWeightedAverageCost } = await import('./inventoryService');
        const currentCost = await calculateWeightedAverageCost(ingredient.itemId, tenantId);
        const ingredientTotalCost = requiredQuantity * currentCost;
        totalCost += ingredientTotalCost;

        // Check if ingredient is available (allow negative stock for non-optional ingredients)
        // Note: We now allow negative stock instead of blocking orders
        if (availableStock < requiredQuantity && !ingredient.isOptional) {
          // Log the deficit but don't block the order
          console.log(`⚠️ Stock deficit for ${ingredient.item?.name}: Required ${requiredQuantity}, Available ${availableStock}`);
          
          // Add to unavailable ingredients list for reporting purposes
          unavailableIngredients.push({
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            requiredQuantity,
            availableQuantity: availableStock,
            unit: ingredient.unit
          });
        }
      }

      // Calculate profit margin
      const menuPrice = Number(recipe.menuItem?.menuPrice || 0);
      const profitMargin = menuPrice - (totalCost / orderQuantity);

      // Always return available = true to allow orders with negative stock
      return {
        isAvailable: true, // Changed from unavailableIngredients.length === 0
        unavailableIngredients,
        totalCost,
        profitMargin: profitMargin * orderQuantity
      };

    } catch (error) {
      throw new AppError('Failed to validate recipe stock availability', 500, error);
    }
  }

  /**
   * Validate stock for multiple order items at once
   * Used during order creation to check all items before processing
   */
  static async validateOrderStockAvailability(
    tenantId: string,
    orderItems: { menuItemId: string; quantity: number }[]
  ): Promise<{
    isValid: boolean;
    validationResults: (RecipeStockValidationResult & { menuItemId: string })[];
    totalCOGS: number;
    totalProfitMargin: number;
  }> {
    try {
      const validationResults = [];
      let totalCOGS = 0;
      let totalProfitMargin = 0;
      let overallValid = true;

      for (const item of orderItems) {
        const validation = await this.validateRecipeStockAvailability(
          tenantId,
          item.menuItemId,
          item.quantity
        );

        validationResults.push({
          ...validation,
          menuItemId: item.menuItemId
        });

        if (!validation.isAvailable) {
          overallValid = false;
        }

        totalCOGS += validation.totalCost;
        totalProfitMargin += validation.profitMargin;
      }

      return {
        isValid: overallValid,
        validationResults,
        totalCOGS,
        totalProfitMargin
      };

    } catch (error) {
      throw new AppError('Failed to validate order stock availability', 500, error);
    }
  }

  /**
   * Flexible stock validation with warnings and override capabilities
   * Returns warnings instead of blocking orders, allowing staff to proceed with confirmation
   */
  static async validateFlexibleStockAvailability(
    tenantId: string,
    menuItemId: string,
    orderQuantity: number
  ): Promise<FlexibleStockValidationResult> {
    try {
      // Get recipe for menu item with ingredients included
      const recipe = await prisma.recipe.findFirst({
        where: {
          menuItemId,
          tenantId,
          isActive: true
        },
        include: {
          menuItem: {
            select: {
              id: true,
              displayName: true,
              menuPrice: true
            }
          },
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  minStock: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
      
      if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        // No recipe found - treat as non-recipe item (no ingredients to check)
        return {
          isAvailable: true,
          hasWarnings: false,
          warnings: [],
          unavailableIngredients: [],
          totalCost: 0,
          profitMargin: 0,
          canProceedWithOverride: true,
          overrideRequired: false
        };
      }

      const warnings = [];
      const unavailableIngredients = [];
      let totalCost = 0;
      let hasCriticalIssues = false;

      // Check each ingredient availability
      for (const ingredient of recipe.ingredients) {
        const requiredQuantity = Number(ingredient.quantity) * orderQuantity;
        const { calculateCurrentStock } = await import('./inventoryService');
        const availableStock = await calculateCurrentStock(ingredient.itemId, tenantId);
        const minStock = Number(ingredient.item?.minStock || 0);
        
        // Get current cost from inventory
        const { calculateWeightedAverageCost } = await import('./inventoryService');
        const currentCost = await calculateWeightedAverageCost(ingredient.itemId, tenantId);
        const ingredientTotalCost = requiredQuantity * currentCost;
        totalCost += ingredientTotalCost;

        // Determine stock status and create appropriate warnings
        if (availableStock < requiredQuantity) {
          const deficit = requiredQuantity - availableStock;
          const stockPercentage = (availableStock / requiredQuantity) * 100;
          
          let warningType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK';
          let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          let message: string;
          let suggestedAction: string;

          if (availableStock <= 0) {
            warningType = 'OUT_OF_STOCK';
            severity = 'CRITICAL';
            message = `موجودی ${ingredient.item?.name} تمام شده است`;
            suggestedAction = 'مواد اولیه را از فروشگاه نزدیک تهیه کنید';
            hasCriticalIssues = true;
          } else if (stockPercentage <= 25) {
            warningType = 'CRITICAL_STOCK';
            severity = 'HIGH';
            message = `موجودی ${ingredient.item?.name} بسیار کم است (${availableStock} ${ingredient.unit})`;
            suggestedAction = 'فوری مواد اولیه را تهیه کنید';
            hasCriticalIssues = true;
          } else if (stockPercentage <= 50) {
            warningType = 'LOW_STOCK';
            severity = 'MEDIUM';
            message = `موجودی ${ingredient.item?.name} کم است (${availableStock} ${ingredient.unit})`;
            suggestedAction = 'مواد اولیه را تهیه کنید';
          } else {
            warningType = 'LOW_STOCK';
            severity = 'LOW';
            message = `موجودی ${ingredient.item?.name} در حد آستانه است`;
            suggestedAction = 'موجودی را بررسی کنید';
          }

          warnings.push({
            type: warningType as 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK',
            severity: severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            requiredQuantity,
            availableQuantity: availableStock,
            unit: ingredient.unit,
            message,
            suggestedAction
          });

          // Add to unavailable ingredients for reporting
          unavailableIngredients.push({
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            requiredQuantity,
            availableQuantity: availableStock,
            unit: ingredient.unit
          });
        } else if (availableStock <= minStock && minStock > 0) {
          // Low stock warning (below minimum threshold)
          warnings.push({
            type: 'LOW_STOCK' as 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL_STOCK',
            severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            requiredQuantity,
            availableQuantity: availableStock,
            unit: ingredient.unit,
            message: `موجودی ${ingredient.item?.name} زیر حد آستانه است (${availableStock} ${ingredient.unit})`,
            suggestedAction: 'موجودی را تکمیل کنید'
          });
        }
      }

      // Calculate profit margin
      const menuPrice = Number(recipe.menuItem?.menuPrice || 0);
      const profitMargin = menuPrice - (totalCost / orderQuantity);

      return {
        isAvailable: true, // Always allow orders to proceed
        hasWarnings: warnings.length > 0,
        warnings,
        unavailableIngredients,
        totalCost,
        profitMargin: profitMargin * orderQuantity,
        canProceedWithOverride: true, // Staff can always override
        overrideRequired: hasCriticalIssues // Override required for critical issues
      };

    } catch (error) {
      throw new AppError('Failed to validate flexible stock availability', 500, error);
    }
  }

  /**
   * Validate flexible stock for multiple order items at once
   * Used during order creation to check all items with warnings
   */
  static async validateFlexibleOrderStockAvailability(
    tenantId: string,
    orderItems: { menuItemId: string; quantity: number }[]
  ): Promise<{
    isValid: boolean;
    hasWarnings: boolean;
    validationResults: (FlexibleStockValidationResult & { menuItemId: string })[];
    totalCOGS: number;
    totalProfitMargin: number;
    canProceedWithOverride: boolean;
    overrideRequired: boolean;
    criticalWarnings: number;
    totalWarnings: number;
  }> {
    try {
      const validationResults = [];
      let totalCOGS = 0;
      let totalProfitMargin = 0;
      let hasWarnings = false;
      let overrideRequired = false;
      let criticalWarnings = 0;
      let totalWarnings = 0;

      for (const item of orderItems) {
        const validation = await this.validateFlexibleStockAvailability(
          tenantId,
          item.menuItemId,
          item.quantity
        );

        validationResults.push({
          ...validation,
          menuItemId: item.menuItemId
        });

        if (validation.hasWarnings) {
          hasWarnings = true;
          totalWarnings += validation.warnings.length;
          criticalWarnings += validation.warnings.filter(w => w.severity === 'CRITICAL' || w.severity === 'HIGH').length;
        }

        if (validation.overrideRequired) {
          overrideRequired = true;
        }

        totalCOGS += validation.totalCost;
        totalProfitMargin += validation.profitMargin;
      }

      return {
        isValid: true, // Always allow orders to proceed
        hasWarnings,
        validationResults,
        totalCOGS,
        totalProfitMargin,
        canProceedWithOverride: true,
        overrideRequired,
        criticalWarnings,
        totalWarnings
      };

    } catch (error) {
      throw new AppError('Failed to validate flexible order stock availability', 500, error);
    }
  }

  /**
   * Record stock override when staff proceeds with order despite stock warnings
   */
  static async recordStockOverride(
    tenantId: string,
    orderId: string,
    menuItemId: string,
    itemId: string,
    itemName: string,
    requiredQuantity: number,
    availableQuantity: number,
    overrideReason: string,
    overrideType: 'STAFF_DECISION' | 'EMERGENCY_PURCHASE' | 'SUBSTITUTE_INGREDIENT' | 'VIP_CUSTOMER',
    overriddenBy: string,
    notes?: string
  ): Promise<StockOverrideRecord> {
    try {
      const overrideRecord = await prisma.$executeRaw`
        INSERT INTO stock_overrides (
          id, tenant_id, order_id, menu_item_id, item_id, item_name,
          required_quantity, available_quantity, override_reason, override_type,
          overridden_by, overridden_at, notes
        ) VALUES (
          gen_random_uuid(), ${tenantId}, ${orderId}, ${menuItemId}, ${itemId}, ${itemName},
          ${requiredQuantity}, ${availableQuantity}, ${overrideReason}, ${overrideType},
          ${overriddenBy}, NOW(), ${notes || null}
        ) RETURNING *
      `;

      return overrideRecord as unknown as StockOverrideRecord;
    } catch (error) {
      throw new AppError('Failed to record stock override', 500, error);
    }
  }

  /**
   * Get stock override analytics for business intelligence
   */
  static async getStockOverrideAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalOverrides: number;
    overridesByType: Record<string, number>;
    overridesByItem: Array<{
      itemId: string;
      itemName: string;
      overrideCount: number;
      totalDeficit: number;
    }>;
    overridesByStaff: Array<{
      staffId: string;
      staffName: string;
      overrideCount: number;
    }>;
    frequentOverrideItems: Array<{
      itemId: string;
      itemName: string;
      overrideCount: number;
      avgDeficit: number;
      lastOverride: Date;
    }>;
  }> {
    try {
      const whereClause: any = { tenantId };
      
      if (startDate || endDate) {
        whereClause.overriddenAt = {};
        if (startDate) whereClause.overriddenAt.gte = startDate;
        if (endDate) whereClause.overriddenAt.lte = endDate;
      }

      const overrides = await prisma.$queryRaw`
        SELECT so.*, u.name as overridden_by_name
        FROM stock_overrides so
        LEFT JOIN users u ON so.overridden_by = u.id
        WHERE so.tenant_id = ${tenantId}
        ${startDate ? `AND so.overridden_at >= ${startDate}` : ''}
        ${endDate ? `AND so.overridden_at <= ${endDate}` : ''}
        ORDER BY so.overridden_at DESC
      ` as any[];

      // Calculate analytics
      const totalOverrides = overrides.length;
      
      const overridesByType = overrides.reduce((acc: Record<string, number>, override: any) => {
        acc[override.override_type] = (acc[override.override_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const overridesByItem = overrides.reduce((acc: Array<{
        itemId: string;
        itemName: string;
        overrideCount: number;
        totalDeficit: number;
      }>, override: any) => {
        const existing = acc.find(item => item.itemId === override.item_id);
        if (existing) {
          existing.overrideCount += 1;
          existing.totalDeficit += (override.required_quantity - override.available_quantity);
        } else {
          acc.push({
            itemId: override.item_id,
            itemName: override.item_name,
            overrideCount: 1,
            totalDeficit: override.required_quantity - override.available_quantity
          });
        }
        return acc;
      }, [] as Array<{
        itemId: string;
        itemName: string;
        overrideCount: number;
        totalDeficit: number;
      }>);

      const overridesByStaff = overrides.reduce((acc: Array<{
        staffId: string;
        staffName: string;
        overrideCount: number;
      }>, override: any) => {
        const existing = acc.find(staff => staff.staffId === override.overridden_by);
        if (existing) {
          existing.overrideCount += 1;
        } else {
          acc.push({
            staffId: override.overridden_by,
            staffName: override.overridden_by_name || 'Unknown',
            overrideCount: 1
          });
        }
        return acc;
      }, [] as Array<{
        staffId: string;
        staffName: string;
        overrideCount: number;
      }>);

      const frequentOverrideItems = overridesByItem
        .sort((a: any, b: any) => b.overrideCount - a.overrideCount)
        .slice(0, 10)
        .map((item: any) => ({
          ...item,
          avgDeficit: item.totalDeficit / item.overrideCount,
          lastOverride: overrides.find((o: any) => o.item_id === item.itemId)?.overridden_at || new Date()
        }));

      return {
        totalOverrides,
        overridesByType,
        overridesByItem,
        overridesByStaff,
        frequentOverrideItems
      };

    } catch (error) {
      throw new AppError('Failed to get stock override analytics', 500, error);
    }
  }

  /**
   * Calculate Cost of Goods Sold for order items with recipes
   * Returns detailed breakdown for accounting integration
   */
  static async calculateOrderCOGS(
    tenantId: string,
    orderItems: OrderItemWithRecipe[]
  ): Promise<{
    totalCOGS: number;
    itemBreakdown: {
      menuItemId: string;
      quantity: number;
      unitCOGS: number;
      totalCOGS: number;
      ingredientCosts: {
        itemId: string;
        itemName: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
      }[];
    }[];
  }> {
    try {
      const itemBreakdown = [];
      let totalCOGS = 0;

      for (const orderItem of orderItems) {
        // Get recipe for menu item with ingredients included
        const recipe = await prisma.recipe.findFirst({
          where: {
            menuItemId: orderItem.menuItemId,
            tenantId,
            isActive: true
          },
          include: {
            ingredients: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    unit: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });
        
        let itemCOGS = 0;
        const ingredientCosts = [];

        if (recipe && recipe.ingredients) {
          // Calculate COGS based on recipe ingredients
          for (const ingredient of recipe.ingredients) {
            const { calculateWeightedAverageCost } = await import('./inventoryService');
        const currentCost = await calculateWeightedAverageCost(ingredient.itemId, tenantId);
            const quantityNeeded = Number(ingredient.quantity) * orderItem.quantity;
            const ingredientTotalCost = quantityNeeded * currentCost;
            
            itemCOGS += ingredientTotalCost;
            ingredientCosts.push({
              itemId: ingredient.itemId,
              itemName: ingredient.item?.name || 'Unknown Item',
              quantity: quantityNeeded,
              unitCost: currentCost,
              totalCost: ingredientTotalCost
            });
          }
        }

        const unitCOGS = orderItem.quantity > 0 ? itemCOGS / orderItem.quantity : 0;
        
        itemBreakdown.push({
          menuItemId: orderItem.menuItemId,
          quantity: orderItem.quantity,
          unitCOGS,
          totalCOGS: itemCOGS,
          ingredientCosts
        });

        totalCOGS += itemCOGS;
      }

      return {
        totalCOGS,
        itemBreakdown
      };

    } catch (error) {
      throw new AppError('Failed to calculate order COGS', 500, error);
    }
  }

  /**
   * Process stock deduction for completed orders with recipes
   * Deducts inventory for all recipe ingredients
   */
  static async processRecipeStockDeduction(
    tenantId: string,
    orderId: string,
    userId: string
  ): Promise<RecipeBasedStockDeduction[]> {
    try {
      // Idempotency: if we already created OUT entries for this order, skip
      // We detect by matching note prefix containing the order number
      const existing = await prisma.inventoryEntry.findFirst({
        where: {
          tenantId,
          type: 'OUT',
          note: { contains: orderId }
        }
      });
      if (existing) {
        return [];
      }

      // Get order with items and menu items
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          items: {
            include: {
              item: {
                include: {
                  menuItems: {
                    where: { isActive: true },
                    take: 1
                  }
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const stockDeductions: RecipeBasedStockDeduction[] = [];

      // Process each order item
      for (const orderItem of order.items) {
        // Resolve the menu item for this order line in two ways:
        // 1) Through the linked inventory item relation (item.menuItems)
        // 2) Directly via orderItem.menuItemId when there is no linked inventory item
        let menuItem: any | null = null;
        if (orderItem.item && orderItem.item.menuItems && orderItem.item.menuItems.length > 0) {
          menuItem = orderItem.item.menuItems[0];
        } else if ((orderItem as any).menuItemId) {
          menuItem = await prisma.menuItem.findFirst({
            where: { id: (orderItem as any).menuItemId, tenantId, isActive: true },
          });
        }

        if (!menuItem) {
          continue; // No resolvable menu item → cannot deduct by recipe
        }
        
        // Get recipe for this menu item with ingredients included
        const recipe = await prisma.recipe.findFirst({
          where: {
            menuItemId: menuItem.id,
            tenantId,
            isActive: true
          },
          include: {
            ingredients: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    unit: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });
        
        if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
          continue; // Skip items without recipes
        }

        const ingredientDeductions = [];
        let totalCOGS = 0;

        // Process each ingredient
        for (const ingredient of recipe.ingredients) {
          const quantityToDeduct = Number(ingredient.quantity) * orderItem.quantity;
          const { calculateWeightedAverageCost } = await import('./inventoryService');
        const currentCost = await calculateWeightedAverageCost(ingredient.itemId, tenantId);
          const totalCost = quantityToDeduct * currentCost;
          
          totalCOGS += totalCost;

          // Create inventory entry for stock deduction
          await prisma.inventoryEntry.create({
            data: {
              itemId: ingredient.itemId,
              quantity: -quantityToDeduct, // Negative for OUT transaction
              type: 'OUT',
              note: `Order ${order.orderNumber} (${order.id}) - Recipe ingredient: ${ingredient.item?.name}`,
              userId,
              tenantId,
            }
          });

          ingredientDeductions.push({
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            quantityToDeduct,
            unit: ingredient.unit,
            costPerUnit: currentCost,
            totalCost
          });
        }

        stockDeductions.push({
          orderItemId: orderItem.id,
          menuItemId: menuItem.id,
          orderQuantity: orderItem.quantity,
          ingredientDeductions,
          totalCOGS
        });
      }

      return stockDeductions;

    } catch (error) {
      throw new AppError('Failed to process recipe stock deduction', 500, error);
    }
  }

  /**
   * Update menu item availability based on ingredient stock levels
   * Disables menu items when critical ingredients are out of stock
   * Returns comprehensive update results with low stock alerts
   */
  static async updateMenuItemAvailability(tenantId: string): Promise<MenuAvailabilityUpdate> {
    try {
      // Get all menu items with recipes
      const menuItemsWithRecipes = await prisma.menuItem.findMany({
        where: {
          tenantId,
          isActive: true,
          recipe: {
            isActive: true
          }
        },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  item: {
                    select: {
                      id: true,
                      name: true,
                      minStock: true
                    }
                  }
                }
              }
            }
          }
        }
      });

              const disabledItems: string[] = [];
        const enabledItems: string[] = [];
        const lowStockAlerts: Array<{
          itemId: string;
          itemName: string;
          currentStock: number;
          minStock: number;
          affectedMenuItems: string[];
        }> = [];
        let updated = 0;

      for (const menuItem of menuItemsWithRecipes) {
        let shouldBeAvailable = true;
        const criticalIngredients = [];

        // Check if all required ingredients are available
        if (menuItem.recipe && menuItem.recipe.ingredients) {
          for (const ingredient of menuItem.recipe.ingredients) {
            if (!ingredient.isOptional) {
              const { calculateCurrentStock } = await import('./inventoryService');
              const currentStock = await calculateCurrentStock(ingredient.itemId, tenantId);
              const minRequired = Number(ingredient.quantity); // For one serving
              const minStock = ingredient.item?.minStock || 10;
              
              if (currentStock < minRequired) {
                shouldBeAvailable = false;
                break;
              }

              // Check for low stock alerts
              if (currentStock <= minStock) {
                criticalIngredients.push({
                  itemId: ingredient.itemId,
                  itemName: ingredient.item?.name || 'Unknown',
                  currentStock,
                  minStock
                });
              }
            }
          }
        }

        // Update availability if needed
        if (menuItem.isAvailable !== shouldBeAvailable) {
          await prisma.menuItem.update({
            where: { id: menuItem.id },
            data: { isAvailable: shouldBeAvailable }
          });

          updated++;
          
          if (shouldBeAvailable) {
            enabledItems.push(menuItem.displayName);
          } else {
            disabledItems.push(menuItem.displayName);
          }
        }

        // Add low stock alerts
        for (const ingredient of criticalIngredients) {
          const existingAlert = lowStockAlerts.find(alert => alert.itemId === ingredient.itemId);
          if (existingAlert) {
            existingAlert.affectedMenuItems.push(menuItem.displayName);
          } else {
            lowStockAlerts.push({
              ...ingredient,
              affectedMenuItems: [menuItem.displayName]
            });
          }
        }
      }

      return {
        updated,
        disabledItems,
        enabledItems,
        lowStockAlerts
      };

    } catch (error) {
      throw new AppError('Failed to update menu item availability', 500, error);
    }
  }

  /**
   * Get low stock alerts for recipe ingredients
   * Prioritizes alerts based on ingredient usage frequency
   */
  static async getRecipeIngredientLowStockAlerts(tenantId: string): Promise<{
    criticalIngredients: {
      itemId: string;
      itemName: string;
      currentStock: number;
      unit: string;
      affectedMenuItems: string[];
      priority: 'high' | 'medium' | 'low';
    }[];
  }> {
    try {
      // Get all recipe ingredients with their usage
      const recipeIngredients = await prisma.recipeIngredient.findMany({
        where: {
          tenantId,
          recipe: {
            isActive: true,
            menuItem: {
              isActive: true
            }
          }
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              minStock: true
            }
          },
          recipe: {
            include: {
              menuItem: {
                select: {
                  displayName: true,
                  isAvailable: true
                }
              }
            }
          }
        }
      });

      const ingredientUsage = new Map();

      // Calculate ingredient usage across recipes
      for (const ingredient of recipeIngredients) {
        const key = ingredient.itemId;
        if (!ingredientUsage.has(key)) {
          ingredientUsage.set(key, {
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            unit: ingredient.unit,
            affectedMenuItems: [],
            usageCount: 0
          });
        }

        const usage = ingredientUsage.get(key);
        if (ingredient.recipe?.menuItem?.displayName) {
          usage.affectedMenuItems.push(ingredient.recipe.menuItem.displayName);
        }
        usage.usageCount++;
      }

      const criticalIngredients = [];

      // Check stock levels for each ingredient
      for (const [itemId, usage] of Array.from(ingredientUsage.entries())) {
        const { calculateCurrentStock } = await import('./inventoryService');
        const currentStock = await calculateCurrentStock(itemId, tenantId);
        const minStock = usage.item?.minStock || 10; // Default minimum stock

        if (currentStock <= minStock) {
          // Determine priority based on usage frequency
          let priority: 'high' | 'medium' | 'low' = 'low';
          if (usage.usageCount >= 5) priority = 'high';
          else if (usage.usageCount >= 2) priority = 'medium';

          criticalIngredients.push({
            itemId: usage.itemId,
            itemName: usage.itemName,
            currentStock,
            unit: usage.unit,
            affectedMenuItems: usage.affectedMenuItems,
            priority
          });
        }
      }

      // Sort by priority and affected menu items count
      criticalIngredients.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.affectedMenuItems.length - a.affectedMenuItems.length;
      });

      return {
        criticalIngredients
      };

    } catch (error) {
      throw new AppError('Failed to get recipe ingredient low stock alerts', 500, error);
    }
  }

  /**
   * Update recipe costs when ingredient prices change
   * Recalculates total cost and cost per serving for all recipes
   */
  static async updateRecipeCosts(tenantId: string): Promise<{
    updated: number;
    costChanges: {
      recipeId: string;
      recipeName: string;
      oldTotalCost: number;
      newTotalCost: number;
      oldCostPerServing: number;
      newCostPerServing: number;
    }[];
  }> {
    try {
      const recipes = await prisma.recipe.findMany({
        where: {
          tenantId,
          isActive: true
        },
        include: {
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          menuItem: {
            select: {
              displayName: true
            }
          }
        }
      });

      let updated = 0;
      const costChanges = [];

      for (const recipe of recipes) {
        const oldTotalCost = Number(recipe.totalCost);
        const oldCostPerServing = Number(recipe.costPerServing);

        // Recalculate total cost from ingredients
        let newTotalCost = 0;
        for (const ingredient of recipe.ingredients) {
          const { calculateWeightedAverageCost } = await import('./inventoryService');
        const currentCost = await calculateWeightedAverageCost(ingredient.itemId, tenantId);
          const ingredientTotalCost = Number(ingredient.quantity) * currentCost;
          newTotalCost += ingredientTotalCost;
        }

        const newCostPerServing = recipe.yield > 0 ? newTotalCost / recipe.yield : newTotalCost;

        // Update recipe if costs changed
        if (Math.abs(newTotalCost - oldTotalCost) > 0.01) { // Allow for small rounding differences
          await prisma.recipe.update({
            where: { id: recipe.id },
            data: {
              totalCost: newTotalCost,
              costPerServing: newCostPerServing
            }
          });

          updated++;
          costChanges.push({
            recipeId: recipe.id,
            recipeName: recipe.menuItem?.displayName || 'Unknown Recipe',
            oldTotalCost,
            newTotalCost,
            oldCostPerServing,
            newCostPerServing
          });
        }
      }

      return {
        updated,
        costChanges
      };

    } catch (error) {
      throw new AppError('Failed to update recipe costs', 500, error);
    }
  }

  /**
   * Get comprehensive inventory integration status
   * Returns overall health of inventory-menu integration
   */
  static async getInventoryIntegrationStatus(tenantId: string): Promise<{
    totalMenuItems: number;
    availableMenuItems: number;
    unavailableMenuItems: number;
    itemsWithRecipes: number;
    itemsWithoutRecipes: number;
    lowStockIngredients: number;
    criticalStockIngredients: number;
    averageProfitMargin: number;
    lastUpdate: Date;
  }> {
    try {
      const [
        menuItems,
        recipes,
        lowStockAlerts,
        costUpdate
      ] = await Promise.all([
        prisma.menuItem.count({
          where: { tenantId, isActive: true }
        }),
        prisma.recipe.count({
          where: { tenantId, isActive: true }
        }),
        this.getRecipeIngredientLowStockAlerts(tenantId),
        this.updateRecipeCosts(tenantId)
      ]);

      const availableMenuItems = await prisma.menuItem.count({
        where: { tenantId, isActive: true, isAvailable: true }
      });

      const unavailableMenuItems = await prisma.menuItem.count({
        where: { tenantId, isActive: true, isAvailable: false }
      });

      const itemsWithRecipes = recipes;
      const itemsWithoutRecipes = menuItems - recipes;

      const lowStockIngredients = lowStockAlerts.criticalIngredients.filter(
        item => item.priority === 'low'
      ).length;

      const criticalStockIngredients = lowStockAlerts.criticalIngredients.filter(
        item => item.priority === 'high'
      ).length;

      // Calculate average profit margin (simplified)
      const recipesWithCosts = await prisma.recipe.findMany({
        where: { tenantId, isActive: true },
        include: {
          menuItem: {
            select: {
              menuPrice: true
            }
          }
        }
      });

      let totalProfitMargin = 0;
      let validRecipes = 0;

      for (const recipe of recipesWithCosts) {
        const menuPrice = Number(recipe.menuItem?.menuPrice || 0);
        const costPerServing = Number(recipe.costPerServing);
        
        if (menuPrice > 0 && costPerServing > 0) {
          const profitMargin = ((menuPrice - costPerServing) / menuPrice) * 100;
          totalProfitMargin += profitMargin;
          validRecipes++;
        }
      }

      const averageProfitMargin = validRecipes > 0 ? totalProfitMargin / validRecipes : 0;

      return {
        totalMenuItems: menuItems,
        availableMenuItems,
        unavailableMenuItems,
        itemsWithRecipes,
        itemsWithoutRecipes,
        lowStockIngredients,
        criticalStockIngredients,
        averageProfitMargin,
        lastUpdate: new Date()
      };

    } catch (error) {
      throw new AppError('Failed to get inventory integration status', 500, error);
    }
  }
} 
