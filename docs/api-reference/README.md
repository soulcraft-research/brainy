# API Reference

Complete documentation of Brainy's APIs, methods, and interfaces.

## 🚀 Quick API Access

### Zero-Configuration APIs (Recommended)

```typescript
// Easiest setup - everything auto-configured
import { createAutoBrainy } from '@soulcraft/brainy'
const brainy = createAutoBrainy()

// Scenario-based setup
import { createQuickBrainy } from '@soulcraft/brainy'
const brainy = await createQuickBrainy('large')
```

### Traditional APIs

```typescript
// Manual configuration (advanced users)
import { BrainyData, createScaledHNSWSystem } from '@soulcraft/brainy'
const brainy = new BrainyData(config)
```

## 📚 API Documentation Sections

### 🎯 [Core API](core-api.md)
Main BrainyData class and essential methods.

- **BrainyData Class**: Primary database interface
- **Initialization**: `init()`, setup methods
- **Basic Operations**: `add()`, `get()`, `delete()`, `search()`
- **Lifecycle Management**: `cleanup()`, `shutdown()`

### 🔢 [Vector Operations](vector-operations.md)
Vector storage, search, and manipulation.

- **Adding Vectors**: `addVector()`, `addBatch()`, `addText()`
- **Searching**: `search()`, `searchText()`, `searchByNounTypes()`
- **Vector Math**: `embed()`, `calculateSimilarity()`
- **Batch Operations**: Parallel processing, optimization

### 🕸️ [Graph Operations](graph-operations.md)
Noun and verb relationships (knowledge graph).

- **Nouns (Entities)**: Node management, metadata
- **Verbs (Relationships)**: Edge creation, querying
- **Graph Traversal**: Relationship discovery, path finding
- **Graph Analytics**: Statistics, visualization

### ⚙️ [Configuration API](configuration.md)
System configuration and optimization settings.

- **ScaledHNSWConfig**: Complete configuration interface
- **Auto-Configuration**: Environment detection, adaptive settings
- **Manual Overrides**: Custom parameter tuning
- **Performance Tuning**: Optimization flags, memory management

### 💾 [Storage Adapters](storage-adapters.md)
Storage backend interfaces and implementations.

- **StorageAdapter Interface**: Common storage methods
- **Memory Storage**: In-memory operations
- **FileSystem Storage**: Local file persistence
- **OPFS Storage**: Browser persistent storage
- **S3 Storage**: Cloud storage integration

### 🔌 [Augmentations API](augmentations.md)
Extension system for custom functionality.

- **Augmentation Types**: SENSE, MEMORY, COGNITION, etc.
- **Pipeline System**: Data processing workflows
- **Custom Augmentations**: Creating extensions
- **WebSocket Support**: Real-time communication

### 🎛️ [Auto-Configuration API](auto-configuration-api.md)
Intelligent configuration and adaptive learning.

- **Environment Detection**: Platform and resource discovery
- **Performance Learning**: Adaptive optimization
- **Quick Setup**: Scenario-based configuration
- **Monitoring**: Performance metrics and reporting

## 🔧 Method Categories

### Essential Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `createAutoBrainy()` | Zero-config setup | `const brainy = createAutoBrainy()` |
| `addVector()` | Add vector data | `await brainy.addVector({id, vector})` |
| `search()` | Find similar vectors | `const results = await brainy.search(vector, 10)` |
| `addText()` | Add text (auto-vectorized) | `await brainy.addText(id, 'Hello world')` |
| `searchText()` | Semantic text search | `const results = await brainy.searchText('query', 5)` |

### Advanced Methods

| Method | Purpose | Use Case |
|--------|---------|----------|
| `addBatch()` | Bulk operations | High-throughput data loading |
| `getPerformanceMetrics()` | System monitoring | Performance optimization |
| `updateDatasetAnalysis()` | Adaptive learning | Dynamic optimization |
| `createScaledHNSWSystem()` | Custom optimization | Enterprise deployments |

### Utility Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `embed()` | Text to vector | `const vector = await brainy.embed('text')` |
| `calculateSimilarity()` | Vector similarity | `const sim = await brainy.calculateSimilarity(a, b)` |
| `getStatistics()` | Database stats | `const stats = await brainy.getStatistics()` |
| `backup()` | Data export | `const data = await brainy.backup()` |

## 📋 Interface Reference

### Core Interfaces

```typescript
// Main configuration interface
interface ScaledHNSWConfig {
  expectedDatasetSize?: number
  maxMemoryUsage?: number
  targetSearchLatency?: number
  s3Config?: S3Config
  autoConfigureEnvironment?: boolean
  learningEnabled?: boolean
}

// Vector document structure
interface VectorDocument {
  id: string
  vector: number[]
  metadata?: Record<string, any>
  text?: string
}

// Search result format
type SearchResult = [string, number]  // [id, distance]
```

### Auto-Configuration Interfaces

```typescript
// Auto-configuration result
interface AutoConfigResult {
  environment: 'browser' | 'nodejs' | 'serverless'
  availableMemory: number
  cpuCores: number
  recommendedConfig: RecommendedConfig
  optimizationFlags: OptimizationFlags
}

// Quick setup scenarios
type Scenario = 'small' | 'medium' | 'large' | 'enterprise'
```

## 🎯 Usage Patterns

### Basic Pattern (Recommended)

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()

// Add data
await brainy.addText('1', 'Machine learning is powerful')
await brainy.addText('2', 'Deep learning models are effective')

// Search
const results = await brainy.searchText('AI technology', 5)
```

### Production Pattern

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy({
  bucketName: process.env.S3_BUCKET_NAME
})

// Monitor performance
const metrics = brainy.getPerformanceMetrics()
console.log(`Search latency: ${metrics.averageSearchTime}ms`)
```

### Advanced Pattern

```typescript
import { createScaledHNSWSystem } from '@soulcraft/brainy'

const brainy = createScaledHNSWSystem({
  expectedDatasetSize: 1000000,
  maxMemoryUsage: 8 * 1024 * 1024 * 1024,
  targetSearchLatency: 100,
  s3Config: { bucketName: 'vectors' },
  learningEnabled: true
})
```

## 🔍 Search API Deep Dive

### Search Methods Comparison

| Method | Input Type | Use Case | Performance |
|--------|------------|----------|-------------|
| `search()` | Vector | Exact vector similarity | Fastest |
| `searchText()` | String | Semantic text search | Fast (with caching) |
| `searchByField()` | Field + Query | Targeted field search | Optimized |
| `searchByNounTypes()` | Types + Vector | Type-filtered search | Filtered |

### Search Options

```typescript
interface SearchOptions {
  searchField?: string          // Target specific fields
  services?: string[]          // Limit to specific services
  searchMode?: 'local' | 'remote' | 'combined'
  metadata?: Record<string, any>  // Metadata filters
}
```

## 🚨 Error Handling

### Common Error Types

```typescript
// Vector dimension mismatch
BrainyError: Vector dimension mismatch: expected 512, got 256

// Read-only mode violation
BrainyError: Cannot add data in read-only mode

// Storage initialization failure
BrainyError: Failed to initialize storage adapter
```

### Error Handling Pattern

```typescript
try {
  await brainy.addVector({ id: '1', vector: [0.1, 0.2] })
} catch (error) {
  if (error.message.includes('dimension mismatch')) {
    console.error('Vector has wrong dimensions')
  }
}
```

## 📊 Performance APIs

### Metrics Collection

```typescript
// Get current performance metrics
const metrics = brainy.getPerformanceMetrics()

// Available metrics
interface PerformanceMetrics {
  totalSearches: number
  averageSearchTime: number
  cacheHitRate: number
  memoryUsage: number
  indexSize: number
  partitionStats?: PartitionStats[]
}
```

### Performance Monitoring

```typescript
// Monitor performance over time
setInterval(() => {
  const metrics = brainy.getPerformanceMetrics()
  
  if (metrics.averageSearchTime > 500) {
    console.warn('Search performance degrading')
  }
  
  if (metrics.cacheHitRate < 0.7) {
    console.warn('Low cache hit rate')
  }
}, 60000)  // Check every minute
```

## 🔗 Related Documentation

- **[Getting Started](../getting-started/)** - Basic setup and usage
- **[User Guides](../user-guides/)** - Feature-specific guides
- **[Optimization Guides](../optimization-guides/)** - Performance tuning
- **[Examples](../examples/)** - Working code samples
- **[Technical Reference](../technical/)** - Implementation details

## 💡 API Design Principles

1. **Zero Configuration**: Sane defaults for immediate productivity
2. **Progressive Enhancement**: Simple → Advanced as needed
3. **Performance First**: Optimized for production workloads
4. **Type Safety**: Full TypeScript support with generics
5. **Error Resilience**: Graceful degradation and helpful error messages

---

**Explore the complete API documentation to unlock Brainy's full potential!** 🚀