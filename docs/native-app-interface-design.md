# Native App Interface Design

Last updated: 2026-06-10

## Product Boundary

Servaan desktop and mobile apps are private operational apps, not the public web presence.

Native apps must:

- start at login, offline unlock, or workspace selection
- hide public marketing pages such as home, pricing, about, contact, and public registration
- support offline work after first online login on that device
- feel native, calm, fast, and operational
- support light and dark mode from the first production version

Visual direction:

- Apple-inspired minimal UI
- restrained surfaces and soft depth
- clear hierarchy, not decorative dashboards
- system-style icons
- high legibility for Farsi and Persian numbers
- no marketing hero sections inside native apps

## Core Native Navigation Model

Recommended model:

- Desktop: sidebar + top toolbar + detail panes
- Tablet: adaptive sidebar or tab/sidebar split
- Phone: bottom tab bar for major workspaces, navigation stack inside each workspace

Primary app areas:

- Today
- Sales
- Inventory
- Sync Issues
- Devices / Settings

The app should remember the last active operational workspace per device.

## Design Option A: Workspace Console

This design treats Servaan as an operations console.

Structure:

- left sidebar for workspaces and sync status
- center content for current task
- right inspector for context, conflicts, stock warnings, or selected order/item details
- top toolbar for search, sync, printer, current user, and quick actions

Best for:

- Windows desktop
- managers
- inventory-heavy workflows
- repeated daily operations with keyboard/mouse

Trade-offs:

- excellent for desktop density
- less natural on phone unless adapted heavily
- can feel too administrative if POS needs speed-first interaction

## Design Option B: Task-First Native App

This design starts from jobs, not modules.

Home shows task cards:

- Start Sale
- Open Orders
- Receive Stock
- Remove Stock
- Count Inventory
- Resolve Sync Issues

Each task opens a focused full-screen flow with minimal chrome.

Best for:

- staff users
- mobile apps
- restaurants that need low-training operation
- offline-first clarity

Trade-offs:

- very easy to use
- less powerful for managers who need scanning/comparison
- requires careful role-based task pruning

## Design Option C: Adaptive Apple-Style Workspace Shell

This design combines both.

Desktop:

- sidebar for major areas
- toolbar actions
- split views for list/detail workflows
- compact status strip for offline/sync/device state

Mobile:

- bottom tabs: Today, Sales, Inventory, Issues, Settings
- each tab has a native navigation stack
- destructive or approval actions use sheets
- scanning, payment, and receipt flows use focused full-screen tasks

Best for:

- one shared product direction across Windows, Android, and iOS
- Apple-style mental model
- balancing staff speed and manager power

Trade-offs:

- more design work than a simple web wrapper
- requires a design system layer
- still needs platform-specific handling for printing, biometric unlock, and device storage

## Recommended Design

Use Option C: Adaptive Apple-Style Workspace Shell.

Why:

- desktop gets a professional operations console
- mobile gets a simple native tab/navigation experience
- public pages stay out of native apps
- Sales and Inventory remain first-class operational workspaces
- Sync Issues becomes visible without overwhelming staff
- the same domain model and local-first engine can power all clients

## UX Improvements While Moving Native

Login and offline unlock:

- first online login creates device trust
- subsequent app opens show PIN/biometric unlock when eligible
- expired offline access shows a clear reconnect requirement

Offline status:

- persistent small status indicator, not a large warning banner
- states: Online, Offline Ready, Syncing, Issues, Expired
- tapping status opens sync details

Sales:

- POS optimized for touch
- fast item search and category switching
- receipt clearly marks offline recorded payments
- payment actions separate recorded offline evidence from gateway-confirmed payments

Inventory:

- scan-first entry creation
- estimated local stock shown next to confirmed stock
- deficits and conflicts are visible but do not block independent valid work

Sync Issues:

- staff sees simple badge and retry
- manager sees conflict detail, actor, device, time, and resolution actions

Settings:

- device name
- printer path
- offline expiry status
- last sync time
- diagnostic export

## Loading Visual Direction

Use the Servaan logo as the center anchor.

Recommended loader:

- logo mark centered
- subtle scale/fade pulse
- circular progress stroke only when real progress exists
- light mode: white or near-white background with soft shadow
- dark mode: near-black background with logo glow kept very subtle
- text below only when startup takes more than 2 seconds

Suggested startup messages:

- `در حال آماده‌سازی سروان`
- `بررسی وضعیت آفلاین`
- `در حال همگام‌سازی تغییرات`

Avoid:

- large marketing slogans
- busy animations
- loud gradients
- fake progress bars

## Open Decisions

- exact native home screen: resolved; reopen the last-used operational route
- desktop primary navigation: always-visible sidebar or compact adaptive sidebar
- mobile primary navigation: four tabs or five tabs
- whether managers get a different default home than staff
- whether Sales POS should be visually separate from the rest of the shell
- exact loading animation asset format: CSS/Lottie/native animation/video

## Resolved Desktop Route Model

- `/native` remains the private login, unlock, setup, settings, support, and sync shell.
- Existing Ordering & Sales and Inventory routes are reused inside desktop-aware native chrome.
- The shell shows only primary areas; deeper documented routes are reached from inside each workspace.
- The device remembers and reopens the last operational route.
- Operational writes queue offline.
- Master data changes become drafts.
- Dangerous actions become manager approval requests.
