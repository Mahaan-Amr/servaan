-- CreateEnum
CREATE TYPE "AuditCycleStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "inventory_audit_cycles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AuditCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelledReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_audit_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_audit_entries" (
    "id" TEXT NOT NULL,
    "auditCycleId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "countedQuantity" DOUBLE PRECISION NOT NULL,
    "systemQuantity" DOUBLE PRECISION NOT NULL,
    "discrepancy" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "correctionApplied" BOOLEAN NOT NULL DEFAULT false,
    "correctionEntryId" TEXT,
    "countedBy" TEXT NOT NULL,
    "countedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_audit_cycles_tenantId_idx" ON "inventory_audit_cycles"("tenantId");
CREATE INDEX "inventory_audit_cycles_status_idx" ON "inventory_audit_cycles"("status");
CREATE INDEX "inventory_audit_cycles_startDate_endDate_idx" ON "inventory_audit_cycles"("startDate", "endDate");
CREATE INDEX "inventory_audit_cycles_createdAt_idx" ON "inventory_audit_cycles"("createdAt");
CREATE INDEX "inventory_audit_entries_auditCycleId_idx" ON "inventory_audit_entries"("auditCycleId");
CREATE INDEX "inventory_audit_entries_tenantId_idx" ON "inventory_audit_entries"("tenantId");
CREATE INDEX "inventory_audit_entries_itemId_idx" ON "inventory_audit_entries"("itemId");
CREATE INDEX "inventory_audit_entries_discrepancy_idx" ON "inventory_audit_entries"("discrepancy");
CREATE INDEX "inventory_audit_entries_correctionApplied_idx" ON "inventory_audit_entries"("correctionApplied");

-- AddForeignKey
ALTER TABLE "inventory_audit_cycles" ADD CONSTRAINT "inventory_audit_cycles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_cycles" ADD CONSTRAINT "inventory_audit_cycles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_cycles" ADD CONSTRAINT "inventory_audit_cycles_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_cycles" ADD CONSTRAINT "inventory_audit_cycles_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_entries" ADD CONSTRAINT "inventory_audit_entries_auditCycleId_fkey" FOREIGN KEY ("auditCycleId") REFERENCES "inventory_audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_entries" ADD CONSTRAINT "inventory_audit_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_entries" ADD CONSTRAINT "inventory_audit_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_entries" ADD CONSTRAINT "inventory_audit_entries_correctionEntryId_fkey" FOREIGN KEY ("correctionEntryId") REFERENCES "InventoryEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_entries" ADD CONSTRAINT "inventory_audit_entries_countedBy_fkey" FOREIGN KEY ("countedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_entries" ADD CONSTRAINT "inventory_audit_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

