/**
 * OPFS (Origin Private File System) Storage Adapter
 * Provides persistent storage for the vector database using the Origin Private File System API
 */

import {GraphVerb, HNSWNoun, StatisticsData} from '../../coreTypes.js'
import {BaseStorage, NOUNS_DIR, VERBS_DIR, METADATA_DIR, INDEX_DIR, STATISTICS_KEY} from '../baseStorage.js'
import '../../types/fileSystemTypes.js'

// Type alias for HNSWNode
type HNSWNode = HNSWNoun

/**
 * Type alias for GraphVerb to make the code more readable
 */
type Edge = GraphVerb

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
type HNSWNoun_internal = HNSWNoun
type Verb = GraphVerb

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
    private activeLocks: Set<string> = new Set()
    private lockPrefix = 'opfs-lock-'

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
     * Save a noun to storage
     */
    protected async saveNoun_internal(noun: HNSWNoun_internal): Promise<void> {
        await this.ensureInitialized()

        try {
            // Convert connections Map to a serializable format
            const serializableNoun = {
                ...noun,
                connections: this.mapToObject(noun.connections, (set) =>
                    Array.from(set as Set<string>)
                )
            }

            // Create or get the file for this noun
            const fileHandle = await this.nounsDir!.getFileHandle(noun.id, {
                create: true
            })

            // Write the noun data to the file
            const writable = await fileHandle.createWritable()
            await writable.write(JSON.stringify(serializableNoun))
            await writable.close()
        } catch (error) {
            console.error(`Failed to save noun ${noun.id}:`, error)
            throw new Error(`Failed to save noun ${noun.id}: ${error}`)
        }
    }

    /**
     * Get a noun from storage
     */
    protected async getNoun_internal(id: string): Promise<HNSWNoun_internal | null> {
        await this.ensureInitialized()

        try {
            // Get the file handle for this noun
            const fileHandle = await this.nounsDir!.getFileHandle(id)

            // Read the noun data from the file
            const file = await fileHandle.getFile()
            const text = await file.text()
            const data = JSON.parse(text)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nounIds] of Object.entries(data.connections)) {
                connections.set(Number(level), new Set(nounIds as string[]))
            }

            return {
                id: data.id,
                vector: data.vector,
                connections
            }
        } catch (error) {
            // Noun not found or other error
            return null
        }
    }

    /**
     * Get all nouns from storage
     */
    protected async getAllNouns_internal(): Promise<HNSWNoun_internal[]> {
        await this.ensureInitialized()

        const allNouns: HNSWNoun_internal[] = []
        try {
            // Iterate through all files in the nouns directory
            for await (const [name, handle] of this.nounsDir!.entries()) {
                if (handle.kind === 'file') {
                    try {
                        // Read the noun data from the file
                        const file = await safeGetFile(handle)
                        const text = await file.text()
                        const data = JSON.parse(text)

                        // Convert serialized connections back to Map<number, Set<string>>
                        const connections = new Map<number, Set<string>>()
                        for (const [level, nounIds] of Object.entries(data.connections)) {
                            connections.set(Number(level), new Set(nounIds as string[]))
                        }

                        allNouns.push({
                            id: data.id,
                            vector: data.vector,
                            connections
                        })
                    } catch (error) {
                        console.error(`Error reading noun file ${name}:`, error)
                    }
                }
            }
        } catch (error) {
            console.error('Error reading nouns directory:', error)
        }

        return allNouns
    }

    /**
     * Get nouns by noun type (internal implementation)
     * @param nounType The noun type to filter by
     * @returns Promise that resolves to an array of nouns of the specified noun type
     */
    protected async getNounsByNounType_internal(nounType: string): Promise<HNSWNoun[]> {
        return this.getNodesByNounType(nounType)
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
     * Delete a noun from storage (internal implementation)
     */
    protected async deleteNoun_internal(id: string): Promise<void> {
        return this.deleteNode(id)
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
     * Save a verb to storage (internal implementation)
     */
    protected async saveVerb_internal(verb: GraphVerb): Promise<void> {
        return this.saveEdge(verb)
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
     * Get a verb from storage (internal implementation)
     */
    protected async getVerb_internal(id: string): Promise<GraphVerb | null> {
        return this.getEdge(id)
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

            // Create default timestamp if not present
            const defaultTimestamp = {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: (Date.now() % 1000) * 1000000
            }

            // Create default createdBy if not present
            const defaultCreatedBy = {
                augmentation: 'unknown',
                version: '1.0'
            }

            return {
                id: data.id,
                vector: data.vector,
                connections,
                sourceId: data.sourceId || data.source,
                targetId: data.targetId || data.target,
                source: data.sourceId || data.source,
                target: data.targetId || data.target,
                verb: data.type || data.verb,
                weight: data.weight,
                metadata: data.metadata,
                createdAt: data.createdAt || defaultTimestamp,
                updatedAt: data.updatedAt || defaultTimestamp,
                createdBy: data.createdBy || defaultCreatedBy
            }
        } catch (error) {
            // Edge not found or other error
            return null
        }
    }

    /**
     * Get all verbs from storage (internal implementation)
     */
    protected async getAllVerbs_internal(): Promise<GraphVerb[]> {
        return this.getAllEdges()
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

                        // Create default timestamp if not present
                        const defaultTimestamp = {
                            seconds: Math.floor(Date.now() / 1000),
                            nanoseconds: (Date.now() % 1000) * 1000000
                        }

                        // Create default createdBy if not present
                        const defaultCreatedBy = {
                            augmentation: 'unknown',
                            version: '1.0'
                        }

                        allEdges.push({
                            id: data.id,
                            vector: data.vector,
                            connections,
                            sourceId: data.sourceId || data.source,
                            targetId: data.targetId || data.target,
                            source: data.sourceId || data.source,
                            target: data.targetId || data.target,
                            verb: data.type || data.verb,
                            weight: data.weight,
                            metadata: data.metadata,
                            createdAt: data.createdAt || defaultTimestamp,
                            updatedAt: data.updatedAt || defaultTimestamp,
                            createdBy: data.createdBy || defaultCreatedBy
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
     * Get verbs by source (internal implementation)
     */
    protected async getVerbsBySource_internal(sourceId: string): Promise<GraphVerb[]> {
        return this.getEdgesBySource(sourceId)
    }

    /**
     * Get edges by source
     */
    protected async getEdgesBySource(sourceId: string): Promise<Edge[]> {
        const edges = await this.getAllEdges()
        return edges.filter((edge) => (edge.sourceId || edge.source) === sourceId)
    }

    /**
     * Get verbs by target (internal implementation)
     */
    protected async getVerbsByTarget_internal(targetId: string): Promise<GraphVerb[]> {
        return this.getEdgesByTarget(targetId)
    }

    /**
     * Get edges by target
     */
    protected async getEdgesByTarget(targetId: string): Promise<Edge[]> {
        const edges = await this.getAllEdges()
        return edges.filter((edge) => (edge.targetId || edge.target) === targetId)
    }

    /**
     * Get verbs by type (internal implementation)
     */
    protected async getVerbsByType_internal(type: string): Promise<GraphVerb[]> {
        return this.getEdgesByType(type)
    }

    /**
     * Get edges by type
     */
    protected async getEdgesByType(type: string): Promise<Edge[]> {
        const edges = await this.getAllEdges()
        return edges.filter((edge) => (edge.type || edge.verb) === type)
    }

    /**
     * Delete a verb from storage (internal implementation)
     */
    protected async deleteVerb_internal(id: string): Promise<void> {
        return this.deleteEdge(id)
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
                    // Use recursive option to handle directories that may contain files
                    await dirHandle.removeEntry(name, { recursive: true })
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
     * Acquire a browser-based lock for coordinating operations across multiple tabs
     * @param lockKey The key to lock on
     * @param ttl Time to live for the lock in milliseconds (default: 30 seconds)
     * @returns Promise that resolves to true if lock was acquired, false otherwise
     */
    private async acquireLock(lockKey: string, ttl: number = 30000): Promise<boolean> {
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available, proceeding without lock')
            return false
        }
        
        const lockStorageKey = `${this.lockPrefix}${lockKey}`
        const lockValue = `${Date.now()}_${Math.random()}_${window.location.href}`
        const expiresAt = Date.now() + ttl
        
        try {
            // Check if lock already exists and is still valid
            const existingLock = localStorage.getItem(lockStorageKey)
            if (existingLock) {
                try {
                    const lockInfo = JSON.parse(existingLock)
                    if (lockInfo.expiresAt > Date.now()) {
                        // Lock exists and is still valid
                        return false
                    }
                } catch (error) {
                    // Invalid lock data, we can proceed to create a new lock
                    console.warn(`Invalid lock data for ${lockStorageKey}:`, error)
                }
            }
            
            // Try to create the lock
            const lockInfo = {
                lockValue,
                expiresAt,
                tabId: window.location.href,
                timestamp: Date.now()
            }
            
            localStorage.setItem(lockStorageKey, JSON.stringify(lockInfo))
            
            // Add to active locks for cleanup
            this.activeLocks.add(lockKey)
            
            // Schedule automatic cleanup when lock expires
            setTimeout(() => {
                this.releaseLock(lockKey, lockValue).catch(error => {
                    console.warn(`Failed to auto-release expired lock ${lockKey}:`, error)
                })
            }, ttl)
            
            return true
        } catch (error) {
            console.warn(`Failed to acquire lock ${lockKey}:`, error)
            return false
        }
    }

    /**
     * Release a browser-based lock
     * @param lockKey The key to unlock
     * @param lockValue The value used when acquiring the lock (for verification)
     * @returns Promise that resolves when lock is released
     */
    private async releaseLock(lockKey: string, lockValue?: string): Promise<void> {
        if (typeof localStorage === 'undefined') {
            return
        }
        
        const lockStorageKey = `${this.lockPrefix}${lockKey}`
        
        try {
            // If lockValue is provided, verify it matches before releasing
            if (lockValue) {
                const existingLock = localStorage.getItem(lockStorageKey)
                if (existingLock) {
                    try {
                        const lockInfo = JSON.parse(existingLock)
                        if (lockInfo.lockValue !== lockValue) {
                            // Lock was acquired by someone else, don't release it
                            return
                        }
                    } catch (error) {
                        // Invalid lock data, remove it
                        localStorage.removeItem(lockStorageKey)
                        this.activeLocks.delete(lockKey)
                        return
                    }
                }
            }
            
            // Remove the lock
            localStorage.removeItem(lockStorageKey)
            
            // Remove from active locks
            this.activeLocks.delete(lockKey)
        } catch (error) {
            console.warn(`Failed to release lock ${lockKey}:`, error)
        }
    }

    /**
     * Clean up expired locks from localStorage
     */
    private async cleanupExpiredLocks(): Promise<void> {
        if (typeof localStorage === 'undefined') {
            return
        }
        
        try {
            const now = Date.now()
            const keysToRemove: string[] = []
            
            // Iterate through localStorage to find expired locks
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith(this.lockPrefix)) {
                    try {
                        const lockData = localStorage.getItem(key)
                        if (lockData) {
                            const lockInfo = JSON.parse(lockData)
                            if (lockInfo.expiresAt <= now) {
                                keysToRemove.push(key)
                                const lockKey = key.replace(this.lockPrefix, '')
                                this.activeLocks.delete(lockKey)
                            }
                        }
                    } catch (error) {
                        // Invalid lock data, mark for removal
                        keysToRemove.push(key)
                    }
                }
            }
            
            // Remove expired locks
            keysToRemove.forEach(key => {
                localStorage.removeItem(key)
            })
            
            if (keysToRemove.length > 0) {
                console.log(`Cleaned up ${keysToRemove.length} expired locks`)
            }
        } catch (error) {
            console.warn('Failed to cleanup expired locks:', error)
        }
    }

    /**
     * Save statistics data to storage with browser-based locking
     * @param statistics The statistics data to save
     */
    protected async saveStatisticsData(statistics: StatisticsData): Promise<void> {
        const lockKey = 'statistics'
        const lockAcquired = await this.acquireLock(lockKey, 10000) // 10 second timeout
        
        if (!lockAcquired) {
            console.warn('Failed to acquire lock for statistics update, proceeding without lock')
        }
        
        try {
            // Get existing statistics to merge with new data
            const existingStats = await this.getStatisticsData()
            
            let mergedStats: StatisticsData
            if (existingStats) {
                // Merge statistics data
                mergedStats = {
                    nounCount: {
                        ...existingStats.nounCount,
                        ...statistics.nounCount
                    },
                    verbCount: {
                        ...existingStats.verbCount,
                        ...statistics.verbCount
                    },
                    metadataCount: {
                        ...existingStats.metadataCount,
                        ...statistics.metadataCount
                    },
                    hnswIndexSize: Math.max(statistics.hnswIndexSize || 0, existingStats.hnswIndexSize || 0),
                    lastUpdated: new Date().toISOString()
                }
            } else {
                // No existing statistics, use new ones
                mergedStats = {
                    ...statistics,
                    lastUpdated: new Date().toISOString()
                }
            }
            
            // Create a deep copy to avoid reference issues
            this.statistics = {
                nounCount: {...mergedStats.nounCount},
                verbCount: {...mergedStats.verbCount},
                metadataCount: {...mergedStats.metadataCount},
                hnswIndexSize: mergedStats.hnswIndexSize,
                lastUpdated: mergedStats.lastUpdated
            }

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
        } finally {
            if (lockAcquired) {
                await this.releaseLock(lockKey)
            }
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
