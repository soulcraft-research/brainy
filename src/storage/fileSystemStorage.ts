import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js'

// We'll dynamically import Node.js built-in modules
let fs: any
let path: any

// Constants for directory and file names
const ROOT_DIR = 'brainy-data'
const NODES_DIR = 'nodes'
const EDGES_DIR = 'edges'
const METADATA_DIR = 'metadata'

// Constants for noun type directories
const PERSON_DIR = 'person'
const PLACE_DIR = 'place'
const THING_DIR = 'thing'
const EVENT_DIR = 'event'
const CONCEPT_DIR = 'concept'
const CONTENT_DIR = 'content'
const DEFAULT_DIR = 'default' // For nodes without a noun type

/**
 * File system storage adapter for Node.js environments
 */
export class FileSystemStorage implements StorageAdapter {
  private rootDir: string
  private nodesDir: string
  private edgesDir: string
  private metadataDir: string
  private personDir: string
  private placeDir: string
  private thingDir: string
  private eventDir: string
  private conceptDir: string
  private contentDir: string
  private defaultDir: string
  private isInitialized = false

  constructor(rootDirectory?: string) {
    // We'll set the paths in the init method after dynamically importing the modules
    this.rootDir = rootDirectory || ''
    this.nodesDir = ''
    this.edgesDir = ''
    this.metadataDir = ''
    this.personDir = ''
    this.placeDir = ''
    this.thingDir = ''
    this.eventDir = ''
    this.conceptDir = ''
    this.contentDir = ''
    this.defaultDir = ''
  }

  /**
   * Initialize the storage adapter
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Dynamically import Node.js built-in modules
      try {
        // Import the modules
        const fsModule = await import('fs')
        const pathModule = await import('path')

        // Assign to our module-level variables
        fs = fsModule.default || fsModule
        path = pathModule.default || pathModule

        // Now set up the directory paths
        const rootDir = this.rootDir || process.cwd()
        this.rootDir = path.resolve(rootDir, ROOT_DIR)
        this.nodesDir = path.join(this.rootDir, NODES_DIR)
        this.edgesDir = path.join(this.rootDir, EDGES_DIR)
        this.metadataDir = path.join(this.rootDir, METADATA_DIR)

        // Set up noun type directory paths
        this.personDir = path.join(this.nodesDir, PERSON_DIR)
        this.placeDir = path.join(this.nodesDir, PLACE_DIR)
        this.thingDir = path.join(this.nodesDir, THING_DIR)
        this.eventDir = path.join(this.nodesDir, EVENT_DIR)
        this.conceptDir = path.join(this.nodesDir, CONCEPT_DIR)
        this.contentDir = path.join(this.nodesDir, CONTENT_DIR)
        this.defaultDir = path.join(this.nodesDir, DEFAULT_DIR)
      } catch (importError) {
        throw new Error(`Failed to import Node.js modules: ${importError}. This adapter requires a Node.js environment.`)
      }

      // Create directories if they don't exist
      await this.ensureDirectoryExists(this.rootDir)
      await this.ensureDirectoryExists(this.nodesDir)
      await this.ensureDirectoryExists(this.edgesDir)
      await this.ensureDirectoryExists(this.metadataDir)

      // Create noun type directories
      await this.ensureDirectoryExists(this.personDir)
      await this.ensureDirectoryExists(this.placeDir)
      await this.ensureDirectoryExists(this.thingDir)
      await this.ensureDirectoryExists(this.eventDir)
      await this.ensureDirectoryExists(this.conceptDir)
      await this.ensureDirectoryExists(this.contentDir)
      await this.ensureDirectoryExists(this.defaultDir)

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize file system storage:', error)
      throw new Error(`Failed to initialize file system storage: ${error}`)
    }
  }

  /**
   * Save a node to storage
   */
  public async saveNoun(noun: HNSWNoun): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableNode = {
        ...noun,
        connections: this.mapToObject(noun.connections, (set) => Array.from(set as Set<string>))
      }

      // Get the appropriate directory based on the node's metadata
      const nodeDir = await this.getNodeDirectory(noun.id)

      const filePath = path.join(nodeDir, `${noun.id}.json`)
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(serializableNode, null, 2),
        'utf8'
      )
    } catch (error) {
      console.error(`Failed to save node ${noun.id}:`, error)
      throw new Error(`Failed to save node ${noun.id}: ${error}`)
    }
  }

  /**
   * Get a node from storage
   */
  public async getNoun(id: string): Promise<HNSWNoun | null> {
    await this.ensureInitialized()

    try {
      // Get the appropriate directory based on the node's metadata
      const nodeDir = await this.getNodeDirectory(id)

      const filePath = path.join(nodeDir, `${id}.json`)

      // Check if a file exists
      try {
        await fs.promises.access(filePath)
      } catch {
        // If the file doesn't exist in the expected directory, try the default directory
        if (nodeDir !== this.defaultDir) {
          const defaultFilePath = path.join(this.defaultDir, `${id}.json`)
          try {
            await fs.promises.access(defaultFilePath)
            // If found in default directory, use that path
            const data = await fs.promises.readFile(defaultFilePath, 'utf8')
            const parsedNode = JSON.parse(data)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
              id: parsedNode.id,
              vector: parsedNode.vector,
              connections
            }
          } catch {
            // If not found in default directory either, try all noun type directories
            const directories = [
              this.personDir,
              this.placeDir,
              this.thingDir,
              this.eventDir,
              this.conceptDir,
              this.contentDir
            ]

            for (const dir of directories) {
              if (dir === nodeDir) continue // Skip the already checked directory

              const dirFilePath = path.join(dir, `${id}.json`)
              try {
                await fs.promises.access(dirFilePath)
                // If found in this directory, use that path
                const data = await fs.promises.readFile(dirFilePath, 'utf8')
                const parsedNode = JSON.parse(data)

                // Convert serialized connections back to Map<number, Set<string>>
                const connections = new Map<number, Set<string>>()
                for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
                  connections.set(Number(level), new Set(nodeIds as string[]))
                }

                return {
                  id: parsedNode.id,
                  vector: parsedNode.vector,
                  connections
                }
              } catch {
                // Continue to the next directory
              }
            }

            return null // File doesn't exist in any directory
          }
        }
        return null // File doesn't exist
      }

      const data = await fs.promises.readFile(filePath, 'utf8')
      const parsedNode = JSON.parse(data)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedNode.id,
        vector: parsedNode.vector,
        connections
      }
    } catch (error) {
      console.error(`Failed to get node ${id}:`, error)
      return null
    }
  }

  /**
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    await this.ensureInitialized()

    try {
      // Determine the directory based on the noun type
      let dir: string
      switch (nounType) {
        case 'person':
          dir = this.personDir
          break
        case 'place':
          dir = this.placeDir
          break
        case 'thing':
          dir = this.thingDir
          break
        case 'event':
          dir = this.eventDir
          break
        case 'concept':
          dir = this.conceptDir
          break
        case 'content':
          dir = this.contentDir
          break
        default:
          dir = this.defaultDir
      }

      const nodes: HNSWNoun[] = []

      try {
        const files = await fs.promises.readdir(dir)
        const nodePromises = files
          .filter((file: string) => file.endsWith('.json'))
          .map((file: string) => {
            // Use the file path directly instead of getNode to avoid redundant searches
            return this.readNodeFromFile(path.join(dir, file))
          })

        const dirNodes = await Promise.all(nodePromises)
        nodes.push(...dirNodes.filter((node): node is HNSWNoun => node !== null))
      } catch (dirError) {
        // If directory doesn't exist or can't be read, log a warning
        console.warn(`Could not read directory for noun type ${nounType}:`, dirError)
      }

      return nodes
    } catch (error) {
      console.error(`Failed to get nodes for noun type ${nounType}:`, error)
      throw new Error(`Failed to get nodes for noun type ${nounType}: ${error}`)
    }
  }

  /**
   * Get all nodes from storage
   */
  public async getAllNouns(): Promise<HNSWNoun[]> {
    await this.ensureInitialized()

    try {
      // Get all noun types
      const nounTypes = [
        'person',
        'place',
        'thing',
        'event',
        'concept',
        'content',
        'default'
      ]

      // Run searches in parallel for all noun types
      const nodePromises = nounTypes.map(nounType => this.getNounsByNounType(nounType))
      const nodeArrays = await Promise.all(nodePromises)

      // Combine all results
      const allNodes: HNSWNoun[] = []
      for (const nodes of nodeArrays) {
        allNodes.push(...nodes)
      }

      return allNodes
    } catch (error) {
      console.error('Failed to get all nodes:', error)
      throw new Error(`Failed to get all nodes: ${error}`)
    }
  }

  /**
   * Read a node from a file
   */
  private async readNodeFromFile(filePath: string): Promise<HNSWNoun | null> {
    try {
      const data = await fs.promises.readFile(filePath, 'utf8')
      const parsedNode = JSON.parse(data)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedNode.id,
        vector: parsedNode.vector,
        connections
      }
    } catch (error) {
      console.error(`Failed to read node from file ${filePath}:`, error)
      return null
    }
  }

  /**
   * Delete a node from storage
   */
  public async deleteNoun(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      // Get the appropriate directory based on the node's metadata
      const nodeDir = await this.getNodeDirectory(id)

      const filePath = path.join(nodeDir, `${id}.json`)

      // Check if a file exists before attempting to delete
      try {
        await fs.promises.access(filePath)
        await fs.promises.unlink(filePath)
        return // File found and deleted
      } catch {
        // If the file doesn't exist in the expected directory, try the default directory
        if (nodeDir !== this.defaultDir) {
          const defaultFilePath = path.join(this.defaultDir, `${id}.json`)
          try {
            await fs.promises.access(defaultFilePath)
            await fs.promises.unlink(defaultFilePath)
            return // File found and deleted
          } catch {
            // If not found in default directory either, try all noun type directories
            const directories = [
              this.personDir,
              this.placeDir,
              this.thingDir,
              this.eventDir,
              this.conceptDir,
              this.contentDir
            ]

            for (const dir of directories) {
              if (dir === nodeDir) continue // Skip the already checked directory

              const dirFilePath = path.join(dir, `${id}.json`)
              try {
                await fs.promises.access(dirFilePath)
                await fs.promises.unlink(dirFilePath)
                return // File found and deleted
              } catch {
                // Continue to the next directory
              }
            }

            return // File doesn't exist in any directory, nothing to delete
          }
        }
        return // File doesn't exist, nothing to delete
      }
    } catch (error) {
      console.error(`Failed to delete node ${id}:`, error)
      throw new Error(`Failed to delete node ${id}: ${error}`)
    }
  }

  /**
   * Save an edge to storage
   */
  public async saveVerb(verb: GraphVerb): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableEdge = {
        ...verb,
        connections: this.mapToObject(verb.connections, (set) => Array.from(set as Set<string>))
      }

      const filePath = path.join(this.edgesDir, `${verb.id}.json`)
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(serializableEdge, null, 2),
        'utf8'
      )
    } catch (error) {
      console.error(`Failed to save edge ${verb.id}:`, error)
      throw new Error(`Failed to save edge ${verb.id}: ${error}`)
    }
  }

  /**
   * Get an edge from storage
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    await this.ensureInitialized()

    try {
      const filePath = path.join(this.edgesDir, `${id}.json`)

      // Check if a file exists
      try {
        await fs.promises.access(filePath)
      } catch {
        return null // File doesn't exist
      }

      const data = await fs.promises.readFile(filePath, 'utf8')
      const parsedEdge = JSON.parse(data)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedEdge.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedEdge.id,
        vector: parsedEdge.vector,
        connections,
        sourceId: parsedEdge.sourceId,
        targetId: parsedEdge.targetId,
        type: parsedEdge.type,
        weight: parsedEdge.weight,
        metadata: parsedEdge.metadata
      }
    } catch (error) {
      console.error(`Failed to get edge ${id}:`, error)
      return null
    }
  }

  /**
   * Get all edges from storage
   */
  public async getAllVerbs(): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      const files = await fs.promises.readdir(this.edgesDir)
      const edgePromises = files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => {
          const id = path.basename(file, '.json')
          return this.getVerb(id)
        })

      const edges = await Promise.all(edgePromises)
      return edges.filter((edge): edge is GraphVerb => edge !== null)
    } catch (error) {
      console.error('Failed to get all edges:', error)
      throw new Error(`Failed to get all edges: ${error}`)
    }
  }

  /**
   * Get edges by source node ID
   */
  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllVerbs()
      return allEdges.filter(edge => edge.sourceId === sourceId)
    } catch (error) {
      console.error(`Failed to get edges by source ${sourceId}:`, error)
      throw new Error(`Failed to get edges by source ${sourceId}: ${error}`)
    }
  }

  /**
   * Get edges by target node ID
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllVerbs()
      return allEdges.filter(edge => edge.targetId === targetId)
    } catch (error) {
      console.error(`Failed to get edges by target ${targetId}:`, error)
      throw new Error(`Failed to get edges by target ${targetId}: ${error}`)
    }
  }

  /**
   * Get edges by type
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllVerbs()
      return allEdges.filter(edge => edge.type === type)
    } catch (error) {
      console.error(`Failed to get edges by type ${type}:`, error)
      throw new Error(`Failed to get edges by type ${type}: ${error}`)
    }
  }

  /**
   * Delete an edge from storage
   */
  public async deleteVerb(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      const filePath = path.join(this.edgesDir, `${id}.json`)

      // Check if a file exists before attempting to delete
      try {
        await fs.promises.access(filePath)
      } catch {
        return // File doesn't exist, nothing to delete
      }

      await fs.promises.unlink(filePath)
    } catch (error) {
      console.error(`Failed to delete edge ${id}:`, error)
      throw new Error(`Failed to delete edge ${id}: ${error}`)
    }
  }

  /**
   * Save metadata to storage
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    try {
      const filePath = path.join(this.metadataDir, `${id}.json`)
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(metadata, null, 2),
        'utf8'
      )
    } catch (error) {
      console.error(`Failed to save metadata for ${id}:`, error)
      throw new Error(`Failed to save metadata for ${id}: ${error}`)
    }
  }

  /**
   * Get metadata from storage
   */
  public async getMetadata(id: string): Promise<any | null> {
    await this.ensureInitialized()

    try {
      const filePath = path.join(this.metadataDir, `${id}.json`)

      // Check if a file exists
      try {
        await fs.promises.access(filePath)
      } catch {
        return null // File doesn't exist
      }

      const data = await fs.promises.readFile(filePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Failed to get metadata for ${id}:`, error)
      return null
    }
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized()

    try {
      // Delete and recreate the nodes, edges, and metadata directories
      await this.deleteDirectory(this.nodesDir)
      await this.deleteDirectory(this.edgesDir)
      await this.deleteDirectory(this.metadataDir)

      await this.ensureDirectoryExists(this.nodesDir)
      await this.ensureDirectoryExists(this.edgesDir)
      await this.ensureDirectoryExists(this.metadataDir)

      // Create noun type directories
      await this.ensureDirectoryExists(this.personDir)
      await this.ensureDirectoryExists(this.placeDir)
      await this.ensureDirectoryExists(this.thingDir)
      await this.ensureDirectoryExists(this.eventDir)
      await this.ensureDirectoryExists(this.conceptDir)
      await this.ensureDirectoryExists(this.contentDir)
      await this.ensureDirectoryExists(this.defaultDir)
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw new Error(`Failed to clear storage: ${error}`)
    }
  }

  /**
   * Ensure the storage adapter is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath)
    } catch {
      // Directory doesn't exist, create it
      await fs.promises.mkdir(dirPath, { recursive: true })
    }
  }

  /**
   * Delete a directory and all its contents recursively
   */
  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath)

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = await fs.promises.stat(filePath)

        if (stats.isDirectory()) {
          // Recursively delete subdirectories
          await this.deleteDirectory(filePath)
        } else {
          // Delete files
          await fs.promises.unlink(filePath)
        }
      }

      // After all contents are deleted, remove the directory itself
      await fs.promises.rmdir(dirPath)
    } catch (error) {
      // If the directory doesn't exist, that's fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Count the number of JSON files in a directory
   */
  private async countFilesInDirectory(dirPath: string): Promise<number> {
    try {
      const files = await fs.promises.readdir(dirPath)
      return files.filter((file: string) => file.endsWith('.json')).length
    } catch (error) {
      // If the directory doesn't exist, return 0
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0
      }
      throw error
    }
  }

  /**
   * Convert a Map to a plain object for serialization
   */
  private mapToObject<K extends string | number, V>(
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
   * Get the appropriate directory for a node based on its metadata
   */
  private async getNodeDirectory(id: string): Promise<string> {
    try {
      // Try to get the metadata for the node
      const metadata = await this.getMetadata(id)

      // If metadata exists and has a noun field, use the corresponding directory
      if (metadata && metadata.noun) {
        switch (metadata.noun) {
          case 'person':
            return this.personDir
          case 'place':
            return this.placeDir
          case 'thing':
            return this.thingDir
          case 'event':
            return this.eventDir
          case 'concept':
            return this.conceptDir
          case 'content':
            return this.contentDir
          default:
            return this.defaultDir
        }
      }

      // If no metadata or no noun field, use the default directory
      return this.defaultDir
    } catch (error) {
      // If there's an error getting the metadata, use the default directory
      return this.defaultDir
    }
  }

  /**
   * Get information about storage usage and capacity
   */
  public async getStorageStatus(): Promise<{
    type: string;
    used: number;
    quota: number | null;
    details?: Record<string, any>;
  }> {
    await this.ensureInitialized()

    try {
      // Calculate the total size of all files in the storage directories
      let totalSize = 0

      // Helper function to calculate directory size
      const calculateDirSize = async (dirPath: string): Promise<number> => {
        let size = 0
        try {
          const files = await fs.promises.readdir(dirPath)

          for (const file of files) {
            const filePath = path.join(dirPath, file)
            const stats = await fs.promises.stat(filePath)

            if (stats.isDirectory()) {
              size += await calculateDirSize(filePath)
            } else {
              size += stats.size
            }
          }
        } catch (error) {
          console.warn(`Error calculating size for ${dirPath}:`, error)
        }
        return size
      }

      // Calculate size for each directory
      const nodesDirSize = await calculateDirSize(this.nodesDir)
      const edgesDirSize = await calculateDirSize(this.edgesDir)
      const metadataDirSize = await calculateDirSize(this.metadataDir)

      // Calculate sizes of noun type directories
      const personDirSize = await calculateDirSize(this.personDir)
      const placeDirSize = await calculateDirSize(this.placeDir)
      const thingDirSize = await calculateDirSize(this.thingDir)
      const eventDirSize = await calculateDirSize(this.eventDir)
      const conceptDirSize = await calculateDirSize(this.conceptDir)
      const contentDirSize = await calculateDirSize(this.contentDir)
      const defaultDirSize = await calculateDirSize(this.defaultDir)

      // Note: The noun type directories are subdirectories of the nodes directory,
      // so their sizes are already included in nodesDirSize.
      // We don't need to add them again to avoid double counting.
      totalSize = nodesDirSize + edgesDirSize + metadataDirSize

      // Get filesystem information
      let quota = null
      let details: {
        nounTypes?: {
          person: { size: number; count: number };
          place: { size: number; count: number };
          thing: { size: number; count: number };
          event: { size: number; count: number };
          concept: { size: number; count: number };
          content: { size: number; count: number };
          default: { size: number; count: number };
        };
        availableSpace?: number;
        totalSpace?: number;
        freePercentage?: number;
      } = {
        nounTypes: {
          person: {
            size: personDirSize,
            count: await this.countFilesInDirectory(this.personDir)
          },
          place: {
            size: placeDirSize,
            count: await this.countFilesInDirectory(this.placeDir)
          },
          thing: {
            size: thingDirSize,
            count: await this.countFilesInDirectory(this.thingDir)
          },
          event: {
            size: eventDirSize,
            count: await this.countFilesInDirectory(this.eventDir)
          },
          concept: {
            size: conceptDirSize,
            count: await this.countFilesInDirectory(this.conceptDir)
          },
          content: {
            size: contentDirSize,
            count: await this.countFilesInDirectory(this.contentDir)
          },
          default: {
            size: defaultDirSize,
            count: await this.countFilesInDirectory(this.defaultDir)
          }
        }
      }

      try {
        // Try to get disk space information
        const stats = await fs.promises.statfs(this.rootDir)
        if (stats) {
          const availableSpace = stats.bavail * stats.bsize
          const totalSpace = stats.blocks * stats.bsize

          quota = totalSpace
          details = {
            availableSpace,
            totalSpace,
            freePercentage: (availableSpace / totalSpace) * 100
          }
        }
      } catch (error) {
        console.warn('Unable to get filesystem stats:', error)
        // If statfs is not available, try to use df command on Unix-like systems
        try {
          const { exec } = await import('child_process')
          const util = await import('util')
          const execPromise = util.promisify(exec)

          const { stdout } = await execPromise(`df -k "${this.rootDir}"`)
          const lines = stdout.trim().split('\n')
          if (lines.length > 1) {
            const parts = lines[1].split(/\s+/)
            if (parts.length >= 4) {
              const totalKB = parseInt(parts[1], 10)
              const usedKB = parseInt(parts[2], 10)
              const availableKB = parseInt(parts[3], 10)

              quota = totalKB * 1024
              details = {
                availableSpace: availableKB * 1024,
                totalSpace: totalKB * 1024,
                freePercentage: (availableKB / totalKB) * 100
              }
            }
          }
        } catch (dfError) {
          console.warn('Unable to get disk space using df command:', dfError)
        }
      }

      return {
        type: 'filesystem',
        used: totalSize,
        quota,
        details
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
}
