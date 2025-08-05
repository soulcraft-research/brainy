/**
 * Type definitions for the Soulcraft Brainy
 */

/**
 * Vector representation - an array of numbers
 */
export type Vector = number[]

/**
 * A document with a vector embedding and optional metadata
 */
export interface VectorDocument<T = any> {
  id: string
  vector: Vector
  metadata?: T
}

/**
 * Search result with similarity score
 */
export interface SearchResult<T = any> {
  id: string
  score: number
  vector: Vector
  metadata?: T
}

/**
 * Cursor for pagination through search results
 */
export interface SearchCursor {
  lastId: string
  lastScore: number
  position: number // For debugging/logging
}

/**
 * Paginated search result with cursor support
 */
export interface PaginatedSearchResult<T = any> {
  results: SearchResult<T>[]
  cursor?: SearchCursor
  hasMore: boolean
  totalEstimate?: number
}

/**
 * Distance function for comparing vectors
 */
export type DistanceFunction = (a: Vector, b: Vector) => number

/**
 * Embedding function for converting data to vectors
 */
export type EmbeddingFunction = (data: any) => Promise<Vector>

/**
 * Embedding model interface
 */
export interface EmbeddingModel {
  /**
   * Initialize the embedding model
   */
  init(): Promise<void>

  /**
   * Embed data into a vector
   */
  embed(data: any): Promise<Vector>

  /**
   * Dispose of the model resources
   */
  dispose(): Promise<void>
}

/**
 * HNSW graph noun
 */
export interface HNSWNoun {
  id: string
  vector: Vector
  connections: Map<number, Set<string>> // level -> set of connected noun ids
  level: number // The highest layer this noun appears in
  metadata?: any // Optional metadata for the noun
}

/**
 * Lightweight verb for HNSW index storage
 * Contains only essential data needed for vector operations
 */
export interface HNSWVerb {
  id: string
  vector: Vector
  connections: Map<number, Set<string>> // level -> set of connected verb ids
}

/**
 * Verb representing a relationship between nouns
 * Stored separately from HNSW index for lightweight performance
 */
export interface GraphVerb {
  id: string // Unique identifier for the verb
  sourceId: string // ID of the source noun
  targetId: string // ID of the target noun
  vector: Vector // Vector representation of the relationship
  connections?: Map<number, Set<string>> // Optional connections from HNSW index
  type?: string // Optional type of the relationship
  weight?: number // Optional weight of the relationship
  metadata?: any // Optional metadata for the verb

  // Additional properties used in the codebase
  source?: string // Alias for sourceId
  target?: string // Alias for targetId
  verb?: string // Alias for type
  data?: Record<string, any> // Additional flexible data storage
  embedding?: Vector // Alias for vector

  // Timestamp and creator properties
  createdAt?: { seconds: number; nanoseconds: number } // When the verb was created
  updatedAt?: { seconds: number; nanoseconds: number } // When the verb was last updated
  createdBy?: { augmentation: string; version: string } // Information about what created this verb
}

/**
 * HNSW index configuration
 */
export interface HNSWConfig {
  M: number // Maximum number of connections per noun
  efConstruction: number // Size of the dynamic candidate list during construction
  efSearch: number // Size of the dynamic candidate list during search
  ml: number // Maximum level
  useDiskBasedIndex?: boolean // Whether to use disk-based index
}

/**
 * Storage interface for persistence
 */
/**
 * Statistics data structure for tracking counts by service
 */
export interface StatisticsData {
  /**
   * Count of nouns by service
   */
  nounCount: Record<string, number>

  /**
   * Count of verbs by service
   */
  verbCount: Record<string, number>

  /**
   * Count of metadata entries by service
   */
  metadataCount: Record<string, number>

  /**
   * Size of the HNSW index
   */
  hnswIndexSize: number

  /**
   * Total number of nodes
   */
  totalNodes?: number

  /**
   * Total number of edges
   */
  totalEdges?: number

  /**
   * Total metadata count
   */
  totalMetadata?: number

  /**
   * Operation counts
   */
  operations?: {
    add: number
    search: number
    delete: number
    update: number
    relate: number
    total: number
  }

  /**
   * Field names available for searching, organized by service
   * This helps users understand what fields are available from different data sources
   */
  fieldNames?: Record<string, string[]>

  /**
   * Standard field mappings for common field names across services
   * Maps standard field names to the actual field names used by each service
   */
  standardFieldMappings?: Record<string, Record<string, string[]>>

  /**
   * Content type breakdown (e.g., Person, Repository, Issue, etc.)
   */
  contentTypes?: Record<string, number>

  /**
   * Data freshness metrics
   */
  dataFreshness?: {
    oldestEntry: string
    newestEntry: string
    updatesLastHour: number
    updatesLastDay: number
    ageDistribution: {
      last24h: number
      last7d: number
      last30d: number
      older: number
    }
  }

  /**
   * Storage utilization metrics
   */
  storageMetrics?: {
    totalSizeBytes: number
    nounsSizeBytes: number
    verbsSizeBytes: number
    metadataSizeBytes: number
    indexSizeBytes: number
  }

  /**
   * Search performance metrics
   */
  searchMetrics?: {
    totalSearches: number
    averageSearchTimeMs: number
    searchesLastHour: number
    searchesLastDay: number
    topSearchTerms?: string[]
  }

  /**
   * Verb statistics similar to nouns
   */
  verbStatistics?: {
    totalVerbs: number
    verbTypes: Record<string, number>
    averageConnectionsPerVerb: number
  }

  /**
   * Last updated timestamp
   */
  lastUpdated: string
}

export interface StorageAdapter {
  init(): Promise<void>

  saveNoun(noun: HNSWNoun): Promise<void>

  getNoun(id: string): Promise<HNSWNoun | null>

  /**
   * Get all nouns from storage
   * @deprecated Use getNouns() with pagination instead for better scalability
   * @returns Promise that resolves to an array of all nouns
   */
  getAllNouns(): Promise<HNSWNoun[]>

  /**
   * Get nouns with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of nouns
   */
  getNouns(options?: {
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
  }>

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   * @deprecated Use getNouns() with filter.nounType instead
   */
  getNounsByNounType(nounType: string): Promise<HNSWNoun[]>

  deleteNoun(id: string): Promise<void>

  saveVerb(verb: GraphVerb): Promise<void>

  getVerb(id: string): Promise<GraphVerb | null>

  /**
   * Get all verbs from storage
   * @deprecated Use getVerbs() with pagination instead for better scalability
   * @returns Promise that resolves to an array of all verbs
   */
  getAllVerbs(): Promise<GraphVerb[]>

  /**
   * Get verbs with pagination and filtering
   * @param options Pagination and filtering options
   * @returns Promise that resolves to a paginated result of verbs
   */
  getVerbs(options?: {
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
  }>

  /**
   * Get verbs by source
   * @param sourceId The source ID to filter by
   * @returns Promise that resolves to an array of verbs with the specified source ID
   * @deprecated Use getVerbs() with filter.sourceId instead
   */
  getVerbsBySource(sourceId: string): Promise<GraphVerb[]>

  /**
   * Get verbs by target
   * @param targetId The target ID to filter by
   * @returns Promise that resolves to an array of verbs with the specified target ID
   * @deprecated Use getVerbs() with filter.targetId instead
   */
  getVerbsByTarget(targetId: string): Promise<GraphVerb[]>

  /**
   * Get verbs by type
   * @param type The verb type to filter by
   * @returns Promise that resolves to an array of verbs with the specified type
   * @deprecated Use getVerbs() with filter.verbType instead
   */
  getVerbsByType(type: string): Promise<GraphVerb[]>

  deleteVerb(id: string): Promise<void>

  saveMetadata(id: string, metadata: any): Promise<void>

  getMetadata(id: string): Promise<any | null>

  /**
   * Save verb metadata to storage
   * @param id The ID of the verb
   * @param metadata The metadata to save
   * @returns Promise that resolves when the metadata is saved
   */
  saveVerbMetadata(id: string, metadata: any): Promise<void>

  /**
   * Get verb metadata from storage
   * @param id The ID of the verb
   * @returns Promise that resolves to the metadata or null if not found
   */
  getVerbMetadata(id: string): Promise<any | null>

  clear(): Promise<void>

  /**
   * Get information about storage usage and capacity
   * @returns Promise that resolves to an object containing storage status information
   */
  getStorageStatus(): Promise<{
    /**
     * The type of storage being used (e.g., 'filesystem', 'opfs', 'memory')
     */
    type: string

    /**
     * The amount of storage being used in bytes
     */
    used: number

    /**
     * The total amount of storage available in bytes, or null if unknown
     */
    quota: number | null

    /**
     * Additional storage-specific information
     */
    details?: Record<string, any>
  }>

  /**
   * Save statistics data
   * @param statistics The statistics data to save
   */
  saveStatistics(statistics: StatisticsData): Promise<void>

  /**
   * Get statistics data
   * @returns Promise that resolves to the statistics data
   */
  getStatistics(): Promise<StatisticsData | null>

  /**
   * Increment a statistic counter
   * @param type The type of statistic to increment ('noun', 'verb', 'metadata')
   * @param service The service that inserted the data
   * @param amount The amount to increment by (default: 1)
   */
  incrementStatistic(
    type: 'noun' | 'verb' | 'metadata',
    service: string,
    amount?: number
  ): Promise<void>

  /**
   * Decrement a statistic counter
   * @param type The type of statistic to decrement ('noun', 'verb', 'metadata')
   * @param service The service that inserted the data
   * @param amount The amount to decrement by (default: 1)
   */
  decrementStatistic(
    type: 'noun' | 'verb' | 'metadata',
    service: string,
    amount?: number
  ): Promise<void>

  /**
   * Update the HNSW index size statistic
   * @param size The new size of the HNSW index
   */
  updateHnswIndexSize(size: number): Promise<void>

  /**
   * Force an immediate flush of statistics to storage
   * This ensures that any pending statistics updates are written to persistent storage
   */
  flushStatisticsToStorage(): Promise<void>

  /**
   * Track field names from a JSON document
   * @param jsonDocument The JSON document to extract field names from
   * @param service The service that inserted the data
   */
  trackFieldNames(jsonDocument: any, service: string): Promise<void>

  /**
   * Get available field names by service
   * @returns Record of field names by service
   */
  getAvailableFieldNames(): Promise<Record<string, string[]>>

  /**
   * Get standard field mappings
   * @returns Record of standard field mappings
   */
  getStandardFieldMappings(): Promise<Record<string, Record<string, string[]>>>

  /**
   * Get changes since a specific timestamp
   * @param timestamp The timestamp to get changes since
   * @param limit Optional limit on the number of changes to return
   * @returns Promise that resolves to an array of changes
   */
  getChangesSince?(timestamp: number, limit?: number): Promise<any[]>
}
