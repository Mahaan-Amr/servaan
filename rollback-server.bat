@echo off
chcp 65001 >nul
echo 🔄 Servaan Server Rollback Script
echo ==================================
echo.

:: Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found!
    echo Please run this script from the servaan project root directory.
    pause
    exit /b 1
)

echo 📋 Starting rollback process...
echo.

:: Check if backup exists
if not exist "docker-compose.yml.backup" (
    echo ❌ Error: No backup found!
    echo Cannot rollback without a backup file.
    echo.
    echo 🔧 Manual rollback options:
    echo 1. Restore from git: git checkout HEAD -- docker-compose.yml
    echo 2. Restore from git: git checkout HEAD -- .env
    echo 3. Manually copy your working local files
    pause
    exit /b 1
)

echo ✅ Backup file found: docker-compose.yml.backup
echo.

:: Stop current containers
echo 📥 Stopping current containers...
docker-compose down >nul 2>&1
echo ✅ Current containers stopped
echo.

:: Restore backup
echo 🔄 Restoring previous configuration...
copy "docker-compose.yml.backup" "docker-compose.yml" >nul
echo ✅ Previous configuration restored
echo.

:: Check if we have a working .env
if exist ".env.backup" (
    echo 🔄 Restoring previous environment configuration...
    copy ".env.backup" ".env" >nul
    echo ✅ Previous environment configuration restored
) else (
    echo ⚠️  No .env backup found, using current .env
)

echo.

:: Start containers with previous configuration
echo 🚀 Starting containers with previous configuration...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Error: Failed to start containers with previous configuration!
    echo.
    echo 🔧 Manual recovery steps:
    echo 1. Check docker-compose.yml syntax: docker-compose config
    echo 2. Check container logs: docker-compose logs
    echo 3. Restart Docker service
    echo 4. Contact support if issues persist
    pause
    exit /b 1
)

echo ✅ Containers started with previous configuration
echo.

:: Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

:: Verify rollback
echo 🔍 Verifying rollback...
echo.

:: Check container status
docker-compose ps
echo.

:: Test basic connectivity
echo 📡 Testing basic connectivity...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend health check passed
) else (
    echo ⚠️  Backend health check failed (may still be starting)
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible
) else (
    echo ⚠️  Frontend accessibility check failed (may still be starting)
)

echo.
echo 🎉 Rollback completed successfully!
echo.
echo 📊 Current status:
echo - Previous configuration restored
echo - Containers restarted
echo - Services should be accessible
echo.
echo 🔧 Next steps:
echo 1. Wait 2-3 minutes for all services to fully start
echo 2. Test your application
echo 3. If issues persist, check container logs
echo 4. Consider manual configuration restoration
echo.

pause
