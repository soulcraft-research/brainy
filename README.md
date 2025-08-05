<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A powerful graph & vector data platform for AI applications across any environment**

</div>

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
- **🌍 True Write-Once, Run-Anywhere** - Same code runs in React, Angular, Vue, Node.js, Deno, Bun, serverless, edge
  workers, and even vanilla HTML
- **⚡ Scary Fast** - Handles millions of vectors with sub-millisecond search. Built-in GPU acceleration when available
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

## 🚀 Quick Start (30 seconds!)

### Node.js TLDR

```bash
# Install
npm install brainy

# Use it
```

```javascript
import { createAutoBrainy, NounType, VerbType } from 'brainy'

const brainy = createAutoBrainy()

// Add data with Nouns (entities)
const catId = await brainy.add("Siamese cats are elegant and vocal", {
  noun: NounType.Thing,
  breed: "Siamese",
  category: "animal"
})

const ownerId = await brainy.add("John loves his pets", {
  noun: NounType.Person,
  name: "John Smith"
})

// Connect with Verbs (relationships)
await brainy.addVerb(ownerId, catId, {
  verb: VerbType.Owns,
  since: "2020-01-01"
})

// Search by meaning
const results = await brainy.searchText("feline companions", 5)

// Search JSON documents by specific fields
const docs = await brainy.searchDocuments("Siamese", {
  fields: ['breed', 'category'],  // Search these fields
  weights: { breed: 2.0 },         // Prioritize breed matches
  limit: 10
})

// Find relationships
const johnsPets = await brainy.getVerbsBySource(ownerId, VerbType.Owns)
```

That's it! No config, no setup, Zero-to-Smart™

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

### Smart Optimizations

- **🤖 Intelligent Auto-Configuration** - Detects environment, usage patterns, and optimizes everything automatically
- **⚡ Runtime Performance Adaptation** - Continuously monitors and self-tunes based on real usage
- **🌐 Distributed Mode Detection** - Automatically enables real-time updates for shared storage scenarios
- **📊 Workload-Aware Optimization** - Adapts cache size and TTL based on read/write patterns
- **🧠 Adaptive Learning** - Gets smarter with usage, learns from your data access patterns
- **#️⃣ Intelligent Partitioning** - Hash-based partitioning for perfect load distribution
- **🎯 Role-Based Optimization** - Readers maximize cache, writers optimize throughput
- **🏷️ Domain-Aware Indexing** - Automatic categorization improves search relevance
- **🗂️ Multi-Level Caching** - Hot/warm/cold caching with predictive prefetching
- **💾 Memory Optimization** - 75% reduction with compression for large datasets

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

The offline models provide the **same functionality** with maximum reliability. Your existing code works unchanged - Brainy automatically detects and uses bundled models when available.

```javascript
import { createAutoBrainy } from 'brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Use the bundled model for offline operation
const brainy = createAutoBrainy({
  embeddingModel: BundledUniversalSentenceEncoder
})
```

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

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { createAutoBrainy } from 'https://unpkg.com/brainy/dist/unified.min.js'

    window.brainy = createAutoBrainy()

    window.search = async function(query) {
      const results = await brainy.searchText(query, 10)
      document.getElementById('results').innerHTML =
        results.map(r => `<div>${r.text}</div>`).join('')
    }
  </script>
</head>
<body>
<input onkeyup="search(this.value)" placeholder="Search...">
<div id="results"></div>
</body>
</html>
```

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

## 🚀 Quick Examples

### Basic Usage

```javascript
import { BrainyData, NounType, VerbType } from 'brainy'

// Initialize
const db = new BrainyData()
await db.init()

// Add data (automatically vectorized)
const catId = await db.add("Cats are independent pets", {
  noun: NounType.Thing,
  category: 'animal'
})

// Search for similar items
const results = await db.searchText("feline pets", 5)

// Add relationships
await db.addVerb(catId, dogId, {
  verb: VerbType.RelatedTo,
  description: 'Both are pets'
})
```

### AutoBrainy (Recommended)

```javascript
import { createAutoBrainy } from 'brainy'

// Everything auto-configured!
const brainy = createAutoBrainy()

// Just start using it
await brainy.addVector({ id: '1', vector: [0.1, 0.2, 0.3], text: 'Hello' })
const results = await brainy.search([0.1, 0.2, 0.3], 10)
```

### Scenario-Based Setup

```javascript
import { createQuickBrainy } from 'brainy'

// Choose your scale: 'small', 'medium', 'large', 'enterprise'
const brainy = await createQuickBrainy('large', {
  bucketName: 'my-vector-db'
})
```

### With Offline Models

```javascript
import { createAutoBrainy } from 'brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Use bundled model for offline operation
const brainy = createAutoBrainy({
  embeddingModel: BundledUniversalSentenceEncoder,
  // Model loads from local files, no network needed!
})

// Works exactly the same, but 100% offline
await brainy.add("This works without internet!", {
  noun: NounType.Content
})
```

## 🌐 Live Demo

**[Try the interactive demo](https://soulcraft-research.github.io/brainy/demo/index.html)** - See Brainy in action with
animations and examples.

## 🔧 Environment Support

| Environment    | Storage       | Threading      | Auto-Configured |
|----------------|---------------|----------------|-----------------|
| Browser        | OPFS          | Web Workers    | ✅               |
| Node.js        | FileSystem/S3 | Worker Threads | ✅               |
| Serverless     | Memory/S3     | Limited        | ✅               |
| Edge Functions | Memory/KV     | Limited        | ✅               |

## 📚 Documentation

### Getting Started

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

## 🔗 Related Projects

- [**Cartographer**](https://github.com/sodal-project/cartographer) - Standardized interfaces for Brainy

---

<div align="center">
<strong>Ready to build something amazing? Get started with Brainy today!</strong>
</div>
