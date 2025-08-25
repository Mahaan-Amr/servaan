# 🗄️ Database Migration Strategy

## 🚨 **CRITICAL: Data Safety First**

**⚠️ IMPORTANT WARNING**: This document outlines the strategy for adding admin panel functionality to your existing database. **ALL EXISTING TENANT DATA WILL BE PRESERVED**. We will only **ADD NEW TABLES** and **NEVER MODIFY EXISTING TABLES**.

## 📋 Migration Overview

### **What We Will Do**
- ✅ **ADD** new admin-specific tables
- ✅ **CREATE** new database types (enums)
- ✅ **ADD** new indexes for performance
- ✅ **CREATE** new database functions

### **What We Will NOT Do**
- ❌ **MODIFY** existing tenant tables
- ❌ **CHANGE** existing data structures
- ❌ **DELETE** any existing data
- ❌ **ALTER** existing table schemas

## 🏗️ Migration Strategy

### **Phase 1: Safe Schema Addition**
```
1. Create new admin tables (no impact on existing data)
2. Add new database types (enums)
3. Create new indexes
4. Test all existing functionality
5. Verify data isolation
```

### **Phase 2: Data Population**
```
1. Create initial admin users
2. Populate system health metrics
3. Set up audit logging
4. Test admin functionality
```

### **Phase 3: Integration Testing**
```
1. Test admin panel with existing system
2. Verify no impact on tenant operations
3. Performance testing
4. Security validation
```

## 📊 New Database Schema

### **New Tables to Create**

#### **1. Admin Users Table**
```sql
-- Safe to create - no impact on existing data
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
```

#### **2. Admin Audit Logs Table**
```sql
-- Safe to create - no impact on existing data
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);
```

#### **3. System Health Metrics Table**
```sql
-- Safe to create - no impact on existing data
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    status health_status NOT NULL,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_system_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX idx_system_health_metrics_status ON system_health_metrics(status);
CREATE INDEX idx_system_health_metrics_collected_at ON system_health_metrics(collected_at);
```

#### **4. Feature Flags Table**
```sql
-- Safe to create - no impact on existing data
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    target_tenants JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_feature_flags_name ON feature_flags(feature_name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);
```

#### **5. API Usage Logs Table**
```sql
-- Safe to create - no impact on existing data
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER,
    status_code INTEGER,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_api_usage_logs_tenant_id ON api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_status_code ON api_usage_logs(status_code);
```

### **New Database Types (Enums)**

#### **1. Admin Role Enum**
```sql
-- Safe to create - no impact on existing data
CREATE TYPE admin_role AS ENUM (
    'SUPER_ADMIN',      -- Full access (you)
    'PLATFORM_ADMIN',   -- Limited access
    'SUPPORT',          -- Customer success
    'DEVELOPER'         -- Technical staff
);
```

#### **2. Health Status Enum**
```sql
-- Safe to create - no impact on existing data
CREATE TYPE health_status AS ENUM (
    'HEALTHY',
    'WARNING',
    'CRITICAL',
    'UNKNOWN'
);
```

## 🔄 Migration Process

### **Step 1: Pre-Migration Backup**
```bash
# Create full database backup before any changes
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod --format=custom --file=/backups/pre_admin_migration_backup.dump

# Copy backup to local machine
docker cp servaan-postgres-prod:/backups/pre_admin_migration_backup.dump ./
```

### **Step 2: Create Migration Scripts**
```sql
-- admin_migration_001.sql
-- This script is SAFE and will NOT affect existing data

-- Create new enums first
CREATE TYPE admin_role AS ENUM (
    'SUPER_ADMIN',
    'PLATFORM_ADMIN', 
    'SUPPORT',
    'DEVELOPER'
);

CREATE TYPE health_status AS ENUM (
    'HEALTHY',
    'WARNING',
    'CRITICAL',
    'UNKNOWN'
);

-- Create new tables
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add more tables...
-- (Complete script will be created)
```

### **Step 3: Test Migration on Development**
```bash
# Test migration on development database first
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -f /tmp/admin_migration_001.sql

# Verify no existing data was affected
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM tenants;"
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM customers;"
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM orders;"
```

### **Step 4: Production Migration**
```bash
# Only after successful testing
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -f /tmp/admin_migration_001.sql

# Verify migration success
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "\dt admin_*"
```

## 🧪 Testing Strategy

### **Pre-Migration Tests**
- [ ] **Database backup** created and verified
- [ ] **Existing data counts** recorded
- [ ] **All existing functionality** tested
- [ ] **Performance baseline** established

### **Migration Tests**
- [ ] **Migration script** runs without errors
- [ ] **New tables** created successfully
- [ ] **Existing data** remains unchanged
- [ ] **New functionality** works correctly

### **Post-Migration Tests**
- [ ] **All existing APIs** still function
- [ ] **Tenant isolation** maintained
- [ ] **Performance** not degraded
- [ ] **Admin panel** functions correctly

## 🚨 Rollback Plan

### **If Migration Fails**
```bash
# Restore from backup immediately
docker exec servaan-postgres-prod pg_restore -U servaan -d servaan_prod --clean --if-exists < pre_admin_migration_backup.dump

# Verify restoration
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM tenants;"
```

### **If Issues Discovered After Migration**
```bash
# Drop new tables (safe - they're separate)
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "DROP TABLE IF EXISTS admin_users CASCADE;"
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "DROP TABLE IF EXISTS admin_audit_logs CASCADE;"
# ... drop other admin tables

# Drop new types
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "DROP TYPE IF EXISTS admin_role CASCADE;"
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "DROP TYPE IF EXISTS health_status CASCADE;"
```

## 📊 Migration Checklist

### **Before Migration**
- [ ] **Full database backup** created
- [ ] **Backup verified** and accessible
- [ ] **Migration scripts** tested on development
- [ ] **Rollback plan** prepared
- [ ] **Maintenance window** scheduled
- [ ] **Team notified** of migration

### **During Migration**
- [ ] **Migration script** executed
- [ ] **No errors** encountered
- [ ] **New tables** created successfully
- [ ] **Existing data** verified unchanged
- [ ] **New functionality** tested

### **After Migration**
- [ ] **All existing APIs** tested
- [ ] **Tenant functionality** verified
- [ ] **Admin panel** tested
- [ ] **Performance** validated
- [ ] **Security** verified
- [ ] **Documentation** updated

## 🔍 Verification Queries

### **Verify Existing Data Unchanged**
```sql
-- Check tenant counts
SELECT COUNT(*) as tenant_count FROM tenants;

-- Check customer counts
SELECT COUNT(*) as customer_count FROM customers;

-- Check order counts  
SELECT COUNT(*) as order_count FROM orders;

-- Check recent data
SELECT MAX(created_at) as latest_tenant FROM tenants;
SELECT MAX(created_at) as latest_customer FROM customers;
SELECT MAX(created_at) as latest_order FROM orders;
```

### **Verify New Tables Created**
```sql
-- Check admin tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'admin_%' 
ORDER BY table_name;

-- Check new types exist
SELECT typname FROM pg_type 
WHERE typname IN ('admin_role', 'health_status');
```

## 💡 Best Practices

### **Safety Measures**
1. **Always backup first** - Never skip this step
2. **Test on development** - Never test on production first
3. **Verify existing data** - Count records before and after
4. **Have rollback plan** - Know how to undo changes
5. **Monitor performance** - Ensure no degradation

### **Migration Tips**
1. **Run during low traffic** - Minimize impact
2. **Have team available** - For immediate response if needed
3. **Document everything** - Record all steps taken
4. **Test thoroughly** - Don't rush the process
5. **Plan for failure** - Always have contingency

---

**Last Updated**: January 15, 2025  
**Version**: 1.0.0  
**Status**: Migration Strategy Complete  
**Next Step**: Create migration scripts and test on development
