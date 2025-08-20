#!/bin/bash

# Servaan Platform Deployment Script
# Usage: ./deploy.sh [start|stop|restart|update|logs|status]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if docker-compose exists
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Docker compose file $COMPOSE_FILE not found!"
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file $ENV_FILE not found!"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to check if services are running
check_services() {
    docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | wc -l
}

# Function to wait for services to be healthy
wait_for_health() {
    log "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local healthy_count=$(docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | wc -l)
        local total_services=$(docker compose -f "$COMPOSE_FILE" config --services | wc -l)
        
        if [ "$healthy_count" -eq "$total_services" ]; then
            log "All services are healthy! 🎉"
            return 0
        fi
        
        log "Waiting for services to be healthy... (Attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    error "Services failed to become healthy after $max_attempts attempts"
}

# Function to backup database
backup_database() {
    log "Creating database backup..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/database_$timestamp.sql"
    
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U servaan servaan_prod > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $backup_file"
        # Compress backup
        gzip "$backup_file"
        log "Backup compressed: $backup_file.gz"
    else
        error "Database backup failed!"
    fi
}

# Function to start services
start_services() {
    log "Starting Servaan platform services..."
    
    # Start services
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    wait_for_health
    
    log "All services started successfully! 🚀"
}

# Function to stop services
stop_services() {
    log "Stopping Servaan platform services..."
    
    # Backup database before stopping
    backup_database
    
    # Stop services
    docker compose -f "$COMPOSE_FILE" down
    
    log "All services stopped successfully! 🛑"
}

# Function to restart services
restart_services() {
    log "Restarting Servaan platform services..."
    
    # Backup database
    backup_database
    
    # Restart services
    docker compose -f "$COMPOSE_FILE" restart
    
    # Wait for services to be healthy
    wait_for_health
    
    log "All services restarted successfully! 🔄"
}

# Function to update services
update_services() {
    log "Updating Servaan platform services..."
    
    # Backup database
    backup_database
    
    # Pull latest changes (if using git)
    if [ -d ".git" ]; then
        log "Pulling latest changes from git..."
        git pull origin main
    fi
    
    # Rebuild and start services
    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d --build
    
    # Wait for services to be healthy
    wait_for_health
    
    log "Services updated successfully! 🔄"
}

# Function to show logs
show_logs() {
    log "Showing service logs..."
    docker compose -f "$COMPOSE_FILE" logs -f
}

# Function to show status
show_status() {
    log "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        log "Database migrations completed successfully! ✅"
    else
        error "Database migrations failed!"
    fi
}

# Function to create initial data
create_initial_data() {
    log "Creating initial tenant data..."
    
    # Check if tenants already exist
    local tenant_count=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U servaan -d servaan_prod -t -c "SELECT COUNT(*) FROM tenants;" | tr -d ' ')
    
    if [ "$tenant_count" -gt 0 ]; then
        warning "Tenants already exist. Skipping initial data creation."
        return 0
    fi
    
    # Create initial tenants
    docker compose -f "$COMPOSE_FILE" exec -T backend node create-tenant.js
    
    log "Initial tenant data created successfully! 👥"
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        run_migrations
        create_initial_data
        show_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    update)
        update_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    migrate)
        run_migrations
        ;;
    backup)
        backup_database
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|update|logs|status|migrate|backup}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services and backup database"
        echo "  restart - Restart all services"
        echo "  update  - Update and restart services"
        echo "  logs    - Show service logs"
        echo "  status  - Show service status and resource usage"
        echo "  migrate - Run database migrations"
        echo "  backup  - Create database backup"
        exit 1
        ;;
esac
