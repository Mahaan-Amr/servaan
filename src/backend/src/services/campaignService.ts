import { PrismaClient } from '../../../shared/generated/client';
import { z } from 'zod';
import smsService from './smsService';

const prisma = new PrismaClient();

// Campaign interfaces
export interface CampaignCreateData {
  name: string;
  description?: string;
  campaignType: 'SMS' | 'INSTAGRAM' | 'EMAIL' | 'PUSH';
  targetSegment: Record<string, any>;
  templateContent: string;
  templateVariables?: Record<string, any>;
  scheduledDate?: Date;
  estimatedCost?: number;
  costPerMessage?: number;
  tenantId: string; // Add tenantId to interface
}

export interface CampaignUpdateData {
  name?: string;
  description?: string;
  targetSegment?: Record<string, any>;
  templateVariables?: Record<string, any>;
  scheduledDate?: Date;
  status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  estimatedCost?: number;
  costPerMessage?: number;
}

export interface CampaignFilter {
  page?: number;
  limit?: number;
  search?: string;
  campaignType?: 'SMS' | 'INSTAGRAM' | 'EMAIL' | 'PUSH';
  status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdFrom?: Date;
  createdTo?: Date;
  scheduledFrom?: Date;
  scheduledTo?: Date;
}

export interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  averageDeliveryRate: number;
  averageOpenRate: number;
  totalCost: number;
  costPerMessage: number;
  campaignsByType: Record<string, number>;
  campaignsByStatus: Record<string, number>;
  monthlyStats: Array<{
    month: string;
    campaigns: number;
    messagesSent: number;
    cost: number;
  }>;
}

export interface CampaignPerformance {
  campaignId: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  messagesOpened: number;
  deliveryRate: number;
  openRate: number;
  failureRate: number;
  totalCost: number;
  costPerMessage: number;
  avgDeliveryTime: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// Campaign CRUD Operations
export const createCampaign = async (
  campaignData: CampaignCreateData,
  createdBy: string
): Promise<any> => {
  try {
    // Validate campaign data
    if (!campaignData.name || campaignData.name.trim().length < 2) {
      throw new Error('نام کمپین باید حداقل 2 کاراکتر باشد');
    }

    if (!campaignData.templateContent || campaignData.templateContent.trim().length < 10) {
      throw new Error('محتوای کمپین باید حداقل 10 کاراکتر باشد');
    }

    // Estimate recipients based on target segment
    const estimatedRecipients = await estimateRecipients(campaignData.targetSegment, campaignData.tenantId);

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignData.name.trim(),
        description: campaignData.description?.trim() || null,
        campaignType: campaignData.campaignType,
        targetSegment: campaignData.targetSegment,
        templateContent: campaignData.templateContent.trim(),
        templateVariables: campaignData.templateVariables || {},
        scheduledDate: campaignData.scheduledDate,
        estimatedRecipients,
        estimatedCost: campaignData.estimatedCost || (estimatedRecipients * (campaignData.costPerMessage || 100)),
        costPerMessage: campaignData.costPerMessage || 100,
        status: campaignData.scheduledDate ? 'SCHEDULED' : 'DRAFT',
        createdBy,
        tenantId: campaignData.tenantId // Add tenantId
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Schedule campaign if needed
    if (campaignData.scheduledDate && campaignData.scheduledDate > new Date()) {
      await scheduleCampaign(campaign.id, campaignData.scheduledDate);
    }

    return campaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const getCampaigns = async (filter: CampaignFilter = {}, tenantId: string) => {
  try {
    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100);
    const offset = (page - 1) * limit;

    const where: any = {
      tenantId: tenantId // Add tenant filtering
    };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    if (filter.campaignType) {
      where.campaignType = filter.campaignType;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.createdFrom) {
      where.createdAt = { gte: filter.createdFrom };
    }

    if (filter.createdTo) {
      where.createdAt = { ...where.createdAt, lte: filter.createdTo };
    }

    if (filter.scheduledFrom) {
      where.scheduledDate = { gte: filter.scheduledFrom };
    }

    if (filter.scheduledTo) {
      where.scheduledDate = { ...where.scheduledDate, lte: filter.scheduledTo };
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              deliveries: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.campaign.count({ where })
    ]);

    return {
      campaigns,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

export const getCampaignById = async (id: string, tenantId: string) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        deliveries: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                segment: true
              }
            }
          },
          orderBy: { queuedAt: 'desc' },
          take: 100
        }
      }
    });

    if (!campaign) {
      throw new Error('کمپین یافت نشد');
    }

    return campaign;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }
};

export const updateCampaign = async (
  id: string,
  updateData: CampaignUpdateData,
  updatedBy: string,
  tenantId: string
) => {
  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      }
    });

    if (!existingCampaign) {
      throw new Error('کمپین یافت نشد');
    }

    // Prevent updating campaigns that are already sent/completed
    if (['SENT', 'COMPLETED'].includes(existingCampaign.status)) {
      throw new Error('نمی‌توان کمپین ارسال شده را ویرایش کرد');
    }

    // Re-estimate recipients if target segment changed
    let estimatedRecipients = existingCampaign.estimatedRecipients;
    if (updateData.targetSegment) {
      estimatedRecipients = await estimateRecipients(updateData.targetSegment, tenantId);
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        ...updateData,
        estimatedRecipients,
        estimatedCost: updateData.estimatedCost || ((estimatedRecipients || 0) * Number(updateData.costPerMessage || existingCampaign.costPerMessage || 100)),
        updatedAt: new Date()
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedCampaign;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

export const deleteCampaign = async (id: string, tenantId: string) => {
  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      }
    });

    if (!existingCampaign) {
      throw new Error('کمپین یافت نشد');
    }

    // Prevent deleting campaigns that are already sent/completed
    if (['SENDING', 'SENT', 'COMPLETED'].includes(existingCampaign.status)) {
      throw new Error('نمی‌توان کمپین در حال ارسال یا ارسال شده را حذف کرد');
    }

    await prisma.campaign.delete({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      }
    });

    return { message: 'کمپین با موفقیت حذف شد' };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// Campaign Execution
export const sendCampaign = async (id: string, approvedBy: string, tenantId: string) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      include: {
        deliveries: true
      }
    });

    if (!campaign) {
      throw new Error('کمپین یافت نشد');
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new Error('فقط کمپین‌های پیش‌نویس یا زمان‌بندی شده قابل ارسال هستند');
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        status: 'SENDING',
        approvedBy,
        approvedAt: new Date(),
        sentDate: new Date()
      }
    });

    // Get target customers
    const targetCustomers = await getTargetCustomers(campaign.targetSegment as Record<string, any>, tenantId);

    // Create campaign deliveries
    const deliveries = await createCampaignDeliveries(campaign, targetCustomers, tenantId);

    // Send messages based on campaign type
    if (campaign.campaignType === 'SMS') {
      await sendSMSCampaign(campaign, deliveries, tenantId);
    }

    // Update campaign statistics
    await updateCampaignStats(id, tenantId);

    return {
      message: 'کمپین با موفقیت ارسال شد',
      deliveries: deliveries.length
    };
  } catch (error) {
    console.error('Error sending campaign:', error);
    
    // Update campaign status to failed
    await prisma.campaign.update({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        status: 'FAILED'
      }
    });

    throw error;
  }
};

// Campaign Analytics
export const getCampaignAnalytics = async (tenantId: string): Promise<CampaignAnalytics> => {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      campaignStats,
      campaignsByType,
      campaignsByStatus,
      monthlyStats
    ] = await Promise.all([
      prisma.campaign.count({ where: { tenantId: tenantId } }),
      prisma.campaign.count({
        where: {
          tenantId: tenantId,
          status: {
            in: ['DRAFT', 'SCHEDULED', 'SENDING']
          }
        }
      }),
      prisma.campaign.count({
        where: {
          tenantId: tenantId,
          status: {
            in: ['SENT', 'COMPLETED']
          }
        }
      }),
      prisma.campaign.aggregate({
        where: { tenantId: tenantId },
        _sum: {
          messagesSent: true,
          messagesDelivered: true,
          actualCost: true
        }
      }),
      prisma.campaign.groupBy({
        by: ['campaignType'],
        where: { tenantId: tenantId },
        _count: {
          id: true
        }
      }),
      prisma.campaign.groupBy({
        by: ['status'],
        where: { tenantId: tenantId },
        _count: {
          id: true
        }
      }),
      getMonthlyStats(tenantId)
    ]);

    const totalMessagesSent = campaignStats._sum.messagesSent || 0;
    const totalMessagesDelivered = campaignStats._sum.messagesDelivered || 0;
    const totalCost = Number(campaignStats._sum.actualCost) || 0;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalMessagesSent,
      totalMessagesDelivered,
      averageDeliveryRate: totalMessagesSent > 0 ? (totalMessagesDelivered / totalMessagesSent) * 100 : 0,
      averageOpenRate: 0, // TODO: Implement open rate tracking
      totalCost,
      costPerMessage: totalMessagesSent > 0 ? totalCost / totalMessagesSent : 0,
      campaignsByType: campaignsByType.reduce((acc, item) => {
        acc[item.campaignType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      campaignsByStatus: campaignsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      monthlyStats
    };
  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    throw error;
  }
};

export const getCampaignPerformance = async (id: string, tenantId: string): Promise<CampaignPerformance> => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        tenantId: tenantId // Add tenant filtering
      },
      include: {
        deliveries: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      throw new Error('کمپین یافت نشد');
    }

    const deliveries = campaign.deliveries;
    const messagesSent = deliveries.length;
    const messagesDelivered = deliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;
    const messagesFailed = deliveries.filter(d => d.deliveryStatus === 'FAILED').length;
    const messagesOpened = deliveries.filter(d => d.openedAt).length;

    const deliveryRate = messagesSent > 0 ? (messagesDelivered / messagesSent) * 100 : 0;
    const openRate = messagesDelivered > 0 ? (messagesOpened / messagesDelivered) * 100 : 0;
    const failureRate = messagesSent > 0 ? (messagesFailed / messagesSent) * 100 : 0;

    const totalCost = Number(campaign.actualCost) || 0;
    const costPerMessage = messagesSent > 0 ? totalCost / messagesSent : 0;

    // Calculate average delivery time
    const deliveredMessages = deliveries.filter(d => d.deliveredAt && d.sentAt);
    const avgDeliveryTime = deliveredMessages.length > 0 
      ? deliveredMessages.reduce((sum, d) => {
          const deliveryTime = new Date(d.deliveredAt!).getTime() - new Date(d.sentAt!).getTime();
          return sum + deliveryTime;
        }, 0) / deliveredMessages.length / 1000 // Convert to seconds
      : 0;

    // Get top failure reasons
    const failureReasons = deliveries
      .filter(d => d.deliveryStatus === 'FAILED' && d.errorMessage)
      .reduce((acc, d) => {
        const reason = d.errorMessage || 'نامشخص';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topFailureReasons = Object.entries(failureReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      campaignId: id,
      messagesSent,
      messagesDelivered,
      messagesFailed,
      messagesOpened,
      deliveryRate,
      openRate,
      failureRate,
      totalCost,
      costPerMessage,
      avgDeliveryTime,
      topFailureReasons
    };
  } catch (error) {
    console.error('Error getting campaign performance:', error);
    throw error;
  }
};

// Helper functions
const estimateRecipients = async (targetSegment: Record<string, any>, tenantId: string): Promise<number> => {
  try {
    const where: any = {
      tenantId: tenantId // Add tenant filtering
    };

    if (targetSegment.segments && targetSegment.segments.length > 0) {
      where.segment = { in: targetSegment.segments };
    }

    if (targetSegment.tiers && targetSegment.tiers.length > 0) {
      where.loyalty = {
        tierLevel: { in: targetSegment.tiers },
        tenantId: tenantId // Add tenant filtering to loyalty
      };
    }

    if (targetSegment.allowMarketing !== undefined) {
      where.allowMarketing = targetSegment.allowMarketing;
    }

    if (targetSegment.status) {
      where.status = targetSegment.status;
    }

    const count = await prisma.customer.count({ where });
    return count;
  } catch (error) {
    console.error('Error estimating recipients:', error);
    return 0;
  }
};

const getTargetCustomers = async (targetSegment: Record<string, any>, tenantId: string) => {
  try {
    const where: any = {
      tenantId: tenantId // Add tenant filtering
    };

    if (targetSegment.segments && targetSegment.segments.length > 0) {
      where.segment = { in: targetSegment.segments };
    }

    if (targetSegment.tiers && targetSegment.tiers.length > 0) {
      where.loyalty = {
        tierLevel: { in: targetSegment.tiers },
        tenantId: tenantId // Add tenant filtering to loyalty
      };
    }

    if (targetSegment.allowMarketing !== undefined) {
      where.allowMarketing = targetSegment.allowMarketing;
    }

    if (targetSegment.status) {
      where.status = targetSegment.status;
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        loyalty: true
      }
    });

    return customers;
  } catch (error) {
    console.error('Error getting target customers:', error);
    return [];
  }
};

const createCampaignDeliveries = async (campaign: any, customers: any[], tenantId: string) => {
  try {
    const deliveries = customers.map(customer => ({
      campaignId: campaign.id,
      customerId: customer.id,
      recipientPhone: customer.phone,
      recipientName: customer.name,
      messageContent: campaign.templateContent,
      personalizedContent: personalizeMessage(campaign.templateContent, customer, campaign.templateVariables),
      deliveryStatus: 'QUEUED' as const,
      messageCost: Number(campaign.costPerMessage) || 100,
      tenantId: tenantId // Add tenantId
    }));

    const createdDeliveries = await prisma.campaignDelivery.createMany({
      data: deliveries
    });

    return deliveries;
  } catch (error) {
    console.error('Error creating campaign deliveries:', error);
    throw error;
  }
};

const personalizeMessage = (template: string, customer: any, variables: any = {}) => {
  let personalizedMessage = template;

  // Replace customer variables
  personalizedMessage = personalizedMessage.replace(/\{customerName\}/g, customer.name);
  personalizedMessage = personalizedMessage.replace(/\{firstName\}/g, customer.name.split(' ')[0]);
  personalizedMessage = personalizedMessage.replace(/\{segment\}/g, customer.segment);
  personalizedMessage = personalizedMessage.replace(/\{tierLevel\}/g, customer.loyalty?.tierLevel || 'BRONZE');
  personalizedMessage = personalizedMessage.replace(/\{currentPoints\}/g, customer.loyalty?.currentPoints || 0);

  // Replace custom variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    personalizedMessage = personalizedMessage.replace(regex, String(value));
  });

  return personalizedMessage;
};

const sendSMSCampaign = async (campaign: any, deliveries: any[], tenantId: string) => {
  try {
    // Get all pending deliveries
    const pendingDeliveries = await prisma.campaignDelivery.findMany({
      where: {
        campaignId: campaign.id,
        deliveryStatus: 'QUEUED',
        tenantId: tenantId // Add tenant filtering
      },
      include: {
        customer: true
      }
    });

    // Send SMS messages in batches
    const batchSize = 100;
    for (let i = 0; i < pendingDeliveries.length; i += batchSize) {
      const batch = pendingDeliveries.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (delivery) => {
        try {
          // Update delivery status to sending
          await prisma.campaignDelivery.update({
            where: { 
              id: delivery.id,
              tenantId: tenantId // Add tenant filtering
            },
            data: {
              deliveryStatus: 'SENDING',
              sentAt: new Date()
            }
          });

          // Send SMS using the SMS service
          const result = await smsService.sendBulkSMS([delivery.recipientPhone], delivery.personalizedContent || delivery.messageContent);

          // Update delivery status based on result
          if (result.return && result.return.status === 200) {
            await prisma.campaignDelivery.update({
              where: { 
                id: delivery.id,
                tenantId: tenantId // Add tenant filtering
              },
              data: {
                deliveryStatus: 'SENT',
                providerMessageId: result.entries?.[0]?.messageid,
                deliveredAt: new Date()
              }
            });
          } else {
            await prisma.campaignDelivery.update({
              where: { 
                id: delivery.id,
                tenantId: tenantId // Add tenant filtering
              },
              data: {
                deliveryStatus: 'FAILED',
                errorMessage: result.return?.message || 'خطا در ارسال پیامک',
                failedAt: new Date()
              }
            });
          }
        } catch (error) {
          console.error('Error sending SMS to:', delivery.recipientPhone, error);
          await prisma.campaignDelivery.update({
            where: { 
              id: delivery.id,
              tenantId: tenantId // Add tenant filtering
            },
            data: {
              deliveryStatus: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'خطا در ارسال پیامک',
              failedAt: new Date()
            }
          });
        }
      }));

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update campaign status to completed
    await prisma.campaign.update({
      where: { 
        id: campaign.id,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        status: 'COMPLETED'
      }
    });

  } catch (error) {
    console.error('Error sending SMS campaign:', error);
    throw error;
  }
};

const updateCampaignStats = async (campaignId: string, tenantId: string) => {
  try {
    const deliveries = await prisma.campaignDelivery.findMany({
      where: { 
        campaignId,
        tenantId: tenantId // Add tenant filtering
      }
    });

    const messagesSent = deliveries.length;
    const messagesDelivered = deliveries.filter(d => d.deliveryStatus === 'DELIVERED' || d.deliveryStatus === 'SENT').length;
    const messagesFailed = deliveries.filter(d => d.deliveryStatus === 'FAILED').length;
    const messagesOpened = deliveries.filter(d => d.openedAt).length;

    const actualCost = deliveries.reduce((sum, d) => sum + Number(d.messageCost || 0), 0);

    await prisma.campaign.update({
      where: { 
        id: campaignId,
        tenantId: tenantId // Add tenant filtering
      },
      data: {
        messagesSent,
        messagesDelivered,
        messagesFailed,
        messagesOpened,
        actualCost
      }
    });
  } catch (error) {
    console.error('Error updating campaign stats:', error);
  }
};

const getMonthlyStats = async (tenantId: string) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId: tenantId, // Add tenant filtering
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        messagesSent: true,
        actualCost: true
      }
    });

    const monthlyStats = campaigns.reduce((acc, campaign) => {
      const monthKey = campaign.createdAt.toISOString().substring(0, 7);
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          campaigns: 0,
          messagesSent: 0,
          cost: 0
        };
      }

      acc[monthKey].campaigns += 1;
      acc[monthKey].messagesSent += campaign.messagesSent || 0;
      acc[monthKey].cost += Number(campaign.actualCost) || 0;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyStats);
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    return [];
  }
};

const scheduleCampaign = async (campaignId: string, scheduledDate: Date) => {
  // TODO: Implement campaign scheduling logic
  // This could use a job queue like Bull/Agenda or a simple cron job
  console.log(`Campaign ${campaignId} scheduled for ${scheduledDate}`);
};

export default {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignAnalytics,
  getCampaignPerformance
}; 