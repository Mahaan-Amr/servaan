-- Create AdminRole enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') THEN
    CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN','PLATFORM_ADMIN','SUPPORT','DEVELOPER');
  END IF;
END $$;

-- Create HealthStatus enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HealthStatus') THEN
    CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY','WARNING','CRITICAL','UNKNOWN');
  END IF;
END $$;

-- Alter admin_users.role to enum using safe cast
ALTER TABLE "admin_users"
  ALTER COLUMN "role" TYPE "AdminRole"
  USING (
    CASE
      WHEN "role" IN ('SUPER_ADMIN','PLATFORM_ADMIN','SUPPORT','DEVELOPER') THEN "role"::"AdminRole"
      ELSE 'SUPPORT'::"AdminRole"
    END
  );

-- Alter system_health_metrics.status to enum using safe cast
ALTER TABLE "system_health_metrics"
  ALTER COLUMN "status" TYPE "HealthStatus"
  USING (
    CASE
      WHEN "status" IN ('HEALTHY','WARNING','CRITICAL','UNKNOWN') THEN "status"::"HealthStatus"
      ELSE 'UNKNOWN'::"HealthStatus"
    END
  );


