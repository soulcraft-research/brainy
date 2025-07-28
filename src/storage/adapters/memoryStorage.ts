/**
 * Memory Storage Adapter
 * In-memory storage adapter for environments where persistent storage is not available or needed
 */

import { GraphVerb, HNSWNoun, StatisticsData } from '../../coreTypes.js'
import { BaseStorage, STATISTICS_KEY } from '../baseStorage.js'

// No type aliases needed - using the original types directly

/**
 * In-memory storage adapter
 * Uses Maps to store data in memory
 */
export class MemoryStorage extends BaseStorage {
  // Single map of noun ID to noun
  private nouns: Map<string, HNSWNoun> = new Map()
  private verbs: Map<string, GraphVerb> = new Map()
  private metadata: Map<string, any> = new Map()
  private statistics: StatisticsData | null = null

  constructor() {
    super()
  }

  /**
   * Initialize the storage adapter
   * Nothing to initialize for in-memory storage
   */
  public async init(): Promise<void> {
    this.isInitialized = true
  }

  /**
   * Save a noun to storage
   */
  protected async saveNoun_internal(noun: HNSWNoun): Promise<void> {
    // Create a deep copy to avoid reference issues
    const nounCopy: HNSWNoun = {
      id: noun.id,
      vector: [...noun.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of noun.connections.entries()) {
      nounCopy.connections.set(level, new Set(connections))
    }

    // Save the noun directly in the nouns map
    this.nouns.set(noun.id, nounCopy)
  }

  /**
   * Get a noun from storage
   */
  protected async getNoun_internal(id: string): Promise<HNSWNoun | null> {
    // Get the noun directly from the nouns map
    const noun = this.nouns.get(id)

    // If not found, return null
    if (!noun) {
      return null
    }

    // Return a deep copy to avoid reference issues
    const nounCopy: HNSWNoun = {
      id: noun.id,
      vector: [...noun.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of noun.connections.entries()) {
      nounCopy.connections.set(level, new Set(connections))
    }

    return nounCopy
  }

  /**
   * Get all nouns from storage
   */
  protected async getAllNouns_internal(): Promise<HNSWNoun[]> {
    const allNouns: HNSWNoun[] = []

    // Iterate through all nouns in the nouns map
    for (const [nounId, noun] of this.nouns.entries()) {
      // Return a deep copy to avoid reference issues
      const nounCopy: HNSWNoun = {
        id: noun.id,
        vector: [...noun.vector],
        connections: new Map()
      }

      // Copy connections
      for (const [level, connections] of noun.connections.entries()) {
        nounCopy.connections.set(level, new Set(connections))
      }

      allNouns.push(nounCopy)
    }

    return allNouns
  }

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   */
  protected async getNounsByNounType_internal(nounType: string): Promise<HNSWNoun[]> {
    const nouns: HNSWNoun[] = []

    // Iterate through all nouns and filter by noun type using metadata
    for (const [nounId, noun] of this.nouns.entries()) {
      // Get the metadata to check the noun type
      const metadata = await this.getMetadata(nounId)

      // Include the noun if its noun type matches the requested type
      if (metadata && metadata.noun === nounType) {
        // Return a deep copy to avoid reference issues
        const nounCopy: HNSWNoun = {
          id: noun.id,
          vector: [...noun.vector],
          connections: new Map()
        }

        // Copy connections
        for (const [level, connections] of noun.connections.entries()) {
          nounCopy.connections.set(level, new Set(connections))
        }

        nouns.push(nounCopy)
      }
    }

    return nouns
  }

  /**
   * Delete a noun from storage
   */
  protected async deleteNoun_internal(id: string): Promise<void> {
    this.nouns.delete(id)
  }

  /**
   * Save a verb to storage
   */
  protected async saveVerb_internal(verb: GraphVerb): Promise<void> {
    // Create a deep copy to avoid reference issues
    const verbCopy: GraphVerb = {
      id: verb.id,
      vector: [...verb.vector],
      connections: new Map(),
      sourceId: verb.sourceId,
      targetId: verb.targetId,
      source: verb.sourceId || verb.source,
      target: verb.targetId || verb.target,
      verb: verb.type || verb.verb,
      type: verb.type || verb.verb,
      weight: verb.weight,
      metadata: verb.metadata
    }

    // Copy connections
    for (const [level, connections] of verb.connections.entries()) {
      verbCopy.connections.set(level, new Set(connections))
    }

    // Save the verb directly in the verbs map
    this.verbs.set(verb.id, verbCopy)
  }

  /**
   * Get a verb from storage
   */
  protected async getVerb_internal(id: string): Promise<GraphVerb | null> {
    // Get the verb directly from the verbs map
    const verb = this.verbs.get(id)

    // If not found, return null
    if (!verb) {
      return null
    }

    // Create default timestamp if not present
    const defaultTimestamp = {
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: (Date.now() % 1000) * 1000000
    }

    // Create default createdBy if not present
    const defaultCreatedBy = {
      augmentation: 'unknown',
      version: '1.0'
    }

    // Return a deep copy to avoid reference issues
    const verbCopy: GraphVerb = {
      id: verb.id,
      vector: [...verb.vector],
      connections: new Map(),
      sourceId: (verb.sourceId || verb.source || ""),
      targetId: (verb.targetId || verb.target || ""),
      source: (verb.sourceId || verb.source || ""),
      target: (verb.targetId || verb.target || ""),
      verb: verb.type || verb.verb,
      type: verb.type || verb.verb, // Ensure type is also set
      weight: verb.weight,
      metadata: verb.metadata,
      createdAt: verb.createdAt || defaultTimestamp,
      updatedAt: verb.updatedAt || defaultTimestamp,
      createdBy: verb.createdBy || defaultCreatedBy
    }

    // Copy connections
    for (const [level, connections] of verb.connections.entries()) {
      verbCopy.connections.set(level, new Set(connections))
    }

    return verbCopy
  }

  /**
   * Get all verbs from storage
   */
  protected async getAllVerbs_internal(): Promise<GraphVerb[]> {
    const allVerbs: GraphVerb[] = []

    // Iterate through all verbs in the verbs map
    for (const [verbId, verb] of this.verbs.entries()) {
      // Create default timestamp if not present
      const defaultTimestamp = {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: (Date.now() % 1000) * 1000000
      }

      // Create default createdBy if not present
      const defaultCreatedBy = {
        augmentation: 'unknown',
        version: '1.0'
      }

      // Return a deep copy to avoid reference issues
      const verbCopy: GraphVerb = {
        id: verb.id,
        vector: [...verb.vector],
        connections: new Map(),
        sourceId: (verb.sourceId || verb.source || ""),
        targetId: (verb.targetId || verb.target || ""),
        source: (verb.sourceId || verb.source || ""),
        target: (verb.targetId || verb.target || ""),
        verb: verb.type || verb.verb,
        weight: verb.weight,
        metadata: verb.metadata,
        createdAt: verb.createdAt || defaultTimestamp,
        updatedAt: verb.updatedAt || defaultTimestamp,
        createdBy: verb.createdBy || defaultCreatedBy
      }

      // Copy connections
      for (const [level, connections] of verb.connections.entries()) {
        verbCopy.connections.set(level, new Set(connections))
      }

      allVerbs.push(verbCopy)
    }

    return allVerbs
  }

  /**
   * Get verbs by source
   */
  protected async getVerbsBySource_internal(sourceId: string): Promise<GraphVerb[]> {
    const allVerbs = await this.getAllVerbs_internal()
    return allVerbs.filter((verb: GraphVerb) => (verb.sourceId || verb.source) === sourceId)
  }

  /**
   * Get verbs by target
   */
  protected async getVerbsByTarget_internal(targetId: string): Promise<GraphVerb[]> {
    const allVerbs = await this.getAllVerbs_internal()
    return allVerbs.filter((verb: GraphVerb) => (verb.targetId || verb.target) === targetId)
  }

  /**
   * Get verbs by type
   */
  protected async getVerbsByType_internal(type: string): Promise<GraphVerb[]> {
    const allVerbs = await this.getAllVerbs_internal()
    return allVerbs.filter((verb: GraphVerb) => (verb.type || verb.verb) === type)
  }

  /**
   * Delete a verb from storage
   */
  protected async deleteVerb_internal(id: string): Promise<void> {
    // Delete the verb directly from the verbs map
    this.verbs.delete(id)
  }

  /**
   * Save metadata to storage
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    this.metadata.set(id, JSON.parse(JSON.stringify(metadata)))
  }

  /**
   * Get metadata from storage
   */
  public async getMetadata(id: string): Promise<any | null> {
    const metadata = this.metadata.get(id)
    if (!metadata) {
      return null
    }

    return JSON.parse(JSON.stringify(metadata))
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    this.nouns.clear()
    this.verbs.clear()
    this.metadata.clear()
  }

  /**
   * Get information about storage usage and capacity
   */
  public async getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }> {
    return {
      type: 'memory',
      used: 0, // In-memory storage doesn't have a meaningful size
      quota: null, // In-memory storage doesn't have a quota
      details: {
        nodeCount: this.nouns.size,
        edgeCount: this.verbs.size,
        metadataCount: this.metadata.size
      }
    }
  }

  /**
   * Save statistics data to storage
   * @param statistics The statistics data to save
   */
  protected async saveStatisticsData(statistics: StatisticsData): Promise<void> {
    // For memory storage, we just need to store the statistics in memory
    // Create a deep copy to avoid reference issues
    this.statistics = {
      nounCount: {...statistics.nounCount},
      verbCount: {...statistics.verbCount},
      metadataCount: {...statistics.metadataCount},
      hnswIndexSize: statistics.hnswIndexSize,
      lastUpdated: statistics.lastUpdated
    }
    
    // Since this is in-memory, there's no need for time-based partitioning
    // or legacy file handling
  }

  /**
   * Get statistics data from storage
   * @returns Promise that resolves to the statistics data or null if not found
   */
  protected async getStatisticsData(): Promise<StatisticsData | null> {
    if (!this.statistics) {
      return null
    }

    // Return a deep copy to avoid reference issues
    return {
      nounCount: {...this.statistics.nounCount},
      verbCount: {...this.statistics.verbCount},
      metadataCount: {...this.statistics.metadataCount},
      hnswIndexSize: this.statistics.hnswIndexSize,
      lastUpdated: this.statistics.lastUpdated
    }
    
    // Since this is in-memory, there's no need for fallback mechanisms
    // to check multiple storage locations
  }
}
