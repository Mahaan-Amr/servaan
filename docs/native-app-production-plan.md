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

## Production Desktop Release Sequencing

After the pilot-ready native POS/Inventory offline slice is smoke-tested, the next desktop milestone keeps the business workflow scope narrow and hardens the production shell around that proven slice.

This milestone includes installer, signing, updater, diagnostics/admin support visibility, printer hardware validation, security/backup review, and operational support readiness. It does not expand POS, Inventory, or other business workflows beyond the accepted V1 offline slice.

The first production desktop distribution channel is internal/pilot Windows distribution. Servaan will produce a signed installer and update path that can be handed to selected tenant devices, with rollback and support diagnostics available before any public/customer self-serve download flow is introduced.

Unsigned desktop builds are acceptable for early internal engineering tests. Production rollout and controlled tenant pilot installation require a signed Windows installer so the app has a verified publisher and does not present as an unknown executable.

Signed desktop installers may only be produced by one release owner and one backup through the controlled release process. Developer machines may produce unsigned internal builds, but the signing certificate must be stored securely and not copied casually across machines.

Controlled pilot releases use private release hosting, not public download pages. Signed installers and update artifacts may live in a private GitHub Release, private object storage bucket, or protected server path, and pilot devices check a signed update manifest from that private channel.

Pilot desktop updates use both automatic signed-update checks and support-assisted installation. The app may detect and report available updates, but pilot updates require an explicit operator/support-confirmed install step rather than silent background installation.

Rollback for the first production desktop release means returning to the previous app binary, not rolling back local SQLite data or sync schema. Local migrations must be forward-compatible for the pilot window, destructive migrations are blocked while Unsynced Operations exist, and an update that would make local data incompatible with the previous app version must wait for a later release policy.

The first admin support console is read-only observability. It shows tenant/device sync status, app version, last sync, failure reasons, sync batch IDs, and correlation with Redacted Diagnostic Exports. It does not provide remote retry, force-resolve, quarantine, recovery export, or other mutation actions until those actions have clear operational meaning and authorization rules.

Pilot support observability records are retained for 90 days and do not include raw operation payloads. Redacted Diagnostic Exports sent by operators are treated as support artifacts with the same retention window unless a specific case requires earlier deletion.

The first production desktop release requires real receipt printing on selected approved pilot printers. This is a production-shell requirement, not an expansion of the POS business workflow: receipt printing must work for the approved hardware list, while broad printer compatibility remains outside the first production release promise.

The first approved printer list contains one exact receipt printer model used by the pilot tenant. Servaan validates that model deeply before expanding to a small ESC/POS-compatible printer family after the first production desktop release.

Production desktop receipt printing allows offline/local receipts immediately after the local POS sale and payment are queued. Offline receipts must be clearly marked as pending sync, include local sale/payment numbers, and preserve a path to later verification or canonical backend numbering after synchronization.

The first production desktop release does not include a privileged recovery export with raw queue payloads. It relies on the operator-safe Redacted Diagnostic Export plus a documented manual recovery policy until encrypted raw recovery exports have explicit authorization, retention, and support-handling rules.

Production desktop release is blocked until one real pilot tenant completes a one-week end-to-end desktop run. The week must include daily POS/Inventory use, at least one offline/reconnect event, receipt printing on approved hardware, update checking, Redacted Diagnostic Export generation, and admin support-console correlation.

Production desktop release approval requires engineering, support, and business owner sign-off. Engineering signs off local storage, update, migration, and security behavior; support signs off diagnostics, observability, and recovery readiness; the business owner signs off pilot risk and tenant communication.

Broader operational workflows are explicitly blocked until after the one-week real-tenant production desktop pilot passes. Even small workflow additions create new receipt, sync, support, and offline edge cases, so the production desktop milestone stays focused on hardening the proven V1 offline slice.
