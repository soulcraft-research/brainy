/**
 * Lightweight statistics collector for Brainy
 * Designed to have minimal performance impact even with millions of entries
 */

import { StatisticsData } from '../coreTypes.js'

interface TimeSeriesData {
  timestamp: number
  count: number
}

export class StatisticsCollector {
  // Content type tracking (lightweight counters)
  private contentTypes: Map<string, number> = new Map()
  
  // Data freshness tracking (only track timestamps, not full data)
  private oldestTimestamp: number = Date.now()
  private newestTimestamp: number = Date.now()
  private updateTimestamps: TimeSeriesData[] = []
  
  // Search performance tracking (rolling window)
  private searchMetrics = {
    totalSearches: 0,
    totalSearchTimeMs: 0,
    searchTimestamps: [] as TimeSeriesData[],
    topSearchTerms: new Map<string, number>()
  }
  
  // Verb type tracking
  private verbTypes: Map<string, number> = new Map()
  
  // Storage size estimates (updated periodically, not on every operation)
  private storageSizeCache = {
    lastUpdated: 0,
    sizes: {
      nouns: 0,
      verbs: 0,
      metadata: 0,
      index: 0
    }
  }
  
  private readonly MAX_TIMESTAMPS = 1000 // Keep last 1000 timestamps
  private readonly MAX_SEARCH_TERMS = 100 // Track top 100 search terms
  private readonly SIZE_UPDATE_INTERVAL = 60000 // Update sizes every minute
  
  /**
   * Track content type (very lightweight)
   */
  trackContentType(type: string): void {
    this.contentTypes.set(type, (this.contentTypes.get(type) || 0) + 1)
  }
  
  /**
   * Track data update timestamp (lightweight)
   */
  trackUpdate(timestamp?: number): void {
    const ts = timestamp || Date.now()
    
    // Update oldest/newest
    if (ts < this.oldestTimestamp) this.oldestTimestamp = ts
    if (ts > this.newestTimestamp) this.newestTimestamp = ts
    
    // Add to rolling window
    this.updateTimestamps.push({ timestamp: ts, count: 1 })
    
    // Keep window size limited
    if (this.updateTimestamps.length > this.MAX_TIMESTAMPS) {
      this.updateTimestamps.shift()
    }
  }
  
  /**
   * Track search performance (lightweight)
   */
  trackSearch(searchTerm: string, durationMs: number): void {
    this.searchMetrics.totalSearches++
    this.searchMetrics.totalSearchTimeMs += durationMs
    
    // Add to rolling window
    this.searchMetrics.searchTimestamps.push({
      timestamp: Date.now(),
      count: 1
    })
    
    // Keep window size limited
    if (this.searchMetrics.searchTimestamps.length > this.MAX_TIMESTAMPS) {
      this.searchMetrics.searchTimestamps.shift()
    }
    
    // Track search term (limit to top N)
    const termCount = (this.searchMetrics.topSearchTerms.get(searchTerm) || 0) + 1
    this.searchMetrics.topSearchTerms.set(searchTerm, termCount)
    
    // Prune if too many terms
    if (this.searchMetrics.topSearchTerms.size > this.MAX_SEARCH_TERMS * 2) {
      this.pruneSearchTerms()
    }
  }
  
  /**
   * Track verb type (lightweight)
   */
  trackVerbType(type: string): void {
    this.verbTypes.set(type, (this.verbTypes.get(type) || 0) + 1)
  }
  
  /**
   * Update storage size estimates (called periodically, not on every operation)
   */
  updateStorageSizes(sizes: {
    nouns: number
    verbs: number
    metadata: number
    index: number
  }): void {
    this.storageSizeCache = {
      lastUpdated: Date.now(),
      sizes
    }
  }
  
  /**
   * Get comprehensive statistics
   */
  getStatistics(): Partial<StatisticsData> {
    const now = Date.now()
    const hourAgo = now - 3600000
    const dayAgo = now - 86400000
    const weekAgo = now - 604800000
    const monthAgo = now - 2592000000
    
    // Calculate data freshness
    const updatesLastHour = this.updateTimestamps.filter(t => t.timestamp > hourAgo).length
    const updatesLastDay = this.updateTimestamps.filter(t => t.timestamp > dayAgo).length
    
    // Calculate age distribution
    const ageDistribution = {
      last24h: 0,
      last7d: 0,
      last30d: 0,
      older: 0
    }
    
    // Estimate based on update patterns (not scanning all data)
    const totalUpdates = this.updateTimestamps.length
    if (totalUpdates > 0) {
      const recentUpdates = this.updateTimestamps.filter(t => t.timestamp > dayAgo).length
      const weekUpdates = this.updateTimestamps.filter(t => t.timestamp > weekAgo).length
      const monthUpdates = this.updateTimestamps.filter(t => t.timestamp > monthAgo).length
      
      ageDistribution.last24h = Math.round((recentUpdates / totalUpdates) * 100)
      ageDistribution.last7d = Math.round(((weekUpdates - recentUpdates) / totalUpdates) * 100)
      ageDistribution.last30d = Math.round(((monthUpdates - weekUpdates) / totalUpdates) * 100)
      ageDistribution.older = 100 - ageDistribution.last24h - ageDistribution.last7d - ageDistribution.last30d
    }
    
    // Calculate search metrics
    const searchesLastHour = this.searchMetrics.searchTimestamps.filter(t => t.timestamp > hourAgo).length
    const searchesLastDay = this.searchMetrics.searchTimestamps.filter(t => t.timestamp > dayAgo).length
    const avgSearchTime = this.searchMetrics.totalSearches > 0 
      ? this.searchMetrics.totalSearchTimeMs / this.searchMetrics.totalSearches 
      : 0
    
    // Get top search terms
    const topSearchTerms = Array.from(this.searchMetrics.topSearchTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term)
    
    // Calculate storage metrics
    const totalSize = Object.values(this.storageSizeCache.sizes).reduce((a, b) => a + b, 0)
    
    return {
      contentTypes: Object.fromEntries(this.contentTypes),
      
      dataFreshness: {
        oldestEntry: new Date(this.oldestTimestamp).toISOString(),
        newestEntry: new Date(this.newestTimestamp).toISOString(),
        updatesLastHour,
        updatesLastDay,
        ageDistribution
      },
      
      storageMetrics: {
        totalSizeBytes: totalSize,
        nounsSizeBytes: this.storageSizeCache.sizes.nouns,
        verbsSizeBytes: this.storageSizeCache.sizes.verbs,
        metadataSizeBytes: this.storageSizeCache.sizes.metadata,
        indexSizeBytes: this.storageSizeCache.sizes.index
      },
      
      searchMetrics: {
        totalSearches: this.searchMetrics.totalSearches,
        averageSearchTimeMs: avgSearchTime,
        searchesLastHour,
        searchesLastDay,
        topSearchTerms
      },
      
      verbStatistics: {
        totalVerbs: Array.from(this.verbTypes.values()).reduce((a, b) => a + b, 0),
        verbTypes: Object.fromEntries(this.verbTypes),
        averageConnectionsPerVerb: 2 // Verbs connect 2 nouns
      }
    }
  }
  
  /**
   * Merge statistics from storage (for distributed systems)
   */
  mergeFromStorage(stored: Partial<StatisticsData>): void {
    // Merge content types
    if (stored.contentTypes) {
      for (const [type, count] of Object.entries(stored.contentTypes)) {
        this.contentTypes.set(type, count)
      }
    }
    
    // Merge verb types
    if (stored.verbStatistics?.verbTypes) {
      for (const [type, count] of Object.entries(stored.verbStatistics.verbTypes)) {
        this.verbTypes.set(type, count)
      }
    }
    
    // Merge search metrics
    if (stored.searchMetrics) {
      this.searchMetrics.totalSearches = stored.searchMetrics.totalSearches || 0
      this.searchMetrics.totalSearchTimeMs = (stored.searchMetrics.averageSearchTimeMs || 0) * this.searchMetrics.totalSearches
    }
    
    // Merge data freshness
    if (stored.dataFreshness) {
      this.oldestTimestamp = new Date(stored.dataFreshness.oldestEntry).getTime()
      this.newestTimestamp = new Date(stored.dataFreshness.newestEntry).getTime()
    }
  }
  
  /**
   * Reset statistics (for testing)
   */
  reset(): void {
    this.contentTypes.clear()
    this.verbTypes.clear()
    this.updateTimestamps = []
    this.searchMetrics = {
      totalSearches: 0,
      totalSearchTimeMs: 0,
      searchTimestamps: [],
      topSearchTerms: new Map()
    }
    this.oldestTimestamp = Date.now()
    this.newestTimestamp = Date.now()
  }
  
  private pruneSearchTerms(): void {
    // Keep only top N search terms
    const sorted = Array.from(this.searchMetrics.topSearchTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.MAX_SEARCH_TERMS)
    
    this.searchMetrics.topSearchTerms.clear()
    for (const [term, count] of sorted) {
      this.searchMetrics.topSearchTerms.set(term, count)
    }
  }
}