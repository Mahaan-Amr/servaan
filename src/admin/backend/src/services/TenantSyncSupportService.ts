import { prisma } from '../lib/prisma';

type CountMap = Record<string, number>;

interface DeviceCountMap {
  operations: CountMap;
  openConflicts: number;
}

export interface TenantSyncSupportSummary {
  tenantId: string;
  generatedAt: string;
  retentionDays: number;
  rawPayloadsIncluded: false;
  totals: {
    devices: number;
    activeDevices: number;
    revokedDevices: number;
    operations: CountMap;
    openConflicts: number;
  };
  devices: TenantSyncSupportDevice[];
  recentOperations: TenantSyncSupportOperation[];
  openConflicts: TenantSyncSupportConflict[];
  recentSyncBatches: TenantSyncSupportBatch[];
  diagnosticCorrelation: {
    tenantId: string;
    deviceIds: string[];
    appVersions: string[];
    recentSyncBatchIds: string[];
    recentLocalOperationIds: string[];
  };
}

export interface TenantSyncSupportDevice {
  deviceId: string;
  name: string;
  platform: string;
  mode: string;
  appVersion: string | null;
  syncProtocolVersion: number;
  localSchemaVersion: number;
  assignedUserEmail: string | null;
  lastOnlineAt: string | null;
  lastSyncAt: string | null;
  offlineAuthExpiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
  counts: {
    operations: CountMap;
    openConflicts: number;
  };
}

export interface TenantSyncSupportOperation {
  id: string;
  deviceId: string;
  localOperationId: string;
  syncBatchId: string | null;
  workspaceId: string;
  entityType: string;
  entityLocalId: string | null;
  entityServerId: string | null;
  operationType: string;
  status: string;
  dependencyCount: number;
  errorCode: string | null;
  errorMessagePreview: string | null;
  createdOfflineAt: string;
  syncedAt: string | null;
  updatedAt: string;
}

export interface TenantSyncSupportConflict {
  id: string;
  deviceId: string;
  localOperationId: string | null;
  syncBatchId: string | null;
  workspaceId: string;
  entityType: string;
  entityLocalId: string | null;
  entityServerId: string | null;
  conflictType: string;
  status: string;
  reasonPreview: string;
  createdOfflineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSyncSupportBatch {
  syncBatchId: string;
  lastSeenAt: string;
  statuses: CountMap;
  deviceIds: string[];
}

export class TenantSyncSupportService {
  static async getTenantSyncSupport(tenantId: string): Promise<TenantSyncSupportSummary> {
    const [tenant, devices, operationCounts, conflictCounts, recentOperations, openConflicts, recentBatchRows] =
      await Promise.all([
        prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true }
        }),
        prisma.offlineDevice.findMany({
          where: { tenantId },
          orderBy: [{ revokedAt: 'asc' }, { updatedAt: 'desc' }],
          select: {
            deviceId: true,
            name: true,
            platform: true,
            mode: true,
            appVersion: true,
            syncProtocolVersion: true,
            localSchemaVersion: true,
            lastOnlineAt: true,
            lastSyncAt: true,
            offlineAuthExpiresAt: true,
            revokedAt: true,
            isActive: true,
            assignedUser: {
              select: {
                email: true
              }
            }
          }
        }),
        prisma.syncOperation.groupBy({
          by: ['deviceId', 'status'],
          where: { tenantId },
          _count: { _all: true }
        }),
        prisma.syncConflict.groupBy({
          by: ['deviceId', 'status'],
          where: { tenantId, status: 'open' },
          _count: { _all: true }
        }),
        prisma.syncOperation.findMany({
          where: { tenantId },
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            deviceId: true,
            localOperationId: true,
            syncBatchId: true,
            workspaceId: true,
            entityType: true,
            entityLocalId: true,
            entityServerId: true,
            operationType: true,
            status: true,
            dependsOn: true,
            errorCode: true,
            errorMessage: true,
            createdOfflineAt: true,
            syncedAt: true,
            updatedAt: true
          }
        }),
        prisma.syncConflict.findMany({
          where: { tenantId, status: 'open' },
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            deviceId: true,
            localOperationId: true,
            syncBatchId: true,
            workspaceId: true,
            entityType: true,
            entityLocalId: true,
            entityServerId: true,
            conflictType: true,
            status: true,
            reason: true,
            createdOfflineAt: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.syncOperation.findMany({
          where: {
            tenantId,
            syncBatchId: { not: null }
          },
          orderBy: { updatedAt: 'desc' },
          take: 200,
          select: {
            syncBatchId: true,
            status: true,
            deviceId: true,
            updatedAt: true
          }
        })
      ]);

    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    const countsByDevice = buildDeviceCounts(operationCounts, conflictCounts);
    const totalOperationCounts = sumOperationCounts(operationCounts);
    const mappedDevices = devices.map((device) => {
      const counts = countsByDevice[device.deviceId] || { operations: {}, openConflicts: 0 };

      return {
        deviceId: device.deviceId,
        name: device.name,
        platform: device.platform,
        mode: device.mode,
        appVersion: device.appVersion,
        syncProtocolVersion: device.syncProtocolVersion,
        localSchemaVersion: device.localSchemaVersion,
        assignedUserEmail: device.assignedUser?.email || null,
        lastOnlineAt: toIsoOrNull(device.lastOnlineAt),
        lastSyncAt: toIsoOrNull(device.lastSyncAt),
        offlineAuthExpiresAt: toIsoOrNull(device.offlineAuthExpiresAt),
        revokedAt: toIsoOrNull(device.revokedAt),
        isActive: device.isActive,
        counts
      };
    });

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      retentionDays: 90,
      rawPayloadsIncluded: false,
      totals: {
        devices: devices.length,
        activeDevices: devices.filter((device) => device.isActive && !device.revokedAt).length,
        revokedDevices: devices.filter((device) => Boolean(device.revokedAt)).length,
        operations: totalOperationCounts,
        openConflicts: conflictCounts.reduce((total, row) => total + row._count._all, 0)
      },
      devices: mappedDevices,
      recentOperations: recentOperations.map((operation) => ({
        id: operation.id,
        deviceId: operation.deviceId,
        localOperationId: operation.localOperationId,
        syncBatchId: operation.syncBatchId,
        workspaceId: operation.workspaceId,
        entityType: operation.entityType,
        entityLocalId: operation.entityLocalId,
        entityServerId: operation.entityServerId,
        operationType: operation.operationType,
        status: operation.status,
        dependencyCount: countJsonArray(operation.dependsOn),
        errorCode: operation.errorCode,
        errorMessagePreview: createRedactedPreview(operation.errorMessage),
        createdOfflineAt: operation.createdOfflineAt.toISOString(),
        syncedAt: toIsoOrNull(operation.syncedAt),
        updatedAt: operation.updatedAt.toISOString()
      })),
      openConflicts: openConflicts.map((conflict) => ({
        id: conflict.id,
        deviceId: conflict.deviceId,
        localOperationId: conflict.localOperationId,
        syncBatchId: conflict.syncBatchId,
        workspaceId: conflict.workspaceId,
        entityType: conflict.entityType,
        entityLocalId: conflict.entityLocalId,
        entityServerId: conflict.entityServerId,
        conflictType: conflict.conflictType,
        status: conflict.status,
        reasonPreview: createRedactedPreview(conflict.reason) || 'Conflict reason unavailable.',
        createdOfflineAt: toIsoOrNull(conflict.createdOfflineAt),
        createdAt: conflict.createdAt.toISOString(),
        updatedAt: conflict.updatedAt.toISOString()
      })),
      recentSyncBatches: buildRecentBatches(recentBatchRows),
      diagnosticCorrelation: {
        tenantId,
        deviceIds: mappedDevices.map((device) => device.deviceId),
        appVersions: uniqueStrings(mappedDevices.map((device) => device.appVersion)),
        recentSyncBatchIds: uniqueStrings(recentBatchRows.map((row) => row.syncBatchId)).slice(0, 20),
        recentLocalOperationIds: recentOperations.map((operation) => operation.localOperationId).slice(0, 20)
      }
    };
  }
}

function buildDeviceCounts(
  operationCounts: Array<{ deviceId: string; status: string; _count: { _all: number } }>,
  conflictCounts: Array<{ deviceId: string; _count: { _all: number } }>
): Record<string, DeviceCountMap> {
  const countsByDevice: Record<string, DeviceCountMap> = {};

  for (const row of operationCounts) {
    const current = countsByDevice[row.deviceId] || { operations: {}, openConflicts: 0 };
    current.operations[row.status] = row._count._all;
    countsByDevice[row.deviceId] = current;
  }

  for (const row of conflictCounts) {
    const current = countsByDevice[row.deviceId] || { operations: {}, openConflicts: 0 };
    current.openConflicts = row._count._all;
    countsByDevice[row.deviceId] = current;
  }

  return countsByDevice;
}

function sumOperationCounts(
  operationCounts: Array<{ status: string; _count: { _all: number } }>
): CountMap {
  return operationCounts.reduce<CountMap>((totals, row) => {
    totals[row.status] = (totals[row.status] || 0) + row._count._all;
    return totals;
  }, {});
}

function buildRecentBatches(
  rows: Array<{ syncBatchId: string | null; status: string; deviceId: string; updatedAt: Date }>
): TenantSyncSupportBatch[] {
  const batches = new Map<string, TenantSyncSupportBatch>();

  for (const row of rows) {
    if (!row.syncBatchId) continue;

    const existing = batches.get(row.syncBatchId);
    if (existing) {
      existing.statuses[row.status] = (existing.statuses[row.status] || 0) + 1;
      if (!existing.deviceIds.includes(row.deviceId)) {
        existing.deviceIds.push(row.deviceId);
      }
      if (Date.parse(existing.lastSeenAt) < row.updatedAt.getTime()) {
        existing.lastSeenAt = row.updatedAt.toISOString();
      }
      continue;
    }

    batches.set(row.syncBatchId, {
      syncBatchId: row.syncBatchId,
      lastSeenAt: row.updatedAt.toISOString(),
      statuses: { [row.status]: 1 },
      deviceIds: [row.deviceId]
    });
  }

  return Array.from(batches.values()).slice(0, 20);
}

function countJsonArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function toIsoOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function uniqueStrings(values: Array<string | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function createRedactedPreview(message: string | null, maxLength = 240): string | null {
  if (!message) return null;

  const withoutStack = message
    .split(/\r?\n/)
    .filter((line) => !/^\s*at\s+/.test(line) && !/^\s*stack:/i.test(line))
    .join(' ')
    .trim();
  const redacted = withoutStack
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-token]')
    .replace(/\b(token|authorization|password|pin|secret)=([^&\s]+)/gi, '$1=[redacted]')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[redacted-value]');

  if (redacted.length <= maxLength) return redacted;
  return `${redacted.slice(0, maxLength - 3)}...`;
}
