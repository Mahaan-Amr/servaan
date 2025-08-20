# 🚀 API Client Migration Guide

## Overview

This guide documents the migration from the old `axios` + `authAxios` pattern to the new standardized `ApiClient` pattern that provides:

- ✅ **Automatic tenant context** (`X-Tenant-Subdomain` header)
- ✅ **Consistent error handling** with Persian messages
- ✅ **Standardized response processing**
- ✅ **Type-safe API calls**
- ✅ **Automatic authentication headers**

## 🔄 Migration Status

| Service | Status | Notes |
|---------|--------|-------|
| `inventoryService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `customerService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `loyaltyService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `visitService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `crmService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `smsService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `accountingService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `biService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `reportService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `supplierService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |
| `orderingService` | ✅ **COMPLETED** | Fixed tenant context, using custom implementation |
| `scannerService` | ✅ **COMPLETED** | Fully migrated to `ApiClient` |

## 🎯 Migration Steps

### Step 1: Remove Old Imports

**Before:**
```typescript
import axios from 'axios';
import { authAxios } from './authAxios';
```

**After:**
```typescript
import { apiClient } from '../lib/apiClient';
```

### Step 2: Replace API Calls

**Before:**
```typescript
// Old axios pattern
const response = await authAxios.get('/customers');
return response.data.customers;
```

**After:**
```typescript
// New ApiClient pattern
const customers = await apiClient.get<Customer[]>('/customers');
return customers;
```

### Step 3: Update Error Handling

**Before:**
```typescript
try {
  const response = await authAxios.get('/customers');
  return response.data.customers;
} catch (error) {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.message || 'خطا در دریافت مشتریان');
  }
  throw error;
}
```

**After:**
```typescript
try {
  return await apiClient.get<Customer[]>('/customers');
} catch (error) {
  throw error; // ApiClient handles error formatting automatically
}
```

### Step 4: Update Function Signatures

**Before:**
```typescript
export const getCustomers = async (params?: URLSearchParams): Promise<Customer[]> => {
  const queryString = params ? `?${params.toString()}` : '';
  const response = await authAxios.get(`/customers${queryString}`);
  return response.data.customers;
};
```

**After:**
```typescript
export const getCustomers = async (filters?: Record<string, string | number | boolean>): Promise<Customer[]> => {
  return await apiClient.get<Customer[]>('/customers', filters);
};
```

## 🔧 API Client Methods

### Basic HTTP Methods

```typescript
// GET request
const data = await apiClient.get<ResponseType>('/endpoint', queryParams);

// POST request
const result = await apiClient.post<ResponseType>('/endpoint', requestBody);

// PUT request
const updated = await apiClient.put<ResponseType>('/endpoint', requestBody);

// PATCH request
const patched = await apiClient.patch<ResponseType>('/endpoint', requestBody);

// DELETE request
await apiClient.delete<void>('/endpoint');
```

### File Operations

```typescript
// Upload file
const formData = new FormData();
formData.append('file', file);
const result = await apiClient.upload<ResponseType>('/upload', formData);

// Download file
await apiClient.download('/download', 'filename.pdf');
```

### Query Parameters

```typescript
// Simple parameters
const customers = await apiClient.get<Customer[]>('/customers', {
  active: true,
  limit: 50,
  sortBy: 'name'
});

// Complex filtering
const orders = await apiClient.get<Order[]>('/orders', {
  status: ['PENDING', 'CONFIRMED'],
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  minAmount: 1000
});
```

## 🚨 Common Migration Issues

### Issue 1: Response Data Structure

**Problem:** Old code expects `response.data.customers`
**Solution:** ApiClient returns data directly

```typescript
// ❌ Old way
const response = await authAxios.get('/customers');
return response.data.customers;

// ✅ New way
return await apiClient.get<Customer[]>('/customers');
```

### Issue 2: URLSearchParams

**Problem:** Old code uses `URLSearchParams`
**Solution:** Use plain objects with ApiClient

```typescript
// ❌ Old way
const params = new URLSearchParams();
params.append('active', 'true');
params.append('limit', '50');
const response = await authAxios.get(`/customers?${params.toString()}`);

// ✅ New way
const customers = await apiClient.get<Customer[]>('/customers', {
  active: true,
  limit: 50
});
```

### Issue 3: Error Handling

**Problem:** Old code checks `response.data.success`
**Solution:** ApiClient handles success/failure automatically

```typescript
// ❌ Old way
const response = await authAxios.get('/customers');
if (response.data.success) {
  return response.data.customers;
} else {
  throw new Error(response.data.message);
}

// ✅ New way
return await apiClient.get<Customer[]>('/customers');
```

## 🔒 Tenant Context

### Automatic Tenant Detection

The ApiClient automatically includes the `X-Tenant-Subdomain` header:

```typescript
// Automatically extracted from window.location.hostname
// localhost → 'dima'
// dima.localhost → 'dima'
// macheen.servaan.ir → 'macheen'
```

### Manual Tenant Override

```typescript
// If you need to override tenant context
const customHeaders = {
  'X-Tenant-Subdomain': 'specific-tenant'
};

// Use with custom headers
const response = await fetch('/api/endpoint', {
  headers: {
    ...getAuthHeaders(),
    ...customHeaders
  }
});
```

## 📊 Testing

### Unit Tests

```typescript
import { apiClient } from '../lib/apiClient';

// Mock fetch for testing
global.fetch = jest.fn();

describe('ApiClient', () => {
  it('should include tenant context in headers', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
      headers: new Headers()
    } as Response);

    await apiClient.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Tenant-Subdomain': expect.any(String)
        })
      })
    );
  });
});
```

### Integration Tests

```typescript
// Test with real backend
describe('Customer API Integration', () => {
  it('should respect tenant isolation', async () => {
    // Test with different tenant contexts
    const tenant1Customers = await apiClient.get('/customers');
    // Verify data belongs to correct tenant
  });
});
```

## 🎉 Benefits of Migration

1. **Consistency**: All services use the same API calling pattern
2. **Security**: Automatic tenant context prevents data leakage
3. **Maintainability**: Centralized error handling and response processing
4. **Type Safety**: Better TypeScript support with generics
5. **Performance**: Reduced bundle size (no axios dependency)
6. **Testing**: Easier to mock and test API calls

## 📚 Additional Resources

- [ApiClient Source Code](../lib/apiClient.ts)
- [Standardized API Client README](../lib/README.md)
- [Multi-Tenancy Implementation Guide](../../docs/multi-tenancy.md)
- [API Error Handling Standards](../../docs/api-standards.md)

## 🤝 Support

If you encounter issues during migration:

1. Check this guide for common solutions
2. Review existing migrated services for examples
3. Ensure tenant context is properly set
4. Verify backend middleware is configured correctly

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** ✅ **ALL SERVICES MIGRATED**
