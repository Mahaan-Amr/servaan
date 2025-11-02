# Common Invariants and Conventions

Last updated: 2025-10-20

## Currency and Numbers
- Display currency as Toman (no decimals) across all UIs
- Convert Western digits to Farsi digits in user-facing text

## Dates and Calendars
- Display dates using Farsi calendar on UI
- Use Farsi digits for dates and times

## Orders
- Order number format: `ORD-YYYYMMDD-NNNN`
- Uniqueness: per tenant, generated inside a DB transaction with retry on collision
- Initial status: `SUBMITTED`, then `CONFIRMED → PREPARING → READY → SERVED/COMPLETED`

## Kitchen Display (KDS)
- Priority range: integer 0..5; validated on backend and enforced on frontend
- Status transitions validated (e.g., SUBMITTED→CONFIRMED/PREPARING)
- Completed/Cancelled/SERVED orders are excluded from active displays

## Inventory and Costing
- Cost basis: Weighted Average Cost (WAC)
- Stock invariant: Non‑negative for standard OUT; ADJUSTMENT allowed with reason
- Units: Define canonical unit per item; convert on input

## Tenanting and Security
- All APIs require JWT
- Tenant resolved by middleware (header optional depending on deployment)
- RBAC: ADMIN, MANAGER, STAFF; restrict sensitive mutations to ADMIN/MANAGER

## Observability
- Structure logs with: `tenantId`, `userId`, `requestId`, and domain identifiers (e.g., `orderId`, `kitchenDisplayId`)
- Prefer JSON logs in production; include correlation-id for cross-service tracing
