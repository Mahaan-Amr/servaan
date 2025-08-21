import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'servaan',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    url: process.env.DATABASE_URL || ''
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.BACKEND_PORT || '3001'),
    apiUrl: process.env.API_URL || 'http://localhost:3001/api',
    environment: process.env.NODE_ENV || 'development'
  },

  // Environment info (for compatibility)
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BACKEND_PORT || '3001'),

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'servaan-super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Frontend Configuration
  frontend: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  },

  // Enhanced Kavenegar SMS Configuration
  kavenegar: {
    apiKey: process.env.KAVENEGAR_API_KEY || '332F692B634F62656F75357536432B4E765361586D6C456A566365304476555846374E38674C354D7548413D',
    sender: process.env.KAVENEGAR_SENDER || '2000660110',
    testPhone: process.env.KAVENEGAR_TEST_PHONE || '09051305165',
    enabled: process.env.KAVENEGAR_ENABLED === 'true' || process.env.NODE_ENV === 'production',
    
    // Enhanced SMS Service Configuration - Fixed Windows line ending parsing
    enableRealSMS: (process.env.ENABLE_REAL_SMS || '').trim() === 'true',
    developmentMode: process.env.NODE_ENV !== 'production',
    maxRetries: parseInt(process.env.SMS_MAX_RETRIES || '3'),
    timeoutMs: parseInt(process.env.SMS_TIMEOUT_MS || '30000'),
    
    // Fallback methods priority
    methods: {
      https: { enabled: true, priority: 1 },
      axios: { enabled: true, priority: 2 },
      alternative: { enabled: true, priority: 3 },
      sdk: { enabled: true, priority: 4 }
    }
  },

  // CORS Configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://servaan.ir',
      /\.servaan\.ir$/
    ]
  },

  // Rate Limiting Configuration
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    smsLimitPerHour: 10 // limit SMS sending to 10 per hour per user
  },

  // Security Configuration
  security: {
    bcryptRounds: 10,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5
  },

  // SMS Template Configuration
  smsTemplates: {
    maxLength: 160, // Standard SMS length
    retryAttempts: 3,
    retryDelay: 5000 // 5 seconds
  },

  // Notification Configuration
  notifications: {
    lowStockCheckInterval: 60 * 60 * 1000, // 1 hour
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxNotificationsPerUser: 100
  },

  // Multi-tenant Configuration
  multiTenant: {
    defaultSubdomain: 'cafe-golestan',
    subdomainPattern: /^[a-zA-Z0-9-]+$/,
    maxTenantsPerUser: 5
  }
}; 
