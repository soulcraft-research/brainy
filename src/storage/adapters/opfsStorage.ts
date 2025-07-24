/**
 * OPFS (Origin Private File System) Storage Adapter
 * Provides persistent storage for the vector database using the Origin Private File System API
 */

import {GraphVerb, HNSWNoun, StatisticsData} from '../../coreTypes.js'
import {BaseStorage, NOUNS_DIR, VERBS_DIR, METADATA_DIR, INDEX_DIR, STATISTICS_KEY} from '../baseStorage.js'
import '../../types/fileSystemTypes.js'

/**
 * Helper function to safely get a file from a FileSystemHandle
 * This is needed because TypeScript doesn't recognize that a FileSystemHandle
 * can be a FileSystemFileHandle which has the getFile method
 */
async function safeGetFile(handle: FileSystemHandle): Promise<File> {
    // Type cast to any to avoid TypeScript error
    return (handle as any).getFile()
}

// Type aliases for better readability
type HNSWNode = HNSWNoun
type Edge = GraphVerb

// Root directory name for OPFS storage
const ROOT_DIR = 'opfs-vector-db'

/**
 * OPFS storage adapter for browser environments
 * Uses the Origin Private File System API to store data persistently
 */
export class OPFSStorage extends BaseStorage {
    private rootDir: FileSystemDirectoryHandle | null = null
    private nounsDir: FileSystemDirectoryHandle | null = null
    private verbsDir: FileSystemDirectoryHandle | null = null
    private metadataDir: FileSystemDirectoryHandle | null = null
    private indexDir: FileSystemDirectoryHandle | null = null
    private isAvailable = false
    private isPersistentRequested = false
    private isPersistentGranted = false
    private statistics: StatisticsData | null = null

    constructor() {
        super()
        // Check if OPFS is available
        this.isAvailable =
            typeof navigator !== 'undefined' &&
            'storage' in navigator &&
            'getDirectory' in navigator.storage
    }

    /**
     * Initialize the storage adapter
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            return
        }

        if (!this.isAvailable) {
            throw new Error(
                'Origin Private File System is not available in this environment'
            )
        }

        try {
            // Get the root directory
            const root = await navigator.storage.getDirectory()

            // Create or get our app's root directory
            this.rootDir = await root.getDirectoryHandle(ROOT_DIR, {create: true})

            // Create or get nouns directory
            this.nounsDir = await this.rootDir.getDirectoryHandle(NOUNS_DIR, {
                create: true
            })

            // Create or get verbs directory
            this.verbsDir = await this.rootDir.getDirectoryHandle(VERBS_DIR, {
                create: true
            })

            // Create or get metadata directory
            this.metadataDir = await this.rootDir.getDirectoryHandle(METADATA_DIR, {
                create: true
            })

            // Create or get index directory
            this.indexDir = await this.rootDir.getDirectoryHandle(INDEX_DIR, {
                create: true
            })

            this.isInitialized = true
        } catch (error) {
            console.error('Failed to initialize OPFS storage:', error)
            throw new Error(`Failed to initialize OPFS storage: ${error}`)
        }
    }

    /**
     * Check if OPFS is available in the current environment
     */
    public isOPFSAvailable(): boolean {
        return this.isAvailable
    }

    /**
     * Request persistent storage permission from the user
     * @returns Promise that resolves to true if permission was granted, false otherwise
     */
    public async requestPersistentStorage(): Promise<boolean> {
        if (!this.isAvailable) {
            console.warn('Cannot request persistent storage: OPFS is not available')
            return false
        }

        try {
            // Check if persistence is already granted
            this.isPersistentGranted = await navigator.storage.persisted()

            if (!this.isPersistentGranted) {
                // Request permission for persistent storage
                this.isPersistentGranted = await navigator.storage.persist()
            }

            this.isPersistentRequested = true
            return this.isPersistentGranted
        } catch (error) {
            console.warn('Failed to request persistent storage:', error)
            return false
        }
    }

    /**
     * Check if persistent storage is granted
     * @returns Promise that resolves to true if persistent storage is granted, false otherwise
     */
    public async isPersistent(): Promise<boolean> {
        if (!this.isAvailable) {
            return false
        }

        try {
            this.isPersistentGranted = await navigator.storage.persisted()
            return this.isPersistentGranted
        } catch (error) {
            console.warn('Failed to check persistent storage status:', error)
            return false
        }
    }

    /**
     * Save a node to storage
     */
    protected async saveNode(node: HNSWNode): Promise<void> {
        await this.ensureInitialized()

        try {
            // Convert connections Map to a serializable format
            const serializableNode = {
                ...node,
                connections: this.mapToObject(node.connections, (set) =>
                    Array.from(set as Set<string>)
                )
            }

            // Create or get the file for this noun
            const fileHandle = await this.nounsDir!.getFileHandle(node.id, {
                create: true
            })

            // Write the noun data to the file
            const writable = await fileHandle.createWritable()
            await writable.write(JSON.stringify(serializableNode))
            await writable.close()
        } catch (error) {
            console.error(`Failed to save node ${node.id}:`, error)
            throw new Error(`Failed to save node ${node.id}: ${error}`)
        }
    }

    /**
     * Get a node from storage
     */
    protected async getNode(id: string): Promise<HNSWNode | null> {
        await this.ensureInitialized()

        try {
            // Get the file handle for this node
            const fileHandle = await this.nounsDir!.getFileHandle(id)

            // Read the node data from the file
            const file = await fileHandle.getFile()
            const text = await file.text()
            const data = JSON.parse(text)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(data.connections)) {
                connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
                id: data.id,
                vector: data.vector,
                connections
            }
        } catch (error) {
            // Node not found or other error
            return null
        }
    }

    /**
     * Get all nodes from storage
     */
    protected async getAllNodes(): Promise<HNSWNode[]> {
        await this.ensureInitialized()

        const allNodes: HNSWNode[] = []
        try {
            // Iterate through all files in the nouns directory
            for await (const [name, handle] of this.nounsDir!.entries()) {
                if (handle.kind === 'file') {
                    try {
                        // Read the node data from the file
                        const file = await safeGetFile(handle)
                        const text = await file.text()
                        const data = JSON.parse(text)

                        // Convert serialized connections back to Map<number, Set<string>>
                        const connections = new Map<number, Set<string>>()
                        for (const [level, nodeIds] of Object.entries(data.connections)) {
                            connections.set(Number(level), new Set(nodeIds as string[]))
                        }

                        allNodes.push({
                            id: data.id,
                            vector: data.vector,
                            connections
                        })
                    } catch (error) {
                        console.error(`Error reading node file ${name}:`, error)
                    }
                }
            }
        } catch (error) {
            console.error('Error reading nouns directory:', error)
        }

        return allNodes
    }

    /**
     * Get nodes by noun type
     * @param nounType The noun type to filter by
     * @returns Promise that resolves to an array of nodes of the specified noun type
     */
    protected async getNodesByNounType(nounType: string): Promise<HNSWNode[]> {
        await this.ensureInitialized()

        const nodes: HNSWNode[] = []

        try {
            // Iterate through all files in the nouns directory
            for await (const [name, handle] of this.nounsDir!.entries()) {
                if (handle.kind === 'file') {
                    try {
                        // Read the node data from the file
                        const file = await safeGetFile(handle)
                        const text = await file.text()
                        const data = JSON.parse(text)

                        // Get the metadata to check the noun type
                        const metadata = await this.getMetadata(data.id)

                        // Include the node if its noun type matches the requested type
                        if (metadata && metadata.noun === nounType) {
                            // Convert serialized connections back to Map<number, Set<string>>
                            const connections = new Map<number, Set<string>>()
                            for (const [level, nodeIds] of Object.entries(data.connections)) {
                                connections.set(Number(level), new Set(nodeIds as string[]))
                            }

                            nodes.push({
                                id: data.id,
                                vector: data.vector,
                                connections
                            })
                        }
                    } catch (error) {
                        console.error(`Error reading node file ${name}:`, error)
                    }
                }
            }
        } catch (error) {
            console.error('Error reading nouns directory:', error)
        }

        return nodes
    }

    /**
     * Delete a node from storage
     */
    protected async deleteNode(id: string): Promise<void> {
        await this.ensureInitialized()

        try {
            await this.nounsDir!.removeEntry(id)
        } catch (error: any) {
            // Ignore NotFoundError, which means the file doesn't exist
            if (error.name !== 'NotFoundError') {
                console.error(`Error deleting node ${id}:`, error)
                throw error
            }
        }
    }

    /**
     * Save an edge to storage
     */
    protected async saveEdge(edge: Edge): Promise<void> {
        await this.ensureInitialized()

        try {
            // Convert connections Map to a serializable format
            const serializableEdge = {
                ...edge,
                connections: this.mapToObject(edge.connections, (set) =>
                    Array.from(set as Set<string>)
                )
            }

            // Create or get the file for this verb
            const fileHandle = await this.verbsDir!.getFileHandle(edge.id, {
                create: true
            })

            // Write the verb data to the file
            const writable = await fileHandle.createWritable()
            await writable.write(JSON.stringify(serializableEdge))
            await writable.close()
        } catch (error) {
            console.error(`Failed to save edge ${edge.id}:`, error)
            throw new Error(`Failed to save edge ${edge.id}: ${error}`)
        }
    }

    /**
     * Get an edge from storage
     */
    protected async getEdge(id: string): Promise<Edge | null> {
        await this.ensureInitialized()

        try {
            // Get the file handle for this edge
            const fileHandle = await this.verbsDir!.getFileHandle(id)

            // Read the edge data from the file
            const file = await fileHandle.getFile()
            const text = await file.text()
            const data = JSON.parse(text)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(data.connections)) {
                connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
                id: data.id,
                vector: data.vector,
                connections,
                sourceId: data.sourceId,
                targetId: data.targetId,
                type: data.type,
                weight: data.weight,
                metadata: data.metadata
            }
        } catch (error) {
            // Edge not found or other error
            return null
        }
    }

    /**
     * Get all edges from storage
     */
    protected async getAllEdges(): Promise<Edge[]> {
        await this.ensureInitialized()

        const allEdges: Edge[] = []
        try {
            // Iterate through all files in the verbs directory
            for await (const [name, handle] of this.verbsDir!.entries()) {
                if (handle.kind === 'file') {
                    try {
                        // Read the edge data from the file
                        const file = await safeGetFile(handle)
                        const text = await file.text()
                        const data = JSON.parse(text)

                        // Convert serialized connections back to Map<number, Set<string>>
                        const connections = new Map<number, Set<string>>()
                        for (const [level, nodeIds] of Object.entries(data.connections)) {
                            connections.set(Number(level), new Set(nodeIds as string[]))
                        }

                        allEdges.push({
                            id: data.id,
                            vector: data.vector,
                            connections,
                            sourceId: data.sourceId,
                            targetId: data.targetId,
                            type: data.type,
                            weight: data.weight,
                            metadata: data.metadata
                        })
                    } catch (error) {
                        console.error(`Error reading edge file ${name}:`, error)
                    }
                }
            }
        } catch (error) {
            console.error('Error reading verbs directory:', error)
        }

        return allEdges
    }

    /**
     * Get edges by source
     */
    protected async getEdgesBySource(sourceId: string): Promise<Edge[]> {
        const edges = await this.getAllEdges()
        return edges.filter((edge) => edge.sourceId === sourceId)
    }

    /**
     * Get edges by target
     */
    protected async getEdgesByTarget(targetId: string): Promise<Edge[]> {
        const edges = await this.getAllEdges()
        return edges.filter((edge) => edge.targetId === targetId)
    }

    /**
     * Get edges by type
     */
    protected async getEdgesByType(type: string): Promise<Edge[]> {
        const edges = await this.getAllEdges()
        return edges.filter((edge) => edge.type === type)
    }

    /**
     * Delete an edge from storage
     */
    protected async deleteEdge(id: string): Promise<void> {
        await this.ensureInitialized()

        try {
            await this.verbsDir!.removeEntry(id)
        } catch (error: any) {
            // Ignore NotFoundError, which means the file doesn't exist
            if (error.name !== 'NotFoundError') {
                console.error(`Error deleting edge ${id}:`, error)
                throw error
            }
        }
    }

    /**
     * Save metadata to storage
     */
    public async saveMetadata(id: string, metadata: any): Promise<void> {
        await this.ensureInitialized()

        try {
            // Create or get the file for this metadata
            const fileHandle = await this.metadataDir!.getFileHandle(id, {
                create: true
            })

            // Write the metadata to the file
            const writable = await fileHandle.createWritable()
            await writable.write(JSON.stringify(metadata))
            await writable.close()
        } catch (error) {
            console.error(`Failed to save metadata ${id}:`, error)
            throw new Error(`Failed to save metadata ${id}: ${error}`)
        }
    }

    /**
     * Get metadata from storage
     */
    public async getMetadata(id: string): Promise<any | null> {
        await this.ensureInitialized()

        try {
            // Get the file handle for this metadata
            const fileHandle = await this.metadataDir!.getFileHandle(id)

            // Read the metadata from the file
            const file = await fileHandle.getFile()
            const text = await file.text()
            return JSON.parse(text)
        } catch (error) {
            // Metadata not found or other error
            return null
        }
    }

    /**
     * Clear all data from storage
     */
    public async clear(): Promise<void> {
        await this.ensureInitialized()

        // Helper function to remove all files in a directory
        const removeDirectoryContents = async (
            dirHandle: FileSystemDirectoryHandle
        ): Promise<void> => {
            try {
                for await (const [name, handle] of dirHandle.entries()) {
                    await dirHandle.removeEntry(name)
                }
            } catch (error) {
                console.error(`Error removing directory contents:`, error)
                throw error
            }
        }

        try {
            // Remove all files in the nouns directory
            await removeDirectoryContents(this.nounsDir!)

            // Remove all files in the verbs directory
            await removeDirectoryContents(this.verbsDir!)

            // Remove all files in the metadata directory
            await removeDirectoryContents(this.metadataDir!)

            // Remove all files in the index directory
            await removeDirectoryContents(this.indexDir!)
        } catch (error) {
            console.error('Error clearing storage:', error)
            throw error
        }
    }

    /**
     * Get information about storage usage and capacity
     */
    public async getStorageStatus(): Promise<{
        type: string
        used: number
        quota: number | null
        details?: Record<string, any>
    }> {
        await this.ensureInitialized()

        try {
            // Calculate the total size of all files in the storage directories
            let totalSize = 0

            // Helper function to calculate directory size
            const calculateDirSize = async (
                dirHandle: FileSystemDirectoryHandle
            ): Promise<number> => {
                let size = 0
                try {
                    for await (const [name, handle] of dirHandle.entries()) {
                        if (handle.kind === 'file') {
                            const file = await (handle as FileSystemFileHandle).getFile()
                            size += file.size
                        } else if (handle.kind === 'directory') {
                            size += await calculateDirSize(
                                handle as FileSystemDirectoryHandle
                            )
                        }
                    }
                } catch (error) {
                    console.warn(`Error calculating size for directory:`, error)
                }
                return size
            }

            // Helper function to count files in a directory
            const countFilesInDirectory = async (
                dirHandle: FileSystemDirectoryHandle
            ): Promise<number> => {
                let count = 0
                try {
                    for await (const [name, handle] of dirHandle.entries()) {
                        if (handle.kind === 'file') {
                            count++
                        }
                    }
                } catch (error) {
                    console.warn(`Error counting files in directory:`, error)
                }
                return count
            }

            // Calculate size for each directory
            if (this.nounsDir) {
                totalSize += await calculateDirSize(this.nounsDir)
            }
            if (this.verbsDir) {
                totalSize += await calculateDirSize(this.verbsDir)
            }
            if (this.metadataDir) {
                totalSize += await calculateDirSize(this.metadataDir)
            }
            if (this.indexDir) {
                totalSize += await calculateDirSize(this.indexDir)
            }

            // Get storage quota information using the Storage API
            let quota = null
            let details: Record<string, any> = {
                isPersistent: await this.isPersistent(),
                nounTypes: {}
            }

            try {
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate()
                    quota = estimate.quota || null
                    details = {
                        ...details,
                        usage: estimate.usage,
                        quota: estimate.quota,
                        freePercentage: estimate.quota
                            ? ((estimate.quota - (estimate.usage || 0)) / estimate.quota) *
                            100
                            : null
                    }
                }
            } catch (error) {
                console.warn('Unable to get storage estimate:', error)
            }

            // Count files in each directory
            if (this.nounsDir) {
                details.nounsCount = await countFilesInDirectory(this.nounsDir)
            }
            if (this.verbsDir) {
                details.verbsCount = await countFilesInDirectory(this.verbsDir)
            }
            if (this.metadataDir) {
                details.metadataCount = await countFilesInDirectory(this.metadataDir)
            }

            // Count nouns by type using metadata
            const nounTypeCounts: Record<string, number> = {}
            if (this.metadataDir) {
                for await (const [name, handle] of this.metadataDir.entries()) {
                    if (handle.kind === 'file') {
                        try {
                            const file = await safeGetFile(handle)
                            const text = await file.text()
                            const metadata = JSON.parse(text)
                            if (metadata.noun) {
                                nounTypeCounts[metadata.noun] = (nounTypeCounts[metadata.noun] || 0) + 1
                            }
                        } catch (error) {
                            console.error(`Error reading metadata file ${name}:`, error)
                        }
                    }
                }
            }
            details.nounTypes = nounTypeCounts

            return {
                type: 'opfs',
                used: totalSize,
                quota,
                details
            }
        } catch (error) {
            console.error('Failed to get storage status:', error)
            return {
                type: 'opfs',
                used: 0,
                quota: null,
                details: {error: String(error)}
            }
        }
    }

    /**
     * Get the statistics key for a specific date
     * @param date The date to get the key for
     * @returns The statistics key for the specified date
     */
    private getStatisticsKeyForDate(date: Date): string {
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        return `statistics_${year}${month}${day}.json`
    }

    /**
     * Get the current statistics key
     * @returns The current statistics key
     */
    private getCurrentStatisticsKey(): string {
        return this.getStatisticsKeyForDate(new Date())
    }

    /**
     * Get the legacy statistics key (for backward compatibility)
     * @returns The legacy statistics key
     */
    private getLegacyStatisticsKey(): string {
        return 'statistics.json'
    }

    /**
     * Save statistics data to storage
     * @param statistics The statistics data to save
     */
    protected async saveStatisticsData(statistics: StatisticsData): Promise<void> {
        // Create a deep copy to avoid reference issues
        this.statistics = {
            nounCount: {...statistics.nounCount},
            verbCount: {...statistics.verbCount},
            metadataCount: {...statistics.metadataCount},
            hnswIndexSize: statistics.hnswIndexSize,
            lastUpdated: statistics.lastUpdated
        }

        try {
            // Ensure the root directory is initialized
            await this.ensureInitialized()

            // Get or create the index directory
            if (!this.indexDir) {
                throw new Error('Index directory not initialized')
            }

            // Get the current statistics key
            const currentKey = this.getCurrentStatisticsKey()

            // Create a file for the statistics data
            const fileHandle = await this.indexDir.getFileHandle(currentKey, {
                create: true
            })

            // Create a writable stream
            const writable = await fileHandle.createWritable()

            // Write the statistics data to the file
            await writable.write(JSON.stringify(this.statistics, null, 2))

            // Close the stream
            await writable.close()

            // Also update the legacy key for backward compatibility, but less frequently
            if (Math.random() < 0.1) {
                const legacyKey = this.getLegacyStatisticsKey()
                const legacyFileHandle = await this.indexDir.getFileHandle(legacyKey, {
                    create: true
                })
                const legacyWritable = await legacyFileHandle.createWritable()
                await legacyWritable.write(JSON.stringify(this.statistics, null, 2))
                await legacyWritable.close()
            }
        } catch (error) {
            console.error('Failed to save statistics data:', error)
            throw new Error(`Failed to save statistics data: ${error}`)
        }
    }

    /**
     * Get statistics data from storage
     * @returns Promise that resolves to the statistics data or null if not found
     */
    protected async getStatisticsData(): Promise<StatisticsData | null> {
        // If we have cached statistics, return a deep copy
        if (this.statistics) {
            return {
                nounCount: {...this.statistics.nounCount},
                verbCount: {...this.statistics.verbCount},
                metadataCount: {...this.statistics.metadataCount},
                hnswIndexSize: this.statistics.hnswIndexSize,
                lastUpdated: this.statistics.lastUpdated
            }
        }

        try {
            // Ensure the root directory is initialized
            await this.ensureInitialized()

            if (!this.indexDir) {
                throw new Error('Index directory not initialized')
            }

            // First try to get statistics from today's file
            const currentKey = this.getCurrentStatisticsKey()
            try {
                const fileHandle = await this.indexDir.getFileHandle(currentKey, {
                    create: false
                })
                const file = await fileHandle.getFile()
                const text = await file.text()
                this.statistics = JSON.parse(text)
                
                if (this.statistics) {
                    return {
                        nounCount: {...this.statistics.nounCount},
                        verbCount: {...this.statistics.verbCount},
                        metadataCount: {...this.statistics.metadataCount},
                        hnswIndexSize: this.statistics.hnswIndexSize,
                        lastUpdated: this.statistics.lastUpdated
                    }
                }
            } catch (error) {
                // If today's file doesn't exist, try yesterday's file
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                const yesterdayKey = this.getStatisticsKeyForDate(yesterday)
                
                try {
                    const fileHandle = await this.indexDir.getFileHandle(yesterdayKey, {
                        create: false
                    })
                    const file = await fileHandle.getFile()
                    const text = await file.text()
                    this.statistics = JSON.parse(text)
                    
                    if (this.statistics) {
                        return {
                            nounCount: {...this.statistics.nounCount},
                            verbCount: {...this.statistics.verbCount},
                            metadataCount: {...this.statistics.metadataCount},
                            hnswIndexSize: this.statistics.hnswIndexSize,
                            lastUpdated: this.statistics.lastUpdated
                        }
                    }
                } catch (error) {
                    // If yesterday's file doesn't exist, try the legacy file
                    const legacyKey = this.getLegacyStatisticsKey()
                    
                    try {
                        const fileHandle = await this.indexDir.getFileHandle(legacyKey, {
                            create: false
                        })
                        const file = await fileHandle.getFile()
                        const text = await file.text()
                        this.statistics = JSON.parse(text)
                        
                        if (this.statistics) {
                            return {
                                nounCount: {...this.statistics.nounCount},
                                verbCount: {...this.statistics.verbCount},
                                metadataCount: {...this.statistics.metadataCount},
                                hnswIndexSize: this.statistics.hnswIndexSize,
                                lastUpdated: this.statistics.lastUpdated
                            }
                        }
                    } catch (error) {
                        // If the legacy file doesn't exist either, return null
                        return null
                    }
                }
            }
            
            // If we get here and statistics is null, return default statistics
            return this.statistics ? this.statistics : null
        } catch (error) {
            console.error('Failed to get statistics data:', error)
            throw new Error(`Failed to get statistics data: ${error}`)
        }
    }
}