/**
 * Base Storage Adapter
 * Provides common functionality for all storage adapters, including statistics tracking
 */

import { StatisticsData, StorageAdapter } from '../../coreTypes.js'
import { extractFieldNamesFromJson, mapToStandardField } from '../../utils/fieldNameTracking.js'

/**
 * Base class for storage adapters that implements statistics tracking
 */
export abstract class BaseStorageAdapter implements StorageAdapter {
  // Abstract methods that must be implemented by subclasses
  abstract init(): Promise<void>

  abstract saveNoun(noun: any): Promise<void>

  abstract getNoun(id: string): Promise<any | null>

  abstract getNounsByNounType(nounType: string): Promise<any[]>

  abstract deleteNoun(id: string): Promise<void>

  abstract saveVerb(verb: any): Promise<void>

  abstract getVerb(id: string): Promise<any | null>

  abstract getVerbsBySource(sourceId: string): Promise<any[]>

  abstract getVerbsByTarget(targetId: string): Promise<any[]>

  abstract getVerbsByType(type: string): Promise<any[]>

  abstract deleteVerb(id: string): Promise<void>

  abstract saveMetadata(id: string, metadata: any): Promise<void>

  abstract getMetadata(id: string): Promise<any | null>

  abstract saveVerbMetadata(id: string, metadata: any): Promise<void>

  abstract getVerbMetadata(id: string): Promise<any | null>

  abstract clear(): Promise<void>

  abstract getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }>

  // NOTE: getAllNouns and getAllVerbs have been removed to prevent expensive full scans.
  // Use getNouns() and getVerbs() with pagination instead.

  /**
   * Get nouns with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of nouns
   */
  abstract getNouns(options?: {
    pagination?: {
      offset?: number
      limit?: number
      cursor?: string
    }
    filter?: {
      nounType?: string | string[]
      service?: string | string[]
      metadata?: Record<string, any>
    }
  }): Promise<{
    items: any[]
    totalCount?: number
    hasMore: boolean
    nextCursor?: string
  }>

  /**
   * Get verbs with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of verbs
   */
  abstract getVerbs(options?: {
    pagination?: {
      offset?: number
      limit?: number
      cursor?: string
    }
    filter?: {
      verbType?: string | string[]
      sourceId?: string | string[]
      targetId?: string | string[]
      service?: string | string[]
      metadata?: Record<string, any>
    }
  }): Promise<{
    items: any[]
    totalCount?: number
    hasMore: boolean
    nextCursor?: string
  }>

  // Statistics cache
  protected statisticsCache: StatisticsData | null = null

  // Batch update timer ID
  protected statisticsBatchUpdateTimerId: NodeJS.Timeout | null = null

  // Flag to indicate if statistics have been modified since last save
  protected statisticsModified = false

  // Time of last statistics flush to storage
  protected lastStatisticsFlushTime = 0

  // Minimum time between statistics flushes (5 seconds)
  protected readonly MIN_FLUSH_INTERVAL_MS = 5000

  // Maximum time to wait before flushing statistics (30 seconds)
  protected readonly MAX_FLUSH_DELAY_MS = 30000

  // Throttling tracking properties
  protected throttlingDetected = false
  protected throttlingBackoffMs = 1000 // Start with 1 second
  protected maxBackoffMs = 30000 // Max 30 seconds
  protected consecutiveThrottleEvents = 0
  protected lastThrottleTime = 0
  protected totalThrottleEvents = 0
  protected throttleEventsByHour: number[] = new Array(24).fill(0)
  protected throttleReasons: Record<string, number> = {}
  protected lastThrottleHourIndex = -1
  
  // Operation impact tracking
  protected delayedOperations = 0
  protected retriedOperations = 0
  protected failedDueToThrottling = 0
  protected totalDelayMs = 0
  
  // Service-level throttling
  protected serviceThrottling: Map<string, {
    throttleCount: number
    lastThrottle: number
    status: 'normal' | 'throttled' | 'recovering'
  }> = new Map()

  // Statistics-specific methods that must be implemented by subclasses
  protected abstract saveStatisticsData(
    statistics: StatisticsData
  ): Promise<void>

  protected abstract getStatisticsData(): Promise<StatisticsData | null>

  /**
   * Save statistics data
   * @param statistics The statistics data to save
   */
  async saveStatistics(statistics: StatisticsData): Promise<void> {
    // Update the cache with a deep copy to avoid reference issues
    this.statisticsCache = {
      nounCount: { ...statistics.nounCount },
      verbCount: { ...statistics.verbCount },
      metadataCount: { ...statistics.metadataCount },
      hnswIndexSize: statistics.hnswIndexSize,
      lastUpdated: statistics.lastUpdated,
      // Include serviceActivity if present
      ...(statistics.serviceActivity && {
        serviceActivity: Object.fromEntries(
          Object.entries(statistics.serviceActivity).map(([k, v]) => [k, {...v}])
        )
      }),
      // Include services if present
      ...(statistics.services && {
        services: statistics.services.map(s => ({...s}))
      })
    }

    // Schedule a batch update instead of saving immediately
    this.scheduleBatchUpdate()
  }

  /**
   * Get statistics data
   * @returns Promise that resolves to the statistics data
   */
  async getStatistics(): Promise<StatisticsData | null> {
    // If we have cached statistics, return a deep copy
    if (this.statisticsCache) {
      return {
        nounCount: { ...this.statisticsCache.nounCount },
        verbCount: { ...this.statisticsCache.verbCount },
        metadataCount: { ...this.statisticsCache.metadataCount },
        hnswIndexSize: this.statisticsCache.hnswIndexSize,
        lastUpdated: this.statisticsCache.lastUpdated
      }
    }

    // Otherwise, get from storage
    const statistics = await this.getStatisticsData()

    // If we found statistics, update the cache
    if (statistics) {
      // Update the cache with a deep copy
      this.statisticsCache = {
        nounCount: { ...statistics.nounCount },
        verbCount: { ...statistics.verbCount },
        metadataCount: { ...statistics.metadataCount },
        hnswIndexSize: statistics.hnswIndexSize,
        lastUpdated: statistics.lastUpdated
      }
    }

    return statistics
  }

  /**
   * Schedule a batch update of statistics
   */
  protected scheduleBatchUpdate(): void {
    // Mark statistics as modified
    this.statisticsModified = true

    // If a timer is already set, don't set another one
    if (this.statisticsBatchUpdateTimerId !== null) {
      return
    }

    // Calculate time since last flush
    const now = Date.now()
    const timeSinceLastFlush = now - this.lastStatisticsFlushTime

    // If we've recently flushed, wait longer before the next flush
    const delayMs =
      timeSinceLastFlush < this.MIN_FLUSH_INTERVAL_MS
        ? this.MAX_FLUSH_DELAY_MS
        : this.MIN_FLUSH_INTERVAL_MS

    // Schedule the batch update
    this.statisticsBatchUpdateTimerId = setTimeout(() => {
      this.flushStatistics()
    }, delayMs)
  }

  /**
   * Flush statistics to storage
   */
  protected async flushStatistics(): Promise<void> {
    // Clear the timer
    if (this.statisticsBatchUpdateTimerId !== null) {
      clearTimeout(this.statisticsBatchUpdateTimerId)
      this.statisticsBatchUpdateTimerId = null
    }

    // If statistics haven't been modified, no need to flush
    if (!this.statisticsModified || !this.statisticsCache) {
      return
    }

    try {
      // Save the statistics to storage
      await this.saveStatisticsData(this.statisticsCache)

      // Update the last flush time
      this.lastStatisticsFlushTime = Date.now()
      // Reset the modified flag
      this.statisticsModified = false
    } catch (error) {
      console.error('Failed to flush statistics data:', error)
      // Mark as still modified so we'll try again later
      this.statisticsModified = true
      // Don't throw the error to avoid disrupting the application
    }
  }

  /**
   * Increment a statistic counter
   * @param type The type of statistic to increment ('noun', 'verb', 'metadata')
   * @param service The service that inserted the data
   * @param amount The amount to increment by (default: 1)
   */
  async incrementStatistic(
    type: 'noun' | 'verb' | 'metadata',
    service: string,
    amount: number = 1
  ): Promise<void> {
    // Get current statistics from cache or storage
    let statistics = this.statisticsCache
    if (!statistics) {
      statistics = await this.getStatisticsData()
      if (!statistics) {
        statistics = this.createDefaultStatistics()
      }

      // Update the cache
      this.statisticsCache = {
        nounCount: { ...statistics.nounCount },
        verbCount: { ...statistics.verbCount },
        metadataCount: { ...statistics.metadataCount },
        hnswIndexSize: statistics.hnswIndexSize,
        lastUpdated: statistics.lastUpdated,
        // Include serviceActivity if present
        ...(statistics.serviceActivity && {
          serviceActivity: Object.fromEntries(
            Object.entries(statistics.serviceActivity).map(([k, v]) => [k, {...v}])
          )
        }),
        // Include services if present
        ...(statistics.services && {
          services: statistics.services.map(s => ({...s}))
        })
      }
    }

    // Increment the appropriate counter
    const counterMap = {
      noun: this.statisticsCache!.nounCount,
      verb: this.statisticsCache!.verbCount,
      metadata: this.statisticsCache!.metadataCount
    }

    const counter = counterMap[type]
    counter[service] = (counter[service] || 0) + amount

    // Track service activity
    this.trackServiceActivity(service, 'add')

    // Update timestamp
    this.statisticsCache!.lastUpdated = new Date().toISOString()

    // Schedule a batch update instead of saving immediately
    this.scheduleBatchUpdate()
  }

  /**
   * Track service activity (first/last activity, operation counts)
   * @param service The service name
   * @param operation The operation type
   */
  protected trackServiceActivity(
    service: string,
    operation: 'add' | 'update' | 'delete'
  ): void {
    if (!this.statisticsCache) {
      return
    }

    // Initialize serviceActivity if it doesn't exist
    if (!this.statisticsCache.serviceActivity) {
      this.statisticsCache.serviceActivity = {}
    }

    const now = new Date().toISOString()
    const activity = this.statisticsCache.serviceActivity[service]

    if (!activity) {
      // First activity for this service
      this.statisticsCache.serviceActivity[service] = {
        firstActivity: now,
        lastActivity: now,
        totalOperations: 1
      }
    } else {
      // Update existing activity
      activity.lastActivity = now
      activity.totalOperations++
    }
  }

  /**
   * Decrement a statistic counter
   * @param type The type of statistic to decrement ('noun', 'verb', 'metadata')
   * @param service The service that inserted the data
   * @param amount The amount to decrement by (default: 1)
   */
  async decrementStatistic(
    type: 'noun' | 'verb' | 'metadata',
    service: string,
    amount: number = 1
  ): Promise<void> {
    // Get current statistics from cache or storage
    let statistics = this.statisticsCache
    if (!statistics) {
      statistics = await this.getStatisticsData()
      if (!statistics) {
        statistics = this.createDefaultStatistics()
      }

      // Update the cache
      this.statisticsCache = {
        nounCount: { ...statistics.nounCount },
        verbCount: { ...statistics.verbCount },
        metadataCount: { ...statistics.metadataCount },
        hnswIndexSize: statistics.hnswIndexSize,
        lastUpdated: statistics.lastUpdated,
        // Include serviceActivity if present
        ...(statistics.serviceActivity && {
          serviceActivity: Object.fromEntries(
            Object.entries(statistics.serviceActivity).map(([k, v]) => [k, {...v}])
          )
        }),
        // Include services if present
        ...(statistics.services && {
          services: statistics.services.map(s => ({...s}))
        })
      }
    }

    // Decrement the appropriate counter
    const counterMap = {
      noun: this.statisticsCache!.nounCount,
      verb: this.statisticsCache!.verbCount,
      metadata: this.statisticsCache!.metadataCount
    }

    const counter = counterMap[type]
    counter[service] = Math.max(0, (counter[service] || 0) - amount)

    // Track service activity
    this.trackServiceActivity(service, 'delete')

    // Update timestamp
    this.statisticsCache!.lastUpdated = new Date().toISOString()

    // Schedule a batch update instead of saving immediately
    this.scheduleBatchUpdate()
  }

  /**
   * Update the HNSW index size statistic
   * @param size The new size of the HNSW index
   */
  async updateHnswIndexSize(size: number): Promise<void> {
    // Get current statistics from cache or storage
    let statistics = this.statisticsCache
    if (!statistics) {
      statistics = await this.getStatisticsData()
      if (!statistics) {
        statistics = this.createDefaultStatistics()
      }

      // Update the cache
      this.statisticsCache = {
        nounCount: { ...statistics.nounCount },
        verbCount: { ...statistics.verbCount },
        metadataCount: { ...statistics.metadataCount },
        hnswIndexSize: statistics.hnswIndexSize,
        lastUpdated: statistics.lastUpdated,
        // Include serviceActivity if present
        ...(statistics.serviceActivity && {
          serviceActivity: Object.fromEntries(
            Object.entries(statistics.serviceActivity).map(([k, v]) => [k, {...v}])
          )
        }),
        // Include services if present
        ...(statistics.services && {
          services: statistics.services.map(s => ({...s}))
        })
      }
    }

    // Update HNSW index size
    this.statisticsCache!.hnswIndexSize = size

    // Update timestamp
    this.statisticsCache!.lastUpdated = new Date().toISOString()

    // Schedule a batch update instead of saving immediately
    this.scheduleBatchUpdate()
  }

  /**
   * Force an immediate flush of statistics to storage
   * This ensures that any pending statistics updates are written to persistent storage
   */
  async flushStatisticsToStorage(): Promise<void> {
    // If there are no statistics in cache or they haven't been modified, nothing to flush
    if (!this.statisticsCache || !this.statisticsModified) {
      return
    }

    // Call the protected flushStatistics method to immediately write to storage
    await this.flushStatistics()
  }

  /**
   * Track field names from a JSON document
   * @param jsonDocument The JSON document to extract field names from
   * @param service The service that inserted the data
   */
  async trackFieldNames(jsonDocument: any, service: string): Promise<void> {
    // Skip if not a JSON object
    if (typeof jsonDocument !== 'object' || jsonDocument === null || Array.isArray(jsonDocument)) {
      return
    }

    // Get current statistics from cache or storage
    let statistics = this.statisticsCache
    if (!statistics) {
      statistics = await this.getStatisticsData()
      if (!statistics) {
        statistics = this.createDefaultStatistics()
      }

      // Update the cache
      this.statisticsCache = {
        ...statistics,
        nounCount: { ...statistics.nounCount },
        verbCount: { ...statistics.verbCount },
        metadataCount: { ...statistics.metadataCount },
        fieldNames: { ...statistics.fieldNames },
        standardFieldMappings: { ...statistics.standardFieldMappings }
      }
    }

    // Ensure fieldNames exists
    if (!this.statisticsCache!.fieldNames) {
      this.statisticsCache!.fieldNames = {}
    }

    // Ensure standardFieldMappings exists
    if (!this.statisticsCache!.standardFieldMappings) {
      this.statisticsCache!.standardFieldMappings = {}
    }

    // Extract field names from the JSON document
    const fieldNames = extractFieldNamesFromJson(jsonDocument)

    // Initialize service entry if it doesn't exist
    if (!this.statisticsCache!.fieldNames[service]) {
      this.statisticsCache!.fieldNames[service] = []
    }

    // Add new field names to the service's list
    for (const fieldName of fieldNames) {
      if (!this.statisticsCache!.fieldNames[service].includes(fieldName)) {
        this.statisticsCache!.fieldNames[service].push(fieldName)
      }

      // Map to standard field if possible
      const standardField = mapToStandardField(fieldName)
      if (standardField) {
        // Initialize standard field entry if it doesn't exist
        if (!this.statisticsCache!.standardFieldMappings[standardField]) {
          this.statisticsCache!.standardFieldMappings[standardField] = {}
        }

        // Initialize service entry if it doesn't exist
        if (!this.statisticsCache!.standardFieldMappings[standardField][service]) {
          this.statisticsCache!.standardFieldMappings[standardField][service] = []
        }

        // Add field name to standard field mapping if not already there
        if (!this.statisticsCache!.standardFieldMappings[standardField][service].includes(fieldName)) {
          this.statisticsCache!.standardFieldMappings[standardField][service].push(fieldName)
        }
      }
    }

    // Update timestamp
    this.statisticsCache!.lastUpdated = new Date().toISOString()

    // Schedule a batch update
    this.statisticsModified = true
    this.scheduleBatchUpdate()
  }

  /**
   * Get available field names by service
   * @returns Record of field names by service
   */
  async getAvailableFieldNames(): Promise<Record<string, string[]>> {
    // Get current statistics from cache or storage
    let statistics = this.statisticsCache
    if (!statistics) {
      statistics = await this.getStatisticsData()
      if (!statistics) {
        return {}
      }
    }

    // Return field names by service
    return statistics.fieldNames || {}
  }

  /**
   * Get standard field mappings
   * @returns Record of standard field mappings
   */
  async getStandardFieldMappings(): Promise<Record<string, Record<string, string[]>>> {
    // Get current statistics from cache or storage
    let statistics = this.statisticsCache
    if (!statistics) {
      statistics = await this.getStatisticsData()
      if (!statistics) {
        return {}
      }
    }

    // Return standard field mappings
    return statistics.standardFieldMappings || {}
  }

  /**
   * Create default statistics data
   * @returns Default statistics data
   */
  protected createDefaultStatistics(): StatisticsData {
    return {
      nounCount: {},
      verbCount: {},
      metadataCount: {},
      hnswIndexSize: 0,
      fieldNames: {},
      standardFieldMappings: {},
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Detect if an error is a throttling error
   * Override this method in specific adapters for custom detection
   */
  protected isThrottlingError(error: any): boolean {
    const statusCode = error.$metadata?.httpStatusCode || error.statusCode || error.code
    const message = error.message?.toLowerCase() || ''
    
    return (
      statusCode === 429 || // Too Many Requests
      statusCode === 503 || // Service Unavailable / Slow Down
      statusCode === 'ECONNRESET' || // Connection reset
      statusCode === 'ETIMEDOUT' || // Timeout
      message.includes('throttl') ||
      message.includes('slow down') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded')
    )
  }

  /**
   * Track a throttling event
   * @param error The error that caused throttling
   * @param service Optional service that was throttled
   */
  protected trackThrottlingEvent(error: any, service?: string): void {
    this.throttlingDetected = true
    this.consecutiveThrottleEvents++
    this.lastThrottleTime = Date.now()
    this.totalThrottleEvents++
    
    // Track by hour
    const hourIndex = new Date().getHours()
    if (hourIndex !== this.lastThrottleHourIndex) {
      // Reset hour tracking if we've moved to a new hour
      this.throttleEventsByHour = new Array(24).fill(0)
      this.lastThrottleHourIndex = hourIndex
    }
    this.throttleEventsByHour[hourIndex]++
    
    // Track throttle reason
    const reason = this.getThrottleReason(error)
    this.throttleReasons[reason] = (this.throttleReasons[reason] || 0) + 1
    
    // Track service-level throttling
    if (service) {
      const serviceInfo = this.serviceThrottling.get(service) || {
        throttleCount: 0,
        lastThrottle: 0,
        status: 'normal' as const
      }
      
      serviceInfo.throttleCount++
      serviceInfo.lastThrottle = Date.now()
      serviceInfo.status = 'throttled'
      
      this.serviceThrottling.set(service, serviceInfo)
    }
    
    // Exponential backoff
    this.throttlingBackoffMs = Math.min(
      this.throttlingBackoffMs * 2,
      this.maxBackoffMs
    )
  }

  /**
   * Get the reason for throttling from an error
   */
  protected getThrottleReason(error: any): string {
    const statusCode = error.$metadata?.httpStatusCode || error.statusCode || error.code
    
    if (statusCode === 429) return '429_TooManyRequests'
    if (statusCode === 503) return '503_ServiceUnavailable'
    if (statusCode === 'ECONNRESET') return 'ConnectionReset'
    if (statusCode === 'ETIMEDOUT') return 'Timeout'
    
    const message = error.message?.toLowerCase() || ''
    if (message.includes('throttl')) return 'Throttled'
    if (message.includes('slow down')) return 'SlowDown'
    if (message.includes('rate limit')) return 'RateLimit'
    if (message.includes('quota exceeded')) return 'QuotaExceeded'
    
    return 'Unknown'
  }

  /**
   * Clear throttling state after successful operations
   */
  protected clearThrottlingState(): void {
    if (this.consecutiveThrottleEvents > 0) {
      this.consecutiveThrottleEvents = 0
      this.throttlingBackoffMs = 1000 // Reset to initial backoff
      
      if (this.throttlingDetected) {
        this.throttlingDetected = false
        
        // Update service statuses
        for (const [service, info] of this.serviceThrottling) {
          if (info.status === 'throttled') {
            info.status = 'recovering'
          } else if (info.status === 'recovering') {
            const timeSinceThrottle = Date.now() - info.lastThrottle
            if (timeSinceThrottle > 60000) { // 1 minute recovery period
              info.status = 'normal'
            }
          }
        }
      }
    }
  }

  /**
   * Handle throttling by implementing exponential backoff
   * @param error The error that triggered throttling
   * @param service Optional service that was throttled
   */
  async handleThrottling(error: any, service?: string): Promise<void> {
    if (this.isThrottlingError(error)) {
      this.trackThrottlingEvent(error, service)
      
      // Add delay for retry
      const delayMs = this.throttlingBackoffMs
      this.totalDelayMs += delayMs
      this.delayedOperations++
      
      await new Promise(resolve => setTimeout(resolve, delayMs))
    } else {
      // Clear throttling state on non-throttling errors
      this.clearThrottlingState()
    }
  }

  /**
   * Track a retried operation
   */
  protected trackRetriedOperation(): void {
    this.retriedOperations++
  }

  /**
   * Track an operation that failed due to throttling
   */
  protected trackFailedDueToThrottling(): void {
    this.failedDueToThrottling++
  }

  /**
   * Get current throttling metrics
   */
  protected getThrottlingMetrics(): StatisticsData['throttlingMetrics'] {
    const averageDelayMs = this.delayedOperations > 0 
      ? this.totalDelayMs / this.delayedOperations 
      : 0

    // Convert service throttling map to record
    const serviceThrottlingRecord: Record<string, {
      throttleCount: number
      lastThrottle: string
      status: 'normal' | 'throttled' | 'recovering'
    }> = {}
    
    for (const [service, info] of this.serviceThrottling) {
      serviceThrottlingRecord[service] = {
        throttleCount: info.throttleCount,
        lastThrottle: new Date(info.lastThrottle).toISOString(),
        status: info.status
      }
    }

    return {
      storage: {
        currentlyThrottled: this.throttlingDetected,
        lastThrottleTime: this.lastThrottleTime > 0 
          ? new Date(this.lastThrottleTime).toISOString() 
          : undefined,
        consecutiveThrottleEvents: this.consecutiveThrottleEvents,
        currentBackoffMs: this.throttlingBackoffMs,
        totalThrottleEvents: this.totalThrottleEvents,
        throttleEventsByHour: [...this.throttleEventsByHour],
        throttleReasons: { ...this.throttleReasons }
      },
      operationImpact: {
        delayedOperations: this.delayedOperations,
        retriedOperations: this.retriedOperations,
        failedDueToThrottling: this.failedDueToThrottling,
        averageDelayMs,
        totalDelayMs: this.totalDelayMs
      },
      serviceThrottling: Object.keys(serviceThrottlingRecord).length > 0 
        ? serviceThrottlingRecord 
        : undefined
    }
  }

  /**
   * Include throttling metrics in statistics
   */
  async getStatisticsWithThrottling(): Promise<StatisticsData | null> {
    const stats = await this.getStatistics()
    if (stats) {
      stats.throttlingMetrics = this.getThrottlingMetrics()
    }
    return stats
  }
}
