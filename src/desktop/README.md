# Servaan Desktop

Windows desktop shell for Servaan's local-first Sales and Inventory workspaces.

## Commands

Run the desktop app in development:

```bash
npm run desktop:dev
```

Check the Rust/Tauri project:

```bash
npm run desktop:check
```

Build the desktop executable without installer bundling:

```bash
npm run desktop:build
```

Build the executable against the local development backend for smoke testing:

```bash
npm run desktop:build:local
```

The executable is written to:

```text
src/desktop/src-tauri/target/release/servaan-desktop.exe
```

Build installer bundles:

```bash
npm run desktop:bundle
```

Installer bundling is intentionally separate from `desktop:build` because MSI/NSIS packaging is slower and may require more machine-specific tooling.

## Current Scope

This milestone creates the Tauri shell and native bridge foundation:

- native app version command
- OS secure secret storage commands
- Windows text receipt printing command
- frontend desktop bridge service
- POS silent-print path that tries desktop printing before QZ/canvas fallback
- release desktop shell that stages a bundled Next.js standalone runtime plus `node.exe`, then opens the native shell against a private dynamic loopback port
- launcher health polling against `/api/health` with one restart attempt and a cached-shell recovery banner in the native chrome
- encrypted SQLite desktop local store for local-first/offline queues, ordering cache data, sync queue state, and native setup/session state

## Runtime Packaging

The desktop release build now stages a runtime under `src-tauri/resources/runtime` before Tauri build:

- Next.js standalone server output from `src/frontend`
- copied `node.exe` from the build machine
- static and public assets needed by the standalone server
- packaged sidecar health endpoint at `/api/health`

The native shell opens directly into `/native` on the chosen loopback port, so offline unlock and cached workspace state are available immediately when the remote backend is down.

By default, the packaged runtime uses the production API configured by `NEXT_PUBLIC_API_URL` during build. For local login against seeded development data, use `npm run desktop:build:local` while the local backend is running on `http://localhost:3001`.

## Local Desktop Storage

Packaged desktop uses Tauri commands to persist local operational state in an encrypted SQLite database under the app data directory. The database stores encrypted JSON values by logical store/key, while the AES key is kept in OS credential storage.

The frontend desktop bridge routes these stores to SQLite when Tauri is present and keeps the existing IndexedDB/localStorage behavior for web/PWA:

- local-first operations, mappings, cursors, offline auth, and device metadata
- Ordering & Sales offline orders, payments, menu/table/settings cache, and sync queue
- native setup, last workspace/mode, offline session, and native-active state
