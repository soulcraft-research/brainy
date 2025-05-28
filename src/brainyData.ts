/**
 * BrainyData
 * Main class that provides the vector database functionality
 */

import { v4 as uuidv4 } from 'uuid'
import { HNSWIndex } from './hnsw/hnswIndex.js'
import { createStorage } from './storage/opfsStorage.js'
import {
  DistanceFunction,
  Edge,
  EmbeddingFunction,
  HNSWConfig,
  SearchResult,
  StorageAdapter,
  Vector,
  VectorDocument
} from './coreTypes.js'
import { cosineDistance, defaultEmbeddingFunction, euclideanDistance } from './utils/index.js'

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
   * Embedding function to convert data to vectors
   */
  embeddingFunction?: EmbeddingFunction

  /**
   * Request persistent storage when running in a browser
   * This will prompt the user for permission to use persistent storage
   */
  requestPersistentStorage?: boolean
}

export class BrainyData<T = any> {
  private index: HNSWIndex
  private storage: StorageAdapter | null = null
  private isInitialized = false
  private embeddingFunction: EmbeddingFunction
  private requestPersistentStorage: boolean

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

    // Set persistent storage request flag
    this.requestPersistentStorage = config.requestPersistentStorage || false
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
        this.storage = await createStorage({
          requestPersistentStorage: this.requestPersistentStorage
        })
      }

      // Initialize storage
      await this.storage!.init()

      // Load all nodes from storage
      const nodes = await this.storage!.getAllNodes()

      // Clear the index and add all nodes
      this.index.clear()
      for (const node of nodes) {
        // Add to index
        this.index.addItem({
          id: node.id,
          vector: node.vector
        })
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize vector database:', error)
      throw new Error(`Failed to initialize vector database: ${error}`)
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

      // Get the node from the index
      const node = this.index.getNodes().get(id)

      if (!node) {
        throw new Error(`Failed to retrieve newly created node with ID ${id}`)
      }

      // Save node to storage
      await this.storage!.saveNode(node)

      // Save metadata if provided
      if (metadata !== undefined) {
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

      // Search in the index
      const results = this.index.search(queryVector, k)

      // Get metadata for each result
      const searchResults: SearchResult<T>[] = []

      for (const [id, score] of results) {
        const node = this.index.getNodes().get(id)
        if (!node) {
          continue
        }

        const metadata = await this.storage!.getMetadata(id)

        searchResults.push({
          id,
          score,
          vector: node.vector,
          metadata
        })
      }

      return searchResults
    } catch (error) {
      console.error('Failed to search vectors:', error)
      throw new Error(`Failed to search vectors: ${error}`)
    }
  }

  /**
   * Get a vector by ID
   */
  public async get(id: string): Promise<VectorDocument<T> | null> {
    await this.ensureInitialized()

    try {
      // Get node from index
      const node = this.index.getNodes().get(id)
      if (!node) {
        return null
      }

      // Get metadata
      const metadata = await this.storage!.getMetadata(id)

      return {
        id,
        vector: node.vector,
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

    try {
      // Remove from index
      const removed = this.index.removeItem(id)
      if (!removed) {
        return false
      }

      // Remove from storage
      await this.storage!.deleteNode(id)

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

    try {
      // Check if a vector exists
      const node = this.index.getNodes().get(id)
      if (!node) {
        return false
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
   * Add an edge between two nodes
   */
  public async addEdge(
    sourceId: string,
    targetId: string,
    vector?: Vector,
    options: {
      type?: string
      weight?: number
      metadata?: any
    } = {}
  ): Promise<string> {
    await this.ensureInitialized()

    try {
      // Check if source and target nodes exist
      const sourceNode = this.index.getNodes().get(sourceId)
      const targetNode = this.index.getNodes().get(targetId)

      if (!sourceNode) {
        throw new Error(`Source node with ID ${sourceId} not found`)
      }

      if (!targetNode) {
        throw new Error(`Target node with ID ${targetId} not found`)
      }

      // Generate ID for the edge
      const id = uuidv4()

      // Use a provided vector or average of source and target vectors
      const edgeVector =
        vector ||
        sourceNode.vector.map((val, i) => (val + targetNode.vector[i]) / 2)

      // Create edge
      const edge: Edge = {
        id,
        vector: edgeVector,
        connections: new Map(),
        sourceId,
        targetId,
        type: options.type,
        weight: options.weight,
        metadata: options.metadata
      }

      // Add to index
      this.index.addItem({ id, vector: edgeVector })

      // Get the node from the index
      const indexNode = this.index.getNodes().get(id)

      if (!indexNode) {
        throw new Error(
          `Failed to retrieve newly created edge node with ID ${id}`
        )
      }

      // Update edge connections from index
      edge.connections = indexNode.connections

      // Save edge to storage
      await this.storage!.saveEdge(edge)

      return id
    } catch (error) {
      console.error('Failed to add edge:', error)
      throw new Error(`Failed to add edge: ${error}`)
    }
  }

  /**
   * Get an edge by ID
   */
  public async getEdge(id: string): Promise<Edge | null> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getEdge(id)
    } catch (error) {
      console.error(`Failed to get edge ${id}:`, error)
      throw new Error(`Failed to get edge ${id}: ${error}`)
    }
  }

  /**
   * Get all edges
   */
  public async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getAllEdges()
    } catch (error) {
      console.error('Failed to get all edges:', error)
      throw new Error(`Failed to get all edges: ${error}`)
    }
  }

  /**
   * Get edges by source node ID
   */
  public async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getEdgesBySource(sourceId)
    } catch (error) {
      console.error(`Failed to get edges by source ${sourceId}:`, error)
      throw new Error(`Failed to get edges by source ${sourceId}: ${error}`)
    }
  }

  /**
   * Get edges by target node ID
   */
  public async getEdgesByTarget(targetId: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getEdgesByTarget(targetId)
    } catch (error) {
      console.error(`Failed to get edges by target ${targetId}:`, error)
      throw new Error(`Failed to get edges by target ${targetId}: ${error}`)
    }
  }

  /**
   * Get edges by type
   */
  public async getEdgesByType(type: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      return await this.storage!.getEdgesByType(type)
    } catch (error) {
      console.error(`Failed to get edges by type ${type}:`, error)
      throw new Error(`Failed to get edges by type ${type}: ${error}`)
    }
  }

  /**
   * Delete an edge
   */
  public async deleteEdge(id: string): Promise<boolean> {
    await this.ensureInitialized()

    try {
      // Remove from index
      const removed = this.index.removeItem(id)
      if (!removed) {
        return false
      }

      // Remove from storage
      await this.storage!.deleteEdge(id)

      return true
    } catch (error) {
      console.error(`Failed to delete edge ${id}:`, error)
      throw new Error(`Failed to delete edge ${id}: ${error}`)
    }
  }

  /**
   * Clear the database
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized()

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
   * @returns Array of search results
   */
  public async searchText(query: string, k: number = 10): Promise<SearchResult<T>[]> {
    await this.ensureInitialized()

    try {
      // Embed the query text
      const queryVector = await this.embed(query)

      // Search using the embedded vector
      return await this.search(queryVector, k)
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
      // Get storage status from the storage adapter
      const storageStatus = await this.storage.getStorageStatus()

      // Add index information to the details
      const indexInfo = {
        indexSize: this.size()
      }

      return {
        ...storageStatus,
        details: {
          ...storageStatus.details,
          index: indexInfo
        }
      }
    } catch (error) {
      console.error('Failed to get storage status:', error)
      return {
        type: 'unknown',
        used: 0,
        quota: null,
        details: { error: String(error) }
      }
    }
  }
}

// Export distance functions for convenience
export { euclideanDistance, cosineDistance, manhattanDistance, dotProductDistance } from './utils/index.js'
