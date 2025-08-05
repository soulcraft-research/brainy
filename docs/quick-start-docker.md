# Docker Quick Start Guide

Get Brainy running in Docker in under 5 minutes with embedded models for maximum performance.

## 🚀 Fastest Start (3 Steps)

### Step 1: Install Models
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
RUN npm run extract-models  # ← Magic happens here
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --omit=optional
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models  # ← Models embedded
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Step 3: Build & Run
```bash
docker build -t brainy-app .
docker run -p 3000:3000 brainy-app
```

**Done!** Your app starts in ~2 seconds with embedded models.

## 📱 Sample Application

Create `server.js`:
```javascript
import express from 'express'
import { BrainyData } from '@soulcraft/brainy'

const app = express()
const port = process.env.PORT || 3000

// Initialize Brainy (models auto-detected from ./models)
const brainy = new BrainyData()
await brainy.init()

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Add data
app.post('/add', async (req, res) => {
  try {
    const { content, metadata } = req.body
    const id = await brainy.add({ content, ...metadata })
    res.json({ id, message: 'Added successfully' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Search
app.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body
    const results = await brainy.search(query, limit)
    res.json({ results, count: results.length })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`🧠 Brainy server running on port ${port}`)
  console.log(`📊 Database: ${brainy.getStatistics().totalVectors} vectors loaded`)
})
```

Package.json dependencies:
```json
{
  "dependencies": {
    "@soulcraft/brainy": "latest",
    "@soulcraft/brainy-models": "latest",
    "express": "^4.18.0"
  },
  "type": "module"
}
```

## ☁️ Deploy to Cloud

### Google Cloud Run
```bash
gcloud run deploy brainy-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --allow-unauthenticated
```

### AWS ECS (via ECR)
```bash
# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker build -t brainy-app .
docker tag brainy-app:latest $ECR_URI:latest
docker push $ECR_URI:latest

# Deploy
aws ecs create-service \
  --cluster brainy-cluster \
  --service-name brainy-service \
  --task-definition brainy-task \
  --desired-count 1
```

### Azure Container Instances
```bash
# Build and push to ACR
az acr build --registry myregistry --image brainy-app .

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name brainy-container \
  --image myregistry.azurecr.io/brainy-app:latest \
  --cpu 1 \
  --memory 2 \
  --ports 3000
```

## 🧪 Test Your Deployment

```bash
# Health check
curl http://localhost:3000/health

# Add some data
curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -d '{"content": "Cats are amazing pets", "category": "animals"}'

curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -d '{"content": "Dogs are loyal companions", "category": "animals"}'

# Search by meaning
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "pet animals", "limit": 5}'
```

Expected response:
```json
{
  "results": [
    {
      "id": "uuid-1",
      "content": "Cats are amazing pets",
      "similarity": 0.89,
      "metadata": {"category": "animals"}
    },
    {
      "id": "uuid-2", 
      "content": "Dogs are loyal companions",
      "similarity": 0.86,
      "metadata": {"category": "animals"}
    }
  ],
  "count": 2
}
```

## 🔍 Verify Model Embedding

Check your Docker logs for these success messages:

✅ **Build time (what you want to see):**
```
[Brainy Model Extractor] ✅ Found @soulcraft/brainy-models package
[Brainy Model Extractor] 📦 Creating models directory...
[Brainy Model Extractor] ✅ Models extracted successfully!
```

✅ **Runtime (what you want to see):**
```
🎯 Auto-detected extracted models at: /app/models
✅ Successfully loaded model from custom directory
   Using custom model path for Docker/production deployment
🧠 Brainy server running on port 3000
```

❌ **If models not found:**
```
⚠️ Local model not found. Falling back to remote model loading.
```

If you see the warning, check:
1. `@soulcraft/brainy-models` is in package.json dependencies
2. `RUN npm run extract-models` is in your Dockerfile
3. `COPY --from=builder /app/models ./models` is present

## 🚨 Troubleshooting

### Container Won't Start
- **Increase memory**: Add `--memory 2g` to docker run
- **Check port**: Ensure PORT environment variable is set
- **Verify models**: `docker run -it your-image ls -la /app/models`

### Slow Startup (15+ seconds)
- Models not embedded properly
- Check build logs for extraction success
- Verify `/app/models` directory exists in container

### Memory Issues
- Brainy + models need ~2GB RAM
- Use multi-stage build to minimize final image size
- Consider using compressed models for memory-constrained environments

## 🎯 Next Steps

- **Production Setup**: See [docs/docker-deployment.md](./docker-deployment.md) for advanced configurations
- **Scaling**: Learn about distributed mode with multiple instances
- **Monitoring**: Add metrics and logging for production monitoring
- **Security**: Implement authentication and rate limiting

## 💡 Pro Tips

1. **Layer Caching**: Put `npm run extract-models` after dependency installation for better Docker layer caching
2. **Security**: Always run as non-root user in production
3. **Health Checks**: Include health check endpoint for load balancers
4. **Graceful Shutdown**: Handle SIGTERM for clean container stops
5. **Resource Limits**: Set memory limits to prevent OOM kills

That's it! You now have a production-ready Brainy application running in Docker with embedded models for maximum performance and reliability. 🎉