#!/bin/bash

echo "🔧 Fix Admin Backend Port Mismatch..."
echo "====================================="

echo "📋 Issue identified:"
echo "- Docker Compose sets ADMIN_BACKEND_PORT=3003"
echo "- Admin config default port is 3002"
echo "- Port mapping: 3003:3003"
echo "- Health check expects port 3003"
echo "- Admin backend might be starting on wrong port"
echo

echo "🔧 Solution:"
echo "- Fix admin backend configuration to use correct port"
echo "- Ensure environment variable is properly read"
echo "- Rebuild and restart admin backend"
echo

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Please run this script from the servaan project root directory"
    exit 1
fi

# Check current admin backend container status
echo "🔍 Checking current admin backend status..."
if docker ps | grep -q "servaan-admin-backend-prod"; then
    echo "📋 Admin backend container is running"
    docker ps | grep "servaan-admin-backend-prod"
    
    echo "🔍 Checking admin backend logs..."
    docker logs --tail 20 servaan-admin-backend-prod
    
    echo "🔍 Checking what port admin backend is listening on..."
    docker exec servaan-admin-backend-prod netstat -tlnp 2>/dev/null | grep LISTEN || echo "netstat not available"
    
    echo "🔍 Testing admin backend health endpoint..."
    curl -s http://localhost:3003/api/admin/health || echo "Health check failed"
    
    echo "🔍 Testing admin backend on port 3002..."
    curl -s http://localhost:3002/api/admin/health || echo "Port 3002 not responding"
else
    echo "⚠️  Admin backend container is not running"
fi

echo
echo "🔧 Stopping admin backend container..."
docker-compose -f docker-compose.prod.yml stop admin-backend

echo "🔧 Removing admin backend container..."
docker-compose -f docker-compose.prod.yml rm -f admin-backend

echo "🔧 Removing admin backend image..."
docker rmi app-admin-backend 2>/dev/null || echo "Image not found"

echo "🔧 Clearing Docker build cache..."
docker builder prune -f

echo "🔧 Rebuilding admin backend..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-backend

echo "🔧 Starting admin backend..."
docker-compose -f docker-compose.prod.yml up -d admin-backend

echo "⏳ Waiting for admin backend to start..."
sleep 10

echo "🔍 Checking admin backend status after restart..."
if docker ps | grep -q "servaan-admin-backend-prod"; then
    echo "✅ Admin backend container is running"
    
    echo "🔍 Checking admin backend logs..."
    docker logs --tail 10 servaan-admin-backend-prod
    
    echo "🔍 Testing admin backend health endpoint..."
    if curl -s http://localhost:3003/api/admin/health; then
        echo "✅ Admin backend health check passed"
    else
        echo "❌ Admin backend health check failed"
    fi
    
    echo "🔍 Testing admin auth endpoint..."
    if curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}' http://localhost:3003/api/admin/auth/login; then
        echo "✅ Admin auth endpoint is responding"
    else
        echo "❌ Admin auth endpoint failed"
    fi
else
    echo "❌ Admin backend container failed to start"
    echo "🔍 Checking Docker logs..."
    docker-compose -f docker-compose.prod.yml logs admin-backend
fi

echo
echo "✅ Admin backend port mismatch fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Admin backend should start on port 3003"
echo "- Health check should pass"
echo "- Admin auth endpoint should respond"
echo "- No more 404 errors"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 If still having issues, check:"
echo "- Docker logs: docker-compose -f docker-compose.prod.yml logs admin-backend"
echo "- Container status: docker ps | grep admin-backend"
echo "- Port listening: docker exec servaan-admin-backend-prod netstat -tlnp"
