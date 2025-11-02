# ✅ Admin API — Authoritative Snapshot (2025-10-20)

Base: `/api/admin`
Auth: Separate admin JWT; use `authenticateAdmin`; role checks via `requireRole`

Implemented routes (non-exhaustive; reflects current code)
- Auth: `/auth/login`, `/auth/logout`, `/auth/profile`, `/auth/change-password`, `/auth/verify`, `/auth/health`
- Dashboard: `/dashboard/*` (see backend routes)
- Backups: `/backups/*`
- Tenants: `/tenants` (GET with rich filters, POST create), `/tenants/export`, `/tenants/overview`, `/tenants/:id`, `/tenants/:id/metrics`, `/tenants/:id/activate`, `/tenants/bulk-status`, `/tenants/:id/activity`,
  - Users under tenant: GET `/tenants/:id/users`, POST `/tenants/:id/users`, PUT `/tenants/:id/users/:userId`, POST `/tenants/:id/users/reset-password`
- Users: `/users/*` (see adminUserRoutes)

Conventions
- Pagination and filtering are supported where indicated (e.g., TenantService.listTenants)
- Audit logging recorded for sensitive actions (`auditLog`)
- Error responses include `success: false` with code/message

Links
- `../common_invariants.md` for shared UI conventions
- `./SECURITY_POLICY.md` for admin security practices

Planned
- Any routes referenced in docs not listed above are planned or legacy; prefer the above route set.

---

# 🔌 Admin Panel API Specification

## 📋 Overview

This document defines all API endpoints for the Servaan Platform Admin Panel. All endpoints are prefixed with `/api/admin` and require proper admin authentication.

## 🔐 Authentication

### **Base URL**
```
Production: https://admin.servaan.com/api/admin
Development: http://localhost:3001/api/admin
```

### **Authentication Headers**
```http
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

### **JWT Token Structure**
```json
{
  "adminUserId": "uuid",
  "email": "admin@servaan.com",
  "role": "SUPER_ADMIN",
  "exp": 1642233600,
  "iat": 1642147200
}
```

## 🔑 Authentication Endpoints

### **POST /api/admin/auth/login**
Admin user login.

**Request Body:**
```json
{
  "email": "admin@servaan.com",
  "password": "secure_password",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "adminUser": {
      "id": "uuid",
      "email": "admin@servaan.com",
      "role": "SUPER_ADMIN",
      "isActive": true
    },
    "token": "jwt_token_here",
    "expiresAt": "2025-01-22T12:00:00Z"
  }
}
```

### **POST /api/admin/auth/logout**
Admin user logout.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### **POST /api/admin/auth/refresh**
Refresh admin JWT token.

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expiresAt": "2025-01-22T18:00:00Z"
  }
}
```

### **POST /api/admin/auth/2fa/verify**
Verify two-factor authentication.

**Request Body:**
```json
{
  "token": "2fa_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA verification successful"
}
```

## 🏢 Tenant Management Endpoints

### **GET /api/admin/tenants**
List all tenants with pagination and search.

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 10)
search: string (optional)
status: string (optional) - active, inactive, all
plan: string (optional) - starter, business, enterprise
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "uuid",
        "subdomain": "dima",
        "name": "Dima Restaurant",
        "displayName": "Dima",
        "plan": "BUSINESS",
        "isActive": true,
        "createdAt": "2025-01-10T10:00:00Z",
        "features": {
          "hasInventoryManagement": true,
          "hasCustomerManagement": true,
          "hasAccountingSystem": true
        },
        "metrics": {
          "userCount": 5,
          "customerCount": 150,
          "orderCount": 89,
          "revenue": 1250000
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "pages": 1
    }
  }
}
```

### **GET /api/admin/tenants/:id**
Get detailed information about a specific tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "uuid",
      "subdomain": "dima",
      "name": "Dima Restaurant",
      "displayName": "Dima",
      "description": "Fine dining restaurant",
      "plan": "BUSINESS",
      "isActive": true,
      "ownerName": "Ahmad Dima",
      "ownerEmail": "ahmad@dima.com",
      "businessType": "Restaurant",
      "createdAt": "2025-01-10T10:00:00Z",
      "features": {
        "hasInventoryManagement": true,
        "hasCustomerManagement": true,
        "hasAccountingSystem": true
      },
      "usage": {
        "storageUsed": "45.2 MB",
        "apiCallsLastMonth": 15420,
        "lastActivity": "2025-01-15T14:30:00Z"
      }
    }
  }
}
```

### **POST /api/admin/tenants**
Create a new tenant.

**Request Body:**
```json
{
  "subdomain": "newrestaurant",
  "name": "New Restaurant",
  "displayName": "NewRest",
  "description": "New restaurant chain",
  "ownerName": "Owner Name",
  "ownerEmail": "owner@newrest.com",
  "ownerPhone": "+989123456789",
  "businessType": "Restaurant",
  "plan": "STARTER",
  "address": "123 Main St",
  "city": "Tehran",
  "country": "Iran"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "tenant": {
      "id": "uuid",
      "subdomain": "newrestaurant",
      "name": "New Restaurant",
      "url": "https://newrestaurant.servaan.com"
    }
  }
}
```

### **PUT /api/admin/tenants/:id**
Update tenant information.

**Request Body:**
```json
{
  "displayName": "Updated Restaurant Name",
  "plan": "BUSINESS",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "tenant": {
      "id": "uuid",
      "displayName": "Updated Restaurant Name",
      "plan": "BUSINESS"
    }
  }
}
```

### **DELETE /api/admin/tenants/:id**
Deactivate a tenant (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Tenant deactivated successfully"
}
```

### **GET /api/admin/tenants/:id/metrics**
Get detailed metrics for a specific tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "users": {
        "total": 5,
        "active": 4,
        "inactive": 1
      },
      "customers": {
        "total": 150,
        "newThisMonth": 12,
        "active": 89
      },
      "orders": {
        "total": 89,
        "thisMonth": 15,
        "averageValue": 45000
      },
      "revenue": {
        "total": 1250000,
        "thisMonth": 180000,
        "growth": 12.5
      },
      "inventory": {
        "items": 45,
        "lowStock": 3,
        "outOfStock": 1
      }
    }
  }
}
```

## 🖥️ System Health Endpoints

### **GET /api/admin/system/health**
Get overall system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "overallStatus": "HEALTHY",
    "lastChecked": "2025-01-15T15:00:00Z",
    "components": {
      "database": {
        "status": "HEALTHY",
        "responseTime": 45,
        "connections": 12
      },
      "api": {
        "status": "HEALTHY",
        "responseTime": 120,
        "errorRate": 0.1
      },
      "storage": {
        "status": "WARNING",
        "usage": 78.5,
        "available": "21.5 GB"
      }
    }
  }
}
```

### **GET /api/admin/system/metrics**
Get detailed system performance metrics.

**Query Parameters:**
```
period: string (default: 24h) - 1h, 24h, 7d, 30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "performance": {
      "apiResponseTime": {
        "average": 120,
        "p95": 250,
        "p99": 450
      },
      "databaseQueries": {
        "total": 15420,
        "slow": 23,
        "averageTime": 45
      },
      "errorRates": {
        "api": 0.1,
        "database": 0.05,
        "overall": 0.08
      }
    },
    "resources": {
      "cpu": {
        "usage": 45.2,
        "load": 2.1
      },
      "memory": {
        "usage": 67.8,
        "available": "3.2 GB"
      },
      "disk": {
        "usage": 78.5,
        "available": "21.5 GB"
      }
    }
  }
}
```

### **GET /api/admin/system/logs**
Get system logs with filtering.

**Query Parameters:**
```
level: string (optional) - info, warning, error, critical
period: string (default: 24h) - 1h, 24h, 7d, 30d
limit: number (default: 100)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2025-01-15T15:00:00Z",
        "level": "INFO",
        "message": "System health check completed",
        "component": "health-monitor",
        "details": {}
      }
    ],
    "total": 15420,
    "levels": {
      "info": 15200,
      "warning": 180,
      "error": 35,
      "critical": 5
    }
  }
}
```

### **GET /api/admin/system/backups**
Get backup status and history.

**Response:**
```json
{
  "success": true,
  "data": {
    "lastBackup": {
      "timestamp": "2025-01-15T02:00:00Z",
      "size": "45.2 MB",
      "status": "SUCCESS",
      "duration": 120
    },
    "backupHistory": [
      {
        "timestamp": "2025-01-15T02:00:00Z",
        "size": "45.2 MB",
        "status": "SUCCESS"
      }
    ],
    "schedule": {
      "frequency": "daily",
      "time": "02:00",
      "retention": "30 days"
    }
  }
}
```

### **POST /api/admin/system/backup**
Trigger a manual backup.

**Response:**
```json
{
  "success": true,
  "message": "Backup started successfully",
  "data": {
    "backupId": "uuid",
    "estimatedDuration": 120
  }
}
```

## 📊 Analytics Endpoints

### **GET /api/admin/analytics/overview**
Get platform overview analytics.

**Query Parameters:**
```
period: string (default: 30d) - 7d, 30d, 90d, 1y
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTenants": 3,
      "activeTenants": 3,
      "totalUsers": 15,
      "totalCustomers": 450,
      "totalOrders": 267,
      "totalRevenue": 3750000
    },
    "growth": {
      "tenants": {
        "thisMonth": 1,
        "growth": 50.0
      },
      "revenue": {
        "thisMonth": 450000,
        "growth": 15.2
      },
      "orders": {
        "thisMonth": 45,
        "growth": 12.5
      }
    },
    "topPerformers": {
      "tenants": [
        {
          "name": "Dima",
          "revenue": 1250000,
          "orders": 89
        }
      ]
    }
  }
}
```

### **GET /api/admin/analytics/tenants**
Get detailed tenant analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "uuid",
        "name": "Dima",
        "plan": "BUSINESS",
        "metrics": {
          "revenue": 1250000,
          "orders": 89,
          "customers": 150,
          "users": 5
        },
        "growth": {
          "revenue": 12.5,
          "orders": 8.2,
          "customers": 15.3
        }
      }
    ]
  }
}
```

### **GET /api/admin/analytics/revenue**
Get detailed revenue analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 3750000,
    "monthlyRevenue": [
      {
        "month": "2025-01",
        "revenue": 450000,
        "growth": 15.2
      }
    ],
    "byPlan": {
      "starter": 500000,
      "business": 2500000,
      "enterprise": 750000
    },
    "projections": {
      "nextMonth": 520000,
      "nextQuarter": 1650000
    }
  }
}
```

## 🔒 Security Endpoints

### **GET /api/admin/security/overview**
Get security overview and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "overallStatus": "SECURE",
    "lastAudit": "2025-01-15T10:00:00Z",
    "threats": {
      "blocked": 45,
      "investigating": 2,
      "resolved": 43
    },
    "vulnerabilities": {
      "critical": 0,
      "high": 0,
      "medium": 1,
      "low": 3
    },
    "compliance": {
      "gdpr": "COMPLIANT",
      "dataProtection": "COMPLIANT"
    }
  }
}
```

### **GET /api/admin/security/audit-logs**
Get security audit logs.

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2025-01-15T15:00:00Z",
        "action": "LOGIN_ATTEMPT",
        "user": "admin@servaan.com",
        "ip": "192.168.1.100",
        "status": "SUCCESS",
        "details": {}
      }
    ]
  }
}
```

## 💰 Billing & Revenue Endpoints

### **GET /api/admin/billing/overview**
Get billing overview and subscription status.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSubscriptions": 3,
      "activeSubscriptions": 3,
      "monthlyRecurringRevenue": 450000,
      "annualRecurringRevenue": 5400000
    },
    "subscriptions": [
      {
        "tenantId": "uuid",
        "tenantName": "Dima",
        "plan": "BUSINESS",
        "status": "ACTIVE",
        "amount": 150000,
        "nextBilling": "2025-02-15T00:00:00Z"
      }
    ]
  }
}
```

## 📞 Support Endpoints

### **GET /api/admin/support/tickets**
Get support ticket overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 12,
      "open": 3,
      "inProgress": 5,
      "resolved": 4
    },
    "tickets": [
      {
        "id": "uuid",
        "tenant": "Dima",
        "subject": "Feature request",
        "status": "OPEN",
        "priority": "MEDIUM",
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ]
  }
}
```

## 📝 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

### **Common Error Codes**
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error

### **Example Error Response**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token",
    "details": "Please login again"
  }
}
```

## 📊 Rate Limiting

### **Rate Limits**
- **Authentication endpoints**: 5 requests per minute
- **Read endpoints**: 100 requests per minute
- **Write endpoints**: 20 requests per minute
- **Admin endpoints**: 50 requests per minute

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642147200
```

## 🔍 API Versioning

### **Version Strategy**
- Current version: `v1`
- All endpoints are versioned via URL path
- Breaking changes will increment version number
- Deprecated endpoints will be announced 6 months in advance

### **Version URL Format**
```
/api/admin/v1/tenants
/api/admin/v2/tenants (future)
```

---

**Last Updated**: January 15, 2025  
**Version**: 1.0.0  
**Status**: API Specification Complete  
**Next Step**: Implement backend APIs
