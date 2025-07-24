/**
 * Memory Storage Adapter
 * In-memory storage adapter for environments where persistent storage is not available or needed
 */

import { GraphVerb, HNSWNoun, StatisticsData } from '../../coreTypes.js'
import { BaseStorage, STATISTICS_KEY } from '../baseStorage.js'

/**
 * Type alias for HNSWNoun to make the code more readable
 */
type HNSWNode = HNSWNoun

/**
 * Type alias for GraphVerb to make the code more readable
 */
type Edge = GraphVerb

/**
 * In-memory storage adapter
 * Uses Maps to store data in memory
 */
export class MemoryStorage extends BaseStorage {
  // Single map of noun ID to noun
  private nouns: Map<string, HNSWNode> = new Map()
  private verbs: Map<string, Edge> = new Map()
  private metadata: Map<string, any> = new Map()
  private statistics: StatisticsData | null = null

  constructor() {
    super()
  }

  /**
   * Initialize the storage adapter
   * Nothing to initialize for in-memory storage
   */
  public async init(): Promise<void> {
    this.isInitialized = true
  }

  /**
   * Save a node to storage
   */
  protected async saveNode(node: HNSWNode): Promise<void> {
    // Create a deep copy to avoid reference issues
    const nodeCopy: HNSWNode = {
      id: node.id,
      vector: [...node.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of node.connections.entries()) {
      nodeCopy.connections.set(level, new Set(connections))
    }

    // Save the node directly in the nouns map
    this.nouns.set(node.id, nodeCopy)
  }

  /**
   * Get a node from storage
   */
  protected async getNode(id: string): Promise<HNSWNode | null> {
    // Get the node directly from the nouns map
    const node = this.nouns.get(id)

    // If not found, return null
    if (!node) {
      return null
    }

    // Return a deep copy to avoid reference issues
    const nodeCopy: HNSWNode = {
      id: node.id,
      vector: [...node.vector],
      connections: new Map()
    }

    // Copy connections
    for (const [level, connections] of node.connections.entries()) {
      nodeCopy.connections.set(level, new Set(connections))
    }

    return nodeCopy
  }

  /**
   * Get all nodes from storage
   */
  protected async getAllNodes(): Promise<HNSWNode[]> {
    const allNodes: HNSWNode[] = []

    // Iterate through all nodes in the nouns map
    for (const [nodeId, node] of this.nouns.entries()) {
      // Return a deep copy to avoid reference issues
      const nodeCopy: HNSWNode = {
        id: node.id,
        vector: [...node.vector],
        connections: new Map()
      }

      // Copy connections
      for (const [level, connections] of node.connections.entries()) {
        nodeCopy.connections.set(level, new Set(connections))
      }

      allNodes.push(nodeCopy)
    }

    return allNodes
  }

  /**
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  protected async getNodesByNounType(nounType: string): Promise<HNSWNode[]> {
    const nodes: HNSWNode[] = []

    // Iterate through all nodes and filter by noun type using metadata
    for (const [nodeId, node] of this.nouns.entries()) {
      // Get the metadata to check the noun type
      const metadata = await this.getMetadata(nodeId)

      // Include the node if its noun type matches the requested type
      if (metadata && metadata.noun === nounType) {
        // Return a deep copy to avoid reference issues
        const nodeCopy: HNSWNode = {
          id: node.id,
          vector: [...node.vector],
          connections: new Map()
        }

        // Copy connections
        for (const [level, connections] of node.connections.entries()) {
          nodeCopy.connections.set(level, new Set(connections))
        }

        nodes.push(nodeCopy)
      }
    }

    return nodes
  }

  /**
   * Delete a node from storage
   */
  protected async deleteNode(id: string): Promise<void> {
    // Delete the node directly from the nouns map
    this.nouns.delete(id)
  }

  /**
   * Save an edge to storage
   */
  protected async saveEdge(edge: Edge): Promise<void> {
    // Create a deep copy to avoid reference issues
    const edgeCopy: Edge = {
      id: edge.id,
      vector: [...edge.vector],
      connections: new Map(),
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
      weight: edge.weight,
      metadata: edge.metadata
    }

    // Copy connections
    for (const [level, connections] of edge.connections.entries()) {
      edgeCopy.connections.set(level, new Set(connections))
    }

    // Save the edge directly in the verbs map
    this.verbs.set(edge.id, edgeCopy)
  }

  /**
   * Get an edge from storage
   */
  protected async getEdge(id: string): Promise<Edge | null> {
    // Get the edge directly from the verbs map
    const edge = this.verbs.get(id)

    // If not found, return null
    if (!edge) {
      return null
    }

    // Return a deep copy to avoid reference issues
    const edgeCopy: Edge = {
      id: edge.id,
      vector: [...edge.vector],
      connections: new Map(),
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
      weight: edge.weight,
      metadata: edge.metadata
    }

    // Copy connections
    for (const [level, connections] of edge.connections.entries()) {
      edgeCopy.connections.set(level, new Set(connections))
    }

    return edgeCopy
  }

  /**
   * Get all edges from storage
   */
  protected async getAllEdges(): Promise<Edge[]> {
    const allEdges: Edge[] = []

    // Iterate through all edges in the verbs map
    for (const [edgeId, edge] of this.verbs.entries()) {
      // Return a deep copy to avoid reference issues
      const edgeCopy: Edge = {
        id: edge.id,
        vector: [...edge.vector],
        connections: new Map(),
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        type: edge.type,
        weight: edge.weight,
        metadata: edge.metadata
      }

      // Copy connections
      for (const [level, connections] of edge.connections.entries()) {
        edgeCopy.connections.set(level, new Set(connections))
      }

      allEdges.push(edgeCopy)
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
    // Delete the edge directly from the verbs map
    this.verbs.delete(id)
  }

  /**
   * Save metadata to storage
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    this.metadata.set(id, JSON.parse(JSON.stringify(metadata)))
  }

  /**
   * Get metadata from storage
   */
  public async getMetadata(id: string): Promise<any | null> {
    const metadata = this.metadata.get(id)
    if (!metadata) {
      return null
    }

    return JSON.parse(JSON.stringify(metadata))
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    this.nouns.clear()
    this.verbs.clear()
    this.metadata.clear()
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
    return {
      type: 'memory',
      used: 0, // In-memory storage doesn't have a meaningful size
      quota: null, // In-memory storage doesn't have a quota
      details: {
        nodeCount: this.nouns.size,
        edgeCount: this.verbs.size,
        metadataCount: this.metadata.size
      }
    }
  }

  /**
   * Save statistics data to storage
   * @param statistics The statistics data to save
   */
  protected async saveStatisticsData(statistics: StatisticsData): Promise<void> {
    // For memory storage, we just need to store the statistics in memory
    // Create a deep copy to avoid reference issues
    this.statistics = {
      nounCount: {...statistics.nounCount},
      verbCount: {...statistics.verbCount},
      metadataCount: {...statistics.metadataCount},
      hnswIndexSize: statistics.hnswIndexSize,
      lastUpdated: statistics.lastUpdated
    }
    
    // Since this is in-memory, there's no need for time-based partitioning
    // or legacy file handling
  }

  /**
   * Get statistics data from storage
   * @returns Promise that resolves to the statistics data or null if not found
   */
  protected async getStatisticsData(): Promise<StatisticsData | null> {
    if (!this.statistics) {
      return null
    }

    // Return a deep copy to avoid reference issues
    return {
      nounCount: {...this.statistics.nounCount},
      verbCount: {...this.statistics.verbCount},
      metadataCount: {...this.statistics.metadataCount},
      hnswIndexSize: this.statistics.hnswIndexSize,
      lastUpdated: this.statistics.lastUpdated
    }
    
    // Since this is in-memory, there's no need for fallback mechanisms
    // to check multiple storage locations
  }
}