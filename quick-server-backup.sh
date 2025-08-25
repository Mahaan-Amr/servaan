#!/bin/bash

# Quick Server Backup Script
# Run this directly on your Ubuntu server for a fast backup

set -e

# Configuration
BACKUP_DIR="/opt/servaan/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="servaan_quick_backup_${TIMESTAMP}"

echo "Starting quick backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database dump
echo "Creating database dump..."
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod -Fc -f "/tmp/${BACKUP_NAME}.dump"

# Copy to host
docker cp "servaan-postgres-prod:/tmp/${BACKUP_NAME}.dump" "$BACKUP_DIR/"

# Create compressed archive
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}.dump"

# Clean up
rm "${BACKUP_NAME}.dump"

echo "Quick backup completed: ${BACKUP_NAME}.tar.gz"
echo "Location: $BACKUP_DIR"
echo "Size: $(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)"
