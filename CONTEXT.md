# Servaan

Servaan is a local-first business management system for food-service operations. Its native apps support repeated operational work while the backend remains the canonical source for synchronized business records.

## Language

**Local Read Model**:
A device-local view of operational data that lets a workspace keep working when the backend is unavailable. It is not the canonical record; it is refreshed from the backend and used to stage offline work until sync.
_Avoid_: Local backend, bundled backend, offline database

**Canonical Backend**:
The remote Servaan backend that owns synchronized business records and cross-device truth. Native apps may cache data locally, but they do not replace this backend.
_Avoid_: Server cache, desktop backend

**Offline Business Slice**:
A deliberately small set of operational actions that can be completed while the backend is unavailable and later synchronized. In V1 this means offline POS order creation, offline cash/manual-card payment recording, offline inventory IN/OUT entries, and visible sync issue status.
_Avoid_: Fully offline workspace, offline dashboard, cached screen

**Unsynced Operation**:
A locally recorded business action that has not yet been confirmed by the Canonical Backend. It may be pending normally, waiting on another operation, failed, or conflicted; it remains visible because it still exists only on the device.
_Avoid_: Sync issue, failed item, local-only record

**Redacted Diagnostic Export**:
An operator-safe support file that summarizes device, cache, and Unsynced Operation status without raw operation payloads or authentication secrets. It is safe enough for pilot operators to send to support, unlike a privileged recovery export.
_Avoid_: Raw queue export, backup, recovery dump

**Native Operational Surface**:
A packaged-app screen built for repeated device-local work and offline continuity. It may share services and design language with the web app, but it is the accepted user surface for V1 offline business actions on desktop.
_Avoid_: Wrapped web page, desktop skin, web workspace shortcut

**Production Desktop Release**:
A commercially supportable packaged desktop app release that is ready for real tenant rollout beyond a controlled pilot, including operational workflows, support visibility, hardware validation, distribution, updates, and security review.
_Avoid_: Pilot-ready desktop, smoke-tested desktop, desktop V1

**Estimated Local Stock**:
The device-local stock value shown after offline inventory IN/OUT entries are queued but before the Canonical Backend confirms them. It updates immediately for operator feedback, may go below zero, and must be visually distinguished from confirmed stock when pending inventory operations exist.
_Avoid_: Confirmed stock, real stock, server stock
