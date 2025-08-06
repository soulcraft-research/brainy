/**
 * File System Storage Adapter
 * File system storage adapter for Node.js environments
 */

import { GraphVerb, HNSWNoun, HNSWVerb, StatisticsData } from '../../coreTypes.js'
import {
  BaseStorage,
  NOUNS_DIR,
  VERBS_DIR,
  METADATA_DIR,
  NOUN_METADATA_DIR,
  VERB_METADATA_DIR,
  INDEX_DIR,
  SYSTEM_DIR,
  STATISTICS_KEY
} from '../baseStorage.js'
import { StorageCompatibilityLayer, StoragePaths } from '../backwardCompatibility.js'

// Type aliases for better readability
type HNSWNode = HNSWNoun
type Edge = HNSWVerb

// Node.js modules - dynamically imported to avoid issues in browser environments
let fs: any
let path: any
let moduleLoadingPromise: Promise<void> | null = null

// Try to load Node.js modules
try {
  // Using dynamic imports to avoid issues in browser environments
  const fsPromise = import('fs')
  const pathPromise = import('path')

  moduleLoadingPromise = Promise.all([fsPromise, pathPromise])
    .then(([fsModule, pathModule]) => {
      fs = fsModule
      path = pathModule.default
    })
    .catch((error) => {
      console.error('Failed to load Node.js modules:', error)
      throw error
    })
} catch (error) {
  console.error(
    'FileSystemStorage: Failed to load Node.js modules. This adapter is not supported in this environment.',
    error
  )
}

/**
 * File system storage adapter for Node.js environments
 * Uses the file system to store data in the specified directory structure
 */
export class FileSystemStorage extends BaseStorage {
  private rootDir: string
  private nounsDir!: string
  private verbsDir!: string
  private metadataDir!: string
  private nounMetadataDir!: string
  private verbMetadataDir!: string
  private indexDir!: string  // Legacy - for backward compatibility
  private systemDir!: string  // New location for system data
  private lockDir!: string
  private useDualWrite: boolean = true  // Write to both locations during migration
  private activeLocks: Set<string> = new Set()

  /**
   * Initialize the storage adapter
   * @param rootDirectory The root directory for storage
   */
  constructor(rootDirectory: string) {
    super()
    this.rootDir = rootDirectory
    // Defer path operations until init() when path module is guaranteed to be loaded
  }

  /**
   * Initialize the storage adapter
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // Wait for module loading to complete
    if (moduleLoadingPromise) {
      try {
        await moduleLoadingPromise
      } catch (error) {
        throw new Error(
          'FileSystemStorage requires a Node.js environment, but `fs` and `path` modules could not be loaded.'
        )
      }
    }

    // Check if Node.js modules are available
    if (!fs || !path) {
      throw new Error(
        'FileSystemStorage requires a Node.js environment, but `fs` and `path` modules could not be loaded.'
      )
    }

    try {
      // Initialize directory paths now that path module is loaded
      this.nounsDir = path.join(this.rootDir, NOUNS_DIR)
      this.verbsDir = path.join(this.rootDir, VERBS_DIR)
      this.metadataDir = path.join(this.rootDir, METADATA_DIR)
      this.nounMetadataDir = path.join(this.rootDir, NOUN_METADATA_DIR)
      this.verbMetadataDir = path.join(this.rootDir, VERB_METADATA_DIR)
      this.indexDir = path.join(this.rootDir, INDEX_DIR)  // Legacy
      this.systemDir = path.join(this.rootDir, SYSTEM_DIR)  // New
      this.lockDir = path.join(this.rootDir, 'locks')

      // Create the root directory if it doesn't exist
      await this.ensureDirectoryExists(this.rootDir)

      // Create the nouns directory if it doesn't exist
      await this.ensureDirectoryExists(this.nounsDir)

      // Create the verbs directory if it doesn't exist
      await this.ensureDirectoryExists(this.verbsDir)

      // Create the metadata directory if it doesn't exist
      await this.ensureDirectoryExists(this.metadataDir)

      // Create the noun metadata directory if it doesn't exist
      await this.ensureDirectoryExists(this.nounMetadataDir)

      // Create the verb metadata directory if it doesn't exist
      await this.ensureDirectoryExists(this.verbMetadataDir)

      // Create both directories for backward compatibility
      await this.ensureDirectoryExists(this.systemDir)
      // Only create legacy directory if it exists (don't create new legacy dirs)
      if (await this.directoryExists(this.indexDir)) {
        await this.ensureDirectoryExists(this.indexDir)
      }

      // Create the locks directory if it doesn't exist
      await this.ensureDirectoryExists(this.lockDir)

      this.isInitialized = true
    } catch (error) {
      console.error('Error initializing FileSystemStorage:', error)
      throw error
    }
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(dirPath)
      return stats.isDirectory()
    } catch (error) {
      return false
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true })
    } catch (error: any) {
      // Ignore EEXIST error, which means the directory already exists
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * Save a node to storage
   */
  protected async saveNode(node: HNSWNode): Promise<void> {
    await this.ensureInitialized()

    // Convert connections Map to a serializable format
    const serializableNode = {
      ...node,
      connections: this.mapToObject(node.connections, (set) =>
        Array.from(set as Set<string>)
      )
    }

    const filePath = path.join(this.nounsDir, `${node.id}.json`)
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(serializableNode, null, 2)
    )
  }

  /**
   * Get a node from storage
   */
  protected async getNode(id: string): Promise<HNSWNode | null> {
    await this.ensureInitialized()

    const filePath = path.join(this.nounsDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      const parsedNode = JSON.parse(data)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedNode.id,
        vector: parsedNode.vector,
        connections,
        level: parsedNode.level || 0
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading node ${id}:`, error)
      }
      return null
    }
  }

  /**
   * Get all nodes from storage
   */
  protected async getAllNodes(): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    const allNodes: HNSWNode[] = []
    try {
      const files = await fs.promises.readdir(this.nounsDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.nounsDir, file)
          const data = await fs.promises.readFile(filePath, 'utf-8')
          const parsedNode = JSON.parse(data)

          // Convert serialized connections back to Map<number, Set<string>>
          const connections = new Map<number, Set<string>>()
          for (const [level, nodeIds] of Object.entries(
            parsedNode.connections
          )) {
            connections.set(Number(level), new Set(nodeIds as string[]))
          }

          allNodes.push({
            id: parsedNode.id,
            vector: parsedNode.vector,
            connections,
            level: parsedNode.level || 0
          })
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading directory ${this.nounsDir}:`, error)
      }
    }
    return allNodes
  }

  /**
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  protected async getNodesByNounType(nounType: string): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    const nouns: HNSWNode[] = []
    try {
      const files = await fs.promises.readdir(this.nounsDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.nounsDir, file)
          const data = await fs.promises.readFile(filePath, 'utf-8')
          const parsedNode = JSON.parse(data)

          // Filter by noun type using metadata
          const nodeId = parsedNode.id
          const metadata = await this.getMetadata(nodeId)
          if (metadata && metadata.noun === nounType) {
            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(
              parsedNode.connections
            )) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            nouns.push({
              id: parsedNode.id,
              vector: parsedNode.vector,
              connections,
              level: parsedNode.level || 0
            })
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading directory ${this.nounsDir}:`, error)
      }
    }

    return nouns
  }

  /**
   * Delete a node from storage
   */
  protected async deleteNode(id: string): Promise<void> {
    await this.ensureInitialized()

    const filePath = path.join(this.nounsDir, `${id}.json`)
    try {
      await fs.promises.unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting node file ${filePath}:`, error)
        throw error
      }
    }
  }

  /**
   * Save an edge to storage
   */
  protected async saveEdge(edge: Edge): Promise<void> {
    await this.ensureInitialized()

    // Convert connections Map to a serializable format
    const serializableEdge = {
      ...edge,
      connections: this.mapToObject(edge.connections, (set) =>
        Array.from(set as Set<string>)
      )
    }

    const filePath = path.join(this.verbsDir, `${edge.id}.json`)
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(serializableEdge, null, 2)
    )
  }

  /**
   * Get an edge from storage
   */
  protected async getEdge(id: string): Promise<Edge | null> {
    await this.ensureInitialized()

    const filePath = path.join(this.verbsDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      const parsedEdge = JSON.parse(data)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedEdge.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedEdge.id,
        vector: parsedEdge.vector,
        connections
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading edge ${id}:`, error)
      }
      return null
    }
  }

  /**
   * Get all edges from storage
   */
  protected async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    const allEdges: Edge[] = []
    try {
      const files = await fs.promises.readdir(this.verbsDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.verbsDir, file)
          const data = await fs.promises.readFile(filePath, 'utf-8')
          const parsedEdge = JSON.parse(data)

          // Convert serialized connections back to Map<number, Set<string>>
          const connections = new Map<number, Set<string>>()
          for (const [level, nodeIds] of Object.entries(
            parsedEdge.connections
          )) {
            connections.set(Number(level), new Set(nodeIds as string[]))
          }

          allEdges.push({
            id: parsedEdge.id,
            vector: parsedEdge.vector,
            connections
          })
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading directory ${this.verbsDir}:`, error)
      }
    }
    return allEdges
  }

  /**
   * Get edges by source
   */
  protected async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    // This method is deprecated and would require loading metadata for each edge
    // For now, return empty array since this is not efficiently implementable with new storage pattern
    console.warn('getEdgesBySource is deprecated and not efficiently supported in new storage pattern')
    return []
  }

  /**
   * Get edges by target
   */
  protected async getEdgesByTarget(targetId: string): Promise<Edge[]> {
    // This method is deprecated and would require loading metadata for each edge
    // For now, return empty array since this is not efficiently implementable with new storage pattern
    console.warn('getEdgesByTarget is deprecated and not efficiently supported in new storage pattern')
    return []
  }

  /**
   * Get edges by type
   */
  protected async getEdgesByType(type: string): Promise<Edge[]> {
    // This method is deprecated and would require loading metadata for each edge
    // For now, return empty array since this is not efficiently implementable with new storage pattern
    console.warn('getEdgesByType is deprecated and not efficiently supported in new storage pattern')
    return []
  }

  /**
   * Delete an edge from storage
   */
  protected async deleteEdge(id: string): Promise<void> {
    await this.ensureInitialized()

    const filePath = path.join(this.verbsDir, `${id}.json`)
    try {
      await fs.promises.unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting edge file ${filePath}:`, error)
        throw error
      }
    }
  }

  /**
   * Save metadata to storage
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    const filePath = path.join(this.metadataDir, `${id}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Get metadata from storage
   */
  public async getMetadata(id: string): Promise<any | null> {
    await this.ensureInitialized()

    const filePath = path.join(this.metadataDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading metadata ${id}:`, error)
      }
      return null
    }
  }

  /**
   * Save noun metadata to storage
   */
  public async saveNounMetadata(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    const filePath = path.join(this.nounMetadataDir, `${id}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Get noun metadata from storage
   */
  public async getNounMetadata(id: string): Promise<any | null> {
    await this.ensureInitialized()

    const filePath = path.join(this.nounMetadataDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading noun metadata ${id}:`, error)
      }
      return null
    }
  }

  /**
   * Save verb metadata to storage
   */
  public async saveVerbMetadata(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    const filePath = path.join(this.verbMetadataDir, `${id}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Get verb metadata from storage
   */
  public async getVerbMetadata(id: string): Promise<any | null> {
    await this.ensureInitialized()

    const filePath = path.join(this.verbMetadataDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading verb metadata ${id}:`, error)
      }
      return null
    }
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized()

    // Check if fs module is available
    if (!fs || !fs.promises) {
      console.warn('FileSystemStorage.clear: fs module not available, skipping clear operation')
      return
    }

    // Helper function to remove all files in a directory
    const removeDirectoryContents = async (dirPath: string): Promise<void> => {
      try {
        const files = await fs.promises.readdir(dirPath)
        for (const file of files) {
          const filePath = path.join(dirPath, file)
          const stats = await fs.promises.stat(filePath)
          if (stats.isDirectory()) {
            await removeDirectoryContents(filePath)
            await fs.promises.rmdir(filePath)
          } else {
            await fs.promises.unlink(filePath)
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Error removing directory contents ${dirPath}:`, error)
          throw error
        }
      }
    }

    // Remove all files in the nouns directory
    await removeDirectoryContents(this.nounsDir)

    // Remove all files in the verbs directory
    await removeDirectoryContents(this.verbsDir)

    // Remove all files in the metadata directory
    await removeDirectoryContents(this.metadataDir)

    // Remove all files in the noun metadata directory
    await removeDirectoryContents(this.nounMetadataDir)

    // Remove all files in the verb metadata directory
    await removeDirectoryContents(this.verbMetadataDir)

    // Remove all files in both system directories
    await removeDirectoryContents(this.systemDir)
    if (await this.directoryExists(this.indexDir)) {
      await removeDirectoryContents(this.indexDir)
    }
    
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
    await this.ensureInitialized()

    // Check if fs module is available
    if (!fs || !fs.promises) {
      console.warn('FileSystemStorage.getStorageStatus: fs module not available, returning default values')
      return {
        type: 'filesystem',
        used: 0,
        quota: null,
        details: {
          nounsCount: 0,
          verbsCount: 0,
          metadataCount: 0,
          directorySizes: {
            nouns: 0,
            verbs: 0,
            metadata: 0,
            index: 0
          }
        }
      }
    }

    try {
      // Calculate the total size of all files in the storage directories
      let totalSize = 0

      // Helper function to calculate directory size
      const calculateSize = async (dirPath: string): Promise<number> => {
        let size = 0
        try {
          const files = await fs.promises.readdir(dirPath)
          for (const file of files) {
            const filePath = path.join(dirPath, file)
            const stats = await fs.promises.stat(filePath)
            if (stats.isDirectory()) {
              size += await calculateSize(filePath)
            } else {
              size += stats.size
            }
          }
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            console.error(
              `Error calculating size for directory ${dirPath}:`,
              error
            )
          }
        }
        return size
      }

      // Calculate size for each directory
      const nounsDirSize = await calculateSize(this.nounsDir)
      const verbsDirSize = await calculateSize(this.verbsDir)
      const metadataDirSize = await calculateSize(this.metadataDir)
      const indexDirSize = await calculateSize(this.indexDir)

      totalSize = nounsDirSize + verbsDirSize + metadataDirSize + indexDirSize

      // Count files in each directory
      const nounsCount = (await fs.promises.readdir(this.nounsDir)).filter(
        (file: string) => file.endsWith('.json')
      ).length
      const verbsCount = (await fs.promises.readdir(this.verbsDir)).filter(
        (file: string) => file.endsWith('.json')
      ).length
      const metadataCount = (
        await fs.promises.readdir(this.metadataDir)
      ).filter((file: string) => file.endsWith('.json')).length

      // Count nouns by type using metadata
      const nounTypeCounts: Record<string, number> = {}
      const metadataFiles = await fs.promises.readdir(this.metadataDir)
      for (const file of metadataFiles) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.metadataDir, file)
            const data = await fs.promises.readFile(filePath, 'utf-8')
            const metadata = JSON.parse(data)
            if (metadata.noun) {
              nounTypeCounts[metadata.noun] =
                (nounTypeCounts[metadata.noun] || 0) + 1
            }
          } catch (error) {
            console.error(`Error reading metadata file ${file}:`, error)
          }
        }
      }

      return {
        type: 'filesystem',
        used: totalSize,
        quota: null, // File system doesn't provide quota information
        details: {
          rootDirectory: this.rootDir,
          nounsCount,
          verbsCount,
          metadataCount,
          nounsDirSize,
          verbsDirSize,
          metadataDirSize,
          indexDirSize,
          nounTypes: nounTypeCounts
        }
      }
    } catch (error) {
      console.error('Failed to get storage status:', error)
      return {
        type: 'filesystem',
        used: 0,
        quota: null,
        details: { error: String(error) }
      }
    }
  }

  /**
   * Implementation of abstract methods from BaseStorage
   */

  /**
   * Save a noun to storage
   */
  protected async saveNoun_internal(noun: HNSWNoun): Promise<void> {
    return this.saveNode(noun)
  }

  /**
   * Get a noun from storage
   */
  protected async getNoun_internal(id: string): Promise<HNSWNoun | null> {
    return this.getNode(id)
  }


  /**
   * Get nouns by noun type
   */
  protected async getNounsByNounType_internal(
    nounType: string
  ): Promise<HNSWNoun[]> {
    return this.getNodesByNounType(nounType)
  }

  /**
   * Delete a noun from storage
   */
  protected async deleteNoun_internal(id: string): Promise<void> {
    return this.deleteNode(id)
  }

  /**
   * Save a verb to storage
   */
  protected async saveVerb_internal(verb: HNSWVerb): Promise<void> {
    return this.saveEdge(verb)
  }

  /**
   * Get a verb from storage
   */
  protected async getVerb_internal(id: string): Promise<HNSWVerb | null> {
    return this.getEdge(id)
  }


  /**
   * Get verbs by source
   */
  protected async getVerbsBySource_internal(
    sourceId: string
  ): Promise<GraphVerb[]> {
    // This method is deprecated and would require loading metadata for each edge
    // For now, return empty array since this is not efficiently implementable with new storage pattern
    console.warn('getVerbsBySource_internal is deprecated and not efficiently supported in new storage pattern')
    return []
  }

  /**
   * Get verbs by target
   */
  protected async getVerbsByTarget_internal(
    targetId: string
  ): Promise<GraphVerb[]> {
    // This method is deprecated and would require loading metadata for each edge
    // For now, return empty array since this is not efficiently implementable with new storage pattern
    console.warn('getVerbsByTarget_internal is deprecated and not efficiently supported in new storage pattern')
    return []
  }

  /**
   * Get verbs by type
   */
  protected async getVerbsByType_internal(type: string): Promise<GraphVerb[]> {
    // This method is deprecated and would require loading metadata for each edge
    // For now, return empty array since this is not efficiently implementable with new storage pattern
    console.warn('getVerbsByType_internal is deprecated and not efficiently supported in new storage pattern')
    return []
  }

  /**
   * Delete a verb from storage
   */
  protected async deleteVerb_internal(id: string): Promise<void> {
    return this.deleteEdge(id)
  }

  /**
   * Acquire a file-based lock for coordinating operations across multiple processes
   * @param lockKey The key to lock on
   * @param ttl Time to live for the lock in milliseconds (default: 30 seconds)
   * @returns Promise that resolves to true if lock was acquired, false otherwise
   */
  private async acquireLock(
    lockKey: string,
    ttl: number = 30000
  ): Promise<boolean> {
    await this.ensureInitialized()

    const lockFile = path.join(this.lockDir, `${lockKey}.lock`)
    const lockValue = `${Date.now()}_${Math.random()}_${process.pid || 'unknown'}`
    const expiresAt = Date.now() + ttl

    try {
      // Check if lock file already exists and is still valid
      try {
        const lockData = await fs.promises.readFile(lockFile, 'utf-8')
        const lockInfo = JSON.parse(lockData)

        if (lockInfo.expiresAt > Date.now()) {
          // Lock exists and is still valid
          return false
        }
      } catch (error: any) {
        // If file doesn't exist or can't be read, we can proceed to create the lock
        if (error.code !== 'ENOENT') {
          console.warn(`Error reading lock file ${lockFile}:`, error)
        }
      }

      // Try to create the lock file
      const lockInfo = {
        lockValue,
        expiresAt,
        pid: process.pid || 'unknown',
        timestamp: Date.now()
      }

      await fs.promises.writeFile(lockFile, JSON.stringify(lockInfo, null, 2))

      // Add to active locks for cleanup
      this.activeLocks.add(lockKey)

      // Schedule automatic cleanup when lock expires
      setTimeout(() => {
        this.releaseLock(lockKey, lockValue).catch((error) => {
          console.warn(`Failed to auto-release expired lock ${lockKey}:`, error)
        })
      }, ttl)

      return true
    } catch (error) {
      console.warn(`Failed to acquire lock ${lockKey}:`, error)
      return false
    }
  }

  /**
   * Release a file-based lock
   * @param lockKey The key to unlock
   * @param lockValue The value used when acquiring the lock (for verification)
   * @returns Promise that resolves when lock is released
   */
  private async releaseLock(
    lockKey: string,
    lockValue?: string
  ): Promise<void> {
    await this.ensureInitialized()

    const lockFile = path.join(this.lockDir, `${lockKey}.lock`)

    try {
      // If lockValue is provided, verify it matches before releasing
      if (lockValue) {
        try {
          const lockData = await fs.promises.readFile(lockFile, 'utf-8')
          const lockInfo = JSON.parse(lockData)

          if (lockInfo.lockValue !== lockValue) {
            // Lock was acquired by someone else, don't release it
            return
          }
        } catch (error: any) {
          // If lock file doesn't exist, that's fine
          if (error.code === 'ENOENT') {
            return
          }
          throw error
        }
      }

      // Delete the lock file
      await fs.promises.unlink(lockFile)

      // Remove from active locks
      this.activeLocks.delete(lockKey)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`Failed to release lock ${lockKey}:`, error)
      }
    }
  }

  /**
   * Clean up expired lock files
   */
  private async cleanupExpiredLocks(): Promise<void> {
    await this.ensureInitialized()

    try {
      const lockFiles = await fs.promises.readdir(this.lockDir)
      const now = Date.now()

      for (const lockFile of lockFiles) {
        if (!lockFile.endsWith('.lock')) continue

        const lockPath = path.join(this.lockDir, lockFile)
        try {
          const lockData = await fs.promises.readFile(lockPath, 'utf-8')
          const lockInfo = JSON.parse(lockData)

          if (lockInfo.expiresAt <= now) {
            await fs.promises.unlink(lockPath)
            const lockKey = lockFile.replace('.lock', '')
            this.activeLocks.delete(lockKey)
          }
        } catch (error) {
          // If we can't read or parse the lock file, remove it
          try {
            await fs.promises.unlink(lockPath)
          } catch (unlinkError) {
            console.warn(
              `Failed to cleanup invalid lock file ${lockPath}:`,
              unlinkError
            )
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup expired locks:', error)
    }
  }

  /**
   * Save statistics data to storage with file-based locking
   */
  protected async saveStatisticsData(
    statistics: StatisticsData
  ): Promise<void> {
    const lockKey = 'statistics'
    const lockAcquired = await this.acquireLock(lockKey, 10000) // 10 second timeout

    if (!lockAcquired) {
      console.warn(
        'Failed to acquire lock for statistics update, proceeding without lock'
      )
    }

    try {
      // Get existing statistics to merge with new data
      const existingStats = await this.getStatisticsWithBackwardCompat()

      if (existingStats) {
        // Merge statistics data
        const mergedStats: StatisticsData = {
          totalNodes: Math.max(
            statistics.totalNodes || 0,
            existingStats.totalNodes || 0
          ),
          totalEdges: Math.max(
            statistics.totalEdges || 0,
            existingStats.totalEdges || 0
          ),
          totalMetadata: Math.max(
            statistics.totalMetadata || 0,
            existingStats.totalMetadata || 0
          ),
          // Preserve any additional fields from existing stats
          ...existingStats,
          // Override with new values where provided
          ...statistics,
          // Always update lastUpdated to current time
          lastUpdated: new Date().toISOString()
        }
        await this.saveStatisticsWithBackwardCompat(mergedStats)
      } else {
        // No existing statistics, save new ones
        const newStats: StatisticsData = {
          ...statistics,
          lastUpdated: new Date().toISOString()
        }
        await this.saveStatisticsWithBackwardCompat(newStats)
      }
    } finally {
      if (lockAcquired) {
        await this.releaseLock(lockKey)
      }
    }
  }

  /**
   * Get statistics data from storage
   */
  protected async getStatisticsData(): Promise<StatisticsData | null> {
    return this.getStatisticsWithBackwardCompat()
  }

  /**
   * Save statistics with backward compatibility (dual write)
   */
  private async saveStatisticsWithBackwardCompat(statistics: StatisticsData): Promise<void> {
    // Always write to new location
    const newPath = path.join(this.systemDir, `${STATISTICS_KEY}.json`)
    await this.ensureDirectoryExists(this.systemDir)
    await fs.promises.writeFile(newPath, JSON.stringify(statistics, null, 2))
    
    // During migration period, also write to old location if it exists
    if (this.useDualWrite && await this.directoryExists(this.indexDir)) {
      const oldPath = path.join(this.indexDir, `${STATISTICS_KEY}.json`)
      try {
        await fs.promises.writeFile(oldPath, JSON.stringify(statistics, null, 2))
      } catch (error) {
        // Log but don't fail if old location write fails
        StorageCompatibilityLayer.logMigrationEvent(
          'Failed to write to legacy location',
          { path: oldPath, error }
        )
      }
    }
  }

  /**
   * Get statistics with backward compatibility (dual read)
   */
  private async getStatisticsWithBackwardCompat(): Promise<StatisticsData | null> {
    let newStats: StatisticsData | null = null
    let oldStats: StatisticsData | null = null
    
    // Try to read from new location first
    try {
      const newPath = path.join(this.systemDir, `${STATISTICS_KEY}.json`)
      const data = await fs.promises.readFile(newPath, 'utf-8')
      newStats = JSON.parse(data)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading statistics from new location:', error)
      }
    }
    
    // Try to read from old location as fallback
    if (!newStats && await this.directoryExists(this.indexDir)) {
      try {
        const oldPath = path.join(this.indexDir, `${STATISTICS_KEY}.json`)
        const data = await fs.promises.readFile(oldPath, 'utf-8')
        oldStats = JSON.parse(data)
        
        // If we found data in old location but not new, migrate it
        if (oldStats && !newStats) {
          StorageCompatibilityLayer.logMigrationEvent(
            'Migrating statistics from legacy location'
          )
          await this.saveStatisticsWithBackwardCompat(oldStats)
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error('Error reading statistics from old location:', error)
        }
      }
    }
    
    // Merge statistics from both locations
    return StorageCompatibilityLayer.mergeStatistics(newStats, oldStats)
  }
}
