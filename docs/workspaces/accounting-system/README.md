# ✅ Accounting Workspace — Synced Snapshot (2025-10-20)

Authoritative links
- Capabilities: `../../capabilities_matrix.md`
- Shared rules: `../../common_invariants.md`

Key updates
- Chart of Accounts codes are now unique per-tenant: `@@unique([tenantId, accountCode])`
- API `/api/accounting/accounts/count` now filters by tenant: `{ tenantId, isActive: true }`
- All COA service/controller queries enforce `tenantId`

Implemented endpoints
- GET `/api/accounting/summary`
- GET `/api/accounting/accounts/count`
- GET `/api/accounting/journal-entries/monthly/count`
- GET `/api/accounting/balance/today`
- GET `/api/accounting/chart-of-accounts/validate` (reports missing required accounts by code)
- COA CRUD and hierarchy endpoints (tenant-scoped)
- Journal entries CRUD/post/reverse (tenant-scoped)
- Financial statements generators (subject to data availability)

Notes
- Frontend dashboard reads the above endpoints; values are real data from Prisma.
- COA validation lists required codes: 1101, 1102, 1103, 1104, 4101, 5100, 2102.
- For any 404s, verify auth and `X-Tenant-Subdomain` headers on frontend calls.

---

Recent changes (kept in sync)
- Auto-journals: Order completion/refund now generate and POST journal entries via `OrderAccountingIntegrationService` → `JournalEntryService.postJournalEntry`.
- Financial statements: Balance Sheet and Income Statement aggregate from `JournalEntryLine` (tenant-scoped); Cash Flow uses net income + basic adjustments.
- Journal listing: Server-side pagination enforced; tenant filter applied in service and controller.
- Tenant bootstrap: COA auto-seeded on tenant creation if missing; idempotent and non-fatal on failure.
