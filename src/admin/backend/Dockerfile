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

# Copy the entire project structure to maintain exact paths
COPY . .

# Install dependencies with retry logic and timeout protection
WORKDIR /app/src/admin/backend
RUN apk add --no-cache coreutils procps && \
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

# Generate Prisma client (this will create the shared/generated/client directory)
WORKDIR /app/src/prisma
RUN npx prisma generate

# Build the application
WORKDIR /app/src/admin/backend
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application and necessary files
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/backend/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/backend/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src/prisma ./prisma/
# Copy the shared directory with generated client
COPY --from=builder --chown=nodejs:nodejs /app/src/shared ./shared/
# Copy the generated client to the dist output for runtime access
COPY --from=builder --chown=nodejs:nodejs /app/src/shared/generated ./dist/shared/generated/

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/admin/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["dumb-init", "node", "dist/admin/backend/src/index.js"]
