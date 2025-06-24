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
}

/**
 * Verb representing a relationship between nouns
 * Extends HNSWNoun to allow verbs to be first-class entities in the data model
 */
export interface GraphVerb extends HNSWNoun {
  sourceId: string // ID of the source noun
  targetId: string // ID of the target noun
  type?: string // Optional type of the relationship
  weight?: number // Optional weight of the relationship
  metadata?: any // Optional metadata for the verb

  // Additional properties used in the codebase
  source?: string // Alias for sourceId
  target?: string // Alias for targetId
  verb?: string // Alias for type
  data?: Record<string, any> // Additional flexible data storage
  embedding?: Vector // Vector representation of the relationship
}

/**
 * HNSW index configuration
 */
export interface HNSWConfig {
  M: number // Maximum number of connections per noun
  efConstruction: number // Size of the dynamic candidate list during construction
  efSearch: number // Size of the dynamic candidate list during search
  ml: number // Maximum level
}

/**
 * Storage interface for persistence
 */
export interface StorageAdapter {
  init(): Promise<void>

  saveNoun(noun: HNSWNoun): Promise<void>

  getNoun(id: string): Promise<HNSWNoun | null>

  getAllNouns(): Promise<HNSWNoun[]>

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   */
  getNounsByNounType(nounType: string): Promise<HNSWNoun[]>

  deleteNoun(id: string): Promise<void>

  saveVerb(verb: GraphVerb): Promise<void>

  getVerb(id: string): Promise<GraphVerb | null>

  getAllVerbs(): Promise<GraphVerb[]>

  getVerbsBySource(sourceId: string): Promise<GraphVerb[]>

  getVerbsByTarget(targetId: string): Promise<GraphVerb[]>

  getVerbsByType(type: string): Promise<GraphVerb[]>

  deleteVerb(id: string): Promise<void>

  saveMetadata(id: string, metadata: any): Promise<void>

  getMetadata(id: string): Promise<any | null>

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
}
