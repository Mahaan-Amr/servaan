#!/bin/bash

# =============================================================================
# Rebuild Backend to Fix CORS Duplicate Headers
# =============================================================================
# This script rebuilds the backend to ensure the latest CORS configuration

set -e

echo "🔧 Rebuilding backend to fix CORS duplicate headers..."

# Step 1: Stop the backend service
echo "🛑 Stopping backend service..."
docker compose -f docker-compose.prod.yml stop backend

# Step 2: Remove the backend container
echo "🗑️  Removing backend container..."
docker compose -f docker-compose.prod.yml rm -f backend

# Step 3: Rebuild the backend with no cache
echo "🔨 Rebuilding backend (no cache)..."
docker compose -f docker-compose.prod.yml build --no-cache backend

# Step 4: Start the backend service
echo "🚀 Starting backend service..."
docker compose -f docker-compose.prod.yml up -d backend

# Step 5: Wait for backend to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 15

# Step 6: Check backend health
echo "🏥 Checking backend health..."
docker compose -f docker-compose.prod.yml ps backend

# Step 7: Test the API endpoint
echo "🧪 Testing API endpoint..."
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I

echo "✅ Backend rebuild completed!"
echo "📊 Summary:"
echo "- Backend service stopped and removed"
echo "- Backend rebuilt with no cache"
echo "- Backend service restarted"
echo "- CORS headers should now be correct"
