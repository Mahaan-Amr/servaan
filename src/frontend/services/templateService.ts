import { apiClient } from '../lib/apiClient';
import { ReportConfig } from './reportService';

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

class TemplateService {
  /**
   * Get templates with filtering
   */
  async getTemplates(filters?: {
    category?: string;
    reportType?: string;
    isPublic?: boolean;
    isSystemTemplate?: boolean;
    search?: string;
    tags?: string[];
  }, pagination?: {
    page?: number;
    limit?: number;
  }): Promise<{ templates: ReportTemplate[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    try {
      const params: Record<string, string> = {};
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params[key] = value.join(',');
            } else {
              params[key] = value.toString();
            }
          }
        });
      }
      
      if (pagination) {
        Object.entries(pagination).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params[key] = value.toString();
          }
        });
      }

      const response = await apiClient.get<{
        success?: boolean;
        data?: { templates: ReportTemplate[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
        message?: string;
      } | { templates: ReportTemplate[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/bi/templates', params);
      
      // Handle wrapped response
      if ('success' in response && response.success && response.data) {
        return response.data;
      }
      
      // Handle direct response
      if ('templates' in response) {
        return response;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ReportTemplate> {
    try {
      const response = await apiClient.get<{
        success?: boolean;
        data?: ReportTemplate;
        message?: string;
      } | ReportTemplate>(`/bi/templates/${id}`);
      
      // Handle wrapped response
      if ('success' in response && response.success && response.data) {
        return response.data;
      }
      
      // Handle direct response
      if ('id' in response) {
        return response as ReportTemplate;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create template
   */
  async createTemplate(data: CreateTemplateData): Promise<ReportTemplate> {
    try {
      const response = await apiClient.post<{
        success?: boolean;
        data?: ReportTemplate;
        message?: string;
      } | ReportTemplate>('/bi/templates', data);
      
      // Handle wrapped response
      if ('success' in response && response.success && response.data) {
        return response.data;
      }
      
      // Handle direct response
      if ('id' in response) {
        return response as ReportTemplate;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateTemplateData): Promise<ReportTemplate> {
    try {
      const response = await apiClient.put<{
        success?: boolean;
        data?: ReportTemplate;
        message?: string;
      } | ReportTemplate>(`/bi/templates/${id}`, data);
      
      // Handle wrapped response
      if ('success' in response && response.success && response.data) {
        return response.data;
      }
      
      // Handle direct response
      if ('id' in response) {
        return response as ReportTemplate;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete<void>(`/bi/templates/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create report from template
   */
  async createReportFromTemplate(
    templateId: string,
    reportName: string,
    customizations?: Partial<ReportConfig>
  ): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.post<{
        success?: boolean;
        data?: Record<string, unknown>;
        message?: string;
      } | Record<string, unknown>>(`/bi/templates/${templateId}/create-report`, {
        reportName,
        customizations
      });
      
      // Handle wrapped response
      if ('success' in response && response.success && response.data) {
        return response.data as Record<string, unknown>;
      }
      
      // Handle direct response
      return (response || {}) as Record<string, unknown>;
    } catch (error) {
      throw error;
    }
  }
}

export const templateService = new TemplateService();

