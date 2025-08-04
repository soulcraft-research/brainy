/**
 * Hash-based Partitioner
 * Provides deterministic partitioning for distributed writes
 */

import { getPartitionHash } from '../utils/crypto.js'
import { SharedConfig } from '../types/distributedTypes.js'

export class HashPartitioner {
  private partitionCount: number
  private partitionPrefix: string = 'vectors/p'
  
  constructor(config: SharedConfig) {
    this.partitionCount = config.settings.partitionCount || 100
  }
  
  /**
   * Get partition for a given vector ID using deterministic hashing
   * @param vectorId - The unique identifier of the vector
   * @returns The partition path
   */
  getPartition(vectorId: string): string {
    const hash = this.hashString(vectorId)
    const partitionIndex = hash % this.partitionCount
    return `${this.partitionPrefix}${partitionIndex.toString().padStart(3, '0')}`
  }
  
  /**
   * Get partition with domain metadata (domain stored as metadata, not in path)
   * @param vectorId - The unique identifier of the vector
   * @param domain - The domain identifier (for metadata only)
   * @returns The partition path
   */
  getPartitionWithDomain(vectorId: string, domain?: string): string {
    // Domain doesn't affect partitioning - it's just metadata
    return this.getPartition(vectorId)
  }
  
  /**
   * Get all partition paths
   * @returns Array of all partition paths
   */
  getAllPartitions(): string[] {
    const partitions: string[] = []
    for (let i = 0; i < this.partitionCount; i++) {
      partitions.push(`${this.partitionPrefix}${i.toString().padStart(3, '0')}`)
    }
    return partitions
  }
  
  /**
   * Get partition index from partition path
   * @param partitionPath - The partition path
   * @returns The partition index
   */
  getPartitionIndex(partitionPath: string): number {
    const match = partitionPath.match(/p(\d+)$/)
    if (match) {
      return parseInt(match[1], 10)
    }
    throw new Error(`Invalid partition path: ${partitionPath}`)
  }
  
  /**
   * Hash a string to a number for consistent partitioning
   * @param str - The string to hash
   * @returns A positive integer hash
   */
  private hashString(str: string): number {
    // Use our cross-platform hash function
    return getPartitionHash(str)
  }
  
  /**
   * Get partitions for batch operations
   * Groups vector IDs by their target partition
   * @param vectorIds - Array of vector IDs
   * @returns Map of partition to vector IDs
   */
  getPartitionsForBatch(vectorIds: string[]): Map<string, string[]> {
    const partitionMap = new Map<string, string[]>()
    
    for (const id of vectorIds) {
      const partition = this.getPartition(id)
      if (!partitionMap.has(partition)) {
        partitionMap.set(partition, [])
      }
      partitionMap.get(partition)!.push(id)
    }
    
    return partitionMap
  }
}

/**
 * Affinity-based Partitioner
 * Extends HashPartitioner to prefer certain partitions for a writer
 * while maintaining correctness
 */
export class AffinityPartitioner extends HashPartitioner {
  private preferredPartitions: Set<number>
  private instanceId: string
  
  constructor(config: SharedConfig, instanceId: string) {
    super(config)
    this.instanceId = instanceId
    this.preferredPartitions = this.calculatePreferredPartitions(config)
  }
  
  /**
   * Calculate preferred partitions for this instance
   */
  private calculatePreferredPartitions(config: SharedConfig): Set<number> {
    const partitionCount = config.settings.partitionCount || 100
    const writers = Object.entries(config.instances)
      .filter(([_, inst]) => inst.role === 'writer')
      .map(([id, _]) => id)
      .sort() // Ensure consistent ordering
    
    const writerIndex = writers.indexOf(this.instanceId)
    if (writerIndex === -1) {
      // Not a writer or not found, no preferences
      return new Set()
    }
    
    const writerCount = writers.length
    const partitionsPerWriter = Math.ceil(partitionCount / writerCount)
    
    const preferred = new Set<number>()
    const start = writerIndex * partitionsPerWriter
    const end = Math.min(start + partitionsPerWriter, partitionCount)
    
    for (let i = start; i < end; i++) {
      preferred.add(i)
    }
    
    return preferred
  }
  
  /**
   * Check if a partition is preferred for this instance
   * @param partitionPath - The partition path
   * @returns Whether this partition is preferred
   */
  isPreferredPartition(partitionPath: string): boolean {
    try {
      const index = this.getPartitionIndex(partitionPath)
      return this.preferredPartitions.has(index)
    } catch {
      return false
    }
  }
  
  /**
   * Get all preferred partitions for this instance
   * @returns Array of preferred partition paths
   */
  getPreferredPartitions(): string[] {
    return Array.from(this.preferredPartitions)
      .map(index => `vectors/p${index.toString().padStart(3, '0')}`)
  }
  
  /**
   * Update preferred partitions based on new config
   * @param config - The updated shared configuration
   */
  updatePreferences(config: SharedConfig): void {
    this.preferredPartitions = this.calculatePreferredPartitions(config)
  }
}