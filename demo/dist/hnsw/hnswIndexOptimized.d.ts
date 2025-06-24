/**
 * Optimized HNSW (Hierarchical Navigable Small World) Index implementation
 * Extends the base HNSW implementation with support for large datasets
 * Uses product quantization for dimensionality reduction and disk-based storage when needed
 */
import { DistanceFunction, HNSWConfig, Vector, VectorDocument } from '../coreTypes.js';
import { HNSWIndex } from './hnswIndex.js';
import { StorageAdapter } from '../coreTypes.js';
export interface HNSWOptimizedConfig extends HNSWConfig {
    memoryThreshold?: number;
    productQuantization?: {
        enabled: boolean;
        numSubvectors?: number;
        numCentroids?: number;
    };
    useDiskBasedIndex?: boolean;
}
/**
 * Product Quantization implementation
 * Reduces vector dimensionality by splitting vectors into subvectors
 * and quantizing each subvector to the nearest centroid
 */
declare class ProductQuantizer {
    private numSubvectors;
    private numCentroids;
    private centroids;
    private subvectorSize;
    private initialized;
    private dimension;
    constructor(numSubvectors?: number, numCentroids?: number);
    /**
     * Initialize the product quantizer with training data
     * @param vectors Training vectors to use for learning centroids
     */
    train(vectors: Vector[]): void;
    /**
     * Quantize a vector using product quantization
     * @param vector Vector to quantize
     * @returns Array of centroid indices, one for each subvector
     */
    quantize(vector: Vector): number[];
    /**
     * Reconstruct a vector from its quantized representation
     * @param codes Array of centroid indices
     * @returns Reconstructed vector
     */
    reconstruct(codes: number[]): Vector;
    /**
     * Compute squared Euclidean distance between two vectors
     * @param a First vector
     * @param b Second vector
     * @returns Squared Euclidean distance
     */
    private euclideanDistanceSquared;
    /**
     * Implement k-means++ algorithm to initialize centroids
     * @param vectors Vectors to cluster
     * @param k Number of clusters
     * @returns Array of centroids
     */
    private kMeansPlusPlus;
    /**
     * Get the centroids for each subvector
     * @returns Array of centroid arrays
     */
    getCentroids(): Vector[][];
    /**
     * Set the centroids for each subvector
     * @param centroids Array of centroid arrays
     */
    setCentroids(centroids: Vector[][]): void;
    /**
     * Get the dimension of the vectors
     * @returns Dimension
     */
    getDimension(): number;
    /**
     * Set the dimension of the vectors
     * @param dimension Dimension
     */
    setDimension(dimension: number): void;
}
/**
 * Optimized HNSW Index implementation
 * Extends the base HNSW implementation with support for large datasets
 * Uses product quantization for dimensionality reduction and disk-based storage when needed
 */
export declare class HNSWIndexOptimized extends HNSWIndex {
    private optimizedConfig;
    private productQuantizer;
    private storage;
    private useDiskBasedIndex;
    private useProductQuantization;
    private quantizedVectors;
    private memoryUsage;
    private vectorCount;
    constructor(config: Partial<HNSWOptimizedConfig> | undefined, distanceFunction: DistanceFunction, storage?: StorageAdapter | null);
    /**
     * Add a vector to the index
     * Uses product quantization if enabled and memory threshold is exceeded
     */
    addItem(item: VectorDocument): Promise<string>;
    /**
     * Search for nearest neighbors
     * Uses product quantization if enabled
     */
    search(queryVector: Vector, k?: number): Promise<Array<[string, number]>>;
    /**
     * Remove an item from the index
     */
    removeItem(id: string): boolean;
    /**
     * Clear the index
     */
    clear(): void;
    /**
     * Initialize product quantizer with existing vectors
     */
    private initializeProductQuantizer;
    /**
     * Get the product quantizer
     * @returns Product quantizer or null if not enabled
     */
    getProductQuantizer(): ProductQuantizer | null;
    /**
     * Get the optimized configuration
     * @returns Optimized configuration
     */
    getOptimizedConfig(): HNSWOptimizedConfig;
    /**
     * Get the estimated memory usage
     * @returns Estimated memory usage in bytes
     */
    getMemoryUsage(): number;
    /**
     * Set the storage adapter
     * @param storage Storage adapter
     */
    setStorage(storage: StorageAdapter): void;
    /**
     * Get the storage adapter
     * @returns Storage adapter or null if not set
     */
    getStorage(): StorageAdapter | null;
    /**
     * Set whether to use disk-based index
     * @param useDiskBasedIndex Whether to use disk-based index
     */
    setUseDiskBasedIndex(useDiskBasedIndex: boolean): void;
    /**
     * Get whether disk-based index is used
     * @returns Whether disk-based index is used
     */
    getUseDiskBasedIndex(): boolean;
    /**
     * Set whether to use product quantization
     * @param useProductQuantization Whether to use product quantization
     */
    setUseProductQuantization(useProductQuantization: boolean): void;
    /**
     * Get whether product quantization is used
     * @returns Whether product quantization is used
     */
    getUseProductQuantization(): boolean;
}
export {};
//# sourceMappingURL=hnswIndexOptimized.d.ts.map