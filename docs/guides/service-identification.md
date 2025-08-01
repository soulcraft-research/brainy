# Service Identification Guide

## Overview

This guide explains how services should identify themselves when adding, updating, or deleting data in Brainy. Proper service identification is important for:

1. **Statistics tracking**: Brainy tracks statistics by service, allowing you to see how much data each service has contributed.
2. **JSON field discovery**: Brainy tracks field names in JSON documents by service, allowing you to discover what fields are available from different services.

## How to Identify Your Service

### Option 1: Specify a Default Service During Initialization

The simplest approach is to specify a default service name when initializing Brainy:

```javascript
// Initialize Brainy with a default service name
const brainyData = new BrainyData({
  defaultService: 'my-service-name'
});

// All operations will automatically use the default service name
await brainyData.add(data, metadata);
await brainyData.updateMetadata(id, newMetadata);
await brainyData.delete(id);
```

This approach ensures that all operations use the same service name without having to specify it for each operation.

### Option 2: Specify Service Name for Each Operation

Alternatively, you can specify the service name for each operation:

```javascript
// Adding data with service identification
const id = await brainyData.add(data, metadata, { 
  service: 'my-service-name' 
});

// Updating metadata with service identification
await brainyData.updateMetadata(id, newMetadata, {
  service: 'my-service-name'
});

// Deleting data with service identification
await brainyData.delete(id, {
  service: 'my-service-name'
});
```

This approach gives you more flexibility if you need to use different service names for different operations.

## Service Name Conventions

Service names should be:

- Lowercase
- Hyphen-separated (e.g., `github-api`, `bluesky-feed`)
- Descriptive of the data source or service
- Consistent across all operations from the same service

Common service names used in Brainy include:

- `github`
- `bluesky`
- `reddit`
- `twitter`
- `google`
- `default` (used when no service is specified)

## How Service Identification Works

Internally, Brainy uses the `getServiceName` helper method to determine the service name:

1. If a `service` parameter is provided in the options object, that value is used.
2. If no `service` parameter is provided, Brainy uses the default service name specified during initialization.
3. If no default service was specified, `'default'` is used.

## Benefits of Proper Service Identification

### Statistics Tracking

With proper service identification, you can see statistics broken down by service:

```javascript
const stats = await brainyData.getStatistics();
console.log('Noun count by service:');
console.log(stats.nounCount);
console.log('Metadata count by service:');
console.log(stats.metadataCount);
```

Example output:
```
Noun count by service:
{
  "github": 1250,
  "bluesky": 843,
  "reddit": 567,
  "default": 122
}
```

### Field Name Discovery

You can discover what fields are available from different services:

```javascript
const fieldNames = await brainyData.getAvailableFieldNames();
console.log(fieldNames);
```

Example output:
```
{
  "github": ["repository.name", "repository.description", "user.login", "issue.title", ...],
  "bluesky": ["post.text", "user.handle", "user.displayName", ...],
  "reddit": ["title", "selftext", "author.name", "subreddit.name", ...]
}
```

### Standard Field Mappings

You can use standard field mappings to search consistently across different services:

```javascript
// Get standard field mappings
const standardFieldMappings = await brainyData.getStandardFieldMappings();
console.log(standardFieldMappings);

// Search using standard fields
const results = await brainyData.searchByStandardField("title", "climate change", 10);
```

## Best Practices

1. **Specify a default service name during initialization** for simplicity and consistency.
2. **Override the default service name** only when necessary for specific operations.
3. **Use consistent service names** across all operations from the same service.
4. **Use descriptive service names** that identify the data source.
5. **Document the field names** used by your service to help users understand what fields are available for searching.

## Implementation Details

Service identification is implemented through:

1. The `getServiceName` helper method in `BrainyData` class
2. The `trackFieldNames` method in `StorageAdapter` interface
3. The `incrementStatistic` and `decrementStatistic` methods in `StorageAdapter` interface

These methods ensure that statistics and field names are properly tracked by service.
