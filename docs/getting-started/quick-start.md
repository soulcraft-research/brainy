# Quick Start Guide

Get your first Brainy application running in just a few minutes with zero configuration required!

## ⚡ The 2-Minute Setup

### 1. Install Brainy

```bash
npm install @soulcraft/brainy
```

### 2. Create Your First Vector Database

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// That's it! Everything is auto-configured
const brainy = createAutoBrainy()

// Add some data
await brainy.addVector({ 
  id: '1', 
  vector: [0.1, 0.2, 0.3], 
  text: 'Hello world' 
})

// Search for similar vectors
const results = await brainy.search([0.1, 0.2, 0.3], 10)
console.log('Found:', results)
```

🎉 **Congratulations!** You now have a production-ready vector database with:
- ✅ Automatic environment detection
- ✅ Optimized memory management  
- ✅ Intelligent caching
- ✅ Performance auto-tuning

## 🎯 Choose Your Scenario

### Scenario 1: Development & Testing
```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// Perfect for development - uses memory storage
const brainy = createAutoBrainy()

// Add test data
await brainy.addVector({ id: '1', vector: [0.1, 0.2, 0.3] })
await brainy.addVector({ id: '2', vector: [0.4, 0.5, 0.6] })

// Search
const results = await brainy.search([0.1, 0.2, 0.3], 5)
```

### Scenario 2: Production with Persistence
```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// Auto-detects AWS credentials from environment variables
const brainy = createAutoBrainy({
  bucketName: 'my-vector-storage'
})

// Data persists in S3 - survives restarts
await brainy.addVector({ id: '1', vector: [0.1, 0.2, 0.3] })
```

### Scenario 3: Scale-Specific Setup
```typescript
import { createQuickBrainy } from '@soulcraft/brainy'

// Choose your scale: 'small', 'medium', 'large', 'enterprise'
const brainy = await createQuickBrainy('large', {
  bucketName: 'my-big-vector-db'
})

// System auto-configures for 1M+ vectors
```

### Scenario 4: Text-Based Semantic Search
```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()

// Add text - automatically converted to vectors
await brainy.addText('1', 'Machine learning is fascinating')
await brainy.addText('2', 'Deep learning models are powerful')
await brainy.addText('3', 'Cats make great pets')

// Search by meaning, not keywords
const results = await brainy.searchText('AI and neural networks', 2)
// Returns: machine learning and deep learning results
```

## 🧠 What Auto-Configuration Does

When you use `createAutoBrainy()`, the system automatically:

### 🎯 **Environment Detection**
- Detects Browser, Node.js, or Serverless environment
- Configures threading (Web Workers vs Worker Threads)
- Sets appropriate memory limits

### 💾 **Smart Storage Selection**
- **Browser**: OPFS (persistent) → Memory (fallback)
- **Node.js**: FileSystem → S3 (if configured) 
- **Serverless**: S3 (if configured) → Memory

### ⚡ **Performance Optimization**
- **Memory Management**: Uses available RAM optimally
- **Semantic Partitioning**: Clusters similar vectors automatically
- **Distributed Search**: Parallel processing on multi-core systems
- **Multi-Level Caching**: Hot/Warm/Cold caching strategy

### 📊 **Adaptive Learning**
- Monitors search performance in real-time
- Adjusts parameters every 50 searches
- Learns from your data patterns
- Continuously improves performance

## 📋 Complete Examples

### Example 1: Document Search System

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()

// Add documents
const docs = [
  { id: 'doc1', text: 'Climate change affects global weather patterns' },
  { id: 'doc2', text: 'Machine learning models can predict weather' },
  { id: 'doc3', text: 'Solar panels reduce carbon emissions' }
]

for (const doc of docs) {
  await brainy.addText(doc.id, doc.text)
}

// Semantic search
const results = await brainy.searchText('environmental sustainability', 3)
console.log('Relevant documents:', results)
```

### Example 2: Recommendation System

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()

// Add user preferences as vectors
await brainy.addVector({ 
  id: 'user1', 
  vector: [0.8, 0.1, 0.9, 0.2], // [action, comedy, drama, horror]
  metadata: { name: 'Alice', age: 25 }
})

await brainy.addVector({ 
  id: 'user2', 
  vector: [0.1, 0.9, 0.2, 0.8],
  metadata: { name: 'Bob', age: 30 }
})

// Find similar users
const similar = await brainy.search([0.7, 0.2, 0.8, 0.1], 2)
console.log('Similar users:', similar)
```

### Example 3: Production API

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'
import express from 'express'

const app = express()
const brainy = createAutoBrainy({
  bucketName: process.env.S3_BUCKET_NAME
})

app.post('/add', async (req, res) => {
  const { id, text } = req.body
  await brainy.addText(id, text)
  res.json({ success: true })
})

app.get('/search', async (req, res) => {
  const { query, limit = 10 } = req.query
  const results = await brainy.searchText(query, limit)
  res.json({ results })
})

app.listen(3000, () => {
  console.log('Vector search API running on port 3000')
})
```

## 🚀 Performance Benchmarks

With auto-configuration, you can expect:

| Dataset Size | Search Time | Memory Usage | Setup Time |
|-------------|-------------|--------------|------------|
| 1k vectors | <10ms | <100MB | <1 second |
| 10k vectors | ~50ms | ~300MB | <5 seconds |
| 100k vectors | ~200ms | ~1GB | ~30 seconds |
| 1M vectors | ~500ms | ~4GB | ~5 minutes |

*Benchmarks on modern hardware. Actual performance varies by environment.*

## 🔄 Next Steps

Now that you have Brainy running:

### Learn More Features
- **[First Steps Guide](first-steps.md)** - Core concepts and features
- **[User Guides](../user-guides/)** - Advanced search techniques
- **[Optimization Guides](../optimization-guides/)** - Scale to millions

### Production Deployment
- **[Environment Setup](environment-setup.md)** - Configure for production
- **[API Reference](../api-reference/)** - Complete API documentation
- **[Examples](../examples/)** - Real-world integration patterns

### Get Help
- **[Troubleshooting](../troubleshooting/)** - Common issues and solutions
- **[GitHub Issues](https://github.com/soulcraft-research/brainy/issues)** - Bug reports
- **[GitHub Discussions](https://github.com/soulcraft-research/brainy/discussions)** - Community support

## 💡 Pro Tips

1. **Start Simple**: Use `createAutoBrainy()` first, optimize later
2. **Monitor Performance**: Check metrics with `brainy.getPerformanceMetrics()`
3. **Use S3 for Production**: Persistent storage survives restarts
4. **Let it Learn**: Performance improves automatically over time
5. **Scale Gradually**: Start with 'small' scenario, upgrade as needed

**Ready to build something amazing?** 🚀