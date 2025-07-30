# Real-time Updates in Brainy

This document explains the real-time update features in Brainy, which ensure that the in-memory index and statistics are always up-to-date with the latest data in storage.

## Overview

When running Brainy inside a web service with data being constantly added in a stream (using S3 or any other storage option), the new data needs to be searchable in real-time. The real-time update feature periodically checks for new data in storage and updates the in-memory index and statistics accordingly.

## Configuration

Real-time updates can be configured when creating a BrainyData instance:

```typescript
import { BrainyData } from '@soulcraft/brainy'

const db = new BrainyData({
  // ... other configuration options ...
  
  // Real-time update configuration
  realtimeUpdates: {
    // Whether to enable automatic updates (default: false)
    enabled: true,
    
    // The interval in milliseconds at which to check for updates (default: 30000 - 30 seconds)
    interval: 10000, // 10 seconds
    
    // Whether to update statistics when checking for updates (default: true)
    updateStatistics: true,
    
    // Whether to update the index when checking for updates (default: true)
    updateIndex: true
  }
})
```

## Runtime Control

Real-time updates can also be controlled at runtime:

### Enable Real-time Updates

```typescript
// Enable with default configuration
db.enableRealtimeUpdates()

// Enable with custom configuration
db.enableRealtimeUpdates({
  interval: 5000, // 5 seconds
  updateStatistics: true,
  updateIndex: true
})
```

### Disable Real-time Updates

```typescript
db.disableRealtimeUpdates()
```

### Get Current Configuration

```typescript
const config = db.getRealtimeUpdateConfig()
console.log(`Real-time updates enabled: ${config.enabled}`)
console.log(`Update interval: ${config.interval}ms`)
```

### Manual Update Check

You can also manually check for updates at any time, regardless of whether automatic updates are enabled:

```typescript
await db.checkForUpdatesNow()
```

## How It Works

When real-time updates are enabled, Brainy will:

1. Periodically check for new data in storage at the specified interval.
2. If new data is found, update the in-memory index with the new data.
3. Update the statistics to reflect the latest data.

This ensures that search operations and statistics always reflect the latest data, even when data is being added by external processes.

### Incremental Updates

The real-time update mechanism is designed to be efficient and only processes new data:

- **Incremental Indexing**: Brainy only adds new items to the index that aren't already there, rather than reloading the entire index. It compares the IDs of items in storage with those already in the index to identify only the new items that need to be added.

- **Efficient Statistics Updates**: Statistics are updated incrementally as well, with changes being batched for performance.

### Handling Large Indices

Brainy is designed to handle indices that are too large to fit entirely in memory:

- **Optimized HNSW Implementation**: Brainy uses the `HNSWIndexOptimized` class which supports large datasets through:
  - **Product Quantization**: Compresses vectors to reduce memory usage while maintaining search quality
  - **Disk-Based Storage**: Can offload parts of the index to disk when memory is constrained

- **Memory Management**: When the index grows too large for available memory:
  1. The most frequently accessed items are kept in memory for fast access
  2. Less frequently accessed items may be stored on disk and loaded when needed
  3. The system automatically balances memory usage based on access patterns

- **Configurable Trade-offs**: You can configure the balance between memory usage and performance through the HNSW configuration options when creating the database.

## Best Practices

- For high-volume data streams, set a reasonable update interval to balance real-time updates with performance.
- If you only need occasional updates, disable automatic updates and use `checkForUpdatesNow()` when needed.
- For web services with multiple instances, each instance will maintain its own in-memory index and statistics.

## Compatibility

Real-time updates work with all storage options supported by Brainy, including:

- File system storage
- Memory storage
- S3 storage
- Custom storage adapters

## Example: Web Service with S3 Storage

```typescript
import { BrainyData } from '@soulcraft/brainy'
import express from 'express'

const app = express()

// Create a BrainyData instance with S3 storage and real-time updates
const db = new BrainyData({
  storage: {
    s3Storage: {
      bucketName: 'my-brainy-bucket',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'us-west-2'
    }
  },
  realtimeUpdates: {
    enabled: true,
    interval: 30000 // 30 seconds
  }
})

// Initialize the database
await db.init()

// API endpoint to search
app.get('/search', async (req, res) => {
  const { query, limit } = req.query
  const results = await db.searchText(query, parseInt(limit) || 10)
  res.json(results)
})

// API endpoint to get statistics
app.get('/stats', async (req, res) => {
  const stats = await db.getStatistics()
  res.json(stats)
})

// API endpoint to manually check for updates
app.post('/update', async (req, res) => {
  await db.checkForUpdatesNow()
  res.json({ success: true })
})

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.shutDown()
  process.exit(0)
})
```

In this example, the BrainyData instance will automatically check for new data in the S3 bucket every 30 seconds, ensuring that search results and statistics are always up-to-date.
