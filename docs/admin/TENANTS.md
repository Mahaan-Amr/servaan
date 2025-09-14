### Tenant Management (Admin) - Enhanced System

This document describes the comprehensive Tenant Management system in the Admin panel with all recent enhancements.

#### Overview
- Admin UI: `مستاجران` page at `/admin/tenants`
- **Enhanced Features:**
  - **Advanced Search & Filter System** with multi-criteria filtering
  - **Enhanced Tenant Creation Wizard** with step-by-step process
  - **Comprehensive Tenant Details View** with metrics dashboard
  - **Bulk Operations** with advanced management actions
  - **Enhanced Export System** with comprehensive filtering
  - **Real-time Subdomain Availability Check**
  - **Saved Search Functionality**
  - **Activity Timeline and Audit Logs**
  - **Advanced User Management**
  - **Performance Analytics and KPIs**

#### Roles and Access
- Authentication: Admin JWT required
- Endpoints are protected by `authenticateAdmin`
- Role requirements:
  - List/Read: any authenticated admin
  - Create: `SUPER_ADMIN`, `PLATFORM_ADMIN`
  - Update: `SUPER_ADMIN`, `PLATFORM_ADMIN`
  - Activate/Deactivate: `SUPER_ADMIN`, `PLATFORM_ADMIN` (activate), `SUPER_ADMIN` (deactivate)
  - Bulk status update: `SUPER_ADMIN`, `PLATFORM_ADMIN`

#### Backend Endpoints
Base: `/api/admin/tenants`

- GET `/` — list tenants with enhanced filtering
  - **Basic Query:** `page`, `limit`, `search`, `status` (all|active|inactive), `plan` (STARTER|BUSINESS|ENTERPRISE)
  - **Enhanced Query:** `sortBy` (createdAt|monthlyRevenue|ordersThisMonth), `sortDir` (asc|desc), `refresh` (true bypasses cache)
  - **Advanced Filters:** `businessType`, `city`, `country`, `createdFrom`, `createdTo`, `revenueFrom`, `revenueTo`, `userCountFrom`, `userCountTo`, `hasFeatures`
  - Response: `{ tenants, pagination }`

- GET `/check-subdomain/:subdomain` — check subdomain availability
  - Validates subdomain format, reserved names, and uniqueness
  - Response: `{ success: true, available: boolean, message: string }`

- POST `/` — create tenant (RBAC)
  - Body (JSON):
    - `name` (string, required)
    - `subdomain` (string, required, unique, lowercase)
    - `displayName` (string)
    - `description` (string)
    - `plan` (STARTER|BUSINESS|ENTERPRISE, default STARTER)
    - `ownerName` (string, required)
    - `ownerEmail` (string, required)
    - `ownerPhone` (string)
    - `businessType`, `city`, `country` (string)
    - `isActive` (boolean, default true)
    - `features` (object, optional flags)
  - 409 `SUBDOMAIN_TAKEN` if subdomain exists

- GET `/:id` — tenant details
- GET `/:id/metrics` — tenant metrics (placeholder data)
- PUT `/:id` — update tenant (RBAC)
- DELETE `/:id` — deactivate tenant (RBAC: SUPER_ADMIN)
- PUT `/:id/activate` — activate tenant (RBAC)
- POST `/bulk-status` — bulk activate/deactivate (RBAC)
- GET `/overview` — platform overview
- GET `/analytics/growth` — growth analytics (placeholder data)
- GET `/analytics/revenue` — revenue analytics (placeholder data)
- GET `/export` — export tenants with enhanced filtering (csv|excel|pdf)
  - **Enhanced Query:** All advanced filters supported
  - **Selected Tenants:** Export specific selected tenants
  - **Filename:** Dynamic naming with tenant count and timestamp

Audit logging is applied to all read/write endpoints.

#### Frontend Integration

**Enhanced Service:** `src/admin/frontend/src/services/admin/tenants/tenantService.ts`
- `getTenants` — Enhanced with all advanced filters
- `getTenantById`, `getTenantMetrics`
- `createTenant`, `updateTenant`, `deactivateTenant`, `activateTenant`
- `bulkUpdateTenantStatus`, `exportTenants` — Enhanced with filters and selected tenants
- `checkSubdomainAvailability` — Real-time subdomain validation

**Enhanced UI Components:**
- **Main List:** `src/admin/frontend/src/app/admin/tenants/page.tsx`
- **Advanced Search:** `src/admin/frontend/src/components/admin/tenants/AdvancedSearchFilters.tsx`
- **Creation Wizard:** `src/admin/frontend/src/components/admin/tenants/TenantCreationWizard.tsx`
- **Details View:** `src/admin/frontend/src/app/admin/tenants/[id]/page.tsx`
- **Metrics Dashboard:** `src/admin/frontend/src/components/admin/tenants/TenantMetricsDashboard.tsx`
- **Activity Timeline:** `src/admin/frontend/src/components/admin/tenants/TenantActivityTimeline.tsx`
- **User Management:** `src/admin/frontend/src/components/admin/tenants/TenantUserManagement.tsx`
- **Bulk Operations:** `src/admin/frontend/src/components/admin/tenants/BulkOperationsBar.tsx`

Localization:
- All tenant UI strings are in Farsi with RTL layout conventions.

#### Enhanced Features Details

**🔍 Advanced Search & Filter System:**
- Multi-criteria search across all tenant fields (name, subdomain, email, business type, city, country)
- Date range filters for creation date
- Revenue range filters for monthly income
- User count range filters
- Location-based filtering (city, country)
- Business type filtering
- Feature-based filtering (13 different features)
- Saved search functionality with custom names
- Real-time filter application

**🧙‍♂️ Enhanced Tenant Creation Wizard:**
- 5-step wizard with progress indicator
- Real-time subdomain availability check with API integration
- Comprehensive form validation at each step
- Plan selection with detailed feature descriptions and pricing
- Feature selection with 13 different tenant features
- Preview step with complete information summary
- Step-by-step validation with error handling

**📊 Comprehensive Tenant Details View:**
- Metrics dashboard with charts and KPIs
- Activity timeline with filtering and search
- Advanced user management with bulk operations
- Performance analytics and real-time data
- Export functionality for reports
- Comprehensive tenant overview

**⚡ Bulk Operations:**
- Multi-tenant selection and management
- Bulk activate/deactivate operations
- Enhanced export with current filters
- Confirmation dialogs for safety
- Progress indicators and error handling

**📤 Enhanced Export System:**
- Support for all advanced filters
- Selected tenant export
- Dynamic filename generation
- Multiple formats (CSV, Excel, PDF)
- UTF-8 encoding for Persian text

#### Technical Implementation

**Metrics Sources:**
- Monthly revenue: `order_payments` sum(`amount`) where `paymentStatus=PAID` and `paymentDate >= startOfMonth`
- Orders this month: `orders` count where `orderDate >= startOfMonth`
- Customers: active total from `customers.isActive=true`; active this month from `customer_visits.visitDate >= startOfMonth`

**Cache Rules:**
- In-memory TTL 60s for metrics and revenue per list
- Per-tenant cache keys; `?refresh=true` bypasses cache
- Debounced API calls for subdomain checking

**Performance Optimizations:**
- Debounced search and filter inputs
- Lazy loading of tenant details
- Efficient bulk operations
- Optimized database queries with proper indexing


