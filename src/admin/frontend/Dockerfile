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
COPY src/admin/frontend/package*.json ./

# Install dependencies with retry logic
RUN set -e; \
    max_attempts=5; \
    attempt=1; \
    while [ $attempt -le $max_attempts ]; do \
        echo "📦 Attempt $attempt/$max_attempts to install dependencies..." && \
        if npm ci --no-audit --no-fund; then \
            echo "✅ Dependencies installed successfully!" && \
            break; \
        else \
            if [ $attempt -eq $max_attempts ]; then \
                echo "❌ All attempts failed. Last attempt error:" && \
                exit 1; \
            else \
                echo "⚠️ Attempt $attempt failed, waiting 15 seconds before retry..." && \
                sleep 15; \
            fi; \
        fi; \
        attempt=$((attempt + 1)); \
    done

# Copy the ENTIRE project structure to maintain consistency
COPY . .

# Debug: Show what we copied
RUN echo "=== Contents of /app ===" && ls -la /app
RUN echo "=== Contents of /app/src/admin/frontend ===" && ls -la /app/src/admin/frontend

# Change to admin frontend directory for build
WORKDIR /app/src/admin/frontend

# Build-time environment variables (injected via build args from compose)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ADMIN_API_URL=${NEXT_PUBLIC_ADMIN_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Debug: Show environment variables before build
RUN echo "🔧 Build-time environment variables:"
RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
RUN echo "NEXT_PUBLIC_ADMIN_API_URL=$NEXT_PUBLIC_ADMIN_API_URL"
RUN echo "NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL"

# Build the application (envs already set above)
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
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/package*.json ./

# Configure npm for better network reliability in production stage
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm config set registry https://registry.npmjs.org/

# Install all dependencies (some dev deps are needed for production) with retry logic
RUN set -e; \
    max_attempts=5; \
    attempt=1; \
    while [ $attempt -le $max_attempts ]; do \
        echo "📦 Attempt $attempt/$max_attempts to install production dependencies..." && \
        if npm ci --no-audit --no-fund; then \
            echo "✅ Production dependencies installed successfully!" && \
            echo "Installed packages:" && \
            npm list --depth=0 && \
            echo "Next.js version:" && \
            npx next --version && \
            break; \
        else \
            if [ $attempt -eq $max_attempts ]; then \
                echo "❌ All attempts failed. Last attempt error:" && \
                exit 1; \
            else \
                echo "⚠️ Attempt $attempt failed, waiting 15 seconds before retry..." && \
                sleep 15; \
            fi; \
        fi; \
        attempt=$((attempt + 1)); \
    done

# Copy built application (following main frontend pattern)
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/next.config.js ./

# Ensure static assets are explicitly copied (ChatGPT's fix)
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/frontend/.next/static ./.next/static

# Switch to non-root user
USER nodejs

# Expose port 3000 for admin frontend (matches docker-compose mapping)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application (package.json now uses port 3000)
CMD ["dumb-init", "sh", "-c", "npm start || echo 'Failed to start admin application'"]
