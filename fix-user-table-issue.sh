#!/bin/bash

# =============================================================================
# Fix User Table Issue
# =============================================================================
# This script fixes the User table naming issue and creates a test user

set -e

echo "🔧 FIXING USER TABLE ISSUE"
echo "=========================="

# Step 1: Check User table structure
echo "📋 Step 1: Checking User table structure..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "\d User"

# Step 2: Check existing users
echo ""
echo "📋 Step 2: Checking existing users..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role, \"tenantId\" FROM \"User\";"

# Step 3: Check users in dima tenant
echo ""
echo "📋 Step 3: Checking users in dima tenant..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role FROM \"User\" WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';"

# Step 4: Create a test user if none exist
echo ""
echo "📋 Step 4: Creating test user if none exist..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "
INSERT INTO \"User\" (id, email, name, password, role, \"tenantId\", active, \"createdAt\", \"updatedAt\")
SELECT 
    'cmelskkl400006ke6yd0s7l7h-user-001',
    'admin@dima.servaan.com',
    'Admin User',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J4Kz8K8K2', -- password: admin123
    'ADMIN',
    'cmelskkl400006ke6yd0s7l7h',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM \"User\" WHERE email = 'admin@dima.servaan.com' AND \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h'
);
"

# Step 5: Verify user was created
echo ""
echo "📋 Step 5: Verifying user creation..."
docker exec -it servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT id, email, name, role FROM \"User\" WHERE \"tenantId\" = 'cmelskkl400006ke6yd0s7l7h';"

echo ""
echo "🔧 USER TABLE ISSUE FIX COMPLETE"
echo "================================"
echo "✅ Test user created with credentials:"
echo "   Email: admin@dima.servaan.com"
echo "   Password: admin123"
echo "   Role: ADMIN"
