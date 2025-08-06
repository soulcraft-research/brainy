# Azure Container Instances Dockerfile with Auto-Extracted Models
# Optimized for Azure Container Instances

FROM node:24-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including @soulcraft/brainy-models
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Extract models using our automatic script
RUN node scripts/download-models.cjs

# Production stage
FROM node:24-slim AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --omit=optional && npm cache clean --force

# Copy application code and extracted models
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models
COPY --from=builder /app/scripts ./scripts

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S brainy -u 1001 && \
    chown -R brainy:nodejs /app

USER brainy

# Azure Container Instances environment
ENV NODE_ENV=production
ENV PORT=80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE 80

# Start the application
CMD ["node", "dist/server.js"]