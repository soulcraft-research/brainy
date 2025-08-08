# Cortex - Complete Command Center for Brainy 🧠

> **From Zero to Smart in One Command**

Cortex is Brainy's powerful CLI that lets you manage, migrate, search, explore, and literally talk to your data - all from your terminal.

## Table of Contents
- [Quick Start](#quick-start)
- [Talk to Your Data](#talk-to-your-data)
- [Advanced Search](#advanced-search)
- [Graph Exploration](#graph-exploration)
- [Configuration Management](#configuration-management)
- [Storage Migration](#storage-migration)
- [Complete Command Reference](#complete-command-reference)

## Quick Start

### Installation
```bash
npm install @soulcraft/brainy
npx cortex init  # Interactive setup
```

### Initialize Cortex
```bash
npx cortex init

# You'll be prompted for:
# - Storage type (filesystem, S3, GCS, memory)
# - Encryption for secrets (recommended)
# - Chat capabilities (optional LLM)
```

## Talk to Your Data

### Interactive Chat Mode
```bash
cortex chat
# Starts interactive conversation with your data
# Works without LLM (template-based) or with LLM (Claude, GPT-4, etc.)

cortex chat "What are the trends in our user data?"
# Single question mode
```

### Configure LLM (Optional)
```bash
# Store API keys securely
cortex config set ANTHROPIC_API_KEY sk-ant-... --encrypt
cortex config set OPENAI_API_KEY sk-... --encrypt

# Chat will automatically use available LLM
cortex chat "Analyze our Q4 performance"
```

## Advanced Search

### MongoDB-Style Queries
```bash
# Basic search
cortex search "machine learning"

# With metadata filters
cortex search "startups" --filter '{"funding": {"$gte": 1000000}}'

# Complex filters
cortex search "users" --filter '{
  "age": {"$gte": 18, "$lte": 65},
  "status": {"$in": ["active", "premium"]},
  "country": {"$ne": "US"}
}'
```

### MongoDB Operators Supported
- `$eq` - Equals
- `$ne` - Not equals
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$lt` - Less than
- `$lte` - Less than or equal
- `$in` - In array
- `$nin` - Not in array
- `$exists` - Field exists
- `$regex` - Regular expression match

### Graph Traversal in Search
```bash
# Search with relationship traversal
cortex search "John" --verbs "knows,works_with" --depth 2

# Find all products liked by users who follow influencers
cortex search "influencer" --verbs "followed_by" --depth 1 | \
cortex search --verbs "likes" --filter '{"type": "product"}'
```

### Interactive Advanced Search
```bash
cortex search-advanced
# Interactive prompts for:
# - Query text
# - MongoDB-style filters
# - Graph traversal options
# - Result limits
```

## Graph Exploration

### Add Relationships (Verbs)
```bash
# Basic relationship
cortex verb user-123 likes product-456

# With metadata
cortex verb company-A invests_in startup-B --metadata '{
  "amount": 5000000,
  "date": "2024-01-15",
  "round": "Series A"
}'

# Bulk relationships
cortex verb john knows jane
cortex verb john works_at company-123
cortex verb john lives_in city-sf
```

### Interactive Graph Explorer
```bash
cortex explore user-123
# Opens interactive graph navigation:
# - View node details and metadata
# - See all connections
# - Navigate to connected nodes
# - Add new connections
# - Find similar nodes

cortex graph  # Alias for explore
```

### Graph Patterns
```bash
# Social network
cortex verb user-1 follows user-2
cortex verb user-1 likes post-123
cortex verb post-123 tagged_with ai

# Knowledge graph
cortex verb article-1 references paper-2
cortex verb paper-2 authored_by researcher-3
cortex verb researcher-3 works_at university-4

# E-commerce
cortex verb customer-1 purchased product-2
cortex verb product-2 belongs_to category-3
cortex verb customer-1 reviewed product-2
```

## Configuration Management

### Secure Configuration Storage
```bash
# Set configuration (auto-encrypts secrets)
cortex config set DATABASE_URL postgres://localhost/mydb
cortex config set STRIPE_KEY sk_live_... --encrypt
cortex config set API_ENDPOINT https://api.example.com

# Get configuration
cortex config get DATABASE_URL

# List all configuration
cortex config list

# Import from .env file
cortex config import .env.production
```

### Use in Your Application
```javascript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()
await brainy.loadEnvironment()  // Loads all Cortex configs

// All configs are now in process.env
console.log(process.env.DATABASE_URL)  // Automatically decrypted
```

## Storage Migration

### Migrate Between Storage Providers
```bash
# Migrate from filesystem to S3
cortex migrate --to s3 --bucket my-production-data

# Migrate from S3 to GCS
cortex migrate --to gcs --bucket my-gcs-bucket

# Migration strategies
cortex migrate --to s3 --bucket new-bucket --strategy gradual
# gradual: Migrate in batches with verification
# immediate: Migrate all at once
```

### Zero-Downtime Migration
```javascript
// Your app code doesn't change!
const brainy = new BrainyData()  // Auto-detects new storage
await brainy.init()  // Works with any storage
```

## Data Management

### Add Data
```bash
# Simple add
cortex add "John is a software engineer"

# With metadata
cortex add "New product launch" --metadata '{
  "type": "event",
  "date": "2024-02-01",
  "priority": "high"
}'

# With custom ID
cortex add "Important document" --id doc-123
```

### Search Data
```bash
# Basic search
cortex search "similar to this"

# Limit results
cortex search "products" --limit 20

# Combined with filters
cortex search "laptops" --filter '{"price": {"$lte": 1500}}'
```

### Database Operations
```bash
# View statistics
cortex stats

# Create backup
cortex backup --output backup.json --compress

# Restore from backup
cortex restore backup.json

# Health check
cortex health

# Interactive shell
cortex shell  # or cortex repl
```

## Complete Command Reference

### Core Commands
| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize Cortex | `cortex init` |
| `chat [question]` | Talk to your data | `cortex chat "What's trending?"` |
| `search <query>` | Search with advanced options | `cortex search "AI" --filter '{"year": 2024}'` |
| `add [data]` | Add data to Brainy | `cortex add "New data" --metadata '{"type": "doc"}'` |

### Graph Commands
| Command | Description | Example |
|---------|-------------|---------|
| `verb <subject> <verb> <object>` | Add relationship | `cortex verb user-1 likes product-2` |
| `explore [nodeId]` | Interactive graph explorer | `cortex explore user-123` |
| `graph` | Alias for explore | `cortex graph` |

### Configuration Commands
| Command | Description | Example |
|---------|-------------|---------|
| `config set <key> <value>` | Set configuration | `cortex config set API_KEY sk-123 --encrypt` |
| `config get <key>` | Get configuration | `cortex config get API_KEY` |
| `config list` | List all configuration | `cortex config list` |
| `config import <file>` | Import from .env | `cortex config import .env` |

### Management Commands
| Command | Description | Example |
|---------|-------------|---------|
| `migrate` | Migrate storage | `cortex migrate --to s3 --bucket prod` |
| `stats` | Show statistics | `cortex stats` |
| `backup` | Create backup | `cortex backup --compress` |
| `restore <file>` | Restore from backup | `cortex restore backup.json` |
| `health` | Health check | `cortex health` |
| `shell` | Interactive shell | `cortex shell` |

## Advanced Examples

### Building a Knowledge Graph
```bash
# Add entities
cortex add "Artificial Intelligence" --id ai
cortex add "Machine Learning" --id ml
cortex add "Deep Learning" --id dl
cortex add "Neural Networks" --id nn

# Add relationships
cortex verb ml is_subset_of ai
cortex verb dl is_subset_of ml
cortex verb nn powers dl

# Explore the graph
cortex explore ai
```

### Customer Analytics Pipeline
```bash
# Import customer data
cortex add "Premium customer" --metadata '{"tier": "gold", "mrr": 500}'

# Find similar customers
cortex search "premium" --filter '{"mrr": {"$gte": 100}}'

# Add behavior tracking
cortex verb customer-123 viewed product-456
cortex verb customer-123 purchased product-789

# Analyze patterns
cortex chat "What products are viewed together?"
```

### Multi-Service Configuration
```bash
# Dev environment
cortex config set DATABASE_URL postgres://localhost/dev
cortex config set REDIS_URL redis://localhost:6379
cortex config set NODE_ENV development

# Production (encrypted)
cortex config set PROD_DB_URL postgres://prod/db --encrypt
cortex config set STRIPE_KEY sk_live_xxx --encrypt
cortex config set JWT_SECRET xxx --encrypt

# Export for deployment
cortex config list > configs.json
```

## Tips and Best Practices

### 1. Start with Chat
Begin by talking to your data to understand patterns:
```bash
cortex chat
> "Show me the most connected nodes"
> "What patterns exist in user behavior?"
> "Find anomalies in the data"
```

### 2. Use Graph for Relationships
Model your domain with verbs:
```bash
# Instead of nested JSON, use graph relationships
cortex verb user-1 owns account-1
cortex verb account-1 contains transaction-1
cortex verb transaction-1 paid_to merchant-1
```

### 3. Combine Search Types
Vector + Graph + Filters = Powerful queries:
```bash
cortex search "fraud" \
  --verbs "transacted_with,connected_to" \
  --filter '{"risk_score": {"$gte": 0.7}}' \
  --depth 2
```

### 4. Secure Secrets
Always encrypt sensitive data:
```bash
cortex config set API_KEY value --encrypt
cortex config set PASSWORD value --encrypt
cortex config set SECRET value --encrypt
```

### 5. Interactive Exploration
Use interactive modes for discovery:
```bash
cortex search-advanced  # Guided search
cortex explore         # Graph navigation
cortex chat           # Conversational interface
```

## Platform Support

⚠️ **Note**: Cortex is a **Node.js-only** feature designed for:
- Server-side applications
- CLI tools and scripts
- Backend services
- Development environments

Browser applications should use the Brainy JavaScript API directly.

## Troubleshooting

### Common Issues

**Cortex not found**
```bash
npm install -g @soulcraft/brainy
# or use npx
npx cortex init
```

**Permission denied**
```bash
chmod +x node_modules/.bin/cortex
```

**Storage migration fails**
```bash
# Check credentials
cortex config get AWS_ACCESS_KEY_ID
# Verify bucket exists
aws s3 ls s3://your-bucket
```

**Chat not working**
```bash
# Check LLM configuration
cortex config get ANTHROPIC_API_KEY
# Test without LLM
cortex chat  # Works with templates
```

## Coming Soon

- **Backup/Restore**: Full database backup and restore
- **Health Monitoring**: Real-time health checks and alerts
- **Batch Operations**: Bulk import/export
- **Query Builder**: Visual query builder
- **Webhooks**: Event-driven notifications
- **Scheduled Tasks**: Cron-like task scheduling

---

**Need help?** Check our [main documentation](../README.md) or [open an issue](https://github.com/soulcraft/brainy/issues)