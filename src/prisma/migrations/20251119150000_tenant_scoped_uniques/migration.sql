-- Scope unique constraints by tenant to prevent cross-tenant conflicts

-- Cost centers: code should be unique per tenant, not globally
ALTER TABLE "cost_centers" DROP CONSTRAINT IF EXISTS "cost_centers_code_key";
CREATE UNIQUE INDEX "cost_centers_tenantId_code_key" ON "cost_centers"("tenantId", "code");

-- Financial statements: uniqueness must include tenant
ALTER TABLE "financial_statements" DROP CONSTRAINT IF EXISTS "financial_statements_statementType_fiscalYear_period_key";
CREATE UNIQUE INDEX "financial_statements_tenantId_statementType_fiscalYear_period_key"
  ON "financial_statements"("tenantId", "statementType", "fiscalYear", "period");

-- Accounting periods: ensure per-tenant uniqueness
ALTER TABLE "accounting_periods" DROP CONSTRAINT IF EXISTS "accounting_periods_fiscalYear_periodNumber_periodType_key";
CREATE UNIQUE INDEX "accounting_periods_tenantId_fiscalYear_periodNumber_periodType_key"
  ON "accounting_periods"("tenantId", "fiscalYear", "periodNumber", "periodType");

-- CRM customer segments: segment keys should be unique within a tenant
ALTER TABLE "customer_segments" DROP CONSTRAINT IF EXISTS "customer_segments_segmentKey_key";
CREATE UNIQUE INDEX "customer_segments_tenantId_segmentKey_key" ON "customer_segments"("tenantId", "segmentKey");

