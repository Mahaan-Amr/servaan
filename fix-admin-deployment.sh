#!/bin/bash

echo "🔧 Fixing Admin Frontend Deployment..."
echo "======================================"

# Stop all containers
echo "📦 Stopping all containers..."
docker-compose -f docker-compose.prod.yml down

# Remove admin frontend container and image to force rebuild
echo "🗑️ Removing admin frontend container and image..."
docker rm -f servaan-admin-frontend-prod 2>/dev/null || true
docker rmi servaan_admin-frontend 2>/dev/null || true

# Clear Docker build cache
echo "🧹 Clearing Docker build cache..."
docker builder prune -f

# Rebuild admin frontend with no cache
echo "🔨 Rebuilding admin frontend with no cache..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-frontend

# Start all containers
echo "🚀 Starting all containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 30

# Check admin frontend container status
echo "🔍 Checking admin frontend container status..."
docker ps | grep servaan-admin-frontend-prod

# Check admin frontend logs
echo "📋 Checking admin frontend logs..."
docker logs servaan-admin-frontend-prod --tail 20

# Test admin frontend endpoint
echo "🧪 Testing admin frontend endpoint..."
curl -H "Host: admin.servaan.com" http://localhost:3004 -I

echo "✅ Admin frontend deployment fix completed!"
echo ""
echo "Next steps:"
echo "1. Check if admin.servaan.com is working"
echo "2. If still having issues, check the logs above"
echo "3. Verify environment variables in the container:"
echo "   docker exec servaan-admin-frontend-prod env | grep NEXT_PUBLIC"
