# Per-Service Statistics and Tracking Guide

Brainy provides comprehensive per-service statistics tracking, allowing you to monitor and analyze data from different services sharing the same storage backend.

## Table of Contents
- [Overview](#overview)
- [Configuration](#configuration)
- [Service Tracking](#service-tracking)
- [Statistics Methods](#statistics-methods)
- [Service Filtering](#service-filtering)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)

## Overview

When multiple services (e.g., `bluesky-package`, `github-package`, `scout-search`) share the same Brainy storage, per-service statistics help you:

- **Track individual service performance** - Monitor how many nouns/verbs each service has stored
- **Debug service-specific issues** - Isolate problems to specific services
- **Monitor service health** - Track last activity timestamps and error counts
- **Audit data sources** - Know which service created which data
- **Analyze usage patterns** - Understand how different services use the database

## Configuration

### Setting a Default Service

When creating a Brainy instance, specify a default service name:

```typescript
const brainy = new BrainyData({
  defaultService: 'github-package',
  storage: {
    // Storage configuration
  }
})
```

### Specifying Service Per Operation

You can override the default service for individual operations:

```typescript
// Add data with explicit service
await brainy.add(
  { content: 'repository data' },
  { noun: 'Repository' },
  { service: 'github-service' }
)

// Create relationship with service tracking
await brainy.relate(
  sourceId,
  targetId,
  { verb: 'stars' },
  { service: 'github-service' }
)
```

## Service Tracking

### Automatic Tracking

Brainy automatically tracks for each service:
- Total nouns created
- Total verbs created
- Total metadata entries
- First activity timestamp
- Last activity timestamp
- Operation counts (adds, updates, deletes)
- Error counts

### Service Activity States

Services can have three states:
- **`active`** - Had activity within the last hour
- **`inactive`** - No recent activity
- **`read-only`** - Only performs read operations (no writes)

## Statistics Methods

### List All Services

Get a list of all services that have written data:

```typescript
const services = await brainy.listServices()

// Returns:
[
  {
    name: 'bluesky-package',
    totalNouns: 12450,
    totalVerbs: 34820,
    totalMetadata: 12450,
    firstActivity: '2024-01-01T00:00:00Z',
    lastActivity: '2024-01-06T16:30:00Z',
    status: 'active',
    operations: {
      adds: 12450,
      updates: 230,
      deletes: 0
    }
  },
  {
    name: 'github-package',
    totalNouns: 45230,
    totalVerbs: 89420,
    totalMetadata: 45230,
    lastActivity: '2024-01-06T16:25:00Z',
    status: 'active'
  }
]
```

### Get Service-Specific Statistics

Get detailed statistics for a single service:

```typescript
const stats = await brainy.getServiceStatistics('github-package')

// Returns:
{
  name: 'github-package',
  totalNouns: 45230,
  totalVerbs: 89420,
  totalMetadata: 45230,
  firstActivity: '2024-01-01T00:00:00Z',
  lastActivity: '2024-01-06T16:25:00Z',
  status: 'active',
  operations: {
    adds: 45230,
    updates: 1250,
    deletes: 50
  },
  errorCount: 5
}
```

### Filter Global Statistics by Service

Filter the global statistics to specific services:

```typescript
// Single service
const stats = await brainy.getStatistics({ 
  service: 'bluesky-package' 
})

// Multiple services
const stats = await brainy.getStatistics({ 
  service: ['bluesky-package', 'github-package'] 
})

// Returns statistics with serviceBreakdown:
{
  nounCount: 57680,
  verbCount: 124240,
  metadataCount: 57680,
  serviceBreakdown: {
    'bluesky-package': {
      nounCount: 12450,
      verbCount: 34820,
      metadataCount: 12450
    },
    'github-package': {
      nounCount: 45230,
      verbCount: 89420,
      metadataCount: 45230
    }
  }
}
```

## Service Filtering

### Filter Search Results

Filter search results to only include data from specific services:

```typescript
const results = await brainy.search('javascript', 10, {
  service: 'github-package'
})
```

### Filter Noun Queries

Get nouns only from specific services:

```typescript
const nouns = await brainy.getNouns({
  filter: {
    service: 'bluesky-package',
    nounType: 'Post'
  }
})
```

### Filter Verb Queries

Get verbs only from specific services:

```typescript
const verbs = await brainy.getVerbs({
  filter: {
    service: 'social-service',
    verbType: 'follows'
  }
})
```

## Use Cases

### Multi-Tenant Applications

When multiple applications share the same Brainy storage:

```typescript
// Application A
const brainyA = new BrainyData({
  defaultService: 'app-a',
  storage: sharedStorage
})

// Application B
const brainyB = new BrainyData({
  defaultService: 'app-b',
  storage: sharedStorage
})

// Monitor usage per application
const services = await brainyA.listServices()
for (const service of services) {
  console.log(`${service.name}: ${service.totalNouns} nouns`)
}
```

### Service Health Monitoring

Monitor the health and activity of different services:

```typescript
async function monitorServiceHealth() {
  const services = await brainy.listServices()
  
  for (const service of services) {
    if (service.status === 'inactive') {
      console.warn(`Service ${service.name} is inactive`)
    }
    
    if (service.errorCount && service.errorCount > 100) {
      console.error(`Service ${service.name} has high error count: ${service.errorCount}`)
    }
    
    // Check for stale services
    if (service.lastActivity) {
      const lastActivity = new Date(service.lastActivity)
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceActivity > 7) {
        console.warn(`Service ${service.name} hasn't been active for ${daysSinceActivity} days`)
      }
    }
  }
}
```

### Data Source Auditing

Track which service created specific data:

```typescript
// Add data with service tracking
const docId = await brainy.add(
  { 
    content: 'Important document',
    timestamp: new Date().toISOString()
  },
  { 
    noun: 'Document',
    createdBy: { augmentation: 'audit-service' }
  },
  { service: 'audit-service' }
)

// Later, verify the source
const stats = await brainy.getServiceStatistics('audit-service')
console.log(`Audit service created ${stats.totalNouns} documents`)
```

### Performance Analysis

Analyze ingestion rates and patterns per service:

```typescript
async function analyzePerformance() {
  const services = await brainy.listServices()
  
  for (const service of services) {
    if (!service.firstActivity || !service.lastActivity) continue
    
    const start = new Date(service.firstActivity)
    const end = new Date(service.lastActivity)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    
    const nounsPerHour = service.totalNouns / durationHours
    const verbsPerHour = service.totalVerbs / durationHours
    
    console.log(`${service.name} performance:`)
    console.log(`  Nouns/hour: ${nounsPerHour.toFixed(2)}`)
    console.log(`  Verbs/hour: ${verbsPerHour.toFixed(2)}`)
  }
}
```

## API Reference

### Configuration Options

```typescript
interface BrainyDataConfig {
  /**
   * Default service name for all operations
   */
  defaultService?: string
  
  // Other configuration options...
}
```

### Operation Options

```typescript
interface OperationOptions {
  /**
   * Override the default service for this operation
   */
  service?: string
  
  // Other operation options...
}
```

### Service Statistics Type

```typescript
interface ServiceStatistics {
  /**
   * Service name
   */
  name: string
  
  /**
   * Total number of nouns created by this service
   */
  totalNouns: number
  
  /**
   * Total number of verbs created by this service
   */
  totalVerbs: number
  
  /**
   * Total number of metadata entries
   */
  totalMetadata: number
  
  /**
   * First activity timestamp
   */
  firstActivity?: string
  
  /**
   * Last activity timestamp
   */
  lastActivity?: string
  
  /**
   * Error count for this service
   */
  errorCount?: number
  
  /**
   * Operation breakdown
   */
  operations?: {
    adds: number
    updates: number
    deletes: number
  }
  
  /**
   * Service status
   */
  status?: 'active' | 'inactive' | 'read-only'
}
```

## Best Practices

1. **Always specify a defaultService** when creating Brainy instances to ensure proper tracking
2. **Use consistent service names** across your application
3. **Monitor service health regularly** using `listServices()`
4. **Use service filtering** when debugging service-specific issues
5. **Track error counts** to identify problematic services
6. **Archive inactive services** periodically to maintain performance

## Migration Guide

If you have existing data without service tracking:

```typescript
// Set a default service for untracked data
const stats = await brainy.getStatistics()

// All existing data will be under the 'default' service
console.log(stats.serviceBreakdown['default'])

// Going forward, specify explicit services
const brainy = new BrainyData({
  defaultService: 'my-app-v2',
  // ...
})
```

## Limitations

- Service tracking is done at the statistics level, not embedded in each noun/verb
- Service filtering in search operations depends on metadata structure
- Historical service activity may not be available for data created before enabling tracking
- Service names should be kept reasonably short for performance

## Examples

### Complete Example: Multi-Service Dashboard

```typescript
import { BrainyData } from '@soulcraft/brainy'

async function createServiceDashboard() {
  const brainy = new BrainyData({
    defaultService: 'dashboard',
    storage: {
      // Your storage configuration
    }
  })
  
  await brainy.init()
  
  // Get all services
  const services = await brainy.listServices()
  
  // Sort by most active
  services.sort((a, b) => {
    const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
    const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
    return bTime - aTime
  })
  
  // Display dashboard
  console.log('=== Service Dashboard ===')
  console.log(`Total Services: ${services.length}`)
  console.log('')
  
  for (const service of services) {
    console.log(`Service: ${service.name}`)
    console.log(`  Status: ${service.status}`)
    console.log(`  Nouns: ${service.totalNouns}`)
    console.log(`  Verbs: ${service.totalVerbs}`)
    
    if (service.lastActivity) {
      const lastActivity = new Date(service.lastActivity)
      console.log(`  Last Active: ${lastActivity.toLocaleString()}`)
    }
    
    if (service.operations) {
      console.log(`  Operations:`)
      console.log(`    Adds: ${service.operations.adds}`)
      console.log(`    Updates: ${service.operations.updates}`)
      console.log(`    Deletes: ${service.operations.deletes}`)
    }
    
    console.log('')
  }
  
  // Get aggregate statistics
  const totalStats = await brainy.getStatistics()
  console.log('=== Total Statistics ===')
  console.log(`Total Nouns: ${totalStats.nounCount}`)
  console.log(`Total Verbs: ${totalStats.verbCount}`)
  console.log(`Total Metadata: ${totalStats.metadataCount}`)
}

createServiceDashboard().catch(console.error)
```

This comprehensive per-service statistics feature enables better observability, debugging, and management of multi-service Brainy deployments.