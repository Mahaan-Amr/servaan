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
export declare function getBackupDirectory(): string;
export declare function listBackups(): Promise<BackupFileInfo[]>;
export declare function createBackup(): Promise<{
    started: boolean;
    message: string;
}>;
export declare function resolveBackupPath(name: string): string;
export declare function restoreDryRun(name: string): Promise<{
    ok: boolean;
    info: any;
    message?: string;
}>;
export declare function getRestoreJob(jobId: string): RestoreJob | undefined;
export declare function startRestore(name: string): Promise<{
    started: boolean;
    jobId?: string;
    message?: string;
}>;
export {};
//# sourceMappingURL=backupService.d.ts.map