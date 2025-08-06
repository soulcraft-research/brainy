/**
 * Memory Storage Adapter
 * In-memory storage adapter for environments where persistent storage is not available or needed
 */

import { GraphVerb, HNSWNoun, HNSWVerb, StatisticsData } from '../../coreTypes.js'
import { BaseStorage, STATISTICS_KEY } from '../baseStorage.js'
import { PaginatedResult } from '../../types/paginationTypes.js'

// No type aliases needed - using the original types directly

/**
 * In-memory storage adapter
 * Uses Maps to store data in memory
 */
export class MemoryStorage extends BaseStorage {
  // Single map of noun ID to noun
  private nouns: Map<string, HNSWNoun> = new Map()
  private verbs: Map<string, HNSWVerb> = new Map()
  private metadata: Map<string, any> = new Map()
  private nounMetadata: Map<string, any> = new Map()
  private verbMetadata: Map<string, any> = new Map()
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
      connections: new Map(),
      level: noun.level || 0
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
      connections: new Map(),
      level: noun.level || 0
    }

    // Copy connections
    for (const [level, connections] of noun.connections.entries()) {
      nounCopy.connections.set(level, new Set(connections))
    }

    return nounCopy
  }

  /**
   * Get nouns with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of nouns
   */
  public async getNouns(options: {
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
  } = {}): Promise<PaginatedResult<HNSWNoun>> {
    const pagination = options.pagination || {}
    const filter = options.filter || {}
    
    // Default values
    const offset = pagination.offset || 0
    const limit = pagination.limit || 100
    
    // Convert string types to arrays for consistent handling
    const nounTypes = filter.nounType 
      ? Array.isArray(filter.nounType) ? filter.nounType : [filter.nounType]
      : undefined
    
    const services = filter.service
      ? Array.isArray(filter.service) ? filter.service : [filter.service]
      : undefined
    
    // First, collect all noun IDs that match the filter criteria
    const matchingIds: string[] = []
    
    // Iterate through all nouns to find matches
    for (const [nounId, noun] of this.nouns.entries()) {
      // Get the metadata to check filters
      const metadata = await this.getMetadata(nounId)
      if (!metadata) continue
      
      // Filter by noun type if specified
      if (nounTypes && !nounTypes.includes(metadata.noun)) {
        continue
      }
      
      // Filter by service if specified
      if (services && metadata.service && !services.includes(metadata.service)) {
        continue
      }
      
      // Filter by metadata fields if specified
      if (filter.metadata) {
        let metadataMatch = true
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (metadata[key] !== value) {
            metadataMatch = false
            break
          }
        }
        if (!metadataMatch) continue
      }
      
      // If we got here, the noun matches all filters
      matchingIds.push(nounId)
    }
    
    // Calculate pagination
    const totalCount = matchingIds.length
    const paginatedIds = matchingIds.slice(offset, offset + limit)
    const hasMore = offset + limit < totalCount
    
    // Create cursor for next page if there are more results
    const nextCursor = hasMore ? `${offset + limit}` : undefined
    
    // Fetch the actual nouns for the current page
    const items: HNSWNoun[] = []
    for (const id of paginatedIds) {
      const noun = this.nouns.get(id)
      if (!noun) continue
      
      // Create a deep copy to avoid reference issues
      const nounCopy: HNSWNoun = {
        id: noun.id,
        vector: [...noun.vector],
        connections: new Map(),
        level: noun.level || 0
      }
      
      // Copy connections
      for (const [level, connections] of noun.connections.entries()) {
        nounCopy.connections.set(level, new Set(connections))
      }
      
      items.push(nounCopy)
    }
    
    return {
      items,
      totalCount,
      hasMore,
      nextCursor
    }
  }

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   * @deprecated Use getNouns() with filter.nounType instead
   */
  protected async getNounsByNounType_internal(nounType: string): Promise<HNSWNoun[]> {
    const result = await this.getNouns({
      filter: {
        nounType
      }
    })
    return result.items
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
  protected async saveVerb_internal(verb: HNSWVerb): Promise<void> {
    // Create a deep copy to avoid reference issues
    const verbCopy: HNSWVerb = {
      id: verb.id,
      vector: [...verb.vector],
      connections: new Map()
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
  protected async getVerb_internal(id: string): Promise<HNSWVerb | null> {
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

    // Return a deep copy of the HNSWVerb
    const verbCopy: HNSWVerb = {
      id: verb.id,
      vector: [...verb.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of verb.connections.entries()) {
      verbCopy.connections.set(level, new Set(connections))
    }

    return verbCopy
  }

  /**
   * Get verbs with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of verbs
   */
  public async getVerbs(options: {
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
  } = {}): Promise<PaginatedResult<GraphVerb>> {
    const pagination = options.pagination || {}
    const filter = options.filter || {}
    
    // Default values
    const offset = pagination.offset || 0
    const limit = pagination.limit || 100
    
    // Convert string types to arrays for consistent handling
    const verbTypes = filter.verbType 
      ? Array.isArray(filter.verbType) ? filter.verbType : [filter.verbType]
      : undefined
    
    const sourceIds = filter.sourceId
      ? Array.isArray(filter.sourceId) ? filter.sourceId : [filter.sourceId]
      : undefined
    
    const targetIds = filter.targetId
      ? Array.isArray(filter.targetId) ? filter.targetId : [filter.targetId]
      : undefined
    
    const services = filter.service
      ? Array.isArray(filter.service) ? filter.service : [filter.service]
      : undefined
    
    // First, collect all verb IDs that match the filter criteria
    const matchingIds: string[] = []
    
    // Iterate through all verbs to find matches
    for (const [verbId, hnswVerb] of this.verbs.entries()) {
      // Get the metadata for this verb to do filtering
      const metadata = this.verbMetadata.get(verbId)
      
      // Filter by verb type if specified
      if (verbTypes && metadata && !verbTypes.includes(metadata.type || metadata.verb || '')) {
        continue
      }
      
      // Filter by source ID if specified
      if (sourceIds && metadata && !sourceIds.includes(metadata.sourceId || metadata.source || '')) {
        continue
      }
      
      // Filter by target ID if specified
      if (targetIds && metadata && !targetIds.includes(metadata.targetId || metadata.target || '')) {
        continue
      }
      
      // Filter by metadata fields if specified
      if (filter.metadata && metadata && metadata.data) {
        let metadataMatch = true
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (metadata.data[key] !== value) {
            metadataMatch = false
            break
          }
        }
        if (!metadataMatch) continue
      }
      
      // Filter by service if specified
      if (services && metadata && metadata.createdBy && metadata.createdBy.augmentation && 
          !services.includes(metadata.createdBy.augmentation)) {
        continue
      }
      
      // If we got here, the verb matches all filters
      matchingIds.push(verbId)
    }
    
    // Calculate pagination
    const totalCount = matchingIds.length
    const paginatedIds = matchingIds.slice(offset, offset + limit)
    const hasMore = offset + limit < totalCount
    
    // Create cursor for next page if there are more results
    const nextCursor = hasMore ? `${offset + limit}` : undefined
    
    // Fetch the actual verbs for the current page
    const items: GraphVerb[] = []
    for (const id of paginatedIds) {
      const hnswVerb = this.verbs.get(id)
      const metadata = this.verbMetadata.get(id)
      
      if (!hnswVerb) continue
      
      if (!metadata) {
        console.warn(`Verb ${id} found but no metadata - creating minimal GraphVerb`)
        // Return minimal GraphVerb if metadata is missing
        items.push({
          id: hnswVerb.id,
          vector: hnswVerb.vector,
          sourceId: '',
          targetId: ''
        })
        continue
      }
      
      // Create a complete GraphVerb by combining HNSWVerb with metadata
      const graphVerb: GraphVerb = {
        id: hnswVerb.id,
        vector: [...hnswVerb.vector],
        sourceId: metadata.sourceId,
        targetId: metadata.targetId,
        source: metadata.source,
        target: metadata.target,
        verb: metadata.verb,
        type: metadata.type,
        weight: metadata.weight,
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
        createdBy: metadata.createdBy,
        data: metadata.data,
        metadata: metadata.data // Alias for backward compatibility
      }
      
      items.push(graphVerb)
    }
    
    return {
      items,
      totalCount,
      hasMore,
      nextCursor
    }
  }

  /**
   * Get verbs by source
   * @deprecated Use getVerbs() with filter.sourceId instead
   */
  protected async getVerbsBySource_internal(sourceId: string): Promise<GraphVerb[]> {
    const result = await this.getVerbs({
      filter: {
        sourceId
      }
    })
    return result.items
  }

  /**
   * Get verbs by target
   * @deprecated Use getVerbs() with filter.targetId instead
   */
  protected async getVerbsByTarget_internal(targetId: string): Promise<GraphVerb[]> {
    const result = await this.getVerbs({
      filter: {
        targetId
      }
    })
    return result.items
  }

  /**
   * Get verbs by type
   * @deprecated Use getVerbs() with filter.verbType instead
   */
  protected async getVerbsByType_internal(type: string): Promise<GraphVerb[]> {
    const result = await this.getVerbs({
      filter: {
        verbType: type
      }
    })
    return result.items
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
   * Save noun metadata to storage
   */
  public async saveNounMetadata(id: string, metadata: any): Promise<void> {
    this.nounMetadata.set(id, JSON.parse(JSON.stringify(metadata)))
  }

  /**
   * Get noun metadata from storage
   */
  public async getNounMetadata(id: string): Promise<any | null> {
    const metadata = this.nounMetadata.get(id)
    if (!metadata) {
      return null
    }

    return JSON.parse(JSON.stringify(metadata))
  }

  /**
   * Save verb metadata to storage
   */
  public async saveVerbMetadata(id: string, metadata: any): Promise<void> {
    this.verbMetadata.set(id, JSON.parse(JSON.stringify(metadata)))
  }

  /**
   * Get verb metadata from storage
   */
  public async getVerbMetadata(id: string): Promise<any | null> {
    const metadata = this.verbMetadata.get(id)
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
    this.nounMetadata.clear()
    this.verbMetadata.clear()
    this.statistics = null
    
    // Clear the statistics cache
    this.statisticsCache = null
    this.statisticsModified = false
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
      }),
      // Include distributedConfig if present
      ...(statistics.distributedConfig && { 
        distributedConfig: JSON.parse(JSON.stringify(statistics.distributedConfig)) 
      })
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
      lastUpdated: this.statistics.lastUpdated,
      // Include serviceActivity if present
      ...(this.statistics.serviceActivity && {
        serviceActivity: Object.fromEntries(
          Object.entries(this.statistics.serviceActivity).map(([k, v]) => [k, {...v}])
        )
      }),
      // Include services if present
      ...(this.statistics.services && {
        services: this.statistics.services.map(s => ({...s}))
      }),
      // Include distributedConfig if present
      ...(this.statistics.distributedConfig && { 
        distributedConfig: JSON.parse(JSON.stringify(this.statistics.distributedConfig)) 
      })
    }
    
    // Since this is in-memory, there's no need for fallback mechanisms
    // to check multiple storage locations
  }
}
