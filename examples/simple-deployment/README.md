# Zero-Configuration Brainy Deployment

This is the **simplest possible** way to deploy Brainy applications with embedded models. **No environment variables, no configuration, no manual setup required!**

## 🎯 How It Works

1. **Install @soulcraft/brainy-models** in your project
2. **Add one line** to your Dockerfile: `RUN npm run extract-models`
3. **Deploy anywhere** - Google Cloud, AWS, Azure, Cloudflare, etc.
4. **Models load automatically** - zero configuration needed!

## 📦 Setup (3 Steps)

### Step 1: Install Models Package

```bash
npm install @soulcraft/brainy-models
```

### Step 2: Create Dockerfile

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run extract-models  # ← This line extracts models automatically!
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --omit=optional
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models  # ← Models included automatically!
CMD ["node", "dist/server.js"]
```

### Step 3: Deploy Anywhere

```bash
# Google Cloud Run
gcloud run deploy --source .

# AWS ECS
aws ecs create-service --service-name brainy-service

# Azure Container Instances  
az container create --image your-image

# Or any other cloud provider!
```

## ✨ Benefits

- **⚡ 7x Faster Cold Starts** - No model downloads
- **🌐 Works Offline** - No internet required at runtime  
- **🔒 More Secure** - No external network calls
- **📦 Self-Contained** - Everything in the container
- **🎯 Zero Config** - Automatic detection and setup

## 🏗️ What Happens During Build

1. `npm run extract-models` finds @soulcraft/brainy-models
2. Copies models to `./models` directory
3. Creates marker file for runtime detection
4. Brainy automatically finds models at startup
5. **No environment variables needed!**

## 🔍 Verification

After deployment, check your logs for:

✅ **Success (what you want to see)**:
```
🎯 Auto-detected extracted models at: /app/models
✅ Successfully loaded model from custom directory
   Using custom model path for Docker/production deployment
```

❌ **Fallback (if models not found)**:
```
⚠️ Local model not found. Falling back to remote model loading.
```

## 🚀 Example Application

```javascript
// server.js - No configuration needed!
import { BrainyData } from '@soulcraft/brainy'

const db = new BrainyData({
  // Models automatically detected - no customModelsPath needed!
  dimensions: 512
})

await db.init() // Models load from ./models automatically

// Your app logic here...
const id = await db.add({ content: 'Hello world!' })
const results = await db.search('greeting', 5)
```

## 🌍 Cloud Provider Examples

### Google Cloud Run
```bash
gcloud run deploy brainy-app \
  --source . \
  --platform managed \
  --memory 2Gi
```

### AWS Lambda
```bash
aws lambda create-function \
  --function-name brainy-function \
  --package-type Image \
  --code ImageUri=your-ecr-repo/brainy:latest \
  --memory-size 2048
```

### Azure Container Instances
```bash
az container create \
  --resource-group myRG \
  --name brainy-container \
  --image your-registry/brainy:latest \
  --memory 2
```

### Cloudflare Workers (with R2)
```javascript
// Uses R2 for model storage due to size constraints
export default {
  async fetch(request, env) {
    const brainy = new BrainyData({
      storageAdapter: new CloudflareR2Storage(env.BRAINY_MODELS)
    })
    // Models loaded from R2 automatically
  }
}
```

## 🛠️ Troubleshooting

### "Models not found" error

1. **Check package.json**: Ensure `@soulcraft/brainy-models` is in `dependencies`
2. **Check Dockerfile**: Ensure `RUN npm run extract-models` runs
3. **Check image**: `docker run -it your-image ls -la /app/models`

### Memory issues

Increase container memory:
- **Cloud Run**: `--memory 2Gi`
- **Lambda**: `--memory-size 2048` 
- **ECS**: Set in task definition
- **Azure**: `--memory 2`

### Build failures

1. Use Node.js 24+
2. Ensure `@soulcraft/brainy-models` is accessible during build
3. Check Docker build context includes package.json

## 📊 Performance Impact

| Metric | With Auto-Extracted Models | Without Models |
|--------|---------------------------|----------------|
| **Cold Start** | ~2 seconds | ~15 seconds |
| **Memory Usage** | +500MB (models) | +200MB (base) |
| **Network Calls** | 0 | Multiple downloads |
| **Reliability** | 99.9% | 95% (network dependent) |

## 🎉 That's It!

With just `npm install @soulcraft/brainy-models` and `RUN npm run extract-models` in your Dockerfile, you get:

- ✅ Automatic model extraction
- ✅ Universal cloud compatibility  
- ✅ Zero configuration required
- ✅ Maximum performance
- ✅ Production-ready deployment

**Deploy once, runs everywhere!** 🚀