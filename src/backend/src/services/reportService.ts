import { PrismaClient } from '../../shared/generated/client';
import { QueryBuilder } from './queryBuilder';

const prisma = new PrismaClient();

export interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  table: string;
  label: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
  label: string;
}

export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'CHART' | 'DASHBOARD' | 'PIVOT';
  dataSources: any[];
  columnsConfig: ReportField[];
  filtersConfig?: ReportFilter[];
  sortingConfig?: { field: string; direction: 'asc' | 'desc' }[];
  chartConfig?: any;
  layoutConfig?: any;
  isPublic?: boolean;
  sharedWith?: string[];
  tags?: string[];
}

export interface ReportExecutionResult {
  reportId: string;
  executedAt: Date;
  executedBy: string;
  executionTime: number;
  resultCount: number;
  data: any[];
  format: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  errorMessage?: string;
}

export class ReportService {
  /**
   * ایجاد گزارش سفارشی جدید
   */
  static async createReport(reportConfig: ReportConfig, userId: string, tenantId: string): Promise<any> {
    try {
      // Clean filters before saving to prevent calc table issues
      const cleanedFilters = (reportConfig.filtersConfig || []).filter((filter: any) => {
        // Remove empty filters
        if (!filter.field || !filter.value || filter.value === '' || filter.value === null || filter.value === undefined) {
          console.log(`DEBUG CREATE REPORT: Removing empty filter:`, filter);
          return false;
        }
        
        // Check if this is a calculated field (total_value, current_stock, etc.)
        const calculatedFields = ['total_value', 'current_stock'];
        if (calculatedFields.includes(filter.field)) {
          console.log(`DEBUG CREATE REPORT: Removing calculated field filter:`, filter);
          return false;
        }
        
        return true;
      });
      
      console.log(`DEBUG CREATE REPORT: Original filters count: ${(reportConfig.filtersConfig || []).length}, Cleaned filters count: ${cleanedFilters.length}`);
      
      const report = await prisma.customReport.create({
        data: {
          name: reportConfig.name,
          description: reportConfig.description,
          reportType: reportConfig.reportType,
          dataSources: JSON.stringify(reportConfig.dataSources),
          columnsConfig: JSON.stringify(reportConfig.columnsConfig),
          filtersConfig: JSON.stringify(cleanedFilters), // Use cleaned filters
          sortingConfig: JSON.stringify(reportConfig.sortingConfig || []),
          chartConfig: JSON.stringify(reportConfig.chartConfig || {}),
          layoutConfig: JSON.stringify(reportConfig.layoutConfig || {}),
          isPublic: reportConfig.isPublic || false,
          createdBy: userId,
          tenantId, // Added tenantId
          sharedWith: JSON.stringify(reportConfig.sharedWith || []),
          tags: reportConfig.tags || [],
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

      return report;
    } catch (error) {
      console.error('Error creating custom report:', error);
      throw new Error('خطا در ایجاد گزارش سفارشی');
    }
  }

  /**
   * دریافت لیست گزارش‌های سفارشی
   */
  static async getReports(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    reportType?: string,
    tags?: string[]
  ): Promise<{ reports: any[]; pagination: any }> {
    try {
      const skip = (page - 1) * limit;
      
      // ساخت شرایط جستجو
      const where: any = {
        AND: [
          { isActive: true },
          {
            OR: [
              { createdBy: userId },
              { isPublic: true },
              {
                sharedWith: {
                  string_contains: userId
                }
              }
            ]
          }
        ]
      };

      // اعمال فیلتر جستجو
      if (search) {
        where.AND.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        });
      }

      // اعمال فیلتر نوع گزارش
      if (reportType) {
        where.AND.push({ reportType });
      }

      // اعمال فیلتر تگ‌ها
      if (tags && tags.length > 0) {
        where.AND.push({
          tags: {
            hasSome: tags
          }
        });
      }

      const [reports, total] = await Promise.all([
        prisma.customReport.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
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
        prisma.customReport.count({ where })
      ]);

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      return { reports, pagination };
    } catch (error) {
      console.error('Error getting custom reports:', error);
      throw new Error('خطا در دریافت گزارش‌ها');
    }
  }

  /**
   * دریافت گزارش سفارشی بر اساس ID
   */
  static async getReportById(reportId: string, userId: string): Promise<any> {
    try {
      const report = await prisma.customReport.findFirst({
        where: {
          id: reportId,
          isActive: true,
          OR: [
            { createdBy: userId },
            { isPublic: true },
            {
              sharedWith: {
                string_contains: userId
              }
            }
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
          executions: {
            take: 10,
            orderBy: { executedAt: 'desc' },
            include: {
              executor: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!report) {
        throw new Error('گزارش یافت نشد یا دسترسی ندارید');
      }

      return report;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      throw error;
    }
  }

  /**
   * اجرای گزارش ذخیره شده
   */
  static async executeSavedReport(
    reportId: string,
    userId: string,
    tenantId: string, // CRITICAL: tenantId is required for security
    parameters?: any,
    exportFormat: 'VIEW' | 'PDF' | 'EXCEL' | 'CSV' | 'JSON' = 'VIEW'
  ): Promise<ReportExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Executing saved report: ${reportId}`);
      
      // بررسی دسترسی
      const report = await prisma.customReport.findFirst({
        where: {
          id: reportId,
          isActive: true,
          OR: [
            { createdBy: userId },
            { isPublic: true },
            {
              sharedWith: {
                string_contains: userId
              }
            }
          ]
        }
      });

      if (!report) {
        throw new Error('گزارش یافت نشد یا دسترسی ندارید');
      }

      // Parse report configuration from stored JSON fields
      const parsedReport = {
        dataSources: typeof report.dataSources === 'string' ? JSON.parse(report.dataSources) : report.dataSources,
        columnsConfig: typeof report.columnsConfig === 'string' ? JSON.parse(report.columnsConfig) : report.columnsConfig,
        filtersConfig: typeof report.filtersConfig === 'string' ? JSON.parse(report.filtersConfig) : report.filtersConfig,
        sortingConfig: typeof report.sortingConfig === 'string' ? JSON.parse(report.sortingConfig) : report.sortingConfig,
      };
      
      // Clean filters to remove empty values
      const cleanedFilters = parsedReport.filtersConfig.filter((filter: any) => {
        if (filter.value === null || filter.value === undefined || filter.value === '') {
          return false;
        }
        
        return true;
      });
      
      console.log('DEBUG SAVED REPORT: Cleaned filters:', JSON.stringify(cleanedFilters, null, 2));
      
      // ساخت کوئری - CRITICAL: Pass tenantId for security
      const query = await QueryBuilder.buildQuery({
        dataSources: parsedReport.dataSources,
        columns: parsedReport.columnsConfig,
        filters: cleanedFilters, // Use cleaned filters instead of original
        sorting: parsedReport.sortingConfig,
        parameters,
        tenantId // CRITICAL: Add tenantId to prevent data leakage
      });

      // اجرای کوئری
      const data = await QueryBuilder.executeQuery(query);
      
      const executionTime = Date.now() - startTime;
      const resultCount = data.length;

      console.log(`Saved report executed successfully: ${resultCount} records in ${executionTime}ms`);

      // ثبت تاریخچه اجرا
      await prisma.reportExecution.create({
        data: {
          reportId,
          executedBy: userId,
          executionTime,
          resultCount,
          parameters: JSON.stringify(parameters || {}),
          exportFormat,
          status: 'SUCCESS',
          tenantId // Added tenantId
        }
      });

      // بروزرسانی آمار گزارش
      await this.updateReportStats(reportId, executionTime);

      return {
        reportId,
        executedAt: new Date(),
        executedBy: userId,
        executionTime,
        resultCount,
        data,
        format: exportFormat,
        status: 'SUCCESS'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.error('Error executing saved report:', error);
      
      // ثبت خطا در تاریخچه
      await prisma.reportExecution.create({
        data: {
          reportId,
          executedBy: userId,
          executionTime,
          resultCount: 0,
          parameters: JSON.stringify(parameters || {}),
          exportFormat,
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'خطای نامشخص',
          tenantId // Added tenantId
        }
      });

      throw new Error('خطا در اجرای گزارش: ' + (error instanceof Error ? error.message : 'خطای نامشخص'));
    }
  }

  /**
   * اجرای گزارش (متد اصلی که کنترلرها استفاده می‌کنند)
   */
  static async executeReport(
    reportId: string,
    userId: string,
    parameters?: any,
    exportFormat: 'VIEW' | 'PDF' | 'EXCEL' | 'CSV' | 'JSON' = 'VIEW',
    tenantId?: string
  ): Promise<ReportExecutionResult> {
    // CRITICAL: tenantId is required for security
    if (!tenantId) {
      throw new Error('TenantId is required for security - cannot execute report without tenant context');
    }
    
    return this.executeSavedReport(reportId, userId, tenantId, parameters, exportFormat);
  }

  /**
   * بروزرسانی گزارش سفارشی
   */
  static async updateReport(
    reportId: string,
    userId: string,
    updates: Partial<ReportConfig>
  ): Promise<any> {
    try {
      // بررسی دسترسی
      const existingReport = await prisma.customReport.findFirst({
        where: {
          id: reportId,
          createdBy: userId,
          isActive: true
        }
      });

      if (!existingReport) {
        throw new Error('گزارش یافت نشد یا دسترسی ندارید');
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.reportType !== undefined) updateData.reportType = updates.reportType;
      if (updates.dataSources !== undefined) updateData.dataSources = JSON.stringify(updates.dataSources);
      if (updates.columnsConfig !== undefined) updateData.columnsConfig = JSON.stringify(updates.columnsConfig);
      if (updates.filtersConfig !== undefined) updateData.filtersConfig = JSON.stringify(updates.filtersConfig);
      if (updates.sortingConfig !== undefined) updateData.sortingConfig = JSON.stringify(updates.sortingConfig);
      if (updates.chartConfig !== undefined) updateData.chartConfig = JSON.stringify(updates.chartConfig);
      if (updates.layoutConfig !== undefined) updateData.layoutConfig = JSON.stringify(updates.layoutConfig);
      if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
      if (updates.sharedWith !== undefined) updateData.sharedWith = JSON.stringify(updates.sharedWith);
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const updatedReport = await prisma.customReport.update({
        where: { id: reportId },
        data: updateData,
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

      return updatedReport;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  /**
   * حذف گزارش سفارشی
   */
  static async deleteReport(reportId: string, userId: string): Promise<void> {
    try {
      // بررسی دسترسی
      const existingReport = await prisma.customReport.findFirst({
        where: {
          id: reportId,
          createdBy: userId,
          isActive: true
        }
      });

      if (!existingReport) {
        throw new Error('گزارش یافت نشد یا دسترسی ندارید');
      }

      // حذف نرم (soft delete)
      await prisma.customReport.update({
        where: { id: reportId },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * اشتراک‌گذاری گزارش
   */
  static async shareReport(
    reportId: string,
    userId: string,
    sharedWith: string[]
  ): Promise<any> {
    try {
      // بررسی دسترسی
      const existingReport = await prisma.customReport.findFirst({
        where: {
          id: reportId,
          createdBy: userId,
          isActive: true
        }
      });

      if (!existingReport) {
        throw new Error('گزارش یافت نشد یا دسترسی ندارید');
      }

      const updatedReport = await prisma.customReport.update({
        where: { id: reportId },
        data: { sharedWith: JSON.stringify(sharedWith) }
      });

      return updatedReport;
    } catch (error) {
      console.error('Error sharing report:', error);
      throw error;
    }
  }

  /**
   * دریافت تاریخچه اجرای گزارش
   */
  static async getExecutionHistory(
    reportId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ executions: any[]; pagination: any }> {
    try {
      // بررسی دسترسی به گزارش
      await this.getReportById(reportId, userId);

      const skip = (page - 1) * limit;

      const [executions, total] = await Promise.all([
        prisma.reportExecution.findMany({
          where: { reportId },
          skip,
          take: limit,
          orderBy: { executedAt: 'desc' },
          include: {
            executor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.reportExecution.count({ where: { reportId } })
      ]);

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      return { executions, pagination };
    } catch (error) {
      console.error('Error getting execution history:', error);
      throw error;
    }
  }

  /**
   * بروزرسانی آمار گزارش
   */
  private static async updateReportStats(reportId: string, executionTime: number): Promise<void> {
    try {
      const report = await prisma.customReport.findUnique({
        where: { id: reportId }
      });

      if (!report) return;

      const newExecutionCount = report.executionCount + 1;
      const newAvgExecutionTime = report.avgExecutionTime
        ? Math.round((report.avgExecutionTime * report.executionCount + executionTime) / newExecutionCount)
        : executionTime;

      await prisma.customReport.update({
        where: { id: reportId },
        data: {
          executionCount: newExecutionCount,
          lastRunAt: new Date(),
          avgExecutionTime: newAvgExecutionTime
        }
      });
    } catch (error) {
      console.error('Error updating report stats:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * دریافت گزارش‌های محبوب
   */
  static async getPopularReports(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const reports = await prisma.customReport.findMany({
        where: {
          isActive: true,
          OR: [
            { createdBy: userId },
            { isPublic: true },
            {
              sharedWith: {
                string_contains: userId
              }
            }
          ]
        },
        orderBy: { executionCount: 'desc' },
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return reports;
    } catch (error) {
      console.error('Error getting popular reports:', error);
      throw new Error('خطا در دریافت گزارش‌های محبوب');
    }
  }

  /**
   * جستجوی پیشرفته گزارش‌ها
   */
  static async searchReports(
    userId: string,
    searchTerm: string,
    filters: {
      reportType?: string;
      tags?: string[];
      createdBy?: string;
      dateRange?: { start: Date; end: Date };
    } = {}
  ): Promise<any[]> {
    try {
      const where: any = {
        AND: [
          { isActive: true },
          {
            OR: [
              { createdBy: userId },
              { isPublic: true },
              {
                sharedWith: {
                  string_contains: userId
                }
              }
            ]
          },
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        ]
      };

      // اعمال فیلترهای اضافی
      if (filters.reportType) {
        where.AND.push({ reportType: filters.reportType });
      }

      if (filters.tags && filters.tags.length > 0) {
        where.AND.push({
          tags: {
            hasSome: filters.tags
          }
        });
      }

      if (filters.createdBy) {
        where.AND.push({ createdBy: filters.createdBy });
      }

      if (filters.dateRange) {
        where.AND.push({
          createdAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        });
      }

      const reports = await prisma.customReport.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      return reports;
    } catch (error) {
      console.error('Error searching reports:', error);
      throw new Error('خطا در جستجوی گزارش‌ها');
    }
  }

  /**
   * اجرای گزارش موقت (پیش‌نمایش)
   */
  static async executeTemporaryReport(
    reportConfig: ReportConfig,
    userId: string,
    tenantId: string, // CRITICAL: tenantId is required for security
    parameters?: any
  ): Promise<ReportExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log('Executing temporary report:', reportConfig.name);
      
      // اعتبارسنجی ورودی
      if (!reportConfig.columnsConfig || !Array.isArray(reportConfig.columnsConfig)) {
        throw new Error('تنظیمات ستون‌های گزارش نامعتبر است');
      }

      if (reportConfig.columnsConfig.length === 0) {
        throw new Error('حداقل یک ستون برای گزارش انتخاب کنید');
      }
      
      // ساخت کوئری - CRITICAL: Pass tenantId for security
      const query = await QueryBuilder.buildQuery({
        dataSources: reportConfig.dataSources || ['inventory', 'items'],
        columns: reportConfig.columnsConfig,
        filters: reportConfig.filtersConfig || [],
        sorting: reportConfig.sortingConfig || [],
        parameters,
        tenantId // CRITICAL: Add tenantId to prevent data leakage
      });

      // اجرای کوئری
      const data = await QueryBuilder.executeQuery(query);
      
      const executionTime = Date.now() - startTime;
      const resultCount = data.length;

      console.log(`Temporary report executed successfully: ${resultCount} records in ${executionTime}ms`);

      return {
        reportId: 'temp',
        executedAt: new Date(),
        executedBy: userId,
        executionTime,
        resultCount,
        data,
        format: 'VIEW',
        status: 'SUCCESS'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error executing temporary report:', error);
      
      return {
        reportId: 'temp',
        executedAt: new Date(),
        executedBy: userId,
        executionTime,
        resultCount: 0,
        data: [],
        format: 'VIEW',
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'خطای نامشخص'
      };
    }
  }

  /**
   * دریافت تعداد کل گزارش‌های قابل دسترس برای کاربر
   */
  static async getReportsCount(userId: string): Promise<number> {
    try {
      const where: any = {
        AND: [
          { isActive: true },
          {
            OR: [
              { createdBy: userId },
              { isPublic: true },
              {
                sharedWith: {
                  string_contains: userId
                }
              }
            ]
          }
        ]
      };

      const count = await prisma.customReport.count({ where });
      return count;
    } catch (error) {
      console.error('Error getting reports count:', error);
      throw new Error('خطا در دریافت تعداد گزارش‌ها');
    }
  }

  /**
   * دریافت فیلدهای موجود برای گزارش‌سازی
   */
  static async getAvailableFields(): Promise<any[]> {
    try {
      return QueryBuilder.getAvailableFields();
    } catch (error) {
      console.error('Error getting available fields:', error);
      throw new Error('خطا در دریافت فیلدهای موجود');
    }
  }

  /**
   * صادرات گزارش به فرمت‌های مختلف
   */
  static async exportReport(data: any[], reportName: string, format: 'PDF' | 'EXCEL' | 'CSV'): Promise<{ filePath: string; mimeType: string; filename: string }> {
    try {
      const { ExportService } = await import('./exportService');
      
      return await ExportService.exportData({
        format,
        data,
        reportName
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('خطا در صادرات گزارش');
    }
  }

  /**
   * پاک‌سازی فایل‌های موقت
   */
  static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      const { ExportService } = await import('./exportService');
      await ExportService.cleanupTempFile(filePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  /**
   * اجرای گزارش ذخیره شده
   */
} 
