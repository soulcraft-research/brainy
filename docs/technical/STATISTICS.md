# Brainy Statistics System

<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
</div>

This document provides a comprehensive overview of the statistics system in Brainy, including its implementation, scalability considerations, and recent improvements.

## Table of Contents

- [Overview](#overview)
- [What is Tracked](#what-is-tracked)
- [How Statistics Are Collected](#how-statistics-are-collected)
- [Retrieving Statistics](#retrieving-statistics)
- [Implementation Details](#implementation-details)
- [Scalability Improvements](#scalability-improvements)
- [Statistics Flush Solution](#statistics-flush-solution)
- [Best Practices](#best-practices)
- [Use Cases](#use-cases)
- [Consistency of Statistics Tracking](#consistency-of-statistics-tracking)

## Overview

Brainy includes a built-in statistics system that tracks various metrics about your data as it's added to the database. The statistics are stored persistently and updated in real-time, providing an efficient way to monitor the state of your database without having to recalculate metrics on each request.

Key features of the statistics system:

- **Persistent Tracking**: Statistics are stored persistently and updated as data is added or removed
- **Service-Based Tracking**: Data is tracked by the service that inserted it
- **Filtering Capabilities**: Statistics can be filtered by service
- **Comprehensive Metrics**: Tracks nouns, verbs, metadata, and HNSW index size

## What is Tracked

The statistics system tracks the following metrics:

1. **Noun Count**: The number of nouns (vector data points) in the database, tracked by service
2. **Verb Count**: The number of verbs (relationships between nouns) in the database, tracked by service
3. **Metadata Count**: The number of metadata entries in the database, tracked by service
4. **HNSW Index Size**: The total size of the HNSW index used for vector search

## How Statistics Are Collected

Statistics are collected automatically as data is added to or removed from the database:

- When a noun is added using `add()`, the noun count for the specified service is incremented
- When a verb is added using `addVerb()` or `relate()`, the verb count for the specified service is incremented
- When metadata is added along with a noun, the metadata count for the specified service is incremented
- The HNSW index size is updated whenever nouns are added or removed

Each operation includes a `service` parameter that identifies which service is adding the data. If not specified, the service defaults to "default".

```typescript
// Adding data with a specific service
await brainyDb.add(vector, metadata, {service: "my-service"});

// Adding a verb with a specific service
await brainyDb.addVerb(sourceId, targetId, vector, {
    type: "related_to",
    service: "my-service"
});
```

## Retrieving Statistics

You can retrieve statistics using the `getStatistics()` method on a BrainyData instance:

```typescript
// Get all statistics
const stats = await brainyDb.getStatistics();
console.log(stats);
```

The result will include counts for all metrics and a breakdown by service:

```javascript
{
    nounCount: 150,
    verbCount: 75,
    metadataCount: 150,
    hnswIndexSize: 150,
    serviceBreakdown: {
        "default": {
            nounCount: 100,
            verbCount: 50,
            metadataCount: 100
        },
        "my-service": {
            nounCount: 50,
            verbCount: 25,
            metadataCount: 50
        }
    }
}
```

### Filtering by Service

You can filter statistics by service using the `service` option:

```typescript
// Get statistics for a specific service
const serviceStats = await brainyDb.getStatistics({
    service: "my-service"
});
console.log(serviceStats);
```

You can also filter by multiple services:

```typescript
// Get statistics for multiple services
const multiServiceStats = await brainyDb.getStatistics({
    service: ["service1", "service2"]
});
console.log(multiServiceStats);
```

## Implementation Details

The statistics system is implemented using the following components:

1. **StatisticsData Interface**: Defines the structure of statistics data
2. **BaseStorageAdapter**: Provides common functionality for statistics tracking
3. **Storage Adapters**: Implement persistence for statistics data
4. **BrainyData.getStatistics**: Provides the API for retrieving statistics

### Storage Adapter Implementation

All storage adapters must implement the following statistics-related methods:

1. `saveStatistics(statistics: StatisticsData): Promise<void>`
2. `getStatistics(): Promise<StatisticsData | null>`
3. `incrementStatistic(type: 'noun' | 'verb' | 'metadata', service: string, amount?: number): Promise<void>`
4. `decrementStatistic(type: 'noun' | 'verb' | 'metadata', service: string, amount?: number): Promise<void>`
5. `updateHnswIndexSize(size: number): Promise<void>`

The `BaseStorageAdapter` class provides implementations for these methods, but relies on two abstract methods that must be implemented by subclasses:

1. `protected abstract saveStatisticsData(statistics: StatisticsData): Promise<void>`
2. `protected abstract getStatisticsData(): Promise<StatisticsData | null>`

## Scalability Improvements

To address scalability issues with millions of database entries, the following improvements have been implemented across all storage adapters:

1. **Local Caching**: Statistics are cached in memory to reduce storage API calls
2. **Batched Updates**: Updates are batched and flushed periodically to reduce API calls
3. **Time-based Partitioning**: Statistics are stored in daily files to avoid rate limits on a single object
4. **Adaptive Flush Timing**: The system adjusts the flush frequency based on recent activity
5. **Optimistic Concurrency Control**: Prevents race conditions when multiple processes update statistics
6. **Periodic Aggregation**: For high-volume scenarios, statistics are periodically recalculated from scratch
7. **Distributed Locking**: For multi-instance deployments, distributed locking prevents concurrent updates

### Time-based Partitioning Implementation

Statistics are now stored in daily files with keys following the pattern:
`statistics_YYYYMMDD.json` (e.g., `statistics_20250724.json` or for S3 storage: `brainy/index/statistics_20250724.json`). This approach offers several benefits:

1. **Avoids Rate Limiting**: By distributing writes across different objects, we avoid hitting rate limits
2. **Historical Data**: Maintains a historical record of statistics by day
3. **Reduced Contention**: Multiple processes can update statistics without conflicting
4. **Backward Compatibility**: The system still checks the legacy location for older data

### Batched Updates Implementation

Statistics updates are now batched and flushed to storage periodically:

1. **In-memory Accumulation**: Changes are accumulated in memory
2. **Timed Flushes**: Data is flushed to storage on a schedule (5-30 seconds)
3. **Adaptive Timing**: Flush frequency adjusts based on recent activity
4. **Error Resilience**: Failed flushes are retried automatically
5. **Legacy Updates**: The legacy statistics file is updated less frequently (10% of flushes)

### Implementation Across Storage Adapters

These optimizations are now implemented in all storage adapters:

1. **BaseStorageAdapter**: Provides the core implementation of caching and batched updates
2. **S3CompatibleStorage**: Implements time-based partitioning and fallback mechanisms for cloud storage
3. **FileSystemStorage**: Implements time-based partitioning and fallback mechanisms for file system storage
4. **OPFSStorage**: Implements time-based partitioning and fallback mechanisms for browser's Origin Private File System
5. **MemoryStorage**: Leverages the caching and batching optimizations from BaseStorageAdapter

## Statistics Flush Solution

When inserting lots of data into Brainy, the statistics might not immediately reflect changes due to the batch update mechanism. This section explains the solution to ensure statistics are properly flushed.

### Issue Description

The Brainy database uses a batch update mechanism for statistics to optimize performance. When data is inserted, statistics are updated in memory and a batch update is scheduled to flush the statistics to storage. However, this batch update might be delayed by up to 30 seconds (as defined by `MAX_FLUSH_DELAY_MS` in `baseStorageAdapter.ts`).

If the user checks statistics shortly after inserting data, or if the database is shut down before the batch update occurs, the statistics might not reflect the recent changes.

### Solution

The solution is to provide a way to force an immediate flush of statistics to storage, and to ensure that statistics are flushed before the database is shut down. The following changes were made:

1. Added a new method `flushStatisticsToStorage()` to the `StorageAdapter` interface in `coreTypes.ts`:
   ```typescript
   /**
    * Force an immediate flush of statistics to storage
    * This ensures that any pending statistics updates are written to persistent storage
    */
   flushStatisticsToStorage(): Promise<void>
   ```

2. Implemented this method in the `BaseStorageAdapter` class in `baseStorageAdapter.ts`:
   ```typescript
   /**
    * Force an immediate flush of statistics to storage
    * This ensures that any pending statistics updates are written to persistent storage
    */
   async flushStatisticsToStorage(): Promise<void> {
     // If there are no statistics in cache or they haven't been modified, nothing to flush
     if (!this.statisticsCache || !this.statisticsModified) {
       return
     }

     // Call the protected flushStatistics method to immediately write to storage
     await this.flushStatistics()
   }
   ```

3. Added a public method `flushStatistics()` to the `BrainyData` class in `brainyData.ts`:
   ```typescript
   /**
    * Force an immediate flush of statistics to storage
    * This ensures that any pending statistics updates are written to persistent storage
    * @returns Promise that resolves when the statistics have been flushed
    */
   public async flushStatistics(): Promise<void> {
     await this.ensureInitialized()

     if (!this.storage) {
       throw new Error('Storage not initialized')
     }

     // Call the flushStatisticsToStorage method on the storage adapter
     await this.storage.flushStatisticsToStorage()
   }
   ```

4. Modified the `shutDown()` method in `BrainyData` to flush statistics before shutting down:
   ```typescript
   /**
    * Shut down the database and clean up resources
    * This should be called when the database is no longer needed
    */
   public async shutDown(): Promise<void> {
     try {
       // Flush statistics to ensure they're saved before shutting down
       if (this.storage && this.isInitialized) {
         try {
           await this.flushStatistics()
         } catch (statsError) {
           console.warn('Failed to flush statistics during shutdown:', statsError)
           // Continue with shutdown even if statistics flush fails
         }
       }

       // Rest of the shutdown process...
     } catch (error) {
       console.error('Failed to shut down BrainyData:', error)
       throw new Error(`Failed to shut down BrainyData: ${error}`)
     }
   }
   ```

### Usage

To ensure statistics are up-to-date after inserting data, you can now call the `flushStatistics()` method on the `BrainyData` instance:

```typescript
// Insert data
await brainyDb.add(vectorOrData, metadata)

// Force a flush of statistics to ensure they're up-to-date
await brainyDb.flushStatistics()

// Get statistics
const stats = await brainyDb.getStatistics()
```

Statistics will also be automatically flushed when the database is shut down, ensuring that no statistics updates are lost.

## Best Practices

1. **Always Specify a Service**: When adding data, always specify a service name to properly track where data is coming from
2. **Use Meaningful Service Names**: Choose service names that clearly identify the source of the data
3. **Monitor Growth**: Regularly check statistics to monitor database growth and identify potential issues
4. **Filter When Needed**: Use service filtering to focus on specific parts of your data
5. **Consider Scalability**: For high-volume scenarios, implement the scalability improvements described above
6. **Flush When Needed**: Call `flushStatistics()` after batch operations to ensure statistics are up-to-date

## Use Cases

### Monitoring Database Growth

You can use statistics to monitor how your database grows over time:

```typescript
// Track database growth
async function monitorGrowth() {
    const initialStats = await brainyDb.getStatistics();
    console.log("Initial size:", initialStats.nounCount);

    // Check again after some time
    setTimeout(async () => {
        const currentStats = await brainyDb.getStatistics();
        console.log("Current size:", currentStats.nounCount);
        console.log("Growth:", currentStats.nounCount - initialStats.nounCount);
    }, 3600000); // Check after an hour
}
```

### Analyzing Service Usage

You can analyze which services are adding the most data:

```typescript
// Analyze service usage
async function analyzeServiceUsage() {
    const stats = await brainyDb.getStatistics();

    // Sort services by noun count
    const servicesByUsage = Object.entries(stats.serviceBreakdown)
        .sort((a, b) => b[1].nounCount - a[1].nounCount);

    console.log("Services by usage:");
    servicesByUsage.forEach(([service, counts]) => {
        console.log(`${service}: ${counts.nounCount} nouns, ${counts.verbCount} verbs`);
    });
}
```

### Cleaning Up Service Data

You can use statistics to identify services whose data you might want to clean up:

```typescript
// Identify services with minimal data
async function identifyInactiveServices() {
    const stats = await brainyDb.getStatistics();

    const inactiveServices = Object.entries(stats.serviceBreakdown)
        .filter(([_, counts]) => counts.nounCount < 10);

    console.log("Inactive services:", inactiveServices.map(([service]) => service));
}
```

## Consistency of Statistics Tracking

The statistics system consistently tracks:

1. **Total counts**: Overall counts of nouns, verbs, metadata, and index size
2. **Per-service breakdown**: All counts are tracked by the service that inserted the data
3. **Real-time updates**: Statistics are updated in real-time as data is added or removed
4. **Persistent storage**: Statistics are stored persistently and survive database restarts

## Conclusion

The statistics system in Brainy provides valuable insights into your data and how it's being used. By tracking metrics by service, you can better understand how your application is using Brainy and make informed decisions about data management. The system is designed to be efficient and scalable, with minimal overhead for tracking statistics as data is added or removed.
