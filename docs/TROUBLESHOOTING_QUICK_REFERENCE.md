# 🚨 **سِروان (Servaan) - Quick Troubleshooting Reference**

## ⚡ **Emergency Commands (When Things Break)**

### **Check Service Status**
```bash
# Check all containers
docker-compose --env-file .env.production -f docker-compose.prod.yml ps

# Check individual containers
docker ps | grep servaan

# Check Nginx status
systemctl status nginx

# Check firewall status
ufw status
```

### **View Logs**
```bash
# View all service logs
docker-compose --env-file .env.production -f docker-compose.prod.yml logs -f

# View specific service logs
docker logs servaan-frontend-prod
docker logs servaan-backend-prod
docker logs servaan-admin-backend-prod
docker logs servaan-postgres-prod

# View recent logs with filtering
docker logs --tail 100 servaan-backend-prod | grep -E "(ERROR|WARN|🔍|✅|❌)"
```

### **Restart Everything**
```bash
# Use the complete deployment script
./deploy-server.sh

# Or restart specific services
docker-compose --env-file .env.production -f docker-compose.prod.yml restart backend
docker-compose --env-file .env.production -f docker-compose.prod.yml restart frontend
```

---

## 🚨 **Common Issues & Quick Fixes**

### **1. CORS Duplicate Headers**
**Symptoms**: `Access-Control-Allow-Origin` appears twice
**Quick Fix**: Remove CORS headers from Nginx
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-enabled/servaan
# Remove lines starting with "add_header Access-Control"
sudo systemctl reload nginx
```

### **2. 502 Bad Gateway**
**Quick Fix**: Check if containers are running
```bash
docker ps | grep servaan
docker logs servaan-backend-prod
```

### **3. 400 Bad Request - Tenant Context Required**
**Symptoms**: All API calls return tenant context errors
**Quick Fix**: This is fixed in current codebase - tenant middleware now handles API subdomain properly

### **4. WebSocket URL Errors (ws://https/socket.io/)**
**Quick Fix**: Fixed in `src/frontend/lib/apiUtils.ts` - `getBaseUrl()` preserves HTTPS protocol

### **5. Double API Path Issues**
**Symptoms**: API calls to `https://api.servaan.com/api/api/...`
**Quick Fix**: Fixed in `src/frontend/lib/apiUtils.ts` - centralized URL construction

### **6. Prisma Client Import Errors**
**Quick Fix**: All import paths corrected to `../../../shared/generated/client`
```bash
docker exec -it servaan-backend-prod npx prisma generate --schema=../../../prisma/schema.prisma
```

### **7. Database Connection Issues**
**Quick Fix**: Check PostgreSQL container
```bash
docker exec -it servaan-postgres-prod pg_isready -U servaan
```

### **8. Disk Space Issues**
**Quick Fix**: Clean up Docker
```bash
docker system prune -a -f
docker system prune --volumes -f
```

---

## 🔧 **One-Line Fixes**

### **Reset Everything**
```bash
./auto-deploy.sh stop && ./auto-deploy.sh deploy
```

### **Check All Services**
```bash
docker ps && systemctl status nginx && ufw status
```

### **View All Logs**
```bash
docker logs servaan-frontend-prod && docker logs servaan-backend-prod
```

### **Restart Nginx**
```bash
systemctl restart nginx
```

---

## 📱 **Health Check URLs**

- **Frontend**: http://94.182.177.74/health
- **Backend**: http://94.182.177.74:3001/api/health
- **pgAdmin**: http://94.182.177.74:5050

---

## 🚀 **Deployment Recovery**

### **If Auto-Deploy Fails**
```bash
# Manual deployment
docker-compose -f docker-compose.prod.yml up -d --build

# Check results
docker ps
```

### **If Scripts Don't Work**
```bash
# Generate Prisma client manually
cd src/prisma
docker exec -it servaan-backend-prod npx prisma generate
```

---

## 📞 **When to Get Help**

- **Containers won't start**: Check Docker logs
- **Database errors**: Check PostgreSQL container
- **Network issues**: Check firewall and Nginx
- **Script failures**: Check Node.js version and Prisma client

---

*Keep this guide handy for quick problem resolution!*
