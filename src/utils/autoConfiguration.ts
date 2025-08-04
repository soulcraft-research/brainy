/**
 * Automatic Configuration System for Brainy Vector Database
 * Detects environment, resources, and data patterns to provide optimal settings
 */

import { isBrowser, isNode, isThreadingAvailable } from './environment.js'

export interface AutoConfigResult {
  // Environment details
  environment: 'browser' | 'nodejs' | 'serverless' | 'unknown'
  
  // Resource detection
  availableMemory: number // bytes
  cpuCores: number
  threadingAvailable: boolean
  
  // Storage capabilities
  persistentStorageAvailable: boolean
  s3StorageDetected: boolean
  
  // Recommended configuration
  recommendedConfig: {
    expectedDatasetSize: number
    maxMemoryUsage: number
    targetSearchLatency: number
    enablePartitioning: boolean
    enableCompression: boolean
    enableDistributedSearch: boolean
    enablePredictiveCaching: boolean
    partitionStrategy: 'semantic' | 'hash'
    maxNodesPerPartition: number
    semanticClusters: number
  }
  
  // Performance optimization flags
  optimizationFlags: {
    useMemoryMapping: boolean
    aggressiveCaching: boolean
    backgroundOptimization: boolean
    compressionLevel: 'none' | 'light' | 'aggressive'
  }
}

export interface DatasetAnalysis {
  estimatedSize: number
  vectorDimension?: number
  growthRate?: number // vectors per second
  accessPatterns?: 'read-heavy' | 'write-heavy' | 'balanced'
}

/**
 * Automatic configuration system that detects environment and optimizes settings
 */
export class AutoConfiguration {
  private static instance: AutoConfiguration
  private cachedConfig: AutoConfigResult | null = null
  private datasetStats: DatasetAnalysis = { estimatedSize: 0 }
  
  private constructor() {}
  
  public static getInstance(): AutoConfiguration {
    if (!AutoConfiguration.instance) {
      AutoConfiguration.instance = new AutoConfiguration()
    }
    return AutoConfiguration.instance
  }
  
  /**
   * Detect environment and generate optimal configuration
   */
  public async detectAndConfigure(hints?: {
    expectedDataSize?: number
    s3Available?: boolean
    memoryBudget?: number
  }): Promise<AutoConfigResult> {
    if (this.cachedConfig && !hints) {
      return this.cachedConfig
    }
    
    const environment = this.detectEnvironment()
    const resources = await this.detectResources()
    const storage = await this.detectStorageCapabilities(hints?.s3Available)
    
    const config: AutoConfigResult = {
      environment,
      ...resources,
      ...storage,
      recommendedConfig: this.generateRecommendedConfig(environment, resources, hints),
      optimizationFlags: this.generateOptimizationFlags(environment, resources)
    }
    
    this.cachedConfig = config
    return config
  }
  
  /**
   * Update configuration based on runtime dataset analysis
   */
  public async adaptToDataset(analysis: DatasetAnalysis): Promise<AutoConfigResult> {
    this.datasetStats = analysis
    
    // Regenerate configuration with dataset insights
    const currentConfig = await this.detectAndConfigure()
    const adaptedConfig = this.adaptConfigurationToData(currentConfig, analysis)
    
    this.cachedConfig = adaptedConfig
    return adaptedConfig
  }
  
  /**
   * Learn from performance metrics and adjust configuration
   */
  public async learnFromPerformance(metrics: {
    averageSearchTime: number
    memoryUsage: number
    cacheHitRate: number
    errorRate: number
  }): Promise<Partial<AutoConfigResult['recommendedConfig']>> {
    const adjustments: Partial<AutoConfigResult['recommendedConfig']> = {}
    
    // Learn from search performance
    if (metrics.averageSearchTime > 200) {
      // Too slow - optimize for speed
      adjustments.enableDistributedSearch = true
      adjustments.maxNodesPerPartition = Math.max(10000, (this.cachedConfig?.recommendedConfig.maxNodesPerPartition || 50000) * 0.8)
    } else if (metrics.averageSearchTime < 50) {
      // Very fast - can optimize for quality
      adjustments.maxNodesPerPartition = Math.min(100000, (this.cachedConfig?.recommendedConfig.maxNodesPerPartition || 50000) * 1.2)
    }
    
    // Learn from memory usage
    if (metrics.memoryUsage > (this.cachedConfig?.recommendedConfig.maxMemoryUsage || 0) * 0.9) {
      // High memory usage - enable compression
      adjustments.enableCompression = true
    }
    
    // Learn from cache performance
    if (metrics.cacheHitRate < 0.7) {
      // Poor cache performance - enable predictive caching
      adjustments.enablePredictiveCaching = true
    }
    
    // Update cached config with learned adjustments
    if (this.cachedConfig) {
      this.cachedConfig.recommendedConfig = {
        ...this.cachedConfig.recommendedConfig,
        ...adjustments
      }
    }
    
    return adjustments
  }
  
  /**
   * Get minimal configuration for quick setup
   */
  public async getQuickSetupConfig(scenario: 'small' | 'medium' | 'large' | 'enterprise'): Promise<{
    expectedDatasetSize: number
    maxMemoryUsage: number
    targetSearchLatency: number
    s3Required: boolean
  }> {
    const environment = this.detectEnvironment()
    const resources = await this.detectResources()
    
    switch (scenario) {
      case 'small':
        return {
          expectedDatasetSize: 10000,
          maxMemoryUsage: Math.min(resources.availableMemory * 0.3, 1024 * 1024 * 1024), // 1GB max
          targetSearchLatency: 100,
          s3Required: false
        }
        
      case 'medium':
        return {
          expectedDatasetSize: 100000,
          maxMemoryUsage: Math.min(resources.availableMemory * 0.5, 4 * 1024 * 1024 * 1024), // 4GB max
          targetSearchLatency: 150,
          s3Required: environment === 'serverless'
        }
        
      case 'large':
        return {
          expectedDatasetSize: 1000000,
          maxMemoryUsage: Math.min(resources.availableMemory * 0.7, 8 * 1024 * 1024 * 1024), // 8GB max
          targetSearchLatency: 200,
          s3Required: true
        }
        
      case 'enterprise':
        return {
          expectedDatasetSize: 10000000,
          maxMemoryUsage: Math.min(resources.availableMemory * 0.8, 32 * 1024 * 1024 * 1024), // 32GB max
          targetSearchLatency: 300,
          s3Required: true
        }
    }
  }
  
  /**
   * Detect the current runtime environment
   */
  private detectEnvironment(): 'browser' | 'nodejs' | 'serverless' | 'unknown' {
    if (isBrowser()) {
      return 'browser'
    }
    
    if (isNode()) {
      // Check for serverless environment indicators
      if (process.env.AWS_LAMBDA_FUNCTION_NAME || 
          process.env.VERCEL || 
          process.env.NETLIFY ||
          process.env.CLOUDFLARE_WORKERS) {
        return 'serverless'
      }
      return 'nodejs'
    }
    
    return 'unknown'
  }
  
  /**
   * Detect available system resources
   */
  private async detectResources(): Promise<{
    availableMemory: number
    cpuCores: number
    threadingAvailable: boolean
  }> {
    let availableMemory = 2 * 1024 * 1024 * 1024 // Default 2GB
    let cpuCores = 4 // Default 4 cores
    
    // Browser memory detection
    if (isBrowser()) {
      // @ts-ignore - navigator.deviceMemory is experimental
      if (navigator.deviceMemory) {
        // @ts-ignore
        availableMemory = navigator.deviceMemory * 1024 * 1024 * 1024 * 0.3 // Use 30% of device memory
      } else {
        availableMemory = 512 * 1024 * 1024 // Conservative 512MB for browsers
      }
      
      cpuCores = navigator.hardwareConcurrency || 4
    }
    
    // Node.js memory detection
    if (isNode()) {
      try {
        const os = await import('os')
        availableMemory = os.totalmem() * 0.7 // Use 70% of total memory
        cpuCores = os.cpus().length
      } catch (error) {
        // Fallback to defaults
      }
    }
    
    return {
      availableMemory,
      cpuCores,
      threadingAvailable: isThreadingAvailable()
    }
  }
  
  /**
   * Detect available storage capabilities
   */
  private async detectStorageCapabilities(s3Hint?: boolean): Promise<{
    persistentStorageAvailable: boolean
    s3StorageDetected: boolean
  }> {
    let persistentStorageAvailable = false
    let s3StorageDetected = s3Hint || false
    
    if (isBrowser()) {
      // Check for OPFS support
      persistentStorageAvailable = 'navigator' in globalThis && 
                                  'storage' in navigator && 
                                  'getDirectory' in navigator.storage
    }
    
    if (isNode()) {
      persistentStorageAvailable = true // Always available in Node.js
      
      // Check for AWS SDK or S3 environment variables
      s3StorageDetected = s3Hint || 
                         !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
                         !!(process.env.S3_BUCKET_NAME)
    }
    
    return {
      persistentStorageAvailable,
      s3StorageDetected
    }
  }
  
  /**
   * Generate recommended configuration based on detected environment and resources
   */
  private generateRecommendedConfig(
    environment: string, 
    resources: { availableMemory: number; cpuCores: number }, 
    hints?: { expectedDataSize?: number; memoryBudget?: number }
  ): AutoConfigResult['recommendedConfig'] {
    const datasetSize = hints?.expectedDataSize || this.estimateDatasetSize()
    const memoryBudget = hints?.memoryBudget || Math.floor(resources.availableMemory * 0.6)
    
    // Base configuration
    let config = {
      expectedDatasetSize: datasetSize,
      maxMemoryUsage: memoryBudget,
      targetSearchLatency: 150,
      enablePartitioning: datasetSize > 25000,
      enableCompression: environment === 'browser' || memoryBudget < 2 * 1024 * 1024 * 1024,
      enableDistributedSearch: resources.cpuCores > 2 && datasetSize > 50000,
      enablePredictiveCaching: true,
      partitionStrategy: 'semantic' as const,
      maxNodesPerPartition: 50000,
      semanticClusters: 8
    }
    
    // Environment-specific adjustments
    switch (environment) {
      case 'browser':
        config = {
          ...config,
          maxMemoryUsage: Math.min(memoryBudget, 1024 * 1024 * 1024), // Cap at 1GB
          targetSearchLatency: 200, // More lenient for browsers
          enableCompression: true, // Always enable for browsers
          maxNodesPerPartition: 25000, // Smaller partitions
          semanticClusters: 4 // Fewer clusters to save memory
        }
        break
        
      case 'serverless':
        config = {
          ...config,
          targetSearchLatency: 500, // Account for cold starts
          enablePredictiveCaching: false, // Avoid background processes
          maxNodesPerPartition: 30000 // Moderate partition size
        }
        break
        
      case 'nodejs':
        config = {
          ...config,
          targetSearchLatency: 100, // Aggressive for Node.js
          maxNodesPerPartition: Math.min(100000, Math.floor(datasetSize / 10)), // Larger partitions
          semanticClusters: Math.min(16, Math.max(4, Math.floor(datasetSize / 50000))) // Scale clusters with data
        }
        break
    }
    
    // Dataset size adjustments
    if (datasetSize > 1000000) {
      config.semanticClusters = Math.min(32, Math.floor(datasetSize / 100000))
      config.maxNodesPerPartition = 100000
    } else if (datasetSize < 10000) {
      config.enablePartitioning = false
      config.enableDistributedSearch = false
      config.partitionStrategy = 'semantic' // Keep semantic but disable partitioning
    }
    
    return config
  }
  
  /**
   * Generate optimization flags based on environment and resources
   */
  private generateOptimizationFlags(
    environment: string, 
    resources: { availableMemory: number; cpuCores: number }
  ): AutoConfigResult['optimizationFlags'] {
    return {
      useMemoryMapping: environment === 'nodejs' && resources.availableMemory > 4 * 1024 * 1024 * 1024,
      aggressiveCaching: resources.availableMemory > 2 * 1024 * 1024 * 1024,
      backgroundOptimization: environment !== 'serverless' && resources.cpuCores > 2,
      compressionLevel: resources.availableMemory < 1024 * 1024 * 1024 ? 'aggressive' : 
                       resources.availableMemory < 4 * 1024 * 1024 * 1024 ? 'light' : 'none'
    }
  }
  
  /**
   * Adapt configuration based on actual dataset analysis
   */
  private adaptConfigurationToData(
    baseConfig: AutoConfigResult, 
    analysis: DatasetAnalysis
  ): AutoConfigResult {
    const updatedConfig = { ...baseConfig }
    
    // Adjust based on actual dataset size
    if (analysis.estimatedSize !== baseConfig.recommendedConfig.expectedDatasetSize) {
      const sizeRatio = analysis.estimatedSize / baseConfig.recommendedConfig.expectedDatasetSize
      
      updatedConfig.recommendedConfig.expectedDatasetSize = analysis.estimatedSize
      
      // Scale partition size with dataset
      if (sizeRatio > 2) {
        updatedConfig.recommendedConfig.maxNodesPerPartition = Math.min(
          100000, 
          Math.floor(updatedConfig.recommendedConfig.maxNodesPerPartition * 1.5)
        )
        updatedConfig.recommendedConfig.semanticClusters = Math.min(
          32, 
          Math.floor(updatedConfig.recommendedConfig.semanticClusters * 1.5)
        )
      }
    }
    
    // Adjust based on vector dimension
    if (analysis.vectorDimension) {
      if (analysis.vectorDimension > 1024) {
        // High-dimensional vectors - optimize for compression
        updatedConfig.recommendedConfig.enableCompression = true
        updatedConfig.optimizationFlags.compressionLevel = 'aggressive'
      }
    }
    
    // Adjust based on access patterns
    if (analysis.accessPatterns === 'read-heavy') {
      updatedConfig.recommendedConfig.enablePredictiveCaching = true
      updatedConfig.optimizationFlags.aggressiveCaching = true
    } else if (analysis.accessPatterns === 'write-heavy') {
      updatedConfig.recommendedConfig.enablePredictiveCaching = false
      updatedConfig.optimizationFlags.backgroundOptimization = false
    }
    
    return updatedConfig
  }
  
  /**
   * Estimate dataset size if not provided
   */
  private estimateDatasetSize(): number {
    // Start with conservative estimate
    const environment = this.detectEnvironment()
    
    switch (environment) {
      case 'browser': return 10000
      case 'serverless': return 50000
      case 'nodejs': return 100000
      default: return 25000
    }
  }
  
  /**
   * Reset cached configuration (for testing or manual refresh)
   */
  public resetCache(): void {
    this.cachedConfig = null
    this.datasetStats = { estimatedSize: 0 }
  }
}

/**
 * Convenience function for quick auto-configuration
 */
export async function autoConfigureBrainy(hints?: {
  expectedDataSize?: number
  s3Available?: boolean
  memoryBudget?: number
}): Promise<AutoConfigResult> {
  const autoConfig = AutoConfiguration.getInstance()
  return autoConfig.detectAndConfigure(hints)
}

/**
 * Get quick setup configuration for common scenarios
 */
export async function getQuickSetup(scenario: 'small' | 'medium' | 'large' | 'enterprise') {
  const autoConfig = AutoConfiguration.getInstance()
  return autoConfig.getQuickSetupConfig(scenario)
}