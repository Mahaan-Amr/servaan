#!/bin/bash

# =============================================================================
# سِروان (Servaan) Platform - Complete Server Configuration Script
# =============================================================================
# This script will configure your Ubuntu 24.04 server completely for Servaan
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN="servaan.com"
SERVER_IP="94.182.177.74"
FRONTEND_PORT="3000"
BACKEND_PORT="3001"
PGADMIN_PORT="5050"
POSTGRES_PORT="5432"
REDIS_PORT="6379"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    سِروان (Servaan) Platform                ║${NC}"
echo -e "${BLUE}║                   Complete Server Configuration             ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║  🚀 Complete Business Management Platform                   ║${NC}"
echo -e "${BLUE}║  📊 Inventory • CRM • Accounting • POS • Analytics         ║${NC}"
echo -e "${BLUE}║  🌐 Domain: $DOMAIN • IP: $SERVER_IP                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}[INFO] Starting complete server configuration...${NC}"

# =============================================================================
# 1. SYSTEM UPDATE AND ESSENTIAL PACKAGES
# =============================================================================
echo -e "\n${BLUE}🔧 Step 1: System Update and Essential Packages${NC}"
echo -e "${YELLOW}Updating system packages...${NC}"
apt update -y
apt upgrade -y

echo -e "${YELLOW}Installing essential packages...${NC}"
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# =============================================================================
# 2. DOCKER INSTALLATION
# =============================================================================
echo -e "\n${BLUE}🐳 Step 2: Docker Installation${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update -y
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed and started${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# =============================================================================
# 3. NGINX INSTALLATION AND CONFIGURATION
# =============================================================================
echo -e "\n${BLUE}🌐 Step 3: Nginx Installation and Configuration${NC}"

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✅ Nginx installed and started${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# Create Nginx configuration for Servaan
echo -e "${YELLOW}Creating Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/servaan << 'EOF'
# =============================================================================
# سِروان (Servaan) Platform - Nginx Configuration
# =============================================================================

# HTTP configuration for both domain and IP (no SSL initially)
server {
    listen 80;
    server_name servaan.com www.servaan.com 94.182.177.74;
    
    # Frontend proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# SSL configuration (commented out until certificates are available)
# Uncomment and configure after obtaining SSL certificates
# server {
#     listen 443 ssl http2;
#     server_name servaan.com www.servaan.com;
#     
#     # SSL Configuration
#     ssl_certificate /etc/letsencrypt/live/servaan.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/servaan.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
#     ssl_prefer_server_ciphers off;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#     
#     # Security headers
#     add_header X-Frame-Options DENY;
#     add_header X-Content-Type-Options nosniff;
#     add_header X-XSS-Protection "1; mode=block";
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     
#     # Frontend proxy
#     location / {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 86400;
#     }
#     
#     # Backend API proxy
#     location /api/ {
#         proxy_pass http://127.0.0.1:3001/;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#     
#     # Health check
#     location /health {
#         access_log off;
#         return 200 "healthy\n";
#         add_header Content-Type text/plain;
#     }
# }
EOF

# Enable Servaan site and disable default
echo -e "${YELLOW}Enabling Servaan configuration...${NC}"
ln -sf /etc/nginx/sites-available/servaan /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
nginx -t

# Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured for Servaan${NC}"

# =============================================================================
# 4. FIREWALL CONFIGURATION
# =============================================================================
echo -e "\n${BLUE}🔥 Step 4: Firewall Configuration${NC}"

if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Configuring UFW firewall...${NC}"
    ufw --force enable
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Servaan application ports
    ufw allow 3000/tcp
    ufw allow 3001/tcp
    ufw allow 5050/tcp
    ufw allow 5432/tcp
    ufw allow 6379/tcp
    
    # Allow Docker ports
    ufw allow 2375/tcp
    ufw allow 2376/tcp
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}UFW not found, installing...${NC}"
    apt install -y ufw
    ufw --force enable
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 3001/tcp
    ufw allow 5050/tcp
    ufw allow 5432/tcp
    ufw allow 6379/tcp
    echo -e "${GREEN}✅ Firewall installed and configured${NC}"
fi

# =============================================================================
# 5. SSL CERTIFICATE SETUP (Let's Encrypt)
# =============================================================================
echo -e "\n${BLUE}🔒 Step 5: SSL Certificate Setup${NC}"

if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot installed${NC}"
else
    echo -e "${GREEN}✅ Certbot already installed${NC}"
fi

echo -e "${YELLOW}Checking SSL certificate status...${NC}"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✅ SSL certificate already exists for $DOMAIN${NC}"
    echo -e "${YELLOW}To enable HTTPS, uncomment the SSL server block in /etc/nginx/sites-available/servaan${NC}"
else
    echo -e "${YELLOW}SSL certificate not found for $DOMAIN${NC}"
    echo -e "${BLUE}Current configuration works without SSL (HTTP only)${NC}"
    echo -e "${YELLOW}To add SSL later, run:${NC}"
    echo -e "${BLUE}certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
    echo -e "${YELLOW}Note: This requires DNS to be properly configured for $DOMAIN${NC}"
    echo -e "${BLUE}After obtaining certificates, uncomment the SSL server block in the Nginx config${NC}"
fi

# =============================================================================
# 6. SYSTEM OPTIMIZATION
# =============================================================================
echo -e "\n${BLUE}⚡ Step 6: System Optimization${NC}"

# Increase file descriptor limits
echo -e "${YELLOW}Optimizing system limits...${NC}"
cat >> /etc/security/limits.conf << 'EOF'

# Servaan Platform optimizations
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Optimize kernel parameters
cat >> /etc/sysctl.conf << 'EOF'

# Servaan Platform kernel optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_max_tw_buckets = 2000000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
EOF

# Apply kernel parameters
sysctl -p

echo -e "${GREEN}✅ System optimized${NC}"

# =============================================================================
# 7. MONITORING AND LOGGING
# =============================================================================
echo -e "\n${BLUE}📊 Step 7: Monitoring and Logging${NC}"

# Create log rotation for Servaan
cat > /etc/logrotate.d/servaan << 'EOF'
/var/log/servaan/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Create Servaan log directory
mkdir -p /var/log/servaan
chown www-data:www-data /var/log/servaan

echo -e "${GREEN}✅ Monitoring and logging configured${NC}"

# =============================================================================
# 8. FINAL SYSTEM CHECK
# =============================================================================
echo -e "\n${BLUE}🔍 Step 8: Final System Check${NC}"

echo -e "${YELLOW}Checking service status...${NC}"
echo -e "${BLUE}Docker:${NC} $(systemctl is-active docker)"
echo -e "${BLUE}Nginx:${NC} $(systemctl is-active nginx)"
echo -e "${BLUE}Firewall:${NC} $(ufw status | grep -o "Status: active")"

echo -e "\n${YELLOW}Checking port availability...${NC}"
netstat -tlnp | grep -E ":(80|443|3000|3001|5050|5432|6379)"

# =============================================================================
# 9. DEPLOYMENT INSTRUCTIONS
# =============================================================================
echo -e "\n${BLUE}📋 Step 9: Deployment Instructions${NC}"

cat > /opt/servaan/DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# سِروان (Servaan) Platform - Deployment Instructions

## 🚀 Quick Start

1. **Navigate to project directory:**
   ```bash
   cd /opt/servaan/app
   ```

2. **Deploy the platform:**
   ```bash
   ./auto-deploy.sh deploy
   ```

3. **Check status:**
   ```bash
   ./auto-deploy.sh status
   ```

## 🌐 Access URLs

- **Frontend (HTTP):** http://94.182.177.74
- **Frontend (HTTPS):** https://servaan.com
- **Backend API:** http://94.182.177.74:3001
- **pgAdmin:** http://94.182.177.74:5050
- **Database:** 94.182.177.74:5432

## 📋 Management Commands

```bash
# View logs
./auto-deploy.sh logs

# Check status
./auto-deploy.sh status

# Update services
./auto-deploy.sh update

# Stop services
./auto-deploy.sh stop
```

## 🔧 Troubleshooting

- **Check Nginx status:** `systemctl status nginx`
- **Check Docker status:** `systemctl status docker`
- **View Nginx logs:** `tail -f /var/log/nginx/error.log`
- **View Servaan logs:** `tail -f /var/log/servaan/*.log`

## 🔒 SSL Certificate

If you need to renew SSL certificates:
```bash
certbot renew
systemctl reload nginx
```
EOF

echo -e "${GREEN}✅ Deployment instructions created at /opt/servaan/DEPLOYMENT_INSTRUCTIONS.md${NC}"

# =============================================================================
# COMPLETION
# =============================================================================
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 CONFIGURATION COMPLETE! 🎉              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}🚀 Your server is now completely configured for Servaan!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. ${BLUE}Navigate to:${NC} cd /opt/servaan/app"
echo -e "2. ${BLUE}Deploy:${NC} ./auto-deploy.sh deploy"
echo -e "3. ${BLUE}Access:${NC} http://94.182.177.74"

echo -e "\n${GREEN}✅ Server configuration completed successfully!${NC}"
echo -e "${BLUE}📚 Check /opt/servaan/DEPLOYMENT_INSTRUCTIONS.md for details${NC}"
