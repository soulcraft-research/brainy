<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**The world's only true Vector + Graph database - unified semantic search and knowledge graphs**

</div>

---

# The Search Problem Every Developer Faces

**"I need to find similar content, explore relationships, AND filter by metadata - but that means juggling 3+ databases"**

❌ **Current Reality**: Pinecone + Neo4j + Elasticsearch + Custom Sync Logic  
✅ **Brainy Reality**: One database. One API. All three search types.

## 🔥 The Power of Three-in-One Search

```javascript
// This ONE query does what used to require 3 databases:
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
// Returns: Companies similar to your query + their relationships + matching your criteria
```

**Three search paradigms. One lightning-fast query. Zero complexity.**

## 🚀 Install & Go

```bash
npm install @soulcraft/brainy
```

```javascript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()  // Auto-detects your environment
await brainy.init()              // Auto-configures everything

// Add data with relationships
const openai = await brainy.add("OpenAI", { type: "company", funding: 11000000 })
const gpt4 = await brainy.add("GPT-4", { type: "product", users: 100000000 })
await brainy.relate(openai, gpt4, "develops")

// Search across all dimensions
const results = await brainy.search("AI language models", 5, {
  metadata: { funding: { $gte: 10000000 } },
  includeVerbs: true
})
```

**That's it. You just built a knowledge graph with semantic search and faceted filtering in 8 lines.**

## 🔥 MAJOR UPDATES: What's New in v0.51, v0.49 & v0.48

### 🎯 **v0.51: Revolutionary Developer Experience** 

**Problem-focused approach that gets you productive in seconds!**

- ✅ **Problem-Solution Narrative** - Immediately understand why Brainy exists
- ✅ **8-Line Quickstart** - Three search types in one simple demo  
- ✅ **Streamlined Documentation** - Focus on what matters most
- ✅ **Clear Positioning** - The only true Vector + Graph database

### 🎯 **v0.49: Filter Discovery & Performance Improvements**

**Discover available filters and scale to millions of items!**

```javascript
// Discover what filters are available - O(1) field lookup
const categories = await brainy.getFilterValues('category')
// Returns: ['electronics', 'books', 'clothing', ...]

const fields = await brainy.getFilterFields()  // O(1) operation
// Returns: ['category', 'price', 'brand', 'rating', ...]
```

- ✅ **Filter Discovery API**: O(1) field discovery for instant filter UI generation
- ✅ **Improved Performance**: Removed deprecated methods, now uses pagination everywhere
- ✅ **Better Scalability**: Hybrid indexing with O(1) field access scales to millions
- ✅ **Smart Caching**: LRU cache for frequently accessed filters
- ✅ **Zero Configuration**: Everything auto-optimizes based on usage patterns

### 🚀 **v0.48: MongoDB-Style Metadata Filtering**

**Powerful querying with familiar syntax - filter DURING search for maximum performance!**

```javascript
const results = await brainy.search("wireless headphones", 10, {
  metadata: {
    category: { $in: ["electronics", "audio"] },
    price: { $lte: 200 },
    rating: { $gte: 4.0 },
    brand: { $ne: "Generic" }
  }
})
```

- ✅ **15+ MongoDB Operators**: `$gt`, `$in`, `$regex`, `$and`, `$or`, `$includes`, etc.
- ✅ **Automatic Indexing**: Zero configuration, maximum performance
- ✅ **Nested Fields**: Use dot notation for complex objects
- ✅ **100% Backward Compatible**: Your existing code works unchanged

### ⚡ **v0.46: Transformers.js Migration**

**Replaced TensorFlow.js for better performance and true offline operation!**

- ✅ **95% Smaller Package**: 643 kB vs 12.5 MB
- ✅ **84% Smaller Models**: 87 MB vs 525 MB models
- ✅ **True Offline**: Zero network calls after initial download
- ✅ **5x Fewer Dependencies**: Clean tree, no peer dependency issues
- ✅ **Same API**: Drop-in replacement, existing code works unchanged

## 🏆 Why Brainy Wins

- 🧠 **Triple Search Power** - Vector + Graph + Faceted filtering in one query
- 🌍 **Runs Everywhere** - Same code: React, Node.js, serverless, edge  
- ⚡ **Zero Config** - Auto-detects environment, optimizes itself
- 🔄 **Always Synced** - No data consistency nightmares between systems
- 📦 **Truly Offline** - Works without internet after initial setup
- 🔒 **Your Data** - Run locally, in browser, or your own cloud

## 🔮 Coming Soon

- **🤖 MCP Integration** - Let Claude, GPT, and other AI models query your data directly
- **⚡ LLM Generation** - Built-in content generation powered by your knowledge graph  
- **🌊 Real-time Sync** - Live updates across distributed instances

## 🎨 Build Amazing Things

**🤖 AI Chat Applications** - Build ChatGPT-like apps with long-term memory and context awareness  
**🔍 Semantic Search Engines** - Search by meaning, not keywords. Find "that thing that's like a cat but bigger" → returns "tiger"  
**🎯 Recommendation Engines** - "Users who liked this also liked..." but actually good  
**🧬 Knowledge Graphs** - Connect everything to everything. Wikipedia meets Neo4j meets magic  
**👁️ Computer Vision Apps** - Store and search image embeddings. "Find all photos with dogs wearing hats"  
**🎵 Music Discovery** - Find songs that "feel" similar. Spotify's Discover Weekly in your app  
**📚 Smart Documentation** - Docs that answer questions. "How do I deploy to production?" → relevant guides  
**🛡️ Fraud Detection** - Find patterns humans can't see. Anomaly detection on steroids  
**🌐 Real-Time Collaboration** - Sync vector data across devices. Figma for AI data  
**🏥 Medical Diagnosis Tools** - Match symptoms to conditions using embedding similarity

## 🌍 Works Everywhere - Same Code

**Write once, run anywhere.** Brainy auto-detects your environment and optimizes automatically:

### 🌐 Browser Frameworks (React, Angular, Vue)

```javascript
import { BrainyData } from '@soulcraft/brainy'

// SAME CODE in React, Angular, Vue, Svelte, etc.
const brainy = new BrainyData()
await brainy.init()  // Auto-uses OPFS in browsers

// Add entities and relationships
const john = await brainy.add("John is a software engineer", { type: "person" })
const jane = await brainy.add("Jane is a data scientist", { type: "person" })
const ai = await brainy.add("AI Project", { type: "project" })

await brainy.relate(john, ai, "works_on")
await brainy.relate(jane, ai, "leads")

// Search by meaning
const engineers = await brainy.search("software developers", 5)

// Traverse relationships
const team = await brainy.getVerbsByTarget(ai)  // Who works on AI Project?
```

<details>
<summary>📦 <strong>Full React Component Example</strong></summary>

```jsx
import { BrainyData } from '@soulcraft/brainy'
import { useEffect, useState } from 'react'

function Search() {
  const [brainy, setBrainy] = useState(null)
  const [results, setResults] = useState([])

  useEffect(() => {
    const init = async () => {
      const db = new BrainyData()
      await db.init()
      // Add your data...
      setBrainy(db)
    }
    init()
  }, [])

  const search = async (query) => {
    const results = await brainy?.search(query, 5) || []
    setResults(results)
  }

  return <input onChange={(e) => search(e.target.value)} placeholder="Search..." />
}
```

</details>

<details>
<summary>📦 <strong>Full Angular Component Example</strong></summary>

```typescript
import { Component, signal, OnInit } from '@angular/core'
import { BrainyData } from '@soulcraft/brainy'

@Component({
  selector: 'app-search',
  template: `<input (input)="search($event.target.value)" placeholder="Search...">`
})
export class SearchComponent implements OnInit {
  brainy = new BrainyData()

  async ngOnInit() {
    await this.brainy.init()
    // Add your data...
  }

  async search(query: string) {
    const results = await this.brainy.search(query, 5)
    // Display results...
  }
}
```

</details>

<details>
<summary>📦 <strong>Full Vue Example</strong></summary>

```vue
<script setup>
  import { BrainyData } from '@soulcraft/brainy'
  import { ref, onMounted } from 'vue'

  const brainy = ref(null)
  const results = ref([])

  onMounted(async () => {
    const db = new BrainyData()
    await db.init()
    // Add your data...
    brainy.value = db
  })

  const search = async (query) => {
    const results = await brainy.value?.search(query, 5) || []
    setResults(results)
  }
</script>

<template>
  <input @input="search($event.target.value)" placeholder="Search..." />
</template>
```

</details>

### 🟢 Node.js / Serverless / Edge

```javascript
import { BrainyData } from '@soulcraft/brainy'

// SAME CODE works in Node.js, Vercel, Netlify, Cloudflare Workers, Deno, Bun
const brainy = new BrainyData()
await brainy.init()  // Auto-detects environment and optimizes

// Add entities and relationships
await brainy.add("Python is great for data science", { type: "fact" })
await brainy.add("JavaScript rules the web", { type: "fact" })

// Search by meaning
const results = await brainy.search("programming languages", 5)

// Optional: Production with S3/R2 storage (auto-detected in cloud environments)
const productionBrainy = new BrainyData({
  storage: {
    s3Storage: { bucketName: process.env.BUCKET_NAME }
  }
})
```

**That's it! Same code, everywhere. Zero-to-Smart™**

Brainy automatically detects and optimizes for your environment:

| Environment | Storage | Optimization |
|-------------|---------|-------------|
| 🌐 Browser | OPFS | Web Workers, Memory Cache |
| 🟢 Node.js | FileSystem / S3 | Worker Threads, Clustering |
| ⚡ Serverless | S3 / Memory | Cold Start Optimization |
| 🔥 Edge | Memory / KV | Minimal Footprint |

## 🌐 Distributed Mode (NEW!)

**Scale horizontally with zero configuration!** Brainy now supports distributed deployments with automatic coordination:

- **🌐 Multi-Instance Coordination** - Multiple readers and writers working in harmony
- **🏷️ Smart Domain Detection** - Automatically categorizes data (medical, legal, product, etc.)
- **📊 Real-Time Health Monitoring** - Track performance across all instances
- **🔄 Automatic Role Optimization** - Readers optimize for cache, writers for throughput
- **🗂️ Intelligent Partitioning** - Hash-based partitioning for perfect load distribution

```javascript
// Writer Instance - Ingests data from multiple sources
const writer = new BrainyData({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  distributed: { role: 'writer' }  // Explicit role for safety
})

// Reader Instance - Optimized for search queries
const reader = new BrainyData({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  distributed: { role: 'reader' }  // 80% memory for cache
})

// Data automatically gets domain tags
await writer.add("Patient shows symptoms of...", {
  diagnosis: "flu"  // Auto-tagged as 'medical' domain
})

// Domain-aware search across all partitions
const results = await reader.search("medical symptoms", 10, {
  filter: { domain: 'medical' }  // Only search medical data
})

// Monitor health across all instances
const health = reader.getHealthStatus()
console.log(`Instance ${health.instanceId}: ${health.status}`)
```

## 🆚 Why Not Just Use...?

### vs. Multiple Databases
❌ **Pinecone + Neo4j + Elasticsearch** - 3 databases, sync nightmares, 3x the cost  
✅ **Brainy** - One database, always synced, built-in intelligence

### vs. Traditional Solutions  
❌ **PostgreSQL + pgvector + extensions** - Complex setup, performance issues  
✅ **Brainy** - Zero config, purpose-built for AI, works everywhere

### vs. Cloud-Only Vector DBs
❌ **Pinecone/Weaviate/Qdrant** - Vendor lock-in, expensive, cloud-only  
✅ **Brainy** - Run anywhere, your data stays yours, cost-effective

### vs. Graph Databases with "Vector Features"
❌ **Neo4j + vector plugin** - Bolt-on solution, not native, limited  
✅ **Brainy** - Native vector+graph architecture from the ground up

## 📦 Advanced Features

<details>
<summary>🔧 <strong>MongoDB-Style Metadata Filtering</strong></summary>

```javascript
const results = await brainy.search("machine learning", 10, {
  metadata: {
    // Comparison operators
    price: { $gte: 100, $lte: 1000 },
    category: { $in: ["AI", "ML", "Data"] },
    rating: { $gt: 4.5 },
    
    // Logical operators  
    $and: [
      { status: "active" },
      { verified: true }
    ],
    
    // Text operators
    description: { $regex: "neural.*network", $options: "i" },
    
    // Array operators
    tags: { $includes: "tensorflow" }
  }
})
```

**15+ operators supported**: `$gt`, `$gte`, `$lt`, `$lte`, `$eq`, `$ne`, `$in`, `$nin`, `$and`, `$or`, `$not`, `$regex`, `$includes`, `$exists`, `$size`

</details>

<details>
<summary>🔗 <strong>Graph Relationships & Traversal</strong></summary>

```javascript
// Create entities and relationships
const company = await brainy.add("OpenAI", { type: "company" })
const product = await brainy.add("GPT-4", { type: "product" })
const person = await brainy.add("Sam Altman", { type: "person" })

// Create meaningful relationships
await brainy.relate(company, product, "develops")
await brainy.relate(person, company, "leads")
await brainy.relate(product, person, "created_by")

// Traverse relationships
const products = await brainy.getVerbsBySource(company) // What OpenAI develops
const leaders = await brainy.getVerbsByTarget(company)  // Who leads OpenAI
const connections = await brainy.findSimilar(product, { 
  relationType: "develops" 
})

// Search with relationship context
const results = await brainy.search("AI models", 10, {
  includeVerbs: true,
  verbTypes: ["develops", "created_by"],
  searchConnectedNouns: true
})
```

</details>

<details>
<summary>🌐 <strong>Universal Storage & Deployment</strong></summary>

```javascript
// Development: File system
const dev = new BrainyData({ 
  storage: { fileSystem: { path: './data' } } 
})

// Production: S3/R2  
const prod = new BrainyData({
  storage: { s3Storage: { bucketName: 'my-vectors' } }
})

// Browser: OPFS
const browser = new BrainyData() // Auto-detects OPFS

// Edge: Memory
const edge = new BrainyData({
  storage: { memory: {} }
})

// Redis: High performance  
const redis = new BrainyData({
  storage: { redis: { connectionString: 'redis://...' } }
})
```

**Extend with any storage**: MongoDB, PostgreSQL, DynamoDB - [see storage adapters guide](docs/api-reference/storage-adapters.md)

</details>

<details>
<summary>🐳 <strong>Docker & Cloud Deployment</strong></summary>

```dockerfile
# Production-ready Dockerfile
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run download-models  # Embed models for offline operation
RUN npm run build

FROM node:24-slim AS production  
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models  # Offline models included
CMD ["node", "dist/server.js"]
```

Deploy to: Google Cloud Run, AWS Lambda/ECS, Azure Container Instances, Cloudflare Workers, Railway, Render, Vercel, anywhere Docker runs.

</details>

## 📚 Documentation & Resources

- **[🚀 Quick Start Guide](docs/getting-started/)** - Get up and running in minutes
- **[📖 API Reference](docs/api-reference/)** - Complete method documentation  
- **[💡 Examples](docs/examples/)** - Real-world usage patterns
- **[⚡ Performance Guide](docs/optimization-guides/)** - Scale to millions of vectors
- **[🔧 Storage Adapters](docs/api-reference/storage-adapters.md)** - Universal storage compatibility

## 🤝 Contributing

We welcome contributions! Please see:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Developer Documentation](docs/development/DEVELOPERS.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## 📄 License

[MIT](LICENSE)

---

<div align="center">
<strong>Ready to build the future of search? Get started with Brainy today!</strong>

**[Get Started →](docs/getting-started/) | [View Examples →](docs/examples/) | [Join Community →](https://github.com/soulcraft-research/brainy/discussions)**
</div>