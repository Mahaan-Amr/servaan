# Capabilities Matrix (Authoritative)

Last updated: 2025-10-20

Legend: ✅ Implemented · ◐ Partial · ⭕ Planned

| Workspace / Module | API | Frontend | Notes |
|---|---|---|---|
| Ordering & Sales | ✅ Orders CRUD, status, KDS, payments, analytics | ✅ Dashboard, Orders, POS Edit, Kitchen, Analytics | KDS uses `/kitchen/displays/*`; order numbers `ORD-YYYYMMDD-NNNN`; currency/date invariants |
| Inventory Mgmt | ✅ Inventory integrations (low-stock-alerts, validate-order-stock, update menu/recipe costs) | ✅ Items/Suppliers UI, Inventory add/remove/transactions/reports, Scanner UI | Valuation via `/api/analytics/summary`; items/suppliers/scanner REST endpoints ⭕ |
| Business Intelligence | ✅ Ordering analytics `/analytics/*`, table analytics `/tables/analytics/*` | ✅ BI pages (ABC, profit, trends, custom reports UI) | Dedicated ABC/profit endpoints ⭕ (pages may derive from sales-summary + costs) |
| Accounting System | ◐ Profitability/COGS endpoints | ◐ Dashboard pages | Full COA/journals/statements APIs ⭕ |
| CRM | ◐ Customer analytics via ordering | ◐ Pages and placeholders | Segments/campaigns endpoints ⭕ |

Cross-cutting
- Auth/Tenanting: ✅ JWT + tenant middleware
- Realtime: ✅ Socket.IO with tenant-scoped events
- Exports: ✅ CSV/JSON for analytics
- Invariants: see `docs/common_invariants.md`

Indexing (recommendations)
- Orders: `(tenantId, orderDate)`, `(tenantId, status)`
- OrderItems: `(tenantId, menuItemId, orderDate)`
- KDS: `(tenantId, status)`
- InventoryEntry: `(tenantId, itemId, createdAt)`
- RecipeIngredient: `(tenantId, menuItemId)`
