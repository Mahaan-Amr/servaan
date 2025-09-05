#!/bin/bash

echo "🔍 Debugging Static Assets Issue..."
echo "=================================="

echo "📋 Testing static asset access..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

echo "Testing favicon:"
curl -H "Host: admin.servaan.com" http://localhost:3004/favicon.ico -I

echo
echo "📋 Testing through Nginx (admin.servaan.com)..."
echo "Testing CSS file through Nginx:"
curl -H "Host: admin.servaan.com" http://localhost/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk through Nginx:"
curl -H "Host: admin.servaan.com" http://localhost/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

echo
echo "📋 Checking admin frontend static files..."
docker exec servaan-admin-frontend-prod ls -la .next/static/css/ 2>/dev/null || echo "No CSS files found"
docker exec servaan-admin-frontend-prod ls -la .next/static/chunks/ 2>/dev/null || echo "No chunks found"

echo
echo "📋 Checking Nginx configuration for static files..."
sudo nginx -T 2>/dev/null | grep -A 10 -B 5 "admin.servaan.com" | grep -A 5 -B 5 "location"

echo
echo "📋 Testing admin frontend root with static assets..."
curl -H "Host: admin.servaan.com" http://localhost:3004 -s | grep -o '_next/static/[^"]*' | head -5

echo
echo "✅ Static assets debug completed!"
