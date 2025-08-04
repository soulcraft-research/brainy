# Performance Features Guide

This guide covers the advanced performance features added in Brainy v0.38.1+ that dramatically improve search speed and pagination capabilities, including intelligent auto-configuration.

## 🤖 Intelligent Auto-Configuration (NEW!)

**Brainy now configures itself automatically!** The new auto-configuration system detects your environment and usage patterns, then optimally configures caching and real-time updates with zero manual setup required.

### How It Works

- **🔍 Environment Detection**: Automatically detects browser, Node.js, serverless, or distributed scenarios
- **📊 Usage Pattern Analysis**: Learns from your read/write patterns and data change frequency  
- **⚡ Real-Time Adaptation**: Continuously monitors performance and adjusts settings automatically
- **🌐 Distributed Mode Awareness**: Detects shared storage scenarios and enables real-time updates
- **🎯 Zero Configuration**: Works perfectly out of the box, but respects explicit settings

### Automatic Optimizations

```javascript
// Just create a Brainy instance - everything is optimized automatically!
const brainy = new BrainyData()
await brainy.init()

// Auto-configuration analyzes your environment and optimizes:
// ✅ Cache size based on available memory
// ✅ Cache TTL based on data change frequency  
// ✅ Real-time updates for distributed storage
// ✅ Read vs write workload optimization
// ✅ Memory constraint handling
```

### Configuration Explanations

Enable verbose logging to see what optimizations are being applied:

```javascript
const brainy = new BrainyData({
  logging: { verbose: true }
})
await brainy.init()

// Console output:
// 🤖 Brainy Auto-Configuration:
// 
// 📊 Cache: 100 queries, 300s TTL
// 🔄 Updates: Every 30s
// 
// 🎯 Optimizations applied:
//   • Read-heavy workload detected - increased cache size and TTL
//   • Distributed storage detected - enabled real-time updates
//   • Reduced cache TTL for distributed consistency
```

### Manual Override (Optional)

Auto-configuration respects your explicit settings when provided:

```javascript
const brainy = new BrainyData({
  // Explicit settings override auto-configuration
  searchCache: {
    maxSize: 500,
    maxAge: 600000
  },
  realtimeUpdates: {
    enabled: true,
    interval: 15000
  }
})
```

### Performance Scenarios

**🏠 Local Development**
- Large cache with long TTL for best performance
- Real-time updates disabled (not needed for single instance)

**🌐 Distributed Production**
- Shorter cache TTL for data consistency
- Real-time updates enabled automatically
- Adaptive intervals based on change frequency

**💾 Memory-Constrained Environments**
- Smaller cache sizes with intelligent eviction
- Optimized for essential caching only

**📈 High-Traffic Applications**
- Larger caches with hit-count weighted eviction
- Performance monitoring and auto-adaptation

## 🚀 Smart Search Caching

Brainy includes intelligent result caching that can make repeated queries **100x faster** with zero code changes required.

### How It Works

- **Automatic**: Caching is enabled by default and works transparently
- **Intelligent**: Only caches successful search results 
- **Self-Maintaining**: Automatically invalidates when data changes
- **Memory-Conscious**: LRU eviction prevents memory bloat

### Performance Impact

```javascript
// First search: ~50ms (database query)
const results1 = await brainy.search('machine learning', 10)

// Second identical search: <1ms (cache hit!)
const results2 = await brainy.search('machine learning', 10)
```

### Configuration Options

```javascript
const brainy = new BrainyData({
  searchCache: {
    enabled: true,        // Enable/disable caching (default: true)
    maxSize: 100,         // Max number of cached queries (default: 100)
    maxAge: 300000,       // Cache TTL in milliseconds (default: 5 minutes)
    hitCountWeight: 0.3   // Weight for hit count in eviction (default: 0.3)
  }
})
```

### Cache Monitoring

```javascript
// Get performance statistics
const stats = brainy.getCacheStats()
console.log(`Hit rate: ${(stats.search.hitRate * 100).toFixed(1)}%`)
console.log(`Cache size: ${stats.search.size}/${stats.search.maxSize}`)
console.log(`Memory usage: ${(stats.searchMemoryUsage / 1024).toFixed(1)}KB`)

// Manual cache management
brainy.clearCache()  // Clear all cached results
```

### Real-Time Data Compatibility

**The cache automatically maintains data consistency:**

#### 🏠 **Single Instance (Local Changes)**
- ✅ Adding new data invalidates all caches
- ✅ Updating metadata invalidates related caches  
- ✅ Deleting data invalidates all caches
- ✅ Clearing database invalidates all caches

#### 🌐 **Distributed Mode (Shared S3 Storage)**
- ✅ **Real-time updates detect external changes** automatically
- ✅ **Cache invalidation on external data changes** 
- ✅ **Time-based cache expiration** as safety net
- ✅ **Periodic cache cleanup** removes stale entries

```javascript
// Enable real-time updates for distributed scenarios
const brainy = new BrainyData({
  storage: { 
    s3Storage: { bucketName: 'shared-bucket' } 
  },
  searchCache: {
    maxAge: 300000  // 5 minutes - shorter in distributed mode
  },
  realtimeUpdates: {
    enabled: true,     // Essential for shared storage
    interval: 30000,   // Check every 30 seconds
    updateIndex: true, // Update local index with external changes
    updateStatistics: true
  }
})
```

This ensures you get fresh results even when other services add data to shared storage, while still benefiting from caching performance.

### Cache Invalidation Strategies

```javascript
// Disable caching for specific queries
const freshResults = await brainy.search('query', 10, { skipCache: true })

// The cache uses smart invalidation patterns:
await brainy.add(newData)        // Invalidates all search caches
await brainy.updateMetadata(id)  // Invalidates all search caches  
await brainy.delete(id)          // Invalidates all search caches
```

## 📄 Cursor-Based Pagination

For large result sets, cursor-based pagination provides constant-time performance regardless of page depth.

### Traditional Offset Problems

```javascript
// Traditional offset pagination gets slower with depth
const page1 = await brainy.search('query', 10, { offset: 0 })    // Fast
const page2 = await brainy.search('query', 10, { offset: 10 })   // Still fast
const page100 = await brainy.search('query', 10, { offset: 1000 }) // Slow!
```

### Cursor Solution

```javascript
// Cursor pagination is constant time for any depth
const page1 = await brainy.searchWithCursor('query', 10)
console.log(`Found ${page1.results.length} results`)
console.log(`Has more: ${page1.hasMore}`)

if (page1.hasMore) {
  // Next page is just as fast as the first
  const page2 = await brainy.searchWithCursor('query', 10, {
    cursor: page1.cursor
  })
}
```

### Advanced Pagination Features

```javascript
// Get total count estimate when available
const page = await brainy.searchWithCursor('query', 50)
if (page.totalEstimate) {
  console.log(`Showing 50 of ~${page.totalEstimate} results`)
}

// Cursor contains debug information
if (page.cursor) {
  console.log(`Cursor position: ${page.cursor.position}`)
  console.log(`Last result ID: ${page.cursor.lastId}`)
  console.log(`Last score: ${page.cursor.lastScore}`)
}
```

### Pagination Best Practices

1. **Use cursors for deep pagination** (page 10+)
2. **Use offset for UI with page numbers** (page 1-10)
3. **Cache cursor objects** for navigation
4. **Handle cursor expiration** gracefully

```javascript
// Robust cursor pagination with error handling
async function paginateResults(query, pageSize = 20) {
  const results = []
  let cursor = undefined
  let pageCount = 0
  
  do {
    try {
      const page = await brainy.searchWithCursor(query, pageSize, { cursor })
      
      results.push(...page.results)
      cursor = page.cursor
      pageCount++
      
      // Safety limit
      if (pageCount > 100) break
      
    } catch (error) {
      console.warn('Cursor may be expired, starting fresh')
      cursor = undefined
      break
    }
  } while (cursor)
  
  return results
}
```

## 🔧 Performance Tuning

### Cache Sizing

```javascript
// For high-traffic applications
const brainy = new BrainyData({
  searchCache: {
    maxSize: 500,      // Cache more queries
    maxAge: 600000,    // Keep cache longer (10 minutes)
  }
})

// For memory-constrained environments  
const brainy = new BrainyData({
  searchCache: {
    maxSize: 50,       // Smaller cache
    maxAge: 120000,    // Shorter TTL (2 minutes)
  }
})
```

### Cache Warming

```javascript
// Pre-warm cache with common queries
const commonQueries = [
  'machine learning',
  'artificial intelligence', 
  'data science',
  'neural networks'
]

// Warm up cache in background
for (const query of commonQueries) {
  brainy.search(query, 10).catch(console.warn)
}
```

### Performance Monitoring

```javascript
// Set up performance monitoring
setInterval(() => {
  const stats = brainy.getCacheStats()
  
  if (stats.search.hitRate < 0.3) {
    console.warn('Low cache hit rate:', stats.search.hitRate)
  }
  
  if (stats.searchMemoryUsage > 50 * 1024 * 1024) { // 50MB
    console.warn('High cache memory usage')
    brainy.clearCache() // Reset if getting too large
  }
}, 60000) // Check every minute
```

## 🎯 Migration Guide

### From Offset to Cursors

```javascript
// Before (offset-based)
async function getAllResults(query) {
  const results = []
  let offset = 0
  const pageSize = 100
  
  while (true) {
    const page = await brainy.search(query, pageSize, { offset })
    if (page.length === 0) break
    
    results.push(...page)
    offset += pageSize // Gets slower each iteration
  }
  
  return results
}

// After (cursor-based)
async function getAllResults(query) {
  const results = []
  let cursor = undefined
  const pageSize = 100
  
  while (true) {
    const page = await brainy.searchWithCursor(query, pageSize, { cursor })
    if (page.results.length === 0) break
    
    results.push(...page.results)
    cursor = page.cursor // Constant time each iteration
    
    if (!page.hasMore) break
  }
  
  return results
}
```

### Backward Compatibility

**All existing code continues to work unchanged:**

```javascript
// These still work exactly as before
const results = await brainy.search('query', 10)
const page2 = await brainy.search('query', 10, { offset: 10 })

// But now they benefit from caching automatically!
```

## 📊 Performance Benchmarks

### Cache Performance

| Scenario | Without Cache | With Cache | Improvement |
|----------|---------------|------------|-------------|
| Repeated identical queries | 50ms | <1ms | **50x faster** |
| Similar queries with filters | 45ms | <1ms | **45x faster** |
| Paginated results (cached) | 30ms | <1ms | **30x faster** |

### Pagination Performance

| Page Depth | Offset-Based | Cursor-Based | Improvement |
|------------|--------------|--------------|-------------|
| Page 1-10 | 10-50ms | 10-50ms | Same |
| Page 50 | 200ms | 50ms | **4x faster** |
| Page 100 | 500ms | 50ms | **10x faster** |
| Page 1000 | 5000ms | 50ms | **100x faster** |

These improvements compound in real applications where users frequently:
- Repeat searches
- Navigate deep into result sets  
- Use similar search terms
- Browse paginated data

The performance gains are most dramatic in read-heavy applications with repeated access patterns.

## 🌐 Distributed Storage Considerations

When multiple services write to shared storage (like S3), special considerations apply to maintain cache consistency.

### Problem: External Data Changes

```javascript
// Service A writes data
await serviceA.add("New important data")

// Service B searches (may get stale cached results!)
const results = await serviceB.search("important data", 10)
// Without proper configuration, Service B might miss the new data
```

### Solution: Real-Time Updates + Smart Caching

```javascript
// Configure both services for distributed mode
const sharedConfig = {
  storage: {
    s3Storage: { 
      bucketName: 'shared-data-bucket',
      // ... S3 credentials
    }
  },
  searchCache: {
    enabled: true,
    maxAge: 180000,    // 3 minutes (shorter for distributed)
    maxSize: 100
  },
  realtimeUpdates: {
    enabled: true,       // ⚠️ ESSENTIAL for shared storage
    interval: 30000,     // Check every 30 seconds
    updateIndex: true,   // Sync external changes to local index
    updateStatistics: true
  }
}

const serviceA = new BrainyData(sharedConfig)
const serviceB = new BrainyData(sharedConfig)
```

### How It Works

1. **Service A** adds data to shared S3 storage
2. **Service B** checks for changes every 30 seconds
3. **External changes detected** → cache invalidated → fresh results guaranteed
4. **Time-based expiration** provides additional safety net

### Performance Impact in Distributed Mode

| Scenario | Local Instance | Distributed Mode | Notes |
|----------|----------------|------------------|-------|
| Cache hits (no external changes) | <1ms | <1ms | Same performance |
| External changes detected | 50ms | 50ms + detection delay | Still very fast |
| Cache expiration | 50ms | 50ms | Automatic cleanup |
| Real-time update overhead | 0ms | ~5ms per check | Minimal impact |

### Best Practices for Distributed Caching

#### ✅ **Do This:**
```javascript
// Shorter cache TTL for distributed scenarios
searchCache: { maxAge: 180000 }  // 3 minutes vs 5 minutes

// Enable real-time updates
realtimeUpdates: { enabled: true, interval: 30000 }

// Monitor cache stats
setInterval(() => {
  const stats = brainy.getCacheStats()
  console.log(`Cache hit rate: ${stats.search.hitRate}`)
}, 60000)
```

#### ❌ **Avoid This:**
```javascript
// DON'T: Disable real-time updates with shared storage
realtimeUpdates: { enabled: false }  // ⚠️ Will cause stale data!

// DON'T: Very long cache TTL in distributed mode  
searchCache: { maxAge: 3600000 }  // 1 hour - too long!

// DON'T: Ignore external changes
const results = await brainy.search('query', 10, { skipCache: false })
// Without real-time updates, this might be stale
```

### Monitoring Distributed Cache Health

```javascript
// Set up monitoring for distributed scenarios
const brainy = new BrainyData({
  // ... distributed config
  logging: { verbose: true }  // See cache invalidation logs
})

// Monitor cache effectiveness
setInterval(() => {
  const stats = brainy.getCacheStats()
  
  // Warn if hit rate is too low (suggests frequent external changes)
  if (stats.search.hitRate < 0.2) {
    console.warn('Low cache hit rate in distributed mode:', stats.search.hitRate)
    console.warn('Consider increasing real-time update frequency')
  }
  
  // Warn if external changes are frequent
  const updateConfig = brainy.getRealtimeUpdateConfig()
  if (updateConfig.enabled) {
    console.log('Real-time updates active - external changes will be detected')
  }
}, 300000) // Check every 5 minutes
```

### Trade-offs and Tuning

**More Frequent Updates (every 10-15 seconds):**
- ✅ Faster detection of external changes
- ✅ More consistent data across services  
- ❌ Higher CPU/network overhead
- ❌ More frequent cache invalidations

**Less Frequent Updates (every 60+ seconds):**
- ✅ Lower overhead
- ✅ Better cache hit rates
- ❌ Slower detection of external changes
- ❌ Potential stale data windows

**Recommended Settings by Use Case:**

```javascript
// High-consistency requirements (financial, medical)
realtimeUpdates: { interval: 15000 }  // 15 seconds
searchCache: { maxAge: 120000 }       // 2 minutes

// Balanced (most applications)  
realtimeUpdates: { interval: 30000 }  // 30 seconds
searchCache: { maxAge: 300000 }       // 5 minutes

// Performance-first (analytics, logging)
realtimeUpdates: { interval: 60000 }  // 1 minute
searchCache: { maxAge: 600000 }       // 10 minutes
```