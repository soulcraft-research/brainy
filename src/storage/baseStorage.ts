/**
 * Base Storage Adapter
 * Provides common functionality for all storage adapters
 */

import { GraphVerb, HNSWNoun, StatisticsData } from '../coreTypes.js'
import { BaseStorageAdapter } from './adapters/baseStorageAdapter.js'

// Common directory/prefix names
export const NOUNS_DIR = 'nouns'
export const VERBS_DIR = 'verbs'
export const METADATA_DIR = 'metadata'
export const INDEX_DIR = 'index'
export const STATISTICS_KEY = 'statistics'

/**
 * Base storage adapter that implements common functionality
 * This is an abstract class that should be extended by specific storage adapters
 */
export abstract class BaseStorage extends BaseStorageAdapter {
  protected isInitialized = false

  /**
   * Initialize the storage adapter
   * This method should be implemented by each specific adapter
   */
  public abstract init(): Promise<void>

  /**
   * Ensure the storage adapter is initialized
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * Save a noun to storage
   */
  public async saveNoun(noun: HNSWNoun): Promise<void> {
    await this.ensureInitialized()
    return this.saveNoun_internal(noun)
  }

  /**
   * Get a noun from storage
   */
  public async getNoun(id: string): Promise<HNSWNoun | null> {
    await this.ensureInitialized()
    return this.getNoun_internal(id)
  }

  /**
   * Get all nouns from storage
   */
  public async getAllNouns(): Promise<HNSWNoun[]> {
    await this.ensureInitialized()
    return this.getAllNouns_internal()
  }

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   */
  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    await this.ensureInitialized()
    return this.getNounsByNounType_internal(nounType)
  }

  /**
   * Delete a noun from storage
   */
  public async deleteNoun(id: string): Promise<void> {
    await this.ensureInitialized()
    return this.deleteNoun_internal(id)
  }

  /**
   * Save a verb to storage
   */
  public async saveVerb(verb: GraphVerb): Promise<void> {
    await this.ensureInitialized()
    return this.saveVerb_internal(verb)
  }

  /**
   * Get a verb from storage
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    await this.ensureInitialized()
    return this.getVerb_internal(id)
  }

  /**
   * Get all verbs from storage
   */
  public async getAllVerbs(): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getAllVerbs_internal()
  }

  /**
   * Get verbs by source
   */
  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getVerbsBySource_internal(sourceId)
  }

  /**
   * Get verbs by target
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getVerbsByTarget_internal(targetId)
  }

  /**
   * Get verbs by type
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getVerbsByType_internal(type)
  }

  /**
   * Delete a verb from storage
   */
  public async deleteVerb(id: string): Promise<void> {
    await this.ensureInitialized()
    return this.deleteVerb_internal(id)
  }

  /**
   * Clear all data from storage
   * This method should be implemented by each specific adapter
   */
  public abstract clear(): Promise<void>

  /**
   * Get information about storage usage and capacity
   * This method should be implemented by each specific adapter
   */
  public abstract getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }>

  /**
   * Save metadata to storage
   * This method should be implemented by each specific adapter
   */
  public abstract saveMetadata(id: string, metadata: any): Promise<void>

  /**
   * Get metadata from storage
   * This method should be implemented by each specific adapter
   */
  public abstract getMetadata(id: string): Promise<any | null>

  /**
   * Save a noun to storage
   * This method should be implemented by each specific adapter
   */
  protected abstract saveNoun_internal(noun: HNSWNoun): Promise<void>

  /**
   * Get a noun from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getNoun_internal(id: string): Promise<HNSWNoun | null>

  /**
   * Get all nouns from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getAllNouns_internal(): Promise<HNSWNoun[]>

  /**
   * Get nouns by noun type
   * This method should be implemented by each specific adapter
   */
  protected abstract getNounsByNounType_internal(nounType: string): Promise<HNSWNoun[]>

  /**
   * Delete a noun from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract deleteNoun_internal(id: string): Promise<void>

  /**
   * Save a verb to storage
   * This method should be implemented by each specific adapter
   */
  protected abstract saveVerb_internal(verb: GraphVerb): Promise<void>

  /**
   * Get a verb from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerb_internal(id: string): Promise<GraphVerb | null>

  /**
   * Get all verbs from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getAllVerbs_internal(): Promise<GraphVerb[]>

  /**
   * Get verbs by source
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerbsBySource_internal(sourceId: string): Promise<GraphVerb[]>

  /**
   * Get verbs by target
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerbsByTarget_internal(targetId: string): Promise<GraphVerb[]>

  /**
   * Get verbs by type
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerbsByType_internal(type: string): Promise<GraphVerb[]>

  /**
   * Delete a verb from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract deleteVerb_internal(id: string): Promise<void>

  /**
   * Helper method to convert a Map to a plain object for serialization
   */
  protected mapToObject<K extends string | number, V>(
    map: Map<K, V>,
    valueTransformer: (value: V) => any = (v) => v
  ): Record<string, any> {
    const obj: Record<string, any> = {}
    for (const [key, value] of map.entries()) {
      obj[key.toString()] = valueTransformer(value)
    }
    return obj
  }

  /**
   * Save statistics data to storage
   * This method should be implemented by each specific adapter
   * @param statistics The statistics data to save
   */
  protected abstract saveStatisticsData(statistics: StatisticsData): Promise<void>

  /**
   * Get statistics data from storage
   * This method should be implemented by each specific adapter
   * @returns Promise that resolves to the statistics data or null if not found
   */
  protected abstract getStatisticsData(): Promise<StatisticsData | null>
}