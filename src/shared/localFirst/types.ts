export type WorkspaceId = 'ordering-sales-system' | 'inventory-management';

export type LocalOperationStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'conflicted'
  | 'waiting_for_dependency';

export type LocalOperationEntityType =
  | 'inventoryEntry'
  | 'order'
  | 'payment'
  | 'receipt'
  | 'masterData'
  | 'approvalRequest';

export type LocalOperationType =
  | 'inventory.entry.create'
  | 'sales.order.create'
  | 'sales.payment.record_offline'
  | 'sales.receipt.mark_printed_offline'
  | 'master_data.upsert_draft'
  | 'dangerous.action.request_approval';

export interface LocalOperation {
  localOperationId: string;
  deviceId: string;
  tenantId: string;
  workspaceId: WorkspaceId;
  entityType: LocalOperationEntityType | string;
  entityLocalId?: string;
  entityServerId?: string;
  operationType: LocalOperationType | string;
  payload: unknown;
  dependsOn: string[];
  status: LocalOperationStatus;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  createdOfflineAt: string;
  actorUserId: string;
  localNumber?: string;
}

export interface EntityMapping {
  entityType: string;
  localId: string;
  serverId: string;
}

export interface AcceptedOperation {
  localOperationId: string;
  entityType: string;
  entityLocalId?: string;
  entityServerId?: string;
}

export interface RejectedOperation {
  localOperationId: string;
  errorCode: string;
  errorMessage: string;
}

export interface ConflictedOperation {
  localOperationId: string;
  conflictId?: string;
  reason: string;
}

export interface SyncPushRequest {
  deviceId: string;
  tenantId: string;
  operations: LocalOperation[];
  protocolVersion?: number;
  batchId?: string;
}

export interface SyncPushResponse {
  accepted: AcceptedOperation[];
  rejected: RejectedOperation[];
  conflicted: ConflictedOperation[];
  entityMappings: EntityMapping[];
  newCursor: string;
  requiredUpgrade?: boolean;
  revoked?: boolean;
}

export interface SyncPullResponse {
  events: unknown[];
  conflicts: unknown[];
  revoked?: boolean;
  requiredUpgrade?: boolean;
  newCursor: string;
}

export interface OfflineAuthCacheEntry {
  userId: string;
  tenantId: string;
  userName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  workspacePermissions: string[];
  lastSuccessfulLoginAt: string;
  offlineAuthExpiresAt: string;
  pinHash?: string;
}

export interface DeviceRegistration {
  deviceId: string;
  name: string;
  platform: 'web' | 'windows' | 'android' | 'ios';
  appVersion?: string;
  syncProtocolVersion: number;
  localSchemaVersion: number;
  mode?: 'personal' | 'shared';
}

export interface SyncIssueSummary {
  pendingCount: number;
  failedCount: number;
  conflictedCount: number;
  waitingForDependencyCount: number;
}
