/**
 * Intelligent cache auto-configuration system
 * Adapts cache settings based on environment, usage patterns, and storage type
 */

import { SearchCacheConfig } from './searchCache.js'
import { BrainyDataConfig } from '../brainyData.js'

export interface CacheUsageStats {
  totalQueries: number
  repeatQueries: number
  avgQueryTime: number
  memoryPressure: number
  storageType: 'memory' | 'opfs' | 's3' | 'filesystem'
  isDistributed: boolean
  changeFrequency: number // changes per minute
  readWriteRatio: number // reads / writes
}

export interface AutoConfigResult {
  cacheConfig: SearchCacheConfig
  realtimeConfig: NonNullable<BrainyDataConfig['realtimeUpdates']>
  reasoning: string[]
}

export class CacheAutoConfigurator {
  private stats: CacheUsageStats = {
    totalQueries: 0,
    repeatQueries: 0,
    avgQueryTime: 50,
    memoryPressure: 0,
    storageType: 'memory',
    isDistributed: false,
    changeFrequency: 0,
    readWriteRatio: 10,
  }

  private configHistory: AutoConfigResult[] = []
  private lastOptimization = 0

  /**
   * Auto-detect optimal cache configuration based on current conditions
   */
  public autoDetectOptimalConfig(
    storageConfig?: BrainyDataConfig['storage'],
    currentStats?: Partial<CacheUsageStats>
  ): AutoConfigResult {
    // Update stats with current information
    if (currentStats) {
      this.stats = { ...this.stats, ...currentStats }
    }

    // Detect environment characteristics
    this.detectEnvironment(storageConfig)

    // Generate optimal configuration
    const result = this.generateOptimalConfig()

    // Store for learning
    this.configHistory.push(result)
    this.lastOptimization = Date.now()

    return result
  }

  /**
   * Dynamically adjust configuration based on runtime performance
   */
  public adaptConfiguration(
    currentConfig: SearchCacheConfig,
    performanceMetrics: {
      hitRate: number
      avgResponseTime: number
      memoryUsage: number
      externalChangesDetected: number
      timeSinceLastChange: number
    }
  ): AutoConfigResult | null {
    const reasoning: string[] = []
    let needsUpdate = false

    // Check if we should update (don't over-optimize)
    if (Date.now() - this.lastOptimization < 60000) {
      return null // Wait at least 1 minute between optimizations
    }

    // Analyze performance patterns
    const adaptations: Partial<SearchCacheConfig> = {}

    // Low hit rate → adjust cache size or TTL
    if (performanceMetrics.hitRate < 0.3) {
      if (performanceMetrics.externalChangesDetected > 5) {
        // Too many external changes → shorter TTL
        adaptations.maxAge = Math.max(60000, currentConfig.maxAge! * 0.7)
        reasoning.push('Reduced cache TTL due to frequent external changes')
        needsUpdate = true
      } else {
        // Expand cache size for better hit rate
        adaptations.maxSize = Math.min(500, (currentConfig.maxSize || 100) * 1.5)
        reasoning.push('Increased cache size due to low hit rate')
        needsUpdate = true
      }
    }

    // High hit rate but slow responses → might need cache warming
    if (performanceMetrics.hitRate > 0.8 && performanceMetrics.avgResponseTime > 100) {
      reasoning.push('High hit rate but slow responses - consider cache warming')
    }

    // Memory pressure → reduce cache size
    if (performanceMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      adaptations.maxSize = Math.max(20, (currentConfig.maxSize || 100) * 0.7)
      reasoning.push('Reduced cache size due to memory pressure')
      needsUpdate = true
    }

    // Recent external changes → adaptive TTL
    if (performanceMetrics.timeSinceLastChange < 30000) { // 30 seconds
      adaptations.maxAge = Math.max(30000, currentConfig.maxAge! * 0.8)
      reasoning.push('Shortened TTL due to recent external changes')
      needsUpdate = true
    }

    if (!needsUpdate) {
      return null
    }

    const newCacheConfig: SearchCacheConfig = {
      ...currentConfig,
      ...adaptations
    }

    const newRealtimeConfig = this.calculateRealtimeConfig()

    return {
      cacheConfig: newCacheConfig,
      realtimeConfig: newRealtimeConfig,
      reasoning
    }
  }

  /**
   * Get recommended configuration for specific use case
   */
  public getRecommendedConfig(useCase: 'high-consistency' | 'balanced' | 'performance-first'): AutoConfigResult {
    const configs = {
      'high-consistency': {
        cache: { maxAge: 120000, maxSize: 50 },
        realtime: { interval: 15000, enabled: true },
        reasoning: ['Optimized for data consistency and real-time updates']
      },
      'balanced': {
        cache: { maxAge: 300000, maxSize: 100 },
        realtime: { interval: 30000, enabled: true },
        reasoning: ['Balanced performance and consistency']
      },
      'performance-first': {
        cache: { maxAge: 600000, maxSize: 200 },
        realtime: { interval: 60000, enabled: true },
        reasoning: ['Optimized for maximum cache performance']
      }
    }

    const config = configs[useCase]
    return {
      cacheConfig: {
        enabled: true,
        ...config.cache
      },
      realtimeConfig: {
        updateIndex: true,
        updateStatistics: true,
        ...config.realtime
      },
      reasoning: config.reasoning
    }
  }

  /**
   * Learn from usage patterns and improve recommendations
   */
  public learnFromUsage(usageData: {
    queryPatterns: string[]
    responseTime: number
    cacheHits: number
    totalQueries: number
    dataChanges: number
    timeWindow: number
  }): void {
    // Update internal stats for better future recommendations
    this.stats.totalQueries += usageData.totalQueries
    this.stats.repeatQueries += usageData.cacheHits
    this.stats.avgQueryTime = (this.stats.avgQueryTime + usageData.responseTime) / 2
    this.stats.changeFrequency = usageData.dataChanges / (usageData.timeWindow / 60000)

    // Calculate read/write ratio
    const writes = usageData.dataChanges
    const reads = usageData.totalQueries
    this.stats.readWriteRatio = reads > 0 ? reads / Math.max(writes, 1) : 10
  }

  private detectEnvironment(storageConfig?: BrainyDataConfig['storage']): void {
    // Detect storage type
    if (storageConfig?.s3Storage || storageConfig?.customS3Storage) {
      this.stats.storageType = 's3'
      this.stats.isDistributed = true
    } else if (storageConfig?.forceFileSystemStorage) {
      this.stats.storageType = 'filesystem'
    } else if (storageConfig?.forceMemoryStorage) {
      this.stats.storageType = 'memory'
    } else {
      // Auto-detect browser vs Node.js
      this.stats.storageType = typeof window !== 'undefined' ? 'opfs' : 'filesystem'
    }

    // Detect distributed mode indicators
    this.stats.isDistributed = this.stats.isDistributed || 
      Boolean(storageConfig?.s3Storage || storageConfig?.customS3Storage)
  }

  private generateOptimalConfig(): AutoConfigResult {
    const reasoning: string[] = []
    
    // Base configuration
    let cacheConfig: SearchCacheConfig = {
      enabled: true,
      maxSize: 100,
      maxAge: 300000, // 5 minutes
      hitCountWeight: 0.3
    }

    let realtimeConfig = {
      enabled: false,
      interval: 60000,
      updateIndex: true,
      updateStatistics: true
    }

    // Adjust for storage type
    if (this.stats.storageType === 's3' || this.stats.isDistributed) {
      cacheConfig.maxAge = 180000 // 3 minutes for distributed
      realtimeConfig.enabled = true
      realtimeConfig.interval = 30000 // 30 seconds
      reasoning.push('Distributed storage detected - enabled real-time updates')
      reasoning.push('Reduced cache TTL for distributed consistency')
    }

    // Adjust for read/write patterns
    if (this.stats.readWriteRatio > 20) {
      // Read-heavy workload
      cacheConfig.maxSize = Math.min(300, (cacheConfig.maxSize || 100) * 2)
      cacheConfig.maxAge = Math.min(900000, (cacheConfig.maxAge || 300000) * 1.5) // Up to 15 minutes
      reasoning.push('Read-heavy workload detected - increased cache size and TTL')
    } else if (this.stats.readWriteRatio < 5) {
      // Write-heavy workload
      cacheConfig.maxSize = Math.max(50, (cacheConfig.maxSize || 100) * 0.7)
      cacheConfig.maxAge = Math.max(60000, (cacheConfig.maxAge || 300000) * 0.6)
      reasoning.push('Write-heavy workload detected - reduced cache size and TTL')
    }

    // Adjust for change frequency
    if (this.stats.changeFrequency > 10) { // More than 10 changes per minute
      realtimeConfig.interval = Math.max(10000, realtimeConfig.interval * 0.5)
      cacheConfig.maxAge = Math.max(30000, (cacheConfig.maxAge || 300000) * 0.5)
      reasoning.push('High change frequency detected - increased update frequency')
    }

    // Memory constraints
    if (this.detectMemoryConstraints()) {
      cacheConfig.maxSize = Math.max(20, (cacheConfig.maxSize || 100) * 0.6)
      reasoning.push('Memory constraints detected - reduced cache size')
    }

    // Performance optimization
    if (this.stats.avgQueryTime > 200) {
      cacheConfig.maxSize = Math.min(500, (cacheConfig.maxSize || 100) * 1.5)
      reasoning.push('Slow queries detected - increased cache size')
    }

    return {
      cacheConfig,
      realtimeConfig,
      reasoning
    }
  }

  private calculateRealtimeConfig() {
    return {
      enabled: this.stats.isDistributed || this.stats.changeFrequency > 1,
      interval: this.stats.isDistributed ? 30000 : 60000,
      updateIndex: true,
      updateStatistics: true
    }
  }

  private detectMemoryConstraints(): boolean {
    // Simple heuristic for memory constraints
    try {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memInfo = (performance as any).memory
        return memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.8
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Default assumption for constrained environments
    return false
  }

  /**
   * Get human-readable explanation of current configuration
   */
  public getConfigExplanation(config: AutoConfigResult): string {
    const lines = [
      '🤖 Brainy Auto-Configuration:',
      '',
      `📊 Cache: ${config.cacheConfig.maxSize} queries, ${config.cacheConfig.maxAge! / 1000}s TTL`,
      `🔄 Updates: ${config.realtimeConfig.enabled ? `Every ${(config.realtimeConfig.interval || 30000) / 1000}s` : 'Disabled'}`,
      '',
      '🎯 Optimizations applied:'
    ]

    config.reasoning.forEach(reason => {
      lines.push(`  • ${reason}`)
    })

    return lines.join('\n')
  }
}