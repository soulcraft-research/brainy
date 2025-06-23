/**
 * BrainyData
 * Main class that provides the vector database functionality
 */
import { HNSWOptimizedConfig } from './hnsw/hnswIndexOptimized.js';
import { DistanceFunction, GraphVerb, EmbeddingFunction, HNSWConfig, SearchResult, StorageAdapter, Vector, VectorDocument } from './coreTypes.js';
import { NounType, VerbType } from './types/graphTypes.js';
import { WebSocketConnection } from './types/augmentations.js';
import { BrainyDataInterface } from './types/brainyDataInterface.js';
export interface BrainyDataConfig {
    /**
     * HNSW index configuration
     */
    hnsw?: Partial<HNSWConfig>;
    /**
     * Optimized HNSW index configuration
     * If provided, will use the optimized HNSW index instead of the standard one
     */
    hnswOptimized?: Partial<HNSWOptimizedConfig>;
    /**
     * Distance function to use for similarity calculations
     */
    distanceFunction?: DistanceFunction;
    /**
     * Custom storage adapter (if not provided, will use OPFS or memory storage)
     */
    storageAdapter?: StorageAdapter;
    /**
     * Storage configuration options
     * These will be passed to createStorage if storageAdapter is not provided
     */
    storage?: {
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
    };
    /**
     * Embedding function to convert data to vectors
     */
    embeddingFunction?: EmbeddingFunction;
    /**
     * Request persistent storage when running in a browser
     * This will prompt the user for permission to use persistent storage
     * @deprecated Use storage.requestPersistentStorage instead
     */
    requestPersistentStorage?: boolean;
    /**
     * Set the database to read-only mode
     * When true, all write operations will throw an error
     */
    readOnly?: boolean;
    /**
     * Remote server configuration for search operations
     */
    remoteServer?: {
        /**
         * WebSocket URL of the remote Brainy server
         */
        url: string;
        /**
         * WebSocket protocols to use for the connection
         */
        protocols?: string | string[];
        /**
         * Whether to automatically connect to the remote server on initialization
         */
        autoConnect?: boolean;
    };
}
export declare class BrainyData<T = any> implements BrainyDataInterface<T> {
    private index;
    private storage;
    private isInitialized;
    private embeddingFunction;
    private distanceFunction;
    private requestPersistentStorage;
    private readOnly;
    private storageConfig;
    private useOptimizedIndex;
    private remoteServerConfig;
    private serverSearchConduit;
    private serverConnection;
    /**
     * Create a new vector database
     */
    constructor(config?: BrainyDataConfig);
    /**
     * Check if the database is in read-only mode and throw an error if it is
     * @throws Error if the database is in read-only mode
     */
    private checkReadOnly;
    /**
     * Initialize the database
     * Loads existing data from storage if available
     */
    init(): Promise<void>;
    /**
     * Connect to a remote Brainy server for search operations
     * @param serverUrl WebSocket URL of the remote Brainy server
     * @param protocols Optional WebSocket protocols to use
     * @returns The connection object
     */
    connectToRemoteServer(serverUrl: string, protocols?: string | string[]): Promise<WebSocketConnection>;
    /**
     * Add a vector or data to the database
     * If the input is not a vector, it will be converted using the embedding function
     * @param vectorOrData Vector or data to add
     * @param metadata Optional metadata to associate with the vector
     * @param options Additional options
     * @returns The ID of the added vector
     */
    add(vectorOrData: Vector | any, metadata?: T, options?: {
        forceEmbed?: boolean;
        addToRemote?: boolean;
        id?: string;
    }): Promise<string>;
    /**
     * Add data to both local and remote Brainy instances
     * @param vectorOrData Vector or data to add
     * @param metadata Optional metadata to associate with the vector
     * @param options Additional options
     * @returns The ID of the added vector
     */
    addToBoth(vectorOrData: Vector | any, metadata?: T, options?: {
        forceEmbed?: boolean;
    }): Promise<string>;
    /**
     * Add a vector to the remote server
     * @param id ID of the vector to add
     * @param vector Vector to add
     * @param metadata Optional metadata to associate with the vector
     * @returns True if successful, false otherwise
     * @private
     */
    private addToRemote;
    /**
     * Add multiple vectors or data items to the database
     * @param items Array of items to add
     * @param options Additional options
     * @returns Array of IDs for the added items
     */
    addBatch(items: Array<{
        vectorOrData: Vector | any;
        metadata?: T;
    }>, options?: {
        forceEmbed?: boolean;
        addToRemote?: boolean;
    }): Promise<string[]>;
    /**
     * Add multiple vectors or data items to both local and remote databases
     * @param items Array of items to add
     * @param options Additional options
     * @returns Array of IDs for the added items
     */
    addBatchToBoth(items: Array<{
        vectorOrData: Vector | any;
        metadata?: T;
    }>, options?: {
        forceEmbed?: boolean;
    }): Promise<string[]>;
    /**
     * Search for similar vectors within specific noun types
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param nounTypes Array of noun types to search within, or null to search all
     * @param options Additional options
     * @returns Array of search results
     */
    searchByNounTypes(queryVectorOrData: Vector | any, k?: number, nounTypes?: string[] | null, options?: {
        forceEmbed?: boolean;
    }): Promise<SearchResult<T>[]>;
    /**
     * Search for similar vectors
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    search(queryVectorOrData: Vector | any, k?: number, options?: {
        forceEmbed?: boolean;
        nounTypes?: string[];
        includeVerbs?: boolean;
        searchMode?: 'local' | 'remote' | 'combined';
    }): Promise<SearchResult<T>[]>;
    /**
     * Search the local database for similar vectors
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    searchLocal(queryVectorOrData: Vector | any, k?: number, options?: {
        forceEmbed?: boolean;
        nounTypes?: string[];
        includeVerbs?: boolean;
    }): Promise<SearchResult<T>[]>;
    /**
     * Find entities similar to a given entity ID
     * @param id ID of the entity to find similar entities for
     * @param options Additional options
     * @returns Array of search results with similarity scores
     */
    findSimilar(id: string, options?: {
        limit?: number;
        nounTypes?: string[];
        includeVerbs?: boolean;
        searchMode?: 'local' | 'remote' | 'combined';
    }): Promise<SearchResult<T>[]>;
    /**
     * Get a vector by ID
     */
    get(id: string): Promise<VectorDocument<T> | null>;
    /**
     * Get all nouns in the database
     * @returns Array of vector documents
     */
    getAllNouns(): Promise<VectorDocument<T>[]>;
    /**
     * Delete a vector by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Update metadata for a vector
     */
    updateMetadata(id: string, metadata: T): Promise<boolean>;
    /**
     * Create a relationship between two entities
     * This is a convenience wrapper around addVerb
     */
    relate(sourceId: string, targetId: string, relationType: string, metadata?: any): Promise<string>;
    /**
     * Add a verb between two nouns
     * If metadata is provided and vector is not, the metadata will be vectorized using the embedding function
     */
    addVerb(sourceId: string, targetId: string, vector?: Vector, options?: {
        type?: string;
        weight?: number;
        metadata?: any;
        forceEmbed?: boolean;
        id?: string;
    }): Promise<string>;
    /**
     * Get a verb by ID
     */
    getVerb(id: string): Promise<GraphVerb | null>;
    /**
     * Get all verbs
     */
    getAllVerbs(): Promise<GraphVerb[]>;
    /**
     * Get verbs by source noun ID
     */
    getVerbsBySource(sourceId: string): Promise<GraphVerb[]>;
    /**
     * Get verbs by target noun ID
     */
    getVerbsByTarget(targetId: string): Promise<GraphVerb[]>;
    /**
     * Get verbs by type
     */
    getVerbsByType(type: string): Promise<GraphVerb[]>;
    /**
     * Delete a verb
     */
    deleteVerb(id: string): Promise<boolean>;
    /**
     * Clear the database
     */
    clear(): Promise<void>;
    /**
     * Get the number of vectors in the database
     */
    size(): number;
    /**
     * Check if the database is in read-only mode
     * @returns True if the database is in read-only mode, false otherwise
     */
    isReadOnly(): boolean;
    /**
     * Set the database to read-only mode
     * @param readOnly True to set the database to read-only mode, false to allow writes
     */
    setReadOnly(readOnly: boolean): void;
    /**
     * Embed text or data into a vector using the same embedding function used by this instance
     * This allows clients to use the same TensorFlow Universal Sentence Encoder throughout their application
     *
     * @param data Text or data to embed
     * @returns A promise that resolves to the embedded vector
     */
    embed(data: string | string[]): Promise<Vector>;
    /**
     * Search for similar documents using a text query
     * This is a convenience method that embeds the query text and performs a search
     *
     * @param query Text query to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    searchText(query: string, k?: number, options?: {
        nounTypes?: string[];
        includeVerbs?: boolean;
        searchMode?: 'local' | 'remote' | 'combined';
    }): Promise<SearchResult<T>[]>;
    /**
     * Search a remote Brainy server for similar vectors
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    searchRemote(queryVectorOrData: Vector | any, k?: number, options?: {
        forceEmbed?: boolean;
        nounTypes?: string[];
        includeVerbs?: boolean;
        storeResults?: boolean;
    }): Promise<SearchResult<T>[]>;
    /**
     * Search both local and remote Brainy instances, combining the results
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    searchCombined(queryVectorOrData: Vector | any, k?: number, options?: {
        forceEmbed?: boolean;
        nounTypes?: string[];
        includeVerbs?: boolean;
        localFirst?: boolean;
    }): Promise<SearchResult<T>[]>;
    /**
     * Check if the instance is connected to a remote server
     * @returns True if connected to a remote server, false otherwise
     */
    isConnectedToRemoteServer(): boolean;
    /**
     * Disconnect from the remote server
     * @returns True if successfully disconnected, false if not connected
     */
    disconnectFromRemoteServer(): Promise<boolean>;
    /**
     * Ensure the database is initialized
     */
    private ensureInitialized;
    /**
     * Get information about the current storage usage and capacity
     * @returns Object containing the storage type, used space, quota, and additional details
     */
    status(): Promise<{
        type: string;
        used: number;
        quota: number | null;
        details?: Record<string, any>;
    }>;
    /**
     * Shut down the database and clean up resources
     * This should be called when the database is no longer needed
     */
    shutDown(): Promise<void>;
    /**
     * Backup all data from the database to a JSON-serializable format
     * @returns Object containing all nouns, verbs, noun types, verb types, HNSW index, and other related data
     *
     * The HNSW index data includes:
     * - entryPointId: The ID of the entry point for the graph
     * - maxLevel: The maximum level in the hierarchical structure
     * - dimension: The dimension of the vectors
     * - config: Configuration parameters for the HNSW algorithm
     * - connections: A serialized representation of the connections between nouns
     */
    backup(): Promise<{
        nouns: VectorDocument<T>[];
        verbs: GraphVerb[];
        nounTypes: string[];
        verbTypes: string[];
        version: string;
        hnswIndex?: {
            entryPointId: string | null;
            maxLevel: number;
            dimension: number | null;
            config: HNSWConfig;
            connections: Record<string, Record<string, string[]>>;
        };
    }>;
    /**
     * Import sparse data into the database
     * @param data The sparse data to import
     *             If vectors are not present for nouns, they will be created using the embedding function
     * @param options Import options
     * @returns Object containing counts of imported items
     */
    importSparseData(data: {
        nouns: VectorDocument<T>[];
        verbs: GraphVerb[];
        nounTypes?: string[];
        verbTypes?: string[];
        hnswIndex?: {
            entryPointId: string | null;
            maxLevel: number;
            dimension: number | null;
            config: HNSWConfig;
            connections: Record<string, Record<string, string[]>>;
        };
        version: string;
    }, options?: {
        clearExisting?: boolean;
    }): Promise<{
        nounsRestored: number;
        verbsRestored: number;
    }>;
    /**
     * Restore data into the database from a previously backed up format
     * @param data The data to restore, in the format returned by backup()
     *             This can include HNSW index data if it was included in the backup
     *             If vectors are not present for nouns, they will be created using the embedding function
     * @param options Restore options
     * @returns Object containing counts of restored items
     */
    restore(data: {
        nouns: VectorDocument<T>[];
        verbs: GraphVerb[];
        nounTypes?: string[];
        verbTypes?: string[];
        hnswIndex?: {
            entryPointId: string | null;
            maxLevel: number;
            dimension: number | null;
            config: HNSWConfig;
            connections: Record<string, Record<string, string[]>>;
        };
        version: string;
    }, options?: {
        clearExisting?: boolean;
    }): Promise<{
        nounsRestored: number;
        verbsRestored: number;
    }>;
    /**
     * Generate a random graph of data with typed nouns and verbs for testing and experimentation
     * @param options Configuration options for the random graph
     * @returns Object containing the IDs of the generated nouns and verbs
     */
    generateRandomGraph(options?: {
        nounCount?: number;
        verbCount?: number;
        nounTypes?: NounType[];
        verbTypes?: VerbType[];
        clearExisting?: boolean;
        seed?: string;
    }): Promise<{
        nounIds: string[];
        verbIds: string[];
    }>;
}
export { euclideanDistance, cosineDistance, manhattanDistance, dotProductDistance } from './utils/index.js';
//# sourceMappingURL=brainyData.d.ts.map