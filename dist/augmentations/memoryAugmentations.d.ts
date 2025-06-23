import { AugmentationType, IMemoryAugmentation, AugmentationResponse } from '../types/augmentations.js';
import { StorageAdapter } from '../coreTypes.js';
/**
 * Base class for memory augmentations that wrap a StorageAdapter
 */
declare abstract class BaseMemoryAugmentation implements IMemoryAugmentation {
    readonly name: string;
    readonly description: string;
    enabled: boolean;
    protected storage: StorageAdapter;
    protected isInitialized: boolean;
    constructor(name: string, storage: StorageAdapter);
    initialize(): Promise<void>;
    shutDown(): Promise<void>;
    getStatus(): Promise<'active' | 'inactive' | 'error'>;
    storeData(key: string, data: unknown, options?: Record<string, unknown>): Promise<AugmentationResponse<boolean>>;
    retrieveData(key: string, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    updateData(key: string, data: unknown, options?: Record<string, unknown>): Promise<AugmentationResponse<boolean>>;
    deleteData(key: string, options?: Record<string, unknown>): Promise<AugmentationResponse<boolean>>;
    listDataKeys(pattern?: string, options?: Record<string, unknown>): Promise<AugmentationResponse<string[]>>;
    /**
     * Searches for data in the storage using vector similarity.
     * Implements the findNearest functionality by calculating distances client-side.
     * @param query The query vector or data to search for
     * @param k Number of results to return (default: 10)
     * @param options Optional search options
     */
    search(query: unknown, k?: number, options?: Record<string, unknown>): Promise<AugmentationResponse<Array<{
        id: string;
        score: number;
        data: unknown;
    }>>>;
    protected ensureInitialized(): Promise<void>;
}
/**
 * Memory augmentation that uses in-memory storage
 */
export declare class MemoryStorageAugmentation extends BaseMemoryAugmentation {
    readonly description = "Memory augmentation that stores data in memory";
    enabled: boolean;
    constructor(name: string);
    getType(): AugmentationType;
}
/**
 * Memory augmentation that uses file system storage
 */
export declare class FileSystemStorageAugmentation extends BaseMemoryAugmentation {
    readonly description = "Memory augmentation that stores data in the file system";
    enabled: boolean;
    constructor(name: string, rootDirectory?: string);
    getType(): AugmentationType;
}
/**
 * Memory augmentation that uses OPFS (Origin Private File System) storage
 */
export declare class OPFSStorageAugmentation extends BaseMemoryAugmentation {
    readonly description = "Memory augmentation that stores data in the Origin Private File System";
    enabled: boolean;
    constructor(name: string);
    getType(): AugmentationType;
}
/**
 * Factory function to create the appropriate memory augmentation based on the environment
 */
export declare function createMemoryAugmentation(name: string, options?: {
    storageType?: 'memory' | 'filesystem' | 'opfs';
    rootDirectory?: string;
    requestPersistentStorage?: boolean;
}): Promise<IMemoryAugmentation>;
export {};
//# sourceMappingURL=memoryAugmentations.d.ts.map