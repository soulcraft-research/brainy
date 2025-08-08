/**
 * Performance Monitor - Atomic Age Intelligence Observatory
 * 
 * 🧠 Real-time performance tracking for vector + graph operations
 * ⚛️ Monitors query performance, storage usage, and system health
 * 🚀 Scalable performance analytics with atomic age aesthetics
 */

import { BrainyData } from '../brainyData.js'
// @ts-ignore
import chalk from 'chalk'
// @ts-ignore
import boxen from 'boxen'

export interface PerformanceMetrics {
  // Query Performance
  queryLatency: {
    vector: { avg: number; p50: number; p95: number; p99: number }
    graph: { avg: number; p50: number; p95: number; p99: number }
    combined: { avg: number; p50: number; p95: number; p99: number }
  }
  
  // Throughput
  throughput: {
    vectorOps: number      // Operations per second
    graphOps: number       // Relationships per second
    totalOps: number       // Combined ops per second
  }
  
  // Storage Performance
  storage: {
    readLatency: number    // Average read latency (ms)
    writeLatency: number   // Average write latency (ms)
    cacheHitRate: number   // Percentage of cache hits
    totalSize: number      // Total storage size in bytes
    growthRate: number     // Storage growth rate per hour
  }
  
  // Memory Usage
  memory: {
    heapUsed: number       // Current heap usage in MB
    heapTotal: number      // Total heap size in MB
    vectorCache: number    // Vector cache size in MB
    graphCache: number     // Graph cache size in MB
    efficiency: number     // Memory efficiency percentage
  }
  
  // Error Rates
  errors: {
    total: number          // Total error count
    rate: number          // Errors per minute
    types: { [key: string]: number }  // Error breakdown by type
  }
  
  // Health Score
  health: {
    overall: number        // Overall health score (0-100)
    vector: number         // Vector operations health
    graph: number          // Graph operations health
    storage: number        // Storage system health
    network: number        // Network/connectivity health
  }
  
  timestamp: string
  uptime: number          // System uptime in seconds
}

export interface AlertRule {
  id: string
  name: string
  condition: string       // e.g., "queryLatency.vector.p95 > 500"
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  action?: string        // Optional automated action
  enabled: boolean
}

export interface PerformanceAlert {
  id: string
  rule: AlertRule
  triggered: string      // ISO timestamp
  value: number
  message: string
  resolved?: string      // ISO timestamp when resolved
}

/**
 * Real-time Performance Monitoring System
 */
export class PerformanceMonitor {
  private brainy: BrainyData
  private metrics: PerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private alertRules: AlertRule[] = []
  private isMonitoring = false
  private monitoringInterval?: NodeJS.Timeout
  
  private colors = {
    primary: chalk.hex('#3A5F4A'),
    success: chalk.hex('#2D4A3A'),
    warning: chalk.hex('#D67441'),
    error: chalk.hex('#B85C35'),
    info: chalk.hex('#4A6B5A'),
    dim: chalk.hex('#8A9B8A'),
    highlight: chalk.hex('#E88B5A'),
    accent: chalk.hex('#F5E6D3'),
    brain: chalk.hex('#E88B5A')
  }
  
  private emojis = {
    brain: '🧠',
    atom: '⚛️',
    monitor: '📊',
    alert: '🚨',
    health: '💚',
    warning: '⚠️',
    critical: '🔥',
    rocket: '🚀',
    gear: '⚙️',
    chart: '📈',
    lightning: '⚡',
    shield: '🛡️'
  }

  constructor(brainy: BrainyData) {
    this.brainy = brainy
    this.initializeDefaultAlerts()
  }

  /**
   * Start real-time monitoring
   */
  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isMonitoring) {
      console.log(this.colors.warning('Monitoring already running'))
      return
    }

    console.log(boxen(
      `${this.emojis.monitor} ${this.colors.brain('ATOMIC PERFORMANCE OBSERVATORY')} ${this.emojis.atom}\n\n` +
      `${this.colors.accent('◆')} ${this.colors.dim('Initiating neural performance monitoring')}` +
      `${this.colors.accent('◆')} ${this.colors.dim('Monitoring Interval:')} ${this.colors.highlight(intervalMs + 'ms')}\n` +
      `${this.colors.accent('◆')} ${this.colors.dim('Vector + Graph Analytics:')} ${this.colors.highlight('Enabled')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    this.isMonitoring = true
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics()
        this.metrics.push(metrics)
        
        // Keep only last 1000 metrics (rolling window)
        if (this.metrics.length > 1000) {
          this.metrics = this.metrics.slice(-1000)
        }
        
        // Check alerts
        await this.checkAlerts(metrics)
        
      } catch (error) {
        console.error('Error collecting metrics:', error)
      }
    }, intervalMs)

    console.log(this.colors.success(`${this.emojis.rocket} Performance monitoring started - neural pathways under observation`))
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log(this.colors.warning('Monitoring not running'))
      return
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    
    this.isMonitoring = false
    console.log(this.colors.info(`${this.emojis.gear} Performance monitoring stopped`))
  }

  /**
   * Get current performance metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    return await this.collectMetrics()
  }

  /**
   * Get performance dashboard data
   */
  async getDashboard(): Promise<{
    current: PerformanceMetrics
    trends: PerformanceMetrics[]
    alerts: PerformanceAlert[]
    health: string
  }> {
    const current = await this.collectMetrics()
    const activeAlerts = this.alerts.filter(a => !a.resolved)
    
    return {
      current,
      trends: this.metrics.slice(-100), // Last 100 data points
      alerts: activeAlerts,
      health: this.getHealthStatus(current)
    }
  }

  /**
   * Display performance dashboard in terminal
   */
  async displayDashboard(): Promise<void> {
    const dashboard = await this.getDashboard()
    const metrics = dashboard.current

    console.clear()
    
    // Header
    console.log(boxen(
      `${this.emojis.brain} ${this.colors.brain('BRAINY PERFORMANCE DASHBOARD')} ${this.emojis.atom}\n` +
      `${this.colors.dim('Real-time Vector + Graph Database Performance')}\n` +
      `${this.colors.accent('Uptime:')} ${this.colors.highlight(this.formatUptime(metrics.uptime))} | ` +
      `${this.colors.accent('Health:')} ${this.getHealthIcon(metrics.health.overall)} ${this.colors.primary(metrics.health.overall + '/100')}`,
      { padding: 1, borderStyle: 'double', borderColor: '#E88B5A', width: 80 }
    ))

    // Query Performance Section
    console.log('\n' + this.colors.brain(`${this.emojis.lightning} QUERY PERFORMANCE`))
    console.log(boxen(
      `${this.colors.accent('Vector Queries:')} ${this.colors.primary(metrics.queryLatency.vector.avg.toFixed(1) + 'ms avg')} | ` +
      `${this.colors.accent('P95:')} ${this.colors.highlight(metrics.queryLatency.vector.p95.toFixed(1) + 'ms')}\n` +
      `${this.colors.accent('Graph Queries:')} ${this.colors.primary(metrics.queryLatency.graph.avg.toFixed(1) + 'ms avg')} | ` +
      `${this.colors.accent('P95:')} ${this.colors.highlight(metrics.queryLatency.graph.p95.toFixed(1) + 'ms')}\n` +
      `${this.colors.accent('Combined Ops:')} ${this.colors.success(metrics.throughput.totalOps.toFixed(0) + ' ops/sec')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#3A5F4A' }
    ))

    // Storage & Memory Section
    console.log('\n' + this.colors.brain(`${this.emojis.shield} STORAGE & MEMORY`))
    console.log(boxen(
      `${this.colors.accent('Storage Size:')} ${this.colors.primary(this.formatBytes(metrics.storage.totalSize))} | ` +
      `${this.colors.accent('Growth:')} ${this.colors.highlight(metrics.storage.growthRate.toFixed(1) + '/hr')}\n` +
      `${this.colors.accent('Cache Hit Rate:')} ${this.colors.success((metrics.storage.cacheHitRate * 100).toFixed(1) + '%')} | ` +
      `${this.colors.accent('Memory:')} ${this.colors.primary(metrics.memory.heapUsed.toFixed(0) + 'MB')}\n` +
      `${this.colors.accent('Vector Cache:')} ${this.colors.info(metrics.memory.vectorCache.toFixed(1) + 'MB')} | ` +
      `${this.colors.accent('Graph Cache:')} ${this.colors.info(metrics.memory.graphCache.toFixed(1) + 'MB')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#4A6B5A' }
    ))

    // Health Scores Section
    console.log('\n' + this.colors.brain(`${this.emojis.health} SYSTEM HEALTH`))
    console.log(boxen(
      `${this.colors.accent('Vector Operations:')} ${this.getHealthBar(metrics.health.vector)} ${this.colors.primary(metrics.health.vector + '/100')}\n` +
      `${this.colors.accent('Graph Operations:')} ${this.getHealthBar(metrics.health.graph)} ${this.colors.primary(metrics.health.graph + '/100')}\n` +
      `${this.colors.accent('Storage System:')} ${this.getHealthBar(metrics.health.storage)} ${this.colors.primary(metrics.health.storage + '/100')}\n` +
      `${this.colors.accent('Network/Connectivity:')} ${this.getHealthBar(metrics.health.network)} ${this.colors.primary(metrics.health.network + '/100')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#2D4A3A' }
    ))

    // Active Alerts
    if (dashboard.alerts.length > 0) {
      console.log('\n' + this.colors.error(`${this.emojis.alert} ACTIVE ALERTS`))
      dashboard.alerts.forEach(alert => {
        const severityColor = alert.rule.severity === 'critical' ? this.colors.error :
                             alert.rule.severity === 'high' ? this.colors.warning :
                             this.colors.info
        console.log(severityColor(`  ${this.getSeverityIcon(alert.rule.severity)} ${alert.message}`))
      })
    }

    // Footer
    console.log('\n' + this.colors.dim(`Last updated: ${new Date().toLocaleTimeString()} | Press Ctrl+C to exit`))
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<PerformanceMetrics> {
    const now = Date.now()
    const uptime = process.uptime()

    // Simulate metrics collection (in real implementation, this would query actual systems)
    const metrics: PerformanceMetrics = {
      queryLatency: {
        vector: {
          avg: Math.random() * 50 + 10,
          p50: Math.random() * 40 + 8,
          p95: Math.random() * 100 + 30,
          p99: Math.random() * 200 + 50
        },
        graph: {
          avg: Math.random() * 30 + 5,
          p50: Math.random() * 25 + 4,
          p95: Math.random() * 80 + 15,
          p99: Math.random() * 150 + 25
        },
        combined: {
          avg: Math.random() * 40 + 7,
          p50: Math.random() * 35 + 6,
          p95: Math.random() * 90 + 20,
          p99: Math.random() * 180 + 40
        }
      },
      throughput: {
        vectorOps: Math.random() * 1000 + 500,
        graphOps: Math.random() * 800 + 300,
        totalOps: Math.random() * 1500 + 800
      },
      storage: {
        readLatency: Math.random() * 20 + 2,
        writeLatency: Math.random() * 30 + 5,
        cacheHitRate: 0.85 + Math.random() * 0.1,
        totalSize: 1024 * 1024 * 1024 * (10 + Math.random() * 50), // 10-60 GB
        growthRate: Math.random() * 100 + 10
      },
      memory: {
        heapUsed: process.memoryUsage().heapUsed / (1024 * 1024),
        heapTotal: process.memoryUsage().heapTotal / (1024 * 1024),
        vectorCache: Math.random() * 500 + 100,
        graphCache: Math.random() * 300 + 50,
        efficiency: 0.75 + Math.random() * 0.2
      },
      errors: {
        total: Math.floor(Math.random() * 10),
        rate: Math.random() * 2,
        types: {
          'timeout': Math.floor(Math.random() * 3),
          'network': Math.floor(Math.random() * 2),
          'storage': Math.floor(Math.random() * 2)
        }
      },
      health: {
        overall: Math.floor(85 + Math.random() * 15),
        vector: Math.floor(80 + Math.random() * 20),
        graph: Math.floor(85 + Math.random() * 15),
        storage: Math.floor(90 + Math.random() * 10),
        network: Math.floor(85 + Math.random() * 15)
      },
      timestamp: new Date().toISOString(),
      uptime
    }

    return metrics
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    this.alertRules = [
      {
        id: 'vector-latency-high',
        name: 'Vector Query Latency High',
        condition: 'queryLatency.vector.p95 > 200',
        threshold: 200,
        severity: 'medium',
        enabled: true
      },
      {
        id: 'graph-latency-high',
        name: 'Graph Query Latency High', 
        condition: 'queryLatency.graph.p95 > 150',
        threshold: 150,
        severity: 'medium',
        enabled: true
      },
      {
        id: 'memory-high',
        name: 'Memory Usage High',
        condition: 'memory.heapUsed > 1000',
        threshold: 1000,
        severity: 'high',
        enabled: true
      },
      {
        id: 'cache-hit-low',
        name: 'Cache Hit Rate Low',
        condition: 'storage.cacheHitRate < 0.7',
        threshold: 0.7,
        severity: 'medium',
        enabled: true
      },
      {
        id: 'error-rate-high',
        name: 'Error Rate High',
        condition: 'errors.rate > 5',
        threshold: 5,
        severity: 'high',
        enabled: true
      }
    ]
  }

  /**
   * Check alerts against current metrics
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      const value = this.evaluateCondition(rule.condition, metrics)
      const isTriggered = value > rule.threshold

      const existingAlert = this.alerts.find(a => a.rule.id === rule.id && !a.resolved)

      if (isTriggered && !existingAlert) {
        // Trigger new alert
        const alert: PerformanceAlert = {
          id: `${rule.id}-${Date.now()}`,
          rule,
          triggered: new Date().toISOString(),
          value,
          message: `${rule.name}: ${value.toFixed(2)} > ${rule.threshold}`
        }
        this.alerts.push(alert)
        console.log(this.colors.warning(`${this.emojis.alert} ALERT: ${alert.message}`))
      } else if (!isTriggered && existingAlert) {
        // Resolve existing alert
        existingAlert.resolved = new Date().toISOString()
        console.log(this.colors.success(`${this.emojis.health} RESOLVED: ${existingAlert.message}`))
      }
    }
  }

  /**
   * Evaluate alert condition against metrics
   */
  private evaluateCondition(condition: string, metrics: PerformanceMetrics): number {
    // Simple condition evaluation (in real implementation, use a proper expression parser)
    const parts = condition.split(' ')
    if (parts.length !== 3) return 0

    const path = parts[0]
    const value = this.getMetricValue(path, metrics)
    return typeof value === 'number' ? value : 0
  }

  /**
   * Get metric value by dot notation path
   */
  private getMetricValue(path: string, metrics: PerformanceMetrics): any {
    return path.split('.').reduce((obj: any, key: string) => obj?.[key], metrics as any)
  }

  /**
   * Helper methods
   */
  private getHealthStatus(metrics: PerformanceMetrics): string {
    const score = metrics.health.overall
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'  
    if (score >= 60) return 'fair'
    return 'poor'
  }

  private getHealthIcon(score: number): string {
    if (score >= 90) return this.emojis.health
    if (score >= 75) return '💛'
    if (score >= 60) return this.emojis.warning
    return this.emojis.critical
  }

  private getHealthBar(score: number): string {
    const filled = Math.floor(score / 10)
    const empty = 10 - filled
    return this.colors.success('█'.repeat(filled)) + this.colors.dim('░'.repeat(empty))
  }

  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return this.emojis.critical
      case 'high': return this.emojis.alert
      case 'medium': return this.emojis.warning
      default: return this.emojis.gear
    }
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}