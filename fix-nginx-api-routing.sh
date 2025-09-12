#!/bin/bash

# =============================================================================
# Fix NGINX API Routing
# =============================================================================
# This script fixes the NGINX configuration to preserve /api prefix

set -e

echo "🔧 FIXING NGINX API ROUTING"
echo "==========================="

# Step 1: Backup current NGINX configuration
echo "📋 Step 1: Creating backup of NGINX configuration..."
cp /etc/nginx/sites-enabled/servaan /etc/nginx/sites-enabled/servaan.backup.$(date +%Y%m%d_%H%M%S)

# Step 2: Fix the API domain configuration
echo ""
echo "📋 Step 2: Fixing API domain configuration..."
cat > /tmp/nginx_api_fix.conf << 'EOF'
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

    # API proxy - preserve /api prefix
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
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

# Step 3: Replace the NGINX configuration
echo ""
echo "📋 Step 3: Replacing NGINX configuration..."
cp /tmp/nginx_api_fix.conf /etc/nginx/sites-enabled/servaan

# Step 4: Test NGINX configuration
echo ""
echo "📋 Step 4: Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration test passed"
    
    # Step 5: Reload NGINX
    echo ""
    echo "📋 Step 5: Reloading NGINX..."
    systemctl reload nginx
    
    echo "✅ NGINX reloaded successfully"
    
    # Step 6: Test the fix
    echo ""
    echo "📋 Step 6: Testing the fix..."
    echo "Testing auth endpoint through NGINX:"
    curl -s -X POST -H "Host: api.servaan.com" http://localhost/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@dima.servaan.com","password":"admin123"}' || echo "❌ Test failed"
    
    echo ""
    echo "🎉 NGINX API ROUTING FIX COMPLETE!"
    echo "=================================="
    echo "✅ Fixed NGINX to preserve /api prefix"
    echo "✅ Auth endpoint should now work properly"
    echo ""
    echo "🌐 Try logging in now: https://dima.servaan.com"
    
else
    echo "❌ NGINX configuration test failed"
    echo "🔄 Restoring backup..."
    cp /etc/nginx/sites-enabled/servaan.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-enabled/servaan
    exit 1
fi
