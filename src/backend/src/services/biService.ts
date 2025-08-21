import { PrismaClient } from '../../shared/generated/client';
import { KPIMetric, DateRange, ExecutiveDashboard, ABCAnalysis, TrendAnalysis, ProfitAnalysis } from '../types/bi';

const prisma = new PrismaClient();

export class BiService {
  // =================== KPI CALCULATIONS ===================

  /**
   * محاسبه درآمد کل برای دوره مشخص
   */
  static async calculateTotalRevenue(period: DateRange, tenantId: string): Promise<KPIMetric> {
    try {
      const currentRevenue = await this.getRevenueForPeriod(period, tenantId);
      const previousPeriod = this.getPreviousPeriod(period);
      const previousRevenue = await this.getRevenueForPeriod(previousPeriod, tenantId);

      const change = currentRevenue - previousRevenue;
      const changePercent = previousRevenue > 0 ? (change / previousRevenue) * 100 : 0;

      return {
        value: currentRevenue,
        previousValue: previousRevenue,
        change,
        changePercent,
        trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
        unit: 'تومان',
        description: 'مجموع درآمد از فروش',
        status: this.determineStatusByGrowth(changePercent, 5, 0), // 5% growth target
        target: previousRevenue * 1.05 // 5% growth target
      };
    } catch (error) {
      throw new Error(`خطا در محاسبه درآمد کل: ${(error as Error).message}`);
    }
  }

  /**
   * محاسبه سود خالص
   */
  static async calculateNetProfit(period: DateRange, tenantId: string): Promise<KPIMetric> {
    try {
      const revenue = await this.getRevenueForPeriod(period, tenantId);
      const costs = await this.getTotalCostsForPeriod(period, tenantId);
      const netProfit = revenue - costs;

      const previousPeriod = this.getPreviousPeriod(period);
      const previousRevenue = await this.getRevenueForPeriod(previousPeriod, tenantId);
      const previousCosts = await this.getTotalCostsForPeriod(previousPeriod, tenantId);
      const previousProfit = previousRevenue - previousCosts;

      const change = netProfit - previousProfit;
      const changePercent = previousProfit > 0 ? (change / previousProfit) * 100 : 0;

      return {
        value: netProfit,
        previousValue: previousProfit,
        change,
        changePercent,
        trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
        unit: 'تومان',
        description: 'سود خالص پس از کسر تمام هزینه‌ها',
        status: this.determineStatusByValue(netProfit, previousProfit * 1.1, previousProfit * 1.05)
      };
    } catch (error) {
      throw new Error(`خطا در محاسبه سود خالص: ${(error as Error).message}`);
    }
  }

  /**
   * محاسبه حاشیه سود
   */
  static async calculateProfitMargin(period: DateRange, tenantId: string): Promise<KPIMetric> {
    try {
      const revenue = await this.getRevenueForPeriod(period, tenantId);
      const costs = await this.getTotalCostsForPeriod(period, tenantId);
      const netProfit = revenue - costs;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      const previousPeriod = this.getPreviousPeriod(period);
      const previousRevenue = await this.getRevenueForPeriod(previousPeriod, tenantId);
      const previousCosts = await this.getTotalCostsForPeriod(previousPeriod, tenantId);
      const previousMargin = previousRevenue > 0 ? ((previousRevenue - previousCosts) / previousRevenue) * 100 : 0;

      const change = margin - previousMargin;
      const changePercent = previousMargin > 0 ? (change / previousMargin) * 100 : 0;

      return {
        value: margin,
        previousValue: previousMargin,
        change,
        changePercent,
        trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
        unit: 'درصد',
        description: 'درصد سود نسبت به فروش',
        target: 15, // هدف 15% حاشیه سود
        status: margin >= 15 ? 'GOOD' : margin >= 10 ? 'WARNING' : 'CRITICAL'
      };
    } catch (error) {
      throw new Error(`خطا در محاسبه حاشیه سود: ${(error as Error).message}`);
    }
  }

  /**
   * محاسبه گردش موجودی
   */
  static async calculateInventoryTurnover(period: DateRange, tenantId: string): Promise<KPIMetric> {
    try {
      const cogs = await this.getCostOfGoodsSold(period, tenantId);
      const avgInventory = await this.getAverageInventoryValue(period, tenantId);
      const turnover = avgInventory > 0 ? cogs / avgInventory : 0;

      const previousPeriod = this.getPreviousPeriod(period);
      const previousCogs = await this.getCostOfGoodsSold(previousPeriod, tenantId);
      const previousAvgInventory = await this.getAverageInventoryValue(previousPeriod, tenantId);
      const previousTurnover = previousAvgInventory > 0 ? previousCogs / previousAvgInventory : 0;

      const change = turnover - previousTurnover;
      const changePercent = previousTurnover > 0 ? (change / previousTurnover) * 100 : 0;

      return {
        value: turnover,
        previousValue: previousTurnover,
        change,
        changePercent,
        trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
        unit: 'بار در سال',
        description: 'تعداد دفعات گردش موجودی در سال',
        target: 12, // هدف 12 بار در سال (ماهانه)
        status: turnover >= 12 ? 'GOOD' : turnover >= 8 ? 'WARNING' : 'CRITICAL'
      };
    } catch (error) {
      throw new Error(`خطا در محاسبه گردش موجودی: ${(error as Error).message}`);
    }
  }

  /**
   * محاسبه میانگین ارزش سفارش (AOV)
   */
  static async calculateAverageOrderValue(period: DateRange, tenantId: string): Promise<KPIMetric> {
    try {
      const transactions = await prisma.inventoryEntry.findMany({
        where: {
          type: 'OUT',
          createdAt: {
            gte: period.start,
            lte: period.end
          },
          item: {
            tenantId: tenantId // CRITICAL: Add tenant filtering
          }
        }
      });

      const totalRevenue = transactions.reduce((sum, t) => sum + (t.quantity * (t.unitPrice || 0)), 0);
      const orderCount = transactions.length;
      const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

      const previousPeriod = this.getPreviousPeriod(period);
      const previousTransactions = await prisma.inventoryEntry.findMany({
        where: {
          type: 'OUT',
          createdAt: {
            gte: previousPeriod.start,
            lte: previousPeriod.end
          },
          item: {
            tenantId: tenantId // CRITICAL: Add tenant filtering
          }
        }
      });

      const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.quantity * (t.unitPrice || 0)), 0);
      const previousOrderCount = previousTransactions.length;
      const previousAov = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

      const change = aov - previousAov;
      const changePercent = previousAov > 0 ? (change / previousAov) * 100 : 0;

      return {
        value: aov,
        previousValue: previousAov,
        change,
        changePercent,
        trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
        unit: 'تومان',
        description: 'میانگین مبلغ هر تراکنش',
        target: 50000, // هدف 50 هزار تومان
        status: aov >= 50000 ? 'GOOD' : aov >= 35000 ? 'WARNING' : 'CRITICAL'
      };
    } catch (error) {
      throw new Error(`خطا در محاسبه میانگین ارزش سفارش: ${(error as Error).message}`);
    }
  }

  /**
   * محاسبه نرخ کمبود موجودی
   */
  static async calculateStockoutRate(period: DateRange, tenantId: string): Promise<KPIMetric> {
    try {
      const totalItems = await prisma.item.count({ where: { isActive: true } });
      
      // کالاهایی که در دوره موجودی آنها به صفر رسیده
      const stockoutItems = await prisma.item.findMany({
        where: {
          isActive: true,
          inventoryEntries: {
            some: {
              createdAt: {
                gte: period.start,
                lte: period.end
              }
            }
          },
          tenantId: tenantId // CRITICAL: Add tenant filtering
        },
        include: {
          inventoryEntries: {
            where: {
              createdAt: {
                gte: period.start,
                lte: period.end
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // محاسبه موجودی فعلی هر کالا و بررسی صفر بودن
      const stockoutCount = stockoutItems.filter(item => {
        const currentStock = this.calculateCurrentStock(item.inventoryEntries);
        return currentStock <= 0;
      }).length;

      const stockoutRate = totalItems > 0 ? (stockoutCount / totalItems) * 100 : 0;

      const previousPeriod = this.getPreviousPeriod(period);
      const previousStockoutRate = await this.calculateStockoutRateForPeriod(previousPeriod);

      const change = stockoutRate - previousStockoutRate;
      const changePercent = previousStockoutRate > 0 ? (change / previousStockoutRate) * 100 : 0;

      return {
        value: stockoutRate,
        previousValue: previousStockoutRate,
        change,
        changePercent,
        trend: change < 0 ? 'UP' : change > 0 ? 'DOWN' : 'STABLE', // کمتر بودن بهتر است
        unit: 'درصد',
        description: 'درصد کالاهایی که موجودی آنها به اتمام رسیده',
        target: 5, // حداکثر 5% قابل قبول
        status: stockoutRate <= 5 ? 'GOOD' : stockoutRate <= 10 ? 'WARNING' : 'CRITICAL'
      };
    } catch (error) {
      throw new Error(`خطا در محاسبه نرخ کمبود موجودی: ${(error as Error).message}`);
    }
  }

  // =================== ANALYTICS FUNCTIONS ===================

  /**
   * دریافت خلاصه آمار تحلیلی
   */
  static async getAnalyticsSummary(tenantId: string): Promise<{
    totalItems: number;
    lowStockCount: number;
    recentTransactions: number;
    totalInventoryValue: number;
  }> {
    try {
      // Get total active items
      const totalItems = await prisma.item.count({
        where: {
          isActive: true,
          tenantId: tenantId
        }
      });

      // Get low stock items (below minimum stock)
      // We need to calculate current stock from inventory entries
      const itemsWithStock = await prisma.item.findMany({
        where: {
          isActive: true,
          tenantId: tenantId,
          minStock: {
            not: null
          }
        },
        select: {
          id: true,
          minStock: true,
          inventoryEntries: {
            select: {
              quantity: true,
              type: true
            }
          }
        }
      });

      let lowStockCount = 0;
      for (const item of itemsWithStock) {
        let currentStock = 0;
        for (const entry of item.inventoryEntries) {
          if (entry.type === 'IN') {
            currentStock += entry.quantity;
          } else if (entry.type === 'OUT') {
            currentStock -= entry.quantity;
          }
        }
        if (currentStock <= (item.minStock || 0)) {
          lowStockCount++;
        }
      }

      // Get recent transactions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentTransactions = await prisma.inventoryEntry.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          tenantId: tenantId
        }
      });

      // Calculate total inventory value
      const inventoryItems = await prisma.inventoryEntry.findMany({
        where: {
          tenantId: tenantId
        },
        select: {
          quantity: true,
          type: true,
          unitPrice: true,
          item: {
            select: {
              name: true
            }
          }
        }
      });

      let totalInventoryValue = 0;
      const itemStockMap = new Map<string, number>();

      // Calculate current stock for each item
      for (const entry of inventoryItems) {
        const currentStock = itemStockMap.get(entry.item.name) || 0;
        if (entry.type === 'IN') {
          itemStockMap.set(entry.item.name, currentStock + entry.quantity);
        } else if (entry.type === 'OUT') {
          itemStockMap.set(entry.item.name, Math.max(0, currentStock - entry.quantity));
        }
      }

      // Calculate total value
      for (const [itemName, stock] of itemStockMap) {
        const itemEntries = inventoryItems.filter(e => e.item.name === itemName);
        const avgUnitPrice = itemEntries.reduce((sum, e) => sum + (e.unitPrice || 0), 0) / itemEntries.length;
        totalInventoryValue += stock * avgUnitPrice;
      }

      return {
        totalItems,
        lowStockCount,
        recentTransactions,
        totalInventoryValue: Math.round(totalInventoryValue)
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      // Return fallback data if there's an error
      return {
        totalItems: 0,
        lowStockCount: 0,
        recentTransactions: 0,
        totalInventoryValue: 0
      };
    }
  }

  /**
   * تحلیل ABC محصولات
   */
  static async performABCAnalysis(period: DateRange, tenantId: string): Promise<ABCAnalysis> {
    try {
      const products = await prisma.item.findMany({
        where: { 
          isActive: true,
          tenantId: tenantId // CRITICAL: Add tenant filtering
        },
        include: {
          inventoryEntries: {
            where: {
              type: 'OUT',
              createdAt: {
                gte: period.start,
                lte: period.end
              }
            }
          }
        }
      });

      // محاسبه فروش هر محصول
      const productsWithSales = products.map(product => {
        const totalSales = product.inventoryEntries.reduce(
          (sum, entry) => sum + (entry.quantity * (entry.unitPrice || 0)), 
          0
        );
        const totalQuantity = product.inventoryEntries.reduce(
          (sum, entry) => sum + entry.quantity, 
          0
        );

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          totalSales,
          totalQuantity,
          percentage: 0,
          cumulativePercentage: 0,
          abcCategory: 'C' as 'A' | 'B' | 'C'
        };
      });

      // مرتب‌سازی بر اساس فروش
      const sorted = productsWithSales.sort((a, b) => b.totalSales - a.totalSales);
      const totalSales = sorted.reduce((sum, p) => sum + p.totalSales, 0);

      // محاسبه درصد تجمعی و طبقه‌بندی ABC
      let cumulativeSales = 0;
      const classified = sorted.map(product => {
        cumulativeSales += product.totalSales;
        const percentage = totalSales > 0 ? (product.totalSales / totalSales) * 100 : 0;
        const cumulativePercentage = totalSales > 0 ? (cumulativeSales / totalSales) * 100 : 0;

        let abcCategory: 'A' | 'B' | 'C';
        if (cumulativePercentage <= 80) {
          abcCategory = 'A'; // 80% فروش
        } else if (cumulativePercentage <= 95) {
          abcCategory = 'B'; // 15% فروش
        } else {
          abcCategory = 'C'; // 5% فروش
        }

        return {
          ...product,
          percentage,
          cumulativePercentage,
          abcCategory
        };
      });

      return {
        period,
        totalProducts: products.length,
        totalSales,
        products: classified,
        summary: {
          categoryA: {
            count: classified.filter(p => p.abcCategory === 'A').length,
            salesPercentage: 80,
            products: classified.filter(p => p.abcCategory === 'A')
          },
          categoryB: {
            count: classified.filter(p => p.abcCategory === 'B').length,
            salesPercentage: 15,
            products: classified.filter(p => p.abcCategory === 'B')
          },
          categoryC: {
            count: classified.filter(p => p.abcCategory === 'C').length,
            salesPercentage: 5,
            products: classified.filter(p => p.abcCategory === 'C')
          }
        }
      };
    } catch (error) {
      throw new Error(`خطا در تحلیل ABC: ${(error as Error).message}`);
    }
  }

  /**
   * تحلیل سودآوری
   */
  static async performProfitAnalysis(period: DateRange, groupBy: 'item' | 'category' = 'item', tenantId: string): Promise<ProfitAnalysis> {
    try {
      let query;
      
      if (groupBy === 'item') {
        query = `
          SELECT 
            i.id,
            i.name,
            i.category,
            SUM(ie_out.quantity) as total_sold,
            SUM(ie_out.quantity * ie_out."unitPrice") as total_revenue,
            SUM(ie_out.quantity * COALESCE(
              (SELECT AVG(ie_in."unitPrice") FROM "InventoryEntry" ie_in 
               WHERE ie_in."itemId" = i.id AND ie_in.type = 'IN' 
               AND ie_in."createdAt" <= ie_out."createdAt"), 
              ie_out."unitPrice" * 0.7
            )) as total_cost,
            SUM(ie_out.quantity * ie_out."unitPrice") - SUM(ie_out.quantity * COALESCE(
              (SELECT AVG(ie_in."unitPrice") FROM "InventoryEntry" ie_in 
               WHERE ie_in."itemId" = i.id AND ie_in.type = 'IN' 
               AND ie_in."createdAt" <= ie_out."createdAt"), 
              ie_out."unitPrice" * 0.7
            )) as total_profit
          FROM "Item" i
          LEFT JOIN "InventoryEntry" ie_out ON i.id = ie_out."itemId" 
            AND ie_out.type = 'OUT' 
            AND ie_out."createdAt" >= $1 
            AND ie_out."createdAt" <= $2
          WHERE i."isActive" = true AND i."tenantId" = $3
          GROUP BY i.id, i.name, i.category
          HAVING SUM(ie_out.quantity) > 0
          ORDER BY total_profit DESC
        `;
      } else {
        query = `
          SELECT 
            i.category as name,
            i.category as category,
            SUM(ie_out.quantity) as total_sold,
            SUM(ie_out.quantity * ie_out."unitPrice") as total_revenue,
            SUM(ie_out.quantity * COALESCE(
              (SELECT AVG(ie_in."unitPrice") FROM "InventoryEntry" ie_in 
               WHERE ie_in."itemId" = i.id AND ie_in.type = 'IN' 
               AND ie_in."createdAt" <= ie_out."createdAt"), 
              ie_out."unitPrice" * 0.7
            )) as total_cost,
            SUM(ie_out.quantity * ie_out."unitPrice") - SUM(ie_out.quantity * COALESCE(
              (SELECT AVG(ie_in."unitPrice") FROM "InventoryEntry" ie_in 
               WHERE ie_in."itemId" = i.id AND ie_in.type = 'IN' 
               AND ie_in."createdAt" <= ie_out."createdAt"), 
              ie_out."unitPrice" * 0.7
            )) as total_profit
          FROM "Item" i
          LEFT JOIN "InventoryEntry" ie_out ON i.id = ie_out."itemId" 
            AND ie_out.type = 'OUT' 
            AND ie_out."createdAt" >= $1 
            AND ie_out."createdAt" <= $2
          WHERE i."isActive" = true AND i."tenantId" = $3
          GROUP BY i.category
          HAVING SUM(ie_out.quantity) > 0
          ORDER BY total_profit DESC
        `;
      }

      const results = await prisma.$queryRawUnsafe(query, period.start, period.end, tenantId) as any[];

      const analysis = results.map(row => ({
        id: row.id || row.category,
        name: row.name,
        category: row.category,
        totalSold: Number(row.total_sold) || 0,
        totalRevenue: Number(row.total_revenue) || 0,
        totalCost: Number(row.total_cost) || 0,
        totalProfit: Number(row.total_profit) || 0,
        profitMargin: Number(row.total_revenue) > 0 
          ? ((Number(row.total_profit) / Number(row.total_revenue)) * 100) 
          : 0
      }));

      const totalRevenue = analysis.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalProfit = analysis.reduce((sum, item) => sum + item.totalProfit, 0);
      const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      return {
        period,
        groupBy,
        items: analysis,
        summary: {
          totalItems: analysis.length,
          totalRevenue,
          totalProfit,
          overallMargin,
          bestPerformer: analysis[0] || null,
          worstPerformer: analysis[analysis.length - 1] || null
        }
      };
    } catch (error) {
      throw new Error(`خطا در تحلیل سودآوری: ${(error as Error).message}`);
    }
  }

  /**
   * تحلیل روندها
   */
  static async performTrendAnalysis(
    metric: 'revenue' | 'profit' | 'sales_volume' | 'customers',
    period: DateRange,
    granularity: 'daily' | 'weekly' | 'monthly',
    tenantId: string
  ): Promise<TrendAnalysis> {
    try {
      let query: string;
      let dateFormat: string;

      // تعیین فرمت تاریخ بر اساس granularity
      switch (granularity) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      switch (metric) {
        case 'revenue':
          query = `
            SELECT 
              TO_CHAR(ie."createdAt", '${dateFormat}') as period,
              SUM(ie.quantity * ie."unitPrice") as value
            FROM "InventoryEntry" ie
            LEFT JOIN "Item" i ON ie."itemId" = i.id
            WHERE ie.type = 'OUT' 
              AND i."tenantId" = $3
              AND ie."createdAt" >= $1 
              AND ie."createdAt" <= $2
            GROUP BY TO_CHAR(ie."createdAt", '${dateFormat}')
            ORDER BY period
          `;
          break;
        case 'profit':
          query = `
            SELECT 
              TO_CHAR(ie."createdAt", '${dateFormat}') as period,
              SUM(ie.quantity * (ie."unitPrice" - COALESCE(iss."unitPrice", 0))) as value
            FROM "InventoryEntry" ie
            LEFT JOIN "Item" i ON ie."itemId" = i.id
            LEFT JOIN "ItemSupplier" iss ON i.id = iss."itemId" AND iss."preferredSupplier" = true
            WHERE ie.type = 'OUT' 
              AND i."tenantId" = $3
              AND ie."createdAt" >= $1 
              AND ie."createdAt" <= $2
            GROUP BY TO_CHAR(ie."createdAt", '${dateFormat}')
            ORDER BY period
          `;
          break;
        case 'sales_volume':
          query = `
            SELECT 
              TO_CHAR(ie."createdAt", '${dateFormat}') as period,
              SUM(ie.quantity) as value
            FROM "InventoryEntry" ie
            LEFT JOIN "Item" i ON ie."itemId" = i.id
            WHERE ie.type = 'OUT' 
              AND i."tenantId" = $3
              AND ie."createdAt" >= $1 
              AND ie."createdAt" <= $2
            GROUP BY TO_CHAR(ie."createdAt", '${dateFormat}')
            ORDER BY period
          `;
          break;
        case 'customers':
          // For customers, we'll count unique customer transactions per day
          // Since we don't have a customer table, we'll estimate based on unique transactions
          query = `
            SELECT 
              TO_CHAR(ie."createdAt", '${dateFormat}') as period,
              COUNT(DISTINCT DATE_TRUNC('hour', ie."createdAt")) as value
            FROM "InventoryEntry" ie
            LEFT JOIN "Item" i ON ie."itemId" = i.id
            WHERE ie.type = 'OUT' 
              AND i."tenantId" = $3
              AND ie."createdAt" >= $1 
              AND ie."createdAt" <= $2
            GROUP BY TO_CHAR(ie."createdAt", '${dateFormat}')
            ORDER BY period
          `;
          break;
        default:
          throw new Error(`متریک ${metric} پشتیبانی نمی‌شود`);
      }

      const results = await prisma.$queryRawUnsafe(query, period.start, period.end, tenantId) as any[];

      const dataPoints = results.map(row => ({
        period: row.period,
        value: Number(row.value) || 0,
        date: this.parseFormattedDate(row.period, granularity)
      }));

      // If no data points, return empty data instead of mock data
      if (dataPoints.length === 0) {
        console.log(`No trend data available for metric: ${metric}, period: ${period.start} to ${period.end}`);
        return {
          metric,
          period,
          granularity,
          dataPoints: [],
          trend: {
            direction: 'STABLE',
            strength: 0,
            confidence: 0,
            description: 'داده‌ای موجود نیست'
          },
          seasonality: {
            hasSeasonality: false,
            period: null,
            strength: 0
          },
          forecast: [],
          insights: ['برای این دوره زمانی داده‌ای موجود نیست']
        };
      }

      // محاسبه روند
      const trend = this.calculateTrend(dataPoints.map(p => p.value));
      const seasonality = this.detectSeasonality(dataPoints);
      const forecast = this.generateForecast(dataPoints, 5); // پیش‌بینی 5 دوره آینده

      return {
        metric,
        period,
        granularity,
        dataPoints,
        trend: {
          direction: trend.slope > 0 ? 'UP' : trend.slope < 0 ? 'DOWN' : 'STABLE',
          strength: Math.abs(trend.slope),
          confidence: trend.rSquared,
          description: this.describeTrend(trend)
        },
        seasonality,
        forecast,
        insights: this.generateTrendInsights(dataPoints, trend, seasonality)
      };
    } catch (error) {
      throw new Error(`خطا در تحلیل روند: ${(error as Error).message}`);
    }
  }

  // =================== DASHBOARD FUNCTIONS ===================

  /**
   * ساخت داشبورد مدیریتی
   */
  static async buildExecutiveDashboard(period: DateRange, userId: string, tenantId: string): Promise<ExecutiveDashboard> {
    try {
      const [
        totalRevenue,
        netProfit,
        profitMargin,
        inventoryTurnover,
        averageOrderValue,
        stockoutRate,
        activeProductsCount
      ] = await Promise.all([
        this.calculateTotalRevenue(period, tenantId),
        this.calculateNetProfit(period, tenantId),
        this.calculateProfitMargin(period, tenantId),
        this.calculateInventoryTurnover(period, tenantId),
        this.calculateAverageOrderValue(period, tenantId),
        this.calculateStockoutRate(period, tenantId),
        this.getActiveProductsCount(tenantId)
      ]);

      // چارت‌های داشبورد
      const revenueChart = await this.getRevenueChart(period, tenantId);
      const topProductsChart = await this.getTopProductsChart(period, tenantId);
      const categoryChart = await this.getCategoryBreakdownChart(period, tenantId);

      // هشدارهای مهم
      const alerts = await this.getActiveAlerts(userId);

      return {
        period,
        kpis: {
          totalRevenue,
          netProfit,
          profitMargin,
          inventoryTurnover,
          averageOrderValue,
          stockoutRate,
          activeProductsCount
        },
        charts: {
          revenueChart,
          topProductsChart,
          categoryChart
        },
        alerts,
        generatedAt: new Date(),
        generatedBy: userId
      };
    } catch (error) {
      throw new Error(`خطا در ساخت داشبورد مدیریتی: ${(error as Error).message}`);
    }
  }

  // =================== HELPER FUNCTIONS ===================

  private static async getRevenueForPeriod(period: DateRange, tenantId: string): Promise<number> {
    const transactions = await prisma.inventoryEntry.findMany({
      where: {
        type: 'OUT',
        createdAt: {
          gte: period.start,
          lte: period.end
        },
        item: {
          tenantId: tenantId // CRITICAL: Add tenant filtering
        }
      }
    });

    return transactions.reduce((total, entry) => {
      return total + (entry.quantity * (entry.unitPrice || 0));
    }, 0);
  }

  private static async getTotalCostsForPeriod(period: DateRange, tenantId: string): Promise<number> {
    // محاسبه کل هزینه‌ها بر اساس قیمت تمام شده
    const result = await prisma.inventoryEntry.findMany({
      where: {
        type: 'OUT',
        createdAt: {
          gte: period.start,
          lte: period.end
        },
        item: {
          tenantId: tenantId // CRITICAL: Add tenant filtering
        }
      },
      include: {
        item: {
          include: {
            suppliers: {
              where: { preferredSupplier: true },
              take: 1
            }
          }
        }
      }
    });

    return result.reduce((total, entry) => {
      const costPrice = entry.item?.suppliers[0]?.unitPrice || 0;
      return total + (entry.quantity * costPrice);
    }, 0);
  }

  private static async getCostOfGoodsSold(period: DateRange, tenantId: string): Promise<number> {
    return this.getTotalCostsForPeriod(period, tenantId);
  }

  private static async getAverageInventoryValue(period: DateRange, tenantId: string): Promise<number> {
    // محاسبه میانگین ارزش موجودی در طول دوره
    const startOfPeriod = await this.getInventoryValueAtDate(period.start, tenantId);
    const endOfPeriod = await this.getInventoryValueAtDate(period.end, tenantId);
    
    return (startOfPeriod + endOfPeriod) / 2;
  }

  private static async getInventoryValueAtDate(date: Date, tenantId: string): Promise<number> {
    const items = await prisma.item.findMany({
      where: { 
        isActive: true,
        tenantId: tenantId // CRITICAL: Add tenant filtering
      },
      include: {
        inventoryEntries: {
          where: {
            createdAt: { lte: date }
          }
        },
        suppliers: {
          where: { preferredSupplier: true },
          take: 1
        }
      }
    });

    return items.reduce((total, item) => {
      const currentStock = this.calculateCurrentStock(item.inventoryEntries);
      const unitPrice = item.suppliers[0]?.unitPrice || 0;
      return total + (currentStock * unitPrice);
    }, 0);
  }

  private static calculateCurrentStock(entries: any[]): number {
    return entries.reduce((stock, entry) => {
      return entry.type === 'IN' ? stock + entry.quantity : stock - entry.quantity;
    }, 0);
  }

  private static async calculateStockoutRateForPeriod(period: DateRange): Promise<number> {
    // محاسبه نرخ کمبود موجودی برای دوره قبلی
    const totalItems = await prisma.item.count({ where: { isActive: true } });
    // Implementation would be similar to main stockout calculation
    return 0; // Simplified for now
  }

  private static getPreviousPeriod(period: DateRange): DateRange {
    const duration = period.end.getTime() - period.start.getTime();
    return {
      start: new Date(period.start.getTime() - duration),
      end: new Date(period.start.getTime())
    };
  }

  private static determineStatusByGrowth(
    changePercent: number, 
    goodThreshold: number, 
    warningThreshold: number
  ): 'GOOD' | 'WARNING' | 'CRITICAL' {
    if (changePercent >= goodThreshold) return 'GOOD';
    if (changePercent >= warningThreshold) return 'WARNING';
    return 'CRITICAL';
  }

  private static determineStatusByValue(
    current: number, 
    goodThreshold: number, 
    warningThreshold: number
  ): 'GOOD' | 'WARNING' | 'CRITICAL' {
    if (current >= goodThreshold) return 'GOOD';
    if (current >= warningThreshold) return 'WARNING';
    return 'CRITICAL';
  }

  private static calculateTrend(values: number[]): { slope: number; rSquared: number } {
    if (values.length < 2) return { slope: 0, rSquared: 0 };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = values.reduce((acc, yi) => acc + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // محاسبه R-squared
    const meanY = sumY / n;
    const ssRes = values.reduce((acc, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return acc + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = values.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
    const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

    return { slope, rSquared };
  }

  private static detectSeasonality(dataPoints: any): any {
    // ساده‌سازی شده - تشخیص الگوهای فصلی
    return {
      hasSeasonality: false,
      period: null,
      strength: 0
    };
  }

  private static generateForecast(dataPoints: any[], periods: number): any[] {
    // پیش‌بینی ساده بر اساس روند خطی
    const values = dataPoints.map(p => p.value);
    const trend = this.calculateTrend(values);
    
    const lastValue = values[values.length - 1];
    const forecast = [];
    
    for (let i = 1; i <= periods; i++) {
      forecast.push({
        period: `forecast_${i}`,
        value: lastValue + (trend.slope * i),
        confidence: Math.max(0.1, trend.rSquared - (i * 0.1))
      });
    }
    
    return forecast;
  }

  private static describeTrend(trend: { slope: number; rSquared: number }): string {
    const direction = trend.slope > 0 ? 'صعودی' : trend.slope < 0 ? 'نزولی' : 'ثابت';
    const strength = trend.rSquared > 0.8 ? 'قوی' : trend.rSquared > 0.5 ? 'متوسط' : 'ضعیف';
    return `روند ${direction} با قدرت ${strength}`;
  }

  private static generateTrendInsights(dataPoints: any[], trend: any, seasonality: any): string[] {
    const insights = [];
    
    if (trend.strength > 0.1) {
      insights.push(`روند ${trend.direction === 'UP' ? 'رشد' : 'کاهش'} با قدرت ${trend.strength.toFixed(2)} مشاهده می‌شود`);
    }
    
    if (seasonality.hasSeasonality) {
      insights.push(`الگوی فصلی با دوره ${seasonality.period} تشخیص داده شده`);
    }
    
    return insights;
  }

  private static parseFormattedDate(period: string, granularity: string): Date {
    // تبدیل فرمت تاریخ به Date object
    if (granularity === 'daily') {
      return new Date(period);
    } else if (granularity === 'weekly') {
      const [year, week] = period.split('-');
      return new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
    } else {
      const [year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
  }

  private static async getRevenueChart(period: DateRange, tenantId: string): Promise<any> {
    try {
      // محاسبه داده‌های نمودار درآمد روزانه
      const entries = await prisma.inventoryEntry.findMany({
        where: {
          type: 'OUT',
          createdAt: {
            gte: period.start,
            lte: period.end
          },
          item: {
            tenantId: tenantId // CRITICAL: Add tenant filtering
          }
        },
        include: {
          item: {
            include: {
              suppliers: {
                where: { preferredSupplier: true },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // گروه‌بندی بر اساس روز
      const dailyRevenue = new Map<string, { revenue: number; cost: number; profit: number }>();
      
      entries.forEach(entry => {
        const date = entry.createdAt.toISOString().split('T')[0];
        const sellPrice = entry.item?.suppliers[0]?.unitPrice || 0;
        const costPrice = sellPrice * 0.7; // فرض 30% حاشیه سود
        const revenue = entry.quantity * sellPrice;
        const cost = entry.quantity * costPrice;
        const profit = revenue - cost;

        if (dailyRevenue.has(date)) {
          const existing = dailyRevenue.get(date)!;
          dailyRevenue.set(date, {
            revenue: existing.revenue + revenue,
            cost: existing.cost + cost,
            profit: existing.profit + profit
          });
        } else {
          dailyRevenue.set(date, { revenue, cost, profit });
        }
      });

      // تبدیل به آرایه برای نمودار
      const chartData = Array.from(dailyRevenue.entries()).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('fa-IR'),
        dateKey: date,
        revenue: Math.round(data.revenue),
        cost: Math.round(data.cost),
        profit: Math.round(data.profit)
      }));

      // Return the structure expected by the frontend
      return {
        labels: chartData.map(d => d.date),
        datasets: [
          {
            label: 'درآمد (تومان)',
            data: chartData.map(d => d.revenue),
            backgroundColor: '#22c55e',
            borderColor: '#16a34a'
          },
          {
            label: 'هزینه (تومان)',
            data: chartData.map(d => d.cost),
            backgroundColor: '#ef4444',
            borderColor: '#dc2626'
          },
          {
            label: 'سود (تومان)',
            data: chartData.map(d => d.profit),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb'
          }
        ]
      };
    } catch (error) {
      console.error('Error generating revenue chart:', error);
      return { 
        labels: [], 
        datasets: [
          {
            label: 'درآمد (تومان)',
            data: [],
            backgroundColor: '#22c55e',
            borderColor: '#16a34a'
          },
          {
            label: 'هزینه (تومان)',
            data: [],
            backgroundColor: '#ef4444',
            borderColor: '#dc2626'
          },
          {
            label: 'سود (تومان)',
            data: [],
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb'
          }
        ]
      };
    }
  }

  private static async getTopProductsChart(period: DateRange, tenantId: string): Promise<any> {
    try {
      // محاسبه محصولات پرفروش
      const result = await prisma.inventoryEntry.findMany({
        where: {
          type: 'OUT',
          createdAt: {
            gte: period.start,
            lte: period.end
          },
          item: {
            tenantId: tenantId // CRITICAL: Add tenant filtering
          }
        },
        include: {
          item: {
            include: {
              suppliers: {
                where: { preferredSupplier: true },
                take: 1
              }
            }
          }
        }
      });

      // تجمیع بر اساس کالا
      const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
      
      result.forEach(entry => {
        const productName = entry.item?.name || 'نامشخص';
        const sellPrice = entry.item?.suppliers[0]?.unitPrice || 0;
        const revenue = entry.quantity * sellPrice;

        if (productSales.has(productName)) {
          const existing = productSales.get(productName)!;
          productSales.set(productName, {
            name: productName,
            quantity: existing.quantity + entry.quantity,
            revenue: existing.revenue + revenue
          });
        } else {
          productSales.set(productName, {
            name: productName,
            quantity: entry.quantity,
            revenue
          });
        }
      });

      // مرتب‌سازی و انتخاب 10 محصول برتر
      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Return the structure expected by the frontend
      return {
        labels: topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
        datasets: [
          {
            label: 'درآمد (تومان)',
            data: topProducts.map(p => Math.round(p.revenue)),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb'
          }
        ]
      };
    } catch (error) {
      console.error('Error generating top products chart:', error);
      return { 
        labels: [], 
        datasets: [{
          label: 'درآمد (تومان)',
          data: [],
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb'
        }]
      };
    }
  }

  /**
   * Get total count of active products for a tenant
   */
  static async getActiveProductsCount(tenantId: string): Promise<number> {
    try {
      const count = await prisma.item.count({
        where: {
          tenantId: tenantId,
          isActive: true
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting active products count:', error);
      return 0;
    }
  }

  private static async getCategoryBreakdownChart(period: DateRange, tenantId: string): Promise<any> {
    try {
      // محاسبه توزیع فروش بر اساس دسته‌بندی
      const result = await prisma.inventoryEntry.findMany({
        where: {
          type: 'OUT',
          createdAt: {
            gte: period.start,
            lte: period.end
          },
          item: {
            tenantId: tenantId // CRITICAL: Add tenant filtering
          }
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              suppliers: {
                where: { preferredSupplier: true },
                take: 1,
                select: {
                  unitPrice: true
                }
              }
            }
          }
        }
      });

      // تجمیع بر اساس دسته‌بندی واقعی از دیتابیس
      const categorySales = new Map<string, number>();
      
      result.forEach(entry => {
        // استفاده از دسته‌بندی واقعی از دیتابیس
        const category = entry.item?.category || 'سایر';
        const sellPrice = entry.item?.suppliers[0]?.unitPrice || 0;
        const revenue = entry.quantity * sellPrice;

        categorySales.set(category, (categorySales.get(category) || 0) + revenue);
      });

      // اگر هیچ داده‌ای وجود ندارد، آرایه خالی برگردان
      if (categorySales.size === 0) {
        console.log('No category sales data available for the specified period');
        return { 
          labels: [], 
          datasets: [{
            label: 'فروش (تومان)',
            data: [],
            backgroundColor: [],
            borderColor: []
          }]
        };
      }

      // تبدیل به فرمت نمودار دایره‌ای
      const chartData = Array.from(categorySales.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value),
        color: this.generateColor(name)
      }));

      // Return the structure expected by the frontend
      return {
        labels: chartData.map(d => d.name),
        datasets: [
          {
            label: 'فروش (تومان)',
            data: chartData.map(d => d.value),
            backgroundColor: chartData.map(d => d.color),
            borderColor: chartData.map(d => d.color)
          }
        ]
      };
    } catch (error) {
      console.error('Error generating category breakdown chart:', error);
      return { 
        labels: [], 
        datasets: [{
          label: 'فروش (تومان)',
          data: [],
          backgroundColor: [],
          borderColor: []
        }]
      };
    }
  }

  private static generateColor(text: string): string {
    // تولید رنگ بر اساس متن
    const colors = [
      '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    
    const hash = text.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  }

  private static async getActiveAlerts(userId: string): Promise<any[]> {
    return await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null } // broadcast notifications
        ],
        read: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }
} 
