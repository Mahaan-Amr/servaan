#!/bin/bash

# =============================================================================
# Fix Database Setup - Initialize Prisma Schema
# =============================================================================
# This script sets up the database with proper Prisma schema

set -e

echo "🔧 FIXING DATABASE SETUP"
echo "========================"

# Step 1: Check what tables exist
echo "📋 Step 1: Checking existing tables..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\dt"

# Step 2: Check if Prisma schema exists
echo ""
echo "📋 Step 2: Checking Prisma schema..."
if [ -f "src/prisma/schema.prisma" ]; then
    echo "✅ Prisma schema found"
else
    echo "❌ Prisma schema not found"
    exit 1
fi

# Step 3: Generate Prisma client
echo ""
echo "📋 Step 3: Generating Prisma client..."
docker exec servaan-backend-prod npx prisma generate

# Step 4: Run database migrations
echo ""
echo "📋 Step 4: Running database migrations..."
docker exec servaan-backend-prod npx prisma migrate deploy

# Step 5: Check tables again
echo ""
echo "📋 Step 5: Checking tables after migration..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\dt"

# Step 6: Check if users table exists now
echo ""
echo "📋 Step 6: Checking users table..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM users;" 2>/dev/null && echo "✅ Users table exists" || echo "❌ Users table still missing"

# Step 7: Check tenants table
echo ""
echo "📋 Step 7: Checking tenants table..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, name, subdomain FROM tenants;" 2>/dev/null || echo "❌ Tenants table missing"

# Step 8: If tables exist, check for users in dima tenant
echo ""
echo "📋 Step 8: Checking users in dima tenant..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT email, name, role FROM users WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';" 2>/dev/null || echo "❌ No users found or table missing"

echo ""
echo "🔧 DATABASE SETUP COMPLETE"
echo "==========================="
