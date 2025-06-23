/**
 * HNSW (Hierarchical Navigable Small World) Index implementation
 * Based on the paper: "Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs"
 */
import { DistanceFunction, HNSWConfig, HNSWNoun, Vector, VectorDocument } from '../coreTypes.js';
export declare class HNSWIndex {
    private nouns;
    private entryPointId;
    private maxLevel;
    private config;
    private distanceFunction;
    private dimension;
    private useParallelization;
    constructor(config?: Partial<HNSWConfig>, distanceFunction?: DistanceFunction, options?: {
        useParallelization?: boolean;
    });
    /**
     * Set whether to use parallelization for performance-critical operations
     */
    setUseParallelization(useParallelization: boolean): void;
    /**
     * Get whether parallelization is enabled
     */
    getUseParallelization(): boolean;
    /**
     * Calculate distances between a query vector and multiple vectors in parallel
     * This is used to optimize performance for search operations
     * @param queryVector The query vector
     * @param vectors Array of vectors to compare against
     * @returns Array of distances
     */
    private calculateDistancesInParallel;
    /**
     * Add a vector to the index
     */
    addItem(item: VectorDocument): Promise<string>;
    /**
     * Search for nearest neighbors
     */
    search(queryVector: Vector, k?: number): Promise<Array<[string, number]>>;
    /**
     * Remove an item from the index
     */
    removeItem(id: string): boolean;
    /**
     * Get all nouns in the index
     */
    getNouns(): Map<string, HNSWNoun>;
    /**
     * Clear the index
     */
    clear(): void;
    /**
     * Get the size of the index
     */
    size(): number;
    /**
     * Get the distance function used by the index
     */
    getDistanceFunction(): DistanceFunction;
    /**
     * Get the entry point ID
     */
    getEntryPointId(): string | null;
    /**
     * Get the maximum level
     */
    getMaxLevel(): number;
    /**
     * Get the dimension
     */
    getDimension(): number | null;
    /**
     * Get the configuration
     */
    getConfig(): HNSWConfig;
    /**
     * Search within a specific layer
     * Returns a map of noun IDs to distances, sorted by distance
     */
    private searchLayer;
    /**
     * Select M nearest neighbors from the candidate set
     */
    private selectNeighbors;
    /**
     * Ensure a noun doesn't have too many connections at a given level
     */
    private pruneConnections;
    /**
     * Generate a random level for a new noun
     * Uses the same distribution as in the original HNSW paper
     */
    private getRandomLevel;
}
//# sourceMappingURL=hnswIndex.d.ts.map