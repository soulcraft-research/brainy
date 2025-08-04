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

Imagine a database that thinks like you do - connecting ideas, finding patterns, and getting smarter over time. Brainy is the **AI-native database** that brings vector search and knowledge graphs together in one powerful, ridiculously easy-to-use package.

### 🚀 Why Developers Love Brainy

- **🧠 It Just Works™** - No config files, no tuning parameters, no DevOps headaches. Brainy auto-detects your environment and optimizes itself
- **🌍 True Write-Once, Run-Anywhere** - Same code runs in React, Angular, Vue, Node.js, Deno, Bun, serverless, edge workers, and even vanilla HTML
- **⚡ Scary Fast** - Handles millions of vectors with sub-millisecond search. Built-in GPU acceleration when available
- **🎯 Self-Learning** - Like having a database that goes to the gym. Gets faster and smarter the more you use it
- **🔮 AI-First Design** - Built for the age of embeddings, RAG, and semantic search. Your LLMs will thank you
- **🎮 Actually Fun to Use** - Clean API, great DX, and it does the heavy lifting so you can build cool stuff

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

That's it! No config, no setup, it just works™

## 🎭 Key Features

### Core Capabilities
- **Vector Search** - Find semantically similar content using embeddings
- **Graph Relationships** - Connect data with meaningful relationships
- **JSON Document Search** - Search within specific fields with prioritization
- **Real-Time Syncing** - WebSocket and WebRTC for distributed instances
- **Streaming Pipeline** - Process data in real-time as it flows through
- **Model Control Protocol** - Let AI models access your data

### Smart Optimizations
- **Auto-Configuration** - Detects environment and optimizes automatically
- **Adaptive Learning** - Gets smarter with usage, optimizes itself over time
- **Intelligent Partitioning** - Semantic clustering with auto-tuning
- **Multi-Level Caching** - Hot/warm/cold caching with predictive prefetching
- **Memory Optimization** - 75% reduction with compression for large datasets

### Developer Experience
- **TypeScript Support** - Fully typed API with generics
- **Extensible Augmentations** - Customize and extend functionality
- **REST API** - Web service wrapper for HTTP endpoints
- **Auto-Complete** - IntelliSense for all APIs and types

## 📦 Installation

### Main Package
```bash
npm install brainy
```

### Optional: Offline Models Package
```bash
npm install @soulcraft/brainy-models
```

The `@soulcraft/brainy-models` package provides **offline access** to the Universal Sentence Encoder model, eliminating network dependencies and ensuring consistent performance. Perfect for:
- **Air-gapped environments** - No internet? No problem
- **Consistent performance** - No network latency or throttling
- **Privacy-focused apps** - Keep everything local
- **High-reliability systems** - No external dependencies

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
**🔍 Semantic Search Engines** - Search by meaning, not keywords. Find "that thing that's like a cat but bigger" → returns "tiger"  
**🎯 Recommendation Engines** - "Users who liked this also liked..." but actually good  
**🧬 Knowledge Graphs** - Connect everything to everything. Wikipedia meets Neo4j meets magic  
**👁️ Computer Vision Apps** - Store and search image embeddings. "Find all photos with dogs wearing hats"  
**🎵 Music Discovery** - Find songs that "feel" similar. Spotify's Discover Weekly in your app  
**📚 Smart Documentation** - Docs that answer questions. "How do I deploy to production?" → relevant guides  
**🛡️ Fraud Detection** - Find patterns humans can't see. Anomaly detection on steroids  
**🌐 Real-Time Collaboration** - Sync vector data across devices. Figma for AI data  
**🏥 Medical Diagnosis Tools** - Match symptoms to conditions using embedding similarity

## 🧬 The Power of Nouns & Verbs

Brainy uses a **graph-based data model** that mirrors how humans think - with **Nouns** (entities) connected by **Verbs** (relationships). This isn't just vectors in a void; it's structured, meaningful data.

### 📝 Nouns (What Things Are)

Nouns are your entities - the "things" in your data. Each noun has:
- A unique ID
- A vector representation (for similarity search)
- A type (Person, Document, Concept, etc.)
- Custom metadata

**Available Noun Types:**

| Category | Types | Use For |
|----------|-------|---------|
| **Core Entities** | `Person`, `Organization`, `Location`, `Thing`, `Concept`, `Event` | People, companies, places, objects, ideas, happenings |
| **Digital Content** | `Document`, `Media`, `File`, `Message`, `Content` | PDFs, images, videos, emails, posts, generic content |
| **Collections** | `Collection`, `Dataset` | Groups of items, structured data sets |
| **Business** | `Product`, `Service`, `User`, `Task`, `Project` | E-commerce, SaaS, project management |
| **Descriptive** | `Process`, `State`, `Role` | Workflows, conditions, responsibilities |

### 🔗 Verbs (How Things Connect)

Verbs are your relationships - they give meaning to connections. Not just "these vectors are similar" but "this OWNS that" or "this CAUSES that".

**Available Verb Types:**

| Category | Types | Examples |
|----------|-------|----------|
| **Core** | `RelatedTo`, `Contains`, `PartOf`, `LocatedAt`, `References` | Generic relations, containment, location |
| **Temporal** | `Precedes`, `Succeeds`, `Causes`, `DependsOn`, `Requires` | Time sequences, causality, dependencies |
| **Creation** | `Creates`, `Transforms`, `Becomes`, `Modifies`, `Consumes` | Creation, change, consumption |
| **Ownership** | `Owns`, `AttributedTo`, `CreatedBy`, `BelongsTo` | Ownership, authorship, belonging |
| **Social** | `MemberOf`, `WorksWith`, `FriendOf`, `Follows`, `Likes`, `ReportsTo` | Social networks, organizations |
| **Functional** | `Describes`, `Implements`, `Validates`, `Triggers`, `Serves` | Functions, implementations, services |

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

module.exports = async function (context, req) {
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

**[Try the interactive demo](https://soulcraft-research.github.io/brainy/demo/index.html)** - See Brainy in action with animations and examples.

## 🔧 Environment Support

| Environment | Storage | Threading | Auto-Configured |
|-------------|---------|-----------|-----------------|
| Browser | OPFS | Web Workers | ✅ |
| Node.js | FileSystem/S3 | Worker Threads | ✅ |
| Serverless | Memory/S3 | Limited | ✅ |
| Edge Functions | Memory/KV | Limited | ✅ |

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
- [**Auto-Configuration API**](docs/api-reference/auto-configuration-api.md) - Intelligent setup

### Optimization & Scaling
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
