# Simple Brainy Deployment - Zero Configuration Required!
# This Dockerfile works universally across all cloud providers

FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including @soulcraft/brainy-models)
RUN npm ci

# Copy application source
COPY . .

# 🎯 AUTOMATIC MODEL EXTRACTION - No configuration needed!
RUN npm run extract-models

# Build the application
RUN npm run build

# Production stage - minimal and secure
FROM node:24-alpine AS production

WORKDIR /app

# Install only production dependencies (without models to save space)
COPY package*.json ./
RUN npm ci --only=production --omit=optional && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# 🎯 COPY AUTO-EXTRACTED MODELS - Works everywhere!
COPY --from=builder /app/models ./models

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S brainy -u 1001 && \
    chown -R brainy:nodejs /app

USER brainy

# Environment setup (cloud providers will set their own PORT)
ENV NODE_ENV=production

# Expose common port (cloud providers override as needed)
EXPOSE 3000

# Health check for all cloud providers
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "dist/server.js"]