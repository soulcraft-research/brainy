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
  S3,
  REMOTE_API
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
  
  // Store options for later reference
  private options: {
    hotCacheMaxSize?: number
    hotCacheEvictionThreshold?: number
    warmCacheTTL?: number
    batchSize?: number
    autoTune?: boolean
    warmStorage?: any
    coldStorage?: any
    readOnly?: boolean
  }
  
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
    readOnly?: boolean
  } = {}) {
    // Store options for later reference
    this.options = options
    
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
   * Detect the optimal cache size based on available memory and operating mode
   * 
   * Enhanced to better handle large datasets in S3 or other storage:
   * - Increases cache size for read-only mode
   * - Adjusts based on total dataset size when available
   * - Provides more aggressive caching for large datasets
   * - Optimizes memory usage based on environment
   */
  private detectOptimalCacheSize(): number {
    try {
      // Default to a conservative value
      const defaultSize = 1000
      
      // Get the total dataset size if available
      const totalItems = this.storageStatistics ? 
        (this.storageStatistics.totalNodes || 0) + (this.storageStatistics.totalEdges || 0) : 0
      
      // Determine if we're dealing with a large dataset (>100K items)
      const isLargeDataset = totalItems > 100000
      
      // Check if we're in read-only mode (from parent BrainyData instance)
      const isReadOnly = this.options?.readOnly || false
      
      // In Node.js, use available system memory with enhanced allocation
      if (this.environment === Environment.NODE) {
        try {
          // Use dynamic import to avoid ESLint warning
          const getOS = () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('os')
          }
          const os = getOS()
          const totalMemory = os.totalmem()
          const freeMemory = os.freemem()
          
          // Estimate average entry size (in bytes)
          // This is a conservative estimate for complex objects with vectors
          const ESTIMATED_BYTES_PER_ENTRY = 1024 // 1KB per entry
          
          // Base memory percentage - 10% by default
          let memoryPercentage = 0.1
          
          // Adjust based on operating mode and dataset size
          if (isReadOnly) {
            // In read-only mode, we can use more memory for caching
            memoryPercentage = 0.25 // 25% of free memory
            
            // For large datasets in read-only mode, be even more aggressive
            if (isLargeDataset) {
              memoryPercentage = 0.4 // 40% of free memory
            }
          } else if (isLargeDataset) {
            // For large datasets in normal mode, increase slightly
            memoryPercentage = 0.15 // 15% of free memory
          }
          
          // Calculate optimal size based on adjusted percentage
          const optimalSize = Math.max(
            Math.floor(freeMemory * memoryPercentage / ESTIMATED_BYTES_PER_ENTRY),
            1000
          )
          
          // If we know the total dataset size, cap at a reasonable percentage
          if (totalItems > 0) {
            // In read-only mode, we can cache a larger percentage
            const maxPercentage = isReadOnly ? 0.5 : 0.3
            const maxItems = Math.ceil(totalItems * maxPercentage)
            
            // Return the smaller of the two to avoid excessive memory usage
            return Math.min(optimalSize, maxItems)
          }
          
          return optimalSize
        } catch (error) {
          console.warn('Failed to detect optimal cache size:', error)
          return defaultSize
        }
      }
      
      // In browser, use navigator.deviceMemory with enhanced allocation
      if (this.environment === Environment.BROWSER && navigator.deviceMemory) {
        // Base entries per GB
        let entriesPerGB = 500
        
        // Adjust based on operating mode and dataset size
        if (isReadOnly) {
          entriesPerGB = 800 // More aggressive caching in read-only mode
          
          if (isLargeDataset) {
            entriesPerGB = 1000 // Even more aggressive for large datasets
          }
        } else if (isLargeDataset) {
          entriesPerGB = 600 // Slightly more aggressive for large datasets
        }
        
        // Calculate based on device memory
        const browserCacheSize = Math.max(navigator.deviceMemory * entriesPerGB, 1000)
        
        // If we know the total dataset size, cap at a reasonable percentage
        if (totalItems > 0) {
          // In read-only mode, we can cache a larger percentage
          const maxPercentage = isReadOnly ? 0.4 : 0.25
          const maxItems = Math.ceil(totalItems * maxPercentage)
          
          // Return the smaller of the two to avoid excessive memory usage
          return Math.min(browserCacheSize, maxItems)
        }
        
        return browserCacheSize
      }
      
      // For worker environments or when memory detection fails
      if (this.environment === Environment.WORKER) {
        // Workers typically have limited memory, be conservative
        return isReadOnly ? 2000 : 1000
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
   * Tune hot cache size based on statistics, environment, and operating mode
   * 
   * The hot cache size is tuned based on:
   * 1. Available memory in the current environment
   * 2. Total number of nodes and edges in the system
   * 3. Cache hit/miss ratio
   * 4. Operating mode (read-only vs. read-write)
   * 5. Storage type (S3, filesystem, memory)
   * 
   * Enhanced algorithm:
   * - Start with a size based on available memory and operating mode
   * - For large datasets in S3 or other remote storage, use more aggressive caching
   * - Adjust based on access patterns (read-heavy vs. write-heavy)
   * - For read-only mode, prioritize cache size over eviction speed
   * - Dynamically adjust based on hit/miss ratio and query patterns
   */
  private tuneHotCacheSize(): void {
    // Start with the base size from environment detection
    let optimalSize = this.detectOptimalCacheSize()
    
    // Check if we're in read-only mode
    const isReadOnly = this.options?.readOnly || false
    
    // Check if we're using S3 or other remote storage
    const isRemoteStorage = 
      this.coldStorageType === StorageType.S3 || 
      this.coldStorageType === StorageType.REMOTE_API
    
    // If we have storage statistics, adjust based on total nodes/edges
    if (this.storageStatistics) {
      const totalItems = (this.storageStatistics.totalNodes || 0) + 
                         (this.storageStatistics.totalEdges || 0)
      
      // If total items is significant, adjust cache size
      if (totalItems > 0) {
        // Base percentage to cache - adjusted based on mode and storage
        let percentageToCache = 0.2 // Cache 20% of items by default
        
        // For read-only mode, increase cache percentage
        if (isReadOnly) {
          percentageToCache = 0.3 // 30% for read-only mode
          
          // For remote storage in read-only mode, be even more aggressive
          if (isRemoteStorage) {
            percentageToCache = 0.4 // 40% for remote storage in read-only mode
          }
        } 
        // For remote storage in normal mode, increase slightly
        else if (isRemoteStorage) {
          percentageToCache = 0.25 // 25% for remote storage
        }
        
        // For large datasets, cap the percentage to avoid excessive memory usage
        if (totalItems > 1000000) { // Over 1 million items
          percentageToCache = Math.min(percentageToCache, 0.15)
        } else if (totalItems > 100000) { // Over 100K items
          percentageToCache = Math.min(percentageToCache, 0.25)
        }
        
        const statisticsBasedSize = Math.ceil(totalItems * percentageToCache)
        
        // Use the smaller of the two to avoid memory issues
        optimalSize = Math.min(optimalSize, statisticsBasedSize)
      }
    }
    
    // Adjust based on hit/miss ratio if we have enough data
    const totalAccesses = this.stats.hits + this.stats.misses
    if (totalAccesses > 100) {
      const hitRatio = this.stats.hits / totalAccesses
      
      // Base adjustment factor
      let hitRatioFactor = 1.0
      
      // If hit ratio is low, we might need a larger cache
      if (hitRatio < 0.5) {
        // Calculate adjustment factor based on hit ratio
        const baseAdjustment = 0.5 - hitRatio
        
        // For read-only mode or remote storage, be more aggressive
        if (isReadOnly || isRemoteStorage) {
          hitRatioFactor = 1 + (baseAdjustment * 1.5) // Up to 75% increase
        } else {
          hitRatioFactor = 1 + baseAdjustment // Up to 50% increase
        }
        
        optimalSize = Math.ceil(optimalSize * hitRatioFactor)
      }
      // If hit ratio is very high, we might be able to reduce cache size slightly
      else if (hitRatio > 0.9 && !isReadOnly && !isRemoteStorage) {
        // Only reduce cache size in normal mode with local storage
        // and only if hit ratio is very high
        hitRatioFactor = 0.9 // 10% reduction
        optimalSize = Math.ceil(optimalSize * hitRatioFactor)
      }
    }
    
    // Check for operation patterns if available
    if (this.storageStatistics?.operations) {
      const ops = this.storageStatistics.operations
      const totalOps = ops.total || 1
      
      // Calculate read/write ratio
      const readOps = (ops.search || 0) + (ops.get || 0)
      const writeOps = (ops.add || 0) + (ops.update || 0) + (ops.delete || 0)
      
      if (totalOps > 100) {
        const readRatio = readOps / totalOps
        
        // For read-heavy workloads, increase cache size
        if (readRatio > 0.8) {
          // More aggressive for remote storage
          const readAdjustment = isRemoteStorage ? 1.3 : 1.2
          optimalSize = Math.ceil(optimalSize * readAdjustment)
        }
      }
    }
    
    // Ensure we have a reasonable minimum size based on environment and mode
    let minSize = 1000 // Default minimum
    
    // For read-only mode, use a higher minimum
    if (isReadOnly) {
      minSize = 2000
    }
    
    // For remote storage, use an even higher minimum
    if (isRemoteStorage) {
      minSize = isReadOnly ? 3000 : 2000
    }
    
    optimalSize = Math.max(optimalSize, minSize)
    
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
   * Tune batch size based on environment, statistics, and operating mode
   * 
   * The batch size determines how many items are processed in a single batch
   * for operations like prefetching. It is tuned based on:
   * 1. Current environment (Node.js, browser, worker)
   * 2. Available memory
   * 3. Operation patterns
   * 4. Cache hit/miss ratio
   * 5. Operating mode (read-only vs. read-write)
   * 6. Storage type (S3, filesystem, memory)
   * 7. Dataset size
   * 
   * Enhanced algorithm:
   * - Start with a default based on the environment
   * - For large datasets in S3 or other remote storage, use larger batches
   * - For read-only mode, use larger batches to improve throughput
   * - Dynamically adjust based on network latency and throughput
   * - Balance between memory usage and performance
   */
  private tuneBatchSize(): void {
    // Default batch size
    let batchSize = 10
    
    // Check if we're in read-only mode
    const isReadOnly = this.options?.readOnly || false
    
    // Check if we're using S3 or other remote storage
    const isRemoteStorage = 
      this.coldStorageType === StorageType.S3 || 
      this.coldStorageType === StorageType.REMOTE_API
    
    // Get the total dataset size if available
    const totalItems = this.storageStatistics ? 
      (this.storageStatistics.totalNodes || 0) + (this.storageStatistics.totalEdges || 0) : 0
    
    // Determine if we're dealing with a large dataset
    const isLargeDataset = totalItems > 100000
    const isVeryLargeDataset = totalItems > 1000000
    
    // Base batch size adjustment based on environment
    if (this.environment === Environment.NODE) {
      // Node.js can handle larger batches
      batchSize = isReadOnly ? 30 : 20
      
      // For remote storage, increase batch size
      if (isRemoteStorage) {
        batchSize = isReadOnly ? 50 : 30
      }
      
      // For large datasets, adjust batch size
      if (isLargeDataset) {
        batchSize = Math.min(100, batchSize * 1.5)
      }
      
      // For very large datasets, adjust even more
      if (isVeryLargeDataset) {
        batchSize = Math.min(200, batchSize * 2)
      }
    } else if (this.environment === Environment.BROWSER) {
      // Browsers might need smaller batches
      batchSize = isReadOnly ? 15 : 10
      
      // If we have memory information, adjust accordingly
      if (navigator.deviceMemory) {
        // Scale batch size with available memory
        const memoryFactor = isReadOnly ? 3 : 2
        batchSize = Math.max(5, Math.min(30, Math.floor(navigator.deviceMemory * memoryFactor)))
        
        // For large datasets, adjust based on memory
        if (isLargeDataset && navigator.deviceMemory > 4) {
          batchSize = Math.min(50, batchSize * 1.5)
        }
      }
    } else if (this.environment === Environment.WORKER) {
      // Workers can handle moderate batch sizes
      batchSize = isReadOnly ? 20 : 15
    }
    
    // If we have storage statistics with operation counts, adjust based on operation patterns
    if (this.storageStatistics && this.storageStatistics.operations) {
      const ops = this.storageStatistics.operations
      const totalOps = ops.total || 1
      const searchOps = (ops.search || 0)
      const getOps = (ops.get || 0)
      
      if (totalOps > 100) {
        // Calculate search and get ratios
        const searchRatio = searchOps / totalOps
        const getRatio = getOps / totalOps
        
        // For search-heavy workloads, use larger batch size
        if (searchRatio > 0.6) {
          // Search-heavy, increase batch size
          const searchFactor = isRemoteStorage ? 1.8 : 1.5
          batchSize = Math.min(isRemoteStorage ? 200 : 100, Math.ceil(batchSize * searchFactor))
        }
        
        // For get-heavy workloads, adjust batch size
        if (getRatio > 0.6) {
          // Get-heavy, adjust batch size based on storage type
          if (isRemoteStorage) {
            // For remote storage, larger batches reduce network overhead
            batchSize = Math.min(150, Math.ceil(batchSize * 1.5))
          } else {
            // For local storage, smaller batches might be more efficient
            batchSize = Math.max(10, Math.ceil(batchSize * 0.9))
          }
        }
      }
    }
    
    // Adjust based on hit/miss ratio if we have enough data
    const totalAccesses = this.stats.hits + this.stats.misses
    if (totalAccesses > 100) {
      const hitRatio = this.stats.hits / totalAccesses
      
      // Base adjustment factors
      let increaseFactorForLowHitRatio = isRemoteStorage ? 1.5 : 1.2
      let decreaseFactorForHighHitRatio = 0.8
      
      // In read-only mode, be more aggressive with batch size adjustments
      if (isReadOnly) {
        increaseFactorForLowHitRatio = isRemoteStorage ? 2.0 : 1.5
        decreaseFactorForHighHitRatio = 0.9 // Less reduction in read-only mode
      }
      
      // If hit ratio is high, we can use smaller batches
      if (hitRatio > 0.8 && !isVeryLargeDataset) {
        // High hit ratio, decrease batch size slightly
        // But don't decrease too much for large datasets or remote storage
        if (!(isLargeDataset && isRemoteStorage)) {
          batchSize = Math.max(isReadOnly ? 10 : 5, Math.floor(batchSize * decreaseFactorForHighHitRatio))
        }
      } 
      // If hit ratio is low, we need larger batches
      else if (hitRatio < 0.5) {
        // Low hit ratio, increase batch size
        const maxBatchSize = isRemoteStorage ? 
          (isVeryLargeDataset ? 300 : 200) : 
          (isVeryLargeDataset ? 150 : 100)
        
        batchSize = Math.min(maxBatchSize, Math.ceil(batchSize * increaseFactorForLowHitRatio))
      }
    }
    
    // Set minimum batch sizes based on storage type and mode
    let minBatchSize = 5
    
    if (isRemoteStorage) {
      minBatchSize = isReadOnly ? 20 : 10
    } else if (isReadOnly) {
      minBatchSize = 10
    }
    
    // Ensure batch size is within reasonable limits
    batchSize = Math.max(minBatchSize, batchSize)
    
    // Cap maximum batch size based on environment and storage
    const maxBatchSize = isRemoteStorage ? 
      (this.environment === Environment.NODE ? 300 : 150) : 
      (this.environment === Environment.NODE ? 150 : 75)
    
    batchSize = Math.min(maxBatchSize, batchSize)
    
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
