import { apiClient } from '../lib/apiClient';
import {
  Customer,
  CustomerFilter,
  CustomerCreateData,
  CustomerUpdateData,
  CustomerResponse,
  CustomerStatistics,
  BulkUpdateRequest,
  BulkSmsRequest,
  BulkOperationResult,
  CustomerExportRequest,
  CustomerImportRequest,
  CustomerImportResult,
  CustomerRecommendation,
  CustomerInsights,
  CustomSegment,
  SegmentationAnalysis,
  CustomerNotification,
  CustomerActivity,
  CustomerAnalyticsFilters,
  CustomerLifecycleAnalysis,
  CustomerCampaign,
  LoyaltyStatistics,
  VisitAnalytics
} from '../types/crm';

// Get customers with filtering and pagination
export const getCustomers = async (filter: CustomerFilter = {}): Promise<CustomerResponse> => {
  try {
    // Convert filter object to query parameters
    const params: Record<string, string | number | boolean> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value.toString();
      }
    });

    return await apiClient.get<CustomerResponse>('/customers', params);
  } catch (error) {
    // Error handling is automatic with Persian messages
    throw error;
  }
};

// Get customer by ID
export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const response = await apiClient.get<{ customer: Customer }>(`/customers/${id}`);
    return response.customer;
  } catch (error) {
    throw error;
  }
};

// Get customer by phone number
export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  try {
    const response = await apiClient.get<{ customer: Customer }>(`/customers/phone/${phone}`);
    return response.customer;
  } catch (error) {
    // Check if it's a 404 error (customer not found)
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 404) {
      return null; // Customer not found
    }
    throw error;
  }
};

// Create new customer
export const createCustomer = async (customerData: CustomerCreateData): Promise<Customer> => {
  try {
    const response = await apiClient.post<{ customer: Customer }>('/customers', customerData);
    return response.customer;
  } catch (error) {
    throw error;
  }
};

// Update customer
export const updateCustomer = async (id: string, customerData: CustomerUpdateData): Promise<Customer> => {
  try {
    const response = await apiClient.put<{ customer: Customer }>(`/customers/${id}`, customerData);
    return response.customer;
  } catch (error) {
    throw error;
  }
};

// Delete customer (soft delete)
export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<void>(`/customers/${id}`);
  } catch (error) {
    throw error;
  }
};

// Get customer statistics
export const getCustomerStatistics = async (filters?: CustomerAnalyticsFilters): Promise<CustomerStatistics> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // For array values, join them with commas
            params[key] = value.join(',');
          } else {
            params[key] = value.toString();
          }
        }
      });
    }

    return await apiClient.get<CustomerStatistics>('/customers/statistics', params);
  } catch (error) {
    throw error;
  }
};

export const getLoyaltyStatistics = async (filters?: CustomerAnalyticsFilters): Promise<LoyaltyStatistics> => {
  try {
    const params: Record<string, string | number | boolean> = {};
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

    return await apiClient.get<LoyaltyStatistics>('/loyalty/statistics', params);
  } catch (error) {
    throw error;
  }
};

export const getVisitAnalytics = async (filters?: CustomerAnalyticsFilters): Promise<VisitAnalytics> => {
  try {
    const params: Record<string, string | number | boolean> = {};
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

    return await apiClient.get<VisitAnalytics>('/visits/analytics', params);
  } catch (error) {
    throw error;
  }
};

// Get upcoming birthdays
export const getUpcomingBirthdays = async (filters?: { days?: number }): Promise<Customer[]> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.days) {
      params.days = filters.days;
    }

    const response = await apiClient.get<{ customers: Customer[] }>('/customers/birthdays', params);
    return response.customers;
  } catch (error) {
    throw error;
  }
};

// Get customer summaries (optimized for lists)
export const getCustomerSummaries = async (filter: CustomerFilter = {}): Promise<Customer[]> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value.toString();
      }
    });

    const response = await apiClient.get<{ customers: Customer[] }>('/customers/summaries', params);
    return response.customers;
  } catch (error) {
    throw error;
  }
};

// NEW ENHANCED FEATURES

// Bulk Operations
export const bulkUpdateCustomers = async (request: BulkUpdateRequest): Promise<BulkOperationResult> => {
  try {
    const response = await apiClient.post<BulkOperationResult>('/customers/bulk/update', request);
    return response;
  } catch (error) {
    throw error;
  }
};

export const bulkSendSms = async (request: BulkSmsRequest): Promise<BulkOperationResult> => {
  try {
    const response = await apiClient.post<BulkOperationResult>('/customers/bulk/sms', request);
    return response;
  } catch (error) {
    throw error;
  }
};

export const bulkDeleteCustomers = async (customerIds: string[]): Promise<BulkOperationResult> => {
  try {
    const response = await apiClient.post<BulkOperationResult>('/customers/bulk/delete', { customerIds });
    return response;
  } catch (error) {
    throw error;
  }
};

// Import/Export Operations
export const exportCustomers = async (request: CustomerExportRequest): Promise<{ downloadUrl: string; fileName: string }> => {
  try {
    const response = await apiClient.post<{ downloadUrl: string; fileName: string }>('/customers/export', request);
    return response;
  } catch (error) {
    throw error;
  }
};

export const importCustomers = async (request: CustomerImportRequest): Promise<CustomerImportResult> => {
  try {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('format', request.format);
    formData.append('mappings', JSON.stringify(request.mappings));
    formData.append('options', JSON.stringify(request.options));

    const response = await apiClient.upload<CustomerImportResult>('/customers/import', formData);
    return response;
  } catch (error) {
    throw error;
  }
};

// AI-Powered Recommendations
export const getCustomerRecommendations = async (customerId?: string): Promise<CustomerRecommendation[]> => {
  try {
    const url = customerId 
      ? `/customers/${customerId}/recommendations`
      : `/customers/recommendations`;
    const response = await apiClient.get<{ recommendations: CustomerRecommendation[] }>(url);
    return response.recommendations;
  } catch (error) {
    throw error;
  }
};

export const getCustomerInsights = async (customerId: string): Promise<CustomerInsights> => {
  try {
    const response = await apiClient.get<{ insights: CustomerInsights }>(`/customers/${customerId}/insights`);
    return response.insights;
  } catch (error) {
    throw error;
  }
};

export const applyRecommendation = async (recommendationId: string): Promise<void> => {
  try {
    await apiClient.post(`/customers/recommendations/${recommendationId}/apply`);
  } catch (error) {
    throw error;
  }
};

// Advanced Segmentation
export const getCustomSegments = async (): Promise<CustomSegment[]> => {
  try {
    const response = await apiClient.get<{ segments: CustomSegment[] }>('/customers/segments');
    return response.segments;
  } catch (error) {
    throw error;
  }
};

export const createCustomSegment = async (segment: Omit<CustomSegment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'customerCount'>): Promise<CustomSegment> => {
  try {
    const response = await apiClient.post<{ segment: CustomSegment }>('/customers/segments', segment);
    return response.segment;
  } catch (error) {
    throw error;
  }
};

export const getSegmentationAnalysis = async (): Promise<SegmentationAnalysis> => {
  try {
    const response = await apiClient.get<SegmentationAnalysis>('/customers/segmentation/analysis');
    return response;
  } catch (error) {
    throw error;
  }
};

// Customer Activity
export const getCustomerActivity = async (customerId: string): Promise<CustomerActivity[]> => {
  try {
    const response = await apiClient.get<{ activities: CustomerActivity[] }>(`/customers/${customerId}/activity`);
    return response.activities;
  } catch (error) {
    throw error;
  }
};

// Customer Lifecycle Analysis
export const getCustomerLifecycleAnalysis = async (customerId: string): Promise<CustomerLifecycleAnalysis> => {
  try {
    const response = await apiClient.get<{ analysis: CustomerLifecycleAnalysis }>(`/customers/${customerId}/lifecycle`);
    return response.analysis;
  } catch (error) {
    throw error;
  }
};

// Real-time Notifications
export const getCustomerNotifications = async (): Promise<CustomerNotification[]> => {
  try {
    const response = await apiClient.get<{ notifications: CustomerNotification[] }>('/customers/notifications');
    return response.notifications;
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await apiClient.patch(`/customers/notifications/${notificationId}/read`);
  } catch (error) {
    throw error;
  }
};

// Campaign Management
export const getCustomerCampaigns = async (): Promise<CustomerCampaign[]> => {
  try {
    const response = await apiClient.get<{ campaigns: CustomerCampaign[] }>('/customers/campaigns');
    return response.campaigns;
  } catch (error) {
    throw error;
  }
};

export const createCustomerCampaign = async (campaign: Omit<CustomerCampaign, 'id' | 'createdAt' | 'createdBy' | 'stats'>): Promise<CustomerCampaign> => {
  try {
    const response = await apiClient.post<{ campaign: CustomerCampaign }>('/customers/campaigns', campaign);
    return response.campaign;
  } catch (error) {
    throw error;
  }
}; 