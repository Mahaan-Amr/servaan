FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY src/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the ENTIRE project structure to maintain consistency
COPY . .

# Change to frontend directory for build
WORKDIR /app/src/frontend

# CRITICAL: Set environment variables for build time (injected via build args)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files first for dependency installation
COPY --from=builder --chown=nodejs:nodejs /app/src/frontend/package*.json ./

# Install all dependencies (some dev deps are needed for production)
RUN npm ci && \
    echo "Installed packages:" && \
    npm list --depth=0 && \
    echo "Next.js version:" && \
    npx next --version

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/src/frontend/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/src/frontend/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/src/frontend/next.config.js ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application with better error handling
CMD ["dumb-init", "sh", "-c", "npm start || node server.js || echo 'Failed to start application'"]
