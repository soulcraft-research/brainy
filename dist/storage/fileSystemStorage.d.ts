import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js';
/**
 * File system storage adapter for Node.js environments
 */
export declare class FileSystemStorage implements StorageAdapter {
    private rootDir;
    private nounsDir;
    private verbsDir;
    private metadataDir;
    private personDir;
    private placeDir;
    private thingDir;
    private eventDir;
    private conceptDir;
    private contentDir;
    private defaultDir;
    private isInitialized;
    constructor(rootDirectory?: string);
    /**
     * Initialize the storage adapter
     */
    init(): Promise<void>;
    /**
     * Save a node to storage
     */
    saveNoun(noun: HNSWNoun): Promise<void>;
    /**
     * Get a node from storage
     */
    getNoun(id: string): Promise<HNSWNoun | null>;
    /**
     * Get nodes by noun type
     * @param nounType The noun type to filter by
     * @returns Promise that resolves to an array of nodes of the specified noun type
     */
    getNounsByNounType(nounType: string): Promise<HNSWNoun[]>;
    /**
     * Get all nodes from storage
     */
    getAllNouns(): Promise<HNSWNoun[]>;
    /**
     * Read a node from a file
     */
    private readNodeFromFile;
    /**
     * Delete a node from storage
     */
    deleteNoun(id: string): Promise<void>;
    /**
     * Save an edge to storage
     */
    saveVerb(verb: GraphVerb): Promise<void>;
    /**
     * Get an edge from storage
     */
    getVerb(id: string): Promise<GraphVerb | null>;
    /**
     * Get all edges from storage
     */
    getAllVerbs(): Promise<GraphVerb[]>;
    /**
     * Get edges by source node ID
     */
    getVerbsBySource(sourceId: string): Promise<GraphVerb[]>;
    /**
     * Get edges by target node ID
     */
    getVerbsByTarget(targetId: string): Promise<GraphVerb[]>;
    /**
     * Get edges by type
     */
    getVerbsByType(type: string): Promise<GraphVerb[]>;
    /**
     * Delete an edge from storage
     */
    deleteVerb(id: string): Promise<void>;
    /**
     * Save metadata to storage
     */
    saveMetadata(id: string, metadata: any): Promise<void>;
    /**
     * Get metadata from storage
     */
    getMetadata(id: string): Promise<any | null>;
    /**
     * Clear all data from storage
     */
    clear(): Promise<void>;
    /**
     * Ensure the storage adapter is initialized
     */
    private ensureInitialized;
    /**
     * Ensure a directory exists, creating it if necessary
     */
    private ensureDirectoryExists;
    /**
     * Delete a directory and all its contents recursively
     */
    private deleteDirectory;
    /**
     * Count the number of JSON files in a directory
     */
    private countFilesInDirectory;
    /**
     * Convert a Map to a plain object for serialization
     */
    private mapToObject;
    /**
     * Get the appropriate directory for a node based on its metadata
     */
    private getNodeDirectory;
    /**
     * Get information about storage usage and capacity
     */
    getStorageStatus(): Promise<{
        type: string;
        used: number;
        quota: number | null;
        details?: Record<string, any>;
    }>;
}
//# sourceMappingURL=fileSystemStorage.d.ts.map