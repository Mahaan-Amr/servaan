@echo off
REM Simple debug script to create a debug container

echo Building debug container...
docker build -f src/backend/Dockerfile.simple -t debug-container . --target builder

echo Running debug inspection...
docker run --rm -it debug-container sh -c "
echo '=== Current Working Directory ==='
pwd
echo ''
echo '=== Full Structure from /app ==='
find /app -name '*.ts' -o -name 'client' -o -name 'types' | head -20
echo ''
echo '=== Backend src structure ==='
ls -la /app/src/backend/src/ | head -10
echo ''
echo '=== Shared structure ==='
ls -la /app/src/shared/
echo ''
echo '=== Generated client structure ==='
ls -la /app/src/shared/generated/
echo ''
echo '=== Test path resolution ==='
cd /app/src/backend/src/controllers/
echo 'Current dir:' && pwd
echo 'Checking ../../shared/generated/client:'
ls -la ../../shared/generated/client/ 2>/dev/null || echo 'NOT FOUND'
echo 'Checking ../../shared/types:'
ls -la ../../shared/types/ 2>/dev/null || echo 'NOT FOUND'
"

echo Cleaning up...
docker rmi debug-container
