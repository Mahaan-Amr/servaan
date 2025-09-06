#!/bin/bash

echo "🔧 Fix Port 3000 for npm start..."
echo "================================="

echo "📋 Issue identified:"
echo "- npm start runs 'next start -p 3004' by default"
echo "- But Docker Compose maps '3004:3000' (external 3004 → internal 3000)"
echo "- This creates port mismatch causing 502 errors"
echo

echo "🔧 Solution:"
echo "- Force npm start to run on port 3000"
echo "- Use PORT=3000 npm start"
echo "- This matches the Docker Compose mapping"
echo

# Stop admin frontend
echo "🔧 Stopping admin frontend container..."
docker-compose -f docker-compose.prod.yml stop admin-frontend

# Remove admin frontend container
echo "🔧 Removing admin frontend container..."
docker-compose -f docker-compose.prod.yml rm -f admin-frontend

# Remove admin frontend image
echo "🔧 Removing admin frontend image..."
docker rmi app-admin-frontend 2>/dev/null || echo "Image not found"

# Clear Docker build cache
echo "🔧 Clearing Docker build cache..."
docker builder prune -f

# Rebuild admin frontend
echo "🔧 Rebuilding admin frontend with PORT=3000..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-frontend

# Start admin frontend
echo "🔧 Starting admin frontend..."
docker-compose -f docker-compose.prod.yml up -d admin-frontend

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 30

# Check container status
echo "🔍 Checking admin frontend container status..."
docker ps | grep admin-frontend

# Check admin frontend logs
echo "🔍 Checking admin frontend logs..."
docker logs servaan-admin-frontend-prod --tail 20

# Check container health
echo "🔍 Checking container health..."
docker inspect servaan-admin-frontend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not found"

# Test direct connection
echo "🧪 Testing direct connection to admin frontend..."
curl -H "Host: admin.servaan.com" http://localhost:3004/admin/login -I

# Test static assets
echo "🧪 Testing static assets..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -H "Host: admin.servaan.com" http://localhost/admin/login -I

echo
echo "✅ Port 3000 fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Next.js runs on port 3000 (matches Docker mapping)"
echo "- No more 502 errors"
echo "- Static assets should work correctly"
echo "- Admin panel should load with proper styling"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 Port mapping explanation:"
echo "- Docker Compose: '3004:3000' (external 3004 → internal 3000)"
echo "- Next.js: runs on port 3000 (internal)"
echo "- Nginx: routes admin.servaan.com → localhost:3004 → container:3000"
echo "- Health check: container:3000"
