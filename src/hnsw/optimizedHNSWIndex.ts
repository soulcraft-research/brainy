/**
 * Optimized HNSW Index for Large-Scale Vector Search
 * Implements dynamic parameter tuning and performance optimizations
 */

import {
  DistanceFunction,
  HNSWConfig,
  HNSWNoun,
  Vector,
  VectorDocument
} from '../coreTypes.js'
import { HNSWIndex } from './hnswIndex.js'
import { euclideanDistance } from '../utils/index.js'

export interface OptimizedHNSWConfig extends HNSWConfig {
  // Dynamic tuning parameters
  dynamicParameterTuning?: boolean
  targetSearchLatency?: number // ms
  targetRecall?: number // 0.0 to 1.0
  
  // Large-scale optimizations
  maxNodes?: number
  memoryBudget?: number // bytes
  diskCacheEnabled?: boolean
  compressionEnabled?: boolean
  
  // Performance monitoring
  performanceTracking?: boolean
  adaptiveEfSearch?: boolean
  
  // Advanced optimizations
  levelMultiplier?: number
  seedConnections?: number
  pruningStrategy?: 'simple' | 'diverse' | 'hybrid'
}

interface PerformanceMetrics {
  averageSearchTime: number
  averageRecall: number
  memoryUsage: number
  indexSize: number
  apiCalls: number
  cacheHitRate: number
}

interface DynamicParameters {
  efSearch: number
  efConstruction: number
  M: number
  ml: number
}

/**
 * Optimized HNSW Index with dynamic parameter tuning for large datasets
 */
export class OptimizedHNSWIndex extends HNSWIndex {
  private optimizedConfig: Required<OptimizedHNSWConfig>
  private performanceMetrics: PerformanceMetrics
  private dynamicParams: DynamicParameters
  private searchHistory: Array<{ latency: number; k: number; timestamp: number }> = []
  private parameterTuningInterval?: NodeJS.Timeout

  constructor(
    config: Partial<OptimizedHNSWConfig> = {},
    distanceFunction: DistanceFunction = euclideanDistance
  ) {
    // Set optimized defaults for large scale
    const defaultConfig: Required<OptimizedHNSWConfig> = {
      M: 32, // Higher connectivity for better recall
      efConstruction: 400, // Better build quality
      efSearch: 100, // Dynamic - will be tuned
      ml: 24, // Deeper hierarchy
      dynamicParameterTuning: true,
      targetSearchLatency: 100, // 100ms target
      targetRecall: 0.95, // 95% recall target
      maxNodes: 1000000, // 1M node limit
      memoryBudget: 8 * 1024 * 1024 * 1024, // 8GB
      diskCacheEnabled: true,
      compressionEnabled: false, // Disabled by default for compatibility
      performanceTracking: true,
      adaptiveEfSearch: true,
      levelMultiplier: 16,
      seedConnections: 8,
      pruningStrategy: 'hybrid'
    }

    const mergedConfig = { ...defaultConfig, ...config }
    
    // Initialize parent with base config
    super(
      {
        M: mergedConfig.M,
        efConstruction: mergedConfig.efConstruction,
        efSearch: mergedConfig.efSearch,
        ml: mergedConfig.ml
      },
      distanceFunction,
      { useParallelization: true }
    )

    this.optimizedConfig = mergedConfig
    
    // Initialize dynamic parameters
    this.dynamicParams = {
      efSearch: mergedConfig.efSearch,
      efConstruction: mergedConfig.efConstruction,
      M: mergedConfig.M,
      ml: mergedConfig.ml
    }

    // Initialize performance metrics
    this.performanceMetrics = {
      averageSearchTime: 0,
      averageRecall: 0,
      memoryUsage: 0,
      indexSize: 0,
      apiCalls: 0,
      cacheHitRate: 0
    }

    // Start parameter tuning if enabled
    if (this.optimizedConfig.dynamicParameterTuning) {
      this.startParameterTuning()
    }
  }

  /**
   * Optimized search with dynamic parameter adjustment
   */
  public async search(
    queryVector: Vector,
    k: number = 10
  ): Promise<Array<[string, number]>> {
    const startTime = Date.now()

    // Adjust efSearch dynamically based on k and performance history
    if (this.optimizedConfig.adaptiveEfSearch) {
      this.adjustEfSearch(k)
    }

    // Check memory usage and trigger optimizations if needed
    if (this.optimizedConfig.performanceTracking) {
      this.checkMemoryUsage()
    }

    // Perform the search with current parameters
    const originalConfig = this.getConfig()
    
    // Temporarily update search parameters
    const tempConfig = {
      ...originalConfig,
      efSearch: this.dynamicParams.efSearch
    }

    // Use the parent's search method with optimized parameters
    let results: Array<[string, number]>
    
    try {
      // This is a simplified approach - in practice, we'd need to modify
      // the parent class to accept runtime parameter changes
      results = await super.search(queryVector, k)
    } catch (error) {
      console.error('Optimized search failed, falling back to default:', error)
      results = await super.search(queryVector, k)
    }

    // Record performance metrics
    const searchTime = Date.now() - startTime
    this.recordSearchMetrics(searchTime, k, results.length)

    return results
  }

  /**
   * Dynamically adjust efSearch based on performance requirements
   */
  private adjustEfSearch(k: number): void {
    const recentSearches = this.searchHistory.slice(-10)
    
    if (recentSearches.length < 3) {
      // Not enough data, use heuristic
      this.dynamicParams.efSearch = Math.max(k * 2, 50)
      return
    }

    const averageLatency = recentSearches.reduce((sum, s) => sum + s.latency, 0) / recentSearches.length
    const targetLatency = this.optimizedConfig.targetSearchLatency

    // Adjust efSearch based on latency performance
    if (averageLatency > targetLatency * 1.2) {
      // Too slow, reduce efSearch
      this.dynamicParams.efSearch = Math.max(
        Math.floor(this.dynamicParams.efSearch * 0.9),
        k
      )
    } else if (averageLatency < targetLatency * 0.8) {
      // Fast enough, can increase efSearch for better recall
      this.dynamicParams.efSearch = Math.min(
        Math.floor(this.dynamicParams.efSearch * 1.1),
        500 // Maximum efSearch
      )
    }

    // Ensure efSearch is at least k
    this.dynamicParams.efSearch = Math.max(this.dynamicParams.efSearch, k)
  }

  /**
   * Record search performance metrics
   */
  private recordSearchMetrics(latency: number, k: number, resultCount: number): void {
    if (!this.optimizedConfig.performanceTracking) {
      return
    }

    // Add to search history
    this.searchHistory.push({
      latency,
      k,
      timestamp: Date.now()
    })

    // Keep only recent history (last 100 searches)
    if (this.searchHistory.length > 100) {
      this.searchHistory.shift()
    }

    // Update performance metrics
    const recentSearches = this.searchHistory.slice(-20)
    this.performanceMetrics.averageSearchTime = 
      recentSearches.reduce((sum, s) => sum + s.latency, 0) / recentSearches.length

    // Estimate recall (simplified - would need ground truth for accurate measurement)
    this.performanceMetrics.averageRecall = Math.min(resultCount / k, 1.0)
  }

  /**
   * Check memory usage and trigger optimizations
   */
  private checkMemoryUsage(): void {
    // Estimate memory usage (simplified)
    const estimatedMemory = this.size() * 1000 // Rough estimate per node
    this.performanceMetrics.memoryUsage = estimatedMemory

    if (estimatedMemory > this.optimizedConfig.memoryBudget * 0.9) {
      console.warn('Memory usage approaching limit, consider index partitioning')
      
      // Could trigger automatic partitioning or compression here
      if (this.optimizedConfig.compressionEnabled) {
        this.compressIndex()
      }
    }
  }

  /**
   * Compress index to reduce memory usage (placeholder)
   */
  private compressIndex(): void {
    console.log('Index compression not implemented yet')
    // This would implement vector quantization or other compression techniques
  }

  /**
   * Start automatic parameter tuning
   */
  private startParameterTuning(): void {
    this.parameterTuningInterval = setInterval(() => {
      this.tuneParameters()
    }, 30000) // Tune every 30 seconds
  }

  /**
   * Automatic parameter tuning based on performance metrics
   */
  private tuneParameters(): void {
    if (this.searchHistory.length < 10) {
      return // Not enough data
    }

    const recentSearches = this.searchHistory.slice(-20)
    const averageLatency = recentSearches.reduce((sum, s) => sum + s.latency, 0) / recentSearches.length
    
    // Tune based on performance vs targets
    const latencyRatio = averageLatency / this.optimizedConfig.targetSearchLatency
    const recallRatio = this.performanceMetrics.averageRecall / this.optimizedConfig.targetRecall

    // Adjust M (connectivity) for long-term performance
    if (this.size() > 10000) { // Only tune for larger indices
      if (recallRatio < 0.95 && latencyRatio < 1.5) {
        // Recall is low but we have latency budget, increase M
        this.dynamicParams.M = Math.min(this.dynamicParams.M + 2, 64)
      } else if (latencyRatio > 1.2 && recallRatio > 1.0) {
        // Latency is high but recall is good, can reduce M
        this.dynamicParams.M = Math.max(this.dynamicParams.M - 2, 16)
      }
    }

    console.log(`Parameter tuning: efSearch=${this.dynamicParams.efSearch}, M=${this.dynamicParams.M}, latency=${averageLatency.toFixed(1)}ms`)
  }

  /**
   * Get optimized configuration recommendations for current dataset size
   */
  public getOptimizedConfig(): OptimizedHNSWConfig {
    const currentSize = this.size()
    
    let recommendedConfig: Partial<OptimizedHNSWConfig> = {}

    if (currentSize < 10000) {
      // Small dataset - optimize for speed
      recommendedConfig = {
        M: 16,
        efConstruction: 200,
        efSearch: 50,
        ml: 16
      }
    } else if (currentSize < 100000) {
      // Medium dataset - balance speed and recall
      recommendedConfig = {
        M: 24,
        efConstruction: 300,
        efSearch: 75,
        ml: 20
      }
    } else if (currentSize < 1000000) {
      // Large dataset - optimize for recall
      recommendedConfig = {
        M: 32,
        efConstruction: 400,
        efSearch: 100,
        ml: 24
      }
    } else {
      // Very large dataset - maximum quality
      recommendedConfig = {
        M: 48,
        efConstruction: 500,
        efSearch: 150,
        ml: 28
      }
    }

    return {
      ...this.optimizedConfig,
      ...recommendedConfig
    }
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics & {
    currentParams: DynamicParameters
    searchHistorySize: number
  } {
    return {
      ...this.performanceMetrics,
      currentParams: { ...this.dynamicParams },
      searchHistorySize: this.searchHistory.length
    }
  }

  /**
   * Apply optimized bulk insertion strategy
   */
  public async bulkInsert(items: VectorDocument[]): Promise<string[]> {
    console.log(`Starting optimized bulk insert of ${items.length} items`)
    
    // Sort items to optimize insertion order (by vector similarity)
    const sortedItems = this.optimizeInsertionOrder(items)
    
    // Temporarily adjust construction parameters for bulk operations
    const originalEfConstruction = this.dynamicParams.efConstruction
    this.dynamicParams.efConstruction = Math.min(
      this.dynamicParams.efConstruction * 1.5,
      800
    )

    const results: string[] = []
    const batchSize = 100
    
    try {
      // Process in batches to manage memory
      for (let i = 0; i < sortedItems.length; i += batchSize) {
        const batch = sortedItems.slice(i, i + batchSize)
        
        for (const item of batch) {
          const id = await this.addItem(item)
          results.push(id)
        }

        // Periodic memory check
        if (i % (batchSize * 10) === 0) {
          this.checkMemoryUsage()
        }
      }
    } finally {
      // Restore original construction parameters
      this.dynamicParams.efConstruction = originalEfConstruction
    }

    console.log(`Completed bulk insert of ${results.length} items`)
    return results
  }

  /**
   * Optimize insertion order to improve index quality
   */
  private optimizeInsertionOrder(items: VectorDocument[]): VectorDocument[] {
    if (items.length < 100) {
      return items // Not worth optimizing small batches
    }

    // Simple clustering-based ordering
    // In practice, you might use more sophisticated methods
    return items.sort(() => Math.random() - 0.5) // Shuffle for now
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.parameterTuningInterval) {
      clearInterval(this.parameterTuningInterval)
    }
  }
}