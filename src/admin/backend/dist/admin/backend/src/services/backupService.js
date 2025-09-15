"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackupDirectory = getBackupDirectory;
exports.listBackups = listBackups;
exports.createBackup = createBackup;
exports.resolveBackupPath = resolveBackupPath;
exports.restoreDryRun = restoreDryRun;
exports.getRestoreJob = getRestoreJob;
exports.startRestore = startRestore;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const restoreJobs = new Map();
const DEFAULT_BACKUP_DIR = process.env['ADMIN_BACKUP_DIR']
    || process.env['BACKUP_DIR']
    || (process.platform === 'win32' ? path_1.default.resolve(process.cwd(), '../../../backups') : '/opt/servaan/backups');
function getBackupDirectory() {
    return DEFAULT_BACKUP_DIR;
}
async function listBackups() {
    const dir = getBackupDirectory();
    if (!fs_1.default.existsSync(dir)) {
        return [];
    }
    const entries = await fs_1.default.promises.readdir(dir);
    const files = entries.filter((f) => f.endsWith('_complete.tar.gz') || f.endsWith('.dump'));
    const stats = await Promise.all(files.map(async (name) => {
        const full = path_1.default.join(dir, name);
        const st = await fs_1.default.promises.stat(full);
        return {
            name,
            sizeBytes: st.size,
            modifiedAt: st.mtime.toISOString(),
        };
    }));
    // Sort newest first
    stats.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
    return stats;
}
async function createBackup() {
    // Attempt to execute server-backup.sh if present
    const scriptPathCandidates = [
        path_1.default.resolve(process.cwd(), '../../../server-backup.sh'),
        '/opt/servaan/app/server-backup.sh',
    ];
    const scriptPath = scriptPathCandidates.find((p) => fs_1.default.existsSync(p));
    if (!scriptPath) {
        return { started: false, message: 'Backup script not found on this host' };
    }
    // On Windows, bash may not be present; try sh/bash accordingly
    const shell = process.platform === 'win32' ? 'bash' : '/bin/bash';
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)(shell, [scriptPath], {
            env: process.env,
            detached: false,
            stdio: 'ignore',
        });
        child.on('spawn', () => resolve({ started: true, message: 'Backup started' }));
        child.on('error', () => resolve({ started: false, message: 'Failed to start backup process' }));
    });
}
function resolveBackupPath(name) {
    return path_1.default.join(getBackupDirectory(), name);
}
async function restoreDryRun(name) {
    const full = resolveBackupPath(name);
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
        return { ok: false, info: null, message: 'Invalid file name' };
    }
    if (!fs_1.default.existsSync(full)) {
        return { ok: false, info: null, message: 'Backup file not found' };
    }
    const st = await fs_1.default.promises.stat(full);
    // Very light validation
    const allowed = ['.dump', '.tar.gz'];
    const extOk = allowed.some(ext => full.endsWith(ext));
    return {
        ok: extOk,
        info: {
            name,
            path: full,
            sizeBytes: st.size,
            modifiedAt: st.mtime.toISOString(),
            willRun: process.platform === 'win32' ? 'restore-database.bat' : 'server-backup.sh (restore path not implemented)'
        },
        ...(extOk ? {} : { message: 'File extension not supported for automated restore' })
    };
}
function getRestoreJob(jobId) {
    return restoreJobs.get(jobId);
}
async function startRestore(name) {
    const dry = await restoreDryRun(name);
    if (!dry.ok) {
        return { started: false, message: dry.message || 'Dry-run validation failed' };
    }
    const jobId = crypto_1.default.randomUUID();
    const job = { id: jobId, backupName: name, createdAt: Date.now(), status: 'queued', log: [] };
    restoreJobs.set(jobId, job);
    const full = resolveBackupPath(name);
    const isWin = process.platform === 'win32';
    const command = isWin ? 'cmd' : '/bin/bash';
    const args = isWin
        ? ['/c', 'restore-database.bat', full]
        : ['-lc', `echo "No Linux restore script wired; implement as needed"`];
    job.status = 'running';
    const child = (0, child_process_1.spawn)(command, args, { cwd: path_1.default.resolve(process.cwd(), '../../../'), env: { ...process.env, NON_INTERACTIVE: '1' } });
    child.stdout?.on('data', (d) => job.log.push(String(d)));
    child.stderr?.on('data', (d) => job.log.push(String(d)));
    child.on('error', (err) => {
        job.status = 'failed';
        job.error = err.message;
    });
    child.on('close', async (code) => {
        if (code === 0) {
            // Post-restore health check: simple DB connectivity
            try {
                await prisma_1.prisma.$queryRaw `SELECT 1`;
                job.status = 'succeeded';
            }
            catch (e) {
                job.status = 'failed';
                job.error = 'Health check failed after restore';
            }
        }
        else {
            job.status = 'failed';
            job.error = `Restore script exited with code ${code}`;
        }
    });
    return { started: true, jobId };
}
//# sourceMappingURL=backupService.js.map