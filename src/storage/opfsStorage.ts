/**
 * OPFS (Origin Private File System) Storage Adapter
 * Provides persistent storage for the vector database using the Origin Private File System API
 */

import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js'
import '../types/fileSystemTypes.js'
// Make sure TypeScript recognizes the FileSystemDirectoryHandle interface extension
declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  }
}

// Type aliases for compatibility
type HNSWNode = HNSWNoun
type Edge = GraphVerb

// Directory and file names
const ROOT_DIR = 'opfs-vector-db'
const NOUNS_DIR = 'nouns'
const VERBS_DIR = 'verbs'
const METADATA_DIR = 'metadata'
const DB_INFO_FILE = 'db-info.json'

// Constants for noun type directories
const PERSON_DIR = 'person'
const PLACE_DIR = 'place'
const THING_DIR = 'thing'
const EVENT_DIR = 'event'
const CONCEPT_DIR = 'concept'
const CONTENT_DIR = 'content'
const DEFAULT_DIR = 'default' // For nodes without a noun type

export class OPFSStorage implements StorageAdapter {
  private rootDir: FileSystemDirectoryHandle | null = null
  private nounsDir: FileSystemDirectoryHandle | null = null
  private verbsDir: FileSystemDirectoryHandle | null = null
  private metadataDir: FileSystemDirectoryHandle | null = null
  private personDir: FileSystemDirectoryHandle | null = null
  private placeDir: FileSystemDirectoryHandle | null = null
  private thingDir: FileSystemDirectoryHandle | null = null
  private eventDir: FileSystemDirectoryHandle | null = null
  private conceptDir: FileSystemDirectoryHandle | null = null
  private contentDir: FileSystemDirectoryHandle | null = null
  private defaultDir: FileSystemDirectoryHandle | null = null
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

      // Create or get nouns directory
      this.nounsDir = await this.rootDir.getDirectoryHandle(NOUNS_DIR, {
        create: true
      })

      // Create or get verbs directory
      this.verbsDir = await this.rootDir.getDirectoryHandle(VERBS_DIR, {
        create: true
      })

      // Create or get metadata directory
      this.metadataDir = await this.rootDir.getDirectoryHandle(METADATA_DIR, {
        create: true
      })

      // Create or get noun type directories
      this.personDir = await this.nounsDir.getDirectoryHandle(PERSON_DIR, {
        create: true
      })
      this.placeDir = await this.nounsDir.getDirectoryHandle(PLACE_DIR, {
        create: true
      })
      this.thingDir = await this.nounsDir.getDirectoryHandle(THING_DIR, {
        create: true
      })
      this.eventDir = await this.nounsDir.getDirectoryHandle(EVENT_DIR, {
        create: true
      })
      this.conceptDir = await this.nounsDir.getDirectoryHandle(CONCEPT_DIR, {
        create: true
      })
      this.contentDir = await this.nounsDir.getDirectoryHandle(CONTENT_DIR, {
        create: true
      })
      this.defaultDir = await this.nounsDir.getDirectoryHandle(DEFAULT_DIR, {
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
   * Save a noun to storage
   */
  public async saveNoun(noun: HNSWNoun): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableNoun = {
        ...noun,
        connections: this.mapToObject(noun.connections, (set) =>
          Array.from(set as Set<string>)
        )
      }

      // Get the appropriate directory based on the noun's metadata
      const nounDir = await this.getNodeDirectory(noun.id)

      // Create or get the file for this noun
      const fileHandle = await nounDir.getFileHandle(noun.id, {
        create: true
      })

      // Write the noun data to the file
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(serializableNoun))
      await writable.close()
    } catch (error) {
      console.error(`Failed to save noun ${noun.id}:`, error)
      throw new Error(`Failed to save noun ${noun.id}: ${error}`)
    }
  }

  /**
   * Get a noun from storage
   */
  public async getNoun(id: string): Promise<HNSWNoun | null> {
    await this.ensureInitialized()

    try {
      // Get the appropriate directory based on the node's metadata
      const nodeDir = await this.getNodeDirectory(id)

      try {
        // Get the file handle for this node
        const fileHandle = await nodeDir.getFileHandle(id)

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
      } catch (dirError) {
        // If the file doesn't exist in the expected directory, try the default directory
        if (nodeDir !== this.defaultDir) {
          try {
            // Get the file handle from the default directory
            const fileHandle = await this.defaultDir!.getFileHandle(id)

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
          } catch (defaultDirError) {
            // If not found in default directory either, try all noun type directories
            const directories = [
              this.personDir!,
              this.placeDir!,
              this.thingDir!,
              this.eventDir!,
              this.conceptDir!,
              this.contentDir!
            ]

            for (const dir of directories) {
              if (dir === nodeDir) continue // Skip the already checked directory

              try {
                // Get the file handle from this directory
                const fileHandle = await dir.getFileHandle(id)

                // Read the node data from the file
                const file = await fileHandle.getFile()
                const text = await file.text()
                const data = JSON.parse(text)

                // Convert serialized connections back to Map<number, Set<string>>
                const connections = new Map<number, Set<string>>()
                for (const [level, nodeIds] of Object.entries(
                  data.connections
                )) {
                  connections.set(Number(level), new Set(nodeIds as string[]))
                }

                return {
                  id: data.id,
                  vector: data.vector,
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
    } catch (error) {
      console.error(`Failed to get node ${id}:`, error)
      throw new Error(`Failed to get node ${id}: ${error}`)
    }
  }

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   */
  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    await this.ensureInitialized()

    try {
      const nouns: HNSWNoun[] = []

      // Determine the directory based on the noun type
      let dir: FileSystemDirectoryHandle
      switch (nounType) {
        case 'person':
          dir = this.personDir!
          break
        case 'place':
          dir = this.placeDir!
          break
        case 'thing':
          dir = this.thingDir!
          break
        case 'event':
          dir = this.eventDir!
          break
        case 'concept':
          dir = this.conceptDir!
          break
        case 'content':
          dir = this.contentDir!
          break
        default:
          dir = this.defaultDir!
      }

      try {
        // Get all entries (filename and handle pairs) in this directory
        const entries = dir.entries()

        // Iterate through all entries and get the corresponding nodes
        for await (const [name, handle] of entries) {
          try {
            // The handle is already a FileSystemHandle, but we need to ensure it's a file
            if (handle.kind !== 'file') continue

            // Cast to FileSystemFileHandle
            const fileHandle = handle as FileSystemFileHandle

            // Read the node data from the file
            const file = await fileHandle.getFile()
            const text = await file.text()
            const data = JSON.parse(text)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(data.connections)) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            nouns.push({
              id: data.id,
              vector: data.vector,
              connections
            })
          } catch (nodeError) {
            console.warn(
              `Failed to read node ${name} from directory:`,
              nodeError
            )
            // Continue to the next node
          }
        }
      } catch (dirError) {
        console.warn(
          `Failed to read directory for noun type ${nounType}:`,
          dirError
        )
      }

      return nouns
    } catch (error) {
      console.error(`Failed to get nouns for noun type ${nounType}:`, error)
      throw new Error(`Failed to get nouns for noun type ${nounType}: ${error}`)
    }
  }

  /**
   * Get all nouns from storage
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
      const nounPromises = nounTypes.map((nounType) =>
        this.getNounsByNounType(nounType)
      )
      const nounArrays = await Promise.all(nounPromises)

      // Combine all results
      const allNouns: HNSWNoun[] = []
      for (const nouns of nounArrays) {
        allNouns.push(...nouns)
      }

      return allNouns
    } catch (error) {
      console.error('Failed to get all nouns:', error)
      throw new Error(`Failed to get all nouns: ${error}`)
    }
  }

  /**
   * Delete a noun from storage
   */
  public async deleteNoun(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      // Get the appropriate directory based on the noun's metadata
      const nounDir = await this.getNodeDirectory(id)

      try {
        // Try to delete the noun from the appropriate directory
        await nounDir.removeEntry(id)
        return // Noun deleted successfully
      } catch (dirError) {
        // If the file doesn't exist in the expected directory, try the default directory
        if (nounDir !== this.defaultDir) {
          try {
            await this.defaultDir!.removeEntry(id)
            return // Noun deleted successfully
          } catch (defaultDirError) {
            // If not found in default directory either, try all noun type directories
            const directories = [
              this.personDir!,
              this.placeDir!,
              this.thingDir!,
              this.eventDir!,
              this.conceptDir!,
              this.contentDir!
            ]

            for (const dir of directories) {
              if (dir === nounDir) continue // Skip the already checked directory

              try {
                await dir.removeEntry(id)
                return // Node deleted successfully
              } catch {
                // Continue to the next directory
              }
            }

            // If we get here, the node wasn't found in any directory
            return
          }
        }
        // If the file doesn't exist, that's fine
        return
      }
    } catch (error) {
      console.error(`Failed to delete noun ${id}:`, error)
      throw new Error(`Failed to delete noun ${id}: ${error}`)
    }
  }

  /**
   * Save a verb to storage
   */
  public async saveVerb(verb: GraphVerb): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableVerb = {
        ...verb,
        connections: this.mapToObject(verb.connections, (set) =>
          Array.from(set as Set<string>)
        )
      }

      // Create or get the file for this verb
      const fileHandle = await this.verbsDir!.getFileHandle(verb.id, {
        create: true
      })

      // Write the verb data to the file
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(serializableVerb))
      await writable.close()
    } catch (error) {
      console.error(`Failed to save verb ${verb.id}:`, error)
      throw new Error(`Failed to save verb ${verb.id}: ${error}`)
    }
  }

  /**
   * Get a verb from storage
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    await this.ensureInitialized()

    try {
      // Get the file handle for this verb
      const fileHandle = await this.verbsDir!.getFileHandle(id)

      // Read the verb data from the file
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

      console.error(`Failed to get verb ${id}:`, error)
      throw new Error(`Failed to get verb ${id}: ${error}`)
    }
  }

  /**
   * Get all edges from storage
   */
  public async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const edges: Edge[] = []

      // Get all entries (filename and handle pairs) in the verbs directory
      const entries = this.verbsDir!.entries()

      // Iterate through all entries and get the corresponding edges
      for await (const [name, handle] of entries) {
        // Skip if not a file
        if (handle.kind !== 'file') continue

        const edge = await this.getVerb(name)
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
   * Get all verbs from storage (alias for getAllEdges)
   */
  public async getAllVerbs(): Promise<GraphVerb[]> {
    return this.getAllEdges()
  }

  /**
   * Delete an edge from storage
   */
  public async deleteEdge(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.verbsDir!.removeEntry(id)
    } catch (error) {
      // Ignore if the file doesn't exist
      if ((error as any).name !== 'NotFoundError') {
        console.error(`Failed to delete edge ${id}:`, error)
        throw new Error(`Failed to delete edge ${id}: ${error}`)
      }
    }
  }

  /**
   * Delete a verb from storage (alias for deleteEdge)
   */
  public async deleteVerb(id: string): Promise<void> {
    return this.deleteEdge(id)
  }

  /**
   * Get edges by source node ID
   */
  public async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllEdges()
      return allEdges.filter((edge) => edge.sourceId === sourceId)
    } catch (error) {
      console.error(`Failed to get edges by source ${sourceId}:`, error)
      throw new Error(`Failed to get edges by source ${sourceId}: ${error}`)
    }
  }

  /**
   * Get verbs by source node ID (alias for getEdgesBySource)
   */
  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    return this.getEdgesBySource(sourceId)
  }

  /**
   * Get edges by target node ID
   */
  public async getEdgesByTarget(targetId: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllEdges()
      return allEdges.filter((edge) => edge.targetId === targetId)
    } catch (error) {
      console.error(`Failed to get edges by target ${targetId}:`, error)
      throw new Error(`Failed to get edges by target ${targetId}: ${error}`)
    }
  }

  /**
   * Get verbs by target node ID (alias for getEdgesByTarget)
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    return this.getEdgesByTarget(targetId)
  }

  /**
   * Get edges by type
   */
  public async getEdgesByType(type: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllEdges()
      return allEdges.filter((edge) => edge.type === type)
    } catch (error) {
      console.error(`Failed to get edges by type ${type}:`, error)
      throw new Error(`Failed to get edges by type ${type}: ${error}`)
    }
  }

  /**
   * Get verbs by type (alias for getEdgesByType)
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    return this.getEdgesByType(type)
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
      // Delete and recreate the nouns directory
      await this.rootDir!.removeEntry(NOUNS_DIR, { recursive: true })
      this.nounsDir = await this.rootDir!.getDirectoryHandle(NOUNS_DIR, {
        create: true
      })

      // Create noun type directories
      this.personDir = await this.nounsDir.getDirectoryHandle(PERSON_DIR, {
        create: true
      })
      this.placeDir = await this.nounsDir.getDirectoryHandle(PLACE_DIR, {
        create: true
      })
      this.thingDir = await this.nounsDir.getDirectoryHandle(THING_DIR, {
        create: true
      })
      this.eventDir = await this.nounsDir.getDirectoryHandle(EVENT_DIR, {
        create: true
      })
      this.conceptDir = await this.nounsDir.getDirectoryHandle(CONCEPT_DIR, {
        create: true
      })
      this.contentDir = await this.nounsDir.getDirectoryHandle(CONTENT_DIR, {
        create: true
      })
      this.defaultDir = await this.nounsDir.getDirectoryHandle(DEFAULT_DIR, {
        create: true
      })

      // Delete and recreate the verbs directory
      await this.rootDir!.removeEntry(VERBS_DIR, { recursive: true })
      this.verbsDir = await this.rootDir!.getDirectoryHandle(VERBS_DIR, {
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
   * Get the appropriate directory for a node based on its metadata
   */
  private async getNodeDirectory(
    id: string
  ): Promise<FileSystemDirectoryHandle> {
    try {
      // Try to get the metadata for the node
      const metadata = await this.getMetadata(id)

      // If metadata exists and has a noun field, use the corresponding directory
      if (metadata && metadata.noun) {
        switch (metadata.noun) {
          case 'person':
            return this.personDir!
          case 'place':
            return this.placeDir!
          case 'thing':
            return this.thingDir!
          case 'event':
            return this.eventDir!
          case 'concept':
            return this.conceptDir!
          case 'content':
            return this.contentDir!
          default:
            return this.defaultDir!
        }
      }

      // If no metadata or no noun field, use the default directory
      return this.defaultDir!
    } catch (error) {
      // If there's an error getting the metadata, use the default directory
      return this.defaultDir!
    }
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

    try {
      // Calculate the total size of all files in the storage directories
      let totalSize = 0

      // Helper function to calculate directory size
      const calculateDirSize = async (
        dirHandle: FileSystemDirectoryHandle
      ): Promise<number> => {
        let size = 0
        try {
          for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file') {
              const file = await (handle as FileSystemFileHandle).getFile()
              size += file.size
            } else if (handle.kind === 'directory') {
              size += await calculateDirSize(
                handle as FileSystemDirectoryHandle
              )
            }
          }
        } catch (error) {
          console.warn(`Error calculating size for directory:`, error)
        }
        return size
      }

      // Helper function to count files in a directory
      const countFilesInDirectory = async (
        dirHandle: FileSystemDirectoryHandle
      ): Promise<number> => {
        let count = 0
        try {
          for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file') {
              count++
            }
          }
        } catch (error) {
          console.warn(`Error counting files in directory:`, error)
        }
        return count
      }

      // Calculate size for each directory
      if (this.nounsDir) {
        totalSize += await calculateDirSize(this.nounsDir)
      }
      if (this.verbsDir) {
        totalSize += await calculateDirSize(this.verbsDir)
      }
      if (this.metadataDir) {
        totalSize += await calculateDirSize(this.metadataDir)
      }

      // Calculate sizes of noun type directories
      const personDirSize = this.personDir
        ? await calculateDirSize(this.personDir)
        : 0
      const placeDirSize = this.placeDir
        ? await calculateDirSize(this.placeDir)
        : 0
      const thingDirSize = this.thingDir
        ? await calculateDirSize(this.thingDir)
        : 0
      const eventDirSize = this.eventDir
        ? await calculateDirSize(this.eventDir)
        : 0
      const conceptDirSize = this.conceptDir
        ? await calculateDirSize(this.conceptDir)
        : 0
      const contentDirSize = this.contentDir
        ? await calculateDirSize(this.contentDir)
        : 0
      const defaultDirSize = this.defaultDir
        ? await calculateDirSize(this.defaultDir)
        : 0

      // Get storage quota information using the Storage API
      let quota = null
      let details: Record<string, any> = {
        isPersistent: await this.isPersistent(),
        nounTypes: {
          person: {
            size: personDirSize,
            count: this.personDir
              ? await countFilesInDirectory(this.personDir)
              : 0
          },
          place: {
            size: placeDirSize,
            count: this.placeDir
              ? await countFilesInDirectory(this.placeDir)
              : 0
          },
          thing: {
            size: thingDirSize,
            count: this.thingDir
              ? await countFilesInDirectory(this.thingDir)
              : 0
          },
          event: {
            size: eventDirSize,
            count: this.eventDir
              ? await countFilesInDirectory(this.eventDir)
              : 0
          },
          concept: {
            size: conceptDirSize,
            count: this.conceptDir
              ? await countFilesInDirectory(this.conceptDir)
              : 0
          },
          content: {
            size: contentDirSize,
            count: this.contentDir
              ? await countFilesInDirectory(this.contentDir)
              : 0
          },
          default: {
            size: defaultDirSize,
            count: this.defaultDir
              ? await countFilesInDirectory(this.defaultDir)
              : 0
          }
        }
      }

      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate()
          quota = estimate.quota || null
          details = {
            ...details,
            usage: estimate.usage,
            quota: estimate.quota,
            freePercentage: estimate.quota
              ? ((estimate.quota - (estimate.usage || 0)) / estimate.quota) *
                100
              : null
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
  // Map of noun type to Map of noun ID to noun
  private nouns: Map<string, Map<string, HNSWNode>> = new Map()
  private verbs: Map<string, Edge> = new Map()
  private metadata: Map<string, any> = new Map()

  // Initialize maps for each noun type
  constructor() {
    this.nouns.set(PERSON_DIR, new Map())
    this.nouns.set(PLACE_DIR, new Map())
    this.nouns.set(THING_DIR, new Map())
    this.nouns.set(EVENT_DIR, new Map())
    this.nouns.set(CONCEPT_DIR, new Map())
    this.nouns.set(CONTENT_DIR, new Map())
    this.nouns.set(DEFAULT_DIR, new Map())
  }

  // Alias methods to match StorageAdapter interface
  public async saveNoun(noun: HNSWNoun): Promise<void> {
    return this.saveNode(noun)
  }

  public async getNoun(id: string): Promise<HNSWNoun | null> {
    return this.getNode(id)
  }

  public async getAllNouns(): Promise<HNSWNoun[]> {
    return this.getAllNodes()
  }

  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    return this.getNodesByNounType(nounType)
  }

  public async deleteNoun(id: string): Promise<void> {
    return this.deleteNode(id)
  }

  public async saveVerb(verb: GraphVerb): Promise<void> {
    return this.saveEdge(verb)
  }

  public async getVerb(id: string): Promise<GraphVerb | null> {
    return this.getEdge(id)
  }

  public async getAllVerbs(): Promise<GraphVerb[]> {
    return this.getAllEdges()
  }

  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    return this.getEdgesBySource(sourceId)
  }

  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    return this.getEdgesByTarget(targetId)
  }

  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    return this.getEdgesByType(type)
  }

  public async deleteVerb(id: string): Promise<void> {
    return this.deleteEdge(id)
  }

  public async init(): Promise<void> {
    // Nothing to initialize for in-memory storage
  }

  /**
   * Get the appropriate node type for a node based on its metadata
   */
  private async getNodeType(id: string): Promise<string> {
    try {
      // Try to get the metadata for the node
      const metadata = await this.getMetadata(id)

      // If metadata exists and has a noun field, use the corresponding type
      if (metadata && metadata.noun) {
        switch (metadata.noun) {
          case 'person':
            return PERSON_DIR
          case 'place':
            return PLACE_DIR
          case 'thing':
            return THING_DIR
          case 'event':
            return EVENT_DIR
          case 'concept':
            return CONCEPT_DIR
          case 'content':
            return CONTENT_DIR
          default:
            return DEFAULT_DIR
        }
      }

      // If no metadata or no noun field, use the default type
      return DEFAULT_DIR
    } catch (error) {
      // If there's an error getting the metadata, use the default type
      return DEFAULT_DIR
    }
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

    // Get the appropriate node type based on the node's metadata
    const nodeType = await this.getNodeType(node.id)

    // Get the map for this node type
    const nodeMap = this.nouns.get(nodeType)!

    // Save the node in the appropriate map
    nodeMap.set(node.id, nodeCopy)
  }

  public async getNode(id: string): Promise<HNSWNode | null> {
    // Get the appropriate node type based on the node's metadata
    const nodeType = await this.getNodeType(id)

    // Get the map for this node type
    const nodeMap = this.nouns.get(nodeType)!

    // Try to get the node from the appropriate map
    let node = nodeMap.get(id)

    // If not found in the expected map, try other maps
    if (!node) {
      // If the node type is not the default type, try the default map
      if (nodeType !== DEFAULT_DIR) {
        const defaultMap = this.nouns.get(DEFAULT_DIR)!
        node = defaultMap.get(id)

        // If still not found, try all other maps
        if (!node) {
          const nodeTypes = [
            PERSON_DIR,
            PLACE_DIR,
            THING_DIR,
            EVENT_DIR,
            CONCEPT_DIR,
            CONTENT_DIR
          ]
          for (const type of nodeTypes) {
            if (type === nodeType) continue // Skip the already checked map

            const typeMap = this.nouns.get(type)!
            node = typeMap.get(id)
            if (node) break // Found the node, exit the loop
          }
        }
      }

      // If still not found, return null
      if (!node) {
        return null
      }
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

  /**
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  public async getNodesByNounType(nounType: string): Promise<HNSWNode[]> {
    const nodes: HNSWNode[] = []

    // Get the map for this noun type
    let typeMap: Map<string, HNSWNode>
    switch (nounType) {
      case 'person':
        typeMap = this.nouns.get(PERSON_DIR)!
        break
      case 'place':
        typeMap = this.nouns.get(PLACE_DIR)!
        break
      case 'thing':
        typeMap = this.nouns.get(THING_DIR)!
        break
      case 'event':
        typeMap = this.nouns.get(EVENT_DIR)!
        break
      case 'concept':
        typeMap = this.nouns.get(CONCEPT_DIR)!
        break
      case 'content':
        typeMap = this.nouns.get(CONTENT_DIR)!
        break
      default:
        typeMap = this.nouns.get(DEFAULT_DIR)!
    }

    // Get all nodes from this map
    for (const nodeId of typeMap.keys()) {
      const node = await this.getNode(nodeId)
      if (node) {
        nodes.push(node)
      }
    }

    return nodes
  }

  public async getAllNodes(): Promise<HNSWNode[]> {
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
    const nodePromises = nounTypes.map((nounType) =>
      this.getNodesByNounType(nounType)
    )
    const nodeArrays = await Promise.all(nodePromises)

    // Combine all results
    const allNodes: HNSWNode[] = []
    for (const nodes of nodeArrays) {
      allNodes.push(...nodes)
    }

    return allNodes
  }

  public async deleteNode(id: string): Promise<void> {
    // Get the appropriate node type based on the node's metadata
    const nodeType = await this.getNodeType(id)

    // Get the map for this node type
    const nodeMap = this.nouns.get(nodeType)!

    // Try to delete the node from the appropriate map
    const deleted = nodeMap.delete(id)

    // If not found in the expected map, try other maps
    if (!deleted) {
      // If the node type is not the default type, try the default map
      if (nodeType !== DEFAULT_DIR) {
        const defaultMap = this.nouns.get(DEFAULT_DIR)!
        const deletedFromDefault = defaultMap.delete(id)

        // If still not found, try all other maps
        if (!deletedFromDefault) {
          const nodeTypes = [
            PERSON_DIR,
            PLACE_DIR,
            THING_DIR,
            EVENT_DIR,
            CONCEPT_DIR,
            CONTENT_DIR
          ]
          for (const type of nodeTypes) {
            if (type === nodeType) continue // Skip the already checked map

            const typeMap = this.nouns.get(type)!
            const deletedFromType = typeMap.delete(id)
            if (deletedFromType) break // Node deleted, exit the loop
          }
        }
      }
    }
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
      metadata: edge.metadata
        ? JSON.parse(JSON.stringify(edge.metadata))
        : undefined
    }

    // Copy connections
    for (const [level, connections] of edge.connections.entries()) {
      edgeCopy.connections.set(level, new Set(connections))
    }

    this.verbs.set(edge.id, edgeCopy)
  }

  public async getEdge(id: string): Promise<Edge | null> {
    const edge = this.verbs.get(id)
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
      metadata: edge.metadata
        ? JSON.parse(JSON.stringify(edge.metadata))
        : undefined
    }

    // Copy connections
    for (const [level, connections] of edge.connections.entries()) {
      edgeCopy.connections.set(level, new Set(connections))
    }

    return edgeCopy
  }

  public async getAllEdges(): Promise<Edge[]> {
    const edges: Edge[] = []

    for (const edgeId of this.verbs.keys()) {
      const edge = await this.getEdge(edgeId)
      if (edge) {
        edges.push(edge)
      }
    }

    return edges
  }

  public async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    const edges: Edge[] = []

    for (const edge of this.verbs.values()) {
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

    for (const edge of this.verbs.values()) {
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

    for (const edge of this.verbs.values()) {
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
    this.verbs.delete(id)
  }

  public async clear(): Promise<void> {
    // Clear all noun type maps
    const nodeTypes = [
      PERSON_DIR,
      PLACE_DIR,
      THING_DIR,
      EVENT_DIR,
      CONCEPT_DIR,
      CONTENT_DIR,
      DEFAULT_DIR
    ]
    for (const type of nodeTypes) {
      const typeMap = this.nouns.get(type)!
      typeMap.clear()
    }

    this.verbs.clear()
    this.metadata.clear()
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

      // Calculate sizes and counts for each noun type
      const nounTypeDetails: Record<string, { size: number; count: number }> =
        {}
      const nodeTypes = [
        PERSON_DIR,
        PLACE_DIR,
        THING_DIR,
        EVENT_DIR,
        CONCEPT_DIR,
        CONTENT_DIR,
        DEFAULT_DIR
      ]

      let totalNodeCount = 0
      let nodesSize = 0

      for (const type of nodeTypes) {
        const typeMap = this.nouns.get(type)!
        let typeSize = 0

        for (const node of typeMap.values()) {
          typeSize += estimateSize(node)
        }

        nounTypeDetails[type] = {
          size: typeSize,
          count: typeMap.size
        }

        nodesSize += typeSize
        totalNodeCount += typeMap.size
      }

      totalSize += nodesSize

      // Estimate size of edges
      let edgesSize = 0
      for (const edge of this.verbs.values()) {
        edgesSize += estimateSize(edge)
      }
      totalSize += edgesSize

      // Estimate size of metadata
      let metadataSize = 0
      for (const meta of this.metadata.values()) {
        metadataSize += estimateSize(meta)
      }
      totalSize += metadataSize

      // Get memory information if available
      let quota = null
      let details: Record<string, any> = {
        nodeCount: totalNodeCount,
        edgeCount: this.verbs.size,
        metadataCount: this.metadata.size,
        nounTypes: nounTypeDetails,
        nodesSize,
        edgesSize,
        metadataSize
      }

      // Try to get memory information if in a browser environment
      if (
        typeof window !== 'undefined' &&
        (window as any).performance &&
        (window as any).performance.memory
      ) {
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
export async function createStorage(
  options: {
    requestPersistentStorage?: boolean
    r2Storage?: {
      bucketName?: string
      accountId?: string
      accessKeyId?: string
      secretAccessKey?: string
    }
    s3Storage?: {
      bucketName?: string
      accessKeyId?: string
      secretAccessKey?: string
      region?: string
    }
    gcsStorage?: {
      bucketName?: string
      accessKeyId?: string
      secretAccessKey?: string
      endpoint?: string
    }
    customS3Storage?: {
      bucketName?: string
      accessKeyId?: string
      secretAccessKey?: string
      endpoint?: string
      region?: string
    }
    forceFileSystemStorage?: boolean
    forceMemoryStorage?: boolean
  } = {}
): Promise<StorageAdapter> {
  // Detect environment
  const environment = {
    isBrowser: typeof window !== 'undefined',
    isNode:
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null,
    isServerless:
      typeof window === 'undefined' &&
      (typeof process === 'undefined' ||
        !process.versions ||
        !process.versions.node)
  }

  // If force memory storage is specified, use MemoryStorage regardless of environment
  if (options.forceMemoryStorage) {
    console.log('Using in-memory storage (forced by configuration)')
    return new MemoryStorage()
  }

  // Default empty values for environment variables
  const defaultEnvStorage = {
    bucketName: undefined,
    accountId: undefined,
    accessKeyId: undefined,
    secretAccessKey: undefined,
    region: undefined,
    endpoint: undefined
  }

  // Try to use cloud storage if configured
  if (
    options.r2Storage ||
    options.s3Storage ||
    options.gcsStorage ||
    options.customS3Storage ||
    (environment.isNode &&
      (process.env.R2_BUCKET_NAME ||
        process.env.S3_BUCKET_NAME ||
        process.env.GCS_BUCKET_NAME))
  ) {
    try {
      // Only try to access process.env in Node.js environment
      const envR2Storage = environment.isNode
        ? {
            bucketName: process.env.R2_BUCKET_NAME,
            accountId: process.env.R2_ACCOUNT_ID,
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
          }
        : defaultEnvStorage

      const envS3Storage = environment.isNode
        ? {
            bucketName: process.env.S3_BUCKET_NAME,
            accessKeyId:
              process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey:
              process.env.S3_SECRET_ACCESS_KEY ||
              process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || process.env.AWS_REGION
          }
        : defaultEnvStorage

      const envGCSStorage = environment.isNode
        ? {
            bucketName: process.env.GCS_BUCKET_NAME,
            accessKeyId: process.env.GCS_ACCESS_KEY_ID,
            secretAccessKey: process.env.GCS_SECRET_ACCESS_KEY,
            endpoint: process.env.GCS_ENDPOINT
          }
        : defaultEnvStorage

      // Merge environment variables with provided options
      const mergedOptions = {
        ...options,
        r2Storage: options.r2Storage
          ? {
              ...envR2Storage,
              ...options.r2Storage
            }
          : // Only use environment variables if they have the required fields
            envR2Storage.bucketName &&
              envR2Storage.accessKeyId &&
              envR2Storage.secretAccessKey
            ? envR2Storage
            : undefined,
        s3Storage: options.s3Storage
          ? {
              ...envS3Storage,
              ...options.s3Storage
            }
          : // Only use environment variables if they have the required fields
            envS3Storage.bucketName &&
              envS3Storage.accessKeyId &&
              envS3Storage.secretAccessKey
            ? envS3Storage
            : undefined,
        gcsStorage: options.gcsStorage
          ? {
              ...envGCSStorage,
              ...options.gcsStorage
            }
          : // Only use environment variables if they have the required fields
            envGCSStorage.bucketName &&
              envGCSStorage.accessKeyId &&
              envGCSStorage.secretAccessKey
            ? envGCSStorage
            : undefined
      }

      const s3Module = await import('./s3CompatibleStorage.js')

      if (
        mergedOptions.r2Storage &&
        mergedOptions.r2Storage.bucketName &&
        mergedOptions.r2Storage.accountId &&
        mergedOptions.r2Storage.accessKeyId &&
        mergedOptions.r2Storage.secretAccessKey
      ) {
        console.log('Using Cloudflare R2 storage')
        return new s3Module.R2Storage({
          bucketName: mergedOptions.r2Storage.bucketName,
          accountId: mergedOptions.r2Storage.accountId,
          accessKeyId: mergedOptions.r2Storage.accessKeyId,
          secretAccessKey: mergedOptions.r2Storage.secretAccessKey,
          serviceType: 'r2'
        })
      } else if (
        mergedOptions.s3Storage &&
        mergedOptions.s3Storage.bucketName &&
        mergedOptions.s3Storage.accessKeyId &&
        mergedOptions.s3Storage.secretAccessKey
      ) {
        console.log('Using Amazon S3 storage')
        return new s3Module.S3CompatibleStorage({
          bucketName: mergedOptions.s3Storage.bucketName,
          accessKeyId: mergedOptions.s3Storage.accessKeyId,
          secretAccessKey: mergedOptions.s3Storage.secretAccessKey,
          region: mergedOptions.s3Storage.region,
          serviceType: 's3'
        })
      } else if (
        mergedOptions.gcsStorage &&
        mergedOptions.gcsStorage.bucketName &&
        mergedOptions.gcsStorage.accessKeyId &&
        mergedOptions.gcsStorage.secretAccessKey
      ) {
        console.log('Using Google Cloud Storage')
        return new s3Module.S3CompatibleStorage({
          bucketName: mergedOptions.gcsStorage.bucketName,
          accessKeyId: mergedOptions.gcsStorage.accessKeyId,
          secretAccessKey: mergedOptions.gcsStorage.secretAccessKey,
          endpoint: mergedOptions.gcsStorage.endpoint,
          serviceType: 'gcs'
        })
      } else if (
        mergedOptions.customS3Storage &&
        mergedOptions.customS3Storage.bucketName &&
        mergedOptions.customS3Storage.accessKeyId &&
        mergedOptions.customS3Storage.secretAccessKey
      ) {
        console.log('Using custom S3-compatible storage')
        return new s3Module.S3CompatibleStorage({
          bucketName: mergedOptions.customS3Storage.bucketName,
          accessKeyId: mergedOptions.customS3Storage.accessKeyId,
          secretAccessKey: mergedOptions.customS3Storage.secretAccessKey,
          endpoint: mergedOptions.customS3Storage.endpoint,
          region: mergedOptions.customS3Storage.region,
          serviceType: 'custom'
        })
      }
    } catch (error) {
      console.warn(
        'Failed to load S3CompatibleStorage, falling back to environment-specific storage:',
        error
      )
      // Continue to environment-specific storage selection
    }
  }

  // Environment-specific storage selection
  if (environment.isBrowser) {
    // In browser environments
    if (!options.forceFileSystemStorage) {
      try {
        // Try OPFS first (Origin Private File System - browser-specific)
        const opfsStorage = new OPFSStorage()

        if (opfsStorage.isOPFSAvailable()) {
          // Request persistent storage if specified
          if (options.requestPersistentStorage) {
            const isPersistentGranted =
              await opfsStorage.requestPersistentStorage()
            if (isPersistentGranted) {
              console.log('Persistent storage permission granted')
            } else {
              console.warn('Persistent storage permission denied')
            }
          }
          console.log('Using Origin Private File System (OPFS) storage')
          return opfsStorage
        }
      } catch (error) {
        console.warn('OPFS storage initialization failed:', error)
      }
    }

    // Fall back to memory storage for browser environments
    console.log('Using in-memory storage for browser environment')
    return new MemoryStorage()
  } else if (environment.isNode) {
    // In Node.js environments
    try {
      const fileSystemModule = await import('./fileSystemStorage.js')
      console.log('Using file system storage for Node.js environment')
      return new fileSystemModule.FileSystemStorage()
    } catch (error) {
      console.warn('Failed to load FileSystemStorage:', error)
      console.log('Using in-memory storage for Node.js environment')
      return new MemoryStorage()
    }
  } else {
    // In serverless or other environments
    console.log('Using in-memory storage for serverless/unknown environment')
    return new MemoryStorage()
  }
}
