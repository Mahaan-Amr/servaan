# 🚨 **سِروان (Servaan) - Quick Troubleshooting Reference**

## ⚡ **Emergency Commands (When Things Break)**

### **Check Service Status**
```bash
./auto-deploy.sh status
docker ps
systemctl status nginx
ufw status
```

### **View Logs**
```bash
./auto-deploy.sh logs
docker logs servaan-frontend-prod
docker logs servaan-backend-prod
docker logs servaan-postgres-prod
```

### **Restart Everything**
```bash
./auto-deploy.sh deploy
```

---

## 🚨 **Common Issues & Quick Fixes**

### **1. 502 Bad Gateway**
**Quick Fix**: Check if containers are running
```bash
docker ps | grep servaan
```

### **2. Frontend Not Loading**
**Quick Fix**: Rebuild frontend container
```bash
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

### **3. Backend API Errors**
**Quick Fix**: Check backend logs
```bash
docker logs servaan-backend-prod
```

### **4. Database Connection Issues**
**Quick Fix**: Check PostgreSQL container
```bash
docker exec -it servaan-postgres-prod pg_isready -U servaan
```

### **5. Prisma Client Errors**
**Quick Fix**: Generate client in container
```bash
docker exec -it servaan-backend-prod npx prisma generate
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
