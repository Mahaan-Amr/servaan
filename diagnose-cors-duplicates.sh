#!/bin/bash

# =============================================================================
# Diagnose CORS Duplicate Headers Issue
# =============================================================================
# This script investigates where the duplicate CORS headers are coming from

set -e

echo "🔍 DIAGNOSING CORS DUPLICATE HEADERS ISSUE"
echo "=========================================="

# Step 1: Check current NGINX configuration
echo "📋 Step 1: Checking NGINX configuration files..."
echo "Active NGINX sites:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "NGINX sites available:"
ls -la /etc/nginx/sites-available/

# Step 2: Check which configuration is actually active
echo ""
echo "📋 Step 2: Checking active NGINX configuration..."
if [ -f "/etc/nginx/sites-enabled/servaan" ]; then
    echo "✅ Found /etc/nginx/sites-enabled/servaan"
    echo "Content:"
    cat /etc/nginx/sites-enabled/servaan
elif [ -f "/etc/nginx/sites-enabled/servaan.com" ]; then
    echo "✅ Found /etc/nginx/sites-enabled/servaan.com"
    echo "Content:"
    cat /etc/nginx/sites-enabled/servaan.com
else
    echo "❌ No servaan configuration found in sites-enabled"
fi

# Step 3: Check NGINX main configuration
echo ""
echo "📋 Step 3: Checking NGINX main configuration..."
echo "Main nginx.conf includes:"
grep -n "include" /etc/nginx/nginx.conf

# Step 4: Test the actual API endpoint
echo ""
echo "📋 Step 4: Testing API endpoint directly..."
echo "Testing with Origin header:"
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I 2>/dev/null || echo "curl test failed"

echo ""
echo "Testing direct backend connection:"
curl -H "Origin: https://dima.servaan.com" http://localhost:3001/api/tenants/dima -I 2>/dev/null || echo "Direct backend test failed"

# Step 5: Check if there are multiple CORS configurations
echo ""
echo "📋 Step 5: Searching for CORS configurations..."
echo "Searching for Access-Control-Allow-Origin in NGINX configs:"
find /etc/nginx -name "*.conf" -exec grep -l "Access-Control-Allow-Origin" {} \; 2>/dev/null || echo "No CORS headers found in NGINX"

echo ""
echo "Searching for CORS in all NGINX files:"
find /etc/nginx -type f -exec grep -l "cors\|CORS" {} \; 2>/dev/null || echo "No CORS references found"

# Step 6: Check backend logs
echo ""
echo "📋 Step 6: Checking backend container logs..."
docker logs servaan-backend-prod --tail 20

# Step 7: Check if there are any proxy headers being added
echo ""
echo "📋 Step 7: Checking for proxy header configurations..."
grep -r "proxy_set_header.*Access-Control" /etc/nginx/ 2>/dev/null || echo "No proxy CORS headers found"

echo ""
echo "🔍 DIAGNOSIS COMPLETE"
echo "===================="
echo "Please review the output above to identify where duplicate CORS headers are coming from."
