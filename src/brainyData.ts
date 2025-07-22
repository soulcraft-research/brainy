/**
 * BrainyData
 * Main class that provides the vector database functionality
 */

import {v4 as uuidv4} from 'uuid'
import {HNSWIndex} from './hnsw/hnswIndex.js'
import {
    HNSWIndexOptimized,
    HNSWOptimizedConfig
} from './hnsw/hnswIndexOptimized.js'
import {createStorage} from './storage/storageFactory.js'
import {
    DistanceFunction,
    GraphVerb,
    EmbeddingFunction,
    HNSWConfig,
    HNSWNoun,
    SearchResult,
    StorageAdapter,
    Vector,
    VectorDocument
} from './coreTypes.js'
import {
    cosineDistance,
    defaultEmbeddingFunction,
    defaultBatchEmbeddingFunction,
    getDefaultEmbeddingFunction,
    getDefaultBatchEmbeddingFunction,
    euclideanDistance,
    cleanupWorkerPools
} from './utils/index.js'
import {NounType, VerbType, GraphNoun} from './types/graphTypes.js'
import {
    ServerSearchConduitAugmentation,
    createServerSearchAugmentations
} from './augmentations/serverSearchAugmentations.js'
import {WebSocketConnection} from './types/augmentations.js'
import {BrainyDataInterface} from './types/brainyDataInterface.js'

export interface BrainyDataConfig {
    /**
     * Vector dimensions (required if not using an embedding function that auto-detects dimensions)
     */
    dimensions?: number

    /**
     * HNSW index configuration
     */
    hnsw?: Partial<HNSWConfig>

    /**
     * Optimized HNSW index configuration
     * If provided, will use the optimized HNSW index instead of the standard one
     */
    hnswOptimized?: Partial<HNSWOptimizedConfig>

    /**
     * Distance function to use for similarity calculations
     */
    distanceFunction?: DistanceFunction

    /**
     * Custom storage adapter (if not provided, will use OPFS or memory storage)
     */
    storageAdapter?: StorageAdapter

    /**
     * Storage configuration options
     * These will be passed to createStorage if storageAdapter is not provided
     */
    storage?: {
        requestPersistentStorage?: boolean
        r2Storage?: {
            bucketName?: string
            accountId?: string
            accessKeyId?: string
            secretAccessKey?: string
        }
        s3Storage?: {
            bucketName?: string
            accessKeyId?: string
            secretAccessKey?: string
            region?: string
        }
        gcsStorage?: {
            bucketName?: string
            accessKeyId?: string
            secretAccessKey?: string
            endpoint?: string
        }
        customS3Storage?: {
            bucketName?: string
            accessKeyId?: string
            secretAccessKey?: string
            endpoint?: string
            region?: string
        }
        forceFileSystemStorage?: boolean
        forceMemoryStorage?: boolean
    }

    /**
     * Embedding function to convert data to vectors
     */
    embeddingFunction?: EmbeddingFunction

    /**
     * Set the database to read-only mode
     * When true, all write operations will throw an error
     */
    readOnly?: boolean

    /**
     * Remote server configuration for search operations
     */
    remoteServer?: {
        /**
         * WebSocket URL of the remote Brainy server
         */
        url: string

        /**
         * WebSocket protocols to use for the connection
         */
        protocols?: string | string[]

        /**
         * Whether to automatically connect to the remote server on initialization
         */
        autoConnect?: boolean
    }

    /**
     * Logging configuration
     */
    logging?: {
        /**
         * Whether to enable verbose logging
         * When false, suppresses non-essential log messages like model loading progress
         * Default: true
         */
        verbose?: boolean
    }
}

export class BrainyData<T = any> implements BrainyDataInterface<T> {
    private index: HNSWIndex | HNSWIndexOptimized
    private storage: StorageAdapter | null = null
    private isInitialized = false
    private isInitializing = false
    private embeddingFunction: EmbeddingFunction
    private distanceFunction: DistanceFunction
    private requestPersistentStorage: boolean
    private readOnly: boolean
    private storageConfig: BrainyDataConfig['storage'] = {}
    private useOptimizedIndex: boolean = false
    private _dimensions: number
    private loggingConfig: BrainyDataConfig['logging'] = {verbose: true}

    // Remote server properties
    private remoteServerConfig: BrainyDataConfig['remoteServer'] | null = null
    private serverSearchConduit: ServerSearchConduitAugmentation | null = null
    private serverConnection: WebSocketConnection | null = null

    /**
     * Get the vector dimensions
     */
    public get dimensions(): number {
        return this._dimensions
    }

    /**
     * Get the maximum connections parameter from HNSW configuration
     */
    public get maxConnections(): number {
        const config = this.index.getConfig()
        return config.M || 16
    }

    /**
     * Get the efConstruction parameter from HNSW configuration
     */
    public get efConstruction(): number {
        const config = this.index.getConfig()
        return config.efConstruction || 200
    }

    /**
     * Create a new vector database
     */
    constructor(config: BrainyDataConfig = {}) {
        // Validate dimensions
        if (config.dimensions !== undefined && config.dimensions <= 0) {
            throw new Error('Dimensions must be a positive number')
        }

        // Set dimensions (default to 512 for embedding functions, or require explicit config)
        this._dimensions = config.dimensions || 512

        // Set distance function
        this.distanceFunction = config.distanceFunction || cosineDistance

        // Check if optimized HNSW index configuration is provided
        if (config.hnswOptimized) {
            // Initialize optimized HNSW index
            this.index = new HNSWIndexOptimized(
                config.hnswOptimized,
                this.distanceFunction,
                config.storageAdapter || null
            )
            this.useOptimizedIndex = true
        } else {
            // Initialize standard HNSW index
            this.index = new HNSWIndex(config.hnsw, this.distanceFunction)
        }

        // Set storage if provided, otherwise it will be initialized in init()
        this.storage = config.storageAdapter || null

        // Store logging configuration
        if (config.logging !== undefined) {
            this.loggingConfig = {
                ...this.loggingConfig,
                ...config.logging
            }
        }

        // Set embedding function if provided, otherwise create one with the appropriate verbose setting
        if (config.embeddingFunction) {
            this.embeddingFunction = config.embeddingFunction
        } else {
            this.embeddingFunction = getDefaultEmbeddingFunction({
                verbose: this.loggingConfig?.verbose
            })
        }

        // Set persistent storage request flag
        this.requestPersistentStorage =
            config.storage?.requestPersistentStorage || false

        // Set read-only flag
        this.readOnly = config.readOnly || false

        // Store storage configuration for later use in init()
        this.storageConfig = config.storage || {}

        // Store remote server configuration if provided
        if (config.remoteServer) {
            this.remoteServerConfig = config.remoteServer
        }
    }

    /**
     * Check if the database is in read-only mode and throw an error if it is
     * @throws Error if the database is in read-only mode
     */
    private checkReadOnly(): void {
        if (this.readOnly) {
            throw new Error(
                'Cannot perform write operation: database is in read-only mode'
            )
        }
    }

    /**
     * Initialize the database
     * Loads existing data from storage if available
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            return
        }

        // Prevent recursive initialization
        if (this.isInitializing) {
            return
        }

        this.isInitializing = true

        try {
            // Pre-load the embedding model early to ensure it's always available
            // This helps prevent issues with the Universal Sentence Encoder not being loaded
            try {
                // Pre-loading Universal Sentence Encoder model
                // Call embedding function directly to avoid circular dependency with embed()
                await this.embeddingFunction('')
                // Universal Sentence Encoder model loaded successfully
            } catch (embedError) {
                console.warn(
                    'Failed to pre-load Universal Sentence Encoder:',
                    embedError
                )

                // Try again with a retry mechanism
                // Retrying Universal Sentence Encoder initialization
                try {
                    // Wait a moment before retrying
                    await new Promise((resolve) => setTimeout(resolve, 1000))

                    // Try again with a different approach - use the non-threaded version
                    // This is a fallback in case the threaded version fails
                    const {createTensorFlowEmbeddingFunction} = await import(
                        './utils/embedding.js'
                        )
                    const fallbackEmbeddingFunction = createTensorFlowEmbeddingFunction()

                    // Test the fallback embedding function
                    await fallbackEmbeddingFunction('')

                    // If successful, replace the embedding function
                    console.log(
                        'Successfully loaded Universal Sentence Encoder with fallback method'
                    )
                    this.embeddingFunction = fallbackEmbeddingFunction
                } catch (retryError) {
                    console.error(
                        'All attempts to load Universal Sentence Encoder failed:',
                        retryError
                    )
                    // Continue initialization even if embedding model fails to load
                    // The application will need to handle missing embedding functionality
                }
            }

            // Initialize storage if not provided in constructor
            if (!this.storage) {
                // Combine storage config with requestPersistentStorage for backward compatibility
                let storageOptions = {
                    ...this.storageConfig,
                    requestPersistentStorage: this.requestPersistentStorage
                }

                // Ensure s3Storage has all required fields if it's provided
                if (storageOptions.s3Storage) {
                    // Only include s3Storage if all required fields are present
                    if (storageOptions.s3Storage.bucketName && 
                        storageOptions.s3Storage.accessKeyId && 
                        storageOptions.s3Storage.secretAccessKey) {
                        // All required fields are present, keep s3Storage as is
                    } else {
                        // Missing required fields, remove s3Storage to avoid type errors
                        const { s3Storage, ...rest } = storageOptions
                        storageOptions = rest
                        console.warn('Ignoring s3Storage configuration due to missing required fields')
                    }
                }

                // Use type assertion to tell TypeScript that storageOptions conforms to StorageOptions
                this.storage = await createStorage(storageOptions as any)
            }

            // Initialize storage
            await this.storage!.init()

            // If using optimized index, set the storage adapter
            if (this.useOptimizedIndex && this.index instanceof HNSWIndexOptimized) {
                this.index.setStorage(this.storage!)
            }

            // Load all nouns from storage
            const nouns: HNSWNoun[] = await this.storage!.getAllNouns()

            // Clear the index and add all nouns
            this.index.clear()
            for (const noun of nouns) {
                // Check if the vector dimensions match the expected dimensions
                if (noun.vector.length !== this._dimensions) {
                    console.warn(
                        `Skipping noun ${noun.id} due to dimension mismatch: expected ${this._dimensions}, got ${noun.vector.length}`
                    )
                    // Optionally, you could delete the mismatched noun from storage
                    // await this.storage!.deleteNoun(noun.id)
                    continue
                }

                // Add to index
                await this.index.addItem({
                    id: noun.id,
                    vector: noun.vector
                })
            }

            // Connect to remote server if configured with autoConnect
            if (this.remoteServerConfig && this.remoteServerConfig.autoConnect) {
                try {
                    await this.connectToRemoteServer(
                        this.remoteServerConfig.url,
                        this.remoteServerConfig.protocols
                    )
                } catch (remoteError) {
                    console.warn('Failed to auto-connect to remote server:', remoteError)
                    // Continue initialization even if remote connection fails
                }
            }

            this.isInitialized = true
            this.isInitializing = false
        } catch (error) {
            console.error('Failed to initialize BrainyData:', error)
            this.isInitializing = false
            throw new Error(`Failed to initialize BrainyData: ${error}`)
        }
    }

    /**
     * Connect to a remote Brainy server for search operations
     * @param serverUrl WebSocket URL of the remote Brainy server
     * @param protocols Optional WebSocket protocols to use
     * @returns The connection object
     */
    public async connectToRemoteServer(
        serverUrl: string,
        protocols?: string | string[]
    ): Promise<WebSocketConnection> {
        await this.ensureInitialized()

        try {
            // Create server search augmentations
            const {conduit, connection} = await createServerSearchAugmentations(
                serverUrl,
                {
                    protocols,
                    localDb: this
                }
            )

            // Store the conduit and connection
            this.serverSearchConduit = conduit
            this.serverConnection = connection

            return connection
        } catch (error) {
            console.error('Failed to connect to remote server:', error)
            throw new Error(`Failed to connect to remote server: ${error}`)
        }
    }

    /**
     * Add a vector or data to the database
     * If the input is not a vector, it will be converted using the embedding function
     * @param vectorOrData Vector or data to add
     * @param metadata Optional metadata to associate with the vector
     * @param options Additional options
     * @returns The ID of the added vector
     */
    public async add(
        vectorOrData: Vector | any,
        metadata?: T,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            addToRemote?: boolean // Whether to also add to the remote server if connected
            id?: string // Optional ID to use instead of generating a new one
        } = {}
    ): Promise<string> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            let vector: Vector

            // Check if input is already a vector
            if (
                Array.isArray(vectorOrData) &&
                vectorOrData.every((item) => typeof item === 'number') &&
                !options.forceEmbed
            ) {
                // Input is already a vector
                vector = vectorOrData
            } else {
                // Input needs to be vectorized
                try {
                    vector = await this.embeddingFunction(vectorOrData)
                } catch (embedError) {
                    throw new Error(`Failed to vectorize data: ${embedError}`)
                }
            }

            // Check if vector is defined
            if (!vector) {
                throw new Error('Vector is undefined or null')
            }

            // Validate vector dimensions
            if (vector.length !== this._dimensions) {
                throw new Error(`Vector dimension mismatch: expected ${this._dimensions}, got ${vector.length}`)
            }

            // Use ID from options if it exists, otherwise from metadata, otherwise generate a new UUID
            const id =
                options.id ||
                (metadata && typeof metadata === 'object' && 'id' in metadata
                    ? (metadata as any).id
                    : uuidv4())

            // Add to index
            await this.index.addItem({id, vector})

            // Get the noun from the index
            const noun = this.index.getNouns().get(id)

            if (!noun) {
                throw new Error(`Failed to retrieve newly created noun with ID ${id}`)
            }

            // Save noun to storage
            await this.storage!.saveNoun(noun)

            // Save metadata if provided
            if (metadata !== undefined) {
                // Validate noun type if metadata is for a GraphNoun
                if (metadata && typeof metadata === 'object' && 'noun' in metadata) {
                    const nounType = (metadata as unknown as GraphNoun).noun

                    // Check if the noun type is valid
                    const isValidNounType = Object.values(NounType).includes(nounType)

                    if (!isValidNounType) {
                        console.warn(
                            `Invalid noun type: ${nounType}. Falling back to GraphNoun.`
                        )
                        // Set a default noun type
                        ;(metadata as unknown as GraphNoun).noun = NounType.Concept
                    }
                }

                // Ensure metadata has the correct id field
                let metadataToSave = metadata
                if (metadata && typeof metadata === 'object') {
                    metadataToSave = {...metadata, id}
                }

                await this.storage!.saveMetadata(id, metadataToSave)
            }

            // If addToRemote is true and we're connected to a remote server, add to remote as well
            if (options.addToRemote && this.isConnectedToRemoteServer()) {
                try {
                    await this.addToRemote(id, vector, metadata)
                } catch (remoteError) {
                    console.warn(
                        `Failed to add to remote server: ${remoteError}. Continuing with local add.`
                    )
                }
            }

            return id
        } catch (error) {
            console.error('Failed to add vector:', error)
            throw new Error(`Failed to add vector: ${error}`)
        }
    }

    /**
     * Add a text item to the database with automatic embedding
     * This is a convenience method for adding text data with metadata
     * @param text Text data to add
     * @param metadata Metadata to associate with the text
     * @param options Additional options
     * @returns The ID of the added item
     */
    public async addItem(
        text: string,
        metadata?: T,
        options: {
            addToRemote?: boolean // Whether to also add to the remote server if connected
            id?: string // Optional ID to use instead of generating a new one
        } = {}
    ): Promise<string> {
        // Use the existing add method with forceEmbed to ensure text is embedded
        return this.add(text, metadata, {...options, forceEmbed: true})
    }

    /**
     * Add data to both local and remote Brainy instances
     * @param vectorOrData Vector or data to add
     * @param metadata Optional metadata to associate with the vector
     * @param options Additional options
     * @returns The ID of the added vector
     */
    public async addToBoth(
        vectorOrData: Vector | any,
        metadata?: T,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
        } = {}
    ): Promise<string> {
        // Check if connected to a remote server
        if (!this.isConnectedToRemoteServer()) {
            throw new Error(
                'Not connected to a remote server. Call connectToRemoteServer() first.'
            )
        }

        // Add to local with addToRemote option
        return this.add(vectorOrData, metadata, {...options, addToRemote: true})
    }

    /**
     * Add a vector to the remote server
     * @param id ID of the vector to add
     * @param vector Vector to add
     * @param metadata Optional metadata to associate with the vector
     * @returns True if successful, false otherwise
     * @private
     */
    private async addToRemote(
        id: string,
        vector: Vector,
        metadata?: T
    ): Promise<boolean> {
        if (!this.isConnectedToRemoteServer()) {
            return false
        }

        try {
            if (!this.serverSearchConduit || !this.serverConnection) {
                throw new Error(
                    'Server search conduit or connection is not initialized'
                )
            }

            // Add to remote server
            const addResult = await this.serverSearchConduit.addToBoth(
                this.serverConnection.connectionId,
                vector,
                metadata
            )

            if (!addResult.success) {
                throw new Error(`Remote add failed: ${addResult.error}`)
            }

            return true
        } catch (error) {
            console.error('Failed to add to remote server:', error)
            throw new Error(`Failed to add to remote server: ${error}`)
        }
    }

    /**
     * Add multiple vectors or data items to the database
     * @param items Array of items to add
     * @param options Additional options
     * @returns Array of IDs for the added items
     */
    public async addBatch(
        items: Array<{
            vectorOrData: Vector | any
            metadata?: T
        }>,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            addToRemote?: boolean // Whether to also add to the remote server if connected
            concurrency?: number // Maximum number of concurrent operations (default: 4)
            batchSize?: number // Maximum number of items to process in a single batch (default: 50)
        } = {}
    ): Promise<string[]> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        // Default concurrency to 4 if not specified
        const concurrency = options.concurrency || 4

        // Default batch size to 50 if not specified
        const batchSize = options.batchSize || 50

        try {
            // Process items in batches to control concurrency and memory usage
            const ids: string[] = []
            const itemsToProcess = [...items] // Create a copy to avoid modifying the original array

            while (itemsToProcess.length > 0) {
                // Take up to 'batchSize' items to process in a batch
                const batch = itemsToProcess.splice(0, batchSize)

                // Separate items that are already vectors from those that need embedding
                const vectorItems: Array<{
                    vectorOrData: Vector
                    metadata?: T
                    index: number
                }> = []

                const textItems: Array<{
                    text: string
                    metadata?: T
                    index: number
                }> = []

                // Categorize items
                batch.forEach((item, index) => {
                    if (
                        Array.isArray(item.vectorOrData) &&
                        item.vectorOrData.every((val) => typeof val === 'number') &&
                        !options.forceEmbed
                    ) {
                        // Item is already a vector
                        vectorItems.push({
                            vectorOrData: item.vectorOrData,
                            metadata: item.metadata,
                            index
                        })
                    } else if (typeof item.vectorOrData === 'string') {
                        // Item is text that needs embedding
                        textItems.push({
                            text: item.vectorOrData,
                            metadata: item.metadata,
                            index
                        })
                    } else {
                        // For now, treat other types as text
                        // In a more complete implementation, we might handle other types differently
                        const textRepresentation = String(item.vectorOrData)
                        textItems.push({
                            text: textRepresentation,
                            metadata: item.metadata,
                            index
                        })
                    }
                })

                // Process vector items (already embedded)
                const vectorPromises = vectorItems.map((item) =>
                    this.add(item.vectorOrData, item.metadata, options)
                )

                // Process text items in a single batch embedding operation
                let textPromises: Promise<string>[] = []
                if (textItems.length > 0) {
                    // Extract just the text for batch embedding
                    const texts = textItems.map((item) => item.text)

                    // Perform batch embedding
                    const embeddings = await defaultBatchEmbeddingFunction(texts)

                    // Add each item with its embedding
                    textPromises = textItems.map((item, i) =>
                        this.add(embeddings[i], item.metadata, {
                            ...options,
                            forceEmbed: false
                        })
                    )
                }

                // Combine all promises
                const batchResults = await Promise.all([
                    ...vectorPromises,
                    ...textPromises
                ])

                // Add the results to our ids array
                ids.push(...batchResults)
            }

            return ids
        } catch (error) {
            console.error('Failed to add batch of items:', error)
            throw new Error(`Failed to add batch of items: ${error}`)
        }
    }

    /**
     * Add multiple vectors or data items to both local and remote databases
     * @param items Array of items to add
     * @param options Additional options
     * @returns Array of IDs for the added items
     */
    public async addBatchToBoth(
        items: Array<{
            vectorOrData: Vector | any
            metadata?: T
        }>,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            concurrency?: number // Maximum number of concurrent operations (default: 4)
        } = {}
    ): Promise<string[]> {
        // Check if connected to a remote server
        if (!this.isConnectedToRemoteServer()) {
            throw new Error(
                'Not connected to a remote server. Call connectToRemoteServer() first.'
            )
        }

        // Add to local with addToRemote option
        return this.addBatch(items, {...options, addToRemote: true})
    }

    /**
     * Search for similar vectors within specific noun types
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param nounTypes Array of noun types to search within, or null to search all
     * @param options Additional options
     * @returns Array of search results
     */
    public async searchByNounTypes(
        queryVectorOrData: Vector | any,
        k: number = 10,
        nounTypes: string[] | null = null,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
        } = {}
    ): Promise<SearchResult<T>[]> {
        if (!this.isInitialized) {
            throw new Error('BrainyData must be initialized before searching. Call init() first.')
        }

        try {
            let queryVector: Vector

            // Check if input is already a vector
            if (
                Array.isArray(queryVectorOrData) &&
                queryVectorOrData.every((item) => typeof item === 'number') &&
                !options.forceEmbed
            ) {
                // Input is already a vector
                queryVector = queryVectorOrData
            } else {
                // Input needs to be vectorized
                try {
                    queryVector = await this.embeddingFunction(queryVectorOrData)
                } catch (embedError) {
                    throw new Error(`Failed to vectorize query data: ${embedError}`)
                }
            }

            // Check if query vector is defined
            if (!queryVector) {
                throw new Error('Query vector is undefined or null')
            }

            // If no noun types specified, search all nouns
            if (!nounTypes || nounTypes.length === 0) {
                // Search in the index
                const results = await this.index.search(queryVector, k)

                // Get metadata for each result
                const searchResults: SearchResult<T>[] = []

                for (const [id, score] of results) {
                    const noun = this.index.getNouns().get(id)
                    if (!noun) {
                        continue
                    }

                    let metadata = await this.storage!.getMetadata(id)

                    // Initialize metadata to an empty object if it's null
                    if (metadata === null) {
                        metadata = {} as T
                    }

                    searchResults.push({
                        id,
                        score,
                        vector: noun.vector,
                        metadata: metadata as T
                    })
                }

                return searchResults
            } else {
                // Get nouns for each noun type in parallel
                const nounPromises = nounTypes.map((nounType) =>
                    this.storage!.getNounsByNounType(nounType)
                )
                const nounArrays = await Promise.all(nounPromises)

                // Combine all nouns
                const nouns: HNSWNoun[] = []
                for (const nounArray of nounArrays) {
                    nouns.push(...nounArray)
                }

                // Calculate distances for each noun
                const results: Array<[string, number]> = []
                for (const noun of nouns) {
                    const distance = this.index.getDistanceFunction()(
                        queryVector,
                        noun.vector
                    )
                    results.push([noun.id, distance])
                }

                // Sort by distance (ascending)
                results.sort((a, b) => a[1] - b[1])

                // Take top k results
                const topResults = results.slice(0, k)

                // Get metadata for each result
                const searchResults: SearchResult<T>[] = []

                for (const [id, score] of topResults) {
                    const noun = nouns.find((n) => n.id === id)
                    if (!noun) {
                        continue
                    }

                    let metadata = await this.storage!.getMetadata(id)

                    // Initialize metadata to an empty object if it's null
                    if (metadata === null) {
                        metadata = {} as T
                    }

                    searchResults.push({
                        id,
                        score,
                        vector: noun.vector,
                        metadata: metadata as T
                    })
                }

                return searchResults
            }
        } catch (error) {
            console.error('Failed to search vectors by noun types:', error)
            throw new Error(`Failed to search vectors by noun types: ${error}`)
        }
    }

    /**
     * Search for similar vectors
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    public async search(
        queryVectorOrData: Vector | any,
        k: number = 10,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            nounTypes?: string[] // Optional array of noun types to search within
            includeVerbs?: boolean // Whether to include associated GraphVerbs in the results
            searchMode?: 'local' | 'remote' | 'combined' // Where to search: local, remote, or both
            searchVerbs?: boolean // Whether to search for verbs directly instead of nouns
            verbTypes?: string[] // Optional array of verb types to search within or filter by
            searchConnectedNouns?: boolean // Whether to search for nouns connected by verbs
            verbDirection?: 'outgoing' | 'incoming' | 'both' // Direction of verbs to consider when searching connected nouns
        } = {}
    ): Promise<SearchResult<T>[]> {
        if (!this.isInitialized) {
            throw new Error('BrainyData must be initialized before searching. Call init() first.')
        }
        // If searching for verbs directly
        if (options.searchVerbs) {
            const verbResults = await this.searchVerbs(queryVectorOrData, k, {
                forceEmbed: options.forceEmbed,
                verbTypes: options.verbTypes
            })

            // Convert verb results to SearchResult format
            return verbResults.map((verb) => ({
                id: verb.id,
                score: verb.similarity,
                vector: verb.embedding || [],
                metadata: {
                    verb: verb.verb,
                    source: verb.source,
                    target: verb.target,
                    ...verb.data
                } as unknown as T
            }))
        }

        // If searching for nouns connected by verbs
        if (options.searchConnectedNouns) {
            return this.searchNounsByVerbs(queryVectorOrData, k, {
                forceEmbed: options.forceEmbed,
                verbTypes: options.verbTypes,
                direction: options.verbDirection
            })
        }

        // If a specific search mode is specified, use the appropriate search method
        if (options.searchMode === 'local') {
            return this.searchLocal(queryVectorOrData, k, options)
        } else if (options.searchMode === 'remote') {
            return this.searchRemote(queryVectorOrData, k, options)
        } else if (options.searchMode === 'combined') {
            return this.searchCombined(queryVectorOrData, k, options)
        }

        // Default behavior (backward compatible): search locally
        return this.searchLocal(queryVectorOrData, k, options)
    }

    /**
     * Search the local database for similar vectors
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    public async searchLocal(
        queryVectorOrData: Vector | any,
        k: number = 10,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            nounTypes?: string[] // Optional array of noun types to search within
            includeVerbs?: boolean // Whether to include associated GraphVerbs in the results
        } = {}
    ): Promise<SearchResult<T>[]> {
        if (!this.isInitialized) {
            throw new Error('BrainyData must be initialized before searching. Call init() first.')
        }
        // If input is a string and not a vector, automatically vectorize it
        let queryToUse = queryVectorOrData
        if (typeof queryVectorOrData === 'string' && !options.forceEmbed) {
            queryToUse = await this.embed(queryVectorOrData)
            options.forceEmbed = false // Already embedded, don't force again
        }

        // If noun types are specified, use searchByNounTypes
        let searchResults
        if (options.nounTypes && options.nounTypes.length > 0) {
            searchResults = await this.searchByNounTypes(
                queryToUse,
                k,
                options.nounTypes,
                {
                    forceEmbed: options.forceEmbed
                }
            )
        } else {
            // Otherwise, search all GraphNouns
            searchResults = await this.searchByNounTypes(queryToUse, k, null, {
                forceEmbed: options.forceEmbed
            })
        }

        // If includeVerbs is true, retrieve associated GraphVerbs for each result
        if (options.includeVerbs && this.storage) {
            for (const result of searchResults) {
                try {
                    // Get outgoing verbs for this noun
                    const outgoingVerbs = await this.storage.getVerbsBySource(result.id)

                    // Get incoming verbs for this noun
                    const incomingVerbs = await this.storage.getVerbsByTarget(result.id)

                    // Combine all verbs
                    const allVerbs = [...outgoingVerbs, ...incomingVerbs]

                    // Add verbs to the result metadata
                    if (!result.metadata) {
                        result.metadata = {} as T
                    }

                    // Add the verbs to the metadata
                    ;(result.metadata as Record<string, any>).associatedVerbs = allVerbs
                } catch (error) {
                    console.warn(`Failed to retrieve verbs for noun ${result.id}:`, error)
                }
            }
        }

        return searchResults
    }

    /**
     * Find entities similar to a given entity ID
     * @param id ID of the entity to find similar entities for
     * @param options Additional options
     * @returns Array of search results with similarity scores
     */
    public async findSimilar(
        id: string,
        options: {
            limit?: number // Number of results to return
            nounTypes?: string[] // Optional array of noun types to search within
            includeVerbs?: boolean // Whether to include associated GraphVerbs in the results
            searchMode?: 'local' | 'remote' | 'combined' // Where to search: local, remote, or both
        } = {}
    ): Promise<SearchResult<T>[]> {
        await this.ensureInitialized()

        // Get the entity by ID
        const entity = await this.get(id)
        if (!entity) {
            throw new Error(`Entity with ID ${id} not found`)
        }

        // Use the entity's vector to search for similar entities
        const k = (options.limit || 10) + 1 // Add 1 to account for the original entity
        const searchResults = await this.search(entity.vector, k, {
            forceEmbed: false,
            nounTypes: options.nounTypes,
            includeVerbs: options.includeVerbs,
            searchMode: options.searchMode
        })

        // Filter out the original entity and limit to the requested number
        return searchResults
            .filter((result) => result.id !== id)
            .slice(0, options.limit || 10)
    }

    /**
     * Get a vector by ID
     */
    public async get(id: string): Promise<VectorDocument<T> | null> {
        await this.ensureInitialized()

        try {
            // Get noun from index
            const noun = this.index.getNouns().get(id)
            if (!noun) {
                return null
            }

            // Get metadata
            const metadata = await this.storage!.getMetadata(id)

            return {
                id,
                vector: noun.vector,
                metadata: metadata as T | undefined
            }
        } catch (error) {
            console.error(`Failed to get vector ${id}:`, error)
            throw new Error(`Failed to get vector ${id}: ${error}`)
        }
    }

    /**
     * Get all nouns in the database
     * @returns Array of vector documents
     */
    public async getAllNouns(): Promise<VectorDocument<T>[]> {
        await this.ensureInitialized()

        try {
            const nouns = this.index.getNouns()
            const result: VectorDocument<T>[] = []

            for (const [id, noun] of nouns.entries()) {
                const metadata = await this.storage!.getMetadata(id)
                result.push({
                    id,
                    vector: noun.vector,
                    metadata: metadata as T | undefined
                })
            }

            return result
        } catch (error) {
            console.error('Failed to get all nouns:', error)
            throw new Error(`Failed to get all nouns: ${error}`)
        }
    }

    /**
     * Delete a vector by ID
     */
    public async delete(id: string): Promise<boolean> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            // Remove from index
            const removed = this.index.removeItem(id)
            if (!removed) {
                return false
            }

            // Remove from storage
            await this.storage!.deleteNoun(id)

            // Try to remove metadata (ignore errors)
            try {
                await this.storage!.saveMetadata(id, null)
            } catch (error) {
                // Ignore
            }

            return true
        } catch (error) {
            console.error(`Failed to delete vector ${id}:`, error)
            throw new Error(`Failed to delete vector ${id}: ${error}`)
        }
    }

    /**
     * Update metadata for a vector
     */
    public async updateMetadata(id: string, metadata: T): Promise<boolean> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            // Check if a vector exists
            const noun = this.index.getNouns().get(id)
            if (!noun) {
                return false
            }

            // Validate noun type if metadata is for a GraphNoun
            if (metadata && typeof metadata === 'object' && 'noun' in metadata) {
                const nounType = (metadata as unknown as GraphNoun).noun

                // Check if the noun type is valid
                const isValidNounType = Object.values(NounType).includes(nounType)

                if (!isValidNounType) {
                    console.warn(
                        `Invalid noun type: ${nounType}. Falling back to GraphNoun.`
                    )
                    // Set a default noun type
                    ;(metadata as unknown as GraphNoun).noun = NounType.Concept
                }
            }

            // Update metadata
            await this.storage!.saveMetadata(id, metadata)

            return true
        } catch (error) {
            console.error(`Failed to update metadata for vector ${id}:`, error)
            throw new Error(`Failed to update metadata for vector ${id}: ${error}`)
        }
    }

    /**
     * Create a relationship between two entities
     * This is a convenience wrapper around addVerb
     */
    public async relate(
        sourceId: string,
        targetId: string,
        relationType: string,
        metadata?: any
    ): Promise<string> {
        return this.addVerb(sourceId, targetId, undefined, {
            type: relationType,
            metadata: metadata
        })
    }

    /**
     * Add a verb between two nouns
     * If metadata is provided and vector is not, the metadata will be vectorized using the embedding function
     */
    public async addVerb(
        sourceId: string,
        targetId: string,
        vector?: Vector,
        options: {
            type?: string
            weight?: number
            metadata?: any
            forceEmbed?: boolean // Force using the embedding function for metadata even if vector is provided
            id?: string // Optional ID to use instead of generating a new one
        } = {}
    ): Promise<string> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            // Check if source and target nouns exist
            const sourceNoun = this.index.getNouns().get(sourceId)
            const targetNoun = this.index.getNouns().get(targetId)

            if (!sourceNoun) {
                throw new Error(`Source noun with ID ${sourceId} not found`)
            }

            if (!targetNoun) {
                throw new Error(`Target noun with ID ${targetId} not found`)
            }

            // Use provided ID or generate a new one
            const id = options.id || uuidv4()

            let verbVector: Vector

            // If metadata is provided and no vector is provided or forceEmbed is true, vectorize the metadata
            if (options.metadata && (!vector || options.forceEmbed)) {
                try {
                    // Extract a string representation from metadata for embedding
                    let textToEmbed: string
                    if (typeof options.metadata === 'string') {
                        textToEmbed = options.metadata
                    } else if (
                        options.metadata.description &&
                        typeof options.metadata.description === 'string'
                    ) {
                        textToEmbed = options.metadata.description
                    } else {
                        // Convert to JSON string as fallback
                        textToEmbed = JSON.stringify(options.metadata)
                    }

                    // Ensure textToEmbed is a string
                    if (typeof textToEmbed !== 'string') {
                        textToEmbed = String(textToEmbed)
                    }

                    verbVector = await this.embeddingFunction(textToEmbed)
                } catch (embedError) {
                    throw new Error(`Failed to vectorize verb metadata: ${embedError}`)
                }
            } else {
                // Use a provided vector or average of source and target vectors
                if (vector) {
                    verbVector = vector
                } else {
                    // Ensure both source and target vectors have the same dimension
                    if (
                        !sourceNoun.vector ||
                        !targetNoun.vector ||
                        sourceNoun.vector.length === 0 ||
                        targetNoun.vector.length === 0 ||
                        sourceNoun.vector.length !== targetNoun.vector.length
                    ) {
                        throw new Error(
                            `Cannot average vectors: source or target vector is invalid or dimensions don't match`
                        )
                    }

                    // Average the vectors
                    verbVector = sourceNoun.vector.map(
                        (val, i) => (val + targetNoun.vector[i]) / 2
                    )
                }
            }

            // Validate verb type if provided
            let verbType = options.type
            if (verbType) {
                // Check if the verb type is valid
                const isValidVerbType = Object.values(VerbType).includes(
                    verbType as VerbType
                )

                if (!isValidVerbType) {
                    console.warn(
                        `Invalid verb type: ${verbType}. Using RelatedTo as default.`
                    )
                    // Set a default verb type
                    verbType = VerbType.RelatedTo
                }
            }

            // Create verb
            const verb: GraphVerb = {
                id,
                vector: verbVector,
                connections: new Map(),
                sourceId,
                targetId,
                type: verbType,
                weight: options.weight,
                metadata: options.metadata
            }

            // Add to index
            await this.index.addItem({id, vector: verbVector})

            // Get the noun from the index
            const indexNoun = this.index.getNouns().get(id)

            if (!indexNoun) {
                throw new Error(
                    `Failed to retrieve newly created verb noun with ID ${id}`
                )
            }

            // Update verb connections from index
            verb.connections = indexNoun.connections

            // Save verb to storage
            await this.storage!.saveVerb(verb)

            return id
        } catch (error) {
            console.error('Failed to add verb:', error)
            throw new Error(`Failed to add verb: ${error}`)
        }
    }

    /**
     * Get a verb by ID
     */
    public async getVerb(id: string): Promise<GraphVerb | null> {
        await this.ensureInitialized()

        try {
            return await this.storage!.getVerb(id)
        } catch (error) {
            console.error(`Failed to get verb ${id}:`, error)
            throw new Error(`Failed to get verb ${id}: ${error}`)
        }
    }

    /**
     * Get all verbs
     */
    public async getAllVerbs(): Promise<GraphVerb[]> {
        await this.ensureInitialized()

        try {
            return await this.storage!.getAllVerbs()
        } catch (error) {
            console.error('Failed to get all verbs:', error)
            throw new Error(`Failed to get all verbs: ${error}`)
        }
    }

    /**
     * Get verbs by source noun ID
     */
    public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
        await this.ensureInitialized()

        try {
            return await this.storage!.getVerbsBySource(sourceId)
        } catch (error) {
            console.error(`Failed to get verbs by source ${sourceId}:`, error)
            throw new Error(`Failed to get verbs by source ${sourceId}: ${error}`)
        }
    }

    /**
     * Get verbs by target noun ID
     */
    public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
        await this.ensureInitialized()

        try {
            return await this.storage!.getVerbsByTarget(targetId)
        } catch (error) {
            console.error(`Failed to get verbs by target ${targetId}:`, error)
            throw new Error(`Failed to get verbs by target ${targetId}: ${error}`)
        }
    }

    /**
     * Get verbs by type
     */
    public async getVerbsByType(type: string): Promise<GraphVerb[]> {
        await this.ensureInitialized()

        try {
            return await this.storage!.getVerbsByType(type)
        } catch (error) {
            console.error(`Failed to get verbs by type ${type}:`, error)
            throw new Error(`Failed to get verbs by type ${type}: ${error}`)
        }
    }

    /**
     * Delete a verb
     */
    public async deleteVerb(id: string): Promise<boolean> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            // Remove from index
            const removed = this.index.removeItem(id)
            if (!removed) {
                return false
            }

            // Remove from storage
            await this.storage!.deleteVerb(id)

            return true
        } catch (error) {
            console.error(`Failed to delete verb ${id}:`, error)
            throw new Error(`Failed to delete verb ${id}: ${error}`)
        }
    }

    /**
     * Clear the database
     */
    public async clear(): Promise<void> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            // Clear index
            this.index.clear()

            // Clear storage
            await this.storage!.clear()
        } catch (error) {
            console.error('Failed to clear vector database:', error)
            throw new Error(`Failed to clear vector database: ${error}`)
        }
    }

    /**
     * Get the number of vectors in the database
     */
    public size(): number {
        return this.index.size()
    }

    /**
     * Check if the database is in read-only mode
     * @returns True if the database is in read-only mode, false otherwise
     */
    public isReadOnly(): boolean {
        return this.readOnly
    }

    /**
     * Set the database to read-only mode
     * @param readOnly True to set the database to read-only mode, false to allow writes
     */
    public setReadOnly(readOnly: boolean): void {
        this.readOnly = readOnly
    }

    /**
     * Embed text or data into a vector using the same embedding function used by this instance
     * This allows clients to use the same TensorFlow Universal Sentence Encoder throughout their application
     *
     * @param data Text or data to embed
     * @returns A promise that resolves to the embedded vector
     */
    public async embed(data: string | string[]): Promise<Vector> {
        await this.ensureInitialized()

        try {
            return await this.embeddingFunction(data)
        } catch (error) {
            console.error('Failed to embed data:', error)
            throw new Error(`Failed to embed data: ${error}`)
        }
    }

    /**
     * Search for verbs by type and/or vector similarity
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of verbs with similarity scores
     */
    public async searchVerbs(
        queryVectorOrData: Vector | any,
        k: number = 10,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            verbTypes?: string[] // Optional array of verb types to search within
        } = {}
    ): Promise<Array<GraphVerb & { similarity: number }>> {
        await this.ensureInitialized()

        try {
            let queryVector: Vector

            // Check if input is already a vector
            if (
                Array.isArray(queryVectorOrData) &&
                queryVectorOrData.every((item) => typeof item === 'number') &&
                !options.forceEmbed
            ) {
                // Input is already a vector
                queryVector = queryVectorOrData
            } else {
                // Input needs to be vectorized
                try {
                    queryVector = await this.embeddingFunction(queryVectorOrData)
                } catch (embedError) {
                    throw new Error(`Failed to vectorize query data: ${embedError}`)
                }
            }

            // Get verbs to search through
            let verbs: GraphVerb[] = []

            // If verb types are specified, get verbs of those types
            if (options.verbTypes && options.verbTypes.length > 0) {
                // Get verbs for each verb type in parallel
                const verbPromises = options.verbTypes.map((verbType) =>
                    this.getVerbsByType(verbType)
                )
                const verbArrays = await Promise.all(verbPromises)

                // Combine all verbs
                for (const verbArray of verbArrays) {
                    verbs.push(...verbArray)
                }
            } else {
                // Get all verbs
                verbs = await this.storage!.getAllVerbs()
            }

            // Filter out verbs without embeddings
            verbs = verbs.filter(
                (verb) => verb.embedding && verb.embedding.length > 0
            )

            // Calculate similarity for each verb
            const results: Array<GraphVerb & { similarity: number }> = []
            for (const verb of verbs) {
                if (verb.embedding) {
                    const distance = this.index.getDistanceFunction()(
                        queryVector,
                        verb.embedding
                    )
                    results.push({
                        ...verb,
                        similarity: distance
                    })
                }
            }

            // Sort by similarity (ascending distance)
            results.sort((a, b) => a.similarity - b.similarity)

            // Take top k results
            return results.slice(0, k)
        } catch (error) {
            console.error('Failed to search verbs:', error)
            throw new Error(`Failed to search verbs: ${error}`)
        }
    }

    /**
     * Search for nouns connected by specific verb types
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    public async searchNounsByVerbs(
        queryVectorOrData: Vector | any,
        k: number = 10,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            verbTypes?: string[] // Optional array of verb types to filter by
            direction?: 'outgoing' | 'incoming' | 'both' // Direction of verbs to consider
        } = {}
    ): Promise<SearchResult<T>[]> {
        await this.ensureInitialized()

        try {
            // First, search for nouns
            const nounResults = await this.searchByNounTypes(
                queryVectorOrData,
                k * 2, // Get more results initially to account for filtering
                null,
                {forceEmbed: options.forceEmbed}
            )

            // If no verb types specified, return the noun results directly
            if (!options.verbTypes || options.verbTypes.length === 0) {
                return nounResults.slice(0, k)
            }

            // For each noun, get connected nouns through specified verb types
            const connectedNounIds = new Set<string>()
            const direction = options.direction || 'both'

            for (const result of nounResults) {
                // Get verbs connected to this noun
                let connectedVerbs: GraphVerb[] = []

                if (direction === 'outgoing' || direction === 'both') {
                    // Get outgoing verbs
                    const outgoingVerbs = await this.storage!.getVerbsBySource(result.id)
                    connectedVerbs.push(...outgoingVerbs)
                }

                if (direction === 'incoming' || direction === 'both') {
                    // Get incoming verbs
                    const incomingVerbs = await this.storage!.getVerbsByTarget(result.id)
                    connectedVerbs.push(...incomingVerbs)
                }

                // Filter by verb types if specified
                if (options.verbTypes && options.verbTypes.length > 0) {
                    connectedVerbs = connectedVerbs.filter(
                        (verb) => verb.verb && options.verbTypes!.includes(verb.verb)
                    )
                }

                // Add connected noun IDs to the set
                for (const verb of connectedVerbs) {
                    if (verb.source && verb.source !== result.id) {
                        connectedNounIds.add(verb.source)
                    }
                    if (verb.target && verb.target !== result.id) {
                        connectedNounIds.add(verb.target)
                    }
                }
            }

            // Get the connected nouns
            const connectedNouns: SearchResult<T>[] = []
            for (const id of connectedNounIds) {
                try {
                    const noun = this.index.getNouns().get(id)
                    if (noun) {
                        const metadata = await this.storage!.getMetadata(id)

                        // Calculate similarity score
                        let queryVector: Vector
                        if (
                            Array.isArray(queryVectorOrData) &&
                            queryVectorOrData.every((item) => typeof item === 'number') &&
                            !options.forceEmbed
                        ) {
                            queryVector = queryVectorOrData
                        } else {
                            queryVector = await this.embeddingFunction(queryVectorOrData)
                        }

                        const distance = this.index.getDistanceFunction()(
                            queryVector,
                            noun.vector
                        )

                        connectedNouns.push({
                            id,
                            score: distance,
                            vector: noun.vector,
                            metadata: metadata as T | undefined
                        })
                    }
                } catch (error) {
                    console.warn(`Failed to retrieve noun ${id}:`, error)
                }
            }

            // Sort by similarity score
            connectedNouns.sort((a, b) => a.score - b.score)

            // Return top k results
            return connectedNouns.slice(0, k)
        } catch (error) {
            console.error('Failed to search nouns by verbs:', error)
            throw new Error(`Failed to search nouns by verbs: ${error}`)
        }
    }

    /**
     * Search for similar documents using a text query
     * This is a convenience method that embeds the query text and performs a search
     *
     * @param query Text query to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    public async searchText(
        query: string,
        k: number = 10,
        options: {
            nounTypes?: string[]
            includeVerbs?: boolean
            searchMode?: 'local' | 'remote' | 'combined'
        } = {}
    ): Promise<SearchResult<T>[]> {
        await this.ensureInitialized()

        try {
            // Embed the query text
            const queryVector = await this.embed(query)

            // Search using the embedded vector
            return await this.search(queryVector, k, {
                nounTypes: options.nounTypes,
                includeVerbs: options.includeVerbs,
                searchMode: options.searchMode
            })
        } catch (error) {
            console.error('Failed to search with text query:', error)
            throw new Error(`Failed to search with text query: ${error}`)
        }
    }

    /**
     * Search a remote Brainy server for similar vectors
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    public async searchRemote(
        queryVectorOrData: Vector | any,
        k: number = 10,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            nounTypes?: string[] // Optional array of noun types to search within
            includeVerbs?: boolean // Whether to include associated GraphVerbs in the results
            storeResults?: boolean // Whether to store the results in the local database (default: true)
        } = {}
    ): Promise<SearchResult<T>[]> {
        await this.ensureInitialized()

        // Check if connected to a remote server
        if (!this.isConnectedToRemoteServer()) {
            throw new Error(
                'Not connected to a remote server. Call connectToRemoteServer() first.'
            )
        }

        try {
            // If input is a string, convert it to a query string for the server
            let query: string
            if (typeof queryVectorOrData === 'string') {
                query = queryVectorOrData
            } else {
                // For vectors, we need to embed them as a string query
                // This is a simplification - ideally we would send the vector directly
                query = 'vector-query' // Placeholder, would need a better approach for vector queries
            }

            if (!this.serverSearchConduit || !this.serverConnection) {
                throw new Error(
                    'Server search conduit or connection is not initialized'
                )
            }

            // Search the remote server
            const searchResult = await this.serverSearchConduit.searchServer(
                this.serverConnection.connectionId,
                query,
                k
            )

            if (!searchResult.success) {
                throw new Error(`Remote search failed: ${searchResult.error}`)
            }

            return searchResult.data as SearchResult<T>[]
        } catch (error) {
            console.error('Failed to search remote server:', error)
            throw new Error(`Failed to search remote server: ${error}`)
        }
    }

    /**
     * Search both local and remote Brainy instances, combining the results
     * @param queryVectorOrData Query vector or data to search for
     * @param k Number of results to return
     * @param options Additional options
     * @returns Array of search results
     */
    public async searchCombined(
        queryVectorOrData: Vector | any,
        k: number = 10,
        options: {
            forceEmbed?: boolean // Force using the embedding function even if input is a vector
            nounTypes?: string[] // Optional array of noun types to search within
            includeVerbs?: boolean // Whether to include associated GraphVerbs in the results
            localFirst?: boolean // Whether to search local first (default: true)
        } = {}
    ): Promise<SearchResult<T>[]> {
        await this.ensureInitialized()

        // Check if connected to a remote server
        if (!this.isConnectedToRemoteServer()) {
            // If not connected to a remote server, just search locally
            return this.searchLocal(queryVectorOrData, k, options)
        }

        try {
            // Default to searching local first
            const localFirst = options.localFirst !== false

            if (localFirst) {
                // Search local first
                const localResults = await this.searchLocal(
                    queryVectorOrData,
                    k,
                    options
                )

                // If we have enough local results, return them
                if (localResults.length >= k) {
                    return localResults
                }

                // Otherwise, search remote for additional results
                const remoteResults = await this.searchRemote(
                    queryVectorOrData,
                    k - localResults.length,
                    {...options, storeResults: true}
                )

                // Combine results, removing duplicates
                const combinedResults = [...localResults]
                const localIds = new Set(localResults.map((r) => r.id))

                for (const result of remoteResults) {
                    if (!localIds.has(result.id)) {
                        combinedResults.push(result)
                    }
                }

                return combinedResults
            } else {
                // Search remote first
                const remoteResults = await this.searchRemote(queryVectorOrData, k, {
                    ...options,
                    storeResults: true
                })

                // If we have enough remote results, return them
                if (remoteResults.length >= k) {
                    return remoteResults
                }

                // Otherwise, search local for additional results
                const localResults = await this.searchLocal(
                    queryVectorOrData,
                    k - remoteResults.length,
                    options
                )

                // Combine results, removing duplicates
                const combinedResults = [...remoteResults]
                const remoteIds = new Set(remoteResults.map((r) => r.id))

                for (const result of localResults) {
                    if (!remoteIds.has(result.id)) {
                        combinedResults.push(result)
                    }
                }

                return combinedResults
            }
        } catch (error) {
            console.error('Failed to perform combined search:', error)
            throw new Error(`Failed to perform combined search: ${error}`)
        }
    }

    /**
     * Check if the instance is connected to a remote server
     * @returns True if connected to a remote server, false otherwise
     */
    public isConnectedToRemoteServer(): boolean {
        return !!(this.serverSearchConduit && this.serverConnection)
    }

    /**
     * Disconnect from the remote server
     * @returns True if successfully disconnected, false if not connected
     */
    public async disconnectFromRemoteServer(): Promise<boolean> {
        if (!this.isConnectedToRemoteServer()) {
            return false
        }

        try {
            if (!this.serverSearchConduit || !this.serverConnection) {
                throw new Error(
                    'Server search conduit or connection is not initialized'
                )
            }

            // Close the WebSocket connection
            await this.serverSearchConduit.closeWebSocket(
                this.serverConnection.connectionId
            )

            // Clear the connection information
            this.serverSearchConduit = null
            this.serverConnection = null

            return true
        } catch (error) {
            console.error('Failed to disconnect from remote server:', error)
            throw new Error(`Failed to disconnect from remote server: ${error}`)
        }
    }

    /**
     * Ensure the database is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized) {
            return
        }

        if (this.isInitializing) {
            // If initialization is already in progress, wait for it to complete
            // by polling the isInitialized flag
            let attempts = 0
            const maxAttempts = 100 // Prevent infinite loop
            const delay = 50 // ms

            while (
                this.isInitializing &&
                !this.isInitialized &&
                attempts < maxAttempts
                ) {
                await new Promise((resolve) => setTimeout(resolve, delay))
                attempts++
            }

            if (!this.isInitialized) {
                // If still not initialized after waiting, try to initialize again
                await this.init()
            }
        } else {
            // Normal case - not initialized and not initializing
            await this.init()
        }
    }

    /**
     * Get information about the current storage usage and capacity
     * @returns Object containing the storage type, used space, quota, and additional details
     */
    public async status(): Promise<{
        type: string
        used: number
        quota: number | null
        details?: Record<string, any>
    }> {
        await this.ensureInitialized()

        if (!this.storage) {
            return {
                type: 'any',
                used: 0,
                quota: null,
                details: {error: 'Storage not initialized'}
            }
        }

        try {
            // Check if the storage adapter has a getStorageStatus method
            if (typeof this.storage.getStorageStatus !== 'function') {
                // If not, determine the storage type based on the constructor name
                const storageType = this.storage.constructor.name
                    .toLowerCase()
                    .replace('storage', '')
                return {
                    type: storageType || 'any',
                    used: 0,
                    quota: null,
                    details: {
                        error: 'Storage adapter does not implement getStorageStatus method',
                        storageAdapter: this.storage.constructor.name,
                        indexSize: this.size()
                    }
                }
            }

            // Get storage status from the storage adapter
            const storageStatus = await this.storage.getStorageStatus()

            // Add index information to the details
            let indexInfo: Record<string, any> = {
                indexSize: this.size()
            }

            // Add optimized index information if using optimized index
            if (this.useOptimizedIndex && this.index instanceof HNSWIndexOptimized) {
                const optimizedIndex = this.index as HNSWIndexOptimized
                indexInfo = {
                    ...indexInfo,
                    optimized: true,
                    memoryUsage: optimizedIndex.getMemoryUsage(),
                    productQuantization: optimizedIndex.getUseProductQuantization(),
                    diskBasedIndex: optimizedIndex.getUseDiskBasedIndex()
                }
            } else {
                indexInfo.optimized = false
            }

            // Ensure all required fields are present
            return {
                type: storageStatus.type || 'any',
                used: storageStatus.used || 0,
                quota: storageStatus.quota || null,
                details: {
                    ...(storageStatus.details || {}),
                    index: indexInfo
                }
            }
        } catch (error) {
            console.error('Failed to get storage status:', error)

            // Determine the storage type based on the constructor name
            const storageType = this.storage.constructor.name
                .toLowerCase()
                .replace('storage', '')

            return {
                type: storageType || 'any',
                used: 0,
                quota: null,
                details: {
                    error: String(error),
                    storageAdapter: this.storage.constructor.name,
                    indexSize: this.size()
                }
            }
        }
    }

    /**
     * Shut down the database and clean up resources
     * This should be called when the database is no longer needed
     */
    public async shutDown(): Promise<void> {
        try {
            // Disconnect from remote server if connected
            if (this.isConnectedToRemoteServer()) {
                await this.disconnectFromRemoteServer()
            }

            // Clean up worker pools to release resources
            cleanupWorkerPools()

            // Additional cleanup could be added here in the future

            this.isInitialized = false
        } catch (error) {
            console.error('Failed to shut down BrainyData:', error)
            throw new Error(`Failed to shut down BrainyData: ${error}`)
        }
    }

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
    public async backup(): Promise<{
        nouns: VectorDocument<T>[]
        verbs: GraphVerb[]
        nounTypes: string[]
        verbTypes: string[]
        version: string
        hnswIndex?: {
            entryPointId: string | null
            maxLevel: number
            dimension: number | null
            config: HNSWConfig
            connections: Record<string, Record<string, string[]>>
        }
    }> {
        await this.ensureInitialized()

        try {
            // Get all nouns
            const nouns = await this.getAllNouns()

            // Get all verbs
            const verbs = await this.getAllVerbs()

            // Get all noun types
            const nounTypes = Object.values(NounType)

            // Get all verb types
            const verbTypes = Object.values(VerbType)

            // Get HNSW index data
            const hnswIndexData = {
                entryPointId: this.index.getEntryPointId(),
                maxLevel: this.index.getMaxLevel(),
                dimension: this.index.getDimension(),
                config: this.index.getConfig(),
                connections: {} as Record<string, Record<string, string[]>>
            }

            // Convert Map<number, Set<string>> to a serializable format
            const indexNouns = this.index.getNouns()
            for (const [id, noun] of indexNouns.entries()) {
                hnswIndexData.connections[id] = {}
                for (const [level, connections] of noun.connections.entries()) {
                    hnswIndexData.connections[id][level] = Array.from(connections)
                }
            }

            // Return the data with version information
            return {
                nouns,
                verbs,
                nounTypes,
                verbTypes,
                hnswIndex: hnswIndexData,
                version: '1.0.0' // Version of the backup format
            }
        } catch (error) {
            console.error('Failed to backup data:', error)
            throw new Error(`Failed to backup data: ${error}`)
        }
    }

    /**
     * Import sparse data into the database
     * @param data The sparse data to import
     *             If vectors are not present for nouns, they will be created using the embedding function
     * @param options Import options
     * @returns Object containing counts of imported items
     */
    public async importSparseData(
        data: {
            nouns: VectorDocument<T>[]
            verbs: GraphVerb[]
            nounTypes?: string[]
            verbTypes?: string[]
            hnswIndex?: {
                entryPointId: string | null
                maxLevel: number
                dimension: number | null
                config: HNSWConfig
                connections: Record<string, Record<string, string[]>>
            }
            version: string
        },
        options: {
            clearExisting?: boolean
        } = {}
    ): Promise<{
        nounsRestored: number
        verbsRestored: number
    }> {
        return this.restore(data, options)
    }

    /**
     * Restore data into the database from a previously backed up format
     * @param data The data to restore, in the format returned by backup()
     *             This can include HNSW index data if it was included in the backup
     *             If vectors are not present for nouns, they will be created using the embedding function
     * @param options Restore options
     * @returns Object containing counts of restored items
     */
    public async restore(
        data: {
            nouns: VectorDocument<T>[]
            verbs: GraphVerb[]
            nounTypes?: string[]
            verbTypes?: string[]
            hnswIndex?: {
                entryPointId: string | null
                maxLevel: number
                dimension: number | null
                config: HNSWConfig
                connections: Record<string, Record<string, string[]>>
            }
            version: string
        },
        options: {
            clearExisting?: boolean
        } = {}
    ): Promise<{
        nounsRestored: number
        verbsRestored: number
    }> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        try {
            // Clear existing data if requested
            if (options.clearExisting) {
                await this.clear()
            }

            // Validate the data format
            if (!data || !data.nouns || !data.verbs || !data.version) {
                throw new Error('Invalid restore data format')
            }

            // Log additional data if present
            if (data.nounTypes) {
                console.log(`Found ${data.nounTypes.length} noun types in restore data`)
            }

            if (data.verbTypes) {
                console.log(`Found ${data.verbTypes.length} verb types in restore data`)
            }

            if (data.hnswIndex) {
                console.log('Found HNSW index data in backup')
            }

            // Restore nouns
            let nounsRestored = 0
            for (const noun of data.nouns) {
                try {
                    // Check if the noun has a vector
                    if (!noun.vector || noun.vector.length === 0) {
                        // If no vector, create one using the embedding function
                        if (
                            noun.metadata &&
                            typeof noun.metadata === 'object' &&
                            'text' in noun.metadata
                        ) {
                            // If the metadata has a text field, use it for embedding
                            noun.vector = await this.embeddingFunction(noun.metadata.text)
                        } else {
                            // Otherwise, use the entire metadata for embedding
                            noun.vector = await this.embeddingFunction(noun.metadata)
                        }
                    }

                    // Add the noun with its vector and metadata
                    await this.add(noun.vector, noun.metadata, {id: noun.id})
                    nounsRestored++
                } catch (error) {
                    console.error(`Failed to restore noun ${noun.id}:`, error)
                    // Continue with other nouns
                }
            }

            // Restore verbs
            let verbsRestored = 0
            for (const verb of data.verbs) {
                try {
                    // Check if the verb has a vector
                    if (!verb.vector || verb.vector.length === 0) {
                        // If no vector, create one using the embedding function
                        if (
                            verb.metadata &&
                            typeof verb.metadata === 'object' &&
                            'text' in verb.metadata
                        ) {
                            // If the metadata has a text field, use it for embedding
                            verb.vector = await this.embeddingFunction(verb.metadata.text)
                        } else {
                            // Otherwise, use the entire metadata for embedding
                            verb.vector = await this.embeddingFunction(verb.metadata)
                        }
                    }

                    // Add the verb
                    await this.addVerb(verb.sourceId, verb.targetId, verb.vector, {
                        id: verb.id,
                        type: verb.metadata?.verb || VerbType.RelatedTo,
                        metadata: verb.metadata
                    })
                    verbsRestored++
                } catch (error) {
                    console.error(`Failed to restore verb ${verb.id}:`, error)
                    // Continue with other verbs
                }
            }

            // If HNSW index data is provided and we've restored nouns, reconstruct the index
            if (data.hnswIndex && nounsRestored > 0) {
                try {
                    console.log('Reconstructing HNSW index from backup data...')

                    // Create a new index with the restored configuration
                    this.index = new HNSWIndex(
                        data.hnswIndex.config,
                        this.distanceFunction
                    )

                    // Re-add all nouns to the index
                    for (const noun of data.nouns) {
                        if (noun.vector && noun.vector.length > 0) {
                            await this.index.addItem({id: noun.id, vector: noun.vector})
                        }
                    }

                    console.log('HNSW index reconstruction complete')
                } catch (error) {
                    console.error('Failed to reconstruct HNSW index:', error)
                    console.log('Continuing with standard restore process...')
                }
            }

            return {
                nounsRestored,
                verbsRestored
            }
        } catch (error) {
            console.error('Failed to restore data:', error)
            throw new Error(`Failed to restore data: ${error}`)
        }
    }

    /**
     * Generate a random graph of data with typed nouns and verbs for testing and experimentation
     * @param options Configuration options for the random graph
     * @returns Object containing the IDs of the generated nouns and verbs
     */
    public async generateRandomGraph(
        options: {
            nounCount?: number // Number of nouns to generate (default: 10)
            verbCount?: number // Number of verbs to generate (default: 20)
            nounTypes?: NounType[] // Types of nouns to generate (default: all types)
            verbTypes?: VerbType[] // Types of verbs to generate (default: all types)
            clearExisting?: boolean // Whether to clear existing data before generating (default: false)
            seed?: string // Seed for random generation (default: random)
        } = {}
    ): Promise<{
        nounIds: string[]
        verbIds: string[]
    }> {
        await this.ensureInitialized()

        // Check if database is in read-only mode
        this.checkReadOnly()

        // Set default options
        const nounCount = options.nounCount || 10
        const verbCount = options.verbCount || 20
        const nounTypes = options.nounTypes || Object.values(NounType)
        const verbTypes = options.verbTypes || Object.values(VerbType)
        const clearExisting = options.clearExisting || false

        // Clear existing data if requested
        if (clearExisting) {
            await this.clear()
        }

        try {
            // Generate random nouns
            const nounIds: string[] = []
            const nounDescriptions: Record<string, string> = {
                [NounType.Person]: 'A person with unique characteristics',
                [NounType.Place]: 'A location with specific attributes',
                [NounType.Thing]: 'An object with distinct properties',
                [NounType.Event]: 'An occurrence with temporal aspects',
                [NounType.Concept]: 'An abstract idea or notion',
                [NounType.Content]: 'A piece of content or information',
                [NounType.Group]: 'A collection of related entities',
                [NounType.List]: 'An ordered sequence of items',
                [NounType.Category]: 'A classification or grouping'
            }

            for (let i = 0; i < nounCount; i++) {
                // Select a random noun type
                const nounType = nounTypes[Math.floor(Math.random() * nounTypes.length)]

                // Generate a random label
                const label = `Random ${nounType} ${i + 1}`

                // Create metadata
                const metadata = {
                    noun: nounType,
                    label,
                    description: nounDescriptions[nounType] || `A random ${nounType}`,
                    randomAttributes: {
                        value: Math.random() * 100,
                        priority: Math.floor(Math.random() * 5) + 1,
                        tags: [`tag-${i % 5}`, `category-${i % 3}`]
                    }
                }

                // Add the noun
                const id = await this.add(metadata.description, metadata as T)
                nounIds.push(id)
            }

            // Generate random verbs between nouns
            const verbIds: string[] = []
            const verbDescriptions: Record<string, string> = {
                [VerbType.AttributedTo]: 'Attribution relationship',
                [VerbType.Controls]: 'Control relationship',
                [VerbType.Created]: 'Creation relationship',
                [VerbType.Earned]: 'Achievement relationship',
                [VerbType.Owns]: 'Ownership relationship',
                [VerbType.MemberOf]: 'Membership relationship',
                [VerbType.RelatedTo]: 'General relationship',
                [VerbType.WorksWith]: 'Collaboration relationship',
                [VerbType.FriendOf]: 'Friendship relationship',
                [VerbType.ReportsTo]: 'Reporting relationship',
                [VerbType.Supervises]: 'Supervision relationship',
                [VerbType.Mentors]: 'Mentorship relationship'
            }

            for (let i = 0; i < verbCount; i++) {
                // Select random source and target nouns
                const sourceIndex = Math.floor(Math.random() * nounIds.length)
                let targetIndex = Math.floor(Math.random() * nounIds.length)

                // Ensure source and target are different
                while (targetIndex === sourceIndex && nounIds.length > 1) {
                    targetIndex = Math.floor(Math.random() * nounIds.length)
                }

                const sourceId = nounIds[sourceIndex]
                const targetId = nounIds[targetIndex]

                // Select a random verb type
                const verbType = verbTypes[Math.floor(Math.random() * verbTypes.length)]

                // Create metadata
                const metadata = {
                    verb: verbType,
                    description:
                        verbDescriptions[verbType] || `A random ${verbType} relationship`,
                    weight: Math.random(),
                    confidence: Math.random(),
                    randomAttributes: {
                        strength: Math.random() * 100,
                        duration: Math.floor(Math.random() * 365) + 1,
                        tags: [`relation-${i % 5}`, `strength-${i % 3}`]
                    }
                }

                // Add the verb
                const id = await this.addVerb(sourceId, targetId, undefined, {
                    type: verbType,
                    weight: metadata.weight,
                    metadata
                })

                verbIds.push(id)
            }

            return {
                nounIds,
                verbIds
            }
        } catch (error) {
            console.error('Failed to generate random graph:', error)
            throw new Error(`Failed to generate random graph: ${error}`)
        }
    }
}

// Export distance functions for convenience
export {
    euclideanDistance,
    cosineDistance,
    manhattanDistance,
    dotProductDistance
} from './utils/index.js'
