# Brainy Library: Search and Metadata Retrieval Guide

## Overview

The Brainy library provides a seamless, fast, and easy way to search for similar content and retrieve complete metadata for nouns (entities) and verbs (relationships) in your knowledge graph. This guide explains how the search and metadata retrieval process works under the hood and how to use it effectively.

## How It Works: The Complete Workflow

### 1. Search Process Architecture

The Brainy library uses a sophisticated multi-layered approach for search and metadata retrieval:

```
User Query → Vector Embedding → HNSW Index Search → Metadata Retrieval → Complete Results
```

### 2. Core Components

#### SearchResult Structure
Every search returns results in a consistent format:

```typescript
interface SearchResult<T = any> {
  id: string        // Unique identifier
  score: number     // Similarity score (0-1, higher = more similar)
  vector: Vector    // The vector representation
  metadata?: T      // Complete metadata object
}
```

#### GraphNoun Metadata
Nouns contain rich metadata including:

```typescript
interface GraphNoun {
  id: string                    // Unique identifier
  createdBy: CreatorMetadata   // Source/augmentation info
  noun: NounType              // Type (Person, Location, Thing, etc.)
  createdAt: Timestamp        // Creation time
  updatedAt: Timestamp        // Last update time
  label?: string              // Descriptive label
  data?: Record<string, any>  // Flexible additional data
  embeddedVerbs?: EmbeddedGraphVerb[]  // Related relationships
  embedding?: number[]        // Vector representation
}
```

#### GraphVerb Metadata
Verbs contain relationship metadata:

```typescript
interface GraphVerb {
  id: string                    // Unique identifier
  source: string               // Source noun ID
  target: string               // Target noun ID
  label?: string               // Descriptive label
  verb: VerbType              // Relationship type
  createdAt: Timestamp        // Creation time
  updatedAt: Timestamp        // Last update time
  createdBy: CreatorMetadata  // Source/augmentation info
  data?: Record<string, any>  // Flexible additional data
  embedding?: number[]        // Vector representation
  confidence?: number         // Confidence score (0-1)
  weight?: number            // Relationship strength
}
```

## Usage Examples

### 1. Basic Search with Full Metadata

```typescript
import { BrainyData } from 'brainy'

const brainy = new BrainyData({
  dimensions: 384,
  // ... other config
})

await brainy.init()

// Search for similar content - returns complete metadata automatically
const results = await brainy.search("artificial intelligence", 10)

results.forEach(result => {
  console.log(`ID: ${result.id}`)
  console.log(`Similarity: ${result.score}`)
  console.log(`Metadata:`, result.metadata)
  // Metadata contains ALL the noun/verb information:
  // - Type classification
  // - Creation timestamps
  // - Creator information
  // - Custom data fields
  // - Embedded relationships
})
```

### 2. Search Specific Noun Types

```typescript
// Search only within specific entity types
const personResults = await brainy.search("John Smith", 5, {
  nounTypes: ['Person']
})

const locationResults = await brainy.search("New York", 5, {
  nounTypes: ['Location', 'Organization']
})
```

### 3. Search for Relationships (Verbs)

```typescript
// Search for relationships directly
const relationshipResults = await brainy.search("works at", 10, {
  searchVerbs: true,
  verbTypes: ['Employment', 'Association']
})

relationshipResults.forEach(result => {
  console.log(`Relationship: ${result.metadata.verb}`)
  console.log(`From: ${result.metadata.source}`)
  console.log(`To: ${result.metadata.target}`)
  console.log(`Confidence: ${result.metadata.confidence}`)
})
```

### 4. Search Connected Entities

```typescript
// Find entities connected through relationships
const connectedResults = await brainy.search("technology company", 10, {
  searchConnectedNouns: true,
  verbTypes: ['Partnership', 'Investment'],
  verbDirection: 'both'
})
```

### 5. Multi-Modal Search

```typescript
// Search with different input types
const textResults = await brainy.search("machine learning")
const vectorResults = await brainy.search([0.1, 0.2, 0.3, 0.4]) // Direct vector
const objectResults = await brainy.search({
  title: "AI Research",
  description: "Latest developments in artificial intelligence"
})
```

## Performance Optimizations

### 1. Seamless Operation
- **Single API Call**: One `search()` call returns both similarity results AND complete metadata
- **Automatic Embedding**: Text queries are automatically converted to vectors
- **Flexible Input**: Accepts text, objects, or pre-computed vectors
- **Consistent Output**: Always returns the same `SearchResult` format

### 2. Speed Optimizations

#### HNSW Index
- Uses Hierarchical Navigable Small World (HNSW) algorithm for sub-linear search time
- Approximate nearest neighbor search with high accuracy
- Scales efficiently to millions of vectors

#### Lazy Loading
```typescript
const brainy = new BrainyData({
  readOnly: true,
  lazyLoadInReadOnlyMode: true  // Load nodes on-demand during search
})
```

#### Parallel Processing
- Metadata retrieval happens in parallel for all search results
- Multiple noun types searched concurrently
- Batch operations for efficiency

#### Caching
```typescript
const brainy = new BrainyData({
  storage: {
    cacheConfig: {
      hotCacheMaxSize: 10000,        // Keep frequently accessed items in memory
      warmCacheTTL: 3600000,         // 1 hour TTL for warm cache
      batchSize: 100,                // Batch size for operations
      autoTune: true                 // Automatically optimize cache settings
    }
  }
})
```

### 3. Easy Usage Features

#### Search Modes
```typescript
// Local search only
const localResults = await brainy.search("query", 10, {
  searchMode: 'local'
})

// Remote server search
const remoteResults = await brainy.search("query", 10, {
  searchMode: 'remote'
})

// Combined local + remote
const combinedResults = await brainy.search("query", 10, {
  searchMode: 'combined'
})
```

#### Field-Specific Search
```typescript
// Search within specific JSON fields
const titleResults = await brainy.search("AI", 10, {
  searchField: 'title'
})

// Prioritize certain fields
const prioritizedResults = await brainy.search("research", 10, {
  priorityFields: ['title', 'abstract', 'keywords']
})
```

#### Service Filtering
```typescript
// Filter results by the service that created them
const serviceResults = await brainy.search("data", 10, {
  service: 'my-data-ingestion-service'
})
```

## Advanced Features

### 1. Augmentation Pipeline
The library supports augmentation pipelines that can enrich search results:

```typescript
const brainy = new BrainyData({
  augmentations: [
    {
      type: AugmentationType.ServerSearch,
      config: { /* server config */ }
    }
  ]
})
```

### 2. Custom Embedding Functions
```typescript
const brainy = new BrainyData({
  embeddingFunction: async (data) => {
    // Your custom embedding logic
    return await myCustomEmbedder.embed(data)
  }
})
```

### 3. Storage Adapters
Multiple storage backends supported for optimal performance:

```typescript
const brainy = new BrainyData({
  storage: {
    // Cloud storage for scalability
    s3Storage: {
      bucketName: 'my-brainy-data',
      region: 'us-east-1'
    },
    // Local caching for speed
    cacheConfig: {
      hotCacheMaxSize: 50000
    }
  }
})
```

## Key Benefits

### 🚀 **Seamless**
- Single API call gets both search results and complete metadata
- No need for separate metadata lookup calls
- Consistent interface across all search types

### ⚡ **Quick**
- HNSW index provides sub-linear search time
- Parallel metadata retrieval
- Intelligent caching and lazy loading
- Optimized storage access patterns

### 🎯 **Easy**
- Simple `search()` method handles all complexity
- Flexible input types (text, vectors, objects)
- Rich configuration options with sensible defaults
- Comprehensive TypeScript types for IDE support

## Error Handling

The library provides robust error handling:

```typescript
try {
  const results = await brainy.search("query", 10)
} catch (error) {
  if (error.message.includes('write-only mode')) {
    // Handle write-only mode error
  } else if (error.message.includes('not initialized')) {
    // Handle initialization error
  }
}
```

## Conclusion

The Brainy library's search and metadata retrieval system is designed to be:

1. **Seamless**: One call gets everything you need
2. **Fast**: Optimized algorithms and caching strategies
3. **Easy**: Simple API with powerful features under the hood

Whether you're building a recommendation system, knowledge graph explorer, or semantic search application, Brainy handles the complexity of vector search and metadata management so you can focus on your application logic.
