/**
 * Distributed types for Brainy
 * Defines types for distributed operations across multiple instances
 */

export type InstanceRole = 'reader' | 'writer' | 'hybrid'

export type PartitionStrategy = 'hash' | 'semantic' | 'manual'

export interface DistributedConfig {
  /**
   * Enable distributed mode
   * Can be boolean for auto-detection or specific configuration
   */
  enabled?: boolean | 'auto'
  
  /**
   * Role of this instance in the distributed system
   * - reader: Read-only access, optimized for queries
   * - writer: Write-focused, handles data ingestion
   * - hybrid: Can both read and write (requires coordination)
   */
  role?: InstanceRole
  
  /**
   * Unique identifier for this instance
   * Auto-generated if not provided
   */
  instanceId?: string
  
  /**
   * Path to shared configuration file in S3
   * Default: '_brainy/config.json'
   */
  configPath?: string
  
  /**
   * Heartbeat interval in milliseconds
   * Default: 30000 (30 seconds)
   */
  heartbeatInterval?: number
  
  /**
   * Config check interval in milliseconds
   * Default: 10000 (10 seconds)
   */
  configCheckInterval?: number
  
  /**
   * Instance timeout in milliseconds
   * Instances not seen for this duration are considered dead
   * Default: 60000 (60 seconds)
   */
  instanceTimeout?: number
}

export interface SharedConfig {
  /**
   * Configuration version for compatibility checking
   */
  version: number
  
  /**
   * Last update timestamp
   */
  updated: string
  
  /**
   * Global settings that must be consistent across all instances
   */
  settings: {
    /**
     * Partitioning strategy
     * - hash: Deterministic hash-based partitioning (recommended for multi-writer)
     * - semantic: Group similar vectors (single writer only)
     * - manual: Explicit partition assignment
     */
    partitionStrategy: PartitionStrategy
    
    /**
     * Number of partitions (for hash strategy)
     */
    partitionCount: number
    
    /**
     * Embedding model name (must be consistent)
     */
    embeddingModel: string
    
    /**
     * Vector dimensions
     */
    dimensions: number
    
    /**
     * Distance metric
     */
    distanceMetric: 'cosine' | 'euclidean' | 'manhattan'
    
    /**
     * HNSW parameters (must be consistent for index compatibility)
     */
    hnswParams?: {
      M: number
      efConstruction: number
      maxElements?: number
    }
  }
  
  /**
   * Active instances in the distributed system
   */
  instances: {
    [instanceId: string]: InstanceInfo
  }
  
  /**
   * Partition assignments (for manual strategy)
   */
  partitionAssignments?: {
    [instanceId: string]: string[]
  }
}

export interface InstanceInfo {
  /**
   * Instance role
   */
  role: InstanceRole
  
  /**
   * Instance status
   */
  status: 'active' | 'inactive' | 'unhealthy'
  
  /**
   * Last heartbeat timestamp
   */
  lastHeartbeat: string
  
  /**
   * Optional endpoint for health checks
   */
  endpoint?: string
  
  /**
   * Instance metrics
   */
  metrics?: {
    vectorCount?: number
    cacheHitRate?: number
    memoryUsage?: number
    cpuUsage?: number
  }
  
  /**
   * Assigned partitions (for manual assignment)
   */
  assignedPartitions?: string[]
  
  /**
   * Preferred partitions (for affinity)
   */
  preferredPartitions?: number[]
}

export interface DomainMetadata {
  /**
   * Domain identifier for logical data separation
   */
  domain?: string
  
  /**
   * Additional domain-specific metadata
   */
  domainMetadata?: Record<string, any>
}

export interface CacheStrategy {
  /**
   * Percentage of memory allocated to hot cache (0-1)
   */
  hotCacheRatio: number
  
  /**
   * Enable aggressive prefetching
   */
  prefetchAggressive?: boolean
  
  /**
   * Cache time-to-live in milliseconds
   */
  ttl?: number
  
  /**
   * Enable compression to trade CPU for memory
   */
  compressionEnabled?: boolean
  
  /**
   * Write buffer size for batching
   */
  writeBufferSize?: number
  
  /**
   * Enable write batching
   */
  batchWrites?: boolean
  
  /**
   * Adaptive caching based on workload
   */
  adaptive?: boolean
}

export interface OperationalMode {
  /**
   * Whether this mode can read
   */
  canRead: boolean
  
  /**
   * Whether this mode can write
   */
  canWrite: boolean
  
  /**
   * Whether this mode can delete
   */
  canDelete: boolean
  
  /**
   * Cache strategy for this mode
   */
  cacheStrategy: CacheStrategy
}