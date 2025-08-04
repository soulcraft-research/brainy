<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A lightning-fast vector database that runs everywhere - from browsers to servers to edge functions**

[Live Demo](https://soulcraft-research.github.io/brainy/demo/index.html) | [Quick Start](#-quick-start) | [Documentation](docs/) | [Examples](examples/)

</div>

## ✨ Why Brainy?

Brainy is a production-ready vector database that **automatically adapts** to your environment. Whether you're building AI applications, recommendation systems, or knowledge graphs, Brainy provides blazing-fast semantic search with zero configuration.

### 🚀 Key Features

- **⚡ Lightning Fast** - Sub-second search across millions of vectors
- **🌍 Runs Everywhere** - Browser, Node.js, Deno, Bun, Edge Workers, Containers
- **🧠 Zero Configuration** - Auto-detects environment and optimizes automatically
- **📈 Self-Optimizing** - Gets faster the more you use it through adaptive learning
- **🔄 Graph Relationships** - Connect data with semantic relationships, not just vectors
- **💾 75% Memory Reduction** - Advanced compression and intelligent caching
- **🎯 Production Ready** - Battle-tested with comprehensive optimizations

### 📊 Performance at Scale

| Dataset Size | Search Time | Memory Usage | 
|-------------|-------------|--------------|
| 10k vectors | ~50ms | Standard |
| 100k vectors | ~200ms | 30% reduction |
| 1M+ vectors | ~500ms | 75% reduction |

## 🎯 Quick Start

### Installation

```bash
npm install @soulcraft/brainy
```

### Zero Configuration Setup

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// That's it! Everything is auto-configured
const brainy = createAutoBrainy()

// Add data (automatically converted to vectors)
await brainy.add("Cats are independent pets", {
  category: 'animal',
  type: 'domestic'
})

// Search semantically
const results = await brainy.searchText("feline companions", 5)
console.log(results) // Returns similar items with scores
```

### Choose Your Scale

```typescript
import { createQuickBrainy } from '@soulcraft/brainy'

// Pick your scale: 'small', 'medium', 'large', 'enterprise'
const brainy = await createQuickBrainy('large', {
  bucketName: 'my-vector-storage' // Optional S3 storage
})
```

| Scale | Dataset Size | Best For |
|-------|-------------|----------|
| `small` | ≤10k vectors | Development, prototypes |
| `medium` | ≤100k vectors | Production apps |
| `large` | ≤1M vectors | Large applications |
| `enterprise` | ≤10M vectors | Enterprise systems |

## 🔥 Core Concepts

### Vector + Graph = Knowledge

Brainy combines vector similarity with graph relationships:

```typescript
// Add entities (automatically vectorized)
const catId = await db.add("Cats are independent pets", {
  noun: NounType.Thing,
  category: 'animal'
})

const dogId = await db.add("Dogs are loyal companions", {
  noun: NounType.Thing,
  category: 'animal'
})

// Create relationships
await db.addVerb(catId, dogId, {
  verb: VerbType.RelatedTo,
  relationship: 'both are pets'
})

// Search returns both similar vectors AND related entities
const results = await db.searchText("household pets", 5)
```

### Advanced Search Capabilities

```typescript
// Search within JSON document fields
const results = await db.search("Acme Corp", 10, {
  searchField: "company"
})

// Search by entity type
const people = await db.searchByNounTypes([NounType.Person], 10)

// Batch operations for performance
const ids = await db.addBatch([
  { vectorOrData: "First item", metadata: { category: 'A' }},
  { vectorOrData: "Second item", metadata: { category: 'B' }}
], { concurrency: 4, batchSize: 50 })
```

## 🏗️ Architecture

Brainy uses cutting-edge technologies to deliver exceptional performance:

- **HNSW Algorithm** - Hierarchical Navigable Small World for O(log n) search
- **TensorFlow.js** - Hardware-accelerated embeddings using GPU/WebGL
- **Multi-tier Storage** - Hot (RAM) → Warm (Fast Storage) → Cold (S3/Disk)
- **Semantic Partitioning** - Auto-clusters similar vectors for faster retrieval
- **Adaptive Caching** - Learns your access patterns and optimizes accordingly

## 📚 Documentation

- **[Getting Started Guide](docs/getting-started/)** - Installation and first steps
- **[User Guides](docs/user-guides/)** - Advanced usage and best practices
- **[API Reference](docs/api-reference/)** - Complete method documentation
- **[Optimization Guide](docs/optimization-guides/large-scale-optimizations.md)** - Scale to millions of vectors
- **[Examples](examples/)** - Real-world usage examples

## 🛠️ Advanced Features

### Augmentation Pipeline

Extend Brainy with custom data processing:

```typescript
import { createSenseAugmentation, pipeline } from '@soulcraft/brainy'

// Create custom augmentation
const customProcessor = createSenseAugmentation({
  name: 'my-processor',
  processRawData: async (data, type) => {
    // Your custom logic
    return { nouns: [], verbs: [] }
  }
})

// Register and use
pipeline.register(customProcessor)
```

### Model Control Protocol (MCP)

Let AI models interact with your Brainy database:

```typescript
import { BrainyMCPAdapter } from '@soulcraft/brainy'

const adapter = new BrainyMCPAdapter(brainy)
// Now AI models can query and update your database
```

## 🎮 Live Demo

**[Try it now!](https://soulcraft-research.github.io/brainy/demo/index.html)**

See Brainy in action with our interactive demo showcasing vector search, graph relationships, and cross-environment compatibility.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build

# Run demo locally
npm run demo
```

## 📄 License

[MIT](LICENSE) - Use it freely in your projects!

## 🙏 Acknowledgments

Built with ❤️ using:
- [TensorFlow.js](https://www.tensorflow.org/js) for embeddings
- [Universal Sentence Encoder](https://tfhub.dev/google/universal-sentence-encoder/4) for text vectorization

---

<div align="center">
<b>Ready to build something amazing?</b><br>
<a href="docs/getting-started/quick-start.md">Get Started →</a>
</div>