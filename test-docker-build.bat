@echo off
REM Test Docker Build Script for Servaan (Windows)
REM This script tests the individual Docker builds to ensure they work correctly

echo 🐳 Testing Servaan Docker Builds...
echo ==================================

REM Test Backend Build
echo 🔧 Testing Backend Build...
docker build -f src/backend/Dockerfile.simple -t servaan-backend-test .
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend build failed!
    exit /b 1
)
echo ✅ Backend build successful!

REM Test Frontend Build
echo 🎨 Testing Frontend Build...
docker build -f src/frontend/Dockerfile -t servaan-frontend-test .
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed!
    exit /b 1
)
echo ✅ Frontend build successful!

REM Clean up test images
echo 🧹 Cleaning up test images...
docker rmi servaan-backend-test servaan-frontend-test 2>nul

echo ✅ All Docker builds successful! 🎉
echo.
echo 🚀 You can now run: docker-compose -f docker-compose.prod.yml up --build
echo.
echo 📋 Build Summary:
echo    ✅ Backend: Fixed import path issues with shared types
echo    ✅ Frontend: Consistent build approach
echo    ✅ Docker: Optimized .dockerignore for faster builds
echo    ✅ Context: Maintains development directory structure
