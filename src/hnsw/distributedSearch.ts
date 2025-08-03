/**
 * Distributed Search System for Large-Scale HNSW Indices
 * Implements parallel search across multiple partitions and instances
 */

import { Vector, HNSWNoun } from '../coreTypes.js'
import { PartitionedHNSWIndex } from './partitionedHNSWIndex.js'
import { executeInThread } from '../utils/workerUtils.js'

// Search task for parallel execution
interface SearchTask {
  partitionId: string
  queryVector: Vector
  k: number
  searchId: string
  priority: number
}

// Search result from a partition
interface PartitionSearchResult {
  partitionId: string
  results: Array<[string, number]>
  searchTime: number
  nodesVisited: number
  error?: Error
}

// Distributed search configuration
interface DistributedSearchConfig {
  maxConcurrentSearches?: number
  searchTimeout?: number
  resultMergeStrategy?: 'distance' | 'score' | 'hybrid'
  adaptivePartitionSelection?: boolean
  redundantSearches?: number
  loadBalancing?: boolean
}

// Search coordination strategies
enum SearchStrategy {
  BROADCAST = 'broadcast', // Search all partitions
  SELECTIVE = 'selective', // Search subset of partitions
  ADAPTIVE = 'adaptive',   // Dynamically adjust based on results
  HIERARCHICAL = 'hierarchical' // Multi-level search
}

// Worker thread pool for parallel search
interface SearchWorker {
  id: string
  busy: boolean
  tasksCompleted: number
  averageTaskTime: number
  lastTaskTime: number
}

/**
 * Distributed search coordinator for large-scale vector search
 */
export class DistributedSearchSystem {
  private config: Required<DistributedSearchConfig>
  private searchWorkers: Map<string, SearchWorker> = new Map()
  private searchQueue: SearchTask[] = []
  private activeSearches: Map<string, Promise<PartitionSearchResult[]>> = new Map()
  private partitionStats: Map<string, {
    averageSearchTime: number
    load: number
    quality: number
    lastUsed: number
  }> = new Map()

  // Performance monitoring
  private searchStats = {
    totalSearches: 0,
    averageLatency: 0,
    parallelEfficiency: 0,
    cacheHitRate: 0,
    partitionUtilization: new Map<string, number>()
  }

  constructor(config: Partial<DistributedSearchConfig> = {}) {
    this.config = {
      maxConcurrentSearches: 10,
      searchTimeout: 30000, // 30 seconds
      resultMergeStrategy: 'hybrid',
      adaptivePartitionSelection: true,
      redundantSearches: 0,
      loadBalancing: true,
      ...config
    }

    this.initializeWorkerPool()
  }

  /**
   * Execute distributed search across multiple partitions
   */
  public async distributedSearch(
    partitionedIndex: PartitionedHNSWIndex,
    queryVector: Vector,
    k: number,
    strategy: SearchStrategy = SearchStrategy.ADAPTIVE
  ): Promise<Array<[string, number]>> {
    const searchId = this.generateSearchId()
    const startTime = Date.now()

    try {
      // Select partitions to search based on strategy
      const partitionsToSearch = await this.selectPartitions(
        partitionedIndex,
        queryVector,
        strategy
      )

      // Create search tasks
      const searchTasks = this.createSearchTasks(
        partitionsToSearch,
        queryVector,
        k,
        searchId
      )

      // Execute searches in parallel
      const searchResults = await this.executeParallelSearches(
        partitionedIndex,
        searchTasks
      )

      // Merge results from all partitions
      const mergedResults = this.mergeSearchResults(searchResults, k)

      // Update statistics
      this.updateSearchStats(searchId, startTime, searchResults)

      return mergedResults

    } catch (error) {
      console.error(`Distributed search ${searchId} failed:`, error)
      throw error
    }
  }

  /**
   * Select partitions to search based on strategy
   */
  private async selectPartitions(
    partitionedIndex: PartitionedHNSWIndex,
    queryVector: Vector,
    strategy: SearchStrategy
  ): Promise<string[]> {
    const stats = partitionedIndex.getPartitionStats()
    const allPartitionIds = stats.partitionDetails.map(p => p.id)

    switch (strategy) {
      case SearchStrategy.BROADCAST:
        return allPartitionIds

      case SearchStrategy.SELECTIVE:
        return this.selectTopPartitions(allPartitionIds, 3)

      case SearchStrategy.ADAPTIVE:
        return await this.adaptivePartitionSelection(allPartitionIds, queryVector)

      case SearchStrategy.HIERARCHICAL:
        return this.hierarchicalPartitionSelection(allPartitionIds)

      default:
        return allPartitionIds
    }
  }

  /**
   * Adaptive partition selection based on historical performance
   */
  private async adaptivePartitionSelection(
    partitionIds: string[],
    queryVector: Vector
  ): Promise<string[]> {
    const candidates: Array<{ id: string; score: number }> = []

    for (const partitionId of partitionIds) {
      const stats = this.partitionStats.get(partitionId)
      let score = 1.0

      if (stats) {
        // Score based on performance metrics
        const speedScore = 1000 / Math.max(stats.averageSearchTime, 1)
        const loadScore = Math.max(0, 1 - stats.load)
        const qualityScore = stats.quality
        const recencyScore = Math.max(0, 1 - (Date.now() - stats.lastUsed) / 3600000)

        score = speedScore * 0.3 + loadScore * 0.25 + qualityScore * 0.3 + recencyScore * 0.15
      }

      candidates.push({ id: partitionId, score })
    }

    // Sort by score and select top partitions
    candidates.sort((a, b) => b.score - a.score)
    const selectedCount = Math.min(Math.ceil(partitionIds.length * 0.6), 8)
    
    return candidates.slice(0, selectedCount).map(c => c.id)
  }

  /**
   * Select top-performing partitions
   */
  private selectTopPartitions(partitionIds: string[], count: number): string[] {
    const withStats = partitionIds.map(id => ({
      id,
      stats: this.partitionStats.get(id)
    }))

    // Sort by average search time (faster is better)
    withStats.sort((a, b) => {
      const timeA = a.stats?.averageSearchTime || 1000
      const timeB = b.stats?.averageSearchTime || 1000
      return timeA - timeB
    })

    return withStats.slice(0, count).map(p => p.id)
  }

  /**
   * Hierarchical partition selection for very large datasets
   */
  private hierarchicalPartitionSelection(partitionIds: string[]): string[] {
    // First level: select representative partitions
    const firstLevel = partitionIds.filter((_, index) => index % 3 === 0)
    
    // Could implement a two-phase search here:
    // 1. Quick search on representative partitions
    // 2. Detailed search on promising partitions
    
    return firstLevel
  }

  /**
   * Create search tasks for parallel execution
   */
  private createSearchTasks(
    partitionIds: string[],
    queryVector: Vector,
    k: number,
    searchId: string
  ): SearchTask[] {
    const tasks: SearchTask[] = []

    for (let i = 0; i < partitionIds.length; i++) {
      const partitionId = partitionIds[i]
      const stats = this.partitionStats.get(partitionId)
      
      // Calculate priority based on partition performance
      const priority = stats ? (1000 - stats.averageSearchTime) : 500

      tasks.push({
        partitionId,
        queryVector: [...queryVector], // Clone vector
        k: Math.max(k * 2, 20), // Search for more results per partition
        searchId,
        priority
      })

      // Add redundant searches if configured
      if (this.config.redundantSearches > 0 && i < this.config.redundantSearches) {
        tasks.push({
          partitionId,
          queryVector: [...queryVector],
          k: Math.max(k * 2, 20),
          searchId: `${searchId}_redundant_${i}`,
          priority: priority - 100 // Lower priority for redundant searches
        })
      }
    }

    // Sort tasks by priority
    tasks.sort((a, b) => b.priority - a.priority)
    return tasks
  }

  /**
   * Execute searches in parallel across selected partitions
   */
  private async executeParallelSearches(
    partitionedIndex: PartitionedHNSWIndex,
    searchTasks: SearchTask[]
  ): Promise<PartitionSearchResult[]> {
    const results: PartitionSearchResult[] = []
    const semaphore = new Semaphore(this.config.maxConcurrentSearches)
    
    // Execute tasks with controlled concurrency
    const taskPromises = searchTasks.map(async (task) => {
      await semaphore.acquire()
      
      try {
        const startTime = Date.now()
        
        // Execute search with timeout
        const searchPromise = this.executePartitionSearch(partitionedIndex, task)
        const timeoutPromise = new Promise<PartitionSearchResult>((_, reject) => {
          setTimeout(() => reject(new Error('Search timeout')), this.config.searchTimeout)
        })

        const result = await Promise.race([searchPromise, timeoutPromise])
        result.searchTime = Date.now() - startTime
        
        return result

      } catch (error) {
        return {
          partitionId: task.partitionId,
          results: [],
          searchTime: this.config.searchTimeout,
          nodesVisited: 0,
          error: error as Error
        }
      } finally {
        semaphore.release()
      }
    })

    // Wait for all searches to complete
    const taskResults = await Promise.allSettled(taskPromises)
    
    for (const result of taskResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    }

    return results
  }

  /**
   * Execute search on a single partition
   */
  private async executePartitionSearch(
    partitionedIndex: PartitionedHNSWIndex,
    task: SearchTask
  ): Promise<PartitionSearchResult> {
    try {
      // Use thread pool for compute-intensive operations
      if (this.shouldUseWorkerThread(task)) {
        return await this.executeInWorkerThread(partitionedIndex, task)
      }

      // Execute search directly
      const results = await partitionedIndex.search(
        task.queryVector,
        task.k,
        { partitionIds: [task.partitionId] }
      )

      return {
        partitionId: task.partitionId,
        results,
        searchTime: 0, // Will be set by caller
        nodesVisited: results.length // Approximation
      }

    } catch (error) {
      throw new Error(`Partition search failed: ${error}`)
    }
  }

  /**
   * Determine if search should use worker thread
   */
  private shouldUseWorkerThread(task: SearchTask): boolean {
    // Use worker threads for high-dimensional vectors or large k
    return task.queryVector.length > 512 || task.k > 100
  }

  /**
   * Execute search in worker thread
   */
  private async executeInWorkerThread(
    partitionedIndex: PartitionedHNSWIndex,
    task: SearchTask
  ): Promise<PartitionSearchResult> {
    const worker = this.getAvailableWorker()
    
    if (!worker) {
      // No available workers, execute synchronously
      return this.executePartitionSearch(partitionedIndex, task)
    }

    try {
      worker.busy = true
      const startTime = Date.now()

      // Execute in thread (simplified - would need proper worker setup)
      const results = await executeInThread(async () => {
        return partitionedIndex.search(
          task.queryVector,
          task.k,
          { partitionIds: [task.partitionId] }
        )
      })

      const searchTime = Date.now() - startTime
      worker.averageTaskTime = (worker.averageTaskTime + searchTime) / 2
      worker.tasksCompleted++

      return {
        partitionId: task.partitionId,
        results: results || [],
        searchTime,
        nodesVisited: results?.length || 0
      }

    } finally {
      worker.busy = false
      worker.lastTaskTime = Date.now()
    }
  }

  /**
   * Get available worker from pool
   */
  private getAvailableWorker(): SearchWorker | null {
    for (const worker of this.searchWorkers.values()) {
      if (!worker.busy) {
        return worker
      }
    }
    return null
  }

  /**
   * Merge search results from multiple partitions
   */
  private mergeSearchResults(
    partitionResults: PartitionSearchResult[],
    k: number
  ): Array<[string, number]> {
    const allResults: Array<[string, number]> = []
    const seenIds = new Set<string>()

    // Collect all unique results
    for (const partitionResult of partitionResults) {
      if (partitionResult.error) {
        console.warn(`Partition ${partitionResult.partitionId} failed:`, partitionResult.error)
        continue
      }

      for (const [id, distance] of partitionResult.results) {
        if (!seenIds.has(id)) {
          allResults.push([id, distance])
          seenIds.add(id)
        }
      }
    }

    // Sort and return top k results
    switch (this.config.resultMergeStrategy) {
      case 'distance':
        allResults.sort((a, b) => a[1] - b[1])
        break
        
      case 'score':
        // Convert distance to score (1 / (1 + distance))
        allResults.sort((a, b) => {
          const scoreA = 1 / (1 + a[1])
          const scoreB = 1 / (1 + b[1])
          return scoreB - scoreA
        })
        break
        
      case 'hybrid':
        // Weighted combination of distance and partition quality
        allResults.sort((a, b) => {
          const qualityWeightA = this.getPartitionQuality(a[0])
          const qualityWeightB = this.getPartitionQuality(b[0])
          
          const adjustedDistanceA = a[1] / (qualityWeightA + 0.1)
          const adjustedDistanceB = b[1] / (qualityWeightB + 0.1)
          
          return adjustedDistanceA - adjustedDistanceB
        })
        break
    }

    return allResults.slice(0, k)
  }

  /**
   * Get partition quality score
   */
  private getPartitionQuality(nodeId: string): number {
    // This would require knowing which partition a node came from
    // For now, return a default quality score
    return 1.0
  }

  /**
   * Update search statistics
   */
  private updateSearchStats(
    searchId: string,
    startTime: number,
    results: PartitionSearchResult[]
  ): void {
    const totalTime = Date.now() - startTime
    const successfulSearches = results.filter(r => !r.error)
    
    // Update global stats
    this.searchStats.totalSearches++
    this.searchStats.averageLatency = 
      (this.searchStats.averageLatency + totalTime) / 2

    // Calculate parallel efficiency
    const totalPartitionTime = results.reduce((sum, r) => sum + r.searchTime, 0)
    this.searchStats.parallelEfficiency = 
      totalPartitionTime > 0 ? totalTime / totalPartitionTime : 0

    // Update partition statistics
    for (const result of successfulSearches) {
      let stats = this.partitionStats.get(result.partitionId)
      
      if (!stats) {
        stats = {
          averageSearchTime: result.searchTime,
          load: 0,
          quality: 1.0,
          lastUsed: Date.now()
        }
      } else {
        stats.averageSearchTime = (stats.averageSearchTime + result.searchTime) / 2
        stats.lastUsed = Date.now()
      }

      this.partitionStats.set(result.partitionId, stats)
      this.searchStats.partitionUtilization.set(
        result.partitionId,
        (this.searchStats.partitionUtilization.get(result.partitionId) || 0) + 1
      )
    }
  }

  /**
   * Initialize worker thread pool
   */
  private initializeWorkerPool(): void {
    const workerCount = Math.min(navigator.hardwareConcurrency || 4, 8)
    
    for (let i = 0; i < workerCount; i++) {
      const worker: SearchWorker = {
        id: `worker_${i}`,
        busy: false,
        tasksCompleted: 0,
        averageTaskTime: 0,
        lastTaskTime: 0
      }
      
      this.searchWorkers.set(worker.id, worker)
    }

    console.log(`Initialized worker pool with ${workerCount} workers`)
  }

  /**
   * Generate unique search ID
   */
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get search performance statistics
   */
  public getSearchStats(): typeof this.searchStats & {
    workerStats: SearchWorker[]
    partitionStats: Array<{ id: string; stats: any }>
  } {
    return {
      ...this.searchStats,
      workerStats: Array.from(this.searchWorkers.values()),
      partitionStats: Array.from(this.partitionStats.entries()).map(([id, stats]) => ({
        id,
        stats
      }))
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Clear active searches
    this.activeSearches.clear()
    
    // Reset worker states
    for (const worker of this.searchWorkers.values()) {
      worker.busy = false
    }
    
    // Clear statistics
    this.partitionStats.clear()
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve)
    })
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!
      resolve()
    } else {
      this.permits++
    }
  }
}