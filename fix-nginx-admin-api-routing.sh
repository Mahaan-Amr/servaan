#!/bin/bash

echo "🔧 Fix Nginx Admin API Routing Issue..."
echo "======================================="

echo "📋 Issue identified:"
echo "- Admin frontend calls: https://admin.servaan.com/api/admin/auth/login"
echo "- Nginx strips /api/ and sends: /admin/auth/login to port 3003"
echo "- Admin backend expects: /api/admin/auth/login"
echo "- Result: 404 Not Found"
echo

echo "🔧 Solution:"
echo "- Fix Nginx configuration to preserve /api/ prefix"
echo "- Change proxy_pass from http://127.0.0.1:3003/ to http://127.0.0.1:3003"
echo "- This will preserve the full path including /api/"
echo

# Backup current nginx configuration
echo "🔧 Backing up current nginx configuration..."
if [ -f "/etc/nginx/sites-available/servaan" ]; then
    cp /etc/nginx/sites-available/servaan /etc/nginx/sites-available/servaan.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Nginx backup created"
else
    echo "⚠️  No existing servaan nginx configuration found"
fi

# Create fixed nginx configuration
echo "🔧 Creating fixed nginx configuration..."
cat > /etc/nginx/sites-available/servaan << 'EOF'
# =============================================================================
# سِروان (Servaan) Platform - Fixed Nginx Configuration with Admin Support
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
    
    # Admin backend API proxy - FIXED: preserve /api/ prefix
    location /api/ {
        proxy_pass http://127.0.0.1:3003;
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

# Test nginx configuration
echo "🔧 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    if ls /etc/nginx/sites-available/servaan.backup.* 1> /dev/null 2>&1; then
        cp /etc/nginx/sites-available/servaan.backup.* /etc/nginx/sites-available/servaan
    fi
    echo "❌ Nginx configuration failed - fix aborted"
    exit 1
fi

# Reload nginx
echo "🔧 Reloading nginx..."
if systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload nginx!"
    exit 1
fi

# Test the fix
echo "🧪 Testing the fix..."
echo "Testing admin API endpoint:"
curl -H "Host: admin.servaan.com" http://localhost/api/admin/auth/health -I

echo "Testing admin login endpoint:"
curl -X POST -H "Host: admin.servaan.com" -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}' http://localhost/api/admin/auth/login -I

echo
echo "✅ Nginx admin API routing fix completed!"
echo ""
echo "🎯 Expected result:"
echo "- Admin API calls should now reach the correct endpoints"
echo "- /api/admin/auth/login should work correctly"
echo "- No more 404 Not Found errors"
echo "- Admin login should work"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 How the fix works:"
echo "- Before: /api/admin/auth/login → /admin/auth/login (404)"
echo "- After: /api/admin/auth/login → /api/admin/auth/login (200)"
echo "- Nginx now preserves the full path including /api/"
