"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import rateLimit from 'express-rate-limit'; // Disabled for admin panel
const adminAuth_1 = require("../middlewares/adminAuth");
const backupService_1 = require("../services/backupService");
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// GET /api/admin/backups — list backup files
router.get('/', adminAuth_1.authenticateAdmin, async (_req, res) => {
    try {
        const files = await (0, backupService_1.listBackups)();
        return res.json({ success: true, data: files });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'BACKUP_LIST_ERROR', message: 'Failed to list backups' });
    }
});
// POST /api/admin/backups — trigger a new backup (fire-and-forget)
router.post('/', adminAuth_1.authenticateAdmin, async (_req, res) => {
    try {
        const result = await (0, backupService_1.createBackup)();
        if (!result.started) {
            return res.status(500).json({ success: false, error: 'BACKUP_START_ERROR', message: result.message });
        }
        return res.json({ success: true, message: result.message });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'BACKUP_START_ERROR', message: 'Failed to start backup' });
    }
});
// GET /api/admin/backups/:name/download — stream a backup file
router.get('/:name/download', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const name = req.params['name'];
        if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
            return res.status(400).json({ success: false, message: 'Invalid file name' });
        }
        const full = (0, backupService_1.resolveBackupPath)(name);
        if (!fs_1.default.existsSync(full)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        const stream = fs_1.default.createReadStream(full);
        stream.pipe(res);
        return;
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'BACKUP_DOWNLOAD_ERROR', message: 'Failed to download backup' });
    }
});
exports.default = router;
// POST /api/admin/backups/:name/restore/dry-run — validate restore
router.post('/:name/restore/dry-run', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const name = req.params['name'];
        const result = await (0, backupService_1.restoreDryRun)(name);
        if (!result.ok)
            return res.status(400).json({ success: false, message: result.message, info: result.info });
        return res.json({ success: true, data: result.info });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'RESTORE_DRY_RUN_ERROR', message: 'Failed to perform dry-run' });
    }
});
// POST /api/admin/backups/:name/restore — start restore job
router.post('/:name/restore', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const name = req.params['name'];
        const result = await (0, backupService_1.startRestore)(name);
        if (!result.started)
            return res.status(400).json({ success: false, message: result.message });
        return res.json({ success: true, jobId: result.jobId });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'RESTORE_START_ERROR', message: 'Failed to start restore' });
    }
});
// GET /api/admin/backups/restore/:jobId — restore job status
// const statusLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }); // Disabled
router.get('/restore/:jobId', adminAuth_1.authenticateAdmin, async (req, res) => {
    try {
        const jobId = req.params['jobId'];
        const job = (0, backupService_1.getRestoreJob)(jobId);
        if (!job)
            return res.status(404).json({ success: false, message: 'Job not found' });
        // Avoid browser caching for polling endpoint
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.json({ success: true, data: job });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'RESTORE_STATUS_ERROR', message: 'Failed to fetch job status' });
    }
});
//# sourceMappingURL=backupRoutes.js.map