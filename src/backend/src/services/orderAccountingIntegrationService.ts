import { PrismaClient, PaymentMethod } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
import { JournalEntryService, JournalEntryLineData } from './journalEntryService';
import { OrderInventoryIntegrationService } from './orderInventoryIntegrationService';

const prisma = new PrismaClient();

export interface RecipeOrderJournalEntry {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalCOGS: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  menuItems: {
    menuItemId: string;
    displayName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    recipeCosts: {
      ingredientId: string;
      ingredientName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[];
    totalRecipeCost: number;
    profitMargin: number;
  }[];
}

export interface RecipeRefundJournalEntry {
  originalOrderId: string;
  refundOrderId: string;
  refundAmount: number;
  refundTaxAmount: number;
  refundCOGS: number;
  refundReason: string;
  paymentMethod: PaymentMethod;
  refundItems: {
    menuItemId: string;
    displayName: string;
    refundQuantity: number;
    unitPrice: number;
    refundAmount: number;
    refundCOGS: number;
  }[];
}

export interface RecipeProfitabilityReport {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  menuItemPerformance: {
    menuItemId: string;
    displayName: string;
    quantitySold: number;
    revenue: number;
    cogs: number;
    profit: number;
    profitMargin: number;
    topIngredients: {
      itemId: string;
      itemName: string;
      totalUsed: number;
      totalCost: number;
    }[];
  }[];
}

export interface IranianTaxCalculation {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  incomeTaxRate: number;
  incomeTaxAmount: number;
  municipalTaxRate: number;
  municipalTaxAmount: number;
  totalTaxAmount: number;
  netAmount: number;
}

export interface EnhancedCOGSBreakdown {
  menuItemId: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  ingredientCosts: {
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    costPercentage: number;
  }[];
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  costVariance: number;
}

/**
 * Order-Accounting Integration Service
 * Service for integrating ordering system with accounting system
 * specifically for recipe-based COGS and journal entries
 */
export class OrderAccountingIntegrationService {

  /**
   * Calculate Iranian tax components
   * محاسبه مالیات‌های ایرانی
   */
  static calculateIranianTax(
    subtotal: number,
    vatRate: number = 9, // 9% VAT
    incomeTaxRate: number = 0, // 0% for food services
    municipalTaxRate: number = 0 // 0% for food services
  ): IranianTaxCalculation {
    const vatAmount = subtotal * (vatRate / 100);
    const incomeTaxAmount = subtotal * (incomeTaxRate / 100);
    const municipalTaxAmount = subtotal * (municipalTaxRate / 100);
    const totalTaxAmount = vatAmount + incomeTaxAmount + municipalTaxAmount;
    const netAmount = subtotal + totalTaxAmount;

    return {
      subtotal,
      vatRate,
      vatAmount,
      incomeTaxRate,
      incomeTaxAmount,
      municipalTaxRate,
      municipalTaxAmount,
      totalTaxAmount,
      netAmount
    };
  }

  /**
   * Generate comprehensive journal entry for order with recipe-based COGS
   * Creates multi-line journal entry with detailed ingredient cost breakdown
   */
  static async generateRecipeOrderJournalEntry(
    tenantId: string,
    orderData: RecipeOrderJournalEntry,
    createdBy: string
  ) {
    try {
      const lines: JournalEntryLineData[] = [];

      // === DEBIT SIDE ===
      
      // 1. Debit: Cash/Bank/Accounts Receivable (based on payment method)
      const cashAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '1101' // صندوق
        }
      });

      const bankAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '1102' // بانک
        }
      });

      const accountsReceivableAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '1201' // حساب‌های دریافتنی
        }
      });

      let debitAccountId = cashAccount?.id;
      if (orderData.paymentMethod === 'ONLINE') {
        debitAccountId = bankAccount?.id;
      } else if (orderData.paymentMethod === 'POINTS') {
        debitAccountId = accountsReceivableAccount?.id;
      }

      if (debitAccountId) {
        lines.push({
          accountId: debitAccountId,
          description: `فروش سفارش ${orderData.orderNumber}`,
          debitAmount: orderData.totalAmount,
          creditAmount: 0
        });
      }

      // 2. Debit: COGS (Cost of Goods Sold)
      const cogsAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '5101' // بهای تمام شده کالای فروش رفته
        }
      });

      if (cogsAccount && orderData.totalCOGS > 0) {
        lines.push({
          accountId: cogsAccount.id,
          description: `بهای تمام شده سفارش ${orderData.orderNumber}`,
          debitAmount: orderData.totalCOGS,
          creditAmount: 0
        });
      }

      // === CREDIT SIDE ===

      // 3. Credit: Sales Revenue
      const salesAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '4101' // درآمد فروش
        }
      });

      if (salesAccount) {
        lines.push({
          accountId: salesAccount.id,
          description: `درآمد فروش سفارش ${orderData.orderNumber}`,
          debitAmount: 0,
          creditAmount: orderData.totalAmount - orderData.taxAmount
        });
      }

      // 4. Credit: VAT Payable
      if (orderData.taxAmount > 0) {
        const vatAccount = await prisma.chartOfAccount.findFirst({
          where: {
            accountCode: '2201' // مالیات بر ارزش افزوده
          }
        });

        if (vatAccount) {
          lines.push({
            accountId: vatAccount.id,
            description: `مالیات بر ارزش افزوده سفارش ${orderData.orderNumber}`,
            debitAmount: 0,
            creditAmount: orderData.taxAmount
          });
        }
      }

      // 5. Credit: Inventory (for COGS)
      const inventoryAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '1301' // موجودی کالا
        }
      });

      if (inventoryAccount && orderData.totalCOGS > 0) {
        lines.push({
          accountId: inventoryAccount.id,
          description: `کاهش موجودی سفارش ${orderData.orderNumber}`,
          debitAmount: 0,
          creditAmount: orderData.totalCOGS
        });
      }

      // Safety: if we don't have enough lines (missing COA setup), skip journal creation gracefully
      if (lines.length < 2) {
        return {
          id: 'SKIPPED',
          lines: [],
          note: 'Journal skipped: insufficient chart of accounts, less than 2 lines',
          orderId: orderData.orderId
        } as any;
      }

      // Create journal entry
      const journalEntry = await JournalEntryService.createJournalEntry({
        entryDate: new Date(),
        description: `فروش سفارش ${orderData.orderNumber} - سیستم سفارش‌گیری`,
        reference: orderData.orderNumber,
        sourceType: 'POS',
        sourceId: orderData.orderId,
        lines,
        tenantId
      }, createdBy, tenantId);

      // Post the journal entry
      await JournalEntryService.postJournalEntry(journalEntry.id, createdBy);

      return journalEntry;

    } catch (error) {
      throw new AppError('Failed to generate recipe order journal entry', 500, error);
    }
  }

  /**
   * Generate refund journal entry with proper reversals
   * Creates reversal entries for refunds with COGS adjustments
   */
  static async generateRecipeRefundJournalEntry(
    tenantId: string,
    refundData: RecipeRefundJournalEntry,
    createdBy: string
  ) {
    try {
      const lines: JournalEntryLineData[] = [];

      // === DEBIT SIDE ===

      // 1. Debit: Sales Revenue (reversal)
      const salesAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '4101' // درآمد فروش
        }
      });

      if (salesAccount) {
        lines.push({
          accountId: salesAccount.id,
          description: `بازگشت درآمد سفارش ${refundData.originalOrderId}`,
          debitAmount: refundData.refundAmount - refundData.refundTaxAmount,
          creditAmount: 0
        });
      }

      // 2. Debit: VAT Payable (reversal)
      if (refundData.refundTaxAmount > 0) {
        const vatAccount = await prisma.chartOfAccount.findFirst({
          where: {
            accountCode: '2201' // مالیات بر ارزش افزوده
          }
        });

        if (vatAccount) {
          lines.push({
            accountId: vatAccount.id,
            description: `بازگشت مالیات سفارش ${refundData.originalOrderId}`,
            debitAmount: refundData.refundTaxAmount,
            creditAmount: 0
          });
        }
      }

      // === CREDIT SIDE ===

      // 3. Credit: Cash/Bank/Accounts Receivable (refund payment)
      const cashAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '1101' // صندوق
        }
      });

      const bankAccount = await prisma.chartOfAccount.findFirst({
        where: {
          accountCode: '1102' // بانک
        }
      });

      let creditAccountId = cashAccount?.id;
      if (refundData.paymentMethod === 'ONLINE') {
        creditAccountId = bankAccount?.id;
      }

      if (creditAccountId) {
        lines.push({
          accountId: creditAccountId,
          description: `بازپرداخت سفارش ${refundData.originalOrderId}`,
          debitAmount: 0,
          creditAmount: refundData.refundAmount
        });
      }

      // 4. Credit: COGS (reversal for returned items)
      if (refundData.refundCOGS > 0) {
        const cogsAccount = await prisma.chartOfAccount.findFirst({
          where: {
            accountCode: '5101' // بهای تمام شده کالای فروش رفته
          }
        });

        if (cogsAccount) {
          lines.push({
            accountId: cogsAccount.id,
            description: `بازگشت بهای تمام شده سفارش ${refundData.originalOrderId}`,
            debitAmount: 0,
            creditAmount: refundData.refundCOGS
          });
        }
      }

      // 5. Debit: Inventory (restore inventory for returned items)
      if (refundData.refundCOGS > 0) {
        const inventoryAccount = await prisma.chartOfAccount.findFirst({
          where: {
            accountCode: '1301' // موجودی کالا
          }
        });

        if (inventoryAccount) {
          lines.push({
            accountId: inventoryAccount.id,
            description: `بازگردانی موجودی سفارش ${refundData.originalOrderId}`,
            debitAmount: refundData.refundCOGS,
            creditAmount: 0
          });
        }
      }

      // Create journal entry
      const journalEntry = await JournalEntryService.createJournalEntry({
        entryDate: new Date(),
        description: `بازگشت سفارش ${refundData.originalOrderId} - دلیل: ${refundData.refundReason}`,
        reference: refundData.refundOrderId,
        sourceType: 'POS',
        sourceId: refundData.refundOrderId,
        lines,
        tenantId
      }, createdBy, tenantId);

      // Post the journal entry
      await JournalEntryService.postJournalEntry(journalEntry.id, createdBy);

      return journalEntry;

    } catch (error) {
      throw new AppError('Failed to generate recipe refund journal entry', 500, error);
    }
  }

  /**
   * Generate comprehensive profitability report with recipe analysis
   * Provides detailed profit analysis with ingredient cost breakdown
   */
  static async getRecipeProfitabilityReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RecipeProfitabilityReport> {
    try {
      // Get completed orders in date range
      const orders = await prisma.order.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: {
            include: {
              item: {
                include: {
                  menuItems: {
                    where: { isActive: true },
                    include: {
                      recipe: {
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
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      let totalRevenue = 0;
      let totalCOGS = 0;
      const menuItemPerformance = new Map();

      // Process each order
      for (const order of orders) {
        totalRevenue += Number(order.totalAmount);

        for (const orderItem of order.items) {
          // Add null safety check for orderItem.item and its menuItems
          if (!orderItem.item || !orderItem.item.menuItems || orderItem.item.menuItems.length === 0) {
            continue; // Skip items without menu item association
          }
          
          const menuItem = orderItem.item.menuItems[0];
          if (!menuItem) continue;

          const menuItemId = menuItem.id;
          const displayName = menuItem.displayName;
          const quantity = orderItem.quantity;
          const unitPrice = Number(orderItem.unitPrice);
          const totalPrice = quantity * unitPrice;

          // Calculate COGS for this menu item
          let itemCOGS = 0;
          const ingredientCosts = new Map();

          if (menuItem.recipe && menuItem.recipe.ingredients) {
            for (const ingredient of menuItem.recipe.ingredients) {
              const ingredientCost = Number(ingredient.totalCost) * quantity;
              itemCOGS += ingredientCost;

              // Track ingredient usage
              const existing = ingredientCosts.get(ingredient.itemId) || {
                itemId: ingredient.itemId,
                itemName: ingredient.item?.name || 'Unknown',
                totalUsed: 0,
                totalCost: 0
              };

              existing.totalUsed += Number(ingredient.quantity) * quantity;
              existing.totalCost += ingredientCost;
              ingredientCosts.set(ingredient.itemId, existing);
            }
          }

          totalCOGS += itemCOGS;

          // Track menu item performance
          const existing = menuItemPerformance.get(menuItemId) || {
            menuItemId,
            displayName,
            quantitySold: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
            topIngredients: []
          };

          existing.quantitySold += quantity;
          existing.revenue += totalPrice;
          existing.cogs += itemCOGS;
          existing.profit = existing.revenue - existing.cogs;

          // Update ingredient tracking
          for (const [ingredientId, ingredientData] of Array.from(ingredientCosts.entries())) {
            const existingIngredient = existing.topIngredients.find(
              (ing: any) => ing.itemId === ingredientId
            );

            if (existingIngredient) {
              existingIngredient.totalUsed += ingredientData.totalUsed;
              existingIngredient.totalCost += ingredientData.totalCost;
            } else {
              existing.topIngredients.push(ingredientData);
            }
          }

          menuItemPerformance.set(menuItemId, existing);
        }
      }

      // Calculate profit margins
      const grossProfit = totalRevenue - totalCOGS;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Convert map to array and calculate profit margins
      const menuItemArray = Array.from(menuItemPerformance.values()).map(item => ({
        ...item,
        profitMargin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
        topIngredients: item.topIngredients
          .sort((a: any, b: any) => b.totalCost - a.totalCost)
          .slice(0, 5) // Top 5 ingredients by cost
      }));

      return {
        dateRange: { startDate, endDate },
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossProfitMargin,
        menuItemPerformance: menuItemArray
      };

    } catch (error) {
      throw new AppError('Failed to generate recipe profitability report', 500, error);
    }
  }

  /**
   * Get enhanced COGS breakdown for menu items
   * Provides detailed cost analysis with ingredient breakdown
   */
  static async getEnhancedCOGSBreakdown(
    tenantId: string,
    menuItemId: string,
    quantity: number = 1
  ): Promise<EnhancedCOGSBreakdown> {
    try {
      // Get menu item with recipe
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: menuItemId,
          tenantId,
          isActive: true
        },
        include: {
          recipe: {
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
              }
            }
          }
        }
      });

      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }

      const unitPrice = Number(menuItem.menuPrice);
      const totalRevenue = unitPrice * quantity;
      let totalCOGS = 0;
      const ingredientCosts = [];

      // Calculate ingredient costs
      if (menuItem.recipe && menuItem.recipe.ingredients) {
        for (const ingredient of menuItem.recipe.ingredients) {
          const ingredientQuantity = Number(ingredient.quantity) * quantity;
          const unitCost = Number(ingredient.unitCost);
          const totalCost = ingredientQuantity * unitCost;
          const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

          totalCOGS += totalCost;

          ingredientCosts.push({
            itemId: ingredient.itemId,
            itemName: ingredient.item?.name || 'Unknown Item',
            quantity: ingredientQuantity,
            unitCost,
            totalCost,
            costPercentage
          });
        }
      }

      const grossProfit = totalRevenue - totalCOGS;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Calculate cost variance (actual vs standard)
      const standardCost = menuItem.recipe ? Number(menuItem.recipe.totalCost) * quantity : 0;
      const costVariance = totalCOGS - standardCost;

      return {
        menuItemId: menuItem.id,
        displayName: menuItem.displayName,
        quantity,
        unitPrice,
        totalRevenue,
        ingredientCosts,
        totalCOGS,
        grossProfit,
        grossProfitMargin,
        costVariance
      };

    } catch (error) {
      throw new AppError('Failed to get enhanced COGS breakdown', 500, error);
    }
  }

  /**
   * Process order completion with enhanced accounting integration
   * Generates journal entries with recipe-based COGS and tax calculations
   */
  static async processOrderCompletion(
    tenantId: string,
    orderId: string,
    completedBy: string
  ): Promise<{
    journalEntry: any;
    stockDeductions: any[];
    totalCOGS: number;
    totalProfit: number;
    taxCalculation: IranianTaxCalculation;
  }> {
    try {
      // Temporary config toggle (future: tenant setting)
      const inventoryDeductionMode: 'ON_COMPLETION' | 'DISABLED' = 'ON_COMPLETION';

      // Get order details
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          items: {
            include: {
              item: {
                include: {
                  menuItems: {
                    where: { isActive: true },
                    include: {
                      recipe: {
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
                          }
                        }
                      }
                    }
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

      // 1. Process stock deductions (if enabled)
      const stockDeductions = inventoryDeductionMode === 'ON_COMPLETION'
        ? await OrderInventoryIntegrationService.processRecipeStockDeduction(
            tenantId,
            orderId,
            completedBy
          )
        : [];

      // 2. Calculate COGS and prepare journal entry data
      const orderItems = order.items.map(item => {
        // Add null safety check for item.item and its menuItems
        if (!item.item || !item.item.menuItems || item.item.menuItems.length === 0) {
          return null; // Will be filtered out
        }
        
        const menuItem = item.item.menuItems[0];
        return {
          menuItemId: menuItem?.id || '',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          recipe: menuItem?.recipe ? {
            id: menuItem.recipe.id,
            ingredients: menuItem.recipe.ingredients.map(ingredient => ({
              itemId: ingredient.itemId,
              itemName: ingredient.item?.name || 'Unknown Item',
              quantity: Number(ingredient.quantity),
              unit: ingredient.unit,
              unitCost: Number(ingredient.unitCost),
              totalCost: Number(ingredient.totalCost),
              isOptional: ingredient.isOptional
            }))
          } : undefined
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null && Boolean(item.menuItemId));

      const cogsCalculation = await OrderInventoryIntegrationService.calculateOrderCOGS(
        tenantId,
        orderItems as any
      );

      // 3. Calculate Iranian taxes
      const subtotal = Number(order.totalAmount) - Number(order.taxAmount);
      const taxCalculation = this.calculateIranianTax(subtotal);

      // 4. Prepare journal entry data
      const journalEntryData: RecipeOrderJournalEntry = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        taxAmount: taxCalculation.totalTaxAmount,
        serviceCharge: Number(order.serviceCharge),
        totalCOGS: cogsCalculation.totalCOGS,
        paymentMethod: order.paymentMethod as PaymentMethod,
        customerId: order.customerId || undefined,
        menuItems: cogsCalculation.itemBreakdown.map(item => ({
          menuItemId: item.menuItemId,
          displayName: 'Menu Item', // Simplified for now - could be enhanced to get actual display name
          quantity: item.quantity,
          unitPrice: item.quantity > 0 ? item.totalCOGS / item.quantity : 0,
          totalPrice: orderItems.find(oi => oi.menuItemId === item.menuItemId)?.unitPrice || 0,
          recipeCosts: item.ingredientCosts.map(ic => ({
            ingredientId: ic.itemId,
            ingredientName: ic.itemName,
            quantity: ic.quantity,
            unitCost: ic.unitCost,
            totalCost: ic.totalCost
          })),
          totalRecipeCost: item.totalCOGS,
          profitMargin: (orderItems.find(oi => oi.menuItemId === item.menuItemId)?.unitPrice || 0) - item.unitCOGS
        }))
      };

      // 5. Generate journal entry
      const journalEntry = await this.generateRecipeOrderJournalEntry(
        tenantId,
        journalEntryData,
        completedBy
      );

      const totalProfit = Number(order.totalAmount) - cogsCalculation.totalCOGS;

      return {
        journalEntry,
        stockDeductions,
        totalCOGS: cogsCalculation.totalCOGS,
        totalProfit,
        taxCalculation
      };

    } catch (error) {
      throw new AppError('Failed to process order completion', 500, error);
    }
  }
} 
