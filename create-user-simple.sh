#!/bin/bash

# =============================================================================
# Create User Simple - Check structure and create user
# =============================================================================
# This script checks the User table structure and creates a user

set -e

echo "🔧 CREATING USER SIMPLE"
echo "======================="

# Step 1: Check User table structure
echo "📋 Step 1: Checking User table structure..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\d \"User\""

# Step 2: Check if there are any users
echo ""
echo "📋 Step 2: Checking existing users..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) as user_count FROM \"User\";"

# Step 3: Check users in dima tenant
echo ""
echo "📋 Step 3: Checking users in dima tenant..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role FROM \"User\" WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';"

# Step 4: Create user without ON CONFLICT
echo ""
echo "📋 Step 4: Creating test user..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "
INSERT INTO \"User\" (id, email, name, password, role, \"tenantId\", active, \"createdAt\", \"updatedAt\")
VALUES (
    'cmelskkl400006ke6yd0s7l7h-user-001',
    'admin@dima.servaan.com',
    'Admin User',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4Kz8K8K2',
    'ADMIN',
    'cmelskkl400006ke6yd0s7l7h',
    true,
    NOW(),
    NOW()
);
"

# Step 5: Verify user was created
echo ""
echo "📋 Step 5: Verifying user creation..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role FROM \"User\" WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';"

echo ""
echo "🔧 USER CREATION COMPLETE"
echo "========================="
echo "✅ Test user created with credentials:"
echo "   Email: admin@dima.servaan.com"
echo "   Password: admin123"
echo "   Role: ADMIN"
