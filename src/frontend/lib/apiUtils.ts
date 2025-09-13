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
  // Remove /api suffix if present
  let cleanUrl = baseUrl.replace('/api', '');
  
  // Ensure we have a proper protocol, preserving HTTPS if present
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    // If the original URL was HTTPS, preserve it
    if (baseUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    } else {
      cleanUrl = 'http://' + cleanUrl;
    }
  }
  
  return cleanUrl;
};

// Export commonly used URLs
export const API_URL = getApiUrl();
export const BASE_URL = getBaseUrl();
