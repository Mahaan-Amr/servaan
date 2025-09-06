#!/bin/bash

echo "🔍 Debug Static Files Issue..."
echo "=============================="

echo "📋 Issue: Next.js standalone server not serving static files"
echo "- Page loads (502 fixed) but no CSS/JS files"
echo "- All _next/static/ requests return 404"
echo

# Check container status
echo "🔍 Checking admin frontend container status..."
docker ps | grep admin-frontend

# Check what's inside the container
echo "🔍 Checking container file structure..."
docker exec servaan-admin-frontend-prod ls -la /app

echo "🔍 Checking .next directory..."
docker exec servaan-admin-frontend-prod ls -la /app/.next

echo "🔍 Checking .next/static directory..."
docker exec servaan-admin-frontend-prod ls -la /app/.next/static 2>/dev/null || echo "No .next/static directory found"

echo "🔍 Checking public directory..."
docker exec servaan-admin-frontend-prod ls -la /app/public

echo "🔍 Checking if standalone server.js exists..."
docker exec servaan-admin-frontend-prod ls -la /app/.next/standalone

echo "🔍 Checking standalone server.js..."
docker exec servaan-admin-frontend-prod ls -la /app/.next/standalone/server.js 2>/dev/null || echo "No standalone server.js found"

# Test direct access to static files
echo "🧪 Testing direct access to static files..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JS chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

# Check container logs for any errors
echo "🔍 Checking container logs for errors..."
docker logs servaan-admin-frontend-prod --tail 20

echo
echo "✅ Static files debug completed!"
echo ""
echo "🎯 Expected findings:"
echo "- .next/static directory should exist with CSS/JS files"
echo "- Standalone server.js should exist"
echo "- Direct access to static files should work"
echo ""
echo "🔧 If static files are missing, we need to fix the Dockerfile"
echo "🔧 If static files exist but aren't served, we need to fix Next.js config"
