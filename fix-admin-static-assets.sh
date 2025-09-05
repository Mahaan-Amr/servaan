#!/bin/bash

echo "🔧 Fixing Admin Frontend Static Assets..."
echo "======================================="

echo "📋 Current issue: Next.js standalone server not serving static files"
echo "📋 Static files exist in container but return 404 when accessed"
echo

# Stop admin frontend
echo "🔧 Stopping admin frontend container..."
docker-compose -f docker-compose.prod.yml stop admin-frontend

# Remove admin frontend container
echo "🔧 Removing admin frontend container..."
docker-compose -f docker-compose.prod.yml rm -f admin-frontend

# Rebuild admin frontend with static assets fix
echo "🔧 Rebuilding admin frontend with static assets fix..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-frontend

# Start admin frontend
echo "🔧 Starting admin frontend..."
docker-compose -f docker-compose.prod.yml up -d admin-frontend

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 15

# Check container status
echo "🔍 Checking admin frontend container status..."
docker ps | grep admin-frontend

# Check admin frontend logs
echo "🔍 Checking admin frontend logs..."
docker logs servaan-admin-frontend-prod --tail 10

# Test static assets
echo "🧪 Testing static assets..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

echo "Testing through Nginx:"
curl -H "Host: admin.servaan.com" http://localhost/_next/static/css/3def91303ca5e863.css -I

echo
echo "✅ Admin frontend static assets fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Static assets should now return 200 OK instead of 404"
echo "- Admin panel should load with proper styling"
echo "- No more 404 errors for CSS and JavaScript files"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
