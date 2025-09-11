/*
  Warnings:

  - Changed the type of `role` on the `admin_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `system_health_metrics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "public"."HealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN');

-- DropIndex
DROP INDEX "public"."idx_admin_audit_logs_action";

-- DropIndex
DROP INDEX "public"."idx_admin_audit_logs_admin_user_id";

-- DropIndex
DROP INDEX "public"."idx_admin_audit_logs_created_at";

-- DropIndex
DROP INDEX "public"."idx_admin_audit_logs_resource_type";

-- DropIndex
DROP INDEX "public"."idx_admin_users_active";

-- DropIndex
DROP INDEX "public"."idx_admin_users_email";

-- DropIndex
DROP INDEX "public"."idx_admin_users_role";

-- DropIndex
DROP INDEX "public"."idx_api_usage_logs_created_at";

-- DropIndex
DROP INDEX "public"."idx_api_usage_logs_endpoint";

-- DropIndex
DROP INDEX "public"."idx_api_usage_logs_status_code";

-- DropIndex
DROP INDEX "public"."idx_api_usage_logs_tenant_id";

-- DropIndex
DROP INDEX "public"."idx_feature_flags_enabled";

-- DropIndex
DROP INDEX "public"."idx_feature_flags_name";

-- DropIndex
DROP INDEX "public"."idx_system_health_metrics_collected_at";

-- DropIndex
DROP INDEX "public"."idx_system_health_metrics_name";

-- DropIndex
DROP INDEX "public"."idx_system_health_metrics_status";

-- AlterTable
ALTER TABLE "public"."admin_users" DROP COLUMN "role",
ADD COLUMN     "role" "public"."AdminRole" NOT NULL;

-- AlterTable
ALTER TABLE "public"."system_health_metrics" DROP COLUMN "status",
ADD COLUMN     "status" "public"."HealthStatus" NOT NULL;

-- DropEnum
DROP TYPE "public"."admin_role";

-- DropEnum
DROP TYPE "public"."health_status";
