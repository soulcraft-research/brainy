/**
 * SearchCache - Caches search results for improved performance
 */

import { SearchResult } from '../coreTypes.js'

export interface CacheEntry<T = any> {
  results: SearchResult<T>[]
  timestamp: number
  hits: number
}

export interface SearchCacheConfig {
  maxAge?: number // Maximum age in milliseconds (default: 5 minutes)
  maxSize?: number // Maximum number of cached queries (default: 100)
  enabled?: boolean // Whether caching is enabled (default: true)
  hitCountWeight?: number // Weight for hit count in eviction policy (default: 0.3)
}

export class SearchCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxAge: number
  private maxSize: number
  private enabled: boolean
  private hitCountWeight: number
  
  // Cache statistics
  private hits = 0
  private misses = 0
  private evictions = 0

  constructor(config: SearchCacheConfig = {}) {
    this.maxAge = config.maxAge ?? 5 * 60 * 1000 // 5 minutes
    this.maxSize = config.maxSize ?? 100
    this.enabled = config.enabled ?? true
    this.hitCountWeight = config.hitCountWeight ?? 0.3
  }

  /**
   * Generate cache key from search parameters
   */
  getCacheKey(
    query: any,
    k: number,
    options: Record<string, any> = {}
  ): string {
    // Create a normalized key that ignores order of options
    const normalizedOptions = Object.keys(options)
      .sort()
      .reduce((acc, key) => {
        // Skip cache-related options
        if (key === 'skipCache' || key === 'useStreaming') return acc
        acc[key] = options[key]
        return acc
      }, {} as Record<string, any>)

    return JSON.stringify({
      query: typeof query === 'object' ? JSON.stringify(query) : query,
      k,
      ...normalizedOptions
    })
  }

  /**
   * Get cached results if available and not expired
   */
  get(key: string): SearchResult<T>[] | null {
    if (!this.enabled) return null

    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    // Update hit count and statistics
    entry.hits++
    this.hits++
    return entry.results
  }

  /**
   * Cache search results
   */
  set(key: string, results: SearchResult<T>[]): void {
    if (!this.enabled) return

    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      results: [...results], // Deep copy to prevent mutations
      timestamp: Date.now(),
      hits: 0
    })
  }

  /**
   * Evict the oldest entry based on timestamp and hit count
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestScore = Infinity

    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      // Score combines age and inverse hit count
      const age = now - entry.timestamp
      const hitScore = entry.hits > 0 ? 1 / entry.hits : 1
      const score = age + (hitScore * this.hitCountWeight * this.maxAge)
      
      if (score < oldestScore) {
        oldestScore = score
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.evictions++
    }
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
    this.evictions = 0
  }

  /**
   * Invalidate cache entries that might be affected by data changes
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.clear()
      return
    }

    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      const shouldDelete = typeof pattern === 'string' 
        ? key.includes(pattern)
        : pattern.test(key)
      
      if (shouldDelete) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Smart invalidation for real-time data updates
   * Only clears cache if it's getting stale or if data changes significantly
   */
  invalidateOnDataChange(changeType?: 'add' | 'update' | 'delete'): void {
    // For now, clear all caches on data changes to ensure consistency
    // In the future, we could implement more sophisticated invalidation
    // based on the type of change and affected data
    this.clear()
  }

  /**
   * Check if cache entries have expired and remove them
   * This is especially important in distributed scenarios where
   * real-time updates might be delayed or missed
   */
  cleanupExpiredEntries(): number {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    return keysToDelete.length
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled
    }
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    Object.defineProperty(this, 'enabled', { value: enabled, writable: false })
    if (!enabled) {
      this.clear()
    }
  }

  /**
   * Get memory usage estimate in bytes
   */
  getMemoryUsage(): number {
    let totalSize = 0
    
    for (const [key, entry] of this.cache.entries()) {
      // Estimate key size
      totalSize += key.length * 2 // UTF-16 characters
      
      // Estimate entry size
      totalSize += JSON.stringify(entry.results).length * 2
      totalSize += 16 // timestamp + hits (8 bytes each)
    }
    
    return totalSize
  }
  
  /**
   * Get current cache configuration
   */
  getConfig(): SearchCacheConfig {
    return {
      enabled: this.enabled,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
      hitCountWeight: this.hitCountWeight
    }
  }
  
  /**
   * Update cache configuration dynamically
   */
  updateConfig(newConfig: Partial<SearchCacheConfig>): void {
    if (newConfig.enabled !== undefined) {
      this.enabled = newConfig.enabled
    }
    if (newConfig.maxSize !== undefined) {
      this.maxSize = newConfig.maxSize
      // Trigger eviction if current size exceeds new limit
      this.evictIfNeeded()
    }
    if (newConfig.maxAge !== undefined) {
      this.maxAge = newConfig.maxAge
      // Clean up entries that are now expired with new TTL
      this.cleanupExpiredEntries()
    }
    if (newConfig.hitCountWeight !== undefined) {
      this.hitCountWeight = newConfig.hitCountWeight
    }
  }
  
  /**
   * Evict entries if cache exceeds maxSize
   */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxSize) {
      return
    }

    // Calculate eviction score for each entry (same logic as existing eviction)
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = Date.now() - entry.timestamp
      const hitCount = entry.hits
      
      // Eviction score: lower is more likely to be evicted
      // Combines age and hit count (weighted by hitCountWeight)
      const ageScore = age / this.maxAge
      const hitScore = 1 / (hitCount + 1) // Inverse of hits (more hits = lower score)
      const score = ageScore * (1 - this.hitCountWeight) + hitScore * this.hitCountWeight
      
      return { key, entry, score }
    })

    // Sort by score (lowest first - these will be evicted)
    entries.sort((a, b) => a.score - b.score)

    // Evict entries until we're under the limit
    const toEvict = entries.slice(0, this.cache.size - this.maxSize)
    toEvict.forEach(({ key }) => {
      this.cache.delete(key)
      this.evictions++
    })
  }
}