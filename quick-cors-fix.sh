#!/bin/bash

# =============================================================================
# Quick CORS Fix - Restart Backend Only
# =============================================================================
# This script quickly restarts the backend without rebuilding

set -e

echo "🚀 Quick CORS fix - restarting backend..."

# Step 1: Just restart the backend (no rebuild)
echo "🔄 Restarting backend service..."
docker compose -f docker-compose.prod.yml restart backend

# Step 2: Wait for backend to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Step 3: Check backend health
echo "🏥 Checking backend health..."
docker compose -f docker-compose.prod.yml ps backend

# Step 4: Test the API endpoint
echo "🧪 Testing API endpoint..."
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I

echo "✅ Quick CORS fix applied!"
echo "📊 If this doesn't work, we need to rebuild the backend container"
