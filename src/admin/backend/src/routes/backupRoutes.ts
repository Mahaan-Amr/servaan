import { Router, Request, Response } from 'express';
// import rateLimit from 'express-rate-limit'; // Disabled for admin panel
import { authenticateAdmin } from '../middlewares/adminAuth';
import { createBackup, listBackups, resolveBackupPath, restoreDryRun, startRestore, getRestoreJob } from '../services/backupService';
import fs from 'fs';

const router = Router();

// GET /api/admin/backups — list backup files
router.get('/', authenticateAdmin, async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const files = await listBackups();
    return res.json({ success: true, data: files });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'BACKUP_LIST_ERROR', message: 'Failed to list backups' });
  }
});

// POST /api/admin/backups — trigger a new backup (fire-and-forget)
router.post('/', authenticateAdmin, async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const result = await createBackup();
    if (!result.started) {
      return res.status(500).json({ success: false, error: 'BACKUP_START_ERROR', message: result.message });
    }
    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'BACKUP_START_ERROR', message: 'Failed to start backup' });
  }
});

// GET /api/admin/backups/:name/download — stream a backup file
router.get('/:name/download', authenticateAdmin, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const name = (req.params as any)['name'] as string;
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid file name' });
    }
    const full = resolveBackupPath(name);
    if (!fs.existsSync(full)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    const stream = fs.createReadStream(full);
    stream.pipe(res);
    return;
  } catch (error) {
    return res.status(500).json({ success: false, error: 'BACKUP_DOWNLOAD_ERROR', message: 'Failed to download backup' });
  }
});

export default router;

// POST /api/admin/backups/:name/restore/dry-run — validate restore
router.post('/:name/restore/dry-run', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const name = (req.params as any)['name'] as string;
    const result = await restoreDryRun(name);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message, info: result.info });
    return res.json({ success: true, data: result.info });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'RESTORE_DRY_RUN_ERROR', message: 'Failed to perform dry-run' });
  }
});

// POST /api/admin/backups/:name/restore — start restore job
router.post('/:name/restore', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const name = (req.params as any)['name'] as string;
    const result = await startRestore(name);
    if (!result.started) return res.status(400).json({ success: false, message: result.message });
    return res.json({ success: true, jobId: result.jobId });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'RESTORE_START_ERROR', message: 'Failed to start restore' });
  }
});

// GET /api/admin/backups/restore/:jobId — restore job status
// const statusLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }); // Disabled
router.get('/restore/:jobId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const jobId = (req.params as any)['jobId'] as string;
    const job = getRestoreJob(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    // Avoid browser caching for polling endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'RESTORE_STATUS_ERROR', message: 'Failed to fetch job status' });
  }
});


