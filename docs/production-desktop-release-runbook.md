# Production Desktop Release Runbook

This runbook is for the first controlled Production Desktop Release. It assumes the business workflow scope stays limited to the accepted native POS/Inventory offline slice.

## Release Channel

- Channel: internal/pilot Windows distribution.
- Hosting: private GitHub Release, private object storage bucket, or protected server path.
- Public download page: out of scope for the first production desktop release.
- Update discovery: signed update manifest from the private channel.

## Signing Authority

- One release owner and one backup may produce signed installers.
- Developer machines may produce unsigned internal builds only.
- The signing certificate must be stored securely and must not be copied casually across machines.
- A signed installer is required before controlled tenant pilot installation.

## Release Candidate Build

1. Confirm the working tree is clean except for intentional release changes.
2. Run the focused frontend local-first tests.
3. Run the frontend build.
4. Run the admin backend build.
5. Run the admin frontend build.
6. Build the desktop release executable with `npm run desktop:build:local`.
7. Verify the packaged app starts without a manually running frontend server.
8. Verify the app version shown in the desktop app and admin support observability.

## Installer And Update Artifacts

1. Produce the Windows installer from the release candidate.
2. Sign the installer through the controlled release process.
3. Verify the installer publisher is not shown as unknown.
4. Publish the signed installer to the private release channel.
5. Publish the signed update manifest to the private release channel.
6. Confirm pilot devices can detect the update.
7. Confirm pilot updates require operator/support confirmation and do not install silently.

## Rollback Contract

- Rollback means returning to the previous app binary.
- Local SQLite data and sync schema rollback are not promised in the first production desktop release.
- Destructive local schema migrations are blocked while Unsynced Operations exist.
- A release that would make local data incompatible with the previous app version must wait for a later release policy.

## Pilot Hardware

- Validate one exact receipt printer model for the first production desktop release: U80 over USB, configured by the Windows printer name on the pilot device.
- Online receipts must print for completed POS sales.
- Offline/local receipts must print immediately after local sale/payment queueing.
- Offline/local receipts must include local sale/payment numbers and a small but visible pending-sync marker.
- Receipt print failure must not lose, cancel, delete, or block the queued sale/payment.
- Receipt print failure must be retryable without creating a duplicate sale/payment.
- Successful offline receipt printing must queue the receipt audit flag for sync.
- Synced sales must have a later Canonical Receipt reprint path using canonical backend numbering or verification status.
- Broad ESC/POS printer compatibility follows after the first production desktop release.

## Support Readiness

- Admin support console is read-only.
- Support can see tenant/device sync status, app version, last sync, failure reasons, sync batch IDs, and Redacted Diagnostic Export correlation fields.
- Support cannot remote retry, force-resolve, quarantine, or request privileged recovery exports in the first production desktop release.
- Pilot support observability records are retained for 90 days and do not include raw operation payloads.

## Security And Recovery

- Redacted Diagnostic Export is the operator-safe support artifact.
- Privileged raw recovery export is out of scope until authorization, retention, and support-handling rules exist.
- Manual recovery policy must be documented before the pilot week starts.
- Local packaged-app storage must remain encrypted SQLite.

## Production Gate

Production desktop release is blocked until one real pilot tenant completes the checklist in:

- `docs/production-desktop-pilot-checklist.md`

Approval requires:

- Engineering sign-off for local storage, update, migration, and security behavior.
- Support sign-off for diagnostics, observability, and recovery readiness.
- Business owner sign-off for pilot risk and tenant communication.
