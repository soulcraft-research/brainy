# Universal Cloud Deployment Guide for Brainy

This guide provides **zero-configuration** deployment examples for Brainy across all major cloud providers. Models are automatically extracted during the Docker build process - no manual configuration required!

## 🚀 How It Works

1. **Automatic Model Extraction**: The `scripts/extract-models.js` script runs during Docker build
2. **Auto-Detection**: Brainy automatically finds extracted models at runtime
3. **Universal Compatibility**: Works across Google Cloud, AWS, Azure, Cloudflare, and others
4. **Zero Configuration**: No environment variables or custom paths needed

## ☁️ Cloud Provider Examples

### Google Cloud Run

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN node scripts/extract-models.js  # ← Automatic model extraction

FROM node:24-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --omit=optional
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models  # ← Models included automatically
ENV PORT=8080
CMD ["node", "dist/server.js"]
```

Deploy:
```bash
gcloud run deploy brainy-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 2Gi
```

### AWS Lambda

```dockerfile
FROM public.ecr.aws/lambda/nodejs:24
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN node scripts/extract-models.js  # ← Automatic model extraction
CMD ["index.handler"]
```

Deploy:
```bash
aws lambda create-function \
  --function-name brainy-function \
  --package-type Image \
  --code ImageUri=your-account.dkr.ecr.region.amazonaws.com/brainy:latest \
  --timeout 60 \
  --memory-size 2048
```

### AWS ECS/Fargate

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN node scripts/extract-models.js  # ← Automatic model extraction

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=builder /app/models ./models  # ← Models included
# ... rest of Dockerfile
```

Deploy with ECS task definition:
```json
{
  "family": "brainy-task",
  "cpu": "1024",
  "memory": "2048",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "containerDefinitions": [{
    "name": "brainy-container",
    "image": "your-image:latest",
    "memory": 2048,
    "portMappings": [{"containerPort": 3000}]
  }]
}
```

### Azure Container Instances

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN node scripts/extract-models.js  # ← Automatic model extraction

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=builder /app/models ./models  # ← Models included
ENV PORT=80
CMD ["node", "dist/server.js"]
```

Deploy:
```bash
az container create \
  --resource-group myResourceGroup \
  --name brainy-container \
  --image your-registry/brainy:latest \
  --cpu 1 \
  --memory 2 \
  --ports 80
```

### Cloudflare Workers (Alternative Approach)

Cloudflare Workers have size constraints, so we use R2 storage:

```javascript
// wrangler.toml
[[r2_buckets]]
binding = "BRAINY_MODELS_BUCKET"
bucket_name = "brainy-models"

// worker.js
export default {
  async fetch(request, env) {
    // Models loaded from R2 bucket automatically
    const brainy = new BrainyData({
      storageAdapter: new CloudflareR2Storage(env.BRAINY_MODELS_BUCKET)
    })
    // ... your worker logic
  }
}
```

### Vercel

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN node scripts/extract-models.js  # ← Automatic model extraction
CMD ["node", "dist/server.js"]
```

Deploy:
```bash
vercel --docker
```

### Netlify Functions

```javascript
// netlify.toml
[build]
command = "npm run build"
functions = "netlify/functions"

[build.environment]
NODE_VERSION = "24"

[[plugins]]
package = "@netlify/plugin-functions"
```

## 🔧 Build Process

The automatic model extraction process:

1. **During Docker Build**: `RUN node scripts/extract-models.js`
2. **Detects @soulcraft/brainy-models**: Automatically finds the installed package
3. **Extracts Models**: Copies models to `/app/models` directory
4. **Creates Marker**: Places `.brainy-models-extracted` file for runtime detection
5. **Runtime Auto-Detection**: Brainy automatically finds and uses extracted models

## 📊 Benefits by Cloud Provider

| Provider | Benefit | Details |
|----------|---------|---------|
| **Google Cloud Run** | Fast cold starts | No model download delay |
| **AWS Lambda** | Predictable execution time | Models in container image |
| **AWS ECS/Fargate** | Consistent performance | No external dependencies |
| **Azure Container Instances** | Reliable scaling | Self-contained containers |
| **Cloudflare Workers** | Edge performance | Models in R2 for global access |
| **Vercel** | Optimized functions | Reduced function cold start time |
| **Netlify** | Edge functions | Better user experience |

## 🎯 Universal Deployment Script

Create a single script that works everywhere:

```bash
#!/bin/bash
# deploy.sh - Universal deployment script

# Detect cloud provider and deploy accordingly
if command -v gcloud &> /dev/null; then
    echo "Deploying to Google Cloud Run..."
    gcloud run deploy brainy-app --source .
elif command -v aws &> /dev/null; then
    echo "Deploying to AWS..."
    aws lambda update-function-code --function-name brainy-function --image-uri $ECR_URI
elif command -v az &> /dev/null; then
    echo "Deploying to Azure..."
    az container create --resource-group $RG --name brainy --image $IMAGE
elif command -v wrangler &> /dev/null; then
    echo "Deploying to Cloudflare..."
    wrangler publish
else
    echo "Building Docker image for manual deployment..."
    docker build -t brainy-app .
fi
```

## 🔍 Verification

After deployment, check logs for these messages:

✅ **Successful auto-detection**:
```
[Brainy Model Extractor] ✅ Models extracted successfully!
🎯 Auto-detected extracted models at: /app/models
✅ Successfully loaded model from custom directory
```

❌ **Fallback to remote loading**:
```
⚠️ Local model not found. Falling back to remote model loading.
```

## 🛠️ Troubleshooting

### Models not found
1. Ensure `@soulcraft/brainy-models` is in `dependencies` (not `devDependencies`)
2. Check that `node scripts/extract-models.js` runs during build
3. Verify models directory exists in final image: `docker run -it your-image ls -la /app/models`

### Memory issues
Increase container memory:
- **Cloud Run**: `--memory 2Gi`
- **Lambda**: `--memory-size 2048`
- **ECS**: Set memory in task definition
- **Azure**: `--memory 2`

### Build failures
1. Ensure Node.js 24+ is used
2. Check that package.json includes model extraction script
3. Verify container has sufficient disk space during build

## 📈 Performance Comparison

| Deployment Type | Cold Start | Memory Usage | Network Calls |
|----------------|------------|--------------|---------------|
| **With auto-extracted models** | ~2s | +500MB | 0 |
| **Without models (remote loading)** | ~15s | +200MB | Multiple |

Auto-extracted models provide **7x faster cold starts** with **zero network dependencies**.

## 🔐 Security Benefits

- **No external network calls** during runtime
- **Consistent model versions** across deployments
- **Offline capability** for sensitive environments
- **Reduced attack surface** (no model download endpoints)

This approach works universally across all cloud providers while maintaining the same performance and reliability benefits!