import { apiClient } from '../lib/apiClient';
import {
  LoyaltyTransaction,
  LoyaltyTransactionResponse,
  CustomerLoyalty,
  TierBenefits,
  LoyaltyStatistics
} from '../types/crm';

// Add loyalty points
export interface AddPointsData {
  customerId: string;
  points: number;
  description: string;
  transactionType?: 'EARNED_BONUS' | 'EARNED_REFERRAL' | 'ADJUSTMENT_ADD';
  orderReference?: string;
  relatedAmount?: number;
}

export const addLoyaltyPoints = async (data: AddPointsData): Promise<{ loyalty: CustomerLoyalty; transaction: LoyaltyTransaction }> => {
  try {
    return await apiClient.post<{ loyalty: CustomerLoyalty; transaction: LoyaltyTransaction }>('/loyalty/points/add', data);
  } catch (error) {
    throw error;
  }
};

// Redeem loyalty points
export interface RedeemPointsData {
  customerId: string;
  pointsToRedeem: number;
  description: string;
  orderReference?: string;
  relatedAmount?: number;
}

export const redeemLoyaltyPoints = async (data: RedeemPointsData): Promise<{ loyalty: CustomerLoyalty; transaction: LoyaltyTransaction }> => {
  try {
    return await apiClient.post<{ loyalty: CustomerLoyalty; transaction: LoyaltyTransaction }>('/loyalty/points/redeem', data);
  } catch (error) {
    throw error;
  }
};

// Get loyalty transactions with filtering
export interface LoyaltyTransactionFilter {
  page?: number;
  limit?: number;
  customerId?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}

export const getLoyaltyTransactions = async (filter: LoyaltyTransactionFilter = {}): Promise<LoyaltyTransactionResponse> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value.toString();
      }
    });

    return await apiClient.get<LoyaltyTransactionResponse>('/loyalty/transactions', params);
  } catch (error) {
    throw error;
  }
};

// Get customer loyalty details
export const getCustomerLoyaltyDetails = async (customerId: string): Promise<{
  loyalty: CustomerLoyalty;
  transactions: LoyaltyTransaction[];
  tierBenefits: TierBenefits;
}> => {
  try {
    return await apiClient.get<{
      loyalty: CustomerLoyalty;
      transactions: LoyaltyTransaction[];
      tierBenefits: TierBenefits;
    }>(`/loyalty/customers/${customerId}`);
  } catch (error) {
    throw error;
  }
};

// Get loyalty statistics
export const getLoyaltyStatistics = async (filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}): Promise<LoyaltyStatistics> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<LoyaltyStatistics>('/loyalty/statistics', params);
  } catch (error) {
    throw error;
  }
};

// Update loyalty tier
export const updateLoyaltyTier = async (customerId: string, newTier: string): Promise<CustomerLoyalty> => {
  try {
    const response = await apiClient.put<{ loyalty: CustomerLoyalty }>(`/loyalty/customers/${customerId}/tier`, { tier: newTier });
    return response.loyalty;
  } catch (error) {
    throw error;
  }
};

// Get tier benefits
export const getTierBenefits = async (tier: string): Promise<TierBenefits> => {
  try {
    return await apiClient.get<TierBenefits>(`/loyalty/tiers/${tier}/benefits`);
  } catch (error) {
    throw error;
  }
};

// Calculate points from amount (utility function)
export const calculatePointsFromAmount = (amount: number): number => {
  return Math.floor(amount / 1000); // 1 point per 1000 Toman
}; 