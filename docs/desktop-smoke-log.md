# Desktop Smoke Log

This log records packaged Windows desktop smoke runs. Use it to keep the runtime evidence concrete before continuing POS/Sales cache-first implementation.

Manual/technical split: the tester runs the visual packaged-app steps on the Windows desktop, while Codex guides the sequence, inspects logs/local files, and patches issues after each observed failure.

Build rule: every smoke run starts with a fresh `npm run desktop:build:local` build, then tests `src/desktop/src-tauri/target/release/servaan-desktop.exe`. Do not reuse an older executable for pass/fail evidence.

State rule: preserve existing desktop local state for the first smoke run to test realistic upgrade/restart behavior. If the run behaves strangely, follow with a second clean-state smoke run.

## Smoke Pass/Fail Checklist

A packaged smoke run passes only if all of these are true:

- The packaged app starts without manually running the frontend server.
- With the backend online, login/setup succeeds and caches the trusted online login snapshot.
- Sales and Inventory can be opened once online to seed the operational cache.
- After the backend is stopped, the packaged app reopens to offline unlock and the native shell.
- Workspace access comes from the cached login snapshot, not role-only fallback.
- Inventory shows cached data or a clear empty-cache/offline state, not infinite loading.
- POS/Sales shows cached data or exposes the current timeout/fallback gap clearly enough to drive the next implementation fix. The known timeout fallback is a warning, not a blocker, unless it causes a blank screen or traps the user.
- Sidecar health and recovery behavior still works: dynamic port, `/api/health`, one restart attempt, and recovery banner on failure.
- The app never lands in a blank screen or unrecoverable login loop during the smoke path.

## Run Template

### YYYY-MM-DD - Packaged Windows Smoke

Build command:

```powershell
npm run desktop:build:local
```

Packaged executable:

```text
src/desktop/src-tauri/target/release/servaan-desktop.exe
```

Environment:

- OS:
- Backend state during seed:
- Backend state during offline restart:
- Tester:
- Codex role: guide smoke steps, inspect logs/local files, patch failures

Checklist:

- [ ] Packaged app starts without manually running the frontend server.
- [ ] Online login/setup succeeds and caches snapshot.
- [x] Sales opens online to seed cache.
- [ ] Inventory opens online to seed cache. Initial attempt reached the Inventory dashboard but left dashboard panels in a repeating skeleton state; fix built and relaunched for retest.
- [ ] App reopens after backend stop.
- [ ] Offline unlock/native shell appears. First offline restart skipped the PIN gate and opened the web workspace catalog; second retest stayed in native frame but still skipped PIN and opened Sales.
- [ ] Workspace access comes from cached snapshot. Cached access existed, but it bypassed the required native unlock gate.
- [ ] Inventory avoids infinite loading.
- [ ] POS/Sales avoids blank/unrecoverable state or clearly exposes timeout/fallback gap. Known timeout fallback warning recorded if present.
- [ ] Dynamic port and `/api/health` work.
- [ ] One restart attempt/recovery banner behavior works.
- [ ] No blank screen or unrecoverable login loop.

Observed issues:

- 

Next fix:

- 

Result:

- Pass/Fail:

## 2026-06-12 - Packaged Windows Smoke

Build command:

```powershell
npm run desktop:build:local
```

Packaged executable:

```text
src/desktop/src-tauri/target/release/servaan-desktop.exe
```

Environment:

- OS: Windows
- Backend state during seed: running on `localhost:3001`
- Backend state during offline restart: stopped
- Tester: Mahan
- Codex role: guide smoke steps, inspect logs/local files, patch failures

Checklist:

- [x] Packaged app starts without manually running the frontend server.
- [x] Online login/setup succeeds and caches snapshot.
- [x] Sales opens online to seed cache. UI still needs dedicated desktop/POS work.
- [x] Inventory opens online to seed cache. UI still needs dedicated desktop/inventory work.
- [x] App reopens after backend stop.
- [ ] Offline unlock/native shell appears.
- [ ] Workspace access comes from cached snapshot.
- [ ] Inventory avoids infinite loading. Not testable because offline restart returned to login/setup.
- [ ] POS/Sales avoids blank/unrecoverable state or clearly exposes timeout/fallback gap. Not testable because offline restart returned to login/setup.
- [x] Dynamic port and `/api/health` work sufficiently for packaged startup.
- [ ] One restart attempt/recovery banner behavior works. Not observed in this run.
- [ ] No blank screen or unrecoverable login loop.

Observed issues:

- After closing the app and stopping the backend, reopening the packaged executable returned to online login/setup instead of offline unlock/native shell.
- Login then failed because the backend was stopped.
- This blocked Inventory Offline, Sales/POS Offline, and full Runtime Recovery testing.
- Screenshot showed device setup with `setupComplete` effectively missing/stale during offline restart.

Next fix:

- Make critical desktop native setup/session persistence awaitable instead of fire-and-forget.
- Patch the trusted online login snapshot with completed device setup.
- During native startup, recover stale/missing setup/session from the trusted online login snapshot when it is still within `offlineAuthExpiresAt`.
- Harden desktop bridge serialization so optional `undefined` fields cannot break Tauri SQLite writes.
- Surface native setup persistence errors in the setup screen instead of silently staying on setup forever.
- Require a non-empty PIN during native setup because offline unlock depends on it.

Result:

- Pass/Fail: Fail, blocked at offline restart.

Follow-up finding:

- Online login succeeded, but the app repeatedly stayed on device setup. This was caused by fragile native setup persistence: optional frontend fields could cross the Tauri invoke boundary as `undefined`, and setup submit had no visible error state when persistence failed.

## 2026-06-16 - Packaged Windows Smoke

Build command:

```powershell
npm run desktop:build:local
```

Packaged executable:

```text
src/desktop/src-tauri/target/release/servaan-desktop.exe
```

Environment:

- OS: Windows
- Backend state during seed: initially unavailable on `localhost:3001`, then restarted and verified healthy
- Backend state during offline restart: not reached
- Tester: Mahan, with screenshots supplied for login state
- Codex role: fresh build, runtime/process verification, backend health/log inspection, ACL fix, smoke log update

Checklist:

- [x] Fresh packaged build succeeds.
- [x] Packaged app starts without manually running the frontend server.
- [x] Online login/setup succeeds and caches snapshot.
- [x] Sales opens online to seed cache.
- [x] Inventory opens online to seed cache.
- [ ] App reopens after backend stop.
- [ ] Offline unlock/native shell appears.
- [ ] Workspace access comes from cached snapshot.
- [x] Inventory avoids infinite loading. Initial attempt failed with persistent dashboard skeletons; rebuilt executable now resolves Inventory dashboard metrics and recent activity.
- [ ] POS/Sales avoids blank/unrecoverable state or clearly exposes timeout/fallback gap. Online Sales seed passes; offline behavior not tested yet.
- [x] Dynamic port and `/api/health` work.
- [ ] One restart attempt/recovery banner behavior works. Not observed in this run.
- [x] No blank screen or unrecoverable login loop observed during login, setup, Sales, and Inventory navigation.

Observed issues:

- The fresh build completed successfully and produced `src/desktop/src-tauri/target/release/servaan-desktop.exe`.
- The packaged app launched successfully.
- The bundled sidecar launched from `target/release/resources/runtime/node.exe`.
- The sidecar listened on private loopback port `65491`.
- `http://127.0.0.1:65491/api/health` returned a Servaan-specific healthy response.
- The first login attempt showed `ورود به سیستم ناموفق بود`.
- At that moment the canonical backend on `localhost:3001` was not reachable, so the visible login failure was consistent with backend unavailability rather than sidecar startup failure.
- The backend was restarted with logged output and then verified healthy at `http://localhost:3001/api/health`.
- Remote attempts to submit the already-filled desktop login form did not produce a `POST /api/auth/login` entry in the backend log, so the online seed could not be completed without manual UI retry.
- Manual retry after backend recovery reached the setup screen and backend logs confirmed `POST /api/auth/login 200`.
- Device setup initially failed with `Command sqlite_set_value not allowed by ACL`.
- Added a Tauri app permission group for the Servaan native commands and attached it to the main window capability.
- Added loopback `remote.urls` for the dynamic sidecar origin because the packaged desktop shell loads `/native` from `http://127.0.0.1:<port>`.
- Rebuilt and relaunched the packaged app; native setup then completed successfully.
- The encrypted SQLite cache at `%APPDATA%\com.servaan.desktop\servaan-local-cache.sqlite` updated from 16 KB to 24 KB, confirming local setup/session persistence.
- Sales opened online in the packaged app and displayed seeded order data.
- Inventory opened online in the packaged app, but the dashboard stats and recent activity panels stayed in a repeating skeleton/loading state.
- Backend inventory endpoints were responding quickly during the Inventory attempt; observed responses included successful/fast inventory, item count, low stock, and analytics requests.
- The Inventory loading failure was diagnosed as the dashboard treating every local-first read-model refresh as a full page load. Since local-first reads intentionally refresh cached data in the background, the page could repeatedly re-enter skeleton mode even while data was available.
- Added no-cache/no-store handling for API GET requests used by the central API client so packaged WebView reads receive fresh response bodies instead of leaning on `304 Not Modified`.
- Changed the Inventory dashboard and Inventory detail page so only the first load shows full skeleton loading; background local-first refreshes now update data without resetting the whole page, and overlapping refreshes are collapsed.
- The first direct frontend production build after this patch passed when constrained to one Next build worker; the unconstrained packaged build hit Windows paging-file/Node out-of-memory failures during static page generation.
- Added a repeatable desktop packaging guard by constraining Next build CPU count and desktop runtime packaging worker settings.
- A fresh `npm run desktop:build:local` then completed successfully and produced `src/desktop/src-tauri/target/release/servaan-desktop.exe`.
- The rebuilt packaged executable was relaunched with the backend healthy on `localhost:3001`.
- Manual Inventory retest passed: dashboard metric cards resolved, low-stock panel resolved, and recent activities displayed instead of staying in skeleton loading.
- Manual Sales retest still passes: Sales dashboard opens in the packaged shell with ordering stats, quick actions, table status, payment summary, and inventory status visible.
- Backend was stopped and verified unavailable on `localhost:3001`.
- Offline restart did not require web login and did not blank-screen, but it skipped the expected native PIN/unlock screen.
- The app opened into the web workspace catalog/dashboard chrome while offline, with cached workspace access visible and mojibake text in workspace statistic cards.
- Two packaged sidecar `node.exe` processes were observed after restart, listening on separate private loopback ports, so stale sidecar cleanup also needs attention if it repeats.
- Root cause identified: the native shell treated `session.user` from the cached offline session as an active user before the PIN unlock completed, making the offline unlock guard unreachable.
- Patched the native active-user calculation so cached session users become active only after unlock, and changed the unlock guard to test the live authenticated user rather than the derived active user.
- Patched native desktop framing to include `/workspaces` as well as `/workspaces/...`, so the workspace catalog cannot escape into the regular web chrome inside desktop.
- Rebuilt and retested offline restart with the backend still stopped.
- Second offline restart improved the chrome: the app stayed inside the native desktop frame/sidebar instead of the public web workspace catalog.
- However, the PIN/unlock gate was still skipped because the browser-restored authenticated `user` from the cached desktop snapshot still counted as active while the native device was locked.
- Sales opened from cache with a visible `خطا در بارگذاری اطلاعات داشبورد` toast, which is an acceptable Sales fallback symptom only after the offline unlock gate passes; before unlock it remains a failure.
- Tightened the native active-user calculation again so the locked state dominates both browser-restored users and cached native session users, and the unlock screen renders whenever a valid locked offline session exists.

Next fix:

- Stop the backend, fully restart the packaged app, and verify offline unlock/native shell.
- If offline restart succeeds, test cached Inventory and POS/Sales behavior while the backend is stopped.

Result:

- Pass/Fail: In progress. Runtime startup, online login, native setup, encrypted SQLite setup/session persistence, Sales online seed, Inventory online seed, and fresh rebuild after Inventory loading fix passed. Offline restart still fails by bypassing native unlock; second fix pending rebuild/retest.

## QA Checklist For First Packaged Smoke

### 1. Fresh Build

- [ ] Close any running Servaan Desktop windows.
- [ ] Close any bundled `node.exe` sidecar from the previous packaged app run if it is still running.
- [ ] Run `npm run desktop:build:local`.
- [ ] Confirm the build succeeds.
- [ ] Launch `src/desktop/src-tauri/target/release/servaan-desktop.exe`.

Expected result:

- App opens from the packaged executable.
- No manually started frontend server is required.
- A black console window should not appear and disappear as the only visible behavior.

### 2. Online Seed

- [ ] Start or confirm the backend is running on `localhost:3001`.
- [ ] Open the packaged app.
- [ ] Login with the known working account.
- [ ] Complete native setup/unlock if prompted.
- [ ] Confirm the native shell/home screen appears.
- [ ] Open Sales/POS once.
- [ ] Open Inventory once.
- [ ] Return to home/native shell.

Expected result:

- Login succeeds online.
- Workspace access succeeds.
- Sales/POS and Inventory are reachable.
- Any loading state eventually resolves.
- This seeds the trusted login snapshot and operational cache.

### 3. Offline Restart

- [ ] Stop the backend on `localhost:3001`.
- [ ] Fully close Servaan Desktop.
- [ ] Reopen `src/desktop/src-tauri/target/release/servaan-desktop.exe`.
- [ ] Observe the first screen.
- [ ] Unlock offline if prompted.

Expected result:

- App still starts.
- It does not require a manually running frontend server.
- It does not send the user into an unrecoverable online-login loop.
- Native shell appears from cached state.
- Workspace access comes from the cached trusted login snapshot.

### 4. Inventory Offline Behavior

- [ ] Open Inventory while backend is stopped.
- [ ] Check whether cached Inventory data appears.
- [ ] If no data appears, check whether there is a clear empty-cache/offline state.
- [ ] Try one allowed offline inventory entry only if the screen has the needed cached item data.

Expected result:

- No infinite "checking access" or endless loading trap.
- Cached data appears when available.
- Empty cache is explained calmly if no cache exists.
- Allowed stock movement creates a local queued operation.
- Online-only/destructive actions are blocked clearly.

### 5. Sales/POS Offline Behavior

- [ ] Open Sales/POS while backend is stopped.
- [ ] Check whether cached menu/tables/settings appear.
- [ ] If it waits for backend timeout first, record it as a warning.
- [ ] Confirm it does not blank-screen or trap the user.
- [ ] If cached data appears, try a simple draft/order path only if the UI is stable.

Expected result:

- Known timeout fallback is a warning, not a blocker.
- Blank screen, unrecoverable loading, or trapped navigation is a failure.
- Local draft/order/payment behavior should either work or fail into Sync Issues/clear offline limitation.

### 6. Sidecar Runtime And Recovery

- [ ] Confirm the app starts on a private dynamic port.
- [ ] Confirm the app shell stays visible if backend is unavailable.
- [ ] If possible, trigger or observe sidecar recovery behavior.
- [ ] Confirm there is at most one auto-restart attempt.
- [ ] Confirm the recovery banner is visible when sidecar failure occurs.
- [ ] Dismiss the recovery banner and confirm it stays dismissed for that failure state.

Expected result:

- Dynamic sidecar launch works.
- `/api/health` behavior is sufficient for startup.
- Recovery banner is visible and dismissible.
- Shell does not become unusable just because remote backend is down.

### 7. Record Evidence

For each failed or warning item, record:

- Screen or step:
- What you expected:
- What happened:
- Whether it recovered:
- Any visible error text:
- Whether backend was online or stopped:
- Screenshot if useful:

### 8. Pass/Fail Decision

Pass only if:

- Fresh packaged app starts.
- Online seed succeeds.
- Offline restart reaches native unlock/shell.
- Workspace access uses cached snapshot.
- Inventory avoids infinite loading.
- POS/Sales does not blank-screen or trap the user.
- Recovery behavior does not break the shell.

Fail if:

- Packaged app does not open.
- App requires manually running the frontend server.
- User gets stuck in login/setup/offline unlock.
- Workspace access spins forever.
- Inventory or POS causes blank screen or unrecoverable loading.
- Sidecar failure destroys the native shell instead of showing recovery state.
