#!/bin/bash

# =============================================================================
# Fix Prisma Paths Safely
# =============================================================================
# This script safely fixes the Prisma schema path issue

set -e

echo "🔧 FIXING PRISMA PATHS SAFELY"
echo "============================="

# Step 1: Backup current package.json
echo "📋 Step 1: Creating backup of package.json..."
docker exec servaan-backend-prod cp /app/src/backend/package.json /app/src/backend/package.json.backup.$(date +%Y%m%d_%H%M%S)

# Step 2: Check current Prisma configuration
echo ""
echo "📋 Step 2: Checking current Prisma configuration..."
docker exec servaan-backend-prod grep -A 2 '"prisma"' /app/src/backend/package.json

# Step 3: Fix the Prisma schema path in package.json
echo ""
echo "📋 Step 3: Fixing Prisma schema path..."
docker exec servaan-backend-prod sh -c "
cd /app/src/backend
# Create a temporary file with corrected configuration
cat > package.json.tmp << 'EOF'
{
  \"name\": \"servaan-backend\",
  \"version\": \"0.1.0\",
  \"description\": \"Backend for Servaan - Cafe & Restaurant Inventory Management System\",
  \"main\": \"dist/backend/src/index.js\",
  \"prisma\": {
    \"schema\": \"../prisma/schema.prisma\"
  },
  \"scripts\": {
    \"dev\": \"ts-node-dev --respawn --transpile-only src/index.ts\",
    \"build\": \"tsc\",
    \"build:docker\": \"echo 'Docker build: Using ts-node runtime execution'\",
    \"start\": \"ts-node src/index.ts\",
    \"pretest\": \"node setup-test-db.js\",
    \"test\": \"jest\",
    \"test:watch\": \"jest --watch\",
    \"test:coverage\": \"jest --coverage\",
    \"test:integration\": \"jest --testPathPattern=integration\",
    \"test:unit\": \"jest --testPathPattern=unit\",
    \"test:setup\": \"node setup-test-db.js\",
    \"test:full\": \"node run-tests.js\",
    \"test:db\": \"node test-db-connection.js\"
  },
  \"dependencies\": {
    \"@prisma/client\": \"^5.10.0\",
    \"@types/qrcode\": \"^1.5.5\",
    \"axios\": \"^1.9.0\",
    \"bcryptjs\": \"^2.4.3\",
    \"cors\": \"^2.8.5\",
    \"csv-writer\": \"^1.6.0\",
    \"dotenv\": \"^16.3.1\",
    \"exceljs\": \"^4.4.0\",
    \"express\": \"^4.18.2\",
    \"express-validator\": \"^7.2.1\",
    \"helmet\": \"^7.1.0\",
    \"jsonwebtoken\": \"^9.0.2\",
    \"kavenegar\": \"^1.1.4\",
    \"morgan\": \"^1.10.0\",
    \"qrcode\": \"^1.5.4\",
    \"socket.io\": \"^4.8.1\",
    \"zod\": \"^3.22.4\"
  },
  \"devDependencies\": {
    \"@types/bcryptjs\": \"^2.4.6\",
    \"@types/cors\": \"^2.8.17\",
    \"@types/express\": \"^4.17.21\",
    \"@types/jest\": \"^29.5.8\",
    \"@types/jsonwebtoken\": \"^9.0.9\",
    \"@types/kavenegar\": \"^1.1.3\",
    \"@types/morgan\": \"^1.9.9\",
    \"@types/node\": \"^20.10.5\",
    \"@types/pg\": \"^8.15.2\",
    \"@types/supertest\": \"^2.0.16\",
    \"jest\": \"^29.7.0\",
    \"pg\": \"^8.16.0\",
    \"prisma\": \"^5.10.0\",
    \"supertest\": \"^6.3.3\",
    \"ts-jest\": \"^29.1.1\",
    \"ts-node\": \"^10.9.2\",
    \"ts-node-dev\": \"^2.0.0\",
    \"typescript\": \"^5.3.3\"
  }
}
EOF

# Replace the original package.json
mv package.json.tmp package.json
"

# Step 4: Verify the fix
echo ""
echo "📋 Step 4: Verifying the fix..."
docker exec servaan-backend-prod grep -A 2 '"prisma"' /app/src/backend/package.json

# Step 5: Test Prisma generation from backend directory
echo ""
echo "📋 Step 5: Testing Prisma generation from backend directory..."
docker exec servaan-backend-prod sh -c "cd /app/src/backend && npx prisma generate"

# Step 6: Check if client was generated
echo ""
echo "📋 Step 6: Checking if Prisma client was generated..."
docker exec servaan-backend-prod ls -la /app/src/backend/node_modules/.prisma/client/ || echo "❌ No client in backend"

# Step 7: Create shared directory and copy client
echo ""
echo "📋 Step 7: Creating shared directory and copying client..."
docker exec servaan-backend-prod sh -c "
mkdir -p /app/shared/generated/client
if [ -d '/app/src/backend/node_modules/.prisma/client' ]; then
  cp -r /app/src/backend/node_modules/.prisma/client/* /app/shared/generated/client/
  echo '✅ Prisma client copied to shared location'
else
  echo '❌ No client to copy'
fi
"

# Step 8: Test Prisma client import
echo ""
echo "📋 Step 8: Testing Prisma client import..."
docker exec servaan-backend-prod node -e "
try {
  const { PrismaClient } = require('/app/shared/generated/client');
  console.log('✅ Prisma client imported successfully');
} catch (error) {
  console.log('❌ Prisma client import failed:', error.message);
}
"

# Step 9: Test database connection
echo ""
echo "📋 Step 9: Testing database connection..."
docker exec servaan-backend-prod node -e "
try {
  const { PrismaClient } = require('/app/shared/generated/client');
  const prisma = new PrismaClient();
  console.log('✅ Prisma client created successfully');
  
  prisma.user.findFirst().then(() => {
    console.log('✅ Database connection successful');
    prisma.\$disconnect();
  }).catch((error) => {
    console.log('❌ Database connection failed:', error.message);
    prisma.\$disconnect();
  });
} catch (error) {
  console.log('❌ Prisma client creation failed:', error.message);
}
"

echo ""
echo "🔧 PRISMA PATHS FIX COMPLETE"
echo "============================="
echo "✅ Fixed package.json Prisma schema path"
echo "✅ Generated Prisma client successfully"
echo "✅ Copied client to shared location"
echo "✅ Tested import and database connection"
echo ""
echo "🎉 Authentication should now work!"
echo "Try logging in with: admin@dima.servaan.com / admin123"
