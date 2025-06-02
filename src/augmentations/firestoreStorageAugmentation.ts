import {
  AugmentationType,
  IMemoryAugmentation,
  AugmentationResponse
} from '../types/augmentations.js'
import { Vector } from '../coreTypes.js'
import { cosineDistance } from '../utils/distance.js'

// TEMPORARILY COMMENTED OUT: Firebase imports
// import { initializeApp, getApp } from 'firebase/app'
// import { 
//   getFirestore, 
//   collection, 
//   doc, 
//   setDoc, 
//   getDoc, 
//   updateDoc, 
//   deleteDoc,
//   query,
//   getDocs,
//   limit
// } from 'firebase/firestore'
// import { findNearest } from '@firebase/firestore-vector-search'

/**
 * Configuration for Firestore storage augmentation
 */
export interface FirestoreStorageConfig {
  /**
   * Firestore project ID
   */
  projectId: string

  /**
   * Firestore collection name for storing data
   */
  collection: string

  /**
   * Optional Firestore credentials
   */
  credentials?: any

  /**
   * Optional Firestore database URL
   */
  databaseURL?: string

  /**
   * Optional Firestore app name
   */
  appName?: string
}

/**
 * Storage augmentation that uses Firestore for storage
 */
export class FirestoreStorageAugmentation implements IMemoryAugmentation {
  readonly name: string
  readonly description: string = 'Storage augmentation that stores data in Firestore'
  enabled: boolean = true
  private config: FirestoreStorageConfig
  private isInitialized = false
  private firestore: any = null
  private collection: any = null

  constructor(name: string, config: FirestoreStorageConfig) {
    this.name = name
    this.config = config
  }

  getType(): AugmentationType {
    return AugmentationType.MEMORY
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // TEMPORARILY COMMENTED OUT: Firebase initialization
      /*
      // Initialize Firebase if not already initialized
      let app
      try {
        app = getApp(this.config.appName || '[DEFAULT]')
      } catch (e) {
        // App doesn't exist, initialize it
        // Create a config object with the required properties
        const firebaseConfig: any = {
          projectId: this.config.projectId
        }

        // Add optional properties if they exist
        if (this.config.databaseURL) {
          firebaseConfig.databaseURL = this.config.databaseURL
        }

        // Add credentials if they exist
        if (this.config.credentials) {
          // Use credentials as part of the config object
          // instead of as a 'credential' property
          Object.assign(firebaseConfig, this.config.credentials)
        }

        app = initializeApp(firebaseConfig, this.config.appName)
      }

      // Get Firestore instance
      this.firestore = getFirestore(app)
      this.collection = collection(this.firestore, this.config.collection)
      */

      console.log(`FirestoreStorageAugmentation '${this.name}' initialization temporarily disabled`)
      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize FirestoreStorageAugmentation:`, error)
      throw new Error(`Failed to initialize FirestoreStorageAugmentation: ${error}`)
    }
  }

  async shutDown(): Promise<void> {
    this.isInitialized = false
    this.firestore = null
    this.collection = null
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    if (!this.isInitialized) {
      return 'inactive'
    }

    // TEMPORARILY COMMENTED OUT: Firebase status check
    /*
    try {
      // Try a simple operation to check if Firestore is working
      await getDocs(query(collection(this.firestore, '__test__'), limit(1)))
      return 'active'
    } catch (error) {
      console.error('Firestore connection error:', error)
      return 'error'
    }
    */

    console.log('Firebase status check temporarily disabled')
    return 'inactive'
  }

  async storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

    // TEMPORARILY COMMENTED OUT: Firebase store operation
    /*
    try {
      await setDoc(doc(this.collection, key), this.prepareForFirestore(data))
      return { success: true, data: true }
    } catch (error) {
      console.error(`Failed to store data for key ${key}:`, error)
      return {
        success: false,
        data: false,
        error: `Failed to store data: ${error}`
      }
    }
    */

    console.log(`Firebase store operation temporarily disabled for key: ${key}`)
    return { 
      success: false, 
      data: false,
      error: 'Firebase functionality temporarily disabled'
    }
  }

  async retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    // TEMPORARILY COMMENTED OUT: Firebase retrieve operation
    /*
    try {
      const docSnapshot = await getDoc(doc(this.collection, key))

      if (!docSnapshot.exists()) {
        return {
          success: true,
          data: null
        }
      }

      return {
        success: true,
        data: docSnapshot.data()
      }
    } catch (error) {
      console.error(`Failed to retrieve data for key ${key}:`, error)
      return {
        success: false,
        data: null,
        error: `Failed to retrieve data: ${error}`
      }
    }
    */

    console.log(`Firebase retrieve operation temporarily disabled for key: ${key}`)
    return {
      success: false,
      data: null,
      error: 'Firebase functionality temporarily disabled'
    }
  }

  async updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

    // TEMPORARILY COMMENTED OUT: Firebase update operation
    /*
    try {
      await updateDoc(doc(this.collection, key), this.prepareForFirestore(data))
      return { success: true, data: true }
    } catch (error) {
      console.error(`Failed to update data for key ${key}:`, error)
      return {
        success: false,
        data: false,
        error: `Failed to update data: ${error}`
      }
    }
    */

    console.log(`Firebase update operation temporarily disabled for key: ${key}`)
    return {
      success: false,
      data: false,
      error: 'Firebase functionality temporarily disabled'
    }
  }

  async deleteData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

    // TEMPORARILY COMMENTED OUT: Firebase delete operation
    /*
    try {
      await deleteDoc(doc(this.collection, key))
      return { success: true, data: true }
    } catch (error) {
      console.error(`Failed to delete data for key ${key}:`, error)
      return {
        success: false,
        data: false,
        error: `Failed to delete data: ${error}`
      }
    }
    */

    console.log(`Firebase delete operation temporarily disabled for key: ${key}`)
    return {
      success: false,
      data: false,
      error: 'Firebase functionality temporarily disabled'
    }
  }

  async listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<string[]>> {
    await this.ensureInitialized()

    // TEMPORARILY COMMENTED OUT: Firebase list operation
    console.log(`Firebase list operation temporarily disabled for pattern: ${pattern || 'none'}`)
    return {
      success: false,
      data: [],
      error: 'Firebase functionality temporarily disabled'
    }
  }

  /**
   * Searches for data in Firestore using vector similarity.
   * Uses Firestore's built-in findNearest function for efficient vector search.
   * 
   * TEMPORARILY COMMENTED OUT: Firebase vector search
   * 
   * @param queryData The query vector or data to search for
   * @param k Number of results to return (default: 10)
   * @param options Optional search options
   */
  async search(
    queryData: unknown,
    k: number = 10,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<Array<{
    id: string;
    score: number;
    data: unknown;
  }>>> {
    await this.ensureInitialized()

    // TEMPORARILY COMMENTED OUT: Firebase vector search
    console.log(`Firebase vector search temporarily disabled`)
    return {
      success: false,
      data: [],
      error: 'Firebase functionality temporarily disabled'
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Prepare data for Firestore by handling special types
   */
  private prepareForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null
    }

    if (
      typeof obj === 'string' ||
      typeof obj === 'number' ||
      typeof obj === 'boolean'
    ) {
      return obj
    }

    if (obj instanceof Date) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.prepareForFirestore(item))
    }

    if (obj instanceof Map) {
      const result: Record<string, any> = {}
      for (const [key, value] of obj.entries()) {
        result[String(key)] = this.prepareForFirestore(value)
      }
      return result
    }

    if (obj instanceof Set) {
      return Array.from(obj).map(item => this.prepareForFirestore(item))
    }

    if (typeof obj === 'object') {
      const result: Record<string, any> = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.prepareForFirestore(obj[key])
        }
      }
      return result
    }

    // Default fallback
    return null
  }
}

/**
 * Create a Firestore storage augmentation
 */
export function createFirestoreStorageAugmentation(
  name: string,
  config: FirestoreStorageConfig
): IMemoryAugmentation {
  return new FirestoreStorageAugmentation(name, config)
}
