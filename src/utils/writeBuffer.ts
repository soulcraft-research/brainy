/**
 * Write Buffer
 * Accumulates writes and flushes them in bulk to reduce S3 operations
 * Implements intelligent deduplication and compression
 */

import { HNSWNoun, HNSWVerb } from '../coreTypes.js'
import { createModuleLogger } from './logger.js'
import { getGlobalBackpressure } from './adaptiveBackpressure.js'

interface BufferedWrite<T> {
  id: string
  data: T
  timestamp: number
  type: 'noun' | 'verb' | 'metadata'
  retryCount: number
}

interface FlushResult {
  successful: number
  failed: number
  duration: number
}

/**
 * High-performance write buffer for bulk operations
 */
export class WriteBuffer<T> {
  private logger = createModuleLogger('WriteBuffer')
  
  // Buffer storage
  private buffer = new Map<string, BufferedWrite<T>>()
  
  // Configuration
  private maxBufferSize = 1000      // Maximum items before forced flush
  private flushInterval = 1000      // Flush every second
  private minFlushSize = 100        // Minimum items to flush (unless timeout)
  private maxRetries = 3            // Maximum retry attempts
  
  // State
  private flushTimer: NodeJS.Timeout | null = null
  private isFlushing = false
  private lastFlush = Date.now()
  private pendingFlush: Promise<FlushResult> | null = null
  
  // Statistics
  private totalWrites = 0
  private totalFlushes = 0
  private failedWrites = 0
  private duplicatesRemoved = 0
  
  // Write function
  private writeFunction: (items: Map<string, T>) => Promise<void>
  private type: 'noun' | 'verb' | 'metadata'
  
  // Backpressure integration
  private backpressure = getGlobalBackpressure()
  
  constructor(
    type: 'noun' | 'verb' | 'metadata',
    writeFunction: (items: Map<string, T>) => Promise<void>,
    options?: {
      maxBufferSize?: number
      flushInterval?: number
      minFlushSize?: number
    }
  ) {
    this.type = type
    this.writeFunction = writeFunction
    
    if (options) {
      this.maxBufferSize = options.maxBufferSize || this.maxBufferSize
      this.flushInterval = options.flushInterval || this.flushInterval
      this.minFlushSize = options.minFlushSize || this.minFlushSize
    }
    
    // Start periodic flush
    this.startPeriodicFlush()
  }
  
  /**
   * Add item to buffer
   */
  public async add(id: string, data: T): Promise<void> {
    // Check if we're already at capacity
    if (this.buffer.size >= this.maxBufferSize) {
      // Wait for current flush to complete
      if (this.pendingFlush) {
        await this.pendingFlush
      }
      
      // Force flush if still at capacity
      if (this.buffer.size >= this.maxBufferSize) {
        await this.flush('capacity')
      }
    }
    
    // Check for duplicate and update if newer
    const existing = this.buffer.get(id)
    if (existing) {
      // Update with newer data
      existing.data = data
      existing.timestamp = Date.now()
      this.duplicatesRemoved++
    } else {
      // Add new item
      this.buffer.set(id, {
        id,
        data,
        timestamp: Date.now(),
        type: this.type,
        retryCount: 0
      })
    }
    
    this.totalWrites++
    
    // Check if we should flush
    this.checkFlush()
  }
  
  /**
   * Check if we should flush
   */
  private checkFlush(): void {
    const bufferSize = this.buffer.size
    const timeSinceFlush = Date.now() - this.lastFlush
    
    // Immediate flush conditions
    if (bufferSize >= this.maxBufferSize) {
      this.flush('size')
      return
    }
    
    // Time-based flush with minimum size
    if (timeSinceFlush >= this.flushInterval && bufferSize >= this.minFlushSize) {
      this.flush('time')
      return
    }
    
    // Adaptive flush based on system load
    const backpressureStatus = this.backpressure.getStatus()
    if (backpressureStatus.queueLength > 1000 && bufferSize > 10) {
      // System under pressure - flush smaller batches more frequently
      this.flush('pressure')
    }
  }
  
  /**
   * Flush buffer to storage
   */
  public async flush(reason: string = 'manual'): Promise<FlushResult> {
    // Prevent concurrent flushes
    if (this.isFlushing) {
      if (this.pendingFlush) {
        return this.pendingFlush
      }
      return { successful: 0, failed: 0, duration: 0 }
    }
    
    // Nothing to flush
    if (this.buffer.size === 0) {
      return { successful: 0, failed: 0, duration: 0 }
    }
    
    this.isFlushing = true
    const startTime = Date.now()
    
    // Create flush promise
    this.pendingFlush = this.doFlush(reason, startTime)
    
    try {
      const result = await this.pendingFlush
      return result
    } finally {
      this.isFlushing = false
      this.pendingFlush = null
    }
  }
  
  /**
   * Perform the actual flush
   */
  private async doFlush(reason: string, startTime: number): Promise<FlushResult> {
    const itemsToFlush = new Map<string, T>()
    const flushingItems = new Map<string, BufferedWrite<T>>()
    
    // Take items from buffer
    let count = 0
    for (const [id, item] of this.buffer.entries()) {
      itemsToFlush.set(id, item.data)
      flushingItems.set(id, item)
      count++
      
      // Limit batch size for better performance
      if (count >= 500) {
        break
      }
    }
    
    // Remove from buffer
    for (const id of itemsToFlush.keys()) {
      this.buffer.delete(id)
    }
    
    this.logger.debug(`Flushing ${itemsToFlush.size} ${this.type} items - reason: ${reason}`)
    
    try {
      // Request permission from backpressure system
      const opId = `flush-${Date.now()}`
      await this.backpressure.requestPermission(opId, 2)  // Higher priority
      
      try {
        // Perform bulk write
        await this.writeFunction(itemsToFlush)
        
        // Success
        this.backpressure.releasePermission(opId, true)
        this.totalFlushes++
        this.lastFlush = Date.now()
        
        const duration = Date.now() - startTime
        this.logger.info(`Flushed ${itemsToFlush.size} items in ${duration}ms`)
        
        return {
          successful: itemsToFlush.size,
          failed: 0,
          duration
        }
      } catch (error) {
        // Release with error
        this.backpressure.releasePermission(opId, false)
        throw error
      }
    } catch (error) {
      this.logger.error(`Flush failed: ${error}`)
      
      // Put items back with retry count
      for (const [id, item] of flushingItems.entries()) {
        item.retryCount++
        
        if (item.retryCount < this.maxRetries) {
          // Put back for retry
          this.buffer.set(id, item)
        } else {
          // Max retries exceeded
          this.failedWrites++
          this.logger.error(`Max retries exceeded for ${this.type} ${id}`)
        }
      }
      
      const duration = Date.now() - startTime
      
      return {
        successful: 0,
        failed: itemsToFlush.size,
        duration
      }
    }
  }
  
  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      return
    }
    
    this.flushTimer = setInterval(() => {
      if (this.buffer.size > 0) {
        const timeSinceFlush = Date.now() - this.lastFlush
        
        // Flush if we have items and enough time has passed
        if (timeSinceFlush >= this.flushInterval) {
          this.flush('periodic').catch(error => {
            this.logger.error('Periodic flush failed:', error)
          })
        }
      }
    }, Math.min(100, this.flushInterval / 2))
  }
  
  /**
   * Stop periodic flush timer
   */
  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }
  
  /**
   * Force flush all pending writes
   */
  public async forceFlush(): Promise<FlushResult> {
    // Flush everything regardless of size
    const oldMinSize = this.minFlushSize
    this.minFlushSize = 0
    
    try {
      const result = await this.flush('force')
      
      // Flush any remaining items
      while (this.buffer.size > 0) {
        const additionalResult = await this.flush('force-remaining')
        result.successful += additionalResult.successful
        result.failed += additionalResult.failed
        result.duration += additionalResult.duration
      }
      
      return result
    } finally {
      this.minFlushSize = oldMinSize
    }
  }
  
  /**
   * Get buffer statistics
   */
  public getStats(): {
    bufferSize: number
    totalWrites: number
    totalFlushes: number
    failedWrites: number
    duplicatesRemoved: number
    avgFlushSize: number
  } {
    return {
      bufferSize: this.buffer.size,
      totalWrites: this.totalWrites,
      totalFlushes: this.totalFlushes,
      failedWrites: this.failedWrites,
      duplicatesRemoved: this.duplicatesRemoved,
      avgFlushSize: this.totalFlushes > 0 ? this.totalWrites / this.totalFlushes : 0
    }
  }
  
  /**
   * Adjust parameters based on load
   */
  public adjustForLoad(pendingRequests: number): void {
    if (pendingRequests > 10000) {
      // Extreme load - buffer more aggressively
      this.maxBufferSize = 5000
      this.flushInterval = 500
      this.minFlushSize = 500
    } else if (pendingRequests > 1000) {
      // High load
      this.maxBufferSize = 2000
      this.flushInterval = 1000
      this.minFlushSize = 200
    } else if (pendingRequests > 100) {
      // Moderate load
      this.maxBufferSize = 1000
      this.flushInterval = 2000
      this.minFlushSize = 100
    } else {
      // Low load - optimize for latency
      this.maxBufferSize = 500
      this.flushInterval = 5000
      this.minFlushSize = 50
    }
  }
}

// Global write buffers
const writeBuffers = new Map<string, WriteBuffer<any>>()

/**
 * Get or create a write buffer
 */
export function getWriteBuffer<T>(
  id: string,
  type: 'noun' | 'verb' | 'metadata',
  writeFunction: (items: Map<string, T>) => Promise<void>
): WriteBuffer<T> {
  if (!writeBuffers.has(id)) {
    writeBuffers.set(id, new WriteBuffer<T>(type, writeFunction))
  }
  return writeBuffers.get(id)!
}

/**
 * Flush all write buffers
 */
export async function flushAllBuffers(): Promise<void> {
  const promises: Promise<FlushResult>[] = []
  
  for (const buffer of writeBuffers.values()) {
    promises.push(buffer.forceFlush())
  }
  
  await Promise.all(promises)
}

/**
 * Clear all write buffers
 */
export function clearWriteBuffers(): void {
  for (const buffer of writeBuffers.values()) {
    buffer.stop()
  }
  writeBuffers.clear()
}