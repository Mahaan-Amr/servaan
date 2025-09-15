"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables from .env file for local development
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, '../.env')
});
// Debug: Log environment variables loading
console.log('🔧 Admin Backend Environment variables loaded:');
console.log('📍 DATABASE_URL:', process.env['DATABASE_URL'] ? 'Found' : 'NOT FOUND');
console.log('🔌 ADMIN_BACKEND_PORT:', process.env['ADMIN_BACKEND_PORT'] || 'Using default 3002');
console.log('🌍 NODE_ENV:', process.env['NODE_ENV'] || 'development');
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// import rateLimit from 'express-rate-limit'; // Disabled for admin panel
const admin_1 = require("./config/admin");
const adminAuthRoutes_1 = __importDefault(require("./routes/adminAuthRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const backupRoutes_1 = __importDefault(require("./routes/backupRoutes"));
const tenantRoutes_1 = __importDefault(require("./routes/tenantRoutes"));
const adminUserRoutes_1 = __importDefault(require("./routes/adminUserRoutes"));
// Debug: Log configuration loading
console.log('🔧 Admin configuration loaded:');
console.log('📍 Server port:', admin_1.adminConfig.server.port);
console.log('🔌 API URL:', admin_1.adminConfig.server.apiUrl);
console.log('🌍 Environment:', admin_1.adminConfig.server.environment);
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const port = admin_1.adminConfig.server.port;
// Security middleware
app.use((0, helmet_1.default)()); // Security headers
// CORS configuration for admin panel
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests from admin origins only
        if (!origin || admin_1.adminConfig.cors.allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
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
app.use(express_1.default.json({ limit: '10MB' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10MB' }));
// Logging middleware
app.use((0, morgan_1.default)('combined'));
// Health check endpoint
app.get('/api/admin/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'servaan-admin-backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: admin_1.adminConfig.server.environment,
        version: '1.0.0',
        port: admin_1.adminConfig.server.port
    });
});
// Admin API version endpoint
app.get('/api/admin/version', (_req, res) => {
    res.status(200).json({
        version: admin_1.adminConfig.api.version,
        service: 'servaan-admin-backend',
        timestamp: new Date().toISOString()
    });
});
// Admin Authentication Routes
app.use('/api/admin/auth', adminAuthRoutes_1.default);
// Admin Dashboard Routes
app.use('/api/admin/dashboard', dashboardRoutes_1.default);
// Admin Backup Routes
app.use('/api/admin/backups', backupRoutes_1.default);
// Admin Tenant Management Routes
app.use('/api/admin/tenants', tenantRoutes_1.default);
// Admin Users Management Routes
app.use('/api/admin/users', adminUserRoutes_1.default);
// Basic admin routes placeholder
app.get('/api/admin', (_req, res) => {
    res.status(200).json({
        message: 'Servaan Admin Backend API',
        version: admin_1.adminConfig.api.version,
        endpoints: admin_1.adminConfig.api.endpoints,
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
app.use((err, _req, res, _next) => {
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
    console.log('🔌 Admin API available at:', admin_1.adminConfig.server.apiUrl);
    console.log('🌍 Environment:', admin_1.adminConfig.server.environment);
    console.log('🔐 Security features enabled:', Object.keys(admin_1.adminConfig.features).filter(key => admin_1.adminConfig.features[key]).join(', '));
    console.log('📊 Monitoring enabled:', admin_1.adminConfig.monitoring.metricsCollection);
    console.log('⚡ Rate limiting:', `${admin_1.adminConfig.rateLimiting.maxRequests} requests per ${admin_1.adminConfig.rateLimiting.windowMs / 60000} minutes`);
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
exports.default = app;
//# sourceMappingURL=index.js.map