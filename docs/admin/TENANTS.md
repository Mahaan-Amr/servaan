### Tenant Management (Admin)

This document describes the current state of Tenant Management in the Admin panel.

#### Overview
- Admin UI: `مستاجران` page at `/admin/tenants`
- Features:
  - List tenants with pagination, search, and filters (status, plan)
  - Create tenant (modal)
  - View tenant details (`/admin/tenants/[id]`)
  - Update tenant fields
  - Activate / Deactivate tenant
  - Bulk activate/deactivate
  - Export tenants (CSV/Excel/PDF)
  - Analytics widgets (growth/revenue placeholders)

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

- GET `/` — list tenants
  - Query: `page`, `limit`, `search`, `status` (all|active|inactive), `plan` (STARTER|BUSINESS|ENTERPRISE)
  - New Query: `sortBy` (createdAt|monthlyRevenue|ordersThisMonth), `sortDir` (asc|desc), `refresh` (true bypasses cache)
  - Response: `{ tenants, pagination }`

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
- GET `/export` — export tenants (csv|excel|pdf)

Audit logging is applied to all read/write endpoints.

#### Frontend Integration

Service: `src/admin/frontend/src/services/admin/tenants/tenantService.ts`
- `getTenants`, `getTenantById`, `getTenantMetrics`
- `createTenant`, `updateTenant`, `deactivateTenant`, `activateTenant`
- `bulkUpdateTenantStatus`, `exportTenants`
 - Sorting controls added on tenants page; "بروزرسانی (بدون کش)" bypasses cache.

UI:
- List: `src/admin/frontend/src/app/admin/tenants/page.tsx`
- Detail: `src/admin/frontend/src/app/admin/tenants/[id]/page.tsx`
- Create modal: `src/admin/frontend/src/components/admin/tenants/CreateTenantModal.tsx`
- Bulk actions: `src/admin/frontend/src/components/admin/tenants/BulkOperationsBar.tsx`

Localization:
- All tenant UI strings are in Farsi with RTL layout conventions.

#### Notes / TODO
- Metrics sources:
  - Monthly revenue: `order_payments` sum(`amount`) where `paymentStatus=PAID` and `paymentDate >= startOfMonth`.
  - Orders this month: `orders` count where `orderDate >= startOfMonth`.
  - Customers: active total from `customers.isActive=true`; active this month from `customer_visits.visitDate >= startOfMonth`.
- Cache rules:
  - In-memory TTL 60s for metrics and revenue per list.
  - Per-tenant cache keys; `?refresh=true` bypasses cache.
- Add user list tab wiring in tenant details
- Add server-side validations and stricter schema


