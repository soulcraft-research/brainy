# 🚫 No Configuration Required

Brainy follows a **zero-configuration philosophy**. We automatically detect and adapt to your environment.

## How It Works

### 🔐 API Keys & Secrets
**Never put keys in files!** Brainy automatically detects credentials from:
1. **System Keychains** - macOS Keychain, Windows Credential Manager, Linux Secret Service
2. **Cloud IAM** - AWS IAM roles, Google Cloud Service Accounts, Azure Managed Identity  
3. **Secure Prompts** - Asked once, stored securely (never in plaintext)

```javascript
// Just use brainy - it will find credentials securely
const brain = new BrainyVectorDB()
await brain.connect() // Auto-detects everything
```

### 🌍 Environment Detection
Brainy automatically detects:
- Browser vs Node.js vs Serverless
- Available memory and CPU cores
- Storage backends (filesystem, S3, browser storage)
- Network endpoints and services

### 🎯 Smart Defaults
Based on your environment, Brainy automatically configures:
- Memory limits (50% of available)
- Cache sizes (adaptive to usage)
- Batch sizes (based on latency)
- Compression (when beneficial)

## When You DO Need Configuration

For advanced use cases only:

### Secure Credential Storage

```bash
# macOS
security add-generic-password -s brainy-api -a user -w YOUR_KEY

# Linux
secret-tool store --label="Brainy API" service brainy-api

# Windows
cmdkey /generic:brainy-api /user:user /pass:YOUR_KEY
```

### Programmatic Override

```javascript
const brain = new BrainyVectorDB({
  // Only override if you know better than auto-detection
  storage: 's3://my-bucket',
  memory: '2GB'
})
```

## Philosophy

> "The best configuration is no configuration. Software should be smart enough to figure out what you need."

Brainy detects, adapts, and optimizes automatically. If you find yourself needing configuration, we've failed - please open an issue!

## Security Without .env

Traditional `.env` files are security theater:
- ❌ Get committed accidentally  
- ❌ Sit in plaintext on disk
- ❌ Copied around carelessly
- ❌ Different for every environment

Brainy's approach:
- ✅ Never store secrets in files
- ✅ Use OS-level secure storage
- ✅ Detect cloud IAM automatically
- ✅ Adapt to environment dynamically

## Examples

### Local Development
```javascript
const brain = new BrainyVectorDB()
// Detects: Node.js, 16GB RAM, filesystem storage
// Auto-configures: 8GB memory limit, disk-backed cache
```

### Browser
```javascript
const brain = new BrainyVectorDB()  
// Detects: Browser, 4GB available, IndexedDB
// Auto-configures: 2GB limit, OPFS storage, WebWorker processing
```

### AWS Lambda
```javascript
const brain = new BrainyVectorDB()
// Detects: Lambda, 3GB RAM, S3 access
// Auto-configures: 2.5GB limit, S3 storage, credential from IAM role
```

### Cloudflare Worker
```javascript
const brain = new BrainyVectorDB()
// Detects: Worker, 128MB limit, KV available
// Auto-configures: 100MB limit, KV storage, edge caching
```

## No Configuration Needed

Just use Brainy. It figures out the rest.