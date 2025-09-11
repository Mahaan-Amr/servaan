import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

export interface BackupFileInfo {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
}

export type RestoreJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
interface RestoreJob {
  id: string;
  backupName: string;
  createdAt: number;
  status: RestoreJobStatus;
  log: string[];
  error?: string;
}

const restoreJobs: Map<string, RestoreJob> = new Map();

const DEFAULT_BACKUP_DIR = process.env['ADMIN_BACKUP_DIR']
  || process.env['BACKUP_DIR']
  || (process.platform === 'win32' ? path.resolve(process.cwd(), '../../../backups') : '/opt/servaan/backups');

export function getBackupDirectory(): string {
  return DEFAULT_BACKUP_DIR;
}

export async function listBackups(): Promise<BackupFileInfo[]> {
  const dir = getBackupDirectory();
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = await fs.promises.readdir(dir);
  const files = entries.filter((f) => f.endsWith('_complete.tar.gz') || f.endsWith('.dump'));
  const stats = await Promise.all(
    files.map(async (name) => {
      const full = path.join(dir, name);
      const st = await fs.promises.stat(full);
      return {
        name,
        sizeBytes: st.size,
        modifiedAt: st.mtime.toISOString(),
      } as BackupFileInfo;
    })
  );
  // Sort newest first
  stats.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
  return stats;
}

export async function createBackup(): Promise<{ started: boolean; message: string }> {
  // Attempt to execute server-backup.sh if present
  const scriptPathCandidates: string[] = [
    path.resolve(process.cwd(), '../../../server-backup.sh'),
    '/opt/servaan/app/server-backup.sh',
  ];

  const scriptPath = scriptPathCandidates.find((p) => fs.existsSync(p));
  if (!scriptPath) {
    return { started: false, message: 'Backup script not found on this host' };
  }

  // On Windows, bash may not be present; try sh/bash accordingly
  const shell = process.platform === 'win32' ? 'bash' : '/bin/bash';

  return new Promise((resolve) => {
    const child = spawn(shell, [scriptPath], {
      env: process.env,
      detached: false,
      stdio: 'ignore',
    });
    child.on('spawn', () => resolve({ started: true, message: 'Backup started' }));
    child.on('error', () => resolve({ started: false, message: 'Failed to start backup process' }));
  });
}

export function resolveBackupPath(name: string): string {
  return path.join(getBackupDirectory(), name);
}


export async function restoreDryRun(name: string): Promise<{ ok: boolean; info: any; message?: string }> {
  const full = resolveBackupPath(name);
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return { ok: false, info: null, message: 'Invalid file name' };
  }
  if (!fs.existsSync(full)) {
    return { ok: false, info: null, message: 'Backup file not found' };
  }
  const st = await fs.promises.stat(full);
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

export function getRestoreJob(jobId: string): RestoreJob | undefined {
  return restoreJobs.get(jobId);
}

export async function startRestore(name: string): Promise<{ started: boolean; jobId?: string; message?: string }> {
  const dry = await restoreDryRun(name);
  if (!dry.ok) {
    return { started: false, message: dry.message || 'Dry-run validation failed' };
  }

  const jobId = crypto.randomUUID();
  const job: RestoreJob = { id: jobId, backupName: name, createdAt: Date.now(), status: 'queued', log: [] };
  restoreJobs.set(jobId, job);

  const full = resolveBackupPath(name);
  const isWin = process.platform === 'win32';
  const command = isWin ? 'cmd' : '/bin/bash';
  const args = isWin
    ? ['/c', 'restore-database.bat', full]
    : ['-lc', `echo "No Linux restore script wired; implement as needed"`];

  job.status = 'running';
  const child = spawn(command, args, { cwd: path.resolve(process.cwd(), '../../../'), env: { ...process.env, NON_INTERACTIVE: '1' } });
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
        await prisma.$queryRaw`SELECT 1`;
        job.status = 'succeeded';
      } catch (e: any) {
        job.status = 'failed';
        job.error = 'Health check failed after restore';
      }
    } else {
      job.status = 'failed';
      job.error = `Restore script exited with code ${code}`;
    }
  });

  return { started: true, jobId };
}


