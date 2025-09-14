import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// Utility function to convert BigInt values to numbers
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  return obj;
}

// Types and Interfaces
export interface SegmentationCriteria {
  name: string;
  description: string;
  rules: SegmentRule[];
  colorHex?: string;
  iconName?: string;
}

export interface SegmentRule {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between' | 'in' | 'not_in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface CustomerSegmentData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  currentSegment: string;
  suggestedSegment: string;
  segmentScore: number;
  reasons: string[];
  loyaltyData: {
    totalVisits: number;
    lifetimeSpent: number;
    currentYearSpent: number;
    currentPoints: number;
    tierLevel: string;
    lastVisitDays: number;
  };
}

export interface SegmentationReport {
  totalCustomers: number;
  segmentDistribution: Record<string, number>;
  movements: {
    upgraded: CustomerSegmentData[];
    downgraded: CustomerSegmentData[];
    unchanged: number;
  };
  recommendations: string[];
}

/**
 * Calculate customer segment based on behavior patterns
 */
export function calculateCustomerSegment(
  lifetimeSpent: number,
  totalVisits: number,
  currentYearSpent: number,
  lastVisitDays: number,
  currentMonthSpent: number = 0
): { segment: string; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Base scoring
  if (lifetimeSpent >= 5000000) { // 5M Toman
    score += 40;
    reasons.push('خرید بالای 5 میلیون تومان');
  } else if (lifetimeSpent >= 2000000) { // 2M Toman
    score += 30;
    reasons.push('خرید بالای 2 میلیون تومان');
  } else if (lifetimeSpent >= 500000) { // 500K Toman
    score += 20;
    reasons.push('خرید بالای 500 هزار تومان');
  } else if (lifetimeSpent >= 100000) { // 100K Toman
    score += 10;
    reasons.push('خرید بالای 100 هزار تومان');
  }

  // Visit frequency scoring
  if (totalVisits >= 100) {
    score += 25;
    reasons.push('بیش از 100 بازدید');
  } else if (totalVisits >= 50) {
    score += 20;
    reasons.push('بیش از 50 بازدید');
  } else if (totalVisits >= 20) {
    score += 15;
    reasons.push('بیش از 20 بازدید');
  } else if (totalVisits >= 5) {
    score += 10;
    reasons.push('بیش از 5 بازدید');
  }

  // Recent activity scoring
  if (lastVisitDays <= 7) {
    score += 15;
    reasons.push('بازدید در هفته گذشته');
  } else if (lastVisitDays <= 30) {
    score += 10;
    reasons.push('بازدید در ماه گذشته');
  } else if (lastVisitDays <= 90) {
    score += 5;
    reasons.push('بازدید در 3 ماه گذشته');
  } else if (lastVisitDays > 180) {
    score -= 10;
    reasons.push('عدم بازدید در 6 ماه گذشته');
  }

  // Current year activity
  if (currentYearSpent >= 20000000) {
    score += 20;
    reasons.push('خرید بالای 20 میلیون در سال جاری');
  } else if (currentYearSpent >= 10000000) {
    score += 15;
    reasons.push('خرید بالای 10 میلیون در سال جاری');
  } else if (currentYearSpent >= 3000000) {
    score += 10;
    reasons.push('خرید بالای 3 میلیون در سال جاری');
  }

  // Recent spending boost
  if (currentMonthSpent >= 2000000) {
    score += 10;
    reasons.push('خرید بالای 2 میلیون در ماه جاری');
  }

  // Determine segment based on score
  let segment = 'NEW';
  if (score >= 80) {
    segment = 'VIP';
  } else if (score >= 50) {
    segment = 'REGULAR';
  } else if (score >= 25) {
    segment = 'OCCASIONAL';
  }

  return { segment, score, reasons };
}

/**
 * Update all customer segments based on current behavior
 */
export async function updateAllCustomerSegments(): Promise<SegmentationReport> {
  try {
    // Get all active customers with loyalty data
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        loyalty: true
      }
    });

    const movements = {
      upgraded: [] as CustomerSegmentData[],
      downgraded: [] as CustomerSegmentData[],
      unchanged: 0
    };

    const segmentDistribution: Record<string, number> = {
      NEW: 0,
      OCCASIONAL: 0,
      REGULAR: 0,
      VIP: 0
    };

    for (const customer of customers) {
      if (!customer.loyalty) continue;

      const lastVisitDays = customer.loyalty.lastVisitDate 
        ? Math.floor((Date.now() - customer.loyalty.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const segmentResult = calculateCustomerSegment(
        Number(customer.loyalty.lifetimeSpent),
        customer.loyalty.totalVisits,
        Number(customer.loyalty.currentYearSpent),
        lastVisitDays,
        Number(customer.loyalty.currentMonthSpent)
      );

      const currentSegment = customer.segment;
      const suggestedSegment = segmentResult.segment;

      // Update segment if changed
      if (currentSegment !== suggestedSegment) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { segment: suggestedSegment as any }
        });

        const segmentData: CustomerSegmentData = {
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          currentSegment,
          suggestedSegment,
          segmentScore: segmentResult.score,
          reasons: segmentResult.reasons,
          loyaltyData: {
            totalVisits: customer.loyalty.totalVisits,
            lifetimeSpent: Number(customer.loyalty.lifetimeSpent),
            currentYearSpent: Number(customer.loyalty.currentYearSpent),
            currentPoints: customer.loyalty.currentPoints,
            tierLevel: customer.loyalty.tierLevel,
            lastVisitDays
          }
        };

        // Determine if upgrade or downgrade
        const segmentOrder = ['NEW', 'OCCASIONAL', 'REGULAR', 'VIP'];
        const currentIndex = segmentOrder.indexOf(currentSegment);
        const suggestedIndex = segmentOrder.indexOf(suggestedSegment);

        if (suggestedIndex > currentIndex) {
          movements.upgraded.push(segmentData);
        } else {
          movements.downgraded.push(segmentData);
        }
      } else {
        movements.unchanged++;
      }

      segmentDistribution[suggestedSegment]++;
    }

    // Generate recommendations
    const recommendations = generateSegmentationRecommendations(movements, segmentDistribution);

    return {
      totalCustomers: customers.length,
      segmentDistribution,
      movements,
      recommendations
    };
  } catch (error) {
    console.error('Error updating customer segments:', error);
    throw new AppError('خطا در بروزرسانی بخش‌بندی مشتریان', 500);
  }
}

/**
 * Get customers by segment with detailed analysis
 */
export async function getCustomersBySegment(
  segment: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP',
  page: number = 1,
  limit: number = 50
): Promise<any> {
  try {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { 
          segment,
          isActive: true 
        },
        include: {
          loyalty: true,
          _count: {
            select: {
              visits: true,
              feedback: true
            }
          }
        },
        orderBy: [
          { loyalty: { lifetimeSpent: 'desc' } },
          { loyalty: { totalVisits: 'desc' } }
        ],
        skip,
        take: limit
      }),
      prisma.customer.count({
        where: { segment, isActive: true }
      })
    ]);

    // Add segmentation analysis for each customer
    const customersWithAnalysis = customers.map(customer => {
      if (!customer.loyalty) return customer;

      const lastVisitDays = customer.loyalty.lastVisitDate 
        ? Math.floor((Date.now() - customer.loyalty.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const segmentResult = calculateCustomerSegment(
        Number(customer.loyalty.lifetimeSpent),
        customer.loyalty.totalVisits,
        Number(customer.loyalty.currentYearSpent),
        lastVisitDays,
        Number(customer.loyalty.currentMonthSpent)
      );

      return {
        ...customer,
        segmentAnalysis: {
          score: segmentResult.score,
          reasons: segmentResult.reasons,
          lastVisitDays,
          averageOrderValue: customer.loyalty.totalVisits > 0 
            ? Number(customer.loyalty.lifetimeSpent) / customer.loyalty.totalVisits
            : 0
        }
      };
    });

    return {
      customers: customersWithAnalysis,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching customers by segment:', error);
    throw new AppError('خطا در دریافت مشتریان بر اساس بخش', 500);
  }
}

/**
 * Create custom segment
 */
export async function createCustomSegment(
  segmentData: SegmentationCriteria,
  createdBy: string,
  tenantId: string
): Promise<any> {
  try {
    // Validate segment key
    const segmentKey = segmentData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Check if segment key already exists
    const existingSegment = await prisma.crmCustomerSegment.findFirst({
      where: { 
        segmentKey,
        tenantId
      }
    });

    if (existingSegment) {
      throw new AppError('بخش با این نام قبلاً ایجاد شده است', 409);
    }

    const segment = await prisma.crmCustomerSegment.create({
      data: {
        name: segmentData.name,
        description: segmentData.description,
        segmentKey,
        criteria: segmentData.rules as any,
        colorHex: segmentData.colorHex || '#6B7280',
        iconName: segmentData.iconName,
        isSystemSegment: false,
        createdBy,
        tenantId
      }
    });

    // Calculate initial customer count
    const customerCount = await calculateCustomSegmentCount(segment.criteria);
    
    await prisma.crmCustomerSegment.update({
      where: { id: segment.id },
      data: { 
        customerCount,
        lastCalculatedAt: new Date()
      }
    });

    return { ...segment, customerCount };
  } catch (error: any) {
    console.error('Error creating custom segment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در ایجاد بخش سفارشی', 500);
  }
}

/**
 * Calculate customer count for custom segment
 */
async function calculateCustomSegmentCount(criteria: any): Promise<number> {
  try {
    // This is a simplified implementation
    // In a real-world scenario, you'd build dynamic SQL queries based on criteria
    
    // For now, return a placeholder count
    // In production, implement proper criteria parsing and SQL generation
    return 0;
  } catch (error) {
    console.error('Error calculating segment count:', error);
    return 0;
  }
}

/**
 * Get segment analysis and insights
 */
export async function getSegmentAnalysis(): Promise<any> {
  try {
    // Basic segment distribution using Prisma ORM
    const segmentStats = await prisma.customer.groupBy({
      by: ['segment'],
      where: { isActive: true },
      _count: true
    });

    // Get customers with loyalty data for value calculation
    const customersWithLoyalty = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        loyalty: true
      }
    });

    // Calculate segment distribution with total values
    const segmentDistribution: Record<string, { count: number; totalValue: number }> = {};
    
    segmentStats.forEach(stat => {
      const customersInSegment = customersWithLoyalty.filter(c => c.segment === stat.segment);
      const totalValue = customersInSegment.reduce((sum, customer) => {
        return sum + (customer.loyalty ? Number(customer.loyalty.lifetimeSpent) : 0);
      }, 0);

      segmentDistribution[stat.segment] = {
        count: stat._count,
        totalValue: totalValue
      };
    });

    // Generate basic insights
    const insights = generateSegmentInsights(segmentStats);

    // Simple mock data for other sections to avoid BigInt issues
    const recentMovements = segmentStats.map(stat => ({
      current_segment: stat.segment,
      customer_count: stat._count,
      avg_lifetime_spent: segmentDistribution[stat.segment].totalValue / stat._count || 0,
      avg_visits: 0
    }));

    const valueSegments = [
      { value_segment: 'high_value', customer_count: 0, total_revenue: 0, avg_spent: 0 },
      { value_segment: 'medium_value', customer_count: 0, total_revenue: 0, avg_spent: 0 },
      { value_segment: 'low_value', customer_count: 0, total_revenue: 0, avg_spent: 0 },
      { value_segment: 'minimal_value', customer_count: 0, total_revenue: 0, avg_spent: 0 }
    ];

    const activitySegments = [
      { activity_segment: 'very_active', customer_count: 0, avg_visits: 0, avg_points: 0 },
      { activity_segment: 'active', customer_count: 0, avg_visits: 0, avg_points: 0 },
      { activity_segment: 'moderately_active', customer_count: 0, avg_visits: 0, avg_points: 0 },
      { activity_segment: 'inactive', customer_count: 0, avg_visits: 0, avg_points: 0 },
      { activity_segment: 'dormant', customer_count: 0, avg_visits: 0, avg_points: 0 }
    ];

    return {
      segmentDistribution,
      recentMovements,
      valueSegments,
      activitySegments,
      insights
    };
  } catch (error) {
    console.error('Error fetching segment analysis:', error);
    throw new AppError('خطا در دریافت تحلیل بخش‌بندی', 500);
  }
}

/**
 * Generate actionable recommendations based on segmentation
 */
function generateSegmentationRecommendations(
  movements: any,
  distribution: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  // Analyze distribution
  const vipPercentage = (distribution.VIP / total) * 100;
  const newPercentage = (distribution.NEW / total) * 100;
  const regularPercentage = (distribution.REGULAR / total) * 100;

  if (vipPercentage < 5) {
    recommendations.push('درصد مشتریان VIP کم است. برنامه‌های تشویقی برای ارتقا مشتریان طراحی کنید.');
  }

  if (newPercentage > 40) {
    recommendations.push('درصد زیادی از مشتریان جدید هستند. بر روی برنامه‌های نگهداری و تبدیل آنها تمرکز کنید.');
  }

  if (movements.downgraded.length > movements.upgraded.length) {
    recommendations.push('تعداد مشتریان تنزل یافته بیش از ارتقا یافتگان است. برنامه‌های بازگرداندن مشتریان اجرا کنید.');
  }

  // Analyze upgrade patterns
  if (movements.upgraded.length > 0) {
    const avgUpgradeSpent = movements.upgraded.reduce((sum: number, c: any) => 
      sum + c.loyaltyData.currentYearSpent, 0) / movements.upgraded.length;
    
    recommendations.push(
      `مشتریان ارتقا یافته میانگین ${Math.round(avgUpgradeSpent / 1000)} هزار تومان خرید سالانه دارند. این الگو را برای سایر مشتریان تکرار کنید.`
    );
  }

  if (regularPercentage > 50) {
    recommendations.push('درصد بالای مشتریان منظم فرصت خوبی برای ارتقا به VIP است. کمپین‌های هدفمند طراحی کنید.');
  }

  return recommendations;
}

/**
 * Generate insights from segment data
 */
function generateSegmentInsights(segmentStats: any[]): string[] {
  const insights: string[] = [];
  
  const totalCustomers = segmentStats.reduce((sum, stat) => sum + stat._count, 0);
  
  segmentStats.forEach(stat => {
    const percentage = (stat._count / totalCustomers) * 100;
    
    insights.push(
      `${stat.segment}: ${stat._count} مشتری (${percentage.toFixed(1)}%)`
    );
  });

  return insights;
}

/**
 * Get customers ready for segment upgrade
 */
export async function getUpgradeableCustomers(targetSegment: string): Promise<any[]> {
  try {
    // Find customers who are close to upgrading to the target segment
    const customers = await prisma.customer.findMany({
      where: { 
        isActive: true,
        segment: { not: targetSegment as any }
      },
      include: {
        loyalty: true
      }
    });

    const upgradeableCustomers = customers.filter(customer => {
      if (!customer.loyalty) return false;

      const lastVisitDays = customer.loyalty.lastVisitDate 
        ? Math.floor((Date.now() - customer.loyalty.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const segmentResult = calculateCustomerSegment(
        Number(customer.loyalty.lifetimeSpent),
        customer.loyalty.totalVisits,
        Number(customer.loyalty.currentYearSpent),
        lastVisitDays,
        Number(customer.loyalty.currentMonthSpent)
      );

      return segmentResult.segment === targetSegment && segmentResult.score >= 70;
    });

    return upgradeableCustomers.map(customer => ({
      ...customer,
      upgradeScore: calculateCustomerSegment(
        Number(customer.loyalty!.lifetimeSpent),
        customer.loyalty!.totalVisits,
        Number(customer.loyalty!.currentYearSpent),
        customer.loyalty!.lastVisitDate 
          ? Math.floor((Date.now() - customer.loyalty!.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        Number(customer.loyalty!.currentMonthSpent)
      ).score
    })).sort((a, b) => b.upgradeScore - a.upgradeScore);
  } catch (error) {
    console.error('Error fetching upgradeable customers:', error);
    throw new AppError('خطا در دریافت مشتریان قابل ارتقا', 500);
  }
} 
