#!/bin/bash

echo "🔍 Debugging Admin Domain Content..."
echo "=================================="

echo "📋 Testing Nginx routing (admin.servaan.com -> localhost)..."
echo "Content-Length: $(curl -H "Host: admin.servaan.com" http://localhost -s -I | grep -i content-length | cut -d' ' -f2)"
echo "Checking for NEXT_PUBLIC_API_URL in content:"
curl -H "Host: admin.servaan.com" http://localhost -s | grep -i "NEXT_PUBLIC_API_URL" | head -3

echo
echo "📋 Testing direct admin frontend (admin.servaan.com -> localhost:3004)..."
echo "Content-Length: $(curl -H "Host: admin.servaan.com" http://localhost:3004 -s -I | grep -i content-length | cut -d' ' -f2)"
echo "Checking for NEXT_PUBLIC_API_URL in content:"
curl -H "Host: admin.servaan.com" http://localhost:3004 -s | grep -i "NEXT_PUBLIC_API_URL" | head -3

echo
echo "📋 Testing main domain (servaan.com -> localhost)..."
echo "Content-Length: $(curl -H "Host: servaan.com" http://localhost -s -I | grep -i content-length | cut -d' ' -f2)"
echo "Checking for NEXT_PUBLIC_API_URL in content:"
curl -H "Host: servaan.com" http://localhost -s | grep -i "NEXT_PUBLIC_API_URL" | head -3

echo
echo "📋 Checking Nginx configuration..."
echo "Current server blocks:"
sudo nginx -T 2>/dev/null | grep -A 5 "server_name.*admin.servaan.com"

echo
echo "📋 Checking what's actually running on ports..."
echo "Port 3000 (main frontend):"
netstat -tlnp | grep :3000

echo "Port 3004 (admin frontend):"
netstat -tlnp | grep :3004

echo
echo "📋 Checking admin frontend container logs..."
docker logs servaan-admin-frontend-prod --tail 5

echo
echo "✅ Debug completed!"
