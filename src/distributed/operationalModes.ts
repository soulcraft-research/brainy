/**
 * Operational Modes for Distributed Brainy
 * Defines different modes with optimized caching strategies
 */

import { 
  OperationalMode, 
  CacheStrategy,
  InstanceRole 
} from '../types/distributedTypes.js'

/**
 * Base operational mode
 */
export abstract class BaseOperationalMode implements OperationalMode {
  abstract canRead: boolean
  abstract canWrite: boolean
  abstract canDelete: boolean
  abstract cacheStrategy: CacheStrategy
  
  /**
   * Validate operation is allowed in this mode
   */
  validateOperation(operation: 'read' | 'write' | 'delete'): void {
    switch (operation) {
      case 'read':
        if (!this.canRead) {
          throw new Error('Read operations are not allowed in write-only mode')
        }
        break
      case 'write':
        if (!this.canWrite) {
          throw new Error('Write operations are not allowed in read-only mode')
        }
        break
      case 'delete':
        if (!this.canDelete) {
          throw new Error('Delete operations are not allowed in this mode')
        }
        break
    }
  }
}

/**
 * Read-only mode optimized for query performance
 */
export class ReaderMode extends BaseOperationalMode {
  canRead = true
  canWrite = false
  canDelete = false
  
  cacheStrategy: CacheStrategy = {
    hotCacheRatio: 0.8,           // 80% of memory for read cache
    prefetchAggressive: true,      // Aggressively prefetch related vectors
    ttl: 3600000,                 // 1 hour cache TTL
    compressionEnabled: true,      // Trade CPU for more cache capacity
    writeBufferSize: 0,           // No write buffer needed
    batchWrites: false,           // No writes
    adaptive: true                // Adapt to query patterns
  }
  
  /**
   * Get optimized cache configuration for readers
   */
  getCacheConfig() {
    return {
      hotCacheMaxSize: 1000000,      // Large hot cache
      hotCacheEvictionThreshold: 0.9, // Keep cache full
      warmCacheTTL: 3600000,         // 1 hour warm cache
      batchSize: 100,                // Large batch reads
      autoTune: true,                // Auto-tune for read patterns
      autoTuneInterval: 60000,       // Tune every minute
      readOnly: true                 // Enable read-only optimizations
    }
  }
}

/**
 * Write-only mode optimized for ingestion
 */
export class WriterMode extends BaseOperationalMode {
  canRead = false
  canWrite = true
  canDelete = true
  
  cacheStrategy: CacheStrategy = {
    hotCacheRatio: 0.2,           // Only 20% for cache, rest for write buffer
    prefetchAggressive: false,     // No prefetching needed
    ttl: 60000,                   // Short TTL (1 minute)
    compressionEnabled: false,     // Speed over memory efficiency
    writeBufferSize: 10000,       // Large write buffer for batching
    batchWrites: true,            // Enable write batching
    adaptive: false               // Fixed strategy for consistent writes
  }
  
  /**
   * Get optimized cache configuration for writers
   */
  getCacheConfig() {
    return {
      hotCacheMaxSize: 100000,        // Small hot cache
      hotCacheEvictionThreshold: 0.5, // Aggressive eviction
      warmCacheTTL: 60000,           // 1 minute warm cache
      batchSize: 1000,               // Large batch writes
      autoTune: false,               // Fixed configuration
      writeOnly: true                // Enable write-only optimizations
    }
  }
}

/**
 * Hybrid mode that can both read and write
 */
export class HybridMode extends BaseOperationalMode {
  canRead = true
  canWrite = true
  canDelete = true
  
  cacheStrategy: CacheStrategy = {
    hotCacheRatio: 0.5,           // Balanced cache/buffer allocation
    prefetchAggressive: false,     // Moderate prefetching
    ttl: 600000,                  // 10 minute TTL
    compressionEnabled: true,      // Compress when beneficial
    writeBufferSize: 5000,        // Moderate write buffer
    batchWrites: true,            // Batch writes when possible
    adaptive: true                // Adapt to workload mix
  }
  
  private readWriteRatio: number = 0.5 // Track read/write ratio
  
  /**
   * Get balanced cache configuration
   */
  getCacheConfig() {
    return {
      hotCacheMaxSize: 500000,        // Medium cache size
      hotCacheEvictionThreshold: 0.7, // Balanced eviction
      warmCacheTTL: 600000,          // 10 minute warm cache
      batchSize: 500,                // Medium batch size
      autoTune: true,                // Auto-tune based on workload
      autoTuneInterval: 300000       // Tune every 5 minutes
    }
  }
  
  /**
   * Update cache strategy based on workload
   * @param readCount - Number of recent reads
   * @param writeCount - Number of recent writes
   */
  updateWorkloadBalance(readCount: number, writeCount: number): void {
    const total = readCount + writeCount
    if (total === 0) return
    
    this.readWriteRatio = readCount / total
    
    // Adjust cache strategy based on workload
    if (this.readWriteRatio > 0.8) {
      // Read-heavy workload
      this.cacheStrategy.hotCacheRatio = 0.7
      this.cacheStrategy.prefetchAggressive = true
      this.cacheStrategy.writeBufferSize = 2000
    } else if (this.readWriteRatio < 0.2) {
      // Write-heavy workload
      this.cacheStrategy.hotCacheRatio = 0.3
      this.cacheStrategy.prefetchAggressive = false
      this.cacheStrategy.writeBufferSize = 8000
    } else {
      // Balanced workload
      this.cacheStrategy.hotCacheRatio = 0.5
      this.cacheStrategy.prefetchAggressive = false
      this.cacheStrategy.writeBufferSize = 5000
    }
  }
}

/**
 * Factory for creating operational modes
 */
export class OperationalModeFactory {
  /**
   * Create operational mode based on role
   * @param role - The instance role
   * @returns The appropriate operational mode
   */
  static createMode(role: InstanceRole): BaseOperationalMode {
    switch (role) {
      case 'reader':
        return new ReaderMode()
      case 'writer':
        return new WriterMode()
      case 'hybrid':
        return new HybridMode()
      default:
        // Default to reader for safety
        return new ReaderMode()
    }
  }
  
  /**
   * Create mode with custom cache strategy
   * @param role - The instance role
   * @param customStrategy - Custom cache strategy overrides
   * @returns The operational mode with custom strategy
   */
  static createModeWithStrategy(
    role: InstanceRole,
    customStrategy: Partial<CacheStrategy>
  ): BaseOperationalMode {
    const mode = this.createMode(role)
    
    // Apply custom strategy overrides
    mode.cacheStrategy = {
      ...mode.cacheStrategy,
      ...customStrategy
    }
    
    return mode
  }
}