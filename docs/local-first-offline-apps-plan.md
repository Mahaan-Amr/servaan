# Local-First Offline Apps Plan

Last updated: 2026-06-11

## Purpose

Servaan should support complete offline operation for the Ordering & Sales and Inventory Management workspaces across web/PWA, Windows, Android, and iOS. The accepted strategy is to build a shared local-first platform layer and a self-contained desktop shell that both use the same operational rules.

## Current Codebase Read

- The current frontend is Next.js and uses Express/Prisma/PostgreSQL on the backend.
- Ordering & Sales already has a narrow offline layer using IndexedDB:
  - src/frontend/services/offlineStorageService.ts
  - src/frontend/services/offlineApiService.ts
  - src/frontend/services/syncService.ts
  - src/frontend/services/connectionMonitorService.ts
- Inventory Management currently uses the central apiClient and does not have equivalent offline queue/cache support.
- The backend already models inventory as ledger-like InventoryEntry records, which fits local-first sync well.
- There is no current Tauri, Electron, Capacitor, React Native, or native app shell in the repo.

## Product Direction

Do not start by creating separate native products. Build the shared local-first platform layer and the packaged desktop shell against the same operational rules:

1. Windows desktop is the first packaged target.
2. Android follows after Windows sync is proven.
3. iOS follows after Android unless business urgency changes.
4. Web/PWA remains useful for web access, but the native shell is a self-contained operational client.

Recommended packaging stack:

- Windows: Tauri
- Android/iOS: Capacitor
- Shared UI: existing Next.js/React where feasible
- Shared offline core: TypeScript package used by all clients

## Packaging and Release Strategy

Packaged apps should start only after Milestone 1 proves the shared local-first behavior in the existing web/PWA app.

Milestone 2 should be Windows/Tauri first.

See docs/native-app-production-plan.md for the native production readiness plan and pilot definition.

Windows app initial scope:

- encrypted SQLite adapter
- secure token and device secret storage
- local printing path
- app update and version compatibility check
- existing HTTP routes served by a bundled local Node sidecar where feasible

### Milestone 2 Implementation Scope

Milestone 2 starts the Windows desktop app as a Tauri shell around the existing Next.js UI.

Native app shell rule:

- desktop and mobile apps do not show the public marketing pages
- native apps open into a private login/workspace shell
- once a user has logged in online on that device, operational screens must continue offline until expiry or reconnect
- native apps should use native-first UI surfaces rather than feeling like the public web app inside a window
- native app visual direction is Apple-inspired: minimal, calm, professional, strong spacing, high legibility, and first-class light/dark mode
- desktop uses a sidebar plus top sync/status bar
- mobile uses bottom-tab, task-first navigation
- when opened offline, native apps show offline unlock first, then jump directly to the last workspace/mode
- offline workspace access is based on the last successful online login snapshot: user profile, tenant, device setup, and workspace access are cached locally and trusted until offline auth expiry
- if no valid cached access snapshot exists, native apps must return to online login/setup rather than deriving workspace access from role alone
- native apps remember the last workspace and last mode per device automatically
- sync and offline state should stay quiet unless there is a problem, then become clearly visible
- Sync Issues should only appear when there are problems, but remain accessible from Settings
- native desktop and mobile should share one design system but use platform-specific layouts
- native apps include a separate Settings area for device, offline auth, sync, printing, diagnostics, and app version
- Settings exposes local logout and wipe-this-device actions; tenant device revocation remains admin-only
- printing setup is device-profile based: POS/shared cashier devices require or strongly prompt setup during onboarding; Inventory/manager devices can configure it later in Settings
- native apps include a dedicated Support screen inside Settings
- Support includes diagnostic export with sync status and device info, excluding sensitive payloads by default
- first-time device setup is short and role/device-profile based: online login, confirm tenant/device profile, cache required offline data, set PIN/biometric, printer setup for POS devices, then open assigned workspace/mode
- native loading uses an Apple-minimal Servaan logo treatment
- user actions should give immediate visual feedback, such as pressed state, subtle progress, or disabled pending state
- startup/loading step text appears only when work takes longer than about 2 seconds
- action/loading feedback should usually be an in-context blurred overlay, not a full-screen route change
- the Servaan logo itself should carry the loading motion and play only until the operation finishes
- all roles use the same native shell with role-based defaults, permissions, and starting workspace
- native workflows prioritize speed of repeated operations over instructional copy; labels stay clear but help text stays out of the main path
- mobile uses one Servaan app; role and device profile decide which tabs/workspaces appear
- native design system supports both light mode and dark mode from day one
- desktop defaults toward the manager console when the user's role allows it
- mobile defaults toward the device's assigned staff workspace/profile
- desktop reuses the documented operational routes inside the shell instead of duplicating them
- desktop restarts offline from local read models and does not require a manually started server
- the first desktop local read-model slice is operational, not analytic: Sales and Inventory must keep repeat work usable offline, while BI dashboards, accounting reports, CRM analytics, long historical reports, full audit history, and admin configuration screens remain online-first
- sync runs automatically in the background after reconnect

Accepted Milestone 2 scope for the first desktop pass:

- create a src/desktop Tauri application
- run the existing frontend/backend during desktop development
- add a frontend desktop bridge for native-only capabilities
- add native commands for app version, OS secure secret storage, and local text receipt printing
- keep browser/PWA behavior working when Tauri is not present
- document the production packaging gap caused by the current Next.js standalone server output
- keep the existing HTTP contract and route the packaged app through a bundled local service first
- make the bundled local Node sidecar the production desktop runtime path
- use a private dynamic loopback port for the packaged sidecar and verify a Servaan-specific health response before window open
- package only the Next.js standalone runtime in the sidecar; keep Express/PostgreSQL canonical and remote
- keep web/PWA IndexedDB behavior while routing packaged desktop local-first, ordering offline, sync queue, and native setup/session state through encrypted SQLite
- do not block desktop startup on remote backend health; enter offline unlock and cached native shell immediately when unavailable
- accept a compatible sidecar version range so patch releases do not block startup
- if the packaged sidecar crashes after startup, keep the cached shell usable and surface a recovery banner rather than forcing a full app lockout
- place the recovery banner in the top desktop chrome near the existing sync/status area
- make the recovery banner dismissible, but let it return if the next health check still reports the runtime is down
- keep launcher health polling on a fixed interval with backoff after failures
- push sidecar health and restart state into the frontend through a Tauri event channel
- open the desktop shell directly into the native unlock/setup flow when there is no cached native session
- restore the last workspace automatically after unlock, even before remote reconnect
- keep the normal workspace chrome when the sidecar is down and rely on the recovery banner alone

Explicitly out of the first desktop pass:

- Android/Capacitor shell
- iOS shell
- replacing every remaining browser token/session read with an async native secure-token path
- production installer signing/update infrastructure
- printer hardware discovery and mobile Bluetooth/network printer support
- replacing the synchronous browser token path with fully async native secure-token retrieval
- replacing the entire frontend with a direct IPC-first rewrite

The current Next.js app uses output: standalone, not static export. That means a production desktop build cannot simply point at a static out/ folder without additional work. Servaan must choose one of these production packaging paths before pilot distribution:

- bundle a local Next/Node sidecar and load it from Tauri
- create a desktop-compatible static export subset
- split the app into a reusable React shell that Tauri can host directly

For the desktop milestone, the recommended next production path is a local Next/Node sidecar because it preserves the existing app behavior with the least UI rewrite. Static export should only be chosen if the offline Sales and Inventory surfaces can be proven to work without server-rendered routes.

### Milestone 2 Implementation Record

Implemented foundation:

- src/desktop Tauri project for the Windows desktop shell
- root desktop:dev, desktop:build, and desktop:check scripts
- root desktop:bundle script for installer generation
- Tauri dev shell that starts the existing main frontend/backend stack
- native command contract for:
  - get_app_version
  - store_secret
  - get_secret
  - delete_secret
  - print_receipt_text
- OS credential storage through the native desktop command layer
- local Windows text receipt printing through a printer path/name command
- frontend desktopBridgeService that safely no-ops in web/PWA and invokes Tauri commands in packaged desktop
- POS silent-print path that tries native desktop text receipt printing before QZ/canvas fallback
- executable-only desktop build output at src/desktop/src-tauri/target/release/servaan-desktop.exe
- release desktop launcher that now starts the bundled local Node sidecar on a private dynamic loopback port, probes `/api/health`, emits runtime status over a Tauri event channel, and opens the native shell against the sidecar URL
- encrypted SQLite desktop store initialized under the Tauri app data directory, with the encryption key stored in OS credential storage
- desktop bridge commands for SQLite set/get/list/delete/clear operations
- local-first operations, entity mappings, sync cursors, offline auth cache, and device metadata routed to SQLite in packaged desktop
- Ordering & Sales offline orders, payments, menu/table/settings cache, and sync queue routed to SQLite in packaged desktop
- native setup, last workspace/mode, offline session, and native-active flag hydrated from SQLite in the native shell
- focused Rust unit test pinning the emitted sidecar status event payload contract

Known Milestone 2 limitations to harden next:

- receipt printing is a basic text-print command and does not discover printers
- auth still keeps the current browser-compatible token path while mirroring secrets into native secure storage where desktop is available
- auto-update, code signing, and installer release channels are not configured yet
- the current release exe is still a launcher-style desktop shell, not a self-contained distributed installer
- the launcher recovery banner, dynamic-port startup, one restart attempt, and encrypted SQLite persistence still need real-device smoke coverage in the packaged app shell

The next Milestone 2 slice shifts from implementation to hardening: exercise the packaged launcher on a real Windows device, verify recovery banner dismissal/reappearance behavior, confirm SQLite-backed state survives restart/offline unlock, and then prepare installer/signing/update work.

### Next Local Read-Model Slice

The next desktop slice should add local read models for the operational Sales and Inventory paths.

Read behavior:

- Sales and Inventory screens read local-first from SQLite when packaged desktop is available.
- Screens render immediately from cached data if it exists.
- Backend refresh runs in parallel.
- Successful refresh updates SQLite and then refreshes the UI.
- Failed refresh keeps the cached UI usable and surfaces only quiet degraded/offline status.
- Mutations create local operations first, then sync to the canonical backend.

Offline mutation boundary:

- Sales allows local order draft creation and updates, adding/removing/changing order items, cash/manual-card offline payment recording, and receipt-printed audit flags.
- Inventory allows stock movement entries only, such as stock-in, stock-out, adjustment, and waste/loss when represented as inventory ledger entries.
- Deleting canonical orders/items, refunds, payment-gateway actions, table reservations or cross-device table ownership changes, item/supplier/master-data edits, admin/settings mutations, and destructive inventory corrections remain online-only for this slice.

Conflict policy:

- Sales local drafts and orders sync automatically when they do not collide with canonical backend state.
- Inventory entries sync append-only when they are valid.
- Backend rejections caused by permissions, stale item/table state, deleted items, closed orders, stock policy, or schema/version mismatch are marked failed or conflicted and surfaced through Sync Issues.
- Sales and Inventory do not get a full conflict-resolution UI in this slice.
- Workspaces remain usable from cache while Sync Issues carries failed and conflicted operations.

Hydration policy:

- After successful online login/setup, native apps hydrate the allowed operational read models for the user's tenant and device profile.
- Sales and Inventory also hydrate lazily when entering the workspace if the relevant cache is missing or stale.
- Once a usable cache exists, hydration is non-blocking and refreshes the UI after SQLite is updated.
- POS/shared devices may show a short required preparing-offline-data step during setup because Sales needs menu, tables, and ordering settings to be useful offline.
- Manager/inventory devices may enter faster and hydrate Inventory in the background unless the cache is empty and Inventory is opened immediately.

Offline auth expiry:

- If offline auth expires while a user is already inside Sales or Inventory, the app does not blank the workspace or hard-kick the user mid-operation.
- New offline mutations are blocked after expiry.
- Cached screens remain visible for read-only use, including viewing and printing existing local state.
- Creating orders, taking payments, and creating inventory entries require online re-auth after expiry.
- A clear but calm banner asks the user to reconnect to continue.
- Pending local operations created before expiry remain queued and sync normally when the backend is available.

Implementation order:

1. Fix the current blank/loading trap by adding backend request timeouts where needed, making workspace access fail into a known degraded/offline state, and stopping role-only access fallback in desktop when there is no valid cached snapshot. Implemented for the shared API/client and workspace access path.
2. Implement the trusted online login snapshot by caching user profile, tenant, device setup, workspace access, and offlineAuthExpiresAt, then reading that snapshot during desktop/offline startup. Implemented for desktop workspace access.
3. Add Sales read-model hydration and local-first loading. Partially implemented through the existing ordering cache; POS still needs true cache-first rendering before backend refresh instead of waiting for request timeout.
4. Add Inventory read-model hydration and local-first loading. Partially implemented through SQLite read-model caches and Inventory page refresh events; setup-time hydration and empty-cache UX still need hardening.
5. Add offline mutation guards and queue wiring for the accepted mutation boundary. Partially implemented for desktop queue guards and Inventory entry fallback; Sales order/payment/receipt guard coverage still needs packaged smoke validation.
6. Add focused tests and packaged smoke verification. Focused launcher/local-first tests pass; the next validation step is real packaged-app smoke on Windows using an online seed, offline restart, and workspace operation flow.

Next implementation slice:

1. Run the packaged Windows smoke path with the backend online once, seed login/setup/workspace data, then restart with the backend unavailable.
2. Fix any smoke findings that block offline unlock, cached workspace access, recovery banner behavior, or encrypted SQLite persistence.
3. Make POS render Sales cached menu, tables, settings, drafts, and open orders immediately from SQLite before backend refresh.
4. Add setup-time and lazy hydration for Sales and Inventory local read models.
5. Harden Sync Issues for failed/conflicted Sales and Inventory operations without adding full conflict resolution inside those workspaces.
6. Add tests around cache-first rendering, offline auth expiry read-only behavior, and sync failure classification.

Accepted sequencing: packaged smoke comes before more POS/Sales local-first implementation. The runtime foundation must be exercised in the real packaged Windows app first, then POS/Sales cache-first behavior should be fixed using evidence from that smoke run.

Packaged smoke pass/fail checklist:

- The packaged app starts without manually running the frontend server.
- With the backend online, login/setup succeeds and caches the trusted online login snapshot.
- Sales and Inventory can be opened once online to seed the operational cache.
- After the backend is stopped, the packaged app reopens to offline unlock and the native shell.
- Workspace access comes from the cached login snapshot, not role-only fallback.
- Inventory shows cached data or a clear empty-cache/offline state, not infinite loading.
- POS/Sales shows cached data or exposes the current timeout/fallback gap clearly enough to drive the next implementation fix.
- Sidecar health and recovery behavior still works: dynamic port, `/api/health`, one restart attempt, and recovery banner on failure.
- The app never lands in a blank screen or unrecoverable login loop during the smoke path.

Sales local read model:

- menu categories and items
- tables
- active/open local orders
- order drafts
- offline payments
- ordering settings

Inventory local read model:

- items
- current stock summary
- suppliers
- recent inventory entries
- low-stock summary

Out of this slice:

- BI dashboards
- accounting reports
- CRM analytics
- long historical reports
- full audit history
- admin configuration screens

Android/Capacitor should follow after Windows is stable. iOS should follow Android unless business urgency changes.

Release channels:

- internal
- pilot
- stable

Pilot releases should be scoped to selected tenants and devices, not enabled for everyone at once.

## First Implementation Milestone

Milestone 1 should prove the local-first architecture inside the existing web/PWA app before creating packaged Windows, Android, or iOS shells.

Milestone 1 scope is frozen. New offline capabilities, packaged app shells, and expanded conflict workflows should be treated as later milestones unless they are required to complete the accepted scope below.

Accepted Milestone 1 scope:

- documentation updated before implementation
- shared local-first module
- device registration model
- offline auth cache for previously authenticated users
- shared local operation queue
- sync push/pull API skeleton
- partial and resumable sync behavior
- offline Inventory entry creation and sync
- offline Sales order creation
- offline recorded payment support
- offline receipt audit flag support
- temporary Persian offline numbers
- Sync Issues badge with a basic failed/conflicted queue
- tests for queue behavior, auth expiry, sync idempotency, inventory deficits, sales payment/receipt flags, and migration safety

Explicitly out of Milestone 1:

- Windows/Tauri shell
- Android/Capacitor shell
- iOS shell
- full Conflict Center workflow
- printer hardware automation
- real gateway payments while offline

This milestone intentionally delays Tauri and Capacitor packaging until the shared local-first sync behavior is proven. Windows/Tauri should be the first packaged app after Milestone 1 because encrypted SQLite and local printing are strong desktop needs.

When implementation starts, Milestone 1 should be handled as a focused autonomous implementation run: update docs first, implement the shared local-first foundation, verify with tests, and stop only for real blockers or decisions outside this plan.

### Milestone 1 Implementation Record

Implemented foundation:

- shared local-first TypeScript contracts and queue helpers under src/shared/localFirst
- Persian temporary offline number helpers
- Prisma models and migration for offline devices, sync operations, sync conflicts, and offline audit fields on orders/payments/inventory entries
- POST /api/sync/devices/register
- POST /api/sync/push
- GET /api/sync/pull
- GET /api/sync/issues
- backend sync processor for:
  - inventory.entry.create
  - sales.order.create
  - sales.payment.record_offline
  - sales.receipt.mark_printed_offline
  - master_data.upsert_draft as manager-review conflict
- idempotency via tenantId + deviceId + localOperationId
- basic rejected/conflicted operation recording
- frontend IndexedDB local-first store for operations, mappings, cursors, offline auth cache, and device metadata
- non-blocking offline auth cache after successful online login
- non-blocking device registration after successful online login
- offline queue fallback for Inventory entry creation when browser is offline
- offline queue fallback for Sales order creation when browser is offline
- offline recorded payment queue for cash/manual card while browser is offline
- POS offline immediate payment recording for local offline orders
- offline receipt audit flag queued from POS receipt print completion/success paths
- navbar Sync Issues badge with manual sync retry and online auto-sync attempt
- targeted tests for queue dependency behavior, entity mapping, issue summary, Persian offline numbers, and offline auth expiry
