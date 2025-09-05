#!/bin/bash

# =============================================================================
# سِروان (Servaan) Platform - Update Server Admin Configuration
# =============================================================================
# This script updates the server nginx configuration to support admin.servaan.com
# =============================================================================

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

# Main function
main() {
    print_header "Servaan Server Admin Configuration Update"
    echo

    print_status "This script will update your server nginx configuration to support admin.servaan.com"
    echo

    # Check if we're running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi

    print_status "Backing up current nginx configuration..."
    if [ -f "/etc/nginx/sites-available/servaan" ]; then
        cp /etc/nginx/sites-available/servaan /etc/nginx/sites-available/servaan.backup.$(date +%Y%m%d_%H%M%S)
        print_success "Backup created"
    else
        print_warning "No existing servaan configuration found"
    fi
    echo

    print_status "Creating new nginx configuration with admin support..."
    
    # Create the new nginx configuration
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

    print_success "New nginx configuration created"
    echo

    print_status "Testing nginx configuration..."
    if nginx -t; then
        print_success "Nginx configuration test passed"
    else
        print_error "Nginx configuration test failed!"
        echo "Restoring backup..."
        if [ -f "/etc/nginx/sites-available/servaan.backup.$(date +%Y%m%d_%H%M%S)" ]; then
            cp /etc/nginx/sites-available/servaan.backup.* /etc/nginx/sites-available/servaan
        fi
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

    print_status "Checking if admin frontend is running on port 3004..."
    if netstat -tuln | grep ":3004 " >/dev/null 2>&1; then
        print_success "Admin frontend is running on port 3004"
    else
        print_warning "Admin frontend is not running on port 3004"
        print_status "You may need to start the admin frontend container"
    fi
    echo

    print_status "Checking if admin backend is running on port 3003..."
    if netstat -tuln | grep ":3003 " >/dev/null 2>&1; then
        print_success "Admin backend is running on port 3003"
    else
        print_warning "Admin backend is not running on port 3003"
        print_status "You may need to start the admin backend container"
    fi
    echo

    print_success "Server configuration updated successfully! 🎉"
    echo
    echo "📊 Next steps:"
    echo "1. Ensure your Docker containers are running:"
    echo "   - Main frontend: port 3000"
    echo "   - Main backend: port 3001"
    echo "   - Admin frontend: port 3004"
    echo "   - Admin backend: port 3003"
    echo
    echo "2. Test the configuration:"
    echo "   - Main app: http://servaan.com"
    echo "   - Admin panel: http://admin.servaan.com"
    echo
    echo "3. If using Cloudflare, ensure DNS records point to your server"
    echo
    echo "🔧 Troubleshooting:"
    echo "- Check container status: docker ps"
    echo "- Check nginx status: systemctl status nginx"
    echo "- Check nginx logs: journalctl -u nginx -f"
    echo "- Test locally: curl http://localhost:3004"
    echo
}

# Error handling
trap 'print_error "Configuration update failed!"; exit 1' ERR

# Run main function
main "$@"
