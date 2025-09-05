# Local Development Setup Guide

## Overview
This guide explains how to set up and run the Servaan project locally for development without Docker.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (running locally)
- npm or yarn

## Quick Start

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run install:all
```

### 2. Database Setup
Make sure PostgreSQL is running and the `servaan` database exists with the credentials from `.env`:
- Host: localhost
- Port: 5432
- Database: servaan
- User: postgres
- Password: hiddenitch1739

### 3. Run Prisma Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (if needed)
npm run prisma:migrate
```

### 4. Start Services

#### Option A: Start All Services
```bash
npm run dev
```

#### Option B: Start Services Individually
```bash
# Main application
npm run dev:main

# Admin panel
npm run dev:admin

# Individual services
npm run dev:frontend      # Main frontend (port 3000)
npm run dev:backend       # Main backend (port 3001)
npm run dev:admin-frontend # Admin frontend (port 3004)
npm run dev:admin-backend  # Admin backend (port 3003)
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Main App | http://localhost:3000 | Main application frontend |
| Main API | http://localhost:3001/api | Main application backend API |
| Admin Panel | http://localhost:3004 | Admin panel frontend |
| Admin API | http://localhost:3003/api | Admin panel backend API |
| Prisma Studio | http://localhost:5555 | Database management UI |

## Admin Panel Access

### Login Credentials
- **Email**: admin@servaan.com
- **Password**: AdminSecure2024!

### Available Admin Users
- **Super Admin**: admin@servaan.com / AdminSecure2024!
- **Platform Admin**: platform@servaan.com / PlatformSecure2024!
- **Support**: support@servaan.com / SupportSecure2024!
- **Developer**: developer@servaan.com / DeveloperSecure2024!

## Environment Configuration

### Main Services (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=servaan
DB_USER=postgres
DB_PASSWORD=hiddenitch1739
DATABASE_URL=postgresql://postgres:hiddenitch1739@localhost:5432/servaan
BACKEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
JWT_SECRET=servaan-super-secret-key
NODE_ENV=development
```

### Admin Services
- **Backend**: `src/admin/backend/.env`
- **Frontend**: `src/admin/frontend/.env.local`

## Development Commands

### Database Management
```bash
npm run prisma:studio    # Open Prisma Studio
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

### Testing
```bash
npm run test             # Run all tests
npm run test:frontend    # Test main frontend
npm run test:backend     # Test main backend
npm run test:admin-frontend # Test admin frontend
npm run test:admin-backend  # Test admin backend
```

### Building
```bash
npm run build            # Build all services
npm run build:frontend   # Build main frontend
npm run build:backend    # Build main backend
npm run build:admin-frontend # Build admin frontend
npm run build:admin-backend  # Build admin backend
```

### Maintenance
```bash
npm run clean            # Clean all node_modules
npm run install:all      # Install all dependencies
npm run setup:local      # Run local development setup
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Check if services are already running
   - Kill processes using the ports: `netstat -ano | findstr :3000`

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database `servaan` exists

3. **Admin Backend Not Starting**
   - Check if `.env` file exists in `src/admin/backend/`
   - Verify environment variables are loaded
   - Check console for error messages

4. **Admin Frontend Not Loading**
   - Verify admin backend is running on port 3003
   - Check `NEXT_PUBLIC_ADMIN_API_URL` in environment
   - Clear browser cache

### Debug Mode
Set `LOG_LEVEL=debug` in environment files for detailed logging.

## File Structure
```
servaan/
├── src/
│   ├── frontend/          # Main application frontend
│   ├── backend/           # Main application backend
│   ├── admin/
│   │   ├── frontend/      # Admin panel frontend
│   │   └── backend/       # Admin panel backend
│   └── prisma/            # Database schema and migrations
├── scripts/               # Development scripts
├── docs/                  # Documentation
└── package.json           # Root package configuration
```

## Next Steps
1. Access the admin panel at http://localhost:3004
2. Login with admin credentials
3. Start developing admin dashboard features
4. Use Prisma Studio for database management

## Support
For issues or questions, check the console logs and ensure all services are running properly.
