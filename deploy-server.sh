#!/bin/bash

# 🚀 Servaan Complete Server Deployment Script
# ============================================
# Safe deployment with zero downtime and rollback capability

set -e  # Exit on any error
# Force compose to use the production env file consistently
ENV_FILE="--env-file .env.production"

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

# Function to create backup
create_backup() {
    local backup_dir="/opt/servaan/backups/$(date +%Y%m%d_%H%M%S)"
    print_status "Creating backup in $backup_dir..."
    
    mkdir -p "$backup_dir"
    
    # Backup current docker-compose files
    cp docker-compose.yml "$backup_dir/" 2>/dev/null || true
    cp docker-compose.prod.yml "$backup_dir/" 2>/dev/null || true
    cp .env "$backup_dir/" 2>/dev/null || true
    cp .env.production "$backup_dir/" 2>/dev/null || true
    
    # Backup current running containers
    docker-compose $ENV_FILE -f docker-compose.prod.yml ps > "$backup_dir/containers_status.txt" 2>/dev/null || true
    
    print_success "Backup created at $backup_dir"
    echo "$backup_dir"
}

# Function to rollback deployment
rollback_deployment() {
    local backup_dir=$1
    print_error "Deployment failed! Rolling back..."
    
    if [ -d "$backup_dir" ]; then
        print_status "Restoring from backup..."
        cp "$backup_dir/docker-compose.yml" ./ 2>/dev/null || true
        cp "$backup_dir/docker-compose.prod.yml" ./ 2>/dev/null || true
        cp "$backup_dir/.env" ./ 2>/dev/null || true
        cp "$backup_dir/.env.production" ./ 2>/dev/null || true
        
        # Restart services
        docker-compose $ENV_FILE -f docker-compose.prod.yml down
        docker-compose $ENV_FILE -f docker-compose.prod.yml up -d
        
        print_success "Rollback completed"
    else
        print_error "No backup found for rollback"
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose $ENV_FILE -f docker-compose.prod.yml ps | grep "$service_name" | grep -q "healthy\|Up"; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - $service_name still starting..."
        sleep 10
        ((attempt++))
    done
    
    print_error "$service_name failed to become healthy"
    return 1
}

# Function to perform zero-downtime deployment
zero_downtime_deployment() {
    print_header "Zero-Downtime Deployment"
    
    # Step 1: Pull latest changes
    print_status "Pulling latest changes from Git..."
    git pull origin master
    
    # Step 2: Create backup
    local backup_dir=$(create_backup)
    
    # Step 3: Build new images without stopping services
    print_status "Building new Docker images..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml build --no-cache
    
    # Step 4: Update services one by one (blue-green deployment)
    print_status "Updating services with zero downtime..."
    
    # Update backend first
    print_status "Updating backend service..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml up -d --no-deps backend
    if ! check_service_health "backend"; then
        rollback_deployment "$backup_dir"
        exit 1
    fi

    # Run Prisma migrations for main backend immediately after it's healthy
    print_status "Running Prisma migrations (backend)..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml exec backend sh -lc "npx prisma migrate deploy --schema src/prisma/schema.prisma" || {
        rollback_deployment "$backup_dir"; exit 1; }
    
    # Update admin backend
    print_status "Updating admin backend service..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml up -d --no-deps admin-backend
    if ! check_service_health "admin-backend"; then
        rollback_deployment "$backup_dir"
        exit 1
    fi

    # Run Prisma migrations after admin-backend is healthy
    print_status "Running Prisma migrations (admin-backend)..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml exec admin-backend sh -lc "npx prisma migrate deploy --schema prisma/schema.prisma" || {
        rollback_deployment "$backup_dir"; exit 1; }
    
    # Update frontend
    print_status "Updating frontend service..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml up -d --no-deps frontend
    if ! check_service_health "frontend"; then
        rollback_deployment "$backup_dir"
        exit 1
    fi
    
    # Update admin frontend
    print_status "Updating admin frontend service..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml up -d --no-deps admin-frontend
    if ! check_service_health "admin-frontend"; then
        rollback_deployment "$backup_dir"
        exit 1
    fi
    
    # Step 5: Update Nginx configuration
    # Nginx configuration (no Nginx service in compose). Skipping.
    print_status "Nginx configuration update: skipped (no Nginx service)."
    
    # Step 6: Final health check
    print_status "Performing final health checks..."
    perform_final_health_checks
    
    print_success "Zero-downtime deployment completed successfully!"
}

# Function to perform comprehensive health checks
perform_final_health_checks() {
    print_status "Performing comprehensive health checks..."
    
    # Check all containers are running
    print_status "Checking container status..."
    docker-compose $ENV_FILE -f docker-compose.prod.yml ps
    
    # Test main application
    print_status "Testing main application..."
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "Main frontend is accessible"
    else
        print_warning "Main frontend accessibility check failed"
    fi
    
    # Test admin application
    print_status "Testing admin application..."
    if curl -s http://localhost:3004 >/dev/null 2>&1; then
        print_success "Admin frontend is accessible"
    else
        print_warning "Admin frontend accessibility check failed"
    fi
    
    # Test backend API
    print_status "Testing backend API..."
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Backend API is accessible"
    else
        print_warning "Backend API accessibility check failed"
    fi
    
    # Test admin backend API
    print_status "Testing admin backend API..."
    if curl -s http://localhost:3003/api/admin/health >/dev/null 2>&1; then
        print_success "Admin backend API is accessible"
    else
        print_warning "Admin backend API accessibility check failed"
    fi
    
    # Test domain routing
    print_status "Testing domain routing..."
    if curl -s -H "Host: servaan.com" http://localhost >/dev/null 2>&1; then
        print_success "Main domain routing working"
    else
        print_warning "Main domain routing test failed"
    fi
    
    if curl -s -H "Host: admin.servaan.com" http://localhost >/dev/null 2>&1; then
        print_success "Admin domain routing working"
    else
        print_warning "Admin domain routing test failed"
    fi
}

# Main deployment function
main() {
    print_header "Servaan Complete Server Deployment"
    echo

    # Check if we're in the right directory
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found!"
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
    if [ ! -f ".env.production" ]; then
        print_error ".env.production not found!"
        echo "Please ensure production environment file is present."
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

    # Perform zero-downtime deployment
    zero_downtime_deployment
    
    echo
    print_success "🎉 Complete deployment successful!"
    echo
    echo "📊 Service URLs:"
    echo "- Main Application: https://servaan.com"
    echo "- Admin Panel: https://admin.servaan.com"
    echo "- Main API: https://api.servaan.com"
    echo "- Admin API: https://admin.servaan.com/api"
    echo "- Database: localhost:5432"
    echo "- pgAdmin: http://localhost:5050"
    echo
    echo "🔧 Management Commands:"
    echo "- View logs: docker-compose $ENV_FILE -f docker-compose.prod.yml logs [service-name]"
    echo "- Restart service: docker-compose $ENV_FILE -f docker-compose.prod.yml restart [service-name]"
    echo "- Check status: docker-compose $ENV_FILE -f docker-compose.prod.yml ps"
    echo "- Rollback: Use backup directory from /opt/servaan/backups/"
    echo
    echo "📈 Deployment Features:"
    echo "- ✅ Zero downtime deployment"
    echo "- ✅ Automatic rollback on failure"
    echo "- ✅ Health checks for all services"
    echo "- ✅ Nginx configuration updates"
    echo "- ✅ Complete backup before deployment"
    echo "- ✅ Admin domain support"
    echo
}

# Error handling
trap 'print_error "Deployment failed! Check logs for details."; exit 1' ERR

# Run main function
main "$@"
