#!/bin/bash

# =============================================================================
# Apply CORS Fix - Rebuild Backend with Simplified CORS Configuration
# =============================================================================
# This script rebuilds the backend with the simplified CORS configuration

set -e

echo "🔧 Applying CORS fix - rebuilding backend with simplified CORS configuration..."

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

# Step 7: Test the API endpoint for CORS headers
echo "🧪 Testing API endpoint for CORS headers..."
echo "Testing with Origin header:"
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I

echo ""
echo "Testing direct backend connection:"
curl -H "Origin: https://dima.servaan.com" http://localhost:3001/api/tenants/dima -I

echo "✅ CORS fix applied successfully!"
echo "📊 Summary:"
echo "- Backend rebuilt with simplified CORS configuration"
echo "- Removed explicit methods and allowedHeaders to prevent duplicates"
echo "- CORS middleware now handles headers automatically"
echo "- Cross-device access should now work properly"
