import { LocalOperation, LocalOperationStatus, SyncIssueSummary } from './types';

const BLOCKING_STATUSES = new Set<LocalOperationStatus>([
  'pending',
  'syncing',
  'failed',
  'conflicted',
  'waiting_for_dependency'
]);

export function getReadyOperations(operations: LocalOperation[]): LocalOperation[] {
  const byId = new Map(operations.map((operation) => [operation.localOperationId, operation]));
  const unsyncedIds = new Set(
    operations
      .filter((operation) => BLOCKING_STATUSES.has(operation.status))
      .map((operation) => operation.localOperationId)
  );

  return operations
    .filter((operation) =>
      ['pending', 'failed', 'syncing', 'waiting_for_dependency'].includes(operation.status)
    )
    .filter((operation) => {
      return operation.dependsOn.every((dependencyId) => {
        const dependency = byId.get(dependencyId);
        return !dependency || dependency.status === 'synced' || !unsyncedIds.has(dependencyId);
      });
    })
    .sort((a, b) => Date.parse(a.createdOfflineAt) - Date.parse(b.createdOfflineAt));
}

export function markDependencyWaits(operations: LocalOperation[]): LocalOperation[] {
  const readyIds = new Set(getReadyOperations(operations).map((operation) => operation.localOperationId));

  return operations.map((operation) => {
    if (!['pending', 'failed', 'syncing', 'waiting_for_dependency'].includes(operation.status)) {
      return operation;
    }

    if (operation.dependsOn.length === 0 || readyIds.has(operation.localOperationId)) {
      return operation.status === 'waiting_for_dependency' || operation.status === 'syncing'
        ? { ...operation, status: 'pending' }
        : operation;
    }

    return { ...operation, status: 'waiting_for_dependency' };
  });
}

export function summarizeSyncIssues(operations: LocalOperation[]): SyncIssueSummary {
  return operations.reduce<SyncIssueSummary>(
    (summary, operation) => {
      if (operation.status === 'pending' || operation.status === 'syncing') summary.pendingCount += 1;
      if (operation.status === 'failed') summary.failedCount += 1;
      if (operation.status === 'conflicted') summary.conflictedCount += 1;
      if (operation.status === 'waiting_for_dependency') summary.waitingForDependencyCount += 1;
      return summary;
    },
    {
      pendingCount: 0,
      failedCount: 0,
      conflictedCount: 0,
      waitingForDependencyCount: 0
    }
  );
}

export function applyEntityMappings(
  operations: LocalOperation[],
  mappings: Array<{ localId: string; serverId: string; entityType: string }>
): LocalOperation[] {
  if (mappings.length === 0) return operations;

  const mappingByLocalId = new Map(mappings.map((mapping) => [mapping.localId, mapping]));

  return operations.map((operation) => {
    const mappedEntity = operation.entityLocalId ? mappingByLocalId.get(operation.entityLocalId) : undefined;
    const mappedPayload = replaceLocalIds(operation.payload, mappingByLocalId);

    return {
      ...operation,
      entityServerId: mappedEntity?.serverId || operation.entityServerId,
      payload: mappedPayload
    };
  });
}

function replaceLocalIds(value: unknown, mappingByLocalId: Map<string, { serverId: string }>): unknown {
  if (typeof value === 'string') {
    return mappingByLocalId.get(value)?.serverId || value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceLocalIds(item, mappingByLocalId));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        replaceLocalIds(nestedValue, mappingByLocalId)
      ])
    );
  }

  return value;
}
