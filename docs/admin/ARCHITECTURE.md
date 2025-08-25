# 🏗️ Admin Panel Technical Architecture

## 🎯 System Overview

The Servaan Admin Panel is designed as a **completely separate system** from the tenant applications, ensuring maximum security and data isolation while providing comprehensive platform management capabilities.

## 🌐 Domain Architecture

### Production Environment
```
🏢 Main Platform: *.servaan.com
├── dima.servaan.com → Tenant application
├── macheen.servaan.com → Tenant application
├── servaan.servaan.com → Main tenant application
└── api.servaan.com → Backend API (shared)

 Admin Panel: admin.servaan.com
└── Completely isolated admin system
```

### Development Environment
```
🏢 Local Development
├── localhost:3000 → Main application
├── dima.localhost:3000 → Tenant application
├── macheen.localhost:3000 → Tenant application
└── admin.localhost:3001 → Admin panel (separate port)
```

## 🏗️ System Architecture

### Frontend Architecture
```
📱 Admin Panel Frontend (Next.js)
├── /admin → Dashboard
├── /admin/tenants → Tenant management
├── /admin/system → System health
├── /admin/analytics → Platform analytics
├── /admin/security → Security center
├── /admin/billing → Revenue management
└── /admin/support → Customer success
```

### Backend Architecture
```
🔧 Admin Backend (Node.js + Express)
├── /api/admin/tenants/* → Tenant management APIs
├── /api/admin/system/* → System health APIs
├── /api/admin/analytics/* → Analytics APIs
├── /api/admin/security/* → Security APIs
├── /api/admin/billing/* → Billing APIs
└── /api/admin/support/* → Support APIs
```

### Database Architecture
```
🗄️ Database Structure
├── Existing tenant tables (NO CHANGES)
├── New admin tables (separate schema)
├── Read-only access to tenant data
└── Aggregated data for admin views
```

## 🔐 Security Architecture

### Authentication System
```
🔑 Admin Authentication
├── Separate admin user table
├── Different JWT secret
├── Different session management
├── Two-factor authentication
└── IP whitelisting
```

### Data Access Control
```
📊 Data Access Levels
├── Admin users → Read aggregated tenant data
├── Admin users → Manage tenant settings
├── Admin users → View system metrics
├── Admin users → Cannot access tenant user accounts
└── Tenant users → Cannot access admin panel
```

### Network Security
```
🌐 Network Isolation
├── Admin panel on separate network segment
├── Firewall rules for admin access
├── VPN access for admin users
└── IP whitelisting for admin panel
```

## 🗄️ Database Design

### New Admin Tables
```sql
-- Admin users (completely separate from tenant users)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin audit logs
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System health metrics
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    status health_status NOT NULL,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- Feature flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    target_tenants JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API usage logs
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER,
    status_code INTEGER,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Enums
```sql
-- Admin roles
CREATE TYPE admin_role AS ENUM (
    'SUPER_ADMIN',      -- Full access (you)
    'PLATFORM_ADMIN',   -- Limited access
    'SUPPORT',          -- Customer success
    'DEVELOPER'         -- Technical staff
);

-- Health status
CREATE TYPE health_status AS ENUM (
    'HEALTHY',
    'WARNING',
    'CRITICAL',
    'UNKNOWN'
);
```

## 🔌 API Design

### Authentication Endpoints
```
POST /api/admin/auth/login
POST /api/admin/auth/logout
POST /api/admin/auth/refresh
POST /api/admin/auth/2fa/verify
```

### Tenant Management Endpoints
```
GET    /api/admin/tenants              → List all tenants
GET    /api/admin/tenants/:id          → Get tenant details
PUT    /api/admin/tenants/:id          → Update tenant
DELETE /api/admin/tenants/:id          → Deactivate tenant
POST   /api/admin/tenants              → Create new tenant
GET    /api/admin/tenants/:id/metrics  → Tenant performance metrics
```

### System Health Endpoints
```
GET /api/admin/system/health           → Overall system health
GET /api/admin/system/metrics          → System performance metrics
GET /api/admin/system/logs             → System logs
GET /api/admin/system/backups          → Backup status
POST /api/admin/system/backup          → Trigger backup
```

### Analytics Endpoints
```
GET /api/admin/analytics/overview      → Platform overview
GET /api/admin/analytics/tenants       → Tenant analytics
GET /api/admin/analytics/revenue       → Revenue analytics
GET /api/admin/analytics/usage         → Feature usage analytics
GET /api/admin/analytics/performance   → Performance analytics
```

## 🚀 Deployment Architecture

### Container Structure
```
🐳 Docker Containers
├── servaan-admin-frontend    → Admin panel frontend
├── servaan-admin-backend     → Admin panel backend
├── servaan-postgres-prod     → Database (shared)
├── servaan-nginx             → Reverse proxy
└── servaan-redis             → Caching (optional)
```

### Nginx Configuration
```nginx
# Admin panel configuration
server {
    listen 80;
    server_name admin.servaan.com;
    
    location / {
        proxy_pass http://servaan-admin-frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/admin {
        proxy_pass http://servaan-admin-backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Existing tenant configuration (unchanged)
server {
    listen 80;
    server_name *.servaan.com;
    
    location / {
        proxy_pass http://servaan-frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://servaan-backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 Data Flow

### Admin Panel Data Access
```
1. Admin user logs into admin.servaan.com
2. Admin backend authenticates against admin_users table
3. Admin backend queries tenant data (read-only, aggregated)
4. Admin backend returns aggregated data to admin frontend
5. Admin frontend displays platform overview and metrics
```

### Tenant Data Isolation
```
1. Tenant users access *.servaan.com
2. Tenant backend uses existing tenant middleware
3. All queries filtered by tenantId
4. No access to admin panel or other tenant data
5. Complete data isolation maintained
```

## 🛡️ Security Measures

### Authentication Security
- **Separate admin user database**
- **Different JWT secrets**
- **Two-factor authentication**
- **Session timeout management**
- **IP whitelisting**

### Data Security
- **Read-only access to tenant data**
- **No direct tenant data modification**
- **All admin actions logged**
- **Regular security audits**
- **Data encryption at rest**

### Network Security
- **Separate admin domain**
- **Firewall rules**
- **VPN access for admin**
- **IP restrictions**
- **HTTPS enforcement**

## 📊 Monitoring & Alerting

### System Monitoring
- **Database performance metrics**
- **API response times**
- **Error rates and logs**
- **Resource usage (CPU, memory, disk)**
- **Network latency**

### Business Monitoring
- **Tenant growth metrics**
- **Revenue analytics**
- **Feature adoption rates**
- **User engagement metrics**
- **Churn prevention alerts**

---

**Last Updated**: January 15, 2025  
**Version**: 1.0.0  
**Status**: Architecture Design Complete
