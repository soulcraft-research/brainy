/**
 * Adaptive Socket Manager
 * Automatically manages socket pools and connection settings based on load patterns
 * Zero-configuration approach that learns and adapts to workload characteristics
 */

import { Agent as HttpsAgent } from 'https'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { createModuleLogger } from './logger.js'

interface LoadMetrics {
  requestsPerSecond: number
  pendingRequests: number
  socketUtilization: number
  errorRate: number
  latencyP50: number
  latencyP95: number
  memoryUsage: number
}

interface AdaptiveConfig {
  maxSockets: number
  maxFreeSockets: number
  keepAliveTimeout: number
  connectionTimeout: number
  socketTimeout: number
  batchSize: number
}

/**
 * Adaptive Socket Manager that automatically scales based on load patterns
 */
export class AdaptiveSocketManager {
  private logger = createModuleLogger('AdaptiveSocketManager')
  
  // Current configuration
  private config: AdaptiveConfig = {
    maxSockets: 100,  // Start conservative
    maxFreeSockets: 20,
    keepAliveTimeout: 60000,
    connectionTimeout: 10000,
    socketTimeout: 60000,
    batchSize: 10
  }
  
  // Performance tracking
  private metrics: LoadMetrics = {
    requestsPerSecond: 0,
    pendingRequests: 0,
    socketUtilization: 0,
    errorRate: 0,
    latencyP50: 0,
    latencyP95: 0,
    memoryUsage: 0
  }
  
  // Historical data for learning
  private history: LoadMetrics[] = []
  private maxHistorySize = 100
  
  // Adaptation state
  private lastAdaptationTime = 0
  private adaptationInterval = 5000  // Check every 5 seconds
  private consecutiveHighLoad = 0
  private consecutiveLowLoad = 0
  
  // Request tracking
  private requestStartTimes = new Map<string, number>()
  private requestLatencies: number[] = []
  private errorCount = 0
  private successCount = 0
  private lastMetricReset = Date.now()
  
  // Socket pool instances
  private currentAgent: HttpsAgent | null = null
  private currentHandler: NodeHttpHandler | null = null
  
  /**
   * Get or create an optimized HTTP handler
   */
  public getHttpHandler(): NodeHttpHandler {
    // Adapt configuration if needed
    this.adaptIfNeeded()
    
    // Create new handler if configuration changed
    if (!this.currentHandler || this.shouldRecreateHandler()) {
      this.currentAgent = new HttpsAgent({
        keepAlive: true,
        maxSockets: this.config.maxSockets,
        maxFreeSockets: this.config.maxFreeSockets,
        timeout: this.config.keepAliveTimeout,
        scheduling: 'fifo'  // Fair scheduling for high-volume scenarios
      })
      
      this.currentHandler = new NodeHttpHandler({
        httpsAgent: this.currentAgent,
        connectionTimeout: this.config.connectionTimeout,
        socketTimeout: this.config.socketTimeout
      })
      
      this.logger.debug('Created new HTTP handler with config:', this.config)
    }
    
    return this.currentHandler
  }
  
  /**
   * Get current batch size recommendation
   */
  public getBatchSize(): number {
    this.adaptIfNeeded()
    return this.config.batchSize
  }
  
  /**
   * Track request start
   */
  public trackRequestStart(requestId: string): void {
    this.requestStartTimes.set(requestId, Date.now())
    this.metrics.pendingRequests++
  }
  
  /**
   * Track request completion
   */
  public trackRequestComplete(requestId: string, success: boolean): void {
    const startTime = this.requestStartTimes.get(requestId)
    if (startTime) {
      const latency = Date.now() - startTime
      this.requestLatencies.push(latency)
      this.requestStartTimes.delete(requestId)
      
      // Keep latency array bounded
      if (this.requestLatencies.length > 1000) {
        this.requestLatencies = this.requestLatencies.slice(-500)
      }
    }
    
    if (success) {
      this.successCount++
    } else {
      this.errorCount++
    }
    
    this.metrics.pendingRequests = Math.max(0, this.metrics.pendingRequests - 1)
  }
  
  /**
   * Check if we should adapt configuration
   */
  private adaptIfNeeded(): void {
    const now = Date.now()
    if (now - this.lastAdaptationTime < this.adaptationInterval) {
      return
    }
    
    this.lastAdaptationTime = now
    this.updateMetrics()
    this.analyzeAndAdapt()
  }
  
  /**
   * Update current metrics
   */
  private updateMetrics(): void {
    const now = Date.now()
    const timeSinceReset = (now - this.lastMetricReset) / 1000
    
    // Calculate requests per second
    const totalRequests = this.successCount + this.errorCount
    this.metrics.requestsPerSecond = timeSinceReset > 0 
      ? totalRequests / timeSinceReset 
      : 0
    
    // Calculate error rate
    this.metrics.errorRate = totalRequests > 0 
      ? this.errorCount / totalRequests 
      : 0
    
    // Calculate latency percentiles
    if (this.requestLatencies.length > 0) {
      const sorted = [...this.requestLatencies].sort((a, b) => a - b)
      const p50Index = Math.floor(sorted.length * 0.5)
      const p95Index = Math.floor(sorted.length * 0.95)
      this.metrics.latencyP50 = sorted[p50Index] || 0
      this.metrics.latencyP95 = sorted[p95Index] || 0
    }
    
    // Calculate socket utilization
    this.metrics.socketUtilization = this.metrics.pendingRequests / this.config.maxSockets
    
    // Memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      this.metrics.memoryUsage = memUsage.heapUsed / memUsage.heapTotal
    }
    
    // Add to history
    this.history.push({ ...this.metrics })
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }
    
    // Reset counters periodically
    if (timeSinceReset > 60) {
      this.lastMetricReset = now
      this.successCount = 0
      this.errorCount = 0
    }
  }
  
  /**
   * Analyze metrics and adapt configuration
   */
  private analyzeAndAdapt(): void {
    const wasConfig = { ...this.config }
    
    // Detect high load conditions
    const isHighLoad = this.detectHighLoad()
    const isLowLoad = this.detectLowLoad()
    const hasErrors = this.metrics.errorRate > 0.01  // More than 1% errors
    
    if (isHighLoad) {
      this.consecutiveHighLoad++
      this.consecutiveLowLoad = 0
      
      if (this.consecutiveHighLoad >= 2) {  // Wait for 2 consecutive high load readings
        this.scaleUp()
      }
    } else if (isLowLoad) {
      this.consecutiveLowLoad++
      this.consecutiveHighLoad = 0
      
      if (this.consecutiveLowLoad >= 6) {  // Wait longer before scaling down
        this.scaleDown()
      }
    } else {
      // Reset counters if load is normal
      this.consecutiveHighLoad = Math.max(0, this.consecutiveHighLoad - 1)
      this.consecutiveLowLoad = Math.max(0, this.consecutiveLowLoad - 1)
    }
    
    // Handle error conditions
    if (hasErrors) {
      this.handleErrors()
    }
    
    // Log significant changes
    if (JSON.stringify(wasConfig) !== JSON.stringify(this.config)) {
      this.logger.info('Adapted configuration', {
        from: wasConfig,
        to: this.config,
        metrics: this.metrics
      })
    }
  }
  
  /**
   * Detect high load conditions
   */
  private detectHighLoad(): boolean {
    return (
      this.metrics.socketUtilization > 0.7 ||  // Sockets heavily used
      this.metrics.pendingRequests > this.config.maxSockets * 0.8 ||  // Many pending requests
      this.metrics.latencyP95 > 5000 ||  // High latency
      this.metrics.requestsPerSecond > 100  // High request rate
    )
  }
  
  /**
   * Detect low load conditions
   */
  private detectLowLoad(): boolean {
    return (
      this.metrics.socketUtilization < 0.2 &&  // Sockets barely used
      this.metrics.pendingRequests < 5 &&  // Few pending requests
      this.metrics.latencyP95 < 1000 &&  // Low latency
      this.metrics.requestsPerSecond < 10 &&  // Low request rate
      this.metrics.memoryUsage < 0.5  // Low memory usage
    )
  }
  
  /**
   * Scale up resources for high load
   */
  private scaleUp(): void {
    // Increase socket limits progressively
    const scaleFactor = this.metrics.errorRate > 0.05 ? 1.5 : 2.0  // Scale more aggressively if no errors
    
    this.config.maxSockets = Math.min(
      2000,  // Hard limit to prevent resource exhaustion
      Math.ceil(this.config.maxSockets * scaleFactor)
    )
    
    this.config.maxFreeSockets = Math.min(
      200,
      Math.ceil(this.config.maxSockets * 0.1)  // Keep 10% as free sockets
    )
    
    // Increase batch size for better throughput
    this.config.batchSize = Math.min(
      100,
      Math.ceil(this.config.batchSize * 1.5)
    )
    
    // Adjust timeouts for high load
    this.config.keepAliveTimeout = 120000  // Keep connections alive longer
    this.config.connectionTimeout = 15000  // Allow more time for connections
    this.config.socketTimeout = 90000  // Allow more time for responses
    
    this.logger.debug('Scaled up for high load', {
      sockets: this.config.maxSockets,
      batchSize: this.config.batchSize
    })
  }
  
  /**
   * Scale down resources for low load
   */
  private scaleDown(): void {
    // Only scale down if memory pressure is low
    if (this.metrics.memoryUsage > 0.7) {
      return
    }
    
    // Decrease socket limits conservatively
    this.config.maxSockets = Math.max(
      50,  // Minimum sockets
      Math.floor(this.config.maxSockets * 0.7)
    )
    
    this.config.maxFreeSockets = Math.max(
      10,
      Math.floor(this.config.maxSockets * 0.2)  // Keep 20% as free sockets
    )
    
    // Decrease batch size
    this.config.batchSize = Math.max(
      5,
      Math.floor(this.config.batchSize * 0.7)
    )
    
    // Adjust timeouts for low load
    this.config.keepAliveTimeout = 60000
    this.config.connectionTimeout = 10000
    this.config.socketTimeout = 60000
    
    this.logger.debug('Scaled down for low load', {
      sockets: this.config.maxSockets,
      batchSize: this.config.batchSize
    })
  }
  
  /**
   * Handle error conditions by adjusting configuration
   */
  private handleErrors(): void {
    const errorRate = this.metrics.errorRate
    
    if (errorRate > 0.1) {  // More than 10% errors
      // Severe errors - back off aggressively
      this.config.maxSockets = Math.max(50, Math.floor(this.config.maxSockets * 0.5))
      this.config.batchSize = Math.max(1, Math.floor(this.config.batchSize * 0.3))
      this.config.connectionTimeout = Math.min(30000, this.config.connectionTimeout * 2)
      this.config.socketTimeout = Math.min(120000, this.config.socketTimeout * 2)
      
      this.logger.warn('High error rate detected, backing off', {
        errorRate,
        newConfig: this.config
      })
    } else if (errorRate > 0.05) {  // More than 5% errors
      // Moderate errors - reduce load slightly
      this.config.batchSize = Math.max(1, Math.floor(this.config.batchSize * 0.7))
      this.config.connectionTimeout = Math.min(20000, this.config.connectionTimeout * 1.2)
    }
  }
  
  /**
   * Check if we should recreate the handler
   */
  private shouldRecreateHandler(): boolean {
    if (!this.currentAgent) return true
    
    // Recreate if socket configuration changed significantly
    const currentMaxSockets = (this.currentAgent as any).maxSockets
    const socketsDiff = Math.abs(currentMaxSockets - this.config.maxSockets)
    
    return socketsDiff > currentMaxSockets * 0.5  // 50% change threshold
  }
  
  /**
   * Get current configuration (for monitoring)
   */
  public getConfig(): Readonly<AdaptiveConfig> {
    return { ...this.config }
  }
  
  /**
   * Get current metrics (for monitoring)
   */
  public getMetrics(): Readonly<LoadMetrics> {
    return { ...this.metrics }
  }
  
  /**
   * Predict optimal configuration based on historical data
   */
  public predictOptimalConfig(): AdaptiveConfig {
    if (this.history.length < 10) {
      return this.config  // Not enough data to predict
    }
    
    // Analyze recent history
    const recentHistory = this.history.slice(-20)
    const avgRPS = recentHistory.reduce((sum, m) => sum + m.requestsPerSecond, 0) / recentHistory.length
    const maxRPS = Math.max(...recentHistory.map(m => m.requestsPerSecond))
    const avgLatency = recentHistory.reduce((sum, m) => sum + m.latencyP95, 0) / recentHistory.length
    
    // Predict optimal socket count based on request patterns
    const optimalSockets = Math.min(2000, Math.max(50, Math.ceil(maxRPS * 2)))
    
    // Predict optimal batch size based on latency
    const optimalBatchSize = avgLatency < 1000 ? 50 : avgLatency < 3000 ? 20 : 10
    
    return {
      maxSockets: optimalSockets,
      maxFreeSockets: Math.ceil(optimalSockets * 0.15),
      keepAliveTimeout: avgRPS > 50 ? 120000 : 60000,
      connectionTimeout: avgLatency > 3000 ? 20000 : 10000,
      socketTimeout: avgLatency > 3000 ? 90000 : 60000,
      batchSize: optimalBatchSize
    }
  }
  
  /**
   * Reset to default configuration
   */
  public reset(): void {
    this.config = {
      maxSockets: 100,
      maxFreeSockets: 20,
      keepAliveTimeout: 60000,
      connectionTimeout: 10000,
      socketTimeout: 60000,
      batchSize: 10
    }
    
    this.consecutiveHighLoad = 0
    this.consecutiveLowLoad = 0
    this.history = []
    this.requestLatencies = []
    this.errorCount = 0
    this.successCount = 0
    
    // Force recreation of handler
    this.currentAgent = null
    this.currentHandler = null
    
    this.logger.info('Reset to default configuration')
  }
}

// Global singleton instance
let globalSocketManager: AdaptiveSocketManager | null = null

/**
 * Get the global socket manager instance
 */
export function getGlobalSocketManager(): AdaptiveSocketManager {
  if (!globalSocketManager) {
    globalSocketManager = new AdaptiveSocketManager()
  }
  return globalSocketManager
}