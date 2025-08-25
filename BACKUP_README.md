# Servaan Database Backup Guide

This guide explains how to create complete backups of your Servaan database, both locally and from your production server.

## 🚀 Quick Start

### Option 1: Quick Server Backup (Recommended for Production)
```bash
# On your Ubuntu server, run:
chmod +x quick-server-backup.sh
./quick-server-backup.sh
```

### Option 2: Complete Server Backup with CSV Exports
```bash
# On your Ubuntu server, run:
chmod +x server-backup.sh
./server-backup.sh
```

### Option 3: Remote Backup from Windows
```bash
# Edit server-backup.bat with your server IP
# Then run:
server-backup.bat
```

## 📁 Backup Scripts Overview

### 1. `quick-server-backup.sh` - Fast Production Backup
- **Purpose**: Quick daily backups of production database
- **Output**: Compressed `.tar.gz` file with database dump
- **Time**: ~2-5 minutes
- **Use Case**: Regular production backups, disaster recovery

### 2. `server-backup.sh` - Complete Production Backup
- **Purpose**: Comprehensive backup with CSV exports and documentation
- **Output**: Complete archive with dump, CSV files, summary, and restore instructions
- **Time**: ~5-15 minutes
- **Use Case**: Full system backup, data migration, compliance

### 3. `server-backup.bat` - Windows Remote Backup
- **Purpose**: Trigger server backup from Windows machine
- **Requirements**: SSH access to server, SSH key configured
- **Use Case**: Automated backups from Windows, remote management

## 🔧 Prerequisites

### Server Requirements
- Ubuntu 20.04+ with Docker installed
- Docker containers running (`servaan-postgres-prod`)
- At least 1GB free disk space
- User with Docker permissions

### Local Requirements (for Windows script)
- SSH key configured for server access
- `scp` and `ssh` commands available (Git Bash, WSL, or similar)
- Server IP address and username

## 📋 Backup Contents

### Quick Backup
- Database dump (`.dump` format)
- Compressed archive (`.tar.gz`)

### Complete Backup
- Database dump (`.dump` format)
- CSV exports of all tables
- Backup summary with table counts
- Restore instructions
- Compressed archive (`.tar.gz`)

## 🗄️ Tables Included in CSV Export

The complete backup exports these tables:
- `tenants` - Tenant information
- `users` - User accounts
- `menu_categories` - Menu categories
- `menu_items` - Menu items
- `orders` - Customer orders
- `order_items` - Order line items
- `suppliers` - Supplier information
- `item_suppliers` - Item-supplier relationships
- `inventory` - Inventory levels
- `inventory_transactions` - Inventory changes
- `payments` - Payment records
- `customer_feedback` - Customer feedback
- `notifications` - System notifications
- `audit_logs` - Audit trail

## 📍 Backup Locations

### Server
- **Directory**: `/home/ubuntu/backups/`
- **Naming**: `servaan_[type]_backup_YYYYMMDD_HHMMSS.tar.gz`

### Local Download
```bash
# Download all backups
scp -i ~/.ssh/id_rsa ubuntu@your_server_ip:/home/ubuntu/backups/* .

# Download specific backup
scp -i ~/.ssh/id_rsa ubuntu@your_server_ip:/home/ubuntu/backups/servaan_complete_backup_20250115_143022.tar.gz .
```

## 🔄 Restore Process

### 1. Extract Backup
```bash
tar -xzf servaan_complete_backup_YYYYMMDD_HHMMSS.tar.gz
```

### 2. Stop Application
```bash
docker-compose -f docker-compose.prod.yml down
```

### 3. Restore Database
```bash
docker exec -i servaan-postgres-prod pg_restore -U servaan -d servaan_prod --clean --if-exists < backup_name.dump
```

### 4. Restart Application
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Verify Restore
```bash
docker exec servaan-postgres-prod psql -U servaan -d servaan_prod -c "SELECT COUNT(*) FROM tenants;"
```

## 🚨 Important Notes

### Data Safety
- **NEVER** run restore on production without testing first
- Always backup current data before restoring
- Test restore process in development environment

### Backup Frequency
- **Production**: Daily quick backups, weekly complete backups
- **Development**: Before major changes, before deployments
- **Critical Updates**: Before and after database migrations

### Storage Management
- Keep at least 3 recent backups
- Monitor disk space usage
- Consider cloud storage for long-term retention

## 🔍 Troubleshooting

### Common Issues

#### 1. "Docker container not running"
```bash
# Check container status
docker ps | grep servaan-postgres-prod

# Start if stopped
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. "Permission denied"
```bash
# Check user permissions
ls -la /home/ubuntu/backups/

# Fix permissions if needed
sudo chown -R ubuntu:ubuntu /home/ubuntu/backups/
```

#### 3. "Insufficient disk space"
```bash
# Check available space
df -h /home/ubuntu

# Clean old backups
ls -la /home/ubuntu/backups/
rm /home/ubuntu/backups/old_backup_name.tar.gz
```

#### 4. "SSH connection failed"
- Verify server IP address
- Check SSH key configuration
- Ensure firewall allows SSH (port 22)
- Test connection: `ssh -i ~/.ssh/id_rsa ubuntu@your_server_ip`

## 📊 Backup Monitoring

### Check Backup Status
```bash
# List all backups
ls -la /home/ubuntu/backups/

# Check backup sizes
du -h /home/ubuntu/backups/*.tar.gz

# View backup summary
tar -tzf /home/ubuntu/backups/latest_backup.tar.gz | head -20
```

### Automated Backups
Consider setting up cron jobs for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/ubuntu/quick-server-backup.sh

# Add weekly complete backup on Sundays at 3 AM
0 3 * * 0 /home/ubuntu/server-backup.sh
```

## 🆘 Emergency Procedures

### Database Corruption
1. Stop application immediately
2. Create emergency backup of current state
3. Restore from last known good backup
4. Verify data integrity
5. Investigate root cause

### Complete Server Failure
1. Restore from cloud backup (if available)
2. Rebuild server from scratch
3. Restore database from backup
4. Verify application functionality
5. Update DNS if IP changed

## 📞 Support

If you encounter issues with backups:
1. Check the troubleshooting section above
2. Review server logs: `docker logs servaan-postgres-prod`
3. Verify Docker container health: `docker ps`
4. Check disk space: `df -h`
5. Contact system administrator

---

**Remember**: Regular backups are your first line of defense against data loss. Test your backup and restore procedures regularly to ensure they work when you need them most.
