-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('NEW', 'OCCASIONAL', 'REGULAR', 'VIP');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'ONLINE', 'POINTS', 'MIXED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('SMS', 'INSTAGRAM', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED_PURCHASE', 'EARNED_BONUS', 'EARNED_REFERRAL', 'EARNED_BIRTHDAY', 'REDEEMED_DISCOUNT', 'REDEEMED_ITEM', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUBTRACT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('QR_CODE', 'STAFF_TABLET', 'SMS_LINK', 'WEBSITE', 'PHONE_CALL', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_CUSTOMER';
ALTER TYPE "NotificationType" ADD VALUE 'CUSTOMER_BIRTHDAY';
ALTER TYPE "NotificationType" ADD VALUE 'LOYALTY_MILESTONE';
ALTER TYPE "NotificationType" ADD VALUE 'CAMPAIGN_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'FEEDBACK_RECEIVED';

-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'CRM';

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "phoneNormalized" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameEnglish" VARCHAR(100),
    "email" VARCHAR(255),
    "birthday" DATE,
    "anniversary" DATE,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "segment" "CustomerSegment" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "preferences" JSONB DEFAULT '{}',
    "address" TEXT,
    "city" VARCHAR(50),
    "postalCode" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_loyalty" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "tierLevel" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
    "tierStartDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tierExpiresDate" DATE,
    "lifetimeSpent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentYearSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentMonthSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "visitsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" DATE,
    "firstVisitDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_visits" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitNumber" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod",
    "itemsOrdered" JSONB NOT NULL DEFAULT '[]',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "tableNumber" VARCHAR(10),
    "serverName" VARCHAR(100),
    "serviceDuration" INTEGER,
    "feedbackRating" INTEGER,
    "feedbackComment" TEXT,
    "feedbackCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "visitNotes" TEXT,

    CONSTRAINT "customer_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transactionType" "LoyaltyTransactionType" NOT NULL,
    "pointsChange" INTEGER NOT NULL,
    "visitId" TEXT,
    "campaignId" TEXT,
    "orderReference" VARCHAR(100),
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "relatedAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "balanceAfter" INTEGER NOT NULL,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "campaignType" "CampaignType" NOT NULL,
    "targetSegment" JSONB NOT NULL DEFAULT '{}',
    "estimatedRecipients" INTEGER,
    "templateContent" TEXT NOT NULL,
    "templateVariables" JSONB DEFAULT '{}',
    "scheduledDate" TIMESTAMP(3),
    "sentDate" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "costPerMessage" DECIMAL(6,2),
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesDelivered" INTEGER NOT NULL DEFAULT 0,
    "messagesFailed" INTEGER NOT NULL DEFAULT 0,
    "messagesOpened" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_deliveries" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "recipientPhone" VARCHAR(15) NOT NULL,
    "recipientName" VARCHAR(100),
    "messageContent" TEXT NOT NULL,
    "personalizedContent" TEXT,
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" VARCHAR(50),
    "errorMessage" TEXT,
    "messageCost" DECIMAL(6,2),
    "providerName" VARCHAR(50),
    "providerMessageId" VARCHAR(100),
    "linkClicks" INTEGER NOT NULL DEFAULT 0,
    "replyReceived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "campaign_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_feedback" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "visitId" TEXT,
    "feedbackSource" "FeedbackSource" NOT NULL,
    "sourceReference" VARCHAR(100),
    "overallRating" INTEGER NOT NULL,
    "categoryRatings" JSONB DEFAULT '{}',
    "comment" TEXT,
    "commentLanguage" VARCHAR(5) NOT NULL DEFAULT 'fa',
    "feedbackCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentimentScore" DECIMAL(3,2),
    "tableNumber" VARCHAR(10),
    "visitDate" DATE,
    "orderAmount" DECIMAL(10,2),
    "responseText" TEXT,
    "responseDate" TIMESTAMP(3),
    "respondedBy" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpCompleted" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deviceInfo" JSONB,
    "ipAddress" INET,

    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "segmentKey" VARCHAR(50) NOT NULL,
    "criteria" JSONB NOT NULL,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "isSystemSegment" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "colorHex" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "iconName" VARCHAR(50),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_providers" (
    "id" TEXT NOT NULL,
    "providerName" VARCHAR(50) NOT NULL,
    "apiEndpoint" VARCHAR(255),
    "apiKeyEncrypted" TEXT,
    "costPerSms" DECIMAL(6,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priorityOrder" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER,
    "monthlyLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "templateType" "CampaignType" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB DEFAULT '{}',
    "category" VARCHAR(50),
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "campaign_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_phoneNormalized_idx" ON "customers"("phoneNormalized");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_status_isActive_idx" ON "customers"("status", "isActive");

-- CreateIndex
CREATE INDEX "customers_segment_idx" ON "customers"("segment");

-- CreateIndex
CREATE INDEX "customers_birthday_idx" ON "customers"("birthday");

-- CreateIndex
CREATE INDEX "customers_createdAt_idx" ON "customers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_loyalty_customerId_key" ON "customer_loyalty"("customerId");

-- CreateIndex
CREATE INDEX "customer_loyalty_customerId_idx" ON "customer_loyalty"("customerId");

-- CreateIndex
CREATE INDEX "customer_loyalty_tierLevel_idx" ON "customer_loyalty"("tierLevel");

-- CreateIndex
CREATE INDEX "customer_loyalty_currentPoints_idx" ON "customer_loyalty"("currentPoints");

-- CreateIndex
CREATE INDEX "customer_loyalty_lifetimeSpent_idx" ON "customer_loyalty"("lifetimeSpent");

-- CreateIndex
CREATE INDEX "customer_loyalty_totalVisits_idx" ON "customer_loyalty"("totalVisits");

-- CreateIndex
CREATE INDEX "customer_visits_customerId_idx" ON "customer_visits"("customerId");

-- CreateIndex
CREATE INDEX "customer_visits_visitDate_idx" ON "customer_visits"("visitDate");

-- CreateIndex
CREATE INDEX "customer_visits_finalAmount_idx" ON "customer_visits"("finalAmount");

-- CreateIndex
CREATE INDEX "customer_visits_feedbackRating_idx" ON "customer_visits"("feedbackRating");

-- CreateIndex
CREATE INDEX "customer_visits_createdAt_idx" ON "customer_visits"("createdAt");

-- CreateIndex
CREATE INDEX "loyalty_transactions_customerId_idx" ON "loyalty_transactions"("customerId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_transactionType_idx" ON "loyalty_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "loyalty_transactions_createdAt_idx" ON "loyalty_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "loyalty_transactions_visitId_idx" ON "loyalty_transactions"("visitId");

-- CreateIndex
CREATE INDEX "campaigns_campaignType_idx" ON "campaigns"("campaignType");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_scheduledDate_idx" ON "campaigns"("scheduledDate");

-- CreateIndex
CREATE INDEX "campaigns_createdBy_idx" ON "campaigns"("createdBy");

-- CreateIndex
CREATE INDEX "campaigns_createdAt_idx" ON "campaigns"("createdAt");

-- CreateIndex
CREATE INDEX "campaign_deliveries_campaignId_idx" ON "campaign_deliveries"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_deliveries_customerId_idx" ON "campaign_deliveries"("customerId");

-- CreateIndex
CREATE INDEX "campaign_deliveries_deliveryStatus_idx" ON "campaign_deliveries"("deliveryStatus");

-- CreateIndex
CREATE INDEX "campaign_deliveries_recipientPhone_idx" ON "campaign_deliveries"("recipientPhone");

-- CreateIndex
CREATE INDEX "campaign_deliveries_queuedAt_idx" ON "campaign_deliveries"("queuedAt");

-- CreateIndex
CREATE INDEX "customer_feedback_customerId_idx" ON "customer_feedback"("customerId");

-- CreateIndex
CREATE INDEX "customer_feedback_visitId_idx" ON "customer_feedback"("visitId");

-- CreateIndex
CREATE INDEX "customer_feedback_overallRating_idx" ON "customer_feedback"("overallRating");

-- CreateIndex
CREATE INDEX "customer_feedback_feedbackSource_idx" ON "customer_feedback"("feedbackSource");

-- CreateIndex
CREATE INDEX "customer_feedback_createdAt_idx" ON "customer_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "customer_feedback_followUpRequired_idx" ON "customer_feedback"("followUpRequired");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_segmentKey_key" ON "customer_segments"("segmentKey");

-- CreateIndex
CREATE INDEX "customer_segments_segmentKey_idx" ON "customer_segments"("segmentKey");

-- CreateIndex
CREATE INDEX "customer_segments_isSystemSegment_idx" ON "customer_segments"("isSystemSegment");

-- CreateIndex
CREATE INDEX "customer_segments_isActive_idx" ON "customer_segments"("isActive");

-- CreateIndex
CREATE INDEX "customer_segments_displayOrder_idx" ON "customer_segments"("displayOrder");

-- CreateIndex
CREATE INDEX "sms_providers_isActive_priorityOrder_idx" ON "sms_providers"("isActive", "priorityOrder");

-- CreateIndex
CREATE INDEX "campaign_templates_templateType_idx" ON "campaign_templates"("templateType");

-- CreateIndex
CREATE INDEX "campaign_templates_category_idx" ON "campaign_templates"("category");

-- CreateIndex
CREATE INDEX "campaign_templates_isSystemTemplate_idx" ON "campaign_templates"("isSystemTemplate");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_loyalty" ADD CONSTRAINT "customer_loyalty_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "customer_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliveries" ADD CONSTRAINT "campaign_deliveries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliveries" ADD CONSTRAINT "campaign_deliveries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "customer_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_segments" ADD CONSTRAINT "customer_segments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_templates" ADD CONSTRAINT "campaign_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
