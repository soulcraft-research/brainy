# Brainy CLI 1.0 - Unified Command Interface 🧠

> **One CLI, All the Power - Simplified from 40+ commands to 9**

The Brainy 1.0 CLI provides a clean, unified interface to manage your intelligent database. Every command follows the same unified philosophy as the API.

## 🎯 What's New in CLI 1.0

### **Before (0.x): Command Chaos**
```bash
brainy add-smart "data"
brainy add-vector --literal "text" 
brainy search-similar "query"
brainy neural-import data.csv
# ... 40+ different commands
```

### **After (1.0): Unified Simplicity** 
```bash
brainy add "data"              # Smart by default
brainy search "query"          # Unified search
brainy import data.csv         # Neural import built-in
# Just 9 unified methods total
```

## ⚡ Quick Start

### Installation
```bash
npm install @soulcraft/brainy@rc
```

### Initialize Your Brain
```bash
brainy init

# Interactive setup prompts:
# ✓ Storage type (memory, filesystem, S3)
# ✓ Encryption (recommended for sensitive data)
# ✓ Performance tier (small, medium, large, enterprise)
```

## 🧠 The 9 Unified Methods

### 1. `brainy add` - Smart Data Addition
```bash
# Smart mode (auto-detects and processes)
brainy add "Satya Nadella became CEO of Microsoft in 2014"

# With metadata
brainy add "Customer feedback" --metadata '{"rating": 5, "source": "survey"}'

# Encrypted storage  
brainy add "Sensitive data" --encrypt

# Literal mode (bypass AI processing)
brainy add "Raw text data" --literal
```

### 2. `brainy search` - Triple-Power Unified Search
```bash
# 🎯 Vector/Semantic search
brainy search "tech companies and their leaders" 

# 🔍 Metadata/Facet search with MongoDB operators
brainy search "" --filter '{"rating": {"$gte": 4}, "department": "Engineering"}'

# 🕸️ Graph traversal with relationships
brainy search "project teams" --include-relationships

# ⚡ TRIPLE POWER: All three combined!
brainy search "engineering leaders" --filter '{"level": {"$gte": 7}}' --include-relationships

# Limit results and include metadata
brainy search "AI projects" --limit 5 --include-metadata
```

### 3. `brainy import` - Bulk Data Import
```bash
# CSV with automatic structure detection
brainy import data.csv

# JSON files 
brainy import documents.json --batch-size 100

# With neural processing (detects entities and relationships)
brainy import data.csv --neural

# Preview mode (analyze without importing)
brainy import data.csv --preview-only
```

### 4. `brainy update` - Smart Updates
```bash
# Update by ID
brainy update abc123 "Updated content"

# Update with new metadata
brainy update abc123 --metadata '{"status": "processed"}'

# Batch updates
brainy update --query "old content" --replace "new content"
```

### 5. `brainy delete` - Smart Deletion
```bash
# Soft delete (default - preserves indexes)
brainy delete abc123

# Hard delete (permanent removal)
brainy delete abc123 --hard

# Delete by query
brainy delete --query "outdated content" --confirm
```

### 6. `brainy export` - Export Your Data
```bash
# Export to JSON
brainy export --format json --output backup.json

# Export with filters
brainy export --format csv --filter '{"type": "person"}' --output people.csv

# Export with relationships
brainy export --include-relationships --output full-backup.json
```

### 7. `brainy add-noun` - Create Typed Entities
```bash
# Add people with metadata
brainy add-noun "Sarah Johnson" --type Person --metadata '{"role": "CTO", "level": 9}'

# Add organizations
brainy add-noun "SoulCraft Labs" --type Organization --metadata '{"industry": "AI"}'

# Add projects with rich metadata  
brainy add-noun "AI Platform" --type Project --metadata '{"status": "active", "budget": 500000}'
```

### 8. `brainy add-verb` - Create Relationships
```bash  
# Connect entities with relationships
brainy add-verb person_123 org_456 --type WorksFor --metadata '{"since": "2023-01-01"}'

# Project relationships
brainy add-verb person_123 project_789 --type LeadsProject

# Any relationship type
brainy add-verb entity_1 entity_2 --type CustomRelation --metadata '{"strength": 0.9}'
```

### 9. `brainy augment` - Extend Your Brain  
```bash
# List all augmentations
brainy augment list

# Enable/disable augmentations
brainy augment enable sentiment-analyzer
brainy augment disable sentiment-analyzer

# Install community augmentations (future)
brainy augment install brainy-sentiment
```

## 🎮 Interactive Commands

### `brainy chat` - Talk to Your Data
```bash
# Start interactive chat session
brainy chat

# Single question mode
brainy chat "What projects is Sarah working on?"

# With specific AI provider
brainy chat --provider anthropic "Analyze customer sentiment trends"

# Export conversation
brainy chat --export-session conversation.md
```

### `brainy status` - System Overview
```bash
# Complete system status
brainy status

# Per-service breakdown
brainy status --detailed

# Performance metrics
brainy status --metrics

# Storage utilization
brainy status --storage
```

## ⚙️ Configuration & Management

### `brainy config` - Configuration Management
```bash
# View current configuration
brainy config show

# Set configuration values
brainy config set storage.type filesystem
brainy config set ai.provider openai

# Encrypted configuration
brainy config set api_key "secret-key" --encrypt

# Reset to defaults
brainy config reset
```

## 🔍 Advanced Examples

### Entity and Relationship Management
```bash
# Create a complete knowledge graph
brainy add-noun "SoulCraft Labs" --type Organization
brainy add-noun "Brainy Database" --type Product  
brainy add-noun "Sarah Johnson" --type Person

# Connect them with relationships
brainy add-verb org_soulcraft_123 product_brainy_456 --type Creates
brainy add-verb person_sarah_789 org_soulcraft_123 --type WorksFor --metadata '{
  "position": "CTO",
  "start_date": "2023-06-01"
}'

# Query the graph
brainy search "SoulCraft team members" --include-relationships
```

### Bulk Operations
```bash
# Import and process a large dataset
brainy import customer-data.csv --neural --batch-size 500 --progress

# Update all records matching criteria
brainy update --query '{"status": "pending"}' --set '{"status": "processed"}' --confirm

# Export data with relationships
brainy export --format json --include-relationships --output backup.json
```

### Production Deployment
```bash
# Initialize for production with encryption
brainy init --storage s3 --encrypt --performance enterprise

# Configure S3 storage
brainy config set storage.s3.bucket my-production-brain
brainy config set storage.s3.region us-east-1

# Health check for monitoring
brainy status --health-check --json
```

## 🔧 Environment Variables

Configure Brainy using environment variables:

```bash
# Storage Configuration
export BRAINY_STORAGE_TYPE=s3
export BRAINY_S3_BUCKET=my-brainy-data
export BRAINY_S3_REGION=us-east-1

# AI Provider Configuration  
export BRAINY_AI_PROVIDER=openai
export BRAINY_OPENAI_API_KEY=your-api-key

# Performance Tuning
export BRAINY_PERFORMANCE_TIER=large
export BRAINY_CACHE_SIZE=1000000

# Security
export BRAINY_ENCRYPTION_KEY=your-32-char-encryption-key
```

## 📊 Output Formats

All commands support multiple output formats:

```bash
# JSON output
brainy search "projects" --format json

# Table output (default)
brainy status --format table

# CSV export
brainy search "customers" --format csv --output customers.csv

# Markdown reports
brainy status --format markdown --output report.md
```

## 🚀 Performance Tips

1. **Use batch operations** for large datasets:
   ```bash
   brainy import large-file.csv --batch-size 1000
   ```

2. **Enable caching** for repeated queries:
   ```bash
   brainy config set cache.enabled true
   brainy config set cache.size 100000
   ```

3. **Use filters** to reduce result sets:
   ```bash
   brainy search "content" --filter '{"date": {"$gte": "2024-01-01"}}'
   ```

4. **Monitor performance** with detailed status:
   ```bash
   brainy status --metrics --detailed
   ```

## 🆘 Help & Troubleshooting

```bash
# Get help for any command
brainy --help
brainy add --help
brainy search --help

# Verbose output for debugging
brainy search "query" --verbose

# Check system requirements
brainy status --system-info

# Validate configuration
brainy config validate
```

## 🔄 Migration from 0.x CLI

| Old Command (0.x) | New Command (1.0) | Notes |
|-------------------|-------------------|--------|
| `cortex init` | `brainy init` | Same functionality |
| `cortex add-smart "data"` | `brainy add "data"` | Smart by default |
| `cortex search-similar "q"` | `brainy search "q"` | Unified search |
| `cortex neural import file.csv` | `brainy import file.csv` | Neural processing built-in |
| `cortex chat "question"` | `brainy chat "question"` | Same interface |
| `cortex status --detailed` | `brainy status --detailed` | Enhanced metrics |

## 💡 Pro Tips

1. **Start with init**: Always run `brainy init` in new projects
2. **Use chat mode**: `brainy chat` is the fastest way to explore your data
3. **Enable encryption**: Use `--encrypt` for sensitive data
4. **Monitor status**: Regular `brainy status` checks keep you informed  
5. **Batch operations**: Use `--batch-size` for large imports

---

*For the complete API documentation, see [Brainy 1.0 Quick Start](getting-started/quick-start-1.0.md)*