/**
 * Optimized HNSW (Hierarchical Navigable Small World) Index implementation
 * Extends the base HNSW implementation with support for large datasets
 * Uses product quantization for dimensionality reduction and disk-based storage when needed
 */

import {
  DistanceFunction,
  HNSWConfig,
  HNSWNoun,
  Vector,
  VectorDocument
} from '../coreTypes.js'
import { HNSWIndex } from './hnswIndex.js'
import { StorageAdapter } from '../coreTypes.js'

// Configuration for the optimized HNSW index
export interface HNSWOptimizedConfig extends HNSWConfig {
  // Memory threshold in bytes - when exceeded, will use disk-based approach
  memoryThreshold?: number

  // Product quantization settings
  productQuantization?: {
    // Whether to use product quantization
    enabled: boolean
    // Number of subvectors to split the vector into
    numSubvectors?: number
    // Number of centroids per subvector
    numCentroids?: number
  }

  // Whether to use disk-based storage for the index
  useDiskBasedIndex?: boolean
}

// Default configuration for the optimized HNSW index
const DEFAULT_OPTIMIZED_CONFIG: HNSWOptimizedConfig = {
  M: 16,
  efConstruction: 200,
  efSearch: 50,
  ml: 16,
  memoryThreshold: 1024 * 1024 * 1024, // 1GB default threshold
  productQuantization: {
    enabled: false,
    numSubvectors: 16,
    numCentroids: 256
  },
  useDiskBasedIndex: false
}

/**
 * Product Quantization implementation
 * Reduces vector dimensionality by splitting vectors into subvectors
 * and quantizing each subvector to the nearest centroid
 */
class ProductQuantizer {
  private numSubvectors: number
  private numCentroids: number
  private centroids: Vector[][] = []
  private subvectorSize: number = 0
  private initialized: boolean = false
  private dimension: number = 0

  constructor(numSubvectors: number = 16, numCentroids: number = 256) {
    this.numSubvectors = numSubvectors
    this.numCentroids = numCentroids
  }

  /**
   * Initialize the product quantizer with training data
   * @param vectors Training vectors to use for learning centroids
   */
  public train(vectors: Vector[]): void {
    if (vectors.length === 0) {
      throw new Error('Cannot train product quantizer with empty vector set')
    }

    this.dimension = vectors[0].length
    this.subvectorSize = Math.ceil(this.dimension / this.numSubvectors)

    // Initialize centroids for each subvector
    for (let i = 0; i < this.numSubvectors; i++) {
      // Extract subvectors from training data
      const subvectors: Vector[] = vectors.map((vector) => {
        const start = i * this.subvectorSize
        const end = Math.min(start + this.subvectorSize, this.dimension)
        return vector.slice(start, end)
      })

      // Initialize centroids for this subvector using k-means++
      this.centroids[i] = this.kMeansPlusPlus(subvectors, this.numCentroids)
    }

    this.initialized = true
  }

  /**
   * Quantize a vector using product quantization
   * @param vector Vector to quantize
   * @returns Array of centroid indices, one for each subvector
   */
  public quantize(vector: Vector): number[] {
    if (!this.initialized) {
      throw new Error('Product quantizer not initialized. Call train() first.')
    }

    if (vector.length !== this.dimension) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.dimension}, got ${vector.length}`
      )
    }

    const codes: number[] = []

    // Quantize each subvector
    for (let i = 0; i < this.numSubvectors; i++) {
      const start = i * this.subvectorSize
      const end = Math.min(start + this.subvectorSize, this.dimension)
      const subvector = vector.slice(start, end)

      // Find nearest centroid
      let minDist = Number.MAX_VALUE
      let nearestCentroidIndex = 0

      for (let j = 0; j < this.centroids[i].length; j++) {
        const centroid = this.centroids[i][j]
        const dist = this.euclideanDistanceSquared(subvector, centroid)

        if (dist < minDist) {
          minDist = dist
          nearestCentroidIndex = j
        }
      }

      codes.push(nearestCentroidIndex)
    }

    return codes
  }

  /**
   * Reconstruct a vector from its quantized representation
   * @param codes Array of centroid indices
   * @returns Reconstructed vector
   */
  public reconstruct(codes: number[]): Vector {
    if (!this.initialized) {
      throw new Error('Product quantizer not initialized. Call train() first.')
    }

    if (codes.length !== this.numSubvectors) {
      throw new Error(
        `Code length mismatch: expected ${this.numSubvectors}, got ${codes.length}`
      )
    }

    const reconstructed: Vector = []

    // Reconstruct each subvector
    for (let i = 0; i < this.numSubvectors; i++) {
      const centroidIndex = codes[i]
      const centroid = this.centroids[i][centroidIndex]

      // Add centroid components to reconstructed vector
      for (const component of centroid) {
        reconstructed.push(component)
      }
    }

    // Trim to original dimension if needed
    return reconstructed.slice(0, this.dimension)
  }

  /**
   * Compute squared Euclidean distance between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Squared Euclidean distance
   */
  private euclideanDistanceSquared(a: Vector, b: Vector): number {
    let sum = 0
    const length = Math.min(a.length, b.length)

    for (let i = 0; i < length; i++) {
      const diff = a[i] - b[i]
      sum += diff * diff
    }

    return sum
  }

  /**
   * Implement k-means++ algorithm to initialize centroids
   * @param vectors Vectors to cluster
   * @param k Number of clusters
   * @returns Array of centroids
   */
  private kMeansPlusPlus(vectors: Vector[], k: number): Vector[] {
    if (vectors.length < k) {
      // If we have fewer vectors than centroids, use the vectors as centroids
      return [...vectors]
    }

    const centroids: Vector[] = []

    // Choose first centroid randomly
    const firstIndex = Math.floor(Math.random() * vectors.length)
    centroids.push([...vectors[firstIndex]])

    // Choose remaining centroids
    for (let i = 1; i < k; i++) {
      // Compute distances to nearest centroid for each vector
      const distances: number[] = vectors.map((vector) => {
        let minDist = Number.MAX_VALUE

        for (const centroid of centroids) {
          const dist = this.euclideanDistanceSquared(vector, centroid)
          minDist = Math.min(minDist, dist)
        }

        return minDist
      })

      // Compute sum of distances
      const distSum = distances.reduce((sum, dist) => sum + dist, 0)

      // Choose next centroid with probability proportional to distance
      let r = Math.random() * distSum
      let nextIndex = 0

      for (let j = 0; j < distances.length; j++) {
        r -= distances[j]
        if (r <= 0) {
          nextIndex = j
          break
        }
      }

      centroids.push([...vectors[nextIndex]])
    }

    return centroids
  }

  /**
   * Get the centroids for each subvector
   * @returns Array of centroid arrays
   */
  public getCentroids(): Vector[][] {
    return this.centroids
  }

  /**
   * Set the centroids for each subvector
   * @param centroids Array of centroid arrays
   */
  public setCentroids(centroids: Vector[][]): void {
    this.centroids = centroids
    this.numSubvectors = centroids.length
    this.numCentroids = centroids[0].length
    this.initialized = true
  }

  /**
   * Get the dimension of the vectors
   * @returns Dimension
   */
  public getDimension(): number {
    return this.dimension
  }

  /**
   * Set the dimension of the vectors
   * @param dimension Dimension
   */
  public setDimension(dimension: number): void {
    this.dimension = dimension
    this.subvectorSize = Math.ceil(dimension / this.numSubvectors)
  }
}

/**
 * Optimized HNSW Index implementation
 * Extends the base HNSW implementation with support for large datasets
 * Uses product quantization for dimensionality reduction and disk-based storage when needed
 */
export class HNSWIndexOptimized extends HNSWIndex {
  private optimizedConfig: HNSWOptimizedConfig
  private productQuantizer: ProductQuantizer | null = null
  private storage: StorageAdapter | null = null
  private useDiskBasedIndex: boolean = false
  private useProductQuantization: boolean = false
  private quantizedVectors: Map<string, number[]> = new Map()
  private memoryUsage: number = 0
  private vectorCount: number = 0
  
  // Thread safety for memory usage tracking
  private memoryUpdateLock: Promise<void> = Promise.resolve()

  constructor(
    config: Partial<HNSWOptimizedConfig> = {},
    distanceFunction: DistanceFunction,
    storage: StorageAdapter | null = null
  ) {
    // Initialize base HNSW index with standard config
    super(config, distanceFunction)

    // Set optimized config
    this.optimizedConfig = { ...DEFAULT_OPTIMIZED_CONFIG, ...config }

    // Set storage adapter
    this.storage = storage

    // Initialize product quantizer if enabled
    if (this.optimizedConfig.productQuantization?.enabled) {
      this.useProductQuantization = true
      this.productQuantizer = new ProductQuantizer(
        this.optimizedConfig.productQuantization.numSubvectors,
        this.optimizedConfig.productQuantization.numCentroids
      )
    }

    // Set disk-based index flag
    this.useDiskBasedIndex = this.optimizedConfig.useDiskBasedIndex || false
  }

  /**
   * Thread-safe method to update memory usage
   * @param memoryDelta Change in memory usage (can be negative)
   * @param vectorCountDelta Change in vector count (can be negative)
   */
  private async updateMemoryUsage(memoryDelta: number, vectorCountDelta: number): Promise<void> {
    this.memoryUpdateLock = this.memoryUpdateLock.then(async () => {
      this.memoryUsage = Math.max(0, this.memoryUsage + memoryDelta)
      this.vectorCount = Math.max(0, this.vectorCount + vectorCountDelta)
    })
    await this.memoryUpdateLock
  }

  /**
   * Thread-safe method to get current memory usage
   * @returns Current memory usage and vector count
   */
  private async getMemoryUsageAsync(): Promise<{ memoryUsage: number; vectorCount: number }> {
    await this.memoryUpdateLock
    return {
      memoryUsage: this.memoryUsage,
      vectorCount: this.vectorCount
    }
  }

  /**
   * Add a vector to the index
   * Uses product quantization if enabled and memory threshold is exceeded
   */
  public override async addItem(item: VectorDocument): Promise<string> {
    // Check if item is defined
    if (!item) {
      throw new Error('Item is undefined or null')
    }

    const { id, vector } = item

    // Check if vector is defined
    if (!vector) {
      throw new Error('Vector is undefined or null')
    }

    // Estimate memory usage for this vector
    const vectorMemory = vector.length * 8 // 8 bytes per number (Float64)
    const connectionsMemory = this.optimizedConfig.M * this.optimizedConfig.ml * 16 // Estimate for connections
    const totalMemory = vectorMemory + connectionsMemory

    // Update memory usage estimate (thread-safe)
    await this.updateMemoryUsage(totalMemory, 1)

    // Check if we should switch to product quantization
    const currentMemoryUsage = await this.getMemoryUsageAsync()
    if (
      this.useProductQuantization &&
      currentMemoryUsage.memoryUsage > this.optimizedConfig.memoryThreshold! &&
      this.productQuantizer &&
      !this.productQuantizer.getDimension()
    ) {
      // Initialize product quantizer with existing vectors
      this.initializeProductQuantizer()
    }

    // If product quantization is active, quantize the vector
    if (
      this.useProductQuantization &&
      this.productQuantizer &&
      this.productQuantizer.getDimension() > 0
    ) {
      // Quantize the vector
      const codes = this.productQuantizer.quantize(vector)

      // Store the quantized vector
      this.quantizedVectors.set(id, codes)

      // Reconstruct the vector for indexing
      const reconstructedVector = this.productQuantizer.reconstruct(codes)

      // Add the reconstructed vector to the index
      return await super.addItem({ id, vector: reconstructedVector })
    }

    // If disk-based index is active and storage is available, store the vector
    if (this.useDiskBasedIndex && this.storage) {
      // Create a noun object
      const noun: HNSWNoun = {
        id,
        vector,
        connections: new Map()
      }

      // Store the noun
      this.storage.saveNoun(noun).catch((error) => {
        console.error(`Failed to save noun ${id} to storage:`, error)
      })
    }

    // Add the vector to the in-memory index
    return await super.addItem(item)
  }

  /**
   * Search for nearest neighbors
   * Uses product quantization if enabled
   */
  public override async search(
    queryVector: Vector,
    k: number = 10
  ): Promise<Array<[string, number]>> {
    // Check if query vector is defined
    if (!queryVector) {
      throw new Error('Query vector is undefined or null')
    }

    // If product quantization is active, quantize the query vector
    if (
      this.useProductQuantization &&
      this.productQuantizer &&
      this.productQuantizer.getDimension() > 0
    ) {
      // Quantize the query vector
      const codes = this.productQuantizer.quantize(queryVector)

      // Reconstruct the query vector
      const reconstructedVector = this.productQuantizer.reconstruct(codes)

      // Search with the reconstructed vector
      return await super.search(reconstructedVector, k)
    }

    // Otherwise, use the standard search
    return await super.search(queryVector, k)
  }

  /**
   * Remove an item from the index
   */
  public override removeItem(id: string): boolean {
    // If product quantization is active, remove the quantized vector
    if (this.useProductQuantization) {
      this.quantizedVectors.delete(id)
    }

    // If disk-based index is active and storage is available, remove the vector from storage
    if (this.useDiskBasedIndex && this.storage) {
      this.storage.deleteNoun(id).catch((error) => {
        console.error(`Failed to delete noun ${id} from storage:`, error)
      })
    }

    // Update memory usage estimate (async operation, but don't block removal)
    this.getMemoryUsageAsync().then((currentMemoryUsage) => {
      if (currentMemoryUsage.vectorCount > 0) {
        const memoryPerVector = currentMemoryUsage.memoryUsage / currentMemoryUsage.vectorCount
        this.updateMemoryUsage(-memoryPerVector, -1)
      }
    }).catch((error) => {
      console.error('Failed to update memory usage after removal:', error)
    })

    // Remove the item from the in-memory index
    return super.removeItem(id)
  }

  /**
   * Clear the index
   */
  public override async clear(): Promise<void> {
    // Clear product quantization data
    if (this.useProductQuantization) {
      this.quantizedVectors.clear()
      this.productQuantizer = new ProductQuantizer(
        this.optimizedConfig.productQuantization!.numSubvectors,
        this.optimizedConfig.productQuantization!.numCentroids
      )
    }

    // Reset memory usage (thread-safe)
    const currentMemoryUsage = await this.getMemoryUsageAsync()
    await this.updateMemoryUsage(-currentMemoryUsage.memoryUsage, -currentMemoryUsage.vectorCount)

    // Clear the in-memory index
    super.clear()
  }

  /**
   * Initialize product quantizer with existing vectors
   */
  private initializeProductQuantizer(): void {
    if (!this.productQuantizer) {
      return
    }

    // Get all vectors from the index
    const nouns = super.getNouns()
    const vectors: Vector[] = []

    // Extract vectors
    for (const [_, noun] of nouns) {
      vectors.push(noun.vector)
    }

    // Train the product quantizer
    if (vectors.length > 0) {
      this.productQuantizer.train(vectors)

      // Quantize all existing vectors
      for (const [id, noun] of nouns) {
        const codes = this.productQuantizer.quantize(noun.vector)
        this.quantizedVectors.set(id, codes)
      }

      console.log(
        `Initialized product quantizer with ${vectors.length} vectors`
      )
    }
  }

  /**
   * Get the product quantizer
   * @returns Product quantizer or null if not enabled
   */
  public getProductQuantizer(): ProductQuantizer | null {
    return this.productQuantizer
  }

  /**
   * Get the optimized configuration
   * @returns Optimized configuration
   */
  public getOptimizedConfig(): HNSWOptimizedConfig {
    return { ...this.optimizedConfig }
  }

  /**
   * Get the estimated memory usage
   * @returns Estimated memory usage in bytes
   */
  public getMemoryUsage(): number {
    return this.memoryUsage
  }

  /**
   * Set the storage adapter
   * @param storage Storage adapter
   */
  public setStorage(storage: StorageAdapter): void {
    this.storage = storage
  }

  /**
   * Get the storage adapter
   * @returns Storage adapter or null if not set
   */
  public getStorage(): StorageAdapter | null {
    return this.storage
  }

  /**
   * Set whether to use disk-based index
   * @param useDiskBasedIndex Whether to use disk-based index
   */
  public setUseDiskBasedIndex(useDiskBasedIndex: boolean): void {
    this.useDiskBasedIndex = useDiskBasedIndex
  }

  /**
   * Get whether disk-based index is used
   * @returns Whether disk-based index is used
   */
  public getUseDiskBasedIndex(): boolean {
    return this.useDiskBasedIndex
  }

  /**
   * Set whether to use product quantization
   * @param useProductQuantization Whether to use product quantization
   */
  public setUseProductQuantization(useProductQuantization: boolean): void {
    this.useProductQuantization = useProductQuantization
  }

  /**
   * Get whether product quantization is used
   * @returns Whether product quantization is used
   */
  public getUseProductQuantization(): boolean {
    return this.useProductQuantization
  }
}
