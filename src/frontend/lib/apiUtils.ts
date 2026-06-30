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

export const DEFAULT_API_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal || controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

const DEFAULT_LOCAL_TENANT = 'dima';

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  );
}

function getCachedTenantSubdomain(): string | null {
  if (typeof window === 'undefined') return null;

  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as { tenantSubdomain?: string };
    return user.tenantSubdomain || null;
  } catch {
    return null;
  }
}

export function getTenantSubdomainHeader(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCAL_TENANT;
  }

  const cachedTenant = getCachedTenantSubdomain();
  if (cachedTenant) {
    return cachedTenant;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith('.localhost')) {
    const candidate = hostname.split('.')[0];
    return candidate || DEFAULT_LOCAL_TENANT;
  }

  if (isLoopbackHost(hostname)) {
    return DEFAULT_LOCAL_TENANT;
  }

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return DEFAULT_LOCAL_TENANT;
}
