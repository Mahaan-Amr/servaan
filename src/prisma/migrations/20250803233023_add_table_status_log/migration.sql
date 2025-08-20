-- CreateTable
CREATE TABLE "table_status_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "oldStatus" "TableStatus" NOT NULL,
    "newStatus" "TableStatus" NOT NULL,
    "reason" VARCHAR(200),
    "notes" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "table_status_logs_tenantId_idx" ON "table_status_logs"("tenantId");

-- CreateIndex
CREATE INDEX "table_status_logs_tableId_idx" ON "table_status_logs"("tableId");

-- CreateIndex
CREATE INDEX "table_status_logs_changedAt_idx" ON "table_status_logs"("changedAt");

-- AddForeignKey
ALTER TABLE "table_status_logs" ADD CONSTRAINT "table_status_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_status_logs" ADD CONSTRAINT "table_status_logs_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_status_logs" ADD CONSTRAINT "table_status_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
