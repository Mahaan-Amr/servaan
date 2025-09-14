// Load environment variables from .env file for local development
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ 
  path: path.resolve(__dirname, '../.env')
});

// Debug: Log environment variables loading
console.log('🔧 Admin Backend Environment variables loaded:');
console.log('📍 DATABASE_URL:', process.env['DATABASE_URL'] ? 'Found' : 'NOT FOUND');
console.log('🔌 ADMIN_BACKEND_PORT:', process.env['ADMIN_BACKEND_PORT'] || 'Using default 3002');
console.log('🌍 NODE_ENV:', process.env['NODE_ENV'] || 'development');

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import rateLimit from 'express-rate-limit'; // Disabled for admin panel
import { adminConfig } from './config/admin';
import adminAuthRoutes from './routes/adminAuthRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import backupRoutes from './routes/backupRoutes';
import tenantRoutes from './routes/tenantRoutes';
import adminUserRoutes from './routes/adminUserRoutes';

// Debug: Log configuration loading
console.log('🔧 Admin configuration loaded:');
console.log('📍 Server port:', adminConfig.server.port);
console.log('🔌 API URL:', adminConfig.server.apiUrl);
console.log('🌍 Environment:', adminConfig.server.environment);

const app = express();
const server = createServer(app);
const port = adminConfig.server.port;

// Security middleware
app.use(helmet()); // Security headers

// CORS configuration for admin panel
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from admin origins only
    if (!origin || adminConfig.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting disabled for admin panel (development and testing)
// const limiter = rateLimit({
//   windowMs: adminConfig.rateLimiting.windowMs,
//   max: adminConfig.rateLimiting.maxRequests,
//   message: {
//     error: 'Too many requests from this IP',
//     message: 'Rate limit exceeded for admin endpoints',
//     code: 'RATE_LIMIT_EXCEEDED'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10MB' }));
app.use(express.urlencoded({ extended: true, limit: '10MB' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/api/admin/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'servaan-admin-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: adminConfig.server.environment,
    version: '1.0.0',
    port: adminConfig.server.port
  });
});

// Admin API version endpoint
app.get('/api/admin/version', (_req, res) => {
  res.status(200).json({
    version: adminConfig.api.version,
    service: 'servaan-admin-backend',
    timestamp: new Date().toISOString()
  });
});

// Admin Authentication Routes
app.use('/api/admin/auth', adminAuthRoutes);

// Admin Dashboard Routes
app.use('/api/admin/dashboard', dashboardRoutes);

// Admin Backup Routes
app.use('/api/admin/backups', backupRoutes);

// Admin Tenant Management Routes
app.use('/api/admin/tenants', tenantRoutes);

// Admin Users Management Routes
app.use('/api/admin/users', adminUserRoutes);

// Basic admin routes placeholder
app.get('/api/admin', (_req, res) => {
  res.status(200).json({
    message: 'Servaan Admin Backend API',
    version: adminConfig.api.version,
    endpoints: adminConfig.api.endpoints,
    timestamp: new Date().toISOString()
  });
});

// Basic 404 handler for all routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Endpoint '${req.originalUrl}' not found`,
    code: 'ENDPOINT_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Admin Backend Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    code: 'ADMIN_INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Servaan Admin Backend running on port ${port}`);
  console.log('🔌 Admin API available at:', adminConfig.server.apiUrl);
  console.log('🌍 Environment:', adminConfig.server.environment);
  console.log('🔐 Security features enabled:', Object.keys(adminConfig.features).filter(key => adminConfig.features[key as keyof typeof adminConfig.features]).join(', '));
  console.log('📊 Monitoring enabled:', adminConfig.monitoring.metricsCollection);
  console.log('⚡ Rate limiting:', `${adminConfig.rateLimiting.maxRequests} requests per ${adminConfig.rateLimiting.windowMs / 60000} minutes`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Admin Backend server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Admin Backend server closed');
    process.exit(0);
  });
});

export default app;
