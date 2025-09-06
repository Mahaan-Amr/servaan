#!/bin/bash

echo "🔧 Fix Admin Local Development Configuration..."
echo "=============================================="

echo "📋 Issue identified:"
echo "- Admin frontend running locally on admin.localhost:3004"
echo "- But API calls go to production https://admin.servaan.com/api"
echo "- This causes CORS error: localhost can't call production domain"
echo "- Need to configure local development environment"
echo

echo "🔧 Solution:"
echo "- Create .env.local file for local development"
echo "- Override production URLs with local URLs"
echo "- Ensure admin backend is running locally on port 3003"
echo

# Check if we're in the admin frontend directory
if [ ! -f "src/admin/frontend/package.json" ]; then
    echo "❌ Please run this script from the servaan project root directory"
    exit 1
fi

# Create .env.local file for admin frontend
echo "🔧 Creating .env.local for admin frontend..."
cat > src/admin/frontend/.env.local << 'EOF'
# Local Development Environment Variables
# These override the production values when running locally

# Local API URLs (for development)
NEXT_PUBLIC_API_URL=http://localhost:3003/api
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3003/api
NEXT_PUBLIC_APP_URL=http://admin.localhost:3004

# Development mode
NODE_ENV=development
EOF

echo "✅ Created src/admin/frontend/.env.local"

# Create .env.local file for admin backend
echo "🔧 Creating .env.local for admin backend..."
cat > src/admin/backend/.env.local << 'EOF'
# Local Development Environment Variables for Admin Backend

# Database (use local database)
DATABASE_URL=postgresql://servaan:servaan123@localhost:5432/servaan_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=servaan_dev
DB_USER=servaan
DB_PASSWORD=servaan123

# Admin Backend Configuration
ADMIN_BACKEND_PORT=3003
ADMIN_JWT_SECRET=servaan-admin-local-dev-secret-key
ADMIN_CORS_ORIGINS=http://admin.localhost:3004,http://localhost:3004,http://127.0.0.1:3004

# Development mode
NODE_ENV=development
EOF

echo "✅ Created src/admin/backend/.env.local"

# Create local development startup script
echo "🔧 Creating local development startup script..."
cat > start-admin-local-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Servaan Admin Local Development..."
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if PostgreSQL is running
print_status "Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    print_warning "PostgreSQL is not running on localhost:5432"
    print_warning "Please start PostgreSQL first"
    exit 1
fi
print_success "PostgreSQL is running"

# Check if admin backend port is available
print_status "Checking admin backend port 3003..."
if lsof -Pi :3003 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3003 is already in use"
    print_warning "Please stop the admin backend first"
    exit 1
fi
print_success "Port 3003 is available"

# Check if admin frontend port is available
print_status "Checking admin frontend port 3004..."
if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3004 is already in use"
    print_warning "Please stop the admin frontend first"
    exit 1
fi
print_success "Port 3004 is available"

# Start admin backend
print_status "Starting admin backend on port 3003..."
cd src/admin/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
print_status "Waiting for admin backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3003/api/admin/health >/dev/null 2>&1; then
    print_success "Admin backend is running"
else
    print_warning "Admin backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start admin frontend
print_status "Starting admin frontend on port 3004..."
cd src/admin/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to start
print_status "Waiting for admin frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:3004 >/dev/null 2>&1; then
    print_success "Admin frontend is running"
else
    print_warning "Admin frontend failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

print_success "🎉 Admin local development environment started!"
echo ""
echo "📊 Service URLs:"
echo "- Admin Frontend: http://admin.localhost:3004"
echo "- Admin Backend: http://localhost:3003"
echo "- Admin API: http://localhost:3003/api/admin"
echo ""
echo "🔧 To stop the services:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🧪 Test the admin panel:"
echo "Open http://admin.localhost:3004/admin/login in your browser"

# Keep script running
wait
EOF

chmod +x start-admin-local-dev.sh
echo "✅ Created start-admin-local-dev.sh"

# Create stop script
echo "🔧 Creating stop script..."
cat > stop-admin-local-dev.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Servaan Admin Local Development..."
echo "============================================="

# Kill processes on ports 3003 and 3004
echo "Stopping admin backend (port 3003)..."
lsof -ti:3003 | xargs kill -9 2>/dev/null || echo "No process on port 3003"

echo "Stopping admin frontend (port 3004)..."
lsof -ti:3004 | xargs kill -9 2>/dev/null || echo "No process on port 3004"

echo "✅ Admin local development environment stopped"
EOF

chmod +x stop-admin-local-dev.sh
echo "✅ Created stop-admin-local-dev.sh"

echo
echo "✅ Admin local development configuration completed!"
echo ""
echo "🎯 What was fixed:"
echo "- Created .env.local files for both admin frontend and backend"
echo "- Override production URLs with local development URLs"
echo "- Created startup and stop scripts for easy management"
echo ""
echo "🚀 To start local development:"
echo "./start-admin-local-dev.sh"
echo ""
echo "🛑 To stop local development:"
echo "./stop-admin-local-dev.sh"
echo ""
echo "📊 Local Development URLs:"
echo "- Admin Frontend: http://admin.localhost:3004"
echo "- Admin Backend: http://localhost:3003"
echo "- Admin API: http://localhost:3003/api/admin"
echo ""
echo "🔧 Prerequisites:"
echo "- PostgreSQL running on localhost:5432"
echo "- Admin backend dependencies installed (npm install in src/admin/backend)"
echo "- Admin frontend dependencies installed (npm install in src/admin/frontend)"
echo ""
echo "🧪 Test:"
echo "1. Run ./start-admin-local-dev.sh"
echo "2. Open http://admin.localhost:3004/admin/login"
echo "3. Try logging in with test credentials"
echo "4. Should work without CORS errors!"
