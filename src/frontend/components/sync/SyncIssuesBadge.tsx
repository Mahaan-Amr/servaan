'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { localFirstSyncService } from '../../services/localFirstSyncService';
import { SyncIssueSummary } from '../../../shared/localFirst';

const emptySummary: SyncIssueSummary = {
  pendingCount: 0,
  failedCount: 0,
  conflictedCount: 0,
  waitingForDependencyCount: 0
};

export function SyncIssuesBadge() {
  const [summary, setSummary] = useState<SyncIssueSummary>(emptySummary);
  const [syncing, setSyncing] = useState(false);

  const issueCount = useMemo(
    () => summary.failedCount + summary.conflictedCount + summary.waitingForDependencyCount,
    [summary]
  );
  const totalCount = useMemo(
    () => issueCount + summary.pendingCount,
    [issueCount, summary.pendingCount]
  );

  const refresh = useCallback(async () => {
    try {
      setSummary(await localFirstSyncService.getIssueSummary());
    } catch {
      setSummary(emptySummary);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await localFirstSyncService.syncNow();
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 5000);
    const handleOnline = () => {
      syncNow().catch(() => refresh());
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [refresh, syncNow]);

  if (totalCount === 0) {
    return (
      <button
        type="button"
        title="Sync OK"
        onClick={syncNow}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      title={issueCount > 0 ? 'Sync issues' : 'Pending offline sync'}
      onClick={syncNow}
      disabled={syncing}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md ${
        issueCount > 0
          ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20'
          : 'text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20'
      } disabled:opacity-60`}
    >
      {syncing ? <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5" aria-hidden="true" />}
      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-5 text-white">
        {totalCount > 99 ? '99+' : totalCount}
      </span>
    </button>
  );
}
