# Web vs Desktop POS/Inventory Comparison

Date: 2026-07-03

Scope: current source in `D:\servaan`, focused only on the Inventory Management workspace and the Ordering & Sales/POS workspace.

## Executive Verdict

The web version and the desktop version are not feature-equivalent.

The web version is the broad online operational product. It exposes the full Inventory Management and Ordering & Sales workspaces through normal Next.js routes, REST APIs, tenant feature gating, and workspace navigation.

The desktop version is currently a narrow native operational shell around the V1 local-first offline slice. It supports cached native POS order/payment queueing and cached native Inventory IN/OUT entry queueing, plus sync diagnostics, native session/offline unlock foundations, and local read models. It intentionally does not implement the broader web workflows yet.

Production desktop should therefore be judged as: "Does the proven offline POS/Inventory slice work reliably with installer, signing, updater, diagnostics, printer validation, and support readiness?" It should not be judged as: "Does desktop contain every web Inventory and POS workflow?"

## Main Source Paths

Web Inventory:

- `src/frontend/app/workspaces/inventory-management/**`
- `src/frontend/services/inventoryService.ts`
- `src/frontend/services/itemService.ts`
- `src/frontend/services/supplierService.ts`
- `src/backend/src/routes/inventoryRoutes.ts`
- `src/backend/src/routes/itemRoutes.ts`
- `src/backend/src/routes/supplierRoutes.ts`
- `src/backend/src/routes/scannerRoutes.ts`

Web POS / Ordering:

- `src/frontend/app/workspaces/ordering-sales-system/**`
- `src/frontend/services/orderingService.ts`
- `src/backend/src/routes/orderingRoutes.ts`
- `src/backend/src/services/orderService.ts`
- `src/backend/src/services/paymentService.ts`
- `src/backend/src/services/printService.ts`

Desktop native shell and local-first slice:

- `src/frontend/app/native/page.tsx`
- `src/frontend/components/native/NativeApp.tsx`
- `src/frontend/components/native/NativeDesktopFrame.tsx`
- `src/frontend/features/native-pos/nativePosService.ts`
- `src/frontend/features/native-pos/nativePosTypes.ts`
- `src/frontend/features/native-inventory/nativeInventoryService.ts`
- `src/frontend/features/native-inventory/nativeInventoryTypes.ts`
- `src/frontend/services/nativeBusinessCacheService.ts`
- `src/frontend/services/localFirstSyncService.ts`
- `src/backend/src/routes/syncRoutes.ts`
- `src/backend/src/services/localFirstSyncService.ts`
- `src/desktop/src-tauri/src/main.rs`

Tenant/workspace access:

- `src/backend/src/middlewares/tenantMiddleware.ts`
- `src/backend/src/routes/workspaceRoutes.ts`
- `src/frontend/services/workspaceService.ts`
- `src/frontend/contexts/WorkspaceContext.tsx`
- `src/frontend/components/workspace/WorkspaceProtection.tsx`

## Activation, Enablement, And Tenant Binding

### Web Version

The web app identifies the tenant from either the host subdomain or the `X-Tenant-Subdomain` header. `resolveTenant` rejects inactive/missing/expired tenants and attaches `req.tenant` for downstream API routes.

After login, the frontend fetches `/api/workspace/user-access/:userId` through `workspaceService.getUserWorkspaceAccess()`. The backend computes access from the tenant feature row and the user's role:

- Inventory Management: enabled only when `req.tenant.features?.hasInventoryManagement` is true.
- Ordering & Sales: enabled for all tenants in the current backend logic.
- ADMIN and MANAGER receive `full`; other roles receive `read-only`.

Workspace pages are guarded by the workspace context and `WorkspaceProtection`/`WorkspaceShell` flow. If the user lacks access, the UI redirects or shows an access-denied state.

Web data exchange is mostly direct online REST:

1. User signs in and receives a token.
2. Frontend sends token plus tenant header.
3. Backend resolves tenant and authenticates user.
4. Reads and writes go directly to canonical PostgreSQL through backend services/routes.
5. Some web operations have local-first fallback when offline, but the web version is still the broad online workspace.

### Desktop Version

The desktop app opens through `/native`, and tenant extraction deliberately does not use `/native` host subdomain parsing. The native app depends on an online login and persisted native session/snapshot to know the intended tenant.

Desktop activation works like this:

1. First use requires online login.
2. The successful login stores token, user, tenant subdomain, offline auth expiry, device setup, device profile, and PIN state.
3. `seedNativeV1BusinessCache()` fetches the V1 business cache using the token plus `X-Tenant-Subdomain`.
4. The desktop native shell can reopen later from the cached native session and local read models.
5. Offline unlock validates the cached session and offline auth expiry.
6. New offline mutations are blocked when offline auth is expired.

Important nuance: the native POS and native Inventory panels are not wrappers around the full web workspace routes. They are dedicated native surfaces under `NativeApp.tsx`. They check desktop runtime, valid native login snapshot, and required cache keys. They do not expose every web page/action.

Desktop data exchange works through a local-first queue:

1. Native POS/Inventory reads from local read models such as `sales.menu`, `sales.tables`, `sales.settings`, `inventory.items`, and `inventory.current`.
2. Native writes create `LocalOperation` records with `tenantId`, `deviceId`, `workspaceId`, `operationType`, `actorUserId`, local numbers, and payload.
3. `syncNow()` pushes ready operations to `/api/sync/push`.
4. Backend validates device registration, tenant/device scope, protocol version, idempotency, and operation type.
5. Backend applies accepted operations to canonical PostgreSQL, records sync operations, returns server IDs/mappings, or records rejects/conflicts.
6. Admin/support observability reads the backend sync status later for tenant/device correlation.

## Inventory Workspace Comparison

### Web Inventory Status

The web Inventory workspace is broad and mostly implemented as the full online workspace. It includes:

- Inventory dashboard.
- Item list, item detail, item create/edit.
- Inventory transaction list.
- Stock IN and stock OUT pages.
- Bulk stock entry.
- Purchase list.
- Suppliers list/detail/create/edit.
- Barcode scanner route.
- Inventory reports.
- Audit/count cycles.
- Inventory settings.
- Backend routes for current stock, low stock, total quantity/value, reports, reset, adjustment, settings, barcode update, deficits, stock validation, recipe/menu availability integration, and inventory create/update/delete.

Offline/local-first status in web Inventory:

- `createInventoryEntry()` can queue an `inventory.entry.create` local operation on offline/network failure.
- `bulkCreateInventoryEntries()` can queue multiple local inventory entry operations on offline/network failure.
- Read methods use `readLocalFirst()` for selected read models such as entries, current inventory, low stock, stats, recent activity, and settings.
- Update/delete/reset/settings changes remain online-only when offline.

Verdict: Web Inventory is much broader than desktop Inventory. It is the full online workspace, with partial local-first fallback around inventory entry creation and cached reads.

### Desktop Native Inventory Status

Desktop native Inventory currently supports the V1 offline operational slice:

- Loads active cached items from `inventory.items`.
- Loads current stock from `inventory.current`.
- Shows readiness states for not-native, missing cache, expired offline auth, and ready.
- Allows one stock movement per submission.
- Supports only `IN` and `OUT`.
- Requires a positive quantity.
- Allows an optional note.
- Queues `inventory.entry.create`.
- Immediately updates estimated local stock in the `inventory.current` local read model.
- Shows local document number and pending sync status.
- Allows OUT to make estimated local stock negative; this is visible but not blocked by the native service.

Desktop native Inventory does not currently implement:

- Item creation/editing.
- Supplier selection.
- Barcode scanner workflows.
- Bulk receiving.
- Purchase list workflows.
- Unit conversion.
- Unit price entry.
- Batch number.
- Expiry date.
- Inventory audits/count cycles.
- Inventory reports.
- Reset stock.
- Inventory settings editing.
- Update/delete of existing inventory entries.
- Manager review/approval UI for conflicts beyond sync issue visibility.
- Inventory receipt/document printing.

Verdict: Desktop Inventory is implemented for the V1 offline IN/OUT slice only. It is not complete compared with web Inventory.

## POS / Ordering Workspace Comparison

### Web POS / Ordering Status

The web Ordering & Sales workspace is broad. It includes:

- Ordering dashboard.
- POS page.
- Order management.
- Table management.
- Kitchen display.
- Menu management.
- Payment management.
- Analytics/reporting.
- Ordering settings.
- Receipt preview and print UI.
- Printer settings modal.
- Backend order, payment, table, menu, recipe, kitchen, analytics, print, accounting, and inventory integration endpoints.

The web POS/order services support many workflows:

- Create orders.
- Update orders.
- Update order status.
- Bulk status updates.
- Cancel and complete orders.
- Active/today/table order queries.
- Add/remove/update order items.
- Table CRUD/status/layout/available tables/transfer.
- Reservations and bulk reservation/table operations.
- Process payments.
- Refunds.
- Pending/failed payment views.
- Cash management reports.
- Menu/category/item CRUD and availability.
- Kitchen display updates and preparation actions.
- Sales/customer/kitchen/table analytics and exports.
- Recipe and inventory integration workflows.

Offline/local-first status in web POS:

- `OrderService.createOrder()` can queue `sales.order.create` when offline/network failure happens.
- `PaymentService.processPayment()` has an offline payment path for cash/manual card evidence.
- Receipt printed offline can be audited with `sales.receipt.mark_printed_offline`.
- Web POS contains receipt preview and print paths, including browser print/canvas/QZ-style behavior and a desktop bridge attempt when available.

Verdict: Web POS/Ordering is the full online workspace with some offline fallback paths. It is far broader than native desktop POS.

### Desktop Native POS Status

Desktop native POS currently supports the V1 offline sale slice:

- Loads cached menu from `sales.menu`.
- Loads cached tables from `sales.tables`.
- Loads cached settings from `sales.settings`.
- Shows readiness states for not-native, missing cache, expired offline auth, and ready.
- Lets the operator add cached active menu items to a cart.
- Supports quantity increment/decrement.
- Supports only `DINE_IN` and `TAKEAWAY`.
- For dine-in, table selection is optional and uses the last cached table list.
- Supports one full payment in the same flow.
- Supports only cash and manual card.
- Queues `sales.order.create`.
- Queues `sales.payment.record_offline`.
- Uses a dependency from payment to local order ID so sync can apply order first.
- Shows local order/payment numbers and pending sync status.

Desktop native POS does not currently implement:

- Delivery orders.
- Customer search/CRM attachment beyond simple input support in the service type.
- Discounts.
- Tax overrides.
- Service charge editing.
- Custom price editing.
- Split payments.
- Partial payments.
- Payment-after-service / parked unpaid orders.
- Refunds.
- Gateway payments or online bank confirmation.
- Order editing after submit.
- Add/remove/update items on an existing order.
- Table locking, transfer, merge/split, reservations.
- Menu/category/item editing.
- Kitchen display operations.
- POS analytics.
- Recipe/inventory stock validation UI.
- Cash drawer/cash management workflows.
- Full receipt-print-after-native-sale workflow.

Receipt printing nuance:

- A Tauri native command exists: `print_receipt_text` in `src/desktop/src-tauri/src/main.rs`.
- The frontend bridge exposes `printDesktopReceiptText()` in `desktopBridgeService.ts`.
- The old web POS page uses receipt preview/print flows and can call `printDesktopReceiptText()` in some payment completion paths.
- The native desktop POS panel in `NativeApp.tsx` currently queues order/payment and shows local numbers, but does not call `printDesktopReceiptText()` or queue `sales.receipt.mark_printed_offline` as part of the native sale success flow.
- Therefore, production receipt printing is not complete for the native desktop POS slice yet. The production docs correctly require this as a blocker before first production desktop release.
- The approved first hardware target is U80 over USB, configured by Windows printer name.
- Receipt print failure must not lose, cancel, delete, or block the queued sale/payment. It must be retryable without creating a duplicate sale/payment.
- Offline/local receipts must include local sale/payment numbers and a small visible pending-sync marker.
- After sync, the product needs a Canonical Receipt reprint path using canonical backend numbering or verification status.

Verdict: Desktop native POS is implemented for V1 local order plus full cash/manual-card payment queueing. It is not complete compared with web POS/Ordering, and native receipt printing still needs integration and hardware validation.

## Cache Coverage

Desktop V1 cache seeding currently targets:

- `sales.menu` from `/ordering/menu/full`
- `sales.tables` from `/ordering/tables`
- `sales.settings` from `/ordering/settings`
- `inventory.items` from `/items`
- `inventory.current` from `/inventory/current`
- `inventory.settings` from `/inventory/settings`
- `inventory.lowStock` from `/inventory/low-stock`
- `inventory.entries` from `/inventory`

The native readiness checks require:

- POS: `sales.menu`, `sales.tables`, `sales.settings`
- Inventory: `inventory.items`, `inventory.current`
- Overall native V1 cache readiness: sales keys plus `inventory.items`, `inventory.current`, `inventory.settings`

This cache intentionally excludes broad workflows such as suppliers, reports, analytics, audits, menu editing, recipe editing, payment gateway state, CRM data, and advanced table operations.

## Sync Operation Coverage

Backend `/api/sync/push` currently applies:

- `inventory.entry.create`
- `sales.order.create`
- `sales.payment.record_offline`
- `sales.receipt.mark_printed_offline`

Backend `/api/sync/push` currently conflicts/rejects:

- `master_data.upsert_draft` becomes a conflict requiring review.
- `dangerous.action.request_approval` becomes a conflict requiring approval.
- Unknown operation types are rejected.

The desktop local-first layer blocks master-data and dangerous offline actions in desktop mode. This protects the V1 native slice from drifting into broad offline workflow complexity too early.

## Working Evidence

Documented desktop smoke evidence exists in `docs/desktop-smoke-log.md`.

The strongest current evidence is the 2026-07-01 Native Desktop V1 Offline Slice Smoke, which records:

- Online login/setup/cache seed.
- Offline desktop reopen/unlock/native shell.
- Native POS order with cash/manual-card payment.
- Native Inventory stock IN and OUT entries.
- Reconnect sync.
- Backend records confirmed for POS order/payment and inventory entries.

This report did not rerun the packaged desktop smoke test. It is a source audit against the current code plus existing documented smoke evidence.

## Feature Matrix

| Area | Web Inventory | Desktop Native Inventory | Web POS/Ordering | Desktop Native POS |
| --- | --- | --- | --- | --- |
| Tenant binding | Implemented through host/header tenant resolution | Implemented through native login snapshot plus tenant header during cache/sync | Implemented through host/header tenant resolution | Implemented through native login snapshot plus tenant header during cache/sync |
| Workspace enablement | Inventory feature flag required | Relies on online login/cache/session; native panel itself checks cache/auth, not the full web route guard | Enabled for all tenants in current backend access logic | Relies on online login/cache/session; native panel itself checks cache/auth, not the full web route guard |
| Read model | Online REST plus selected local-first cached reads | Local read models only | Online REST plus selected local-first/offline service paths | Local read models only |
| Create inventory movement | Implemented | Implemented for one IN/OUT entry | Not applicable | Not applicable |
| Bulk inventory | Implemented in web | Not implemented | Not applicable | Not applicable |
| Item/supplier/scanner/audit/report/settings | Implemented across web routes | Not implemented | Not applicable | Not applicable |
| Create order | Implemented | Not applicable | Implemented | Implemented for native V1 sale |
| Order payment | Not applicable | Not applicable | Implemented | Implemented for one full cash/manual-card payment |
| Receipt printing | Not applicable | Inventory document printing out of V1 | Web receipt UI/print paths implemented | Native command exists, but native POS sale flow does not yet print/mark receipt |
| Refund/split/partial/gateway payments | Not applicable | Not applicable | Broadly implemented online | Not implemented |
| Table/reservation operations | Not applicable | Not applicable | Broadly implemented online | Cached optional table selection only |
| Menu/recipe/kitchen/analytics | Not applicable | Not applicable | Broadly implemented online | Not implemented |
| Offline startup | Browser/web behavior, not packaged-shell primary path | Implemented for cached native session/cache within offline auth rules | Browser/web behavior, not packaged-shell primary path | Implemented for cached native session/cache within offline auth rules |
| Sync to canonical backend | Direct REST; selected local queue fallback | Local queue to `/sync/push` | Direct REST; selected local queue fallback | Local queue to `/sync/push` |
| Admin/support observability | Normal backend data/admin surfaces | Sync support observability added for tenant/device state | Normal backend data/admin surfaces | Sync support observability added for tenant/device state |

## Gaps Before Production Desktop Release

The desktop business slice is intentionally narrow, but the production shell is not done until these are complete:

- Signed Windows installer from a controlled release process.
- Update path with signed manifest and previous-app rollback behavior.
- Private release hosting for pilot devices.
- Native POS receipt-print-after-sale workflow.
- Offline receipt text/template carrying pending-sync status and local order/payment numbers.
- `sales.receipt.mark_printed_offline` queued from the native receipt success path.
- One exact pilot receipt printer validated on real hardware: U80 over USB, configured by Windows printer name.
- Retryable print-failure handling that preserves the queued sale/payment and avoids duplicate sale/payment records.
- Canonical Receipt reprint path after sync.
- Diagnostic export/support-console correlation exercised by support.
- Security/backup review for local storage, secrets, pending queues, and diagnostic payload redaction.
- One real pilot tenant week with daily POS/Inventory use, offline/reconnect, receipt printing, update check, diagnostic export, and support-console correlation.

## Bottom Line

For Inventory:

- Web Inventory is the full operational workspace.
- Desktop Inventory is a working V1 offline IN/OUT movement surface against cached items/current stock.
- Desktop Inventory is not intended to replace full web Inventory yet.

For POS:

- Web POS/Ordering is the full operational workspace.
- Desktop native POS is a working V1 offline order plus full cash/manual-card payment queueing surface.
- Desktop native POS still needs real receipt printing wired into the native sale flow before production desktop release.
- The next desktop implementation slice should make native POS receipt printing end to end against U80 while keeping sale/payment queueing independent from printer success.

For tenant data exchange:

- Both versions write to the same canonical backend tenant data.
- Web writes usually go directly to backend REST endpoints.
- Desktop writes first become tenant/device/user-scoped local operations, then sync to the backend through `/api/sync/push`.
- The intended tenant is carried by tenant resolution in web and by the cached native login tenant plus `X-Tenant-Subdomain` in desktop cache/sync calls.
