-- CreateAdminSystem Migration
-- This migration is SAFE and will NOT affect existing data
-- It only ADDS new admin tables and types

-- Create new enums for admin system
CREATE TYPE "admin_role" AS ENUM (
    'SUPER_ADMIN',
    'PLATFORM_ADMIN', 
    'SUPPORT',
    'DEVELOPER'
);

CREATE TYPE "health_status" AS ENUM (
    'HEALTHY',
    'WARNING',
    'CRITICAL',
    'UNKNOWN'
);

-- Create admin_users table
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "admin_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "two_factor_secret" TEXT,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- Create admin_audit_logs table
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create system_health_metrics table
CREATE TABLE "system_health_metrics" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" JSONB NOT NULL,
    "status" "health_status" NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_metrics_pkey" PRIMARY KEY ("id")
);

-- Create feature_flags table
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" INTEGER NOT NULL DEFAULT 0,
    "target_tenants" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- Create api_usage_logs table
CREATE TABLE "api_usage_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "response_time" INTEGER,
    "status_code" INTEGER,
    "user_agent" TEXT,
    "ip_address" INET,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE UNIQUE INDEX "feature_flags_feature_name_key" ON "feature_flags"("feature_name");

-- Add indexes for performance
CREATE INDEX "idx_admin_users_email" ON "admin_users"("email");
CREATE INDEX "idx_admin_users_role" ON "admin_users"("role");
CREATE INDEX "idx_admin_users_active" ON "admin_users"("is_active");

CREATE INDEX "idx_admin_audit_logs_admin_user_id" ON "admin_audit_logs"("admin_user_id");
CREATE INDEX "idx_admin_audit_logs_action" ON "admin_audit_logs"("action");
CREATE INDEX "idx_admin_audit_logs_created_at" ON "admin_audit_logs"("created_at");
CREATE INDEX "idx_admin_audit_logs_resource_type" ON "admin_audit_logs"("resource_type");

CREATE INDEX "idx_system_health_metrics_name" ON "system_health_metrics"("metric_name");
CREATE INDEX "idx_system_health_metrics_status" ON "system_health_metrics"("status");
CREATE INDEX "idx_system_health_metrics_collected_at" ON "system_health_metrics"("collected_at");

CREATE INDEX "idx_feature_flags_name" ON "feature_flags"("feature_name");
CREATE INDEX "idx_feature_flags_enabled" ON "feature_flags"("is_enabled");

CREATE INDEX "idx_api_usage_logs_tenant_id" ON "api_usage_logs"("tenant_id");
CREATE INDEX "idx_api_usage_logs_endpoint" ON "api_usage_logs"("endpoint");
CREATE INDEX "idx_api_usage_logs_created_at" ON "api_usage_logs"("created_at");
CREATE INDEX "idx_api_usage_logs_status_code" ON "api_usage_logs"("status_code");

-- Add foreign key constraints
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
