"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const port = 3003;
// Basic middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('combined'));
// Test endpoints
app.get('/api/admin/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'servaan-admin-backend-test',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'development',
        version: '1.0.0',
        port: port
    });
});
app.get('/api/admin/version', (_req, res) => {
    res.status(200).json({
        version: 'v1',
        service: 'servaan-admin-backend-test',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/admin', (_req, res) => {
    res.status(200).json({
        message: 'Servaan Admin Backend Test API',
        version: 'v1',
        endpoints: ['/api/admin/health', '/api/admin/version'],
        timestamp: new Date().toISOString()
    });
});
// Start server
server.listen(port, () => {
    console.log(`🚀 Servaan Admin Backend Test Server running on port ${port}`);
    console.log('🔌 Test API available at: http://localhost:3003/api/admin');
    console.log('🌍 Environment: development');
});
exports.default = app;
//# sourceMappingURL=test-server.js.map