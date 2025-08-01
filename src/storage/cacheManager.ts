/**
 * Multi-level Cache Manager
 * 
 * Implements a three-level caching strategy:
 * - Level 1: Hot cache (most accessed nodes) - RAM (automatically detecting and adjusting in each environment)
 * - Level 2: Warm cache (recent nodes) - OPFS, Filesystem or S3 depending on environment
 * - Level 3: Cold storage (all nodes) - OPFS, Filesystem or S3 depending on environment
 */

import { HNSWNoun, GraphVerb } from '../coreTypes.js'
import { BrainyError } from '../errors/brainyError.js'

// Extend Navigator interface to include deviceMemory property
// and WorkerGlobalScope to include storage property
declare global {
  interface Navigator {
    deviceMemory?: number;
  }
  
  interface WorkerGlobalScope {
    storage?: {
      getDirectory?: () => Promise<any>;
      [key: string]: any;
    };
  }
}

// Type aliases for better readability
type HNSWNode = HNSWNoun
type Edge = GraphVerb

// Cache entry with metadata for LRU and TTL management
interface CacheEntry<T> {
  data: T
  lastAccessed: number
  accessCount: number
  expiresAt: number | null
}

// Cache statistics for monitoring and tuning
interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  maxSize: number
}

// Environment detection for storage selection
enum Environment {
  BROWSER,
  NODE,
  WORKER
}

// Storage type for warm and cold caches
enum StorageType {
  MEMORY,
  OPFS,
  FILESYSTEM,
  S3
}

/**
 * Multi-level cache manager for efficient data access
 */
export class CacheManager<T extends HNSWNode | Edge> {
  // Hot cache (RAM)
  private hotCache = new Map<string, CacheEntry<T>>()
  
  // Cache statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    maxSize: 0
  }
  
  // Environment and storage configuration
  private environment: Environment
  private warmStorageType: StorageType
  private coldStorageType: StorageType
  
  // Cache configuration
  private hotCacheMaxSize: number
  private hotCacheEvictionThreshold: number
  private warmCacheTTL: number
  private batchSize: number
  
  // Auto-tuning configuration
  private autoTune: boolean
  private lastAutoTuneTime: number = 0
  private autoTuneInterval: number = 5 * 60 * 1000 // 5 minutes
  private storageStatistics: any = null
  
  // Storage adapters for warm and cold caches
  private warmStorage: any
  private coldStorage: any
  
  /**
   * Initialize the cache manager
   * @param options Configuration options
   */
  constructor(options: {
    hotCacheMaxSize?: number
    hotCacheEvictionThreshold?: number
    warmCacheTTL?: number
    batchSize?: number
    autoTune?: boolean
    warmStorage?: any
    coldStorage?: any
  } = {}) {
    // Detect environment
    this.environment = this.detectEnvironment()
    
    // Set storage types based on environment
    this.warmStorageType = this.detectWarmStorageType()
    this.coldStorageType = this.detectColdStorageType()
    
    // Initialize storage adapters
    this.warmStorage = options.warmStorage || this.initializeWarmStorage()
    this.coldStorage = options.coldStorage || this.initializeColdStorage()
    
    // Set auto-tuning flag
    this.autoTune = options.autoTune !== undefined ? options.autoTune : true
    
    // Set default values or use provided values
    this.hotCacheMaxSize = options.hotCacheMaxSize || this.detectOptimalCacheSize()
    this.hotCacheEvictionThreshold = options.hotCacheEvictionThreshold || 0.8
    this.warmCacheTTL = options.warmCacheTTL || 24 * 60 * 60 * 1000 // 24 hours
    this.batchSize = options.batchSize || 10
    
    // If auto-tuning is enabled, perform initial tuning
    if (this.autoTune) {
      this.tuneParameters()
    }
    
    // Log configuration
    if (process.env.DEBUG) {
      console.log('Cache Manager initialized with configuration:', {
        environment: Environment[this.environment],
        hotCacheMaxSize: this.hotCacheMaxSize,
        hotCacheEvictionThreshold: this.hotCacheEvictionThreshold,
        warmCacheTTL: this.warmCacheTTL,
        batchSize: this.batchSize,
        autoTune: this.autoTune,
        warmStorageType: StorageType[this.warmStorageType],
        coldStorageType: StorageType[this.coldStorageType]
      })
    }
  }
  
  /**
   * Detect the current environment
   */
  private detectEnvironment(): Environment {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return Environment.BROWSER
    } else if (typeof self !== 'undefined' && typeof window === 'undefined') {
      // In a worker environment, self is defined but window is not
      return Environment.WORKER
    } else {
      return Environment.NODE
    }
  }
  
  /**
   * Detect the optimal cache size based on available memory
   */
  private detectOptimalCacheSize(): number {
    try {
      // Default to a conservative value
      const defaultSize = 1000
      
      // In Node.js, use available system memory
      if (this.environment === Environment.NODE) {
        try {
          // Use dynamic import to avoid ESLint warning
          const getOS = () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('os')
          }
          const os = getOS()
          const freeMemory = os.freemem()
          
          // Estimate average entry size (in bytes)
          // This is a conservative estimate for complex objects with vectors
          const ESTIMATED_BYTES_PER_ENTRY = 1024 // 1KB per entry
          
          // Use 10% of free memory, with a minimum of 1000 entries
          const optimalSize = Math.max(
            Math.floor(freeMemory * 0.1 / ESTIMATED_BYTES_PER_ENTRY),
            1000
          )
          
          return optimalSize
        } catch (error) {
          console.warn('Failed to detect optimal cache size:', error)
          return defaultSize
        }
      }
      
      // In browser, use navigator.deviceMemory if available
      if (this.environment === Environment.BROWSER && navigator.deviceMemory) {
        // deviceMemory is in GB, scale accordingly
        return Math.max(navigator.deviceMemory * 500, 1000)
      }
      
      return defaultSize
    } catch (error) {
      console.warn('Error detecting optimal cache size:', error)
      return 1000 // Conservative default
    }
  }
  
  /**
   * Tune cache parameters based on statistics and environment
   * This method is called periodically if auto-tuning is enabled
   * 
   * The auto-tuning process:
   * 1. Retrieves storage statistics if available
   * 2. Tunes each parameter based on statistics and environment
   * 3. Logs the tuned parameters if debug is enabled
   * 
   * Auto-tuning helps optimize cache performance by adapting to:
   * - The current environment (Node.js, browser, worker)
   * - Available system resources (memory, CPU)
   * - Usage patterns (read-heavy vs. write-heavy workloads)
   * - Cache efficiency (hit/miss ratios)
   */
  private async tuneParameters(): Promise<void> {
    // Skip if auto-tuning is disabled
    if (!this.autoTune) return
    
    // Check if it's time to tune parameters
    const now = Date.now()
    if (now - this.lastAutoTuneTime < this.autoTuneInterval) return
    
    // Update last tune time
    this.lastAutoTuneTime = now
    
    try {
      // Get storage statistics if available
      if (this.coldStorage && typeof this.coldStorage.getStatistics === 'function') {
        this.storageStatistics = await this.coldStorage.getStatistics()
      }
      
      // Tune hot cache size
      this.tuneHotCacheSize()
      
      // Tune eviction threshold
      this.tuneEvictionThreshold()
      
      // Tune warm cache TTL
      this.tuneWarmCacheTTL()
      
      // Tune batch size
      this.tuneBatchSize()
      
      // Log tuned parameters if debug is enabled
      if (process.env.DEBUG) {
        console.log('Cache parameters auto-tuned:', {
          hotCacheMaxSize: this.hotCacheMaxSize,
          hotCacheEvictionThreshold: this.hotCacheEvictionThreshold,
          warmCacheTTL: this.warmCacheTTL,
          batchSize: this.batchSize
        })
      }
    } catch (error) {
      console.warn('Error during cache parameter auto-tuning:', error)
    }
  }
  
  /**
   * Tune hot cache size based on statistics and environment
   * 
   * The hot cache size is tuned based on:
   * 1. Available memory in the current environment
   * 2. Total number of nodes and edges in the system
   * 3. Cache hit/miss ratio
   * 
   * Algorithm:
   * - Start with a size based on available memory
   * - If storage statistics are available, consider caching a percentage of total items
   * - If hit ratio is low, increase the cache size to improve performance
   * - Ensure a reasonable minimum size to maintain basic functionality
   */
  private tuneHotCacheSize(): void {
    // Start with the base size from environment detection
    let optimalSize = this.detectOptimalCacheSize()
    
    // If we have storage statistics, adjust based on total nodes/edges
    if (this.storageStatistics) {
      const totalItems = (this.storageStatistics.totalNodes || 0) + 
                         (this.storageStatistics.totalEdges || 0)
      
      // If total items is significant, adjust cache size
      if (totalItems > 0) {
        // Use a percentage of total items, with a cap based on memory
        const percentageToCache = 0.2 // Cache 20% of items by default
        const statisticsBasedSize = Math.ceil(totalItems * percentageToCache)
        
        // Use the smaller of the two to avoid memory issues
        optimalSize = Math.min(optimalSize, statisticsBasedSize)
      }
    }
    
    // Adjust based on hit/miss ratio if we have enough data
    const totalAccesses = this.stats.hits + this.stats.misses
    if (totalAccesses > 100) {
      const hitRatio = this.stats.hits / totalAccesses
      
      // If hit ratio is high, we might have a good cache size already
      // If hit ratio is low, we might need a larger cache
      if (hitRatio < 0.5) {
        // Increase cache size by up to 50% if hit ratio is low
        const hitRatioFactor = 1 + (0.5 - hitRatio)
        optimalSize = Math.ceil(optimalSize * hitRatioFactor)
      }
    }
    
    // Ensure we have a reasonable minimum size
    optimalSize = Math.max(optimalSize, 1000)
    
    // Update the hot cache max size
    this.hotCacheMaxSize = optimalSize
    this.stats.maxSize = optimalSize
  }
  
  /**
   * Tune eviction threshold based on statistics
   * 
   * The eviction threshold determines when items start being evicted from the hot cache.
   * It is tuned based on:
   * 1. Cache hit/miss ratio
   * 2. Operation patterns (read-heavy vs. write-heavy workloads)
   * 
   * Algorithm:
   * - Start with a default threshold of 0.8 (80% of max size)
   * - For high hit ratios, increase the threshold to keep more items in cache
   * - For low hit ratios, decrease the threshold to evict items more aggressively
   * - For read-heavy workloads, use a higher threshold
   * - For write-heavy workloads, use a lower threshold
   */
  private tuneEvictionThreshold(): void {
    // Default threshold
    let threshold = 0.8
    
    // Adjust based on hit/miss ratio if we have enough data
    const totalAccesses = this.stats.hits + this.stats.misses
    if (totalAccesses > 100) {
      const hitRatio = this.stats.hits / totalAccesses
      
      // If hit ratio is high, we can use a higher threshold
      // If hit ratio is low, we should use a lower threshold to evict more aggressively
      if (hitRatio > 0.8) {
        // High hit ratio, increase threshold (up to 0.9)
        threshold = Math.min(0.9, 0.8 + (hitRatio - 0.8))
      } else if (hitRatio < 0.5) {
        // Low hit ratio, decrease threshold (down to 0.6)
        threshold = Math.max(0.6, 0.8 - (0.5 - hitRatio))
      }
    }
    
    // If we have storage statistics with operation counts, adjust based on operation patterns
    if (this.storageStatistics && this.storageStatistics.operations) {
      const ops = this.storageStatistics.operations
      const totalOps = ops.total || 1
      
      // Calculate read/write ratio
      const readOps = ops.search || 0
      const writeOps = (ops.add || 0) + (ops.update || 0) + (ops.delete || 0)
      
      if (totalOps > 100) {
        const readRatio = readOps / totalOps
        const writeRatio = writeOps / totalOps
        
        // For read-heavy workloads, use higher threshold
        // For write-heavy workloads, use lower threshold
        if (readRatio > 0.8) {
          // Read-heavy, increase threshold slightly
          threshold = Math.min(0.9, threshold + 0.05)
        } else if (writeRatio > 0.5) {
          // Write-heavy, decrease threshold
          threshold = Math.max(0.6, threshold - 0.1)
        }
      }
    }
    
    // Update the eviction threshold
    this.hotCacheEvictionThreshold = threshold
  }
  
  /**
   * Tune warm cache TTL based on statistics
   * 
   * The warm cache TTL determines how long items remain in the warm cache.
   * It is tuned based on:
   * 1. Update frequency from operation statistics
   * 
   * Algorithm:
   * - Start with a default TTL of 24 hours
   * - For frequently updated data, use a shorter TTL
   * - For rarely updated data, use a longer TTL
   */
  private tuneWarmCacheTTL(): void {
    // Default TTL (24 hours)
    let ttl = 24 * 60 * 60 * 1000
    
    // If we have storage statistics with operation counts, adjust based on update frequency
    if (this.storageStatistics && this.storageStatistics.operations) {
      const ops = this.storageStatistics.operations
      const totalOps = ops.total || 1
      const updateOps = (ops.update || 0)
      
      if (totalOps > 100) {
        const updateRatio = updateOps / totalOps
        
        // For frequently updated data, use shorter TTL
        // For rarely updated data, use longer TTL
        if (updateRatio > 0.3) {
          // Frequently updated, decrease TTL (down to 6 hours)
          ttl = Math.max(6 * 60 * 60 * 1000, ttl * (1 - updateRatio))
        } else if (updateRatio < 0.1) {
          // Rarely updated, increase TTL (up to 48 hours)
          ttl = Math.min(48 * 60 * 60 * 1000, ttl * (1.5 - updateRatio))
        }
      }
    }
    
    // Update the warm cache TTL
    this.warmCacheTTL = ttl
  }
  
  /**
   * Tune batch size based on statistics and environment
   * 
   * The batch size determines how many items are processed in a single batch
   * for operations like prefetching. It is tuned based on:
   * 1. Current environment (Node.js, browser, worker)
   * 2. Available memory
   * 3. Operation patterns
   * 4. Cache hit/miss ratio
   * 
   * Algorithm:
   * - Start with a default based on the environment
   * - Adjust based on available memory in browsers
   * - For bulk-heavy workloads, use a larger batch size
   * - For high hit ratios, use smaller batches (items likely in cache)
   * - For low hit ratios, use larger batches (need to fetch more items)
   */
  private tuneBatchSize(): void {
    // Default batch size
    let batchSize = 10
    
    // Adjust based on environment
    if (this.environment === Environment.NODE) {
      // Node.js can handle larger batches
      batchSize = 20
    } else if (this.environment === Environment.BROWSER) {
      // Browsers might need smaller batches
      batchSize = 10
      
      // If we have memory information, adjust accordingly
      if (navigator.deviceMemory) {
        // Scale batch size with available memory
        batchSize = Math.max(5, Math.min(20, Math.floor(navigator.deviceMemory * 2)))
      }
    }
    
    // If we have storage statistics with operation counts, adjust based on operation patterns
    if (this.storageStatistics && this.storageStatistics.operations) {
      const ops = this.storageStatistics.operations
      const totalOps = ops.total || 1
      const bulkOps = (ops.search || 0)
      
      if (totalOps > 100) {
        const bulkRatio = bulkOps / totalOps
        
        // For bulk-heavy workloads, use larger batch size
        if (bulkRatio > 0.7) {
          // Bulk-heavy, increase batch size (up to 2x)
          batchSize = Math.min(50, Math.ceil(batchSize * 1.5))
        }
      }
    }
    
    // Adjust based on hit/miss ratio if we have enough data
    const totalAccesses = this.stats.hits + this.stats.misses
    if (totalAccesses > 100) {
      const hitRatio = this.stats.hits / totalAccesses
      
      // If hit ratio is high, we can use smaller batches
      // If hit ratio is low, we might need larger batches
      if (hitRatio > 0.8) {
        // High hit ratio, decrease batch size slightly
        batchSize = Math.max(5, Math.floor(batchSize * 0.8))
      } else if (hitRatio < 0.5) {
        // Low hit ratio, increase batch size
        batchSize = Math.min(50, Math.ceil(batchSize * 1.2))
      }
    }
    
    // Update the batch size
    this.batchSize = batchSize
  }
  
  /**
   * Detect the appropriate warm storage type based on environment
   */
  private detectWarmStorageType(): StorageType {
    if (this.environment === Environment.BROWSER) {
      // Use OPFS if available, otherwise use memory
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        return StorageType.OPFS
      }
      return StorageType.MEMORY
    } else if (this.environment === Environment.WORKER) {
      // Use OPFS if available, otherwise use memory
      if ('storage' in self && 'getDirectory' in (self as WorkerGlobalScope).storage!) {
        return StorageType.OPFS
      }
      return StorageType.MEMORY
    } else {
      // In Node.js, use filesystem
      return StorageType.FILESYSTEM
    }
  }
  
  /**
   * Detect the appropriate cold storage type based on environment
   */
  private detectColdStorageType(): StorageType {
    if (this.environment === Environment.BROWSER) {
      // Use OPFS if available, otherwise use memory
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        return StorageType.OPFS
      }
      return StorageType.MEMORY
    } else if (this.environment === Environment.WORKER) {
      // Use OPFS if available, otherwise use memory
      if ('storage' in self && 'getDirectory' in (self as WorkerGlobalScope).storage!) {
        return StorageType.OPFS
      }
      return StorageType.MEMORY
    } else {
      // In Node.js, use S3 if configured, otherwise filesystem
      return StorageType.S3
    }
  }
  
  /**
   * Initialize warm storage adapter
   */
  private initializeWarmStorage(): any {
    // Implementation depends on the detected storage type
    // For now, return null as this will be provided by the storage adapter
    return null
  }
  
  /**
   * Initialize cold storage adapter
   */
  private initializeColdStorage(): any {
    // Implementation depends on the detected storage type
    // For now, return null as this will be provided by the storage adapter
    return null
  }
  
  /**
   * Get an item from cache, trying each level in order
   * @param id The item ID
   * @returns The cached item or null if not found
   */
  public async get(id: string): Promise<T | null> {
    // Check if it's time to tune parameters
    await this.checkAndTuneParameters()
    
    // Try hot cache first (fastest)
    const hotCacheEntry = this.hotCache.get(id)
    if (hotCacheEntry) {
      // Update access metadata
      hotCacheEntry.lastAccessed = Date.now()
      hotCacheEntry.accessCount++
      
      // Update stats
      this.stats.hits++
      
      return hotCacheEntry.data
    }
    
    // Try warm cache next
    try {
      const warmCacheItem = await this.getFromWarmCache(id)
      if (warmCacheItem) {
        // Promote to hot cache
        this.addToHotCache(id, warmCacheItem)
        
        // Update stats
        this.stats.hits++
        
        return warmCacheItem
      }
    } catch (error) {
      console.warn(`Error accessing warm cache for ${id}:`, error)
    }
    
    // Finally, try cold storage
    try {
      const coldStorageItem = await this.getFromColdStorage(id)
      if (coldStorageItem) {
        // Promote to hot and warm caches
        this.addToHotCache(id, coldStorageItem)
        await this.addToWarmCache(id, coldStorageItem)
        
        // Update stats
        this.stats.misses++
        
        return coldStorageItem
      }
    } catch (error) {
      console.warn(`Error accessing cold storage for ${id}:`, error)
    }
    
    // Item not found in any cache level
    this.stats.misses++
    return null
  }
  
  /**
   * Get an item from warm cache
   * @param id The item ID
   * @returns The cached item or null if not found
   */
  private async getFromWarmCache(id: string): Promise<T | null> {
    if (!this.warmStorage) return null
    
    try {
      return await this.warmStorage.get(id)
    } catch (error) {
      console.warn(`Error getting item ${id} from warm cache:`, error)
      return null
    }
  }
  
  /**
   * Get an item from cold storage
   * @param id The item ID
   * @returns The item or null if not found
   */
  private async getFromColdStorage(id: string): Promise<T | null> {
    if (!this.coldStorage) return null
    
    try {
      return await this.coldStorage.get(id)
    } catch (error) {
      console.warn(`Error getting item ${id} from cold storage:`, error)
      return null
    }
  }
  
  /**
   * Add an item to hot cache
   * @param id The item ID
   * @param item The item to cache
   */
  private addToHotCache(id: string, item: T): void {
    // Check if we need to evict items
    if (this.hotCache.size >= this.hotCacheMaxSize * this.hotCacheEvictionThreshold) {
      this.evictFromHotCache()
    }
    
    // Add to hot cache
    this.hotCache.set(id, {
      data: item,
      lastAccessed: Date.now(),
      accessCount: 1,
      expiresAt: null // Hot cache items don't expire
    })
    
    // Update stats
    this.stats.size = this.hotCache.size
  }
  
  /**
   * Add an item to warm cache
   * @param id The item ID
   * @param item The item to cache
   */
  private async addToWarmCache(id: string, item: T): Promise<void> {
    if (!this.warmStorage) return
    
    try {
      // Add to warm cache with TTL
      await this.warmStorage.set(id, item, {
        ttl: this.warmCacheTTL
      })
    } catch (error) {
      console.warn(`Error adding item ${id} to warm cache:`, error)
    }
  }
  
  /**
   * Evict items from hot cache based on LRU policy
   */
  private evictFromHotCache(): void {
    // Find the least recently used items
    const entries = Array.from(this.hotCache.entries())
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    // Remove the oldest 20% of items
    const itemsToRemove = Math.ceil(this.hotCache.size * 0.2)
    for (let i = 0; i < itemsToRemove && i < entries.length; i++) {
      this.hotCache.delete(entries[i][0])
      this.stats.evictions++
    }
    
    // Update stats
    this.stats.size = this.hotCache.size
    
    if (process.env.DEBUG) {
      console.log(`Evicted ${itemsToRemove} items from hot cache, new size: ${this.hotCache.size}`)
    }
  }
  
  /**
   * Set an item in all cache levels
   * @param id The item ID
   * @param item The item to cache
   */
  public async set(id: string, item: T): Promise<void> {
    // Add to hot cache
    this.addToHotCache(id, item)
    
    // Add to warm cache
    await this.addToWarmCache(id, item)
    
    // Add to cold storage
    if (this.coldStorage) {
      try {
        await this.coldStorage.set(id, item)
      } catch (error) {
        console.warn(`Error adding item ${id} to cold storage:`, error)
      }
    }
  }
  
  /**
   * Delete an item from all cache levels
   * @param id The item ID to delete
   */
  public async delete(id: string): Promise<void> {
    // Remove from hot cache
    this.hotCache.delete(id)
    
    // Remove from warm cache
    if (this.warmStorage) {
      try {
        await this.warmStorage.delete(id)
      } catch (error) {
        console.warn(`Error deleting item ${id} from warm cache:`, error)
      }
    }
    
    // Remove from cold storage
    if (this.coldStorage) {
      try {
        await this.coldStorage.delete(id)
      } catch (error) {
        console.warn(`Error deleting item ${id} from cold storage:`, error)
      }
    }
    
    // Update stats
    this.stats.size = this.hotCache.size
  }
  
  /**
   * Clear all cache levels
   */
  public async clear(): Promise<void> {
    // Clear hot cache
    this.hotCache.clear()
    
    // Clear warm cache
    if (this.warmStorage) {
      try {
        await this.warmStorage.clear()
      } catch (error) {
        console.warn('Error clearing warm cache:', error)
      }
    }
    
    // Clear cold storage
    if (this.coldStorage) {
      try {
        await this.coldStorage.clear()
      } catch (error) {
        console.warn('Error clearing cold storage:', error)
      }
    }
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: this.hotCacheMaxSize
    }
  }
  
  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats }
  }
  
  /**
   * Prefetch items based on ID patterns or relationships
   * @param ids Array of IDs to prefetch
   */
  public async prefetch(ids: string[]): Promise<void> {
    // Check if it's time to tune parameters
    await this.checkAndTuneParameters()
    
    // Prefetch in batches to avoid overwhelming the system
    const batches: string[][] = []
    
    // Split into batches using the configurable batch size
    for (let i = 0; i < ids.length; i += this.batchSize) {
      const batch = ids.slice(i, i + this.batchSize)
      batches.push(batch)
    }
    
    // Process each batch
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (id) => {
          // Skip if already in hot cache
          if (this.hotCache.has(id)) return
          
          try {
            // Try to get from any cache level
            await this.get(id)
          } catch (error) {
            // Ignore errors during prefetching
            if (process.env.DEBUG) {
              console.warn(`Error prefetching ${id}:`, error)
            }
          }
        })
      )
    }
  }
  
  /**
   * Check if it's time to tune parameters and do so if needed
   * This is called before operations that might benefit from tuned parameters
   * 
   * This method serves as a checkpoint for auto-tuning, ensuring that:
   * 1. Parameters are tuned periodically based on the auto-tune interval
   * 2. Tuning happens before critical operations that would benefit from optimized parameters
   * 3. Tuning doesn't happen too frequently, which could impact performance
   * 
   * By calling this method before get(), getMany(), and prefetch() operations,
   * we ensure that the cache parameters are optimized for the current workload
   * without adding unnecessary overhead to every operation.
   */
  private async checkAndTuneParameters(): Promise<void> {
    // Skip if auto-tuning is disabled
    if (!this.autoTune) return
    
    // Check if it's time to tune parameters
    const now = Date.now()
    if (now - this.lastAutoTuneTime >= this.autoTuneInterval) {
      await this.tuneParameters()
    }
  }
  
  /**
   * Get multiple items at once, optimizing for batch retrieval
   * @param ids Array of IDs to get
   * @returns Map of ID to item
   */
  public async getMany(ids: string[]): Promise<Map<string, T>> {
    // Check if it's time to tune parameters
    await this.checkAndTuneParameters()
    
    const result = new Map<string, T>()
    
    // First check hot cache for all IDs
    const missingIds: string[] = []
    for (const id of ids) {
      const hotCacheEntry = this.hotCache.get(id)
      if (hotCacheEntry) {
        // Update access metadata
        hotCacheEntry.lastAccessed = Date.now()
        hotCacheEntry.accessCount++
        
        // Add to result
        result.set(id, hotCacheEntry.data)
        
        // Update stats
        this.stats.hits++
      } else {
        missingIds.push(id)
      }
    }
    
    if (missingIds.length === 0) {
      return result
    }
    
    // Try to get missing items from warm cache
    if (this.warmStorage) {
      try {
        const warmCacheItems = await this.warmStorage.getMany(missingIds)
        for (const [id, item] of warmCacheItems.entries()) {
          if (item) {
            // Promote to hot cache
            this.addToHotCache(id, item)
            
            // Add to result
            result.set(id, item)
            
            // Update stats
            this.stats.hits++
            
            // Remove from missing IDs
            const index = missingIds.indexOf(id)
            if (index !== -1) {
              missingIds.splice(index, 1)
            }
          }
        }
      } catch (error) {
        console.warn('Error accessing warm cache for batch:', error)
      }
    }
    
    if (missingIds.length === 0) {
      return result
    }
    
    // Try to get remaining missing items from cold storage
    if (this.coldStorage) {
      try {
        const coldStorageItems = await this.coldStorage.getMany(missingIds)
        for (const [id, item] of coldStorageItems.entries()) {
          if (item) {
            // Promote to hot and warm caches
            this.addToHotCache(id, item)
            await this.addToWarmCache(id, item)
            
            // Add to result
            result.set(id, item)
            
            // Update stats
            this.stats.misses++
          }
        }
      } catch (error) {
        console.warn('Error accessing cold storage for batch:', error)
      }
    }
    
    return result
  }
  
  /**
   * Set the storage adapters for warm and cold caches
   * @param warmStorage Warm cache storage adapter
   * @param coldStorage Cold storage adapter
   */
  public setStorageAdapters(warmStorage: any, coldStorage: any): void {
    this.warmStorage = warmStorage
    this.coldStorage = coldStorage
  }
}
