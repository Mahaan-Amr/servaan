#!/bin/bash

# =============================================================================
# Check Database Contents
# =============================================================================
# This script checks what's actually inside the database

set -e

echo "🔍 CHECKING DATABASE CONTENTS"
echo "============================="

# Step 1: Check all tables
echo "📋 Step 1: Listing all tables..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\dt"

# Step 2: Check if users table exists and its structure
echo ""
echo "📋 Step 2: Checking users table structure..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\d users" 2>/dev/null || echo "❌ Users table doesn't exist"

# Step 3: Check if tenants table exists and its structure
echo ""
echo "📋 Step 3: Checking tenants table structure..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\d tenants" 2>/dev/null || echo "❌ Tenants table doesn't exist"

# Step 4: Check tenants data
echo ""
echo "📋 Step 4: Checking tenants data..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, name, subdomain, \"isActive\" FROM tenants;" 2>/dev/null || echo "❌ No tenants data"

# Step 5: Check users data (if table exists)
echo ""
echo "📋 Step 5: Checking users data..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role, \"tenantId\" FROM users;" 2>/dev/null || echo "❌ No users data or table missing"

# Step 6: Check specific dima tenant users
echo ""
echo "📋 Step 6: Checking users in dima tenant..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT email, name, role FROM users WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';" 2>/dev/null || echo "❌ No users in dima tenant"

# Step 7: Check Prisma migrations table
echo ""
echo "📋 Step 7: Checking Prisma migrations..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT * FROM \"_prisma_migrations\";" 2>/dev/null || echo "❌ No Prisma migrations table"

# Step 8: Check database size and stats
echo ""
echo "📋 Step 8: Database statistics..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;" 2>/dev/null || echo "❌ No statistics available"

echo ""
echo "🔍 DATABASE CONTENTS CHECK COMPLETE"
echo "===================================="
