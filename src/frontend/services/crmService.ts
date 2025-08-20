import { apiClient } from '../lib/apiClient';
import {
  CustomerSegmentData,
  SegmentationReport,
  Customer,
  CrmDashboardResponse
} from '../types/crm';

// Get CRM dashboard data
export const getCrmDashboard = async (): Promise<CrmDashboardResponse> => {
  try {
    const response = await apiClient.get<CrmDashboardResponse>('/crm/dashboard');
    return response;
  } catch (error) {
    throw error;
  }
};

// Update all customer segments
export const updateAllCustomerSegments = async (): Promise<SegmentationReport> => {
  try {
    return await apiClient.post<SegmentationReport>('/crm/segments/update-all');
  } catch (error) {
    throw error;
  }
};

// Get customers by segment
export const getCustomersBySegment = async (
  segment: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'VIP',
  page: number = 1,
  limit: number = 50
): Promise<{
  customers: Customer[];
  pagination: {
    currentPage: number;
    total: number;
    pages: number;
    limit: number;
  };
}> => {
  try {
    return await apiClient.get<{
      customers: Customer[];
      pagination: {
        currentPage: number;
        total: number;
        pages: number;
        limit: number;
      };
    }>(`/crm/segments/${segment}`, { page, limit });
  } catch (error) {
    throw error;
  }
};

// Get segment analysis
export const getSegmentAnalysis = async (): Promise<{
  segmentDistribution: Record<string, { count: number; totalValue: number }>;
  recentMovements: Record<string, unknown>[];
  valueSegments: Record<string, unknown>[];
  activitySegments: Record<string, unknown>[];
  insights: string[];
}> => {
  try {
    return await apiClient.get<{
      segmentDistribution: Record<string, { count: number; totalValue: number }>;
      recentMovements: Record<string, unknown>[];
      valueSegments: Record<string, unknown>[];
      activitySegments: Record<string, unknown>[];
      insights: string[];
    }>('/crm/segments/analysis');
  } catch (error) {
    throw error;
  }
};

// Get upgradeable customers
export const getUpgradeableCustomers = async (targetSegment: string): Promise<CustomerSegmentData[]> => {
  try {
    const response = await apiClient.get<{ customers: CustomerSegmentData[] }>(`/crm/segments/upgradeable/${targetSegment}`);
    return response.customers;
  } catch (error) {
    throw error;
  }
};

// Create custom segment
export interface SegmentationCriteria {
  name: string;
  description: string;
  rules: SegmentRule[];
  conditions: SegmentCondition[];
  isActive: boolean;
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | string[] | number[];
}

export interface SegmentCondition {
  type: 'AND' | 'OR';
  rules: SegmentRule[];
}

export const createCustomSegment = async (segmentData: SegmentationCriteria): Promise<{
  id: string;
  name: string;
  description: string;
  customerCount: number;
  createdAt: string;
}> => {
  try {
    return await apiClient.post<{
      id: string;
      name: string;
      description: string;
      customerCount: number;
      createdAt: string;
    }>('/crm/segments/custom', segmentData);
  } catch (error) {
    throw error;
  }
};

// Get CRM dashboard overview
export const getCrmDashboardOverview = async (): Promise<{
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageCustomerValue: number;
  segmentDistribution: Record<string, number>;
  recentActivities: Record<string, unknown>[];
}> => {
  try {
    return await apiClient.get<{
      totalCustomers: number;
      activeCustomers: number;
      newCustomersThisMonth: number;
      averageCustomerValue: number;
      segmentDistribution: Record<string, number>;
      recentActivities: Record<string, unknown>[];
    }>('/crm/dashboard/overview');
  } catch (error) {
    throw error;
  }
};

// Bulk update customers
export const bulkUpdateCustomers = async (updates: {
  customerIds: string[];
  updates: Record<string, unknown>;
  reason: string;
}): Promise<{
  success: boolean;
  updatedCount: number;
  errors: string[];
}> => {
  try {
    return await apiClient.post<{
      success: boolean;
      updatedCount: number;
      errors: string[];
    }>('/crm/bulk/update', updates);
  } catch (error) {
    throw error;
  }
};

// Export customers
export const exportCustomers = async (filters: {
  segments?: string[];
  dateRange?: { start: string; end: string };
  format: 'excel' | 'csv' | 'pdf';
}): Promise<{
  downloadUrl: string;
  fileName: string;
  recordCount: number;
}> => {
  try {
    return await apiClient.post<{
      downloadUrl: string;
      fileName: string;
      recordCount: number;
    }>('/crm/export/customers', filters);
  } catch (error) {
    throw error;
  }
}; 