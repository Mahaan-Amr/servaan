-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'INVENTORY_UPDATE', 'NEW_USER', 'ITEM_CREATED', 'ITEM_UPDATED', 'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ScanMode" AS ENUM ('BARCODE', 'QR');

-- CreateEnum
CREATE TYPE "BarcodeFormat" AS ENUM ('EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128', 'CODE_39', 'I2OF5', 'QR_CODE', 'DATA_MATRIX', 'AZTEC', 'PDF_417', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "format" "BarcodeFormat" NOT NULL,
    "scanMode" "ScanMode" NOT NULL,
    "itemFound" BOOLEAN NOT NULL DEFAULT false,
    "itemId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalBarcodeData" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productName" TEXT,
    "brand" TEXT,
    "category" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExternalBarcodeData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "ScanHistory_userId_createdAt_idx" ON "ScanHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanHistory_code_idx" ON "ScanHistory"("code");

-- CreateIndex
CREATE INDEX "ScanHistory_itemId_idx" ON "ScanHistory"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalBarcodeData_barcode_key" ON "ExternalBarcodeData"("barcode");

-- CreateIndex
CREATE INDEX "ExternalBarcodeData_barcode_idx" ON "ExternalBarcodeData"("barcode");

-- CreateIndex
CREATE INDEX "ExternalBarcodeData_lastUpdated_idx" ON "ExternalBarcodeData"("lastUpdated");

-- CreateIndex
CREATE INDEX "Item_barcode_idx" ON "Item"("barcode");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
