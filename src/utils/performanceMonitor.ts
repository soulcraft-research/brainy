/**
 * Performance Monitor
 * Automatically tracks and optimizes system performance
 * Provides real-time insights and auto-tuning recommendations
 */

import { createModuleLogger } from './logger.js'
import { getGlobalSocketManager } from './adaptiveSocketManager.js'
import { getGlobalBackpressure } from './adaptiveBackpressure.js'

interface PerformanceMetrics {
  // Operation metrics
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageLatency: number
  p95Latency: number
  p99Latency: number
  
  // Throughput metrics
  operationsPerSecond: number
  bytesPerSecond: number
  
  // Resource metrics
  memoryUsage: number
  cpuUsage: number
  socketUtilization: number
  queueDepth: number
  
  // Health indicators
  errorRate: number
  healthScore: number  // 0-100
}

interface PerformanceTrend {
  metric: string
  direction: 'improving' | 'degrading' | 'stable'
  changeRate: number
  prediction: number
}

/**
 * Comprehensive performance monitoring and optimization
 */
export class PerformanceMonitor {
  private logger = createModuleLogger('PerformanceMonitor')
  
  // Current metrics
  private metrics: PerformanceMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    operationsPerSecond: 0,
    bytesPerSecond: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    socketUtilization: 0,
    queueDepth: 0,
    errorRate: 0,
    healthScore: 100
  }
  
  // Historical data for trend analysis
  private history: PerformanceMetrics[] = []
  private maxHistorySize = 1000
  
  // Operation tracking
  private operationLatencies: number[] = []
  private operationSizes: number[] = []
  private lastReset = Date.now()
  private resetInterval = 60000  // Reset counters every minute
  
  // CPU tracking
  private lastCpuUsage = process.cpuUsage ? process.cpuUsage() : null
  private lastCpuCheck = Date.now()
  
  // Alert thresholds
  private thresholds = {
    errorRate: 0.05,     // 5% error rate
    latencyP95: 5000,    // 5 second P95
    memoryUsage: 0.8,    // 80% memory
    cpuUsage: 0.9,       // 90% CPU
    healthScore: 70      // Health score below 70
  }
  
  // Optimization recommendations
  private recommendations: string[] = []
  
  // Auto-optimization state
  private autoOptimizeEnabled = true
  private lastOptimization = Date.now()
  private optimizationInterval = 30000  // Optimize every 30 seconds
  
  /**
   * Track an operation completion
   */
  public trackOperation(
    success: boolean,
    latency: number,
    bytes: number = 0
  ): void {
    // Update counters
    this.metrics.totalOperations++
    if (success) {
      this.metrics.successfulOperations++
    } else {
      this.metrics.failedOperations++
    }
    
    // Track latency
    this.operationLatencies.push(latency)
    if (this.operationLatencies.length > 10000) {
      this.operationLatencies = this.operationLatencies.slice(-5000)
    }
    
    // Track size
    if (bytes > 0) {
      this.operationSizes.push(bytes)
      if (this.operationSizes.length > 10000) {
        this.operationSizes = this.operationSizes.slice(-5000)
      }
    }
    
    // Update metrics periodically
    this.updateMetrics()
  }
  
  /**
   * Update all metrics
   */
  private updateMetrics(): void {
    const now = Date.now()
    const timeSinceReset = (now - this.lastReset) / 1000
    
    // Calculate latency percentiles
    if (this.operationLatencies.length > 0) {
      const sorted = [...this.operationLatencies].sort((a, b) => a - b)
      const p95Index = Math.floor(sorted.length * 0.95)
      const p99Index = Math.floor(sorted.length * 0.99)
      
      this.metrics.averageLatency = sorted.reduce((a, b) => a + b, 0) / sorted.length
      this.metrics.p95Latency = sorted[p95Index] || 0
      this.metrics.p99Latency = sorted[p99Index] || 0
    }
    
    // Calculate throughput
    if (timeSinceReset > 0) {
      this.metrics.operationsPerSecond = this.metrics.totalOperations / timeSinceReset
      
      const totalBytes = this.operationSizes.reduce((a, b) => a + b, 0)
      this.metrics.bytesPerSecond = totalBytes / timeSinceReset
    }
    
    // Calculate error rate
    this.metrics.errorRate = this.metrics.totalOperations > 0
      ? this.metrics.failedOperations / this.metrics.totalOperations
      : 0
    
    // Update resource metrics
    this.updateResourceMetrics()
    
    // Calculate health score
    this.calculateHealthScore()
    
    // Store in history
    this.history.push({ ...this.metrics })
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }
    
    // Check for alerts
    this.checkAlerts()
    
    // Auto-optimize if enabled
    if (this.autoOptimizeEnabled && now - this.lastOptimization > this.optimizationInterval) {
      this.autoOptimize()
      this.lastOptimization = now
    }
    
    // Reset counters periodically
    if (now - this.lastReset > this.resetInterval) {
      this.resetCounters()
    }
  }
  
  /**
   * Update resource metrics
   */
  private updateResourceMetrics(): void {
    // Memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      this.metrics.memoryUsage = memUsage.heapUsed / memUsage.heapTotal
    }
    
    // CPU usage (Node.js only)
    if (this.lastCpuUsage && process.cpuUsage) {
      const currentCpuUsage = process.cpuUsage()
      const now = Date.now()
      const timeDiff = now - this.lastCpuCheck
      
      if (timeDiff > 1000) {  // Update CPU every second
        const userDiff = currentCpuUsage.user - this.lastCpuUsage.user
        const systemDiff = currentCpuUsage.system - this.lastCpuUsage.system
        const totalDiff = userDiff + systemDiff
        
        // CPU percentage (approximate)
        this.metrics.cpuUsage = totalDiff / (timeDiff * 1000)
        
        this.lastCpuUsage = currentCpuUsage
        this.lastCpuCheck = now
      }
    }
    
    // Get metrics from socket manager
    const socketMetrics = getGlobalSocketManager().getMetrics()
    this.metrics.socketUtilization = socketMetrics.socketUtilization
    
    // Get metrics from backpressure system
    const backpressureStatus = getGlobalBackpressure().getStatus()
    this.metrics.queueDepth = backpressureStatus.queueLength
  }
  
  /**
   * Calculate overall health score
   */
  private calculateHealthScore(): void {
    let score = 100
    
    // Deduct points for high error rate
    if (this.metrics.errorRate > 0.01) {
      score -= Math.min(30, this.metrics.errorRate * 300)
    }
    
    // Deduct points for high latency
    if (this.metrics.p95Latency > 3000) {
      score -= Math.min(20, (this.metrics.p95Latency - 3000) / 100)
    }
    
    // Deduct points for high memory usage
    if (this.metrics.memoryUsage > 0.7) {
      score -= Math.min(20, (this.metrics.memoryUsage - 0.7) * 66)
    }
    
    // Deduct points for high CPU usage
    if (this.metrics.cpuUsage > 0.8) {
      score -= Math.min(15, (this.metrics.cpuUsage - 0.8) * 75)
    }
    
    // Deduct points for low throughput
    if (this.metrics.operationsPerSecond < 1 && this.metrics.totalOperations > 10) {
      score -= 10
    }
    
    // Deduct points for queue depth
    if (this.metrics.queueDepth > 100) {
      score -= Math.min(15, this.metrics.queueDepth / 20)
    }
    
    this.metrics.healthScore = Math.max(0, Math.min(100, score))
  }
  
  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    const alerts: string[] = []
    
    if (this.metrics.errorRate > this.thresholds.errorRate) {
      alerts.push(`High error rate: ${(this.metrics.errorRate * 100).toFixed(1)}%`)
    }
    
    if (this.metrics.p95Latency > this.thresholds.latencyP95) {
      alerts.push(`High P95 latency: ${this.metrics.p95Latency}ms`)
    }
    
    if (this.metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push(`High memory usage: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`)
    }
    
    if (this.metrics.cpuUsage > this.thresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${(this.metrics.cpuUsage * 100).toFixed(1)}%`)
    }
    
    if (this.metrics.healthScore < this.thresholds.healthScore) {
      alerts.push(`Low health score: ${this.metrics.healthScore.toFixed(0)}`)
    }
    
    if (alerts.length > 0) {
      this.logger.warn('Performance alerts', { alerts, metrics: this.metrics })
    }
  }
  
  /**
   * Auto-optimize system based on metrics
   */
  private autoOptimize(): void {
    this.recommendations = []
    
    // Analyze trends
    const trends = this.analyzeTrends()
    
    // Generate recommendations based on metrics and trends
    if (this.metrics.errorRate > 0.02) {
      this.recommendations.push('Reduce load or increase timeouts due to high error rate')
    }
    
    if (this.metrics.p95Latency > 3000) {
      this.recommendations.push('Increase batch size or socket limits to improve latency')
    }
    
    if (this.metrics.memoryUsage > 0.7) {
      this.recommendations.push('Reduce cache sizes or batch sizes to free memory')
    }
    
    if (this.metrics.queueDepth > 50) {
      this.recommendations.push('Increase concurrency limits to reduce queue depth')
    }
    
    // Check for degrading trends
    trends.forEach(trend => {
      if (trend.direction === 'degrading' && Math.abs(trend.changeRate) > 0.1) {
        this.recommendations.push(`${trend.metric} is degrading at ${(trend.changeRate * 100).toFixed(1)}% per minute`)
      }
    })
    
    // Log recommendations if any
    if (this.recommendations.length > 0) {
      this.logger.info('Performance optimization recommendations', {
        recommendations: this.recommendations,
        metrics: this.metrics
      })
    }
  }
  
  /**
   * Analyze performance trends
   */
  private analyzeTrends(): PerformanceTrend[] {
    const trends: PerformanceTrend[] = []
    
    if (this.history.length < 10) {
      return trends  // Not enough data
    }
    
    // Get recent history
    const recent = this.history.slice(-20)
    const older = this.history.slice(-40, -20)
    
    // Compare key metrics
    const metricsToAnalyze = [
      'errorRate',
      'averageLatency',
      'operationsPerSecond',
      'memoryUsage',
      'healthScore'
    ] as const
    
    metricsToAnalyze.forEach(metric => {
      const recentAvg = recent.reduce((sum, m) => sum + m[metric], 0) / recent.length
      const olderAvg = older.length > 0
        ? older.reduce((sum, m) => sum + m[metric], 0) / older.length
        : recentAvg
      
      const changeRate = olderAvg !== 0 ? (recentAvg - olderAvg) / olderAvg : 0
      
      let direction: 'improving' | 'degrading' | 'stable' = 'stable'
      if (Math.abs(changeRate) > 0.05) {  // 5% threshold
        // For error rate and latency, increase is bad
        if (metric === 'errorRate' || metric === 'averageLatency' || metric === 'memoryUsage') {
          direction = changeRate > 0 ? 'degrading' : 'improving'
        } else {
          // For throughput and health score, increase is good
          direction = changeRate > 0 ? 'improving' : 'degrading'
        }
      }
      
      // Simple linear prediction
      const prediction = recentAvg + (recentAvg * changeRate)
      
      trends.push({
        metric,
        direction,
        changeRate,
        prediction
      })
    })
    
    return trends
  }
  
  /**
   * Reset counters
   */
  private resetCounters(): void {
    this.metrics.totalOperations = 0
    this.metrics.successfulOperations = 0
    this.metrics.failedOperations = 0
    this.operationSizes = []
    this.lastReset = Date.now()
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): Readonly<PerformanceMetrics> {
    return { ...this.metrics }
  }
  
  /**
   * Get performance trends
   */
  public getTrends(): PerformanceTrend[] {
    return this.analyzeTrends()
  }
  
  /**
   * Get recommendations
   */
  public getRecommendations(): string[] {
    return [...this.recommendations]
  }
  
  /**
   * Get performance report
   */
  public getReport(): {
    metrics: PerformanceMetrics
    trends: PerformanceTrend[]
    recommendations: string[]
    socketConfig: any
    backpressureStatus: any
  } {
    return {
      metrics: this.getMetrics(),
      trends: this.getTrends(),
      recommendations: this.getRecommendations(),
      socketConfig: getGlobalSocketManager().getConfig(),
      backpressureStatus: getGlobalBackpressure().getStatus()
    }
  }
  
  /**
   * Enable/disable auto-optimization
   */
  public setAutoOptimize(enabled: boolean): void {
    this.autoOptimizeEnabled = enabled
    this.logger.info(`Auto-optimization ${enabled ? 'enabled' : 'disabled'}`)
  }
  
  /**
   * Reset all metrics and history
   */
  public reset(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      operationsPerSecond: 0,
      bytesPerSecond: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      socketUtilization: 0,
      queueDepth: 0,
      errorRate: 0,
      healthScore: 100
    }
    
    this.history = []
    this.operationLatencies = []
    this.operationSizes = []
    this.recommendations = []
    this.lastReset = Date.now()
    
    this.logger.info('Performance monitor reset')
  }
}

// Global singleton instance
let globalMonitor: PerformanceMonitor | null = null

/**
 * Get the global performance monitor instance
 */
export function getGlobalPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor()
  }
  return globalMonitor
}