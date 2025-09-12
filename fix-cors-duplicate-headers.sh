#!/bin/bash

# =============================================================================
# Fix CORS Duplicate Headers Issue
# =============================================================================
# This script fixes the duplicate CORS headers issue

set -e

echo "🔧 Fixing CORS duplicate headers issue..."

# Step 1: Check if backend is running with updated CORS config
echo "📋 Checking backend CORS configuration..."
docker compose -f docker-compose.prod.yml logs backend --tail=20 | grep -i cors || echo "No CORS logs found"

# Step 2: Rebuild and restart backend to ensure latest CORS config
echo "🔧 Rebuilding backend with latest CORS configuration..."
docker compose -f docker-compose.prod.yml build --no-cache backend

echo "🔄 Restarting backend service..."
docker compose -f docker-compose.prod.yml up -d --no-deps backend

# Step 3: Wait for backend to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Step 4: Test the API endpoint
echo "🧪 Testing API endpoint..."
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I

echo "✅ CORS fix completed!"
echo "📊 Summary:"
echo "- Backend rebuilt with latest CORS configuration"
echo "- Backend service restarted"
echo "- API endpoint should now work without duplicate headers"
