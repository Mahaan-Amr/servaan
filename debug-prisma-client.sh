#!/bin/bash

# =============================================================================
# Debug Prisma Client Issue
# =============================================================================
# This script checks if Prisma client is properly generated and accessible

set -e

echo "🔍 DEBUGGING PRISMA CLIENT ISSUE"
echo "==============================="

# Step 1: Check if Prisma client exists in backend container
echo "📋 Step 1: Checking Prisma client in backend container..."
docker exec servaan-backend-prod ls -la /app/shared/generated/client/ || echo "❌ Prisma client not found"

# Step 2: Check if the client index file exists
echo ""
echo "📋 Step 2: Checking Prisma client index file..."
docker exec servaan-backend-prod ls -la /app/shared/generated/client/index.js || echo "❌ Prisma client index not found"

# Step 3: Check if Prisma client can be imported
echo ""
echo "📋 Step 3: Testing Prisma client import..."
docker exec servaan-backend-prod node -e "
try {
  const { PrismaClient } = require('/app/shared/generated/client');
  console.log('✅ Prisma client imported successfully');
  console.log('Client type:', typeof PrismaClient);
} catch (error) {
  console.log('❌ Prisma client import failed:', error.message);
}
"

# Step 4: Check if Prisma client can connect to database
echo ""
echo "📋 Step 4: Testing Prisma client database connection..."
docker exec servaan-backend-prod node -e "
try {
  const { PrismaClient } = require('/app/shared/generated/client');
  const prisma = new PrismaClient();
  console.log('✅ Prisma client created successfully');
  
  // Test a simple query
  prisma.user.findFirst().then(() => {
    console.log('✅ Database connection successful');
    prisma.\$disconnect();
  }).catch((error) => {
    console.log('❌ Database connection failed:', error.message);
    prisma.\$disconnect();
  });
} catch (error) {
  console.log('❌ Prisma client creation failed:', error.message);
}
"

# Step 5: Check backend logs for Prisma errors
echo ""
echo "📋 Step 5: Checking backend logs for Prisma errors..."
docker logs servaan-backend-prod --tail 20 | grep -i prisma || echo "No Prisma errors found in recent logs"

# Step 6: Check if Prisma schema exists
echo ""
echo "📋 Step 6: Checking Prisma schema..."
docker exec servaan-backend-prod ls -la /app/src/prisma/schema.prisma || echo "❌ Prisma schema not found"

# Step 7: Try to generate Prisma client manually
echo ""
echo "📋 Step 7: Trying to generate Prisma client manually..."
docker exec servaan-backend-prod sh -c "cd /app/src/prisma && npx prisma generate"

echo ""
echo "🔍 PRISMA CLIENT DEBUG COMPLETE"
echo "==============================="
