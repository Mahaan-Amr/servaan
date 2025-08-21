#!/bin/bash

# Debug Docker Structure Script
echo "🔍 Debugging Docker Container Structure..."

# Build the image and get the container ID
echo "Building debug image..."
docker build -f src/backend/Dockerfile.simple -t debug-structure . --target builder

# Run a temporary container to inspect structure
echo "Inspecting container structure..."
docker run --rm -it debug-structure sh -c "
echo '=== Current Working Directory ==='
pwd
echo '=== Backend Directory Structure ==='
ls -la /app/src/backend/
echo '=== Shared Directory Structure ==='
ls -la /app/src/shared/
echo '=== Generated Client Structure ==='
ls -la /app/src/shared/generated/
echo '=== Types Structure ==='
ls -la /app/src/shared/types/
echo '=== Relative Path Test ==='
cd /app/src/backend
echo 'From backend directory:'
ls -la ../../shared/
echo '=== Import Path Resolution Test ==='
node -e \"
const path = require('path');
console.log('Resolved path for ../../shared/types:', path.resolve('../../shared/types'));
console.log('Resolved path for ../../shared/generated/client:', path.resolve('../../shared/generated/client'));
console.log('Does ../../shared/types exist?', require('fs').existsSync('../../shared/types'));
console.log('Does ../../shared/generated/client exist?', require('fs').existsSync('../../shared/generated/client'));
\"
"

# Clean up
echo "Cleaning up..."
docker rmi debug-structure
