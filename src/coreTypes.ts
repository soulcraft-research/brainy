/**
 * Type definitions for the Soulcraft Brainy
 */

/**
 * Vector representation - an array of numbers
 */
export type Vector = number[];

/**
 * A document with a vector embedding and optional metadata
 */
export interface VectorDocument<T = any> {
  id: string;
  vector: Vector;
  metadata?: T;
}

/**
 * Search result with similarity score
 */
export interface SearchResult<T = any> {
  id: string;
  score: number;
  vector: Vector;
  metadata?: T;
}

/**
 * Distance function for comparing vectors
 */
export type DistanceFunction = (a: Vector, b: Vector) => number;

/**
 * Embedding function for converting data to vectors
 */
export type EmbeddingFunction = (data: any) => Promise<Vector>;

/**
 * Embedding model interface
 */
export interface EmbeddingModel {
  /**
   * Initialize the embedding model
   */
  init(): Promise<void>;

  /**
   * Embed data into a vector
   */
  embed(data: any): Promise<Vector>;

  /**
   * Dispose of the model resources
   */
  dispose(): Promise<void>;
}

/**
 * HNSW graph node
 */
export interface HNSWNode {
  id: string;
  vector: Vector;
  connections: Map<number, Set<string>>;  // level -> set of connected node ids
}

/**
 * Edge representing a relationship between nodes
 * Extends HNSWNode to allow edges to be first-class entities in the data model
 */
export interface Edge extends HNSWNode {
  sourceId: string;      // ID of the source node
  targetId: string;      // ID of the target node
  type?: string;         // Optional type of the relationship
  weight?: number;       // Optional weight of the relationship
  metadata?: any;        // Optional metadata for the edge
}

/**
 * HNSW index configuration
 */
export interface HNSWConfig {
  M: number;           // Maximum number of connections per node
  efConstruction: number;  // Size of the dynamic candidate list during construction
  efSearch: number;    // Size of the dynamic candidate list during search
  ml: number;          // Maximum level
}

/**
 * Storage interface for persistence
 */
export interface StorageAdapter {
  init(): Promise<void>;

  saveNode(node: HNSWNode): Promise<void>;

  getNode(id: string): Promise<HNSWNode | null>;

  getAllNodes(): Promise<HNSWNode[]>;

  /**
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  getNodesByNounType(nounType: string): Promise<HNSWNode[]>;

  deleteNode(id: string): Promise<void>;

  saveEdge(edge: Edge): Promise<void>;

  getEdge(id: string): Promise<Edge | null>;

  getAllEdges(): Promise<Edge[]>;

  getEdgesBySource(sourceId: string): Promise<Edge[]>;

  getEdgesByTarget(targetId: string): Promise<Edge[]>;

  getEdgesByType(type: string): Promise<Edge[]>;

  deleteEdge(id: string): Promise<void>;

  saveMetadata(id: string, metadata: any): Promise<void>;

  getMetadata(id: string): Promise<any | null>;

  clear(): Promise<void>;

  /**
   * Get information about storage usage and capacity
   * @returns Promise that resolves to an object containing storage status information
   */
  getStorageStatus(): Promise<{
    /**
     * The type of storage being used (e.g., 'filesystem', 'opfs', 'memory')
     */
    type: string;

    /**
     * The amount of storage being used in bytes
     */
    used: number;

    /**
     * The total amount of storage available in bytes, or null if unknown
     */
    quota: number | null;

    /**
     * Additional storage-specific information
     */
    details?: Record<string, any>;
  }>;
}
