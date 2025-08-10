# Brainy Storage and Retrieval Architecture

## Overview

Brainy is a Multi-Dimensional AI Database that combines three powerful search and retrieval mechanisms:
1. **Vector Similarity Search** - High-dimensional semantic matching using HNSW (Hierarchical Navigable Small World) algorithms
2. **Graph Relationship Traversal** - Entity relationship mapping and intelligent verb scoring
3. **Metadata Filtering** - Feature search with MongoDB-style operators for precise filtering

This document explains how data is stored, indexed, retrieved, and how these systems work together for optimal performance.

## Storage Architecture

### Entity-Based Directory Structure

Brainy uses a modern entity-based storage structure that separates vector data from metadata:

```
storage/
├── entities/
│   ├── nouns/
│   │   ├── vectors/           # HNSWNoun vector data
│   │   └── metadata/          # Rich metadata, relationships
│   └── verbs/
│       ├── vectors/           # HNSWVerb lightweight data  
│       └── metadata/          # Relationship metadata, weights
├── indexes/
│   └── metadata/              # Metadata search indexes
└── _system/                   # System statistics, config
```

### Data Types and Storage Separation

#### Nouns (Entities)
- **Vector Storage**: `HNSWNoun` objects containing ID, high-dimensional vectors, and HNSW connections
- **Metadata Storage**: Rich metadata including service info, timestamps, custom fields, and relationship references

#### Verbs (Relationships)  
- **Vector Storage**: `HNSWVerb` objects with lightweight connection data for HNSW traversal
- **Metadata Storage**: Relationship semantics including:
  - Source/target entity references
  - Relationship type and weight
  - Confidence scores and intelligent scoring metadata
  - Temporal information and provenance

### Storage Adapters

Brainy supports multiple storage backends through a unified adapter interface:

#### FileSystemStorage (Default)
- **Use Case**: Development, single-machine deployments
- **Performance**: Direct file I/O, fast local access
- **Limitations**: Single-machine, no horizontal scaling

#### S3CompatibleStorage 
- **Use Case**: Production, cloud deployments, horizontal scaling
- **Performance**: High-volume mode with intelligent write buffering
- **Features**: 
  - Backpressure management and adaptive throttling
  - Request coalescing for bulk operations
  - Change log tracking for real-time sync
- **Providers**: AWS S3, Cloudflare R2, MinIO

#### OPFSStorage
- **Use Case**: Browser-based applications
- **Performance**: Origin Private File System for persistent client storage
- **Limitations**: Browser-only, quota limits

## Indexing Systems

### 1. Vector Index (HNSW)

**Purpose**: Ultra-fast approximate nearest neighbor search in high-dimensional space

**Structure**:
```typescript
HNSWIndex {
  nodes: Map<string, HNSWNoun>
  connections: Map<nodeId, Map<level, Set<neighborIds>>>
  entryPoint: string
  maxConnections: number
  levelMultiplier: number
}
```

**Performance**: O(log N) search complexity, maintains quality with scale

### 2. Metadata Index

**Purpose**: Fast filtering and faceted search on entity and relationship metadata

**Implementation**:
- **Field-based indexes**: Automatic indexing of frequently queried fields
- **Value distribution tracking**: Optimizes query planning
- **MongoDB-style operators**: `$eq`, `$in`, `$lt`, `$gte`, `$regex`, `$exists`

**Storage**:
```
indexes/metadata/
├── entities/
│   ├── nounType_index.json      # Service type indexing
│   ├── timestamp_index.json     # Temporal indexing  
│   └── customField_index.json   # Dynamic field indexing
└── relationships/
    ├── verbType_index.json      # Relationship type indexing
    └── weight_index.json        # Weight-based indexing
```

### 3. Graph Index

**Purpose**: Efficient relationship traversal and path finding

**Features**:
- **Bidirectional references**: Fast source→target and target→source lookups
- **Type-based filtering**: Filter relationships by semantic type
- **Weight-based ranking**: Intelligent verb scoring for relationship quality

## Data Flow: Add Operations

### Adding a Noun (Entity)

1. **Vector Processing**:
   ```typescript
   // Generate or validate high-dimensional vector
   const vector = await generateEmbedding(content)
   
   // Create HNSWNoun for vector index
   const hnswNoun: HNSWNoun = {
     id: generateId(),
     vector: vector,
     connections: new Map()  // HNSW navigation
   }
   ```

2. **HNSW Integration**:
   ```typescript
   // Find insertion level using probabilistic level selection
   const level = selectLevel()
   
   // Find nearest neighbors at each level
   const entryPoints = await findEntryPoints(vector, level)
   
   // Create bidirectional connections
   await createConnections(hnswNoun, entryPoints, level)
   ```

3. **Metadata Storage**:
   ```typescript
   const metadata = {
     service: 'user-service',
     nounType: 'user',
     createdAt: timestamp,
     customFields: { age: 25, location: 'NYC' }
   }
   await storage.saveNounMetadata(id, metadata)
   ```

4. **Index Updates**:
   ```typescript
   // Update field-based indexes
   await metadataIndex.addToIndex('nounType', 'user', id)
   await metadataIndex.addToIndex('service', 'user-service', id)
   ```

### Adding a Verb (Relationship)

1. **Relationship Validation**:
   ```typescript
   // Verify source and target entities exist
   const sourceExists = await storage.getNoun(sourceId)
   const targetExists = await storage.getNoun(targetId)
   ```

2. **Vector and Graph Data**:
   ```typescript
   const hnswVerb: HNSWVerb = {
     id: generateId(),
     vector: relationshipVector,
     connections: new Map()  // For verb-to-verb HNSW
   }
   ```

3. **Intelligent Scoring** (if enabled):
   ```typescript
   const scoring = await intelligentVerbScoring.computeScore({
     sourceVector: source.vector,
     targetVector: target.vector,
     relationshipType: 'follows',
     frequencyData: existingRelationships
   })
   ```

4. **Metadata with Scoring**:
   ```typescript
   const metadata = {
     sourceId, targetId,
     type: 'follows',
     weight: scoring.weight,
     confidence: scoring.confidence,
     intelligentScoring: scoring.reasoning
   }
   ```

## Retrieval Operations

### 1. Vector Similarity Search

**Use Case**: "Find entities similar to this content"

```typescript
const results = await brainy.search({
  vector: queryVector,
  limit: 10,
  threshold: 0.8
})
```

**Process**:
1. **Entry Point**: Start from HNSW entry point
2. **Greedy Search**: Navigate to nearest neighbors at each level
3. **Candidate Selection**: Maintain candidate list during traversal  
4. **Refinement**: Apply distance threshold and limit

**Performance**: O(log N) with high recall rates

### 2. Graph Relationship Search

**Use Case**: "Find all relationships of type X from entity Y"

```typescript
const relationships = await brainy.getVerbsBySource(entityId, {
  verbType: 'follows',
  weightThreshold: 0.5
})
```

**Process**:
1. **Index Lookup**: Query relationship index by source ID
2. **Type Filtering**: Apply verb type constraints
3. **Weight Ranking**: Sort by relationship strength
4. **Metadata Enrichment**: Combine with full relationship metadata

### 3. Metadata Filtering Search

**Use Case**: "Find users aged 25-35 in NYC who joined last month"

```typescript
const users = await brainy.searchNouns({
  filter: {
    nounType: 'user',
    'metadata.age': { $gte: 25, $lte: 35 },
    'metadata.location': 'NYC',
    'metadata.joinDate': { 
      $gte: startOfMonth, 
      $lt: endOfMonth 
    }
  }
})
```

**Process**:
1. **Index Optimization**: Use most selective filter first
2. **Set Operations**: Intersect results from multiple indexes
3. **Post-filter**: Apply complex expressions not in indexes
4. **Result Materialization**: Load full entity data

### 4. Combined Multi-Dimensional Search

**Use Case**: "Find similar documents by users I follow, posted recently"

```typescript
const results = await brainy.search({
  vector: documentVector,           // Vector similarity
  limit: 20,
  filter: {                        // Metadata filtering
    nounType: 'document',
    'metadata.createdAt': { $gte: lastWeek }
  },
  graphTraversal: {                // Graph relationship
    from: currentUserId,
    relationship: 'follows',
    depth: 2
  }
})
```

**Process**:
1. **Graph Phase**: Find entities within relationship graph
2. **Vector Phase**: Rank by semantic similarity
3. **Filter Phase**: Apply metadata constraints
4. **Fusion**: Combine scores from all dimensions

## Performance Optimizations

### Caching Strategy

**Multi-Level Caching**:
1. **L1 (Memory)**: Recently accessed entities and relationships
2. **L2 (Disk/SSD)**: Metadata indexes and frequently used vectors
3. **L3 (Storage)**: Full persistence layer (S3, filesystem, etc.)

**Cache Policies**:
- **LRU Eviction**: For memory-constrained environments
- **Write-through**: Immediate persistence of critical data
- **Lazy Loading**: Load metadata indexes on-demand

### Storage Optimizations

**S3 High-Volume Mode**:
- **Write Buffering**: Batch small writes into larger operations
- **Request Coalescing**: Combine concurrent requests
- **Backpressure Management**: Adaptive throttling based on system load

**OPFS Browser Optimizations**:
- **Chunk-based Storage**: Handle browser quota limits
- **Progressive Loading**: Stream large datasets
- **Service Worker Integration**: Background sync capabilities

### Index Management

**Adaptive Indexing**:
- **Query Pattern Analysis**: Build indexes based on actual usage
- **Field Popularity Tracking**: Prioritize frequently filtered fields
- **Selective Indexing**: Avoid over-indexing sparse fields

**Index Maintenance**:
- **Incremental Updates**: Update indexes without full rebuilds
- **Background Compaction**: Optimize index structure during idle time
- **Statistics Refresh**: Keep cardinality estimates current

## Intelligent Features

### Intelligent Verb Scoring

**Purpose**: Automatically assign relationship weights and confidence scores

**Metrics**:
- **Semantic Similarity**: Vector distance between connected entities
- **Frequency Amplification**: Boost repeated relationship patterns
- **Temporal Decay**: Adjust for relationship age
- **Learning from Feedback**: Improve scoring based on user interactions

### Metadata Field Discovery

**Purpose**: Automatically detect and index new metadata fields

**Process**:
1. **Field Detection**: Identify new fields in incoming data
2. **Cardinality Analysis**: Estimate indexing value
3. **Index Creation**: Build indexes for valuable fields
4. **Performance Monitoring**: Track query improvements

### Adaptive Performance

**Query Optimization**:
- **Query Plan Caching**: Remember optimal execution plans
- **Cost-based Optimization**: Choose between indexes vs. scans
- **Parallel Execution**: Distribute work across available cores

**Resource Management**:
- **Memory Pressure**: Adapt cache sizes to available RAM
- **Storage Pressure**: Compress less-used data
- **Network Pressure**: Batch operations and reduce round trips

## Integration and API Patterns

### Search API Flexibility

```typescript
// Pure vector search
brainy.search({ vector, limit: 10 })

// Pure metadata search  
brainy.searchNouns({ filter: { nounType: 'user' } })

// Pure graph traversal
brainy.getVerbsBySource(entityId, { verbType: 'follows' })

// Multi-dimensional combination
brainy.search({ 
  vector,                    // Semantic similarity
  filter: { ... },          // Metadata constraints  
  graphTraversal: { ... }   // Relationship context
})
```

### Augmentation System

**Purpose**: Extend Brainy capabilities with custom logic

**Examples**:
- **Intelligent Verb Scoring**: Custom relationship weight calculation
- **Server Search**: Federated search across multiple Brainy instances
- **Memory Augmentations**: Advanced caching and pre-loading strategies

### Real-time Integration

**Change Streams**:
- **Entity Changes**: Subscribe to noun additions/updates
- **Relationship Changes**: Track verb creation and weight updates
- **Index Changes**: React to metadata field discovery

**Event-Driven Architecture**:
- **Webhooks**: External system notifications
- **Message Queues**: Asynchronous processing workflows
- **Real-time Sync**: Keep multiple instances synchronized

## Deployment Considerations

### Development vs Production

**Development**:
- **FileSystemStorage**: Fast local iteration
- **In-memory indexes**: Rapid prototyping
- **Single-threaded**: Simplified debugging

**Production**:
- **S3CompatibleStorage**: Scalable, durable persistence  
- **Distributed indexes**: Handle large datasets
- **Multi-threaded**: Maximize hardware utilization

### Scaling Strategies

**Vertical Scaling**:
- **Memory**: Larger in-memory indexes and caches
- **CPU**: Parallel search and indexing operations
- **Storage**: Faster SSDs for index access

**Horizontal Scaling**:
- **Read Replicas**: Distribute read load
- **Sharding**: Partition data across instances
- **Federated Search**: Query multiple instances

### Monitoring and Observability

**Metrics**:
- **Search Performance**: Query latency and throughput
- **Index Health**: Index sizes and update rates
- **Storage Utilization**: Disk usage and I/O patterns

**Logging**:
- **Query Logs**: Track search patterns and performance
- **Error Logs**: Identify system issues and data problems
- **Audit Logs**: Track data changes and access patterns

## Summary

Brainy's multi-dimensional architecture provides:

1. **Flexibility**: Support for pure vector, pure metadata, pure graph, or combined searches
2. **Performance**: Optimized indexes and caching for each search type
3. **Scalability**: Storage adapters from single-machine to cloud-scale
4. **Intelligence**: Automatic scoring, field discovery, and adaptive optimization
5. **Reliability**: Durable persistence with real-time sync capabilities

This architecture enables applications to leverage the full power of AI-driven search while maintaining the flexibility to optimize for specific use cases and deployment environments.