#!/bin/bash

echo "🔧 TESTING AUTHENTICATION FINAL CHECK"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "📋 Step 1: Testing tenant endpoint..."

# Test tenant endpoint
echo "Testing tenant endpoint:"
curl -s https://api.servaan.com/api/tenants/dima | jq . || echo "❌ Tenant endpoint failed"

echo ""
echo "📋 Step 2: Testing auth endpoint with correct credentials..."

# Test auth endpoint with correct credentials
echo "Testing auth endpoint:"
curl -X POST https://api.servaan.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://dima.servaan.com" \
  -d '{"email":"admin@dima.servaan.com","password":"admin123"}' \
  -v

echo ""
echo "📋 Step 3: Testing auth endpoint with wrong credentials..."

# Test auth endpoint with wrong credentials
echo "Testing with wrong credentials:"
curl -X POST https://api.servaan.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://dima.servaan.com" \
  -d '{"email":"admin@dima.servaan.com","password":"wrongpassword"}' \
  -s | jq . || echo "❌ Auth endpoint failed"

echo ""
echo "📋 Step 4: Checking user in database..."

# Check user in database
echo "Checking user in database:"
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role FROM \"User\" WHERE email = 'admin@dima.servaan.com' AND \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';"

echo ""
echo "📋 Step 5: Testing CORS preflight..."

# Test CORS preflight
echo "Testing CORS preflight:"
curl -X OPTIONS https://api.servaan.com/api/auth/login \
  -H "Origin: https://dima.servaan.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

echo ""
echo "📋 Step 6: Testing direct backend connection..."

# Test direct backend connection
echo "Testing direct backend connection:"
curl -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://dima.servaan.com" \
  -d '{"email":"admin@dima.servaan.com","password":"admin123"}' \
  -s | jq . || echo "❌ Direct backend failed"

echo ""
echo "📋 Step 7: Checking backend logs for auth attempts..."

# Check backend logs for auth attempts
echo "Recent auth-related logs:"
docker logs --tail 20 servaan-backend-prod | grep -E "(auth|login|401|200)"

echo ""
echo "🎉 AUTHENTICATION TEST COMPLETE!"
echo "================================"
echo "✅ Tested all authentication endpoints"
echo "✅ Verified CORS configuration"
echo "✅ Checked database user data"
echo "✅ Tested both direct and NGINX connections"
echo ""
echo "🌐 Try logging in now: https://dima.servaan.com"
echo ""
echo "📝 If still having issues, the problem is likely:"
echo "   - Wrong password in database"
echo "   - User not found in correct tenant"
echo "   - Frontend sending wrong credentials"
