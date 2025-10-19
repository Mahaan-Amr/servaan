/**
 * Utility functions for API URL handling
 * Prevents double /api paths in frontend requests
 */

/**
 * Get the correct API URL, handling both cases:
 * - NEXT_PUBLIC_API_URL with /api suffix
 * - NEXT_PUBLIC_API_URL without /api suffix
 */
export const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // If the URL already ends with /api, use it as is, otherwise add /api
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

/**
 * Get the base URL without /api suffix (for WebSocket connections)
 */
export const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Handle different URL formats properly
  if (baseUrl.endsWith('/api')) {
    // Remove /api suffix and return the base URL
    return baseUrl.replace('/api', '');
  } else if (baseUrl.includes('/api/')) {
    // Handle cases like https://api.servaan.com/api -> https://api.servaan.com
    return baseUrl.replace('/api', '');
  } else {
    // URL doesn't have /api, return as is
    return baseUrl;
  }
};

// Export commonly used URLs
export const API_URL = getApiUrl();
export const BASE_URL = getBaseUrl();
