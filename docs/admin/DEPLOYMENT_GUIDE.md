# 🚀 Admin Panel Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the Servaan Platform Admin Panel to production.

## 🎯 Deployment Strategy

### **Phase 1: Development Environment**
- Local development setup
- Database migration testing
- Security validation

### **Phase 2: Staging Environment**
- Production-like testing
- Performance validation
- Security testing

### **Phase 3: Production Deployment**
- Live deployment
- Monitoring setup
- Backup configuration

## 🔧 Pre-Deployment Checklist

- [ ] **Database backup** created
- [ ] **Migration scripts** tested
- [ ] **Security review** completed
- [ ] **Performance testing** done
- [ ] **Documentation** updated
- [ ] **Team notified** of deployment

## 🚀 Production Deployment Steps

### **1. Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **2. Domain Configuration**
```bash
# Add DNS record
# admin.servaan.com → Your server IP

# Configure SSL certificate
sudo certbot --nginx -d admin.servaan.com
```

### **3. Environment Setup**
```bash
# Navigate to project directory
cd /opt/servaan/app

# Ensure environment file exists
ls -la .env.production
```

### **4. Deploy Services with Zero-Downtime**
```bash
# Use the complete deployment script
chmod +x deploy-server.sh
./deploy-server.sh

# This script provides:
# ✅ Zero-downtime deployment
# ✅ Automatic backup before deployment
# ✅ Health checks for all services
# ✅ Rollback capability on failure
# ✅ Service-by-service updates
# ✅ Prisma migrations execution
```

### **5. Verify Deployment**
```bash
# Check all services status
docker-compose --env-file .env.production -f docker-compose.prod.yml ps

# Test admin panel accessibility
curl -I https://admin.servaan.com

# Test admin API
curl -I https://admin.servaan.com/api/admin/health

# View logs if needed
docker-compose --env-file .env.production -f docker-compose.prod.yml logs -f admin-backend
```

## 📊 Post-Deployment Verification

### **Health Checks**
- [ ] Admin panel accessible
- [ ] Authentication working
- [ ] Database connected
- [ ] All APIs responding
- [ ] SSL certificate valid

### **Security Validation**
- [ ] IP whitelisting active
- [ ] 2FA working
- [ ] Audit logging active
- [ ] Rate limiting active

---

**Last Updated**: January 15, 2025  
**Status**: Deployment Guide Complete
