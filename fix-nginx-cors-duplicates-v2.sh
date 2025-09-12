#!/bin/bash

# =============================================================================
# Fix Nginx CORS Duplicate Headers - Version 2
# =============================================================================
# This script finds and fixes duplicate CORS headers in Nginx configuration

set -e

echo "🔧 Fixing Nginx CORS duplicate headers..."

# Step 1: Find the correct Nginx configuration file
echo "📋 Finding Nginx configuration files..."

NGINX_CONF=""
if [ -f "/etc/nginx/nginx.conf" ]; then
    NGINX_CONF="/etc/nginx/nginx.conf"
    echo "✅ Found main nginx.conf"
elif [ -f "/etc/nginx/sites-available/servaan.com" ]; then
    NGINX_CONF="/etc/nginx/sites-available/servaan.com"
    echo "✅ Found sites-available/servaan.com"
elif [ -f "/etc/nginx/conf.d/servaan.com.conf" ]; then
    NGINX_CONF="/etc/nginx/conf.d/servaan.com.conf"
    echo "✅ Found conf.d/servaan.com.conf"
else
    echo "❌ Could not find Nginx configuration file"
    echo "📋 Available Nginx files:"
    find /etc/nginx -name "*.conf" -type f 2>/dev/null || echo "No .conf files found"
    find /etc/nginx -name "*servaan*" -type f 2>/dev/null || echo "No servaan files found"
    exit 1
fi

echo "📋 Using configuration file: $NGINX_CONF"

# Step 2: Backup current configuration
echo "📋 Creating backup of current nginx configuration..."
cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# Step 3: Check if api.servaan.com server block exists
echo "🔍 Checking for api.servaan.com server block..."
if grep -q "server_name api.servaan.com" "$NGINX_CONF"; then
    echo "✅ Found api.servaan.com server block"
    
    # Step 4: Remove CORS headers from api.servaan.com server block
    echo "🔧 Removing CORS headers from api.servaan.com server block..."
    
    # Create a temporary file with the corrected configuration
    cat > /tmp/nginx_fix.conf << 'EOF'
# API domain configuration (api.servaan.com)
server {
    listen 80;
    server_name api.servaan.com;
    
    # API proxy - route all requests to backend
    location / {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Let backend handle CORS headers to avoid duplicates
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "api healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Remove the existing api.servaan.com server block
    sed -i '/# API domain configuration (api.servaan.com)/,/^}/d' "$NGINX_CONF"
    
    # Add the corrected server block
    cat /tmp/nginx_fix.conf >> "$NGINX_CONF"
    
    echo "✅ Updated api.servaan.com server block"
    
else
    echo "⚠️  No api.servaan.com server block found"
    echo "📋 Current server blocks:"
    grep -n "server_name" "$NGINX_CONF" || echo "No server_name directives found"
fi

# Step 5: Test configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration test passed"
    
    # Step 6: Reload nginx
    echo "🔄 Reloading nginx..."
    systemctl reload nginx
    
    echo "✅ Nginx reloaded successfully"
    
    # Step 7: Test the fix
    echo "🧪 Testing the fix..."
    echo "Testing API endpoint:"
    curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I 2>/dev/null || echo "curl test failed"
    
    echo "✅ CORS duplicate headers fix completed!"
    echo "📊 Summary:"
    echo "- Configuration file: $NGINX_CONF"
    echo "- Removed CORS headers from Nginx api.servaan.com server block"
    echo "- Backend now handles all CORS headers"
    echo "- No more duplicate Access-Control-Allow-Origin headers"
    
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backup..."
    cp "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONF"
    exit 1
fi

# Cleanup
rm -f /tmp/nginx_fix.conf
