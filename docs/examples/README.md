# Examples

Practical code examples and tutorials showing how to use Brainy in real-world applications.

## 🚀 Quick Examples

### Zero-Configuration Setup

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// Everything auto-configured!
const brainy = createAutoBrainy()

// Add and search in 3 lines
await brainy.addText('1', 'Machine learning is fascinating')
await brainy.addText('2', 'Deep learning models are powerful')
const results = await brainy.searchText('AI technology', 5)
```

## 📚 Example Categories

### 🎯 [Basic Usage](basic-usage.md)
Simple examples to get you started.

- First vector database
- Adding and searching data
- Text-based semantic search
- Basic configuration

### 🏗️ [Advanced Patterns](advanced-patterns.md)
Complex use cases and integration patterns.

- Batch operations and optimization
- Custom embedding functions
- Advanced search patterns
- Performance monitoring

### 🔌 [Integrations](integrations.md)
Third-party service integrations.

- Express.js API server
- Next.js applications
- AWS Lambda functions
- Docker deployments

### ⚡ [Performance Examples](performance.md)
Optimization and scaling examples.

- Large dataset handling
- Memory optimization
- S3 storage strategies
- Performance benchmarking

### 🌐 [Real-World Applications](real-world.md)
Complete application examples.

- Document search system
- Recommendation engine
- Knowledge base
- Chatbot with semantic search

## 🎯 Use Case Examples

### Document Search System

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

class DocumentSearchSystem {
  private brainy = createAutoBrainy({ bucketName: 'documents' })
  
  async addDocument(id: string, title: string, content: string) {
    await this.brainy.addText(id, `${title} ${content}`, {
      title,
      content,
      addedAt: new Date().toISOString()
    })
  }
  
  async searchDocuments(query: string, limit = 10) {
    return this.brainy.searchText(query, limit)
  }
}
```

### Recommendation Engine

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

class RecommendationEngine {
  private brainy = createQuickBrainy('medium', { bucketName: 'recommendations' })
  
  async addUserPreferences(userId: string, preferences: number[]) {
    await this.brainy.addVector({
      id: userId,
      vector: preferences,
      metadata: { type: 'user', lastUpdated: Date.now() }
    })
  }
  
  async getRecommendations(userId: string) {
    const user = await this.brainy.get(userId)
    if (!user) return []
    
    const similar = await this.brainy.search(user.vector, 10)
    return similar.filter(([id]) => id !== userId)
  }
}
```

### API Server

```typescript
import express from 'express'
import { createAutoBrainy } from '@soulcraft/brainy'

const app = express()
const brainy = createAutoBrainy({
  bucketName: process.env.S3_BUCKET_NAME
})

app.use(express.json())

// Add vector endpoint
app.post('/vectors', async (req, res) => {
  try {
    const { id, vector, metadata } = req.body
    await brainy.addVector({ id, vector, metadata })
    res.json({ success: true, id })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Search endpoint
app.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query
    const results = await brainy.searchText(query, parseInt(limit))
    res.json({ results })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Performance metrics endpoint
app.get('/metrics', async (req, res) => {
  const metrics = brainy.getPerformanceMetrics()
  res.json(metrics)
})

app.listen(3000, () => {
  console.log('Vector search API running on port 3000')
})
```

## 🛠️ Framework Integration Examples

### Next.js Application

```typescript
// pages/api/search.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createAutoBrainy } from '@soulcraft/brainy'

let brainy: any = null

async function getBrainy() {
  if (!brainy) {
    brainy = createAutoBrainy({
      bucketName: process.env.S3_BUCKET_NAME
    })
  }
  return brainy
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { query } = req.body
    const brainy = await getBrainy()
    const results = await brainy.searchText(query, 10)
    res.json({ results })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
```

### AWS Lambda Function

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda'
import { createAutoBrainy } from '@soulcraft/brainy'

// Initialize outside handler for connection reuse
const brainy = createAutoBrainy({
  bucketName: process.env.S3_BUCKET_NAME
})

export const search: APIGatewayProxyHandler = async (event) => {
  try {
    const { query, limit = 10 } = JSON.parse(event.body || '{}')
    
    const results = await brainy.searchText(query, limit)
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ results })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react'
import { createAutoBrainy } from '@soulcraft/brainy'

// Custom hook for vector search
export function useVectorSearch() {
  const [brainy, setBrainy] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function initBrainy() {
      const instance = createAutoBrainy()
      setBrainy(instance)
      setLoading(false)
    }
    initBrainy()
  }, [])
  
  const search = async (query: string, limit = 10) => {
    if (!brainy) return []
    return brainy.searchText(query, limit)
  }
  
  const addText = async (id: string, text: string) => {
    if (!brainy) return
    return brainy.addText(id, text)
  }
  
  return { search, addText, loading, brainy }
}

// Usage in component
function SearchComponent() {
  const { search, addText, loading } = useVectorSearch()
  const [results, setResults] = useState([])
  
  if (loading) return <div>Loading...</div>
  
  const handleSearch = async (query: string) => {
    const searchResults = await search(query)
    setResults(searchResults)
  }
  
  return (
    <div>
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results.map(([id, score]) => (
          <li key={id}>ID: {id}, Score: {score}</li>
        ))}
      </ul>
    </div>
  )
}
```

## 🎮 Interactive Examples

### Browser Console Examples

Open browser dev tools and try these:

```javascript
// Import Brainy in browser
import('https://unpkg.com/@soulcraft/brainy').then(async ({ createAutoBrainy }) => {
  const brainy = createAutoBrainy()
  
  // Add some test data
  await brainy.addText('1', 'JavaScript is a programming language')
  await brainy.addText('2', 'Python is great for data science')
  await brainy.addText('3', 'Machine learning uses algorithms')
  
  // Search semantically
  const results = await brainy.searchText('coding languages', 2)
  console.log('Search results:', results)
})
```

### Node.js REPL Examples

```bash
npm install @soulcraft/brainy
node
```

```javascript
const { createAutoBrainy } = require('@soulcraft/brainy')

const brainy = createAutoBrainy()

// Add vectors
brainy.addVector({ id: '1', vector: [0.1, 0.2, 0.3] })
brainy.addVector({ id: '2', vector: [0.4, 0.5, 0.6] })

// Search
brainy.search([0.1, 0.2, 0.3], 5).then(console.log)
```

## 📊 Performance Examples

### Benchmarking

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

async function benchmarkSearch() {
  const brainy = createAutoBrainy()
  
  // Add test data
  console.log('Adding 10,000 vectors...')
  const addStart = Date.now()
  
  for (let i = 0; i < 10000; i++) {
    await brainy.addVector({
      id: `vector-${i}`,
      vector: Array.from({ length: 512 }, () => Math.random())
    })
  }
  
  const addTime = Date.now() - addStart
  console.log(`Added 10k vectors in ${addTime}ms`)
  
  // Benchmark search
  console.log('Running search benchmark...')
  const searchStart = Date.now()
  
  for (let i = 0; i < 100; i++) {
    const query = Array.from({ length: 512 }, () => Math.random())
    await brainy.search(query, 10)
  }
  
  const searchTime = Date.now() - searchStart
  console.log(`100 searches completed in ${searchTime}ms`)
  console.log(`Average search time: ${searchTime / 100}ms`)
  
  // Get performance metrics
  const metrics = brainy.getPerformanceMetrics()
  console.log('Performance metrics:', metrics)
}

benchmarkSearch()
```

### Memory Monitoring

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()

// Monitor memory usage
setInterval(() => {
  const metrics = brainy.getPerformanceMetrics()
  const memoryMB = metrics.memoryUsage / 1024 / 1024
  
  console.log(`Memory usage: ${memoryMB.toFixed(1)}MB`)
  console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
  console.log(`Average search time: ${metrics.averageSearchTime.toFixed(1)}ms`)
}, 10000)  // Every 10 seconds
```

## 🔗 Related Documentation

- **[Getting Started](../getting-started/)** - Basic setup and first steps
- **[User Guides](../user-guides/)** - Feature-specific documentation
- **[API Reference](../api-reference/)** - Complete API documentation
- **[Optimization Guides](../optimization-guides/)** - Performance tuning

## 🎯 Example Request Guidelines

**Need a specific example?** Open a [GitHub Issue](https://github.com/soulcraftlabs/brainy/issues) with:

1. **Use Case**: What you're trying to build
2. **Environment**: Browser, Node.js, serverless, etc.
3. **Scale**: Expected dataset size and performance requirements
4. **Integration**: Frameworks or services you're using

We'll create examples based on community needs!

## 💡 Contributing Examples

Have a great Brainy example? We'd love to include it!

1. Fork the repository
2. Add your example to the appropriate section
3. Include clear comments and documentation
4. Test your example thoroughly
5. Submit a pull request

---

**Ready to build something amazing with Brainy?** Start with the [Basic Usage](basic-usage.md) examples! 🚀