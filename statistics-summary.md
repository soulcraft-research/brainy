# Brainy Statistics System Summary

## How Statistics Are Updated and Stored

### What Statistics Are Tracked

Brainy tracks the following statistics:

1. **Noun Count**: Number of vector data points, tracked by service
2. **Verb Count**: Number of relationships between nouns, tracked by service
3. **Metadata Count**: Number of metadata entries, tracked by service
4. **HNSW Index Size**: Total size of the HNSW index used for vector search

### How Statistics Are Updated

Statistics are updated automatically as data is added or removed:

- When a noun is added using `add()`, the noun count for the specified service is incremented
- When a verb is added using `addVerb()` or `relate()`, the verb count is incremented
- When metadata is added, the metadata count is incremented
- The HNSW index size is updated whenever nouns are added or removed

Each operation includes a `service` parameter that identifies which service is adding the data.

### Storage Implementation

Statistics are stored persistently with several optimizations:

1. **Local Caching**: Statistics are cached in memory to reduce storage API calls
2. **Batched Updates**: Updates are batched and flushed periodically (5-30 seconds)
3. **Time-based Partitioning**: Statistics are stored in daily files (e.g., `statistics_20250724.json`)
4. **Adaptive Flush Timing**: The system adjusts the flush frequency based on recent activity

## How Statistics Can Be Used by Consumers

### Direct API Access

Consumers can access statistics through the BrainyData API:

```typescript
// Using the instance method
const stats = await db.getStatistics()

// Filter by service
const serviceStats = await db.getStatistics({
    service: "my-service"
})
```

The returned statistics object includes counts and service breakdown:

```javascript
{
    "nounCount": 150,
    "verbCount": 75,
    "metadataCount": 150,
    "hnswIndexSize": 150,
    "serviceBreakdown": {
        "default": {
            "nounCount": 100,
            "verbCount": 50,
            "metadataCount": 100
        },
        "my-service": {
            "nounCount": 50,
            "verbCount": 25,
            "metadataCount": 50
        }
    }
}
```

### Web Service Access

The web service provides a `/api/status` endpoint, but it only returns basic information about storage usage and capacity, not the detailed statistics tracked by the system. To access the full statistics through the web service, consumers would need to implement their own endpoint that calls `getStatistics()`.

### Use Cases for Consumers

1. **Monitoring Database Growth**: Track how the database grows over time
2. **Analyzing Service Usage**: Identify which services are adding the most data
3. **Cleaning Up Service Data**: Identify services with minimal data
4. **Performance Monitoring**: Track the size of the HNSW index

## Consistency of Statistics Tracking

The statistics system consistently tracks:

1. **Total counts**: Overall counts of nouns, verbs, metadata, and index size
2. **Per-service breakdown**: All counts are tracked by the service that inserted the data
3. **Real-time updates**: Statistics are updated in real-time as data is added or removed
4. **Persistent storage**: Statistics are stored persistently and survive database restarts