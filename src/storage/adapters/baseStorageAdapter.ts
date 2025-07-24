/**
 * Base Storage Adapter
 * Provides common functionality for all storage adapters, including statistics tracking
 */

import { StatisticsData, StorageAdapter } from '../../coreTypes.js'

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

  // Statistics-specific methods
  protected abstract saveStatisticsData(statistics: StatisticsData): Promise<void>
  protected abstract getStatisticsData(): Promise<StatisticsData | null>

  /**
   * Save statistics data
   * @param statistics The statistics data to save
   */
  async saveStatistics(statistics: StatisticsData): Promise<void> {
    await this.saveStatisticsData(statistics)
  }

  /**
   * Get statistics data
   * @returns Promise that resolves to the statistics data
   */
  async getStatistics(): Promise<StatisticsData | null> {
    return await this.getStatisticsData()
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
    // Get current statistics or create default if not exists
    let statistics = await this.getStatisticsData()
    if (!statistics) {
      statistics = this.createDefaultStatistics()
    }

    // Increment the appropriate counter
    const counterMap = {
      noun: statistics.nounCount,
      verb: statistics.verbCount,
      metadata: statistics.metadataCount
    }

    const counter = counterMap[type]
    counter[service] = (counter[service] || 0) + amount

    // Update timestamp
    statistics.lastUpdated = new Date().toISOString()

    // Save updated statistics
    await this.saveStatisticsData(statistics)
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
    // Get current statistics or create default if not exists
    let statistics = await this.getStatisticsData()
    if (!statistics) {
      statistics = this.createDefaultStatistics()
    }

    // Decrement the appropriate counter
    const counterMap = {
      noun: statistics.nounCount,
      verb: statistics.verbCount,
      metadata: statistics.metadataCount
    }

    const counter = counterMap[type]
    counter[service] = Math.max(0, (counter[service] || 0) - amount)

    // Update timestamp
    statistics.lastUpdated = new Date().toISOString()

    // Save updated statistics
    await this.saveStatisticsData(statistics)
  }

  /**
   * Update the HNSW index size statistic
   * @param size The new size of the HNSW index
   */
  async updateHnswIndexSize(size: number): Promise<void> {
    // Get current statistics or create default if not exists
    let statistics = await this.getStatisticsData()
    if (!statistics) {
      statistics = this.createDefaultStatistics()
    }

    // Update HNSW index size
    statistics.hnswIndexSize = size

    // Update timestamp
    statistics.lastUpdated = new Date().toISOString()

    // Save updated statistics
    await this.saveStatisticsData(statistics)
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
      lastUpdated: new Date().toISOString()
    }
  }
}