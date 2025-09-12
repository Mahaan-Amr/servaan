#!/bin/bash

# =============================================================================
# Check Backend Status and Logs
# =============================================================================
# This script checks the backend status and logs

echo "🔍 Checking backend status and logs..."

# Step 1: Check container status
echo "📋 Container status:"
docker compose -f docker-compose.prod.yml ps backend

# Step 2: Check backend logs
echo "📋 Backend logs (last 20 lines):"
docker compose -f docker-compose.prod.yml logs backend --tail=20

# Step 3: Check if backend is listening on port 3001
echo "📋 Checking if backend is listening on port 3001:"
netstat -tlnp | grep :3001 || echo "Backend not listening on port 3001"

# Step 4: Test backend directly
echo "📋 Testing backend directly (port 3001):"
curl -v http://localhost:3001/api/health 2>&1 || echo "Backend not responding on port 3001"

# Step 5: Check backend health endpoint
echo "📋 Checking backend health endpoint:"
curl -v http://localhost:3001/health 2>&1 || echo "Backend health endpoint not responding"

# Step 6: Check if backend container is healthy
echo "📋 Backend container health:"
docker inspect servaan-backend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "Health check not available"

echo "✅ Backend status check completed!"
