<div align="center">

![Brainy Logo](brainy.png)

[![npm version](https://badge.fury.io/js/%40soulcraft%2Fbrainy.svg)](https://badge.fury.io/js/%40soulcraft%2Fbrainy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)

# BRAINY: The Brain in a Jar Database™

**The world's only Vector + Graph + AI database and realtime data platform**

*Zero-to-Smart™ technology that thinks so you don't have to*

</div>

---

## 🚀 THE AMAZING BRAINY: See It In Action!

```javascript
import { BrainyData } from '@soulcraft/brainy'

// 🧪 Initialize your brain-in-a-jar
const brainy = new BrainyData()  // Zero config - it's ALIVE!
await brainy.init()

// 🔬 Feed it knowledge with relationships
const openai = await brainy.add("OpenAI", { type: "company", funding: 11000000 })
const gpt4 = await brainy.add("GPT-4", { type: "product", users: 100000000 })
await brainy.relate(openai, gpt4, "develops")

// ⚡ One query to rule them all - Vector + Graph + Faceted search!
const results = await brainy.search("AI language models", 5, {
  metadata: { funding: { $gte: 10000000 } },  // MongoDB-style filtering
  includeVerbs: true                           // Graph relationships
})  // Plus semantic vector search!
```

**🎭 8 lines. Three search paradigms. One brain-powered database.**

## 💫 WHY BRAINY? The Problem We Solve

### ❌ The Old Way: Database Frankenstein

```
Pinecone ($$$) + Neo4j ($$$) + Elasticsearch ($$$) + Sync Hell = 😱
```

### ✅ The Brainy Way: One Smart Brain

```
Vector Search + Graph Relations + Metadata Filtering + AI Intelligence = 🧠✨
```

**Your data gets a brain upgrade. No assembly required.**

## ⚡ QUICK & EASY: From Zero to Smart in 60 Seconds

### Installation

```bash
npm install @soulcraft/brainy
```

### Your First Brainy App

```javascript
import { BrainyData } from '@soulcraft/brainy'

// It's alive! (No config needed)
const brainy = new BrainyData()
await brainy.init()

// Feed your brain some data
await brainy.add("Tesla", { type: "company", sector: "automotive" })
await brainy.add("SpaceX", { type: "company", sector: "aerospace" })

// Ask it questions (semantic search)
const similar = await brainy.search("electric vehicles")

// Use relationships (graph database)
await brainy.relate("Tesla", "SpaceX", "shares_founder_with")

// Filter like MongoDB (faceted search)
const results = await brainy.search("innovation", {
  metadata: { sector: "automotive" }
})
```

## 🎆 NEW! Talk to Your Data with Brainy Chat

```javascript
import { BrainyChat } from '@soulcraft/brainy'

const chat = new BrainyChat(brainy)  // Your data becomes conversational!
const answer = await chat.ask("What patterns do you see in customer behavior?")
// → AI-powered insights from your knowledge graph!
```

<sub>**How it works:** Combines vector embeddings for semantic understanding • Graph relationships for connection patterns • Metadata filtering for structured analysis • Optional LLM for natural language insights</sub>

**One line. Zero complexity. Optional LLM for genius-level responses.**  
[📖 **Learn More About Brainy Chat**](BRAINY-CHAT.md)

## 🎮 NEW! Brainy CLI - Command Center from the Future

### 💬 Talk to Your Data

```bash
# Have conversations with your knowledge graph
brainy chat "What patterns exist in customer behavior?"
brainy chat "Show me all connections between startups"
```

### 📥 Add & Import Data

```bash
# Import with AI understanding
brainy import data.csv --cortex --understand

# Add individual items
brainy add "OpenAI" --type company --metadata '{"founded": 2015}'

# Bulk import with relationships
brainy import relationships.json --detect-entities
```

### 🔍 Explore & Query

```bash
# Search semantically
brainy search "artificial intelligence companies"

# Query with filters
brainy query --filter 'funding>1000000' --type company

# Visualize relationships
brainy graph "OpenAI" --depth 2 --format ascii
```

### 🔄 Manage & Migrate

```bash
# Export your brain
brainy export my-brain.json --include-embeddings

# Migrate between storage backends
brainy migrate s3://old-bucket file://new-location

# Backup and restore
brainy backup --compress
brainy restore backup-2024.tar.gz
```

### 🔐 Environment & Secrets

```bash
# Store configuration securely
brainy config set api.key "sk-..." --encrypt
brainy config set storage.s3.bucket "my-brain"

# Load environment profiles
brainy env use production
brainy env create staging --from .env.staging
```

### 📊 Monitor & Optimize

```bash
# Real-time dashboard
brainy monitor --dashboard

# Performance analysis
brainy stats --detailed
brainy optimize index --auto
```

**Command your data empire from the terminal!**  
[📖 **Full CLI Documentation**](docs/brainy-cli.md)

## 🧬 NEW! Cortex AI - Your Data Gets a PhD

**Cortex automatically understands and enhances your data:**

```javascript
// Enable Cortex Intelligence during import
const brainy = new BrainyData({
  cortex: {
    enabled: true,
    autoDetect: true  // Automatically identify entities & relationships
  }
})

// Import with understanding
await brainy.cortexImport('customers.csv', {
  understand: true,     // AI analyzes data structure
  detectRelations: true, // Finds hidden connections
  confidence: 0.8       // Quality threshold
})
```

**Your data becomes self-aware (in a good way)!**

## 🔌 NEW! Augmentation Pipeline - Plug in Superpowers

**8 types of augmentations to enhance your brain:**

```javascript
// Add augmentations like installing apps on your brain
brainy.augment({
  type: 'PERCEPTION',     // Visual/pattern recognition
  handler: myPerceptor
})

brainy.augment({
  type: 'COGNITION',      // Deep thinking & analysis
  handler: myThinker
})

// Premium augmentations (coming soon!)
brainy.augment({
  type: 'NOTION_SYNC',    // Bi-directional Notion sync
  license: 'premium'
})
```

**Augmentation Types:**

- 🎯 **SENSE** - Input processing
- 🧠 **MEMORY** - Long-term storage
- 💭 **COGNITION** - Deep analysis
- 🔗 **CONDUIT** - Data flow
- ⚡ **ACTIVATION** - Triggers & events
- 👁️ **PERCEPTION** - Pattern recognition
- 💬 **DIALOG** - Conversational AI
- 🌐 **WEBSOCKET** - Real-time sync

## 💪 POWERFUL FEATURES: What Makes Brainy Special

### ⚡ Performance That Defies Science

```
Vector Search (1M embeddings):     2-8ms latency 🚀
Graph Traversal (100M relations):  1-3ms latency 🔥
Combined Vector+Graph+Filter:      5-15ms latency ⚡
Throughput:                        10K+ queries/sec 💫
```

### 🌍 Write Once, Run Anywhere (Literally)

- **Browser**: Uses OPFS, Web Workers - works offline!
- **Node.js**: FileSystem, Worker Threads - server-ready!
- **Edge/Serverless**: Memory-optimized - deploys anywhere!
- **React/Vue/Angular**: Same code, automatic optimization!

### 🔮 The Power of Three-in-One Search

```javascript
// This ONE query replaces THREE databases:
const results = await brainy.search("AI startups in healthcare", 10, {
  // 🔍 Vector: Semantic similarity 
  includeVerbs: true,

  // 🔗 Graph: Relationship traversal
  verbTypes: ["invests_in", "partners_with"],

  // 📊 Faceted: MongoDB-style filtering  
  metadata: {
    industry: "healthcare",
    funding: { $gte: 1000000 },
    stage: { $in: ["Series A", "Series B"] }
  }
})
```

### 🧠 Self-Learning & Auto-Optimization

**Brainy gets smarter the more you use it:**

- Auto-indexes frequently searched fields
- Learns query patterns for faster responses
- Optimizes storage based on access patterns
- Self-configures for your environment

## 🎭 ADVANCED FEATURES: For Mad Scientists

### 🔬 MongoDB-Style Query Operators

```javascript
const results = await brainy.search("quantum computing", {
  metadata: {
    $and: [
      { price: { $gte: 100, $lte: 1000 } },
      { category: { $in: ["electronics", "computing"] } },
      {
        $or: [
          { brand: "Intel" },
          { brand: "IBM" }
        ]
      },
      { tags: { $includes: "quantum" } },
      { description: { $regex: "qubit|superposition" } }
    ]
  }
})
```

**15+ operators**: `$gt`, `$gte`, `$lt`, `$lte`, `$eq`, `$ne`, `$in`, `$nin`, `$regex`, `$includes`, `$all`, `$size`,
`$and`, `$or`, `$not`

### 🧪 Specialized Deployment Modes

```javascript
// High-speed data ingestion
const writer = new BrainyData({
  writeOnly: true,
  allowDirectReads: true  // For deduplication
})

// Read-only search cluster
const reader = new BrainyData({
  readOnly: true,
  frozen: true  // Maximum performance
})

// Custom storage backend
const custom = new BrainyData({
  storage: {
    type: 's3',
    s3Storage: {
      bucketName: 'my-brain',
      region: 'us-east-1'
    }
  }
})
```

### 🚀 Framework Integration Examples

<details>
<summary>📦 <strong>See Framework Examples</strong></summary>

#### React

```jsx
import { BrainyData } from '@soulcraft/brainy'

function App() {
  const [brainy] = useState(() => new BrainyData())

  useEffect(() => {
    brainy.init()
  }, [])

  const search = async (query) => {
    return await brainy.search(query, 10)
  }

  return <SearchInterface onSearch={search} />
}
```

#### Vue 3

```vue

<script setup>
  import { BrainyData } from '@soulcraft/brainy'

  const brainy = new BrainyData()
  await brainy.init()

  const search = async (query) => {
    return await brainy.search(query, 10)
  }
</script>
```

#### Angular

```typescript

@Injectable({ providedIn: 'root' })
export class BrainyService {
  private brainy = new BrainyData()

  async init() {
    await this.brainy.init()
  }

  search(query: string) {
    return this.brainy.search(query, 10)
  }
}
```

</details>

### 🐳 Docker & Cloud Deployment

```dockerfile
FROM node:24-slim
WORKDIR /app
COPY . .
RUN npm install
RUN npm run download-models  # Bundle models for offline use
CMD ["node", "server.js"]
```

Deploy to AWS, GCP, Azure, Cloudflare Workers, anywhere!

## 💎 Premium Features (Optional)

**Core Brainy is FREE forever. Premium augmentations for enterprise:**

### 🔗 Enterprise Connectors (Coming Soon!)

- **Notion** ($49/mo) - Bi-directional workspace sync
- **Salesforce** ($99/mo) - CRM integration
- **Slack** ($49/mo) - Team knowledge capture
- **Asana** ($44/mo) - Project intelligence

```bash
brainy augment trial notion  # Start 14-day free trial
```

## 🎨 What You Can Build

**The only limit is your imagination:**

- **🤖 AI Assistants** - ChatGPT with perfect memory
- **🔍 Semantic Search** - Find by meaning, not keywords
- **🎯 Recommendation Engines** - Netflix-level suggestions
- **🧬 Knowledge Graphs** - Wikipedia meets Neo4j
- **👁️ Computer Vision** - Search images by content
- **🎵 Music Discovery** - Spotify's algorithm in your app
- **📚 Smart Documentation** - Self-answering docs
- **🛡️ Fraud Detection** - Pattern recognition on steroids
- **🌐 Real-time Collaboration** - Multiplayer knowledge bases
- **🏥 Medical Diagnosis** - Symptom matching with AI

## 📚 Complete Documentation

### Getting Started

- [**Quick Start Guide**](docs/getting-started/) - Up and running in 5 minutes
- [**Installation**](docs/getting-started/installation.md) - All environments covered
- [**Basic Concepts**](docs/getting-started/concepts.md) - Understand the brain

### Core Features

- [**API Reference**](docs/api-reference/) - Every method documented
- [**Search Guide**](docs/api-reference/search.md) - Master all search types
- [**Graph Operations**](docs/api-reference/graph.md) - Relationships explained
- [**MongoDB Operators**](docs/api-reference/operators.md) - Query like a pro

### Advanced Topics

- [**Brainy CLI**](docs/brainy-cli.md) - Command-line superpowers
- [**Brainy Chat**](BRAINY-CHAT.md) - Conversational AI interface
- [**Cortex AI**](CORTEX.md) - Intelligence augmentation
- [**Augmentation Pipeline**](docs/augmentations/) - Plugin architecture
- [**Performance Tuning**](docs/optimization-guides/) - Speed optimization
- [**Deployment Guide**](docs/deployment/) - Production best practices

### Examples & Tutorials

- [**Example Apps**](docs/examples/) - Full applications
- [**Code Recipes**](docs/examples/recipes.md) - Common patterns
- [**Video Tutorials**](docs/tutorials/) - Visual learning

## 🆚 Why Not Just Use...?

### vs. Multiple Databases

❌ **Pinecone + Neo4j + Elasticsearch** = 3x cost, sync nightmares, 3 APIs  
✅ **Brainy** = One database, always synced, one simple API

### vs. Cloud-Only Vector DBs

❌ **Pinecone/Weaviate** = Vendor lock-in, expensive, cloud-only  
✅ **Brainy** = Run anywhere, own your data, pay once

### vs. Traditional Graph DBs

❌ **Neo4j + vector plugin** = Bolt-on solution, limited capabilities  
✅ **Brainy** = Native vector+graph from the ground up

## 🚀 Real-World Performance & Scale

**How Brainy handles production workloads:**

### 📊 Benchmark Numbers

- **10M vectors**: 5-15ms search latency (p95)
- **100M relationships**: 1-3ms traversal
- **Metadata filtering**: O(1) field access via hybrid indexing
- **Concurrent queries**: 10,000+ QPS on single instance
- **Index size**: ~100 bytes per vector (384 dims)

### 🎯 Scaling Strategies

**Scale Up (Vertical)**

```javascript
// Optimize for large datasets on single machine
const brainy = new BrainyData({
  hnsw: {
    maxConnections: 32,     // More connections = better recall
    efConstruction: 400,    // Higher quality index
    efSearch: 100          // More accurate search
  }
})
```

**Scale Out (Horizontal)**

```javascript
// Shard by category for distributed deployment
const shards = {
  products: new BrainyData({ defaultService: 'products-shard' }),
  users: new BrainyData({ defaultService: 'users-shard' }),
  content: new BrainyData({ defaultService: 'content-shard' })
}

// Or use read/write separation
const writer = new BrainyData({ writeOnly: true })
const readers = [/* multiple read replicas */]
```

### 🏗️ Architecture That Scales

✅ **Distributed Index** - Partition by metadata fields or ID ranges  
✅ **Smart Partitioning** - Semantic clustering or hash-based sharding  
✅ **Real-time Sync** - WebRTC & WebSocket for live collaboration  
✅ **GPU Acceleration** - Auto-detected for embeddings when available  
✅ **Metadata Index** - Separate B-tree indexes for fast filtering  
✅ **Memory Mapped Files** - Handle datasets larger than RAM  
✅ **Streaming Ingestion** - Process millions of items without OOM  
✅ **Progressive Loading** - Start serving queries before full index load

## 🛸 Recent Updates

### 🎯 v0.57.0 - The Cortex Revolution

- Renamed CLI from "neural" to "brainy"
- Cortex AI for data understanding
- Augmentation pipeline system
- Premium connectors framework

### ⚡ v0.46-v0.51 - Performance Revolution

- 95% package size reduction
- MongoDB query operators
- Filter discovery API
- Transformers.js migration
- True offline operation

## 🤝 Contributing

We welcome contributions! See [Contributing Guidelines](CONTRIBUTING.md)

## 📄 License

[MIT](LICENSE) - Core Brainy is FREE forever

---

<div align="center">

## 🧠 Ready to Give Your Data a Brain?

**[Get Started →](docs/getting-started/) | [Examples →](docs/examples/)**

*Zero-to-Smart™ - Because your data deserves a brain upgrade*

**Built with ❤️ by [Soulcraft Research](https://soulcraft.com)**  
*Powered by the BXL9000™ Cognitive Engine*

</div>
