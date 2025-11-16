-- CreateTable
CREATE TABLE "inventory_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_settings_tenantId_key" ON "inventory_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "inventory_settings" ADD CONSTRAINT "inventory_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

