# ADR 0001: Local-First Offline Apps for Sales and Inventory

Date: 2026-06-09

## Status

Accepted

## Context

Servaan needs Ordering & Sales and Inventory Management to work completely offline on web/PWA, Windows, Android, and iOS. The current codebase has a partial ordering-specific offline implementation using IndexedDB, but Inventory is still online-first. The product also needs future packaged apps, not just a browser experience.

Treating desktop and mobile apps as simple wrappers around the current web app would leave offline behavior fragmented and unreliable. Each platform would risk implementing its own storage, sync, conflict, and auth behavior.

## Decision

Servaan will adopt a local-first architecture for the Sales and Inventory offline apps.

The system will introduce:

- a shared local-first sync engine
- device management
- offline auth for previously authenticated users
- encrypted local storage for packaged apps
- operation-ledger sync
- dedicated push/pull sync APIs
- conflict and deficit records
- manager-facing Conflict Center / Sync Issues workflow
- workspace-scoped sync profiles
- explicit local schema and sync protocol versioning
- V1 sync observability and support tooling
- V1 local-first testing strategy
- local backup/export policy for unsynced operations

Packaging will happen after the shared local-first layer is established:

1. Web/PWA remains available for web access.
2. Windows desktop comes first, preferably with Tauri.
3. Android follows using Capacitor.
4. iOS follows after Android unless priorities change.

The first implementation milestone will be built in the existing web/PWA app and will prove documentation updates, a shared local-first module, device registration, offline auth cache, local operation queue, push/pull sync skeleton, partial/resumable sync behavior, offline Inventory entry sync, offline Sales order/payment recording, offline recorded payments, offline receipt audit flags, temporary Persian offline numbers, a basic Sync Issues badge, and tests before creating packaged app shells. This scope is frozen for Milestone 1.

Milestone 1 is intended to be implemented as a focused autonomous run after the plan is documented. The current Ordering-specific IndexedDB offline services will stay working during transition, but the long-term core will be a new shared local-first module. Inventory offline should be built on the shared module first, then Sales/Ordering should migrate gradually, with compatibility for any existing IndexedDB offline orders.

After Milestone 1, Windows/Tauri is Milestone 2. The first desktop pass creates a Tauri shell and native bridge around the existing Next.js app, adds secure secret storage commands, adds a basic local receipt printing command, and keeps web/PWA behavior unchanged when Tauri is absent. Because the frontend currently uses Next.js standalone output, production desktop packaging still requires a deliberate choice between a local Next/Node sidecar, a desktop-compatible static export subset, or a reusable React shell. The recommended next production path is a local Next/Node sidecar because it preserves the existing UI and routing behavior with the least rewrite. Android/Capacitor follows Windows, and iOS follows Android unless business urgency changes. Releases use internal, pilot, and stable channels, with pilot rollout scoped by tenant/device.

The first self-contained desktop runtime slice will implement the bundled local Node sidecar while retaining the current browser-style offline cache layer. The desktop SQLite source-of-truth migration is a separate following slice so packaging/process lifecycle and local-storage migration can be verified independently.

The bundled sidecar hosts the Next.js standalone runtime only. The Express/PostgreSQL backend remains the canonical remote service. The sidecar uses a private dynamic loopback port and must answer a Servaan-specific health check before the desktop window opens. Startup accepts a compatible sidecar version range rather than an exact version match. The launcher owns sidecar health polling on a fixed interval with backoff after failures and pushes state to the frontend through a Tauri event channel. When there is no cached native session, the desktop shell opens directly into the native unlock/setup flow rather than the public web login. After unlock, the desktop restores the last workspace automatically even if the remote backend has not reconnected yet. If the sidecar fails to restart after launch, the desktop keeps the cached native shell running and surfaces a dismissible recovery banner in the top chrome near sync/status indicators; the banner returns if the next health check still fails rather than forcing a lockout. The normal workspace chrome stays in place while the sidecar is down, with the banner carrying the degraded-state message. Remote backend health is not a desktop startup dependency: the local Next.js runtime opens the native route, which uses cached device state for offline unlock and cached operational access when connectivity is unavailable.

The native shell must remain self-contained after restart, reopen the last workspace used on the device, and continue working from cached local read models even when the server is unavailable. Background sync should resume automatically on reconnect. The packaged desktop app should keep the existing HTTP route contract by talking to the bundled local service first.

Native apps are private operational shells, not marketing sites. They should not expose the public pages that belong to the web presence. After the first online login on a device, operational screens should continue working offline until the configured auth expiry or the next reconnect.

Native apps should use a native-first UI direction rather than feeling like a public web page in a wrapper. The accepted visual direction is Apple-inspired, minimal, professional, high-legibility, and fully supports light and dark mode.

## Consequences

Positive:

- Offline behavior is shared across platforms.
- Sales and Inventory can continue operating during network loss.
- Sync can be audited by device, actor, tenant, and operation.
- Inventory fits the model because stock already behaves like a ledger of entries.
- Packaged apps become packaging layers rather than separate products.

Negative:

- This is a significant architecture change.
- Sync, conflict resolution, and device management add product and engineering complexity.
- Existing REST endpoints remain useful but are not enough for offline correctness.
- The current ordering-only IndexedDB layer will need migration or replacement.

## Alternatives Considered

### Keep Current Web App and Add More IndexedDB Caches

This is simpler initially, but it does not solve packaged app storage, device identity, encryption, sync conflicts, or Inventory offline behavior.

### Build Separate Native Apps

This could provide strong platform integration, but it would duplicate business logic and sync behavior across web, Windows, Android, and iOS.

### Make Server APIs Retry-Friendly Only

Retry-friendly REST calls help unstable connections but do not support complete offline operation.

## Accepted Domain Rules

- Orders, payments, and inventory transactions are append-only operations.
- Stock can go negative temporarily and be flagged as a deficit after sync.
- Master data conflicts require manager resolution.
- Dangerous actions may sync as pending approval.
- Offline login requires prior online login on that device.
- Every offline operation records both device and actor.
- Offline payments are recorded evidence only, not bank/gateway confirmation.
- Offline payment records must remain distinguishable from gateway-confirmed payments.
- Offline receipts may print from a local printer path, but must be clearly marked and audited.
- Receipt printing is not required for V1 native POS acceptance. After a native sale is queued, the operator sees a Persian success state with local order/payment numbers and pending-sync status.
- Desktop startup reopens the last operational route used on that device.
- Existing Ordering & Sales and Inventory web routes may remain available for full online workspace workflows, but V1 offline business actions in packaged desktop use dedicated native operational surfaces instead of routing operators into wrapped web workspace pages.
- Packaged desktop must not expose the old web POS as a normal desktop sales path. Desktop sales navigation opens the native POS surface; attempts to reach the old web POS from the desktop shell should be blocked or redirected to the native POS unless an explicit development/support-only escape hatch is introduced.
- Native primary navigation exposes only main areas; deeper documented routes remain reachable within each workspace.
- After a successful online login, native apps silently refresh the local read models required for the V1 Offline Business Slice, without waiting for the user to open POS or Inventory screens.
- The V1 native cache seed includes only the data needed for offline POS order creation, offline cash/manual-card payment recording, offline inventory IN/OUT entries, and sync issue status. It excludes reports, analytics, suppliers, recipe editing, menu editing, payment gateway state, CRM data, and audit cycles.
- Routine operational writes queue normally while offline.
- Offline operations are operational evidence. Prices, quantities, selected items, and payment facts are frozen from the local read model at the time of offline recording; the backend validates, accepts, rejects, or conflicts them during sync, but does not silently recalculate or rewrite the recorded facts.
- V1 native POS uses cached item prices as recorded price snapshots. Discounts, tax overrides, service-charge edits, and custom price edits are outside V1.
- V1 native POS trusts cached menu availability while offline. Operators may sell items shown as available in the local read model; the UI shows the last-updated time and backend sync may later accept, reject, or flag conflicts.
- V1 offline payment recording allows only cash and manual card evidence. Gateway payments, online bank confirmation, offline refunds, and complex split-payment workflows are outside V1.
- V1 native POS records a completed sale as an order plus one full cash/manual-card payment in the same operator flow. Unpaid parked orders, partial payments, split payments, and payment-after-service workflows are outside the V1 native POS surface.
- V1 offline dine-in orders may optionally select a table from the cached table list, but table selection is not required to complete a sale. Table availability is only the last known state. Offline table locking, table transfer, reservations, merge/split table workflows, and complex table-state management remain online-only; conflicts are resolved during sync or manager review.
- V1 native POS supports only dine-in and takeaway order types. Delivery orders are outside V1 because they introduce address, courier, delivery-fee, and fulfillment-state concerns.
- V1 sync runs automatically after reconnect and after online login/unlock when pending operations exist, and it is also available through an explicit Sync Now action. Failed network attempts retry with backoff. Pending, failed, and conflicted operations remain visible and are never silently deleted.
- V1 Sync Issues UI shows failed operations with operation type, local number, time, reason, and retry action; conflicts are marked for manager review. Parent/child dependency blocks remain visible instead of being silently hidden. Operator-facing offline, sync, payment, and conflict messages are written in Persian.
- If the V1 native cache is missing, POS and Inventory offline work show a Persian empty state requiring an online sync before offline work can start. Stale cache remains usable with a visible last-updated warning. Online cache refresh failures keep the previous cache and surface a non-blocking warning. Cache age alone does not block V1 offline work; expired offline auth does.
- The shared local-first layer is canonical for V1 native offline behavior. Cached reads use local read models and queued writes use the shared sync operation queue. The older Ordering-specific offline storage remains temporary compatibility only; new offline capabilities are not added to it, and POS menu/table/settings cache migrates behind adapters into the shared local read model.
- V1 acceptance requires an end-to-end desktop smoke path: online login, silent cache seed, desktop restart without backend, PIN unlock, offline POS order creation, offline cash/manual-card payment recording, offline Inventory IN/OUT entry creation, visible Persian pending sync status, backend restart, sync completion or visible failure/conflict, persisted backend records with offline source metadata, and clean desktop restart.
- V1 testing must include comprehensive automated coverage around cache seeding, missing/stale cache states, local read-model reads, queued writes, dependency ordering, offline payment evidence, inventory IN/OUT entries, reconnect sync, failure/conflict visibility, and the desktop restart/offline-unlock smoke path where practical.
- Offline master data changes are stored as drafts and require review before becoming canonical.
- Offline Dangerous Actions are stored as Approval Requests and require an authorized manager decision.
- Local-first app upgrades must preserve unsynced operations.
- Destructive local schema migrations are blocked while unsynced operations exist.
- Apps that are too old for the server sync protocol may keep working offline within the offline auth expiry window, but cannot sync until upgraded.
- Online revoked devices immediately log out and cannot sync or create new offline work.
- Offline revoked devices can only continue until offline auth expiry, then are blocked.
- Revocation blocks sync and wipes tokens after next server contact, but local business data is not silently deleted without a separate quarantine or tenant wipe policy.
- V1 support tooling includes Sync Issues badge, per-device sync status, operation error reasons, admin sync failure view, sync batch IDs, structured backend logs, retry, and redacted diagnostic export.
- V1 tests cover local queue ordering, dependencies, retry, ID mapping, offline auth expiry, sync idempotency, accepted/rejected/conflicted operations, inventory deficits, sales offline payments, receipt audit flags, estimated stock, E2E offline-to-sync flow, and schema migration with pending operations.
- Existing Ordering offline services remain during migration, but Servaan should avoid maintaining two unrelated offline engines long-term.
- Packaged app rollout starts with Windows/Tauri after Milestone 1, then Android/Capacitor, then iOS; pilot releases are tenant/device-scoped.
- Unsynced operations are never auto-deleted. Diagnostic exports exclude raw sensitive payloads by default; privileged recovery exports may include encrypted raw queue payloads for manager/admin/support use.
- The first Windows/Tauri milestone provides the desktop shell and native bridge foundation, not a completed production installer.
- Production desktop packaging must resolve the current Next.js standalone-server output before tenant pilot distribution.
