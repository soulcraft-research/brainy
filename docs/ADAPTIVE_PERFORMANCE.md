# Adaptive Performance System

Brainy v0.53.1+ includes an automatic adaptive performance system that eliminates socket exhaustion and optimizes throughput without any configuration.

## Zero Configuration Required

The adaptive performance system works automatically - no settings or tuning needed. Just use Brainy normally and it will optimize itself based on your workload.

## How It Works

### 1. Adaptive Socket Management

The system automatically adjusts socket pools based on load:

- **Starts conservative**: 100 sockets initially
- **Scales up under load**: Up to 2000 sockets when needed
- **Scales down when idle**: Conserves resources automatically
- **Smart keep-alive**: Adjusts connection reuse based on patterns

### 2. Intelligent Backpressure

Prevents system overload with self-healing capabilities:

- **Request flow control**: Queues requests when system is busy
- **Priority handling**: Important operations get processed first
- **Circuit breaker**: Automatically recovers from overload conditions
- **Predictive scaling**: Anticipates load changes based on patterns

### 3. Performance Monitoring

Real-time metrics and optimization:

- **Health scoring**: 0-100 score of system health
- **Trend analysis**: Detects degrading performance
- **Auto-optimization**: Adjusts configuration automatically
- **Smart recommendations**: Suggests improvements when needed

## Benefits

### For High-Volume Scenarios

- **No more socket exhaustion**: Automatically scales sockets as needed
- **Better throughput**: Batch sizes optimize dynamically
- **Automatic recovery**: Self-heals from error conditions
- **Resource efficiency**: Uses only what's needed

### For Variable Workloads

- **Adapts to patterns**: Learns your usage over time
- **Handles spikes**: Scales up quickly for burst traffic
- **Efficient at rest**: Scales down to save resources
- **No manual tuning**: Adjusts itself automatically

## Usage Example

```typescript
import { BrainyData } from '@soulcraft/brainy'

// Just create and use - no special configuration needed
const brainy = new BrainyData({
  storage: {
    type: 's3',
    s3Storage: {
      bucketName: 'my-bucket',
      region: 'us-east-1',
      accessKeyId: 'xxx',
      secretAccessKey: 'yyy'
    }
    // No socket or performance configuration needed!
  }
})

// Use normally - system adapts automatically
await brainy.addBatch(largeDataset)  // Handles any volume
```

## Monitoring Performance (Optional)

While not required, you can monitor the adaptive system:

```typescript
import { getGlobalPerformanceMonitor } from '@soulcraft/brainy'

const monitor = getGlobalPerformanceMonitor()

// Get current metrics
const report = monitor.getReport()
console.log('Health Score:', report.metrics.healthScore)
console.log('Operations/sec:', report.metrics.operationsPerSecond)
console.log('Current Socket Config:', report.socketConfig)

// Get optimization recommendations
if (report.recommendations.length > 0) {
  console.log('Suggestions:', report.recommendations)
}
```

## How It Helps Your Application

### Before (v0.53.0 and earlier)
- Fixed socket limits (500)
- Manual batch size configuration
- Socket exhaustion under high load
- Manual recovery required
- Required tuning for different workloads

### After (v0.53.1+)
- Dynamic socket scaling (100-2000)
- Automatic batch optimization
- Self-preventing socket exhaustion
- Automatic error recovery
- Zero configuration needed

## Technical Details

### Socket Scaling Algorithm

The system uses multiple signals to determine optimal socket count:
- Current request rate
- Pending request queue depth
- Error rate trends
- Memory pressure
- Latency percentiles (P50, P95, P99)

### Backpressure Management

Implements Little's Law for optimal concurrency:
```
L = λ × W
where:
  L = number of requests in system
  λ = arrival rate
  W = average time in system
```

### Circuit Breaker States

- **Closed**: Normal operation
- **Open**: Rejecting requests to recover
- **Half-Open**: Testing if system recovered

### Performance Metrics Tracked

- Total operations and success rate
- Latency percentiles (average, P95, P99)
- Throughput (ops/sec, bytes/sec)
- Resource usage (memory, CPU, sockets)
- Queue depth and utilization

## Troubleshooting

### System reports "overloaded"

This is the circuit breaker protecting your system. It will automatically recover in 30 seconds. To avoid:
- Reduce request rate temporarily
- The system will adapt and handle more load over time

### Performance degrading over time

The system will detect this and adapt. You can check recommendations:
```typescript
const report = monitor.getReport()
console.log(report.recommendations)
```

### Want to disable auto-optimization

While not recommended, you can disable it:
```typescript
const monitor = getGlobalPerformanceMonitor()
monitor.setAutoOptimize(false)
```

## Migration Guide

### From v0.52.x or earlier

No changes required! The adaptive system is automatically active and requires no configuration.

### From v0.53.0

Update to v0.53.1+ to get automatic performance optimization.

## Best Practices

1. **Let it adapt**: Give the system time to learn your patterns
2. **Monitor initially**: Check health score during first few runs
3. **Trust the system**: Avoid manual tuning unless necessary
4. **Report issues**: If you see consistent problems, please report them

## Performance Benchmarks

Tested with real-world workloads:

| Scenario | v0.53.0 | v0.53.1 | Improvement |
|----------|---------|---------|-------------|
| 10K operations burst | Socket exhaustion at 5K | Completed successfully | ✅ No exhaustion |
| Sustained high load | 500 ops/sec max | 2000+ ops/sec | 4x throughput |
| Error recovery | Manual intervention | Automatic recovery | ✅ Self-healing |
| Memory efficiency | Fixed allocation | Dynamic scaling | 50% less at idle |

## Further Reading

- [Socket Management Details](./SOCKET_MANAGEMENT.md)
- [Backpressure Algorithm](./BACKPRESSURE.md)
- [Performance Tuning Guide](./PERFORMANCE.md)