# Docker Deployment for Brainy

This guide shows how to deploy Brainy applications with embedded models in Docker containers, avoiding the need to download models at runtime.

## Problem

When deploying Node.js applications to Docker containers, `node_modules` is often ignored in `.dockerignore` to reduce image size. However, this means the `@soulcraft/brainy-models` package (containing pre-trained models) won't be included in the container, forcing runtime model downloads from the internet.

## Solution

Brainy now supports loading models from custom directories using:

1. **Environment variable**: `BRAINY_MODELS_PATH` or `MODELS_PATH`
2. **Configuration option**: `customModelsPath` in `RobustModelLoader`

## Deployment Strategies

### Strategy 1: Embed Models in Docker Image (Recommended)

This approach copies models from `node_modules` to a custom location during the Docker build process.

```dockerfile
# Multi-stage build to extract models
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Extract models from node_modules
RUN mkdir -p /app/models && \
    if [ -d "./node_modules/@soulcraft/brainy-models" ]; then \
        cp -r ./node_modules/@soulcraft/brainy-models/models/* /app/models/; \
    fi

# Production stage
FROM node:24-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --omit=optional
COPY . .
COPY --from=builder /app/models /app/models

# Set environment variable
ENV BRAINY_MODELS_PATH=/app/models

CMD ["node", "dist/your-app.js"]
```

### Strategy 2: Mount Models as Volume

Mount pre-downloaded models as a Docker volume:

```yaml
services:
  brainy-app:
    image: your-brainy-app
    environment:
      - BRAINY_MODELS_PATH=/models
    volumes:
      - ./models:/models:ro
```

### Strategy 3: Init Container Pattern

Use an init container to download models before starting your application:

```yaml
services:
  model-downloader:
    image: node:24-alpine
    volumes:
      - brainy-models:/models
    command: |
      sh -c "
        npm install @soulcraft/brainy-models
        cp -r node_modules/@soulcraft/brainy-models/models/* /models/
      "

  brainy-app:
    image: your-brainy-app
    environment:
      - BRAINY_MODELS_PATH=/models
    volumes:
      - brainy-models:/models:ro
    depends_on:
      - model-downloader

volumes:
  brainy-models:
```

## Configuration Options

### Environment Variables

```bash
# Primary environment variable
BRAINY_MODELS_PATH=/app/models

# Alternative variable name
MODELS_PATH=/app/models
```

### Programmatic Configuration

```javascript
import { BrainyData, RobustModelLoader } from '@soulcraft/brainy'

// Option 1: Configure via RobustModelLoader
const loader = new RobustModelLoader({
  customModelsPath: '/app/models'
})

// Option 2: Environment variable (automatic)
// Just set BRAINY_MODELS_PATH and it will be used automatically
```

## Model Directory Structure

Brainy will search for models in the following subdirectories (in order):

```
/app/models/
├── universal-sentence-encoder/          # Direct path
├── models/universal-sentence-encoder/   # @soulcraft/brainy-models structure
├── tfhub/universal-sentence-encoder/    # TensorFlow Hub structure
├── use/                                 # Short name
└── model.json                          # Root directory
```

## Cloud Run Deployment

For Google Cloud Run, use the embedded models strategy:

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Copy models during build
RUN if [ -d "./node_modules/@soulcraft/brainy-models" ]; then \
        mkdir -p /app/models && \
        cp -r ./node_modules/@soulcraft/brainy-models/models/* /app/models/; \
    fi

ENV BRAINY_MODELS_PATH=/app/models
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
```

Deploy with:

```bash
gcloud run deploy brainy-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1
```

## AWS Lambda/ECS Deployment

Similar approach works for AWS services:

```dockerfile
FROM public.ecr.aws/lambda/nodejs:24

# Copy models during build
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p /var/task/models && \
    cp -r ./node_modules/@soulcraft/brainy-models/models/* /var/task/models/

ENV BRAINY_MODELS_PATH=/var/task/models

CMD ["index.handler"]
```

## Verification

Your application logs should show:

```
✅ Found model at custom path: /app/models/universal-sentence-encoder/model.json
✅ Successfully loaded model from custom directory
   Using custom model path for Docker/production deployment
```

Instead of:

```
⚠️ Local model not found. Falling back to remote model loading.
```

## Benefits

1. **Faster startup**: No model download time
2. **Offline deployment**: Works without internet access
3. **Predictable performance**: No network dependency
4. **Smaller runtime image**: Can exclude dev dependencies
5. **Security**: No external network calls required

## Troubleshooting

### Models not found

1. Check the environment variable is set: `echo $BRAINY_MODELS_PATH`
2. Verify models directory exists: `ls -la /app/models`
3. Check model structure: `find /app/models -name "model.json"`

### Memory issues

Models require approximately 500MB of RAM. Ensure your container has sufficient memory:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

### Build failures

If `@soulcraft/brainy-models` is not available during build:
1. Ensure it's in `dependencies`, not `devDependencies`
2. Use `npm ci --only=production` instead of `npm install`
3. Check the package is properly published and accessible