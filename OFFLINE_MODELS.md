# Offline Models

Brainy uses Transformers.js with ONNX Runtime for **true offline operation** - no more TensorFlow.js dependency hell!

## How it works

Brainy automatically figures out the best approach:

1. **First use**: Downloads models once (~87 MB) to local cache
2. **Subsequent use**: Loads from cache (completely offline, zero network calls)  
3. **Smart detection**: Automatically finds models in cache, bundled, or downloads as needed

## Standard usage

```bash
npm install @soulcraft/brainy
# Use immediately - models download automatically on first use
```

## Docker with production egress restrictions

For environments where production has no internet but build does:

```dockerfile
FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm install @soulcraft/brainy
RUN npm run download-models  # Download during build (when internet available)
COPY . .
# Production container now works completely offline
```

## Development with immediate offline

If you want models available immediately for development:

```bash
npm install @soulcraft/brainy
npm run download-models  # Optional: download now instead of on first use
```

## Key benefits vs TensorFlow.js

- ✅ **95% smaller package** - 643 kB vs 12.5 MB  
- ✅ **84% smaller models** - 87 MB vs 525 MB
- ✅ **True offline** - Zero network calls after initial download
- ✅ **No dependency issues** - 5 deps vs 47+, no more --legacy-peer-deps
- ✅ **Better performance** - ONNX Runtime beats TensorFlow.js
- ✅ **Same API** - Drop-in replacement

## Philosophy

**Install and use. Brainy handles the rest.**

No configuration files, no environment variables, no complex setup. Brainy detects your environment and does the right thing automatically.