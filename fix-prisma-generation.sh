#!/bin/bash

# =============================================================================
# Fix Prisma Generation Issue
# =============================================================================
# This script fixes the Prisma client generation issue

set -e

echo "🔧 FIXING PRISMA GENERATION ISSUE"
echo "================================="

# Step 1: Check current directory structure
echo "📋 Step 1: Checking directory structure..."
docker exec servaan-backend-prod ls -la /app/

# Step 2: Check if package.json exists and its content
echo ""
echo "📋 Step 2: Checking package.json..."
docker exec servaan-backend-prod cat /app/package.json 2>/dev/null || echo "❌ No package.json in /app"

# Step 3: Check backend package.json
echo ""
echo "📋 Step 3: Checking backend package.json..."
docker exec servaan-backend-prod cat /app/src/backend/package.json 2>/dev/null || echo "❌ No package.json in backend"

# Step 4: Generate Prisma client from the correct location
echo ""
echo "📋 Step 4: Generating Prisma client from correct location..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma generate"

# Step 5: Check if client was generated
echo ""
echo "📋 Step 5: Checking if Prisma client was generated..."
docker exec servaan-backend-prod ls -la /app/shared/generated/client/ || echo "❌ Still no Prisma client"

# Step 6: Check if client exists in src/prisma
echo ""
echo "📋 Step 6: Checking if client exists in src/prisma..."
docker exec servaan-backend-prod ls -la /app/src/prisma/node_modules/.prisma/client/ || echo "❌ No client in src/prisma"

# Step 7: Try alternative generation approach
echo ""
echo "📋 Step 7: Trying alternative generation approach..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma generate --schema=./schema.prisma"

# Step 8: Check if client was generated now
echo ""
echo "📋 Step 8: Checking if Prisma client was generated now..."
docker exec servaan-backend-prod ls -la /app/shared/generated/client/ || echo "❌ Still no Prisma client"

# Step 9: Create the shared directory structure manually
echo ""
echo "📋 Step 9: Creating shared directory structure manually..."
docker exec servaan-backend-prod sh -c "mkdir -p /app/shared/generated/client"

# Step 10: Copy Prisma client to shared location
echo ""
echo "📋 Step 10: Copying Prisma client to shared location..."
docker exec servaan-backend-prod sh -c "cp -r /app/src/prisma/node_modules/.prisma/client/* /app/shared/generated/client/" 2>/dev/null || echo "❌ No client to copy"

# Step 11: Test Prisma client import
echo ""
echo "📋 Step 11: Testing Prisma client import..."
docker exec servaan-backend-prod node -e "
try {
  const { PrismaClient } = require('/app/shared/generated/client');
  console.log('✅ Prisma client imported successfully');
} catch (error) {
  console.log('❌ Prisma client import failed:', error.message);
}
"

echo ""
echo "🔧 PRISMA GENERATION FIX COMPLETE"
echo "================================="
