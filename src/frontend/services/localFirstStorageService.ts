import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { isDesktopApp, getDesktopStoreValue, listDesktopStoreValues, setDesktopStoreValue } from './desktopBridgeService';
import {
  applyEntityMappings,
  DeviceRegistration,
  EntityMapping,
  LocalOperation,
  markDependencyWaits,
  OfflineAuthCacheEntry,
  summarizeSyncIssues,
  SyncIssueSummary
} from '../../shared/localFirst';

const DB_NAME = 'servaan_local_first';
const DB_VERSION = 1;
const DESKTOP_STORE = {
  localOperations: 'local_first.local_operations',
  entityMappings: 'local_first.entity_mappings',
  syncCursors: 'local_first.sync_cursors',
  offlineAuth: 'local_first.offline_auth',
  deviceMetadata: 'local_first.device_metadata'
} as const;

interface LocalFirstDb extends DBSchema {
  local_operations: {
    key: string;
    value: LocalOperation;
    indexes: {
      status: string;
      createdOfflineAt: string;
      workspaceId: string;
    };
  };
  entity_mappings: {
    key: string;
    value: EntityMapping;
    indexes: {
      entityType: string;
    };
  };
  sync_cursors: {
    key: string;
    value: {
      scope: string;
      cursor: string;
      updatedAt: string;
    };
  };
  offline_auth: {
    key: string;
    value: OfflineAuthCacheEntry;
    indexes: {
      tenantId: string;
      userId: string;
    };
  };
  device_metadata: {
    key: string;
    value: DeviceRegistration & {
      tenantId?: string;
      registeredAt?: string;
      offlineAuthExpiresAt?: string;
    };
  };
}

class LocalFirstStorageService {
  private dbPromise: Promise<IDBPDatabase<LocalFirstDb>> | null = null;

  private getDb() {
    if (isDesktopApp()) {
      throw new Error('Desktop SQLite store is used instead of IndexedDB.');
    }

    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available.');
    }

    if (!this.dbPromise) {
      this.dbPromise = openDB<LocalFirstDb>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('local_operations')) {
            const operations = db.createObjectStore('local_operations', { keyPath: 'localOperationId' });
            operations.createIndex('status', 'status');
            operations.createIndex('createdOfflineAt', 'createdOfflineAt');
            operations.createIndex('workspaceId', 'workspaceId');
          }

          if (!db.objectStoreNames.contains('entity_mappings')) {
            const mappings = db.createObjectStore('entity_mappings', { keyPath: 'localId' });
            mappings.createIndex('entityType', 'entityType');
          }

          if (!db.objectStoreNames.contains('sync_cursors')) {
            db.createObjectStore('sync_cursors', { keyPath: 'scope' });
          }

          if (!db.objectStoreNames.contains('offline_auth')) {
            const auth = db.createObjectStore('offline_auth', { keyPath: 'userId' });
            auth.createIndex('tenantId', 'tenantId');
            auth.createIndex('userId', 'userId');
          }

          if (!db.objectStoreNames.contains('device_metadata')) {
            db.createObjectStore('device_metadata', { keyPath: 'deviceId' });
          }
        }
      });
    }

    return this.dbPromise;
  }

  private isDesktop() {
    return isDesktopApp();
  }

  async appendOperation(operation: LocalOperation): Promise<void> {
    if (this.isDesktop()) {
      await setDesktopStoreValue(DESKTOP_STORE.localOperations, operation.localOperationId, operation);
      return;
    }

    const db = await this.getDb();
    await db.put('local_operations', operation);
  }

  async getAllOperations(): Promise<LocalOperation[]> {
    if (this.isDesktop()) {
      const records = await listDesktopStoreValues<LocalOperation>(DESKTOP_STORE.localOperations);
      return records.map((record) => record.value);
    }

    const db = await this.getDb();
    return db.getAll('local_operations');
  }

  async getPendingOperations(): Promise<LocalOperation[]> {
    const operations = await this.getAllOperations();
    return markDependencyWaits(operations).filter((operation) =>
      ['pending', 'failed', 'waiting_for_dependency'].includes(operation.status)
    );
  }

  async getUnsyncedOperations(): Promise<LocalOperation[]> {
    const operations = await this.getAllOperations();
    const operationsById = new Map(operations.map((operation) => [operation.localOperationId, operation]));

    return markDependencyWaits(operations)
      .map((operation) => {
        const original = operationsById.get(operation.localOperationId);
        return original?.status === 'syncing' ? original : operation;
      })
      .filter((operation) => operation.status !== 'synced');
  }

  async updateOperation(operation: LocalOperation): Promise<void> {
    if (this.isDesktop()) {
      await setDesktopStoreValue(DESKTOP_STORE.localOperations, operation.localOperationId, operation);
      return;
    }

    const db = await this.getDb();
    await db.put('local_operations', operation);
  }

  async updateOperations(operations: LocalOperation[]): Promise<void> {
    if (this.isDesktop()) {
      await Promise.all(
        operations.map((operation) =>
          setDesktopStoreValue(DESKTOP_STORE.localOperations, operation.localOperationId, operation)
        )
      );
      return;
    }

    const db = await this.getDb();
    const tx = db.transaction('local_operations', 'readwrite');
    await Promise.all(operations.map((operation) => tx.store.put(operation)));
    await tx.done;
  }

  async markSynced(localOperationId: string, entityServerId?: string): Promise<void> {
    if (this.isDesktop()) {
      const operation = await getDesktopStoreValue<LocalOperation>(DESKTOP_STORE.localOperations, localOperationId);
      if (!operation) return;

      await setDesktopStoreValue(DESKTOP_STORE.localOperations, localOperationId, {
        ...operation,
        status: 'synced',
        entityServerId,
        errorCode: undefined,
        errorMessage: undefined
      });
      return;
    }

    const db = await this.getDb();
    const operation = await db.get('local_operations', localOperationId);
    if (!operation) return;

    await db.put('local_operations', {
      ...operation,
      status: 'synced',
      entityServerId,
      errorCode: undefined,
      errorMessage: undefined
    });
  }

  async markFailed(localOperationId: string, errorCode: string, errorMessage: string): Promise<void> {
    if (this.isDesktop()) {
      const operation = await getDesktopStoreValue<LocalOperation>(DESKTOP_STORE.localOperations, localOperationId);
      if (!operation) return;

      await setDesktopStoreValue(DESKTOP_STORE.localOperations, localOperationId, {
        ...operation,
        status: 'failed',
        retryCount: operation.retryCount + 1,
        errorCode,
        errorMessage
      });
      return;
    }

    const db = await this.getDb();
    const operation = await db.get('local_operations', localOperationId);
    if (!operation) return;

    await db.put('local_operations', {
      ...operation,
      status: 'failed',
      retryCount: operation.retryCount + 1,
      errorCode,
      errorMessage
    });
  }

  async markConflicted(localOperationId: string, reason: string): Promise<void> {
    if (this.isDesktop()) {
      const operation = await getDesktopStoreValue<LocalOperation>(DESKTOP_STORE.localOperations, localOperationId);
      if (!operation) return;

      await setDesktopStoreValue(DESKTOP_STORE.localOperations, localOperationId, {
        ...operation,
        status: 'conflicted',
        errorCode: 'CONFLICT',
        errorMessage: reason
      });
      return;
    }

    const db = await this.getDb();
    const operation = await db.get('local_operations', localOperationId);
    if (!operation) return;

    await db.put('local_operations', {
      ...operation,
      status: 'conflicted',
      errorCode: 'CONFLICT',
      errorMessage: reason
    });
  }

  async saveEntityMappings(mappings: EntityMapping[]): Promise<void> {
    if (mappings.length === 0) return;

    if (this.isDesktop()) {
      for (const mapping of mappings) {
        await setDesktopStoreValue(DESKTOP_STORE.entityMappings, mapping.localId, mapping);
      }

      const operations = await this.getAllOperations();
      const updatedOperations = applyEntityMappings(operations, mappings);
      await this.updateOperations(updatedOperations);
      return;
    }

    const db = await this.getDb();
    const tx = db.transaction(['entity_mappings', 'local_operations'], 'readwrite');
    await Promise.all(mappings.map((mapping) => tx.objectStore('entity_mappings').put(mapping)));
    const operations = await tx.objectStore('local_operations').getAll();
    const updatedOperations = applyEntityMappings(operations, mappings);
    await Promise.all(updatedOperations.map((operation) => tx.objectStore('local_operations').put(operation)));
    await tx.done;
  }

  async getEntityMapping(localId: string): Promise<EntityMapping | undefined> {
    if (this.isDesktop()) {
      return (await getDesktopStoreValue<EntityMapping>(DESKTOP_STORE.entityMappings, localId)) || undefined;
    }

    const db = await this.getDb();
    return db.get('entity_mappings', localId);
  }

  async setSyncCursor(scope: string, cursor: string): Promise<void> {
    if (this.isDesktop()) {
      await setDesktopStoreValue(DESKTOP_STORE.syncCursors, scope, {
        scope,
        cursor,
        updatedAt: new Date().toISOString()
      });
      return;
    }

    const db = await this.getDb();
    await db.put('sync_cursors', { scope, cursor, updatedAt: new Date().toISOString() });
  }

  async getSyncCursor(scope: string): Promise<string | null> {
    if (this.isDesktop()) {
      const cursor = await getDesktopStoreValue<{ scope: string; cursor: string; updatedAt: string }>(
        DESKTOP_STORE.syncCursors,
        scope
      );
      return cursor?.cursor || null;
    }

    const db = await this.getDb();
    const cursor = await db.get('sync_cursors', scope);
    return cursor?.cursor || null;
  }

  async saveOfflineAuth(entry: OfflineAuthCacheEntry): Promise<void> {
    if (this.isDesktop()) {
      await setDesktopStoreValue(DESKTOP_STORE.offlineAuth, entry.userId, entry);
      return;
    }

    const db = await this.getDb();
    await db.put('offline_auth', entry);
  }

  async getOfflineAuth(userId: string): Promise<OfflineAuthCacheEntry | undefined> {
    if (this.isDesktop()) {
      return (await getDesktopStoreValue<OfflineAuthCacheEntry>(DESKTOP_STORE.offlineAuth, userId)) || undefined;
    }

    const db = await this.getDb();
    return db.get('offline_auth', userId);
  }

  async saveDevice(device: DeviceRegistration & { tenantId?: string; offlineAuthExpiresAt?: string }): Promise<void> {
    if (this.isDesktop()) {
      await setDesktopStoreValue(DESKTOP_STORE.deviceMetadata, device.deviceId, {
        ...device,
        registeredAt: new Date().toISOString()
      });
      return;
    }

    const db = await this.getDb();
    await db.put('device_metadata', {
      ...device,
      registeredAt: new Date().toISOString()
    });
  }

  async getDefaultDevice(): Promise<(DeviceRegistration & { tenantId?: string }) | undefined> {
    if (this.isDesktop()) {
      const devices = await listDesktopStoreValues<DeviceRegistration & { tenantId?: string; registeredAt?: string }>(
        DESKTOP_STORE.deviceMetadata
      );
      return devices[0]?.value;
    }

    const db = await this.getDb();
    const devices = await db.getAll('device_metadata');
    return devices[0];
  }

  async getIssueSummary(): Promise<SyncIssueSummary> {
    return summarizeSyncIssues(markDependencyWaits(await this.getAllOperations()));
  }
}

export const localFirstStorage = new LocalFirstStorageService();
