import { PrismaClient } from '../../../shared/generated/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// Types and Interfaces
export interface LoyaltyTransactionFilter {
  page?: number;
  limit?: number;
  customerId?: string;
  transactionType?: 'EARNED_PURCHASE' | 'EARNED_BONUS' | 'EARNED_REFERRAL' | 'EARNED_BIRTHDAY' | 
                     'REDEEMED_DISCOUNT' | 'REDEEMED_ITEM' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUBTRACT' | 'EXPIRED';
  startDate?: Date;
  endDate?: Date;
}

export interface LoyaltyTransactionData {
  customerId: string;
  transactionType: string;
  pointsChange: number;
  description: string;
  notes?: string;
  visitId?: string;
  campaignId?: string;
  orderReference?: string;
  relatedAmount?: number;
}

export interface LoyaltyRedemption {
  customerId: string;
  pointsToRedeem: number;
  description: string;
  orderReference?: string;
  relatedAmount?: number;
}

export interface TierBenefits {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  pointMultiplier: number;
  discountPercentage: number;
  freeItemThreshold: number;
  specialOffers: string[];
  prioritySupport: boolean;
}

/**
 * Calculate points from purchase amount
 */
export function calculatePointsFromAmount(amount: number): number {
  // 1 point per 1000 IRR spent (same as SQL function)
  return Math.floor(amount / 1000);
}

/**
 * Calculate required spending for next tier
 */
export function calculateTierRequirements(
  currentTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
  lifetimeSpent: number,
  totalVisits: number,
  currentYearSpent: number
): any {
  const tierThresholds = {
    BRONZE: { lifetime: 0, visits: 0, yearly: 0 },
    SILVER: { lifetime: 5000000, visits: 30, yearly: 3000000 },
    GOLD: { lifetime: 20000000, visits: 100, yearly: 10000000 },
    PLATINUM: { lifetime: 50000000, visits: 200, yearly: 20000000 }
  };

  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === tiers.length - 1) {
    return {
      nextTier: null,
      progress: 100,
      requirements: null
    };
  }

  const nextTier = tiers[currentIndex + 1] as keyof typeof tierThresholds;
  const nextRequirements = tierThresholds[nextTier];

  const lifetimeProgress = Math.min((lifetimeSpent / nextRequirements.lifetime) * 100, 100);
  const visitsProgress = Math.min((totalVisits / nextRequirements.visits) * 100, 100);
  const yearlyProgress = Math.min((currentYearSpent / nextRequirements.yearly) * 100, 100);

  return {
    nextTier,
    progress: Math.max(lifetimeProgress, visitsProgress, yearlyProgress),
    requirements: {
      lifetimeSpent: {
        required: nextRequirements.lifetime,
        current: lifetimeSpent,
        remaining: Math.max(0, nextRequirements.lifetime - lifetimeSpent),
        progress: lifetimeProgress
      },
      totalVisits: {
        required: nextRequirements.visits,
        current: totalVisits,
        remaining: Math.max(0, nextRequirements.visits - totalVisits),
        progress: visitsProgress
      },
      yearlySpent: {
        required: nextRequirements.yearly,
        current: currentYearSpent,
        remaining: Math.max(0, nextRequirements.yearly - currentYearSpent),
        progress: yearlyProgress
      }
    }
  };
}

/**
 * Get tier benefits
 */
export function getTierBenefits(tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'): TierBenefits {
  const benefits: Record<string, TierBenefits> = {
    BRONZE: {
      tier: 'BRONZE',
      pointMultiplier: 1,
      discountPercentage: 0,
      freeItemThreshold: 0,
      specialOffers: [],
      prioritySupport: false
    },
    SILVER: {
      tier: 'SILVER',
      pointMultiplier: 1.2,
      discountPercentage: 5,
      freeItemThreshold: 10,
      specialOffers: ['تخفیف تولد', 'پیشنهاد ویژه ماهانه'],
      prioritySupport: false
    },
    GOLD: {
      tier: 'GOLD',
      pointMultiplier: 1.5,
      discountPercentage: 10,
      freeItemThreshold: 8,
      specialOffers: ['تخفیف تولد', 'پیشنهاد ویژه هفتگی', 'دسترسی زودهنگام'],
      prioritySupport: true
    },
    PLATINUM: {
      tier: 'PLATINUM',
      pointMultiplier: 2,
      discountPercentage: 15,
      freeItemThreshold: 5,
      specialOffers: ['تخفیف تولد', 'پیشنهاد ویژه روزانه', 'دسترسی VIP', 'مشاوره رایگان'],
      prioritySupport: true
    }
  };

  return benefits[tier];
}

/**
 * Add loyalty points (from purchase or bonus)
 */
export async function addLoyaltyPoints(
  customerId: string,
  pointsToAdd: number,
  transactionType: 'EARNED_PURCHASE' | 'EARNED_BONUS' | 'EARNED_REFERRAL' | 'EARNED_BIRTHDAY' | 
                   'REDEEMED_DISCOUNT' | 'REDEEMED_ITEM' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUBTRACT' | 'EXPIRED',
  description: string,
  tenantId: string,
  createdBy?: string,
  relatedData?: {
    visitId?: string;
    campaignId?: string;
    orderReference?: string;
    relatedAmount?: number;
  }
): Promise<any> {
  if (pointsToAdd <= 0) {
    throw new AppError('تعداد امتیاز باید مثبت باشد', 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current loyalty record
      const loyalty = await tx.customerLoyalty.findUnique({
        where: { 
          customerId,
          tenantId
        }
      });

      if (!loyalty) {
        throw new AppError('رکورد وفاداری مشتری یافت نشد', 404);
      }

      const newBalance = loyalty.currentPoints + pointsToAdd;

      // Update loyalty record
      const updatedLoyalty = await tx.customerLoyalty.update({
        where: { 
          customerId,
          tenantId
        },
        data: {
          pointsEarned: loyalty.pointsEarned + pointsToAdd,
          currentPoints: newBalance,
          updatedAt: new Date()
        }
      });

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId,
          tenantId,
          transactionType: transactionType,
          pointsChange: pointsToAdd,
          description,
          notes: relatedData?.orderReference ? `سفارش: ${relatedData.orderReference}` : undefined,
          visitId: relatedData?.visitId,
          campaignId: relatedData?.campaignId,
          orderReference: relatedData?.orderReference,
          relatedAmount: relatedData?.relatedAmount,
          balanceAfter: newBalance,
          createdBy
        }
      });

      return { loyalty: updatedLoyalty, transaction };
    });

    // Update tier if needed (async, non-blocking)
    updateCustomerTier(customerId, tenantId).catch(console.error);

    return result;
  } catch (error: any) {
    console.error('Error adding loyalty points:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در افزودن امتیاز وفاداری', 500);
  }
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints(
  redemption: LoyaltyRedemption,
  tenantId: string,
  createdBy?: string
): Promise<any> {
  if (redemption.pointsToRedeem <= 0) {
    throw new AppError('تعداد امتیاز برای استفاده باید مثبت باشد', 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current loyalty record
      const loyalty = await tx.customerLoyalty.findUnique({
        where: { 
          customerId: redemption.customerId,
          tenantId
        }
      });

      if (!loyalty) {
        throw new AppError('رکورد وفاداری مشتری یافت نشد', 404);
      }

      if (loyalty.currentPoints < redemption.pointsToRedeem) {
        throw new AppError(
          `امتیاز کافی نیست. موجودی فعلی: ${loyalty.currentPoints} امتیاز`,
          400
        );
      }

      const newBalance = loyalty.currentPoints - redemption.pointsToRedeem;

      // Update loyalty record
      const updatedLoyalty = await tx.customerLoyalty.update({
        where: { 
          customerId: redemption.customerId,
          tenantId
        },
        data: {
          pointsRedeemed: loyalty.pointsRedeemed + redemption.pointsToRedeem,
          currentPoints: newBalance,
          updatedAt: new Date()
        }
      });

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId: redemption.customerId,
          tenantId,
          transactionType: 'REDEEMED_DISCOUNT',
          pointsChange: -redemption.pointsToRedeem,
          description: redemption.description,
          orderReference: redemption.orderReference,
          relatedAmount: redemption.relatedAmount,
          balanceAfter: newBalance,
          createdBy
        }
      });

      return { loyalty: updatedLoyalty, transaction };
    });

    return result;
  } catch (error: any) {
    console.error('Error redeeming loyalty points:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در استفاده از امتیاز وفاداری', 500);
  }
}

/**
 * Update customer tier based on spending and visits
 */
export async function updateCustomerTier(customerId: string, tenantId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE customer_loyalty 
      SET tier_level = calculate_loyalty_tier(
        lifetime_spent,
        total_visits,
        current_year_spent
      )::text::"LoyaltyTier"
      WHERE customer_id = ${customerId} AND tenant_id = ${tenantId}
    `;
  } catch (error) {
    console.error('Error updating customer tier:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Get loyalty transactions with filtering
 */
export async function getLoyaltyTransactions(
  filter: LoyaltyTransactionFilter = {}, 
  tenantId: string
): Promise<any> {
  const {
    page = 1,
    limit = 50,
    customerId,
    transactionType,
    startDate,
    endDate
  } = filter;

  const skip = (page - 1) * limit;
  const whereClause: any = {
    tenantId
  };

  if (customerId) whereClause.customerId = customerId;
  if (transactionType) whereClause.transactionType = transactionType;

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  try {
    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              name: true,
              phone: true
            }
          },
          visit: {
            select: {
              visitNumber: true,
              finalAmount: true
            }
          },
          createdByUser: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.loyaltyTransaction.count({ where: whereClause })
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error);
    throw new AppError('خطا در دریافت تراکنش‌های وفاداری', 500);
  }
}

/**
 * Get customer loyalty details with tier progress
 */
export async function getCustomerLoyaltyDetails(customerId: string, tenantId: string): Promise<any> {
  try {
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { 
        customerId,
        tenantId
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            segment: true
          }
        }
      }
    });

    if (!loyalty) {
      throw new AppError('اطلاعات وفاداری مشتری یافت نشد', 404);
    }

    // Calculate tier progress
    const tierProgress = calculateTierRequirements(
      loyalty.tierLevel,
      Number(loyalty.lifetimeSpent),
      loyalty.totalVisits,
      Number(loyalty.currentYearSpent)
    );

    // Get tier benefits
    const benefits = getTierBenefits(loyalty.tierLevel);

    // Get recent transactions
    const recentTransactions = await prisma.loyaltyTransaction.findMany({
      where: { 
        customerId,
        tenantId
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        visit: {
          select: { visitNumber: true, finalAmount: true }
        }
      }
    });

    return {
      ...loyalty,
      tierProgress,
      benefits,
      recentTransactions
    };
  } catch (error: any) {
    console.error('Error fetching customer loyalty details:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در دریافت جزئیات وفاداری مشتری', 500);
  }
}

/**
 * Award birthday bonus points
 */
export async function awardBirthdayBonus(customerId: string, tenantId: string, createdBy: string): Promise<any> {
  try {
    // Check if customer has loyalty record
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { 
        customerId,
        tenantId
      },
      include: {
        customer: {
          select: { name: true, birthday: true }
        }
      }
    });

    if (!loyalty) {
      throw new AppError('رکورد وفاداری مشتری یافت نشد', 404);
    }

    // Check if birthday bonus already awarded this year
    const thisYear = new Date().getFullYear();
    const existingBirthdayBonus = await prisma.loyaltyTransaction.findFirst({
      where: {
        customerId,
        tenantId,
        transactionType: 'EARNED_BIRTHDAY',
        createdAt: {
          gte: new Date(thisYear, 0, 1),
          lt: new Date(thisYear + 1, 0, 1)
        }
      }
    });

    if (existingBirthdayBonus) {
      throw new AppError('جایزه تولد امسال قبلاً اعطا شده است', 409);
    }

    // Calculate birthday bonus based on tier
    const tierBonuses = {
      BRONZE: 200,
      SILVER: 500,
      GOLD: 1000,
      PLATINUM: 2000
    };

    const bonusPoints = tierBonuses[loyalty.tierLevel];

    // Award points
    const result = await addLoyaltyPoints(
      customerId,
      bonusPoints,
      'EARNED_BIRTHDAY',
      `جایزه تولد - ${bonusPoints} امتیاز هدیه`,
      tenantId,
      createdBy
    );

    return result;
  } catch (error: any) {
    console.error('Error awarding birthday bonus:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در اعطای جایزه تولد', 500);
  }
}

/**
 * Expire old points (run as scheduled job)
 */
export async function expireOldPoints(tenantId: string, daysToExpire: number = 365): Promise<any> {
  try {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - daysToExpire);

    // Find points to expire
    const transactionsToExpire = await prisma.loyaltyTransaction.findMany({
      where: {
        tenantId,
        transactionType: {
          in: ['EARNED_PURCHASE', 'EARNED_BONUS', 'EARNED_REFERRAL', 'EARNED_BIRTHDAY']
        },
        pointsChange: { gt: 0 },
        createdAt: { lte: expireDate }
      },
      include: {
        customer: {
          select: { name: true, phone: true }
        }
      }
    });

    const results = [];

    for (const transaction of transactionsToExpire) {
      try {
        // Create expiration transaction
        const expirationResult = await prisma.$transaction(async (tx) => {
          // Reduce current points
          const loyalty = await tx.customerLoyalty.findUnique({
            where: { 
              customerId: transaction.customerId,
              tenantId
            }
          });

          if (!loyalty) return null;

          const pointsToExpire = Math.min(transaction.pointsChange, loyalty.currentPoints);
          
          if (pointsToExpire <= 0) return null;

          const newBalance = loyalty.currentPoints - pointsToExpire;

          await tx.customerLoyalty.update({
            where: { 
              customerId: transaction.customerId,
              tenantId
            },
            data: { currentPoints: newBalance }
          });

          // Create expiration record
          const expirationTransaction = await tx.loyaltyTransaction.create({
            data: {
              customerId: transaction.customerId,
              tenantId,
              transactionType: 'EXPIRED',
              pointsChange: -pointsToExpire,
              description: `انقضای امتیاز - مربوط به تراکنش ${transaction.createdAt.toLocaleDateString('fa-IR')}`,
              balanceAfter: newBalance
            }
          });

          return {
            customerId: transaction.customerId,
            customerName: transaction.customer.name,
            pointsExpired: pointsToExpire,
            newBalance
          };
        });

        if (expirationResult) {
          results.push(expirationResult);
        }
      } catch (error) {
        console.error(`Error expiring points for customer ${transaction.customerId}:`, error);
      }
    }

    return {
      totalExpired: results.length,
      totalPointsExpired: results.reduce((sum, r) => sum + r.pointsExpired, 0),
      details: results
    };
  } catch (error) {
    console.error('Error expiring old points:', error);
    throw new AppError('خطا در انقضای امتیازات قدیمی', 500);
  }
}

/**
 * Get loyalty program statistics
 */
export async function getLoyaltyStatistics(tenantId: string): Promise<any> {
  try {
    const [
      totalPoints,
      totalPointsEarned,
      totalPointsRedeemed,
      tierDistribution,
      recentTransactions,
      topCustomers,
      totalCustomers
    ] = await Promise.all([
      prisma.customerLoyalty.aggregate({
        where: { tenantId },
        _sum: { currentPoints: true }
      }),
      prisma.customerLoyalty.aggregate({
        where: { tenantId },
        _sum: { pointsEarned: true }
      }),
      prisma.customerLoyalty.aggregate({
        where: { tenantId },
        _sum: { pointsRedeemed: true }
      }),
      prisma.customerLoyalty.groupBy({
        where: { tenantId },
        by: ['tierLevel'],
        _count: true
      }),
      prisma.loyaltyTransaction.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.customerLoyalty.findMany({
        where: { tenantId },
        orderBy: { currentPoints: 'desc' },
        take: 10,
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          }
        }
      }),
      prisma.customerLoyalty.count({ where: { tenantId } })
    ]);

    const totalPointsIssued = totalPointsEarned._sum.pointsEarned || 0;
    const totalActivePoints = totalPoints._sum.currentPoints || 0;
    const totalRedeemedPoints = totalPointsRedeemed._sum.pointsRedeemed || 0;
    const customerCount = totalCustomers || 1;

    return {
      totalPointsIssued: totalPointsEarned._sum.pointsEarned || 0,
      totalPointsRedeemed: totalPointsRedeemed._sum.pointsRedeemed || 0,
      activePoints: totalPoints._sum.currentPoints || 0,
      averagePointsPerCustomer: Math.round((totalPoints._sum.currentPoints || 0) / Math.max(1, topCustomers.length)),
      topLoyaltyCustomers: topCustomers.map(customer => ({
        id: customer.customer.id || '',
        name: customer.customer.name,
        phone: customer.customer.phone,
        loyalty: {
          currentPoints: customer.currentPoints,
          tierLevel: customer.tierLevel
        }
      })),
      recentTransactionsCount: recentTransactions,
      tierDistribution: tierDistribution.reduce((acc: any, item: any) => {
        acc[item.tierLevel] = item._count;
        return acc;
      }, {}),
      monthlyTrends: []
    };
  } catch (error) {
    console.error('Error fetching loyalty statistics:', error);
    throw new AppError('خطا در دریافت آمار برنامه وفاداری', 500);
  }
} 