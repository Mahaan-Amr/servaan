'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Database, Monitor, RefreshCw, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getTenantSyncSupport,
  TenantSyncSupportSummary
} from '@/services/admin/tenants/tenantService';
import { formatAdminDate } from '@/utils/persianDate';

interface TenantSyncSupportPanelProps {
  tenantId: string;
}

export default function TenantSyncSupportPanel({ tenantId }: TenantSyncSupportPanelProps) {
  const [summary, setSummary] = useState<TenantSyncSupportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      setSummary(await getTenantSyncSupport(tenantId));
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load sync support summary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-admin-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-admin-text-light">Loading sync support summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="border border-admin-danger/30 bg-red-50 rounded-admin p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-admin-danger mx-auto mb-3" />
        <p className="text-admin-text mb-4">{error || 'Sync support summary is unavailable.'}</p>
        <button onClick={loadSummary} className="btn-admin-secondary inline-flex items-center">
          <RefreshCw className="h-4 w-4 ml-2" />
          Retry
        </button>
      </div>
    );
  }

  const acceptedCount = summary.totals.operations.accepted || 0;
  const rejectedCount = summary.totals.operations.rejected || 0;
  const conflictedCount = summary.totals.operations.conflicted || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-admin-text">Desktop sync support</h3>
          <p className="text-sm text-admin-text-light">
            Read-only observability. Raw operation payloads are not included.
          </p>
        </div>
        <button onClick={loadSummary} className="btn-admin-secondary flex items-center">
          <RefreshCw className="h-4 w-4 ml-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryTile
          icon={Monitor}
          label="Devices"
          value={`${summary.totals.activeDevices}/${summary.totals.devices}`}
          helper={`${summary.totals.revokedDevices} revoked`}
          tone="blue"
        />
        <SummaryTile
          icon={CheckCircle}
          label="Accepted ops"
          value={formatNumber(acceptedCount)}
          helper="Confirmed by backend"
          tone="green"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Rejected ops"
          value={formatNumber(rejectedCount)}
          helper={`${formatNumber(conflictedCount)} conflicted`}
          tone={rejectedCount || conflictedCount ? 'red' : 'gray'}
        />
        <SummaryTile
          icon={ShieldCheck}
          label="Retention"
          value={`${summary.retentionDays} days`}
          helper={summary.rawPayloadsIncluded ? 'Raw payloads included' : 'No raw payloads'}
          tone="purple"
        />
      </div>

      <section>
        <h4 className="text-base font-semibold text-admin-text mb-3">Diagnostic correlation</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CorrelationBox label="Tenant ID" values={[summary.diagnosticCorrelation.tenantId]} />
          <CorrelationBox label="Recent batch IDs" values={summary.diagnosticCorrelation.recentSyncBatchIds} />
          <CorrelationBox label="App versions" values={summary.diagnosticCorrelation.appVersions} />
        </div>
      </section>

      <section>
        <h4 className="text-base font-semibold text-admin-text mb-3">Devices</h4>
        <div className="overflow-x-auto border border-admin-border rounded-admin">
          <table className="min-w-full divide-y divide-admin-border">
            <thead className="bg-admin-bg">
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead>Counts</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-admin-border">
              {summary.devices.map((device) => (
                <tr key={device.deviceId}>
                  <TableCell>
                    <div className="font-medium text-admin-text">{device.name}</div>
                    <div className="text-xs text-admin-text-muted">{device.platform} / {device.mode}</div>
                  </TableCell>
                  <TableCell mono>{device.deviceId}</TableCell>
                  <TableCell>
                    <div>{device.appVersion || 'unknown'}</div>
                    <div className="text-xs text-admin-text-muted">
                      sync {device.syncProtocolVersion} / schema {device.localSchemaVersion}
                    </div>
                  </TableCell>
                  <TableCell>{formatNullableDate(device.lastSyncAt)}</TableCell>
                  <TableCell>
                    <StatusCounts counts={device.counts.operations} />
                    {device.counts.openConflicts > 0 && (
                      <div className="text-xs text-admin-danger mt-1">
                        {formatNumber(device.counts.openConflicts)} open conflicts
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={device.isActive} revoked={Boolean(device.revokedAt)} />
                  </TableCell>
                </tr>
              ))}
              {summary.devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-admin-text-light">
                    No registered offline devices.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-semibold text-admin-text mb-3">Recent sync batches</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {summary.recentSyncBatches.map((batch) => (
            <div key={batch.syncBatchId} className="border border-admin-border rounded-admin p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-admin-text break-all">{batch.syncBatchId}</p>
                  <p className="text-xs text-admin-text-muted mt-1">{formatNullableDate(batch.lastSeenAt)}</p>
                </div>
                <Database className="h-5 w-5 text-admin-primary flex-shrink-0" />
              </div>
              <div className="mt-3">
                <StatusCounts counts={batch.statuses} />
              </div>
              <p className="text-xs text-admin-text-muted mt-3">
                Devices: {batch.deviceIds.join(', ')}
              </p>
            </div>
          ))}
          {summary.recentSyncBatches.length === 0 && (
            <p className="text-sm text-admin-text-light">No sync batches recorded yet.</p>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-base font-semibold text-admin-text mb-3">Recent operations</h4>
        <div className="overflow-x-auto border border-admin-border rounded-admin">
          <table className="min-w-full divide-y divide-admin-border">
            <thead className="bg-admin-bg">
              <tr>
                <TableHead>Operation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Error preview</TableHead>
                <TableHead>Updated</TableHead>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-admin-border">
              {summary.recentOperations.map((operation) => (
                <tr key={operation.id}>
                  <TableCell>
                    <div className="font-medium text-admin-text">{operation.operationType}</div>
                    <div className="text-xs text-admin-text-muted">
                      {operation.entityType} / deps {operation.dependencyCount}
                    </div>
                    <div className="font-mono text-xs text-admin-text-muted break-all">
                      {operation.localOperationId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={operation.status} />
                  </TableCell>
                  <TableCell mono>{operation.deviceId}</TableCell>
                  <TableCell mono>{operation.syncBatchId || '-'}</TableCell>
                  <TableCell>
                    {operation.errorCode && <div className="text-xs font-medium">{operation.errorCode}</div>}
                    <div className="text-xs text-admin-text-light max-w-xs">{operation.errorMessagePreview || '-'}</div>
                  </TableCell>
                  <TableCell>{formatNullableDate(operation.updatedAt)}</TableCell>
                </tr>
              ))}
              {summary.recentOperations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-admin-text-light">
                    No sync operations recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-semibold text-admin-text mb-3">Open conflicts</h4>
        <div className="space-y-3">
          {summary.openConflicts.map((conflict) => (
            <div key={conflict.id} className="border border-admin-border rounded-admin p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-admin-text">{conflict.conflictType}</p>
                  <p className="text-sm text-admin-text-light">{conflict.reasonPreview}</p>
                </div>
                <StatusPill status={conflict.status} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs text-admin-text-muted">
                <div>Device: <span className="font-mono">{conflict.deviceId}</span></div>
                <div>Batch: <span className="font-mono">{conflict.syncBatchId || '-'}</span></div>
                <div>Updated: {formatNullableDate(conflict.updatedAt)}</div>
              </div>
            </div>
          ))}
          {summary.openConflicts.length === 0 && (
            <p className="text-sm text-admin-text-light">No open conflicts.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  helper,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: 'blue' | 'green' | 'red' | 'purple' | 'gray';
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700'
  };

  return (
    <div className={`rounded-admin p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs opacity-80 mt-1">{helper}</p>
        </div>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
    </div>
  );
}

function CorrelationBox({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="border border-admin-border rounded-admin p-4">
      <p className="text-sm font-medium text-admin-text mb-2">{label}</p>
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {values.length > 0 ? (
          values.map((value) => (
            <p key={value} className="font-mono text-xs text-admin-text-light break-all">
              {value}
            </p>
          ))
        ) : (
          <p className="text-xs text-admin-text-muted">None</p>
        )}
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">
      {children}
    </th>
  );
}

function TableCell({
  children,
  mono = false
}: {
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <td className={`px-4 py-3 text-sm text-admin-text align-top ${mono ? 'font-mono text-xs break-all' : ''}`}>
      {children}
    </td>
  );
}

function StatusCounts({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return <span className="text-xs text-admin-text-muted">No operations</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([status, count]) => (
        <span key={status} className="inline-flex items-center rounded-admin bg-admin-bg px-2 py-1 text-xs text-admin-text">
          {status}: {formatNumber(count)}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ active, revoked }: { active: boolean; revoked: boolean }) {
  if (revoked) {
    return <span className="inline-flex rounded-admin bg-red-100 px-2 py-1 text-xs text-red-700">Revoked</span>;
  }

  return active ? (
    <span className="inline-flex rounded-admin bg-green-100 px-2 py-1 text-xs text-green-700">Active</span>
  ) : (
    <span className="inline-flex rounded-admin bg-gray-100 px-2 py-1 text-xs text-gray-700">Inactive</span>
  );
}

function StatusPill({ status }: { status: string }) {
  const isAttention = ['rejected', 'conflicted', 'open', 'failed'].includes(status);
  return (
    <span className={`inline-flex rounded-admin px-2 py-1 text-xs ${isAttention ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
      {status}
    </span>
  );
}

function formatNullableDate(value: string | null): string {
  if (!value) return '-';
  return formatAdminDate(value, { format: 'relative' });
}

function formatNumber(value: number): string {
  return value.toLocaleString('fa-IR');
}
