# Installation Guide

This guide covers installing Brainy and setting up your development environment.

## 📦 Package Installation

### Core Package

```bash
npm install @soulcraft/brainy
```

The core package includes everything you need:
- ✅ Vector database with HNSW indexing
- ✅ Auto-configuration and optimization
- ✅ All storage adapters (Memory, FileSystem, OPFS, S3)
- ✅ TensorFlow.js integration
- ✅ Cross-environment compatibility

### Optional Packages

#### CLI Tools

```bash
npm install -g @soulcraft/brainy-cli
```

Command-line interface for:
- Database management
- Bulk operations  
- Performance testing
- Data visualization

#### Web Service

```bash
npm install @soulcraft/brainy-web-service
```

REST API wrapper for:
- HTTP endpoints
- Remote database access
- Microservice integration

## 🌐 Environment Requirements

### Node.js

- **Minimum**: Node.js 24.4.0+
- **Recommended**: Node.js 20+ or latest LTS
- **Package Manager**: npm, yarn, or pnpm

```bash
node --version  # Should be 24.4.0+
npm --version   # Any recent version
```

### Browser

Modern browsers with ES Modules support:
- **Chrome**: 86+
- **Edge**: 86+
- **Opera**: 72+
- **Firefox**: 78+
- **Safari**: 14+

#### Optional Browser Features

- **OPFS Support**: For persistent storage (Chrome 86+, Edge 86+)
- **Web Workers**: For parallel processing (all modern browsers)
- **WebGL**: For GPU acceleration (most modern browsers)

### Memory Requirements

| Use Case | Minimum RAM | Recommended RAM |
|----------|-------------|-----------------|
| Development | 512MB | 2GB |
| Small datasets (<10k vectors) | 1GB | 4GB |
| Medium datasets (<100k vectors) | 2GB | 8GB |
| Large datasets (1M+ vectors) | 4GB | 16GB+ |

### Storage Requirements

| Dataset Size | Minimum Storage | Recommended Storage |
|-------------|-----------------|-------------------|
| <10k vectors | 100MB | 500MB |
| <100k vectors | 1GB | 5GB |
| <1M vectors | 10GB | 50GB |
| 1M+ vectors | 50GB+ | Dataset size × 3 |

## ✅ Installation Verification

### Basic Verification

```typescript
import { BrainyData } from '@soulcraft/brainy'

console.log('Brainy installed successfully!')

// Test auto-configuration
import { createAutoBrainy } from '@soulcraft/brainy'
const brainy = createAutoBrainy()
console.log('Auto-configuration works!')
```

### Environment Detection Test

```typescript
import { environment } from '@soulcraft/brainy'

console.log(`Environment: ${
  environment.isBrowser ? 'Browser' :
  environment.isNode ? 'Node.js' :
  'Unknown'
}`)

console.log(`Threading available: ${environment.isThreadingAvailable()}`)
```

### Storage Test

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()

// Add a test vector
await brainy.addVector({ 
  id: 'test-1', 
  vector: [0.1, 0.2, 0.3], 
  text: 'Installation test' 
})

// Search for it
const results = await brainy.search([0.1, 0.2, 0.3], 1)
console.log('Storage test passed:', results.length > 0)
```

## 🔧 Development Setup

### TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022", "DOM", "WebWorker"],
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Bundler Configuration

#### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    include: ['@soulcraft/brainy']
  },
  define: {
    global: 'globalThis'
  }
})
```

#### Webpack

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
}
```

#### Rollup

```javascript
// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { nodePolyfills } from 'rollup-plugin-polyfill-node'

export default {
  plugins: [
    nodePolyfills(),
    nodeResolve({ browser: true, preferBuiltins: false })
  ]
}
```

## 🚀 Production Setup

### Environment Variables

For S3 storage in production:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Optional S3 Configuration
S3_BUCKET_NAME=your-vector-storage
S3_ENDPOINT=https://s3.amazonaws.com
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

# Set memory limit for large datasets
ENV NODE_OPTIONS="--max-old-space-size=8192"

CMD ["node", "index.js"]
```

### Performance Optimizations

```typescript
// Production configuration
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy({
  // S3 storage for persistence
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.AWS_REGION
})

// System auto-configures based on:
// - Available memory
// - CPU cores  
// - Dataset size
// - Environment type
```

## 🔍 Troubleshooting

### Common Issues

#### "Module not found" errors

**Solution**: Ensure your bundler is configured for ES modules:

```json
{
  "type": "module"
}
```

#### Out of memory errors

**Solution**: Increase Node.js memory limit:

```bash
node --max-old-space-size=8192 your-script.js
```

#### TensorFlow.js loading issues

**Solution**: The auto-patcher handles this, but if needed:

```typescript
import '@soulcraft/brainy/setup'  // Import before other modules
import { BrainyData } from '@soulcraft/brainy'
```

#### Browser compatibility issues

**Solution**: Check browser requirements and enable feature detection:

```typescript
import { environment } from '@soulcraft/brainy'

if (!environment.isBrowser) {
  console.error('This app requires a modern browser')
}
```

### Getting Help

- 📚 [Troubleshooting Guide](../troubleshooting/)
- 🐛 [GitHub Issues](https://github.com/soulcraftlabs/brainy/issues)
- 💬 [GitHub Discussions](https://github.com/soulcraftlabs/brainy/discussions)

## ✅ Next Steps

Once installation is complete:

1. **[Quick Start Guide](quick-start.md)** - Your first Brainy app
2. **[Environment Setup](environment-setup.md)** - Optimize your environment  
3. **[First Steps](first-steps.md)** - Learn core concepts