import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js';
type HNSWNode = HNSWNoun;
type Edge = GraphVerb;
export { S3CompatibleStorage as R2Storage };
/**
 * S3-compatible storage adapter for server environments
 * Uses the AWS S3 client to interact with S3-compatible storage services
 * including Amazon S3, Cloudflare R2, and Google Cloud Storage
 *
 * To use this adapter with Cloudflare R2, you need to provide:
 * - bucketName: Your bucket name
 * - accountId: Your Cloudflare account ID
 * - accessKeyId: R2 access key ID
 * - secretAccessKey: R2 secret access key
 * - serviceType: 'r2'
 *
 * To use this adapter with Amazon S3, you need to provide:
 * - bucketName: Your S3 bucket name
 * - accessKeyId: AWS access key ID
 * - secretAccessKey: AWS secret access key
 * - region: AWS region (e.g., 'us-east-1')
 * - serviceType: 's3'
 *
 * To use this adapter with Google Cloud Storage, you need to provide:
 * - bucketName: Your GCS bucket name
 * - accessKeyId: HMAC access key
 * - secretAccessKey: HMAC secret
 * - endpoint: GCS endpoint (e.g., 'https://storage.googleapis.com')
 * - serviceType: 'gcs'
 *
 * For other S3-compatible services, provide:
 * - bucketName: Your bucket name
 * - accessKeyId: Access key ID
 * - secretAccessKey: Secret access key
 * - endpoint: Service endpoint URL
 * - region: Region (if required)
 * - serviceType: 'custom'
 */
export declare class S3CompatibleStorage implements StorageAdapter {
    private bucketName;
    private accessKeyId;
    private secretAccessKey;
    private endpoint?;
    private region?;
    private accountId?;
    private serviceType;
    private s3Client;
    private isInitialized;
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
    constructor(options: {
        bucketName: string;
        accessKeyId: string;
        secretAccessKey: string;
        serviceType: 'r2' | 's3' | 'gcs' | 'custom';
        accountId?: string;
        region?: string;
        endpoint?: string;
    });
    /**
     * Initialize the storage adapter
     */
    init(): Promise<void>;
    /**
     * Save a node to storage
     */
    saveNode(node: HNSWNode): Promise<void>;
    /**
     * Get a node from storage
     */
    getNode(id: string): Promise<HNSWNode | null>;
    /**
     * Get nodes by noun type
     * @param nounType The noun type to filter by
     * @returns Promise that resolves to an array of nodes of the specified noun type
     */
    getNodesByNounType(nounType: string): Promise<HNSWNode[]>;
    /**
     * Get all nodes from storage
     */
    getAllNodes(): Promise<HNSWNode[]>;
    /**
     * Delete a node from storage
     */
    deleteNode(id: string): Promise<void>;
    /**
     * Save an edge to storage
     */
    saveEdge(edge: Edge): Promise<void>;
    /**
     * Get an edge from storage
     */
    getEdge(id: string): Promise<Edge | null>;
    /**
     * Get all edges from storage
     */
    getAllEdges(): Promise<Edge[]>;
    /**
     * Get edges by source node ID
     */
    getEdgesBySource(sourceId: string): Promise<Edge[]>;
    /**
     * Get edges by target node ID
     */
    getEdgesByTarget(targetId: string): Promise<Edge[]>;
    /**
     * Get edges by type
     */
    getEdgesByType(type: string): Promise<Edge[]>;
    /**
     * Delete an edge from storage
     */
    deleteEdge(id: string): Promise<void>;
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
     * Get information about storage usage and capacity
     */
    getStorageStatus(): Promise<{
        type: string;
        used: number;
        quota: number | null;
        details?: Record<string, any>;
    }>;
    /**
     * Ensure the storage adapter is initialized
     */
    private ensureInitialized;
    /**
     * Get the appropriate prefix for a node based on its metadata
     */
    private getNodePrefix;
    /**
     * Convert a Map to a plain object for serialization
     */
    private mapToObject;
}
//# sourceMappingURL=s3CompatibleStorage.d.ts.map