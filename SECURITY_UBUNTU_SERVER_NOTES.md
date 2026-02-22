# 🐧 Ubuntu Server Security Configuration Notes

**Date:** 2025-01-XX  
**Server Environment:** Ubuntu Server  
**Status:** 📋 **CONFIGURATION NOTES**

---

## 🎯 Important Notes for Ubuntu Server Deployment

### 1. Update Script Usage

**On Ubuntu Server, use the bash script:**
```bash
chmod +x SECURITY_UPDATE_SCRIPT.sh
./SECURITY_UPDATE_SCRIPT.sh
```

**Do NOT use the PowerShell script** (`SECURITY_UPDATE_SCRIPT.ps1`) - that's for Windows local development only.

---

## ⚠️ Production Considerations

### 2. Rate Limiting in Production

**Current Implementation:**
- Rate limiting uses in-memory Map (works for single server)
- Located in: `src/frontend/middleware.ts` and `src/admin/frontend/middleware.ts`

**For Production (Multiple Servers/Load Balancer):**
If you're running multiple instances behind a load balancer, you should use **Redis** for distributed rate limiting.

**Current Code Comment:**
```typescript
// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
```

**Recommended:**
- Install Redis on Ubuntu server: `sudo apt install redis-server`
- Use Redis for rate limiting across multiple instances
- Or use a service like Upstash Redis (cloud-hosted)

**Example Redis Implementation (Future Enhancement):**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function checkRateLimit(identifier: string, maxRequests: number): Promise<boolean> {
  const key = `rate_limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_MS / 1000);
  }
  
  return count <= maxRequests;
}
```

---

### 3. Environment Variables on Ubuntu Server

**File Locations:**
- Production `.env` files should be in:
  - `/path/to/project/.env` (root)
  - `/path/to/project/src/backend/.env`
  - `/path/to/project/src/frontend/.env.local`
  - `/path/to/project/src/admin/frontend/.env.local`

**Security Best Practices:**
- ✅ Never commit `.env` files to git (already in `.gitignore`)
- ✅ Use environment variables in production (Docker, systemd, etc.)
- ✅ Restrict file permissions: `chmod 600 .env`
- ✅ Use secrets management (HashiCorp Vault, AWS Secrets Manager, etc.)

**Example systemd service with environment:**
```ini
[Service]
EnvironmentFile=/path/to/project/.env
Environment=NODE_ENV=production
```

---

### 4. Security Headers Verification

**After deployment, verify security headers are working:**
```bash
curl -I https://your-domain.com
```

**Expected Headers:**
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: ...`

---

### 5. Firewall Configuration (Ubuntu)

**Recommended UFW rules:**
```bash
# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (if exposed)
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

**For Docker deployments:**
- Configure firewall rules for Docker networks
- Use Docker's built-in firewall or iptables

---

### 6. SSL/TLS Certificate

**Recommended:**
- Use Let's Encrypt (free) with Certbot
- Auto-renewal with systemd timer

**Installation:**
```bash
sudo apt install certbot python3-certbot-nginx
# or for Apache:
sudo apt install certbot python3-certbot-apache
```

**Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

### 7. System Updates

**Keep Ubuntu server updated:**
```bash
# Update package list
sudo apt update

# Upgrade packages
sudo apt upgrade -y

# Reboot if kernel updated
sudo reboot
```

**Automated updates (optional):**
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

### 8. Log Monitoring

**Check application logs:**
```bash
# If using systemd
sudo journalctl -u your-service-name -f

# If using PM2
pm2 logs

# If using Docker
docker logs -f container-name
```

**Monitor for security events:**
- Failed login attempts
- Rate limit violations (429 responses)
- 500 errors (potential exploitation)
- Unusual traffic patterns

---

### 9. Backup Strategy

**Database backups:**
```bash
# PostgreSQL backup
pg_dump -U postgres servaan > backup_$(date +%Y%m%d).sql

# Automated daily backups (cron)
0 2 * * * pg_dump -U postgres servaan > /backups/db_$(date +\%Y\%m\%d).sql
```

**Application backups:**
- Backup `.env` files (securely)
- Backup configuration files
- Backup SSL certificates

---

### 10. Process Management

**Recommended:**
- Use PM2 for Node.js processes
- Use systemd for services
- Use Docker Compose for containerized deployments

**PM2 Example:**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on boot
```

**Docker Compose:**
- Already configured in your project
- Use `docker-compose up -d` for production

---

## 🔍 Production Security Checklist

### Server Hardening:
- [ ] Firewall configured (UFW)
- [ ] SSH key-based authentication (disable password auth)
- [ ] Fail2ban installed and configured
- [ ] Regular system updates enabled
- [ ] Non-root user for application
- [ ] File permissions properly set

### Application Security:
- [ ] Dependencies updated (run update script)
- [ ] Environment variables secured
- [ ] SSL/TLS certificate installed and auto-renewing
- [ ] Security headers verified
- [ ] Rate limiting working (consider Redis for multi-instance)
- [ ] Logs monitored
- [ ] Backups automated

### Monitoring:
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring
- [ ] Security alerts configured
- [ ] Log aggregation (optional)

---

## 📚 Ubuntu-Specific Resources

- [Ubuntu Security Guide](https://ubuntu.com/security)
- [UFW Firewall](https://help.ubuntu.com/community/UFW)
- [Let's Encrypt](https://letsencrypt.org/)
- [Fail2ban](https://www.fail2ban.org/)

---

## 🚀 Quick Commands Reference

### Update Dependencies:
```bash
./SECURITY_UPDATE_SCRIPT.sh
```

### Check Security Headers:
```bash
curl -I https://your-domain.com | grep -i security
```

### Check Firewall:
```bash
sudo ufw status
```

### Check SSL Certificate:
```bash
sudo certbot certificates
```

### View Application Logs:
```bash
# PM2
pm2 logs

# systemd
sudo journalctl -u your-service -f

# Docker
docker logs -f container-name
```

---

**Last Updated:** 2025-01-XX  
**Server:** Ubuntu  
**Status:** 📋 **CONFIGURATION NOTES**

