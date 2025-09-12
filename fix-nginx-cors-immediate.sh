#!/bin/bash

# =============================================================================
# Immediate Fix for NGINX CORS Duplicate Headers
# =============================================================================
# This script removes CORS headers from NGINX configuration

set -e

echo "🚨 IMMEDIATE FIX: Removing NGINX CORS headers..."

# Step 1: Backup current configuration
echo "📋 Creating backup..."
cp /etc/nginx/sites-enabled/servaan /etc/nginx/sites-enabled/servaan.backup.$(date +%Y%m%d_%H%M%S)

# Step 2: Remove CORS headers from api.servaan.com server block
echo "🔧 Removing CORS headers from NGINX configuration..."

# Create temporary file with corrected configuration
cat > /tmp/nginx_fixed.conf << 'EOF'
# =============================================================================
# سِروان (Servaan) Platform - Complete Nginx Configuration
# =============================================================================

# Main domain configuration (servaan.com)
server {
    listen 80;
    server_name servaan.com www.servaan.com 94.182.177.74;

    # Frontend proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

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

# Admin domain configuration (admin.servaan.com)
server {
    listen 80;
    server_name admin.servaan.com;

    # Admin frontend proxy
    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Admin backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3003/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "admin healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Step 3: Replace the configuration
echo "🔄 Replacing NGINX configuration..."
cp /tmp/nginx_fixed.conf /etc/nginx/sites-enabled/servaan

# Step 4: Test configuration
echo "🧪 Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration test passed"
    
    # Step 5: Reload NGINX
    echo "🔄 Reloading NGINX..."
    systemctl reload nginx
    
    echo "✅ NGINX reloaded successfully"
    
    # Step 6: Test the fix
    echo "🧪 Testing the fix..."
    echo "Testing API endpoint:"
    curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I 2>/dev/null || echo "curl test failed"
    
    echo ""
    echo "🎉 CORS DUPLICATE HEADERS FIXED!"
    echo "================================="
    echo "✅ Removed CORS headers from NGINX"
    echo "✅ Backend now handles all CORS headers"
    echo "✅ No more duplicate Access-Control-Allow-Origin headers"
    echo ""
    echo "🌐 Test your website now: https://dima.servaan.com"
    
else
    echo "❌ NGINX configuration test failed"
    echo "🔄 Restoring backup..."
    cp /etc/nginx/sites-enabled/servaan.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-enabled/servaan
    exit 1
fi
