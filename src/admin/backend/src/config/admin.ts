// Load environment variables from Docker environment (not hardcoded .env file)
// import dotenv from 'dotenv';
// import path from 'path';

// dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const adminConfig = {
  // Database Configuration (shared with main backend)
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    name: process.env['DB_NAME'] || 'servaan',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    url: process.env['DATABASE_URL'] || '',
    schema: process.env['ADMIN_DB_SCHEMA'] || 'admin'
  },

  // Admin Server Configuration
  server: {
    port: parseInt(process.env['ADMIN_BACKEND_PORT'] || '3002'),
    apiUrl: process.env['ADMIN_API_URL'] || 'http://localhost:3002/api',
    environment: process.env['NODE_ENV'] || 'development'
  },

  // Admin JWT Configuration (separate from tenant JWT)
  jwt: {
    secret: process.env['ADMIN_JWT_SECRET'] || 'servaan-admin-super-secret-key-different-from-tenant',
    expiresIn: process.env['ADMIN_JWT_EXPIRES_IN'] || '2h'
  },

  // Admin Security Configuration
  security: {
    bcryptRounds: parseInt(process.env['ADMIN_BCRYPT_ROUNDS'] || '12'),
    sessionTimeout: process.env['ADMIN_SESSION_TIMEOUT'] || '15m',
    maxLoginAttempts: parseInt(process.env['ADMIN_MAX_LOGIN_ATTEMPTS'] || '3'),
    ipWhitelist: process.env['ADMIN_IP_WHITELIST'] ? process.env['ADMIN_IP_WHITELIST'].split(',').filter(ip => ip.trim()) : []
  },

  // Admin CORS Configuration
  cors: {
    allowedOrigins: (process.env['ADMIN_CORS_ORIGINS'] || 'http://localhost:3004,http://localhost:3003,http://admin.localhost:3003,https://admin.servaan.com').split(',')
  },

  // Admin Rate Limiting Configuration
  rateLimiting: {
    windowMs: parseInt(process.env['ADMIN_RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    maxRequests: parseInt(process.env['ADMIN_RATE_LIMIT_MAX_REQUESTS'] || '50') // limit each IP to 50 requests per windowMs
  },

  // Admin Logging Configuration
  logging: {
    level: process.env['ADMIN_LOG_LEVEL'] || 'debug',
    file: process.env['ADMIN_LOG_FILE'] || 'admin-backend.log'
  },

  // Admin Monitoring Configuration
  monitoring: {
    healthCheckInterval: parseInt(process.env['ADMIN_HEALTH_CHECK_INTERVAL'] || '30000'), // 30 seconds
    metricsCollection: process.env['ADMIN_METRICS_COLLECTION'] === 'true'
  },

  // Admin Feature Flags
  features: {
    twoFactorAuth: true,
    ipWhitelisting: true,
    auditLogging: true,
    realTimeMonitoring: true,
    advancedAnalytics: true
  },

  // Admin Role Configuration
  roles: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    PLATFORM_ADMIN: 'PLATFORM_ADMIN',
    SUPPORT: 'SUPPORT',
    DEVELOPER: 'DEVELOPER'
  },

  // Admin API Endpoints
  api: {
    prefix: '/api/admin',
    version: 'v1',
    endpoints: {
      auth: '/auth',
      tenants: '/tenants',
      system: '/system',
      analytics: '/analytics',
      security: '/security',
      billing: '/billing',
      support: '/support'
    }
  }
};

// Type definitions for admin configuration
export interface AdminConfig {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
    schema: string;
  };
  server: {
    port: number;
    apiUrl: string;
    environment: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  security: {
    bcryptRounds: number;
    sessionTimeout: string;
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };
  cors: {
    allowedOrigins: string[];
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
  monitoring: {
    healthCheckInterval: number;
    metricsCollection: boolean;
  };
  features: {
    twoFactorAuth: boolean;
    ipWhitelisting: boolean;
    auditLogging: boolean;
    realTimeMonitoring: boolean;
    advancedAnalytics: boolean;
  };
  roles: {
    SUPER_ADMIN: string;
    PLATFORM_ADMIN: string;
    SUPPORT: string;
    DEVELOPER: string;
  };
  api: {
    prefix: string;
    version: string;
    endpoints: {
      auth: string;
      tenants: string;
      system: string;
      analytics: string;
      security: string;
      billing: string;
      support: string;
    };
  };
}
