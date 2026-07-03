import { getCurrentUser } from './authService';
import { apiClient } from '../lib/apiClient';
import {
  createOfflineInventoryDocumentNumber,
  createOfflineNumber,
  createOfflineReceiptNumber,
  getReadyOperations,
  LocalOperation,
  SyncPushResponse
} from '../../shared/localFirst';
import { localFirstStorage } from './localFirstStorageService';
import { CreateInventoryEntryData } from './inventoryService';
import { CreateOrderRequest, ProcessPaymentRequest } from './orderingService';
import { isDesktopApp } from './desktopBridgeService';
import { getNativeOnlineLoginSnapshot, isNativeSnapshotValid } from './nativeAuthSnapshotService';

const PROTOCOL_VERSION = 1;
const LOCAL_SCHEMA_VERSION = 1;
const MAX_SYNC_PASSES = 5;

class LocalFirstSyncService {
  async ensureDevice() {
    const existing = await localFirstStorage.getDefaultDevice();
    if (existing) return existing;

    const deviceId = getOrCreateDeviceId();
    const device: Awaited<ReturnType<typeof localFirstStorage.getDefaultDevice>> = {
      deviceId,
      name: getDefaultDeviceName(),
      platform: 'web' as const,
      syncProtocolVersion: PROTOCOL_VERSION,
      localSchemaVersion: LOCAL_SCHEMA_VERSION,
      mode: 'personal' as const
    };

    await localFirstStorage.saveDevice(device);
    return device;
  }

  async registerDeviceOnline() {
    const device = await this.ensureDevice();
    const response = await apiClient.post<{
      data: { offlineAuthExpiresAt?: string };
    }>('/sync/devices/register', device);

    await localFirstStorage.saveDevice({
      ...device,
      offlineAuthExpiresAt: response.data?.offlineAuthExpiresAt
    });

    return response;
  }

  async enqueueInventoryEntry(data: CreateInventoryEntryData): Promise<LocalOperation> {
    const operation = await this.createOperation({
      workspaceId: 'inventory-management',
      entityType: 'inventoryEntry',
      operationType: 'inventory.entry.create',
      payload: data,
      localNumber: createOfflineInventoryDocumentNumber(Date.now() % 1000000)
    });
    await localFirstStorage.appendOperation(operation);
    return operation;
  }

  async enqueueSalesOrder(orderData: CreateOrderRequest): Promise<LocalOperation> {
    const localOrderId = `local_order_${Date.now()}`;
    const operation = await this.createOperation({
      workspaceId: 'ordering-sales-system',
      entityType: 'order',
      entityLocalId: localOrderId,
      operationType: 'sales.order.create',
      payload: orderData,
      localNumber: createOfflineNumber(Date.now() % 1000000)
    });
    await localFirstStorage.appendOperation(operation);
    return operation;
  }

  async enqueueOfflinePayment(paymentData: ProcessPaymentRequest): Promise<LocalOperation> {
    const localPaymentId = `local_payment_${Date.now()}`;
    const operation = await this.createOperation({
      workspaceId: 'ordering-sales-system',
      entityType: 'payment',
      entityLocalId: localPaymentId,
      operationType: 'sales.payment.record_offline',
      payload: {
        ...paymentData,
        offlineStatus: 'OFFLINE_RECORDED'
      },
      dependsOn: paymentData.orderId.startsWith('local_') ? [paymentData.orderId] : [],
      localNumber: createOfflineReceiptNumber(Date.now() % 1000000)
    });
    await localFirstStorage.appendOperation(operation);
    return operation;
  }

  async enqueueOfflineReceiptPrinted(orderId: string, printedAt = new Date()): Promise<LocalOperation> {
    const operation = await this.createOperation({
      workspaceId: 'ordering-sales-system',
      entityType: 'receipt',
      operationType: 'sales.receipt.mark_printed_offline',
      payload: {
        orderId,
        printedOffline: true,
        printedAt: printedAt.toISOString()
      },
      dependsOn: orderId.startsWith('local_') ? [orderId] : [],
      localNumber: createOfflineReceiptNumber(Date.now() % 1000000)
    });
    await localFirstStorage.appendOperation(operation);
    return operation;
  }

  async enqueueMasterDataDraft(input: {
    workspaceId: LocalOperation['workspaceId'];
    entityType: string;
    entityLocalId: string;
    payload: unknown;
    localNumber?: string;
  }): Promise<LocalOperation> {
    if (isDesktopApp()) {
      throw new Error('Master-data changes are online-only in this desktop offline slice.');
    }

    const operation = await this.createOperation({
      workspaceId: input.workspaceId,
      entityType: 'masterData',
      entityLocalId: input.entityLocalId,
      operationType: 'master_data.upsert_draft',
      payload: input.payload,
      localNumber: input.localNumber
    });
    await localFirstStorage.appendOperation(operation);
    return operation;
  }

  async enqueueDangerousAction(input: {
    workspaceId: LocalOperation['workspaceId'];
    entityType: string;
    entityLocalId?: string;
    operationType: string;
    payload: unknown;
    localNumber?: string;
  }): Promise<LocalOperation> {
    if (isDesktopApp()) {
      throw new Error('This operation is online-only in this desktop offline slice.');
    }

    const operation = await this.createOperation({
      workspaceId: input.workspaceId,
      entityType: 'approvalRequest',
      entityLocalId: input.entityLocalId,
      operationType: 'dangerous.action.request_approval',
      payload: {
        actionType: input.operationType,
        payload: input.payload,
        approvalState: 'PENDING_MANAGER_APPROVAL'
      },
      localNumber: input.localNumber
    });
    await localFirstStorage.appendOperation(operation);
    return operation;
  }

  async syncNow(): Promise<SyncPushResponse | null> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }

    const device = await this.ensureDevice();
    let aggregate: SyncPushResponse | null = null;

    for (let pass = 0; pass < MAX_SYNC_PASSES; pass += 1) {
      const operations = await localFirstStorage.getPendingOperations();
      const readyOperations = getReadyOperations(operations);

      if (readyOperations.length === 0) {
        return aggregate;
      }

      await localFirstStorage.updateOperations(readyOperations.map((operation) => ({ ...operation, status: 'syncing' })));

      const response = await apiClient.post<SyncPushResponse>('/sync/push', {
        deviceId: device.deviceId,
        tenantId: readyOperations[0]?.tenantId,
        protocolVersion: PROTOCOL_VERSION,
        batchId: `web_${Date.now()}_${pass}`,
        operations: readyOperations
      });

      aggregate = mergeSyncResponses(aggregate, response);

      await localFirstStorage.saveEntityMappings(response.entityMappings || []);

      for (const accepted of response.accepted || []) {
        await localFirstStorage.markSynced(accepted.localOperationId, accepted.entityServerId);
      }

      for (const rejected of response.rejected || []) {
        await localFirstStorage.markFailed(rejected.localOperationId, rejected.errorCode, rejected.errorMessage);
      }

      for (const conflicted of response.conflicted || []) {
        await localFirstStorage.markConflicted(conflicted.localOperationId, conflicted.reason);
      }
    }

    return aggregate;
  }

  async getIssueSummary() {
    return localFirstStorage.getIssueSummary();
  }

  async getUnsyncedOperations() {
    return localFirstStorage.getUnsyncedOperations();
  }

  private async createOperation(input: {
    workspaceId: LocalOperation['workspaceId'];
    entityType: LocalOperation['entityType'];
    entityLocalId?: string;
    operationType: LocalOperation['operationType'];
    payload: unknown;
    dependsOn?: string[];
    localNumber?: string;
  }): Promise<LocalOperation> {
    const device = await this.ensureDevice();
    const user = getCurrentUser() as any;
    const tenantId = user?.tenantId || user?.tenant?.id || device.tenantId;

    if (!user?.id || !tenantId) {
      throw new Error('Online login on this device is required before offline work can be queued.');
    }

    if (isDesktopApp()) {
      const snapshot = await getNativeOnlineLoginSnapshot();
      if (!isNativeSnapshotValid(snapshot) || snapshot?.user.id !== user.id) {
        throw new Error('Offline access has expired. Reconnect and sign in again to continue creating offline work.');
      }
    }

    return {
      localOperationId: input.entityLocalId || `local_op_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      deviceId: device.deviceId,
      tenantId,
      workspaceId: input.workspaceId,
      entityType: input.entityType,
      entityLocalId: input.entityLocalId,
      operationType: input.operationType,
      payload: input.payload,
      dependsOn: input.dependsOn || [],
      status: 'pending',
      retryCount: 0,
      createdOfflineAt: new Date().toISOString(),
      actorUserId: user.id,
      localNumber: input.localNumber
    };
  }
}

function getOrCreateDeviceId() {
  const key = 'servaan_device_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = `web_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  localStorage.setItem(key, id);
  return id;
}

function getDefaultDeviceName() {
  if (typeof navigator === 'undefined') return 'Web device';
  return `Web - ${navigator.platform || 'browser'}`;
}

function mergeSyncResponses(current: SyncPushResponse | null, next: SyncPushResponse): SyncPushResponse {
  if (!current) return next;

  return {
    accepted: [...current.accepted, ...next.accepted],
    rejected: [...current.rejected, ...next.rejected],
    conflicted: [...current.conflicted, ...next.conflicted],
    entityMappings: [...current.entityMappings, ...next.entityMappings],
    newCursor: next.newCursor || current.newCursor,
    requiredUpgrade: current.requiredUpgrade || next.requiredUpgrade,
    revoked: current.revoked || next.revoked
  };
}

export const localFirstSyncService = new LocalFirstSyncService();
