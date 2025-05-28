import { Edge, HNSWNode, StorageAdapter } from '../coreTypes.js'

// We'll dynamically import Node.js built-in modules
let fs: any
let path: any

// Constants for directory and file names
const ROOT_DIR = 'brainy-data'
const NODES_DIR = 'nodes'
const EDGES_DIR = 'edges'
const METADATA_DIR = 'metadata'

/**
 * File system storage adapter for Node.js environments
 */
export class FileSystemStorage implements StorageAdapter {
  private rootDir: string
  private nodesDir: string
  private edgesDir: string
  private metadataDir: string
  private isInitialized = false

  constructor(rootDirectory?: string) {
    // We'll set the paths in the init method after dynamically importing the modules
    this.rootDir = rootDirectory || ''
    this.nodesDir = ''
    this.edgesDir = ''
    this.metadataDir = ''
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
      } catch (importError) {
        throw new Error(`Failed to import Node.js modules: ${importError}. This adapter requires a Node.js environment.`)
      }

      // Create directories if they don't exist
      await this.ensureDirectoryExists(this.rootDir)
      await this.ensureDirectoryExists(this.nodesDir)
      await this.ensureDirectoryExists(this.edgesDir)
      await this.ensureDirectoryExists(this.metadataDir)

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize file system storage:', error)
      throw new Error(`Failed to initialize file system storage: ${error}`)
    }
  }

  /**
   * Save a node to storage
   */
  public async saveNode(node: HNSWNode): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableNode = {
        ...node,
        connections: this.mapToObject(node.connections, (set) => Array.from(set))
      }

      const filePath = path.join(this.nodesDir, `${node.id}.json`)
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(serializableNode, null, 2),
        'utf8'
      )
    } catch (error) {
      console.error(`Failed to save node ${node.id}:`, error)
      throw new Error(`Failed to save node ${node.id}: ${error}`)
    }
  }

  /**
   * Get a node from storage
   */
  public async getNode(id: string): Promise<HNSWNode | null> {
    await this.ensureInitialized()

    try {
      const filePath = path.join(this.nodesDir, `${id}.json`)

      // Check if a file exists
      try {
        await fs.promises.access(filePath)
      } catch {
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
   * Get all nodes from storage
   */
  public async getAllNodes(): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    try {
      const files = await fs.promises.readdir(this.nodesDir)
      const nodePromises = files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => {
          const id = path.basename(file, '.json')
          return this.getNode(id)
        })

      const nodes = await Promise.all(nodePromises)
      return nodes.filter((node): node is HNSWNode => node !== null)
    } catch (error) {
      console.error('Failed to get all nodes:', error)
      throw new Error(`Failed to get all nodes: ${error}`)
    }
  }

  /**
   * Delete a node from storage
   */
  public async deleteNode(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      const filePath = path.join(this.nodesDir, `${id}.json`)

      // Check if a file exists before attempting to delete
      try {
        await fs.promises.access(filePath)
      } catch {
        return // File doesn't exist, nothing to delete
      }

      await fs.promises.unlink(filePath)
    } catch (error) {
      console.error(`Failed to delete node ${id}:`, error)
      throw new Error(`Failed to delete node ${id}: ${error}`)
    }
  }

  /**
   * Save an edge to storage
   */
  public async saveEdge(edge: Edge): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableEdge = {
        ...edge,
        connections: this.mapToObject(edge.connections, (set) => Array.from(set))
      }

      const filePath = path.join(this.edgesDir, `${edge.id}.json`)
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(serializableEdge, null, 2),
        'utf8'
      )
    } catch (error) {
      console.error(`Failed to save edge ${edge.id}:`, error)
      throw new Error(`Failed to save edge ${edge.id}: ${error}`)
    }
  }

  /**
   * Get an edge from storage
   */
  public async getEdge(id: string): Promise<Edge | null> {
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
  public async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const files = await fs.promises.readdir(this.edgesDir)
      const edgePromises = files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => {
          const id = path.basename(file, '.json')
          return this.getEdge(id)
        })

      const edges = await Promise.all(edgePromises)
      return edges.filter((edge): edge is Edge => edge !== null)
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
      const allEdges = await this.getAllEdges()
      return allEdges.filter(edge => edge.sourceId === sourceId)
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
      const allEdges = await this.getAllEdges()
      return allEdges.filter(edge => edge.targetId === targetId)
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
      const allEdges = await this.getAllEdges()
      return allEdges.filter(edge => edge.type === type)
    } catch (error) {
      console.error(`Failed to get edges by type ${type}:`, error)
      throw new Error(`Failed to get edges by type ${type}: ${error}`)
    }
  }

  /**
   * Delete an edge from storage
   */
  public async deleteEdge(id: string): Promise<void> {
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
   * Delete a directory and all its contents
   */
  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath)

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        await fs.promises.unlink(filePath)
      }
    } catch (error) {
      // If the directory doesn't exist, that's fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
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
}
