/**
 * BrainyData
 * Main class that provides the vector database functionality
 */

import { v4 as uuidv4 } from 'uuid'
import { HNSWIndex } from './hnsw/hnswIndex.js'
import { createStorage } from './storage/opfsStorage.js'
import {
  DistanceFunction,
  GraphVerb,
  EmbeddingFunction,
  HNSWConfig, HNSWNoun,
  SearchResult,
  StorageAdapter,
  Vector,
  VectorDocument
} from './coreTypes.js'
import { cosineDistance, defaultEmbeddingFunction, euclideanDistance } from './utils/index.js'
import { NounType, VerbType, GraphNoun } from './types/graphTypes.js'

export interface BrainyDataConfig {
  /**
   * HNSW index configuration
   */
  hnsw?: Partial<HNSWConfig>

  /**
   * Distance function to use for similarity calculations
   */
  distanceFunction?: DistanceFunction

  /**
   * Custom storage adapter (if not provided, will use OPFS or memory storage)
   */
  storageAdapter?: StorageAdapter

  /**
   * Storage configuration options
   * These will be passed to createStorage if storageAdapter is not provided
   */
  storage?: {
    requestPersistentStorage?: boolean;
    r2Storage?: {
      bucketName?: string;
      accountId?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    };
    s3Storage?: {
      bucketName?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      region?: string;
    };
    gcsStorage?: {
      bucketName?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      endpoint?: string;
    };
    customS3Storage?: {
      bucketName?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      endpoint?: string;
      region?: string;
    };
    forceFileSystemStorage?: boolean;
    forceMemoryStorage?: boolean;
  }

  /**
   * Embedding function to convert data to vectors
   */
  embeddingFunction?: EmbeddingFunction

  /**
   * Request persistent storage when running in a browser
   * This will prompt the user for permission to use persistent storage
   * @deprecated Use storage.requestPersistentStorage instead
   */
  requestPersistentStorage?: boolean

  /**
   * Set the database to read-only mode
   * When true, all write operations will throw an error
   */
  readOnly?: boolean
}

export class BrainyData<T = any> {
  private index: HNSWIndex
  private storage: StorageAdapter | null = null
  private isInitialized = false
  private embeddingFunction: EmbeddingFunction
  private requestPersistentStorage: boolean
  private readOnly: boolean
  private storageConfig: BrainyDataConfig['storage'] = {}

  /**
   * Create a new vector database
   */
  constructor(config: BrainyDataConfig = {}) {
    // Initialize HNSW index
    this.index = new HNSWIndex(
      config.hnsw,
      config.distanceFunction || cosineDistance
    )

    // Set storage if provided, otherwise it will be initialized in init()
    this.storage = config.storageAdapter || null

    // Set embedding function if provided, otherwise use default
    this.embeddingFunction = config.embeddingFunction || defaultEmbeddingFunction

    // Set persistent storage request flag (support both new and deprecated options)
    this.requestPersistentStorage = 
      (config.storage?.requestPersistentStorage !== undefined) 
        ? config.storage.requestPersistentStorage 
        : (config.requestPersistentStorage || false)

    // Set read-only flag
    this.readOnly = config.readOnly || false

    // Store storage configuration for later use in init()
    this.storageConfig = config.storage || {}
  }

  /**
   * Check if the database is in read-only mode and throw an error if it is
   * @throws Error if the database is in read-only mode
   */
  private checkReadOnly(): void {
    if (this.readOnly) {
      throw new Error('Cannot perform write operation: database is in read-only mode')
    }
  }

  /**
   * Initialize the database
   * Loads existing data from storage if available
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize storage if not provided in constructor
      if (!this.storage) {
        // Combine storage config with requestPersistentStorage for backward compatibility
        const storageOptions = {
          ...this.storageConfig,
          requestPersistentStorage: this.requestPersistentStorage
        };

        this.storage = await createStorage(storageOptions);
      }

      // Initialize storage
      await this.storage!.init()

      // Load all nouns from storage
      const nouns: HNSWNoun[] = await this.storage!.getAllNouns()

      // Clear the index and add all nouns
      this.index.clear()
      for (const noun of nouns) {
        // Add to index
        this.index.addItem({
          id: noun.id,
          vector: noun.vector
        })
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize BrainyData:', error)
      throw new Error(`Failed to initialize BrainyData: ${error}`)
    }
  }

  /**
   * Add a vector or data to the database
   * If the input is not a vector, it will be converted using the embedding function
   * @param vectorOrData Vector or data to add
   * @param metadata Optional metadata to associate with the vector
   * @param options Additional options
   * @returns The ID of the added vector
   */
  public async add(
    vectorOrData: Vector | any,
    metadata?: T,
    options: {
      forceEmbed?: boolean // Force using the embedding function even if input is a vector
    } = {}
  ): Promise<string> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    try {
      let vector: Vector

      // Check if input is already a vector
      if (
        Array.isArray(vectorOrData) &&
        vectorOrData.every((item) => typeof item === 'number') &&
        !options.forceEmbed
      ) {
        // Input is already a vector
        vector = vectorOrData
      } else {
        // Input needs to be vectorized
        try {
          vector = await this.embeddingFunction(vectorOrData)
        } catch (embedError) {
          throw new Error(`Failed to vectorize data: ${embedError}`)
        }
      }

      // Check if vector is defined
      if (!vector) {
        throw new Error('Vector is undefined or null')
      }

      // Generate ID if isn't provided
      const id = uuidv4()

      // Add to index
      this.index.addItem({ id, vector })

      // Get the noun from the index
      const noun = this.index.getNodes().get(id)

      if (!noun) {
        throw new Error(`Failed to retrieve newly created noun with ID ${id}`)
      }

      // Save noun to storage
      await this.storage!.saveNoun(noun)

      // Save metadata if provided
      if (metadata !== undefined) {
        // Validate noun type if metadata is for a GraphNoun
        if (metadata && typeof metadata === 'object' && 'noun' in metadata) {
          const nounType = (metadata as any).noun;

          // Check if the noun type is valid
          const isValidNounType = Object.values(NounType).includes(nounType);

          if (!isValidNounType) {
            console.warn(`Invalid noun type: ${nounType}. Falling back to GraphNoun.`);
            // Set a default noun type
            (metadata as any).noun = NounType.Concept;
          }
        }

        await this.storage!.saveMetadata(id, metadata)
      }

      return id
    } catch (error) {
      console.error('Failed to add vector:', error)
      throw new Error(`Failed to add vector: ${error}`)
    }
  }

  /**
   * Add multiple vectors or data items to the database
   * @param items Array of items to add
   * @param options Additional options
   * @returns Array of IDs for the added items
   */
  public async addBatch(
    items: Array<{
      vectorOrData: Vector | any;
      metadata?: T
    }>,
    options: {
      forceEmbed?: boolean // Force using the embedding function even if input is a vector
    } = {}
  ): Promise<string[]> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    const ids: string[] = []

    try {
      for (const item of items) {
        const id = await this.add(item.vectorOrData, item.metadata, options)
        ids.push(id)
      }

      return ids
    } catch (error) {
      console.error('Failed to add batch of items:', error)
      throw new Error(`Failed to add batch of items: ${error}`)
    }
  }

  /**
   * Search for similar vectors within specific noun types
   * @param queryVectorOrData Query vector or data to search for
   * @param k Number of results to return
   * @param nounTypes Array of noun types to search within, or null to search all
   * @param options Additional options
   * @returns Array of search results
   */
  public async searchByNounTypes(
    queryVectorOrData: Vector | any,
    k: number = 10,
    nounTypes: string[] | null = null,
    options: {
      forceEmbed?: boolean // Force using the embedding function even if input is a vector
    } = {}
  ): Promise<SearchResult<T>[]> {
    await this.ensureInitialized()

    try {
      let queryVector: Vector

      // Check if input is already a vector
      if (
        Array.isArray(queryVectorOrData) &&
        queryVectorOrData.every((item) => typeof item === 'number') &&
        !options.forceEmbed
      ) {
        // Input is already a vector
        queryVector = queryVectorOrData
      } else {
        // Input needs to be vectorized
        try {
          queryVector = await this.embeddingFunction(queryVectorOrData)
        } catch (embedError) {
          throw new Error(`Failed to vectorize query data: ${embedError}`)
        }
      }

      // Check if query vector is defined
      if (!queryVector) {
        throw new Error('Query vector is undefined or null')
      }

      // If no noun types specified, search all nouns
      if (!nounTypes || nounTypes.length === 0) {
        // Search in the index
        const results = this.index.search(queryVector, k)

        // Get metadata for each result
        const searchResults: SearchResult<T>[] = []

        for (const [id, score] of results) {
          const noun = this.index.getNodes().get(id)
          if (!noun) {
            continue
          }

          const metadata = await this.storage!.getMetadata(id)

          searchResults.push({
            id,
            score,
            vector: noun.vector,
            metadata
          })
        }

        return searchResults
      } else {
        // Get nouns for each noun type in parallel
        const nounPromises = nounTypes.map(nounType => this.storage!.getNounsByNounType(nounType))
        const nounArrays = await Promise.all(nounPromises)

        // Combine all nouns
        const nouns: HNSWNoun[] = []
        for (const nounArray of nounArrays) {
          nouns.push(...nounArray)
        }

        // Calculate distances for each noun
        const results: Array<[string, number]> = []
        for (const noun of nouns) {
          const distance = this.index.getDistanceFunction()(queryVector, noun.vector)
          results.push([noun.id, distance])
        }

        // Sort by distance (ascending)
        results.sort((a, b) => a[1] - b[1])

        // Take top k results
        const topResults = results.slice(0, k)

        // Get metadata for each result
        const searchResults: SearchResult<T>[] = []

        for (const [id, score] of topResults) {
          const noun = nouns.find(n => n.id === id)
          if (!noun) {
            continue
          }

          const metadata = await this.storage!.getMetadata(id)

          searchResults.push({
            id,
            score,
            vector: noun.vector,
            metadata
          })
        }

        return searchResults
      }
    } catch (error) {
      console.error('Failed to search vectors by noun types:', error)
      throw new Error(`Failed to search vectors by noun types: ${error}`)
    }
  }

  /**
   * Search for similar vectors
   * @param queryVectorOrData Query vector or data to search for
   * @param k Number of results to return
   * @param options Additional options
   * @returns Array of search results
   */
  public async search(
    queryVectorOrData: Vector | any,
    k: number = 10,
    options: {
      forceEmbed?: boolean, // Force using the embedding function even if input is a vector
      nounTypes?: string[], // Optional array of noun types to search within
      includeVerbs?: boolean // Whether to include associated GraphVerbs in the results
    } = {}
  ): Promise<SearchResult<T>[]> {
    // If input is a string and not a vector, automatically vectorize it
    let queryToUse = queryVectorOrData;
    if (typeof queryVectorOrData === 'string' && !options.forceEmbed) {
      queryToUse = await this.embed(queryVectorOrData);
      options.forceEmbed = false; // Already embedded, don't force again
    }

    // If noun types are specified, use searchByNounTypes
    let searchResults;
    if (options.nounTypes && options.nounTypes.length > 0) {
      searchResults = await this.searchByNounTypes(queryToUse, k, options.nounTypes, {
        forceEmbed: options.forceEmbed
      });
    } else {
      // Otherwise, search all GraphNouns
      searchResults = await this.searchByNounTypes(queryToUse, k, null, {
        forceEmbed: options.forceEmbed
      });
    }

    // If includeVerbs is true, retrieve associated GraphVerbs for each result
    if (options.includeVerbs && this.storage) {
      for (const result of searchResults) {
        try {
          // Get outgoing verbs for this noun
          const outgoingVerbs = await this.storage.getVerbsBySource(result.id);

          // Get incoming verbs for this noun
          const incomingVerbs = await this.storage.getVerbsByTarget(result.id);

          // Combine all verbs
          const allVerbs = [...outgoingVerbs, ...incomingVerbs];

          // Add verbs to the result metadata
          if (!result.metadata) {
            result.metadata = {} as T;
          }

          // Add the verbs to the metadata
          (result.metadata as any).associatedVerbs = allVerbs;
        } catch (error) {
          console.warn(`Failed to retrieve verbs for noun ${result.id}:`, error);
        }
      }
    }

    return searchResults;
  }

  /**
   * Get a vector by ID
   */
  public async get(id: string): Promise<VectorDocument<T> | null> {
    await this.ensureInitialized()

    try {
      // Get noun from index
      const noun = this.index.getNodes().get(id)
      if (!noun) {
        return null
      }

      // Get metadata
      const metadata = await this.storage!.getMetadata(id)

      return {
        id,
        vector: noun.vector,
        metadata
      }
    } catch (error) {
      console.error(`Failed to get vector ${id}:`, error)
      throw new Error(`Failed to get vector ${id}: ${error}`)
    }
  }

  /**
   * Delete a vector by ID
   */
  public async delete(id: string): Promise<boolean> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    try {
      // Remove from index
      const removed = this.index.removeItem(id)
      if (!removed) {
        return false
      }

      // Remove from storage
      await this.storage!.deleteNoun(id)

      // Try to remove metadata (ignore errors)
      try {
        await this.storage!.saveMetadata(id, null)
      } catch (error) {
        // Ignore
      }

      return true
    } catch (error) {
      console.error(`Failed to delete vector ${id}:`, error)
      throw new Error(`Failed to delete vector ${id}: ${error}`)
    }
  }

  /**
   * Update metadata for a vector
   */
  public async updateMetadata(id: string, metadata: T): Promise<boolean> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    try {
      // Check if a vector exists
      const noun = this.index.getNodes().get(id)
      if (!noun) {
        return false
      }

      // Validate noun type if metadata is for a GraphNoun
      if (metadata && typeof metadata === 'object' && 'noun' in metadata) {
        const nounType = (metadata as any).noun;

        // Check if the noun type is valid
        const isValidNounType = Object.values(NounType).includes(nounType);

        if (!isValidNounType) {
          console.warn(`Invalid noun type: ${nounType}. Falling back to GraphNoun.`);
          // Set a default noun type
          (metadata as any).noun = NounType.Concept;
        }
      }

      // Update metadata
      await this.storage!.saveMetadata(id, metadata)

      return true
    } catch (error) {
      console.error(`Failed to update metadata for vector ${id}:`, error)
      throw new Error(`Failed to update metadata for vector ${id}: ${error}`)
    }
  }

  /**
   * Add a verb between two nouns
   * If metadata is provided and vector is not, the metadata will be vectorized using the embedding function
   */
  public async addVerb(
    sourceId: string,
    targetId: string,
    vector?: Vector,
    options: {
      type?: string
      weight?: number
      metadata?: any
      forceEmbed?: boolean // Force using the embedding function for metadata even if vector is provided
    } = {}
  ): Promise<string> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    try {
      // Check if source and target nouns exist
      const sourceNoun = this.index.getNodes().get(sourceId)
      const targetNoun = this.index.getNodes().get(targetId)

      if (!sourceNoun) {
        throw new Error(`Source noun with ID ${sourceId} not found`)
      }

      if (!targetNoun) {
        throw new Error(`Target noun with ID ${targetId} not found`)
      }

      // Generate ID for the verb
      const id = uuidv4()

      let verbVector: Vector

      // If metadata is provided and no vector is provided or forceEmbed is true, vectorize the metadata
      if (options.metadata && (!vector || options.forceEmbed)) {
        try {
          verbVector = await this.embeddingFunction(options.metadata)
        } catch (embedError) {
          throw new Error(`Failed to vectorize verb metadata: ${embedError}`)
        }
      } else {
        // Use a provided vector or average of source and target vectors
        verbVector =
          vector ||
          sourceNoun.vector.map((val, i) => (val + targetNoun.vector[i]) / 2)
      }

      // Validate verb type if provided
      let verbType = options.type;
      if (verbType) {
        // Check if the verb type is valid
        const isValidVerbType = Object.values(VerbType).includes(verbType as any);

        if (!isValidVerbType) {
          console.warn(`Invalid verb type: ${verbType}. Using RelatedTo as default.`);
          // Set a default verb type
          verbType = VerbType.RelatedTo;
        }
      }

      // Create verb
      const verb: GraphVerb = {
        id,
        vector: verbVector,
        connections: new Map(),
        sourceId,
        targetId,
        type: verbType,
        weight: options.weight,
        metadata: options.metadata
      }

      // Add to index
      this.index.addItem({ id, vector: verbVector })

      // Get the noun from the index
      const indexNoun = this.index.getNodes().get(id)

      if (!indexNoun) {
        throw new Error(
          `Failed to retrieve newly created verb noun with ID ${id}`
        )
      }

      // Update verb connections from index
      verb.connections = indexNoun.connections

      // Save verb to storage
      await this.storage!.saveVerb(verb)

      return id
    } catch (error) {
      console.error('Failed to add verb:', error)
      throw new Error(`Failed to add verb: ${error}`)
    }
  }

  /**
   * Get a verb by ID
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getVerb(id)
    } catch (error) {
      console.error(`Failed to get verb ${id}:`, error)
      throw new Error(`Failed to get verb ${id}: ${error}`)
    }
  }

  /**
   * Get all verbs
   */
  public async getAllVerbs(): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getAllVerbs()
    } catch (error) {
      console.error('Failed to get all verbs:', error)
      throw new Error(`Failed to get all verbs: ${error}`)
    }
  }

  /**
   * Get verbs by source noun ID
   */
  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getVerbsBySource(sourceId)
    } catch (error) {
      console.error(`Failed to get verbs by source ${sourceId}:`, error)
      throw new Error(`Failed to get verbs by source ${sourceId}: ${error}`)
    }
  }

  /**
   * Get verbs by target noun ID
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getVerbsByTarget(targetId)
    } catch (error) {
      console.error(`Failed to get verbs by target ${targetId}:`, error)
      throw new Error(`Failed to get verbs by target ${targetId}: ${error}`)
    }
  }

  /**
   * Get verbs by type
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getVerbsByType(type)
    } catch (error) {
      console.error(`Failed to get verbs by type ${type}:`, error)
      throw new Error(`Failed to get verbs by type ${type}: ${error}`)
    }
  }

  /**
   * Delete a verb
   */
  public async deleteVerb(id: string): Promise<boolean> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    try {
      // Remove from index
      const removed = this.index.removeItem(id)
      if (!removed) {
        return false
      }

      // Remove from storage
      await this.storage!.deleteVerb(id)

      return true
    } catch (error) {
      console.error(`Failed to delete verb ${id}:`, error)
      throw new Error(`Failed to delete verb ${id}: ${error}`)
    }
  }

  /**
   * Clear the database
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized()

    // Check if database is in read-only mode
    this.checkReadOnly()

    try {
      // Clear index
      this.index.clear()

      // Clear storage
      await this.storage!.clear()
    } catch (error) {
      console.error('Failed to clear vector database:', error)
      throw new Error(`Failed to clear vector database: ${error}`)
    }
  }

  /**
   * Get the number of vectors in the database
   */
  public size(): number {
    return this.index.size()
  }

  /**
   * Check if the database is in read-only mode
   * @returns True if the database is in read-only mode, false otherwise
   */
  public isReadOnly(): boolean {
    return this.readOnly
  }

  /**
   * Set the database to read-only mode
   * @param readOnly True to set the database to read-only mode, false to allow writes
   */
  public setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly
  }

  /**
   * Embed text or data into a vector using the same embedding function used by this instance
   * This allows clients to use the same TensorFlow Universal Sentence Encoder throughout their application
   *
   * @param data Text or data to embed
   * @returns A promise that resolves to the embedded vector
   */
  public async embed(data: string | string[]): Promise<Vector> {
    await this.ensureInitialized()

    try {
      return await this.embeddingFunction(data)
    } catch (error) {
      console.error('Failed to embed data:', error)
      throw new Error(`Failed to embed data: ${error}`)
    }
  }

  /**
   * Search for similar documents using a text query
   * This is a convenience method that embeds the query text and performs a search
   *
   * @param query Text query to search for
   * @param k Number of results to return
   * @param options Additional options
   * @returns Array of search results
   */
  public async searchText(
    query: string, 
    k: number = 10, 
    options: {
      nounTypes?: string[],
      includeVerbs?: boolean
    } = {}
  ): Promise<SearchResult<T>[]> {
    await this.ensureInitialized()

    try {
      // Embed the query text
      const queryVector = await this.embed(query)

      // Search using the embedded vector
      return await this.search(queryVector, k, {
        nounTypes: options.nounTypes,
        includeVerbs: options.includeVerbs
      })
    } catch (error) {
      console.error('Failed to search with text query:', error)
      throw new Error(`Failed to search with text query: ${error}`)
    }
  }

  /**
   * Ensure the database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * Get information about the current storage usage and capacity
   * @returns Object containing the storage type, used space, quota, and additional details
   */
  public async status(): Promise<{
    type: string;
    used: number;
    quota: number | null;
    details?: Record<string, any>;
  }> {
    await this.ensureInitialized()

    if (!this.storage) {
      return {
        type: 'unknown',
        used: 0,
        quota: null,
        details: { error: 'Storage not initialized' }
      }
    }

    try {
      // Check if the storage adapter has a getStorageStatus method
      if (typeof this.storage.getStorageStatus !== 'function') {
        // If not, determine the storage type based on the constructor name
        const storageType = this.storage.constructor.name.toLowerCase().replace('storage', '')
        return {
          type: storageType || 'unknown',
          used: 0,
          quota: null,
          details: {
            error: 'Storage adapter does not implement getStorageStatus method',
            storageAdapter: this.storage.constructor.name,
            indexSize: this.size()
          }
        }
      }

      // Get storage status from the storage adapter
      const storageStatus = await this.storage.getStorageStatus()

      // Add index information to the details
      const indexInfo = {
        indexSize: this.size()
      }

      // Ensure all required fields are present
      return {
        type: storageStatus.type || 'unknown',
        used: storageStatus.used || 0,
        quota: storageStatus.quota || null,
        details: {
          ...(storageStatus.details || {}),
          index: indexInfo
        }
      }
    } catch (error) {
      console.error('Failed to get storage status:', error)

      // Determine the storage type based on the constructor name
      const storageType = this.storage.constructor.name.toLowerCase().replace('storage', '')

      return {
        type: storageType || 'unknown',
        used: 0,
        quota: null,
        details: {
          error: String(error),
          storageAdapter: this.storage.constructor.name,
          indexSize: this.size()
        }
      }
    }
  }
}

// Export distance functions for convenience
export { euclideanDistance, cosineDistance, manhattanDistance, dotProductDistance } from './utils/index.js'
