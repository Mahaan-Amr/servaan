/*
  Warnings:

  - Added the required column `tenantId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('STARTER', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SmsType" AS ENUM ('VERIFICATION', 'INVITATION', 'WELCOME', 'LOW_STOCK_ALERT', 'PROMOTIONAL', 'TRANSACTIONAL', 'BULK', 'TEST');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "subdomain" VARCHAR(63) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "logo" VARCHAR(500),
    "primaryColor" VARCHAR(7),
    "secondaryColor" VARCHAR(7),
    "plan" "TenantPlan" NOT NULL DEFAULT 'STARTER',
    "planStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxItems" INTEGER NOT NULL DEFAULT 1000,
    "maxCustomers" INTEGER NOT NULL DEFAULT 500,
    "ownerName" VARCHAR(255) NOT NULL,
    "ownerEmail" VARCHAR(255) NOT NULL,
    "ownerPhone" VARCHAR(20),
    "businessType" VARCHAR(100),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(100) NOT NULL DEFAULT 'Iran',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Tehran',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'fa-IR',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IRR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_features" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hasInventoryManagement" BOOLEAN NOT NULL DEFAULT true,
    "hasCustomerManagement" BOOLEAN NOT NULL DEFAULT true,
    "hasAccountingSystem" BOOLEAN NOT NULL DEFAULT true,
    "hasReporting" BOOLEAN NOT NULL DEFAULT true,
    "hasNotifications" BOOLEAN NOT NULL DEFAULT true,
    "hasAdvancedReporting" BOOLEAN NOT NULL DEFAULT false,
    "hasApiAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasCustomBranding" BOOLEAN NOT NULL DEFAULT false,
    "hasMultiLocation" BOOLEAN NOT NULL DEFAULT false,
    "hasAdvancedCRM" BOOLEAN NOT NULL DEFAULT false,
    "hasWhatsappIntegration" BOOLEAN NOT NULL DEFAULT false,
    "hasInstagramIntegration" BOOLEAN NOT NULL DEFAULT false,
    "hasAnalyticsBI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" "SmsType" NOT NULL,
    "messageId" VARCHAR(50),
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "creditUsed" INTEGER DEFAULT 1,
    "costAmount" DECIMAL(10,2),
    "sentBy" TEXT,
    "customerId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_features_tenantId_key" ON "tenant_features"("tenantId");

-- CreateIndex
CREATE INDEX "sms_history_tenantId_createdAt_idx" ON "sms_history"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "sms_history_phoneNumber_idx" ON "sms_history"("phoneNumber");

-- CreateIndex
CREATE INDEX "sms_history_messageType_status_idx" ON "sms_history"("messageType", "status");

-- CreateIndex
CREATE INDEX "sms_history_sentBy_createdAt_idx" ON "sms_history"("sentBy", "createdAt");

-- CreateIndex
CREATE INDEX "sms_history_status_createdAt_idx" ON "sms_history"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "tenant_features" ADD CONSTRAINT "tenant_features_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_history" ADD CONSTRAINT "sms_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_history" ADD CONSTRAINT "sms_history_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_history" ADD CONSTRAINT "sms_history_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
