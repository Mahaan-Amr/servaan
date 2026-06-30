-- Local-first offline sync foundation for Sales and Inventory.

ALTER TABLE "InventoryEntry"
  ADD COLUMN "sourceDeviceId" TEXT,
  ADD COLUMN "sourceLocalOperationId" TEXT,
  ADD COLUMN "sourceLocalNumber" TEXT;

ALTER TABLE "orders"
  ADD COLUMN "sourceDeviceId" TEXT,
  ADD COLUMN "sourceLocalOperationId" TEXT,
  ADD COLUMN "sourceLocalNumber" TEXT,
  ADD COLUMN "printedOffline" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "offlineRecordedAt" TIMESTAMP(3);

ALTER TABLE "order_payments"
  ADD COLUMN "isOfflineRecorded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationStatus" VARCHAR(40) NOT NULL DEFAULT 'CANONICAL',
  ADD COLUMN "sourceDeviceId" TEXT,
  ADD COLUMN "sourceLocalOperationId" TEXT,
  ADD COLUMN "sourceLocalNumber" TEXT;

CREATE TABLE "offline_devices" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" VARCHAR(40) NOT NULL DEFAULT 'web',
  "appVersion" VARCHAR(50),
  "syncProtocolVersion" INTEGER NOT NULL DEFAULT 1,
  "localSchemaVersion" INTEGER NOT NULL DEFAULT 1,
  "mode" VARCHAR(20) NOT NULL DEFAULT 'personal',
  "assignedUserId" TEXT,
  "lastOnlineAt" TIMESTAMP(3),
  "lastSyncAt" TIMESTAMP(3),
  "offlineAuthExpiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "offline_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sync_operations" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "localOperationId" TEXT NOT NULL,
  "syncBatchId" TEXT,
  "workspaceId" VARCHAR(80) NOT NULL,
  "entityType" VARCHAR(80) NOT NULL,
  "entityLocalId" TEXT,
  "entityServerId" TEXT,
  "operationType" VARCHAR(80) NOT NULL,
  "status" VARCHAR(40) NOT NULL DEFAULT 'accepted',
  "payload" JSONB NOT NULL,
  "dependsOn" JSONB NOT NULL DEFAULT '[]',
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdOfflineAt" TIMESTAMP(3) NOT NULL,
  "syncedAt" TIMESTAMP(3),
  "actorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sync_conflicts" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "localOperationId" TEXT,
  "syncBatchId" TEXT,
  "workspaceId" VARCHAR(80) NOT NULL,
  "entityType" VARCHAR(80) NOT NULL,
  "entityLocalId" TEXT,
  "entityServerId" TEXT,
  "conflictType" VARCHAR(80) NOT NULL,
  "status" VARCHAR(40) NOT NULL DEFAULT 'open',
  "reason" TEXT NOT NULL,
  "localPayload" JSONB,
  "serverPayload" JSONB,
  "actorUserId" TEXT,
  "createdOfflineAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,

  CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offline_devices_tenantId_deviceId_key" ON "offline_devices"("tenantId", "deviceId");
CREATE INDEX "offline_devices_tenantId_idx" ON "offline_devices"("tenantId");
CREATE INDEX "offline_devices_assignedUserId_idx" ON "offline_devices"("assignedUserId");
CREATE INDEX "offline_devices_revokedAt_idx" ON "offline_devices"("revokedAt");

CREATE UNIQUE INDEX "sync_operations_tenantId_deviceId_localOperationId_key" ON "sync_operations"("tenantId", "deviceId", "localOperationId");
CREATE INDEX "sync_operations_tenantId_idx" ON "sync_operations"("tenantId");
CREATE INDEX "sync_operations_deviceId_idx" ON "sync_operations"("deviceId");
CREATE INDEX "sync_operations_status_idx" ON "sync_operations"("status");
CREATE INDEX "sync_operations_syncBatchId_idx" ON "sync_operations"("syncBatchId");

CREATE INDEX "sync_conflicts_tenantId_idx" ON "sync_conflicts"("tenantId");
CREATE INDEX "sync_conflicts_deviceId_idx" ON "sync_conflicts"("deviceId");
CREATE INDEX "sync_conflicts_status_idx" ON "sync_conflicts"("status");
CREATE INDEX "sync_conflicts_syncBatchId_idx" ON "sync_conflicts"("syncBatchId");

CREATE INDEX "InventoryEntry_tenantId_sourceDeviceId_idx" ON "InventoryEntry"("tenantId", "sourceDeviceId");
CREATE INDEX "InventoryEntry_tenantId_sourceLocalOperationId_idx" ON "InventoryEntry"("tenantId", "sourceLocalOperationId");
CREATE INDEX "orders_tenantId_sourceDeviceId_idx" ON "orders"("tenantId", "sourceDeviceId");
CREATE INDEX "orders_tenantId_sourceLocalOperationId_idx" ON "orders"("tenantId", "sourceLocalOperationId");
CREATE INDEX "order_payments_tenantId_sourceDeviceId_idx" ON "order_payments"("tenantId", "sourceDeviceId");
CREATE INDEX "order_payments_tenantId_sourceLocalOperationId_idx" ON "order_payments"("tenantId", "sourceLocalOperationId");

ALTER TABLE "offline_devices"
  ADD CONSTRAINT "offline_devices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "offline_devices_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sync_operations"
  ADD CONSTRAINT "sync_operations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sync_operations_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "sync_operations_device_fkey" FOREIGN KEY ("tenantId", "deviceId") REFERENCES "offline_devices"("tenantId", "deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sync_conflicts"
  ADD CONSTRAINT "sync_conflicts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sync_conflicts_device_fkey" FOREIGN KEY ("tenantId", "deviceId") REFERENCES "offline_devices"("tenantId", "deviceId") ON DELETE CASCADE ON UPDATE CASCADE;
