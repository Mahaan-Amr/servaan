# 👨‍💻 Admin Panel Development Guide

## 📋 Overview

This guide provides step-by-step instructions for developing the Servaan Platform Admin Panel. Follow this guide carefully to ensure proper implementation and security.

## 🏗️ Project Structure

### **Directory Organization**
```
servaan-admin/
├── backend/                 # Admin backend API
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── middlewares/    # Authentication & security
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── utils/          # Helper functions
│   │   └── index.ts        # Entry point
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── frontend/                # Admin frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Helper functions
│   │   └── styles/         # CSS styles
│   ├── package.json
│   ├── Dockerfile
│   └── next.config.js
├── database/                # Database migrations
│   ├── migrations/          # SQL migration files
│   ├── seeds/              # Initial data
│   └── schemas/            # Database schemas
├── docker/                  # Docker configuration
│   ├── docker-compose.yml
│   ├── nginx/              # Nginx configuration
│   └── scripts/            # Deployment scripts
└── docs/                    # Documentation
```

## 🚀 Getting Started

### **Prerequisites**
```bash
# Required software
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 14+
- Git

# Required knowledge
- TypeScript/JavaScript
- React/Next.js
- Express.js
- PostgreSQL
- Docker
```

### **Environment Setup**
```bash
# Clone the project
git clone <repository-url>
cd servaan-admin

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

## 🔧 Backend Development

### **1. Project Setup**
```bash
# Create backend directory
mkdir servaan-admin-backend
cd servaan-admin-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors helmet morgan dotenv
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/morgan nodemon

# Install security packages
npm install bcryptjs jsonwebtoken express-rate-limit
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### **2. TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### **3. Basic Express Server**
```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Admin backend running on port ${PORT}`);
});
```

### **4. Authentication Middleware**
```typescript
// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required'
        }
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;
    
    req.adminUser = {
      id: decoded.adminUserId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.adminUser.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};
```

### **5. Admin User Model**
```typescript
// src/models/AdminUser.ts
export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | 'SUPPORT' | 'DEVELOPER';
  isActive: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  role: AdminUser['role'];
}

export interface UpdateAdminUserData {
  email?: string;
  role?: AdminUser['role'];
  isActive?: boolean;
  twoFactorSecret?: string;
}
```

### **6. Admin User Service**
```typescript
// src/services/adminUserService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUser, CreateAdminUserData, UpdateAdminUserData } from '../models/AdminUser';

export class AdminUserService {
  // Create new admin user
  static async createUser(data: CreateAdminUserData): Promise<AdminUser> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // TODO: Implement database creation
    const adminUser: AdminUser = {
      id: 'generated-uuid',
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return adminUser;
  }

  // Authenticate admin user
  static async authenticate(email: string, password: string): Promise<{ user: AdminUser; token: string } | null> {
    // TODO: Implement database lookup
    const user = await this.findByEmail(email);
    
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    const token = jwt.sign(
      {
        adminUserId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.ADMIN_JWT_SECRET!,
      { expiresIn: '8h' }
    );

    return { user, token };
  }

  // Find admin user by email
  static async findByEmail(email: string): Promise<AdminUser | null> {
    // TODO: Implement database lookup
    return null;
  }

  // Update admin user
  static async updateUser(id: string, data: UpdateAdminUserData): Promise<AdminUser | null> {
    // TODO: Implement database update
    return null;
  }
}
```

### **7. Admin Routes**
```typescript
// src/routes/adminRoutes.ts
import { Router } from 'express';
import { authenticateAdmin, requireRole } from '../middlewares/authMiddleware';
import { AdminUserController } from '../controllers/AdminUserController';
import { TenantController } from '../controllers/TenantController';
import { SystemController } from '../controllers/SystemController';

const router = Router();

// Admin user management (SUPER_ADMIN only)
router.post('/auth/login', AdminUserController.login);
router.post('/auth/logout', authenticateAdmin, AdminUserController.logout);
router.post('/auth/refresh', authenticateAdmin, AdminUserController.refreshToken);

// Tenant management
router.get('/tenants', authenticateAdmin, TenantController.listTenants);
router.get('/tenants/:id', authenticateAdmin, TenantController.getTenant);
router.post('/tenants', authenticateAdmin, requireRole(['SUPER_ADMIN']), TenantController.createTenant);
router.put('/tenants/:id', authenticateAdmin, requireRole(['SUPER_ADMIN']), TenantController.updateTenant);
router.delete('/tenants/:id', authenticateAdmin, requireRole(['SUPER_ADMIN']), TenantController.deactivateTenant);

// System health
router.get('/system/health', authenticateAdmin, SystemController.getHealth);
router.get('/system/metrics', authenticateAdmin, SystemController.getMetrics);
router.get('/system/logs', authenticateAdmin, SystemController.getLogs);

export { router as adminRoutes };
```

## 🎨 Frontend Development

### **1. Project Setup**
```bash
# Create frontend directory
mkdir servaan-admin-frontend
cd servaan-admin-frontend

# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install additional dependencies
npm install @headlessui/react @heroicons/react
npm install recharts react-hook-form zod @hookform/resolvers
npm install axios react-hot-toast
npm install @types/node @types/react @types/react-dom
```

### **2. Environment Configuration**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/admin
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### **3. API Client Setup**
```typescript
// src/services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### **4. Authentication Context**
```typescript
// src/contexts/AdminAuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('adminToken');
    if (token) {
      // TODO: Validate token with backend
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // TODO: Implement login API call
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('adminToken', data.data.token);
      setUser(data.data.adminUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
```

### **5. Login Page**
```typescript
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAdminAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/admin');
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Servaan Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### **6. Admin Dashboard**
```typescript
// src/app/admin/page.tsx
'use client';

import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.email}
          </h1>
          
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Dashboard cards will go here */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tenants
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        3
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 🗄️ Database Implementation

### **1. Migration Scripts**
```sql
-- database/migrations/001_create_admin_tables.sql
-- Create admin tables (SAFE - no impact on existing data)

-- Create new enums
CREATE TYPE admin_role AS ENUM (
    'SUPER_ADMIN',
    'PLATFORM_ADMIN', 
    'SUPPORT',
    'DEVELOPER'
);

CREATE TYPE health_status AS ENUM (
    'HEALTHY',
    'WARNING',
    'CRITICAL',
    'UNKNOWN'
);

-- Create admin users table
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

-- Create admin audit logs table
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

-- Create system health metrics table
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    status health_status NOT NULL,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- Create feature flags table
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    target_tenants JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create API usage logs table
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

-- Add indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

CREATE INDEX idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);

CREATE INDEX idx_system_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX idx_system_health_metrics_status ON system_health_metrics(status);
CREATE INDEX idx_system_health_metrics_collected_at ON system_health_metrics(collected_at);

CREATE INDEX idx_feature_flags_name ON feature_flags(feature_name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);

CREATE INDEX idx_api_usage_logs_tenant_id ON api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_status_code ON api_usage_logs(status_code);
```

### **2. Seed Data**
```sql
-- database/seeds/001_admin_users.sql
-- Create initial admin users

-- Create super admin user (you)
INSERT INTO admin_users (email, password_hash, role, is_active) VALUES (
    'admin@servaan.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHhK', -- password: AdminSecure2024!
    'SUPER_ADMIN',
    true
);

-- Create platform admin user
INSERT INTO admin_users (email, password_hash, role, is_active) VALUES (
    'platform@servaan.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHhK', -- password: PlatformSecure2024!
    'PLATFORM_ADMIN',
    true
);
```

## 🐳 Docker Configuration

### **1. Backend Dockerfile**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### **2. Frontend Dockerfile**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./

EXPOSE 3000
CMD ["npm", "start"]
```

### **3. Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  admin-backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
    depends_on:
      - postgres
    networks:
      - admin-network

  admin-frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    networks:
      - admin-network

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - admin-network

networks:
  admin-network:
    driver: bridge

volumes:
  postgres_data:
```

## 🚀 Deployment

### **1. Production Environment Variables**
```bash
# .env.production
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://servaan:password@localhost:5432/servaan_prod
ADMIN_JWT_SECRET=your-super-secure-jwt-secret-here
NEXT_PUBLIC_API_URL=https://admin.servaan.com/api/admin
NEXT_PUBLIC_APP_URL=https://admin.servaan.com
```

### **2. Nginx Configuration**
```nginx
# nginx/admin.servaan.com
server {
    listen 80;
    server_name admin.servaan.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.servaan.com;

    ssl_certificate /etc/letsencrypt/live/admin.servaan.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.servaan.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        proxy_pass http://admin-frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/admin {
        proxy_pass http://admin-backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Testing

### **1. Backend Testing**
```bash
# Install testing dependencies
npm install -D jest @types/jest supertest @types/supertest

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### **2. Frontend Testing**
```bash
# Run Next.js tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Next Steps

### **Immediate Actions**
1. **Set up development environment**
2. **Create basic backend structure**
3. **Implement authentication system**
4. **Create basic frontend**
5. **Test database migrations**

### **Development Priorities**
1. **Core authentication** (login, logout, 2FA)
2. **Tenant management** (list, view, create)
3. **System health monitoring**
4. **Basic analytics dashboard**
5. **Security implementation**

### **Advanced Features**
1. **Advanced analytics**
2. **Security monitoring**
3. **Feature flag management**
4. **API usage tracking**
5. **Backup management**

---

**Last Updated**: January 15, 2025  
**Version**: 1.0.0  
**Status**: Development Guide Complete  
**Next Step**: Start implementation
