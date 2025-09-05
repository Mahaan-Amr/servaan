#!/bin/bash

echo "🔍 Deep Analysis of Container Structure..."
echo "========================================"

echo "📋 Checking container file structure..."
echo "Root directory:"
docker exec servaan-admin-frontend-prod ls -la /

echo
echo "App directory:"
docker exec servaan-admin-frontend-prod ls -la /app

echo
echo "Next.js build directory:"
docker exec servaan-admin-frontend-prod ls -la /app/.next

echo
echo "Standalone directory:"
docker exec servaan-admin-frontend-prod ls -la /app/.next/standalone

echo
echo "Static directory in .next:"
docker exec servaan-admin-frontend-prod ls -la /app/.next/static

echo
echo "Public directory:"
docker exec servaan-admin-frontend-prod ls -la /app/public

echo
echo "Public _next directory:"
docker exec servaan-admin-frontend-prod ls -la /app/public/_next 2>/dev/null || echo "No public/_next directory found"

echo
echo "Public _next/static directory:"
docker exec servaan-admin-frontend-prod ls -la /app/public/_next/static 2>/dev/null || echo "No public/_next/static directory found"

echo
echo "📋 Checking Next.js standalone server configuration..."
docker exec servaan-admin-frontend-prod cat /app/.next/standalone/server.js | head -20

echo
echo "📋 Checking if standalone server has static file handling..."
docker exec servaan-admin-frontend-prod grep -n "static" /app/.next/standalone/server.js | head -10

echo
echo "📋 Testing direct file access..."
echo "Testing CSS file in .next/static:"
docker exec servaan-admin-frontend-prod cat /app/.next/static/css/3def91303ca5e863.css | head -5

echo "Testing CSS file in public/_next/static:"
docker exec servaan-admin-frontend-prod cat /app/public/_next/static/css/3def91303ca5e863.css 2>/dev/null | head -5 || echo "File not found in public/_next/static"

echo
echo "✅ Container structure analysis completed!"
