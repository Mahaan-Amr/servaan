#!/bin/bash

# =============================================================================
# Debug Complete Login Flow
# =============================================================================
# This script traces the complete login flow from frontend to backend

set -e

echo "🔍 DEBUGGING COMPLETE LOGIN FLOW"
echo "==============================="

# Step 1: Test backend health endpoint
echo "📋 Step 1: Testing backend health endpoint..."
echo "Direct backend connection:"
curl -s http://localhost:3001/api/health || echo "❌ Direct backend failed"

echo ""
echo "Through NGINX (api.servaan.com):"
curl -s -H "Host: api.servaan.com" http://localhost/api/health || echo "❌ NGINX proxy failed"

# Step 2: Test auth endpoint directly
echo ""
echo "📋 Step 2: Testing auth endpoint directly..."
echo "Direct backend auth endpoint:"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' || echo "❌ Direct auth failed"

# Step 3: Test auth endpoint through NGINX
echo ""
echo "📋 Step 3: Testing auth endpoint through NGINX..."
echo "Through NGINX auth endpoint:"
curl -s -X POST -H "Host: api.servaan.com" http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' || echo "❌ NGINX auth failed"

# Step 4: Check what routes are actually registered
echo ""
echo "📋 Step 4: Checking backend logs for route registration..."
docker logs servaan-backend-prod --tail 30 | grep -i "route\|auth\|login" || echo "No route info in logs"

# Step 5: Test if backend is actually running the auth routes
echo ""
echo "📋 Step 5: Testing if auth routes are working..."
docker exec servaan-backend-prod node -e "
const express = require('express');
const app = express();
app.use(express.json());

// Test if we can import auth routes
try {
  const { authRoutes } = require('/app/src/backend/src/routes/authRoutes.ts');
  console.log('✅ Auth routes imported successfully');
} catch (error) {
  console.log('❌ Auth routes import failed:', error.message);
}
"

# Step 6: Check if Prisma client is working in the backend
echo ""
echo "📋 Step 6: Testing Prisma client in backend..."
docker exec servaan-backend-prod node -e "
try {
  const { PrismaClient } = require('/app/shared/generated/client');
  const prisma = new PrismaClient();
  console.log('✅ Prisma client created successfully');
  
  prisma.user.findFirst().then(() => {
    console.log('✅ Database query successful');
    prisma.\$disconnect();
  }).catch((error) => {
    console.log('❌ Database query failed:', error.message);
    prisma.\$disconnect();
  });
} catch (error) {
  console.log('❌ Prisma client failed:', error.message);
}
"

# Step 7: Check backend container status
echo ""
echo "📋 Step 7: Checking backend container status..."
docker ps | grep servaan-backend-prod

# Step 8: Check if backend is listening on port 3001
echo ""
echo "📋 Step 8: Checking if backend is listening on port 3001..."
netstat -tlnp | grep :3001 || echo "❌ Backend not listening on port 3001"

echo ""
echo "🔍 LOGIN FLOW DEBUG COMPLETE"
echo "============================"
