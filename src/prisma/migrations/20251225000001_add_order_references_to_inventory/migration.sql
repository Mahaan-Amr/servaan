-- Add orderId and orderItemId columns to InventoryEntry for order-inventory linkage
ALTER TABLE "InventoryEntry" ADD COLUMN "orderId" TEXT;
ALTER TABLE "InventoryEntry" ADD COLUMN "orderItemId" TEXT;

-- Add foreign key constraints
ALTER TABLE "InventoryEntry" ADD CONSTRAINT "InventoryEntry_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL;

ALTER TABLE "InventoryEntry" ADD CONSTRAINT "InventoryEntry_orderItemId_fkey" 
  FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL;

-- Add indexes for efficient querying
CREATE INDEX "InventoryEntry_orderId_idx" ON "InventoryEntry"("orderId");
CREATE INDEX "InventoryEntry_orderItemId_idx" ON "InventoryEntry"("orderItemId");
CREATE INDEX "InventoryEntry_orderId_orderItemId_idx" ON "InventoryEntry"("orderId", "orderItemId");
