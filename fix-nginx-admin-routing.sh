#!/bin/bash

echo "🔧 Fixing Nginx Admin Domain Routing..."
echo "======================================"

# Check if nginx config exists
echo "📋 Checking current Nginx configuration..."
if [ -f "/etc/nginx/sites-available/servaan" ]; then
    echo "✅ Nginx config file exists"
    echo "📄 Current config content:"
    sudo cat /etc/nginx/sites-available/servaan | grep -A 5 -B 5 "admin.servaan.com" || echo "❌ No admin.servaan.com configuration found!"
else
    echo "❌ Nginx config file does not exist!"
fi
echo

# Backup current config
echo "💾 Backing up current configuration..."
if [ -f "/etc/nginx/sites-available/servaan" ]; then
    sudo cp /etc/nginx/sites-available/servaan /etc/nginx/sites-available/servaan.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
else
    echo "ℹ️ No existing config to backup"
fi
echo

# Apply the correct configuration
echo "🔧 Applying correct Nginx configuration..."
sudo cp nginx-admin-config.conf /etc/nginx/sites-available/servaan
echo "✅ Configuration applied"
echo

# Test the configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi
echo

# Reload nginx
echo "🔄 Reloading Nginx..."
if sudo systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload Nginx!"
    exit 1
fi
echo

# Test domain routing
echo "🧪 Testing domain routing..."
echo "Testing main domain (servaan.com)..."
if curl -s -H "Host: servaan.com" http://localhost >/dev/null 2>&1; then
    echo "✅ Main domain routing working"
else
    echo "⚠️ Main domain routing test failed"
fi

echo "Testing admin domain (admin.servaan.com)..."
if curl -s -H "Host: admin.servaan.com" http://localhost >/dev/null 2>&1; then
    echo "✅ Admin domain routing working"
else
    echo "⚠️ Admin domain routing test failed"
fi
echo

# Check what's running on the ports
echo "🔍 Checking port status..."
echo "Port 3000 (main frontend):"
netstat -tlnp | grep :3000 || echo "❌ Nothing listening on port 3000"

echo "Port 3004 (admin frontend):"
netstat -tlnp | grep :3004 || echo "❌ Nothing listening on port 3004"
echo

# Test direct access to admin frontend
echo "🧪 Testing direct access to admin frontend..."
if curl -s -H "Host: admin.servaan.com" http://localhost:3004 >/dev/null 2>&1; then
    echo "✅ Admin frontend responding on port 3004"
else
    echo "❌ Admin frontend not responding on port 3004"
    echo "📋 Checking admin frontend container status..."
    docker ps | grep admin-frontend || echo "❌ Admin frontend container not running"
    echo "📋 Checking admin frontend logs..."
    docker logs servaan-admin-frontend-prod --tail 10
fi
echo

echo "✅ Nginx admin domain routing fix completed!"
echo ""
echo "Next steps:"
echo "1. Test https://admin.servaan.com in your browser"
echo "2. If still having issues, check the logs above"
echo "3. Verify the admin frontend container is healthy:"
echo "   docker ps | grep admin-frontend"
