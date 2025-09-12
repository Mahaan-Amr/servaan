#!/bin/bash

# =============================================================================
# Fix API Domain Nginx Configuration
# =============================================================================
# This script adds nginx configuration for api.servaan.com domain

set -e

echo "🔧 Adding nginx configuration for api.servaan.com domain..."

# Create backup
echo "📋 Creating backup of current nginx configuration..."
cp /etc/nginx/sites-available/servaan /etc/nginx/sites-available/servaan.backup.$(date +%Y%m%d_%H%M%S)

# Create new nginx configuration with API domain support
cat > /etc/nginx/sites-available/servaan << 'EOF'
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
        
        # CORS headers (backup in case backend CORS fails)
        add_header Access-Control-Allow-Origin "https://dima.servaan.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Tenant-Subdomain" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://dima.servaan.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Tenant-Subdomain";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type text/plain;
            add_header Content-Length 0;
            return 204;
        }
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

# SSL configuration (commented out until certificates are available)
# Uncomment and configure after obtaining SSL certificates
# server {
#     listen 443 ssl http2;
#     server_name servaan.com www.servaan.com;
#     
#     # SSL Configuration
#     ssl_certificate /etc/letsencrypt/live/servaan.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/servaan.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
#     ssl_prefer_server_ciphers off;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#     
#     # Security headers
#     add_header X-Frame-Options DENY;
#     add_header X-Content-Type-Options nosniff;
#     add_header X-XSS-Protection "1; mode=block";
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     
#     # Frontend proxy
#     location / {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 86400;
#     }
#     
#     # Backend API proxy
#     location /api/ {
#         proxy_pass http://127.0.0.1:3001/;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
# }
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
echo "Testing API domain endpoint:"
curl -H "Host: api.servaan.com" http://localhost/health -I

echo "Testing tenant endpoint:"
curl -H "Host: api.servaan.com" http://localhost/tenants/dima -I

echo "✅ API domain configuration completed!"
echo "📊 Summary:"
echo "- api.servaan.com now routes to backend (port 3001)"
echo "- CORS headers added as backup"
echo "- Health check endpoint available"
echo "- All subdomains of servaan.com should now work"
