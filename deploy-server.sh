#!/bin/bash

# 🚀 Servaan Server Deployment Script
# =====================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🚀 $1${NC}"
    echo "====================================="
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -tuln | grep ":$port " >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is available
    fi
}

# Main deployment function
main() {
    print_header "Servaan Server Deployment Script"
    echo

    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        echo "Please run this script from the servaan project root directory."
        exit 1
    fi

    print_status "Pre-deployment checks..."
    echo

    # Check if Docker is running
    if ! command_exists docker; then
        print_error "Docker is not installed!"
        echo "Please install Docker and try again."
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running!"
        echo "Please start Docker service and try again."
        exit 1
    fi

    print_success "Docker is running"

    # Check if Docker Compose is available
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not available!"
        echo "Please install Docker Compose and try again."
        exit 1
    fi

    print_success "Docker Compose is available"
    echo

    # Check if we have the necessary files
    if [ ! -f "docker-compose.server.yml" ]; then
        print_error "docker-compose.server.yml not found!"
        echo "Please ensure all deployment files are present."
        exit 1
    fi

    if [ ! -f ".env.server" ]; then
        print_error ".env.server not found!"
        echo "Please ensure all deployment files are present."
        exit 1
    fi

    # Check if admin Dockerfiles exist
    if [ ! -f "src/admin/backend/Dockerfile" ]; then
        print_error "Admin backend Dockerfile not found!"
        echo "Please ensure admin backend is properly configured."
        exit 1
    fi

    if [ ! -f "src/admin/frontend/Dockerfile" ]; then
        print_error "Admin frontend Dockerfile not found!"
        echo "Please ensure admin frontend is properly configured."
        exit 1
    fi

    print_success "All required files found"
    echo

    # Check if ports are available
    print_status "Checking port availability..."
    if check_port 3000; then
        print_warning "Port 3000 is already in use (frontend)"
    else
        print_success "Port 3000 is available"
    fi

    if check_port 3001; then
        print_warning "Port 3001 is already in use (backend)"
    else
        print_success "Port 3001 is available"
    fi

    if check_port 3003; then
        print_warning "Port 3003 is already in use (admin-backend)"
    else
        print_success "Port 3003 is available"
    fi

    if check_port 3004; then
        print_warning "Port 3004 is already in use (admin-frontend)"
    else
        print_success "Port 3004 is available"
    fi

    if check_port 5432; then
        print_warning "Port 5432 is already in use (database)"
    else
        print_success "Port 5432 is available"
    fi
    echo

    # Backup current configuration
    print_status "Creating backup of current configuration..."
    if [ -f "docker-compose.yml.backup" ]; then
        rm "docker-compose.yml.backup"
    fi
    cp "docker-compose.yml" "docker-compose.yml.backup"
    print_success "Backup created: docker-compose.yml.backup"
    echo

    # Deploy server configuration
    print_header "Deploying server configuration"
    echo

    # Stop any running containers
    print_status "Stopping existing containers..."
    docker-compose down >/dev/null 2>&1 || true
    print_success "Existing containers stopped"
    echo

    # Copy server configuration
    print_status "Applying server configuration..."
    cp "docker-compose.server.yml" "docker-compose.yml"
    cp ".env.server" ".env"
    print_success "Server configuration applied"
    echo

    # Build and start containers
    print_status "Building and starting containers..."
    if docker-compose up -d --build; then
        print_success "Containers started successfully"
    else
        print_error "Failed to build/start containers!"
        echo "Rolling back to previous configuration..."
        cp "docker-compose.yml.backup" "docker-compose.yml"
        print_success "Rollback completed"
        exit 1
    fi
    echo

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    echo

    # Verify deployment
    print_status "Verifying deployment..."
    echo

    # Check container status
    print_status "Container status:"
    docker-compose ps
    echo

    # Test backend health
    print_status "Testing backend health..."
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed (may still be starting)"
    fi

    # Test frontend accessibility
    print_status "Testing frontend accessibility..."
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend accessibility check failed (may still be starting)"
    fi

    # Test admin backend health
    print_status "Testing admin backend health..."
    if curl -s http://localhost:3003/api/admin/health >/dev/null 2>&1; then
        print_success "Admin backend health check passed"
    else
        print_warning "Admin backend health check failed (may still be starting)"
    fi

    # Test admin frontend accessibility
    print_status "Testing admin frontend accessibility..."
    if curl -s http://localhost:3004 >/dev/null 2>&1; then
        print_success "Admin frontend is accessible"
    else
        print_warning "Admin frontend accessibility check failed (may still be starting)"
    fi

    echo
    print_success "Deployment completed!"
    echo
    echo "📊 Next steps:"
    echo "1. Wait 2-3 minutes for all services to fully start"
    echo "2. Test your application at: http://localhost:3000"
    echo "3. Test admin panel at: http://localhost:3004"
    echo "4. Verify API endpoints at: http://localhost:3001/api/health"
    echo "5. Verify admin API at: http://localhost:3003/api/admin/health"
    echo "6. Check container logs if needed: docker-compose logs"
    echo
    echo "🔧 If you encounter issues:"
    echo "- Check container logs: docker-compose logs [service-name]"
    echo "- Restart specific service: docker-compose restart [service-name]"
    echo "- Rollback: Run rollback-server.sh"
    echo
    echo "🌐 Service URLs:"
    echo "- Main Application: http://localhost:3000"
    echo "- Admin Panel: http://localhost:3004"
    echo "- Main API: http://localhost:3001/api"
    echo "- Admin API: http://localhost:3003/api/admin"
    echo "- Database: localhost:5432"
    echo "- pgAdmin: http://localhost:5050"
    echo
}

# Error handling
trap 'print_error "Deployment failed! Rolling back..."; cp "docker-compose.yml.backup" "docker-compose.yml" 2>/dev/null || true; exit 1' ERR

# Run main function
main "$@"
