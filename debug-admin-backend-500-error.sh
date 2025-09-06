#!/bin/bash

echo "🔧 Debug Admin Backend 500 Error..."
echo "==================================="

echo "📋 Issue identified:"
echo "- CORS issue is fixed ✅"
echo "- Request reaches admin backend ✅"
echo "- But backend returns 500 Internal Server Error ❌"
echo "- Need to identify the exact cause"
echo

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Please run this script from the servaan project root directory"
    exit 1
fi

# Check admin backend container status
echo "🔍 Checking admin backend container status..."
if docker ps | grep -q "servaan-admin-backend-prod"; then
    echo "✅ Admin backend container is running"
    docker ps | grep "servaan-admin-backend-prod"
else
    echo "❌ Admin backend container is not running"
    echo "🔍 Checking all containers..."
    docker ps -a | grep admin
    exit 1
fi

echo
echo "🔍 Checking admin backend logs (last 50 lines)..."
echo "=================================================="
docker logs --tail 50 servaan-admin-backend-prod

echo
echo "🔍 Checking environment variables..."
echo "===================================="
echo "Database-related env vars:"
docker exec servaan-admin-backend-prod printenv | grep -i DB || echo "No DB env vars found"

echo
echo "Secret-related env vars:"
docker exec servaan-admin-backend-prod printenv | grep -i SECRET || echo "No SECRET env vars found"

echo
echo "Admin-related env vars:"
docker exec servaan-admin-backend-prod printenv | grep -i ADMIN || echo "No ADMIN env vars found"

echo
echo "🔍 Testing database connectivity..."
echo "=================================="
echo "Testing database connection from admin backend container..."
docker exec servaan-admin-backend-prod node -e "
const { adminConfig } = require('./dist/admin/backend/src/config/admin.js');
console.log('Database config:', {
  host: adminConfig.database.host,
  port: adminConfig.database.port,
  name: adminConfig.database.name,
  user: adminConfig.database.user,
  url: adminConfig.database.url ? 'SET' : 'NOT SET'
});
" 2>/dev/null || echo "Could not read database config"

echo
echo "🔍 Testing admin backend health endpoint..."
echo "=========================================="
echo "Testing health endpoint..."
curl -s http://localhost:3003/api/admin/health || echo "Health endpoint failed"

echo
echo "🔍 Testing admin auth endpoint with detailed error..."
echo "===================================================="
echo "Testing login endpoint with verbose output..."
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://admin.localhost:3004" \
  -d '{"email":"admin@servaan.com","password":"AdminSecure2024"}' \
  http://localhost:3003/api/admin/auth/login 2>&1

echo
echo "🔍 Checking admin backend container resources..."
echo "==============================================="
echo "Memory usage:"
docker stats --no-stream servaan-admin-backend-prod

echo
echo "🔍 Checking admin backend container processes..."
echo "==============================================="
docker exec servaan-admin-backend-prod ps aux

echo
echo "🔍 Checking admin backend container network..."
echo "============================================="
docker exec servaan-admin-backend-prod netstat -tlnp 2>/dev/null || echo "netstat not available"

echo
echo "🔍 Checking admin backend container file system..."
echo "================================================="
echo "Checking if dist directory exists:"
docker exec servaan-admin-backend-prod ls -la dist/ 2>/dev/null || echo "dist directory not found"

echo "Checking if config file exists:"
docker exec servaan-admin-backend-prod ls -la dist/admin/backend/src/config/ 2>/dev/null || echo "config directory not found"

echo
echo "🔍 Testing database connection directly..."
echo "========================================="
echo "Testing PostgreSQL connection..."
docker exec servaan-admin-backend-prod node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    return prisma.\$disconnect();
  })
  .catch((error) => {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  });
" 2>/dev/null || echo "Database connection test failed"

echo
echo "🔍 Checking admin backend startup logs..."
echo "========================================"
echo "Checking startup logs for errors..."
docker logs servaan-admin-backend-prod | grep -i error | tail -10 || echo "No errors found in startup logs"

echo
echo "🔍 Checking admin backend recent logs..."
echo "======================================="
echo "Checking recent logs for 500 errors..."
docker logs --tail 100 servaan-admin-backend-prod | grep -i "500\|error\|exception" | tail -10 || echo "No 500 errors found in recent logs"

echo
echo "✅ Admin backend 500 error diagnosis completed!"
echo ""
echo "🎯 Common causes of 500 errors:"
echo "- Database connection issues"
echo "- Missing environment variables"
echo "- JWT secret not set"
echo "- Database schema not initialized"
echo "- Prisma client not generated"
echo "- Missing dependencies"
echo ""
echo "📊 Next steps based on findings:"
echo "1. Check the logs above for specific error messages"
echo "2. Verify database connectivity"
echo "3. Check environment variables"
echo "4. Test database schema"
echo "5. Verify Prisma client generation"
echo ""
echo "🔧 If database issues found, run:"
echo "docker-compose -f docker-compose.prod.yml exec postgres psql -U servaan -d servaan_prod -c \"\\dt\""
echo ""
echo "🔧 If environment issues found, check:"
echo "docker-compose -f docker-compose.prod.yml config"
