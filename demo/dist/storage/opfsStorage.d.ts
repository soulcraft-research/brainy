/**
 * OPFS (Origin Private File System) Storage Adapter
 * Provides persistent storage for the vector database using the Origin Private File System API
 */
import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js';
import '../types/fileSystemTypes.js';
declare global {
    interface FileSystemDirectoryHandle {
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    }
}
type HNSWNode = HNSWNoun;
type Edge = GraphVerb;
export declare class OPFSStorage implements StorageAdapter {
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
    private isAvailable;
    private isPersistentRequested;
    private isPersistentGranted;
    constructor();
    /**
     * Initialize the storage adapter
     */
    init(): Promise<void>;
    /**
     * Check if OPFS is available in the current environment
     */
    isOPFSAvailable(): boolean;
    /**
     * Request persistent storage permission from the user
     * @returns Promise that resolves to true if permission was granted, false otherwise
     */
    requestPersistentStorage(): Promise<boolean>;
    /**
     * Check if persistent storage is granted
     * @returns Promise that resolves to true if persistent storage is granted, false otherwise
     */
    isPersistent(): Promise<boolean>;
    /**
     * Save a noun to storage
     */
    saveNoun(noun: HNSWNoun): Promise<void>;
    /**
     * Get a noun from storage
     */
    getNoun(id: string): Promise<HNSWNoun | null>;
    /**
     * Get nouns by noun type
     * @param nounType The noun type to filter by
     * @returns Promise that resolves to an array of nouns of the specified noun type
     */
    getNounsByNounType(nounType: string): Promise<HNSWNoun[]>;
    /**
     * Get all nouns from storage
     */
    getAllNouns(): Promise<HNSWNoun[]>;
    /**
     * Delete a noun from storage
     */
    deleteNoun(id: string): Promise<void>;
    /**
     * Save a verb to storage
     */
    saveVerb(verb: GraphVerb): Promise<void>;
    /**
     * Get a verb from storage
     */
    getVerb(id: string): Promise<GraphVerb | null>;
    /**
     * Get all edges from storage
     */
    getAllEdges(): Promise<Edge[]>;
    /**
     * Get all verbs from storage (alias for getAllEdges)
     */
    getAllVerbs(): Promise<GraphVerb[]>;
    /**
     * Delete an edge from storage
     */
    deleteEdge(id: string): Promise<void>;
    /**
     * Delete a verb from storage (alias for deleteEdge)
     */
    deleteVerb(id: string): Promise<void>;
    /**
     * Get edges by source node ID
     */
    getEdgesBySource(sourceId: string): Promise<Edge[]>;
    /**
     * Get verbs by source node ID (alias for getEdgesBySource)
     */
    getVerbsBySource(sourceId: string): Promise<GraphVerb[]>;
    /**
     * Get edges by target node ID
     */
    getEdgesByTarget(targetId: string): Promise<Edge[]>;
    /**
     * Get verbs by target node ID (alias for getEdgesByTarget)
     */
    getVerbsByTarget(targetId: string): Promise<GraphVerb[]>;
    /**
     * Get edges by type
     */
    getEdgesByType(type: string): Promise<Edge[]>;
    /**
     * Get verbs by type (alias for getEdgesByType)
     */
    getVerbsByType(type: string): Promise<GraphVerb[]>;
    /**
     * Save metadata for a node
     */
    saveMetadata(id: string, metadata: any): Promise<void>;
    /**
     * Get metadata for a node
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
/**
 * In-memory storage adapter for environments where OPFS is not available
 */
export declare class MemoryStorage implements StorageAdapter {
    private nouns;
    private verbs;
    private metadata;
    constructor();
    saveNoun(noun: HNSWNoun): Promise<void>;
    getNoun(id: string): Promise<HNSWNoun | null>;
    getAllNouns(): Promise<HNSWNoun[]>;
    getNounsByNounType(nounType: string): Promise<HNSWNoun[]>;
    deleteNoun(id: string): Promise<void>;
    saveVerb(verb: GraphVerb): Promise<void>;
    getVerb(id: string): Promise<GraphVerb | null>;
    getAllVerbs(): Promise<GraphVerb[]>;
    getVerbsBySource(sourceId: string): Promise<GraphVerb[]>;
    getVerbsByTarget(targetId: string): Promise<GraphVerb[]>;
    getVerbsByType(type: string): Promise<GraphVerb[]>;
    deleteVerb(id: string): Promise<void>;
    init(): Promise<void>;
    /**
     * Get the appropriate node type for a node based on its metadata
     */
    private getNodeType;
    saveNode(node: HNSWNode): Promise<void>;
    getNode(id: string): Promise<HNSWNode | null>;
    /**
     * Get nodes by noun type
     * @param nounType The noun type to filter by
     * @returns Promise that resolves to an array of nodes of the specified noun type
     */
    getNodesByNounType(nounType: string): Promise<HNSWNode[]>;
    getAllNodes(): Promise<HNSWNode[]>;
    deleteNode(id: string): Promise<void>;
    saveMetadata(id: string, metadata: any): Promise<void>;
    getMetadata(id: string): Promise<any | null>;
    saveEdge(edge: Edge): Promise<void>;
    getEdge(id: string): Promise<Edge | null>;
    getAllEdges(): Promise<Edge[]>;
    getEdgesBySource(sourceId: string): Promise<Edge[]>;
    getEdgesByTarget(targetId: string): Promise<Edge[]>;
    getEdgesByType(type: string): Promise<Edge[]>;
    deleteEdge(id: string): Promise<void>;
    clear(): Promise<void>;
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
/**
 * Factory function to create the appropriate storage adapter based on the environment
 * @param options Configuration options for storage
 * @returns Promise that resolves to a StorageAdapter instance
 */
export declare function createStorage(options?: {
    requestPersistentStorage?: boolean;
    r2Storage?: {
        bucketName?: string;
        accountId?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
    };
    s3Storage?: {
        bucketName?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        region?: string;
    };
    gcsStorage?: {
        bucketName?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        endpoint?: string;
    };
    customS3Storage?: {
        bucketName?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        endpoint?: string;
        region?: string;
    };
    forceFileSystemStorage?: boolean;
    forceMemoryStorage?: boolean;
}): Promise<StorageAdapter>;
export {};
//# sourceMappingURL=opfsStorage.d.ts.map