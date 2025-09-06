#!/bin/bash

echo "🔍 Debug 502 Bad Gateway Error..."
echo "================================="

echo "📋 502 Bad Gateway means:"
echo "- Nginx can reach the server"
echo "- But the admin-frontend service is not responding"
echo "- This could mean the container crashed or failed to start"
echo

# Check if admin frontend container is running
echo "🔍 Checking admin frontend container status..."
docker ps | grep admin-frontend

# Check admin frontend container logs
echo "🔍 Checking admin frontend container logs..."
docker logs servaan-admin-frontend-prod --tail 50

# Check if admin frontend is listening on port 3004
echo "🔍 Checking if admin frontend is listening on port 3004..."
netstat -tlnp | grep :3004

# Test direct connection to admin frontend
echo "🔍 Testing direct connection to admin frontend..."
curl -H "Host: admin.servaan.com" http://localhost:3004/admin/login -I

# Check Nginx configuration
echo "🔍 Checking Nginx configuration for admin domain..."
sudo nginx -T | grep -A 10 -B 5 "admin.servaan.com"

# Check Nginx error logs
echo "🔍 Checking Nginx error logs..."
sudo tail -20 /var/log/nginx/error.log

# Check if admin frontend container exists
echo "🔍 Checking if admin frontend container exists..."
docker ps -a | grep admin-frontend

# Check admin frontend container health
echo "🔍 Checking admin frontend container health..."
docker inspect servaan-admin-frontend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not found"

# Check admin frontend container exit code
echo "🔍 Checking admin frontend container exit code..."
docker inspect servaan-admin-frontend-prod --format='{{.State.ExitCode}}' 2>/dev/null || echo "Container not found"

# Check admin frontend container restart count
echo "🔍 Checking admin frontend container restart count..."
docker inspect servaan-admin-frontend-prod --format='{{.RestartCount}}' 2>/dev/null || echo "Container not found"

# Check admin frontend container last restart time
echo "🔍 Checking admin frontend container last restart time..."
docker inspect servaan-admin-frontend-prod --format='{{.State.StartedAt}}' 2>/dev/null || echo "Container not found"

echo
echo "✅ 502 Error diagnosis completed!"
echo ""
echo "🎯 Common causes of 502 Bad Gateway:"
echo "- Container crashed during startup"
echo "- Port mapping issue (container not listening on expected port)"
echo "- Health check failing"
echo "- Application error preventing startup"
echo "- Docker build failed but container still exists"
echo ""
echo "🔧 Next steps:"
echo "1. Check the logs above to see what's causing the crash"
echo "2. If container is not running, restart it"
echo "3. If container keeps crashing, check the Dockerfile and build process"
