#!/bin/bash

echo "🔍 Debugging Admin Frontend Status..."
echo "===================================="

echo "📋 Checking admin frontend container status..."
docker ps | grep admin-frontend
echo

echo "📋 Checking admin frontend logs..."
docker logs servaan-admin-frontend-prod --tail 10
echo

echo "📋 Testing admin frontend root path..."
echo "Response from root path:"
curl -H "Host: admin.servaan.com" http://localhost:3004 -s | head -10
echo

echo "📋 Testing admin frontend login path..."
echo "Response from /login path:"
curl -H "Host: admin.servaan.com" http://localhost:3004/login -I
echo

echo "📋 Checking admin frontend build structure..."
docker exec servaan-admin-frontend-prod ls -la .next/ 2>/dev/null || echo "No .next directory found"
echo

echo "📋 Checking admin frontend package.json..."
docker exec servaan-admin-frontend-prod cat package.json 2>/dev/null | grep -A 5 -B 5 "scripts" || echo "Cannot read package.json"
echo

echo "📋 Checking admin frontend environment variables..."
docker exec servaan-admin-frontend-prod env | grep NEXT_PUBLIC || echo "No NEXT_PUBLIC variables found"
echo

echo "📋 Checking if admin frontend is serving static files..."
docker exec servaan-admin-frontend-prod ls -la .next/static/ 2>/dev/null || echo "No static files found"
echo

echo "✅ Admin frontend debug completed!"
