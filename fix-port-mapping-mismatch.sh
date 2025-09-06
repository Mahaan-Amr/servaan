#!/bin/bash

echo "🔧 Fix Port Mapping Mismatch Issue..."
echo "===================================="

echo "📋 Root cause identified:"
echo "- Docker Compose maps external 3004 → internal 3000"
echo "- But Dockerfile was configured to run on internal port 3004"
echo "- This creates a port mismatch causing 502 errors"
echo "- Health checks were also mismatched"
echo

echo "🔧 Fixes applied:"
echo "- Changed Dockerfile EXPOSE from 3004 to 3000"
echo "- Changed Dockerfile CMD PORT from 3004 to 3000"
echo "- Changed Dockerfile health check from localhost:3004 to localhost:3000"
echo "- Now matches the docker-compose port mapping: 3004:3000"
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
echo "🔧 Rebuilding admin frontend with correct port mapping..."
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

# Test direct connection to internal port
echo "🧪 Testing direct connection to admin frontend (internal port 3000)..."
curl -H "Host: admin.servaan.com" http://localhost:3000/admin/login -I

# Test through external port mapping
echo "🧪 Testing through external port mapping (3004:3000)..."
curl -H "Host: admin.servaan.com" http://localhost:3004/admin/login -I

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -H "Host: admin.servaan.com" http://localhost/admin/login -I

echo
echo "✅ Port mapping mismatch fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Container should run on internal port 3000"
echo "- Docker should map external 3004 → internal 3000"
echo "- Health check should pass (checking localhost:3000)"
echo "- Next.js standalone server should run on port 3000"
echo "- Admin panel should load correctly"
echo "- No more 502 Bad Gateway errors"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 Port mapping explanation:"
echo "- External access: https://admin.servaan.com (port 80/443)"
echo "- Nginx proxy: admin.servaan.com → localhost:3004"
echo "- Docker mapping: localhost:3004 → container:3000"
echo "- Next.js server: runs on container:3000"
echo "- Health check: container:3000"
