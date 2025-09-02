# 🚀 Servaan Admin Panel Deployment Guide

## 📋 Overview

This guide explains how to deploy the Servaan application with the admin panel included. The admin panel consists of:

- **Admin Backend**: Node.js/TypeScript API running on port 3003
- **Admin Frontend**: Next.js React application running on port 3004
- **Database**: PostgreSQL database shared with main application
- **pgAdmin**: Database management interface on port 5050

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main App      │    │   Admin Panel   │    │   Database      │
│   (Port 3000)   │    │   (Port 3004)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Admin API     │
                    │   (Port 3003)   │
                    └─────────────────┘
```

## 📁 File Structure

```
servaan/
├── docker-compose.server.yml          # Main server configuration (includes admin)
├── docker-compose.admin-server.yml    # Admin-only configuration
├── .env.server                        # Server environment variables
├── deploy-server.sh                   # Main deployment script
├── deploy-admin.sh                    # Admin-only deployment script
├── src/
│   ├── frontend/Dockerfile            # Main frontend container
│   ├── backend/Dockerfile.simple      # Main backend container
│   └── admin/
│       ├── frontend/Dockerfile        # Admin frontend container
│       └── backend/Dockerfile         # Admin backend container
```

## 🔧 Environment Variables

### Main Application
- `NEXT_PUBLIC_API_URL`: Main API endpoint
- `NEXT_PUBLIC_APP_URL`: Main application URL
- `JWT_SECRET`: JWT secret for main application

### Admin Panel
- `ADMIN_JWT_SECRET`: Separate JWT secret for admin panel
- `ADMIN_BACKEND_PORT`: Admin backend port (3003)
- `ADMIN_CORS_ORIGINS`: CORS origins for admin panel
- `NEXT_PUBLIC_ADMIN_API_URL`: Admin API endpoint

### Database
- `DB_PASSWORD`: Database password
- `DATABASE_URL`: Database connection string

## 🚀 Deployment Options

### Option 1: Full Deployment (Recommended)

Deploy both main application and admin panel together:

```bash
# On Linux/Mac
./deploy-server.sh

# On Windows (PowerShell)
bash deploy-server.sh
```

This will deploy:
- Main frontend (port 3000)
- Main backend (port 3001)
- Admin frontend (port 3004)
- Admin backend (port 3003)
- Database (port 5432)
- pgAdmin (port 5050)

### Option 2: Admin-Only Deployment

Deploy only the admin panel for testing or isolated environments:

```bash
# On Linux/Mac
./deploy-admin.sh

# On Windows (PowerShell)
bash deploy-admin.sh
```

This will deploy:
- Admin frontend (port 3004)
- Admin backend (port 3003)
- Database (port 5432)
- pgAdmin (port 5050)

## 🔍 Pre-Deployment Checks

The deployment scripts automatically check:

1. **Docker Installation**: Ensures Docker is installed and running
2. **Docker Compose**: Verifies docker-compose is available
3. **Required Files**: Checks for all necessary configuration files
4. **Port Availability**: Verifies ports 3000, 3001, 3003, 3004, 5432 are available
5. **Dockerfiles**: Confirms admin Dockerfiles exist

## 📊 Service URLs

After successful deployment:

### Main Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

### Admin Panel
- **Frontend**: http://localhost:3004
- **API**: http://localhost:3003/api/admin
- **Health Check**: http://localhost:3003/api/admin/health

### Database Management
- **pgAdmin**: http://localhost:5050
- **Database**: localhost:5432

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   netstat -tuln | grep :3000
   netstat -tuln | grep :3001
   netstat -tuln | grep :3003
   netstat -tuln | grep :3004
   ```

2. **Container Build Failures**
   ```bash
   # Check container logs
   docker-compose logs [service-name]
   
   # Rebuild specific service
   docker-compose build --no-cache [service-name]
   ```

3. **Health Check Failures**
   ```bash
   # Wait for services to start (2-3 minutes)
   # Check container status
   docker-compose ps
   
   # Check health status
   docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
   ```

### Rollback Procedures

If deployment fails, the scripts automatically rollback:

```bash
# Manual rollback
cp docker-compose.yml.backup docker-compose.yml
docker-compose down
docker-compose up -d
```

## 🔒 Security Considerations

1. **Separate JWT Secrets**: Admin and main application use different JWT secrets
2. **CORS Configuration**: Admin panel has separate CORS origins
3. **Network Isolation**: Services use isolated Docker networks
4. **Non-Root Users**: All containers run as non-root users
5. **Health Checks**: All services have health monitoring

## 📈 Monitoring

### Health Checks
All services include health checks that run every 30 seconds:

- **Main Backend**: `http://localhost:3001/api/health`
- **Admin Backend**: `http://localhost:3003/api/admin/health`
- **Frontend**: `http://localhost:3000`
- **Admin Frontend**: `http://localhost:3004`

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs [service-name]

# Follow logs in real-time
docker-compose logs -f [service-name]
```

## 🚀 Production Deployment

For production deployment:

1. **Update Environment Variables**: Modify `.env.server` with production values
2. **Configure Domain**: Update CORS origins and API URLs
3. **SSL/TLS**: Configure reverse proxy with SSL certificates
4. **Backup Strategy**: Set up database backups
5. **Monitoring**: Configure external monitoring tools

## 📝 Next Steps

After successful deployment:

1. **Test Admin Panel**: Access http://localhost:3004
2. **Verify API Endpoints**: Check health endpoints
3. **Configure Database**: Set up initial admin users
4. **Set Up Monitoring**: Configure external monitoring
5. **Documentation**: Update internal documentation

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs for error messages
3. Verify all required files are present
4. Ensure Docker and Docker Compose are properly installed
5. Check port availability on your system

---

**Last Updated**: September 2, 2025
**Version**: 1.0.0
