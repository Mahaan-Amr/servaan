# Ordering Workspace — Current Status (2025-10-20)

- Authoritative API spec: `./api-specification.md`
- Database notes: `./database-schema.md`
- Common invariants: `../../common_invariants.md`
- Capability overview: `../../capabilities_matrix.md`

Highlights
- KDS routes live under `/kitchen/displays/*` with status transitions and priority 0..5
- Ordering analytics: `/analytics/*` + CSV/JSON exports
- Order numbers: `ORD-YYYYMMDD-NNNN`, per-tenant unique, transaction-safe
- UI conventions: Toman (no decimals), Farsi dates/digits 