-- Add soft delete fields to InventoryEntry, Item, and Supplier models

-- AlterTable: Add deletedAt and deletedBy to InventoryEntry
ALTER TABLE "InventoryEntry" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "InventoryEntry" ADD COLUMN "deletedBy" TEXT;

-- AlterTable: Add deletedAt and deletedBy to Item
ALTER TABLE "Item" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Item" ADD COLUMN "deletedBy" TEXT;

-- AlterTable: Add deletedAt and deletedBy to Supplier
ALTER TABLE "suppliers" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "suppliers" ADD COLUMN "deletedBy" TEXT;

-- CreateIndex: Add indexes for efficient filtering
CREATE INDEX "InventoryEntry_deletedAt_idx" ON "InventoryEntry"("deletedAt");
CREATE INDEX "InventoryEntry_tenantId_deletedAt_idx" ON "InventoryEntry"("tenantId", "deletedAt");
CREATE INDEX "Item_deletedAt_idx" ON "Item"("deletedAt");
CREATE INDEX "Item_tenantId_deletedAt_idx" ON "Item"("tenantId", "deletedAt");
CREATE INDEX "suppliers_deletedAt_idx" ON "suppliers"("deletedAt");
CREATE INDEX "suppliers_tenantId_deletedAt_idx" ON "suppliers"("tenantId", "deletedAt");

-- AddForeignKey: Add foreign key for InventoryEntry.deletedBy
ALTER TABLE "InventoryEntry" ADD CONSTRAINT "InventoryEntry_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

