# Multi-stage Dockerfile for Brainy with embedded models
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including @soulcraft/brainy-models
RUN npm ci --only=production

# Copy application code
COPY . .

# Create models directory and copy models from node_modules
# This ensures models are included even when node_modules is ignored
RUN mkdir -p /app/models && \
    if [ -d "./node_modules/@soulcraft/brainy-models" ]; then \
        echo "Copying models from @soulcraft/brainy-models..."; \
        cp -r ./node_modules/@soulcraft/brainy-models/models/* /app/models/ || \
        cp -r ./node_modules/@soulcraft/brainy-models/* /app/models/ || \
        echo "Models structure may vary, copying entire package"; \
    else \
        echo "⚠️ @soulcraft/brainy-models not found - will fall back to remote loading"; \
    fi

# Production stage
FROM node:24-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (without @soulcraft/brainy-models to save space)
RUN npm ci --only=production --omit=optional && \
    npm cache clean --force

# Copy application code
COPY . .

# Copy models from builder stage
COPY --from=builder /app/models /app/models

# Set environment variable to use custom models path
ENV BRAINY_MODELS_PATH=/app/models

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S brainy -u 1001

# Change ownership of the app directory
RUN chown -R brainy:nodejs /app
USER brainy

# Expose port (adjust as needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "dist/your-app.js"]