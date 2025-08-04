# Large-Scale HNSW Optimizations Guide

This document describes the comprehensive set of large-scale optimizations implemented in Brainy v0.36.0 that transform the HNSW implementation from a prototype suitable for thousands of vectors into a production-ready system capable of handling millions of vectors with sub-second search times.

## 🚀 Zero-Configuration Setup

**New in v0.36.0**: Brainy now automatically detects your environment, available resources, and data patterns to provide optimal performance with minimal configuration!

### Quick Start - Just 2 Lines of Code!

```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// Fully auto-configured system - detects environment and optimizes automatically
const brainy = createAutoBrainy()

// Or with S3 persistence (auto-detects from environment variables)
const brainy = createAutoBrainy({
  bucketName: 'my-vector-storage'
})
```

### Scenario-Based Quick Setup

```typescript
import { createQuickBrainy } from '@soulcraft/brainy'

// Auto-configured for different scales
const brainy = await createQuickBrainy('medium', { 
  bucketName: 'my-vectors' 
})

// Available scenarios: 'small', 'medium', 'large', 'enterprise'
```

## Overview

The optimization suite consists of 6 core components working together with **intelligent auto-configuration**:

- **Search Time Improvements**: 10k vectors (~50ms), 100k vectors (~200ms), 1M vectors (~500ms)
- **Memory Optimization**: 75% reduction with quantization, configurable memory budget enforcement
- **Scalability**: 50-90% reduction in S3 requests, up to 20 parallel searches, automatic load balancing
- **API Call Reduction**: Intelligent batching reduces S3 API calls by 50-90%
- **🧠 Adaptive Learning**: System learns from usage patterns and automatically optimizes itself
- **🎯 Environment Detection**: Automatically configures for Browser, Node.js, or Serverless environments

## The 6 Core Optimizations

### 1. Scaled HNSW System Integration (`scaledHNSWSystem.ts`)

**Purpose**: Production-ready orchestrator with **full auto-configuration** - detects environment, resources, and data patterns to provide optimal performance with zero manual tuning.

#### 🧠 Intelligent Auto-Configuration

The system automatically detects and configures:

| Detection | Auto-Configured | Impact |
|-----------|------------------|---------|
| **Environment** | Browser/Node.js/Serverless | Memory limits, storage type, concurrency |
| **Resources** | Available memory, CPU cores | Partition sizes, cache limits, threading |
| **Storage** | S3, FileSystem, OPFS, Memory | Batch operations, compression, persistence |
| **Dataset** | Size, dimension, growth rate | Partition strategy, cluster count, parameters |
| **Performance** | Search latency, cache hit rate | Dynamic parameter tuning, optimization flags |

#### 🎯 Configuration Options (All Optional!)

```typescript
interface ScaledHNSWConfig {
  // Everything is optional - system auto-detects optimal values!
  
  // Basic hints (auto-detected if not provided)
  expectedDatasetSize?: number // Auto-estimated from environment
  maxMemoryUsage?: number // Auto-detected from available memory  
  targetSearchLatency?: number // Auto-configured by environment
  
  // Storage (auto-detects S3 from environment variables)
  s3Config?: {
    bucketName: string // Only required field
    region?: string // defaults to 'us-east-1'
    accessKeyId?: string // uses AWS_ACCESS_KEY_ID env var
    secretAccessKey?: string // uses AWS_SECRET_ACCESS_KEY env var
  }
  
  // Auto-configuration control
  autoConfigureEnvironment?: boolean // default: true
  learningEnabled?: boolean // default: true - adapts to performance
  
  // Manual overrides (only use if you need specific behavior)
  enablePartitioning?: boolean // auto-enabled for datasets > 25k
  enableCompression?: boolean // auto-enabled for memory-constrained environments
  enableDistributedSearch?: boolean // auto-enabled for multi-core systems
  enablePredictiveCaching?: boolean // default: true
  
  // Advanced manual tuning (rarely needed)
  partitionConfig?: Partial<PartitionConfig>
  hnswConfig?: Partial<OptimizedHNSWConfig>
  readOnlyMode?: boolean
}
```

#### Usage

**✨ Easiest Setup - Zero Configuration**:
```typescript
import { createAutoBrainy } from '@soulcraft/brainy'

// That's it! System detects everything automatically
const brainy = createAutoBrainy()

// Add vectors and search - all optimizations auto-configured
await brainy.addVector({ id: '1', vector: [0.1, 0.2, 0.3] })
const results = await brainy.search([0.1, 0.2, 0.3], 10)
```

**🗄️ With S3 Persistence (Still Auto-Configured)**:
```typescript
const brainy = createAutoBrainy({
  bucketName: 'my-vectors'
  // region, credentials auto-detected from environment
})
```

**🎯 Scenario-Based Quick Setup**:
```typescript
import { createQuickBrainy } from '@soulcraft/brainy'

// Auto-configured for your scale
const brainy = await createQuickBrainy('large', {
  bucketName: 'my-big-vector-db'
})
```

**🔧 Manual Configuration (Advanced)**:
```typescript
import { createScaledHNSWSystem } from '@soulcraft/brainy'

const system = createScaledHNSWSystem({
  // Only specify what you need to override
  s3Config: {
    bucketName: 'my-vector-storage',
    region: 'eu-west-1'
  },
  // Everything else auto-configured
  learningEnabled: true
})
```

#### Environment Adaptation

- **Browser**: Uses OPFS + Web Workers, memory-optimized settings
- **Node.js**: Uses FileSystem + Worker Threads, performance-optimized  
- **Serverless**: Uses S3 + Memory storage, latency-optimized

### 2. Index Partitioning System (`partitionedHNSWIndex.ts`)

**Purpose**: Divides large datasets across multiple smaller indices with **intelligent semantic clustering** that automatically adapts to your data.

#### 🧠 Smart Semantic Partitioning (Auto-Configured)

The system now **automatically uses semantic partitioning** when beneficial and **auto-tunes cluster count** based on dataset size and performance:

| Dataset Size | Auto-Configured Clusters | Max Nodes/Partition | Strategy |
|-------------|-------------------------|-------------------|----------|
| < 25k | No partitioning | N/A | Single index (faster) |
| 25k - 100k | 4-8 clusters | 25,000 | Semantic clustering |
| 100k - 1M | 8-16 clusters | 50,000 | Optimized semantic |
| > 1M | 16-32 clusters | 100,000 | Large-scale semantic |

#### Configuration (Auto-Configured)

```typescript
interface PartitionConfig {
  maxNodesPerPartition: number // Auto-configured: 25k-100k based on scale
  partitionStrategy: 'semantic' | 'hash' // Auto-selected: semantic for >25k vectors
  semanticClusters?: number // Auto-tuned: 4-32 based on dataset size
  autoTuneSemanticClusters?: boolean // default: true
}
```

**Why Semantic Partitioning?** 
- 🎯 **Better Search Quality**: Similar vectors clustered together improve recall
- ⚡ **Faster Search**: Fewer partitions need to be searched  
- 🧠 **Cache Locality**: Related vectors loaded together improve cache performance
- 📈 **Scalable**: Automatically adjusts cluster count as data grows

#### ✨ Adaptive Features (Automatic)

- **🔄 Auto-Tuning**: Cluster count automatically adjusts based on dataset size and performance
- **📊 Performance Learning**: System learns which partitions perform best for different queries
- **⚖️ Load Balancing**: Search queries automatically distributed based on partition performance
- **🎯 Dynamic Clustering**: Semantic centroids automatically update as new data is added
- **🚀 Auto-Splitting**: Partitions automatically split when they exceed optimal size

### 3. Distributed Search Coordinator (`distributedSearch.ts`)

**Purpose**: Executes parallel searches across multiple partitions with intelligent load balancing and result merging.

#### Search Strategies

| Strategy | Description | When to Use | Configuration |
|----------|-------------|-------------|---------------|
| `BROADCAST` | Search all partitions | High recall needs, small partition count | N/A |
| `SELECTIVE` | Search top-performing partitions | Balanced speed/recall | `maxPartitions: 3-8` |
| `ADAPTIVE` | Dynamic partition selection | Production workloads | Auto-tuning enabled |
| `HIERARCHICAL` | Multi-level search | Very large datasets | Representative sampling |

#### Configuration

```typescript
interface DistributedSearchConfig {
  maxConcurrentSearches?: number // default: 10
  searchTimeout?: number // default: 30000ms
  resultMergeStrategy?: 'distance' | 'score' | 'hybrid' // default: 'hybrid'
  adaptivePartitionSelection?: boolean // default: true
  redundantSearches?: number // default: 0
  loadBalancing?: boolean // default: true
}
```

#### Usage Examples

**High-Performance Search**:
```typescript
const searchSystem = new DistributedSearchSystem({
  maxConcurrentSearches: 20, // More parallelism
  searchTimeout: 5000, // Strict timeout
  resultMergeStrategy: 'hybrid' // Quality + performance
})

const results = await searchSystem.distributedSearch(
  partitionedIndex,
  queryVector,
  10,
  SearchStrategy.ADAPTIVE
)
```

#### Performance Features

- **Worker Thread Pool**: Automatically sized to `min(navigator.hardwareConcurrency, 8)`
- **Adaptive Partition Selection**: Learns from historical performance to optimize future searches
- **Result Merging**: Three strategies for combining results from multiple partitions
- **Load Balancing**: Routes searches to least-loaded partitions first

### 4. Enhanced Multi-Level Cache Manager (`enhancedCacheManager.ts`)

**Purpose**: Intelligent multi-level caching with predictive prefetching optimized for HNSW search patterns.

#### Cache Architecture

```
Hot Cache (RAM) ──→ Warm Cache (Fast Storage) ──→ Cold Storage (S3/Disk)
     ↓                        ↓                           ↓
  Most frequent           Recent access              Complete dataset
```

#### Prefetch Strategies

| Strategy | Description | Best For | Configuration |
|----------|-------------|----------|---------------|
| `GRAPH_CONNECTIVITY` | Prefetch connected nodes | Graph traversal | Based on HNSW connections |
| `VECTOR_SIMILARITY` | Prefetch similar vectors | Similarity search | `similarityThreshold: 0.8` |
| `ACCESS_PATTERN` | Learn from usage history | Repeated workloads | Pattern analysis |
| `HYBRID` | Combines all strategies | Production use | Weighted combination |

#### Configuration

```typescript
interface EnhancedCacheConfig {
  // Cache sizes
  hotCacheMaxSize?: number // default: 1000 items
  warmCacheMaxSize?: number // default: 10000 items
  warmCacheTTL?: number // default: 300000ms (5 min)
  
  // Prefetching
  prefetchEnabled?: boolean // default: true
  prefetchStrategy?: PrefetchStrategy // default: HYBRID
  prefetchBatchSize?: number // default: 50
  
  // Similarity settings
  similarityThreshold?: number // default: 0.8
  maxSimilarityDistance?: number // default: 2.0
  
  // Performance
  backgroundOptimization?: boolean // default: true
  statisticsCollection?: boolean // default: true
}
```

#### Environment-Specific Configurations

**Browser (Memory-Constrained)**:
```typescript
const cacheManager = new EnhancedCacheManager({
  hotCacheMaxSize: 500,
  warmCacheMaxSize: 5000,
  prefetchBatchSize: 25,
  backgroundOptimization: true
})
```

**Node.js (High-Performance)**:
```typescript
const cacheManager = new EnhancedCacheManager({
  hotCacheMaxSize: 2000,
  warmCacheMaxSize: 20000,
  prefetchBatchSize: 100,
  prefetchStrategy: PrefetchStrategy.HYBRID
})
```

**Serverless (Latency-Optimized)**:
```typescript
const cacheManager = new EnhancedCacheManager({
  hotCacheMaxSize: 1000,
  warmCacheMaxSize: 10000,
  prefetchEnabled: false, // Reduce cold start impact
  backgroundOptimization: false
})
```

### 5. Batch S3 Operations (`batchS3Operations.ts`)

**Purpose**: Optimizes S3 interactions through intelligent batching and prefetching to reduce API calls by 50-90%.

#### Batching Strategies by Request Size

| Request Size | Strategy | API Optimization | Concurrency |
|-------------|----------|------------------|-------------|
| ≤10 items | Parallel GetObject | Individual requests | Up to 50 concurrent |
| 11-1000 items | Chunked parallel | Batched requests | 5 chunks concurrent |
| >1000 items | List-based | List + filtered gets | 50 concurrent gets |

#### Configuration

```typescript
interface BatchRetrievalOptions {
  maxConcurrency?: number // default: 50 (AWS-friendly)
  prefetchSize?: number // default: 100
  useS3Select?: boolean // default: false
  compressionEnabled?: boolean // default: false
}
```

#### Storage Adapter Integration

**S3 Configuration**:
```typescript
const batchOps = new BatchS3Operations(s3Client, 'my-bucket', {
  maxConcurrency: 50,
  prefetchSize: 200,
  useS3Select: true // For large datasets
})

// Automatically used by cache manager
cacheManager.setStorageAdapters(storageAdapter, batchOps)
```

#### Intelligent Prefetching

The system analyzes HNSW graph connectivity to predict which nodes will be accessed next:

```typescript
// Prefetch connected nodes based on graph structure
const prefetchResult = await batchOps.prefetchConnectedNodes(
  currentNodeIds,
  connectionMap,
  'nodes/'
)
```

#### Environment Optimizations

- **Browser**: Smaller batch sizes, prioritizes memory efficiency
- **Node.js**: Larger batches, optimizes for throughput
- **Serverless**: Minimizes cold start impact, aggressive caching

### 6. Read-Only Storage Optimizations (`readOnlyOptimizations.ts`)

**Purpose**: Advanced compression and memory-mapping optimizations for production deployments where the index doesn't change frequently.

#### Compression Methods

| Type | Method | Reduction | Speed | Use Case |
|------|--------|-----------|-------|----------|
| Vector | Scalar Quantization (8-bit) | 75% | Fast | General purpose |
| Vector | Product Quantization | 90%+ | Medium | Large datasets |
| Vector | Binary Quantization | 97% | Very fast | Similarity search |
| Metadata | GZIP | 60-80% | Fast | JSON metadata |
| Metadata | Brotli | 70-85% | Medium | Static content |

#### Configuration

```typescript
interface ReadOnlyConfig {
  compression: {
    vectorCompression: CompressionType // 'quantization' recommended
    metadataCompression: CompressionType // 'gzip' recommended  
    quantizationType?: 'scalar' | 'product' | 'binary'
    quantizationBits?: number // default: 8
  }
  
  // Segmentation
  segmentSize?: number // default: 10000 nodes per segment
  prefetchSegments?: number // default: 3
  
  // Memory management
  memoryMapped?: boolean // default: true
  cacheIndexInMemory?: boolean // auto-configured by memory budget
  
  // Pre-built indices
  prebuiltIndexPath?: string // path to pre-built segments
}
```

#### Usage Patterns

**High-Compression Setup** (for memory-constrained environments):
```typescript
const readOnlyOpts = new ReadOnlyOptimizations({
  compression: {
    vectorCompression: CompressionType.QUANTIZATION,
    metadataCompression: CompressionType.GZIP,
    quantizationType: QuantizationType.SCALAR,
    quantizationBits: 8
  },
  segmentSize: 5000, // Smaller segments
  cacheIndexInMemory: false // Use disk-based storage
})
```

**High-Performance Setup** (for speed-critical applications):
```typescript
const readOnlyOpts = new ReadOnlyOptimizations({
  compression: {
    vectorCompression: CompressionType.NONE, // No compression overhead
    metadataCompression: CompressionType.GZIP // Still compress metadata
  },
  segmentSize: 20000, // Larger segments
  cacheIndexInMemory: true, // Keep in memory
  prefetchSegments: 5 // Aggressive prefetching
})
```

#### Memory-Mapped Buffers

For very large datasets, the system supports memory-mapped buffers that allow the OS to manage memory more efficiently:

```typescript
// Automatically manages memory mapping based on segment access patterns
const nodes = await readOnlyOpts.loadSegment('segment_0')
```

## Environment-Specific Configuration Guide

### Browser Environment

**Characteristics**: Limited memory, no persistent storage, Web Workers available

**Recommended Configuration**:
```typescript
const config: ScaledHNSWConfig = {
  expectedDatasetSize: 50000, // Conservative limit
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  targetSearchLatency: 200,
  
  // Browser-optimized settings
  enableCompression: true,
  partitionConfig: {
    maxNodesPerPartition: 10000,
    partitionStrategy: 'hash' // Simple, memory-efficient
  }
}
```

**Automatic Adaptations**:
- Uses OPFS (Origin Private File System) for persistence
- Smaller cache sizes and batch operations
- Web Workers for parallel processing
- Aggressive compression to fit in memory limits

### Node.js Environment

**Characteristics**: Abundant memory/CPU, persistent filesystem, Worker Threads available

**Recommended Configuration**:
```typescript
const config: ScaledHNSWConfig = {
  expectedDatasetSize: 1000000, // Can handle large datasets
  maxMemoryUsage: 8 * 1024 * 1024 * 1024, // 8GB
  targetSearchLatency: 100,
  
  // Performance-optimized settings
  enableDistributedSearch: true,
  partitionConfig: {
    maxNodesPerPartition: 50000,
    partitionStrategy: 'semantic',
    semanticClusters: 16
  }
}
```

**Automatic Adaptations**:
- Uses filesystem for persistent storage
- Larger worker thread pools
- Higher concurrency limits
- Memory-mapped files for very large datasets

### Serverless Environment

**Characteristics**: Limited execution time, cold starts, potential memory constraints

**Recommended Configuration**:
```typescript
const config: ScaledHNSWConfig = {
  expectedDatasetSize: 100000, // Moderate size
  maxMemoryUsage: 2 * 1024 * 1024 * 1024, // 2GB
  targetSearchLatency: 500, // More lenient for cold starts
  
  // Serverless-optimized settings
  enablePredictiveCaching: false, // Avoid background processes
  readOnlyMode: true, // Optimize for read-heavy workloads
  s3Config: {
    // Required for persistence across invocations
    bucketName: 'vector-storage',
    region: 'us-east-1',
    // ... credentials
  }
}
```

**Automatic Adaptations**:
- Prioritizes S3 storage over local filesystem
- Minimal background processing
- Optimized for quick startup and shutdown
- Pre-built index segments for faster loading

## Storage Adapter Integration

### File System Storage

**Best For**: Node.js applications, development environments

**Configuration**: Automatically detected and configured

**Features**:
- Direct file I/O for best performance
- Automatic directory creation
- Concurrent read/write support

### S3-Compatible Storage

**Best For**: Production deployments, distributed systems, serverless

**Configuration**:
```typescript
s3Config: {
  bucketName: 'my-vector-db',
  region: 'us-east-1', 
  endpoint: 'https://s3.amazonaws.com', // Optional for S3-compatible services
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
```

**Features**:
- Batch operations reduce API costs
- Intelligent prefetching
- Compression support
- Automatic retry logic

### OPFS (Origin Private File System)

**Best For**: Browser applications requiring persistence

**Configuration**: Automatically used in browsers when available

**Features**:
- Private to your application
- Survives browser restarts
- Good performance for moderate datasets
- Automatic fallback to memory storage

### Memory Storage

**Best For**: Temporary workloads, testing, serverless cold starts

**Configuration**: Used as fallback when other options unavailable

**Features**:
- Fastest access times
- No persistence
- Limited by available RAM
- Automatic cleanup

## Performance Tuning Guide

### Monitoring and Metrics

All optimizations provide comprehensive performance metrics:

```typescript
const system = createScaledHNSWSystem(config)

// Get detailed performance metrics
const metrics = system.getPerformanceMetrics()
console.log(metrics.averageSearchTime)
console.log(metrics.cacheHitRate)
console.log(metrics.compressionRatio)

// Get system status
const report = system.generatePerformanceReport()
console.log(report) // Detailed text report
```

### Common Performance Issues and Solutions

#### High Search Latency

**Symptoms**: Search times consistently above target
**Solutions**:
1. Increase `maxConcurrentSearches` for distributed search
2. Enable compression to reduce I/O
3. Tune `efSearch` parameter (lower for speed, higher for recall)
4. Consider more aggressive partitioning

#### High Memory Usage

**Symptoms**: Approaching memory budget limits
**Solutions**:
1. Enable compression (`enableCompression: true`)
2. Reduce cache sizes (`hotCacheMaxSize`, `warmCacheMaxSize`)
3. Use smaller partition sizes (`maxNodesPerPartition`)
4. Enable disk-based caching (`diskCacheEnabled: true`)

#### Poor Cache Hit Rates

**Symptoms**: Cache hit rate below 70%
**Solutions**:
1. Increase cache sizes if memory allows
2. Enable predictive prefetching
3. Use semantic partitioning for better locality
4. Tune prefetch batch sizes

#### High S3 API Costs

**Symptoms**: Excessive S3 requests
**Solutions**:
1. Enable batch operations (automatically enabled)
2. Increase prefetch sizes
3. Use compression to reduce object count
4. Consider read-only optimizations for static data

### Manual Tuning Examples

**Memory-Constrained Environment**:
```typescript
const config: ScaledHNSWConfig = {
  expectedDatasetSize: 100000,
  maxMemoryUsage: 1 * 1024 * 1024 * 1024, // 1GB limit
  targetSearchLatency: 300, // More lenient
  
  enableCompression: true,
  partitionConfig: {
    maxNodesPerPartition: 20000, // Smaller partitions
    partitionStrategy: 'hash'
  },
  hnswConfig: {
    M: 16, // Lower connectivity
    efConstruction: 200
  }
}
```

**High-Throughput Environment**:
```typescript
const config: ScaledHNSWConfig = {
  expectedDatasetSize: 2000000,
  maxMemoryUsage: 16 * 1024 * 1024 * 1024, // 16GB
  targetSearchLatency: 50, // Aggressive target
  
  enableDistributedSearch: true,
  partitionConfig: {
    maxNodesPerPartition: 100000, // Large partitions
    partitionStrategy: 'semantic',
    semanticClusters: 32
  },
  hnswConfig: {
    M: 48, // High connectivity
    efConstruction: 500,
    dynamicParameterTuning: true
  }
}
```

## Migration Guide

### From Basic HNSW to Optimized System

1. **Replace basic HNSW instantiation**:
   ```typescript
   // Old
   const index = new HNSWIndex(config, distanceFunction)
   
   // New
   const system = createScaledHNSWSystem({
     expectedDatasetSize: yourDataSize,
     maxMemoryUsage: yourMemoryBudget,
     targetSearchLatency: yourTarget
   })
   ```

2. **Update search calls**:
   ```typescript
   // Old
   const results = await index.search(vector, k)
   
   // New - same interface!
   const results = await system.search(vector, k)
   ```

3. **Add performance monitoring**:
   ```typescript
   // Monitor system performance
   setInterval(() => {
     const metrics = system.getPerformanceMetrics()
     if (metrics.averageSearchTime > targetLatency * 1.2) {
       console.warn('Performance degradation detected')
     }
   }, 60000)
   ```

### Gradual Optimization Adoption

You can enable optimizations incrementally:

```typescript
// Start with basic optimizations
const system = createScaledHNSWSystem({
  expectedDatasetSize: 100000,
  maxMemoryUsage: 4 * 1024 * 1024 * 1024,
  targetSearchLatency: 200,
  
  // Enable selectively
  enablePartitioning: true,
  enableCompression: false, // Start without compression
  enableDistributedSearch: false, // Add later
  enablePredictiveCaching: true
})

// Later, enable more optimizations
// system.config.enableDistributedSearch = true
```

## Troubleshooting

### Common Issues

**"System not properly initialized"**
- Ensure `expectedDatasetSize` is set
- Check that initialization completed before first use

**"Search timeout" errors**
- Increase `searchTimeout` in distributed search config
- Reduce `maxConcurrentSearches` if resource-constrained

**High memory usage warnings**
- Enable compression
- Reduce partition sizes
- Check for memory leaks in long-running processes

**Poor search quality**
- Increase `efSearch` parameter
- Use semantic partitioning instead of hash
- Enable dynamic parameter tuning

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// Set environment variable or global flag
process.env.BRAINY_DEBUG = 'true'

// Or configure logging in system
const system = createScaledHNSWSystem({
  // ... config
  performanceTracking: true, // Detailed metrics
  statisticsCollection: true // Usage patterns
})
```

This comprehensive optimization suite provides the foundation for handling large-scale vector search workloads across all deployment environments while maintaining the simple API that makes Brainy easy to use.