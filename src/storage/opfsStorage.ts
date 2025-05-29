/**
 * OPFS (Origin Private File System) Storage Adapter
 * Provides persistent storage for the vector database using the Origin Private File System API
 */

import { Edge, HNSWNode, StorageAdapter } from '../coreTypes.js'

// Directory and file names
const ROOT_DIR = 'opfs-vector-db'
const NODES_DIR = 'nodes'
const EDGES_DIR = 'edges'
const METADATA_DIR = 'metadata'
const DB_INFO_FILE = 'db-info.json'

export class OPFSStorage implements StorageAdapter {
  private rootDir: FileSystemDirectoryHandle | null = null
  private nodesDir: FileSystemDirectoryHandle | null = null
  private edgesDir: FileSystemDirectoryHandle | null = null
  private metadataDir: FileSystemDirectoryHandle | null = null
  private isInitialized = false
  private isAvailable = false
  private isPersistentRequested = false
  private isPersistentGranted = false

  constructor() {
    // Check if OPFS is available
    this.isAvailable =
      typeof navigator !== 'undefined' &&
      'storage' in navigator &&
      'getDirectory' in navigator.storage
  }

  /**
   * Initialize the storage adapter
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (!this.isAvailable) {
      throw new Error(
        'Origin Private File System is not available in this environment'
      )
    }

    try {
      // Get the root directory
      const root = await navigator.storage.getDirectory()

      // Create or get our app's root directory
      this.rootDir = await root.getDirectoryHandle(ROOT_DIR, { create: true })

      // Create or get nodes directory
      this.nodesDir = await this.rootDir.getDirectoryHandle(NODES_DIR, {
        create: true
      })

      // Create or get edges directory
      this.edgesDir = await this.rootDir.getDirectoryHandle(EDGES_DIR, {
        create: true
      })

      // Create or get metadata directory
      this.metadataDir = await this.rootDir.getDirectoryHandle(METADATA_DIR, {
        create: true
      })

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize OPFS storage:', error)
      throw new Error(`Failed to initialize OPFS storage: ${error}`)
    }
  }

  /**
   * Check if OPFS is available in the current environment
   */
  public isOPFSAvailable(): boolean {
    return this.isAvailable
  }

  /**
   * Request persistent storage permission from the user
   * @returns Promise that resolves to true if permission was granted, false otherwise
   */
  public async requestPersistentStorage(): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('Cannot request persistent storage: OPFS is not available')
      return false
    }

    try {
      // Check if persistence is already granted
      this.isPersistentGranted = await navigator.storage.persisted()

      if (!this.isPersistentGranted) {
        // Request permission for persistent storage
        this.isPersistentGranted = await navigator.storage.persist()
      }

      this.isPersistentRequested = true
      return this.isPersistentGranted
    } catch (error) {
      console.warn('Failed to request persistent storage:', error)
      return false
    }
  }

  /**
   * Check if persistent storage is granted
   * @returns Promise that resolves to true if persistent storage is granted, false otherwise
   */
  public async isPersistent(): Promise<boolean> {
    if (!this.isAvailable) {
      return false
    }

    try {
      this.isPersistentGranted = await navigator.storage.persisted()
      return this.isPersistentGranted
    } catch (error) {
      console.warn('Failed to check persistent storage status:', error)
      return false
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
        connections: this.mapToObject(node.connections, (set) =>
          Array.from(set)
        )
      }

      // Create or get the file for this node
      const fileHandle = await this.nodesDir!.getFileHandle(node.id, {
        create: true
      })

      // Write the node data to the file
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(serializableNode))
      await writable.close()
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
      // Get the file handle for this node
      const fileHandle = await this.nodesDir!.getFileHandle(id)

      // Read the node data from the file
      const file = await fileHandle.getFile()
      const text = await file.text()
      const data = JSON.parse(text)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(data.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: data.id,
        vector: data.vector,
        connections
      }
    } catch (error) {
      // If the file doesn't exist, return null
      if ((error as any).name === 'NotFoundError') {
        return null
      }

      console.error(`Failed to get node ${id}:`, error)
      throw new Error(`Failed to get node ${id}: ${error}`)
    }
  }

  /**
   * Get all nodes from storage
   */
  public async getAllNodes(): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    try {
      const nodes: HNSWNode[] = []

      // Get all keys (filenames) in the nodes directory
      // @ts-ignore - TypeScript doesn't recognize FileSystemDirectoryHandle.keys() properly
      const keys = this.nodesDir!.keys()

      // Iterate through all keys and get the corresponding nodes
      for await (const name of keys) {
        const node = await this.getNode(name)
        if (node) {
          nodes.push(node)
        }
      }

      return nodes
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
      await this.nodesDir!.removeEntry(id)
    } catch (error) {
      // Ignore if the file doesn't exist
      if ((error as any).name !== 'NotFoundError') {
        console.error(`Failed to delete node ${id}:`, error)
        throw new Error(`Failed to delete node ${id}: ${error}`)
      }
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
        connections: this.mapToObject(edge.connections, (set) =>
          Array.from(set)
        )
      }

      // Create or get the file for this edge
      const fileHandle = await this.edgesDir!.getFileHandle(edge.id, {
        create: true
      })

      // Write the edge data to the file
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(serializableEdge))
      await writable.close()
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
      // Get the file handle for this edge
      const fileHandle = await this.edgesDir!.getFileHandle(id)

      // Read the edge data from the file
      const file = await fileHandle.getFile()
      const text = await file.text()
      const data = JSON.parse(text)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(data.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: data.id,
        vector: data.vector,
        connections,
        sourceId: data.sourceId,
        targetId: data.targetId,
        type: data.type,
        weight: data.weight,
        metadata: data.metadata
      }
    } catch (error) {
      // If the file doesn't exist, return null
      if ((error as any).name === 'NotFoundError') {
        return null
      }

      console.error(`Failed to get edge ${id}:`, error)
      throw new Error(`Failed to get edge ${id}: ${error}`)
    }
  }

  /**
   * Get all edges from storage
   */
  public async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const edges: Edge[] = []

      // Get all keys (filenames) in the edges directory
      // @ts-ignore - TypeScript doesn't recognize FileSystemDirectoryHandle.keys() properly
      const keys = this.edgesDir!.keys()

      // Iterate through all keys and get the corresponding edges
      for await (const name of keys) {
        const edge = await this.getEdge(name)
        if (edge) {
          edges.push(edge)
        }
      }

      return edges
    } catch (error) {
      console.error('Failed to get all edges:', error)
      throw new Error(`Failed to get all edges: ${error}`)
    }
  }

  /**
   * Delete an edge from storage
   */
  public async deleteEdge(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.edgesDir!.removeEntry(id)
    } catch (error) {
      // Ignore if the file doesn't exist
      if ((error as any).name !== 'NotFoundError') {
        console.error(`Failed to delete edge ${id}:`, error)
        throw new Error(`Failed to delete edge ${id}: ${error}`)
      }
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
   * Save metadata for a node
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    try {
      // Create or get the file for this metadata
      const fileHandle = await this.metadataDir!.getFileHandle(id, {
        create: true
      })

      // Write the metadata to the file
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(metadata))
      await writable.close()
    } catch (error) {
      console.error(`Failed to save metadata for ${id}:`, error)
      throw new Error(`Failed to save metadata for ${id}: ${error}`)
    }
  }

  /**
   * Get metadata for a node
   */
  public async getMetadata(id: string): Promise<any | null> {
    await this.ensureInitialized()

    try {
      // Get the file handle for this metadata
      const fileHandle = await this.metadataDir!.getFileHandle(id)

      // Read the metadata from the file
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text)
    } catch (error) {
      // If the file doesn't exist, return null
      if ((error as any).name === 'NotFoundError') {
        return null
      }

      console.error(`Failed to get metadata for ${id}:`, error)
      throw new Error(`Failed to get metadata for ${id}: ${error}`)
    }
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized()

    try {
      // Delete and recreate the nodes directory
      await this.rootDir!.removeEntry(NODES_DIR, { recursive: true })
      this.nodesDir = await this.rootDir!.getDirectoryHandle(NODES_DIR, {
        create: true
      })

      // Delete and recreate the edges directory
      await this.rootDir!.removeEntry(EDGES_DIR, { recursive: true })
      this.edgesDir = await this.rootDir!.getDirectoryHandle(EDGES_DIR, {
        create: true
      })

      // Delete and recreate the metadata directory
      await this.rootDir!.removeEntry(METADATA_DIR, { recursive: true })
      this.metadataDir = await this.rootDir!.getDirectoryHandle(METADATA_DIR, {
        create: true
      })
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
      const calculateDirSize = async (dirHandle: FileSystemDirectoryHandle): Promise<number> => {
        let size = 0
        try {
          // @ts-ignore - TypeScript doesn't recognize FileSystemDirectoryHandle.entries() properly
          for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file') {
              const file = await handle.getFile()
              size += file.size
            } else if (handle.kind === 'directory') {
              size += await calculateDirSize(handle)
            }
          }
        } catch (error) {
          console.warn(`Error calculating size for directory:`, error)
        }
        return size
      }

      // Calculate size for each directory
      if (this.nodesDir) {
        totalSize += await calculateDirSize(this.nodesDir)
      }
      if (this.edgesDir) {
        totalSize += await calculateDirSize(this.edgesDir)
      }
      if (this.metadataDir) {
        totalSize += await calculateDirSize(this.metadataDir)
      }

      // Get storage quota information using the Storage API
      let quota = null
      let details: Record<string, any> = {
        isPersistent: await this.isPersistent()
      }

      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate()
          quota = estimate.quota || null
          details = {
            ...details,
            usage: estimate.usage,
            quota: estimate.quota,
            freePercentage: estimate.quota ? ((estimate.quota - (estimate.usage || 0)) / estimate.quota) * 100 : null
          }
        }
      } catch (error) {
        console.warn('Unable to get storage estimate:', error)
      }

      return {
        type: 'opfs',
        used: totalSize,
        quota,
        details
      }
    } catch (error) {
      console.error('Failed to get storage status:', error)
      return {
        type: 'opfs',
        used: 0,
        quota: null,
        details: { error: String(error) }
      }
    }
  }
}

/**
 * In-memory storage adapter for environments where OPFS is not available
 */
export class MemoryStorage implements StorageAdapter {
  private nodes: Map<string, HNSWNode> = new Map()
  private edges: Map<string, Edge> = new Map()
  private metadata: Map<string, any> = new Map()

  public async init(): Promise<void> {
    // Nothing to initialize for in-memory storage
  }

  public async saveNode(node: HNSWNode): Promise<void> {
    // Create a deep copy to avoid reference issues
    const nodeCopy: HNSWNode = {
      id: node.id,
      vector: [...node.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of node.connections.entries()) {
      nodeCopy.connections.set(level, new Set(connections))
    }

    this.nodes.set(node.id, nodeCopy)
  }

  public async getNode(id: string): Promise<HNSWNode | null> {
    const node = this.nodes.get(id)
    if (!node) {
      return null
    }

    // Return a deep copy to avoid reference issues
    const nodeCopy: HNSWNode = {
      id: node.id,
      vector: [...node.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of node.connections.entries()) {
      nodeCopy.connections.set(level, new Set(connections))
    }

    return nodeCopy
  }

  public async getAllNodes(): Promise<HNSWNode[]> {
    const nodes: HNSWNode[] = []

    for (const nodeId of this.nodes.keys()) {
      const node = await this.getNode(nodeId)
      if (node) {
        nodes.push(node)
      }
    }

    return nodes
  }

  public async deleteNode(id: string): Promise<void> {
    this.nodes.delete(id)
  }

  public async saveMetadata(id: string, metadata: any): Promise<void> {
    this.metadata.set(id, JSON.parse(JSON.stringify(metadata)))
  }

  public async getMetadata(id: string): Promise<any | null> {
    const metadata = this.metadata.get(id)
    if (!metadata) {
      return null
    }

    return JSON.parse(JSON.stringify(metadata))
  }

  public async saveEdge(edge: Edge): Promise<void> {
    // Create a deep copy to avoid reference issues
    const edgeCopy: Edge = {
      id: edge.id,
      vector: [...edge.vector],
      connections: new Map(),
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
      weight: edge.weight,
      metadata: edge.metadata ? JSON.parse(JSON.stringify(edge.metadata)) : undefined
    }

    // Copy connections
    for (const [level, connections] of edge.connections.entries()) {
      edgeCopy.connections.set(level, new Set(connections))
    }

    this.edges.set(edge.id, edgeCopy)
  }

  public async getEdge(id: string): Promise<Edge | null> {
    const edge = this.edges.get(id)
    if (!edge) {
      return null
    }

    // Return a deep copy to avoid reference issues
    const edgeCopy: Edge = {
      id: edge.id,
      vector: [...edge.vector],
      connections: new Map(),
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
      weight: edge.weight,
      metadata: edge.metadata ? JSON.parse(JSON.stringify(edge.metadata)) : undefined
    }

    // Copy connections
    for (const [level, connections] of edge.connections.entries()) {
      edgeCopy.connections.set(level, new Set(connections))
    }

    return edgeCopy
  }

  public async getAllEdges(): Promise<Edge[]> {
    const edges: Edge[] = []

    for (const edgeId of this.edges.keys()) {
      const edge = await this.getEdge(edgeId)
      if (edge) {
        edges.push(edge)
      }
    }

    return edges
  }

  public async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    const edges: Edge[] = []

    for (const edge of this.edges.values()) {
      if (edge.sourceId === sourceId) {
        const edgeCopy = await this.getEdge(edge.id)
        if (edgeCopy) {
          edges.push(edgeCopy)
        }
      }
    }

    return edges
  }

  public async getEdgesByTarget(targetId: string): Promise<Edge[]> {
    const edges: Edge[] = []

    for (const edge of this.edges.values()) {
      if (edge.targetId === targetId) {
        const edgeCopy = await this.getEdge(edge.id)
        if (edgeCopy) {
          edges.push(edgeCopy)
        }
      }
    }

    return edges
  }

  public async getEdgesByType(type: string): Promise<Edge[]> {
    const edges: Edge[] = []

    for (const edge of this.edges.values()) {
      if (edge.type === type) {
        const edgeCopy = await this.getEdge(edge.id)
        if (edgeCopy) {
          edges.push(edgeCopy)
        }
      }
    }

    return edges
  }

  public async deleteEdge(id: string): Promise<void> {
    this.edges.delete(id)
  }

  public async clear(): Promise<void> {
    this.nodes.clear()
    this.edges.clear()
    this.metadata.clear()
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
    try {
      // Estimate the size of data in memory
      let totalSize = 0

      // Helper function to estimate object size in bytes
      const estimateSize = (obj: any): number => {
        if (obj === null || obj === undefined) return 0

        const type = typeof obj

        // Handle primitive types
        if (type === 'number') return 8
        if (type === 'string') return obj.length * 2
        if (type === 'boolean') return 4

        // Handle arrays and objects
        if (Array.isArray(obj)) {
          return obj.reduce((size, item) => size + estimateSize(item), 0)
        }

        if (type === 'object') {
          if (obj instanceof Map) {
            let mapSize = 0
            for (const [key, value] of obj.entries()) {
              mapSize += estimateSize(key) + estimateSize(value)
            }
            return mapSize
          }

          if (obj instanceof Set) {
            let setSize = 0
            for (const item of obj) {
              setSize += estimateSize(item)
            }
            return setSize
          }

          // Regular object
          return Object.entries(obj).reduce(
            (size, [key, value]) => size + key.length * 2 + estimateSize(value),
            0
          )
        }

        return 0
      }

      // Estimate size of nodes
      for (const node of this.nodes.values()) {
        totalSize += estimateSize(node)
      }

      // Estimate size of edges
      for (const edge of this.edges.values()) {
        totalSize += estimateSize(edge)
      }

      // Estimate size of metadata
      for (const meta of this.metadata.values()) {
        totalSize += estimateSize(meta)
      }

      // Get memory information if available
      let quota = null
      let details: Record<string, any> = {
        nodesCount: this.nodes.size,
        edgesCount: this.edges.size,
        metadataCount: this.metadata.size
      }

      // Try to get memory information if in a browser environment
      if (typeof window !== 'undefined' && (window as any).performance && (window as any).performance.memory) {
        const memory = (window as any).performance.memory
        quota = memory.jsHeapSizeLimit
        details = {
          ...details,
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      }

      return {
        type: 'memory',
        used: totalSize,
        quota,
        details
      }
    } catch (error) {
      console.error('Failed to get memory storage status:', error)
      return {
        type: 'memory',
        used: 0,
        quota: null,
        details: { error: String(error) }
      }
    }
  }
}

/**
 * Factory function to create the appropriate storage adapter based on the environment
 * @param options Configuration options for storage
 * @returns Promise that resolves to a StorageAdapter instance
 */
export async function createStorage(options: {
  requestPersistentStorage?: boolean
} = {}): Promise<StorageAdapter> {
  // Check if we're in a Node.js environment
  const isNode = typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null

  if (isNode) {
    // In Node.js, use FileSystemStorage first, then fall back to memory
    try {
      const fileSystemModule = await import('./fileSystemStorage.js')
      return new fileSystemModule.FileSystemStorage()
    } catch (error) {
      console.warn('Failed to load FileSystemStorage, falling back to in-memory storage:', error)
      return new MemoryStorage()
    }
  } else {
    // In browser, try OPFS first
    const opfsStorage = new OPFSStorage()

    if (opfsStorage.isOPFSAvailable()) {
      // Request persistent storage if specified
      if (options.requestPersistentStorage) {
        const isPersistentGranted = await opfsStorage.requestPersistentStorage()
        if (isPersistentGranted) {
          console.log('Persistent storage permission granted')
        } else {
          console.warn('Persistent storage permission denied')
        }
      }
      return opfsStorage
    } else {
      // OPFS is not available, try to use FileSystem API if available
      try {
        // Try to load FileSystemStorage for browser environments
        // Note: This will likely fail as FileSystemStorage is designed for Node.js
        const fileSystemModule = await import('./fileSystemStorage.js')
        return new fileSystemModule.FileSystemStorage()
      } catch (error) {
        console.warn('FileSystem storage is not available, falling back to in-memory storage')
        return new MemoryStorage()
      }
    }
  }
}
