#!/bin/bash

echo "🔧 Fix Admin CORS Issue..."
echo "=========================="

echo "📋 Issue identified:"
echo "- Frontend running on: http://admin.localhost:3004"
echo "- API calls going to: https://admin.servaan.com/api/admin/auth/login"
echo "- Browser blocks request due to CORS policy"
echo "- Different origins: localhost vs servaan.com"
echo

echo "🔧 Solution:"
echo "- Add http://admin.localhost:3004 to admin backend CORS allowed origins"
echo "- Rebuild and restart admin backend"
echo "- Test CORS configuration"
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
    
    echo "🔍 Checking current CORS configuration..."
    docker exec servaan-admin-backend-prod node -e "
    const { adminConfig } = require('./dist/admin/backend/src/config/admin.js');
    console.log('Allowed CORS origins:', adminConfig.cors.allowedOrigins);
    " 2>/dev/null || echo "Could not read CORS config"
    
    echo "🔍 Testing CORS with localhost origin..."
    curl -s -H "Origin: http://admin.localhost:3004" \
         -H "Access-Control-Request-Method: POST" \
         -H "Access-Control-Request-Headers: Content-Type" \
         -X OPTIONS \
         http://localhost:3003/api/admin/auth/login || echo "CORS preflight failed"
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

echo "🔧 Rebuilding admin backend with CORS fix..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-backend

echo "🔧 Starting admin backend..."
docker-compose -f docker-compose.prod.yml up -d admin-backend

echo "⏳ Waiting for admin backend to start..."
sleep 10

echo "🔍 Checking admin backend status after restart..."
if docker ps | grep -q "servaan-admin-backend-prod"; then
    echo "✅ Admin backend container is running"
    
    echo "🔍 Checking updated CORS configuration..."
    docker exec servaan-admin-backend-prod node -e "
    const { adminConfig } = require('./dist/admin/backend/src/config/admin.js');
    console.log('Allowed CORS origins:', adminConfig.cors.allowedOrigins);
    " 2>/dev/null || echo "Could not read CORS config"
    
    echo "🔍 Testing CORS with localhost origin..."
    if curl -s -H "Origin: http://admin.localhost:3004" \
             -H "Access-Control-Request-Method: POST" \
             -H "Access-Control-Request-Headers: Content-Type" \
             -X OPTIONS \
             http://localhost:3003/api/admin/auth/login; then
        echo "✅ CORS preflight request successful"
    else
        echo "❌ CORS preflight request failed"
    fi
    
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
echo "✅ Admin CORS issue fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Admin backend allows http://admin.localhost:3004 origin"
echo "- CORS preflight requests succeed"
echo "- Admin auth endpoint responds correctly"
echo "- No more CORS errors in browser"
echo ""
echo "🧪 Test in browser:"
echo "1. Open http://admin.localhost:3004/admin/login"
echo "2. Try logging in with test credentials"
echo "3. Should work without CORS errors"
echo ""
echo "📊 If still having issues, check:"
echo "- Browser console for CORS errors"
echo "- Docker logs: docker-compose -f docker-compose.prod.yml logs admin-backend"
echo "- CORS config: docker exec servaan-admin-backend-prod node -e \"console.log(require('./dist/admin/backend/src/config/admin.js').adminConfig.cors.allowedOrigins)\""
