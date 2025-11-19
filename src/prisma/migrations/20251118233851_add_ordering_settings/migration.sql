-- CreateTable
CREATE TABLE "ordering_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderCreationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lockItemsWithoutStock" BOOLEAN NOT NULL DEFAULT false,
    "requireManagerConfirmationForNoStock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordering_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordering_settings_tenantId_key" ON "ordering_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "ordering_settings" ADD CONSTRAINT "ordering_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

