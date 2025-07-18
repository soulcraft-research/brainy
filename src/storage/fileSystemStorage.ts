import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js'

// Dynamically and asynchronously load Node.js modules at the top level.
// This ensures they are available as soon as this module is imported,
// preventing race conditions with dependencies like TensorFlow.js.
let fs: any
let path: any

const nodeModulesPromise = (async () => {
  // A reliable check for a Node.js environment.
  const isNode =
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null

  if (!isNode) {
    return { fs: null, path: null }
  }

  try {
    // Use the 'node:' prefix for unambiguous importing of built-in modules.
    const fsModule = await import('node:fs')
    const pathModule = await import('node:path')
    // Return the modules, preferring the default export if it exists.
    return {
      fs: fsModule.default || fsModule,
      path: pathModule.default || pathModule
    }
  } catch (error) {
    console.error(
      'FileSystemStorage: Failed to load Node.js modules. This adapter is not supported in this environment.',
      error
    )
    return { fs: null, path: null }
  }
})()

// Immediately assign the modules once the promise resolves.
nodeModulesPromise.then((modules) => {
  fs = modules.fs
  path = modules.path
})

// --- End of Refactored Code ---

// Constants for directory and file names
const ROOT_DIR = 'brainy-data'
const NOUNS_DIR = 'nouns'
const VERBS_DIR = 'verbs'
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
  private nounsDir: string
  private verbsDir: string
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
    this.nounsDir = ''
    this.verbsDir = ''
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

    // Wait for the top-level module loading to complete.
    await nodeModulesPromise

    // Check if the modules were loaded successfully.
    if (!fs || !path) {
      throw new Error(
        'FileSystemStorage requires a Node.js environment, but `fs` and `path` modules could not be loaded.'
      )
    }

    try {
      // Now set up the directory paths
      const rootDir = this.rootDir || process.cwd()
      
      // Check if rootDir already ends with ROOT_DIR to prevent duplication
      if (rootDir.endsWith(ROOT_DIR)) {
        this.rootDir = rootDir
      } else {
        this.rootDir = path.resolve(rootDir, ROOT_DIR)
      }
      
      this.nounsDir = path.join(this.rootDir, NOUNS_DIR)
      this.verbsDir = path.join(this.rootDir, VERBS_DIR)
      this.metadataDir = path.join(this.rootDir, METADATA_DIR)

      // Set up noun type directory paths
      this.personDir = path.join(this.nounsDir, PERSON_DIR)
      this.placeDir = path.join(this.nounsDir, PLACE_DIR)
      this.thingDir = path.join(this.nounsDir, THING_DIR)
      this.eventDir = path.join(this.nounsDir, EVENT_DIR)
      this.conceptDir = path.join(this.nounsDir, CONCEPT_DIR)
      this.contentDir = path.join(this.nounsDir, CONTENT_DIR)
      this.defaultDir = path.join(this.nounsDir, DEFAULT_DIR)

      // Create directories if they don't exist
      await this.ensureDirectoryExists(this.rootDir)
      await this.ensureDirectoryExists(this.nounsDir)
      await this.ensureDirectoryExists(this.verbsDir)
      await this.ensureDirectoryExists(this.metadataDir)
      await this.ensureDirectoryExists(this.personDir)
      await this.ensureDirectoryExists(this.placeDir)
      await this.ensureDirectoryExists(this.thingDir)
      await this.ensureDirectoryExists(this.eventDir)
      await this.ensureDirectoryExists(this.conceptDir)
      await this.ensureDirectoryExists(this.contentDir)
      await this.ensureDirectoryExists(this.defaultDir)

      this.isInitialized = true
    } catch (error: any) {
      console.error('Error initializing FileSystemStorage:', error)
      throw error
    }
  }

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

  private getNounPath(id: string, nounType?: string): string {
    let typeDir = this.defaultDir
    if (nounType) {
      switch (nounType.toLowerCase()) {
        case 'person':
          typeDir = this.personDir
          break
        case 'place':
          typeDir = this.placeDir
          break
        case 'thing':
          typeDir = this.thingDir
          break
        case 'event':
          typeDir = this.eventDir
          break
        case 'concept':
          typeDir = this.conceptDir
          break
        case 'content':
          typeDir = this.contentDir
          break
        default:
          typeDir = this.defaultDir
      }
    }
    return path.join(typeDir, `${id}.json`)
  }

  public async saveNoun(
    noun: HNSWNoun & { metadata?: { noun?: string } }
  ): Promise<void> {
    if (!this.isInitialized) await this.init()
    const nounType = (noun as any).metadata?.noun
    const filePath = this.getNounPath(noun.id, nounType)
    await this.ensureDirectoryExists(path.dirname(filePath))
    await fs.promises.writeFile(filePath, JSON.stringify(noun, null, 2))
  }

  public async getNoun(id: string): Promise<HNSWNoun | null> {
    if (!this.isInitialized) await this.init()
    const nounDirs = [
      this.personDir,
      this.placeDir,
      this.thingDir,
      this.eventDir,
      this.conceptDir,
      this.contentDir,
      this.defaultDir
    ]
    for (const dir of nounDirs) {
      const filePath = path.join(dir, `${id}.json`)
      try {
        const data = await fs.promises.readFile(filePath, 'utf-8')
        return JSON.parse(data)
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Error reading noun ${id}:`, error)
        }
      }
    }
    return null
  }

  public async deleteNoun(id: string): Promise<void> {
    if (!this.isInitialized) await this.init()
    const noun = await this.getNoun(id)
    if (noun) {
      const nounType = (noun as any).metadata?.noun
      const filePath = this.getNounPath(id, nounType)
      try {
        await fs.promises.unlink(filePath)
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Error deleting noun file ${filePath}:`, error)
          throw error
        }
      }
    }
  }

  public async getAllNouns(): Promise<HNSWNoun[]> {
    if (!this.isInitialized) await this.init()
    const allNouns: HNSWNoun[] = []
    const nounDirs = [
      this.personDir,
      this.placeDir,
      this.thingDir,
      this.eventDir,
      this.conceptDir,
      this.contentDir,
      this.defaultDir
    ]
    for (const dir of nounDirs) {
      try {
        const files = await fs.promises.readdir(dir)
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(dir, file)
            const data = await fs.promises.readFile(filePath, 'utf-8')
            allNouns.push(JSON.parse(data))
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Error reading directory ${dir}:`, error)
        }
      }
    }
    return allNouns
  }

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   */
  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    if (!this.isInitialized) await this.init()

    let typeDir: string
    switch (nounType.toLowerCase()) {
      case 'person':
        typeDir = this.personDir
        break
      case 'place':
        typeDir = this.placeDir
        break
      case 'thing':
        typeDir = this.thingDir
        break
      case 'event':
        typeDir = this.eventDir
        break
      case 'concept':
        typeDir = this.conceptDir
        break
      case 'content':
        typeDir = this.contentDir
        break
      default:
        typeDir = this.defaultDir
    }

    const nouns: HNSWNoun[] = []
    try {
      const files = await fs.promises.readdir(typeDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(typeDir, file)
          const data = await fs.promises.readFile(filePath, 'utf-8')
          nouns.push(JSON.parse(data))
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading directory ${typeDir}:`, error)
      }
    }

    return nouns
  }

  public async saveVerb(verb: GraphVerb): Promise<void> {
    if (!this.isInitialized) await this.init()
    const filePath = path.join(this.verbsDir, `${verb.id}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(verb, null, 2))
  }

  /**
   * Get a verb by its ID
   * @param id The ID of the verb to retrieve
   * @returns Promise that resolves to the verb or null if not found
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    if (!this.isInitialized) await this.init()
    const filePath = path.join(this.verbsDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading verb ${id}:`, error)
      }
      return null
    }
  }

  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    if (!this.isInitialized) await this.init()
    const allVerbs = await this.getAllVerbs()
    return allVerbs.filter((verb) => verb.sourceId === sourceId)
  }

  /**
   * Get verbs by target ID
   * @param targetId The target ID to filter by
   * @returns Promise that resolves to an array of verbs with the specified target ID
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    if (!this.isInitialized) await this.init()
    const allVerbs = await this.getAllVerbs()
    return allVerbs.filter((verb) => verb.targetId === targetId)
  }

  /**
   * Get verbs by type
   * @param type The verb type to filter by
   * @returns Promise that resolves to an array of verbs of the specified type
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    if (!this.isInitialized) await this.init()
    const allVerbs = await this.getAllVerbs()
    return allVerbs.filter((verb) => verb.type === type)
  }

  public async getAllVerbs(): Promise<GraphVerb[]> {
    if (!this.isInitialized) await this.init()
    const allVerbs: GraphVerb[] = []
    try {
      const files = await fs.promises.readdir(this.verbsDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.verbsDir, file)
          const data = await fs.promises.readFile(filePath, 'utf-8')
          allVerbs.push(JSON.parse(data))
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading verbs directory ${this.verbsDir}:`, error)
      }
    }
    return allVerbs
  }

  public async deleteVerb(id: string): Promise<void> {
    if (!this.isInitialized) await this.init()
    const filePath = path.join(this.verbsDir, `${id}.json`)
    try {
      await fs.promises.unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting verb file ${filePath}:`, error)
        throw error
      }
    }
  }

  /**
   * Save metadata for an entity
   * @param id The ID of the entity
   * @param metadata The metadata to save
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    if (!this.isInitialized) await this.init()
    const filePath = path.join(this.metadataDir, `${id}.json`)
    await this.ensureDirectoryExists(path.dirname(filePath))
    await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Get metadata for an entity
   * @param id The ID of the entity
   * @returns Promise that resolves to the metadata or null if not found
   */
  public async getMetadata(id: string): Promise<any | null> {
    if (!this.isInitialized) await this.init()
    const filePath = path.join(this.metadataDir, `${id}.json`)
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading metadata for ${id}:`, error)
      }
      return null
    }
  }

  public async clear(): Promise<void> {
    if (!this.isInitialized) await this.init()
    
    // Helper function to recursively remove directory contents
    const removeDirectoryContents = async (dirPath: string): Promise<void> => {
      try {
        const files = await fs.promises.readdir(dirPath, { withFileTypes: true })
        
        for (const file of files) {
          const fullPath = path.join(dirPath, file.name)
          
          if (file.isDirectory()) {
            await removeDirectoryContents(fullPath)
            // Use fs.promises.rm with recursive option instead of rmdir
            try {
              await fs.promises.rm(fullPath, { recursive: true, force: true })
            } catch (rmError: any) {
              // Fallback to rmdir if rm fails
              await fs.promises.rmdir(fullPath)
            }
          } else {
            await fs.promises.unlink(fullPath)
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Error removing directory contents ${dirPath}:`, error)
          throw error
        }
      }
    }
    
    try {
      // First try the modern approach
      await fs.promises.rm(this.rootDir, { recursive: true, force: true })
    } catch (error: any) {
      console.warn('Modern rm failed, falling back to manual cleanup:', error)
      
      // Fallback: manually remove contents then directory
      try {
        await removeDirectoryContents(this.rootDir)
        // Use fs.promises.rm with recursive option instead of rmdir
        try {
          await fs.promises.rm(this.rootDir, { recursive: true, force: true })
        } catch (rmError: any) {
          // Final fallback to rmdir if rm fails
          await fs.promises.rmdir(this.rootDir)
        }
      } catch (fallbackError: any) {
        if (fallbackError.code !== 'ENOENT') {
          console.error('Manual cleanup also failed:', fallbackError)
          throw fallbackError
        }
      }
    }
    
    this.isInitialized = false // Reset state
    await this.init() // Re-create directories
  }

  public async getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }> {
    if (!this.isInitialized) await this.init()

    const calculateSize = async (dirPath: string): Promise<number> => {
      let size = 0
      try {
        const files = await fs.promises.readdir(dirPath, {
          withFileTypes: true
        })
        for (const file of files) {
          const fullPath = path.join(dirPath, file.name)
          if (file.isDirectory()) {
            size += await calculateSize(fullPath)
          } else {
            const stats = await fs.promises.stat(fullPath)
            size += stats.size
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Could not calculate size for ${dirPath}:`, error)
        }
      }
      return size
    }

    const totalSize = await calculateSize(this.rootDir)
    const nouns = await this.getAllNouns()
    const verbs = await this.getAllVerbs()

    return {
      type: 'FileSystem',
      used: totalSize,
      quota: null, // File system quota is not easily available from Node.js
      details: {
        rootDir: this.rootDir,
        nounCount: nouns.length,
        verbCount: verbs.length
      }
    }
  }
}
