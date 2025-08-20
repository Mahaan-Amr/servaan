import { apiClient } from '../lib/apiClient';
import {
  CustomerVisit,
  VisitFilter,
  VisitCreateData,
  VisitResponse,
  VisitAnalytics
} from '../types/crm';

// Create new visit
export const createVisit = async (visitData: VisitCreateData): Promise<CustomerVisit> => {
  try {
    const response = await apiClient.post<{ visit: CustomerVisit }>('/visits', visitData);
    return response.visit;
  } catch (error) {
    throw error;
  }
};

// Get visits with filtering and pagination
export const getVisits = async (filter: VisitFilter = {}): Promise<VisitResponse> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value.toString();
      }
    });

    return await apiClient.get<VisitResponse>('/visits', params);
  } catch (error) {
    throw error;
  }
};

// Get visit by ID
export const getVisitById = async (id: string): Promise<CustomerVisit> => {
  try {
    const response = await apiClient.get<{ visit: CustomerVisit }>(`/visits/${id}`);
    return response.visit;
  } catch (error) {
    throw error;
  }
};

// Update visit
export interface VisitUpdateData {
  totalAmount?: number;
  discountAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE' | 'POINTS' | 'MIXED';
  itemsOrdered?: Record<string, unknown>[];
  tableNumber?: string;
  serverName?: string;
  serviceDuration?: number;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackCategories?: string[];
  visitNotes?: string;
}

export const updateVisit = async (id: string, updateData: VisitUpdateData): Promise<CustomerVisit> => {
  try {
    const response = await apiClient.put<{ visit: CustomerVisit }>(`/visits/${id}`, updateData);
    return response.visit;
  } catch (error) {
    throw error;
  }
};

// Delete visit
export const deleteVisit = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<void>(`/visits/${id}`);
  } catch (error) {
    throw error;
  }
};

// Get visit analytics
export const getVisitAnalytics = async (filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  serverId?: string;
}): Promise<VisitAnalytics> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<VisitAnalytics>('/visits/analytics', params);
  } catch (error) {
    throw error;
  }
};

// Get customer visit history
export const getCustomerVisitHistory = async (customerId: string, limit: number = 10): Promise<CustomerVisit[]> => {
  try {
    const response = await apiClient.get<{ visits: CustomerVisit[] }>(`/visits/customer/${customerId}`, { limit });
    return response.visits;
  } catch (error) {
    throw error;
  }
};

// Get server performance
export const getServerPerformance = async (serverId: string, period: string = '30d'): Promise<{
  totalVisits: number;
  totalRevenue: number;
  averageRating: number;
  customerSatisfaction: number;
}> => {
  try {
    return await apiClient.get<{
      totalVisits: number;
      totalRevenue: number;
      averageRating: number;
      customerSatisfaction: number;
    }>(`/visits/server/${serverId}/performance`, { period });
  } catch (error) {
    throw error;
  }
}; 