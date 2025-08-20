// Chart Data Transformer Service
// This service provides safe data transformation for chart components
// while maintaining full backward compatibility

import { 
  ProfitData, 
  ProfitItem,
  TopProfitableProductsData,
  RevenueVsProfitScatterData,
  ProfitMarginDistributionData,
  CostVsRevenueComparisonData,
  ProfitPerformanceMatrixData,
  ChartDataPoint
} from '../types/bi';

/**
 * Chart Data Transformer Class
 * Provides safe data transformation for all chart types
 */
export class ChartDataTransformer {
  
  /**
   * Transform profit analysis data for top profitable products chart
   * Maintains backward compatibility with existing data structure
   */
  static transformTopProfitableProducts(
    profitData: ProfitData | null, 
    maxProducts: number = 10
  ): TopProfitableProductsData[] {
    if (!profitData?.analysis) return [];
    
    try {
      return profitData.analysis
        .sort((a, b) => b.profit - a.profit)
        .slice(0, maxProducts)
        .map(product => ({
          name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
          fullName: product.name,
          revenue: product.revenue,
          quantity: product.quantity,
          profit: product.profit,
          profitMargin: product.profitMargin,
          abcCategory: product.profitMargin >= 20 ? 'A' : product.profitMargin >= 10 ? 'B' : 'C' as 'A' | 'B' | 'C',
          percentage: profitData.totalProfit > 0 ? (product.profit / profitData.totalProfit) * 100 : 0
        }));
    } catch (error) {
      console.error('Error transforming top profitable products data:', error);
      return [];
    }
  }

  /**
   * Transform profit analysis data for revenue vs profit scatter chart
   * Maintains backward compatibility with existing data structure
   */
  static transformRevenueVsProfitScatter(
    profitData: ProfitData | null
  ): RevenueVsProfitScatterData[] {
    if (!profitData?.analysis) return [];
    
    try {
      return profitData.analysis.map(product => ({
        name: product.name,
        revenue: product.revenue,
        profit: product.profit,
        profitMargin: product.profitMargin,
        quantity: product.quantity,
        category: product.category
      }));
    } catch (error) {
      console.error('Error transforming revenue vs profit scatter data:', error);
      return [];
    }
  }

  /**
   * Transform profit analysis data for profit margin distribution donut chart
   * Maintains backward compatibility with existing data structure
   */
  static transformProfitMarginDistribution(
    profitData: ProfitData | null
  ): ProfitMarginDistributionData[] {
    if (!profitData?.analysis) return [];
    
    try {
      const highProfit = profitData.analysis.filter(p => p.profitMargin >= 20);
      const mediumProfit = profitData.analysis.filter(p => p.profitMargin >= 10 && p.profitMargin < 20);
      const lowProfit = profitData.analysis.filter(p => p.profitMargin >= 0 && p.profitMargin < 10);
      const lossItems = profitData.analysis.filter(p => p.profitMargin < 0);
      
      const totalRevenue = profitData.totalRevenue;
      
      return [
        {
          name: 'پرسود',
          value: highProfit.reduce((sum, p) => sum + p.revenue, 0),
          count: highProfit.length,
          color: '#10B981',
          percentage: totalRevenue > 0 ? (highProfit.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100 : 0
        },
        {
          name: 'متوسط', 
          value: mediumProfit.reduce((sum, p) => sum + p.revenue, 0),
          count: mediumProfit.length,
          color: '#F59E0B',
          percentage: totalRevenue > 0 ? (mediumProfit.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100 : 0
        },
        {
          name: 'کم‌سود',
          value: lowProfit.reduce((sum, p) => sum + p.revenue, 0),
          count: lowProfit.length,
          color: '#F97316',
          percentage: totalRevenue > 0 ? (lowProfit.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100 : 0
        },
        {
          name: 'ضررده',
          value: lossItems.reduce((sum, p) => sum + p.revenue, 0),
          count: lossItems.length,
          color: '#EF4444',
          percentage: totalRevenue > 0 ? (lossItems.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100 : 0
        }
      ].filter(item => item.count > 0);
    } catch (error) {
      console.error('Error transforming profit margin distribution data:', error);
      return [];
    }
  }

  /**
   * Transform profit analysis data for cost vs revenue comparison chart
   * Maintains backward compatibility with existing data structure
   */
  static transformCostVsRevenueComparison(
    profitData: ProfitData | null, 
    maxProducts: number = 8
  ): CostVsRevenueComparisonData[] {
    if (!profitData?.analysis) return [];
    
    try {
      return profitData.analysis
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, maxProducts)
        .map(product => ({
          name: product.name.length > 10 ? product.name.substring(0, 10) + '...' : product.name,
          fullName: product.name,
          revenue: product.revenue,
          cost: product.cost,
          profit: product.profit
        }));
    } catch (error) {
      console.error('Error transforming cost vs revenue comparison data:', error);
      return [];
    }
  }

  /**
   * Transform profit analysis data for profit performance matrix chart
   * Maintains backward compatibility with existing data structure
   */
  static transformProfitPerformanceMatrix(
    profitData: ProfitData | null
  ): ProfitPerformanceMatrixData[] {
    if (!profitData?.analysis) return [];
    
    try {
      return profitData.analysis.map(product => ({
        name: product.name,
        revenue: product.revenue,
        profit: product.profit,
        profitMargin: product.profitMargin,
        quantity: product.quantity,
        category: product.category
      }));
    } catch (error) {
      console.error('Error transforming profit performance matrix data:', error);
      return [];
    }
  }

  /**
   * Generic data validation for API responses
   * Ensures data integrity without breaking existing functionality
   */
  static validateProfitData(data: unknown): data is ProfitData {
    if (!data || typeof data !== 'object') return false;
    
    const profitData = data as any;
    
    return (
      typeof profitData.totalRevenue === 'number' &&
      typeof profitData.totalCost === 'number' &&
      typeof profitData.totalProfit === 'number' &&
      typeof profitData.overallMargin === 'number' &&
      Array.isArray(profitData.analysis) &&
      profitData.analysis.every((item: any) => 
        typeof item.name === 'string' &&
        typeof item.revenue === 'number' &&
        typeof item.cost === 'number' &&
        typeof item.profit === 'number' &&
        typeof item.profitMargin === 'number' &&
        typeof item.quantity === 'number'
      )
    );
  }

  /**
   * Safe data extraction from API response
   * Handles both wrapped and unwrapped response formats
   */
  static extractProfitData(response: unknown): ProfitData | null {
    try {
      // Handle wrapped response format
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        const wrappedResponse = response as { success: boolean; data: unknown };
        if (wrappedResponse.success && this.validateProfitData(wrappedResponse.data)) {
          return wrappedResponse.data as ProfitData;
        }
      }
      
      // Handle direct response format
      if (this.validateProfitData(response)) {
        return response as ProfitData;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting profit data:', error);
      return null;
    }
  }
}
