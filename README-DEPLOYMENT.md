# 🚀 Servaan Server Deployment Guide

## 📋 **Overview**

This guide provides a **bulletproof deployment system** for the Servaan platform on your server. Based on deep analysis of your working local setup, these scripts address all the deployment issues we've identified.

## 🎯 **What This System Fixes**

### ✅ **Environment Variable Issues**
- **Problem**: `NEXT_PUBLIC_API_URL: undefined` causing frontend to call `localhost`
- **Solution**: Proper server environment configuration in `.env.server`

### ✅ **Docker Configuration Complexity**
- **Problem**: Over-engineered production setup causing container issues
- **Solution**: Simplified server configuration based on your working local setup

### ✅ **CORS and Domain Issues**
- **Problem**: Frontend trying to access `localhost` instead of server domain
- **Solution**: Correct API URLs and CORS configuration

### ✅ **Container Path Issues**
- **Problem**: Backend container not finding routes due to incorrect file structure
- **Solution**: Proper Dockerfile configurations that maintain working structure

## 📁 **Deployment Files Created**

| File | Purpose | Platform |
|------|---------|----------|
| `deploy-server.bat` | Windows deployment script | Windows |
| `deploy-server.sh` | Linux/Server deployment script | Linux/Server |
| `docker-compose.server.yml` | Simplified server configuration | All |
| `.env.server` | Server environment variables | All |
| `verify-deployment.bat` | Deployment verification | Windows |
| `rollback-server.bat` | Quick rollback if issues occur | Windows |
| `README-DEPLOYMENT.md` | This deployment guide | All |

## 🚀 **Quick Start Deployment**

### **Step 1: Prepare Your Server**
```bash
# On your server, navigate to the project directory
cd /opt/servaan/app

# Pull the latest changes
git pull origin master
```

### **Step 2: Run Deployment Script**
```bash
# For Linux/Server
chmod +x deploy-server.sh
./deploy-server.sh

# For Windows (if running on Windows server)
deploy-server.bat
```

### **Step 3: Verify Deployment**
```bash
# For Windows
verify-deployment.bat

# For Linux/Server
# The deployment script includes verification
```

## 🔧 **Detailed Deployment Process**

### **Phase 1: Pre-Deployment Checks**
- ✅ Docker service status
- ✅ Required files presence
- ✅ Port availability
- ✅ Current configuration backup

### **Phase 2: Configuration Deployment**
- 📋 Apply server Docker Compose configuration
- 📋 Apply server environment variables
- 📋 Stop existing containers
- 📋 Build and start new containers

### **Phase 3: Verification**
- 🔍 Container status check
- 📡 Backend health verification
- 🌐 Frontend accessibility test
- 🗄️ Database connectivity test
- 🔴 Redis connectivity test
- 🔌 API endpoint testing

## 🎯 **Key Configuration Changes**

### **Environment Variables**
```bash
# Before (Broken)
NEXT_PUBLIC_API_URL=undefined
API_URL=localhost:3001

# After (Fixed)
NEXT_PUBLIC_API_URL=https://servaan.com/api
API_URL=https://servaan.com/api
CORS_ORIGIN=https://*.servaan.com,https://servaan.com
```

### **Database Configuration**
```bash
# Before (Broken)
DATABASE_URL=postgresql://localhost:5432/...

# After (Fixed)
DATABASE_URL=postgresql://servaan:password@postgres:5432/servaan_prod
```

### **Container Names**
```bash
# Before (Complex)
servaan-backend-prod
servaan-frontend-prod

# After (Simple)
servaan-backend-server
servaan-frontend-server
```

## 🔍 **Troubleshooting Common Issues**

### **Issue 1: "Container not found"**
```bash
# Solution: Check container names
docker ps -a

# Expected containers:
# - servaan-postgres-server
# - servaan-redis-server
# - servaan-backend-server
# - servaan-frontend-server
# - servaan-pgadmin-server
```

### **Issue 2: "Port already in use"**
```bash
# Solution: Check what's using the port
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# Stop conflicting services or change ports in docker-compose.server.yml
```

### **Issue 3: "Environment variables not loaded"**
```bash
# Solution: Verify .env.server is copied to .env
cat .env | grep NEXT_PUBLIC_API_URL

# Expected: NEXT_PUBLIC_API_URL=https://servaan.com/api
```

### **Issue 4: "Backend routes not found"**
```bash
# Solution: Check backend container logs
docker-compose logs backend

# Look for route registration messages
# Expected: Routes should be registered without errors
```

## 🚨 **Emergency Procedures**

### **Quick Rollback**
```bash
# Windows
rollback-server.bat

# Linux/Server
# The deployment script includes automatic rollback on errors
```

### **Manual Recovery**
```bash
# 1. Stop all containers
docker-compose down

# 2. Restore backup
cp docker-compose.yml.backup docker-compose.yml

# 3. Restart with previous configuration
docker-compose up -d
```

### **Complete Reset**
```bash
# 1. Stop and remove all containers
docker-compose down -v

# 2. Remove all images
docker rmi $(docker images -q)

# 3. Restore from git
git checkout HEAD -- docker-compose.yml
git checkout HEAD -- .env

# 4. Start fresh
docker-compose up -d
```

## 📊 **Monitoring and Maintenance**

### **Health Checks**
```bash
# Check container health
docker-compose ps

# Check resource usage
docker stats

# Check logs
docker-compose logs -f [service-name]
```

### **Regular Maintenance**
```bash
# Update containers
docker-compose pull
docker-compose up -d

# Clean up unused resources
docker system prune -f

# Backup database
docker exec servaan-postgres-server pg_dump -U servaan servaan_prod > backup.sql
```

## 🔐 **Security Considerations**

### **Environment Variables**
- ✅ Strong passwords for database and Redis
- ✅ Secure JWT secret
- ✅ Proper CORS configuration
- ✅ Production environment settings

### **Network Security**
- ✅ Internal Docker network
- ✅ Port exposure only where necessary
- ✅ Health check endpoints

## 📞 **Support and Troubleshooting**

### **If Deployment Fails**
1. **Check logs**: `docker-compose logs [service-name]`
2. **Verify configuration**: `docker-compose config`
3. **Check resources**: `docker stats`
4. **Run verification**: `verify-deployment.bat`

### **Common Error Messages**
- `"Container not found"` → Check container names in docker-compose.yml
- `"Port already in use"` → Check port conflicts with `netstat`
- `"Environment variable undefined"` → Verify .env.server is copied to .env
- `"Route not found"` → Check backend container logs for route registration

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ All containers show "Up" status
- ✅ Backend health check passes: `http://localhost:3001/api/health`
- ✅ Frontend is accessible: `http://localhost:3000`
- ✅ No error messages in container logs
- ✅ API endpoints respond correctly

## 🚀 **Next Steps After Deployment**

1. **Test the application** at your domain
2. **Create test tenants** using the tenant creation script
3. **Verify all workspaces** are accessible
4. **Monitor performance** and resource usage
5. **Set up monitoring** and alerting if needed

---

## 📝 **File Descriptions**

### **`deploy-server.bat` / `deploy-server.sh`**
Main deployment scripts that orchestrate the entire deployment process.

### **`docker-compose.server.yml`**
Simplified server configuration based on your working local setup.

### **`.env.server`**
Server environment configuration that fixes all the variable mismatches.

### **`verify-deployment.bat`**
Comprehensive verification script to ensure deployment success.

### **`rollback-server.bat`**
Quick rollback script for emergency situations.

---

**🎯 This deployment system is designed to be bulletproof and address all the issues we've encountered. Follow the steps carefully, and you should have a working server deployment!**
