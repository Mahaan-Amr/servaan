# Offline Mode Architecture - Ordering System
# Legacy ordering-specific offline architecture

> This document describes the earlier ordering-only IndexedDB approach.
> The current product direction is the shared local-first platform and packaged native shell described in docs/local-first-offline-apps-plan.md and docs/native-app-production-plan.md.

## Overview

The ordering system originally supported offline-first operation so the POS system could continue working when internet connection was lost. That implementation used browser storage and queueing, and it is now superseded by the shared local-first direction.

## Legacy Components

### 1. Offline Storage Service (offlineStorageService.ts)
- Purpose: Manages IndexedDB for persistent local storage
- Legacy features:
  - Stores pending orders locally
  - Caches menu, tables, and settings data
  - Manages sync queue for pending operations
  - Tracks sync status and retry counts

### 2. Connection Monitor Service (connectionMonitorService.ts)
- Purpose: Monitors online/offline status and connection quality

### 3. Sync Service (syncService.ts)
- Purpose: Handles automatic synchronization when connection is restored

### 4. Offline API Service (offlineApiService.ts)
- Purpose: Wraps API calls with offline detection and queue management

### 5. Offline Status Bar (OfflineStatusBar.tsx)
- Purpose: UI component showing connection and sync status

## Current Direction

The supported direction now is:

- shared local-first sync engine
- device management
- offline auth for previously authenticated users
- encrypted local storage for packaged apps
- append-only operations for orders, payments, and inventory transactions
- background sync after reconnect
- manager-facing Sync Issues workflow
- bundled local service for the desktop shell

## Notes

The legacy IndexedDB ordering layer may remain during migration, but it is not the target architecture for the packaged desktop app.
