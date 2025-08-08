# Throttling Metrics and Detection

## Overview

Brainy v0.58+ includes comprehensive throttling detection and metrics collection to help monitor and optimize storage operations, especially when using cloud storage backends like S3, R2, or Google Cloud Storage.

## Key Features

### 🚀 Zero Performance Impact
- **No additional network calls** - All metrics tracked in-memory
- **< 0.01ms overhead** per operation
- **< 2KB memory usage** for all tracking structures
- **No socket exhaustion** - Actually prevents it through intelligent backoff

### 📊 Comprehensive Metrics

The throttling metrics system tracks:

1. **Storage-level throttling**
   - Current throttling status
   - Consecutive throttle events
   - Exponential backoff timing (1s → 30s)
   - Total throttle events
   - Hourly distribution
   - Throttle reasons (429, 503, timeout, etc.)

2. **Operation impact**
   - Delayed operations count
   - Retried operations count
   - Failed operations due to throttling
   - Average and total delay time

3. **Service-level breakdown**
   - Per-service throttle counts
   - Last throttle time per service
   - Service status (normal/throttled/recovering)

## How It Works

### Automatic Detection

The system automatically detects throttling conditions:

```typescript
// Detected conditions:
- HTTP 429 (Too Many Requests)
- HTTP 503 (Service Unavailable)
- Connection resets (ECONNRESET)
- Timeouts (ETIMEDOUT)
- Rate limit messages
- Quota exceeded errors
- S3-specific: SlowDown, RequestLimitExceeded
```

### Intelligent Backoff

When throttling is detected, the system implements exponential backoff:

```typescript
// Backoff progression
Initial: 1 second
After 1st throttle: 2 seconds
After 2nd throttle: 4 seconds
After 3rd throttle: 8 seconds
...
Maximum: 30 seconds
```

### Recovery Tracking

The system tracks recovery from throttling:
- Services transition through states: `normal` → `throttled` → `recovering` → `normal`
- Recovery period: 60 seconds after last throttle event
- Automatic backoff reset after successful operations

## Accessing Throttling Metrics

### Via getStatistics()

```typescript
const stats = await db.getStatistics()

// Access throttling metrics
if (stats.throttlingMetrics) {
  const { storage, operationImpact, serviceThrottling } = stats.throttlingMetrics
  
  // Check current status
  if (storage.currentlyThrottled) {
    console.log(`⚠️ Storage is currently throttled`)
    console.log(`Backoff: ${storage.currentBackoffMs}ms`)
    console.log(`Consecutive events: ${storage.consecutiveThrottleEvents}`)
  }
  
  // Check impact
  console.log(`Delayed operations: ${operationImpact.delayedOperations}`)
  console.log(`Average delay: ${operationImpact.averageDelayMs}ms`)
  
  // Check services
  for (const [service, info] of Object.entries(serviceThrottling || {})) {
    if (info.status === 'throttled') {
      console.log(`Service ${service} is throttled (${info.throttleCount} events)`)
    }
  }
}
```

### Real-time Monitoring

```typescript
// Monitor throttling in real-time
setInterval(async () => {
  const stats = await db.getStatistics({ forceRefresh: true })
  
  if (stats.throttlingMetrics?.storage?.currentlyThrottled) {
    // Alert or log throttling condition
    console.warn('Storage throttling detected!')
  }
}, 30000) // Check every 30 seconds
```

## Use Cases

### 1. For AI/LLM Applications

AIs can use throttling metrics to:
- Detect when operations are slow due to rate limiting
- Provide user feedback about delays
- Suggest optimization strategies

```typescript
const stats = await db.getStatistics()
if (stats.throttlingMetrics?.storage?.currentlyThrottled) {
  return "I'm experiencing some delays due to rate limiting. Operations may be slower than usual."
}
```

### 2. For CLI Tools

Display throttling status in command output:

```bash
$ brainy stats
...
Throttling Status:
  Currently Throttled: Yes
  Backoff Time: 4s
  Total Events: 23
  Failed Operations: 2
```

### 3. For Monitoring & Alerting

```typescript
// Set up alerting
const stats = await db.getStatistics()
const metrics = stats.throttlingMetrics

if (metrics?.storage?.totalThrottleEvents > 100) {
  await sendAlert({
    level: 'warning',
    message: 'High throttling rate detected',
    details: {
      events: metrics.storage.totalThrottleEvents,
      reasons: metrics.storage.throttleReasons
    }
  })
}
```

### 4. For Performance Optimization

Analyze throttling patterns to optimize batch sizes and timing:

```typescript
const stats = await db.getStatistics()
const hourlyEvents = stats.throttlingMetrics?.storage?.throttleEventsByHour

// Find peak throttling hours
const peakHour = hourlyEvents?.indexOf(Math.max(...hourlyEvents))
console.log(`Peak throttling at hour ${peakHour}`)

// Adjust batch sizes based on throttling
const batchSize = stats.throttlingMetrics?.storage?.currentlyThrottled 
  ? 10  // Smaller batches when throttled
  : 100 // Normal batch size
```

## Storage Adapter Support

### Full Support
- **S3CompatibleStorage** - Complete throttling detection for AWS S3, Cloudflare R2, Google Cloud Storage
- **BaseStorageAdapter** - All adapters inherit basic throttling detection

### Basic Support
- **MemoryStorage** - Tracks system-level errors
- **FileSystemStorage** - Tracks I/O errors and system limits
- **OPFSStorage** - Tracks browser storage quota errors

## Configuration

Throttling detection is automatic and requires no configuration. However, you can customize behavior:

```typescript
// Custom storage adapter with modified throttling detection
class MyStorageAdapter extends BaseStorageAdapter {
  // Override to detect custom throttling conditions
  protected isThrottlingError(error: any): boolean {
    // Check base conditions
    if (super.isThrottlingError(error)) {
      return true
    }
    
    // Add custom detection
    return error.code === 'MY_CUSTOM_THROTTLE_CODE'
  }
  
  // Customize backoff behavior
  protected maxBackoffMs = 60000 // Increase max backoff to 60s
}
```

## Performance Benefits

### Prevents Socket Exhaustion

Without throttling detection:
```typescript
// ❌ Can exhaust sockets
for (let i = 0; i < 1000; i++) {
  try {
    await storage.get(key)
  } catch (error) {
    // Immediate retry worsens the problem
    await storage.get(key)
  }
}
```

With throttling detection:
```typescript
// ✅ Intelligent backoff prevents exhaustion
for (let i = 0; i < 1000; i++) {
  try {
    await storage.get(key)
  } catch (error) {
    // Automatic backoff (1s, 2s, 4s, etc.)
    await handleThrottling(error)
    await storage.get(key)
  }
}
```

### Reduces API Costs

- Fewer failed requests = lower API costs
- Intelligent retries = optimal resource usage
- Service-level tracking = identify expensive operations

## Best Practices

1. **Monitor regularly** - Check throttling metrics periodically
2. **Adjust batch sizes** - Reduce batch sizes when throttling is detected
3. **Time operations** - Avoid peak throttling hours when possible
4. **Set alerts** - Alert on high throttle counts or extended throttling
5. **Review patterns** - Analyze throttle reasons to optimize access patterns

## Migration Guide

### From v0.57 to v0.58+

No code changes required! Throttling metrics are automatically available:

```typescript
// Existing code continues to work
const stats = await db.getStatistics()

// New throttling metrics are now included
console.log(stats.throttlingMetrics) // New in v0.58+
```

## Troubleshooting

### Metrics not appearing?

1. Ensure you're using v0.58.0 or later
2. Call `getStatistics({ forceRefresh: true })` to ensure fresh data
3. Throttling metrics only appear after throttling events occur

### High throttle counts?

1. Review `throttleReasons` to understand causes
2. Check `throttleEventsByHour` for patterns
3. Consider implementing request batching or caching
4. Review service-level breakdown to identify problematic services

## API Reference

### StatisticsData.throttlingMetrics

```typescript
interface ThrottlingMetrics {
  storage?: {
    currentlyThrottled: boolean
    lastThrottleTime?: string
    consecutiveThrottleEvents: number
    currentBackoffMs: number
    totalThrottleEvents: number
    throttleEventsByHour?: number[]
    throttleReasons?: Record<string, number>
  }
  
  operationImpact?: {
    delayedOperations: number
    retriedOperations: number
    failedDueToThrottling: number
    averageDelayMs: number
    totalDelayMs: number
  }
  
  serviceThrottling?: Record<string, {
    throttleCount: number
    lastThrottle: string
    status: 'normal' | 'throttled' | 'recovering'
  }>
}
```

## Related Documentation

- [Statistics System](./STATISTICS.md) - Overall statistics architecture
- [Storage Adapters](../STORAGE_MIGRATION_GUIDE.md) - Storage adapter details
- [Performance Optimization](../optimization-guides/s3-migration-guide.md) - S3 optimization tips