import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const server = createServer(app);
const port = 3003;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

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

export default app;
