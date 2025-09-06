#!/bin/bash

echo "🔧 Fix Docker Next.js Pattern Issue..."
echo "====================================="

echo "📋 Root cause identified:"
echo "- Admin frontend was trying to use Next.js standalone mode"
echo "- Main frontend uses regular Next.js with 'npm start'"
echo "- Standalone mode requires complex Docker configuration"
echo "- Regular Next.js handles static files automatically"
echo

echo "🔧 Solution:"
echo "- Remove standalone mode from admin frontend"
echo "- Use same pattern as main frontend: 'npm start'"
echo "- This will automatically handle static files correctly"
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
echo "🔧 Rebuilding admin frontend with regular Next.js pattern..."
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

# Test direct connection
echo "🧪 Testing direct connection to admin frontend..."
curl -H "Host: admin.servaan.com" http://localhost:3004/admin/login -I

# Test static assets
echo "🧪 Testing static assets..."
echo "Testing CSS file:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/css/3def91303ca5e863.css -I

echo "Testing JavaScript chunk:"
curl -H "Host: admin.servaan.com" http://localhost:3004/_next/static/chunks/webpack-dd7bdfb4b7eae6a8.js -I

# Test through Nginx
echo "🧪 Testing through Nginx..."
curl -H "Host: admin.servaan.com" http://localhost/admin/login -I

echo
echo "✅ Docker Next.js pattern fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Admin frontend uses same pattern as main frontend"
echo "- Static files should be served correctly by Next.js"
echo "- No more 404 errors for CSS and JavaScript files"
echo "- Admin panel should load with proper styling"
echo "- Container should be healthy"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 Why this works:"
echo "- Main frontend works perfectly with 'npm start'"
echo "- Regular Next.js automatically handles static files"
echo "- No complex Docker configuration needed"
echo "- Same proven pattern for both frontends"
