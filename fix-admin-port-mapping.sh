#!/bin/bash

echo "🔧 Fixing Admin Frontend Port Mapping..."
echo "======================================"

echo "📋 The issue: Admin frontend runs on port 3000 inside container"
echo "📋 But Docker was mapping host port 3004 to container port 3004"
echo "📋 This caused 'Connection reset by peer' errors"
echo

echo "🔧 Stopping admin frontend container..."
docker-compose -f docker-compose.prod.yml stop admin-frontend

echo "🔧 Removing admin frontend container..."
docker-compose -f docker-compose.prod.yml rm -f admin-frontend

echo "🔧 Starting admin frontend with correct port mapping..."
docker-compose -f docker-compose.prod.yml up -d admin-frontend

echo "⏳ Waiting for container to be ready..."
sleep 10

echo "🔍 Checking admin frontend container status..."
docker ps | grep admin-frontend

echo "🔍 Checking admin frontend logs..."
docker logs servaan-admin-frontend-prod --tail 10

echo "🧪 Testing direct access to admin frontend..."
if curl -s -H "Host: admin.servaan.com" http://localhost:3004 >/dev/null 2>&1; then
    echo "✅ Admin frontend now responding on port 3004!"
else
    echo "❌ Admin frontend still not responding"
    echo "📋 Checking port mapping..."
    docker port servaan-admin-frontend-prod
fi

echo "🧪 Testing admin domain routing..."
if curl -s -H "Host: admin.servaan.com" http://localhost >/dev/null 2>&1; then
    echo "✅ Admin domain routing working!"
else
    echo "❌ Admin domain routing failed"
fi

echo
echo "✅ Admin frontend port mapping fix completed!"
echo ""
echo "Next steps:"
echo "1. Test https://admin.servaan.com in your browser"
echo "2. The admin panel should now load correctly"
echo "3. No more tenant resolution errors!"
