import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { OrderController } from '../controllers/orderController';
import { TableController } from '../controllers/tableController';
import { OrderBulkOperationsController } from '../controllers/orderBulkOperationsController';
import { TableBulkOperationsController } from '../controllers/tableBulkOperationsController';
import { PaymentController } from '../controllers/paymentController';
import { MenuController } from '../controllers/menuController';
import { RecipeController } from '../controllers/recipeController';
import { TableAnalyticsController } from '../controllers/tableAnalyticsController';
import { TableAdvancedAnalyticsController } from '../controllers/tableAdvancedAnalyticsController';
import { PrintController } from '../controllers/printController';
import { KitchenDisplayService } from '../services/kitchenDisplayService';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { OrderAccountingIntegrationService, RecipeRefundJournalEntry } from '../services/orderAccountingIntegrationService';
import { prisma } from '../services/dbService';
import { TablePerformanceController } from '../controllers/tablePerformanceController';
import { OrderingAnalyticsService } from '../services/orderingAnalyticsService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ===================== ORDER ROUTES =====================

/**
 * Order management endpoints
 */
router.post('/orders', OrderController.createOrder);
router.post('/orders/flexible', OrderController.createFlexibleOrder);
router.get('/orders', OrderController.getOrders);
router.get('/orders/today/summary', OrderController.getTodaysSummary);
router.get('/orders/active', OrderController.getActiveOrders);
router.get('/orders/statistics', OrderController.getOrderStatistics);
router.get('/orders/table/:tableId', OrderController.getOrdersByTable);
router.get('/orders/:id', OrderController.getOrderById);
router.get('/orders/:id/payment-history', OrderController.getPaymentHistory);
router.put('/orders/:id', OrderController.updateOrder);
router.patch('/orders/:id/status', OrderController.updateOrderStatus);
router.post('/orders/:id/complete', OrderController.completeOrder);
router.post('/orders/:id/cancel', OrderController.cancelOrder);
router.post('/orders/:id/duplicate', OrderController.duplicateOrder);
router.post('/orders/:id/add-items', OrderController.addItemsToOrder);
router.delete('/orders/:id/remove-items', OrderController.removeItemsFromOrder);
router.put('/orders/:id/update-quantities', OrderController.updateItemQuantities);
router.post('/orders/:id/process-payment', OrderController.processPayment);
router.get('/orders/profitability-report', OrderController.getProfitabilityReport);

// Order options endpoints
router.put('/orders/:orderId/options', OrderController.updateOrderOptions);
router.get('/orders/:orderId/calculation', OrderController.getOrderCalculation);
router.post('/orders/:orderId/apply-preset/:presetId', OrderController.applyPresetToOrder);

// Order item management
router.post('/orders/:id/items', OrderController.addItemsToOrder);
router.delete('/orders/:id/items/:itemId', OrderController.removeItemFromOrder);

// ===================== TABLE ROUTES =====================

/**
 * Table management endpoints
 */
router.post('/tables', TableController.createTable);
router.get('/tables', TableController.getTables);
router.get('/tables/layout', TableController.getTableLayout);
router.get('/tables/available', TableController.getAvailableTables);
router.get('/tables/:id', TableController.getTableById);
router.put('/tables/:id', TableController.updateTable);
router.delete('/tables/:id', TableController.deleteTable);
router.patch('/tables/:id/status', TableController.changeTableStatus);
router.post('/tables/:tableId/transfer', TableController.transferOrder);
router.post('/tables/:id/occupy', TableController.occupyTable);
router.post('/tables/:id/clear', TableController.clearTable);

// ===================== BULK OPERATIONS ROUTES =====================

/**
 * Bulk order operations endpoints
 */
router.post('/orders/bulk/status', OrderBulkOperationsController.bulkChangeStatus);

/**
 * Bulk table operations endpoints
 */
router.post('/tables/bulk/status', TableBulkOperationsController.bulkChangeStatus);
router.post('/tables/bulk/reservations', TableBulkOperationsController.bulkCreateReservations);
router.post('/tables/bulk/import', TableBulkOperationsController.importTables);
router.get('/tables/bulk/export', TableBulkOperationsController.exportTables);
router.get('/tables/bulk/templates', TableBulkOperationsController.getTableTemplates);
router.post('/tables/bulk/templates/:templateId', TableBulkOperationsController.createTablesFromTemplate);
router.get('/tables/:tableId/status-history', TableBulkOperationsController.getTableStatusHistory);

// ===================== RESERVATION ROUTES =====================

/**
 * Table reservation endpoints
 */
router.post('/tables/reservations', TableController.createReservation);
router.get('/tables/reservations', TableController.getReservations);
router.get('/tables/reservations/upcoming', TableController.getUpcomingReservations);
router.get('/tables/reservations/today', TableController.getTodaysReservations);
router.put('/tables/reservations/:id', TableController.updateReservation);
router.post('/tables/reservations/:id/cancel', TableController.cancelReservation);

// ===================== BUSINESS PRESETS ROUTES =====================

/**
 * Business presets endpoints
 */
router.get('/business/presets', OrderController.getBusinessPresets);
router.post('/business/presets', OrderController.createBusinessPreset);
router.put('/business/presets/:id', OrderController.updateBusinessPreset);
router.delete('/business/presets/:id', OrderController.deleteBusinessPreset);
router.get('/business/presets/default', OrderController.getDefaultPreset);

// ===================== PAYMENT ROUTES =====================

/**
 * Payment processing endpoints
 */
router.post('/payments/process', PaymentController.processPayment);
router.post('/payments/refund', PaymentController.processRefund);
router.post('/payments/validate', PaymentController.validatePayment);
router.get('/payments', PaymentController.getPayments);
router.get('/payments/daily-summary', PaymentController.getDailySalesSummary);
router.get('/payments/methods-breakdown', PaymentController.getPaymentMethodsBreakdown);
router.get('/payments/statistics', PaymentController.getPaymentStatistics);
router.get('/payments/pending', PaymentController.getPendingPayments);
router.get('/payments/failed', PaymentController.getFailedPayments);
router.get('/payments/cash-management', PaymentController.getCashManagementReport);
router.post('/payments/:id/retry', PaymentController.retryPayment);

// ===================== MENU ROUTES =====================

/**
 * Menu management endpoints
 */
// Categories
router.post('/menu/categories', MenuController.createCategory);
router.get('/menu/categories', MenuController.getCategories);
router.put('/menu/categories/:id', MenuController.updateCategory);
router.delete('/menu/categories/:id', MenuController.deleteCategory);

// Menu items
router.post('/menu/items', MenuController.createMenuItem);
router.get('/menu/items', MenuController.getMenuItems);
router.get('/menu/full', MenuController.getFullMenu);
router.get('/menu/featured', MenuController.getFeaturedItems);
router.get('/menu/new', MenuController.getNewItems);
router.get('/menu/search', MenuController.searchMenuItems);
router.get('/menu/out-of-stock', MenuController.getOutOfStockItems);

// ===================== PRINT ROUTES =====================
router.post('/print/receipt', PrintController.printReceipt);
router.get('/menu/statistics', MenuController.getMenuStatistics);
router.get('/menu/categories/:categoryId/items', MenuController.getItemsByCategory);
router.put('/menu/items/:id', MenuController.updateMenuItem);
router.delete('/menu/items/:id', MenuController.deleteMenuItem);
router.patch('/menu/items/:id/availability', MenuController.toggleItemAvailability);
router.post('/menu/items/bulk-availability', MenuController.bulkUpdateAvailability);

// Modifiers
router.post('/menu/items/:itemId/modifiers', MenuController.createModifier);

// ===================== RECIPE ROUTES =====================

/**
 * Recipe management endpoints
 */
// Recipe CRUD
router.post('/recipes', RecipeController.createRecipe);
router.get('/recipes', RecipeController.getRecipes);
router.get('/recipes/menu-item/:menuItemId', RecipeController.getRecipeByMenuItem);
router.put('/recipes/:id', RecipeController.updateRecipe);
router.delete('/recipes/:id', RecipeController.deleteRecipe);

// Recipe ingredients
router.post('/recipes/:id/ingredients', RecipeController.addIngredient);
router.get('/recipes/:id/ingredients', RecipeController.getRecipeIngredients);
router.put('/recipes/ingredients/:ingredientId', RecipeController.updateIngredient);
router.delete('/recipes/ingredients/:ingredientId', RecipeController.removeIngredient);

// Recipe analysis
router.get('/recipes/:id/cost-analysis', RecipeController.getRecipeCostAnalysis);

// Recipe price integration
router.post('/recipes/sync-prices', RecipeController.syncIngredientPrices);
router.get('/recipes/:id/price-analysis', RecipeController.getRecipePriceAnalysis);
router.put('/recipes/:recipeId/ingredients/:ingredientId/price', RecipeController.updateIngredientPrice);

// ===================== INVENTORY INTEGRATION ROUTES =====================

/**
 * Inventory integration endpoints for recipe-based stock management
 */
router.get('/inventory/stock-validation/:menuItemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const menuItemId = req.params.menuItemId;
    const { quantity = 1 } = req.query;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const validation = await OrderInventoryIntegrationService.validateRecipeStockAvailability(
      tenantId,
      menuItemId,
      Number(quantity)
    );

    res.json({
      success: true,
      data: validation,
      message: 'Stock validation completed'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/inventory/validate-order-stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { orderItems } = req.body;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    if (!orderItems || !Array.isArray(orderItems)) {
      throw new AppError('Order items array is required', 400);
    }

    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const validation = await OrderInventoryIntegrationService.validateOrderStockAvailability(
      tenantId,
      orderItems
    );

    res.json({
      success: true,
      data: validation,
      message: 'Order stock validation completed'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/inventory/update-menu-availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

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

router.get('/inventory/low-stock-alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    console.log(`🔍 Getting low stock alerts for tenant: ${tenantId}`);

    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const alerts = await OrderInventoryIntegrationService.getRecipeIngredientLowStockAlerts(tenantId);

    console.log('⚠️ Low stock alerts:', JSON.stringify(alerts, null, 2));

    const response = {
      success: true,
      data: alerts,
      message: 'Low stock alerts retrieved'
    };

    console.log('📤 Sending alerts response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('❌ Error in low stock alerts:', error);
    next(error);
  }
});

router.post('/inventory/update-recipe-costs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

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

router.get('/inventory/integration-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    console.log(`🔍 Getting inventory integration status for tenant: ${tenantId}`);

    const { OrderInventoryIntegrationService } = await import('../services/orderInventoryIntegrationService');
    const status = await OrderInventoryIntegrationService.getInventoryIntegrationStatus(tenantId);

    console.log('📦 Inventory integration status:', JSON.stringify(status, null, 2));

    const response = {
      success: true,
      data: status,
      message: 'Inventory integration status retrieved'
    };

    console.log('📤 Sending inventory response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('❌ Error in inventory integration status:', error);
    next(error);
  }
});

// ===================== ACCOUNTING INTEGRATION ROUTES =====================

// Calculate Iranian tax for order
router.post('/accounting/calculate-tax', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subtotal, vatRate = 9, incomeTaxRate = 0, municipalTaxRate = 0 } = req.body;
    
    if (!subtotal || subtotal <= 0) {
      return res.status(400).json({ error: 'Subtotal is required and must be positive' });
    }

    const taxCalculation = OrderAccountingIntegrationService.calculateIranianTax(
      subtotal,
      vatRate,
      incomeTaxRate,
      municipalTaxRate
    );

    res.json({
      success: true,
      data: taxCalculation
    });
  } catch (error) {
    next(error);
  }
});

// Get enhanced COGS breakdown for menu item
router.get('/accounting/cogs-breakdown/:menuItemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { menuItemId } = req.params;
    const { quantity = 1 } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' });
    }

    const cogsBreakdown = await OrderAccountingIntegrationService.getEnhancedCOGSBreakdown(
      tenantId,
      menuItemId,
      Number(quantity)
    );

    res.json({
      success: true,
      data: cogsBreakdown
    });
  } catch (error) {
    next(error);
  }
});

// Get profitability report
router.get('/accounting/profitability-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const report = await OrderAccountingIntegrationService.getRecipeProfitabilityReport(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// Process refund with accounting integration
router.post('/accounting/process-refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      originalOrderId,
      refundOrderId,
      refundAmount,
      refundTaxAmount,
      refundCOGS,
      refundReason,
      paymentMethod,
      refundItems
    } = req.body;
    const tenantId = req.user?.tenantId;
    const createdBy = req.user?.id;

    if (!tenantId || !createdBy) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!originalOrderId || !refundOrderId || !refundAmount || !refundReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const refundData: RecipeRefundJournalEntry = {
      originalOrderId,
      refundOrderId,
      refundAmount,
      refundTaxAmount: refundTaxAmount || 0,
      refundCOGS: refundCOGS || 0,
      refundReason,
      paymentMethod,
      refundItems: refundItems || []
    };

    const journalEntry = await OrderAccountingIntegrationService.generateRecipeRefundJournalEntry(
      tenantId,
      refundData,
      createdBy
    );

    res.json({
      success: true,
      data: {
        journalEntry,
        refundData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get accounting integration status
router.get('/accounting/integration-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' });
    }

    // Get recent orders for analysis
    const recentOrders = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
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
    let totalTax = 0;
    const menuItemCounts = new Map();

    for (const order of recentOrders) {
      totalRevenue += Number(order.totalAmount);
      totalTax += Number(order.taxAmount);

      for (const orderItem of order.items) {
        // Add null safety check for orderItem.item and its menuItems
        if (!orderItem.item || !orderItem.item.menuItems || orderItem.item.menuItems.length === 0) {
          continue; // Skip items without menu item association
        }
        
        const menuItem = orderItem.item.menuItems[0];
        if (menuItem && menuItem.recipe) {
          let itemCOGS = 0;
          for (const ingredient of menuItem.recipe.ingredients) {
            itemCOGS += Number(ingredient.totalCost) * orderItem.quantity;
          }
          totalCOGS += itemCOGS;

          // Track menu item usage
          const existing = menuItemCounts.get(menuItem.id) || 0;
          menuItemCounts.set(menuItem.id, existing + orderItem.quantity);
        }
      }
    }

    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const status = {
      totalOrders: recentOrders.length,
      totalRevenue,
      totalCOGS,
      totalTax,
      grossProfit,
      grossProfitMargin,
      averageOrderValue: recentOrders.length > 0 ? totalRevenue / recentOrders.length : 0,
      menuItemsWithRecipes: menuItemCounts.size,
      topMenuItems: Array.from(menuItemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// ===================== KITCHEN DISPLAY ROUTES =====================

/**
 * Kitchen display and workflow endpoints
 */
router.get('/kitchen/displays/:displayName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const displayName = req.params.displayName;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    if (!displayName) {
      throw new AppError('Display name is required', 400);
    }

    const orders = await KitchenDisplayService.getKitchenDisplayOrders(tenantId, displayName);

    res.json({
      success: true,
      data: orders,
      message: 'Kitchen display orders retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/kitchen/stations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    const stations = await KitchenDisplayService.getAllKitchenStations(tenantId);

    res.json({
      success: true,
      data: stations,
      message: 'Kitchen stations retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/kitchen/displays/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const kitchenDisplayId = req.params.id;
    const { status } = req.body;
    const updatedBy = req.user?.id;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    if (!kitchenDisplayId || !status) {
      throw new AppError('Kitchen display ID and status are required', 400);
    }

    const updatedDisplay = await KitchenDisplayService.updateKitchenDisplayStatus(
      tenantId,
      kitchenDisplayId,
      status,
      updatedBy
    );

    res.json({
      success: true,
      data: updatedDisplay,
      message: 'Kitchen display status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/kitchen/displays/:id/priority', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const kitchenDisplayId = req.params.id;
    const { priority, reason } = req.body;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    if (!kitchenDisplayId || priority === undefined) {
      throw new AppError('Kitchen display ID and priority are required', 400);
    }

    const updatedDisplay = await KitchenDisplayService.updateKitchenDisplayPriority(
      tenantId,
      kitchenDisplayId,
      priority,
      reason
    );

    res.json({
      success: true,
      data: updatedDisplay,
      message: 'Kitchen display priority updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/kitchen/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const metrics = await KitchenDisplayService.getKitchenPerformanceMetrics(
      tenantId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: metrics,
      message: 'Kitchen performance metrics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/kitchen/workload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    const workload = await KitchenDisplayService.getKitchenWorkload(tenantId);

    res.json({
      success: true,
      data: workload,
      message: 'Kitchen workload retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/kitchen/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    const dashboard = await KitchenDisplayService.getKitchenDashboard(tenantId);

    res.json({
      success: true,
      data: dashboard,
      message: 'Kitchen dashboard data retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ===================== POS SPECIFIC ROUTES =====================

/**
 * Point of Sale specific endpoints
 */
router.get('/pos/quick-items', MenuController.getFeaturedItems);

router.get('/pos/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    const categories = await MenuController.getCategories(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/pos/quick-order', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Quick order creation for POS with predefined items
    const result = await OrderController.createOrder(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ===================== ANALYTICS ROUTES =====================

/**
 * Sales analytics and reporting endpoints
 */
router.get('/analytics/sales-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Parse date range
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    console.log('📊 [ORDERING_ROUTES] Getting sales summary for tenant:', tenantId);
    console.log('📊 [ORDERING_ROUTES] Date range:', { startDate, endDate });

    // Get real sales analytics data
    const salesData = await OrderingAnalyticsService.getSalesSummary(tenantId, startDate, endDate);

    res.json({
      success: true,
      data: salesData,
      message: 'Sales analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/top-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // This would require analysis of order items
    // For now, return featured items as placeholder
    const result = await MenuController.getFeaturedItems(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/hourly-sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // This would be implemented with order data analysis
    res.json({
      success: true,
      data: [],
      message: 'Hourly sales data not yet implemented'
    });
  } catch (error) {
    next(error);
  }
});

// Customer Analytics endpoint
router.get('/analytics/customer-analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Parse date range
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    console.log('👥 [ORDERING_ROUTES] Getting customer analytics for tenant:', tenantId);
    console.log('👥 [ORDERING_ROUTES] Date range:', { startDate, endDate });

    // Get real customer analytics data
    const customerData = await OrderingAnalyticsService.getCustomerAnalytics(tenantId, startDate, endDate);

    res.json({
      success: true,
      data: customerData,
      message: 'Customer analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Kitchen Performance endpoint
router.get('/analytics/kitchen-performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Parse date range
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    console.log('👨‍🍳 [ORDERING_ROUTES] Getting kitchen performance for tenant:', tenantId);
    console.log('👨‍🍳 [ORDERING_ROUTES] Date range:', { startDate, endDate });

    // Get real kitchen performance data
    const kitchenData = await OrderingAnalyticsService.getKitchenPerformance(tenantId, startDate, endDate);

    res.json({
      success: true,
      data: kitchenData,
      message: 'Kitchen performance analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Table Utilization endpoint
router.get('/analytics/table-utilization', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Parse date range
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    console.log('🪑 [ORDERING_ROUTES] Getting table utilization for tenant:', tenantId);
    console.log('🪑 [ORDERING_ROUTES] Date range:', { startDate, endDate });

    // Get real table utilization data
    const tableData = await OrderingAnalyticsService.getTableUtilization(tenantId, startDate, endDate);

    res.json({
      success: true,
      data: tableData,
      message: 'Table utilization analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ===================== ANALYTICS EXPORT ROUTES =====================

/**
 * Export analytics data to CSV
 */
router.get('/analytics/export/csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Parse date range and data type
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const dataType = (req.query.dataType as string) || 'all';

    console.log('📄 [ORDERING_ROUTES] Exporting to CSV:', { tenantId, dataType, startDate, endDate });

    // Get CSV data
    const csvData = await OrderingAnalyticsService.exportToCSV(
      tenantId, 
      startDate, 
      endDate, 
      dataType as 'sales' | 'customers' | 'kitchen' | 'tables' | 'all'
    );

    // Set headers for CSV download
    const filename = `analytics-${dataType}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send('\ufeff' + csvData); // Add BOM for proper UTF-8 encoding
  } catch (error) {
    console.error('❌ [ORDERING_ROUTES] Error exporting to CSV:', error);
    next(error);
  }
});

/**
 * Export analytics data to JSON (for Excel conversion)
 */
router.get('/analytics/export/json', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Parse date range and data type
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const dataType = (req.query.dataType as string) || 'all';

    console.log('📊 [ORDERING_ROUTES] Exporting to JSON:', { tenantId, dataType, startDate, endDate });

    // Get JSON data
    const jsonData = await OrderingAnalyticsService.exportToJSON(
      tenantId, 
      startDate, 
      endDate, 
      dataType as 'sales' | 'customers' | 'kitchen' | 'tables' | 'all'
    );

    // Set headers for JSON download
    const filename = `analytics-${dataType}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.json(jsonData);
  } catch (error) {
    console.error('❌ [ORDERING_ROUTES] Error exporting to JSON:', error);
    next(error);
  }
});

// ===================== TABLE ANALYTICS ROUTES =====================

/**
 * Table analytics and reporting endpoints
 */
router.get('/tables/analytics/utilization', TableAnalyticsController.getTableUtilization);
router.get('/tables/analytics/peak-hours', TableAnalyticsController.getPeakHoursAnalysis);
router.get('/tables/analytics/revenue', TableAnalyticsController.getTableRevenueAnalysis);
router.get('/tables/analytics/capacity-optimization', TableAnalyticsController.getCapacityOptimization);
router.get('/tables/analytics/summary', TableAnalyticsController.getTableAnalyticsSummary);
router.get('/tables/analytics/performance', TableAnalyticsController.getTablePerformance);

// ===================== ADVANCED TABLE ANALYTICS ROUTES =====================

/**
 * Advanced table analytics and reporting endpoints
 */
router.get('/tables/advanced-analytics/performance', TableAdvancedAnalyticsController.getDetailedTablePerformance);
router.get('/tables/advanced-analytics/forecasts', TableAdvancedAnalyticsController.getPerformanceForecasts);
router.get('/tables/advanced-analytics/reservations', TableAdvancedAnalyticsController.getReservationAnalytics);
router.get('/tables/advanced-analytics/reservation-insights', TableAdvancedAnalyticsController.getReservationInsights);
router.get('/tables/advanced-analytics/customer-behavior', TableAdvancedAnalyticsController.getCustomerBehaviorInsights);
router.get('/tables/advanced-analytics/capacity-optimization', TableAdvancedAnalyticsController.getAdvancedCapacityOptimization);
router.get('/tables/advanced-analytics/staff-allocation', TableAdvancedAnalyticsController.getStaffAllocationRecommendations);
router.get('/tables/advanced-analytics/summary', TableAdvancedAnalyticsController.getAdvancedAnalyticsSummary);

// ===================== TABLE PERFORMANCE OPTIMIZATION ROUTES =====================

/**
 * Performance optimization endpoints
 */
router.get('/tables/performance/cache-stats', TablePerformanceController.getCacheStats);
router.post('/tables/performance/clear-cache', TablePerformanceController.clearCache);
router.get('/tables/performance/connection-status', TablePerformanceController.getConnectionStatus);
router.post('/tables/performance/optimize-queries', TablePerformanceController.optimizeQueries);
router.get('/tables/performance/recommendations', TablePerformanceController.getPerformanceRecommendations);
router.get('/tables/performance/health', TablePerformanceController.healthCheck);

// ===================== HEALTH CHECK ROUTES =====================

/**
 * System health and status endpoints
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      throw new AppError('Authentication required', 401);
    }

    // Basic health check for ordering system
    const [activeOrders, availableTables] = await Promise.all([
      OrderController.getActiveOrders(req, res, () => {}),
      TableController.getAvailableTables(req, res, () => {})
    ]);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          orders: 'operational',
          payments: 'operational',
          kitchen: 'operational',
          tables: 'operational',
          menu: 'operational'
        }
      },
      message: 'Ordering system is healthy'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 
