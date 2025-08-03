/**
 * Enhanced Multi-Level Cache Manager with Predictive Prefetching
 * Optimized for HNSW search patterns and large-scale vector operations
 */

import { HNSWNoun, HNSWVerb, Vector } from '../coreTypes.js'
import { BatchS3Operations, BatchResult } from './adapters/batchS3Operations.js'

// Enhanced cache entry with prediction metadata
interface EnhancedCacheEntry<T> {
  data: T
  lastAccessed: number
  accessCount: number
  expiresAt: number | null
  vectorSimilarity?: number
  connectedNodes?: Set<string>
  predictionScore?: number
}

// Prefetch prediction strategies
enum PrefetchStrategy {
  GRAPH_CONNECTIVITY = 'connectivity',
  VECTOR_SIMILARITY = 'similarity',
  ACCESS_PATTERN = 'pattern',
  HYBRID = 'hybrid'
}

// Enhanced cache configuration
interface EnhancedCacheConfig {
  // Hot cache (RAM) - most frequently accessed
  hotCacheMaxSize?: number
  hotCacheEvictionThreshold?: number
  
  // Warm cache (fast storage) - recently accessed
  warmCacheMaxSize?: number
  warmCacheTTL?: number
  
  // Prediction and prefetching
  prefetchEnabled?: boolean
  prefetchStrategy?: PrefetchStrategy
  prefetchBatchSize?: number
  predictionLookahead?: number
  
  // Vector similarity thresholds
  similarityThreshold?: number
  maxSimilarityDistance?: number
  
  // Performance tuning
  backgroundOptimization?: boolean
  statisticsCollection?: boolean
}

/**
 * Enhanced cache manager with intelligent prefetching for HNSW operations
 * Provides multi-level caching optimized for vector search workloads
 */
export class EnhancedCacheManager<T extends HNSWNoun | HNSWVerb> {
  private hotCache = new Map<string, EnhancedCacheEntry<T>>()
  private warmCache = new Map<string, EnhancedCacheEntry<T>>()
  private prefetchQueue = new Set<string>()
  private accessPatterns = new Map<string, number[]>() // Track access times
  private vectorIndex = new Map<string, Vector>() // For similarity calculations
  
  private config: Required<EnhancedCacheConfig>
  private batchOperations?: BatchS3Operations
  private storageAdapter?: any
  private prefetchInProgress = false
  
  // Statistics and monitoring
  private stats = {
    hotCacheHits: 0,
    hotCacheMisses: 0,
    warmCacheHits: 0,
    warmCacheMisses: 0,
    prefetchHits: 0,
    prefetchMisses: 0,
    totalPrefetched: 0,
    predictionAccuracy: 0,
    backgroundOptimizations: 0
  }

  constructor(config: EnhancedCacheConfig = {}) {
    this.config = {
      hotCacheMaxSize: 1000,
      hotCacheEvictionThreshold: 0.8,
      warmCacheMaxSize: 10000,
      warmCacheTTL: 300000, // 5 minutes
      prefetchEnabled: true,
      prefetchStrategy: PrefetchStrategy.HYBRID,
      prefetchBatchSize: 50,
      predictionLookahead: 3,
      similarityThreshold: 0.8,
      maxSimilarityDistance: 2.0,
      backgroundOptimization: true,
      statisticsCollection: true,
      ...config
    }

    // Start background optimization if enabled
    if (this.config.backgroundOptimization) {
      this.startBackgroundOptimization()
    }
  }

  /**
   * Set storage adapters for warm/cold storage operations
   */
  public setStorageAdapters(
    storageAdapter: any,
    batchOperations?: BatchS3Operations
  ): void {
    this.storageAdapter = storageAdapter
    this.batchOperations = batchOperations
  }

  /**
   * Get item with intelligent prefetching
   */
  public async get(id: string): Promise<T | null> {
    const startTime = Date.now()
    
    // Update access pattern
    this.recordAccess(id, startTime)
    
    // Check hot cache first
    let entry = this.hotCache.get(id)
    if (entry && !this.isExpired(entry)) {
      entry.lastAccessed = startTime
      entry.accessCount++
      this.stats.hotCacheHits++
      
      // Trigger predictive prefetch
      if (this.config.prefetchEnabled) {
        this.schedulePrefetch(id, entry.data)
      }
      
      return entry.data
    }
    this.stats.hotCacheMisses++

    // Check warm cache
    entry = this.warmCache.get(id)
    if (entry && !this.isExpired(entry)) {
      entry.lastAccessed = startTime
      entry.accessCount++
      this.stats.warmCacheHits++
      
      // Promote to hot cache if frequently accessed
      if (entry.accessCount > 3) {
        this.promoteToHotCache(id, entry)
      }
      
      return entry.data
    }
    this.stats.warmCacheMisses++

    // Load from storage
    const item = await this.loadFromStorage(id)
    if (item) {
      // Cache the item
      await this.set(id, item)
      
      // Trigger predictive prefetch
      if (this.config.prefetchEnabled) {
        this.schedulePrefetch(id, item)
      }
    }

    return item
  }

  /**
   * Get multiple items efficiently with batch operations
   */
  public async getMany(ids: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const uncachedIds: string[] = []
    
    // Check caches first
    for (const id of ids) {
      const cached = await this.get(id)
      if (cached) {
        result.set(id, cached)
      } else {
        uncachedIds.push(id)
      }
    }

    // Batch load uncached items
    if (uncachedIds.length > 0 && this.batchOperations) {
      const batchResult = await this.batchOperations.batchGetNodes(uncachedIds)
      
      // Cache loaded items
      for (const [id, item] of batchResult.items) {
        await this.set(id, item as T)
        result.set(id, item as T)
      }
    }

    return result
  }

  /**
   * Set item in cache with metadata
   */
  public async set(id: string, item: T): Promise<void> {
    const now = Date.now()
    const entry: EnhancedCacheEntry<T> = {
      data: item,
      lastAccessed: now,
      accessCount: 1,
      expiresAt: now + this.config.warmCacheTTL,
      connectedNodes: this.extractConnectedNodes(item),
      predictionScore: 0
    }

    // Store vector for similarity calculations
    if ('vector' in item && item.vector) {
      this.vectorIndex.set(id, item.vector as Vector)
      entry.vectorSimilarity = 0
    }

    // Add to warm cache initially
    this.warmCache.set(id, entry)
    
    // Clean up if needed
    if (this.warmCache.size > this.config.warmCacheMaxSize) {
      this.evictFromWarmCache()
    }

    // Update statistics
    this.stats.warmCacheHits++ // Count as a potential future hit
  }

  /**
   * Intelligent prefetch based on access patterns and graph structure
   */
  private async schedulePrefetch(currentId: string, currentItem: T): Promise<void> {
    if (this.prefetchInProgress || !this.config.prefetchEnabled) {
      return
    }

    // Use different strategies based on configuration
    let candidateIds: string[] = []
    
    switch (this.config.prefetchStrategy) {
      case PrefetchStrategy.GRAPH_CONNECTIVITY:
        candidateIds = this.predictByConnectivity(currentId, currentItem)
        break
        
      case PrefetchStrategy.VECTOR_SIMILARITY:
        candidateIds = await this.predictBySimilarity(currentId, currentItem)
        break
        
      case PrefetchStrategy.ACCESS_PATTERN:
        candidateIds = this.predictByAccessPattern(currentId)
        break
        
      case PrefetchStrategy.HYBRID:
        candidateIds = await this.hybridPrediction(currentId, currentItem)
        break
    }

    // Filter out already cached items
    const uncachedIds = candidateIds.filter(id => 
      !this.hotCache.has(id) && !this.warmCache.has(id)
    ).slice(0, this.config.prefetchBatchSize)

    if (uncachedIds.length > 0) {
      this.executePrefetch(uncachedIds)
    }
  }

  /**
   * Predict next nodes based on graph connectivity
   */
  private predictByConnectivity(currentId: string, currentItem: T): string[] {
    const candidates: string[] = []
    
    if ('connections' in currentItem && currentItem.connections) {
      const connections = currentItem.connections as Map<number, Set<string>>
      
      // Add immediate neighbors with higher priority for lower levels
      for (const [level, nodeIds] of connections.entries()) {
        const priority = Math.max(1, 5 - level) // Higher priority for level 0
        
        for (const nodeId of nodeIds) {
          // Add based on priority
          for (let i = 0; i < priority; i++) {
            candidates.push(nodeId)
          }
        }
      }
    }

    // Shuffle and deduplicate
    const shuffled = candidates.sort(() => Math.random() - 0.5)
    return [...new Set(shuffled)]
  }

  /**
   * Predict next nodes based on vector similarity
   */
  private async predictBySimilarity(currentId: string, currentItem: T): Promise<string[]> {
    if (!('vector' in currentItem) || !currentItem.vector) {
      return []
    }

    const currentVector = currentItem.vector as Vector
    const similarities: Array<[string, number]> = []

    // Calculate similarities with vectors in cache
    for (const [id, vector] of this.vectorIndex.entries()) {
      if (id === currentId) continue
      
      const similarity = this.cosineSimilarity(currentVector, vector)
      if (similarity > this.config.similarityThreshold) {
        similarities.push([id, similarity])
      }
    }

    // Sort by similarity and return top candidates
    similarities.sort((a, b) => b[1] - a[1])
    return similarities.slice(0, this.config.prefetchBatchSize).map(([id]) => id)
  }

  /**
   * Predict based on historical access patterns
   */
  private predictByAccessPattern(currentId: string): string[] {
    const currentPattern = this.accessPatterns.get(currentId)
    if (!currentPattern || currentPattern.length < 2) {
      return []
    }

    // Find similar access patterns
    const candidates: Array<[string, number]> = []
    
    for (const [id, pattern] of this.accessPatterns.entries()) {
      if (id === currentId || pattern.length < 2) continue
      
      const similarity = this.patternSimilarity(currentPattern, pattern)
      if (similarity > 0.5) {
        candidates.push([id, similarity])
      }
    }

    candidates.sort((a, b) => b[1] - a[1])
    return candidates.slice(0, this.config.prefetchBatchSize).map(([id]) => id)
  }

  /**
   * Hybrid prediction combining multiple strategies
   */
  private async hybridPrediction(currentId: string, currentItem: T): Promise<string[]> {
    const connectivityCandidates = this.predictByConnectivity(currentId, currentItem)
    const similarityCandidates = await this.predictBySimilarity(currentId, currentItem)
    const patternCandidates = this.predictByAccessPattern(currentId)

    // Weighted combination
    const candidateScores = new Map<string, number>()

    // Connectivity gets highest weight (40%)
    connectivityCandidates.forEach((id, index) => {
      const score = (connectivityCandidates.length - index) / connectivityCandidates.length * 0.4
      candidateScores.set(id, (candidateScores.get(id) || 0) + score)
    })

    // Similarity gets medium weight (35%)
    similarityCandidates.forEach((id, index) => {
      const score = (similarityCandidates.length - index) / similarityCandidates.length * 0.35
      candidateScores.set(id, (candidateScores.get(id) || 0) + score)
    })

    // Pattern gets lower weight (25%)
    patternCandidates.forEach((id, index) => {
      const score = (patternCandidates.length - index) / patternCandidates.length * 0.25
      candidateScores.set(id, (candidateScores.get(id) || 0) + score)
    })

    // Sort by combined score
    const sortedCandidates = Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)

    return sortedCandidates.slice(0, this.config.prefetchBatchSize)
  }

  /**
   * Execute prefetch operation in background
   */
  private async executePrefetch(ids: string[]): Promise<void> {
    if (this.prefetchInProgress || !this.batchOperations) {
      return
    }

    this.prefetchInProgress = true
    
    try {
      const batchResult = await this.batchOperations.batchGetNodes(ids)
      
      // Cache prefetched items
      for (const [id, item] of batchResult.items) {
        const entry: EnhancedCacheEntry<T> = {
          data: item as T,
          lastAccessed: Date.now(),
          accessCount: 0, // Prefetched items start with 0 access count
          expiresAt: Date.now() + this.config.warmCacheTTL,
          connectedNodes: this.extractConnectedNodes(item as T),
          predictionScore: 1 // Mark as prefetched
        }

        this.warmCache.set(id, entry)
      }

      this.stats.totalPrefetched += batchResult.items.size
      
    } catch (error) {
      console.warn('Prefetch operation failed:', error)
    } finally {
      this.prefetchInProgress = false
    }
  }

  /**
   * Load item from storage adapter
   */
  private async loadFromStorage(id: string): Promise<T | null> {
    if (!this.storageAdapter) {
      return null
    }

    try {
      return await this.storageAdapter.get(id)
    } catch (error) {
      console.warn(`Failed to load ${id} from storage:`, error)
      return null
    }
  }

  /**
   * Promote frequently accessed item to hot cache
   */
  private promoteToHotCache(id: string, entry: EnhancedCacheEntry<T>): void {
    // Remove from warm cache
    this.warmCache.delete(id)
    
    // Add to hot cache
    this.hotCache.set(id, entry)
    
    // Evict if necessary
    if (this.hotCache.size > this.config.hotCacheMaxSize) {
      this.evictFromHotCache()
    }
  }

  /**
   * Evict least recently used items from hot cache
   */
  private evictFromHotCache(): void {
    const threshold = Math.floor(this.config.hotCacheMaxSize * this.config.hotCacheEvictionThreshold)
    
    if (this.hotCache.size <= threshold) {
      return
    }

    // Sort by last accessed time and access count
    const entries = Array.from(this.hotCache.entries())
      .sort((a, b) => {
        const scoreA = a[1].accessCount * 0.7 + (Date.now() - a[1].lastAccessed) * -0.3
        const scoreB = b[1].accessCount * 0.7 + (Date.now() - b[1].lastAccessed) * -0.3
        return scoreA - scoreB
      })

    // Remove least valuable entries
    const toRemove = entries.slice(0, this.hotCache.size - threshold)
    for (const [id] of toRemove) {
      this.hotCache.delete(id)
    }
  }

  /**
   * Evict expired items from warm cache
   */
  private evictFromWarmCache(): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [id, entry] of this.warmCache.entries()) {
      if (this.isExpired(entry)) {
        toRemove.push(id)
      }
    }

    // Remove expired items
    for (const id of toRemove) {
      this.warmCache.delete(id)
      this.vectorIndex.delete(id)
    }

    // If still over limit, remove LRU items
    if (this.warmCache.size > this.config.warmCacheMaxSize) {
      const entries = Array.from(this.warmCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

      const excess = this.warmCache.size - this.config.warmCacheMaxSize
      for (let i = 0; i < excess; i++) {
        const [id] = entries[i]
        this.warmCache.delete(id)
        this.vectorIndex.delete(id)
      }
    }
  }

  /**
   * Record access pattern for prediction
   */
  private recordAccess(id: string, timestamp: number): void {
    if (!this.config.statisticsCollection) {
      return
    }

    let pattern = this.accessPatterns.get(id)
    if (!pattern) {
      pattern = []
      this.accessPatterns.set(id, pattern)
    }

    pattern.push(timestamp)
    
    // Keep only recent accesses (last 10)
    if (pattern.length > 10) {
      pattern.shift()
    }
  }

  /**
   * Extract connected node IDs from HNSW item
   */
  private extractConnectedNodes(item: T): Set<string> {
    const connected = new Set<string>()
    
    if ('connections' in item && item.connections) {
      const connections = item.connections as Map<number, Set<string>>
      for (const nodeIds of connections.values()) {
        nodeIds.forEach(id => connected.add(id))
      }
    }
    
    return connected
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: EnhancedCacheEntry<T>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: Vector, b: Vector): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  /**
   * Calculate pattern similarity between access patterns
   */
  private patternSimilarity(pattern1: number[], pattern2: number[]): number {
    const minLength = Math.min(pattern1.length, pattern2.length)
    if (minLength < 2) return 0

    // Calculate intervals between accesses
    const intervals1 = pattern1.slice(1).map((t, i) => t - pattern1[i])
    const intervals2 = pattern2.slice(1).map((t, i) => t - pattern2[i])

    // Compare interval patterns
    let similarity = 0
    const compareLength = Math.min(intervals1.length, intervals2.length)
    
    for (let i = 0; i < compareLength; i++) {
      const diff = Math.abs(intervals1[i] - intervals2[i])
      const maxInterval = Math.max(intervals1[i], intervals2[i])
      similarity += maxInterval === 0 ? 1 : 1 - (diff / maxInterval)
    }

    return compareLength === 0 ? 0 : similarity / compareLength
  }

  /**
   * Start background optimization process
   */
  private startBackgroundOptimization(): void {
    setInterval(() => {
      this.runBackgroundOptimization()
    }, 60000) // Run every minute
  }

  /**
   * Run background optimization tasks
   */
  private runBackgroundOptimization(): void {
    // Clean up expired entries
    this.evictFromWarmCache()
    this.evictFromHotCache()
    
    // Clean up old access patterns
    const cutoff = Date.now() - 3600000 // 1 hour
    for (const [id, pattern] of this.accessPatterns.entries()) {
      const recentAccesses = pattern.filter(t => t > cutoff)
      if (recentAccesses.length === 0) {
        this.accessPatterns.delete(id)
      } else {
        this.accessPatterns.set(id, recentAccesses)
      }
    }

    this.stats.backgroundOptimizations++
  }

  /**
   * Get cache statistics
   */
  public getStats(): typeof this.stats & {
    hotCacheSize: number
    warmCacheSize: number
    prefetchQueueSize: number
    accessPatternsTracked: number
  } {
    return {
      ...this.stats,
      hotCacheSize: this.hotCache.size,
      warmCacheSize: this.warmCache.size,
      prefetchQueueSize: this.prefetchQueue.size,
      accessPatternsTracked: this.accessPatterns.size
    }
  }

  /**
   * Clear all caches
   */
  public clear(): void {
    this.hotCache.clear()
    this.warmCache.clear()
    this.prefetchQueue.clear()
    this.accessPatterns.clear()
    this.vectorIndex.clear()
  }
}