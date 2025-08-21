# 🚀 **سِروان (Servaan) Platform - Complete Deployment Guide**

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Complete Deployment Process](#complete-deployment-process)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Maintenance & Updates](#maintenance--updates)
8. [Known Issues & Solutions](#known-issues--solutions)
9. [Windows Docker Testing](#windows-docker-testing)

---

## 🎯 **Project Overview**

**سِروان (Servaan)** is a comprehensive business management platform for cafes, restaurants, and retail businesses, featuring:

- 📊 **Inventory Management System**
- 👥 **Customer Relationship Management (CRM)**
- 💰 **Accounting & Financial Management**
- 🛒 **Point of Sale (POS) System**
- 📈 **Business Intelligence & Analytics**
- 📱 **SMS Management & Communication**
- 🔍 **QR Code & Barcode Scanning**
- 🌐 **Multi-tenant Architecture**

---

## 🖥️ **System Requirements**

### **Minimum Requirements**
- **OS**: Ubuntu 20.04+ (tested on Ubuntu 24.04) or Windows 10+ with Docker Desktop
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB available space
- **CPU**: 2 cores minimum
- **Network**: Stable internet connection

### **Software Requirements**
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18.18+ (for host scripts)
- **npm**: 8.0+
- **Git**: Latest version

---

## ✅ **Pre-Deployment Checklist**

### **Server Preparation**
- [ ] Ubuntu server with root access (or Windows with Docker Desktop)
- [ ] Server IP address noted
- [ ] Domain name configured (optional)
- [ ] Firewall ports open (80, 443, 3000, 3001, 5050, 5432, 6379)
- [ ] SSH access configured

### **Code Repository**
- [ ] Project cloned from GitHub
- [ ] Latest changes pulled
- [ ] All dependencies committed
- [ ] Environment files prepared

---

## 🚀 **Complete Deployment Process**

### **Phase 1: Server Setup & Configuration**

#### **Step 1: Clone Project**
```bash
cd /opt
git clone https://github.com/Mahaan-Amr/servaan.git
cd servaan/app
```

#### **Step 2: Run Server Configuration Script**
```bash
chmod +x servaan-server-setup.sh
./servaan-server-setup.sh
```

**What This Script Does:**
- ✅ Updates Ubuntu packages
- ✅ Installs Docker & Docker Compose
- ✅ Configures Nginx with reverse proxy
- ✅ Sets up firewall rules
- ✅ Optimizes system performance
- ✅ Creates monitoring & logging

#### **Step 3: Verify Services**
```bash
# Check Docker status
docker ps

# Check Nginx status
systemctl status nginx

# Check firewall status
ufw status
```

### **Phase 2: Application Deployment**

#### **Step 1: Deploy with Auto-Deploy Script**
```bash
./auto-deploy.sh deploy
```

**What This Script Does:**
- ✅ Creates optimized environment files
- ✅ Fixes Puppeteer configuration issues
- ✅ Optimizes Docker build context
- ✅ Builds and starts all containers
- ✅ Performs health checks
- ✅ Shows deployment status

#### **Step 2: Verify Deployment**
```bash
# Check all services
./auto-deploy.sh status

# View logs if needed
./auto-deploy.sh logs
```

### **Phase 3: Post-Deployment Setup**

#### **Step 1: Generate Prisma Client**
```bash
# Navigate to prisma directory
cd /opt/servaan/app/src/prisma

# Generate client in Docker container (recommended)
docker exec -it servaan-backend-prod npx prisma generate

# Copy to host for scripts
docker cp servaan-backend-prod:/app/src/shared/generated/client /opt/servaan/app/src/shared/
```

#### **Step 2: Create Initial Tenants**
```bash
cd /opt/servaan/app
node create-tenant.js
```

**This Creates:**
- 🏢 **Tenant 1**: `dima.servaan.com` (دیما)
- 🏢 **Tenant 2**: `macheen.servaan.com` (مچین)
- 👤 **Admin Users**: With specified credentials
- 📊 **Default Data**: Categories, tables, accounts

---

## 🔧 **Troubleshooting Guide**

### **Issue 1: Nginx Shows Default Page**
**Symptoms**: Accessing server IP shows "Welcome to nginx!"
**Cause**: Nginx not configured for Servaan
**Solution**: Run `servaan-server-setup.sh` script

### **Issue 2: 502 Bad Gateway Error**
**Symptoms**: Page loads but shows "502 Bad Gateway"
**Cause**: Upstream services not responding
**Solution**: Check Docker containers with `docker ps`

### **Issue 3: Frontend Container Restarting**
**Symptoms**: `servaan-frontend-prod` shows "Restarting (127)"
**Cause**: Missing Next.js CLI in production container
**Solution**: Rebuild frontend with updated Dockerfile

### **Issue 4: Prisma Client Not Found**
**Symptoms**: `Error: Cannot find module '@prisma/client'`
**Cause**: Prisma client not generated on host system
**Solution**: Generate client in Docker container and copy to host

### **Issue 5: Node.js Version Incompatibility**
**Symptoms**: Engine warnings about Node.js version
**Cause**: Host system has Node.js < 18.18
**Solution**: Upgrade to Node.js 18+ using NodeSource repository

### **Issue 6: Redis Configuration Error**
**Symptoms**: `FATAL CONFIG FILE ERROR (Redis) - wrong number of arguments`
**Cause**: Missing `REDIS_PASSWORD` environment variable
**Solution**: Add `REDIS_PASSWORD=your-password` to `.env` file

---

## 🌐 **Access URLs After Deployment**

| **Service** | **URL** | **Purpose** |
|-------------|---------|-------------|
| **Frontend** | http://94.182.177.74 | Main application |
| **Backend API** | http://94.182.177.74:3001 | API endpoints |
| **pgAdmin** | http://94.182.177.74:5050 | Database management |
| **Database** | 94.182.177.74:5432 | PostgreSQL connection |

---

## 📊 **Health Check Commands**

### **Service Status**
```bash
./auto-deploy.sh status
```

### **Container Logs**
```bash
./auto-deploy.sh logs
```

### **Individual Service Checks**
```bash
# Frontend health
curl http://94.182.177.74/health

# Backend health
curl http://94.182.177.74:3001/api/health

# Database connection
docker exec -it servaan-postgres-prod pg_isready -U servaan
```

---

## 🔒 **Security Considerations**

### **Firewall Configuration**
- **SSH**: Port 22 (restricted to specific IPs)
- **HTTP**: Port 80 (public access)
- **HTTPS**: Port 443 (when SSL configured)
- **Application Ports**: 3000, 3001, 5050, 5432, 6379

### **Environment Variables**
- **Database passwords**: Strong, unique passwords
- **JWT secrets**: Long, random strings
- **API keys**: Secure, rotated regularly

---

## 📈 **Performance Optimization**

### **System Tuning**
- **File descriptors**: Increased to 65536
- **Kernel parameters**: Optimized for high concurrency
- **Memory management**: Proper swap configuration

### **Docker Optimization**
- **Build context**: Optimized with .dockerignore
- **Multi-stage builds**: Efficient image creation
- **Resource limits**: Proper container constraints

---

## 🚨 **Known Issues & Solutions**

### **Issue: Puppeteer Download Failures**
**Solution**: Removed from dependencies, added environment variables
**Status**: ✅ Resolved

### **Issue: TypeScript Build Failures**
**Solution**: Switched to ts-node runtime execution
**Status**: ✅ Resolved

### **Issue: Import Path Resolution**
**Solution**: Fixed Docker build context and file copying
**Status**: ✅ Resolved

### **Issue: OpenSSL Library Compatibility**
**Solution**: Added proper Alpine Linux packages
**Status**: ✅ Resolved

### **Issue: Redis Configuration Errors**
**Solution**: Added missing environment variables to .env file
**Status**: ✅ Resolved

---

## 🖥️ **Windows Docker Testing**

### **✅ Windows Docker Success (2025-08-21)**
**Environment**: Windows 10 with Docker Desktop 28.3.2
**Result**: All services running successfully

#### **Windows Test Results**
- **Frontend**: ✅ http://localhost:3000 (200 OK)
- **Backend**: ✅ http://localhost:3001/api/health (Healthy)
- **PostgreSQL**: ✅ Container healthy
- **Redis**: ✅ Container healthy  
- **pgAdmin**: ✅ Container running

#### **What This Proves**
1. **Docker configuration is correct** ✅
2. **All build issues resolved** ✅
3. **Project ready for production** ✅
4. **Cross-platform compatibility** ✅

#### **Windows Testing Commands**
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker ps

# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:3001/api/health
```

---

## 🔄 **Maintenance & Updates**

### **Regular Maintenance**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull

# Restart services
./auto-deploy.sh update
```

### **Backup Procedures**
```bash
# Database backup
docker exec -it servaan-postgres-prod pg_dump -U servaan servaan_prod > backup.sql

# Application backup
tar -czf servaan-backup-$(date +%Y%m%d).tar.gz /opt/servaan/
```

---

## 📞 **Support & Troubleshooting**

### **When Things Go Wrong**
1. **Check service status**: `./auto-deploy.sh status`
2. **View logs**: `./auto-deploy.sh logs`
3. **Check Docker containers**: `docker ps`
4. **Verify Nginx**: `systemctl status nginx`
5. **Check firewall**: `ufw status`

### **Common Commands Reference**
```bash
# Restart all services
./auto-deploy.sh deploy

# Stop all services
./auto-deploy.sh stop

# View deployment instructions
cat /opt/servaan/DEPLOYMENT_INSTRUCTIONS.md

# Check resource usage
docker stats
```

---

## 🎉 **Deployment Success Checklist**

- [ ] All Docker containers running and healthy
- [ ] Frontend accessible at server IP
- [ ] Backend API responding to health checks
- [ ] Database connection working
- [ ] Prisma client generated and accessible
- [ ] Initial tenants created successfully
- [ ] All services accessible via Nginx proxy
- [ ] Firewall properly configured
- [ ] Monitoring and logging set up
- [ ] Backup procedures documented

---

## 📚 **Additional Resources**

- **Project Repository**: https://github.com/Mahaan-Amr/servaan
- **Docker Documentation**: https://docs.docker.com/
- **Nginx Configuration**: https://nginx.org/en/docs/
- **Prisma Documentation**: https://www.prisma.io/docs/

---

## 🔄 **Documentation Updates**

**Last Updated**: 2025-08-21
**Version**: 1.1.0
**Status**: Production Ready + Windows Tested

**Next Review**: After next deployment or major update

---

*This document should be updated with any new issues, solutions, or deployment procedures discovered during future deployments.*
