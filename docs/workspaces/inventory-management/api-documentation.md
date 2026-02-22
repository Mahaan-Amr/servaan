# Inventory Management – API Documentation (Refactored)

Last updated: 2025-01-27
Status: Current and authoritative for the deployed codebase

## 1) Auth, Tenanting, RBAC
- JWT required; tenant resolved by middleware
- Roles: ADMIN, MANAGER for mutations; STAFF for read and permitted ops

## 2) Invariants
- Cost model: Weighted Average Cost (WAC)
- Stock invariant: Non‑negative for standard OUT; ADJUSTMENT allowed with reason
- Units: Canonical unit per item; convert on input where relevant
- Currency on UI: Toman (no decimals)

## 3) Implemented Endpoints

### Inventory Integrations (Ordering System Integration)
- GET `/api/inventory/stock-validation/:menuItemId` — Flexible stock validation for single menu item (with warnings/overrides)
- POST `/api/inventory/validate-order-stock` — Flexible stock validation for multiple order items (with warnings/overrides)
- POST `/api/inventory/stock-override` — Record stock override when staff proceeds despite warnings
- GET `/api/inventory/stock-override-analytics` — Analytics on stock override events
- GET `/api/inventory/stock-validation-config` — Get stock validation configuration
- GET `/api/inventory/low-stock-alerts` — Critical/low items with severity
- POST `/api/inventory/update-menu-availability` — Toggles menu availability by stock (requires MANAGER/ADMIN)
- POST `/api/inventory/update-recipe-costs` — Recomputes recipe costs from inventory (requires MANAGER/ADMIN)
- GET `/api/inventory/integration-status` — Health/status of inventory integration with ordering system

### Inventory Entries (Enhanced - 2025-01-27)
- **Order References**: Inventory entries now include `orderId` and `orderItemId` fields for direct order-inventory linkage
- **Automatic Stock Deduction**: Stock deducted automatically on:
  - Order completion (full order)
  - Individual item preparation (`POST /api/ordering/orders/items/:orderItemId/prepare`)
  - Kitchen display status = READY
- **Automatic Stock Restoration**: Stock restored automatically on:
  - Order cancellation (if order was completed)
  - Supports refund scenarios (completed orders can be cancelled)
- **Real-time Updates**: All stock changes emit WebSocket events (`inventory:stock-updated`)

### Inventory Analytics
- GET `/api/analytics/summary` — includes `totalInventoryValue` used by finance
- Additional routes (consumption-by-category, inventory-trends, monthly-movements) exist in `analyticsRoutes.ts`

### Recipes
- GET `/api/recipes/menu-item/:menuItemId`
- POST `/api/recipes/sync-prices` and related CRUD endpoints

## 4) Performance Guidance
- Indexes: `InventoryEntry(tenantId,itemId,createdAt)`, `Item(tenantId,sku|name)`, `RecipeIngredient(tenantId,menuItemId)`
- **NEW Indexes** (2025-01-27): `InventoryEntry(orderId)`, `InventoryEntry(orderItemId)`, `InventoryEntry(orderId,orderItemId)` composite
- Use transactions for multi-operation stock adjustments

## 5) WebSocket Events (NEW - 2025-01-27)

### Real-time Stock Updates
- **Event**: `inventory:stock-updated`
- **Scope**: Tenant-scoped (broadcast to `tenant:${tenantId}`)
- **Payload**: See Ordering API documentation section 9
- **Triggers**: 
  - Order completion (recipe stock deduction)
  - Order cancellation (stock restoration)
  - Individual item preparation
  - Manual inventory adjustments
  - Purchase entries

### Recipe Cost Updates
- **Event**: `recipe:cost-updated`
- **Scope**: Tenant-scoped
- **Payload**: See Ordering API documentation section 9
- **Triggers**:
  - Inventory entry creation with new unitPrice (WAC change >1%)
  - Automatic recipe cost recalculation
  - Menu item profitability updates

---

## Appendix A — Deprecated/Legacy/Planned

- `GET /api/inventory/current` — Planned (derive via analytics or implement dedicated endpoint)
- `GET /api/inventory/report` — Planned (map to analytics routes)
- `GET /api/inventory/valuation` — Planned (use `/api/analytics/summary` for now)
- Scanner endpoints `/api/scanner/search/:barcode`, `/api/scanner/history` — Planned
- Generic `/api/items` and `/api/suppliers` endpoints — Planned unless added elsewhere

--- 