// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ 
  path: path.resolve(__dirname, '../.env')
});

// Debug: Log environment variables loading
console.log('🔧 Environment variables loaded:');
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');
console.log('🔌 BACKEND_PORT:', process.env.BACKEND_PORT || 'Using default');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { userRoutes } from './routes/userRoutes';
import { itemRoutes } from './routes/itemRoutes';
import { inventoryRoutes } from './routes/inventoryRoutes';
import { authRoutes } from './routes/authRoutes';
import { supplierRoutes } from './routes/supplierRoutes';
import { notificationRoutes } from './routes/notificationRoutes';
import { scannerRoutes } from './routes/scannerRoutes';
import biRoutes from './routes/biRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import financialRoutes from './routes/financialRoutes';
import userAnalyticsRoutes from './routes/userAnalyticsRoutes';
import accountingRoutes from './routes/accountingRoutes';
import reportRoutes from './routes/reportRoutes';
import { customerRoutes } from './routes/customerRoutes';
import { loyaltyRoutes } from './routes/loyaltyRoutes';
import { visitRoutes } from './routes/visitRoutes';
import { crmRoutes } from './routes/crmRoutes';
import { campaignRoutes } from './routes/campaignRoutes';
import { tenantRoutes } from './routes/tenantRoutes';
import { workspaceRoutes } from './routes/workspaceRoutes';
import { smsRoutes } from './routes/smsRoutes';
import customerJourneyRoutes from './routes/customerJourneyRoutes';
import customerServiceRoutes from './routes/customerServiceRoutes';
import orderingRoutes from './routes/orderingRoutes';
import performanceRoutes from './routes/performanceRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { resolveTenant, requireTenant } from './middlewares/tenantMiddleware';
import { socketService } from './services/socketService';
import { performanceMonitoringService } from './services/performanceMonitoringService';

const app = express();
const server = createServer(app);
const port = process.env.BACKEND_PORT || 3001;

// Middlewares
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://servaan.com',
      'https://api.servaan.com',
      'https://admin.servaan.com'
    ];
    
    // Allow requests from any subdomain of servaan.com
    if (!origin || 
        origin.includes('localhost') || 
        origin.endsWith('.servaan.com') ||
        allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
})); // Enable CORS with subdomain support
app.use(express.json({ limit: '10MB' })); // Parse JSON bodies with 10MB limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10MB' })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Performance monitoring middleware (should be early in the middleware chain)
app.use(performanceMonitoringService.startApiMonitoring.bind(performanceMonitoringService));

// Tenant resolution middleware (should be early in the middleware chain)
app.use(resolveTenant);

// Health check endpoint (no tenant context required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Routes
// Tenant management routes (no tenant context required)
app.use('/api/tenants', tenantRoutes);

// Authentication routes (no tenant context required initially)
app.use('/api/auth', authRoutes);

// All other routes require tenant context
app.use('/api/users', requireTenant, userRoutes);
app.use('/api/items', requireTenant, itemRoutes);
app.use('/api/inventory', requireTenant, inventoryRoutes);
app.use('/api/suppliers', requireTenant, supplierRoutes);
app.use('/api/notifications', requireTenant, notificationRoutes);
app.use('/api/scanner', requireTenant, scannerRoutes);
app.use('/api/bi', requireTenant, biRoutes);
app.use('/api/analytics', requireTenant, analyticsRoutes);
app.use('/api/financial', requireTenant, financialRoutes);
app.use('/api/user-analytics', requireTenant, userAnalyticsRoutes);
app.use('/api/accounting', requireTenant, accountingRoutes);
app.use('/api/reports', requireTenant, reportRoutes);
app.use('/api/customers', requireTenant, customerRoutes);
app.use('/api/loyalty', requireTenant, loyaltyRoutes);
app.use('/api/visits', requireTenant, visitRoutes);
app.use('/api/crm', requireTenant, crmRoutes);
app.use('/api/campaigns', requireTenant, campaignRoutes);
app.use('/api/workspace', requireTenant, workspaceRoutes);
app.use('/api/sms', requireTenant, smsRoutes);
app.use('/api/customer-journey', requireTenant, customerJourneyRoutes);
app.use('/api/customer-service', requireTenant, customerServiceRoutes);
app.use('/api/ordering', requireTenant, orderingRoutes);

// Performance monitoring routes (require tenant context)
app.use('/api/performance', requireTenant, performanceRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// WebSocket setup
socketService.initialize(server);

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log('🔌 WebSocket server ready for real-time notifications');
  console.log('📊 Performance monitoring system initialized');
  console.log('🔥 Global caching system ready');
}); 
