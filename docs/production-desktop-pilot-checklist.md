# Production Desktop Pilot Checklist

This checklist gates the first Production Desktop Release. It verifies one real pilot tenant using the signed Windows desktop app for one full operating week before broader rollout.

## Pilot Setup

- [ ] Pilot tenant is selected and approved for controlled desktop rollout.
- [ ] Pilot branch, devices, operators, managers, and support contacts are recorded.
- [ ] Approved Windows device hardware is identified.
- [ ] Approved receipt printer model is identified as U80 over USB.
- [ ] Windows USB printer name for the U80 is recorded exactly as it appears on the pilot device.
- [ ] Pilot receipt business identity is confirmed: business name, address, phone, tax/registration fields, and any required footer text.
- [ ] Backend environment, tenant, and device registration are ready.
- [ ] Support team has access to read-only admin support observability.
- [ ] Rollback plan to the previous desktop app binary is documented.
- [ ] Manual recovery policy is documented for cases not covered by Redacted Diagnostic Export.

## Installer And Signing

- [ ] Signed Windows installer is produced from the release candidate build.
- [ ] Installer signature is verified on the pilot device.
- [ ] Installation succeeds without requiring developer tools.
- [ ] Installed app launches from the normal Windows app entry point.
- [ ] App version shown in the desktop app matches the release candidate.
- [ ] App version shown in admin support observability matches the pilot device.
- [ ] Previous app binary rollback path is tested or dry-run documented.

## First Online Setup

- [ ] Backend is online.
- [ ] Operator completes online login.
- [ ] Tenant and device identity are correct.
- [ ] Device setup completes.
- [ ] PIN/offline unlock setup completes.
- [ ] Required V1 cache seed completes without missing-cache warnings.
- [ ] Native desktop shell opens without public web pages.
- [ ] POS native surface opens from desktop navigation.
- [ ] Inventory native surface opens from desktop navigation.
- [ ] Old wrapped web POS/Inventory paths are not exposed as normal desktop paths.

## Daily Operations

Repeat on each pilot operating day:

- [ ] Operator opens the signed desktop app.
- [ ] Operator can unlock or login according to current connectivity.
- [ ] POS native surface loads the cached V1 business slice.
- [ ] At least one dine-in or takeaway POS sale is created.
- [ ] One full cash or manual-card payment is recorded with the sale.
- [ ] POS success state shows local sale/payment numbers and pending-sync status when applicable.
- [ ] Inventory native surface loads active cached items.
- [ ] At least one stock IN or stock OUT entry is created during the week.
- [ ] Inventory success state shows local document number, item, movement type, quantity, unit, and pending-sync status when applicable.
- [ ] Estimated Local Stock remains visually distinct when pending inventory operations exist.
- [ ] No operator is trapped in blank screens, unrecoverable loading, or public web workspace chrome.

## Offline And Reconnect

Complete at least once during the pilot week:

- [ ] Backend/network is unavailable or intentionally disconnected.
- [ ] Desktop app restarts while offline.
- [ ] Offline unlock appears before operational access.
- [ ] Cached workspace access comes from the trusted online login snapshot.
- [ ] POS sale and full cash/manual-card payment can be queued offline.
- [ ] Inventory IN or OUT can be queued offline if cache is available.
- [ ] Missing cache state, if encountered, is clear and Persian operator-facing.
- [ ] Sync status shows pending Unsynced Operations.
- [ ] Backend/network is restored.
- [ ] Sync starts automatically or through Sync Now.
- [ ] Pending operations disappear only after Canonical Backend confirmation.
- [ ] Backend records include offline source metadata.
- [ ] Failed, conflicted, or dependency-waiting operations remain visible if they occur.

## Receipt Printing

- [ ] Approved U80 USB pilot printer is configured by Windows printer name.
- [ ] Printer setup survives app restart.
- [ ] Online receipt prints for a completed POS sale.
- [ ] Offline/local receipt prints immediately after local sale and payment are queued.
- [ ] Offline receipt is marked pending sync with a small but visible marker.
- [ ] Offline receipt includes local sale/payment numbers.
- [ ] Receipt print success queues the offline receipt audit flag for sync.
- [ ] Printer failure surfaces a clear operator-facing error and does not lose, cancel, or delete the queued sale/payment.
- [ ] Failed receipt printing can be retried without creating a duplicate sale/payment.
- [ ] Receipt has a later Canonical Receipt reprint path after sync.

## Sync Status And Diagnostics

- [ ] Sync status panel is reachable from the native desktop shell.
- [ ] Pending Unsynced Operations are visible while they exist only on the device.
- [ ] Attention states are visible if failed, conflicted, or dependency-waiting operations occur.
- [ ] Failed rows include reason/helper text and use shared retry/sync guidance.
- [ ] Conflicted rows indicate manager review is required.
- [ ] Dependency-waiting rows are visible and not silently hidden.
- [ ] Redacted Diagnostic Export can be generated by the operator/support path.
- [ ] Export includes device/session/cache context.
- [ ] Export includes redacted Unsynced Operation summaries.
- [ ] Export excludes raw payloads, auth secrets, PIN/hash material, full local read models, stack traces, and privileged recovery data.
- [ ] Export can be correlated with admin support observability.

## Admin Support Observability

- [ ] Support can find the pilot tenant.
- [ ] Support can find each pilot device.
- [ ] Support can see app version per device.
- [ ] Support can see last sync time per device.
- [ ] Support can see pending, failed, conflicted, and dependency-waiting counts.
- [ ] Support can see failure reasons when available.
- [ ] Support can see sync batch IDs.
- [ ] Support can correlate a Redacted Diagnostic Export with backend/admin records.
- [ ] Support console remains read-only; no remote retry, force-resolve, quarantine, or recovery export action is available.

## Updates

- [ ] App checks for signed updates.
- [ ] Available update is visible to operator or support.
- [ ] Update availability is visible in support diagnostics or logs.
- [ ] Pilot update does not install silently.
- [ ] Operator/support-confirmed install path is tested.
- [ ] App launches successfully after update.
- [ ] Local queued operations survive update.
- [ ] Rollback to previous app binary remains possible when no incompatible local migration has occurred.

## Security And Local Data

- [ ] Local packaged-app storage uses encrypted SQLite.
- [ ] Offline auth expiry is enforced for new offline mutations.
- [ ] Cached screens may remain read-only after offline auth expiry.
- [ ] Unsynced Operations are never silently deleted.
- [ ] Destructive local schema migrations are blocked while Unsynced Operations exist.
- [ ] Local logout behavior is understood by support.
- [ ] Wipe-this-device behavior is documented and manager/admin controlled.
- [ ] No privileged raw recovery export exists in the production desktop release.

## Exit Criteria

- [ ] Pilot tenant completes one full operating week.
- [ ] Daily POS/Inventory use succeeds.
- [ ] At least one offline/reconnect event succeeds.
- [ ] Receipt printing works on approved U80 pilot hardware.
- [ ] Update check and confirmed install path are validated.
- [ ] Redacted Diagnostic Export is generated and reviewed.
- [ ] Admin support observability correlates with the diagnostic export.
- [ ] No unresolved data-loss, sync-loss, security, or unrecoverable-startup blocker remains.
- [ ] Known non-blocking issues are documented with owner and follow-up plan.
- [ ] Pilot tenant, support, and engineering agree the release candidate is ready for controlled rollout.
