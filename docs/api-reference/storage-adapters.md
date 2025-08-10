# Storage Adapters

Brainy's storage system is designed for universal compatibility through a simple, powerful abstraction layer. Any storage system that can handle key-value operations can be used as a Brainy backend.

## 🌍 Universal Storage Architecture

**One Interface, Any Storage System.** Brainy works with virtually any data store through its `StorageAdapter` interface.

### Currently Supported Storage Systems

| Storage Type | Environment | Use Case | Status |
|--------------|-------------|----------|---------|
| **S3-Compatible** | Production | AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces | ✅ Production Ready |
| **File System** | Node.js/Server | Local development, dedicated servers | ✅ Production Ready |
| **OPFS (Origin Private File System)** | Browser | Modern web apps, PWAs | ✅ Production Ready |
| **Memory Storage** | Any | Testing, caching, temporary data | ✅ Production Ready |

### 🚀 Easily Add New Storage Backends

**Want to use a database that's not listed? No problem!** Creating a new storage adapter is straightforward because Brainy only requires these simple operations:

```typescript
interface StorageAdapter {
  // Basic key-value operations
  saveMetadata(id: string, data: any): Promise<void>
  getMetadata(id: string): Promise<any | null>
  
  // Entity operations (built on top of metadata)
  saveNoun(noun: HNSWNoun): Promise<void>
  getNoun(id: string): Promise<HNSWNoun | null>
  
  // Pagination support
  getNouns(options?: PaginationOptions): Promise<PaginatedResult<HNSWNoun>>
  getVerbs(options?: PaginationOptions): Promise<PaginatedResult<GraphVerb>>
  
  // Lifecycle
  init(): Promise<void>
  clear(): Promise<void>
}
```

## 🔌 Storage Systems You Can Add

### NoSQL Databases
- **MongoDB** - Store index entries as documents
- **DynamoDB** - Use partition keys for metadata indexes  
- **Firestore** - Collections for entities, subcollections for indexes
- **CouchDB** - Document-based storage with views

### SQL Databases  
- **PostgreSQL** - JSON columns for metadata, tables for entities
- **MySQL** - JSON fields with indexes
- **SQLite** - Lightweight local storage
- **SQL Server** - Enterprise integration

### Key-Value Stores
- **Redis** - High-performance caching and storage
- **LevelDB** - Embedded key-value database
- **RocksDB** - High-performance key-value store
- **etcd** - Distributed key-value store

### Graph Databases
- **Neo4j** - Store entities as nodes, indexes as separate node types
- **ArangoDB** - Multi-model database support
- **Amazon Neptune** - AWS managed graph database

### Cloud Storage
- **Google Cloud Storage** - Via S3-compatible API or native
- **Azure Blob Storage** - Native Azure integration
- **Backblaze B2** - Cost-effective cloud storage

### Search Engines
- **Elasticsearch** - Complement vector search with text search
- **Apache Solr** - Enterprise search integration
- **Algolia** - Hosted search service

## 💡 How Storage Adapters Work

### Simple Key-Value Foundation

All Brainy storage is built on a simple principle: **everything is stored as JSON objects with unique keys**.

```typescript
// This is all your storage needs to support:
await storage.saveMetadata("user_123", {
  name: "John Doe", 
  type: "person",
  email: "john@example.com"
})

const user = await storage.getMetadata("user_123")
// Returns: { name: "John Doe", type: "person", email: "john@example.com" }
```

### Automatic Index Management

The metadata indexing system automatically handles complex operations:

```typescript
// Brainy automatically creates these index entries:
await storage.saveMetadata("__metadata_index__type_person_chunk0", {
  field: "type",
  value: "person", 
  ids: ["user_123", "user_456", ...]
})

await storage.saveMetadata("__metadata_field_index__type", {
  values: { "person": 50, "company": 23, "product": 12 }
})
```

### Directory Structure

Storage adapters use a logical directory structure that maps to your storage system:

```
entities/
├── nouns/
│   ├── vectors/           # Vector data for semantic search
│   │   ├── user_123.json
│   │   └── company_456.json
│   └── metadata/          # Metadata + automatic indexes
│       ├── user_123.json  # User metadata
│       ├── __metadata_index__type_person_chunk0.json  # Index entries
│       └── __metadata_field_index__type.json          # Field values
└── verbs/
    ├── vectors/           # Relationship vectors
    └── metadata/          # Relationship metadata + indexes
```

## 🛠️ Creating a Custom Storage Adapter

### Step 1: Implement the Interface

```typescript
import { BaseStorage } from '@soulcraft/brainy'

export class MyCustomStorage extends BaseStorage {
  private client: MyDatabaseClient
  
  async init(): Promise<void> {
    this.client = new MyDatabaseClient(this.config)
    await this.client.connect()
    this.isInitialized = true
  }

  async saveMetadata(id: string, metadata: any): Promise<void> {
    // Map to your database's put/insert operation
    await this.client.put(id, JSON.stringify(metadata))
  }

  async getMetadata(id: string): Promise<any | null> {
    // Map to your database's get/select operation
    const result = await this.client.get(id)
    return result ? JSON.parse(result) : null
  }

  // Implement other required methods...
}
```

### Step 2: Use Your Custom Adapter

```typescript
import { BrainyData } from '@soulcraft/brainy'
import { MyCustomStorage } from './my-custom-storage'

const brainy = new BrainyData({
  storage: {
    custom: new MyCustomStorage({
      connectionString: 'your-db-connection-string',
      database: 'brainy-vectors'
    })
  }
})

await brainy.init()
// Now Brainy uses your custom storage backend!
```

## 🏗️ Implementation Examples

### Redis Storage Adapter

```typescript
export class RedisStorage extends BaseStorage {
  private redis: Redis

  async saveMetadata(id: string, data: any): Promise<void> {
    await this.redis.set(id, JSON.stringify(data))
  }

  async getMetadata(id: string): Promise<any | null> {
    const result = await this.redis.get(id)
    return result ? JSON.parse(result) : null
  }

  async getNouns(options?: PaginationOptions): Promise<PaginatedResult<HNSWNoun>> {
    const cursor = options?.cursor || '0'
    const limit = options?.limit || 100
    
    const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'entities/nouns/vectors/*', 'COUNT', limit)
    
    const nouns: HNSWNoun[] = []
    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        nouns.push(this.parseNoun(JSON.parse(data)))
      }
    }
    
    return {
      items: nouns,
      hasMore: newCursor !== '0',
      nextCursor: newCursor !== '0' ? newCursor : undefined
    }
  }
}
```

### MongoDB Storage Adapter

```typescript
export class MongoStorage extends BaseStorage {
  private db: MongoDatabase

  async saveMetadata(id: string, data: any): Promise<void> {
    const collection = this.getCollectionForId(id)
    await collection.replaceOne(
      { _id: id }, 
      { _id: id, data }, 
      { upsert: true }
    )
  }

  async getMetadata(id: string): Promise<any | null> {
    const collection = this.getCollectionForId(id)
    const doc = await collection.findOne({ _id: id })
    return doc?.data || null
  }

  private getCollectionForId(id: string): Collection {
    // Route different entity types to different collections for optimization
    if (id.startsWith('entities/nouns/')) return this.db.collection('nouns')
    if (id.startsWith('entities/verbs/')) return this.db.collection('verbs')
    if (id.startsWith('__metadata_index__')) return this.db.collection('indexes')
    return this.db.collection('metadata')
  }
}
```

## 🚀 Why This Architecture is Powerful

### 1. **Storage-Agnostic Intelligence**
All of Brainy's smart features work with any storage backend:
- Metadata indexing
- Filter discovery  
- Pagination
- Caching
- Real-time updates

### 2. **Performance Optimization**
Each adapter can optimize for its storage type:
- **Redis**: Leverage Redis pipelines and data structures
- **MongoDB**: Use MongoDB aggregation pipelines
- **SQL**: Optimize with proper indexes and queries
- **S3**: Batch operations and intelligent prefixing

### 3. **Zero Migration Lock-In**
Switch storage backends without changing your application code:
```typescript
// Development: File system
const devBrainy = new BrainyData({ storage: { fileSystem: { path: './data' } } })

// Production: S3
const prodBrainy = new BrainyData({ storage: { s3Storage: { bucketName: 'prod-vectors' } } })

// Same API, different storage!
```

### 4. **Hybrid Deployments**
Use different storage for different use cases:
```typescript
// Writers use S3 for durability
const writer = new BrainyData({ 
  storage: { s3Storage: { bucketName: 'durable-storage' } }
})

// Readers use Redis for speed  
const reader = new BrainyData({
  storage: { redis: { connectionString: 'redis://cache' } }
})
```

## 📊 Storage Performance Characteristics

| Storage Type | Write Speed | Read Speed | Scalability | Cost | Best For |
|--------------|-------------|------------|-------------|------|----------|
| Memory | ⚡⚡⚡⚡ | ⚡⚡⚡⚡ | ⚡ | 💰💰💰 | Testing, caching |
| Redis | ⚡⚡⚡ | ⚡⚡⚡⚡ | ⚡⚡⚡ | 💰💰 | Real-time apps |
| File System | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ | 💰 | Development, single server |
| MongoDB | ⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡⚡ | 💰💰 | Document-heavy apps |
| PostgreSQL | ⚡⚡ | ⚡⚡ | ⚡⚡⚡ | 💰💰 | Complex queries, ACID |
| S3-Compatible | ⚡ | ⚡⚡ | ⚡⚡⚡⚡ | 💰 | Large-scale, serverless |

## 🎯 Getting Started

### 1. **Choose Your Storage**
Pick the storage system that matches your needs and infrastructure.

### 2. **Implement or Use Existing**
Use a built-in adapter or create your own following the examples above.

### 3. **Configure and Deploy**
```typescript
const brainy = new BrainyData({
  storage: { yourStorage: yourConfig }
})
await brainy.init()
```

### 4. **Scale as Needed**
Switch storage backends as your requirements evolve - your application code stays the same.

## 💡 Need Help?

- **Built-in adapters**: Use File System, S3, OPFS, or Memory storage
- **Custom adapters**: Follow the examples above or ask in [GitHub Discussions](https://github.com/soulcraftlabs/brainy/discussions)
- **Performance tuning**: See [Storage Optimization Guide](../optimization-guides/storage-optimization.md)

**The power is in your hands** - Brainy adapts to your storage, not the other way around! 🚀