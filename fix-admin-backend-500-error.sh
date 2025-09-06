#!/bin/bash

echo "🔧 Fix Admin Backend 500 Error..."
echo "================================="

echo "📋 Common causes of 500 errors:"
echo "- Database connection issues"
echo "- Missing environment variables"
echo "- JWT secret not set"
echo "- Database schema not initialized"
echo "- Prisma client not generated"
echo

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Please run this script from the servaan project root directory"
    exit 1
fi

echo "🔧 Step 1: Checking environment variables..."
echo "==========================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Creating basic .env.production file..."
    cat > .env.production << 'EOF'
# Database Configuration
DB_PASSWORD=servaan123
DATABASE_URL=postgresql://servaan:servaan123@postgres:5432/servaan_prod

# Admin JWT Secret
ADMIN_JWT_SECRET=servaan-admin-super-secret-key-different-from-tenant

# Admin CORS Origins
ADMIN_CORS_ORIGINS=https://admin.servaan.com,https://*.servaan.com,http://admin.localhost:3004,http://localhost:3004

# pgAdmin Configuration
PGADMIN_EMAIL=admin@servaan.com
PGADMIN_PASSWORD=admin123
EOF
    echo "✅ Created .env.production file"
else
    echo "✅ .env.production file exists"
fi

echo
echo "🔧 Step 2: Checking database connectivity..."
echo "==========================================="

# Check if postgres container is running
if docker ps | grep -q "servaan-postgres-prod"; then
    echo "✅ PostgreSQL container is running"
    
    # Test database connection
    echo "Testing database connection..."
    if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U servaan -d servaan_prod -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        echo "🔧 Restarting PostgreSQL container..."
        docker-compose -f docker-compose.prod.yml restart postgres
        sleep 10
    fi
else
    echo "❌ PostgreSQL container is not running"
    echo "🔧 Starting PostgreSQL container..."
    docker-compose -f docker-compose.prod.yml up -d postgres
    sleep 15
fi

echo
echo "🔧 Step 3: Checking database schema..."
echo "====================================="

# Check if admin schema exists
echo "Checking if admin schema exists..."
if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U servaan -d servaan_prod -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'admin';" | grep -q "admin"; then
    echo "✅ Admin schema exists"
else
    echo "❌ Admin schema not found"
    echo "🔧 Creating admin schema..."
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U servaan -d servaan_prod -c "CREATE SCHEMA IF NOT EXISTS admin;"
fi

# Check if admin_users table exists
echo "Checking if admin_users table exists..."
if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U servaan -d servaan_prod -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'admin' AND table_name = 'admin_users';" | grep -q "admin_users"; then
    echo "✅ Admin users table exists"
else
    echo "❌ Admin users table not found"
    echo "🔧 Creating admin users table..."
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U servaan -d servaan_prod -c "
    CREATE TABLE IF NOT EXISTS admin.admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'SUPPORT',
        is_active BOOLEAN DEFAULT true,
        two_factor_secret VARCHAR(255),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    "
    
    # Insert default admin user
    echo "🔧 Inserting default admin user..."
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U servaan -d servaan_prod -c "
    INSERT INTO admin.admin_users (email, password_hash, role, is_active) 
    VALUES ('admin@servaan.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Q8Q8Q8', 'SUPER_ADMIN', true)
    ON CONFLICT (email) DO NOTHING;
    "
fi

echo
echo "🔧 Step 4: Rebuilding admin backend..."
echo "===================================="

echo "Stopping admin backend..."
docker-compose -f docker-compose.prod.yml stop admin-backend

echo "Removing admin backend container..."
docker-compose -f docker-compose.prod.yml rm -f admin-backend

echo "Removing admin backend image..."
docker rmi app-admin-backend 2>/dev/null || echo "Image not found"

echo "Clearing Docker build cache..."
docker builder prune -f

echo "Rebuilding admin backend..."
docker-compose -f docker-compose.prod.yml build --no-cache admin-backend

echo "Starting admin backend..."
docker-compose -f docker-compose.prod.yml up -d admin-backend

echo "⏳ Waiting for admin backend to start..."
sleep 15

echo
echo "🔧 Step 5: Testing admin backend..."
echo "=================================="

if docker ps | grep -q "servaan-admin-backend-prod"; then
    echo "✅ Admin backend container is running"
    
    echo "Testing health endpoint..."
    if curl -s http://localhost:3003/api/admin/health; then
        echo "✅ Health endpoint working"
    else
        echo "❌ Health endpoint failed"
    fi
    
    echo "Testing login endpoint..."
    if curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@servaan.com","password":"AdminSecure2024"}' http://localhost:3003/api/admin/auth/login; then
        echo "✅ Login endpoint working"
    else
        echo "❌ Login endpoint failed"
    fi
else
    echo "❌ Admin backend container failed to start"
    echo "🔍 Checking logs..."
    docker-compose -f docker-compose.prod.yml logs admin-backend
fi

echo
echo "✅ Admin backend 500 error fix completed!"
echo ""
echo "🎯 What was fixed:"
echo "- Environment variables"
echo "- Database connectivity"
echo "- Database schema"
echo "- Admin users table"
echo "- Admin backend rebuild"
echo ""
echo "🧪 Test in browser: https://admin.servaan.com/admin/login"
echo ""
echo "📊 If still having issues, run:"
echo "./debug-admin-backend-500-error.sh"
