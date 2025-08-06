<div align="center>
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

## 🎯 Perfect For

**🤖 AI Chat Applications** - ChatGPT-like apps with long-term memory and context  
**🔍 Semantic Search** - Find "that thing like a cat but bigger" → returns "tiger"  
**🧬 Knowledge Graphs** - Connect everything. Wikipedia meets Neo4j meets magic  
**🎯 Recommendation Engines** - "Users who liked this also liked..." but actually good  
**📚 Smart Documentation** - Docs that answer questions before you ask them  

## 🌍 Works Everywhere - Same Code

```javascript
// This EXACT code works in ALL environments
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()
await brainy.init()

// Works in: React, Vue, Angular, Node.js, Deno, Bun, 
// Cloudflare Workers, Vercel Edge, AWS Lambda, browsers, anywhere
```

Brainy automatically detects and optimizes for your environment:

| Environment | Storage | Optimization |
|-------------|---------|-------------|
| 🌐 Browser | OPFS | Web Workers, Memory Cache |
| 🟢 Node.js | FileSystem / S3 | Worker Threads, Clustering |
| ⚡ Serverless | S3 / Memory | Cold Start Optimization |
| 🔥 Edge | Memory / KV | Minimal Footprint |

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