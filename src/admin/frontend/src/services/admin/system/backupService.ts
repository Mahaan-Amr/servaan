import adminApi from '../../adminAuthService';

export interface BackupFileInfo {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
}

export async function listBackups(): Promise<BackupFileInfo[]> {
  const res = await adminApi.get('/admin/backups');
  return res.data.data as BackupFileInfo[];
}

export async function triggerBackup(): Promise<{ success: boolean; message: string }> {
  const res = await adminApi.post('/admin/backups');
  return res.data;
}

export function getDownloadUrl(name: string): string {
  return `${(adminApi.defaults.baseURL || '').replace(/\/$/, '')}/admin/backups/${encodeURIComponent(name)}/download`;
}

export async function downloadBackup(name: string): Promise<void> {
  try {
    const response = await adminApi.get(`/admin/backups/${encodeURIComponent(name)}/download`, {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

export async function restoreDryRun(name: string) {
  const res = await adminApi.post(`/admin/backups/${encodeURIComponent(name)}/restore/dry-run`);
  return res.data;
}

export async function startRestore(name: string) {
  const res = await adminApi.post(`/admin/backups/${encodeURIComponent(name)}/restore`);
  return res.data;
}

export async function getRestoreStatus(jobId: string) {
  const res = await adminApi.get(`/admin/backups/restore/${encodeURIComponent(jobId)}`);
  return res.data;
}


