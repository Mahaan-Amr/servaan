# Inventory Management – API Documentation (Refactored)

Last updated: 2025-10-20
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

### Inventory Analytics
- GET `/api/analytics/summary` — includes `totalInventoryValue` used by finance
- Additional routes (consumption-by-category, inventory-trends, monthly-movements) exist in `analyticsRoutes.ts`

### Recipes
- GET `/api/recipes/menu-item/:menuItemId`
- POST `/api/recipes/sync-prices` and related CRUD endpoints

## 4) Performance Guidance
- Indexes: `InventoryEntry(tenantId,itemId,createdAt)`, `Item(tenantId,sku|name)`, `RecipeIngredient(tenantId,menuItemId)`
- Use transactions for multi-operation stock adjustments

---

## Appendix A — Deprecated/Legacy/Planned

- `GET /api/inventory/current` — Planned (derive via analytics or implement dedicated endpoint)
- `GET /api/inventory/report` — Planned (map to analytics routes)
- `GET /api/inventory/valuation` — Planned (use `/api/analytics/summary` for now)
- Scanner endpoints `/api/scanner/search/:barcode`, `/api/scanner/history` — Planned
- Generic `/api/items` and `/api/suppliers` endpoints — Planned unless added elsewhere

--- 