import { apiClient } from '../lib/apiClient';

// Types for SMS functionality
export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
}

export interface SMSResponse {
  message: string;
  phoneNumber?: string;
  messageId?: string;
  inviteCode?: string;
  verificationCode?: string; // Only in development
}

export interface BusinessInvitationData {
  phoneNumber: string;
  recipientName?: string;
  businessName: string;
  invitationLink?: string;
  role?: string;
  forceRealSMS?: boolean;
}

export interface VerificationCodeData {
  phoneNumber: string;
  purpose?: string;
}

export interface WelcomeMessageData {
  phoneNumber: string;
  businessName: string;
}

export interface LowStockAlertData {
  phoneNumber: string;
  businessName: string;
  itemName: string;
  currentStock: number;
  minStock: number;
}

export interface BulkSMSData {
  phoneNumbers: string[];
  message: string;
}

// Validate Iranian phone number (frontend validation)
export const validateIranianPhoneNumber = (phoneNumber: string): PhoneValidationResult => {
  if (!phoneNumber) {
    return {
      isValid: false,
      error: 'شماره تلفن الزامی است'
    };
  }

  const cleaned = phoneNumber.replace(/\s+/g, '');
  
  // Iranian mobile patterns
  const patterns = [
    /^(\+98|0098|98|0)?9\d{9}$/,  // Standard Iranian mobile
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      let formatted = cleaned;
      
      // Normalize to 09xxxxxxxxx format
      if (formatted.startsWith('+98')) {
        formatted = '0' + formatted.slice(3);
      } else if (formatted.startsWith('0098')) {
        formatted = '0' + formatted.slice(4);
      } else if (formatted.startsWith('98')) {
        formatted = '0' + formatted.slice(2);
      } else if (!formatted.startsWith('0')) {
        formatted = '0' + formatted;
      }
      
      return {
        isValid: true,
        formatted
      };
    }
  }
  
  return {
    isValid: false,
    error: 'شماره تلفن معتبر نیست'
  };
};

// Send business invitation SMS
export const sendBusinessInvitation = async (data: BusinessInvitationData): Promise<SMSResponse> => {
  try {
    return await apiClient.post<SMSResponse>('/sms/invite', data);
  } catch (error) {
    throw error;
  }
};

// Send verification code SMS
export const sendVerificationCode = async (data: VerificationCodeData): Promise<SMSResponse> => {
  try {
    return await apiClient.post<SMSResponse>('/sms/verify', data);
  } catch (error) {
    throw error;
  }
};

// Send welcome message SMS
export const sendWelcomeMessage = async (data: WelcomeMessageData): Promise<SMSResponse> => {
  try {
    return await apiClient.post<SMSResponse>('/sms/welcome', data);
  } catch (error) {
    throw error;
  }
};

// Send low stock alert SMS
export const sendLowStockAlert = async (data: LowStockAlertData): Promise<SMSResponse> => {
  try {
    return await apiClient.post<SMSResponse>('/sms/alert/low-stock', data);
  } catch (error) {
    throw error;
  }
};

// Send bulk SMS
export const sendBulkSMS = async (data: BulkSMSData): Promise<SMSResponse> => {
  try {
    return await apiClient.post<SMSResponse>('/sms/bulk', data);
  } catch (error) {
    throw error;
  }
};

// Validate phone number with backend
export const validatePhoneNumberWithBackend = async (phoneNumber: string): Promise<PhoneValidationResult> => {
  try {
    return await apiClient.post<PhoneValidationResult>('/sms/validate-phone', { phoneNumber });
  } catch (error) {
    throw error;
  }
};

// Get SMS delivery status
export const getSMSDeliveryStatus = async (messageId: string): Promise<{
  messageId: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  deliveredAt?: string;
  failureReason?: string;
}> => {
  try {
    return await apiClient.get<{
      messageId: string;
      status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
      deliveredAt?: string;
      failureReason?: string;
    }>(`/sms/status/${messageId}`);
  } catch (error) {
    throw error;
  }
};

// Get SMS statistics
export const getSMSStatistics = async (filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
}): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  cost: number;
  breakdown: Record<string, number>;
}> => {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return await apiClient.get<{
      totalSent: number;
      totalDelivered: number;
      totalFailed: number;
      deliveryRate: number;
      cost: number;
      breakdown: Record<string, number>;
    }>('/sms/stats', params);
  } catch (error) {
    throw error;
  }
};

// Get SMS account information
export const getSMSAccountInfo = async (): Promise<{
  balance: number;
  credit: number;
  plan: string;
  expiryDate: string;
  features: string[];
}> => {
  try {
    return await apiClient.get<{
      balance: number;
      credit: number;
      plan: string;
      expiryDate: string;
      features: string[];
    }>('/sms/account/info');
  } catch (error) {
    throw error;
  }
}; 