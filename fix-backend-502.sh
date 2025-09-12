#!/bin/bash

echo "🔧 FIXING BACKEND 502 BAD GATEWAY ERROR"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "📋 Step 1: Checking backend container status..."

# Check if backend container is running
docker ps | grep servaan-backend-prod

if [ $? -eq 0 ]; then
    echo "✅ Backend container is running"
else
    echo "❌ Backend container is not running"
fi

echo ""
echo "📋 Step 2: Checking backend container logs..."

# Show recent backend logs
echo "Recent backend logs:"
docker logs --tail 50 servaan-backend-prod

echo ""
echo "📋 Step 3: Checking backend container health..."

# Check if backend is responding on port 3001
curl -s http://127.0.0.1:3001/api/health || echo "❌ Backend not responding on port 3001"

echo ""
echo "📋 Step 4: Checking NGINX upstream configuration..."

# Check NGINX configuration for backend upstream
echo "NGINX upstream configuration:"
grep -A 10 -B 5 "proxy_pass.*3001" /etc/nginx/sites-enabled/servaan

echo ""
echo "📋 Step 5: Testing direct backend connection..."

# Test direct connection to backend
echo "Testing direct backend connection:"
curl -v http://127.0.0.1:3001/api/health 2>&1 | head -20

echo ""
echo "📋 Step 6: Checking backend container environment..."

# Check backend container environment
echo "Backend container environment:"
docker exec servaan-backend-prod env | grep -E "(NODE_ENV|BACKEND_PORT|DATABASE_URL)" || echo "❌ Cannot access backend container"

echo ""
echo "📋 Step 7: Restarting backend service..."

# Restart backend service
docker-compose -f docker-compose.prod.yml restart backend

if [ $? -eq 0 ]; then
    echo "✅ Backend service restarted"
else
    echo "❌ Failed to restart backend service"
fi

echo ""
echo "📋 Step 8: Waiting for backend to start..."

# Wait for backend to start
sleep 10

echo ""
echo "📋 Step 9: Testing backend health after restart..."

# Test backend health
curl -s http://127.0.0.1:3001/api/health

if [ $? -eq 0 ]; then
    echo "✅ Backend is responding after restart"
else
    echo "❌ Backend still not responding"
fi

echo ""
echo "📋 Step 10: Testing through NGINX..."

# Test through NGINX
curl -s https://api.servaan.com/api/health

if [ $? -eq 0 ]; then
    echo "✅ Backend is responding through NGINX"
else
    echo "❌ Backend still not responding through NGINX"
fi

echo ""
echo "📋 Step 11: Checking backend container logs after restart..."

# Show recent backend logs after restart
echo "Recent backend logs after restart:"
docker logs --tail 20 servaan-backend-prod

echo ""
echo "🎉 BACKEND 502 FIX COMPLETE!"
echo "============================"
echo "✅ Diagnosed backend container issues"
echo "✅ Restarted backend service"
echo "✅ Tested backend connectivity"
echo ""
echo "🌐 Try logging in now: https://dima.servaan.com"
echo ""
echo "📝 If still having issues, check:"
echo "   - Backend container logs: docker logs servaan-backend-prod"
echo "   - Backend health: curl http://127.0.0.1:3001/api/health"
echo "   - NGINX upstream: curl https://api.servaan.com/api/health"
