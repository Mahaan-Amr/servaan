@echo off
REM Admin Backend Docker Build Script for Windows
REM This script builds the admin backend Docker container

echo 🚀 Building Servaan Admin Backend Docker Container...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the admin backend directory.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Build the Docker image
echo 🔨 Building Docker image...
docker build -t servaan-admin-backend:latest -f Dockerfile ../..

if %errorlevel% equ 0 (
    echo ✅ Docker image built successfully!
    echo 📋 Image details:
    docker images servaan-admin-backend:latest
    
    echo.
    echo 🚀 To run the container:
    echo    docker run -p 3003:3003 --env-file .env.docker servaan-admin-backend:latest
    echo.
    echo 🔗 Or use docker-compose:
    echo    docker-compose -f ../../../docker-compose.admin.yml up -d
) else (
    echo ❌ Docker build failed!
    pause
    exit /b 1
)

pause
