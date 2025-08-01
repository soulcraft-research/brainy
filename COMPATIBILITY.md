# Brainy Compatibility Across Environments

This document outlines Brainy's compatibility across different JavaScript environments and how it adapts to each environment.

## Environment Detection

Brainy automatically detects the environment it's running in:

```javascript
// Method to detect the current environment
function detectEnvironment() {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'BROWSER';
  } else if (typeof self !== 'undefined' && typeof window === 'undefined') {
    // In a worker environment, self is defined but window is not
    return 'WORKER';
  } else {
    return 'NODE';
  }
}
```

## Cache Size Detection

Brainy's cache manager adapts its cache size based on the detected environment:

### Node.js Environment

In Node.js, Brainy uses fixed default memory values to ensure compatibility with ES modules:

```javascript
// Use conservative defaults that don't require OS module
// These values are reasonable for most systems
const estimatedTotalMemory = 8 * 1024 * 1024 * 1024;  // Assume 8GB total
const estimatedFreeMemory = 4 * 1024 * 1024 * 1024;   // Assume 4GB free
```

This approach ensures compatibility with both CommonJS and ES modules without requiring dynamic imports or the `os` module.

### Browser Environment

In browsers, Brainy uses the `navigator.deviceMemory` API when available:

```javascript
if (environment === 'BROWSER' && navigator.deviceMemory) {
  // Base entries per GB
  let entriesPerGB = 500;
  
  // Adjust based on operating mode and dataset size
  if (isReadOnly) {
    entriesPerGB = 800; // More aggressive caching in read-only mode
    
    if (isLargeDataset) {
      entriesPerGB = 1000; // Even more aggressive for large datasets
    }
  } else if (isLargeDataset) {
    entriesPerGB = 600; // Slightly more aggressive for large datasets
  }
  
  // Calculate based on device memory
  const browserCacheSize = Math.max(navigator.deviceMemory * entriesPerGB, 1000);
  
  // If we know the total dataset size, cap at a reasonable percentage
  if (totalItems > 0) {
    // In read-only mode, we can cache a larger percentage
    const maxPercentage = isReadOnly ? 0.4 : 0.25;
    const maxItems = Math.ceil(totalItems * maxPercentage);
    
    // Return the smaller of the two to avoid excessive memory usage
    return Math.min(browserCacheSize, maxItems);
  }
  
  return browserCacheSize;
}
```

If `navigator.deviceMemory` is not available, it falls back to conservative defaults.

### Worker Environment

For Web Workers, Brainy uses a more conservative approach:

```javascript
if (environment === 'WORKER') {
  // Workers typically have limited memory, be conservative
  return isReadOnly ? 2000 : 1000;
}
```

## Storage Type Detection

Brainy also adapts its storage strategy based on the environment:

### Warm Storage

```javascript
// Method to detect the appropriate warm storage type
function detectWarmStorageType() {
  if (environment === 'BROWSER') {
    // Use OPFS if available, otherwise use memory
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      return 'OPFS';
    }
    return 'MEMORY';
  } else if (environment === 'WORKER') {
    // Use OPFS if available, otherwise use memory
    if ('storage' in self && 'getDirectory' in self.storage) {
      return 'OPFS';
    }
    return 'MEMORY';
  } else {
    // In Node.js, use filesystem
    return 'FILESYSTEM';
  }
}
```

### Cold Storage

```javascript
// Method to detect the appropriate cold storage type
function detectColdStorageType() {
  if (environment === 'BROWSER') {
    // Use OPFS if available, otherwise use memory
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      return 'OPFS';
    }
    return 'MEMORY';
  } else if (environment === 'WORKER') {
    // Use OPFS if available, otherwise use memory
    if ('storage' in self && 'getDirectory' in self.storage) {
      return 'OPFS';
    }
    return 'MEMORY';
  } else {
    // In Node.js, use S3 if configured, otherwise filesystem
    return 'S3';
  }
}
```

## Compatibility Summary

| Feature | Node.js | Browser | Web Worker |
|---------|---------|---------|------------|
| Environment Detection | ✅ | ✅ | ✅ |
| Cache Size Detection | ✅ (Fixed defaults) | ✅ (deviceMemory API) | ✅ (Conservative) |
| Warm Storage | Filesystem | OPFS/Memory | OPFS/Memory |
| Cold Storage | S3/Filesystem | OPFS/Memory | OPFS/Memory |
| ES Module Support | ✅ | ✅ | ✅ |

## Recommendations

1. **Node.js Applications**:
   - No special configuration needed
   - Works with both CommonJS and ES modules

2. **Browser Applications**:
   - For optimal performance, use in browsers that support the `navigator.deviceMemory` API
   - Falls back gracefully in older browsers

3. **Worker Applications**:
   - Works in both dedicated and shared workers
   - Uses conservative cache sizes to avoid memory issues

4. **Memory-Constrained Environments**:
   - Consider setting a smaller `hotCacheMaxSize` in the options
   - Example: `new BrainyData({ hotCacheMaxSize: 500 })`
