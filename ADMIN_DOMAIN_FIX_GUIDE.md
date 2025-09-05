# 🔧 Admin Domain Fix Guide - Complete Solution

## 🚨 **PROBLEM IDENTIFIED**

The issue is that `https://admin.servaan.com/` currently shows the main application instead of the admin panel because:

1. **Server Nginx Configuration Missing**: The server only has configuration for `servaan.com` → port 3000
2. **Admin Domain Not Configured**: No nginx config for `admin.servaan.com` → port 3004
3. **Cloudflare + Server Mismatch**: Cloudflare routes to server, but server doesn't know how to handle admin domain

## ✅ **SOLUTION IMPLEMENTED**

### **Files Created:**

1. **`nginx-admin-config.conf`** - Complete nginx configuration with admin support
2. **`update-server-admin-config.sh`** - Script to update server configuration
3. **`ADMIN_DOMAIN_FIX_GUIDE.md`** - This comprehensive guide

### **What the Fix Does:**

```nginx
# Main domain (servaan.com) → port 3000 (main frontend)
server {
    listen 80;
    server_name servaan.com www.servaan.com 94.182.177.74;
    location / {
        proxy_pass http://127.0.0.1:3000;  # Main frontend
    }
    location /api/ {
        proxy_pass http://127.0.0.1:3001/; # Main backend
    }
}

# Admin domain (admin.servaan.com) → port 3004 (admin frontend)
server {
    listen 80;
    server_name admin.servaan.com;
    location / {
        proxy_pass http://127.0.0.1:3004;  # Admin frontend
    }
    location /api/ {
        proxy_pass http://127.0.0.1:3003/; # Admin backend
    }
}
```

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Update Server Configuration**

On your server, run:

```bash
# Upload the update script to your server
scp update-server-admin-config.sh root@your-server:/root/

# SSH into your server
ssh root@your-server

# Run the update script
chmod +x update-server-admin-config.sh
./update-server-admin-config.sh
```

### **Step 2: Ensure Docker Containers Are Running**

Make sure these containers are running on your server:

```bash
# Check container status
docker ps

# Expected containers:
# - servaan-frontend-prod (port 3000) - Main frontend
# - servaan-backend-prod (port 3001) - Main backend  
# - servaan-admin-frontend-prod (port 3004) - Admin frontend
# - servaan-admin-backend-prod (port 3003) - Admin backend
```

### **Step 3: Start Missing Containers (if needed)**

If admin containers aren't running:

```bash
# Start admin containers
docker-compose -f docker-compose.prod.yml up admin-frontend admin-backend -d

# Or start all containers
docker-compose -f docker-compose.prod.yml up -d
```

### **Step 4: Verify Configuration**

Test the configuration:

```bash
# Test main domain
curl http://localhost:3000
curl http://localhost:3001/api/health

# Test admin domain
curl http://localhost:3004
curl http://localhost:3003/api/admin/health

# Test nginx routing
curl -H "Host: servaan.com" http://localhost
curl -H "Host: admin.servaan.com" http://localhost
```

## 🌐 **CLOUDFLARE CONFIGURATION**

Ensure your Cloudflare DNS records are set up correctly:

```
Type    Name                    Content           Proxy Status
A       servaan.com             YOUR_SERVER_IP    Proxied
A       admin.servaan.com       YOUR_SERVER_IP    Proxied
CNAME   www.servaan.com         servaan.com       Proxied
```

## 🔍 **TROUBLESHOOTING**

### **Issue: Admin domain still shows main app**

**Solution:**
1. Check if admin containers are running: `docker ps | grep admin`
2. Check nginx config: `nginx -t`
3. Reload nginx: `systemctl reload nginx`
4. Check port binding: `netstat -tuln | grep 3004`

### **Issue: 502 Bad Gateway**

**Solution:**
1. Check if containers are running: `docker ps`
2. Check container logs: `docker logs servaan-admin-frontend-prod`
3. Check nginx logs: `journalctl -u nginx -f`

### **Issue: Admin API not working**

**Solution:**
1. Check admin backend: `curl http://localhost:3003/api/admin/health`
2. Check CORS configuration in admin backend
3. Verify environment variables

## 📊 **EXPECTED RESULT**

After implementing this fix:

- ✅ `https://servaan.com/` → Main application (port 3000)
- ✅ `https://admin.servaan.com/` → Admin panel (port 3004)
- ✅ `https://servaan.com/api/` → Main API (port 3001)
- ✅ `https://admin.servaan.com/api/` → Admin API (port 3003)

## 🔒 **SECURITY CONSIDERATIONS**

1. **Admin Access Control**: Ensure admin panel has proper authentication
2. **CORS Configuration**: Verify admin CORS settings allow admin.servaan.com
3. **SSL Certificates**: Update SSL config for admin.servaan.com when ready
4. **Firewall**: Ensure ports 3003 and 3004 are properly secured

## 📝 **FILES TO UPLOAD TO SERVER**

Upload these files to your server:

1. `nginx-admin-config.conf` - Nginx configuration
2. `update-server-admin-config.sh` - Update script
3. `docker-compose.prod.yml` - Updated Docker compose (with admin frontend)
4. `.env.production` - Environment variables

## 🎯 **VERIFICATION CHECKLIST**

- [ ] Server nginx configuration updated
- [ ] Admin frontend container running on port 3004
- [ ] Admin backend container running on port 3003
- [ ] Nginx configuration test passed
- [ ] Nginx reloaded successfully
- [ ] Main domain working: https://servaan.com/
- [ ] Admin domain working: https://admin.servaan.com/
- [ ] Admin API accessible: https://admin.servaan.com/api/admin/health
- [ ] Cloudflare DNS records configured

## 🚀 **NEXT STEPS AFTER FIX**

1. **Test Admin Panel**: Access https://admin.servaan.com/ and verify it shows admin interface
2. **Test Admin Login**: Ensure admin authentication works
3. **Test Admin Features**: Verify admin functionality (tenant management, etc.)
4. **Monitor Logs**: Check both nginx and container logs for any issues
5. **SSL Setup**: Configure SSL certificates for admin.servaan.com when ready

---

**This fix ensures that `https://admin.servaan.com/` will correctly route to the admin panel running on port 3004, while `https://servaan.com/` continues to work with the main application on port 3000.**
