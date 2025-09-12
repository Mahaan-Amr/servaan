#!/bin/bash

echo "🧪 Testing API endpoint directly..."

echo "1. Testing /api/tenants/dima endpoint:"
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/api/tenants/dima -v

echo -e "\n2. Testing /tenants/dima endpoint (without /api):"
curl -H "Host: api.servaan.com" -H "Origin: https://dima.servaan.com" http://localhost/tenants/dima -v

echo -e "\n3. Testing backend health:"
curl -H "Host: api.servaan.com" http://localhost/health -v

echo -e "\n4. Testing backend directly (port 3001):"
curl http://localhost:3001/api/tenants/dima -v

echo -e "\n5. Testing backend health directly:"
curl http://localhost:3001/api/health -v
