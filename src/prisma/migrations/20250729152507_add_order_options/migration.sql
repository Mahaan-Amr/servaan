/*
  Warnings:

  - You are about to drop the column `displayOrder` on the `recipe_ingredients` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "recipe_ingredients_recipeId_itemId_key";

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "displayOrder",
ALTER COLUMN "unitCost" DROP DEFAULT,
ALTER COLUMN "totalCost" DROP DEFAULT,
ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "order_options" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "discountEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discountType" VARCHAR(20) NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    "serviceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "servicePercentage" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "courierEnabled" BOOLEAN NOT NULL DEFAULT false,
    "courierAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "courierNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_presets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "discountEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discountType" VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    "serviceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "servicePercentage" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "courierEnabled" BOOLEAN NOT NULL DEFAULT false,
    "courierAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_options_orderId_key" ON "order_options"("orderId");

-- CreateIndex
CREATE INDEX "order_options_tenantId_idx" ON "order_options"("tenantId");

-- CreateIndex
CREATE INDEX "order_options_orderId_idx" ON "order_options"("orderId");

-- CreateIndex
CREATE INDEX "business_presets_tenantId_idx" ON "business_presets"("tenantId");

-- AddForeignKey
ALTER TABLE "order_options" ADD CONSTRAINT "order_options_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_options" ADD CONSTRAINT "order_options_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_presets" ADD CONSTRAINT "business_presets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
