#!/bin/bash

# =============================================================================
# Check Backend API Status
# =============================================================================
# This script checks if the backend API is running and accessible

set -e

echo "🔍 CHECKING BACKEND API STATUS"
echo "=============================="

# Step 1: Check if backend container is running
echo "📋 Step 1: Checking backend container status..."
docker ps | grep servaan-backend-prod || echo "❌ Backend container not found"

# Step 2: Check backend health endpoint
echo ""
echo "📋 Step 2: Testing backend health endpoint..."
echo "Testing direct backend connection (port 3001):"
curl -s http://localhost:3001/api/health || echo "❌ Direct backend connection failed"

echo ""
echo "Testing through NGINX (api.servaan.com):"
curl -s -H "Host: api.servaan.com" http://localhost/api/health || echo "❌ NGINX proxy failed"

# Step 3: Check auth endpoint specifically
echo ""
echo "📋 Step 3: Testing auth endpoint..."
echo "Testing auth endpoint through NGINX:"
curl -s -H "Host: api.servaan.com" -H "Content-Type: application/json" \
  -X POST http://localhost/api/auth/login \
  -d '{"email":"test@test.com","password":"test123"}' || echo "❌ Auth endpoint failed"

# Step 4: Check backend logs
echo ""
echo "📋 Step 4: Checking backend logs..."
echo "Last 10 lines of backend logs:"
docker logs servaan-backend-prod --tail 10

# Step 5: Check if backend is listening on port 3001
echo ""
echo "📋 Step 5: Checking if backend is listening on port 3001..."
netstat -tlnp | grep :3001 || echo "❌ Backend not listening on port 3001"

# Step 6: Test tenant endpoint
echo ""
echo "📋 Step 6: Testing tenant endpoint..."
echo "Testing tenant endpoint:"
curl -s -H "Host: api.servaan.com" http://localhost/api/tenants/dima || echo "❌ Tenant endpoint failed"

echo ""
echo "🔍 BACKEND API STATUS CHECK COMPLETE"
echo "===================================="
