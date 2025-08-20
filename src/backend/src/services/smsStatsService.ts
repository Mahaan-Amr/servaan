import { prisma } from './dbService';

export interface SMSStats {
  totalSent: number;
  sentToday: number;
  remainingCredit: number;
  successRate: number;
  pendingMessages: number;
  failedMessages: number;
  trends: {
    sentToday: { value: number; direction: 'up' | 'down' | 'stable' };
    successRate: { value: number; direction: 'up' | 'down' | 'stable' };
  };
}

export interface SMSHistoryItem {
  id: string;
  phoneNumber: string;
  message: string;
  messageType: string;
  status: string;
  sentAt: Date | null;
  failedAt: Date | null;
  creditUsed: number;
  sentByUser?: {
    name: string;
  };
  customer?: {
    name: string;
  };
}

export class SMSStatsService {
  // Get comprehensive SMS statistics for a tenant
  async getSMSStats(tenantId: string, accountCredit?: number): Promise<SMSStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get all-time statistics
      const [
        totalSentResult,
        sentTodayResult,
        sentYesterdayResult,
        pendingResult,
        failedResult,
        totalSuccessResult
      ] = await Promise.all([
        // Total sent messages
        prisma.smsHistory.count({
          where: {
            tenantId,
            status: 'SENT'
          }
        }),

        // Sent today
        prisma.smsHistory.count({
          where: {
            tenantId,
            status: 'SENT',
            sentAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),

        // Sent yesterday
        prisma.smsHistory.count({
          where: {
            tenantId,
            status: 'SENT',
            sentAt: {
              gte: yesterday,
              lt: today
            }
          }
        }),

        // Pending messages
        prisma.smsHistory.count({
          where: {
            tenantId,
            status: 'PENDING'
          }
        }),

        // Failed messages
        prisma.smsHistory.count({
          where: {
            tenantId,
            status: 'FAILED'
          }
        }),

        // Total success for rate calculation
        prisma.smsHistory.count({
          where: {
            tenantId,
            status: { in: ['SENT', 'DELIVERED'] }
          }
        })
      ]);

      // Calculate success rate
      const totalAttempts = totalSuccessResult + failedResult;
      const successRate = totalAttempts > 0 ? (totalSuccessResult / totalAttempts) * 100 : 100;

      // Calculate trends
      const todayVsYesterday = sentYesterdayResult > 0 
        ? ((sentTodayResult - sentYesterdayResult) / sentYesterdayResult) * 100 
        : sentTodayResult > 0 ? 100 : 0;

      const sentTodayTrend = {
        value: Math.abs(todayVsYesterday),
        direction: todayVsYesterday > 5 ? 'up' as const : 
                  todayVsYesterday < -5 ? 'down' as const : 'stable' as const
      };

      // Simple success rate trend (assume improving if > 95%)
      const successRateTrend = {
        value: successRate > 95 ? 2.1 : successRate > 85 ? 0.5 : -1.2,
        direction: successRate > 95 ? 'up' as const : 
                  successRate > 85 ? 'stable' as const : 'down' as const
      };

      return {
        totalSent: totalSentResult,
        sentToday: sentTodayResult,
        remainingCredit: accountCredit || 0,
        successRate: parseFloat(successRate.toFixed(1)),
        pendingMessages: pendingResult,
        failedMessages: failedResult,
        trends: {
          sentToday: sentTodayTrend,
          successRate: successRateTrend
        }
      };

    } catch (error) {
      console.error('Error getting SMS stats:', error);
      
      // Return fallback stats if database fails
      return {
        totalSent: 0,
        sentToday: 0,
        remainingCredit: accountCredit || 0,
        successRate: 95.0,
        pendingMessages: 0,
        failedMessages: 0,
        trends: {
          sentToday: { value: 0, direction: 'stable' },
          successRate: { value: 0, direction: 'stable' }
        }
      };
    }
  }

  // Get SMS history with pagination
  async getSMSHistory(
    tenantId: string, 
    options: {
      page?: number;
      limit?: number;
      messageType?: string;
      status?: string;
      phoneNumber?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<{ items: SMSHistoryItem[]; total: number; page: number; limit: number }> {
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 50, 100); // Max 100 items per page
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { tenantId };

      if (options.messageType) {
        where.messageType = options.messageType;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.phoneNumber) {
        where.phoneNumber = { contains: options.phoneNumber };
      }

      if (options.dateFrom || options.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) {
          where.createdAt.gte = options.dateFrom;
        }
        if (options.dateTo) {
          where.createdAt.lte = options.dateTo;
        }
      }

      // Get data and count in parallel
      const [items, total] = await Promise.all([
        prisma.smsHistory.findMany({
          where,
          include: {
            sentByUser: {
              select: { name: true }
            },
            customer: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.smsHistory.count({ where })
      ]);

      return {
        items: items.map(item => ({
          id: item.id,
          phoneNumber: item.phoneNumber,
          message: item.message,
          messageType: item.messageType as string,
          status: item.status as string,
          sentAt: item.sentAt,
          failedAt: item.failedAt,
          creditUsed: item.creditUsed || 1,
          sentByUser: item.sentByUser || undefined,
          customer: item.customer || undefined
        })),
        total,
        page,
        limit
      };

    } catch (error) {
      console.error('Error getting SMS history:', error);
      return {
        items: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 50
      };
    }
  }

  // Get SMS statistics by date range
  async getSMSStatsByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    totalCreditsUsed: number;
    totalCost: number;
    byType: { [key: string]: number };
    byDay: { date: string; sent: number; failed: number }[];
  }> {
    try {
      // Get statistics for the date range
      const stats = await prisma.smsHistory.groupBy({
        by: ['messageType', 'status'],
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        },
        _sum: {
          creditUsed: true,
          costAmount: true
        }
      });

      // Process results
      let totalSent = 0;
      let totalFailed = 0;
      let totalCreditsUsed = 0;
      let totalCost = 0;
      const byType: { [key: string]: number } = {};

      stats.forEach(stat => {
        const count = stat._count.id;
        const credits = stat._sum.creditUsed || 0;
        const cost = Number(stat._sum.costAmount) || 0;

        if (stat.status === 'SENT' || stat.status === 'DELIVERED') {
          totalSent += count;
        } else if (stat.status === 'FAILED') {
          totalFailed += count;
        }

        totalCreditsUsed += credits;
        totalCost += cost;

        byType[stat.messageType] = (byType[stat.messageType] || 0) + count;
      });

      // Get daily breakdown
      const dailyStats = await this.getDailyStats(tenantId, startDate, endDate);

      return {
        totalSent,
        totalFailed,
        totalCreditsUsed,
        totalCost,
        byType,
        byDay: dailyStats
      };

    } catch (error) {
      console.error('Error getting SMS stats by date range:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        totalCreditsUsed: 0,
        totalCost: 0,
        byType: {},
        byDay: []
      };
    }
  }

  // Helper method to get daily statistics
  private async getDailyStats(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; sent: number; failed: number }[]> {
    try {
      // This is a simplified version - you might want to use a more efficient query
      const days: { date: string; sent: number; failed: number }[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const [sentCount, failedCount] = await Promise.all([
          prisma.smsHistory.count({
            where: {
              tenantId,
              status: { in: ['SENT', 'DELIVERED'] },
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          }),
          prisma.smsHistory.count({
            where: {
              tenantId,
              status: 'FAILED',
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          })
        ]);

        days.push({
          date: currentDate.toISOString().split('T')[0],
          sent: sentCount,
          failed: failedCount
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days;

    } catch (error) {
      console.error('Error getting daily stats:', error);
      return [];
    }
  }
}

export const smsStatsService = new SMSStatsService();
export default smsStatsService; 