# Common Invariants and Conventions

Last updated: 2026-06-11

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
- Stock invariant: Non-negative for standard OUT; ADJUSTMENT allowed with reason
- Units: Define canonical unit per item; convert on input

## Offline and Sync
- Offline-capable clients record business mutations as local operations before sync
- Orders, payments, and inventory transactions are append-only operations
- Sync must be idempotent by deviceId + localOperationId
- Offline stock UI distinguishes confirmed server stock from estimated local stock
- Stock may go negative after offline sync; server records this as a deficit for reconciliation
- Master-data conflicts require manager resolution instead of silent overwrite
- Dangerous actions such as delete, refund, void, and backdated adjustment require authorization and may sync as pending approval
- Offline user-facing numbers are temporary; server assigns canonical numbers after sync
- Offline conflicts and sync failures are resolved through a manager-facing Conflict Center / Sync Issues workflow
- Offline payments are locally recorded evidence only; bank/gateway confirmation requires online connectivity
- Offline recorded payments must be distinguishable from gateway-confirmed payments, for example with OFFLINE_RECORDED
- Offline receipts must be clearly marked, use the temporary offline number, include device and actor identity, and set an audit flag such as printedOffline
- Local schema and sync protocol versions must be explicit
- Destructive local migrations must not run while unsynced operations exist
- Clients that are too old for the current sync protocol may continue offline only within their auth expiry window and must upgrade before syncing
- Revoked devices cannot sync
- Online revoked devices must log out and block new offline work immediately
- Offline revoked devices can only continue until offline auth expiry
- Revocation must not silently delete unsynced business data unless a stricter tenant wipe/quarantine policy explicitly applies
- Desktop offline startup must restore the last workspace from local cached read models without requiring a running server
- Background sync should start automatically after reconnect and surface only failures, conflicts, and approvals

## Tenanting and Security
- All APIs require JWT
- Tenant resolved by middleware (header optional depending on deployment)
- RBAC: ADMIN, MANAGER, STAFF; restrict sensitive mutations to ADMIN/MANAGER
- Offline login is allowed only for users previously authenticated online on the device, within an offline auth expiry window
- Every offline operation records both deviceId and actorUserId

## Observability
- Structure logs with: `tenantId`, `userId`, `requestId`, and domain identifiers (e.g., `orderId`, `kitchenDisplayId`)
- Prefer JSON logs in production; include correlation-id for cross-service tracing
- Sync logs must include tenantId, deviceId, actorUserId, localOperationId, and sync batch ID where available
- Sync diagnostics must avoid exporting raw sensitive payloads by default
- Unsynced local operations must never be auto-deleted
- Recovery exports containing raw queue payloads must be encrypted and privileged

## Testing
- Local-first tests must cover operation queue ordering, dependency waits, retry, ID mapping, idempotent sync, offline auth expiry, accepted/rejected/conflicted operations, inventory deficits, offline payment evidence, receipt audit flags, and migrations with pending local operations
