#!/bin/bash

echo "🔧 Fixing Docker Cache Issue..."
echo "==============================="

echo "📋 Issue identified:"
echo "- Docker is using cached layers from builder stage"
echo "- The COPY . . step is cached with old structure"
echo "- This causes the public directory to not be found"
echo

echo "🔧 Solution: Force complete rebuild without any cache"
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

# Remove all Docker images related to admin frontend
echo "🔧 Removing all admin frontend related images..."
docker images | grep admin-frontend | awk '{print $3}' | xargs -r docker rmi -f

# Clear ALL Docker build cache
echo "🔧 Clearing ALL Docker build cache..."
docker builder prune -a -f

# Remove any dangling images
echo "🔧 Removing dangling images..."
docker image prune -f

# Rebuild admin frontend with NO CACHE
echo "🔧 Rebuilding admin frontend with NO CACHE..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull admin-frontend

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

# Test static assets
echo "🧪 Testing static assets..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

echo "Testing through Nginx:"
curl -H "Host: admin.servaan.com" http://localhost/_next/static/css/3def91303ca5e863.css -I

# Test admin login page
echo "🧪 Testing admin login page..."
curl -H "Host: admin.servaan.com" http://localhost:3004/admin/login -I

echo
echo "✅ Docker cache fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Docker build should complete successfully"
echo "- Static assets should return 200 OK instead of 404"
echo "- Admin panel should load with proper styling"
echo "- No more 404 errors for CSS and JavaScript files"
echo "- Admin login page should be fully functional"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
