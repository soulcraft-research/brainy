/**
 * BrainyDataInterface
 *
 * This interface defines the methods from BrainyData that are used by serverSearchAugmentations.ts.
 * It's used to break the circular dependency between brainyData.ts and serverSearchAugmentations.ts.
 */
import { Vector } from '../coreTypes.js';
export interface BrainyDataInterface<T = unknown> {
    /**
     * Initialize the database
     */
    init(): Promise<void>;
    /**
     * Get a noun by ID
     * @param id The ID of the noun to get
     */
    get(id: string): Promise<unknown>;
    /**
     * Add a vector or data to the database
     * @param vectorOrData Vector or data to add
     * @param metadata Optional metadata to associate with the vector
     * @returns The ID of the added vector
     */
    add(vectorOrData: Vector | unknown, metadata?: T): Promise<string>;
    /**
     * Search for text in the database
     * @param text The text to search for
     * @param limit Maximum number of results to return
     * @returns Search results
     */
    searchText(text: string, limit?: number): Promise<unknown[]>;
    /**
     * Create a relationship between two entities
     * @param sourceId The ID of the source entity
     * @param targetId The ID of the target entity
     * @param relationType The type of relationship
     * @param metadata Optional metadata about the relationship
     * @returns The ID of the created relationship
     */
    relate(sourceId: string, targetId: string, relationType: string, metadata?: unknown): Promise<string>;
    /**
     * Find entities similar to a given entity ID
     * @param id ID of the entity to find similar entities for
     * @param options Additional options
     * @returns Array of search results with similarity scores
     */
    findSimilar(id: string, options?: {
        limit?: number;
    }): Promise<unknown[]>;
}
//# sourceMappingURL=brainyDataInterface.d.ts.map