import { PrismaClient, Prisma } from '../../../shared/generated/client';
import { AppError } from '../middlewares/errorHandler';
import { addLoyaltyPoints, calculatePointsFromAmount } from './loyaltyService';

const prisma = new PrismaClient();

// Types and Interfaces
export interface VisitFilter {
  page?: number;
  limit?: number;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  tableNumber?: string;
  serverName?: string;
  feedbackRating?: number;
}

export interface VisitCreateData {
  customerId: string;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  itemsOrdered?: any[];
  tableNumber?: string;
  serverName?: string;
  serviceDuration?: number;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackCategories?: string[];
  visitNotes?: string;
  pointsRedeemed?: number;
}

export interface VisitUpdateData {
  totalAmount?: number;
  discountAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  itemsOrdered?: any[];
  tableNumber?: string;
  serverName?: string;
  serviceDuration?: number;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackCategories?: string[];
  visitNotes?: string;
}

export interface VisitAnalytics {
  totalVisits: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageServiceDuration: number;
  averageRating: number;
  paymentMethodDistribution: Record<string, number>;
  topCustomers: any[];
  peakHours: any[];
  revenueByDay: any[];
}

/**
 * Create a new customer visit
 */
export async function createVisit(
  visitData: VisitCreateData,
  createdBy: string,
  tenantId: string // Added tenantId parameter
): Promise<any> {
  const { customerId, totalAmount, discountAmount = 0, pointsRedeemed = 0 } = visitData;

  if (totalAmount <= 0) {
    throw new AppError('مبلغ کل باید مثبت باشد', 400);
  }

  if (discountAmount < 0) {
    throw new AppError('مبلغ تخفیف نمی‌تواند منفی باشد', 400);
  }

  if (pointsRedeemed < 0) {
    throw new AppError('امتیاز استفاده شده نمی‌تواند منفی باشد', 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify customer exists
      const customer = await tx.customer.findUnique({
        where: { 
          id: customerId, 
          isActive: true,
          tenantId // Added tenantId filter
        },
        include: { loyalty: true }
      });

      if (!customer) {
        throw new AppError('مشتری یافت نشد', 404);
      }

      // Check if customer has enough points to redeem
      if (pointsRedeemed > 0 && (!customer.loyalty || customer.loyalty.currentPoints < pointsRedeemed)) {
        throw new AppError('امتیاز کافی برای استفاده وجود ندارد', 400);
      }

      // Get next visit number for this customer
      const lastVisit = await tx.customerVisit.findFirst({
        where: { customerId },
        orderBy: { visitNumber: 'desc' }
      });

      const visitNumber = (lastVisit?.visitNumber || 0) + 1;
      const finalAmount = totalAmount - discountAmount;

      // Calculate earned points
      const earnedPoints = calculatePointsFromAmount(finalAmount);

      // Create visit record
      const visit = await tx.customerVisit.create({
        data: {
          customerId,
          tenantId, // Added tenantId
          visitNumber,
          totalAmount,
          discountAmount,
          finalAmount,
          paymentMethod: visitData.paymentMethod,
          itemsOrdered: visitData.itemsOrdered || [],
          itemCount: Array.isArray(visitData.itemsOrdered) ? 
            visitData.itemsOrdered.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0,
          tableNumber: visitData.tableNumber,
          serverName: visitData.serverName,
          serviceDuration: visitData.serviceDuration,
          feedbackRating: visitData.feedbackRating,
          feedbackComment: visitData.feedbackComment,
          feedbackCategories: visitData.feedbackCategories || [],
          pointsEarned: earnedPoints,
          pointsRedeemed,
          visitNotes: visitData.visitNotes,
          createdBy
        },
        include: {
          customer: {
            select: { name: true, phone: true }
          },
          createdByUser: {
            select: { name: true }
          }
        }
      });

      // Update customer loyalty
      if (customer.loyalty) {
        const newMonthSpent = Number(customer.loyalty.currentMonthSpent) + finalAmount;
        const newYearSpent = Number(customer.loyalty.currentYearSpent) + finalAmount;
        const newLifetimeSpent = Number(customer.loyalty.lifetimeSpent) + finalAmount;
        const newVisitsThisMonth = customer.loyalty.visitsThisMonth + 1;
        const newTotalVisits = customer.loyalty.totalVisits + 1;

        await tx.customerLoyalty.update({
          where: { customerId },
          data: {
            currentMonthSpent: newMonthSpent,
            currentYearSpent: newYearSpent,
            lifetimeSpent: newLifetimeSpent,
            visitsThisMonth: newVisitsThisMonth,
            totalVisits: newTotalVisits,
            lastVisitDate: new Date(),
            firstVisitDate: customer.loyalty.firstVisitDate || new Date(),
            updatedAt: new Date()
          }
        });

        // Handle point redemption if any
        if (pointsRedeemed > 0) {
          await tx.customerLoyalty.update({
            where: { customerId },
            data: {
              pointsRedeemed: customer.loyalty.pointsRedeemed + pointsRedeemed,
              currentPoints: customer.loyalty.currentPoints - pointsRedeemed
            }
          });

          // Create redemption transaction
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              tenantId, // Added tenantId
              transactionType: 'REDEEMED_DISCOUNT',
              pointsChange: -pointsRedeemed,
              description: `استفاده از امتیاز در بازدید شماره ${visitNumber}`,
              visitId: visit.id,
              orderReference: `VISIT-${visitNumber}`,
              relatedAmount: finalAmount,
              balanceAfter: customer.loyalty.currentPoints - pointsRedeemed,
              createdBy
            }
          });
        }

        // Add earned points
        if (earnedPoints > 0) {
          await tx.customerLoyalty.update({
            where: { customerId },
            data: {
              pointsEarned: customer.loyalty.pointsEarned + earnedPoints,
              currentPoints: customer.loyalty.currentPoints - pointsRedeemed + earnedPoints
            }
          });

          // Create earning transaction
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              tenantId, // Added tenantId
              transactionType: 'EARNED_PURCHASE',
              pointsChange: earnedPoints,
              description: `کسب امتیاز از خرید ${finalAmount.toLocaleString()} ریال`,
              visitId: visit.id,
              orderReference: `VISIT-${visitNumber}`,
              relatedAmount: finalAmount,
              balanceAfter: customer.loyalty.currentPoints - pointsRedeemed + earnedPoints,
              createdBy
            }
          });
        }
      }

      return visit;
    });

    // Update customer segment asynchronously
    updateCustomerSegmentFromVisit(customerId, tenantId).catch(console.error);

    return result;
  } catch (error: any) {
    console.error('Error creating visit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در ثبت بازدید', 500);
  }
}

/**
 * Get visit by ID
 */
export async function getVisitById(id: string, tenantId: string): Promise<any> { // Added tenantId parameter
  try {
    const visit = await prisma.customerVisit.findUnique({
      where: { 
        id,
        tenantId // Added tenantId filter
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            email: true,
            segment: true
          }
        },
        createdByUser: {
          select: { name: true, email: true }
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' }
        },
        feedback: true
      }
    });

    if (!visit) {
      throw new AppError('بازدید یافت نشد', 404);
    }

    return visit;
  } catch (error: any) {
    console.error('Error fetching visit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در دریافت بازدید', 500);
  }
}

/**
 * Update visit
 */
export async function updateVisit(
  id: string,
  updateData: VisitUpdateData,
  updatedBy: string,
  tenantId: string // Added tenantId parameter
): Promise<any> {
  try {
    const existingVisit = await prisma.customerVisit.findUnique({
      where: { 
        id,
        tenantId // Added tenantId filter
      },
      include: { customer: { include: { loyalty: true } } }
    });

    if (!existingVisit) {
      throw new AppError('بازدید یافت نشد', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Calculate new final amount if total or discount changed
      let finalAmount = Number(existingVisit.finalAmount);
      if (updateData.totalAmount !== undefined || updateData.discountAmount !== undefined) {
        const newTotal = updateData.totalAmount ?? Number(existingVisit.totalAmount);
        const newDiscount = updateData.discountAmount ?? Number(existingVisit.discountAmount);
        finalAmount = newTotal - newDiscount;

        if (newTotal <= 0) {
          throw new AppError('مبلغ کل باید مثبت باشد', 400);
        }

        if (newDiscount < 0) {
          throw new AppError('مبلغ تخفیف نمی‌تواند منفی باشد', 400);
        }
      }

      // Update visit
      const updatedVisit = await tx.customerVisit.update({
        where: { id },
        data: {
          ...updateData,
          finalAmount: finalAmount,
          itemCount: updateData.itemsOrdered ? 
            updateData.itemsOrdered.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
            existingVisit.itemCount,
          updatedAt: new Date()
        },
        include: {
          customer: {
            select: { name: true, phone: true }
          },
          createdByUser: {
            select: { name: true }
          }
        }
      });

      // If amount changed, update loyalty calculations
      const originalAmount = Number(existingVisit.finalAmount);
      if (finalAmount !== originalAmount && existingVisit.customer.loyalty) {
        const amountDifference = finalAmount - originalAmount;
        const pointsDifference = calculatePointsFromAmount(Math.abs(amountDifference));

        await tx.customerLoyalty.update({
          where: { customerId: existingVisit.customerId },
          data: {
            lifetimeSpent: Number(existingVisit.customer.loyalty.lifetimeSpent) + amountDifference,
            currentYearSpent: Number(existingVisit.customer.loyalty.currentYearSpent) + amountDifference,
            currentMonthSpent: Number(existingVisit.customer.loyalty.currentMonthSpent) + amountDifference,
            pointsEarned: amountDifference > 0 ? 
              existingVisit.customer.loyalty.pointsEarned + pointsDifference :
              existingVisit.customer.loyalty.pointsEarned - pointsDifference,
            currentPoints: amountDifference > 0 ?
              existingVisit.customer.loyalty.currentPoints + pointsDifference :
              existingVisit.customer.loyalty.currentPoints - pointsDifference
          }
        });

        // Create adjustment transaction
        if (pointsDifference > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: existingVisit.customerId,
              tenantId, // Added tenantId
              transactionType: amountDifference > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUBTRACT',
              pointsChange: amountDifference > 0 ? pointsDifference : -pointsDifference,
              description: `تعدیل امتیاز بابت تغییر مبلغ بازدید شماره ${existingVisit.visitNumber}`,
              visitId: id,
              relatedAmount: Math.abs(amountDifference),
              balanceAfter: amountDifference > 0 ?
                existingVisit.customer.loyalty.currentPoints + pointsDifference :
                existingVisit.customer.loyalty.currentPoints - pointsDifference,
              createdBy: updatedBy
            }
          });
        }
      }

      return updatedVisit;
    });

    return result;
  } catch (error: any) {
    console.error('Error updating visit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در بروزرسانی بازدید', 500);
  }
}

/**
 * Get visits with filtering and pagination
 */
export async function getVisits(filter: VisitFilter = {}, tenantId: string): Promise<any> {
  const {
    page = 1,
    limit = 50,
    customerId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentMethod,
    tableNumber,
    serverName,
    feedbackRating
  } = filter;

  const skip = (page - 1) * limit;
  const whereClause: any = { tenantId }; // Added tenantId filter

  // Build filters
  if (customerId) whereClause.customerId = customerId;
  if (paymentMethod) whereClause.paymentMethod = paymentMethod;
  if (tableNumber) whereClause.tableNumber = { contains: tableNumber };
  if (serverName) whereClause.serverName = { contains: serverName, mode: 'insensitive' };
  if (feedbackRating) whereClause.feedbackRating = { gte: feedbackRating };

  if (startDate || endDate) {
    whereClause.visitDate = {};
    if (startDate) whereClause.visitDate.gte = startDate;
    if (endDate) whereClause.visitDate.lte = endDate;
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    whereClause.finalAmount = {};
    if (minAmount !== undefined) whereClause.finalAmount.gte = minAmount;
    if (maxAmount !== undefined) whereClause.finalAmount.lte = maxAmount;
  }

  try {
    const [visits, total] = await Promise.all([
      prisma.customerVisit.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
              segment: true
            }
          },
          createdByUser: {
            select: { name: true }
          },
          _count: {
            select: {
              feedback: true,
              loyaltyTransactions: true
            }
          }
        },
        orderBy: { visitDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.customerVisit.count({ where: whereClause })
    ]);

    return {
      visits,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching visits:', error);
    throw new AppError('خطا در دریافت بازدیدها', 500);
  }
}

/**
 * Get customer visit history
 */
export async function getCustomerVisitHistory(
  customerId: string, 
  page: number = 1, 
  limit: number = 20,
  tenantId: string
): Promise<any> {
  try {
    const skip = (page - 1) * limit;

    const [visits, total, customer] = await Promise.all([
      prisma.customerVisit.findMany({
        where: { customerId, tenantId }, // Added tenantId filter
        include: {
          createdByUser: {
            select: { name: true }
          },
          loyaltyTransactions: {
            where: { visitId: { not: null } }
          }
        },
        orderBy: { visitDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.customerVisit.count({ where: { customerId, tenantId } }), // Added tenantId filter
      prisma.customer.findUnique({
        where: { id: customerId, tenantId }, // Added tenantId filter
        select: {
          name: true,
          phone: true,
          segment: true,
          loyalty: true
        }
      })
    ]);

    if (!customer) {
      throw new AppError('مشتری یافت نشد', 404);
    }

    return {
      customer,
      visits,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error: any) {
    console.error('Error fetching customer visit history:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در دریافت تاریخچه بازدید مشتری', 500);
  }
}

/**
 * Get visit analytics with date filtering
 */
export async function getVisitAnalytics(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<VisitAnalytics> {
  try {
    const whereClause: any = { tenantId }; // Added tenantId filter
    
    if (startDate || endDate) {
      whereClause.visitDate = {};
      if (startDate) whereClause.visitDate.gte = startDate;
      if (endDate) whereClause.visitDate.lte = endDate;
    }

    const [
      totalStats,
      paymentStats,
      topCustomers
    ] = await Promise.all([
      // Basic statistics
      prisma.customerVisit.aggregate({
        where: whereClause,
        _count: true,
        _sum: { finalAmount: true, serviceDuration: true },
        _avg: { finalAmount: true, serviceDuration: true, feedbackRating: true }
      }),

      // Payment method distribution
      prisma.customerVisit.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: true,
        _sum: { finalAmount: true }
      }),

      // Top customers by visits
      prisma.customerVisit.groupBy({
        by: ['customerId'],
        where: whereClause,
        _count: true,
        _sum: { finalAmount: true },
        orderBy: { _count: { customerId: 'desc' } },
        take: 10
      })
    ]);

    // Get customer details for top customers
    const topCustomerIds = topCustomers.map(tc => tc.customerId);
    const customerDetails = await prisma.customer.findMany({
      where: { id: { in: topCustomerIds }, tenantId }, // Added tenantId filter
      select: { id: true, name: true, phone: true }
    });

    const topCustomersWithDetails = topCustomers.map(tc => {
      const customer = customerDetails.find(c => c.id === tc.customerId);
      return {
        customer: customer || { name: 'نامشخص', phone: '-' },
        visitCount: tc._count,
        totalSpent: tc._sum.finalAmount || 0
      };
    });

    return {
      totalVisits: totalStats._count,
      totalRevenue: Number(totalStats._sum.finalAmount) || 0,
      averageOrderValue: Number(totalStats._avg.finalAmount) || 0,
      averageServiceDuration: Number(totalStats._avg.serviceDuration) || 0,
      averageRating: Number(totalStats._avg.feedbackRating) || 0,
      paymentMethodDistribution: paymentStats.reduce((acc: any, stat: any) => {
        acc[stat.paymentMethod || 'UNKNOWN'] = stat._count;
        return acc;
      }, {}),
      topCustomers: topCustomersWithDetails,
      peakHours: [], // Simplified for now
      revenueByDay: [] // Simplified for now
    };
  } catch (error) {
    console.error('Error fetching visit analytics:', error);
    throw new AppError('خطا در دریافت آمار بازدیدها', 500);
  }
}

/**
 * Update customer segment based on visit behavior
 */
async function updateCustomerSegmentFromVisit(customerId: string, tenantId: string): Promise<void> {
  try {
    // This would use the customer segmentation logic
    // For now, we'll update based on simple rules
    const loyalty = await prisma.customerLoyalty.findUnique({
      where: { customerId, tenantId } // Added tenantId filter
    });

    if (!loyalty) return;

    let newSegment = 'NEW';
    
    if (loyalty.totalVisits >= 50 || Number(loyalty.lifetimeSpent) >= 15000000) {
      newSegment = 'VIP';
    } else if (loyalty.totalVisits >= 20 || Number(loyalty.lifetimeSpent) >= 5000000) {
      newSegment = 'REGULAR';
    } else if (loyalty.totalVisits >= 5 || Number(loyalty.lifetimeSpent) >= 1000000) {
      newSegment = 'OCCASIONAL';
    }

    await prisma.customer.update({
      where: { id: customerId, tenantId }, // Added tenantId filter
      data: { segment: newSegment as any }
    });
  } catch (error) {
    console.error('Error updating customer segment:', error);
    // Don't throw - this is background operation
  }
}

/**
 * Delete visit (soft delete with cleanup)
 */
export async function deleteVisit(id: string, deletedBy: string, tenantId: string): Promise<void> {
  try {
    const visit = await prisma.customerVisit.findUnique({
      where: { id, tenantId }, // Added tenantId filter
      include: {
        customer: { include: { loyalty: true } },
        loyaltyTransactions: true
      }
    });

    if (!visit) {
      throw new AppError('بازدید یافت نشد', 404);
    }

    await prisma.$transaction(async (tx) => {
      // Remove loyalty transactions related to this visit
      await tx.loyaltyTransaction.deleteMany({
        where: { visitId: id, tenantId } // Added tenantId filter
      });

      // Update customer loyalty stats
      if (visit.customer.loyalty) {
        await tx.customerLoyalty.update({
          where: { customerId: visit.customerId, tenantId }, // Added tenantId filter
          data: {
            lifetimeSpent: Number(visit.customer.loyalty.lifetimeSpent) - Number(visit.finalAmount),
            currentYearSpent: Number(visit.customer.loyalty.currentYearSpent) - Number(visit.finalAmount),
            currentMonthSpent: Number(visit.customer.loyalty.currentMonthSpent) - Number(visit.finalAmount),
            totalVisits: visit.customer.loyalty.totalVisits - 1,
            visitsThisMonth: visit.customer.loyalty.visitsThisMonth - 1,
            pointsEarned: visit.customer.loyalty.pointsEarned - (visit.pointsEarned || 0),
            pointsRedeemed: visit.customer.loyalty.pointsRedeemed - (visit.pointsRedeemed || 0),
            currentPoints: visit.customer.loyalty.currentPoints - (visit.pointsEarned || 0) + (visit.pointsRedeemed || 0)
          }
        });
      }

      // Delete the visit
      await tx.customerVisit.delete({
        where: { id, tenantId } // Added tenantId filter
      });
    });
  } catch (error: any) {
    console.error('Error deleting visit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('خطا در حذف بازدید', 500);
  }
} 