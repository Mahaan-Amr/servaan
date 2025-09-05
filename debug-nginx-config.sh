#!/bin/bash

echo "🔍 Debugging Nginx Configuration Issue..."
echo "======================================="

echo "📋 Checking if the configuration file exists..."
if [ -f "/etc/nginx/sites-available/servaan" ]; then
    echo "✅ Configuration file exists"
    echo "📄 File size: $(wc -c < /etc/nginx/sites-available/servaan) bytes"
    echo "📄 First 20 lines:"
    head -20 /etc/nginx/sites-available/servaan
else
    echo "❌ Configuration file does not exist!"
fi
echo

echo "📋 Checking if the configuration is enabled..."
if [ -L "/etc/nginx/sites-enabled/servaan" ]; then
    echo "✅ Configuration is enabled (symlink exists)"
    ls -la /etc/nginx/sites-enabled/servaan
else
    echo "❌ Configuration is NOT enabled!"
    echo "📋 Available sites:"
    ls -la /etc/nginx/sites-enabled/
fi
echo

echo "📋 Checking all Nginx configuration files..."
echo "Sites available:"
ls -la /etc/nginx/sites-available/

echo "Sites enabled:"
ls -la /etc/nginx/sites-enabled/
echo

echo "📋 Checking main Nginx configuration..."
echo "Looking for include statements:"
grep -n "include.*sites" /etc/nginx/nginx.conf || echo "No sites include found"
echo

echo "📋 Testing Nginx configuration parsing..."
echo "Full Nginx configuration test:"
sudo nginx -T 2>&1 | grep -A 5 -B 5 "admin.servaan.com" || echo "No admin.servaan.com found in parsed config"
echo

echo "📋 Checking if there are multiple server blocks..."
echo "All server_name directives:"
sudo nginx -T 2>&1 | grep "server_name" || echo "No server_name directives found"
echo

echo "📋 Checking Nginx error logs for configuration issues..."
echo "Recent Nginx errors:"
sudo tail -10 /var/log/nginx/error.log | grep -i "admin\|servaan" || echo "No relevant errors found"
echo

echo "✅ Debug completed!"
