# Google Cloud Run Dockerfile with Auto-Extracted Models
# Optimized for Cloud Run's requirements and constraints

FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including @soulcraft/brainy-models
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Extract models using our automatic script
RUN node scripts/extract-models.js

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --omit=optional && npm cache clean --force

# Copy application code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models

# Copy any other necessary files
COPY --from=builder /app/scripts ./scripts

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S brainy -u 1001 && \
    chown -R brainy:nodejs /app

USER brainy

# Cloud Run specific configurations
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE 8080

# Start the application
CMD ["node", "dist/server.js"]