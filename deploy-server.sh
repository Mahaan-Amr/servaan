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

    # Update Nginx configuration for admin domain support
    print_header "Updating Nginx Configuration for Admin Domain"
    echo

    print_status "Backing up current nginx configuration..."
    if [ -f "/etc/nginx/sites-available/servaan" ]; then
        cp /etc/nginx/sites-available/servaan /etc/nginx/sites-available/servaan.backup.$(date +%Y%m%d_%H%M%S)
        print_success "Nginx backup created"
    else
        print_warning "No existing servaan nginx configuration found"
    fi
    echo

    print_status "Creating updated nginx configuration with admin support..."
    
    # Create the new nginx configuration with admin support
    cat > /etc/nginx/sites-available/servaan << 'EOF'
# =============================================================================
# سِروان (Servaan) Platform - Updated Nginx Configuration with Admin Support
# =============================================================================

# Main domain configuration (servaan.com)
server {
    listen 80;
    server_name servaan.com www.servaan.com 94.182.177.74;
    
    # Frontend proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Admin domain configuration (admin.servaan.com)
server {
    listen 80;
    server_name admin.servaan.com;
    
    # Admin frontend proxy
    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Admin backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3003/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "admin healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    print_success "Updated nginx configuration created"
    echo

    print_status "Testing nginx configuration..."
    if nginx -t; then
        print_success "Nginx configuration test passed"
    else
        print_error "Nginx configuration test failed!"
        echo "Restoring backup..."
        if ls /etc/nginx/sites-available/servaan.backup.* 1> /dev/null 2>&1; then
            cp /etc/nginx/sites-available/servaan.backup.* /etc/nginx/sites-available/servaan
        fi
        print_error "Nginx configuration failed - deployment aborted"
        exit 1
    fi
    echo

    print_status "Reloading nginx..."
    if systemctl reload nginx; then
        print_success "Nginx reloaded successfully"
    else
        print_error "Failed to reload nginx!"
        exit 1
    fi
    echo

    # Test domain routing
    print_status "Testing domain routing..."
    if curl -s -H "Host: servaan.com" http://localhost >/dev/null 2>&1; then
        print_success "Main domain routing working"
    else
        print_warning "Main domain routing test failed (may still be starting)"
    fi

    if curl -s -H "Host: admin.servaan.com" http://localhost >/dev/null 2>&1; then
        print_success "Admin domain routing working"
    else
        print_warning "Admin domain routing test failed (may still be starting)"
    fi
    echo

    print_success "Deployment completed with admin domain support! 🎉"
    echo
    echo "📊 Next steps:"
    echo "1. Wait 2-3 minutes for all services to fully start"
    echo "2. Test your application at: https://servaan.com"
    echo "3. Test admin panel at: https://admin.servaan.com"
    echo "4. Verify API endpoints at: https://servaan.com/api/health"
    echo "5. Verify admin API at: https://admin.servaan.com/api/admin/health"
    echo "6. Check container logs if needed: docker-compose logs"
    echo
    echo "🔧 If you encounter issues:"
    echo "- Check container logs: docker-compose logs [service-name]"
    echo "- Restart specific service: docker-compose restart [service-name]"
    echo "- Check nginx logs: journalctl -u nginx -f"
    echo "- Rollback: Run rollback-server.sh"
    echo
    echo "🌐 Service URLs:"
    echo "- Main Application: https://servaan.com"
    echo "- Admin Panel: https://admin.servaan.com"
    echo "- Main API: https://servaan.com/api"
    echo "- Admin API: https://admin.servaan.com/api/admin"
    echo "- Database: localhost:5432"
    echo "- pgAdmin: http://localhost:5050"
    echo
    echo "🎯 Admin Domain Fix Applied:"
    echo "- admin.servaan.com now routes to port 3004 (admin frontend)"
    echo "- servaan.com continues to route to port 3000 (main frontend)"
    echo "- Both domains have proper API routing configured"
    echo
}

# Error handling
trap 'print_error "Deployment failed! Rolling back..."; cp "docker-compose.yml.backup" "docker-compose.yml" 2>/dev/null || true; exit 1' ERR

# Run main function
main "$@"
