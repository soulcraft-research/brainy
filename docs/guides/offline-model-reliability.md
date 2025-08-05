# Offline Model Reliability Guide

## Overview

Brainy provides automatic offline model reliability for production deployments through the optional `@soulcraft/brainy-models` package. This solves critical production issues where the Universal Sentence Encoder fails to load in Docker, Cloud Run, or other restricted environments due to network timeouts or blocked URLs.

## The Problem

In production environments, the Universal Sentence Encoder model (used for generating embeddings) must be downloaded from Google's servers at runtime. This creates several reliability issues:

- **Network Timeouts**: Cloud Run and similar platforms have strict request timeouts
- **Blocked URLs**: Corporate firewalls or security policies may block model downloads
- **Cold Start Delays**: Model downloads add significant latency to application startup
- **Intermittent Failures**: Network connectivity issues can cause random failures

## The Solution

Brainy automatically detects and uses pre-bundled models when available, providing:

- **100% Offline Reliability**: No network requests required for model loading
- **Zero Configuration**: Automatic detection with graceful fallback
- **Backward Compatibility**: Existing code continues to work unchanged
- **Production Ready**: Optimized for Docker, serverless, and cloud deployments

## Quick Start

### Development (Online Models)
```bash
npm install @soulcraft/brainy
```

### Production (Offline Reliability)
```bash
npm install @soulcraft/brainy @soulcraft/brainy-models
```

That's it! No code changes required. Brainy will automatically detect and use the bundled models when available.

## How It Works

Brainy uses a hierarchical loading strategy:

1. **Local Bundled Models** (if `@soulcraft/brainy-models` is installed)
   - Zero network requests
   - Instant loading
   - Maximum reliability

2. **Online Model Download** (fallback)
   - Downloads from TensorFlow Hub
   - Caches locally after first download
   - Standard behavior for development

3. **Error Handling** (if all fails)
   - Clear error messages
   - Helpful troubleshooting information

## Docker Example

### Dockerfile with Offline Models
```dockerfile
FROM node:18-slim

# Install your application
COPY . /app
WORKDIR /app

# Install dependencies including the offline model package
RUN npm install @soulcraft/brainy @soulcraft/brainy-models

# Build your application
RUN npm run build

# Start your application
CMD ["npm", "start"]
```

### Multi-stage Build for Optimization
```dockerfile
# Build stage
FROM node:18 as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Install the offline model package
RUN npm install @soulcraft/brainy-models

COPY . .
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["npm", "start"]
```

## Cloud Platform Deployment

### Google Cloud Run
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build', 
      '--build-arg', 'NODE_ENV=production',
      '-t', 'gcr.io/$PROJECT_ID/brainy-app', 
      '.'
    ]
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/brainy-app']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', 'brainy-app',
      '--image', 'gcr.io/$PROJECT_ID/brainy-app',
      '--platform', 'managed',
      '--region', 'us-central1',
      '--memory', '2Gi',
      '--timeout', '300s'
    ]
```

### AWS Lambda with Container
```dockerfile
FROM public.ecr.aws/lambda/nodejs:18

# Copy function code and dependencies
COPY package*.json ${LAMBDA_TASK_ROOT}/
RUN npm ci --production

# Install offline model package for reliability
RUN npm install @soulcraft/brainy-models

COPY . ${LAMBDA_TASK_ROOT}

CMD [ "index.handler" ]
```

### Azure Container Instances
```yaml
# azure-container-instance.yaml
apiVersion: 2019-12-01
location: eastus
name: brainy-app
properties:
  containers:
  - name: brainy-app
    properties:
      image: myregistry.azurecr.io/brainy-app:latest
      environmentVariables:
      - name: NODE_ENV
        value: production
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 2.0
      ports:
      - port: 80
  osType: Linux
  restartPolicy: Always
```

## Verification

### Check If Offline Models Are Being Used
```javascript
import { BrainyData } from '@soulcraft/brainy'

const db = new BrainyData({
  verbose: true // Enable logging to see which models are being used
})

// Look for this log message:
// "✅ Found @soulcraft/brainy-models package, using bundled model for maximum reliability"
```

### Test Offline Functionality
```javascript
// Temporarily block network access to test offline capability
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const db = new BrainyData({ verbose: true })
const vector = await db.embed('test text')
console.log('✅ Embedding generated offline:', vector.length, 'dimensions')
```

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@soulcraft/brainy-models'`
```bash
# Solution: Install the offline model package
npm install @soulcraft/brainy-models
```

**Issue**: Models still downloading from internet
```bash
# Check if the package is properly installed
npm list @soulcraft/brainy-models

# Enable verbose logging to see the detection process
const db = new BrainyData({ verbose: true })
```

**Issue**: Out of memory errors in containers
```dockerfile
# Increase memory limit for containers
# Cloud Run: --memory 2Gi
# Docker: --memory=2g
# Lambda: MemorySize: 3008
```

### Performance Considerations

- **Package Size**: `@soulcraft/brainy-models` adds ~25MB to your deployment
- **Memory Usage**: Bundled models require ~200MB RAM when loaded
- **Loading Time**: Offline models load in ~100ms vs 5-30s for downloads
- **Storage**: Models are included in your application bundle

### Debugging Commands

```bash
# Check package installation
npm list @soulcraft/brainy-models

# Verify model files exist
ls node_modules/@soulcraft/brainy-models/models/

# Test model loading directly
node -e "import('@soulcraft/brainy-models').then(m => console.log('✅ Package loaded'))"
```

## Migration Guide

### From Development to Production

1. **Install the offline package**:
   ```bash
   npm install @soulcraft/brainy-models
   ```

2. **Update your Dockerfile** (if using Docker):
   ```dockerfile
   # Add this line to your package installation
   RUN npm install @soulcraft/brainy-models
   ```

3. **No code changes required** - Brainy automatically detects and uses bundled models

4. **Test locally**:
   ```bash
   # Temporarily disable internet to test offline functionality
   npm test
   ```

### Gradual Rollout Strategy

1. **Test in staging** with bundled models
2. **Deploy to a small percentage** of production traffic
3. **Monitor performance metrics** (startup time, memory usage)
4. **Gradually increase** traffic to bundled model instances
5. **Complete migration** once verified

## Benefits Summary

| Aspect | Online Models | Offline Models |
|--------|---------------|----------------|
| **Reliability** | Depends on network | 100% reliable |
| **Startup Time** | 5-30 seconds | ~100ms |
| **Bundle Size** | Small | +25MB |
| **Memory Usage** | Lower | +200MB |
| **Network Required** | Yes | No |
| **Production Ready** | ⚠️ Risky | ✅ Recommended |

## Advanced Configuration

### Custom Model Loading Options
```javascript
import { createRobustModelLoader } from '@soulcraft/brainy/utils/robustModelLoader'

const loader = createRobustModelLoader({
  preferLocalModel: true,    // Default: true
  maxRetries: 3,            // Default: 3
  timeout: 60000,           // Default: 60 seconds
  verbose: true,            // Default: false
  useExponentialBackoff: true // Default: true
})
```

### Environment-Specific Configuration
```javascript
// Load different models based on environment
const modelConfig = {
  development: { preferLocalModel: false },
  staging: { preferLocalModel: true },
  production: { preferLocalModel: true, maxRetries: 1 }
}

const config = modelConfig[process.env.NODE_ENV] || modelConfig.production
```

## Support and Resources

- **GitHub Issues**: [Report deployment issues](https://github.com/soulcraft-research/brainy/issues)
- **Documentation**: Complete API reference and examples
- **Community**: Join discussions about production deployments

For additional support with production deployments, please open an issue with your specific environment details.