import {
  AugmentationType,
  IMemoryAugmentation,
  AugmentationResponse
} from '../types/augmentations.js'
import { StorageAdapter, Vector } from '../coreTypes.js'
import { MemoryStorage } from '../storage/opfsStorage.js'
import { FileSystemStorage } from '../storage/fileSystemStorage.js'
import { OPFSStorage } from '../storage/opfsStorage.js'
import { cosineDistance } from '../utils/distance.js'
import {
  FirestoreStorageAugmentation,
  FirestoreStorageConfig,
  createFirestoreStorageAugmentation
} from './firestoreStorageAugmentation.js'

/**
 * Base class for memory augmentations that wrap a StorageAdapter
 */
abstract class BaseMemoryAugmentation implements IMemoryAugmentation {
  readonly name: string
  readonly description: string = 'Base memory augmentation'
  enabled: boolean = true
  protected storage: StorageAdapter
  protected isInitialized = false

  constructor(name: string, storage: StorageAdapter) {
    this.name = name
    this.storage = storage
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      await this.storage.init()
      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error)
      throw new Error(`Failed to initialize ${this.name}: ${error}`)
    }
  }

  async shutDown(): Promise<void> {
    this.isInitialized = false
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return this.isInitialized ? 'active' : 'inactive'
  }

  async storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

    try {
      await this.storage.saveMetadata(key, data)
      return { success: true, data: true }
    } catch (error) {
      console.error(`Failed to store data for key ${key}:`, error)
      return {
        success: false,
        data: false,
        error: `Failed to store data: ${error}`
      }
    }
  }

  async retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      const data = await this.storage.getMetadata(key)
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error(`Failed to retrieve data for key ${key}:`, error)
      return {
        success: false,
        data: null,
        error: `Failed to retrieve data: ${error}`
      }
    }
  }

  async updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

    try {
      await this.storage.saveMetadata(key, data)
      return { success: true, data: true }
    } catch (error) {
      console.error(`Failed to update data for key ${key}:`, error)
      return {
        success: false,
        data: false,
        error: `Failed to update data: ${error}`
      }
    }
  }

  async deleteData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

    try {
      // There's no direct deleteMetadata method, so we save null
      await this.storage.saveMetadata(key, null)
      return { success: true, data: true }
    } catch (error) {
      console.error(`Failed to delete data for key ${key}:`, error)
      return {
        success: false,
        data: false,
        error: `Failed to delete data: ${error}`
      }
    }
  }

  async listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<string[]>> {
    // This is a limitation of the current StorageAdapter interface
    // It doesn't provide a way to list all metadata keys
    // We could implement this in the future by extending the StorageAdapter interface
    return {
      success: false,
      data: [],
      error: 'listDataKeys is not supported by this storage adapter'
    }
  }

  /**
   * Searches for data in the storage using vector similarity.
   * Implements the findNearest functionality by calculating distances client-side.
   * @param query The query vector or data to search for
   * @param k Number of results to return (default: 10)
   * @param options Optional search options
   */
  async search(
    query: unknown,
    k: number = 10,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<Array<{
    id: string;
    score: number;
    data: unknown;
  }>>> {
    await this.ensureInitialized()

    try {
      // Check if query is a vector
      let queryVector: Vector

      if (Array.isArray(query) && query.every(item => typeof item === 'number')) {
        queryVector = query as Vector
      } else {
        // If query is not a vector, we can't perform vector search
        return {
          success: false,
          data: [],
          error: 'Query must be a vector (array of numbers) for vector search'
        }
      }

      // Get all nodes from storage
      const nodes = await this.storage.getAllNodes()

      // Calculate distances and prepare results
      const results: Array<{
        id: string;
        score: number;
        data: unknown;
      }> = []

      for (const node of nodes) {
        // Skip nodes that don't have a vector
        if (!node.vector || !Array.isArray(node.vector)) {
          continue
        }

        // Get metadata for the node
        const metadata = await this.storage.getMetadata(node.id)

        // Calculate distance between query vector and node vector
        const distance = cosineDistance(queryVector, node.vector)

        // Convert distance to similarity score (1 - distance for cosine)
        // This way higher scores are better (more similar)
        const score = 1 - distance

        results.push({
          id: node.id,
          score,
          data: metadata
        })
      }

      // Sort results by score (descending) and take top k
      results.sort((a, b) => b.score - a.score)
      const topResults = results.slice(0, k)

      return {
        success: true,
        data: topResults
      }
    } catch (error) {
      console.error(`Failed to search in storage:`, error)
      return {
        success: false,
        data: [],
        error: `Failed to search in storage: ${error}`
      }
    }
  }

  protected async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

/**
 * Memory augmentation that uses in-memory storage
 */
export class MemoryStorageAugmentation extends BaseMemoryAugmentation {
  readonly description = 'Memory augmentation that stores data in memory'
  enabled = true

  constructor(name: string) {
    super(name, new MemoryStorage())
  }

  getType(): AugmentationType {
    return AugmentationType.MEMORY
  }
}

/**
 * Memory augmentation that uses file system storage
 */
export class FileSystemStorageAugmentation extends BaseMemoryAugmentation {
  readonly description = 'Memory augmentation that stores data in the file system'
  enabled = true

  constructor(name: string, rootDirectory?: string) {
    super(name, new FileSystemStorage(rootDirectory))
  }

  getType(): AugmentationType {
    return AugmentationType.MEMORY
  }
}

/**
 * Memory augmentation that uses OPFS (Origin Private File System) storage
 */
export class OPFSStorageAugmentation extends BaseMemoryAugmentation {
  readonly description = 'Memory augmentation that stores data in the Origin Private File System'
  enabled = true

  constructor(name: string) {
    super(name, new OPFSStorage())
  }

  getType(): AugmentationType {
    return AugmentationType.MEMORY
  }
}

/**
 * Factory function to create the appropriate memory augmentation based on the environment
 */
export async function createMemoryAugmentation(
  name: string,
  options: {
    storageType?: 'memory' | 'filesystem' | 'opfs' | 'firestore'
    rootDirectory?: string
    requestPersistentStorage?: boolean
    firestoreConfig?: FirestoreStorageConfig
  } = {}
): Promise<IMemoryAugmentation> {
  // If a specific storage type is requested, use that
  if (options.storageType) {
    switch (options.storageType) {
      case 'memory':
        return new MemoryStorageAugmentation(name)
      case 'filesystem':
        return new FileSystemStorageAugmentation(name, options.rootDirectory)
      case 'opfs':
        return new OPFSStorageAugmentation(name)
      case 'firestore':
        if (!options.firestoreConfig) {
          throw new Error('firestoreConfig is required when using Firestore storage')
        }
        return createFirestoreStorageAugmentation(name, options.firestoreConfig)
    }
  }

  // Otherwise, select based on environment
  const isNode = typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null

  if (isNode) {
    // In Node.js, use FileSystemStorage
    return new FileSystemStorageAugmentation(name, options.rootDirectory)
  } else {
    // In browser, try OPFS first
    const opfsStorage = new OPFSStorage()

    if (opfsStorage.isOPFSAvailable()) {
      // Request persistent storage if specified
      if (options.requestPersistentStorage) {
        await opfsStorage.requestPersistentStorage()
      }
      return new OPFSStorageAugmentation(name)
    } else {
      // Fall back to memory storage
      return new MemoryStorageAugmentation(name)
    }
  }
}
