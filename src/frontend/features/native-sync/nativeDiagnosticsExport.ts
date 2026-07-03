import type { NativeV1CacheReadiness } from '../../services/nativeBusinessCacheService';
import type { NativeDeviceSetup } from '../../services/nativeDeviceService';
import type { SyncIssueSummary } from '../../../shared/localFirst';
import type { NativeSyncIssueGroup, NativeSyncIssueRow } from './nativeSyncIssues';

export interface NativeDiagnosticUserContext {
  id: string;
  role: string;
  tenantId?: string | null;
}

export interface NativeDiagnosticExportInput {
  exportedAt?: string;
  appVersion: string;
  device: NativeDeviceSetup | null;
  user: NativeDiagnosticUserContext | null;
  cacheReadiness: NativeV1CacheReadiness | null;
  issueSummary: SyncIssueSummary;
  syncGroups: NativeSyncIssueGroup[];
}

export interface NativeDiagnosticExportPayload {
  exportedAt: string;
  app: string;
  version: string;
  exportType: 'operator_redacted_diagnostics';
  redaction: {
    rawPayloadsIncluded: false;
    authSecretsIncluded: false;
    localReadModelsIncluded: false;
    privilegedRecoveryDataIncluded: false;
  };
  device: {
    deviceName?: string;
    deviceProfile?: string;
    setupComplete: boolean;
    lastWorkspaceMode?: string;
    printerConfigured: boolean;
  } | null;
  user: {
    id: string;
    role: string;
    tenantId?: string | null;
  } | null;
  cache: {
    ready: boolean;
    missingKeys: string[];
    updatedAt?: string;
  } | null;
  sync: {
    issueSummary: SyncIssueSummary;
    unsyncedOperationCount: number;
    groups: NativeDiagnosticSyncGroup[];
  };
}

interface NativeDiagnosticSyncGroup {
  key: NativeSyncIssueGroup['key'];
  title: string;
  count: number;
  rows: NativeDiagnosticOperationRow[];
}

interface NativeDiagnosticOperationRow {
  localOperationId: string;
  operationType: string;
  operationTypeLabel: string;
  status: NativeSyncIssueRow['status'];
  statusLabel: string;
  localNumber: string;
  createdAt: string;
  primaryText: string;
  secondaryText: string;
  dependencyCount: number;
  dependencyState: NativeSyncIssueRow['dependencyState'];
  error?: NativeSyncIssueRow['error'];
  helperText?: string;
}

export function buildNativeDiagnosticsExport(input: NativeDiagnosticExportInput): NativeDiagnosticExportPayload {
  const groups = input.syncGroups.map((group) => ({
    key: group.key,
    title: group.title,
    count: group.rows.length,
    rows: group.rows.map(toDiagnosticOperationRow)
  }));

  return {
    exportedAt: input.exportedAt || new Date().toISOString(),
    app: 'سروان بومی',
    version: input.appVersion,
    exportType: 'operator_redacted_diagnostics',
    redaction: {
      rawPayloadsIncluded: false,
      authSecretsIncluded: false,
      localReadModelsIncluded: false,
      privilegedRecoveryDataIncluded: false
    },
    device: input.device
      ? {
          deviceName: input.device.deviceName,
          deviceProfile: input.device.deviceProfile,
          setupComplete: Boolean(input.device.setupComplete),
          lastWorkspaceMode: input.device.lastWorkspaceMode,
          printerConfigured: Boolean(input.device.printerName)
        }
      : null,
    user: input.user
      ? {
          id: input.user.id,
          role: input.user.role,
          tenantId: input.user.tenantId
        }
      : null,
    cache: input.cacheReadiness
      ? {
          ready: input.cacheReadiness.ready,
          missingKeys: input.cacheReadiness.missing,
          updatedAt: input.cacheReadiness.updatedAt
        }
      : null,
    sync: {
      issueSummary: input.issueSummary,
      unsyncedOperationCount: groups.reduce((total, group) => total + group.count, 0),
      groups
    }
  };
}

function toDiagnosticOperationRow(row: NativeSyncIssueRow): NativeDiagnosticOperationRow {
  return {
    localOperationId: row.id,
    operationType: row.operationType,
    operationTypeLabel: row.typeLabel,
    status: row.status,
    statusLabel: row.statusLabel,
    localNumber: row.localNumber,
    createdAt: row.createdAt,
    primaryText: row.primaryText,
    secondaryText: row.secondaryText,
    dependencyCount: row.dependencyCount,
    dependencyState: row.dependencyState,
    error: row.error,
    helperText: row.helperText
  };
}
