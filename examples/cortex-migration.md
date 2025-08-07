# Migrating Existing Services to Cortex

This guide shows how to migrate your existing services (scout-search, github-package, bluesky-package, cross-platform-linker) to use Cortex for configuration management.

## Benefits of Migration

- ✅ **No more .env files** to manage or accidentally commit
- ✅ **Encrypted secrets** stored securely in Brainy
- ✅ **Single source of truth** for all configurations
- ✅ **Automatic deployment** - configs follow your app
- ✅ **Version controlled** configs with audit trail

## Step 1: Initialize Cortex

First, set up Cortex with your existing Brainy storage:

```bash
# In your project root
npx cortex init

# Choose your existing storage type (S3, etc)
# This creates .brainy/cortex.json and .brainy/cortex.key
```

## Step 2: Import Existing Configuration

### Option A: Import from .env file
```bash
# Import all your existing environment variables
cortex config import .env
cortex config import .env.production

# Cortex automatically encrypts sensitive values (keys, tokens, passwords)
```

### Option B: Set manually with encryption
```bash
# For scout-search
cortex config set OPENAI_API_KEY sk-... --encrypt
cortex config set DATABASE_URL postgres://... --encrypt
cortex config set PORT 8080

# For github-package  
cortex config set GITHUB_TOKEN ghp_... --encrypt
cortex config set GITHUB_API_URL https://api.github.com

# For bluesky-package
cortex config set BLUESKY_HANDLE alice.bsky.social
cortex config set BLUESKY_PASSWORD ... --encrypt
cortex config set BLUESKY_SERVICE wss://bsky.social

# For cross-platform-linker
cortex config set SERVICES.github https://github-package.run.app
cortex config set SERVICES.bluesky https://bluesky-package.run.app
cortex config set SERVICES.scout https://scout-search.run.app
```

## Step 3: Update Your Service Code

The migration requires **only ONE line** of code change:

### scout-search/src/index.js
```javascript
// Before
import { BrainyData } from '@soulcraft/brainy'
import dotenv from 'dotenv'

dotenv.config()  // ← Remove this

const brainy = new BrainyData({
  storage: {
    type: 's3',
    bucket: process.env.S3_BUCKET,  // Still works!
    // ...
  }
})

// After - Add just this line
await brainy.loadEnvironment()  // ← ADD THIS LINE

// All your process.env variables are now loaded from Cortex!
console.log(process.env.OPENAI_API_KEY)  // Works, decrypted automatically!
```

### github-package/index.js
```javascript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData({ /* your config */ })

// Add this ONE line at startup
await brainy.loadEnvironment()

// Now all configs are available
const githubToken = process.env.GITHUB_TOKEN  // Decrypted automatically!
const apiUrl = process.env.GITHUB_API_URL
```

### bluesky-package/src/index.ts
```typescript
import { BrainyData } from '@soulcraft/brainy'

export class BlueskyPackage {
  async init() {
    const brainy = new BrainyData({ /* config */ })
    
    // Load all configurations
    await brainy.loadEnvironment()
    
    // Use as normal
    this.handle = process.env.BLUESKY_HANDLE
    this.password = process.env.BLUESKY_PASSWORD  // Decrypted!
  }
}
```

## Step 4: Update Deployment Configuration

### Docker
```dockerfile
# Before - Complex env management
FROM node:20
COPY .env.production .env  # ← Remove this
ENV AWS_ACCESS_KEY_ID=...   # ← Remove these
ENV AWS_SECRET_ACCESS_KEY=...

# After - Simple and secure
FROM node:20
ENV BRAINY_STORAGE=s3://my-app-data
ENV CORTEX_MASTER_KEY=${CORTEX_KEY}  # From CI/CD secrets
# That's it! All other configs loaded from Brainy
```

### Google Cloud Run
```yaml
# Before - Many environment variables
env:
  - name: DATABASE_URL
    value: postgres://...
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: openai-key
  # ... many more

# After - Just two!
env:
  - name: BRAINY_STORAGE
    value: s3://my-app-data
  - name: CORTEX_MASTER_KEY
    valueFrom:
      secretKeyRef:
        name: cortex-key
```

### GitHub Actions
```yaml
# Before
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_KEY: ${{ secrets.STRIPE_KEY }}
  OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
  # ... dozens more

# After
env:
  CORTEX_MASTER_KEY: ${{ secrets.CORTEX_MASTER_KEY }}
  # That's it!
```

## Step 5: Gradual Migration Strategy

You can migrate gradually without breaking existing deployments:

```javascript
// Support both old and new config methods during transition
async function loadConfig() {
  const brainy = new BrainyData({ /* config */ })
  
  try {
    // Try loading from Cortex first
    await brainy.loadEnvironment()
    console.log('✅ Configs loaded from Cortex')
  } catch (error) {
    // Fall back to .env if Cortex not configured
    console.log('📁 Using .env file (legacy)')
    require('dotenv').config()
  }
}
```

## Step 6: Coordinate Multi-Service Updates

When you need to update configuration across all services:

```bash
# Update a config value
cortex config set API_VERSION v2

# All services automatically get the update!
# No need to redeploy or restart
```

For storage migration across all services:

```bash
# Coordinate migration to new storage
cortex migrate --to s3://new-bucket --strategy gradual

# All services (scout-search, github-package, etc) 
# automatically detect and migrate!
```

## Complete Migration Example

Here's a complete migration for scout-search:

### 1. Setup Cortex
```bash
cd ~/Projects/scout-search
npx cortex init
# Choose S3, enter bucket details
```

### 2. Import existing config
```bash
cortex config import .env.production
```

### 3. Update code (src/index.js)
```javascript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData({
  storage: { type: 'auto' }  // Auto-detect from Cortex
})

// Add this line
await brainy.loadEnvironment()

// Everything else stays the same!
const app = express()
app.listen(process.env.PORT || 8080)
```

### 4. Update Dockerfile
```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
ENV CORTEX_MASTER_KEY=${CORTEX_KEY}
CMD ["node", "src/index.js"]
```

### 5. Deploy
```bash
# Build and deploy as normal
docker build -t scout-search .
docker run -e CORTEX_MASTER_KEY=$CORTEX_KEY scout-search

# Or to Cloud Run
gcloud run deploy scout-search \
  --set-env-vars="CORTEX_MASTER_KEY=$CORTEX_KEY"
```

## Rollback Plan

If you need to rollback:

1. **Keep .env files** during transition (don't delete yet)
2. **Use gradual approach** shown in Step 5
3. **Test in staging** before production
4. **Backup configs**: `cortex backup --include-config`

## Security Best Practices

1. **Never commit** `.brainy/cortex.key`
2. **Store master key** in CI/CD secrets
3. **Rotate periodically**: `cortex security rotate-key`
4. **Audit access**: `cortex audit --last 30d`

## Troubleshooting

### Configs not loading?
```bash
# Check Cortex status
cortex status

# Verify configs are set
cortex config list

# Test loading
cortex env
```

### Lost master key?
```bash
# If you have a backup with configs
cortex restore backup.json --recover-key
```

### Service can't connect?
```javascript
// Add debug logging
const brainy = new BrainyData({ /* config */ })
try {
  await brainy.loadEnvironment()
  console.log('Cortex configs loaded:', Object.keys(process.env).length)
} catch (error) {
  console.error('Cortex error:', error)
}
```

## Summary

Migration is simple:
1. `npx cortex init` - One time setup
2. `cortex config import .env` - Import existing configs
3. `await brainy.loadEnvironment()` - Add one line to your code
4. Deploy with just `CORTEX_MASTER_KEY` - No more env variable sprawl

Your services are now using encrypted, centralized configuration management with zero external dependencies! 🎉