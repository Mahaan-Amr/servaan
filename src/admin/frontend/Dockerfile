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

# Change to admin frontend directory for build
WORKDIR /app/src/admin/frontend

# CRITICAL: Set environment variables for build time
# These will be embedded into the Next.js build
ENV NEXT_PUBLIC_API_URL=http://admin-backend:3003/api
ENV NEXT_PUBLIC_ADMIN_API_URL=http://admin-backend:3003/api
ENV NEXT_PUBLIC_APP_URL=https://admin.servaan.com

# Debug: Show environment variables before build
RUN echo "🔧 Build-time environment variables:"
RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
RUN echo "NEXT_PUBLIC_ADMIN_API_URL=$NEXT_PUBLIC_ADMIN_API_URL"
RUN echo "NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL"

# Build the application with explicit environment variables
RUN NEXT_PUBLIC_API_URL=http://admin-backend:3003/api \
    NEXT_PUBLIC_ADMIN_API_URL=http://admin-backend:3003/api \
    NEXT_PUBLIC_APP_URL=https://admin.servaan.com \
    npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files first for dependency installation
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/package*.json ./

# Install all dependencies (some dev deps are needed for production)
RUN npm ci && \
    echo "Installed packages:" && \
    npm list --depth=0 && \
    echo "Next.js version:" && \
    npx next --version

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/next.config.js ./

# Create public directory and copy static files for standalone mode
RUN mkdir -p ./public
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/.next/static ./public/_next/static

# Switch to non-root user
USER nodejs

# Expose port 3004 for admin frontend
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application using standalone server
CMD ["dumb-init", "sh", "-c", "npm run start:standalone || echo 'Failed to start admin application'"]
