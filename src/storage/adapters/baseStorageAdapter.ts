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

  abstract getAllNouns(): Promise<any[]>

  abstract getNounsByNounType(nounType: string): Promise<any[]>

  abstract deleteNoun(id: string): Promise<void>

  abstract saveVerb(verb: any): Promise<void>

  abstract getVerb(id: string): Promise<any | null>

  abstract getAllVerbs(): Promise<any[]>

  abstract getVerbsBySource(sourceId: string): Promise<any[]>

  abstract getVerbsByTarget(targetId: string): Promise<any[]>

  abstract getVerbsByType(type: string): Promise<any[]>

  abstract deleteVerb(id: string): Promise<void>

  abstract saveMetadata(id: string, metadata: any): Promise<void>

  abstract getMetadata(id: string): Promise<any | null>

  abstract clear(): Promise<void>

  abstract getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }>

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
      lastUpdated: statistics.lastUpdated
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
        lastUpdated: statistics.lastUpdated
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

    // Update timestamp
    this.statisticsCache!.lastUpdated = new Date().toISOString()

    // Schedule a batch update instead of saving immediately
    this.scheduleBatchUpdate()
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
        lastUpdated: statistics.lastUpdated
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
        lastUpdated: statistics.lastUpdated
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
}
