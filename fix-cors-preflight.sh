#!/bin/bash

echo "🔧 FIXING CORS PREFLIGHT REQUESTS"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "📋 Step 1: Creating backup of backend index.ts..."

# Create backup
cp src/backend/src/index.ts src/backend/src/index.ts.backup.$(date +%Y%m%d_%H%M%S)

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
else
    echo "❌ Failed to create backup"
    exit 1
fi

echo ""
echo "📋 Step 2: Fixing CORS configuration..."

# Create the fixed CORS configuration
cat > /tmp/cors_fix.js << 'EOF'
// Fixed CORS configuration with proper preflight support
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://servaan.com',
      'https://api.servaan.com',
      'https://admin.servaan.com'
    ];
    
    // Allow requests from any subdomain of servaan.com
    if (!origin || 
        origin.includes('localhost') || 
        origin.endsWith('.servaan.com') ||
        allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Tenant-Subdomain',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
})); // Enable CORS with subdomain support and preflight handling
EOF

echo "✅ CORS configuration prepared"

echo ""
echo "📋 Step 3: Applying CORS fix to backend..."

# Replace the CORS configuration in the backend file
sed -i '/app\.use(cors({/,/})); \/\/ Enable CORS with subdomain support/c\
// CORS configuration with proper preflight support\
app.use(cors({\
  origin: (origin, callback) => {\
    const allowedOrigins = [\
      '\''https://servaan.com'\'',\
      '\''https://api.servaan.com'\'',\
      '\''https://admin.servaan.com'\''\
    ];\
    \
    // Allow requests from any subdomain of servaan.com\
    if (!origin || \
        origin.includes('\''localhost'\'') || \
        origin.endsWith('\''.servaan.com'\'') ||\
        allowedOrigins.includes(origin)) {\
      callback(null, true);\
    } else {\
      callback(new Error('\''Not allowed by CORS'\''));\
    }\
  },\
  credentials: true,\
  methods: ['\''GET'\'', '\''POST'\'', '\''PUT'\'', '\''DELETE'\'', '\''OPTIONS'\'', '\''PATCH'\''],\
  allowedHeaders: [\
    '\''Origin'\'',\
    '\''X-Requested-With'\'',\
    '\''Content-Type'\'',\
    '\''Accept'\'',\
    '\''Authorization'\'',\
    '\''X-Tenant-Subdomain'\'',\
    '\''Cache-Control'\'',\
    '\''Pragma'\''\
  ],\
  exposedHeaders: ['\''Authorization'\''],\
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204\
})); // Enable CORS with subdomain support and preflight handling' src/backend/src/index.ts

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration updated successfully"
else
    echo "❌ Failed to update CORS configuration"
    exit 1
fi

echo ""
echo "📋 Step 4: Rebuilding backend container..."

# Rebuild the backend container
docker-compose -f docker-compose.prod.yml build backend

if [ $? -eq 0 ]; then
    echo "✅ Backend container rebuilt successfully"
else
    echo "❌ Failed to rebuild backend container"
    exit 1
fi

echo ""
echo "📋 Step 5: Restarting backend service..."

# Restart the backend service
docker-compose -f docker-compose.prod.yml restart backend

if [ $? -eq 0 ]; then
    echo "✅ Backend service restarted successfully"
else
    echo "❌ Failed to restart backend service"
    exit 1
fi

echo ""
echo "📋 Step 6: Testing CORS preflight..."

# Wait a moment for the service to start
sleep 5

# Test CORS preflight request
echo "Testing OPTIONS preflight request:"
curl -X OPTIONS https://api.servaan.com/api/auth/login \
  -H "Origin: https://dima.servaan.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

echo ""
echo "Testing actual POST request:"
curl -X POST https://api.servaan.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://dima.servaan.com" \
  -d '{"email":"admin@dima.servaan.com","password":"admin123"}' \
  -v

echo ""
echo "🎉 CORS PREFLIGHT FIX COMPLETE!"
echo "==============================="
echo "✅ Fixed CORS configuration with proper preflight support"
echo "✅ Added methods, allowedHeaders, and optionsSuccessStatus"
echo "✅ Backend container rebuilt and restarted"
echo ""
echo "🌐 Try logging in now: https://dima.servaan.com"
echo ""
echo "📝 What was fixed:"
echo "   - Added methods: GET, POST, PUT, DELETE, OPTIONS, PATCH"
echo "   - Added allowedHeaders: Origin, Content-Type, Authorization, etc."
echo "   - Added optionsSuccessStatus: 200 for legacy browser compatibility"
echo "   - Added exposedHeaders: Authorization for token access"
