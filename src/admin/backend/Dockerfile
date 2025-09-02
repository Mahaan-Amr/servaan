FROM node:18-alpine AS builder

WORKDIR /app

# Install OpenSSL and other required libraries for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy package files
COPY src/admin/backend/package*.json ./

# Install dependencies including ts-node for runtime TypeScript execution
RUN npm ci && npm install -g ts-node typescript

# Copy Prisma schema
COPY src/prisma ./prisma/

# Copy the ENTIRE project structure to maintain relative paths
COPY . .

# Debug: Show what we copied
RUN echo "=== Contents of /app ===" && ls -la /app

# Change to admin backend directory
WORKDIR /app/admin/backend

# Create a temporary package.json with correct Prisma paths for Docker
RUN echo '{"prisma":{"schema":"../../prisma/schema.prisma"}}' > package.prisma.json

# Generate Prisma client from the correct location
WORKDIR /app/prisma
RUN npx prisma generate --schema=./schema.prisma

# Return to admin backend directory
WORKDIR /app/admin/backend

# Ensure shared files are available at the expected location
RUN mkdir -p /app/admin/backend/shared && \
    cp -r /app/src/shared/* /app/admin/backend/shared/

# Debug: Show what we have
RUN echo "=== Current directory structure ===" && \
    ls -la && \
    echo "=== Shared directory ===" && \
    ls -la ../src/shared/ || echo "No ../src/shared found" && \
    echo "=== Admin backend shared directory ===" && \
    ls -la shared/ || echo "No shared found"

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install dumb-init, ts-node, and OpenSSL libraries for Prisma
RUN apk add --no-cache dumb-init openssl openssl-dev && \
    npm install -g ts-node typescript

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy source files and dependencies (no build needed)
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/backend ./src/admin/backend
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src/admin/backend/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src/shared ./shared
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy the generated Prisma client from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Debug: Show what was copied
RUN echo "=== Runner stage contents ===" && \
    ls -la && \
    echo "=== Admin backend contents ===" && \
    ls -la src/admin/backend/ || echo "No admin/backend directory" && \
    echo "=== Shared contents ===" && \
    ls -la src/shared/ || echo "No shared directory" && \
    echo "=== Prisma client contents ===" && \
    ls -la node_modules/.prisma/ || echo "No .prisma directory"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/admin/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application using ts-node to run TypeScript directly
CMD ["dumb-init", "ts-node", "src/admin/backend/src/index.ts"]
