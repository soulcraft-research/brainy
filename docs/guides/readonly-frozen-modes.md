# Read-Only and Frozen Modes Guide

## Overview

Brainy provides two levels of immutability control for different use cases:

1. **`readOnly`** - Prevents data mutations while allowing performance optimizations
2. **`frozen`** - Completely freezes the database, preventing all changes

## Quick Start

```javascript
// Read-only mode (default behavior - allows optimizations)
const db = new BrainyData({
  readOnly: true  // frozen defaults to false
})

// Completely frozen database (no changes at all)
const db = new BrainyData({
  readOnly: true,
  frozen: true
})
```

## Understanding the Modes

### Read-Only Mode (`readOnly: true, frozen: false`)

This is the **default and recommended** configuration for read-only databases. It provides:

- ✅ **Data Protection**: No adds, updates, or deletes allowed
- ✅ **Performance Optimization**: Index rebalancing and cache updates continue
- ✅ **Live Monitoring**: Statistics and metrics stay current
- ✅ **Real-time Updates**: Can detect external changes if configured

**Use cases:**
- Production read replicas
- Public-facing search APIs
- Analytics dashboards
- Most read-only scenarios

```javascript
const db = new BrainyData({
  readOnly: true,
  // frozen: false (default)
  realtimeUpdates: {
    enabled: true,  // Still works!
    interval: 30000
  }
})

// Data mutations are blocked
await db.add(data)  // ❌ Throws error

// But optimizations continue
await db.getStatistics({ forceRefresh: true })  // ✅ Works
await db.flushStatistics()  // ✅ Works
// Index optimizations happen automatically  // ✅ Works
```

### Frozen Mode (`frozen: true`)

Complete immutability for special scenarios requiring absolutely no changes:

- ❌ **No Data Changes**: Same as readOnly
- ❌ **No Optimizations**: Index remains exactly as-is
- ❌ **No Statistics Updates**: Metrics are frozen
- ❌ **No Real-time Updates**: All monitoring stopped

**Use cases:**
- Forensic analysis
- Compliance/audit snapshots
- Deterministic testing
- Cryptographic verification

```javascript
const db = new BrainyData({
  readOnly: true,  // Usually set together
  frozen: true     // Complete immutability
})

// Everything is blocked or becomes a no-op
await db.add(data)  // ❌ Throws error
await db.flushStatistics()  // ⚠️ No-op (does nothing)
// No index changes  // ❌ Disabled
// No cache updates  // ❌ Disabled
```

## Dynamic Mode Changes

You can change modes at runtime:

```javascript
const db = new BrainyData()
await db.init()

// Switch to read-only (optimizations continue)
db.setReadOnly(true)
console.log(db.isReadOnly())  // true
console.log(db.isFrozen())    // false

// Freeze completely
db.setFrozen(true)
console.log(db.isFrozen())    // true

// Unfreeze (real-time updates restart if configured)
db.setFrozen(false)

// Allow writes again
db.setReadOnly(false)
```

## Configuration Examples

### Example 1: High-Performance Read Replica

```javascript
const readReplica = new BrainyData({
  readOnly: true,  // Prevent writes
  // frozen: false (default - allows optimizations)
  
  // Enable real-time sync with primary
  realtimeUpdates: {
    enabled: true,
    interval: 10000,
    updateStatistics: true,
    updateIndex: true
  },
  
  // Aggressive caching for performance
  cache: {
    autoTune: true,
    hotCacheMaxSize: 50000
  }
})
```

### Example 2: Compliance Snapshot

```javascript
const auditSnapshot = new BrainyData({
  readOnly: true,
  frozen: true,  // Complete immutability for compliance
  
  storage: {
    s3Storage: {
      bucketName: 'audit-snapshots',
      // ... S3 credentials
    }
  }
})

// This database will never change, perfect for:
// - Legal discovery
// - Compliance audits  
// - Historical analysis
```

### Example 3: Testing Environment

```javascript
describe('Search Tests', () => {
  let db
  
  beforeAll(async () => {
    db = new BrainyData({
      readOnly: true,
      frozen: true  // Deterministic state for tests
    })
    await db.init()
    // Load test data...
  })
  
  it('should return consistent results', async () => {
    // Tests run against unchanging data
    const results = await db.search('test query')
    expect(results).toHaveLength(3)
  })
})
```

## Migration Guide

If you're upgrading and using `readOnly`:

### Previous Behavior (< v0.49.0)
```javascript
// Old: readOnly prevented ALL changes
const db = new BrainyData({ readOnly: true })
// No optimizations, no statistics updates
```

### New Behavior (>= v0.49.0)
```javascript
// New default: readOnly allows optimizations
const db = new BrainyData({ readOnly: true })
// Optimizations and statistics continue!

// To get old behavior, add frozen:
const db = new BrainyData({ 
  readOnly: true,
  frozen: true  // Matches old behavior
})
```

## Best Practices

1. **Default to `readOnly` without `frozen`** for most read-only use cases
2. **Only use `frozen: true`** when you specifically need complete immutability
3. **Consider performance impact** - frozen mode disables beneficial optimizations
4. **Use dynamic switching** for temporary freezing during sensitive operations

## API Reference

### Configuration Options

```typescript
interface BrainyDataConfig {
  // Prevent data mutations (adds, updates, deletes)
  readOnly?: boolean
  
  // Completely freeze database (no changes at all)
  // Default: false (allows optimizations in readOnly mode)
  frozen?: boolean
  
  // Other options...
}
```

### Methods

```typescript
// Check current state
db.isReadOnly(): boolean
db.isFrozen(): boolean

// Change state dynamically
db.setReadOnly(readOnly: boolean): void
db.setFrozen(frozen: boolean): void
```

### Behavior Matrix

| Operation | Normal | ReadOnly | Frozen |
|-----------|--------|----------|---------|
| Add/Update/Delete | ✅ | ❌ | ❌ |
| Search/Get | ✅ | ✅ | ✅ |
| Statistics Refresh | ✅ | ✅ | ❌ |
| Index Optimization | ✅ | ✅ | ❌ |
| Real-time Updates | ✅ | ✅ | ❌ |
| Cache Updates | ✅ | ✅ | ❌ |

## See Also

- [Cache Configuration Guide](./cache-configuration.md)
- [Production Migration Guide](./production-migration-guide.md)
- [Real-time Updates Documentation](../technical/REALTIME_UPDATES.md)