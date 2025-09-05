#!/bin/bash

echo "🔍 Debugging Docker Build Process..."
echo "=================================="

echo "📋 Checking admin frontend directory structure..."
ls -la src/admin/frontend/

echo
echo "📋 Checking if public directory exists..."
ls -la src/admin/frontend/public/

echo
echo "📋 Checking .dockerignore in admin frontend..."
ls -la src/admin/frontend/.dockerignore 2>/dev/null || echo "No .dockerignore in admin frontend"

echo
echo "📋 Checking root .dockerignore..."
grep -n "public" .dockerignore || echo "No public exclusion in root .dockerignore"

echo
echo "📋 Testing Docker build with debug output..."
cd src/admin/frontend
docker build --no-cache --progress=plain -t debug-admin-frontend . 2>&1 | grep -A 20 -B 5 "Contents of /app"
