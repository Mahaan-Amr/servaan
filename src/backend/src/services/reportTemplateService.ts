import { prisma } from './dbService';
import { ReportConfig } from './reportService';

// Temporary compatibility shim: legacy BI template code expects a BIReport model.
// Route those calls to CustomReport dynamically to avoid backend boot crashes.
const biReportModel: any = (prisma as any).customReport;

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'inventory' | 'financial' | 'sales' | 'customer' | 'supplier' | 'user' | 'custom';
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  config: ReportConfig;
  isSystemTemplate: boolean;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  rating?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: 'inventory' | 'financial' | 'sales' | 'customer' | 'supplier' | 'user' | 'custom';
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  config: ReportConfig;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: 'inventory' | 'financial' | 'sales' | 'customer' | 'supplier' | 'user' | 'custom';
  config?: Partial<ReportConfig>;
  isPublic?: boolean;
  tags?: string[];
}

export class ReportTemplateService {
  /**
   * Create a new report template
   * CRITICAL: All templates are tenant-specific
   */
  static async createTemplate(
    data: CreateTemplateData,
    userId: string,
    tenantId: string
  ): Promise<ReportTemplate> {
    try {
      const template = await biReportModel.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.reportType,
          template: true, // Mark as template
          isPublic: data.isPublic || false,
          createdBy: userId,
          tenantId, // CRITICAL: Tenant isolation
          // Store category and tags in config metadata
          config: {
            ...data.config,
            metadata: {
              category: data.category,
              tags: data.tags || [],
              isSystemTemplate: false
            }
          } as any
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return this.mapToTemplate(template);
    } catch (error) {
      console.error('Error creating report template:', error);
      throw new Error('خطا در ایجاد قالب گزارش');
    }
  }

  /**
   * Get templates with filtering
   * CRITICAL: Returns only templates accessible to the user (tenant-specific + public)
   */
  static async getTemplates(
    userId: string,
    tenantId: string,
    filters?: {
      category?: string;
      reportType?: string;
      isPublic?: boolean;
      isSystemTemplate?: boolean;
      search?: string;
      tags?: string[];
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ templates: ReportTemplate[]; pagination: any }> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        template: true, // Only templates
        OR: [
          { tenantId }, // Tenant's own templates
          { isPublic: true } // Public templates from other tenants
        ]
      };

      if (filters?.reportType) {
        where.type = filters.reportType;
      }

      if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      if (filters?.search) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } }
            ]
          }
        ];
      }

      const [templates, total] = await Promise.all([
        biReportModel.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { createdAt: 'desc' }
          ],
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                executions: true
              }
            }
          }
        }),
        biReportModel.count({ where })
      ]);

      // Filter by category and isSystemTemplate in memory (Prisma JSON filtering is limited)
      let filteredTemplates = templates;
      
      if (filters?.category || filters?.isSystemTemplate !== undefined) {
        filteredTemplates = templates.filter((t: any) => {
          const config = t.config as any;
          const metadata = config?.metadata || {};
          
          if (filters?.category && metadata.category !== filters.category) {
            return false;
          }
          
          if (filters?.isSystemTemplate !== undefined && metadata.isSystemTemplate !== filters.isSystemTemplate) {
            return false;
          }
          
          return true;
        });
      }

      const mappedTemplates = filteredTemplates.map((t: any) => this.mapToTemplate(t, t._count?.executions || 0));

      // Recalculate total if we filtered in memory
      const finalTotal = filters?.category || filters?.isSystemTemplate !== undefined 
        ? mappedTemplates.length 
        : total;

      return {
        templates: mappedTemplates,
        pagination: {
          page,
          limit,
          total: finalTotal,
          totalPages: Math.ceil(finalTotal / limit)
        }
      };
    } catch (error) {
      console.error('Error getting templates:', error);
      throw new Error('خطا در دریافت قالب‌های گزارش');
    }
  }

  /**
   * Get template by ID
   * CRITICAL: Tenant isolation + public access check
   */
  static async getTemplateById(
    templateId: string,
    userId: string,
    tenantId: string
  ): Promise<ReportTemplate> {
    try {
      const template = await biReportModel.findFirst({
        where: {
          id: templateId,
          template: true,
          OR: [
            { tenantId }, // Tenant's own template
            { isPublic: true } // Public template
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      if (!template) {
        throw new Error('قالب گزارش یافت نشد');
      }

      return this.mapToTemplate(template, template._count?.executions || 0);
    } catch (error) {
      console.error('Error getting template by ID:', error);
      throw error;
    }
  }

  /**
   * Update template
   * CRITICAL: Only creator or admin can update, tenant isolation enforced
   */
  static async updateTemplate(
    templateId: string,
    data: UpdateTemplateData,
    userId: string,
    tenantId: string
  ): Promise<ReportTemplate> {
    try {
      const existing = await biReportModel.findFirst({
        where: {
          id: templateId,
          template: true,
          tenantId // CRITICAL: Only tenant's own templates
        }
      });

      if (!existing) {
        throw new Error('قالب گزارش یافت نشد');
      }

      // Prevent updating system templates
      const config = existing.config as any;
      if (config?.metadata?.isSystemTemplate) {
        throw new Error('نمی‌توان قالب سیستم را ویرایش کرد');
      }

      // Only creator can update
      if (existing.createdBy !== userId) {
        throw new Error('شما مجوز ویرایش این قالب را ندارید');
      }

      const updatedConfig = data.config 
        ? { ...(existing.config as any), ...data.config }
        : existing.config;

      // Update metadata if category or tags changed
      if (data.category || data.tags) {
        const metadata = (updatedConfig as any).metadata || {};
        if (data.category) metadata.category = data.category;
        if (data.tags) metadata.tags = data.tags;
        (updatedConfig as any).metadata = metadata;
      }

      const template = await biReportModel.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          config: updatedConfig as any,
          ...(data.isPublic !== undefined && { isPublic: data.isPublic })
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      return this.mapToTemplate(template, template._count?.executions || 0);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   * CRITICAL: Only creator can delete, tenant isolation enforced
   */
  static async deleteTemplate(
    templateId: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    try {
      const existing = await biReportModel.findFirst({
        where: {
          id: templateId,
          template: true,
          tenantId // CRITICAL: Only tenant's own templates
        }
      });

      if (!existing) {
        throw new Error('قالب گزارش یافت نشد');
      }

      // Prevent deleting system templates
      const config = existing.config as any;
      if (config?.metadata?.isSystemTemplate) {
        throw new Error('نمی‌توان قالب سیستم را حذف کرد');
      }

      // Only creator can delete
      if (existing.createdBy !== userId) {
        throw new Error('شما مجوز حذف این قالب را ندارید');
      }

      await biReportModel.delete({
        where: { id: templateId }
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Create report from template
   * CRITICAL: Creates a new report (not template) based on template config
   */
  static async createReportFromTemplate(
    templateId: string,
    reportName: string,
    userId: string,
    tenantId: string,
    customizations?: Partial<ReportConfig>
  ): Promise<any> {
    try {
      const template = await this.getTemplateById(templateId, userId, tenantId);
      
      // Create new report based on template
      const reportConfig: ReportConfig = {
        ...template.config,
        ...customizations,
        name: reportName
      };

      // Use CustomReport for now (can be migrated to BIReport later)
      const report = await prisma.customReport.create({
        data: {
          name: reportConfig.name,
          description: reportConfig.description || '',
          reportType: reportConfig.reportType,
          dataSources: JSON.stringify(reportConfig.dataSources),
          columnsConfig: JSON.stringify(reportConfig.columnsConfig),
          filtersConfig: JSON.stringify(reportConfig.filtersConfig || []),
          sortingConfig: JSON.stringify(reportConfig.sortingConfig || []),
          chartConfig: JSON.stringify(reportConfig.chartConfig || {}),
          layoutConfig: JSON.stringify(reportConfig.layoutConfig || {}),
          isPublic: false, // New reports are private by default
          createdBy: userId,
          tenantId, // CRITICAL: Tenant isolation
          tags: reportConfig.tags || [],
          sharedWith: JSON.stringify(reportConfig.sharedWith || [])
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Increment template usage count (store in metadata)
      await biReportModel.update({
        where: { id: templateId },
        data: {
          config: {
            ...(template.config as any),
            metadata: {
              ...((template.config as any).metadata || {}),
              usageCount: ((template.config as any).metadata?.usageCount || 0) + 1
            }
          } as any
        }
      });

      return report;
    } catch (error) {
      console.error('Error creating report from template:', error);
      throw new Error('خطا در ایجاد گزارش از قالب');
    }
  }

  /**
   * Get system templates (pre-built)
   * These are templates that come with the system
   */
  static getSystemTemplates(): ReportTemplate[] {
    return [
      // BI Inventory Templates (using schema-based field IDs)
      {
        id: 'bi-system-inventory-stock',
        name: 'گزارش موجودی کالاها',
        description: 'نمایش موجودی فعلی همه کالاها با جزئیات',
        category: 'inventory',
        reportType: 'TABULAR',
        config: {
          name: 'گزارش موجودی کالاها',
          description: 'نمایش موجودی فعلی همه کالاها',
          reportType: 'TABULAR',
          dataSources: [
            { id: 'inventory_items', name: 'Inventory - Items', type: 'database', connection: { workspace: 'inventory-management', table: 'items' } }
          ],
          columnsConfig: [
            { id: 'items_name', name: 'name', type: 'text', table: 'items', label: 'نام کالا', aggregation: 'none' },
            { id: 'items_category', name: 'category', type: 'text', table: 'items', label: 'دسته‌بندی', aggregation: 'none' },
            { id: 'items_unit', name: 'unit', type: 'text', table: 'items', label: 'واحد', aggregation: 'none' },
            { id: 'items_currentStock', name: 'currentStock', type: 'number', table: 'items', label: 'موجودی فعلی', aggregation: 'none' },
            { id: 'items_minStock', name: 'minStock', type: 'number', table: 'items', label: 'حداقل موجودی', aggregation: 'none' }
          ],
          filtersConfig: [],
          sortingConfig: [{ field: 'items_name', direction: 'asc' }],
          tags: ['موجودی', 'کالا', 'BI', 'سیستم']
        },
        isSystemTemplate: true,
        isPublic: true,
        tags: ['موجودی', 'کالا', 'BI', 'سیستم'],
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bi-system-inventory-transactions',
        name: 'گزارش تراکنش‌های موجودی',
        description: 'تمام تراکنش‌های ورود و خروج کالا',
        category: 'inventory',
        reportType: 'TABULAR',
        config: {
          name: 'گزارش تراکنش‌های موجودی',
          description: 'تمام تراکنش‌های ورود و خروج کالا',
          reportType: 'TABULAR',
          dataSources: [
            { id: 'inventory_inventoryEntries', name: 'Inventory - Inventory Entries', type: 'database', connection: { workspace: 'inventory-management', table: 'inventoryEntries' } },
            { id: 'inventory_items', name: 'Inventory - Items', type: 'database', connection: { workspace: 'inventory-management', table: 'items' } }
          ],
          columnsConfig: [
            { id: 'items_name', name: 'name', type: 'text', table: 'items', label: 'نام کالا', aggregation: 'none' },
            { id: 'inventoryEntries_type', name: 'type', type: 'text', table: 'inventoryEntries', label: 'نوع تراکنش', aggregation: 'none' },
            { id: 'inventoryEntries_quantity', name: 'quantity', type: 'number', table: 'inventoryEntries', label: 'مقدار', aggregation: 'none' },
            { id: 'inventoryEntries_unitPrice', name: 'unitPrice', type: 'currency', table: 'inventoryEntries', label: 'قیمت واحد', aggregation: 'none' },
            { id: 'inventoryEntries_createdAt', name: 'createdAt', type: 'date', table: 'inventoryEntries', label: 'تاریخ', aggregation: 'none' }
          ],
          filtersConfig: [],
          sortingConfig: [{ field: 'inventoryEntries_createdAt', direction: 'desc' }],
          tags: ['موجودی', 'تراکنش', 'BI', 'سیستم']
        },
        isSystemTemplate: true,
        isPublic: true,
        tags: ['موجودی', 'تراکنش', 'BI', 'سیستم'],
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bi-system-inventory-low-stock',
        name: 'گزارش کالاهای کم موجودی',
        description: 'کالاهایی که زیر حداقل موجودی هستند',
        category: 'inventory',
        reportType: 'TABULAR',
        config: {
          name: 'گزارش کالاهای کم موجودی',
          description: 'کالاهایی که زیر حداقل موجودی هستند',
          reportType: 'TABULAR',
          dataSources: [
            { id: 'inventory_items', name: 'Inventory - Items', type: 'database', connection: { workspace: 'inventory-management', table: 'items' } }
          ],
          columnsConfig: [
            { id: 'items_name', name: 'name', type: 'text', table: 'items', label: 'نام کالا', aggregation: 'none' },
            { id: 'items_currentStock', name: 'currentStock', type: 'number', table: 'items', label: 'موجودی فعلی', aggregation: 'none' },
            { id: 'items_minStock', name: 'minStock', type: 'number', table: 'items', label: 'حداقل موجودی', aggregation: 'none' },
            { id: 'items_category', name: 'category', type: 'text', table: 'items', label: 'دسته‌بندی', aggregation: 'none' }
          ],
          filtersConfig: [
            {
              id: 'low-stock-filter',
              field: 'items_currentStock',
              operator: 'less',
              value: 'items_minStock', // Special: compare with another field
              label: 'موجودی کمتر از حداقل'
            }
          ],
          sortingConfig: [{ field: 'items_currentStock', direction: 'asc' }],
          tags: ['موجودی', 'هشدار', 'BI', 'سیستم']
        },
        isSystemTemplate: true,
        isPublic: true,
        tags: ['موجودی', 'هشدار', 'BI', 'سیستم'],
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BI Ordering Templates
      {
        id: 'bi-system-orders-summary',
        name: 'گزارش خلاصه سفارشات',
        description: 'خلاصه تمام سفارشات با جزئیات',
        category: 'sales',
        reportType: 'TABULAR',
        config: {
          name: 'گزارش خلاصه سفارشات',
          description: 'خلاصه تمام سفارشات با جزئیات',
          reportType: 'TABULAR',
          dataSources: [
            { id: 'ordering_orders', name: 'Ordering - Orders', type: 'database', connection: { workspace: 'ordering-sales-system', table: 'orders' } }
          ],
          columnsConfig: [
            { id: 'orders_orderNumber', name: 'orderNumber', type: 'text', table: 'orders', label: 'شماره سفارش', aggregation: 'none' },
            { id: 'orders_totalAmount', name: 'totalAmount', type: 'currency', table: 'orders', label: 'مجموع سفارش', aggregation: 'none' },
            { id: 'orders_orderDate', name: 'orderDate', type: 'date', table: 'orders', label: 'تاریخ سفارش', aggregation: 'none' },
            { id: 'orders_status', name: 'status', type: 'text', table: 'orders', label: 'وضعیت', aggregation: 'none' },
            { id: 'orders_orderType', name: 'orderType', type: 'text', table: 'orders', label: 'نوع سفارش', aggregation: 'none' }
          ],
          filtersConfig: [],
          sortingConfig: [{ field: 'orders_orderDate', direction: 'desc' }],
          tags: ['سفارش', 'فروش', 'BI', 'سیستم']
        },
        isSystemTemplate: true,
        isPublic: true,
        tags: ['سفارش', 'فروش', 'BI', 'سیستم'],
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bi-system-order-items',
        name: 'گزارش آیتم‌های سفارش',
        description: 'جزئیات آیتم‌های هر سفارش',
        category: 'sales',
        reportType: 'TABULAR',
        config: {
          name: 'گزارش آیتم‌های سفارش',
          description: 'جزئیات آیتم‌های هر سفارش',
          reportType: 'TABULAR',
          dataSources: [
            { id: 'ordering_orderItems', name: 'Ordering - Order Items', type: 'database', connection: { workspace: 'ordering-sales-system', table: 'orderItems' } }
          ],
          columnsConfig: [
            { id: 'orderItems_itemName', name: 'itemName', type: 'text', table: 'orderItems', label: 'نام آیتم', aggregation: 'none' },
            { id: 'orderItems_quantity', name: 'quantity', type: 'number', table: 'orderItems', label: 'تعداد', aggregation: 'none' },
            { id: 'orderItems_unitPrice', name: 'unitPrice', type: 'currency', table: 'orderItems', label: 'قیمت واحد', aggregation: 'none' },
            { id: 'orderItems_totalPrice', name: 'totalPrice', type: 'currency', table: 'orderItems', label: 'قیمت کل', aggregation: 'none' }
          ],
          filtersConfig: [],
          sortingConfig: [{ field: 'orderItems_totalPrice', direction: 'desc' }],
          tags: ['سفارش', 'آیتم', 'BI', 'سیستم']
        },
        isSystemTemplate: true,
        isPublic: true,
        tags: ['سفارش', 'آیتم', 'BI', 'سیستم'],
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bi-system-payments',
        name: 'گزارش پرداخت‌ها',
        description: 'تمام پرداخت‌های انجام شده',
        category: 'financial',
        reportType: 'TABULAR',
        config: {
          name: 'گزارش پرداخت‌ها',
          description: 'تمام پرداخت‌های انجام شده',
          reportType: 'TABULAR',
          dataSources: [
            { id: 'ordering_payments', name: 'Ordering - Payments', type: 'database', connection: { workspace: 'ordering-sales-system', table: 'payments' } }
          ],
          columnsConfig: [
            { id: 'payments_amount', name: 'amount', type: 'currency', table: 'payments', label: 'مبلغ', aggregation: 'none' },
            { id: 'payments_paymentMethod', name: 'paymentMethod', type: 'text', table: 'payments', label: 'روش پرداخت', aggregation: 'none' },
            { id: 'payments_paymentDate', name: 'paymentDate', type: 'date', table: 'payments', label: 'تاریخ پرداخت', aggregation: 'none' }
          ],
          filtersConfig: [],
          sortingConfig: [{ field: 'payments_paymentDate', direction: 'desc' }],
          tags: ['پرداخت', 'مالی', 'BI', 'سیستم']
        },
        isSystemTemplate: true,
        isPublic: true,
        tags: ['پرداخت', 'مالی', 'BI', 'سیستم'],
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Map BIReport to ReportTemplate
   */
  private static mapToTemplate(report: any, usageCount: number = 0): ReportTemplate {
    const config = report.config as any;
    const metadata = config?.metadata || {};

    return {
      id: report.id,
      name: report.name,
      description: report.description || undefined,
      category: metadata.category || 'custom',
      reportType: report.type,
      config: config as ReportConfig,
      isSystemTemplate: metadata.isSystemTemplate || false,
      isPublic: report.isPublic,
      tags: metadata.tags || [],
      usageCount: metadata.usageCount || usageCount,
      rating: metadata.rating,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      creator: report.creator
    };
  }
}

