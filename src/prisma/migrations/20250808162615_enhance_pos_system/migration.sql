/*
  Warnings:

  - The values [PENDING] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'MODIFIED', 'PARTIALLY_PAID');
ALTER TABLE "kitchen_displays" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "order_items" ALTER COLUMN "prepStatus" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TABLE "order_items" ALTER COLUMN "prepStatus" TYPE "OrderStatus_new" USING ("prepStatus"::text::"OrderStatus_new");
ALTER TABLE "kitchen_displays" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "kitchen_displays" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "order_items" ALTER COLUMN "prepStatus" SET DEFAULT 'DRAFT';
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "kitchen_displays" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "prepStatus" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "lastPaymentAt" TIMESTAMP(3),
ADD COLUMN     "paymentNotes" TEXT,
ADD COLUMN     "paymentType" VARCHAR(50),
ADD COLUMN     "remainingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "order_modifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "modificationType" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB,
    "amountChange" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "previousTotal" DECIMAL(12,2) NOT NULL,
    "newTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedBy" TEXT NOT NULL,

    CONSTRAINT "order_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_modifications_tenantId_idx" ON "order_modifications"("tenantId");

-- CreateIndex
CREATE INDEX "order_modifications_orderId_idx" ON "order_modifications"("orderId");

-- CreateIndex
CREATE INDEX "order_modifications_modificationType_idx" ON "order_modifications"("modificationType");

-- CreateIndex
CREATE INDEX "order_modifications_createdAt_idx" ON "order_modifications"("createdAt");

-- AddForeignKey
ALTER TABLE "order_modifications" ADD CONSTRAINT "order_modifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_modifications" ADD CONSTRAINT "order_modifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_modifications" ADD CONSTRAINT "order_modifications_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
