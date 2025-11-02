FROM node:18-alpine AS builder

WORKDIR /app

# Configure npm for better network reliability
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm config set registry https://registry.npmjs.org/

# Optional: Configure proxy if provided via build args
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG http_proxy
ARG https_proxy
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}

# Copy package files
COPY src/frontend/package*.json ./

# Install dependencies with retry logic and timeout protection
RUN apk add --no-cache coreutils procps && \
    npm cache clean --force && \
    set -e; \
    max_attempts=5; \
    attempt=1; \
    npm_ci_timeout=1200; \
    while [ $attempt -le $max_attempts ]; do \
        echo "📦 Attempt $attempt/$max_attempts to install dependencies (timeout: ${npm_ci_timeout}s)..." && \
        start_time=$(date +%s); \
        npm ci --no-audit --no-fund --progress=true --loglevel=info --maxsockets=1 & \
        npm_pid=$!; \
        ( \
            sleep $npm_ci_timeout && \
            echo "⏱️ Timeout reached (${npm_ci_timeout}s), killing npm process group..." && \
            kill -TERM -$npm_pid 2>/dev/null || true && \
            sleep 5 && \
            kill -KILL -$npm_pid 2>/dev/null || true \
        ) & \
        timeout_monitor=$!; \
        if wait $npm_pid; then \
            kill $timeout_monitor 2>/dev/null || true; \
            elapsed=$(($(date +%s) - start_time)); \
            echo "✅ Dependencies installed successfully in ${elapsed}s!" && \
            break; \
        else \
            kill $timeout_monitor 2>/dev/null || true; \
            exit_code=$?; \
            elapsed=$(($(date +%s) - start_time)); \
            if [ $elapsed -ge $npm_ci_timeout ]; then \
                echo "⏱️ Attempt $attempt timed out after ${elapsed}s (exceeded ${npm_ci_timeout}s limit)"; \
            else \
                echo "❌ Attempt $attempt failed with exit code $exit_code after ${elapsed}s"; \
            fi; \
            if [ $attempt -eq $max_attempts ]; then \
                echo "❌ All $max_attempts attempts failed. Last attempt took ${elapsed}s." && \
                exit 1; \
            else \
                echo "⚠️ Waiting 30 seconds before retry..." && \
                sleep 30; \
            fi; \
        fi; \
        attempt=$((attempt + 1)); \
    done

# Verify @dnd-kit packages are installed
RUN echo "Verifying @dnd-kit packages:" && \
    npm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities || echo "Some packages missing, installing..." && \
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

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

# Configure npm for better network reliability in production stage
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm config set registry https://registry.npmjs.org/

# Install all dependencies (some dev deps are needed for production) with retry logic and timeout
RUN apk add --no-cache coreutils procps && \
    set -e; \
    max_attempts=5; \
    attempt=1; \
    npm_ci_timeout=1200; \
    while [ $attempt -le $max_attempts ]; do \
        echo "📦 Attempt $attempt/$max_attempts to install production dependencies (timeout: ${npm_ci_timeout}s)..." && \
        start_time=$(date +%s); \
        npm ci --no-audit --no-fund --progress=true --loglevel=info --maxsockets=1 & \
        npm_pid=$!; \
        ( \
            sleep $npm_ci_timeout && \
            echo "⏱️ Timeout reached (${npm_ci_timeout}s), killing npm process group..." && \
            kill -TERM -$npm_pid 2>/dev/null || true && \
            sleep 5 && \
            kill -KILL -$npm_pid 2>/dev/null || true \
        ) & \
        timeout_monitor=$!; \
        if wait $npm_pid; then \
            kill $timeout_monitor 2>/dev/null || true; \
            elapsed=$(($(date +%s) - start_time)); \
            echo "✅ Production dependencies installed successfully in ${elapsed}s!" && \
            echo "Installed packages:" && \
            npm list --depth=0 && \
            echo "Next.js version:" && \
            npx next --version && \
            break; \
        else \
            kill $timeout_monitor 2>/dev/null || true; \
            exit_code=$?; \
            elapsed=$(($(date +%s) - start_time)); \
            if [ $elapsed -ge $npm_ci_timeout ]; then \
                echo "⏱️ Attempt $attempt timed out after ${elapsed}s (exceeded ${npm_ci_timeout}s limit)"; \
            else \
                echo "❌ Attempt $attempt failed with exit code $exit_code after ${elapsed}s"; \
            fi; \
            if [ $attempt -eq $max_attempts ]; then \
                echo "❌ All $max_attempts attempts failed. Last attempt took ${elapsed}s." && \
                exit 1; \
            else \
                echo "⚠️ Waiting 30 seconds before retry..." && \
                sleep 30; \
            fi; \
        fi; \
        attempt=$((attempt + 1)); \
    done

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
