# Brainy Cache Configuration Guide

This guide explains how to configure and optimize Brainy's cache system for different environments and use cases.

## Cache System Overview

Brainy uses a multi-level cache system to optimize performance:

1. **Hot Cache**: In-memory cache for frequently accessed items
2. **Warm Cache**: Secondary cache with longer retention but slower access
3. **Cold Storage**: Persistent storage for all data

## New Features

### Dynamic Memory Detection

Brainy now includes a sophisticated memory detection mechanism that works across all JavaScript environments:

- **Node.js**: Uses dynamic import of the `os` module to get actual system memory
- **Browser**: Uses `performance.memory` or `navigator.deviceMemory` APIs
- **Worker**: Uses available memory APIs or conservative defaults

```javascript
// The cache will automatically detect available memory
const brainy = new BrainyData();
```

### Environment-Specific Configuration

You can now specify different cache configurations for each environment:

```javascript
const brainy = new BrainyData({
  cacheOptions: {
    environmentConfig: {
      // Node.js specific settings
      node: {
        hotCacheMaxSize: 10000,
        hotCacheEvictionThreshold: 0.85,
        warmCacheTTL: 48 * 60 * 60 * 1000, // 48 hours
        batchSize: 50
      },
      // Browser specific settings
      browser: {
        hotCacheMaxSize: 5000,
        hotCacheEvictionThreshold: 0.8,
        warmCacheTTL: 24 * 60 * 60 * 1000, // 24 hours
        batchSize: 20
      },
      // Worker specific settings
      worker: {
        hotCacheMaxSize: 3000,
        hotCacheEvictionThreshold: 0.75,
        warmCacheTTL: 12 * 60 * 60 * 1000, // 12 hours
        batchSize: 15
      }
    }
  }
});
```

### Adaptive Cache Tuning

The cache system now includes improved adaptive tuning that automatically adjusts based on:

1. Available memory in the current environment
2. Cache hit/miss ratios
3. Access patterns (read-heavy vs. write-heavy)
4. Dataset size and characteristics
5. Storage type (S3, filesystem, memory)

The adaptive tuning system will:

- Increase cache sizes for read-only workloads
- Optimize batch sizes based on network conditions
- Adjust eviction thresholds based on memory pressure
- Tune warm cache TTL based on update frequency

```javascript
// Enable auto-tuning (on by default)
const brainy = new BrainyData({
  cacheOptions: {
    autoTune: true
  }
});

// Disable auto-tuning if needed
const brainy = new BrainyData({
  cacheOptions: {
    autoTune: false
  }
});
```

## Best Practices

### For Large Datasets

When working with large datasets (>100K items):

```javascript
const brainy = new BrainyData({
  cacheOptions: {
    // For Node.js environments with large datasets
    environmentConfig: {
      node: {
        hotCacheMaxSize: 50000,
        batchSize: 100
      }
    }
  }
});
```

### For Memory-Constrained Environments

For environments with limited memory:

```javascript
const brainy = new BrainyData({
  cacheOptions: {
    // Conservative settings for memory-constrained environments
    hotCacheMaxSize: 1000,
    hotCacheEvictionThreshold: 0.7, // Evict earlier
    warmCacheTTL: 6 * 60 * 60 * 1000, // 6 hours
    batchSize: 5
  }
});
```

### For Read-Only Applications

For read-only applications where data doesn't change:

```javascript
const brainy = new BrainyData({
  readOnly: true,
  cacheOptions: {
    // More aggressive caching for read-only data
    hotCacheEvictionThreshold: 0.9,
    warmCacheTTL: 72 * 60 * 60 * 1000 // 72 hours
  }
});
```

## Advanced Configuration

### Manual Cache Size Calculation

If you want to manually calculate the optimal cache size:

```javascript
// Get memory information
async function getMemoryInfo() {
  if (typeof window === 'undefined') {
    // Node.js
    const os = await import('os');
    return {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
  } else if (navigator.deviceMemory) {
    // Browser with deviceMemory API
    const totalMemory = navigator.deviceMemory * 1024 * 1024 * 1024;
    return {
      totalMemory,
      freeMemory: totalMemory * 0.5 // Estimate
    };
  }
  // Default fallback
  return {
    totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
    freeMemory: 4 * 1024 * 1024 * 1024   // 4GB
  };
}

// Calculate optimal cache size
async function calculateOptimalCacheSize() {
  const memoryInfo = await getMemoryInfo();
  const BYTES_PER_ENTRY = 1024; // Estimate 1KB per entry
  const memoryPercentage = 0.1; // Use 10% of free memory
  
  return Math.max(
    Math.floor(memoryInfo.freeMemory * memoryPercentage / BYTES_PER_ENTRY),
    1000 // Minimum size
  );
}

// Use the calculated size
async function initializeBrainy() {
  const optimalSize = await calculateOptimalCacheSize();
  
  const brainy = new BrainyData({
    cacheOptions: {
      hotCacheMaxSize: optimalSize
    }
  });
  
  return brainy;
}
```

## Monitoring Cache Performance

You can monitor cache performance to fine-tune your settings:

```javascript
// Get cache statistics
const stats = brainy.getCacheStats();

console.log('Cache Statistics:', {
  hotCacheSize: stats.hotCacheSize,
  hotCacheHits: stats.hotCacheHits,
  hotCacheMisses: stats.hotCacheMisses,
  warmCacheSize: stats.warmCacheSize,
  warmCacheHits: stats.warmCacheHits,
  warmCacheMisses: stats.warmCacheMisses
});

// Calculate hit ratios
const hotHitRatio = stats.hotCacheHits / (stats.hotCacheHits + stats.hotCacheMisses || 1);
const warmHitRatio = stats.warmCacheHits / (stats.warmCacheHits + stats.warmCacheMisses || 1);

console.log('Hit Ratios:', {
  hotHitRatio: hotHitRatio.toFixed(2),
  warmHitRatio: warmHitRatio.toFixed(2)
});
```

## Conclusion

Brainy's enhanced cache system now provides better performance across all JavaScript environments with minimal configuration. The adaptive tuning system will automatically optimize cache parameters based on your specific workload and environment.

For most applications, the default settings with auto-tuning enabled will provide excellent performance. For specialized use cases, use the environment-specific configuration options to fine-tune the cache behavior.
