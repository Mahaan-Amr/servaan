import { getToken } from '../services/authService';
import { API_URL } from './apiUtils';

/**
 * Centralized API Client for consistent API calls across all services
 * Provides automatic tenant context, authentication, and standardized error handling
 */
export class ApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Get authentication headers with tenant context
   * Automatically extracts subdomain from current hostname
   */
  private getHeaders(): HeadersInit {
    const token = getToken();
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    // Handle localhost development vs production subdomains
    let subdomain: string;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For localhost development, default to 'dima' or extract from subdomain
      subdomain = hostname.includes('.') ? hostname.split('.')[0] : 'dima';
    } else {
      // For production, extract subdomain from hostname
      subdomain = hostname.split('.')[0];
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant-Subdomain': subdomain
    };
  }

  /**
   * Handle API response and extract error messages
   */
  private async handleResponse<T>(response: Response, defaultErrorMessage: string): Promise<T> {
    if (!response.ok) {
      let errorMessage = defaultErrorMessage;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || defaultErrorMessage;
      } catch {
        // If error response is not JSON, use status text
        errorMessage = response.statusText || defaultErrorMessage;
      }
      
      // Create custom error with status code for better error handling
      const error = new Error(errorMessage) as Error & { statusCode?: number };
      error.statusCode = response.status;
      throw error;
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        // Return empty array/object for empty JSON responses
        return [] as T;
      }
    }
    
    return response.text() as T;
  }

  /**
   * GET request with query parameters support
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    try {
      let queryString = '';
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });
        queryString = `?${searchParams.toString()}`;
      }
      const url = `${this.baseUrl}${endpoint}${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse<T>(response, 'خطا در دریافت اطلاعات');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  }

  /**
   * POST request with data
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });
      
      return await this.handleResponse<T>(response, 'خطا در ارسال اطلاعات');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  }

  /**
   * PUT request with data
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });
      
      return await this.handleResponse<T>(response, 'خطا در بروزرسانی اطلاعات');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  }

  /**
   * PATCH request with data
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });
      
      return await this.handleResponse<T>(response, 'خطا در بروزرسانی اطلاعات');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse<T>(response, 'خطا در حذف اطلاعات');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  }

  /**
   * Upload file with FormData
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const token = getToken();
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      let subdomain: string;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        subdomain = hostname.includes('.') ? hostname.split('.')[0] : 'dima';
      } else {
        subdomain = hostname.split('.')[0];
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Subdomain': subdomain
          // Note: Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });
      
      return await this.handleResponse<T>(response, 'خطا در آپلود فایل');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  }

  /**
   * Download file
   */
  async download(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در دانلود فایل');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('خطا در دانلود فایل');
    }
  }
}

/**
 * Global instance of the API client
 * All services should use this instance for consistency
 */
export const apiClient = new ApiClient();

/**
 * Helper function for backward compatibility
 * Services can use this instead of the class instance
 */
export const getAuthHeaders = () => {
  const token = getToken();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  let subdomain: string;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    subdomain = hostname.includes('.') ? hostname.split('.')[0] : 'dima';
  } else {
    subdomain = hostname.split('.')[0];
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-Subdomain': subdomain
  };
};

/**
 * Legacy fetch wrapper for backward compatibility
 * Services can use this instead of the class methods
 */
export const apiRequest = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> => 
    apiClient.get<T>(endpoint, params),
  
  post: <T>(endpoint: string, data?: unknown): Promise<T> => 
    apiClient.post<T>(endpoint, data),
  
  put: <T>(endpoint: string, data?: unknown): Promise<T> => 
    apiClient.put<T>(endpoint, data),
  
  patch: <T>(endpoint: string, data?: unknown): Promise<T> => 
    apiClient.patch<T>(endpoint, data),
  
  delete: <T>(endpoint: string): Promise<T> => 
    apiClient.delete<T>(endpoint),
  
  upload: <T>(endpoint: string, formData: FormData): Promise<T> => 
    apiClient.upload<T>(endpoint, formData),
  
  download: (endpoint: string, filename?: string): Promise<void> => 
    apiClient.download(endpoint, filename)
};
