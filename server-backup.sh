#!/bin/bash

# Servaan Server Database Backup Script
# This script creates a complete backup of the production database
# Run this script on your Ubuntu server

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="servaan_server_backup_${TIMESTAMP}"
DB_NAME="servaan_prod"
DB_USER="servaan"
DB_CONTAINER="servaan-postgres-prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Create backup directory
log "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Check if Docker is running
log "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running or not accessible"
    exit 1
fi

# Check if database container is running
log "Checking database container status..."
if ! docker ps | grep -q "$DB_CONTAINER"; then
    error "Database container $DB_CONTAINER is not running"
    exit 1
fi

# Check available disk space
log "Checking available disk space..."
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
REQUIRED_SPACE=1000000  # 1GB in KB
if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    warning "Low disk space. Available: ${AVAILABLE_SPACE}KB, Required: ${REQUIRED_SPACE}KB"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Backup cancelled by user"
        exit 1
    fi
fi

# Start backup process
log "Starting complete database backup..."

# 1. Create database dump
log "Creating database dump..."
DUMP_FILE="$BACKUP_DIR/${BACKUP_NAME}.dump"
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -f "/tmp/${BACKUP_NAME}.dump"; then
    # Copy dump file from container to host
    if docker cp "$DB_CONTAINER:/tmp/${BACKUP_NAME}.dump" "$DUMP_FILE"; then
        success "Database dump created: $DUMP_FILE"
        
        # Get dump file size
        DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
        log "Dump file size: $DUMP_SIZE"
    else
        error "Failed to copy dump file from container"
        exit 1
    fi
else
    error "Failed to create database dump"
    exit 1
fi

# 2. Create CSV exports directory
CSV_DIR="$BACKUP_DIR/${BACKUP_NAME}_csv_exports"
log "Creating CSV exports directory: $CSV_DIR"
mkdir -p "$CSV_DIR"

# 3. Export all tables to CSV
log "Exporting tables to CSV format..."

# List of tables to export (based on your schema)
TABLES=(
    "tenants"
    "users"
    "menu_categories"
    "menu_items"
    "orders"
    "order_items"
    "suppliers"
    "item_suppliers"
    "inventory"
    "inventory_transactions"
    "payments"
    "customer_feedback"
    "notifications"
    "audit_logs"
)

for table in "${TABLES[@]}"; do
    log "Exporting table: $table"
    CSV_FILE="$CSV_DIR/${table}.csv"
    
    # Check if table exists before exporting
    if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" | grep -q "t"; then
        if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "COPY $table TO STDOUT WITH CSV HEADER;" > "$CSV_FILE"; then
            success "Exported $table to $CSV_FILE"
            
            # Get row count
            ROW_COUNT=$(wc -l < "$CSV_FILE")
            ROW_COUNT=$((ROW_COUNT - 1))  # Subtract header row
            log "  Rows exported: $ROW_COUNT"
        else
            warning "Failed to export table $table"
        fi
    else
        warning "Table $table does not exist, skipping"
    fi
done

# 4. Create backup summary
SUMMARY_FILE="$BACKUP_DIR/${BACKUP_NAME}_summary.txt"
log "Creating backup summary: $SUMMARY_FILE"

cat > "$SUMMARY_FILE" << EOF
Servaan Server Database Backup Summary
=====================================

Backup Date: $(date)
Backup Name: $BACKUP_NAME
Database: $DB_NAME
Database User: $DB_USER

Files Created:
- Database Dump: ${BACKUP_NAME}.dump ($DUMP_SIZE)
- CSV Exports: ${BACKUP_NAME}_csv_exports/

Database Information:
EOF

# Get database size
DB_SIZE=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
echo "Database Size: $DB_SIZE" >> "$SUMMARY_FILE"

# Get table counts
echo "" >> "$SUMMARY_FILE"
echo "Table Row Counts:" >> "$SUMMARY_FILE"
for table in "${TABLES[@]}"; do
    if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" | grep -q "t"; then
        COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $table;" | xargs)
        echo "- $table: $COUNT rows" >> "$SUMMARY_FILE"
    else
        echo "- $table: Table does not exist" >> "$SUMMARY_FILE"
    fi
done

# 5. Create restore instructions
RESTORE_FILE="$BACKUP_DIR/${BACKUP_NAME}_restore_instructions.txt"
log "Creating restore instructions: $RESTORE_FILE"

cat > "$RESTORE_FILE" << EOF
Servaan Server Database Restore Instructions
===========================================

To restore this backup:

1. Stop the application:
   docker-compose -f docker-compose.prod.yml down

2. Restore the database:
   docker exec -i servaan-postgres-prod pg_restore -U servaan -d servaan_prod --clean --if-exists < ${BACKUP_NAME}.dump

3. Restart the application:
   docker-compose -f docker-compose.prod.yml up -d

4. Verify the restore:
   docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM tenants;"

Note: This will completely replace the current database. Make sure to backup any current data first.

CSV Import Instructions:
=======================

To import specific tables from CSV:

1. Copy the CSV file to the container:
   docker cp table_name.csv servaan-postgres-prod:/tmp/

2. Import using psql:
   docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "\\COPY table_name FROM '/tmp/table_name.csv' WITH CSV HEADER;"

Warning: CSV import will append data. Use with caution in production.
EOF

# 6. Create compressed archive
log "Creating compressed archive..."
cd "$BACKUP_DIR"
if tar -czf "${BACKUP_NAME}_complete.tar.gz" "${BACKUP_NAME}.dump" "${BACKUP_NAME}_csv_exports" "${BACKUP_NAME}_summary.txt" "${BACKUP_NAME}_restore_instructions.txt"; then
    success "Created compressed archive: ${BACKUP_NAME}_complete.tar.gz"
    
    # Get archive size
    ARCHIVE_SIZE=$(du -h "${BACKUP_NAME}_complete.tar.gz" | cut -f1)
    log "Archive size: $ARCHIVE_SIZE"
    
    # Clean up individual files (keep the archive)
    rm -rf "${BACKUP_NAME}.dump" "${BACKUP_NAME}_csv_exports" "${BACKUP_NAME}_summary.txt" "${BACKUP_NAME}_restore_instructions.txt"
    log "Cleaned up individual files, keeping only the compressed archive"
else
    error "Failed to create compressed archive"
    exit 1
fi

# 7. Final summary
log "Backup completed successfully!"
echo ""
echo "=========================================="
echo "BACKUP COMPLETED SUCCESSFULLY"
echo "=========================================="
echo "Backup Name: $BACKUP_NAME"
echo "Location: $BACKUP_DIR"
echo "Archive: ${BACKUP_NAME}_complete.tar.gz"
echo "Size: $ARCHIVE_SIZE"
echo ""
echo "Files included:"
echo "- Complete database dump"
echo "- CSV exports of all tables"
echo "- Backup summary"
echo "- Restore instructions"
echo ""
echo "To restore:"
echo "1. Extract: tar -xzf ${BACKUP_NAME}_complete.tar.gz"
echo "2. Follow instructions in restore_instructions.txt"
echo "=========================================="

# 8. Optional: Upload to cloud storage (uncomment if needed)
# log "Uploading to cloud storage..."
# # Add your cloud storage upload commands here
# # Example for AWS S3:
# # aws s3 cp "${BACKUP_NAME}_complete.tar.gz" s3://your-bucket/backups/

success "Server backup completed successfully!"
