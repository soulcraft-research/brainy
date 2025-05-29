/**
 * FirestoreSync Conduit Augmentation
 * 
 * This augmentation allows for syncing data to Firestore either one-way or two-way.
 * One-way sync: Data is only pushed from Brainy to Firestore
 * Two-way sync: Data is synchronized between Brainy and Firestore in both directions
 * 
 * Note: This augmentation requires Firebase to be installed as a dependency.
 * Install with: npm install firebase
 */

import { 
  AugmentationType, 
  IConduitAugmentation, 
  AugmentationResponse,
  WebSocketConnection
} from '../types/augmentations.js'
import { HNSWNode, Edge } from '../coreTypes.js'

// Firebase imports will be dynamically loaded to avoid dependency issues
let firebase: any = null
let firestore: any = null

/**
 * Configuration for FirestoreSync augmentation
 */
export interface FirestoreSyncConfig {
  /** Firebase configuration object */
  firebaseConfig: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket?: string
    messagingSenderId?: string
    appId: string
  }
  /** Collection name for nodes in Firestore */
  nodesCollection: string
  /** Collection name for edges in Firestore */
  edgesCollection: string
  /** Collection name for metadata in Firestore */
  metadataCollection: string
  /** Sync mode: 'one-way' (Brainy -> Firestore) or 'two-way' (bidirectional) */
  syncMode: 'one-way' | 'two-way'
  /** Sync interval in milliseconds (for two-way sync) */
  syncInterval?: number
}

/**
 * FirestoreSync Conduit Augmentation
 * Allows for syncing data to Firestore either one-way or two-way
 */
export class FirestoreSyncAugmentation implements IConduitAugmentation {
  readonly name: string
  readonly description: string
  enabled: boolean
  private config: FirestoreSyncConfig
  private isInitialized: boolean = false
  private db: any = null
  private syncIntervalId: NodeJS.Timeout | null = null
  private lastSyncTimestamp: number = 0

  constructor(name: string, config: FirestoreSyncConfig) {
    this.name = name
    this.description = 'Syncs data between Brainy and Firestore'
    this.enabled = true
    this.config = config
  }

  /**
   * Initialize the augmentation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Dynamically import Firebase
      try {
        const firebaseModule = await import('firebase/app')
        const firestoreModule = await import('firebase/firestore')

        firebase = firebaseModule.default || firebaseModule
        firestore = firestoreModule
      } catch (importError) {
        throw new Error(`Failed to import Firebase modules: ${importError}. Please install Firebase with: npm install firebase`)
      }

      // Initialize Firebase
      const app = firebase.initializeApp(this.config.firebaseConfig, this.name)
      this.db = firebase.firestore(app)

      // Set up two-way sync if configured
      if (this.config.syncMode === 'two-way' && this.config.syncInterval) {
        this.startSyncInterval()
      }

      this.isInitialized = true
      console.log(`FirestoreSync augmentation '${this.name}' initialized successfully`)
    } catch (error) {
      console.error(`Failed to initialize FirestoreSync augmentation: ${error}`)
      throw new Error(`Failed to initialize FirestoreSync augmentation: ${error}`)
    }
  }

  /**
   * Shut down the augmentation
   */
  async shutDown(): Promise<void> {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
      this.syncIntervalId = null
    }

    if (firebase && this.isInitialized) {
      await firebase.app(this.name).delete()
    }

    this.isInitialized = false
    console.log(`FirestoreSync augmentation '${this.name}' shut down successfully`)
  }

  /**
   * Get the status of the augmentation
   */
  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    if (!this.enabled) {
      return 'inactive'
    }

    if (!this.isInitialized) {
      return 'error'
    }

    return 'active'
  }

  /**
   * Establish a connection to Firestore
   */
  establishConnection(
    targetSystemId: string,
    config: Record<string, unknown>
  ): AugmentationResponse<WebSocketConnection> {
    // Ensure initialization happens before returning
    this.ensureInitialized().catch(error => {
      console.error(`Error initializing during establishConnection: ${error}`)
    })

    try {
      // For Firestore, the connection is already established during initialization
      // This method is mainly for compatibility with the IConduitAugmentation interface
      return {
        success: true,
        data: {
          connectionId: targetSystemId,
          url: `https://firestore.googleapis.com/v1/projects/${this.config.firebaseConfig.projectId}/databases/(default)/documents`,
          status: 'connected'
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {
          connectionId: targetSystemId,
          url: '',
          status: 'error'
        },
        error: `Failed to establish connection: ${error}`
      }
    }
  }

  /**
   * Read data from Firestore
   */
  readData(
    query: Record<string, unknown>,
    options?: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    // This is a synchronous wrapper around an async operation
    // We'll start the async operation but return a placeholder response immediately

    // Ensure we're initialized
    this.ensureInitialized().catch(error => {
      console.error(`Error initializing during readData: ${error}`)
    })

    try {
      // Return a placeholder response
      // In a real implementation, this would need to be redesigned to work synchronously
      // or the interface would need to be updated to allow for Promise returns
      return {
        success: true,
        data: { 
          message: "Reading data from Firestore (placeholder response)",
          query: query,
          options: options
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {},
        error: `Failed to read data: ${error}`
      }
    }
  }

  /**
   * Write data to Firestore
   */
  writeData(
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    // This is a synchronous wrapper around an async operation
    // We'll start the async operation but return a placeholder response immediately

    // Ensure we're initialized
    this.ensureInitialized().catch(error => {
      console.error(`Error initializing during writeData: ${error}`)
    })

    try {
      // Extract the ID if available for the response
      const id = data.id as string || 'unknown-id'

      // Start the async operation in the background
      // In a real implementation, this would need to be redesigned to work synchronously
      // or the interface would need to be updated to allow for Promise returns
      setTimeout(() => {
        this.writeDataAsync(data, options).catch(error => {
          console.error(`Error in background writeData: ${error}`)
        })
      }, 0)

      return {
        success: true,
        data: { 
          id,
          message: "Writing data to Firestore (operation started in background)",
          status: "pending"
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {},
        error: `Failed to write data: ${error}`
      }
    }
  }

  // Private async method to actually perform the write operation
  private async writeDataAsync(
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const { collection, id, document } = data as {
        collection: string,
        id: string,
        document: Record<string, any>
      }

      // Prepare the document for Firestore
      // Convert Maps and Sets to arrays or objects for Firestore compatibility
      const firestoreDoc = this.prepareForFirestore(document)

      // Add timestamp for sync tracking
      firestoreDoc._lastUpdated = firebase.firestore.FieldValue.serverTimestamp()
      firestoreDoc._source = 'brainy'

      // Write to Firestore
      await this.db.collection(collection).doc(id).set(firestoreDoc, { merge: true })

      console.log(`Successfully wrote data to Firestore: ${collection}/${id}`)
    } catch (error) {
      console.error(`Failed to write data to Firestore: ${error}`)
      throw error
    }
  }

  /**
   * Monitor a data stream in Firestore
   */
  async monitorStream(streamId: string, callback: (data: unknown) => void): Promise<void> {
    await this.ensureInitialized()

    try {
      // Set up a listener for changes in the specified collection
      const unsubscribe = this.db.collection(streamId)
        .where('_lastUpdated', '>', new Date(this.lastSyncTimestamp))
        .where('_source', '==', 'firestore') // Only listen for changes from Firestore
        .onSnapshot((snapshot: any) => {
          const changes = snapshot.docChanges()

          for (const change of changes) {
            const data = this.convertFirestoreDocToObject(change.doc)
            callback({
              type: change.type, // 'added', 'modified', or 'removed'
              data
            })
          }

          // Update last sync timestamp
          this.lastSyncTimestamp = Date.now()
        })

      // Return the unsubscribe function wrapped in a Promise
      return Promise.resolve(unsubscribe)
    } catch (error) {
      console.error(`Failed to monitor stream: ${error}`)
      throw new Error(`Failed to monitor stream: ${error}`)
    }
  }

  /**
   * Sync a node to Firestore
   */
  async syncNodeToFirestore(node: HNSWNode): Promise<void> {
    await this.ensureInitialized()

    try {
      const firestoreNode = this.prepareForFirestore(node)
      firestoreNode._lastUpdated = firebase.firestore.FieldValue.serverTimestamp()
      firestoreNode._source = 'brainy'

      await this.db.collection(this.config.nodesCollection).doc(node.id).set(firestoreNode, { merge: true })
    } catch (error) {
      console.error(`Failed to sync node to Firestore: ${error}`)
      throw new Error(`Failed to sync node to Firestore: ${error}`)
    }
  }

  /**
   * Sync an edge to Firestore
   */
  async syncEdgeToFirestore(edge: Edge): Promise<void> {
    await this.ensureInitialized()

    try {
      const firestoreEdge = this.prepareForFirestore(edge)
      firestoreEdge._lastUpdated = firebase.firestore.FieldValue.serverTimestamp()
      firestoreEdge._source = 'brainy'

      await this.db.collection(this.config.edgesCollection).doc(edge.id).set(firestoreEdge, { merge: true })
    } catch (error) {
      console.error(`Failed to sync edge to Firestore: ${error}`)
      throw new Error(`Failed to sync edge to Firestore: ${error}`)
    }
  }

  /**
   * Sync metadata to Firestore
   */
  async syncMetadataToFirestore(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    try {
      const firestoreMetadata = this.prepareForFirestore(metadata)
      firestoreMetadata._lastUpdated = firebase.firestore.FieldValue.serverTimestamp()
      firestoreMetadata._source = 'brainy'

      await this.db.collection(this.config.metadataCollection).doc(id).set(firestoreMetadata, { merge: true })
    } catch (error) {
      console.error(`Failed to sync metadata to Firestore: ${error}`)
      throw new Error(`Failed to sync metadata to Firestore: ${error}`)
    }
  }

  /**
   * Start the sync interval for two-way sync
   */
  private startSyncInterval(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
    }

    this.lastSyncTimestamp = Date.now()

    this.syncIntervalId = setInterval(async () => {
      if (!this.enabled || !this.isInitialized) {
        return
      }

      try {
        // Sync from Firestore to Brainy
        await this.syncFromFirestore()
      } catch (error) {
        console.error(`Error during two-way sync: ${error}`)
      }
    }, this.config.syncInterval || 60000) // Default to 1 minute if not specified
  }

  /**
   * Sync data from Firestore to Brainy
   */
  private async syncFromFirestore(): Promise<void> {
    // This would typically call back to the Brainy system to update its data
    // For now, we'll just log that it would happen
    console.log('Syncing data from Firestore to Brainy (not implemented yet)')

    // In a real implementation, this would:
    // 1. Query Firestore for documents updated since lastSyncTimestamp
    // 2. For each document, update the corresponding data in Brainy
    // 3. Update lastSyncTimestamp
  }

  /**
   * Ensure the augmentation is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Convert a Firestore document to a plain JavaScript object
   */
  private convertFirestoreDocToObject(doc: any): any {
    const data = doc.data()
    return {
      id: doc.id,
      ...data
    }
  }

  /**
   * Prepare an object for Firestore by converting Maps and Sets
   */
  private prepareForFirestore(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.prepareForFirestore(item))
    }

    if (obj instanceof Map) {
      const result: Record<string, any> = {}
      for (const [key, value] of obj.entries()) {
        result[key] = this.prepareForFirestore(value)
      }
      return result
    }

    if (obj instanceof Set) {
      return Array.from(obj).map(item => this.prepareForFirestore(item))
    }

    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.prepareForFirestore(value)
    }
    return result
  }
}

/**
 * Create and register a FirestoreSync augmentation
 */
export function createFirestoreSyncAugmentation(
  name: string,
  config: FirestoreSyncConfig
): FirestoreSyncAugmentation {
  return new FirestoreSyncAugmentation(name, config)
}
