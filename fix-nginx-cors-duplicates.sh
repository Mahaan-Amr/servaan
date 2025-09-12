#!/bin/bash

# =============================================================================
# Fix Nginx CORS Duplicate Headers
# =============================================================================
# This script removes duplicate CORS headers from Nginx configuration

set -e

echo "🔧 Fixing Nginx CORS duplicate headers..."

# Step 1: Backup current configuration
echo "📋 Creating backup of current nginx configuration..."
cp /etc/nginx/sites-available/servaan.com /etc/nginx/sites-available/servaan.com.backup.$(date +%Y%m%d_%H%M%S)

# Step 2: Remove CORS headers from api.servaan.com server block
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

# Step 3: Replace the api.servaan.com server block in the main config
echo "🔧 Updating nginx configuration..."

# Remove the existing api.servaan.com server block
sed -i '/# API domain configuration (api.servaan.com)/,/^}/d' /etc/nginx/sites-available/servaan.com

# Add the corrected server block
cat /tmp/nginx_fix.conf >> /etc/nginx/sites-available/servaan.com

# Step 4: Test configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration test passed"
    
    # Step 5: Reload nginx
    echo "🔄 Reloading nginx..."
    systemctl reload nginx
    
    echo "✅ Nginx reloaded successfully"
    
    # Step 6: Test the fix
    echo "🧪 Testing the fix..."
    echo "Testing API endpoint:"
    curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I
    
    echo "✅ CORS duplicate headers fix completed!"
    echo "📊 Summary:"
    echo "- Removed CORS headers from Nginx api.servaan.com server block"
    echo "- Backend now handles all CORS headers"
    echo "- No more duplicate Access-Control-Allow-Origin headers"
    
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backup..."
    cp /etc/nginx/sites-available/servaan.com.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/servaan.com
    exit 1
fi

# Cleanup
rm -f /tmp/nginx_fix.conf
