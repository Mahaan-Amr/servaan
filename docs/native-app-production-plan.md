# Native App Production Plan

Last updated: 2026-06-11

## Purpose

Servaan desktop and mobile apps should feel like native operational apps, not the public web site inside a wrapper.

The native app product is private: it starts at login or offline unlock, opens the user's assigned operational workspace, and hides public marketing pages.

## Native Product Principles

- Native apps are for repeat operations, not product education.
- Public pages are web-only.
- Native apps use one shared design system and platform-specific layouts.
- Desktop uses a sidebar plus quiet top chrome.
- Mobile uses bottom-tab, task-first navigation.
- Light mode and dark mode ship together.
- Loading feedback stays in context and blurs the current screen.
- The Servaan logo carries the loading motion.
- Step text appears only when work takes longer than about 2 seconds.
- Sync/offline state stays quiet unless there is a problem.
- Sync Issues appears only when there are failed syncs, conflicts, or approvals; it remains available from Settings.
- Desktop preserves the same documented HTTP routes inside a bundled local Node service for now, so the native shell can stay self-contained without a frontend rewrite.

## Current Desktop Implementation Slice

The first self-contained desktop slice is implemented and build-verified as of 2026-06-11.

Implemented behavior:

- bundled local Node sidecar instead of the release-mode repository/dev-server launcher
- private dynamic loopback port instead of a fixed public-development port
- bundled Next.js standalone runtime only; the canonical Express/PostgreSQL backend remains remote
- preserved HTTP routes through the bundled sidecar
- added an encrypted SQLite desktop local store for local-first queues, ordering offline cache, sync queue state, and native setup/session state
- opened immediately into offline unlock and the cached native shell when the remote backend is unavailable
- verified a Servaan-specific local health response before showing the desktop window
- accepted a compatible sidecar version range instead of an exact version match
- restarted the sidecar once on failure, then kept the cached native shell running if it still failed
- surfaced a dismissible recovery banner in the top desktop chrome near sync/status indicators
- kept launcher health polling on a fixed interval with backoff after failures
- pushed sidecar health and restart state to the frontend through a Tauri event channel
- opened the desktop shell directly into the native unlock/setup flow when there is no cached native session
- restored the last workspace automatically after unlock, even before remote reconnect
- kept the normal workspace chrome when the sidecar is down and relied on the recovery banner alone

Verified on 2026-06-11:

- `npm run desktop:check`
- `npm run desktop:build`
- `cargo test` for the sidecar status event payload contract
- `cargo check --release`

The remaining desktop validation is now real-device smoke coverage of the packaged shell, especially dynamic-port startup, `/api/health`, one restart attempt, encrypted local state persistence, and recovery banner behavior.

## First-Time Device Setup

The first-time native setup flow is short and device-profile based:

1. Online login.
2. Confirm tenant and device profile.
3. Cache required offline data for the tenant and device profile.
4. Set PIN or biometric unlock where available.
5. Configure printer when the device profile is POS/shared cashier.
6. Open the assigned workspace/mode.

POS/shared devices may require a short preparing-offline-data step during setup so menu, tables, and ordering settings are available before offline Sales use. Manager and inventory devices may hydrate operational caches in the background unless the user opens an empty Inventory cache immediately.

## Offline Startup

If the app opens while offline:

1. Show offline unlock first.
2. Validate cached user and offline auth expiry.
3. Trust the last successful online login snapshot for user profile, tenant, device setup, and workspace access.
4. Unlock with PIN/biometric.
5. Jump directly to the last workspace/mode for that device.

Remote backend health is not a startup gate. The packaged Next.js sidecar must start locally, then the native shell decides between online login and offline unlock from device state.

If the app restarts while offline, it must still reopen from cached local read models and keep working without a manually running server.

New users, uncached tenants, expired offline auth, password resets, and server-side permission changes require internet. The desktop app must not invent workspace access from role alone when no valid cached access snapshot exists.

If offline auth expires while a user is already in an operational workspace, the native app keeps cached screens visible for read-only use but blocks new offline mutations until online re-auth. Pending local operations created before expiry remain queued for normal sync.

## Native Navigation

Desktop:

- left sidebar
- quiet top status area
- manager console default for manager/admin roles
- Sales and Inventory operational modes
- Settings and Support

Mobile:

- bottom tabs
- device-profile filtered tabs
- staff task defaults
- same shared design tokens as desktop

## Native Settings

Settings includes:

- device profile
- cached users/offline unlock
- sync status
- printing
- diagnostics
- support
- app version
- local logout
- wipe-this-device

Tenant-level device revocation remains admin-only.

## Support

The native Support screen includes:

- device name/profile
- app version
- tenant identity
- last sync time
- pending/failed/conflicted operation counts
- diagnostic export excluding sensitive payloads by default

Privileged recovery exports may include encrypted raw queue payloads later, but not by default.

## Production-Ready Pilot Definition

The first production pilot is ready when:

- native desktop starts without public pages
- first-time setup works
- offline unlock works after first online login
- Sales and Inventory operational screens can read cached data offline
- cached offline reads cover the operational pilot surface only: Sales menu/tables/open orders/drafts/payments/settings and Inventory items/stock summary/suppliers/recent entries/low-stock summary
- offline operations queue reliably
- sync push/pull handles retry, dependency wait, conflicts, and canonical ID mapping
- Sync Issues appears only when needed
- POS printer setup works for selected pilot printers
- diagnostic export exists
- local storage for packaged apps uses encrypted SQLite
- desktop package has installer, signing, and update strategy
- desktop offline startup does not depend on a manually launched dev server
- the packaged desktop path has been exercised end to end on the runtime slice, including dynamic-port launch and recovery banner behavior
- one tenant validates the flow on real devices before broad rollout

## External Requirements Not Solved By Code Alone

- code-signing certificates
- app-store developer accounts
- production updater hosting
- real printer hardware validation
- pilot tenant acceptance testing
- security review and backup policy approval
