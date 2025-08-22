@echo off
chcp 65001 >nul
echo 🔍 Servaan Deployment Verification Script
echo =========================================
echo.

:: Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found!
    echo Please run this script from the servaan project root directory.
    pause
    exit /b 1
)

echo 📋 Starting deployment verification...
echo.

:: Check Docker status
echo 🔍 Checking Docker status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running!
    pause
    exit /b 1
)
echo ✅ Docker is running
echo.

:: Check container status
echo 📊 Checking container status...
docker-compose ps
echo.

:: Check if all containers are running
echo 🔍 Verifying all containers are running...
docker-compose ps --format "table {{.Name}}\t{{.Status}}" | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo ❌ Warning: Some containers may not be running properly
) else (
    echo ✅ All containers appear to be running
)
echo.

:: Test backend health
echo 📡 Testing backend health...
echo Testing: http://localhost:3001/api/health
curl -s -o temp_response.txt http://localhost:3001/api/health
if %errorlevel% equ 0 (
    echo ✅ Backend health check passed
    type temp_response.txt
    del temp_response.txt
) else (
    echo ❌ Backend health check failed
)
echo.

:: Test frontend accessibility
echo 🌐 Testing frontend accessibility...
echo Testing: http://localhost:3000
curl -s -o temp_response.txt http://localhost:3000
if %errorlevel% equ 0 (
    echo ✅ Frontend is accessible
    findstr /C:"سروان" temp_response.txt >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Frontend content loaded (Persian text found)
    ) else (
        echo ⚠️  Frontend loaded but content may be incomplete
    )
    del temp_response.txt
) else (
    echo ❌ Frontend accessibility check failed
)
echo.

:: Test database connectivity
echo 🗄️  Testing database connectivity...
docker exec servaan-postgres-server pg_isready -U servaan -d servaan_prod >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database is ready and accessible
) else (
    echo ❌ Database connectivity check failed
)
echo.

:: Test Redis connectivity
echo 🔴 Testing Redis connectivity...
docker exec servaan-redis-server redis-cli --raw incr ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is ready and accessible
) else (
    echo ❌ Redis connectivity check failed
)
echo.

:: Test API endpoints
echo 🔌 Testing critical API endpoints...
echo.

:: Test tenant endpoint
echo Testing: http://localhost:3001/api/tenants/servaan
curl -s -o temp_response.txt http://localhost:3001/api/tenants/servaan
if %errorlevel% equ 0 (
    findstr /C:"404" temp_response.txt >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠️  Tenant endpoint returns 404 (may be expected if tenant doesn't exist)
    ) else (
        echo ✅ Tenant endpoint is responding
    )
    del temp_response.txt
) else (
    echo ❌ Tenant endpoint test failed
)
echo.

:: Check container logs for errors
echo 📝 Checking container logs for errors...
echo.

echo 🔍 Backend logs (last 10 lines):
docker-compose logs --tail=10 backend
echo.

echo 🔍 Frontend logs (last 10 lines):
docker-compose logs --tail=10 frontend
echo.

:: Check resource usage
echo 💾 Checking resource usage...
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo.

:: Final verification summary
echo.
echo 🎯 Deployment Verification Summary
echo =================================
echo.

:: Count running containers
for /f %%i in ('docker-compose ps -q ^| find /c /v ""') do set container_count=%%i
echo 📊 Total containers: %container_count%

:: Check if health checks are passing
echo 🔍 Health check status:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo.

echo 📋 Verification completed!
echo.
echo 🔧 If you see any issues:
echo 1. Check container logs: docker-compose logs [service-name]
echo 2. Restart specific service: docker-compose restart [service-name]
echo 3. Check resource usage: docker stats
echo 4. Verify environment variables: docker-compose exec backend env
echo.

pause
