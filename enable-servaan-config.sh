#!/bin/bash

echo "🔧 Enabling Servaan Nginx Configuration..."
echo "=========================================="

echo "📋 Current issue: servaan config exists but is NOT enabled"
echo "📋 Only 'default' configuration is enabled in sites-enabled"
echo

# Check current status
echo "🔍 Current sites-enabled status:"
ls -la /etc/nginx/sites-enabled/
echo

# Enable the servaan configuration
echo "🔧 Enabling servaan configuration..."
sudo ln -sf /etc/nginx/sites-available/servaan /etc/nginx/sites-enabled/servaan
echo "✅ Servaan configuration enabled"
echo

# Remove default configuration to avoid conflicts
echo "🔧 Removing default configuration to avoid conflicts..."
sudo rm -f /etc/nginx/sites-enabled/default
echo "✅ Default configuration removed"
echo

# Check new status
echo "🔍 New sites-enabled status:"
ls -la /etc/nginx/sites-enabled/
echo

# Test the configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed!"
    echo "📋 Error details:"
    sudo nginx -t
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

# Verify the configuration is now active
echo "🔍 Verifying admin domain configuration is now active..."
if sudo nginx -T 2>/dev/null | grep -q "admin.servaan.com"; then
    echo "✅ Admin domain configuration is now active!"
    sudo nginx -T 2>/dev/null | grep -A 10 -B 5 "admin.servaan.com"
else
    echo "❌ Admin domain configuration still not found!"
    exit 1
fi
echo

# Test domain routing
echo "🧪 Testing domain routing..."
echo "Testing main domain (servaan.com)..."
MAIN_LENGTH=$(curl -s -H "Host: servaan.com" http://localhost -I | grep -i content-length | cut -d' ' -f2)
echo "Content-Length: $MAIN_LENGTH"

echo "Testing admin domain (admin.servaan.com)..."
ADMIN_LENGTH=$(curl -s -H "Host: admin.servaan.com" http://localhost -I | grep -i content-length | cut -d' ' -f2)
echo "Content-Length: $ADMIN_LENGTH"

if [ "$MAIN_LENGTH" != "$ADMIN_LENGTH" ]; then
    echo "✅ Admin domain now serving different content!"
    echo "✅ Main domain: $MAIN_LENGTH bytes"
    echo "✅ Admin domain: $ADMIN_LENGTH bytes"
else
    echo "❌ Admin domain still serving same content as main domain!"
    echo "❌ Both serving: $MAIN_LENGTH bytes"
fi
echo

# Test direct admin frontend access
echo "🧪 Testing direct admin frontend access..."
if curl -s -H "Host: admin.servaan.com" http://localhost:3004 >/dev/null 2>&1; then
    echo "✅ Admin frontend responding on port 3004"
else
    echo "❌ Admin frontend not responding on port 3004"
fi
echo

echo "✅ Servaan Nginx configuration enabled!"
echo ""
echo "🎯 Expected result:"
echo "- admin.servaan.com should now serve admin frontend content"
echo "- No more tenant resolution errors"
echo "- Admin panel should load correctly"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/login"
