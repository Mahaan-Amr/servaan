#!/bin/bash

echo "🔧 Fix Next.js Standalone Mode Issue..."
echo "======================================="

echo "📋 Issue identified:"
echo "- Container is running 'next start' instead of 'node .next/standalone/server.js'"
echo "- This causes the 'output: standalone' configuration error"
echo "- Health check is failing because Next.js is not running in standalone mode"
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
echo "🔧 Rebuilding admin frontend with fixed Dockerfile..."
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

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -H "Host: admin.servaan.com" http://localhost/admin/login -I

echo
echo "✅ Next.js standalone mode fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Container should be healthy instead of unhealthy"
echo "- Next.js should run in standalone mode"
echo "- No more 'output: standalone' configuration error"
echo "- Admin panel should load correctly"
echo "- No more 502 Bad Gateway errors"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
