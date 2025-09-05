#!/bin/bash

echo "🧪 Testing Docker Build Context..."
echo "================================="

echo "📋 Checking what's in the build context..."
cd src/admin/frontend
echo "Files in build context:"
ls -la

echo
echo "📋 Checking if public directory exists..."
ls -la public/

echo
echo "📋 Testing Docker build with verbose output..."
docker build --no-cache --progress=plain -t test-admin-frontend . 2>&1 | grep -A 10 -B 5 "Contents of /app"
