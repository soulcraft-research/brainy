/**
 * Adaptive Backpressure System
 * Automatically manages request flow and prevents system overload
 * Self-healing with pattern learning for optimal throughput
 */

import { createModuleLogger } from './logger.js'

interface BackpressureMetrics {
  queueDepth: number
  processingRate: number
  errorRate: number
  latency: number
  throughput: number
}

interface BackpressureConfig {
  maxQueueDepth: number
  targetLatency: number
  minThroughput: number
  adaptationRate: number
}

/**
 * Self-healing backpressure manager that learns from load patterns
 */
export class AdaptiveBackpressure {
  private logger = createModuleLogger('AdaptiveBackpressure')
  
  // Queue management
  private queue: Array<{
    id: string
    priority: number
    timestamp: number
    resolve: () => void
  }> = []
  
  // Active operations tracking
  private activeOperations = new Set<string>()
  private maxConcurrent = 100
  
  // Metrics tracking
  private metrics: BackpressureMetrics = {
    queueDepth: 0,
    processingRate: 0,
    errorRate: 0,
    latency: 0,
    throughput: 0
  }
  
  // Configuration that adapts over time
  private config: BackpressureConfig = {
    maxQueueDepth: 1000,
    targetLatency: 1000,  // 1 second target
    minThroughput: 10,    // Minimum 10 ops/sec
    adaptationRate: 0.1   // How quickly to adapt
  }
  
  // Historical patterns for learning
  private patterns: Array<{
    timestamp: number
    load: number
    optimal: number
  }> = []
  
  // Circuit breaker state
  private circuitState: 'closed' | 'open' | 'half-open' = 'closed'
  private circuitOpenTime = 0
  private circuitFailures = 0
  private circuitThreshold = 5
  private circuitTimeout = 30000  // 30 seconds
  
  // Performance tracking
  private operationTimes = new Map<string, number>()
  private completedOps: number[] = []
  private errorOps = 0
  private lastAdaptation = Date.now()
  
  /**
   * Request permission to proceed with an operation
   */
  public async requestPermission(
    operationId: string,
    priority: number = 1
  ): Promise<void> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open - system is recovering')
    }
    
    // Fast path for low load
    if (this.activeOperations.size < this.maxConcurrent * 0.5 && this.queue.length === 0) {
      this.activeOperations.add(operationId)
      this.operationTimes.set(operationId, Date.now())
      return
    }
    
    // Check if we need to queue
    if (this.activeOperations.size >= this.maxConcurrent) {
      // Check queue depth
      if (this.queue.length >= this.config.maxQueueDepth) {
        throw new Error('Backpressure queue is full - try again later')
      }
      
      // Add to queue and wait
      return new Promise<void>((resolve) => {
        this.queue.push({
          id: operationId,
          priority,
          timestamp: Date.now(),
          resolve
        })
        
        // Sort queue by priority (higher priority first)
        this.queue.sort((a, b) => b.priority - a.priority)
        
        // Update metrics
        this.metrics.queueDepth = this.queue.length
      })
    }
    
    // Add to active operations
    this.activeOperations.add(operationId)
    this.operationTimes.set(operationId, Date.now())
  }
  
  /**
   * Release permission after operation completes
   */
  public releasePermission(operationId: string, success: boolean = true): void {
    // Remove from active operations
    this.activeOperations.delete(operationId)
    
    // Track completion time
    const startTime = this.operationTimes.get(operationId)
    if (startTime) {
      const duration = Date.now() - startTime
      this.completedOps.push(duration)
      this.operationTimes.delete(operationId)
      
      // Keep array bounded
      if (this.completedOps.length > 1000) {
        this.completedOps = this.completedOps.slice(-500)
      }
    }
    
    // Track errors for circuit breaker
    if (!success) {
      this.errorOps++
      this.circuitFailures++
      
      // Check if we should open circuit
      if (this.circuitFailures >= this.circuitThreshold) {
        this.openCircuit()
      }
    } else {
      // Reset circuit failures on success
      if (this.circuitState === 'half-open') {
        this.closeCircuit()
      }
    }
    
    // Process queue if there are waiting operations
    if (this.queue.length > 0 && this.activeOperations.size < this.maxConcurrent) {
      const next = this.queue.shift()
      if (next) {
        this.activeOperations.add(next.id)
        this.operationTimes.set(next.id, Date.now())
        next.resolve()
        
        // Update metrics
        this.metrics.queueDepth = this.queue.length
      }
    }
    
    // Adapt configuration periodically
    this.adaptIfNeeded()
  }
  
  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (this.circuitState === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.circuitOpenTime > this.circuitTimeout) {
        this.circuitState = 'half-open'
        this.logger.info('Circuit breaker entering half-open state')
        return false
      }
      return true
    }
    return false
  }
  
  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    if (this.circuitState !== 'open') {
      this.circuitState = 'open'
      this.circuitOpenTime = Date.now()
      this.logger.warn('Circuit breaker opened due to high error rate')
      
      // Reduce load immediately
      this.maxConcurrent = Math.max(10, Math.floor(this.maxConcurrent * 0.3))
    }
  }
  
  /**
   * Close the circuit breaker
   */
  private closeCircuit(): void {
    this.circuitState = 'closed'
    this.circuitFailures = 0
    this.logger.info('Circuit breaker closed - system recovered')
    
    // Gradually increase capacity
    this.maxConcurrent = Math.min(500, Math.floor(this.maxConcurrent * 1.5))
  }
  
  /**
   * Adapt configuration based on metrics
   */
  private adaptIfNeeded(): void {
    const now = Date.now()
    if (now - this.lastAdaptation < 5000) {  // Adapt every 5 seconds
      return
    }
    
    this.lastAdaptation = now
    this.updateMetrics()
    
    // Learn from current patterns
    this.learnPattern()
    
    // Adapt based on metrics
    this.adaptConfiguration()
  }
  
  /**
   * Update current metrics
   */
  private updateMetrics(): void {
    // Calculate processing rate
    this.metrics.processingRate = this.completedOps.length > 0
      ? 1000 / (this.completedOps.reduce((a, b) => a + b, 0) / this.completedOps.length)
      : 0
    
    // Calculate error rate
    const totalOps = this.completedOps.length + this.errorOps
    this.metrics.errorRate = totalOps > 0 ? this.errorOps / totalOps : 0
    
    // Calculate average latency
    this.metrics.latency = this.completedOps.length > 0
      ? this.completedOps.reduce((a, b) => a + b, 0) / this.completedOps.length
      : 0
    
    // Calculate throughput
    this.metrics.throughput = this.activeOperations.size + this.metrics.processingRate
    
    // Reset error counter periodically
    if (this.completedOps.length > 100) {
      this.errorOps = Math.floor(this.errorOps * 0.9)  // Decay error count
    }
  }
  
  /**
   * Learn from current load patterns
   */
  private learnPattern(): void {
    const currentLoad = this.activeOperations.size + this.queue.length
    const optimalConcurrency = this.calculateOptimalConcurrency()
    
    this.patterns.push({
      timestamp: Date.now(),
      load: currentLoad,
      optimal: optimalConcurrency
    })
    
    // Keep patterns bounded
    if (this.patterns.length > 1000) {
      this.patterns = this.patterns.slice(-500)
    }
  }
  
  /**
   * Calculate optimal concurrency based on Little's Law
   */
  private calculateOptimalConcurrency(): number {
    // Little's Law: L = λ * W
    // L = number of requests in system
    // λ = arrival rate
    // W = average time in system
    
    if (this.metrics.latency === 0 || this.metrics.processingRate === 0) {
      return this.maxConcurrent  // Keep current if no data
    }
    
    // Target: Keep latency under target while maximizing throughput
    const targetConcurrency = Math.ceil(
      this.metrics.processingRate * (this.config.targetLatency / 1000)
    )
    
    // Adjust based on error rate
    const errorAdjustment = 1 - (this.metrics.errorRate * 2)  // Reduce by up to 50% for errors
    
    // Apply adjustment
    const adjusted = Math.floor(targetConcurrency * errorAdjustment)
    
    // Apply bounds
    return Math.max(10, Math.min(500, adjusted))
  }
  
  /**
   * Adapt configuration based on metrics and patterns
   */
  private adaptConfiguration(): void {
    const optimal = this.calculateOptimalConcurrency()
    const current = this.maxConcurrent
    
    // Smooth adaptation using exponential moving average
    const newConcurrency = Math.floor(
      current * (1 - this.config.adaptationRate) + 
      optimal * this.config.adaptationRate
    )
    
    // Check if adaptation is needed
    if (Math.abs(newConcurrency - current) > current * 0.1) {  // 10% threshold
      const oldValue = this.maxConcurrent
      this.maxConcurrent = newConcurrency
      
      this.logger.debug('Adapted concurrency', {
        from: oldValue,
        to: newConcurrency,
        metrics: this.metrics
      })
    }
    
    // Adapt queue depth based on throughput
    if (this.metrics.throughput > 0) {
      // Allow queue depth to be 10 seconds worth of throughput
      this.config.maxQueueDepth = Math.max(
        100,
        Math.min(10000, Math.floor(this.metrics.throughput * 10))
      )
    }
    
    // Adapt circuit breaker threshold based on error patterns
    if (this.metrics.errorRate < 0.01 && this.circuitThreshold > 5) {
      this.circuitThreshold = Math.max(5, this.circuitThreshold - 1)
    } else if (this.metrics.errorRate > 0.05 && this.circuitThreshold < 20) {
      this.circuitThreshold = Math.min(20, this.circuitThreshold + 1)
    }
  }
  
  /**
   * Predict future load based on patterns
   */
  public predictLoad(futureSeconds: number = 60): number {
    if (this.patterns.length < 10) {
      return this.maxConcurrent  // Not enough data
    }
    
    // Simple linear regression on recent patterns
    const recentPatterns = this.patterns.slice(-50)
    const n = recentPatterns.length
    
    // Calculate averages
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    const startTime = recentPatterns[0].timestamp
    
    recentPatterns.forEach(p => {
      const x = (p.timestamp - startTime) / 1000  // Time in seconds
      const y = p.load
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    })
    
    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Predict future load
    const currentTime = (Date.now() - startTime) / 1000
    const predictedLoad = intercept + slope * (currentTime + futureSeconds)
    
    return Math.max(0, Math.min(this.config.maxQueueDepth, Math.floor(predictedLoad)))
  }
  
  /**
   * Get current configuration and metrics
   */
  public getStatus(): {
    config: BackpressureConfig
    metrics: BackpressureMetrics
    circuit: string
    maxConcurrent: number
    activeOps: number
    queueLength: number
  } {
    return {
      config: { ...this.config },
      metrics: { ...this.metrics },
      circuit: this.circuitState,
      maxConcurrent: this.maxConcurrent,
      activeOps: this.activeOperations.size,
      queueLength: this.queue.length
    }
  }
  
  /**
   * Reset to default state
   */
  public reset(): void {
    this.queue = []
    this.activeOperations.clear()
    this.operationTimes.clear()
    this.completedOps = []
    this.errorOps = 0
    this.patterns = []
    this.circuitState = 'closed'
    this.circuitFailures = 0
    this.maxConcurrent = 100
    
    this.logger.info('Backpressure system reset to defaults')
  }
}

// Global singleton instance
let globalBackpressure: AdaptiveBackpressure | null = null

/**
 * Get the global backpressure instance
 */
export function getGlobalBackpressure(): AdaptiveBackpressure {
  if (!globalBackpressure) {
    globalBackpressure = new AdaptiveBackpressure()
  }
  return globalBackpressure
}