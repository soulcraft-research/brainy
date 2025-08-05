# AWS Lambda Dockerfile with Auto-Extracted Models
# Uses AWS Lambda base image

FROM public.ecr.aws/lambda/nodejs:24

# Copy package files
COPY package*.json ./

# Install dependencies including @soulcraft/brainy-models
RUN npm ci --only=production && npm cache clean --force

# Copy source code and scripts
COPY . .

# Extract models using our automatic script
RUN node scripts/extract-models.js

# Clean up to reduce layer size
RUN rm -rf node_modules/@soulcraft/brainy-models/node_modules \
    rm -rf node_modules/@soulcraft/brainy-models/.git* \
    npm cache clean --force

# Set environment variables
ENV NODE_ENV=production
ENV AWS_LAMBDA_EXEC_WRAPPER=/opt/bootstrap

# AWS Lambda expects the handler at the root level
CMD ["index.handler"]