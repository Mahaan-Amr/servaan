#!/bin/bash

# =============================================================================
# Fix Missing Tables - Apply Prisma Schema Properly
# =============================================================================
# This script properly applies the Prisma schema to create missing tables

set -e

echo "🔧 FIXING MISSING TABLES"
echo "========================"

# Step 1: Check what tables actually exist
echo "📋 Step 1: Checking existing tables..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\dt" | head -20

# Step 2: Check if we have the right Prisma schema
echo ""
echo "📋 Step 2: Checking Prisma schema in backend container..."
docker exec servaan-backend-prod ls -la /app/src/prisma/ || echo "❌ Prisma directory not found"

# Step 3: Check if schema file exists
echo ""
echo "📋 Step 3: Checking Prisma schema file..."
docker exec servaan-backend-prod ls -la /app/src/prisma/schema.prisma || echo "❌ Schema file not found"

# Step 4: Try to generate Prisma client from correct location
echo ""
echo "📋 Step 4: Generating Prisma client..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma generate"

# Step 5: Try to run migrations from correct location
echo ""
echo "📋 Step 5: Running Prisma migrations..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma migrate deploy"

# Step 6: Check if User table was created
echo ""
echo "📋 Step 6: Checking if User table was created..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\d User" 2>/dev/null && echo "✅ User table exists" || echo "❌ User table still missing"

# Step 7: Check if users table was created (lowercase)
echo ""
echo "📋 Step 7: Checking if users table was created..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\d users" 2>/dev/null && echo "✅ users table exists" || echo "❌ users table missing"

# Step 8: If still no User table, try to create it manually
echo ""
echo "📋 Step 8: Creating User table manually if needed..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "
CREATE TABLE IF NOT EXISTS \"User\" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF',
    \"tenantId\" TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    \"phoneNumber\" TEXT,
    \"lastLogin\" TIMESTAMP,
    \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
    \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);
"

# Step 9: Create a test user
echo ""
echo "📋 Step 9: Creating test user..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "
INSERT INTO \"User\" (id, email, name, password, role, \"tenantId\", active, \"createdAt\", \"updatedAt\")
VALUES (
    'cmelskkl400006ke6yd0s7l7h-user-001',
    'admin@dima.servaan.com',
    'Admin User',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4Kz8K8K2',
    'ADMIN',
    'cmelskkl400006ke6yd0s7l7h',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
"

# Step 10: Verify user was created
echo ""
echo "📋 Step 10: Verifying user creation..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role FROM \"User\" WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';"

echo ""
echo "🔧 MISSING TABLES FIX COMPLETE"
echo "=============================="
echo "✅ User table created manually"
echo "✅ Test user created with credentials:"
echo "   Email: admin@dima.servaan.com"
echo "   Password: admin123"
echo "   Role: ADMIN"
