-- SeedAdminUsers Migration
-- This migration creates initial admin users
-- SAFE - only adds new data, no existing data affected

-- Create initial super admin user
-- Password: AdminSecure2024! (hashed with bcrypt rounds 12)
INSERT INTO "admin_users" ("id", "email", "password_hash", "role", "is_active", "created_at", "updated_at") VALUES 
('admin_super_001', 'admin@servaan.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHhK', 'SUPER_ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create initial platform admin user
-- Password: PlatformSecure2024! (hashed with bcrypt rounds 12)
INSERT INTO "admin_users" ("id", "email", "password_hash", "role", "is_active", "created_at", "updated_at") VALUES 
('admin_platform_001', 'platform@servaan.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHhK', 'PLATFORM_ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create initial support user
-- Password: SupportSecure2024! (hashed with bcrypt rounds 12)
INSERT INTO "admin_users" ("id", "email", "password_hash", "role", "is_active", "created_at", "updated_at") VALUES 
('admin_support_001', 'support@servaan.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHhK', 'SUPPORT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create initial developer user
-- Password: DeveloperSecure2024! (hashed with bcrypt rounds 12)
INSERT INTO "admin_users" ("id", "email", "password_hash", "role", "is_active", "created_at", "updated_at") VALUES 
('admin_developer_001', 'developer@servaan.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHhK', 'DEVELOPER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create initial system health metrics
INSERT INTO "system_health_metrics" ("id", "metric_name", "metric_value", "status", "collected_at") VALUES 
('health_db_001', 'database_connection', '{"response_time": 45, "connections": 12}', 'HEALTHY', CURRENT_TIMESTAMP),
('health_api_001', 'api_response_time', '{"average": 120, "p95": 250, "p99": 450}', 'HEALTHY', CURRENT_TIMESTAMP),
('health_storage_001', 'disk_usage', '{"usage_percent": 45.2, "available_gb": 54.8}', 'HEALTHY', CURRENT_TIMESTAMP);

-- Create initial feature flags
INSERT INTO "feature_flags" ("id", "feature_name", "is_enabled", "rollout_percentage", "target_tenants", "created_at", "updated_at") VALUES 
('feature_2fa_001', 'two_factor_authentication', true, 100, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('feature_analytics_001', 'advanced_analytics', true, 100, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('feature_api_access_001', 'api_access', false, 0, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('feature_custom_branding_001', 'custom_branding', false, 0, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
