#!/bin/bash

# Admin Backend Docker Build Script
# This script builds the admin backend Docker container

set -e  # Exit on any error

echo "🚀 Building Servaan Admin Backend Docker Container..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the admin backend directory."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t servaan-admin-backend:latest -f Dockerfile ../..

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📋 Image details:"
    docker images servaan-admin-backend:latest
    
    echo ""
    echo "🚀 To run the container:"
    echo "   docker run -p 3003:3003 --env-file .env.docker servaan-admin-backend:latest"
    echo ""
    echo "🔗 Or use docker-compose:"
    echo "   docker-compose -f ../../../docker-compose.admin.yml up -d"
else
    echo "❌ Docker build failed!"
    exit 1
fi
