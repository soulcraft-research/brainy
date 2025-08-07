/**
 * Request Coalescer
 * Batches and deduplicates operations to reduce S3 API calls
 * Automatically flushes based on size, time, or pressure
 */

import { createModuleLogger } from './logger.js'

interface CoalescedOperation {
  type: 'write' | 'read' | 'delete'
  key: string
  data?: any
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
}

interface BatchStats {
  totalOperations: number
  coalescedOperations: number
  deduplicated: number
  batchesProcessed: number
  averageBatchSize: number
}

/**
 * Coalesces multiple operations into efficient batches
 */
export class RequestCoalescer {
  private logger = createModuleLogger('RequestCoalescer')
  
  // Operation queues by type
  private writeQueue = new Map<string, CoalescedOperation[]>()
  private readQueue = new Map<string, CoalescedOperation[]>()
  private deleteQueue = new Map<string, CoalescedOperation[]>()
  
  // Batch configuration
  private maxBatchSize = 100
  private maxBatchAge = 100  // ms - flush quickly under load
  private minBatchSize = 10   // Don't flush until we have enough
  
  // Flush timers
  private flushTimer: NodeJS.Timeout | null = null
  private lastFlush = Date.now()
  
  // Statistics
  private stats: BatchStats = {
    totalOperations: 0,
    coalescedOperations: 0,
    deduplicated: 0,
    batchesProcessed: 0,
    averageBatchSize: 0
  }
  
  // Processor function
  private processor: (batch: CoalescedOperation[]) => Promise<void>
  
  constructor(
    processor: (batch: CoalescedOperation[]) => Promise<void>,
    options?: {
      maxBatchSize?: number
      maxBatchAge?: number
      minBatchSize?: number
    }
  ) {
    this.processor = processor
    
    if (options) {
      this.maxBatchSize = options.maxBatchSize || this.maxBatchSize
      this.maxBatchAge = options.maxBatchAge || this.maxBatchAge
      this.minBatchSize = options.minBatchSize || this.minBatchSize
    }
  }
  
  /**
   * Add a write operation to be coalesced
   */
  public async write(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if we already have a pending write for this key
      const existing = this.writeQueue.get(key)
      
      if (existing && existing.length > 0) {
        // Replace the data but resolve all promises
        const last = existing[existing.length - 1]
        last.data = data  // Use latest data
        
        // Add this promise to be resolved
        existing.push({
          type: 'write',
          key,
          data,
          resolve,
          reject,
          timestamp: Date.now()
        })
        
        this.stats.deduplicated++
      } else {
        // New write operation
        this.writeQueue.set(key, [{
          type: 'write',
          key,
          data,
          resolve,
          reject,
          timestamp: Date.now()
        }])
      }
      
      this.stats.totalOperations++
      this.checkFlush()
    })
  }
  
  /**
   * Add a read operation to be coalesced
   */
  public async read(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if we already have a pending read for this key
      const existing = this.readQueue.get(key)
      
      if (existing && existing.length > 0) {
        // Coalesce with existing read
        existing.push({
          type: 'read',
          key,
          resolve,
          reject,
          timestamp: Date.now()
        })
        
        this.stats.deduplicated++
      } else {
        // New read operation
        this.readQueue.set(key, [{
          type: 'read',
          key,
          resolve,
          reject,
          timestamp: Date.now()
        }])
      }
      
      this.stats.totalOperations++
      this.checkFlush()
    })
  }
  
  /**
   * Add a delete operation to be coalesced
   */
  public async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any pending writes for this key
      if (this.writeQueue.has(key)) {
        const writes = this.writeQueue.get(key)!
        writes.forEach(op => op.reject(new Error('Cancelled by delete')))
        this.writeQueue.delete(key)
        this.stats.deduplicated += writes.length
      }
      
      // Cancel any pending reads for this key
      if (this.readQueue.has(key)) {
        const reads = this.readQueue.get(key)!
        reads.forEach(op => op.resolve(null))  // Return null for deleted items
        this.readQueue.delete(key)
        this.stats.deduplicated += reads.length
      }
      
      // Check if we already have a pending delete
      const existing = this.deleteQueue.get(key)
      
      if (existing && existing.length > 0) {
        // Coalesce with existing delete
        existing.push({
          type: 'delete',
          key,
          resolve,
          reject,
          timestamp: Date.now()
        })
        
        this.stats.deduplicated++
      } else {
        // New delete operation
        this.deleteQueue.set(key, [{
          type: 'delete',
          key,
          resolve,
          reject,
          timestamp: Date.now()
        }])
      }
      
      this.stats.totalOperations++
      this.checkFlush()
    })
  }
  
  /**
   * Check if we should flush the queues
   */
  private checkFlush(): void {
    const totalSize = this.writeQueue.size + this.readQueue.size + this.deleteQueue.size
    const now = Date.now()
    const age = now - this.lastFlush
    
    // Immediate flush conditions
    if (totalSize >= this.maxBatchSize) {
      this.flush('size_limit')
      return
    }
    
    // Age-based flush
    if (age >= this.maxBatchAge && totalSize >= this.minBatchSize) {
      this.flush('age_limit')
      return
    }
    
    // Schedule a flush if not already scheduled
    if (!this.flushTimer && totalSize > 0) {
      const delay = Math.max(10, this.maxBatchAge - age)
      this.flushTimer = setTimeout(() => {
        this.flush('timer')
      }, delay)
    }
  }
  
  /**
   * Flush all queued operations
   */
  public async flush(reason: string = 'manual'): Promise<void> {
    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    
    // Collect all operations into a single batch
    const batch: CoalescedOperation[] = []
    
    // Process deletes first (highest priority)
    this.deleteQueue.forEach((ops) => {
      // Only take the first operation per key (others are duplicates)
      if (ops.length > 0) {
        batch.push(ops[0])
        this.stats.coalescedOperations += ops.length
      }
    })
    
    // Then writes
    this.writeQueue.forEach((ops) => {
      if (ops.length > 0) {
        // Use the last write (most recent data)
        const lastWrite = ops[ops.length - 1]
        batch.push(lastWrite)
        this.stats.coalescedOperations += ops.length
      }
    })
    
    // Then reads
    this.readQueue.forEach((ops) => {
      if (ops.length > 0) {
        batch.push(ops[0])
        this.stats.coalescedOperations += ops.length
      }
    })
    
    // Clear queues
    const allOps = [
      ...Array.from(this.deleteQueue.values()).flat(),
      ...Array.from(this.writeQueue.values()).flat(),
      ...Array.from(this.readQueue.values()).flat()
    ]
    
    this.deleteQueue.clear()
    this.writeQueue.clear()
    this.readQueue.clear()
    
    if (batch.length === 0) {
      return
    }
    
    // Update stats
    this.stats.batchesProcessed++
    this.stats.averageBatchSize = 
      (this.stats.averageBatchSize * (this.stats.batchesProcessed - 1) + batch.length) / 
      this.stats.batchesProcessed
    
    this.logger.debug(`Flushing batch of ${batch.length} operations (${allOps.length} total) - reason: ${reason}`)
    
    // Process the batch
    try {
      await this.processor(batch)
      
      // Resolve all promises
      allOps.forEach(op => {
        if (op.type === 'read') {
          // Find the result for this read
          const result = batch.find(b => b.key === op.key && b.type === 'read')
          op.resolve(result?.data || null)
        } else {
          op.resolve(undefined)
        }
      })
    } catch (error) {
      // Reject all promises
      allOps.forEach(op => op.reject(error))
      
      this.logger.error('Batch processing failed:', error)
    }
    
    this.lastFlush = Date.now()
  }
  
  /**
   * Get current statistics
   */
  public getStats(): BatchStats {
    return { ...this.stats }
  }
  
  /**
   * Get current queue sizes
   */
  public getQueueSizes(): {
    writes: number
    reads: number
    deletes: number
    total: number
  } {
    return {
      writes: this.writeQueue.size,
      reads: this.readQueue.size,
      deletes: this.deleteQueue.size,
      total: this.writeQueue.size + this.readQueue.size + this.deleteQueue.size
    }
  }
  
  /**
   * Adjust batch parameters based on load
   */
  public adjustParameters(pending: number): void {
    if (pending > 10000) {
      // Extreme load - batch aggressively
      this.maxBatchSize = 500
      this.maxBatchAge = 50
      this.minBatchSize = 50
    } else if (pending > 1000) {
      // High load - larger batches
      this.maxBatchSize = 200
      this.maxBatchAge = 100
      this.minBatchSize = 20
    } else if (pending > 100) {
      // Moderate load
      this.maxBatchSize = 100
      this.maxBatchAge = 200
      this.minBatchSize = 10
    } else {
      // Low load - optimize for latency
      this.maxBatchSize = 50
      this.maxBatchAge = 500
      this.minBatchSize = 5
    }
  }
  
  /**
   * Force immediate flush of all operations
   */
  public async forceFlush(): Promise<void> {
    await this.flush('force')
  }
}

// Global coalescer instances by storage type
const coalescers = new Map<string, RequestCoalescer>()

/**
 * Get or create a coalescer for a storage instance
 */
export function getCoalescer(
  storageId: string,
  processor: (batch: any[]) => Promise<void>
): RequestCoalescer {
  if (!coalescers.has(storageId)) {
    coalescers.set(storageId, new RequestCoalescer(processor))
  }
  return coalescers.get(storageId)!
}

/**
 * Clear all coalescers
 */
export function clearCoalescers(): void {
  coalescers.clear()
}