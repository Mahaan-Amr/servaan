# Standardized API Client

This directory contains the centralized API client that provides consistent API calls across all services with automatic tenant context and standardized error handling.

## Overview

The standardized API client solves the multi-tenancy consistency issues by providing:

- ✅ **Automatic tenant context** - `X-Tenant-Subdomain` header automatically added
- ✅ **Consistent authentication** - Bearer token automatically included
- ✅ **Standardized error handling** - Persian error messages with status codes
- ✅ **Type safety** - Full TypeScript support with generics
- ✅ **Backward compatibility** - Multiple ways to use the client

## Files

- `apiClient.ts` - Main API client class and utilities
- `README.md` - This documentation file

## Usage Patterns

### Pattern 1: Class Instance (Recommended for new code)

```typescript
import { apiClient } from '../lib/apiClient';

// GET request
const customers = await apiClient.get<Customer[]>('/customers');

// GET with query parameters
const customers = await apiClient.get<Customer[]>('/customers', {
  active: 'true',
  limit: 50
});

// POST request
const newCustomer = await apiClient.post<Customer>('/customers', customerData);

// PUT request
const updatedCustomer = await apiClient.put<Customer>(`/customers/${id}`, updateData);

// DELETE request
await apiClient.delete<{ message: string }>(`/customers/${id}`);

// File upload
const result = await apiClient.upload<UploadResult>('/customers/import', formData);

// File download
await apiClient.download('/customers/export', 'customers.csv');
```

### Pattern 2: Helper Functions (Backward compatibility)

```typescript
import { getAuthHeaders } from '../lib/apiClient';

// Use with fetch directly
const response = await fetch(`${API_URL}/customers`, {
  headers: getAuthHeaders()
});
```

### Pattern 3: Legacy Wrapper (For gradual migration)

```typescript
import { apiRequest } from '../lib/apiClient';

// Same interface as class instance
const customers = await apiRequest.get<Customer[]>('/customers');
```

## Migration Guide

### From authAxios to Standardized Client

**Before (Problematic):**
```typescript
// OLD: Missing tenant context
const response = await authAxios.get(`${API_URL}/customers`);
return response.data;
```

**After (Fixed):**
```typescript
// NEW: With tenant context and error handling
const customers = await apiClient.get<Customer[]>('/customers');
return customers;
```

### From axios.isAxiosError to Standardized Error Handling

**Before (Problematic):**
```typescript
try {
  const response = await authAxios.get(`${API_URL}/customers`);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error) && error.response) {
    throw new Error(error.response.data.message || 'خطا در دریافت مشتریان');
  }
  throw new Error('خطا در ارتباط با سرور');
}
```

**After (Fixed):**
```typescript
try {
  const customers = await apiClient.get<Customer[]>('/customers');
  return customers;
} catch (error) {
  // Error handling is automatic with Persian messages
  throw error; // Re-throw the standardized error
}
```

## Features

### 1. Automatic Tenant Context

The client automatically:
- Extracts subdomain from current hostname
- Handles localhost development vs production
- Adds `X-Tenant-Subdomain` header to all requests

### 2. Consistent Authentication

- Bearer token automatically included
- Handles both localStorage and sessionStorage tokens
- Automatic token refresh support

### 3. Standardized Error Handling

- Persian error messages by default
- Status code included in error objects
- Automatic JSON error parsing
- Fallback to status text for non-JSON errors

### 4. Type Safety

- Full TypeScript support
- Generic types for response data
- Proper typing for query parameters
- Type-safe error handling

### 5. Query Parameter Support

```typescript
// Automatically converts to URL query string
const customers = await apiClient.get<Customer[]>('/customers', {
  active: 'true',
  limit: 50,
  category: 'VIP'
});
// Results in: /customers?active=true&limit=50&category=VIP
```

## Error Handling

### Standard Error Format

```typescript
try {
  const data = await apiClient.get<Customer[]>('/customers');
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // Persian error message
    console.log((error as any).statusCode); // HTTP status code
  }
}
```

### Custom Error Messages

The client provides default Persian error messages for common operations:
- GET: "خطا در دریافت اطلاعات"
- POST: "خطا در ارسال اطلاعات"
- PUT: "خطا در بروزرسانی اطلاعات"
- DELETE: "خطا در حذف اطلاعات"
- Upload: "خطا در آپلود فایل"
- Download: "خطا در دانلود فایل"

## Best Practices

### 1. Use TypeScript Generics

```typescript
// ✅ Good: Type-safe response
const customers = await apiClient.get<Customer[]>('/customers');

// ❌ Bad: No type safety
const customers = await apiClient.get('/customers');
```

### 2. Handle Errors Appropriately

```typescript
try {
  const data = await apiClient.get<Customer[]>('/customers');
  return data;
} catch (error) {
  // Log error for debugging
  console.error('Failed to fetch customers:', error);
  
  // Re-throw or handle based on context
  throw error;
}
```

### 3. Use Query Parameters for Filtering

```typescript
// ✅ Good: Use query parameters
const customers = await apiClient.get<Customer[]>('/customers', {
  active: 'true',
  category: 'VIP'
});

// ❌ Bad: Build URL manually
const customers = await apiClient.get<Customer[]>(`/customers?active=true&category=VIP`);
```

## Migration Checklist

For each service file:

1. ✅ Import the standardized client
2. ✅ Replace `authAxios` calls with `apiClient` methods
3. ✅ Remove `axios.isAxiosError` error handling
4. ✅ Add proper TypeScript generics
5. ✅ Test tenant context functionality
6. ✅ Verify error messages are in Persian
7. ✅ Remove unused axios imports

## Example Migration

**Before:**
```typescript
import axios from 'axios';
import { getToken } from './authService';

const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await authAxios.get(`${API_URL}/customers`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'خطا در دریافت مشتریان');
    }
    throw new Error('خطا در ارتباط با سرور');
  }
};
```

**After:**
```typescript
import { apiClient } from '../lib/apiClient';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    return await apiClient.get<Customer[]>('/customers');
  } catch (error) {
    // Error handling is automatic
    throw error;
  }
};
```

## Support

For questions or issues with the standardized API client:

1. Check this documentation first
2. Review the example migrations
3. Ensure all imports are correct
4. Verify tenant context is working
5. Check browser console for any errors

The standardized client is designed to be robust and handle edge cases automatically while providing a clean, consistent interface for all API calls.
