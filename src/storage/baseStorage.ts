/**
 * Base Storage Adapter
 * Provides common functionality for all storage adapters
 */

import { GraphVerb, HNSWNoun, HNSWVerb, StatisticsData } from '../coreTypes.js'
import { BaseStorageAdapter } from './adapters/baseStorageAdapter.js'

// Common directory/prefix names
export const NOUNS_DIR = 'nouns'
export const VERBS_DIR = 'verbs'
export const METADATA_DIR = 'metadata'
export const NOUN_METADATA_DIR = 'noun-metadata'
export const VERB_METADATA_DIR = 'verb-metadata'
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
   * @deprecated This method is deprecated and will be removed in a future version.
   * It can cause memory issues with large datasets. Use getNouns() with pagination instead.
   */
  public async getAllNouns(): Promise<HNSWNoun[]> {
    await this.ensureInitialized()
    console.warn('WARNING: getAllNouns() is deprecated and will be removed in a future version. Use getNouns() with pagination instead.')
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
    
    // Extract the lightweight HNSWVerb data
    const hnswVerb: HNSWVerb = {
      id: verb.id,
      vector: verb.vector,
      connections: verb.connections || new Map()
    }
    
    // Extract and save the metadata separately
    const metadata = {
      sourceId: verb.sourceId || verb.source,
      targetId: verb.targetId || verb.target,
      source: verb.source || verb.sourceId,
      target: verb.target || verb.targetId,
      type: verb.type || verb.verb,
      verb: verb.verb || verb.type,
      weight: verb.weight,
      metadata: verb.metadata,
      data: verb.data,
      createdAt: verb.createdAt,
      updatedAt: verb.updatedAt,
      createdBy: verb.createdBy,
      embedding: verb.embedding
    }
    
    // Save both the HNSWVerb and metadata
    await this.saveVerb_internal(hnswVerb)
    await this.saveVerbMetadata(verb.id, metadata)
  }

  /**
   * Get a verb from storage
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    await this.ensureInitialized()
    const hnswVerb = await this.getVerb_internal(id)
    if (!hnswVerb) {
      return null
    }
    return this.convertHNSWVerbToGraphVerb(hnswVerb)
  }

  /**
   * Convert HNSWVerb to GraphVerb by combining with metadata
   */
  protected async convertHNSWVerbToGraphVerb(hnswVerb: HNSWVerb): Promise<GraphVerb | null> {
    try {
      const metadata = await this.getVerbMetadata(hnswVerb.id)
      if (!metadata) {
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

      return {
        id: hnswVerb.id,
        vector: hnswVerb.vector,
        sourceId: metadata.sourceId,
        targetId: metadata.targetId,
        source: metadata.source,
        target: metadata.target,
        verb: metadata.verb,
        type: metadata.type,
        weight: metadata.weight || 1.0,
        metadata: metadata.metadata || {},
        createdAt: metadata.createdAt || defaultTimestamp,
        updatedAt: metadata.updatedAt || defaultTimestamp,
        createdBy: metadata.createdBy || defaultCreatedBy,
        data: metadata.data,
        embedding: hnswVerb.vector
      }
    } catch (error) {
      console.error(`Failed to convert HNSWVerb to GraphVerb for ${hnswVerb.id}:`, error)
      return null
    }
  }

  /**
   * Get all verbs from storage
   * @deprecated This method is deprecated and will be removed in a future version.
   * It can cause memory issues with large datasets. Use getVerbs() with pagination instead.
   */
  public async getAllVerbs(): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    console.warn('WARNING: getAllVerbs() is deprecated and will be removed in a future version. Use getVerbs() with pagination instead.')
    
    const hnswVerbs = await this.getAllVerbs_internal()
    const graphVerbs: GraphVerb[] = []
    
    for (const hnswVerb of hnswVerbs) {
      const graphVerb = await this.convertHNSWVerbToGraphVerb(hnswVerb)
      if (graphVerb) {
        graphVerbs.push(graphVerb)
      }
    }
    
    return graphVerbs
  }

  /**
   * Get verbs by source
   */
  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    
    // Get all verbs and filter by source
    const allVerbs = await this.getAllVerbs()
    return allVerbs.filter(verb => 
      verb.sourceId === sourceId || verb.source === sourceId
    )
  }

  /**
   * Get verbs by target
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    
    // Get all verbs and filter by target
    const allVerbs = await this.getAllVerbs()
    return allVerbs.filter(verb => 
      verb.targetId === targetId || verb.target === targetId
    )
  }

  /**
   * Get verbs by type
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    
    // Get all verbs and filter by type
    const allVerbs = await this.getAllVerbs()
    return allVerbs.filter(verb => 
      verb.type === type || verb.verb === type
    )
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
    const cursor = pagination.cursor

    // Optimize for common filter cases to avoid loading all nouns
    if (options?.filter) {
      // If filtering by nounType only, use the optimized method
      if (
        options.filter.nounType &&
        !options.filter.service &&
        !options.filter.metadata
      ) {
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

    // For more complex filtering or no filtering, use a paginated approach
    // that avoids loading all nouns into memory at once
    try {
      // First, try to get a count of total nouns (if the adapter supports it)
      let totalCount: number | undefined = undefined
      try {
        // This is an optional method that adapters may implement
        if (typeof (this as any).countNouns === 'function') {
          totalCount = await (this as any).countNouns(options?.filter)
        }
      } catch (countError) {
        // Ignore errors from count method, it's optional
        console.warn('Error getting noun count:', countError)
      }

      // Check if the adapter has a paginated method for getting nouns
      if (typeof (this as any).getNounsWithPagination === 'function') {
        // Use the adapter's paginated method
        const result = await (this as any).getNounsWithPagination({
          limit,
          cursor,
          filter: options?.filter
        })

        // Apply offset if needed (some adapters might not support offset)
        const items = result.items.slice(offset)

        return {
          items,
          totalCount: result.totalCount || totalCount,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor
        }
      }

      // If the adapter doesn't have a paginated method, fall back to the old approach
      // but with a warning and a reasonable limit
      console.warn(
        'Storage adapter does not support pagination, falling back to loading all nouns. This may cause performance issues with large datasets.'
      )

      // Get nouns with a reasonable limit to avoid memory issues
      const maxNouns = Math.min(offset + limit + 100, 1000) // Reasonable limit
      let allNouns: HNSWNoun[] = []

      try {
        // Try to get only the nouns we need
        allNouns = await this.getAllNouns_internal()

        // If we have too many nouns, truncate the array to avoid memory issues
        if (allNouns.length > maxNouns) {
          console.warn(
            `Large number of nouns (${allNouns.length}), truncating to ${maxNouns} for filtering`
          )
          allNouns = allNouns.slice(0, maxNouns)
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

          filteredNouns = filteredNouns.filter((noun) => {
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

          filteredNouns = filteredNouns.filter((noun) => {
            // HNSWNoun doesn't have a service property directly, check metadata
            const service = noun.metadata?.service
            return typeof service === 'string' && services.includes(service)
          })
        }

        // Filter by metadata
        if (options.filter.metadata) {
          const metadataFilter = options.filter.metadata
          filteredNouns = filteredNouns.filter((noun) => {
            if (!noun.metadata) return false

            // Check if all metadata keys match
            return Object.entries(metadataFilter).every(
              ([key, value]) => noun.metadata && noun.metadata[key] === value
            )
          })
        }
      }

      // Get total count before pagination
      totalCount = totalCount || filteredNouns.length

      // Apply pagination
      const paginatedNouns = filteredNouns.slice(offset, offset + limit)
      const hasMore = offset + limit < filteredNouns.length || filteredNouns.length >= maxNouns

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
    } catch (error) {
      console.error('Error getting nouns with pagination:', error)
      return {
        items: [],
        totalCount: 0,
        hasMore: false
      }
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
    const cursor = pagination.cursor

    // Optimize for common filter cases to avoid loading all verbs
    if (options?.filter) {
      // If filtering by sourceId only, use the optimized method
      if (
        options.filter.sourceId &&
        !options.filter.verbType &&
        !options.filter.targetId &&
        !options.filter.service &&
        !options.filter.metadata
      ) {
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
      if (
        options.filter.targetId &&
        !options.filter.verbType &&
        !options.filter.sourceId &&
        !options.filter.service &&
        !options.filter.metadata
      ) {
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
      if (
        options.filter.verbType &&
        !options.filter.sourceId &&
        !options.filter.targetId &&
        !options.filter.service &&
        !options.filter.metadata
      ) {
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

    // For more complex filtering or no filtering, use a paginated approach
    // that avoids loading all verbs into memory at once
    try {
      // First, try to get a count of total verbs (if the adapter supports it)
      let totalCount: number | undefined = undefined
      try {
        // This is an optional method that adapters may implement
        if (typeof (this as any).countVerbs === 'function') {
          totalCount = await (this as any).countVerbs(options?.filter)
        }
      } catch (countError) {
        // Ignore errors from count method, it's optional
        console.warn('Error getting verb count:', countError)
      }

      // Check if the adapter has a paginated method for getting verbs
      if (typeof (this as any).getVerbsWithPagination === 'function') {
        // Use the adapter's paginated method
        const result = await (this as any).getVerbsWithPagination({
          limit,
          cursor,
          filter: options?.filter
        })

        // Apply offset if needed (some adapters might not support offset)
        const items = result.items.slice(offset)

        return {
          items,
          totalCount: result.totalCount || totalCount,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor
        }
      }

      // If the adapter doesn't have a paginated method, fall back to the old approach
      // but with a warning and a reasonable limit
      console.warn(
        'Storage adapter does not support pagination, falling back to loading all verbs. This may cause performance issues with large datasets.'
      )

      // Get verbs with a reasonable limit to avoid memory issues
      const maxVerbs = Math.min(offset + limit + 100, 1000) // Reasonable limit
      let allVerbs: GraphVerb[] = []

      try {
        // Try to get only the verbs we need
        allVerbs = await this.getAllVerbs()

        // If we have too many verbs, truncate the array to avoid memory issues
        if (allVerbs.length > maxVerbs) {
          console.warn(
            `Large number of verbs (${allVerbs.length}), truncating to ${maxVerbs} for filtering`
          )
          allVerbs = allVerbs.slice(0, maxVerbs)
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

          filteredVerbs = filteredVerbs.filter(
            (verb) => verb.type !== undefined && verbTypes.includes(verb.type)
          )
        }

        // Filter by source ID
        if (options.filter.sourceId) {
          const sourceIds = Array.isArray(options.filter.sourceId)
            ? options.filter.sourceId
            : [options.filter.sourceId]

          filteredVerbs = filteredVerbs.filter(
            (verb) =>
              verb.sourceId !== undefined && sourceIds.includes(verb.sourceId)
          )
        }

        // Filter by target ID
        if (options.filter.targetId) {
          const targetIds = Array.isArray(options.filter.targetId)
            ? options.filter.targetId
            : [options.filter.targetId]

          filteredVerbs = filteredVerbs.filter(
            (verb) =>
              verb.targetId !== undefined && targetIds.includes(verb.targetId)
          )
        }

        // Filter by service
        if (options.filter.service) {
          const services = Array.isArray(options.filter.service)
            ? options.filter.service
            : [options.filter.service]

          filteredVerbs = filteredVerbs.filter((verb) => {
            // GraphVerb doesn't have a service property directly, check metadata
            const service = verb.metadata?.service
            return typeof service === 'string' && services.includes(service)
          })
        }

        // Filter by metadata
        if (options.filter.metadata) {
          const metadataFilter = options.filter.metadata
          filteredVerbs = filteredVerbs.filter((verb) => {
            if (!verb.metadata) return false

            // Check if all metadata keys match
            return Object.entries(metadataFilter).every(
              ([key, value]) => verb.metadata && verb.metadata[key] === value
            )
          })
        }
      }

      // Get total count before pagination
      totalCount = totalCount || filteredVerbs.length

      // Apply pagination
      const paginatedVerbs = filteredVerbs.slice(offset, offset + limit)
      const hasMore = offset + limit < filteredVerbs.length || filteredVerbs.length >= maxVerbs

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
    } catch (error) {
      console.error('Error getting verbs with pagination:', error)
      return {
        items: [],
        totalCount: 0,
        hasMore: false
      }
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
   * Save noun metadata to storage
   * This method should be implemented by each specific adapter
   */
  public abstract saveNounMetadata(id: string, metadata: any): Promise<void>

  /**
   * Get noun metadata from storage
   * This method should be implemented by each specific adapter
   */
  public abstract getNounMetadata(id: string): Promise<any | null>

  /**
   * Save verb metadata to storage
   * This method should be implemented by each specific adapter
   */
  public abstract saveVerbMetadata(id: string, metadata: any): Promise<void>

  /**
   * Get verb metadata from storage
   * This method should be implemented by each specific adapter
   */
  public abstract getVerbMetadata(id: string): Promise<any | null>

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
  protected abstract getNounsByNounType_internal(
    nounType: string
  ): Promise<HNSWNoun[]>

  /**
   * Delete a noun from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract deleteNoun_internal(id: string): Promise<void>

  /**
   * Save a verb to storage
   * This method should be implemented by each specific adapter
   */
  protected abstract saveVerb_internal(verb: HNSWVerb): Promise<void>

  /**
   * Get a verb from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerb_internal(id: string): Promise<HNSWVerb | null>

  /**
   * Get all verbs from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getAllVerbs_internal(): Promise<HNSWVerb[]>

  /**
   * Get verbs by source
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerbsBySource_internal(
    sourceId: string
  ): Promise<GraphVerb[]>

  /**
   * Get verbs by target
   * This method should be implemented by each specific adapter
   */
  protected abstract getVerbsByTarget_internal(
    targetId: string
  ): Promise<GraphVerb[]>

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
  protected abstract saveStatisticsData(
    statistics: StatisticsData
  ): Promise<void>

  /**
   * Get statistics data from storage
   * This method should be implemented by each specific adapter
   * @returns Promise that resolves to the statistics data or null if not found
   */
  protected abstract getStatisticsData(): Promise<StatisticsData | null>
}
