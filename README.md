<div align="center>
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A powerful graph & vector data platform for AI applications across any environment**

</div>

## 🔥 MAJOR UPDATE: TensorFlow.js → Transformers.js Migration (v0.46+)

**We've completely replaced TensorFlow.js with Transformers.js for better performance and true offline operation!**

### Why We Made This Change

**The Honest Truth About TensorFlow.js:**

- 📦 **Massive Package Size**: 12.5MB+ packages with complex dependency trees
- 🌐 **Hidden Network Calls**: Even "local" models triggered fetch() calls internally
- 🐛 **Dependency Hell**: Constant `--legacy-peer-deps` issues with Node.js updates
- 🔧 **Maintenance Burden**: 47+ dependencies to keep compatible across environments
- 💾 **Huge Models**: 525MB Universal Sentence Encoder models

### What You Get Now

- ✅ **95% Smaller Package**: 643 kB vs 12.5 MB (and it actually works better!)
- ✅ **84% Smaller Models**: 87 MB vs 525 MB all-MiniLM-L6-v2 vs USE
- ✅ **True Offline Operation**: Zero network calls after initial model download
- ✅ **5x Fewer Dependencies**: Clean dependency tree, no more peer dep issues
- ✅ **Same API**: Drop-in replacement - your existing code just works
- ✅ **Better Performance**: ONNX Runtime is faster than TensorFlow.js in most cases

### Migration (It's Automatic!)

```javascript
// Your existing code works unchanged!
import { BrainyData } from '@soulcraft/brainy'

const db = new BrainyData({
  embedding: { type: 'transformer' } // Now uses Transformers.js automatically
})

// Dimensions changed from 512 → 384 (handled automatically)
```

**For Docker/Production or No Egress:**

```dockerfile
RUN npm install @soulcraft/brainy
RUN npm run download-models  # Download during build for offline production
```

---

## ✨ What is Brainy?

**One API. Every environment. Zero configuration.**

Brainy is the **AI-native database** that combines vector search and knowledge graphs in one unified API. Write your code once, and it runs everywhere - browsers, Node.js, serverless, edge workers - with automatic optimization for each environment.

```javascript
// This same code works EVERYWHERE
const brainy = new BrainyData()
await brainy.init()

// Vector search (like Pinecone) + Graph database (like Neo4j)
await brainy.add("OpenAI", { type: "company" })  // Nouns
await brainy.relate(openai, gpt4, "develops")    // Verbs
const results = await brainy.search("AI", 10)    // Semantic search
```

### 🆕 NEW: Distributed Mode (v0.38+)

**Scale horizontally with zero configuration!** Brainy now supports distributed deployments with automatic coordination:

- **🌐 Multi-Instance Coordination** - Multiple readers and writers working in harmony
- **🏷️ Smart Domain Detection** - Automatically categorizes data (medical, legal, product, etc.)
- **📊 Real-Time Health Monitoring** - Track performance across all instances
- **🔄 Automatic Role Optimization** - Readers optimize for cache, writers for throughput
- **🗂️ Intelligent Partitioning** - Hash-based partitioning for perfect load distribution

### 🚀 Why Developers Love Brainy

- **🧠 Zero-to-Smart™** - No config files, no tuning parameters, no DevOps headaches. Brainy auto-detects your
  environment and optimizes itself
- **🌍 True Write-Once, Run-Anywhere** - Same code runs in Angular, React, Vue, Node.js, Deno, Bun, serverless, edge
  workers, and web workers with automatic environment detection
- **⚡ Scary Fast** - Handles millions of vectors with sub-millisecond search. GPU acceleration for embeddings, optimized CPU for distance calculations
- **🎯 Self-Learning** - Like having a database that goes to the gym. Gets faster and smarter the more you use it
- **🔮 AI-First Design** - Built for the age of embeddings, RAG, and semantic search. Your LLMs will thank you
- **🎮 Actually Fun to Use** - Clean API, great DX, and it does the heavy lifting so you can build cool stuff

### 🚀 NEW: Ultra-Fast Search Performance + Auto-Configuration

**Your searches just got 100x faster AND Brainy now configures itself!** Advanced performance with zero setup:

- **🤖 Intelligent Auto-Configuration** - Detects environment and usage patterns, optimizes automatically
- **⚡ Smart Result Caching** - Repeated queries return in <1ms with automatic cache invalidation
- **📄 Cursor-Based Pagination** - Navigate millions of results with constant O(k) performance
- **🔄 Real-Time Data Sync** - Cache automatically updates when data changes, even in distributed scenarios
- **📊 Performance Monitoring** - Built-in hit rate and memory usage tracking with adaptive optimization
- **🎯 Zero Breaking Changes** - All existing code works unchanged, just faster and smarter

## 📦 Get Started in 30 Seconds

```bash
npm install @soulcraft/brainy
```

```javascript
import { BrainyData } from '@soulcraft/brainy'

// Same code works EVERYWHERE - browser, Node.js, cloud, edge
const brainy = new BrainyData()
await brainy.init() // Auto-detects your environment

// 1️⃣ Simple vector search (like Pinecone)
await brainy.add("The quick brown fox jumps over the lazy dog", { type: "sentence" })
await brainy.add("Cats are independent and mysterious animals", { type: "sentence" })

const results = await brainy.search("fast animals", 5)
// Finds similar content by meaning, not keywords!

// 2️⃣ Graph relationships (like Neo4j)
const openai = await brainy.add("OpenAI", { type: "company", founded: 2015 })
const gpt4 = await brainy.add("GPT-4", { type: "product", released: 2023 })
const sam = await brainy.add("Sam Altman", { type: "person", role: "CEO" })

// Create relationships between entities
await brainy.relate(openai, gpt4, "develops")
await brainy.relate(sam, openai, "leads")
await brainy.relate(gpt4, sam, "created_by")

// 3️⃣ Combined power: Vector search + Graph traversal
const similar = await brainy.search("AI language models", 10)  // Find by meaning
const products = await brainy.getVerbsBySource(openai)         // Get relationships
const graph = await brainy.findSimilar(gpt4, { relationType: "develops" })

// 4️⃣ Advanced: Search with context
const contextual = await brainy.search("Who leads AI companies?", 5, {
  includeVerbs: true,     // Include relationships in results
  nounTypes: ["person"],  // Filter to specific entity types
})
```

**🎯 That's it!** Vector search + graph database + works everywhere. No config needed.

### 🔍 Want More Power?

- **Advanced graph traversal** - Complex relationship queries and multi-hop searches
- **Distributed clustering** - Scale across multiple instances with automatic coordination
- **Real-time syncing** - WebSocket and WebRTC for live data updates
- **Custom augmentations** - Extend Brainy with your own functionality

*[See full API documentation below](#-installation) for advanced features*

## 🎨 Build Amazing Things

**🤖 AI Chat Applications** - Build ChatGPT-like apps with long-term memory and context awareness  
**🔍 Semantic Search Engines** - Search by meaning, not keywords. Find "that thing that's like a cat but bigger" →
returns "tiger"  
**🎯 Recommendation Engines** - "Users who liked this also liked..." but actually good  
**🧬 Knowledge Graphs** - Connect everything to everything. Wikipedia meets Neo4j meets magic  
**👁️ Computer Vision Apps** - Store and search image embeddings. "Find all photos with dogs wearing hats"  
**🎵 Music Discovery** - Find songs that "feel" similar. Spotify's Discover Weekly in your app  
**📚 Smart Documentation** - Docs that answer questions. "How do I deploy to production?" → relevant guides  
**🛡️ Fraud Detection** - Find patterns humans can't see. Anomaly detection on steroids  
**🌐 Real-Time Collaboration** - Sync vector data across devices. Figma for AI data  
**🏥 Medical Diagnosis Tools** - Match symptoms to conditions using embedding similarity

## 🚀 Works Everywhere - Same Code

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
<summary>📦 Full Angular Component Example</summary>

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
<summary>📦 Full React Example</summary>

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
<summary>📦 Full Vue Example</summary>

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

Brainy automatically detects and optimizes for:

- 🌐 **Browser frameworks** → OPFS storage, Web Workers, memory optimization
- 🟢 **Node.js servers** → FileSystem or S3/R2 storage, Worker threads, cluster support
- ⚡ **Serverless functions** → S3/R2 or Memory storage, cold start optimization
- 🔥 **Edge workers** → Memory or KV storage, minimal footprint
- 🧵 **Web/Worker threads** → Shared storage, thread-safe operations
- 🦕 **Deno/Bun runtimes** → FileSystem or S3-compatible storage, native performance

### 🐳 NEW: Zero-Config Docker Deployment

**Deploy to any cloud with embedded models - no runtime downloads needed!**

```dockerfile
# One line extracts models automatically during build
RUN npm run download-models

# Deploy anywhere: Google Cloud, AWS, Azure, Cloudflare, etc.
```

- **⚡ 7x Faster Cold Starts** - Models embedded in container, no downloads
- **🌐 Universal Cloud Support** - Same Dockerfile works everywhere
- **🔒 Offline Ready** - No external dependencies at runtime
- **📦 Zero Configuration** - Automatic model detection and loading

See [Docker Deployment Guide](./docs/docker-deployment.md) for complete examples.

```javascript
// Zero configuration - everything optimized automatically!
const brainy = new BrainyData()  // Auto-detects environment & optimizes
await brainy.init()

// Caching happens automatically - no setup needed!
const results1 = await brainy.search('query', 10)  // ~50ms first time
const results2 = await brainy.search('query', 10)  // <1ms cached hit!

// Advanced pagination works instantly
const page1 = await brainy.searchWithCursor('query', 100)
const page2 = await brainy.searchWithCursor('query', 100, {
  cursor: page1.cursor  // Constant time, no matter how deep!
})

// Monitor auto-optimized performance
const stats = brainy.getCacheStats()
console.log(`Auto-tuned cache hit rate: ${(stats.search.hitRate * 100).toFixed(1)}%`)
```

### 🌐 Distributed Mode Example (NEW!)

```javascript
// Writer Instance - Ingests data from multiple sources
const writer = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  distributed: { role: 'writer' }  // Explicit role for safety
})

// Reader Instance - Optimized for search queries
const reader = createAutoBrainy({
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

## 🎭 Key Features

### Core Capabilities

- **Vector Search** - Find semantically similar content using embeddings
- **Graph Relationships** - Connect data with meaningful relationships
- **JSON Document Search** - Search within specific fields with prioritization
- **Distributed Mode** - Scale horizontally with automatic coordination between instances
- **Real-Time Syncing** - WebSocket and WebRTC for distributed instances
- **Streaming Pipeline** - Process data in real-time as it flows through
- **Model Control Protocol** - Let AI models access your data

### Developer Experience

- **TypeScript Support** - Fully typed API with generics
- **Extensible Augmentations** - Customize and extend functionality
- **REST API** - Web service wrapper for HTTP endpoints
- **Auto-Complete** - IntelliSense for all APIs and types

## 📦 Installation

### Development: Quick Start

```bash
npm install @soulcraft/brainy
```

### ✨ Write-Once, Run-Anywhere Architecture

**Same code, every environment.** Brainy auto-detects and optimizes for your runtime:

```javascript
// This exact code works in Angular, React, Vue, Node.js, Deno, Bun, 
// serverless functions, edge workers, and web workers
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()
await brainy.init() // Auto-detects environment and chooses optimal storage

// Vector + Graph: Add entities (nouns) with relationships (verbs)
const companyId = await brainy.addNoun("OpenAI creates powerful AI models", "company", {
  founded: "2015", industry: "AI"
})
const productId = await brainy.addNoun("GPT-4 is a large language model", "product", {
  type: "LLM", parameters: "1.7T"
})

// Create relationships between entities  
await brainy.addVerb(companyId, productId, undefined, { type: "develops" })

// Vector search finds semantically similar content
const similar = await brainy.search("AI language models", 5)

// Graph operations: explore relationships
const relationships = await brainy.getVerbsBySource(companyId)
const allProducts = await brainy.getVerbsByType("develops")
```

### 🔍 Advanced Graph Operations

```javascript
// Vector search with graph filtering
const results = await brainy.search("AI models", 10, {
  searchVerbs: true,           // Search relationships directly
  verbTypes: ["develops"],     // Filter by relationship types
  searchConnectedNouns: true,  // Find entities connected by relationships
  verbDirection: "outgoing"    // Direction: outgoing, incoming, or both
})

// Graph traversal methods
const outgoing = await brainy.getVerbsBySource(entityId)  // What this entity relates to
const incoming = await brainy.getVerbsByTarget(entityId)  // What relates to this entity
const byType = await brainy.getVerbsByType("develops")    // All relationships of this type

// Combined vector + graph search
const connected = await brainy.searchNounsByVerbs("machine learning", 5, {
  verbTypes: ["develops", "uses"],
  direction: "both"
})

// Get related entities through specific relationships
const related = await brainy.getRelatedNouns(companyId, { relationType: "develops" })
```

**Universal benefits:**

- ✅ **Auto-detects everything** - Environment, storage, threading, optimization
- ✅ **Framework-optimized** - Best experience with Angular, React, Vue bundlers
- ✅ **Runtime-agnostic** - Node.js, Deno, Bun, browsers, serverless, edge
- ✅ **TypeScript-first** - Full types everywhere, IntelliSense support
- ✅ **Tree-shaking ready** - Modern bundlers import only what you need
- ✅ **ES Modules architecture** - Individual modules for better optimization by modern frameworks

### Production: Add Offline Model Reliability

```bash
# For development (online model loading)
npm install @soulcraft/brainy

# For production (offline reliability)
npm install @soulcraft/brainy @soulcraft/brainy-models
```

**Why use offline models in production?**

- **🛡️ 100% Reliability** - No network timeouts or blocked URLs
- **⚡ Instant Startup** - Models load in ~100ms vs 5-30 seconds
- **🐳 Docker Ready** - Perfect for Cloud Run, Lambda, Kubernetes
- **🔒 Zero Dependencies** - No external network calls required
- **🎯 Zero Configuration** - Automatic detection with graceful fallback
- **🔐 Enhanced Security** - Complete air-gapping support for sensitive environments
- **🏢 Enterprise Ready** - Works behind corporate firewalls and restricted networks
- **⚖️ Compliance & Forensics** - Frozen mode for audit trails and legal discovery

The offline models provide the **same functionality** with maximum reliability. Your existing code works unchanged -
Brainy automatically detects and uses bundled models when available.

```javascript
import { createAutoBrainy } from 'brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Use the bundled model for offline operation
const brainy = createAutoBrainy({
  embeddingModel: BundledUniversalSentenceEncoder
})
```

## 🐳 Docker & Cloud Deployment

**Deploy Brainy to any cloud provider with embedded models for maximum performance and reliability.**

### Quick Docker Setup

1. **Install models package:**
   ```bash
   npm install @soulcraft/brainy-models
   ```

2. **Add to your Dockerfile:**
   ```dockerfile
   # Extract models during build (zero configuration!)
   RUN npm run download-models
   
   # Include models in final image
   COPY --from=builder /app/models ./models
   ```

3. **Deploy anywhere:**
   ```bash
   # Works on all cloud providers
   gcloud run deploy --source .     # Google Cloud Run
   aws ecs create-service ...        # AWS ECS/Fargate  
   az container create ...           # Azure Container Instances
   wrangler publish                  # Cloudflare Workers
   ```

### Universal Dockerfile Template

```dockerfile
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run download-models  # ← Automatic model download
RUN npm run build

FROM node:24-slim AS production  
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --omit=optional
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models  # ← Models included
CMD ["node", "dist/server.js"]
```

### Benefits

- **⚡ 7x Faster Cold Starts** - No model download delays
- **🌐 Universal Compatibility** - Same Dockerfile works on all clouds
- **🔒 Offline Ready** - No external dependencies at runtime
- **📦 Zero Configuration** - Automatic model detection
- **🛡️ Enhanced Security** - No network calls for model loading

**📖 Complete Guide:** See [docs/docker-deployment.md](./docs/docker-deployment.md) for detailed examples covering Google
Cloud Run, AWS Lambda/ECS, Azure Container Instances, Cloudflare Workers, and more.

### 📦 Modern ES Modules Architecture

Brainy now uses individual ES modules instead of large bundles, providing better optimization for modern frameworks:

- **Better tree-shaking**: Frameworks import only the specific functions you use
- **Smaller final apps**: Your bundled application only includes what you actually need
- **Faster development builds**: No complex bundling during development
- **Better debugging**: Source maps point to individual files, not large bundles

This change reduced the package size significantly while improving compatibility with Angular, React, Vue, and other
modern framework build systems.

## 🧬 The Power of Nouns & Verbs

Brainy uses a **graph-based data model** that mirrors how humans think - with **Nouns** (entities) connected by **Verbs
** (relationships). This isn't just vectors in a void; it's structured, meaningful data.

### 📝 Nouns (What Things Are)

Nouns are your entities - the "things" in your data. Each noun has:

- A unique ID
- A vector representation (for similarity search)
- A type (Person, Document, Concept, etc.)
- Custom metadata

**Available Noun Types:**

| Category            | Types                                                             | Use For                                               |
|---------------------|-------------------------------------------------------------------|-------------------------------------------------------|
| **Core Entities**   | `Person`, `Organization`, `Location`, `Thing`, `Concept`, `Event` | People, companies, places, objects, ideas, happenings |
| **Digital Content** | `Document`, `Media`, `File`, `Message`, `Content`                 | PDFs, images, videos, emails, posts, generic content  |
| **Collections**     | `Collection`, `Dataset`                                           | Groups of items, structured data sets                 |
| **Business**        | `Product`, `Service`, `User`, `Task`, `Project`                   | E-commerce, SaaS, project management                  |
| **Descriptive**     | `Process`, `State`, `Role`                                        | Workflows, conditions, responsibilities               |

### 🔗 Verbs (How Things Connect)

Verbs are your relationships - they give meaning to connections. Not just "these vectors are similar" but "this OWNS
that" or "this CAUSES that".

**Available Verb Types:**

| Category       | Types                                                                | Examples                                 |
|----------------|----------------------------------------------------------------------|------------------------------------------|
| **Core**       | `RelatedTo`, `Contains`, `PartOf`, `LocatedAt`, `References`         | Generic relations, containment, location |
| **Temporal**   | `Precedes`, `Succeeds`, `Causes`, `DependsOn`, `Requires`            | Time sequences, causality, dependencies  |
| **Creation**   | `Creates`, `Transforms`, `Becomes`, `Modifies`, `Consumes`           | Creation, change, consumption            |
| **Ownership**  | `Owns`, `AttributedTo`, `CreatedBy`, `BelongsTo`                     | Ownership, authorship, belonging         |
| **Social**     | `MemberOf`, `WorksWith`, `FriendOf`, `Follows`, `Likes`, `ReportsTo` | Social networks, organizations           |
| **Functional** | `Describes`, `Implements`, `Validates`, `Triggers`, `Serves`         | Functions, implementations, services     |

### 💡 Why This Matters

```javascript
// Traditional vector DB: Just similarity
const similar = await vectorDB.search(embedding, 10)
// Result: [vector1, vector2, ...] - What do these mean? 🤷

// Brainy: Similarity + Meaning + Relationships
const catId = await brainy.add("Siamese cat", {
  noun: NounType.Thing,
  breed: "Siamese"
})
const ownerId = await brainy.add("John Smith", {
  noun: NounType.Person
})
await brainy.addVerb(ownerId, catId, {
  verb: VerbType.Owns,
  since: "2020-01-01"
})

// Now you can search with context!
const johnsPets = await brainy.getVerbsBySource(ownerId, VerbType.Owns)
const catOwners = await brainy.getVerbsByTarget(catId, VerbType.Owns)
```

## 🌍 Distributed Mode (New!)

Brainy now supports **distributed deployments** with multiple specialized instances sharing the same data. Perfect for
scaling your AI applications across multiple servers.

### Distributed Setup

```javascript
// Single instance (no change needed!)
const brainy = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } }
})

// Distributed mode requires explicit role configuration
// Option 1: Via environment variable
process.env.BRAINY_ROLE = 'writer'  // or 'reader' or 'hybrid'
const brainy = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  distributed: true
})

// Option 2: Via configuration
const writer = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  distributed: { role: 'writer' }  // Handles data ingestion
})

const reader = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  distributed: { role: 'reader' }  // Optimized for queries
})

// Option 3: Via read/write mode (role auto-inferred)
const writer = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  writeOnly: true,  // Automatically becomes 'writer' role
  distributed: true
})

const reader = createAutoBrainy({
  storage: { s3Storage: { bucketName: 'my-bucket' } },
  readOnly: true,   // Automatically becomes 'reader' role (allows optimizations)
  // frozen: true,  // Optional: Complete immutability for compliance/forensics
  distributed: true
})
```

### Key Distributed Features

**🎯 Explicit Role Configuration**

- Roles must be explicitly set (no dangerous auto-assignment)
- Can use environment variables, config, or read/write modes
- Clear separation between writers and readers

**#️⃣ Hash-Based Partitioning**

- Handles multiple writers with different data types
- Even distribution across partitions
- No semantic conflicts with mixed data

**🏷️ Domain Tagging**

- Automatic domain detection (medical, legal, product, etc.)
- Filter searches by domain
- Logical separation without complexity

```javascript
// Data is automatically tagged with domains
await brainy.add({
  symptoms: "fever",
  diagnosis: "flu"
}, metadata)  // Auto-tagged as 'medical'

// Search within specific domains
const medicalResults = await brainy.search(query, 10, {
  filter: { domain: 'medical' }
})
```

**📊 Health Monitoring**

- Real-time health metrics
- Automatic dead instance cleanup
- Performance tracking

```javascript
// Get health status
const health = brainy.getHealthStatus()
// {
//   status: 'healthy',
//   role: 'reader',
//   vectorCount: 1000000,
//   cacheHitRate: 0.95,
//   requestsPerSecond: 150
// }
```

**⚡ Role-Optimized Performance**

- **Readers**: 80% memory for cache, aggressive prefetching
- **Writers**: Optimized write batching, minimal cache
- **Hybrid**: Adaptive based on workload

## ⚖️ Compliance & Forensics Mode

For legal discovery, audit trails, and compliance requirements:

```javascript
// Create a completely immutable snapshot
const auditDb = new BrainyData({
  storage: { s3Storage: { bucketName: 'audit-snapshots' } },
  readOnly: true,
  frozen: true  // Complete immutability - no changes allowed
})

// Perfect for:
// - Legal discovery (data cannot be modified)
// - Compliance audits (guaranteed state)
// - Forensic analysis (preserved evidence)
// - Regulatory snapshots (unchanging records)
```

### Deployment Examples

**Docker Compose**

```yaml
services:
  writer:
    image: myapp
    environment:
      BRAINY_ROLE: writer  # Optional - auto-detects

  reader:
    image: myapp
    environment:
      BRAINY_ROLE: reader  # Optional - auto-detects
    scale: 5
```

**Kubernetes**

```yaml
# Automatically detects role from deployment type
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brainy-readers
spec:
  replicas: 10  # Multiple readers
  template:
    spec:
      containers:
        - name: app
          image: myapp
          # Role auto-detected as 'reader' (multiple replicas)
```

**Benefits**

- ✅ **50-70% faster searches** with parallel readers
- ✅ **No coordination complexity** - Shared JSON config in S3
- ✅ **Zero downtime scaling** - Add/remove instances anytime
- ✅ **Automatic failover** - Dead instances cleaned up automatically

## 🤔 Why Choose Brainy?

### vs. Traditional Databases

❌ **PostgreSQL with pgvector** - Requires complex setup, tuning, and DevOps expertise  
✅ **Brainy** - Zero config, auto-optimizes, works everywhere from browser to cloud

### vs. Vector Databases

❌ **Pinecone/Weaviate/Qdrant** - Cloud-only, expensive, vendor lock-in  
✅ **Brainy** - Run locally, in browser, or cloud. Your choice, your data

### vs. Graph Databases

❌ **Neo4j** - Great for graphs, no vector support  
✅ **Brainy** - Vectors + graphs in one. Best of both worlds

### vs. DIY Solutions

❌ **Building your own** - Months of work, optimization nightmares  
✅ **Brainy** - Production-ready in 30 seconds

## 🚀 Getting Started in 30 Seconds

**The same Brainy code works everywhere - React, Vue, Angular, Node.js, Serverless, Edge Workers.**

```javascript
// This EXACT code works in ALL environments
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()
await brainy.init()

// Add nouns (entities)
const openai = await brainy.add("OpenAI", { type: "company" })
const gpt4 = await brainy.add("GPT-4", { type: "product" })

// Add verbs (relationships)
await brainy.relate(openai, gpt4, "develops")

// Vector search + Graph traversal
const similar = await brainy.search("AI companies", 5)
const products = await brainy.getVerbsBySource(openai)
```

<details>
<summary>🔍 See Framework Examples</summary>

### React
```jsx
function App() {
  const [brainy] = useState(() => new BrainyData())
  useEffect(() => brainy.init(), [])
  
  const search = async (query) => {
    return await brainy.search(query, 10)
  }
  // Same API as above
}
```

### Vue 3
```vue
<script setup>
const brainy = new BrainyData()
await brainy.init()
// Same API as above
</script>
```

### Angular
```typescript
@Component({})
export class AppComponent {
  brainy = new BrainyData()
  async ngOnInit() {
    await this.brainy.init()
    // Same API as above
  }
}
```

### Node.js / Deno / Bun
```javascript
const brainy = new BrainyData()
await brainy.init()
// Same API as above
```
</details>

### 🌍 Framework-First, Runs Everywhere

**Brainy automatically detects your environment and optimizes everything:**

| Environment | Storage | Optimization |
|------------|---------|-------------|
| 🌐 Browser | OPFS | Web Workers, Memory Cache |
| 🟢 Node.js | FileSystem / S3 | Worker Threads, Clustering |
| ⚡ Serverless | S3 / Memory | Cold Start Optimization |
| 🔥 Edge Workers | Memory / KV | Minimal Footprint |
| 🦕 Deno/Bun | FileSystem / S3 | Native Performance |

## 🌐 Deploy to Any Cloud

<details>
<summary>☁️ See Cloud Platform Examples</summary>

### Cloudflare Workers
```javascript
import { BrainyData } from '@soulcraft/brainy'

export default {
  async fetch(request) {
    const brainy = new BrainyData()
    await brainy.init()
    
    const url = new URL(request.url)
    const results = await brainy.search(url.searchParams.get('q'), 10)
    return Response.json(results)
  }
}
```

### AWS Lambda
```javascript
import { BrainyData } from '@soulcraft/brainy'

export const handler = async (event) => {
  const brainy = new BrainyData()
  await brainy.init()
  
  const results = await brainy.search(event.query, 10)
  return { statusCode: 200, body: JSON.stringify(results) }
}
```

### Google Cloud Functions
```javascript
import { BrainyData } from '@soulcraft/brainy'

export const searchHandler = async (req, res) => {
  const brainy = new BrainyData()
  await brainy.init()
  
  const results = await brainy.search(req.query.q, 10)
  res.json(results)
}
```

### Vercel Edge Functions
```javascript
import { BrainyData } from '@soulcraft/brainy'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  const brainy = new BrainyData()
  await brainy.init()
  
  const { searchParams } = new URL(request.url)
  const results = await brainy.search(searchParams.get('q'), 10)
  return Response.json(results)
}
```
</details>


### Docker Container

```dockerfile
FROM node:24-slim
USER node
WORKDIR /app
COPY package*.json ./
RUN npm install brainy
COPY . .

CMD ["node", "server.js"]
```

```javascript
// server.js
import { createAutoBrainy } from 'brainy'
import express from 'express'

const app = express()
const brainy = createAutoBrainy()

app.get('/search', async (req, res) => {
  const results = await brainy.searchText(req.query.q, 10)
  res.json(results)
})

app.listen(3000, () => console.log('Brainy running on port 3000'))
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brainy-api
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: brainy
          image: your-registry/brainy-api:latest
          env:
            - name: S3_BUCKET
              value: "your-vector-bucket"
```

### Railway.app

```javascript
// server.js
import { createAutoBrainy } from 'brainy'

const brainy = createAutoBrainy({
  bucketName: process.env.RAILWAY_VOLUME_NAME
})

// Railway automatically handles the rest!
```

### Render.com

```yaml
# render.yaml
services:
  - type: web
    name: brainy-api
    env: node
    buildCommand: npm install brainy
    startCommand: node server.js
    envVars:
      - key: BRAINY_STORAGE
        value: persistent-disk
```

## Getting Started

- [**Quick Start Guide**](docs/getting-started/) - Get up and running in minutes
- [**Installation**](docs/getting-started/installation.md) - Detailed setup instructions
- [**Environment Setup**](docs/getting-started/environment-setup.md) - Platform-specific configuration

### User Guides

- [**Search and Metadata**](docs/user-guides/) - Advanced search techniques
- [**JSON Document Search**](docs/guides/json-document-search.md) - Field-based searching
- [**Read-Only & Frozen Modes**](docs/guides/readonly-frozen-modes.md) - Immutability options for production
- [**Production Migration**](docs/guides/production-migration-guide.md) - Deployment best practices

### API Reference

- [**Core API**](docs/api-reference/) - Complete method reference
- [**Configuration Options**](docs/api-reference/configuration.md) - All configuration parameters

### Optimization & Scaling

- [**Performance Features Guide**](docs/PERFORMANCE_FEATURES.md) - Advanced caching, auto-configuration, and
  optimization
- [**Large-Scale Optimizations**](docs/optimization-guides/) - Handle millions of vectors
- [**Memory Management**](docs/optimization-guides/memory-optimization.md) - Efficient resource usage
- [**S3 Migration Guide**](docs/optimization-guides/s3-migration-guide.md) - Cloud storage setup

### Examples & Patterns

- [**Code Examples**](docs/examples/) - Real-world usage patterns
- [**Integrations**](docs/examples/integrations.md) - Third-party services
- [**Performance Patterns**](docs/examples/performance.md) - Optimization techniques

### Technical Documentation

- [**Architecture Overview**](docs/technical/) - System design and internals
- [**Testing Guide**](docs/technical/TESTING.md) - Testing strategies
- [**Statistics & Monitoring**](docs/technical/STATISTICS.md) - Performance tracking

## 🤝 Contributing

We welcome contributions! Please see:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Developer Documentation](docs/development/DEVELOPERS.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## 📄 License

[MIT](LICENSE)

---

<div align="center">
<strong>Ready to build something amazing? Get started with Brainy today!</strong>
</div>
