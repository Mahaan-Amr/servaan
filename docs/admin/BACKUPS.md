### Backups & Restore

Endpoints:
- GET `/api/admin/backups` — list backups
- POST `/api/admin/backups` — trigger backup
- GET `/api/admin/backups/:name/download` — download
- POST `/api/admin/backups/:name/restore/dry-run` — validate file & show info
- POST `/api/admin/backups/:name/restore` — start restore job
- GET `/api/admin/backups/restore/:jobId` — job status (queued|running|succeeded|failed)

UI:
- Page: `/admin/system/backups` — now includes "بازیابی" action
- Flow: dry-run → confirm modal → start restore → progress polling → success/fail toast

Safety:
- Dry-run blocks unsupported file types
- Modal warns about data replacement; take a new backup before restore
- Post-restore health check verifies DB connectivity

Notes:
- Windows path uses `restore-database.bat <file>`; Linux placeholder for now
- Consider restricting restore to SUPER_ADMIN only


