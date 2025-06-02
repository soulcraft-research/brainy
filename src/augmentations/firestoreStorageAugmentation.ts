import {
  AugmentationType,
  IMemoryAugmentation,
  AugmentationResponse
} from '../types/augmentations.js'
import { Vector } from '../coreTypes.js'
import { cosineDistance } from '../utils/distance.js'
import { initializeApp, getApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  getDocs,
  limit
} from 'firebase/firestore'
import { findNearest } from '@firebase/firestore-vector-search'

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

    try {
      // Try a simple operation to check if Firestore is working
      await getDocs(query(collection(this.firestore, '__test__'), limit(1)))
      return 'active'
    } catch (error) {
      console.error('Firestore connection error:', error)
      return 'error'
    }
  }

  async storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

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
  }

  async retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

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
  }

  async updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

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
  }

  async deleteData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    await this.ensureInitialized()

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
  }

  async listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<string[]>> {
    await this.ensureInitialized()

    try {
      // Create a query from the collection
      const q = query(this.collection)

      // If pattern is provided, use it to filter keys
      // Note: Firestore doesn't support wildcard queries directly,
      // so we'll need to do some client-side filtering
      const snapshot = await getDocs(q)

      let keys = snapshot.docs.map((docSnapshot: any) => docSnapshot.id)

      // Apply pattern filtering if provided
      if (pattern) {
        // Convert wildcard pattern to regex
        const regexPattern = new RegExp(
          '^' + pattern.replace(/\*/g, '.*') + '$'
        )
        keys = keys.filter((key: string) => regexPattern.test(key))
      }

      return {
        success: true,
        data: keys
      }
    } catch (error) {
      console.error(`Failed to list data keys:`, error)
      return {
        success: false,
        data: [],
        error: `Failed to list data keys: ${error}`
      }
    }
  }

  /**
   * Searches for data in Firestore using vector similarity.
   * Uses Firestore's built-in findNearest function for efficient vector search.
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

    try {
      // Check if queryData is a vector
      let queryVector: Vector

      if (Array.isArray(queryData) && queryData.every(item => typeof item === 'number')) {
        queryVector = queryData as Vector
      } else {
        // If queryData is not a vector, we can't perform vector search
        return {
          success: false,
          data: [],
          error: 'Query must be a vector (array of numbers) for vector search'
        }
      }

      // Get vector field name from options or use default 'vector'
      const vectorField = options?.vectorField as string || 'vector'

      // Get distance measure from options or use default 'COSINE'
      // Firestore supports 'COSINE', 'EUCLIDEAN', and 'DOT_PRODUCT'
      const distanceMeasure = options?.distanceMeasure as string || 'COSINE'

      try {
        // Note: In Firebase v9+, vector search requires the Firebase Extensions for Firestore Vector Search
        // This code attempts to use it if available, but will fall back to client-side search

        // Use the vector search extension imported at the top of the file
        try {
          const vectorSearchOptions = {
            collection: this.collection,
            vectorField: vectorField,
            queryVector: queryVector,
            limit: k,
            distanceMeasure: distanceMeasure
          }

          const searchResults = await findNearest(vectorSearchOptions)

          // Process results
          const results: Array<{
            id: string;
            score: number;
            data: unknown;
          }> = searchResults.map((result: any) => {
            // Calculate the similarity score based on the distance measure
            let score: number

            if (distanceMeasure === 'DOT_PRODUCT') {
              // For dot product, higher is already better
              score = result.distance || 0
            } else {
              // For COSINE and EUCLIDEAN, convert to similarity score
              // where 1 is perfect match and 0 is completely dissimilar
              score = 1 / (1 + (result.distance || 0))
            }

            return {
              id: result.id,
              score,
              data: result.data
            }
          })

          return {
            success: true,
            data: results
          }
        } catch (vectorSearchError) {
          // Vector search extension not available, fall back to client-side search
          console.warn('Firestore vector search extension not available, falling back to client-side search:', vectorSearchError)
          throw vectorSearchError
        }
      } catch (vectorSearchError) {
        console.warn('Firestore vector search failed, falling back to client-side search:', vectorSearchError)

        // Fallback to client-side search if findNearest is not available
        // This can happen if the Firestore instance doesn't support vector search
        // or if the collection isn't configured for vector search

        // Get all documents from Firestore using the modern API
        const q = query(this.collection)
        const snapshot = await getDocs(q)

        // Calculate distances and prepare results
        const results: Array<{
          id: string;
          score: number;
          data: unknown;
        }> = []

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data() as Record<string, any>

          // Skip documents that don't have a vector field
          if (!data[vectorField] || !Array.isArray(data[vectorField])) {
            continue
          }

          // Calculate distance between query vector and document vector
          const distance = cosineDistance(queryVector, data[vectorField] as number[])

          // Convert distance to similarity score (1 - distance for cosine)
          // This way higher scores are better (more similar)
          const score = 1 - distance

          results.push({
            id: docSnapshot.id,
            score,
            data
          })
        }

        // Sort results by score (descending) and take top k
        results.sort((a, b) => b.score - a.score)
        const topResults = results.slice(0, k)

        return {
          success: true,
          data: topResults
        }
      }
    } catch (error) {
      console.error(`Failed to search in Firestore:`, error)
      return {
        success: false,
        data: [],
        error: `Failed to search in Firestore: ${error}`
      }
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
