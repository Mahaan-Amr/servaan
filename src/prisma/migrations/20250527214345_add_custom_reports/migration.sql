-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TABULAR', 'CHART', 'DASHBOARD', 'PIVOT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT', 'RUNNING');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('VIEW', 'PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateTable
CREATE TABLE "CustomReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "ReportType" NOT NULL DEFAULT 'TABULAR',
    "dataSources" JSONB NOT NULL,
    "columnsConfig" JSONB NOT NULL,
    "filtersConfig" JSONB,
    "sortingConfig" JSONB,
    "chartConfig" JSONB,
    "layoutConfig" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "sharedWith" JSONB,
    "tags" TEXT[],
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "avgExecutionTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecution" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,
    "executionTime" INTEGER NOT NULL,
    "resultCount" INTEGER,
    "parameters" JSONB,
    "exportFormat" "ExportFormat" NOT NULL DEFAULT 'VIEW',
    "status" "ReportStatus" NOT NULL,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomReport_createdBy_idx" ON "CustomReport"("createdBy");

-- CreateIndex
CREATE INDEX "CustomReport_isPublic_idx" ON "CustomReport"("isPublic");

-- CreateIndex
CREATE INDEX "CustomReport_reportType_idx" ON "CustomReport"("reportType");

-- CreateIndex
CREATE INDEX "CustomReport_createdAt_idx" ON "CustomReport"("createdAt");

-- CreateIndex
CREATE INDEX "CustomReport_lastRunAt_idx" ON "CustomReport"("lastRunAt");

-- CreateIndex
CREATE INDEX "ReportExecution_reportId_executedAt_idx" ON "ReportExecution"("reportId", "executedAt");

-- CreateIndex
CREATE INDEX "ReportExecution_executedBy_idx" ON "ReportExecution"("executedBy");

-- CreateIndex
CREATE INDEX "ReportExecution_status_idx" ON "ReportExecution"("status");

-- CreateIndex
CREATE INDEX "ReportExecution_executedAt_idx" ON "ReportExecution"("executedAt");

-- AddForeignKey
ALTER TABLE "CustomReport" ADD CONSTRAINT "CustomReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecution" ADD CONSTRAINT "ReportExecution_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CustomReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecution" ADD CONSTRAINT "ReportExecution_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
