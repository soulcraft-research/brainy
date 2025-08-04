# Distributed Brainy Deployment: Multi-Instance S3 Architecture

## Scenario Overview

A production deployment with 3 specialized Brainy instances sharing a single S3 bucket as the source of truth:

1. **Search Instance** (Read-Only): High-performance search across millions of vectors
2. **Bluesky Processor** (Write-Only): High-throughput ingestion from Bluesky firehose
3. **GitHub Crawler** (Write-Only): Continuous crawling and indexing of GitHub data

All instances run as Google Cloud Run containers with shared S3 storage.

## Architecture Design

### Shared Configuration Strategy

#### Option 1: Configuration Service (Recommended)
```typescript
// config-service.ts - Deployed as separate Cloud Run service
export class BrainyConfigService {
  private s3Config = {
    bucket: 'brainy-vectors-prod',
    configPath: '_brainy/config.json',
    lockPath: '_brainy/config.lock'
  };

  async getSharedConfig(): Promise<BrainyConfig> {
    // Fetch from S3 with caching
    return {
      hnsw: {
        M: 16,
        efConstruction: 200,
        seed: 42,  // Critical: same seed for consistent partitioning
        maxElements: 10000000
      },
      partitioning: {
        strategy: 'semantic',
        numPartitions: 128,  // Must be consistent across instances
        replicationFactor: 3,
        hashFunction: 'xxhash'  // Deterministic partitioning
      },
      storage: {
        compressionLevel: 6,
        chunkSize: 1024 * 1024,  // 1MB chunks
        prefixStrategy: 'date-based'  // e.g., /2024/01/15/
      },
      caching: {
        hotCacheSize: '2GB',
        warmCacheSize: '8GB',
        ttl: 3600
      }
    };
  }
}
```

#### Option 2: S3-Based Config Synchronization
Store configuration in S3 with versioning and atomic updates:
```
s3://brainy-vectors-prod/
  _brainy/
    config.json          # Shared configuration
    schema.json          # Vector schema definition
    partitions.json      # Partition mapping
    instances/
      search-001.json    # Instance-specific overrides
      bluesky-001.json
      github-001.json
```

### Instance-Specific Configurations

#### 1. Search Instance (Read-Only)
```typescript
const searchConfig = {
  ...sharedConfig,
  mode: 'read-only',
  caching: {
    hotCacheSize: '8GB',     // Maximize cache for search
    warmCacheSize: '32GB',
    prefetchStrategy: 'aggressive',
    bloomFilters: true        // Fast negative lookups
  },
  hnsw: {
    ...sharedConfig.hnsw,
    efSearch: 100,           // Higher for better recall
    useMmap: true            // Memory-mapped files for large indices
  },
  s3: {
    readConcurrency: 20,     // High parallelism for reads
    useTransferAcceleration: true,
    cacheHeaders: true
  },
  monitoring: {
    metrics: ['latency', 'recall', 'cache_hit_rate']
  }
};
```

#### 2. Bluesky Processor (Write-Only)
```typescript
const blueksyConfig = {
  ...sharedConfig,
  mode: 'write-only',
  batching: {
    size: 10000,              // Large batches for throughput
    flushInterval: 5000,      // 5 seconds
    parallelWrites: 4
  },
  deduplication: {
    enabled: true,
    bloomFilter: true,
    windowSize: 1000000       // Check last 1M entries
  },
  s3: {
    writeConcurrency: 10,
    multipartThreshold: 50 * 1024 * 1024,  // 50MB
    useServerSideEncryption: true
  },
  indexing: {
    async: true,              // Don't wait for index updates
    batchIndexUpdates: true
  }
};
```

#### 3. GitHub Crawler (Write-Only)
```typescript
const githubConfig = {
  ...sharedConfig,
  mode: 'write-only',
  rateLimit: {
    requestsPerSecond: 10,    // Respect API limits
    burstSize: 20
  },
  batching: {
    size: 1000,               // Smaller batches, continuous flow
    flushInterval: 10000      // 10 seconds
  },
  embedding: {
    model: 'text-embedding-3-small',
    batchSize: 100,
    cacheEmbeddings: true
  },
  s3: {
    writeConcurrency: 5,
    retryStrategy: 'exponential'
  }
};
```

## Synchronization Mechanisms

### 1. Partition Coordinator Service
Deploy a lightweight coordinator that manages partition assignments:

```typescript
class PartitionCoordinator {
  private websocket: WebSocketServer;
  
  async assignPartition(instanceId: string, mode: 'read' | 'write') {
    if (mode === 'write') {
      // Ensure no partition is assigned to multiple writers
      return this.getExclusivePartition(instanceId);
    } else {
      // Readers can access all partitions
      return 'all';
    }
  }
  
  async rebalance() {
    // Triggered when instances join/leave
    // Ensures even distribution of write load
  }
}
```

### 2. Event Broadcasting via Pub/Sub
Use Google Cloud Pub/Sub for coordination:

```typescript
interface BrainyEvent {
  type: 'partition_created' | 'index_updated' | 'config_changed';
  timestamp: number;
  payload: any;
}

// Writers publish events
await pubsub.topic('brainy-events').publish({
  type: 'partition_created',
  payload: { partitionId: 'p-123', vectorCount: 50000 }
});

// Readers subscribe and update local state
subscription.on('message', (message) => {
  if (message.type === 'index_updated') {
    await this.refreshLocalIndex(message.payload.partitionId);
  }
});
```

## Performance Optimizations

### 1. Write Path Optimization
```typescript
// Parallel partition writes
class PartitionedWriter {
  async write(vectors: Vector[]) {
    const partitioned = this.partitionVectors(vectors);
    
    await Promise.all(
      Object.entries(partitioned).map(([partitionId, vecs]) =>
        this.writeToPartition(partitionId, vecs)
      )
    );
  }
  
  private partitionVectors(vectors: Vector[]) {
    // Use consistent hash to determine partition
    return vectors.reduce((acc, vec) => {
      const partition = hashToPartition(vec.id);
      acc[partition] = acc[partition] || [];
      acc[partition].push(vec);
      return acc;
    }, {});
  }
}
```

### 2. Read Path Optimization
```typescript
// Distributed search with result aggregation
class DistributedSearch {
  async search(query: Vector, k: number) {
    // Identify relevant partitions using routing table
    const partitions = await this.getRelevantPartitions(query);
    
    // Parallel search across partitions
    const results = await Promise.all(
      partitions.map(p => this.searchPartition(p, query, k * 2))
    );
    
    // Merge and re-rank results
    return this.mergeResults(results, k);
  }
}
```

### 3. S3 Optimization Strategies
```typescript
const s3Optimizations = {
  // Use S3 Transfer Acceleration for cross-region
  transferAcceleration: true,
  
  // Intelligent prefixing for parallel reads
  prefixSharding: {
    enabled: true,
    shardCount: 16,  // Distribute across 16 prefixes
    strategy: 'hash'  // or 'round-robin'
  },
  
  // Batch operations
  batchOperations: {
    getObject: 100,   // Batch up to 100 GETs
    putObject: 50     // Batch up to 50 PUTs
  },
  
  // Caching strategy
  caching: {
    cloudFront: true,  // Use CDN for read-heavy workloads
    s3CacheControl: 'max-age=3600'
  }
};
```

## Suggested Brainy Enhancements

### 1. Native Distributed Mode
```typescript
// Proposed API
const brainy = new BrainyData({
  distributed: {
    mode: 'cluster',
    role: 'writer' | 'reader' | 'hybrid',
    coordinator: 'redis://coordinator:6379',
    instanceId: process.env.INSTANCE_ID
  }
});
```

### 2. S3 Lock Manager
```typescript
class S3LockManager {
  async acquireLock(resource: string, ttl: number) {
    // Use S3 conditional puts for distributed locking
    const lockKey = `_locks/${resource}`;
    const lockValue = `${this.instanceId}-${Date.now()}`;
    
    try {
      await s3.putObject({
        Bucket: this.bucket,
        Key: lockKey,
        Body: lockValue,
        Metadata: { ttl: ttl.toString() },
        Condition: 'ObjectDoesNotExist'
      });
      return true;
    } catch (err) {
      if (err.code === 'PreconditionFailed') {
        return false;  // Lock already held
      }
      throw err;
    }
  }
}
```

### 3. Partition Discovery Service
```typescript
class PartitionDiscovery {
  private cache = new Map();
  
  async discoverPartitions(): Promise<Partition[]> {
    // List S3 prefixes to discover partitions
    const result = await s3.listObjectsV2({
      Bucket: this.bucket,
      Prefix: 'partitions/',
      Delimiter: '/'
    });
    
    return result.CommonPrefixes.map(prefix => ({
      id: prefix.Prefix.split('/')[1],
      metadata: await this.getPartitionMetadata(prefix.Prefix)
    }));
  }
  
  subscribeToChanges(callback: (event: PartitionEvent) => void) {
    // Watch S3 events or use SNS/EventBridge
  }
}
```

### 4. Consistency Manager
```typescript
class ConsistencyManager {
  async ensureConsistency() {
    // Periodic consistency checks
    const tasks = [
      this.verifyPartitionIntegrity(),
      this.checkIndexConsistency(),
      this.validateConfiguration()
    ];
    
    const results = await Promise.all(tasks);
    
    if (results.some(r => !r.valid)) {
      await this.triggerRepair();
    }
  }
}
```

## Deployment Configuration

### Cloud Run Service Definitions

```yaml
# search-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: brainy-search
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project/brainy-search:latest
        env:
        - name: BRAINY_MODE
          value: "read-only"
        - name: BRAINY_ROLE
          value: "search"
        resources:
          limits:
            cpu: "4"
            memory: "16Gi"
        startupProbe:
          httpGet:
            path: /health
          initialDelaySeconds: 30
          
# bluesky-processor.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: brainy-bluesky
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project/brainy-bluesky:latest
        env:
        - name: BRAINY_MODE
          value: "write-only"
        - name: BRAINY_ROLE
          value: "bluesky-processor"
        resources:
          limits:
            cpu: "2"
            memory: "8Gi"
```

### Environment Variables
```bash
# Common to all instances
BRAINY_S3_BUCKET=brainy-vectors-prod
BRAINY_S3_REGION=us-central1
BRAINY_CONFIG_SOURCE=s3
BRAINY_CONFIG_PATH=_brainy/config.json

# Instance-specific
BRAINY_INSTANCE_ID=${K_SERVICE}-${K_REVISION}
BRAINY_ROLE=search|bluesky|github
BRAINY_MODE=read-only|write-only
```

## Monitoring and Operations

### Key Metrics to Track
1. **Search Instance**
   - Query latency (p50, p95, p99)
   - Cache hit ratio
   - Concurrent searches
   - S3 GET requests/sec

2. **Write Instances**
   - Ingestion rate (vectors/sec)
   - Batch size and latency
   - S3 PUT requests/sec
   - Partition distribution

3. **System-Wide**
   - Total vector count
   - Partition count and size distribution
   - S3 storage usage and costs
   - Cross-instance consistency lag

### Health Checks
```typescript
app.get('/health', async (req, res) => {
  const health = {
    instance: process.env.BRAINY_INSTANCE_ID,
    role: process.env.BRAINY_ROLE,
    status: 'healthy',
    checks: {
      s3_connectivity: await checkS3(),
      config_loaded: await checkConfig(),
      partition_access: await checkPartitions(),
      memory_usage: process.memoryUsage()
    }
  };
  
  res.json(health);
});
```

## Cost Optimization

1. **S3 Intelligent Tiering**: Automatically move cold partitions to cheaper storage classes
2. **Request Batching**: Minimize S3 API calls through batching
3. **CDN for Reads**: Use Cloud CDN for frequently accessed partitions
4. **Lifecycle Policies**: Auto-delete old snapshots and temporary data
5. **Reserved Capacity**: Use committed use discounts for Cloud Run

## Implementation Timeline

### Phase 1: Basic Setup (Week 1)
- Deploy 3 instances with shared S3 bucket
- Implement basic configuration synchronization
- Set up monitoring

### Phase 2: Optimization (Week 2-3)
- Implement partition coordinator
- Add caching layers
- Optimize S3 operations

### Phase 3: Advanced Features (Week 4+)
- Add WebSocket-based coordination
- Implement consistency checks
- Add auto-scaling based on load

## Conclusion

This architecture provides a scalable, distributed Brainy deployment that can handle millions of vectors with specialized instances for different workloads. The key is maintaining consistency through shared configuration and coordination while optimizing each instance for its specific role.