#!/bin/bash

# =============================================================================
# Fix Prisma Schema Path Issue
# =============================================================================
# This script fixes the Prisma schema path in the backend container

set -e

echo "🔧 FIXING PRISMA SCHEMA PATH"
echo "============================"

# Step 1: Check current directory structure in backend container
echo "📋 Step 1: Checking backend container structure..."
docker exec servaan-backend-prod ls -la /app/

echo ""
echo "📋 Checking Prisma directory..."
docker exec servaan-backend-prod ls -la /app/src/prisma/ || echo "❌ Prisma directory not found"

# Step 2: Check if schema exists
echo ""
echo "📋 Step 2: Checking for Prisma schema..."
docker exec servaan-backend-prod ls -la /app/src/prisma/schema.prisma || echo "❌ Schema file not found"

# Step 3: Try to run Prisma commands from correct directory
echo ""
echo "📋 Step 3: Running Prisma generate from correct directory..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma generate"

# Step 4: Run migrations from correct directory
echo ""
echo "📋 Step 4: Running Prisma migrations from correct directory..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma migrate deploy"

# Step 5: Check if tables were created
echo ""
echo "📋 Step 5: Checking if tables were created..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\dt"

# Step 6: Check for users in dima tenant
echo ""
echo "📋 Step 6: Checking users in dima tenant..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT email, name, role FROM users WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';" 2>/dev/null || echo "❌ No users found"

echo ""
echo "🔧 PRISMA SCHEMA PATH FIX COMPLETE"
echo "=================================="
