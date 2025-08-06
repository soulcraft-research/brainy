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

Imagine a database that thinks like you do - connecting ideas, finding patterns, and getting smarter over time. Brainy
is the **AI-native database** that brings vector search and knowledge graphs together in one powerful, ridiculously
easy-to-use package.

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

const brainy = new BrainyData()
await brainy.init() // Auto-detects your environment

// Add some data
await brainy.add("The quick brown fox jumps over the lazy dog")
await brainy.add("A fast fox leaps over a sleeping dog")
await brainy.add("Cats are independent and mysterious animals")

// Vector search finds similar content
const results = await brainy.search("speedy animals jumping", 2)
console.log(results) // Finds the fox sentences!
```

**🎯 That's it!** You just built semantic search in 4 lines. Works in Angular, React, Vue, Node.js, browsers,
serverless - everywhere.

## 🚀 The Magic: Vector + Graph Database

**Most databases do one thing.** Brainy does both vector similarity AND graph relationships:

```javascript
// Add entities with relationships
const companyId = await brainy.addNoun("OpenAI creates powerful AI models", "company")
const productId = await brainy.addNoun("GPT-4 is a large language model", "product")

// Connect them with relationships  
await brainy.addVerb(companyId, productId, undefined, { type: "develops" })

// Now you can do BOTH:
const similar = await brainy.search("AI language models")  // Vector similarity
const products = await brainy.getVerbsByType("develops")   // Graph traversal
```

**Why this matters:** Find content by meaning AND follow relationships. It's like having PostgreSQL and Pinecone working
together seamlessly.

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

## 🚀 Write-Once, Run-Anywhere Quick Start

Brainy uses the same code across all environments with automatic detection. **Framework-optimized** for the best
developer experience. Choose your environment:

### 🅰️ Angular (Latest)

```bash
npm install @soulcraft/brainy
```

```typescript
import { Component, signal, OnInit } from '@angular/core'
import { BrainyData } from '@soulcraft/brainy'

@Component({
  selector: 'app-search',
  template: `
    <div class="search-container">
      <input [(ngModel)]="query" 
             (input)="search($event.target.value)" 
             placeholder="Search by meaning (try 'pets' or 'food')..."
             class="search-input">
      
      <div class="results">
        @for (result of results(); track result.id) {
          <div class="result-item">
            <strong>{{result.metadata?.category}}</strong>: {{result.metadata?.originalData}}
            <small>Similarity: {{result.score | number:'1.2-2'}}</small>
          </div>
        }
      </div>
    </div>
  `
})
export class SearchComponent implements OnInit {
  private brainy: BrainyData | null = null
  results = signal<any[]>([])
  query = ''

  async ngOnInit() {
    // Auto-detects environment and uses OPFS storage in browsers
    this.brainy = new BrainyData({
      defaultService: 'my-app'
    })
    await this.brainy.init()

    // Add sample data
    await this.brainy.add("Cats are amazing pets", { category: "animals" })
    await this.brainy.add("Dogs love to play fetch", { category: "animals" })
    await this.brainy.add("Pizza is delicious food", { category: "food" })
  }

  async search(query: string) {
    if (!query.trim() || !this.brainy) {
      this.results.set([])
      return
    }

    const searchResults = await this.brainy.search(query, 5)
    this.results.set(searchResults)
  }
}
```

### ⚛️ React

```bash
npm install @soulcraft/brainy
```

```jsx
import { BrainyData } from '@soulcraft/brainy'
import { useEffect, useState } from 'react'

function SemanticSearch() {
  const [brainy, setBrainy] = useState(null)
  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initBrainy() {
      // Auto-detects environment and uses OPFS storage in browsers
      const db = new BrainyData({
        defaultService: 'my-app'
      })
      await db.init()

      // Add sample data
      await db.add("Cats are amazing pets", { category: "animals" })
      await db.add("Dogs love to play fetch", { category: "animals" })
      await db.add("Pizza is delicious food", { category: "food" })

      setBrainy(db)
      setLoading(false)
    }

    initBrainy()
  }, [])

  const search = async (searchQuery) => {
    if (!searchQuery.trim() || !brainy) return setResults([])

    const searchResults = await brainy.search(searchQuery, 5)
    setResults(searchResults)
  }

  if (loading) return <div>Initializing Brainy...</div>

  return (
    <div className="search-container">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          search(e.target.value)
        }}
        placeholder="Search by meaning (try 'pets' or 'food')..."
        className="search-input"
      />

      <div className="results">
        {results.map((result, i) => (
          <div key={result.id} className="result-item">
            <strong>{result.metadata?.category}</strong>: {result.metadata?.originalData}
            <small>Similarity: {result.score.toFixed(2)}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SemanticSearch
```

### 🌟 Vue 3

```bash
npm install @soulcraft/brainy
```

```vue

<template>
  <div class="search-container">
    <input
      v-model="query"
      @input="search"
      placeholder="Search by meaning (try 'pets' or 'food')..."
      class="search-input"
    />

    <div v-if="loading" class="loading">
      Initializing Brainy...
    </div>

    <div v-else class="results">
      <div
        v-for="result in results"
        :key="result.id"
        class="result-item"
      >
        <strong>{{ result.metadata?.category }}</strong>: {{ result.metadata?.originalData }}
        <small>Similarity: {{ result.score.toFixed(2) }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { BrainyData } from '@soulcraft/brainy'
  import { ref, onMounted } from 'vue'

  const brainy = ref(null)
  const results = ref([])
  const query = ref('')
  const loading = ref(true)

  onMounted(async () => {
    // Auto-detects environment and uses OPFS storage in browsers
    const db = new BrainyData({
      defaultService: 'my-app'
    })
    await db.init()

    // Add sample data
    await db.add("Cats are amazing pets", { category: "animals" })
    await db.add("Dogs love to play fetch", { category: "animals" })
    await db.add("Pizza is delicious food", { category: "food" })

    brainy.value = db
    loading.value = false
  })

  const search = async () => {
    if (!query.value.trim() || !brainy.value) {
      results.value = []
      return
    }

    const searchResults = await brainy.value.search(query.value, 5)
    results.value = searchResults
  }
</script>

<style scoped>
  .search-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .search-input {
    width: 100%;
    padding: 12px;
    margin-bottom: 20px;
    border: 2px solid #ddd;
    border-radius: 8px;
  }

  .result-item {
    padding: 12px;
    border: 1px solid #eee;
    margin-bottom: 8px;
    border-radius: 6px;
  }

  .loading {
    text-align: center;
    color: #666;
  }
</style>
```

### 🟢 Node.js Server

```bash
npm install @soulcraft/brainy
```

```javascript
import { BrainyData } from '@soulcraft/brainy'

// Auto-detects Node.js → FileSystem (local) or S3 (production), Worker threads
const brainy = new BrainyData({
  defaultService: 'my-app',
  // Optional: Production S3 storage
  storage: {
    s3Storage: {
      bucketName: process.env.S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
})
await brainy.init()

// Same API everywhere
await brainy.add("Cats are amazing pets", { category: "animals" })
const results = await brainy.search("pets", 5)
console.log('Search results:', results)
```

### ⚡ Serverless (Vercel/Netlify)

```javascript
import { BrainyData } from '@soulcraft/brainy'

export default async function handler(req, res) {
  // Auto-detects serverless → S3/R2 storage for persistence, or Memory for temp
  const brainy = new BrainyData({
    defaultService: 'my-app',
    // Optional: Explicit S3-compatible storage
    storage: {
      r2Storage: {
        bucketName: process.env.R2_BUCKET,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        accountId: process.env.R2_ACCOUNT_ID
      }
    }
  })
  await brainy.init()

  // Same API everywhere  
  const results = await brainy.search(req.query.q, 5)
  res.json({ results })
}
```

### 🔥 Cloudflare Workers

```javascript
import { BrainyData } from '@soulcraft/brainy'

export default {
  async fetch(request) {
    // Auto-detects edge → Minimal footprint, KV storage
    const brainy = new BrainyData({
      defaultService: 'edge-app'
    })
    await brainy.init()

    // Same API everywhere
    const url = new URL(request.url)
    const results = await brainy.search(url.searchParams.get('q'), 5)
    return Response.json({ results })
  }
}
```

### 🦕 Deno

```typescript
import { BrainyData } from 'https://esm.sh/@soulcraft/brainy'

// Auto-detects Deno → Native compatibility, FileSystem storage
const brainy = new BrainyData({
  defaultService: 'deno-app'
})
await brainy.init()

// Same API everywhere
await brainy.add("Deno is awesome", { category: "tech" })
const results = await brainy.search("technology", 5)
console.log(results)
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
RUN npm run extract-models

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
   RUN npm run extract-models
   
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
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run extract-models  # ← Automatic model extraction
RUN npm run build

FROM node:24-alpine AS production  
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
  readOnly: true,   // Automatically becomes 'reader' role
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

### React

```jsx
import { createAutoBrainy } from 'brainy'
import { useEffect, useState } from 'react'

function SemanticSearch() {
  const [brainy] = useState(() => createAutoBrainy())
  const [results, setResults] = useState([])

  const search = async (query) => {
    const items = await brainy.searchText(query, 10)
    setResults(items)
  }

  return (
    <input onChange={(e) => search(e.target.value)}
           placeholder="Search by meaning..." />
  )
}
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core'
import { createAutoBrainy } from 'brainy'

@Component({
  selector: 'app-search',
  template: `
    <input (input)="search($event.target.value)" 
           placeholder="Semantic search...">
    <div *ngFor="let result of results">
      {{ result.text }}
    </div>
  `
})
export class SearchComponent implements OnInit {
  brainy = createAutoBrainy()
  results = []

  async search(query: string) {
    this.results = await this.brainy.searchText(query, 10)
  }
}
```

### Vue 3

```vue

<script setup>
  import { createAutoBrainy } from 'brainy'
  import { ref } from 'vue'

  const brainy = createAutoBrainy()
  const results = ref([])

  const search = async (query) => {
    results.value = await brainy.searchText(query, 10)
  }
</script>

<template>
  <input @input="search($event.target.value)"
         placeholder="Find similar content...">
  <div v-for="result in results" :key="result.id">
    {{ result.text }}
  </div>
</template>
```

### Svelte

```svelte
<script>
  import { createAutoBrainy } from 'brainy'
  
  const brainy = createAutoBrainy()
  let results = []
  
  async function search(e) {
    results = await brainy.searchText(e.target.value, 10)
  }
</script>

<input on:input={search} placeholder="AI-powered search...">
{#each results as result}
  <div>{result.text}</div>
{/each}
```

### Next.js (App Router)

```jsx
// app/search/page.js
import { createAutoBrainy } from 'brainy'

export default function SearchPage() {
  async function search(formData) {
    'use server'
    const brainy = createAutoBrainy({ bucketName: 'vectors' })
    const query = formData.get('query')
    return await brainy.searchText(query, 10)
  }

  return (
    <form action={search}>
      <input name="query" placeholder="Search..." />
      <button type="submit">Search</button>
    </form>
  )
}
```

### Node.js / Bun / Deno

```javascript
import { createAutoBrainy } from 'brainy'

const brainy = createAutoBrainy()

// Add some data
await brainy.add("TypeScript is a typed superset of JavaScript", {
  category: 'programming'
})

// Search for similar content
const results = await brainy.searchText("JavaScript with types", 5)
console.log(results)
```

### 🌍 Framework-First, Runs Everywhere

**Brainy is designed for modern frameworks** with automatic environment detection and storage selection:

**✨ Supported environments:**

- ⚛️ **React/Vue/Angular** - Framework-optimized builds with proper bundling
- 🟢 **Node.js/Deno/Bun** - Full server-side capabilities
- ⚡ **Serverless/Edge** - Optimized for cold starts and minimal footprint
- 🧵 **Web/Worker threads** - Thread-safe, shared storage

**🗄️ Auto-selected storage:**

- 🌐 **OPFS** - Browser frameworks (persistent, fast)
- 📁 **FileSystem** - Node.js servers (local development)
- ☁️ **S3/R2/GCS** - Production, serverless, distributed deployments
- 💾 **Memory** - Edge workers, testing, temporary data

**🚀 Framework benefits:**

- ✅ **Proper bundling** - Handles dynamic imports and dependencies correctly
- ✅ **Type safety** - Full TypeScript integration and IntelliSense
- ✅ **State management** - Reactive updates and component lifecycle
- ✅ **Production ready** - Tree-shaking, optimization, error boundaries

**Note:** We focus on framework support for reliability. Vanilla JS had too many module resolution issues.

### Cloudflare Workers

```javascript
import { createAutoBrainy } from 'brainy'

export default {
  async fetch(request, env) {
    const brainy = createAutoBrainy({
      bucketName: env.R2_BUCKET
    })

    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    const results = await brainy.searchText(query, 10)
    return Response.json(results)
  }
}
```

### AWS Lambda

```javascript
import { createAutoBrainy } from 'brainy'

export const handler = async (event) => {
  const brainy = createAutoBrainy({
    bucketName: process.env.S3_BUCKET
  })

  const results = await brainy.searchText(event.query, 10)

  return {
    statusCode: 200,
    body: JSON.stringify(results)
  }
}
```

### Azure Functions

```javascript
import { createAutoBrainy } from 'brainy'

module.exports = async function(context, req) {
  const brainy = createAutoBrainy({
    bucketName: process.env.AZURE_STORAGE_CONTAINER
  })

  const results = await brainy.searchText(req.query.q, 10)

  context.res = {
    body: results
  }
}
```

### Google Cloud Functions

```javascript
import { createAutoBrainy } from 'brainy'

export const searchHandler = async (req, res) => {
  const brainy = createAutoBrainy({
    bucketName: process.env.GCS_BUCKET
  })

  const results = await brainy.searchText(req.query.q, 10)
  res.json(results)
}
```

### Google Cloud Run

```dockerfile
# Dockerfile
FROM node:20-alpine
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
const brainy = createAutoBrainy({
  bucketName: process.env.GCS_BUCKET
})

app.get('/search', async (req, res) => {
  const results = await brainy.searchText(req.query.q, 10)
  res.json(results)
})

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Brainy on Cloud Run: ${port}`))
```

```bash
# Deploy to Cloud Run
gcloud run deploy brainy-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Vercel Edge Functions

```javascript
import { createAutoBrainy } from 'brainy'

export const config = {
  runtime: 'edge'
}

export default async function handler(request) {
  const brainy = createAutoBrainy()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  const results = await brainy.searchText(query, 10)
  return Response.json(results)
}
```

### Netlify Functions

```javascript
import { createAutoBrainy } from 'brainy'

export async function handler(event, context) {
  const brainy = createAutoBrainy()
  const query = event.queryStringParameters.q

  const results = await brainy.searchText(query, 10)

  return {
    statusCode: 200,
    body: JSON.stringify(results)
  }
}
```

### Supabase Edge Functions

```typescript
import { createAutoBrainy } from 'brainy'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const brainy = createAutoBrainy()
  const url = new URL(req.url)
  const query = url.searchParams.get('q')

  const results = await brainy.searchText(query, 10)

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Docker Container

```dockerfile
FROM node:20-alpine
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
