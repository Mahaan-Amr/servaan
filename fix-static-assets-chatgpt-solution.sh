#!/bin/bash

echo "🔧 Fix Static Assets - ChatGPT Solution..."
echo "=========================================="

echo "📋 ChatGPT's analysis:"
echo "- Next.js app serves HTML (server running fine)"
echo "- All /_next/static/ requests return 404"
echo "- .next/static/ assets weren't copied into runtime image"
echo "- Need to explicitly copy .next/static directory"
echo

echo "🔧 Solution implemented:"
echo "- Keep port mapping fix (no 502 regression)"
echo "- Use npm start (proven pattern)"
echo "- Explicitly copy .next/static directory"
echo "- Follow ChatGPT's Dockerfile recommendations"
echo

# Stop admin frontend
echo "🔧 Stopping admin frontend container..."
docker-compose -f docker-compose.prod.yml stop admin-frontend

# Remove admin frontend container
echo "🔧 Removing admin frontend container..."
docker-compose -f docker-compose.prod.yml rm -f admin-frontend

# Remove admin frontend image
echo "🔧 Removing admin frontend image..."
docker rmi app-admin-frontend 2>/dev/null || echo "Image not found"

# Clear Docker build cache
echo "🔧 Clearing Docker build cache..."
docker builder prune -f

# Rebuild admin frontend
echo "🔧 Rebuilding admin frontend with ChatGPT's static assets fix..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-frontend

# Start admin frontend
echo "🔧 Starting admin frontend..."
docker-compose -f docker-compose.prod.yml up -d admin-frontend

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 30

# Check container status
echo "🔍 Checking admin frontend container status..."
docker ps | grep admin-frontend

# Check admin frontend logs
echo "🔍 Checking admin frontend logs..."
docker logs servaan-admin-frontend-prod --tail 20

# Check container health
echo "🔍 Checking container health..."
docker inspect servaan-admin-frontend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not found"

# Double-check static assets exist (ChatGPT's recommendation)
echo "🔍 Double-checking static assets exist in container..."
docker exec servaan-admin-frontend-prod ls -la .next/static

# Test direct connection (should not be 502)
echo "🧪 Testing direct connection to admin frontend..."
curl -H "Host: admin.servaan.com" http://localhost:3004/admin/login -I

# Test static assets (should now be 200)
echo "🧪 Testing static assets..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -H "Host: admin.servaan.com" http://localhost/admin/login -I

echo
echo "✅ Static assets fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- No 502 errors (port mapping preserved)"
echo "- Static assets return 200 OK instead of 404"
echo "- Admin panel loads with proper styling"
echo "- Container is healthy"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 ChatGPT's fix applied:"
echo "- Explicitly copy .next/static directory"
echo "- Use npm start (proven pattern)"
echo "- Maintain port mapping fix"
echo "- No standalone mode complexity"
