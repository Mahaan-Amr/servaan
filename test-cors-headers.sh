#!/bin/bash

echo "🧪 Testing CORS headers..."

echo "1. Testing API endpoint with Origin header:"
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -I

echo -e "\n2. Testing backend directly (port 3001):"
curl -H "Origin: https://dima.servaan.com" http://localhost:3001/api/tenants/dima -I

echo -e "\n3. Testing Nginx configuration:"
nginx -t

echo -e "\n4. Checking Nginx config for api.servaan.com:"
grep -A 20 "server_name api.servaan.com" /etc/nginx/sites-available/servaan.com
