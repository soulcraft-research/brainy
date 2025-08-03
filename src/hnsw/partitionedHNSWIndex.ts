/**
 * Partitioned HNSW Index for Large-Scale Vector Search
 * Implements sharding strategies to handle millions of vectors efficiently
 */

import {
  DistanceFunction,
  HNSWConfig,
  HNSWNoun,
  Vector,
  VectorDocument
} from '../coreTypes.js'
import { HNSWIndex } from './hnswIndex.js'
import { euclideanDistance } from '../utils/index.js'

export interface PartitionConfig {
  maxNodesPerPartition: number
  partitionStrategy: 'semantic' | 'random' | 'geographic' | 'hash'
  semanticClusters?: number
  geographicBounds?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
}

export interface PartitionMetadata {
  id: string
  nodeCount: number
  bounds?: {
    centroid: Vector
    radius: number
  }
  strategy: string
  created: Date
}

/**
 * Partitioned HNSW Index that splits large datasets across multiple smaller indices
 * This enables efficient search across millions of vectors by reducing memory usage
 * and parallelizing search operations
 */
export class PartitionedHNSWIndex {
  private partitions: Map<string, HNSWIndex> = new Map()
  private partitionMetadata: Map<string, PartitionMetadata> = new Map()
  private config: PartitionConfig
  private hnswConfig: HNSWConfig
  private distanceFunction: DistanceFunction
  private dimension: number | null = null
  private nextPartitionId = 0

  constructor(
    partitionConfig: Partial<PartitionConfig> = {},
    hnswConfig: Partial<HNSWConfig> = {},
    distanceFunction: DistanceFunction = euclideanDistance
  ) {
    this.config = {
      maxNodesPerPartition: 50000, // Optimal size for memory efficiency
      partitionStrategy: 'hash',
      semanticClusters: 10,
      ...partitionConfig
    }

    // Optimized HNSW parameters for large scale
    this.hnswConfig = {
      M: 32, // Higher connectivity for better recall
      efConstruction: 400, // Better build quality
      efSearch: 100, // Balance speed vs accuracy
      ml: 24, // Deeper hierarchy
      ...hnswConfig
    }

    this.distanceFunction = distanceFunction
  }

  /**
   * Add a vector to the partitioned index
   */
  public async addItem(item: VectorDocument): Promise<string> {
    if (this.dimension === null) {
      this.dimension = item.vector.length
    }

    // Determine which partition this item belongs to
    const partitionId = await this.selectPartition(item)
    
    // Get or create the partition
    let partition = this.partitions.get(partitionId)
    if (!partition) {
      partition = new HNSWIndex(
        this.hnswConfig,
        this.distanceFunction,
        { useParallelization: true }
      )
      this.partitions.set(partitionId, partition)
      
      // Initialize partition metadata
      this.partitionMetadata.set(partitionId, {
        id: partitionId,
        nodeCount: 0,
        strategy: this.config.partitionStrategy,
        created: new Date()
      })
    }

    // Add item to the selected partition
    await partition.addItem(item)

    // Update partition metadata
    const metadata = this.partitionMetadata.get(partitionId)!
    metadata.nodeCount = partition.size()
    
    // Update bounds for semantic/geographic strategies
    if (this.config.partitionStrategy === 'semantic' || this.config.partitionStrategy === 'geographic') {
      this.updatePartitionBounds(partitionId, item.vector)
    }

    // Check if partition is getting too large and needs splitting
    if (metadata.nodeCount > this.config.maxNodesPerPartition * 1.2) {
      await this.splitPartition(partitionId)
    }

    return item.id
  }

  /**
   * Search across all partitions for nearest neighbors
   */
  public async search(
    queryVector: Vector,
    k: number = 10,
    searchScope?: {
      partitionIds?: string[]
      maxPartitions?: number
    }
  ): Promise<Array<[string, number]>> {
    if (this.partitions.size === 0) {
      return []
    }

    // Determine which partitions to search
    const partitionsToSearch = await this.selectSearchPartitions(queryVector, searchScope)
    
    // Search partitions in parallel
    const searchPromises = partitionsToSearch.map(async (partitionId) => {
      const partition = this.partitions.get(partitionId)
      if (!partition) return []
      
      // Search with higher k to get better global results
      const partitionK = Math.min(k * 2, partition.size())
      return partition.search(queryVector, partitionK)
    })

    const partitionResults = await Promise.all(searchPromises)
    
    // Merge and sort results from all partitions
    const allResults: Array<[string, number]> = []
    for (const results of partitionResults) {
      allResults.push(...results)
    }

    // Sort by distance and return top k
    allResults.sort((a, b) => a[1] - b[1])
    return allResults.slice(0, k)
  }

  /**
   * Select the appropriate partition for a new item
   */
  private async selectPartition(item: VectorDocument): Promise<string> {
    switch (this.config.partitionStrategy) {
      case 'hash':
        return this.hashPartition(item.id)
      
      case 'semantic':
        return await this.semanticPartition(item.vector)
      
      case 'geographic':
        return this.geographicPartition(item)
      
      case 'random':
        return this.randomPartition()
      
      default:
        return this.hashPartition(item.id)
    }
  }

  /**
   * Hash-based partitioning for even distribution
   */
  private hashPartition(id: string): string {
    const hash = this.simpleHash(id)
    const existingPartitions = Array.from(this.partitions.keys())
    
    // Find partition with space, or create new one
    for (const partitionId of existingPartitions) {
      const metadata = this.partitionMetadata.get(partitionId)
      if (metadata && metadata.nodeCount < this.config.maxNodesPerPartition) {
        return partitionId
      }
    }
    
    // Create new partition
    return `partition_${this.nextPartitionId++}`
  }

  /**
   * Semantic clustering partitioning
   */
  private async semanticPartition(vector: Vector): Promise<string> {
    // Find closest partition centroid
    let closestPartition = ''
    let minDistance = Infinity

    for (const [partitionId, metadata] of this.partitionMetadata.entries()) {
      if (metadata.bounds?.centroid) {
        const distance = this.distanceFunction(vector, metadata.bounds.centroid)
        if (distance < minDistance) {
          minDistance = distance
          closestPartition = partitionId
        }
      }
    }

    // If no suitable partition found or it's full, create new one
    if (!closestPartition || 
        this.partitionMetadata.get(closestPartition)!.nodeCount >= this.config.maxNodesPerPartition) {
      closestPartition = `semantic_${this.nextPartitionId++}`
    }

    return closestPartition
  }

  /**
   * Geographic partitioning (requires lat/lng in metadata)
   */
  private geographicPartition(item: VectorDocument): string {
    // This would require geographic metadata in the item
    // For now, fall back to hash partitioning
    return this.hashPartition(item.id)
  }

  /**
   * Random partitioning
   */
  private randomPartition(): string {
    const existingPartitions = Array.from(this.partitions.keys())
    
    // Find partition with space
    for (const partitionId of existingPartitions) {
      const metadata = this.partitionMetadata.get(partitionId)
      if (metadata && metadata.nodeCount < this.config.maxNodesPerPartition) {
        return partitionId
      }
    }
    
    // Create new partition
    return `random_${this.nextPartitionId++}`
  }

  /**
   * Select which partitions to search based on query
   */
  private async selectSearchPartitions(
    queryVector: Vector,
    searchScope?: {
      partitionIds?: string[]
      maxPartitions?: number
    }
  ): Promise<string[]> {
    if (searchScope?.partitionIds) {
      return searchScope.partitionIds.filter(id => this.partitions.has(id))
    }

    const maxPartitions = searchScope?.maxPartitions || Math.min(5, this.partitions.size)
    
    if (this.config.partitionStrategy === 'semantic') {
      // Search partitions with closest centroids
      const distances: Array<[string, number]> = []
      
      for (const [partitionId, metadata] of this.partitionMetadata.entries()) {
        if (metadata.bounds?.centroid) {
          const distance = this.distanceFunction(queryVector, metadata.bounds.centroid)
          distances.push([partitionId, distance])
        }
      }
      
      distances.sort((a, b) => a[1] - b[1])
      return distances.slice(0, maxPartitions).map(([id]) => id)
    }

    // For other strategies, search all partitions or random subset
    const allPartitionIds = Array.from(this.partitions.keys())
    
    if (allPartitionIds.length <= maxPartitions) {
      return allPartitionIds
    }

    // Return random subset
    const shuffled = [...allPartitionIds].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, maxPartitions)
  }

  /**
   * Update partition bounds for semantic clustering
   */
  private updatePartitionBounds(partitionId: string, vector: Vector): void {
    const metadata = this.partitionMetadata.get(partitionId)!
    
    if (!metadata.bounds) {
      metadata.bounds = {
        centroid: [...vector],
        radius: 0
      }
      return
    }

    // Update centroid using incremental mean
    const { centroid } = metadata.bounds
    const nodeCount = metadata.nodeCount
    
    for (let i = 0; i < centroid.length; i++) {
      centroid[i] = (centroid[i] * (nodeCount - 1) + vector[i]) / nodeCount
    }

    // Update radius
    const distance = this.distanceFunction(vector, centroid)
    metadata.bounds.radius = Math.max(metadata.bounds.radius, distance)
  }

  /**
   * Split an overgrown partition into smaller partitions
   */
  private async splitPartition(partitionId: string): Promise<void> {
    const partition = this.partitions.get(partitionId)
    if (!partition) return

    console.log(`Splitting partition ${partitionId} with ${partition.size()} nodes`)

    // For now, we'll implement a simple strategy
    // In a full implementation, you'd want to analyze the data distribution
    // and create more intelligent splits
    
    // This is a placeholder - actual implementation would require
    // accessing the internal nodes of the HNSW index
  }

  /**
   * Simple hash function for consistent partitioning
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get partition statistics
   */
  public getPartitionStats(): {
    totalPartitions: number
    totalNodes: number
    averageNodesPerPartition: number
    partitionDetails: PartitionMetadata[]
  } {
    const partitionDetails = Array.from(this.partitionMetadata.values())
    const totalNodes = partitionDetails.reduce((sum, p) => sum + p.nodeCount, 0)
    
    return {
      totalPartitions: partitionDetails.length,
      totalNodes,
      averageNodesPerPartition: totalNodes / partitionDetails.length || 0,
      partitionDetails
    }
  }

  /**
   * Remove an item from the index
   */
  public async removeItem(id: string): Promise<boolean> {
    // Find which partition contains this item
    for (const [partitionId, partition] of this.partitions.entries()) {
      if (partition.removeItem(id)) {
        // Update metadata
        const metadata = this.partitionMetadata.get(partitionId)!
        metadata.nodeCount = partition.size()
        return true
      }
    }
    return false
  }

  /**
   * Clear all partitions
   */
  public clear(): void {
    for (const partition of this.partitions.values()) {
      partition.clear()
    }
    this.partitions.clear()
    this.partitionMetadata.clear()
    this.nextPartitionId = 0
  }

  /**
   * Get total size across all partitions
   */
  public size(): number {
    return Array.from(this.partitions.values()).reduce((sum, partition) => sum + partition.size(), 0)
  }
}