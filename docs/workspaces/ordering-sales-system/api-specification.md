# Ordering & Sales System – API Specification (Refactored)

Last updated: 2025-10-20
Status: Current and authoritative for the deployed codebase

## 1) Authentication, Tenanting, RBAC
- Auth: JWT in `Authorization: Bearer <token>`
- Tenant: resolved by middleware (header optional in some deployments)
- Roles: ADMIN, MANAGER, STAFF
  - Mutations on orders (complete/cancel), KDS priority/status: ADMIN/MANAGER

## 2) Global Invariants
- Currency: Displayed as Toman (no decimals) on UI
- Dates: Farsi calendar and Farsi digits on UI
- Order numbers: `ORD-YYYYMMDD-NNNN`, unique per-tenant, generated in-transaction with retry
- Initial order status: `SUBMITTED` → then `CONFIRMED → PREPARING → READY → SERVED/COMPLETED`
- KDS priority: integer 0..5 (validated backend)

## 3) Orders API

### GET /api/orders
Query params: `page, limit, status[], orderType[], tableId, customerId, startDate, endDate, search, sortBy, sortOrder`
Response: `{ success, data: { orders, pagination, summary } }`

### GET /api/orders/:id
Response: `{ success, data: { order, items, payments, table?, customer? } }`

### GET /api/orders/today/summary
Response: stats for dashboard (revenue, counts, averages)

### POST /api/orders
Creates order with status SUBMITTED and creates matching KDS entry.
Body: orderType, customer info (optional), tableId (optional), items[], notes, kitchenNotes, allergyInfo
Response: `{ success, data: { order, orderNumber, estimatedTime } }`

### PUT /api/orders/:id
Updates order (items, notes, options). KDS sync applied when relevant.

### PATCH /api/orders/:id/status
Controlled status transitions; validation enforced.

### POST /api/orders/:id/complete
Sets order to COMPLETED, triggers accounting integration and KDS sync.

### POST /api/orders/:id/cancel
Cancels order, updates KDS entry accordingly.

### Ancillary
- POST `/api/orders/:id/add-items`
- DELETE `/api/orders/:id/remove-items`
- PUT `/api/orders/:id/update-quantities`
- GET `/api/orders/:id/payment-history`

## 4) Kitchen Display (KDS)

### GET /api/kitchen/displays/:displayName
Returns KDS orders for a given display (excludes COMPLETED/CANCELLED/SERVED).

### GET /api/kitchen/stations
Lists available stations.

### PATCH /api/kitchen/displays/:id/status
Valid transitions include SUBMITTED→CONFIRMED/PREPARING; READY→SERVED, etc.

### PATCH /api/kitchen/displays/:id/priority
Priority must be between 0 and 5.

## 5) Payments
- POST `/api/payments/process`
- POST `/api/payments/refund`
- POST `/api/payments/validate`
- GET `/api/payments`, `/daily-summary`, `/methods-breakdown`, `/statistics`, `/pending`, `/failed`, `/cash-management`
- POST `/api/payments/:id/retry`

## 6) Tables
- GET `/api/tables`, `/tables/layout`, `/tables/available`, `/tables/:id`
- PATCH `/api/tables/:id/status`
- POST `/api/tables/:tableId/transfer`
- POST `/api/tables/:id/occupy`, POST `/api/tables/:id/clear`

## 7) Analytics (Ordering)
- GET `/api/analytics/sales-summary`
- GET `/api/analytics/top-items`
- GET `/api/analytics/hourly-sales`
- GET `/api/analytics/customer-analytics`
- GET `/api/analytics/kitchen-performance`
- GET `/api/analytics/table-utilization`
- Exports: GET `/api/analytics/export/csv`, GET `/api/analytics/export/json`

## 8) Integrations leveraged by Ordering
- Inventory stock check: POST `/api/inventory/validate-order-stock`
- Menu availability sync: POST `/api/inventory/update-menu-availability`

## 9) WebSocket Events (tenant-scoped)
- `kitchen:order:update`
- `kitchen:stock:alert`
- `kitchen:menu:availability`
- `kitchen:profitability:update`

---

## Appendix A — Deprecated/Legacy/Planned

- Legacy kitchen endpoints
  - GET `/api/kitchen/orders`, PUT `/api/kitchen/orders/:orderId/status`, PUT item-ready
  - Status: replaced by `/kitchen/displays/*`

- POS session and quick-sale endpoints
  - `/api/pos/session*`, `/api/pos/quick-sale`
  - Status: Planned (not implemented)

- Legacy “table-performance” endpoint name
  - Use `/analytics/table-utilization` and `/tables/analytics/*` instead

--- 