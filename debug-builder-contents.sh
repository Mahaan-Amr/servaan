#!/bin/bash

echo "🔍 Debug Builder Contents..."
echo "=========================="

echo "📋 Building with debug output to see what's actually in the builder stage..."

cd src/admin/frontend

# Create a temporary Dockerfile with debug output
cat > Dockerfile.debug << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY src/admin/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the ENTIRE project structure to maintain consistency
COPY . .

# Debug: Show what we copied
RUN echo "=== Contents of /app ===" && ls -la /app
RUN echo "=== Contents of /app/src/admin/frontend ===" && ls -la /app/src/admin/frontend
RUN echo "=== Contents of /app/src/admin/frontend/public ===" && ls -la /app/src/admin/frontend/public

# Change to admin frontend directory for build
WORKDIR /app/src/admin/frontend

# Build the application
RUN npm run build

# Debug: Show what's in .next after build
RUN echo "=== Contents of /app/src/admin/frontend/.next ===" && ls -la /app/src/admin/frontend/.next

# Debug: Show what's in public after build
RUN echo "=== Contents of /app/src/admin/frontend/public ===" && ls -la /app/src/admin/frontend/public

# Just exit here for debugging
RUN echo "Build completed, exiting for debugging"
EOF

echo "🔧 Building with debug Dockerfile..."
docker build -f Dockerfile.debug -t debug-admin-builder .

echo "🔧 Cleaning up..."
rm Dockerfile.debug

echo "✅ Debug completed!"
