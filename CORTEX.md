# Cortex - Command Center for Brainy 🧠

Cortex is a powerful yet simple CLI tool and configuration management system for Brainy. It provides encrypted configuration storage, distributed coordination, and comprehensive database management - all without external dependencies.

## Table of Contents
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Installation](#installation)
- [Configuration Management](#configuration-management)
- [Storage Migration](#storage-migration)
- [Database Operations](#database-operations)
- [Service Integration](#service-integration)
- [Security](#security)
- [Examples](#examples)

## Quick Start

### Initialize Cortex in Your Project
```bash
# Interactive setup (recommended)
npx cortex init

# Or specify storage directly
npx cortex init --storage s3 --bucket my-app-data
```

### Store Configuration (Replaces .env files!)
```bash
# Set individual values
cortex config set DATABASE_URL postgres://localhost/mydb
cortex config set STRIPE_API_KEY sk_live_... --encrypt

# Import from existing .env file
cortex config import .env.production

# List all configurations
cortex config list
```

### Use in Your Application
```javascript
// That's it! One line to load all configs
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData({ storage: { type: 'auto' } })
await brainy.loadEnvironment()  // ← All configs loaded!

// Now all your environment variables are available
console.log(process.env.DATABASE_URL)  // Works!
console.log(process.env.STRIPE_API_KEY)  // Decrypted automatically!
```

## Platform Support

⚠️ **Note**: Cortex is a **Node.js-only** feature. It's designed for server-side applications, CLI tools, and backend services. Browser applications should use their own configuration management strategies.

## Key Features

### 🔐 **Encrypted Configuration Storage**
- Store all your app configs and secrets in Brainy
- AES-256-GCM encryption with master key
- No more .env files to manage or accidentally commit
- Automatic secret detection (keys, tokens, passwords)

### 🌍 **Universal Compatibility**
- Works with ANY storage type (S3, GCS, filesystem, browser)
- Works in ANY environment (Docker, serverless, edge)
- Zero external dependencies for core functionality

### 🔄 **Distributed Coordination**
- Coordinate storage migrations across all services
- Automatic service synchronization
- Gradual migration strategies with rollback

### 📊 **Complete Database Management**
- Query data directly from CLI
- Backup and restore with compression
- Health monitoring and statistics
- Index rebuilding and optimization

## Installation

```bash
# Install Brainy with Cortex
npm install @soulcraft/brainy

# Cortex CLI is automatically available
npx cortex --version
```

## Configuration Management

### Setting Configuration Values

```bash
# Basic configuration
cortex config set API_URL https://api.example.com

# Encrypted secrets (auto-detected or explicit)
cortex config set OPENAI_KEY sk-abc123  # Auto-encrypted (has 'KEY')
cortex config set MY_VALUE "secret" --encrypt  # Explicitly encrypted

# Nested configuration
cortex config set database.host localhost
cortex config set database.port 5432
```

### Environment Management

```bash
# Load configs as environment variables
cortex env

# Export for shell scripts
cortex env --export > .env.local

# In your app, just one line:
await brainy.loadEnvironment()
```

### Multi-Environment Support

```javascript
// Development configs
NODE_ENV=development cortex config set API_URL http://localhost:3000

// Production configs  
NODE_ENV=production cortex config set API_URL https://api.prod.com

// Configs automatically load based on NODE_ENV
```

## Storage Migration

### Migrate to New Storage Provider

```bash
# Plan migration to new storage
cortex migrate --to s3://new-bucket --strategy gradual

# Migration strategies:
# - immediate: Switch all services at once
# - gradual: Test first, then migrate (default)
# - test: Dry run without changes
```

### How Services Coordinate

```javascript
// Services automatically detect migrations
const brainy = new BrainyData({ /* existing config */ })

// This happens automatically, or you can check manually
const coordination = await brainy.checkCoordination()
if (coordination?.migration?.enabled) {
  // Migration executes automatically
}
```

### Supported Storage URLs

```bash
# Amazon S3
cortex migrate --to s3://my-bucket?region=us-west-2

# Google Cloud Storage (S3-compatible)
cortex migrate --to s3://my-gcs-bucket

# Cloudflare R2
cortex migrate --to r2://my-r2-bucket

# Local filesystem
cortex migrate --to file:///var/data/brainy
```

## Database Operations

### Query Data

```bash
# Basic semantic search
cortex query "user:john"
cortex query "AI startups" --limit 20

# Advanced MongoDB-style filtering
cortex query "products" --filter '{"price": {"$lte": 100}, "inStock": true}'
cortex query "users" --filter '{"age": {"$gte": 18, "$lt": 65}}'
cortex query "orders" --filter '{"$and": [{"status": "pending"}, {"total": {"$gt": 1000}}]}'

# Complex queries with multiple operators
cortex query "documents" --filter '{
  "$or": [
    {"priority": "high"},
    {"$and": [
      {"deadline": {"$lte": "2024-12-31"}},
      {"assigned": {"$exists": true}}
    ]}
  ]
}'

# With array operators
cortex query "articles" --filter '{"tags": {"$includes": "AI"}}'
cortex query "products" --filter '{"categories": {"$all": ["electronics", "gaming"]}}'

# Pattern matching
cortex query "users" --filter '{"email": {"$regex": ".*@company.com$"}}'

# Show query execution plan
cortex query "startups" --filter '{"funding": {"$gte": 1000000}}' --explain

# Output as JSON for processing
cortex query "orders" --filter '{"status": "shipped"}' --json | jq '.items'
```

**Supported MongoDB Operators:**
- **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- **Logical**: `$and`, `$or`, `$not`
- **Element**: `$exists`
- **Array**: `$in`, `$nin`, `$includes`, `$all`, `$size`
- **String**: `$regex`

### Backup and Restore

```bash
# Create backup
cortex backup
# Creates: brainy-backup-2025-01-08T10-30-00.json

# Compressed backup
cortex backup --compress
# Creates: brainy-backup-2025-01-08T10-30-00.json.gz

# Restore from backup
cortex restore brainy-backup-2025-01-08T10-30-00.json

# Include configuration in backup
cortex backup --include-config
```

### Monitoring

```bash
# Check system health
cortex health
✅ Cortex: Healthy
✅ Brainy: Connected
✅ Storage: Active (1523 nouns, 4892 verbs)

# View statistics
cortex stats
📊 Brainy Statistics
Nouns: 1,523
Verbs: 4,892
Storage Used: 15.2 MB
Index Size: 2.1 MB

# View cluster status
cortex status
```

### Maintenance

```bash
# Rebuild indexes
cortex reindex --type metadata
cortex reindex --type all

# Inspect specific items
cortex inspect noun:user-123
cortex inspect verb:follows-456

# Force synchronization
cortex sync --force
```

## Service Integration

### Simple Service Setup

**Before Cortex (Complex):**
```javascript
// Had to manage .env files everywhere
require('dotenv').config()

// Manual configuration loading
const config = {
  database: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
  // ... dozens more
}

// Different configs for each environment
if (process.env.NODE_ENV === 'production') {
  // Load different configs
}
```

**With Cortex (Simple):**
```javascript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData({ storage: { type: 'auto' } })
await brainy.loadEnvironment()  // That's it!

// All configs loaded and decrypted automatically
```

### Docker Integration

```dockerfile
# No more copying .env files!
FROM node:20

WORKDIR /app
COPY . .

# Just set the Brainy connection
ENV BRAINY_STORAGE="s3://my-app-data"
ENV CORTEX_MASTER_KEY="${CORTEX_KEY}"

# Configs load automatically when app starts
CMD ["node", "index.js"]
```

### Existing Service Migration

For services like `scout-search`, `github-package`, `bluesky-package`:

```javascript
// 1. Add to your existing service (index.js)
const brainy = new BrainyData({ /* your existing config */ })
await brainy.loadEnvironment()  // ← Add just this line!

// 2. Import your existing .env (one time)
cortex config import .env.production

// 3. Deploy anywhere - configs follow automatically!
```

## Security

### Secret Exposure Considerations

When you call `loadEnvironment()`, secrets are decrypted and loaded into `process.env`. This is **by design** and follows standard practices:

1. **Server-side only** - Cortex only works in Node.js, not browsers
2. **Same as .env files** - No different than using dotenv
3. **Process isolation** - Each process has its own environment
4. **Memory only** - Secrets exist only in RAM, not on disk

**Best Practices:**
- Only call `loadEnvironment()` at startup
- Never log `process.env` entirely
- Use specific env vars: `process.env.API_KEY`
- Clear sensitive vars when done: `delete process.env.SECRET`

### Encryption Details
- **Algorithm**: AES-256-GCM with authentication
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Master Key**: Stored in `.brainy/cortex.key` (keep safe!)

### Best Practices

```bash
# 1. Never commit the master key
echo ".brainy/cortex.key" >> .gitignore

# 2. Use environment variable in production
export CORTEX_MASTER_KEY=$(cat .brainy/cortex.key)

# 3. Rotate keys periodically
cortex security rotate-key

# 4. Audit configuration access
cortex audit --last 7d
```

## Examples

### Complete Application Setup

```bash
# 1. Initialize Cortex
npx cortex init

# 2. Set all your configurations
cortex config set DATABASE_URL postgres://localhost/myapp
cortex config set REDIS_URL redis://localhost:6379
cortex config set JWT_SECRET $(openssl rand -base64 32)
cortex config set STRIPE_KEY sk_live_...
cortex config set OPENAI_KEY sk-...

# 3. In your app
const brainy = new BrainyData({ storage: { type: 'auto' } })
await brainy.loadEnvironment()

// All configs ready to use!
```

### Multi-Service Coordination

```javascript
// Service A: Create migration plan
await brainy.coordinateStorageMigration({
  newStorage: { 
    type: 's3', 
    bucket: 'new-bucket',
    region: 'us-west-2'
  },
  strategy: 'gradual'
})

// Service B, C, D: Automatically detect and migrate
// No code changes needed - they follow automatically!
```

### Interactive Shell

```bash
# Start interactive mode
cortex shell

cortex> query user:john
┌──────────────┬─────────┬───────┐
│ ID           │ Type    │ Score │
├──────────────┼─────────┼───────┤
│ user:john    │ user    │ 1.000 │
│ user:johnny  │ user    │ 0.923 │
└──────────────┴─────────┴───────┘

cortex> set api.endpoint https://api.v2.example.com
✅ Set api.endpoint

cortex> stats
Nouns: 1,523
Verbs: 4,892

cortex> exit
```

### CI/CD Integration

```yaml
# GitHub Actions
name: Deploy
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Cortex
        run: |
          npm install @soulcraft/brainy
          export CORTEX_MASTER_KEY=${{ secrets.CORTEX_MASTER_KEY }}
          
      - name: Deploy
        run: |
          # Configs loaded automatically from Brainy
          npm run deploy
```

## Advanced Features

### Gradual Migration Example

```javascript
// Phase 1: Dual writes (test new storage)
await brainy.coordinateStorageMigration({
  newStorage: { type: 's3', bucket: 'new-bucket' },
  strategy: 'gradual'
})

// Phase 2: Monitor both storages
cortex status  // Shows migration progress

// Phase 3: Complete migration
cortex migrate --complete

// Phase 4: Cleanup old storage (optional)
cortex migrate --cleanup-old
```

### Custom Coordination Patterns

```javascript
// Beyond storage migration - coordinate any distributed change
await brainy.addNoun({
  id: '_system/feature-flags',
  type: 'cortex_coordination',
  metadata: {
    newPaymentSystem: true,
    maintenanceMode: false,
    apiVersion: 'v2'
  }
})

// All services check and adapt
const flags = await brainy.getNoun('_system/feature-flags')
if (flags.metadata.newPaymentSystem) {
  // Use new payment flow
}
```

## Troubleshooting

### Common Issues

**Cortex not initialized:**
```bash
cortex status
# If not initialized:
cortex init
```

**Lost master key:**
```bash
# If you have backups with --include-config
cortex restore backup.json --recover-key
```

**Migration stuck:**
```bash
# Check status
cortex status

# Force rollback if needed
cortex migrate --rollback
```

## Summary

Cortex transforms Brainy into a complete configuration and coordination system:

- ✅ **No more .env files** - Everything stored encrypted in Brainy
- ✅ **No more deployment complexity** - Configs follow your app everywhere  
- ✅ **No more manual coordination** - Services sync automatically
- ✅ **No external dependencies** - Uses Brainy's existing storage
- ✅ **Works everywhere** - Any environment, any storage type

Start with `npx cortex init` and never worry about configuration management again! 🚀