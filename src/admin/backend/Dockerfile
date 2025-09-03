FROM node:18-alpine AS builder

WORKDIR /app

# Copy the entire project structure to maintain exact paths
COPY . .

# Install dependencies
WORKDIR /app/src/admin/backend
RUN npm ci

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
