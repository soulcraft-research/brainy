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
   * Get nouns with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of nouns
   */
  public async getNouns(options?: {
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
    items: HNSWNoun[]
    totalCount?: number
    hasMore: boolean
    nextCursor?: string
  }> {
    await this.ensureInitialized()
    
    // Set default pagination values
    const pagination = options?.pagination || {}
    const limit = pagination.limit || 100
    const offset = pagination.offset || 0
    
    // Optimize for common filter cases to avoid loading all nouns
    if (options?.filter) {
      // If filtering by nounType only, use the optimized method
      if (options.filter.nounType && !options.filter.service && !options.filter.metadata) {
        const nounType = Array.isArray(options.filter.nounType) 
          ? options.filter.nounType[0] 
          : options.filter.nounType
          
        // Get nouns by type directly
        const nounsByType = await this.getNounsByNounType_internal(nounType)
        
        // Apply pagination
        const paginatedNouns = nounsByType.slice(offset, offset + limit)
        const hasMore = offset + limit < nounsByType.length
        
        // Set next cursor if there are more items
        let nextCursor: string | undefined = undefined
        if (hasMore && paginatedNouns.length > 0) {
          const lastItem = paginatedNouns[paginatedNouns.length - 1]
          nextCursor = lastItem.id
        }
        
        return {
          items: paginatedNouns,
          totalCount: nounsByType.length,
          hasMore,
          nextCursor
        }
      }
    }
    
    // For more complex filtering or no filtering, we need to get all nouns
    // but limit the number we load to avoid memory issues
    const maxNouns = offset + limit + 1 // Get one extra to check if there are more
    let allNouns: HNSWNoun[] = []
    
    try {
      // Try to get only the nouns we need
      allNouns = await this.getAllNouns_internal()
      
      // If we have too many nouns, truncate the array to avoid memory issues
      if (allNouns.length > maxNouns * 10) {
        console.warn(`Large number of nouns (${allNouns.length}), truncating to ${maxNouns * 10} for filtering`)
        allNouns = allNouns.slice(0, maxNouns * 10)
      }
    } catch (error) {
      console.error('Error getting all nouns:', error)
      // Return empty result on error
      return {
        items: [],
        totalCount: 0,
        hasMore: false
      }
    }
    
    // Apply filtering if needed
    let filteredNouns = allNouns
    
    if (options?.filter) {
      // Filter by noun type
      if (options.filter.nounType) {
        const nounTypes = Array.isArray(options.filter.nounType) 
          ? options.filter.nounType 
          : [options.filter.nounType]
        
        filteredNouns = filteredNouns.filter(noun => {
          // HNSWNoun doesn't have a type property directly, check metadata
          const nounType = noun.metadata?.type
          return typeof nounType === 'string' && nounTypes.includes(nounType)
        })
      }
      
      // Filter by service
      if (options.filter.service) {
        const services = Array.isArray(options.filter.service) 
          ? options.filter.service 
          : [options.filter.service]
        
        filteredNouns = filteredNouns.filter(noun => {
          // HNSWNoun doesn't have a service property directly, check metadata
          const service = noun.metadata?.service
          return typeof service === 'string' && services.includes(service)
        })
      }
      
      // Filter by metadata
      if (options.filter.metadata) {
        const metadataFilter = options.filter.metadata
        filteredNouns = filteredNouns.filter(noun => {
          if (!noun.metadata) return false
          
          // Check if all metadata keys match
          return Object.entries(metadataFilter).every(([key, value]) => 
            noun.metadata && noun.metadata[key] === value
          )
        })
      }
    }
    
    // Get total count before pagination
    const totalCount = filteredNouns.length
    
    // Apply pagination
    const paginatedNouns = filteredNouns.slice(offset, offset + limit)
    const hasMore = offset + limit < totalCount
    
    // Set next cursor if there are more items
    let nextCursor: string | undefined = undefined
    if (hasMore && paginatedNouns.length > 0) {
      const lastItem = paginatedNouns[paginatedNouns.length - 1]
      nextCursor = lastItem.id
    }
    
    return {
      items: paginatedNouns,
      totalCount,
      hasMore,
      nextCursor
    }
  }
  
  /**
   * Get verbs with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of verbs
   */
  public async getVerbs(options?: {
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
    items: GraphVerb[]
    totalCount?: number
    hasMore: boolean
    nextCursor?: string
  }> {
    await this.ensureInitialized()
    
    // Set default pagination values
    const pagination = options?.pagination || {}
    const limit = pagination.limit || 100
    const offset = pagination.offset || 0
    
    // Optimize for common filter cases to avoid loading all verbs
    if (options?.filter) {
      // If filtering by sourceId only, use the optimized method
      if (options.filter.sourceId && !options.filter.verbType && 
          !options.filter.targetId && !options.filter.service && 
          !options.filter.metadata) {
        
        const sourceId = Array.isArray(options.filter.sourceId) 
          ? options.filter.sourceId[0] 
          : options.filter.sourceId
          
        // Get verbs by source directly
        const verbsBySource = await this.getVerbsBySource_internal(sourceId)
        
        // Apply pagination
        const paginatedVerbs = verbsBySource.slice(offset, offset + limit)
        const hasMore = offset + limit < verbsBySource.length
        
        // Set next cursor if there are more items
        let nextCursor: string | undefined = undefined
        if (hasMore && paginatedVerbs.length > 0) {
          const lastItem = paginatedVerbs[paginatedVerbs.length - 1]
          nextCursor = lastItem.id
        }
        
        return {
          items: paginatedVerbs,
          totalCount: verbsBySource.length,
          hasMore,
          nextCursor
        }
      }
      
      // If filtering by targetId only, use the optimized method
      if (options.filter.targetId && !options.filter.verbType && 
          !options.filter.sourceId && !options.filter.service && 
          !options.filter.metadata) {
        
        const targetId = Array.isArray(options.filter.targetId) 
          ? options.filter.targetId[0] 
          : options.filter.targetId
          
        // Get verbs by target directly
        const verbsByTarget = await this.getVerbsByTarget_internal(targetId)
        
        // Apply pagination
        const paginatedVerbs = verbsByTarget.slice(offset, offset + limit)
        const hasMore = offset + limit < verbsByTarget.length
        
        // Set next cursor if there are more items
        let nextCursor: string | undefined = undefined
        if (hasMore && paginatedVerbs.length > 0) {
          const lastItem = paginatedVerbs[paginatedVerbs.length - 1]
          nextCursor = lastItem.id
        }
        
        return {
          items: paginatedVerbs,
          totalCount: verbsByTarget.length,
          hasMore,
          nextCursor
        }
      }
      
      // If filtering by verbType only, use the optimized method
      if (options.filter.verbType && !options.filter.sourceId && 
          !options.filter.targetId && !options.filter.service && 
          !options.filter.metadata) {
        
        const verbType = Array.isArray(options.filter.verbType) 
          ? options.filter.verbType[0] 
          : options.filter.verbType
          
        // Get verbs by type directly
        const verbsByType = await this.getVerbsByType_internal(verbType)
        
        // Apply pagination
        const paginatedVerbs = verbsByType.slice(offset, offset + limit)
        const hasMore = offset + limit < verbsByType.length
        
        // Set next cursor if there are more items
        let nextCursor: string | undefined = undefined
        if (hasMore && paginatedVerbs.length > 0) {
          const lastItem = paginatedVerbs[paginatedVerbs.length - 1]
          nextCursor = lastItem.id
        }
        
        return {
          items: paginatedVerbs,
          totalCount: verbsByType.length,
          hasMore,
          nextCursor
        }
      }
    }
    
    // For more complex filtering or no filtering, we need to get all verbs
    // but limit the number we load to avoid memory issues
    const maxVerbs = offset + limit + 1 // Get one extra to check if there are more
    let allVerbs: GraphVerb[] = []
    
    try {
      // Try to get only the verbs we need
      allVerbs = await this.getAllVerbs_internal()
      
      // If we have too many verbs, truncate the array to avoid memory issues
      if (allVerbs.length > maxVerbs * 10) {
        console.warn(`Large number of verbs (${allVerbs.length}), truncating to ${maxVerbs * 10} for filtering`)
        allVerbs = allVerbs.slice(0, maxVerbs * 10)
      }
    } catch (error) {
      console.error('Error getting all verbs:', error)
      // Return empty result on error
      return {
        items: [],
        totalCount: 0,
        hasMore: false
      }
    }
    
    // Apply filtering if needed
    let filteredVerbs = allVerbs
    
    if (options?.filter) {
      // Filter by verb type
      if (options.filter.verbType) {
        const verbTypes = Array.isArray(options.filter.verbType) 
          ? options.filter.verbType 
          : [options.filter.verbType]
        
        filteredVerbs = filteredVerbs.filter(verb => 
          verb.type !== undefined && verbTypes.includes(verb.type)
        )
      }
      
      // Filter by source ID
      if (options.filter.sourceId) {
        const sourceIds = Array.isArray(options.filter.sourceId) 
          ? options.filter.sourceId 
          : [options.filter.sourceId]
        
        filteredVerbs = filteredVerbs.filter(verb => 
          verb.sourceId !== undefined && sourceIds.includes(verb.sourceId)
        )
      }
      
      // Filter by target ID
      if (options.filter.targetId) {
        const targetIds = Array.isArray(options.filter.targetId) 
          ? options.filter.targetId 
          : [options.filter.targetId]
        
        filteredVerbs = filteredVerbs.filter(verb => 
          verb.targetId !== undefined && targetIds.includes(verb.targetId)
        )
      }
      
      // Filter by service
      if (options.filter.service) {
        const services = Array.isArray(options.filter.service) 
          ? options.filter.service 
          : [options.filter.service]
        
        filteredVerbs = filteredVerbs.filter(verb => {
          // GraphVerb doesn't have a service property directly, check metadata
          const service = verb.metadata?.service
          return typeof service === 'string' && services.includes(service)
        })
      }
      
      // Filter by metadata
      if (options.filter.metadata) {
        const metadataFilter = options.filter.metadata
        filteredVerbs = filteredVerbs.filter(verb => {
          if (!verb.metadata) return false
          
          // Check if all metadata keys match
          return Object.entries(metadataFilter).every(([key, value]) => 
            verb.metadata && verb.metadata[key] === value
          )
        })
      }
    }
    
    // Get total count before pagination
    const totalCount = filteredVerbs.length
    
    // Apply pagination
    const paginatedVerbs = filteredVerbs.slice(offset, offset + limit)
    const hasMore = offset + limit < totalCount
    
    // Set next cursor if there are more items
    let nextCursor: string | undefined = undefined
    if (hasMore && paginatedVerbs.length > 0) {
      const lastItem = paginatedVerbs[paginatedVerbs.length - 1]
      nextCursor = lastItem.id
    }
    
    return {
      items: paginatedVerbs,
      totalCount,
      hasMore,
      nextCursor
    }
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
