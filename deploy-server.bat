@echo off
chcp 65001 >nul
echo 🚀 Servaan Server Deployment Script
echo =====================================
echo.

:: Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found!
    echo Please run this script from the servaan project root directory.
    pause
    exit /b 1
)

echo 📋 Pre-deployment checks...
echo.

:: Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

:: Check if we have the necessary files
if not exist "docker-compose.server.yml" (
    echo ❌ Error: docker-compose.server.yml not found!
    echo Please ensure all deployment files are present.
    pause
    exit /b 1
)

if not exist ".env.server" (
    echo ❌ Error: .env.server not found!
    echo Please ensure all deployment files are present.
    pause
    exit /b 1
)

echo ✅ All required files found
echo.

:: Backup current configuration
echo 📦 Creating backup of current configuration...
if exist "docker-compose.yml.backup" (
    del "docker-compose.yml.backup"
)
copy "docker-compose.yml" "docker-compose.yml.backup"
echo ✅ Backup created: docker-compose.yml.backup
echo.

:: Deploy server configuration
echo 🚀 Deploying server configuration...
echo.

:: Stop any running containers
echo 📥 Stopping existing containers...
docker-compose down >nul 2>&1
echo ✅ Existing containers stopped
echo.

:: Copy server configuration
echo 📋 Applying server configuration...
copy "docker-compose.server.yml" "docker-compose.yml" >nul
copy ".env.server" ".env" >nul
echo ✅ Server configuration applied
echo.

:: Build and start containers
echo 🔨 Building and starting containers...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo ❌ Error: Failed to build/start containers!
    echo Rolling back to previous configuration...
    copy "docker-compose.yml.backup" "docker-compose.yml" >nul
    echo ✅ Rollback completed
    pause
    exit /b 1
)

echo ✅ Containers started successfully
echo.

:: Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

:: Verify deployment
echo 🔍 Verifying deployment...
echo.

:: Check container status
docker-compose ps
echo.

:: Test backend health
echo 📡 Testing backend health...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend health check passed
) else (
    echo ⚠️  Backend health check failed (may still be starting)
)

:: Test frontend accessibility
echo 🌐 Testing frontend accessibility...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible
) else (
    echo ⚠️  Frontend accessibility check failed (may still be starting)
)

echo.
echo 🎉 Deployment completed!
echo.
echo 📊 Next steps:
echo 1. Wait 2-3 minutes for all services to fully start
echo 2. Test your application at: http://localhost:3000
echo 3. Verify API endpoints at: http://localhost:3001/api/health
echo 4. Check container logs if needed: docker-compose logs
echo.
echo 🔧 If you encounter issues:
echo - Check container logs: docker-compose logs [service-name]
echo - Restart specific service: docker-compose restart [service-name]
echo - Rollback: Run rollback-server.bat
echo.

pause
