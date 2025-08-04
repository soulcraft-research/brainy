# Brainy Distributed Mode - Complete Usage Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Deployment Patterns](#deployment-patterns)
5. [Domain Management](#domain-management)
6. [Health Monitoring](#health-monitoring)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)
9. [Migration Guide](#migration-guide)

## Overview

Brainy's distributed mode enables you to scale your vector database across multiple instances, each optimized for specific workloads. This guide covers everything you need to know to deploy and manage Brainy at scale.

### Key Benefits

- **Horizontal Scaling**: Add readers for query performance, writers for ingestion throughput
- **Zero Coordination Overhead**: Simple shared JSON config in S3
- **Automatic Optimization**: Each role self-optimizes for its workload
- **Multi-Domain Support**: Handle different data types without conflicts

## Quick Start

### 1. Basic Setup

Distributed mode requires explicit role configuration for safety:

```javascript
import { createAutoBrainy } from 'brainy'

// Option 1: Environment variable (recommended for production)
process.env.BRAINY_ROLE = 'writer'  // or 'reader' or 'hybrid'
const brainy = createAutoBrainy({
  storage: { 
    type: 's3', 
    bucket: 'my-bucket',
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  distributed: true
})

// Option 2: Explicit configuration
const brainy = createAutoBrainy({
  storage: { /* s3 config */ },
  distributed: { 
    role: 'writer'  // Must specify role
  }
})

// Option 3: Inferred from read/write mode
const brainy = createAutoBrainy({
  storage: { /* s3 config */ },
  writeOnly: true,  // Role inferred as 'writer'
  distributed: true
})

await brainy.init()
```

### 2. Understanding Roles

Roles must be explicitly configured for each instance:

| Role | Purpose | Optimizations | When to Use |
|------|---------|---------------|-------------|
| **Writer** | Data ingestion | Write batching, minimal cache | ETL pipelines, data import |
| **Reader** | Query serving | Aggressive caching, prefetching | API servers, search services |
| **Hybrid** | Both operations | Adaptive caching | Small deployments, development |

### 3. Role Configuration Methods

```javascript
// Priority order for role determination:
// 1. BRAINY_ROLE environment variable (highest priority)
// 2. Explicit role in distributed config
// 3. Inferred from readOnly/writeOnly mode
// 4. ERROR - role must be explicitly set

// Examples:
// Environment variable (production recommended)
BRAINY_ROLE=writer node app.js

// Explicit in code
distributed: { role: 'reader' }

// Inferred from mode
writeOnly: true  // becomes 'writer'
readOnly: true   // becomes 'reader'
```

## Configuration

### Basic Configuration

```javascript
const brainy = createAutoBrainy({
  storage: { /* S3 config */ },
  distributed: {
    enabled: true,              // Enable distributed mode
    role: 'reader',            // Optional: explicit role
    instanceId: 'reader-01',   // Optional: custom ID
    configPath: '_brainy/config.json',  // Config location
    heartbeatInterval: 30000,  // Health check interval
    instanceTimeout: 60000     // Dead instance timeout
  }
})
```

### Environment Variables

```bash
# Set role via environment
export BRAINY_ROLE=writer

# Custom instance ID
export BRAINY_INSTANCE_ID=prod-writer-01

# Service endpoint for health checks
export SERVICE_ENDPOINT=http://writer-01:3000
```

### Shared Configuration Structure

The shared config file (`_brainy/config.json`) in S3:

```json
{
  "version": 1,
  "updated": "2024-01-15T10:30:00Z",
  "settings": {
    "partitionStrategy": "hash",
    "partitionCount": 100,
    "embeddingModel": "text-embedding-ada-002",
    "dimensions": 1536,
    "distanceMetric": "cosine"
  },
  "instances": {
    "writer-01": {
      "role": "writer",
      "status": "active",
      "lastHeartbeat": "2024-01-15T10:29:50Z",
      "metrics": {
        "vectorCount": 1000000,
        "cacheHitRate": 0.2,
        "memoryUsage": 512000000
      }
    },
    "reader-01": {
      "role": "reader",
      "status": "active",
      "lastHeartbeat": "2024-01-15T10:29:55Z",
      "metrics": {
        "vectorCount": 1000000,
        "cacheHitRate": 0.95,
        "memoryUsage": 1024000000
      }
    }
  }
}
```

## Deployment Patterns

### Pattern 1: Simple Read/Write Split

Best for: Most applications with clear ingestion vs query workloads

```yaml
# docker-compose.yml
version: '3.8'

services:
  writer:
    image: myapp:latest
    environment:
      BRAINY_ROLE: writer
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    deploy:
      replicas: 1  # Usually one writer
      
  reader:
    image: myapp:latest
    environment:
      BRAINY_ROLE: reader
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    deploy:
      replicas: 5  # Scale readers as needed
```

### Pattern 2: Multi-Domain Ingestion

Best for: Multiple data sources with different schemas

```javascript
// Medical data writer
const medicalWriter = createAutoBrainy({
  storage: s3Config,
  distributed: { 
    role: 'writer',
    instanceId: 'medical-writer'
  }
})

// Legal data writer
const legalWriter = createAutoBrainy({
  storage: s3Config,
  distributed: { 
    role: 'writer',
    instanceId: 'legal-writer'
  }
})

// Unified reader for all domains
const reader = createAutoBrainy({
  storage: s3Config,
  distributed: { role: 'reader' }
})
```

### Pattern 3: Lambda + ECS Hybrid

Best for: Serverless search with persistent ingestion

```javascript
// Lambda function (configure as reader)
export const handler = async (event) => {
  const brainy = createAutoBrainy({
    storage: s3Config,
    distributed: { role: 'reader' }  // Explicit role required
    // OR use readOnly mode:
    // readOnly: true,
    // distributed: true
  })
  
  const results = await brainy.search(event.query, 10)
  return { statusCode: 200, body: JSON.stringify(results) }
}

// ECS task (writer)
const writer = createAutoBrainy({
  storage: s3Config,
  distributed: { role: 'writer' }
  // OR use writeOnly mode:
  // writeOnly: true,
  // distributed: true
})
```

### Pattern 4: Kubernetes StatefulSet + Deployment

```yaml
# Writer StatefulSet (persistent identity)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: brainy-writer
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: writer
        env:
        - name: BRAINY_ROLE
          value: writer
        - name: BRAINY_INSTANCE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name

---
# Reader Deployment (stateless, scalable)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brainy-readers
spec:
  replicas: 10
  template:
    spec:
      containers:
      - name: reader
        env:
        - name: BRAINY_ROLE
          value: reader
```

## Domain Management

### Automatic Domain Detection

Brainy automatically detects data domains based on content:

```javascript
// These are automatically tagged with appropriate domains
await brainy.add({
  symptoms: "headache",
  diagnosis: "migraine"
})  // Tagged as 'medical'

await brainy.add({
  contract: "lease agreement",
  parties: ["John", "Jane"]
})  // Tagged as 'legal'

await brainy.add({
  price: 99.99,
  sku: "PROD-123"
})  // Tagged as 'product'
```

### Custom Domain Patterns

```javascript
import { DomainDetector } from 'brainy/distributed'

const detector = new DomainDetector()

// Add custom domain pattern
detector.addCustomPattern({
  domain: 'automotive',
  patterns: {
    fields: ['make', 'model', 'year', 'vin'],
    keywords: ['car', 'vehicle', 'automobile', 'engine'],
    regex: /\b[A-Z0-9]{17}\b/  // VIN pattern
  },
  priority: 1
})
```

### Searching by Domain

```javascript
// Search all domains
const allResults = await brainy.search("treatment options", 10)

// Search specific domain
const medicalOnly = await brainy.search("treatment options", 10, {
  filter: { domain: 'medical' }
})

// Multiple domain search
const results = await Promise.all([
  brainy.search(query, 5, { filter: { domain: 'medical' } }),
  brainy.search(query, 5, { filter: { domain: 'legal' } })
])
```

## Health Monitoring

### Getting Health Status

```javascript
const health = brainy.getHealthStatus()
console.log(health)
// {
//   status: 'healthy',
//   instanceId: 'reader-01',
//   role: 'reader',
//   uptime: 3600,
//   metrics: {
//     vectorCount: 1000000,
//     cacheHitRate: 0.95,
//     memoryUsageMB: 1024,
//     cpuUsagePercent: 45,
//     requestsPerSecond: 150,
//     averageLatencyMs: 25,
//     errorRate: 0.001
//   },
//   warnings: ['High memory usage detected']
// }
```

### Health Check Endpoint

```javascript
// Express.js health endpoint
app.get('/health', (req, res) => {
  const health = brainy.getHealthStatus()
  
  // Return appropriate HTTP status
  const httpStatus = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 503 : 500
  
  res.status(httpStatus).json(health)
})
```

### Monitoring Dashboard

```javascript
// Collect metrics for monitoring
setInterval(async () => {
  const health = brainy.getHealthStatus()
  
  // Send to monitoring service
  await prometheus.gauge('brainy_vector_count', health.metrics.vectorCount)
  await prometheus.gauge('brainy_cache_hit_rate', health.metrics.cacheHitRate)
  await prometheus.gauge('brainy_memory_usage', health.metrics.memoryUsageMB)
  await prometheus.gauge('brainy_rps', health.metrics.requestsPerSecond)
}, 30000)
```

## Performance Optimization

### Reader Optimization

```javascript
// Readers benefit from aggressive caching
const reader = createAutoBrainy({
  storage: s3Config,
  distributed: { role: 'reader' },
  cache: {
    hotCacheMaxSize: 50000,     // Large cache for frequent items
    hotCacheEvictionThreshold: 0.9,  // Keep cache full
    warmCacheTTL: 3600000,      // 1 hour TTL
    readOnlyMode: {
      prefetchStrategy: 'aggressive'  // Prefetch related vectors
    }
  }
})
```

### Writer Optimization

```javascript
// Writers benefit from batching
const writer = createAutoBrainy({
  storage: s3Config,
  distributed: { role: 'writer' },
  cache: {
    hotCacheMaxSize: 5000,       // Small cache
    batchSize: 1000,             // Large batch writes
    autoTune: false              // Consistent write performance
  }
})

// Batch insertions for better performance
const batch = []
for (const item of items) {
  batch.push(writer.add(item, metadata))
  
  if (batch.length >= 100) {
    await Promise.all(batch)
    batch.length = 0
  }
}
```

### Network Optimization

```javascript
// Use connection pooling for S3
const s3Config = {
  type: 's3',
  bucket: 'my-bucket',
  maxRetries: 3,
  httpOptions: {
    agent: new https.Agent({
      keepAlive: true,
      maxSockets: 50
    })
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Role Conflicts

**Problem**: Multiple instances trying to be writers

**Solution**: Explicitly set roles
```javascript
// Use environment variables
BRAINY_ROLE=writer node writer.js
BRAINY_ROLE=reader node reader.js
```

#### 2. Stale Instances

**Problem**: Dead instances not being cleaned up

**Solution**: Check heartbeat settings
```javascript
const brainy = createAutoBrainy({
  distributed: {
    heartbeatInterval: 15000,  // More frequent heartbeats
    instanceTimeout: 45000      // Shorter timeout
  }
})
```

#### 3. Configuration Conflicts

**Problem**: Instances have incompatible settings

**Solution**: Check the shared config
```bash
# Download and inspect config
aws s3 cp s3://my-bucket/_brainy/config.json ./config.json
cat config.json

# Fix and upload if needed
aws s3 cp ./config.json s3://my-bucket/_brainy/config.json
```

#### 4. Performance Issues

**Problem**: Slow searches in distributed mode

**Solution**: Check role distribution
```javascript
// Ensure you have enough readers
const config = await brainy.getDistributedConfig()
const readers = Object.values(config.instances)
  .filter(i => i.role === 'reader' && i.status === 'active')
  
console.log(`Active readers: ${readers.length}`)
```

### Debug Mode

```javascript
// Enable verbose logging
const brainy = createAutoBrainy({
  storage: s3Config,
  distributed: true,
  logging: { verbose: true }
})

// Logs will show:
// - Role detection process
// - Configuration updates
// - Partition assignments
// - Domain detection
// - Health check results
```

## Migration Guide

### From Single Instance to Distributed

#### Step 1: Prepare S3 Storage

```javascript
// Before: Local or single S3 instance
const brainy = createAutoBrainy({
  storage: { type: 'opfs' }  // or single S3
})

// After: S3 with distributed config
const brainy = createAutoBrainy({
  storage: {
    type: 's3',
    bucket: 'my-bucket',
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  distributed: true
})
```

#### Step 2: Migrate Data

```javascript
// Export from old instance
const allData = await oldBrainy.exportAll()

// Import to new distributed instance
const writer = createAutoBrainy({
  storage: s3Config,
  distributed: { role: 'writer' }
})

for (const item of allData) {
  await writer.add(item.vector, item.metadata, { id: item.id })
}
```

#### Step 3: Update Application Code

```javascript
// Add distributed initialization
const brainy = createAutoBrainy({
  storage: s3Config,
  distributed: true
})

// Add cleanup on shutdown
process.on('SIGTERM', async () => {
  await brainy.cleanup()
  process.exit(0)
})
```

#### Step 4: Deploy Readers

```yaml
# Scale out readers gradually
kubectl scale deployment brainy-readers --replicas=2
# Monitor performance
kubectl scale deployment brainy-readers --replicas=5
# Continue scaling as needed
kubectl scale deployment brainy-readers --replicas=10
```

### Best Practices

1. **Start Small**: Begin with 1 writer and 2-3 readers
2. **Monitor Metrics**: Watch cache hit rates and latency
3. **Scale Gradually**: Add instances based on actual load
4. **Use Health Checks**: Integrate with load balancers
5. **Clean Shutdown**: Always call `cleanup()` on shutdown
6. **Regular Backups**: Backup S3 bucket regularly

## Advanced Topics

### Custom Partitioning

```javascript
// Override default hash partitioning
class CustomPartitioner extends HashPartitioner {
  getPartition(vectorId) {
    // Custom logic for partition assignment
    if (vectorId.startsWith('priority-')) {
      return 'vectors/p000'  // Hot partition
    }
    return super.getPartition(vectorId)
  }
}
```

### Multi-Region Deployment

```javascript
// Region-specific readers
const usReader = createAutoBrainy({
  storage: {
    type: 's3',
    bucket: 'my-bucket',
    region: 'us-east-1'
  },
  distributed: { 
    role: 'reader',
    instanceId: 'us-reader-01'
  }
})

const euReader = createAutoBrainy({
  storage: {
    type: 's3',
    bucket: 'my-bucket-eu',
    region: 'eu-west-1'
  },
  distributed: { 
    role: 'reader',
    instanceId: 'eu-reader-01'
  }
})
```

### Hybrid Cloud Deployment

```javascript
// On-premise writer
const onPremWriter = createAutoBrainy({
  storage: {
    type: 'customS3',
    endpoint: 'https://minio.internal:9000',
    bucket: 'brainy-data'
  },
  distributed: { role: 'writer' }
})

// Cloud readers
const cloudReader = createAutoBrainy({
  storage: {
    type: 's3',
    bucket: 'brainy-data-replicated'
  },
  distributed: { role: 'reader' }
})
```

## Conclusion

Brainy's distributed mode provides a simple yet powerful way to scale your vector database. With automatic role detection, zero-coordination overhead, and built-in optimizations, you can focus on building your application while Brainy handles the complexity of distributed systems.

For more information, see:
- [Architecture Documentation](./distributed-deployment-scenario.md)
- [Implementation Details](./brainy-distributed-enhancements-revised.md)
- [API Reference](../README.md#api-reference)