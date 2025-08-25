# 🗄️ **Database Backup Strategy - Protect Your Production Data!**

## 🚨 **IMMEDIATE ACTION COMPLETED**
✅ **Database backup created successfully!**  
📁 **File**: `database_backup_20250115.dump` (201KB)  
📍 **Location**: `D:\servaan\database_backup_20250115.dump`

---

## 📋 **Backup Types & Methods**

### **1. Full Database Backup (Recommended)**
```bash
# Create backup
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod --format=custom --file=/backups/servaan_prod_backup_$(date +%Y%m%d_%H%M%S).dump

# Copy to local machine
docker cp servaan-postgres-prod:/backups/[BACKUP_FILENAME] ./
```

### **2. SQL Script Backup (Human-readable)**
```bash
# Create SQL backup
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod --format=plain --file=/backups/servaan_prod_backup_$(date +%Y%m%d_%H%M%S).sql

# Copy to local machine
docker cp servaan-postgres-prod:/backups/[BACKUP_FILENAME] ./
```

### **3. Specific Table Backup**
```bash
# Backup specific tables
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod --table=tenants --table=users --format=custom --file=/backups/critical_tables_backup.dump
```

---

## 🔄 **Restore Methods**

### **1. Restore Full Database**
```bash
# Stop the application first
docker-compose -f docker-compose.prod.yml stop

# Restore the backup
docker exec -i servaan-postgres-prod pg_restore -U servaan -d servaan_prod --clean --if-exists < database_backup_20250115.dump

# Restart the application
docker-compose -f docker-compose.prod.yml start
```

### **2. Restore SQL Backup**
```bash
# Restore SQL backup
docker exec -i servaan-postgres-prod psql -U servaan -d servaan_prod < servaan_prod_backup_20250115.sql
```

### **3. Restore to New Database**
```bash
# Create new database
docker exec servaan-postgres-prod createdb -U servaan servaan_prod_new

# Restore to new database
docker exec -i servaan-postgres-prod pg_restore -U servaan -d servaan_prod_new < database_backup_20250115.dump
```

---

## 🤖 **Automated Backup Scripts**

### **1. Windows Batch Script (`backup-database.bat`)**
```batch
@echo off
echo Creating database backup...
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod --format=custom --file=/backups/servaan_prod_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.dump

echo Copying backup to local machine...
docker cp servaan-postgres-prod:/backups/servaan_prod_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.dump ./

echo Backup completed successfully!
pause
```

### **2. Linux/Mac Script (`backup-database.sh`)**
```bash
#!/bin/bash
echo "Creating database backup..."
docker exec servaan-postgres-prod pg_dump -U servaan -d servaan_prod --format=custom --file=/backups/servaan_prod_backup_$(date +%Y%m%d_%H%M%S).dump

echo "Copying backup to local machine..."
docker cp servaan-postgres-prod:/backups/servaan_prod_backup_$(date +%Y%m%d_%H%M%S).dump ./

echo "Backup completed successfully!"
```

---

## 📅 **Backup Schedule Recommendations**

### **Production Environment**
- **Daily**: Full database backup (keep last 7 days)
- **Weekly**: Full database backup (keep last 4 weeks)
- **Monthly**: Full database backup (keep last 12 months)
- **Before Updates**: Always backup before major deployments

### **Development Environment**
- **Before Testing**: Backup before running test scripts
- **After Data Changes**: Backup after significant data modifications
- **Weekly**: Regular backup for development work

---

## 🛡️ **Backup Security & Storage**

### **Local Storage**
- Store backups in `D:\servaan\backups\` directory
- Use descriptive filenames with timestamps
- Keep multiple versions for safety

### **Remote Storage (Recommended)**
- **Cloud Storage**: Google Drive, Dropbox, or AWS S3
- **Git Repository**: Store in private repository (for small databases)
- **External Hard Drive**: Physical backup for critical data

### **Backup Verification**
```bash
# Verify backup integrity
docker exec -i servaan-postgres-prod pg_restore --list database_backup_20250115.dump

# Check backup size and content
docker exec servaan-postgres-prod pg_restore --verbose --dry-run database_backup_20250115.dump
```

---

## 🚨 **Emergency Recovery Procedures**

### **Complete Database Loss**
1. **Stop all services**: `docker-compose -f docker-compose.prod.yml down`
2. **Remove database volume**: `docker volume rm servaan_postgres_data`
3. **Restore from backup**: Use the restore commands above
4. **Restart services**: `docker-compose -f docker-compose.prod.yml up -d`

### **Partial Data Loss**
1. **Identify affected tables**: Check application logs
2. **Restore specific tables**: Use table-specific backup/restore
3. **Verify data integrity**: Run consistency checks

### **Corrupted Database**
1. **Stop services immediately**
2. **Create emergency backup** (if possible)
3. **Restore from last known good backup**
4. **Run database integrity checks**

---

## 📊 **Backup Monitoring & Alerts**

### **Automated Health Checks**
```bash
# Check backup file size
ls -lh database_backup_20250115.dump

# Verify backup age
find . -name "*.dump" -mtime +7 -exec ls -lh {} \;

# Test restore process (dry run)
docker exec -i servaan-postgres-prod pg_restore --dry-run database_backup_20250115.dump
```

### **Backup Success Indicators**
- ✅ Backup file size > 100KB (minimum expected)
- ✅ Backup file created within last 24 hours
- ✅ Restore test passes successfully
- ✅ No error messages in backup logs

---

## 🔧 **Troubleshooting Common Issues**

### **Backup Fails**
- **Permission denied**: Check Docker container permissions
- **Disk space**: Ensure sufficient storage space
- **Database locked**: Stop applications before backup

### **Restore Fails**
- **Version mismatch**: Ensure PostgreSQL versions match
- **Schema conflicts**: Use `--clean --if-exists` flags
- **Permission issues**: Check user privileges

---

## 📝 **Backup Log Template**

```
Backup Date: 2025-01-15
Backup Time: 22:55:00
Backup Type: Full Database
File Size: 201KB
Status: ✅ Success
Notes: Production database backup before UI updates
Location: D:\servaan\database_backup_20250115.dump
```

---

## 🎯 **Next Steps**

1. **Create backup scripts**: Use the provided batch/bash scripts
2. **Set up automated schedule**: Use Windows Task Scheduler or cron
3. **Test restore process**: Verify backups work correctly
4. **Store backups remotely**: Set up cloud storage backup
5. **Document procedures**: Train team on backup/restore processes

---

## 📞 **Emergency Contacts**

- **Database Administrator**: [Your Name]
- **Backup Location**: `D:\servaan\backups\`
- **Last Backup**: `database_backup_20250115.dump`
- **Backup Size**: 201KB
- **Backup Status**: ✅ **READY FOR RECOVERY**

---

*Last Updated: 2025-01-15*  
*Backup Strategy Version: 1.0*
