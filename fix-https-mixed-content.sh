#!/bin/bash

echo "🔧 Fix HTTPS Mixed Content Issue..."
echo "==================================="

echo "📋 Issue identified:"
echo "- Admin panel runs on HTTPS (https://admin.servaan.com)"
echo "- But API calls use HTTP URLs (http://admin-backend:3003/api)"
echo "- Browser blocks HTTP requests from HTTPS pages (Mixed Content policy)"
echo

echo "🔧 Solution implemented:"
echo "- Changed API URLs from HTTP to HTTPS"
echo "- Updated docker-compose.prod.yml: https://admin.servaan.com/api"
echo "- Updated Dockerfile: https://admin.servaan.com/api"
echo "- This allows HTTPS frontend to call HTTPS API endpoints"
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
echo "🔧 Rebuilding admin frontend with HTTPS API URLs..."
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
echo "✅ HTTPS Mixed Content fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Admin panel will use HTTPS API URLs"
echo "- No more Mixed Content errors"
echo "- Login should work correctly"
echo "- Network Error should be resolved"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 How it works:"
echo "- Frontend: https://admin.servaan.com (HTTPS)"
echo "- API calls: https://admin.servaan.com/api (HTTPS)"
echo "- Nginx routes: admin.servaan.com/api → localhost:3003"
echo "- No Mixed Content policy violations"
echo ""
echo "🔧 API Flow:"
echo "1. Browser: https://admin.servaan.com/admin/login"
echo "2. API call: https://admin.servaan.com/api/admin/auth/login"
echo "3. Nginx: routes to localhost:3003/api/admin/auth/login"
echo "4. Admin backend: responds with authentication"
echo "5. Frontend: receives response and processes login"
